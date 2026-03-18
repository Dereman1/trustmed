import { z } from "zod";

import { api, type ApiSuccessResponse } from "./api";
import { redirect } from "next/dist/server/api-utils";

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

export const registerSchema = z
  .object({
    fullName: z.string().min(2, "Full name is required").max(100),
    email: z.string().email("A valid email is required"),
    password: basePassword,
    confirmPassword: z.string(),
    role: z.enum(["patient", "provider", "facility"]),
    dateOfBirth: z.string(),
    gender: z.string(),
    address: z.string().optional(),
    contactPhone: z.string().optional(),
  })
  .superRefine((values, ctx) => {
    if (values.password !== values.confirmPassword) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["confirmPassword"],
        message: "Passwords do not match",
      });
    }
    if (values.role === "patient") {
      if (!values.dateOfBirth) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["dateOfBirth"],
          message: "Date of birth is required",
        });
      }
      if (!values.gender) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["gender"],
          message: "Gender is required",
        });
      }
    }
    if (values.role === "facility") {
      if (!values.fullName || !values.address || !values.contactPhone) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["role"],
          message:
            "Required fields missing: For facilities, facility name, address, and contact phone are required.",
        });
      }
    }
  });

export type RegisterFormValues = z.infer<typeof registerSchema>;

export const forgotPasswordSchema = z.object({
  email: z.string().email("A valid email is required"),
  redirectTo: z.string().url("A valid URL is required for redirect"),
});

export type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>;

export const resetPasswordSchema = z
  .object({
    password: basePassword,
    confirmPassword: z.string(),
  })
  .refine((values) => values.password === values.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords do not match",
  });

export type ResetPasswordFormValues = z.infer<typeof resetPasswordSchema>;

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
  /** Present when API returns Supabase user (snake_case) */
  user_metadata?: Record<string, unknown>;
  mustChangePassword?: boolean;
};


/** Resolve role from user (handles both camelCase and snake_case from API). */
export function getRoleFromUser(user: AuthUser | null | undefined): string | null {
  if (!user) return null;
  const role =
    user.role ??
    user.userMetadata?.role ??
    (user as AuthUser & { user_metadata?: Record<string, unknown> }).user_metadata?.role;
  return typeof role === "string" ? role.trim().toLowerCase() : null;
}

/** Dashboard path for a given role; returns "/" if role is unknown. */
export function getDashboardPathForRole(role: string | null): string {
  if (role === "patient") return "/patient/dashboard";
  if (role === "facility") return "/facility/dashboard";
  if (role === "provider") return "/provider/dashboard";
  return "/";
}

export type LoginResponse = {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  tokenType: string;
  user: AuthUser;
};

export type RegisterResponse = {
  user: AuthUser | null;
  session: {
    access_token: string;
    refresh_token: string;
    token_type: string;
    expires_in: number;
  } | null;
};

export async function registerUser(values: RegisterFormValues) {
  const payload = {
    email: values.email,
    password: values.password,
    confirmPassword: values.confirmPassword,
    fullName: values.fullName,
    metadata: {
      role: values.role,
      // Backend expects snake_case for these fields
      date_of_birth: values.dateOfBirth || undefined,
      gender: values.gender || undefined,
      address: values.address || undefined,
      contact_phone: values.contactPhone || undefined,
    },
  };

  const response = await api.post<ApiSuccessResponse<RegisterResponse>>(
    "/auth/register",
    payload,
  );

  return response.data;
}

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

export async function forgotPassword(email: string) {
  const response = await api.post<ApiSuccessResponse<void>>(
    "/auth/forgot-password",
    { email },
  );
  return response.data;
}

export async function resetPassword(
  values: ResetPasswordFormValues,
  accessToken: string,
  refreshToken: string,
) {
  const response = await api.post<ApiSuccessResponse<void>>(
    "/auth/reset-password",
    {
      accessToken,
      refreshToken,
      newPassword: values.password,
    },
  );
  return response.data;
}


export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: basePassword,
    confirmPassword: z.string(),
  })
  .refine((values) => values.newPassword === values.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords do not match",
  });

export type ChangePasswordFormValues = z.infer<typeof changePasswordSchema>;

export async function changePassword(values: ChangePasswordFormValues) {
  const response = await api.post<ApiSuccessResponse<void>>(
    "/auth/change-password",
    {
      currentPassword: values.currentPassword,
      newPassword: values.newPassword,
      confirmPassword: values.confirmPassword,
    },
  );
  return response.data;
}
