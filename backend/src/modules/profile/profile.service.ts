import type { User } from "@supabase/supabase-js";
import { supabaseService } from "../../config/supabase.js";
import { AppError } from "../../core/errors/app-error.js";
import type {
  UpdateMyProfileBody,
  UploadAvatarInput,
  UserProfile,
} from "../../types/profile.types.js";

const avatarBucket = process.env.SUPABASE_AVATAR_BUCKET ?? "avatars";

function normalizeRole(role: unknown): string | null {
  if (typeof role !== "string") {
    return null;
  }

  const value = role.trim().toLowerCase();

  if (!value) {
    return null;
  }

  if (["authenticated", "anon", "service_role"].includes(value)) {
    return null;
  }

  return value;
}

function resolveCustomRole(user: User, existingRole?: string | null): string {
  const appMetadataRole = normalizeRole(user.app_metadata?.role);

  if (appMetadataRole) {
    return appMetadataRole;
  }

  const userMetadataRole = normalizeRole(user.user_metadata?.role);

  if (userMetadataRole) {
    return userMetadataRole;
  }

  const persistedRole = normalizeRole(existingRole);

  if (persistedRole) {
    return persistedRole;
  }

  return "user";
}

function normalizeRequestedRole(
  role: unknown,
): "user" | "owner" | "patient" | "provider" | "facility" | "admin" | null {
  if (typeof role !== "string") {
    return null;
  }

  const value = role.trim().toLowerCase();
  const allowed = ["user", "owner", "patient", "provider", "facility", "admin"];

  if (allowed.includes(value)) {
    return value as "user" | "owner" | "patient" | "provider" | "facility" | "admin";
  }

  return null;
}

function getAvatarExtension(mimetype: string): "png" | "jpg" {
  if (mimetype === "image/png") {
    return "png";
  }

  if (mimetype === "image/jpeg" || mimetype === "image/jpg") {
    return "jpg";
  }

  throw new AppError("Unsupported avatar file type", 400, mimetype);
}

function toDefaultProfile(user: User): UserProfile {
  const profileRole = resolveCustomRole(user);

  return {
    id: user.id,
    fullName: (user.user_metadata?.fullName as string | undefined) ?? null,
    email: user.email ?? "",
    phone: (user.phone as string | null) ?? null,
    role: profileRole,
    avatar_url: (user.user_metadata?.avatar_url as string | undefined) ?? null,
  };
}

export const profileService = {
  async getMyProfile(user: User): Promise<UserProfile> {
    const { data, error } = await supabaseService
      .from("profiles")
      .select("id, fullName, email, phone, role, avatar_url")
      .eq("id", user.id)
      .maybeSingle();

    if (error) {
      throw new AppError("Failed to load profile", 500, error.message);
    }

    if (data) {
      return data as UserProfile;
    }

    const defaultProfile = toDefaultProfile(user);

    const { data: inserted, error: insertError } = await supabaseService
      .from("profiles")
      .upsert(defaultProfile, { onConflict: "id" })
      .select("id, fullName, email, phone, role, avatar_url")
      .single();

    if (insertError || !inserted) {
      throw new AppError(
        "Failed to initialize profile",
        500,
        insertError?.message,
      );
    }

    return inserted as UserProfile;
  },

  async updateMyProfile(
    user: User,
    payload: UpdateMyProfileBody,
  ): Promise<UserProfile> {
    const { data: existingProfile, error: existingProfileError } =
      await supabaseService
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .maybeSingle();

    if (existingProfileError) {
      throw new AppError(
        "Failed to load existing profile role",
        500,
        existingProfileError.message,
      );
    }

    const requestedRole = normalizeRequestedRole(payload.role);

    if (payload.role !== undefined && !requestedRole) {
      throw new AppError(
        "Role must be one of: user, owner, patient, provider, facility, admin",
        400,
      );
    }

    const upsertPayload = {
      id: user.id,
      email: user.email ?? "",
      role:
        requestedRole ??
        resolveCustomRole(
          user,
          existingProfile?.role as string | null | undefined,
        ),
      ...payload,
    };

    const { data, error } = await supabaseService
      .from("profiles")
      .upsert(upsertPayload, { onConflict: "id" })
      .select("id, fullName, email, phone, role, avatar_url")
      .single();

    if (error || !data) {
      throw new AppError("Failed to update profile", 400, error?.message);
    }

    return data as UserProfile;
  },

  async uploadMyAvatar(
    user: User,
    file: UploadAvatarInput,
  ): Promise<UserProfile> {
    const extension = getAvatarExtension(file.mimetype);
    const path = `${user.id}/avatar-${Date.now()}.${extension}`;

    const { error: uploadError } = await supabaseService.storage
      .from(avatarBucket)
      .upload(path, file.buffer, {
        contentType: file.mimetype,
        upsert: true,
      });

    if (uploadError) {
      throw new AppError(
        "Failed to upload avatar to storage",
        400,
        uploadError.message,
      );
    }

    const { data: publicUrlData } = supabaseService.storage
      .from(avatarBucket)
      .getPublicUrl(path);

    return this.updateMyProfile(user, {
      avatar_url: publicUrlData.publicUrl,
    });
  },

  async getProfileByUserId(userId: string): Promise<UserProfile | null> {
    const { data, error } = await supabaseService
      .from("profiles")
      .select("id, fullName, email, phone, role, avatar_url")
      .eq("id", userId)
      .maybeSingle();

    if (error) {
      console.error("Failed to load profile", error.message);
      return null;
    }

    return (data as UserProfile) || null;
  },
};
