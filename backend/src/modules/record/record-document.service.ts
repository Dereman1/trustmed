import type { User } from "@supabase/supabase-js";
import { AppError } from "../../core/errors/app-error.js";
import { supabaseService } from "../../config/supabase.js";
import { SupabaseRepository } from "../../core/supabase/repository.js";
import { accessService } from "../access/access.service.js";
import { recordService } from "./record.service.js";
import { providerService } from "../provider/provider.service.js";
import type { RecordDocument } from "../../types/record-document.types.js";
import { createNotification } from "../../core/notifications.js";
import { auditLog } from "../../core/audit.js";
import { NOTIFICATION_TYPES } from "../../types/notification.types.js";

const recordDocumentsBucket = process.env.SUPABASE_RECORDS_BUCKET ?? "records";
const recordDocRepo = new SupabaseRepository<RecordDocument>("record_documents");

function getFileExtension(mimetype: string): string {
  if (mimetype === "application/pdf") return "pdf";
  if (mimetype === "image/png") return "png";
  if (mimetype === "image/jpeg" || mimetype === "image/jpg") return "jpg";
  throw new AppError("Unsupported file type (use PDF, PNG, JPEG)", 400, mimetype);
}

export const recordDocumentService = {
  async upload(
    user: User,
    recordId: string,
    file: { buffer: Buffer; mimetype: string },
    description?: string,
  ): Promise<RecordDocument> {
    const provider = await providerService.getMyProfile(user);
    const record = await recordService.getById(recordId);

    const canAccess = await accessService.canProviderAccessRecord(
      provider.id,
      record.id,
      record.patient_id,
    );
    if (!canAccess) {
      throw new AppError("Forbidden: you do not have access to this record", 403);
    }

    const ext = getFileExtension(file.mimetype);
    const path = `${record.patient_id}/doc-${recordId}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

    const { error: uploadError } = await supabaseService.storage
      .from(recordDocumentsBucket)
      .upload(path, file.buffer, {
        contentType: file.mimetype,
        upsert: false,
      });

    if (uploadError) {
      throw new AppError("Failed to upload document", 500, uploadError.message);
    }

    const { data: urlData } = supabaseService.storage
      .from(recordDocumentsBucket)
      .getPublicUrl(path);

    const doc = await recordDocRepo.create({
      record_id: recordId,
      provider_id: provider.id,
      file_url: urlData.publicUrl,
      description: description ?? null,
    });

    const { data: patient } = await supabaseService
      .from("patients")
      .select("user_id")
      .eq("id", record.patient_id)
      .single();
    if (patient?.user_id) {
      await createNotification({
        user_id: patient.user_id,
        type: NOTIFICATION_TYPES.DOCUMENT_ADDED,
        title: "New document added",
        body: "A provider has added a document to your medical record.",
        metadata: { record_id: recordId, document_id: doc.id },
      });
    }
    await auditLog({
      user_id: user.id,
      action_type: "record_document_uploaded",
      record_id: recordId,
      metadata: { document_id: doc.id },
    });
    return doc;
  },

  async listByRecordId(recordId: string): Promise<RecordDocument[]> {
    return recordDocRepo.listWhere({
      where: { record_id: recordId },
      orderBy: "created_at",
      ascending: false,
      limit: 100,
    });
  },
};
