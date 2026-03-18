import { z } from "zod";

export const sendMessageSchema = z.object({
  body: z.object({
    receiver_id: z.string().uuid(),
    message_text: z.string().min(1).max(10000),
  }),
});
