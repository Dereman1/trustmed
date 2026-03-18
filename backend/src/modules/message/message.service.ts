import type { User } from "@supabase/supabase-js";
import { AppError } from "../../core/errors/app-error.js";
import { supabaseService } from "../../config/supabase.js";
import type { Message, MessageListQuery } from "../../types/message.types.js";

export const messageService = {
  async send(user: User, receiverId: string, messageText: string): Promise<Message> {
    // Validate receiver exists
    const { data: receiverExists } = await supabaseService
      .from("profiles")
      .select("id")
      .eq("id", receiverId)
      .single();

    if (!receiverExists) {
      throw new AppError("Receiver does not exist", 400, "Invalid receiver_id");
    }

    const { data, error } = await supabaseService
      .from("messages")
      .insert({
        sender_id: user.id,
        receiver_id: receiverId,
        message_text: messageText,
      })
      .select("*")
      .single();

    if (error || !data) {
      throw new AppError("Failed to send message", 500, error?.message);
    }
    return data as Message;
  },

  async listForUser(
    user: User,
    query: MessageListQuery = {},
  ): Promise<Message[]> {
    const limit = query.limit ?? 50;
    const offset = query.offset ?? 0;

    const { data, error } = await supabaseService
      .from("messages")
      .select("*")
      .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      throw new AppError("Failed to list messages", 500, error.message);
    }

    let messages = (data ?? []) as Message[];
    if (query.counterpart_id) {
      const cid = query.counterpart_id;
      messages = messages.filter(
        (m) =>
          (m.sender_id === user.id && m.receiver_id === cid) ||
          (m.sender_id === cid && m.receiver_id === user.id),
      );
    }
    return messages;
  },
};
