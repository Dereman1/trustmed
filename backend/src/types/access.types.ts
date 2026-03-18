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

export type RequestAccessBody = {
  patient_id: string;
};

export const ACCESS_PERMISSION_DAYS = 30;
