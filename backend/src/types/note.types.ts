export type ConsultationNote = {
  id: string;
  record_id: string;
  provider_id: string;
  note_text: string;
  created_at: string;
  updated_at?: string;
};

export type CreateNoteBody = {
  record_id: string;
  note_text: string;
};
