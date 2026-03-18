export type Provider = {
  id: string;
  user_id: string;
  facility_id: string | null;
  specialization: string | null;
  license_number: string | null;
  verification_docs: string[] | null; // URLs or file references
  status: "pending" | "approved";
  created_at?: string;
  updated_at?: string;
};

export type CreateProviderBody = {
  facility_id?: string;
  specialization?: string;
  license_number?: string;
  verification_docs?: string[];
  email: string;
  /**
   * Optional initial password for the provider's auth user.
   * Used only when creating the Supabase auth user and never stored
   * in the providers table.
   */
  temporary_password?: string;
};

export type UpdateProviderBody = Partial<CreateProviderBody> & {
  status?: "pending" | "approved";
};
