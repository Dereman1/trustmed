import type { User } from "@supabase/supabase-js";
import { AppError } from "../../core/errors/app-error.js";
import { supabaseService } from "../../config/supabase.js";
import { SupabaseRepository } from "../../core/supabase/repository.js";
import { accessService } from "../access/access.service.js";
import { recordService } from "../record/record.service.js";
import { providerService } from "../provider/provider.service.js";
import { auditLog } from "../../core/audit.js";
import { createNotification } from "../../core/notifications.js";
import type { ConsultationNote, CreateNoteBody } from "../../types/note.types.js";
import { NOTIFICATION_TYPES } from "../../types/notification.types.js";

const noteRepository = new SupabaseRepository<ConsultationNote>(
  "consultation_notes",
);

export const noteService = {
  async add(user: User, payload: CreateNoteBody): Promise<ConsultationNote> {
    const provider = await providerService.getMyProfile(user);
    const record = await recordService.getById(payload.record_id);

    const canAccess = await accessService.canProviderAccessRecord(
      provider.id,
      record.id,
      record.patient_id,
    );
    if (!canAccess) {
      throw new AppError(
        "Forbidden: you do not have access to this record",
        403,
      );
    }

    const note = await noteRepository.create({
      record_id: payload.record_id,
      provider_id: provider.id,
      note_text: payload.note_text,
    });
    const { data: patient } = await supabaseService
      .from("patients")
      .select("user_id")
      .eq("id", record.patient_id)
      .single();
    if (patient?.user_id) {
      await createNotification({
        user_id: patient.user_id,
        type: NOTIFICATION_TYPES.CONSULTATION_NOTE_ADDED,
        title: "New consultation note",
        body: "A provider has added a note to your medical record.",
        metadata: { record_id: record.id, note_id: note.id },
      });
    }
    await auditLog({
      user_id: user.id,
      action_type: "consultation_note_added",
      record_id: record.id,
      metadata: { note_id: note.id },
    });
    return note;
  },

  async getByRecordId(
    user: User,
    recordId: string,
  ): Promise<ConsultationNote[]> {
    const record = await recordService.getById(recordId);
    const provider = await providerService.getMyProfile(user);

    const canAccess = await accessService.canProviderAccessRecord(
      provider.id,
      record.id,
      record.patient_id,
    );
    if (!canAccess) {
      throw new AppError(
        "Forbidden: you do not have access to this record",
        403,
      );
    }

    return noteRepository.listWhere({
      where: { record_id: recordId },
      orderBy: "created_at",
      ascending: true,
      limit: 200,
    });
  },

  async getByRecordIdForPatient(
    user: User,
    recordId: string,
  ): Promise<ConsultationNote[]> {
    const record = await recordService.getByIdAndPatient(recordId, user);
    return noteRepository.listWhere({
      where: { record_id: record.id },
      orderBy: "created_at",
      ascending: true,
      limit: 200,
    });
  },
};
