'use client';

import { useState } from 'react';
import type { Message, WidgetApiResponse } from '../chat-widget.types';

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE ?? 'https://api.lookitry.com';

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

    try {
      const response = await fetch(`${API_BASE}/api/chat/widget`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: sessionId,
          message: userMessage,
          history,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data: WidgetApiResponse = await response.json();
      addMessage('assistant', data.reply);
    } catch {
      setError(GENERIC_ERROR);
      addMessage('assistant', GENERIC_ERROR);
    } finally {
      setIsLoading(false);
    }
  }

  return { send, isLoading, error };
}
