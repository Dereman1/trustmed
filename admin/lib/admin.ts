import { api, type ApiSuccessResponse } from "./api";

// Types
export type AdminUser = {
  id: string;
  email: string | null;
  created_at: string;
  role?: string;
  fullName?: string | null;
};

export type AdminAnalytics = {
  users_count: number;
  patients_count: number;
  providers_count: number;
  facilities_count: number;
  medical_records_count: number;
  access_permissions_count: number;
};

export type AuditLog = {
  id: string;
  user_id: string | null;
  action_type: string;
  record_id: string | null;
  metadata: Record<string, unknown> | null;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
};

export type Facility = {
  id: string;
  facility_name: string;
  address: string | null;
  contact_phone: string | null;
  verification_docs: string | null;
  status: "pending" | "approved" | "rejected";
  created_at: string;
  updated_at: string;
};

export type Provider = {
  id: string;
  user_id: string;
  facility_id: string | null;
  specialization: string | null;
  license_number: string | null;
  verification_docs: string | null;
  status: "pending" | "approved" | "rejected";
  created_at: string;
  updated_at: string;
};

// API Functions
export async function getUsers(limit = 100) {
  const response = await api.get<ApiSuccessResponse<AdminUser[]>>(
    `/admin/users?limit=${limit}`,
  );
  return response.data;
}

export async function getAnalytics() {
  const response = await api.get<ApiSuccessResponse<AdminAnalytics>>(
    "/admin/analytics",
  );
  return response.data;
}

export async function getAuditLogs(limit = 100, offset = 0) {
  const response = await api.get<ApiSuccessResponse<AuditLog[]>>(
    `/admin/audit-logs?limit=${limit}&offset=${offset}`,
  );
  return response.data;
}

export async function getPendingFacilities() {
  const response = await api.get<ApiSuccessResponse<Facility[]>>(
    "/admin/facilities/pending",
  );
  return response.data;
}

export async function approveFacility(id: string) {
  const response = await api.post<ApiSuccessResponse<Facility>>(
    `/admin/facilities/${id}/approve`,
  );
  return response.data;
}

export async function getPendingProviders() {
  const response = await api.get<ApiSuccessResponse<Provider[]>>(
    "/providers/pending",
  );
  return response.data;
}

export async function approveProvider(id: string) {
  const response = await api.post<ApiSuccessResponse<Provider>>(
    `/providers/${id}/approve`,
  );
  return response.data;
}

export async function getProviderById(id: string) {
  const response = await api.get<ApiSuccessResponse<Provider>>(
    `/providers/${id}`,
  );
  return response.data;
}
