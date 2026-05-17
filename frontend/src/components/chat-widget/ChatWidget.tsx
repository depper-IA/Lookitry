'use client';

import { useState } from 'react';
import { ChatWindow } from './ChatWindow';
import { useChatSession } from './hooks/useChatSession';
import { useChatSend } from './hooks/useChatSend';

const WIDGET_ENABLED = process.env.NEXT_PUBLIC_REBECCA_WIDGET_ENABLED === 'true';

function ChatWidgetInner() {
  const [isOpen, setIsOpen] = useState(false);
  const { sessionId, messages, addMessage, getHistorySlice } = useChatSession();
  const { send, isLoading } = useChatSend({ sessionId, getHistorySlice, addMessage });

  if (isOpen) {
    return (
      <ChatWindow
        messages={messages}
        isLoading={isLoading}
        onSend={send}
        onClose={() => setIsOpen(false)}
      />
    );
  }

  return (
    <button
      type="button"
      onClick={() => setIsOpen(true)}
      aria-label="Abrir chat con Rebecca"
      className="fixed bottom-6 right-6 z-[9999] flex h-14 w-14 items-center justify-center rounded-full bg-accent text-white shadow-lg hover:bg-accent-bright transition-colors focus:outline-none focus:ring-2 focus:ring-accent/50 focus:ring-offset-2"
    >
      <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path
          d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </button>
  );
}

export function ChatWidget() {
  if (!WIDGET_ENABLED) return null;
  return <ChatWidgetInner />;
}
