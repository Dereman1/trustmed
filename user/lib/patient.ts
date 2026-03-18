export type ProviderListItem = {
  id: string;
  user_id: string;
  facility_id: string | null;
  specialization: string | null;
  license_number: string | null;
  status: "pending" | "approved";
};

/** List all approved providers for patients to message/select. */
export async function listApprovedProviders(): Promise<ProviderListItem[]> {
  const res = await api.get<ApiSuccessResponse<ProviderListItem[]>>(
    "/patients/providers",
  );
  return res.data.data;
}

import { api, type ApiSuccessResponse } from "./api";

export type PatientProfile = {
  id: string;
  user_id: string;
  date_of_birth: string | null;
  gender: string | null;
  created_at?: string;
  updated_at?: string;
  user_details?: {
    fullName: string | null;
    email: string | null;
  } | null;
};

export type CreatePatientBody = {
  date_of_birth?: string;
  gender?: string;
};

export type UpdatePatientBody = {
  date_of_birth?: string;
  gender?: string;
};

export async function getMyPatientProfile(): Promise<PatientProfile> {
  const res = await api.get<ApiSuccessResponse<PatientProfile>>("/patients/me");
  return res.data.data;
}

export async function createPatientProfile(
  payload: CreatePatientBody,
): Promise<PatientProfile> {
  const res = await api.post<ApiSuccessResponse<PatientProfile>>(
    "/patients/me",
    payload,
  );
  return res.data.data;
}

export async function updatePatientProfile(
  payload: UpdatePatientBody,
): Promise<PatientProfile> {
  const res = await api.patch<ApiSuccessResponse<PatientProfile>>(
    "/patients/me",
    payload,
  );
  return res.data.data;
}

export async function listAllPatients(): Promise<PatientProfile[]> {
  const res = await api.get<ApiSuccessResponse<PatientProfile[]>>(
    "/patients/list-all"
  );
  return res.data.data;
}
