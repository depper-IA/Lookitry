export interface YCloudWebhookPayload {
  event: string;
  app_id: string;
  timestamp: number;
  version: string;
  payload: {
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
}

export interface KnowledgeItem {
  id: string;
  content: string;
  category: string;
  similarity: number;
}
