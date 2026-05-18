export interface YCloudWebhookPayload {
  id: string;
  type: string;
  apiVersion: string;
  createTime: string;
  whatsappInboundMessage?: {
    id: string;
    wamid: string;
    wabaId: string;
    from: string;
    fromUserId?: string;
    customerProfile?: { name: string };
    to: string;
    sendTime: string;
    type: string;
    text?: { body: string };
    content?: { text: string };
  };
  payload?: {
    from: string;
    to: string;
    id: string;
    type: string;
    content: { text: string };
    chat_id: string;
    create_time: string;
  };
}

export interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  customerName?: string;
}

export interface KnowledgeItem {
  id: string;
  content: string;
  category: string;
  similarity: number;
}
