'use client';

import { useState, useRef } from 'react';
import type { Message } from '../chat-widget.types';

const MAX_HISTORY = 10;

interface UseChatSessionReturn {
  sessionId: string;
  messages: Message[];
  addMessage: (role: Message['role'], content: string) => void;
  clearMessages: () => void;
  getHistorySlice: () => Message[];
}

export function useChatSession(): UseChatSessionReturn {
  const sessionIdRef = useRef<string>(crypto.randomUUID());
  const [messages, setMessages] = useState<Message[]>([]);

  function addMessage(role: Message['role'], content: string): void {
    setMessages((prev) => [
      ...prev,
      { role, content, timestamp: Date.now() },
    ]);
  }

  function clearMessages(): void {
    setMessages([]);
  }

  function getHistorySlice(): Message[] {
    return messages.slice(-MAX_HISTORY);
  }

  return {
    sessionId: sessionIdRef.current,
    messages,
    addMessage,
    clearMessages,
    getHistorySlice,
  };
}
