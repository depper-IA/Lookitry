'use client';

import { useRef, type KeyboardEvent } from 'react';

interface ChatInputProps {
  onSend: (message: string) => void;
  isLoading: boolean;
}

export function ChatInput({ onSend, isLoading }: ChatInputProps) {
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
    <div className="flex items-end gap-2 border-t border-gray-200 dark:border-zinc-700 p-3">
      <textarea
        ref={textareaRef}
        rows={1}
        placeholder="Escribí tu mensaje..."
        onKeyDown={handleKeyDown}
        disabled={isLoading}
        className="flex-1 resize-none rounded-xl border border-gray-200 dark:border-zinc-600 bg-white dark:bg-zinc-800 px-3 py-2 text-sm text-gray-800 dark:text-gray-100 placeholder-gray-400 dark:placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-accent/50 disabled:opacity-50 max-h-24 overflow-y-auto"
        style={{ scrollbarWidth: 'none' }}
      />
      <button
        type="button"
        onClick={submit}
        disabled={isLoading}
        className="shrink-0 rounded-xl bg-accent px-3 py-2 text-sm font-medium text-white hover:bg-accent-bright transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isLoading ? (
          <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
          </svg>
        ) : (
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M22 2L11 13" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M22 2L15 22 11 13 2 9l20-7z" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </button>
    </div>
  );
}
