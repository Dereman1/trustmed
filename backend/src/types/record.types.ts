export type MedicalRecord = {
  id: string;
  patient_id: string;
  record_type: string;
  file_url: string;
  description: string | null;
  uploaded_at: string;
  created_at?: string;
  updated_at?: string;
};

export type CreateRecordBody = {
  record_type: string;
  description?: string;
};

export type UploadRecordFileInput = {
  buffer: Buffer;
  mimetype: string;
};

export const ALLOWED_RECORD_MIME_TYPES = [
  "application/pdf",
  "image/jpeg",
  "image/jpg",
  "image/png",
] as const;

export const MAX_RECORD_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB
