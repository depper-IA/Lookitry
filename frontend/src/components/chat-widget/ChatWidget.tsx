'use client';

import { useState } from 'react';
import Image from 'next/image';
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
      className="fixed bottom-6 right-6 z-[9999] flex items-center gap-3 rounded-2xl bg-white dark:bg-[#1a1a1a] pl-1 pr-4 py-1 shadow-[0_8px_32px_rgba(0,0,0,0.18)] hover:shadow-[0_12px_40px_rgba(255,92,58,0.25)] hover:-translate-y-0.5 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-accent/50 border border-black/[0.06] dark:border-white/[0.08]"
    >
      {/* Avatar con indicador online */}
      <div className="relative flex-shrink-0">
        <div className="h-11 w-11 rounded-xl overflow-hidden ring-2 ring-accent/20">
          <Image
            src="/rebecca-avatar.png"
            alt="Rebecca"
            width={44}
            height={44}
            className="object-cover object-[50%_5%] scale-125 w-full h-full"
          />
        </div>
        <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-emerald-400 border-2 border-white dark:border-[#1a1a1a]" aria-hidden="true" />
      </div>

      {/* Texto */}
      <div className="text-left leading-tight">
        <p className="text-[13px] font-bold text-dark dark:text-white tracking-tight">Hola, soy Rebecca</p>
        <p className="text-[11px] text-accent font-semibold">¿En qué te ayudo? →</p>
      </div>
    </button>
  );
}

export function ChatWidget() {
  if (!WIDGET_ENABLED) return null;
  return <ChatWidgetInner />;
}
