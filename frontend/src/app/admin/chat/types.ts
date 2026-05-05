export type ConversationStatus = 'active' | 'pending' | 'closed';

export interface Conversation {
  id: string;
  lead_id: string | null;
  status: ConversationStatus;
  source: string;
  platform_id: string;
  created_at: string;
  updated_at: string;
  brands?: { name: string; email: string };
}

export type SenderType = 'lead' | 'agent' | 'bot';

export interface Message {
  id: string;
  conversation_id: string;
  sender_type: SenderType;
  content: string;
  metadata: any;
  created_at: string;
  lead_attachments?: any[];
}
