export type Patient = {
  id: string;
  user_id: string;
  date_of_birth: string | null;
  gender: string | null;
  created_at?: string;
  updated_at?: string;
};

export type CreatePatientBody = {
  date_of_birth?: string;
  gender?: string;
};

export type UpdatePatientBody = Partial<CreatePatientBody>;
