export type UserProfile = {
  id: string;
  fullName: string | null;
  email: string;
  phone: string | null;
  role: string | null;
  avatar_url: string | null;
};

export type UpdateMyProfileBody = {
  fullName?: string;
  phone?: string;
  avatar_url?: string;
  role?: "user" | "owner" | "patient" | "provider" | "facility" | "admin";
};

export type UploadAvatarInput = {
  buffer: Buffer;
  mimetype: string;
};
