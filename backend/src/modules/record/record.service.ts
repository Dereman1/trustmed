import type { User } from "@supabase/supabase-js";
import { AppError } from "../../core/errors/app-error.js";
import { supabaseService } from "../../config/supabase.js";
import { SupabaseRepository } from "../../core/supabase/repository.js";
import { accessService } from "../access/access.service.js";
import { patientService } from "../patient/patient.service.js";
import { providerService } from "../provider/provider.service.js";
import type {
  MedicalRecord,
  CreateRecordBody,
  UploadRecordFileInput,
} from "../../types/record.types.js";

const recordRepository = new SupabaseRepository<MedicalRecord>("medical_records");
const recordsBucket = process.env.SUPABASE_RECORDS_BUCKET ?? "records";

function getFileExtension(mimetype: string): string {
  if (mimetype === "application/pdf") return "pdf";
  if (mimetype === "image/png") return "png";
  if (mimetype === "image/jpeg" || mimetype === "image/jpg") return "jpg";
  throw new AppError("Unsupported record file type", 400, mimetype);
}

export const recordService = {
  async listMyRecords(user: User): Promise<MedicalRecord[]> {
    const patient = await patientService.getMyProfile(user);
    return recordRepository.listWhere({
      where: { patient_id: patient.id },
      orderBy: "uploaded_at",
      ascending: false,
      limit: 200,
    });
  },

  async getById(recordId: string): Promise<MedicalRecord> {
    const record = await recordRepository.findById(recordId);
    if (!record) {
      throw new AppError("Medical record not found", 404);
    }
    return record;
  },

  async getByIdAndPatient(recordId: string, user: User): Promise<MedicalRecord> {
    const patient = await patientService.getMyProfile(user);
    const record = await this.getById(recordId);
    if (record.patient_id !== patient.id) {
      throw new AppError("Forbidden: not your record", 403);
    }
    return record;
  },

  async getByIdForProvider(recordId: string, user: User): Promise<MedicalRecord> {
    const provider = await providerService.getMyProfile(user);
    const record = await this.getById(recordId);
    const canAccess = await accessService.canProviderAccessRecord(
      provider.id,
      record.id,
      record.patient_id,
    );
    if (!canAccess) {
      throw new AppError("Forbidden: you do not have access to this record", 403);
    }
    return record;
  },

  /** List records for a patient; provider must have granted access. */
  async listByPatientForProvider(
    user: User,
    patientId: string,
  ): Promise<MedicalRecord[]> {
    const provider = await providerService.getMyProfile(user);
    const canAccess = await accessService.canProviderAccessRecord(
      provider.id,
      "any",
      patientId,
    );
    if (!canAccess) {
      throw new AppError(
        "Forbidden: you do not have access to this patient's records",
        403,
      );
    }
    return recordRepository.listWhere({
      where: { patient_id: patientId },
      orderBy: "uploaded_at",
      ascending: false,
      limit: 200,
    });
  },

  async upload(
    user: User,
    payload: CreateRecordBody,
    file: UploadRecordFileInput,
  ): Promise<MedicalRecord> {
    const patient = await patientService.getMyProfile(user);
    const ext = getFileExtension(file.mimetype);
    const path = `${patient.id}/${Date.now()}-${Math.random().toString(36).slice(2, 10)}.${ext}`;

    const { error: uploadError } = await supabaseService.storage
      .from(recordsBucket)
      .upload(path, file.buffer, {
        contentType: file.mimetype,
        upsert: false,
      });

    if (uploadError) {
      throw new AppError(
        "Failed to upload medical record",
        500,
        uploadError.message,
      );
    }

    const { data: urlData } = supabaseService.storage
      .from(recordsBucket)
      .getPublicUrl(path);

    const record = await recordRepository.create({
      patient_id: patient.id,
      record_type: payload.record_type,
      file_url: urlData.publicUrl,
      description: payload.description ?? null,
      uploaded_at: new Date().toISOString(),
    });
    const { auditLog } = await import("../../core/audit.js");
    await auditLog({
      user_id: user.id,
      action_type: "record_uploaded",
      record_id: record.id,
      metadata: { record_type: payload.record_type },
    });
    return record;
  },
};
