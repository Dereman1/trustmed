/** Get recent activity logs for a facility */
export async function getFacilityActivity(facilityId: string): Promise<any[]> {
  const res = await api.get<ApiSuccessResponse<any[]>>(
    `/facilities/${facilityId}/activity`,
  );
  return res.data.data;
}

/** Get count of pending providers for a facility */
export async function getPendingProvidersCount(
  facilityId: string,
): Promise<number> {
  const res = await api.get<ApiSuccessResponse<{ count: number }>>(
    `/facilities/${facilityId}/pending-providers-count`,
  );
  return res.data.data.count;
}
import { api, type ApiSuccessResponse } from "./api";

export type Facility = {
  id: string;
  facility_name: string;
  address: string | null;
  contact_phone: string | null;
  verification_docs: string[] | null;
  status: "pending" | "approved";
  created_at?: string;
  updated_at?: string;
};

export type UpdateFacilityBody = {
  facility_name?: string;
  address?: string;
  contact_phone?: string;
};

export async function getFacility(id: string): Promise<Facility> {
  const res = await api.get<ApiSuccessResponse<Facility>>(`/facilities/${id}`);
  return res.data.data;
}

export async function updateFacility(
  id: string,
  payload: UpdateFacilityBody,
): Promise<Facility> {
  const res = await api.patch<ApiSuccessResponse<Facility>>(
    `/facilities/${id}`,
    payload,
  );
  return res.data.data;
}

/** Upload verification documents (multipart). Max 5 files. */
export async function uploadVerificationDocs(
  facilityId: string,
  files: File[],
): Promise<Facility> {
  const formData = new FormData();
  files.forEach((file) => formData.append("verification_docs", file));
  const res = await api.post<ApiSuccessResponse<Facility>>(
    `/facilities/${facilityId}/verification-docs`,
    formData,
    {
      headers: { "Content-Type": "multipart/form-data" },
    },
  );
  return res.data.data;
}

export type Provider = {
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

export type CreateProviderBody = {
  specialization?: string;
  license_number?: string;
  email: string;
  temporary_password?: string;
};


export async function listFacilityProviders(
  facilityId: string,
): Promise<Provider[]> {
  const res = await api.get<ApiSuccessResponse<Provider[]>>(
    `/facilities/${facilityId}/providers`,
  );
  return res.data.data;
}

export async function createFacilityProvider(
  facilityId: string,
  payload: CreateProviderBody,
): Promise<Provider> {
  const res = await api.post<ApiSuccessResponse<Provider>>(
    `/facilities/${facilityId}/providers`,
    payload,
  );
  return res.data.data;
}

/** Upload verification docs for a provider (facility only). Max 5 files. */
export async function uploadProviderVerificationDocs(
  facilityId: string,
  providerId: string,
  files: File[],
): Promise<void> {
  const formData = new FormData();
  files.forEach((file) => formData.append("verification_docs", file));
  await api.post(
    `/facilities/${facilityId}/providers/${providerId}/verification-docs`,
    formData,
    { headers: { "Content-Type": "multipart/form-data" } },
  );
}
