'use client';

import { useRef, type KeyboardEvent } from 'react';

interface ChatInputProps {
  onSend: (message: string) => void;
  isLoading: boolean;
  isExpanded?: boolean;
}

export function ChatInput({ onSend, isLoading, isExpanded }: ChatInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  function handleKeyDown(e: KeyboardEvent<HTMLTextAreaElement>): void {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      submit();
    }
  }

  function submit(): void {
    const value = textareaRef.current?.value.trim() ?? '';
    if (!value || isLoading) return;
    onSend(value);
    if (textareaRef.current) textareaRef.current.value = '';
  }

  return (
    <div className={`flex items-end gap-3 border-t border-gray-200 dark:border-zinc-700 ${isExpanded ? 'p-5' : 'p-3'}`}>
      <textarea
        ref={textareaRef}
        rows={1}
        placeholder="Escribí tu mensaje..."
        onKeyDown={handleKeyDown}
        disabled={isLoading}
        autoFocus
        className={`flex-1 resize-none rounded-2xl border border-gray-200 dark:border-zinc-600 bg-gray-50 dark:bg-zinc-700/50 px-4 py-3 text-gray-800 dark:text-gray-100 placeholder-gray-400 dark:placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent/30 disabled:opacity-50 max-h-32 overflow-y-auto transition-colors ${isExpanded ? 'text-base py-4' : 'text-sm py-2.5'}`}
        style={{ scrollbarWidth: 'none' }}
      />
      <button
        type="button"
        onClick={submit}
        disabled={isLoading}
        className={`shrink-0 rounded-2xl bg-accent hover:bg-accent-bright font-semibold text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-accent/20 hover:shadow-accent/30 ${isExpanded ? 'px-6 py-4 text-base' : 'px-4 py-3 text-sm'}`}
      >
        {isLoading ? (
          <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
          </svg>
        ) : (
          <span className="flex items-center gap-2">
            Enviar
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M22 2L11 13" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M22 2L15 22 11 13 2 9l20-7z" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </span>
        )}
      </button>
    </div>
  );
}