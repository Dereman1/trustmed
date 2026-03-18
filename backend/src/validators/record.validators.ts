import { z } from "zod";

export const createRecordSchema = z.object({
  body: z.object({
    record_type: z.string().min(1).max(100),
    description: z.string().max(2000).optional(),
  }),
});
