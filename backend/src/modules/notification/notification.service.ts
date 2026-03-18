import type { CreateNotificationInput } from "../../types/notification.types.js";
import type { User } from "@supabase/supabase-js";
import { AppError } from "../../core/errors/app-error.js";
import { supabaseService } from "../../config/supabase.js";
import type { Notification } from "../../types/notification.types.js";

export const notificationService = {
  async create(input: CreateNotificationInput): Promise<Notification> {
    const { data, error } = await supabaseService
      .from("notifications")
      .insert({
        user_id: input.user_id,
        type: input.type,
        title: input.title,
        body: input.body ?? null,
        metadata: input.metadata ?? null,
      })
      .select("*")
      .single();
    if (error || !data)
      throw new AppError("Failed to create notification", 400, error?.message);
    return data as Notification;
  },
  async listMy(
    user: User,
    limit = 50,
    unreadOnly = false,
  ): Promise<Notification[]> {
    let query = supabaseService
      .from("notifications")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (unreadOnly) {
      query = query.is("read_at", null);
    }

    const { data, error } = await query;
    if (error)
      throw new AppError("Failed to list notifications", 500, error.message);
    return (data ?? []) as Notification[];
  },

  async markRead(user: User, notificationId: string): Promise<Notification> {
    const { data, error } = await supabaseService
      .from("notifications")
      .update({ read_at: new Date().toISOString() })
      .eq("id", notificationId)
      .eq("user_id", user.id)
      .select("*")
      .single();

    if (error || !data)
      throw new AppError("Notification not found", 404, error?.message);
    return data as Notification;
  },

  async markAllRead(user: User): Promise<void> {
    await supabaseService
      .from("notifications")
      .update({ read_at: new Date().toISOString() })
      .eq("user_id", user.id)
      .is("read_at", null);
  },
};
