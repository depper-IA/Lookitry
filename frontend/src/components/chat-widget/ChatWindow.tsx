'use client';

import { useEffect, useRef } from 'react';
import Image from 'next/image';
import { ChatMessage } from './ChatMessage';
import { ChatInput } from './ChatInput';
import type { Message } from './chat-widget.types';

const WELCOME_MESSAGE = 'Hola! Soy Rebecca, asesora de Lookitry. ¿En qué puedo ayudarte?';

interface ChatWindowProps {
  messages: Message[];
  isLoading: boolean;
  onSend: (message: string) => void;
  onClose: () => void;
}

export function ChatWindow({ messages, isLoading, onSend, onClose }: ChatWindowProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <div className="fixed bottom-6 right-6 z-[9999] flex w-80 flex-col rounded-2xl shadow-2xl overflow-hidden border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800"
      style={{ height: '480px' }}>
      <header className="flex items-center justify-between bg-accent px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="relative flex-shrink-0">
            <div className="h-10 w-10 rounded-xl overflow-hidden ring-2 ring-white/30">
              <Image
                src="/rebecca-avatar.png"
                alt="Rebecca"
                width={40}
                height={40}
                className="object-cover object-top w-full h-full"
              />
            </div>
            <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-emerald-400 border-2 border-accent" aria-hidden="true" />
          </div>
          <div className="leading-tight">
            <p className="text-sm font-bold text-white tracking-tight">Rebecca</p>
            <p className="text-[11px] text-white/70">Asesora de Lookitry</p>
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Cerrar chat"
          className="text-white/80 hover:text-white transition-colors"
        >
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </header>

      <div className="flex-1 overflow-y-auto p-3 space-y-1" style={{ scrollbarWidth: 'none' }}>
        {messages.length === 0 && (
          <div className="flex justify-start mb-2">
            <div className="max-w-[75%] rounded-2xl rounded-bl-sm bg-gray-100 dark:bg-zinc-700 px-3 py-2 text-sm leading-relaxed text-gray-800 dark:text-gray-100">
              {WELCOME_MESSAGE}
            </div>
          </div>
        )}
        {messages.map((msg) => (
          <ChatMessage key={msg.timestamp} message={msg} />
        ))}
        {isLoading && (
          <div className="flex justify-start mb-2">
            <div className="rounded-2xl rounded-bl-sm bg-gray-100 dark:bg-zinc-700 px-3 py-2">
              <span className="flex gap-1">
                {[0, 150, 300].map((delay) => (
                  <span
                    key={delay}
                    className="h-1.5 w-1.5 rounded-full bg-gray-400 dark:bg-zinc-400 animate-bounce"
                    style={{ animationDelay: `${delay}ms` }}
                  />
                ))}
              </span>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <ChatInput onSend={onSend} isLoading={isLoading} />
    </div>
  );
}
