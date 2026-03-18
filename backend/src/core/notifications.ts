import { supabaseService } from "../config/supabase.js";
import type { CreateNotificationInput } from "../types/notification.types.js";

export async function createNotification(
  input: CreateNotificationInput,
): Promise<void> {
  try {
    await supabaseService.from("notifications").insert({
      user_id: input.user_id,
      type: input.type,
      title: input.title,
      body: input.body ?? null,
      metadata: input.metadata ?? null,
    });
  } catch {
    // Non-fatal
  }
}
