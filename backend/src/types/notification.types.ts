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

export type CreateNotificationInput = {
  user_id: string;
  type: string;
  title: string;
  body?: string;
  metadata?: Record<string, unknown>;
};

export const NOTIFICATION_TYPES = {
  ACCESS_REQUESTED: "access_requested",
  ACCESS_GRANTED: "access_granted",
  CONSULTATION_NOTE_ADDED: "consultation_note_added",
  RECORD_UPLOADED: "record_uploaded",
  DOCUMENT_ADDED: "document_added",
} as const;
