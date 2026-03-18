import { z } from "zod";

export const requestAccessSchema = z.object({
  body: z.object({
    patient_id: z.string().uuid(),
  }),
});

export const grantAccessSchema = z.object({
  body: z.object({
    permission_id: z.string().uuid(),
  }),
});

export const revokeAccessSchema = z.object({
  body: z.object({
    permission_id: z.string().uuid(),
  }),
});
