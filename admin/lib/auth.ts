import { z } from "zod";

import { api, type ApiSuccessResponse } from "./api";

const basePassword = z
  .string()
  .min(8, "Password must be at least 8 characters long")
  .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
  .regex(/[a-z]/, "Password must contain at least one lowercase letter")
  .regex(/[0-9]/, "Password must contain at least one number")
  .regex(
    /[^A-Za-z0-9]/,
    "Password must contain at least one special character",
  );

export const loginSchema = z.object({
  email: z.string().email("A valid email is required"),
  password: basePassword,
});

export type LoginFormValues = z.infer<typeof loginSchema>;

export type AuthUser = {
  id: string;
  email: string;
  role?: string | null;
  fullName?: string | null;
  appMetadata?: Record<string, unknown>;
  userMetadata?: Record<string, unknown>;
  user_metadata?: Record<string, unknown>;
  mustChangePassword?: boolean;
};

export function getRoleFromUser(user: AuthUser | null | undefined): string | null {
  if (!user) return null;
  const role =
    user.role ??
    user.userMetadata?.role ??
    (user as AuthUser & { user_metadata?: Record<string, unknown> }).user_metadata?.role;
  return typeof role === "string" ? role.trim().toLowerCase() : null;
}

export type LoginResponse = {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  tokenType: string;
  user: AuthUser;
};

export async function loginUser(values: LoginFormValues) {
  const response = await api.post<ApiSuccessResponse<LoginResponse>>(
    "/auth/login",
    values,
  );

  return response.data;
}

export async function logoutUser(accessToken: string, refreshToken: string) {
  const response = await api.post<ApiSuccessResponse<void>>("/auth/logout", {
    accessToken,
    refreshToken,
  });
  return response.data;
}
