import { api, type ApiSuccessResponse } from "./api";

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

export type RecordDocument = {
  id: string;
  record_id: string;
  provider_id: string;
  file_url: string;
  description: string | null;
  created_at: string;
};

export type CreateRecordBody = {
  record_type: string;
  description?: string;
};

export async function listMyRecords(): Promise<MedicalRecord[]> {
  const res = await api.get<ApiSuccessResponse<MedicalRecord[]>>("/records");
  return res.data.data;
}

export async function listRecordsForPatient(
  patientId: string
): Promise<MedicalRecord[]> {
  const res = await api.get<ApiSuccessResponse<MedicalRecord[]>>(
    `/records/for-patient/${patientId}`
  );
  return res.data.data;
}

export async function getRecord(id: string): Promise<MedicalRecord> {
  const res = await api.get<ApiSuccessResponse<MedicalRecord>>(
    `/records/${id}`
  );
  return res.data.data;
}

export async function uploadRecord(
  file: File,
  body: CreateRecordBody
): Promise<MedicalRecord> {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("record_type", body.record_type);
  if (body.description) formData.append("description", body.description);
  const res = await api.post<ApiSuccessResponse<MedicalRecord>>(
    "/records/upload",
    formData,
    { headers: { "Content-Type": "multipart/form-data" } }
  );
  return res.data.data;
}

export async function listRecordDocuments(
  recordId: string
): Promise<RecordDocument[]> {
  const res = await api.get<ApiSuccessResponse<RecordDocument[]>>(
    `/records/${recordId}/documents`
  );
  return res.data.data;
}

export async function uploadRecordDocument(
  recordId: string,
  file: File,
  description?: string
): Promise<RecordDocument> {
  const formData = new FormData();
  formData.append("file", file);
  if (description) formData.append("description", description);
  const res = await api.post<ApiSuccessResponse<RecordDocument>>(
    `/records/${recordId}/documents`,
    formData,
    { headers: { "Content-Type": "multipart/form-data" } }
  );
  return res.data.data;
}
