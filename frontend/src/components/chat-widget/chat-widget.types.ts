export interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

export interface ChatSession {
  sessionId: string;
  messages: Message[];
}

export interface WidgetApiResponse {
  reply: string;
  session_id: string;
}
