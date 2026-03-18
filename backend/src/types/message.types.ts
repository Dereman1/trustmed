export type Message = {
  id: string;
  sender_id: string;
  receiver_id: string;
  message_text: string;
  created_at: string;
  updated_at?: string;
};

export type CreateMessageBody = {
  receiver_id: string;
  message_text: string;
};

export type MessageListQuery = {
  counterpart_id?: string;
  limit?: number;
  offset?: number;
};
