import { api, type ApiSuccessResponse } from "./api";

export type Message = {
  id: string;
  sender_id: string;
  receiver_id: string;
  message_text: string;
  created_at: string;
  updated_at?: string;
};

export async function sendMessage(
  receiverId: string,
  messageText: string
): Promise<Message> {
  const res = await api.post<ApiSuccessResponse<Message>>("/messages/send", {
    receiver_id: receiverId,
    message_text: messageText,
  });
  return res.data.data;
}

export async function getMessages(params?: {
  counterpart_id?: string;
  limit?: number;
  offset?: number;
}): Promise<Message[]> {
  const searchParams = new URLSearchParams();
  if (params?.counterpart_id)
    searchParams.set("counterpart_id", params.counterpart_id);
  if (params?.limit) searchParams.set("limit", String(params.limit));
  if (params?.offset) searchParams.set("offset", String(params.offset));
  const query = searchParams.toString();
  const res = await api.get<ApiSuccessResponse<Message[]>>(
    `/messages${query ? `?${query}` : ""}`
  );
  return res.data.data;
}
