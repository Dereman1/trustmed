import { api, type ApiSuccessResponse } from "./api";

export type AccessPermission = {
  id: string;
  patient_id: string;
  provider_id: string;
  granted_at: string;
  expires_at: string;
  status: "pending" | "granted" | "revoked";
  created_at?: string;
  updated_at?: string;
};

export type AccessPermissionWithProvider = AccessPermission & {
  provider_details?: {
    fullName: string | null;
    phone: string | null;
    specialization: string | null;
    license_number: string | null;
    verification_docs: string[] | null;
  };
};

export async function listMyPermissions(): Promise<AccessPermission[]> {
  const res = await api.get<ApiSuccessResponse<AccessPermission[]>>(
    "/access/my"
  );
  return res.data.data;
}

export async function listMyPermissionsWithProvider(): Promise<AccessPermissionWithProvider[]> {
  const res = await api.get<ApiSuccessResponse<AccessPermissionWithProvider[]>>(
    "/access/my/with-provider"
  );
  return res.data.data;
}

export async function grantAccess(permissionId: string): Promise<AccessPermission> {
  const res = await api.post<ApiSuccessResponse<AccessPermission>>(
    "/access/grant",
    { permission_id: permissionId }
  );
  return res.data.data;
}

export async function revokeAccess(
  permissionId: string
): Promise<AccessPermission> {
  const res = await api.post<ApiSuccessResponse<AccessPermission>>(
    "/access/revoke",
    { permission_id: permissionId }
  );
  return res.data.data;
}

export async function requestAccess(patientId: string): Promise<AccessPermission> {
  const res = await api.post<ApiSuccessResponse<AccessPermission>>(
    "/access/request",
    { patient_id: patientId }
  );
  return res.data.data;
}

export async function listGrantedToMe(): Promise<AccessPermission[]> {
  const res = await api.get<ApiSuccessResponse<AccessPermission[]>>(
    "/access/granted-to-me"
  );
  return res.data.data;
}

export type AccessPermissionWithPatientDetails = AccessPermission & {
  patient_details?: {
    user_id: string | null;
    fullName: string | null;
    phone: string | null;
    date_of_birth: string | null;
    gender: string | null;
  };
};

export async function listGrantedToMeWithPatientDetails(): Promise<AccessPermissionWithPatientDetails[]> {
  const res = await api.get<ApiSuccessResponse<AccessPermissionWithPatientDetails[]>>(
    "/access/granted-to-me/with-patient-details"
  );
  return res.data.data;
}
