export type Facility = {
  id: string;
  facility_name: string;
  address: string | null;
  contact_phone: string | null;
  verification_docs: string[] | null; // URLs or file references
  status: "pending" | "approved";
  created_at?: string;
  updated_at?: string;
};

export type CreateFacilityBody = {
  facility_name: string;
  address?: string;
  contact_phone?: string;
  verification_docs?: string[];
};

export type UpdateFacilityBody = Partial<CreateFacilityBody>;
