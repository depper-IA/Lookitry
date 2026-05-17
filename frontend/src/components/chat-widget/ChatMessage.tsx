'use client';

import type { Message } from './chat-widget.types';

interface ChatMessageProps {
  message: Message;
}

export function ChatMessage({ message }: ChatMessageProps) {
  const isUser = message.role === 'user';

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-2`}>
      <div
        className={`max-w-[75%] rounded-2xl px-3 py-2 text-sm leading-relaxed ${
          isUser
            ? 'bg-accent text-white rounded-br-sm'
            : 'bg-gray-100 text-gray-800 rounded-bl-sm dark:bg-zinc-700 dark:text-gray-100'
        }`}
      >
        {message.content}
      </div>
    </div>
  );
}
