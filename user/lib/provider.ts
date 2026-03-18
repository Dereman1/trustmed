import { api, type ApiSuccessResponse } from "./api";

export type ProviderProfile = {
  id: string;
  user_id: string;
  facility_id: string | null;
  specialization: string | null;
  license_number: string | null;
  verification_docs: string[] | null;
  status: "pending" | "approved";
  created_at?: string;
  updated_at?: string;
};

export type UpdateProviderBody = {
  facility_id?: string | null;
  specialization?: string;
  license_number?: string;
};

export type ProviderStats = {
  total_records: number;
  total_messages: number;
  total_notes: number;
  total_patients: number;
};

export async function getMyProviderProfile(): Promise<ProviderProfile> {
  const res = await api.get<ApiSuccessResponse<ProviderProfile>>(
    "/providers/me"
  );
  return res.data.data;
}

export async function updateProviderProfile(
  payload: UpdateProviderBody
): Promise<ProviderProfile> {
  const res = await api.patch<ApiSuccessResponse<ProviderProfile>>(
    "/providers/me",
    payload
  );
  return res.data.data;
}

export async function getProviderStats(): Promise<ProviderStats> {
  const res = await api.get<ApiSuccessResponse<ProviderStats>>(
    "/providers/stats/dashboard"
  );
  return res.data.data;
}
