'use client';

import { useState } from 'react';
import type { Message, WidgetApiResponse, ChatContext } from '../chat-widget.types';

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL ?? 'https://api.lookitry.com';

const GENERIC_ERROR = 'Lo siento, ocurrió un error. Por favor intentá de nuevo.';

interface UseChatSendParams {
  sessionId: string;
  getHistorySlice: () => Message[];
  addMessage: (role: Message['role'], content: string) => void;
}

interface UseChatSendReturn {
  send: (userMessage: string) => Promise<void>;
  isLoading: boolean;
  error: string | null;
}

/**
 * Captura el contexto de página actual para Rebecca (Spec: Rebecca 2.0 §7.1)
 */
function getPageContext(): ChatContext {
  return {
    page_url: window.location.pathname,
    page_title: document.title,
    source: window.location.pathname === '/demo' ? 'demo' : 'widget',
  };
}

export function useChatSend({
  sessionId,
  getHistorySlice,
  addMessage,
}: UseChatSendParams): UseChatSendReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function send(userMessage: string): Promise<void> {
    if (!userMessage.trim() || isLoading) return;

    addMessage('user', userMessage);
    setIsLoading(true);
    setError(null);

    const history = getHistorySlice();
    const context = getPageContext();

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 15000);

      const response = await fetch(`${API_BASE}/api/chat/widget`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({
          session_id: sessionId,
          message: userMessage,
          history,
          context,
        }),
      });
      clearTimeout(timeout);

      if (!response.ok) {
        const body = await response.text().catch(() => '');
        console.error('[ChatWidget] API error:', response.status, body);
        throw new Error(`HTTP ${response.status}`);
      }

      const data: WidgetApiResponse = await response.json();
      if (!data.reply) {
        console.error('[ChatWidget] No reply in response:', data);
        throw new Error('No reply from API');
      }
      addMessage('assistant', data.reply);
    } catch (err: any) {
      // Only show error once, not on abort (user cancelled)
      if (err.name === 'AbortError') {
        setIsLoading(false);
        return;
      }
      console.error('[ChatWidget] send error:', err);
      setError(GENERIC_ERROR);
      // Prevent stacking duplicate errors when user retries
      const history = getHistorySlice();
      const lastMsg = history[history.length - 1];
      if (!lastMsg || lastMsg.role !== 'assistant' || lastMsg.content !== GENERIC_ERROR) {
        addMessage('assistant', GENERIC_ERROR);
      }
    } finally {
      setIsLoading(false);
    }
  }

  return { send, isLoading, error };
}
