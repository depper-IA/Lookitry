'use client';

import { useState, useEffect } from 'react';
import { X } from 'lucide-react';

const INVITE_DELAY_MS = 5000;
const STORAGE_KEY = 'rebecca_invite_dismissed';

interface ChatInviteProps {
  onAccept: () => void;
}

export function ChatInvite({ onAccept }: ChatInviteProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Solo mostrar si no fue rechazado antes
    const dismissed = sessionStorage.getItem(STORAGE_KEY);
    if (dismissed) return;

    const timer = setTimeout(() => {
      setIsVisible(true);
    }, INVITE_DELAY_MS);

    return () => clearTimeout(timer);
  }, []);

  const handleDismiss = () => {
    sessionStorage.setItem(STORAGE_KEY, '1');
    setIsVisible(false);
  };

  const handleAccept = () => {
    sessionStorage.setItem(STORAGE_KEY, '1');
    setIsVisible(false);
    onAccept();
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-[calc(env(safe-area-inset-bottom)+140px)] right-5 md:right-6 z-[9998] animate-in fade-in slide-in-from-bottom-2 duration-300">
      <div className="relative bg-white dark:bg-zinc-800 rounded-2xl shadow-xl border border-gray-100 dark:border-zinc-700 p-4 w-72">
        {/* Flecha pointing down */}
        <div className="absolute -bottom-2 right-8 md:right-8 w-4 h-4 rotate-45 bg-white dark:bg-zinc-800 border-r border-b border-gray-100 dark:border-zinc-700" aria-hidden="true" />

        {/* Header */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-2">
            <span className="text-2xl" role="img" aria-label="wave">👋</span>
            <p className="font-semibold text-gray-900 dark:text-gray-100 text-sm">
              ¿Tienes dudas?
            </p>
          </div>
          <button
            type="button"
            onClick={handleDismiss}
            aria-label="Cerrar"
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors p-0.5 -mr-1 -mt-0.5"
          >
            <X size={16} />
          </button>
        </div>

        {/* Mensaje */}
        <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed mb-4">
          Estoy aquí para ayudarte con lo que necesites sobre nuestros servicios. ¿En qué te puedo ayudar?
        </p>

        {/* CTA */}
        <button
          type="button"
          onClick={handleAccept}
          className="w-full bg-accent hover:bg-accent/90 text-white font-medium text-sm py-2.5 px-4 rounded-xl transition-colors"
        >
          Chatear ahora
        </button>
      </div>
    </div>
  );
}