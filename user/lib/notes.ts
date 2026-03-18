import { api, type ApiSuccessResponse } from "./api";

export type ConsultationNote = {
  id: string;
  record_id: string;
  provider_id: string;
  note_text: string;
  created_at: string;
  updated_at?: string;
};

export async function addNote(
  recordId: string,
  noteText: string
): Promise<ConsultationNote> {
  const res = await api.post<ApiSuccessResponse<ConsultationNote>>(
    "/notes/add",
    { record_id: recordId, note_text: noteText }
  );
  return res.data.data;
}

export async function getNotesByRecordId(
  recordId: string
): Promise<ConsultationNote[]> {
  const res = await api.get<ApiSuccessResponse<ConsultationNote[]>>(
    `/notes/record/${recordId}`
  );
  return res.data.data;
}
