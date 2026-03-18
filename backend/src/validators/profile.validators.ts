import { z } from "zod";

export const updateMyProfileSchema = z.object({
  body: z
    .object({
      fullName: z.string().min(2).max(100).optional(),
      phone: z.string().min(7).max(20).optional(),
      avatar_url: z.url().optional(),
      role: z.enum(["user", "owner", "patient", "provider", "facility", "admin"]).optional(),
    })
    .refine((data) => Object.keys(data).length > 0, {
      message: "Provide at least one field to update",
      path: ["body"],
    }),
});
