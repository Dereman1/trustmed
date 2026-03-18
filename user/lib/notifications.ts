import { api, type ApiSuccessResponse } from "./api";

export type Notification = {
  id: string;
  user_id: string;
  type: string;
  title: string;
  body: string | null;
  metadata: Record<string, unknown> | null;
  read_at: string | null;
  created_at: string;
};

export async function listMyNotifications(params?: {
  limit?: number;
  unread_only?: boolean;
}): Promise<Notification[]> {
  const searchParams = new URLSearchParams();
  if (params?.limit) searchParams.set("limit", String(params.limit));
  if (params?.unread_only !== undefined)
    searchParams.set("unread_only", String(params.unread_only));
  const query = searchParams.toString();
  const res = await api.get<ApiSuccessResponse<Notification[]>>(
    `/notifications${query ? `?${query}` : ""}`
  );
  return res.data.data;
}

export async function markNotificationRead(
  id: string
): Promise<Notification> {
  const res = await api.patch<ApiSuccessResponse<Notification>>(
    `/notifications/${id}/read`,
    {}
  );
  return res.data.data;
}

export async function markAllNotificationsRead(): Promise<void> {
  await api.patch("/notifications/read-all", {});
}
