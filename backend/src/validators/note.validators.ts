import { z } from "zod";

export const addNoteSchema = z.object({
  body: z.object({
    record_id: z.string().uuid(),
    note_text: z.string().min(1).max(10000),
  }),
});
