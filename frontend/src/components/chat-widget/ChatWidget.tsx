'use client';

import { useState, useCallback } from 'react';
import Image from 'next/image';
import { ChatWindow } from './ChatWindow';
import { ChatInvite } from './ChatInvite';
import { useChatSession } from './hooks/useChatSession';
import { useChatSend } from './hooks/useChatSend';

const WIDGET_ENABLED = process.env.NEXT_PUBLIC_REBECCA_WIDGET_ENABLED === 'true' || process.env.NODE_ENV === 'development';

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL ?? 'https://api.lookitry.com';

function ChatWidgetInner() {
  const [isOpen, setIsOpen] = useState(false);
  const { sessionId, messages, addMessage, getHistorySlice } = useChatSession();
  const { send, isLoading } = useChatSend({ sessionId, getHistorySlice, addMessage });

  // Handle rating from chat messages
  const handleRate = useCallback(async (rating: 'thumbs_up' | 'thumbs_down') => {
    // Get the last assistant message
    const lastAssistantMsg = [...messages].reverse().find(m => m.role === 'assistant');
    if (!lastAssistantMsg) return;

    try {
      await fetch(`${API_BASE}/api/chat/rating`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: sessionId,
          message_index: messages.filter(m => m.role === 'assistant').length - 1,
          message_content: lastAssistantMsg.content,
          rating: rating === 'thumbs_up' ? 5 : 2,
          rating_label: rating,
        }),
      });
    } catch (err) {
      console.error('[ChatWidget] Error sending rating:', err);
    }
  }, [sessionId, messages]);

  // Invite se muestra solo cuando el chat está cerrado
  const showInvite = !isOpen;

  if (isOpen) {
    return (
      <ChatWindow
        messages={messages}
        isLoading={isLoading}
        onSend={send}
        onClose={() => setIsOpen(false)}
        onRate={handleRate}
      />
    );
  }

  return (
    <>
      {/* Invite popup - aparece a los 5 segundos */}
      {showInvite && (
        <ChatInvite onAccept={() => setIsOpen(true)} />
      )}

      {/* Botón flotante */}
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        aria-label="Abrir chat con Rebecca"
        className="fixed bottom-[calc(env(safe-area-inset-bottom)+76px)] right-5 md:bottom-6 md:right-6 z-[9999] group focus:outline-none"
      >
        <span
          className="absolute inset-0 rounded-full bg-accent/20 scale-110 animate-ping group-hover:bg-accent/30"
          style={{ animationDuration: '2.4s' }}
          aria-hidden="true"
        />

        <span className="relative flex h-14 w-14 items-center justify-center rounded-full ring-[2.5px] ring-accent ring-offset-[3px] ring-offset-white dark:ring-offset-[#0a0a0a] shadow-[0_6px_24px_rgba(255,92,58,0.45)] hover:shadow-[0_8px_32px_rgba(255,92,58,0.6)] hover:scale-105 transition-all duration-200 overflow-hidden">
          <Image
            src="/rebecca-avatar.webp"
            alt="Rebecca — asesora Lookitry"
            width={56}
            height={56}
            className="object-cover object-top w-full h-full"
          />
        </span>

        <span
          className="absolute bottom-0.5 right-0.5 h-3.5 w-3.5 rounded-full bg-emerald-400 border-2 border-white dark:border-[#0a0a0a] z-10"
          aria-hidden="true"
        />
      </button>
    </>
  );
}

export function ChatWidget() {
  if (!WIDGET_ENABLED) return null;
  return <ChatWidgetInner />;
}