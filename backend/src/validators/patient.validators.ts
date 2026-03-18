import { z } from "zod";

export const createPatientSchema = z.object({
  body: z.object({
    date_of_birth: z.string().optional(),
    gender: z.string().max(50).optional(),
  }),
});

export const updatePatientSchema = z.object({
  body: z
    .object({
      date_of_birth: z.string().optional(),
      gender: z.string().max(50).optional(),
    })
    .refine((data) => Object.keys(data).length > 0, {
      message: "Provide at least one field to update",
      path: ["body"],
    }),
});
