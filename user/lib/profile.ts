import { api, type ApiSuccessResponse } from "./api";

export type UserProfile = {
  id: string;
  fullName: string | null;
  email: string;
  phone: string | null;
  role: string | null;
  avatar_url: string | null;
};

export type UpdateProfileBody = {
  fullName?: string;
  phone?: string;
  avatar_url?: string;
  role?: "user" | "owner" | "patient" | "provider" | "facility" | "admin";
};

export async function getMyProfile(): Promise<UserProfile> {
  const res = await api.get<ApiSuccessResponse<UserProfile>>("/profile/me");
  return res.data.data;
}

export async function updateMyProfile(
  payload: UpdateProfileBody
): Promise<UserProfile> {
  const res = await api.patch<ApiSuccessResponse<UserProfile>>(
    "/profile/me",
    payload
  );
  return res.data.data;
}

export async function searchUsersByName(query: string): Promise<UserProfile[]> {
  const searchParams = new URLSearchParams();
  searchParams.set("name", query);
  const res = await api.get<ApiSuccessResponse<UserProfile[]>>(
    `/users/search?${searchParams.toString()}`
  );
  return res.data.data;
}
