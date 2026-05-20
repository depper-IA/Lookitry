'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { Maximize2, Minimize2, X } from 'lucide-react';
import { ChatMessage } from './ChatMessage';
import { ChatInput } from './ChatInput';
import type { Message } from './chat-widget.types';

const WELCOME_MESSAGE = '¡Hola! Soy Rebecca, asesora de Lookitry. Estoy aquí para ayudarte a vender más y a que te olvides de los dolores de cabeza con las devoluciones. ¿En qué puedo ayudarte hoy?';

interface ChatWindowProps {
  messages: Message[];
  isLoading: boolean;
  onSend: (message: string) => void;
  onClose: () => void;
}

export function ChatWindow({ messages, isLoading, onSend, onClose }: ChatWindowProps) {
  const bottomRef = useRef<HTMLDivElement>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isOpening, setIsOpening] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleBackdropClick = () => onClose();

  const handleCloseExpanded = () => {
    setIsExpanded(false);
  };

  if (isExpanded) {
    return (
      <>
        {/* Backdrop oscuro con transition */}
        <div
          className={`fixed inset-0 z-[9998] bg-black/50 backdrop-blur-sm transition-opacity duration-200 ${isOpening ? 'opacity-0' : 'opacity-100'}`}
          onClick={handleBackdropClick}
          aria-hidden="true"
        />

        {/* Modal centrado elegante */}
        <div
          className={`fixed left-1/2 top-1/2 z-[9999] -translate-x-1/2 -translate-y-1/2 w-[90vw] max-w-[600px] h-[85vh] max-h-[700px] rounded-3xl shadow-[0_25px_50px_-12px_rgba(0,0,0,0.5)] border border-gray-200/30 bg-white dark:bg-zinc-800 overflow-hidden flex flex-col transition-all duration-300 ${isOpening ? 'scale-95 opacity-0' : 'scale-100 opacity-100'}`}
          role="dialog"
          aria-modal="true"
          aria-label="Chat con Rebecca"
        >
          {/* Header */}
          <header className="flex items-center justify-between bg-accent px-6 py-5 flex-shrink-0">
            <div className="flex items-center gap-4">
              <div className="relative flex-shrink-0">
                <div className="h-14 w-14 rounded-2xl overflow-hidden ring-2 ring-white/30 shadow-lg">
                  <Image
                    src="/rebecca-avatar.png"
                    alt="Rebecca"
                    width={56}
                    height={56}
                    className="object-cover object-top w-full h-full"
                  />
                </div>
                <span className="absolute -bottom-1 -right-1 h-4 w-4 rounded-full bg-emerald-400 border-2 border-accent" aria-hidden="true" />
              </div>
              <div className="leading-tight">
                <p className="font-bold text-white tracking-tight text-lg">Rebecca</p>
                <p className="text-white/70 text-sm">Asesora de Lookitry</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleCloseExpanded}
                aria-label="Reducir chat"
                className="text-white/80 hover:text-white transition-colors p-2.5 rounded-xl hover:bg-white/10"
              >
                <Minimize2 size={22} />
              </button>
              <button
                type="button"
                onClick={() => {
                  handleCloseExpanded();
                  setTimeout(() => onClose(), 200);
                }}
                aria-label="Cerrar chat"
                className="text-white/80 hover:text-white transition-colors p-2.5 rounded-xl hover:bg-white/10"
              >
                <X size={22} />
              </button>
            </div>
          </header>

          {/* Mensajes */}
          <div className="flex-1 overflow-y-auto p-6 space-y-3 text-lg" style={{ scrollbarWidth: 'thin' }}>
            {messages.length === 0 && (
              <div className="flex justify-start">
                <div className="max-w-[85%] rounded-2xl rounded-bl-sm bg-gray-100 dark:bg-zinc-700 px-5 py-4 leading-relaxed text-gray-800 dark:text-gray-100 text-base">
                  {WELCOME_MESSAGE}
                </div>
              </div>
            )}
            {messages.map((msg) => (
              <ChatMessage key={msg.timestamp} message={msg} isExpanded={true} />
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="rounded-2xl rounded-bl-sm bg-gray-100 dark:bg-zinc-700 px-5 py-4">
                  <span className="flex gap-2">
                    {[0, 150, 300].map((delay) => (
                      <span
                        key={delay}
                        className="h-3 w-3 rounded-full bg-gray-400 dark:bg-zinc-400 animate-bounce"
                        style={{ animationDelay: `${delay}ms` }}
                      />
                    ))}
                  </span>
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <ChatInput onSend={onSend} isLoading={isLoading} isExpanded={true} />
        </div>
      </>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 z-[9999] flex flex-col rounded-2xl shadow-2xl overflow-hidden border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 transition-all duration-300 w-80" style={{ height: '480px' }}>
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
            <p className="font-bold text-white tracking-tight text-sm">Rebecca</p>
            <p className="text-white/70 text-[11px]">Asesora de Lookitry</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={handleOpenExpanded}
            aria-label="Ampliar chat"
            className="text-white/80 hover:text-white transition-colors p-1.5 rounded-lg hover:bg-white/10"
          >
            <Maximize2 size={18} />
          </button>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar chat"
            className="text-white/80 hover:text-white transition-colors p-1.5 rounded-lg hover:bg-white/10 ml-1"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-3 space-y-1" style={{ scrollbarWidth: 'none' }}>
        {messages.length === 0 && (
          <div className="flex justify-start mb-2">
            <div className="max-w-[75%] rounded-2xl rounded-bl-sm bg-gray-100 dark:bg-zinc-700 px-3 py-2 leading-relaxed text-gray-800 dark:text-gray-100 text-sm">
              {WELCOME_MESSAGE}
            </div>
          </div>
        )}
        {messages.map((msg) => (
          <ChatMessage key={msg.timestamp} message={msg} isExpanded={false} />
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

      <ChatInput onSend={onSend} isLoading={isLoading} isExpanded={false} />
    </div>
  );
}