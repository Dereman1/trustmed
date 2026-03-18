import type { Request, Response } from "express";
import { AppError } from "../../core/errors/app-error.js";
import { asyncHandler } from "../../core/http/async-handler.js";
import { sendSuccess } from "../../core/http/response.js";
import {
  createSupabaseAnonClient,
  supabaseService,
} from "../../config/supabase.js";
import type {
  ChangePasswordBody,
  ForgotPasswordBody,
  LoginBody,
  LogoutBody,
  ResetPasswordBody,
  RegisterBody,
} from "../../types/auth.types.js";

function ensureAnonClient() {
  const anonClient = createSupabaseAnonClient();

  if (!anonClient) {
    throw new AppError("SUPABASE_ANON_KEY is required for auth endpoints", 500);
  }

  return anonClient;
}

function getBearerToken(req: Request): string | null {
  const authHeader = req.header("authorization");

  if (!authHeader?.toLowerCase().startsWith("bearer ")) {
    return null;
  }

  return authHeader.slice(7).trim();
}

// Normalize metadata keys (accept both camelCase from frontend and snake_case)
function normalizeMetadata(
  metadata: Record<string, unknown> | undefined,
): Record<string, unknown> {
  if (!metadata) return {};
  return {
    ...metadata,
    date_of_birth:
      (metadata.date_of_birth as string | undefined) ??
      (metadata.dateOfBirth as string | undefined),
    contact_phone:
      (metadata.contact_phone as string | undefined) ??
      (metadata.contactPhone as string | undefined),
  };
}

export const register = asyncHandler(async (req: Request, res: Response) => {
  const anonClient = ensureAnonClient();
  const { email, password, fullName, metadata: rawMetadata } =
    req.body as RegisterBody;
  const metadata = normalizeMetadata(rawMetadata);

  // Require role
  const role = metadata?.role;
  if (!role || typeof role !== "string") {
    throw new AppError("Role is required for registration", 400);
  }

  // Validate required profile fields based on role
  if (role === "patient") {
    if (!metadata?.date_of_birth || !metadata?.gender) {
      throw new AppError("Patient date of birth and gender are required", 400);
    }
  }
  if (role === "facility") {
    if (!fullName || !metadata?.address || !metadata?.contact_phone) {
      throw new AppError(
        "Facility name, address, and contact phone are required",
        400,
      );
    }
  }
  if (role === "provider") {
    if (!metadata?.specialization || !metadata?.license_number) {
      throw new AppError(
        "Provider specialization and license number are required",
        400,
      );
    }
  }

  // Register user with role in metadata
  const { data, error } = await anonClient.auth.signUp({
    email,
    password,
    options: {
      data: {
        ...(fullName ? { fullName } : {}),
        role,
        ...(rawMetadata ?? {}),
      },
    },
  });

  if (error || !data.user) {
    const isRateLimit =
      error?.message?.toLowerCase().includes("rate limit") ||
      error?.message?.toLowerCase().includes("ratelimit");
    throw new AppError(
      "Registration failed",
      400,
      isRateLimit
        ? "Too many sign-up attempts. Please try again in an hour or use a different email for now."
        : error?.message,
    );
  }

  const userId = data.user.id;

  // 1. Populate profiles table for both roles (keeps profile in sync)
  const { error: profileError } = await supabaseService.from("profiles").upsert(
    {
      id: userId,
      fullName: fullName ?? null,
      email,
      role,
    },
    { onConflict: "id" },
  );

  if (profileError) {
    console.error("Failed to create profile:", profileError);
    throw new AppError(
      "Registration succeeded but profile setup failed. Please try logging in.",
      500,
      profileError.message,
    );
  }

  // 2. Populate role-specific table (patients or facilities)
  try {
    if (role === "patient") {
      const { error: patientError } = await supabaseService
        .from("patients")
        .insert({
          user_id: userId,
          date_of_birth: metadata?.date_of_birth || null,
          gender: metadata?.gender || null,
        });
      if (patientError) throw patientError;
    } else if (role === "facility") {
      const { error: facilityError } = await supabaseService
        .from("facilities")
        .insert({
          id: userId,
          facility_name: fullName,
          address: metadata?.address ?? null,
          contact_phone: metadata?.contact_phone || null,
          status: "pending",
        });
      if (facilityError) throw facilityError;
    } else if (role === "provider") {
      const { error: providerError } = await supabaseService
        .from("providers")
        .insert({
          user_id: userId,
          specialization: metadata?.specialization,
          license_number: metadata?.license_number,
          facility_id: (metadata?.facility_id as string) || null,
          status: "pending",
        });
      if (providerError) throw providerError;
    }
  } catch (profileError) {
    const err =
      profileError && typeof profileError === "object" && "message" in profileError
        ? (profileError as { message?: string }).message
        : String(profileError);
    console.error("Failed to initialize specialized profile:", profileError);
    throw new AppError(
      "Registration succeeded but role profile setup failed. Please contact support.",
      500,
      err ?? undefined,
    );
  }

  return sendSuccess(
    res,
    201,
    {
      user: data.user,
      session: data.session,
    },
    "Registration successful",
  );
});

export const login = asyncHandler(async (req: Request, res: Response) => {
  const anonClient = ensureAnonClient();
  const { email, password } = req.body as LoginBody;

  const { data, error } = await anonClient.auth.signInWithPassword({
    email,
    password,
  });

  if (error || !data.session || !data.user) {
    throw new AppError("Invalid email or password", 401, error?.message);
  }

  // Attach role from profiles table (source of truth) so frontend can redirect by role
  let role: string | null = null;
  const { data: profile } = await supabaseService
    .from("profiles")
    .select("role")
    .eq("id", data.user.id)
    .maybeSingle();
  if (profile?.role && typeof profile.role === "string") {
    role = profile.role.trim().toLowerCase();
  }

  // Check provider approval status
  if (role === "provider") {
    const { data: provider } = await supabaseService
      .from("providers")
      .select("status")
      .eq("user_id", data.user.id)
      .maybeSingle();

    if (!provider || provider.status !== "approved") {
      throw new AppError(
        "Your account is pending admin approval. Please try again later.",
        403,
      );
    }
  }

  const userWithRole = {
    ...data.user,
    role:
      role ??
      data.user.user_metadata?.role ??
      data.user.app_metadata?.role ??
      null,
    mustChangePassword: data.user.user_metadata?.must_change_password ?? false,
  };

  return sendSuccess(
    res,
    200,
    {
      accessToken: data.session.access_token,
      refreshToken: data.session.refresh_token,
      expiresIn: data.session.expires_in,
      tokenType: data.session.token_type,
      user: userWithRole,
    },
    "Login successful",
  );
});

export const forgotPassword = asyncHandler(
  async (req: Request, res: Response) => {
    const anonClient = ensureAnonClient();
    const { email, redirectTo } = req.body as ForgotPasswordBody;

    const { error } = await anonClient.auth.resetPasswordForEmail(email, {
      ...(redirectTo ? { redirectTo } : {}),
    });

    if (error) {
      throw new AppError(
        "Failed to send password reset email",
        400,
        error.message,
      );
    }

    return sendSuccess(
      res,
      200,
      undefined,
      "If the account exists, a password reset email has been sent",
    );
  },
);

export const changePassword = asyncHandler(
  async (req: Request, res: Response) => {
    const anonClient = ensureAnonClient();
    const { currentPassword, newPassword } = req.body as ChangePasswordBody;

    if (!req.authUser?.email) {
      throw new AppError("Authenticated user email not found", 400);
    }

    const verify = await anonClient.auth.signInWithPassword({
      email: req.authUser.email,
      password: currentPassword,
    });

    if (verify.error) {
      throw new AppError(
        "Current password is incorrect",
        401,
        verify.error.message,
      );
    }

    const { error } = await supabaseService.auth.admin.updateUserById(
      req.authUser.id,
      {
        password: newPassword,
        user_metadata: {
          ...req.authUser.user_metadata,
          must_change_password: false,
        },
      },
    );


    if (error) {
      throw new AppError("Failed to update password", 400, error.message);
    }

    return sendSuccess(res, 200, undefined, "Password updated successfully");
  },
);

export const resetPassword = asyncHandler(
  async (req: Request, res: Response) => {
    const anonClient = ensureAnonClient();
    const { accessToken, refreshToken, newPassword } =
      req.body as ResetPasswordBody;

    const setSessionResult = await anonClient.auth.setSession({
      access_token: accessToken,
      refresh_token: refreshToken,
    });

    if (setSessionResult.error) {
      throw new AppError(
        "Invalid or expired reset session",
        401,
        setSessionResult.error.message,
      );
    }

    const { error } = await anonClient.auth.updateUser({
      password: newPassword,
    });

    if (error) {
      throw new AppError("Failed to reset password", 400, error.message);
    }

    await anonClient.auth.signOut();

    return sendSuccess(res, 200, undefined, "Password reset successful");
  },
);

export const logout = asyncHandler(async (req: Request, res: Response) => {
  const anonClient = ensureAnonClient();
  const { accessToken, refreshToken } = req.body as LogoutBody;
  const resolvedAccessToken =
    accessToken ?? req.authToken ?? getBearerToken(req);

  if (!resolvedAccessToken) {
    throw new AppError(
      "Missing access token",
      401,
      "Provide accessToken in body or Authorization: Bearer <access_token>",
    );
  }

  const setSessionResult = await anonClient.auth.setSession({
    access_token: resolvedAccessToken,
    refresh_token: refreshToken,
  });

  if (setSessionResult.error) {
    throw new AppError(
      "Invalid session for logout",
      401,
      setSessionResult.error.message,
    );
  }

  const { error } = await anonClient.auth.signOut({ scope: "global" });

  if (error) {
    throw new AppError("Failed to logout", 400, error.message);
  }

  return sendSuccess(res, 200, undefined, "Logout successful");
});

export const getCurrentUser = asyncHandler(
  async (req: Request, res: Response) => {
    if (!req.authUser) {
      throw new AppError("Authentication required", 401);
    }

    return sendSuccess(
      res,
      200,
      {
        id: req.authUser.id,
        email: req.authUser.email,
        role: req.authUser.role,
        appMetadata: req.authUser.app_metadata,
        userMetadata: req.authUser.user_metadata,
      },
      "Authenticated user retrieved",
    );
  },
);
