'use client';

import type { Message } from './chat-widget.types';

interface ChatMessageProps {
  message: Message;
  isExpanded?: boolean;
}

function renderContentWithLinks(content: string): React.ReactNode {
  const linkRegex = /\[([^\]]+)\]\((https?:\/\/[^)]+)\)/g;
  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  let match;

  while ((match = linkRegex.exec(content)) !== null) {
    if (match.index > lastIndex) {
      parts.push(content.slice(lastIndex, match.index));
    }

    const href = match[2];
    const isInternal = href.startsWith('https://lookitry.com') || href.startsWith('/');

    parts.push(
      <a
        key={match.index}
        href={href}
        target={isInternal ? '_self' : '_blank'}
        rel={isInternal ? undefined : 'noopener noreferrer'}
        className="text-accent hover:underline"
      >
        {match[1]}
      </a>
    );
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < content.length) {
    parts.push(content.slice(lastIndex));
  }

  return parts.length > 0 ? parts : content;
}

export function ChatMessage({ message, isExpanded }: ChatMessageProps) {
  const isUser = message.role === 'user';

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-2`}>
      <div
        className={`max-w-[75%] rounded-2xl leading-relaxed ${
          isUser
            ? 'bg-accent text-white rounded-br-sm'
            : 'bg-gray-100 text-gray-800 rounded-bl-sm dark:bg-zinc-700 dark:text-gray-100'
        } ${isExpanded ? 'text-base px-4 py-3' : 'text-sm px-3 py-2'}`}
      >
        {renderContentWithLinks(message.content)}
      </div>
    </div>
  );
}