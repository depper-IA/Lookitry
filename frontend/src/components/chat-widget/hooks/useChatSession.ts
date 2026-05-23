'use client';

import { useState, useRef, useEffect } from 'react';
import type { Message } from '../chat-widget.types';

const MAX_HISTORY = 10;
const SESSION_KEY = 'rebecca_session_id';

interface UseChatSessionReturn {
  sessionId: string;
  messages: Message[];
  addMessage: (role: Message['role'], content: string) => void;
  clearMessages: () => void;
  getHistorySlice: () => Message[];
  isLoading: boolean;
}

// Generar o recuperar sessionId persistente
function getSessionId(): string {
  if (typeof window === 'undefined') return crypto.randomUUID();
  
  let sessionId = localStorage.getItem(SESSION_KEY);
  if (!sessionId) {
    sessionId = crypto.randomUUID();
    localStorage.setItem(SESSION_KEY, sessionId);
  }
  return sessionId;
}

// Cargar historial desde backend
async function loadHistory(sessionId: string): Promise<Message[]> {
  try {
    const apiBase = process.env.NEXT_PUBLIC_API_URL ?? 'https://api.lookitry.com';
    const response = await fetch(`${apiBase}/api/chat/widget/history?session_id=${encodeURIComponent(sessionId)}`);
    
    if (!response.ok) return [];
    
    const data = await response.json();
    return data.messages || [];
  } catch {
    return [];
  }
}

// Guardar mensaje en backend
async function saveMessage(sessionId: string, role: 'user' | 'assistant', content: string): Promise<void> {
  try {
    const apiBase = process.env.NEXT_PUBLIC_API_URL ?? 'https://api.lookitry.com';
    await fetch(`${apiBase}/api/chat/widget/message`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ session_id: sessionId, role, content }),
    });
  } catch {
    // Non-critical: continue silently
  }
}

export function useChatSession(): UseChatSessionReturn {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const sessionIdRef = useRef<string>(getSessionId());

  // Cargar historial al iniciar
  useEffect(() => {
    let mounted = true;
    
    async function init() {
      const history = await loadHistory(sessionIdRef.current);
      if (mounted) {
        setMessages(history);
        setIsLoading(false);
      }
    }
    
    init();
    
    return () => {
      mounted = false;
    };
  }, []);

  function addMessage(role: Message['role'], content: string): void {
    const newMessage: Message = { role, content, timestamp: Date.now() };
    
    setMessages((prev) => [...prev, newMessage]);
    
    // Persistir en backend
    saveMessage(sessionIdRef.current, role, content);
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
    isLoading,
  };
}