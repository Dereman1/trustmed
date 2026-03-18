import { z } from "zod";

export const createFacilitySchema = z.object({
  body: z.object({
    facility_name: z.string().min(2).max(255),
    address: z.string().max(2000).optional(),
    contact_phone: z.string().max(50).optional(),
  }),
});

export const updateFacilitySchema = z.object({
  body: z
    .object({
      facility_name: z.string().min(2).max(255).optional(),
      address: z.string().max(2000).optional(),
      contact_phone: z.string().max(50).optional(),
    })
    .refine((data) => Object.keys(data).length > 0, {
      message: "Provide at least one field to update",
      path: ["body"],
    }),
});
