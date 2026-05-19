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

/**
 * Contexto de página para el widget de Rebecca (Spec: Rebecca 2.0 §4.2)
 */
export interface ChatContext {
  page_url: string;
  page_title?: string;
  source: 'demo' | 'widget' | 'whatsapp';
  brand_slug?: string;
}

/**
 * Request body para POST /api/chat/widget
 */
export interface WidgetRequest {
  session_id: string;
  message: string;
  history: Message[];
  context: ChatContext;
}
