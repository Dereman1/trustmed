export type RegisterBody = {
  email: string;
  password: string;
  confirmPassword: string;
  fullName?: string;
  metadata?: Record<string, unknown>;
};

export type LoginBody = {
  email: string;
  password: string;
};

export type ForgotPasswordBody = {
  email: string;
  redirectTo?: string;
};

export type ChangePasswordBody = {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
};

export type ResetPasswordBody = {
  accessToken: string;
  refreshToken: string;
  newPassword: string;
  confirmPassword: string;
};

export type LogoutBody = {
  accessToken?: string;
  refreshToken: string;
};
