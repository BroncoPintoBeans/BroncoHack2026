export interface Conversation {
  id: string;
  case_id: string | null;
  listing_id: string | null;
  helper_request_id: string | null;
  helper_request_offer_id: string | null;
  conversation_type: "case_helper" | "listing";
  created_at: string;
  updated_at: string;
}

export interface ConversationSummary extends Conversation {
  participant_ids: string[];
  last_message_at: string | null;
  message_count: number;
}

export interface Message {
  id: string;
  conversation_id: string;
  sender_user_id: string;
  body: string;
  client_id: string | null;
  created_at: string;
}

export type MessageDTO = Message;
