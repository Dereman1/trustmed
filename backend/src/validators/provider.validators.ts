import { z } from "zod";

export const createProviderSchema = z.object({
  body: z.object({
    facility_id: z.string().uuid().optional(),
    specialization: z.string().max(255).optional(),
    license_number: z.string().max(100).optional(),
    email: z.string().email(),
    temporary_password: z.string().min(8).optional(),
  }),
});

export const updateProviderSchema = z.object({
  body: z
    .object({
      facility_id: z.string().uuid().optional().nullable(),
      specialization: z.string().max(255).optional(),
      license_number: z.string().max(100).optional(),
      status: z.enum(["pending", "approved"]).optional(),
    })
    .refine((data) => Object.keys(data).length > 0, {
      message: "Provide at least one field to update",
      path: ["body"],
    }),
});
