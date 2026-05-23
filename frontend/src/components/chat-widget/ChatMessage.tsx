'use client';

import { useState, useEffect } from 'react';
import type { Message } from './chat-widget.types';

interface ChatMessageProps {
  message: Message;
  isExpanded?: boolean;
  onRate?: (rating: 'thumbs_up' | 'thumbs_down') => void;
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

export function ChatMessage({ message, isExpanded, onRate }: ChatMessageProps) {
  const isUser = message.role === 'user';
  const [showRatings, setShowRatings] = useState(false);
  const [rated, setRated] = useState(false);

  // Show rating buttons after a delay for assistant messages
  useEffect(() => {
    if (!isUser && onRate) {
      const timer = setTimeout(() => setShowRatings(true), 2000);
      return () => clearTimeout(timer);
    }
  }, [isUser, onRate]);

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
        
        {/* Rating buttons for assistant messages */}
        {!isUser && onRate && showRatings && !rated && (
          <div className="flex items-center gap-1 mt-2 pt-2 border-t border-gray-200/50">
            <button
              onClick={() => { setRated(true); onRate('thumbs_down'); }}
              className="text-gray-400 hover:text-red-500 transition-colors p-1 rounded"
              aria-label="Respuesta no útil"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14H5.236a2 2 0 01-1.94-1.56L2.16 5.636a2 2 0 012.16-2.56h4.5a2 2 0 012 1.36 2 2 0 00.65 1.86v5.1a2 2 0 01-.65 1.36L4 14.236a2 2 0 01-1.56-1.94L3.16 6.6a2 2 0 012-1.36h.5a2 2 0 001.94.56L11 9" />
              </svg>
            </button>
            <button
              onClick={() => { setRated(true); onRate('thumbs_up'); }}
              className="text-gray-400 hover:text-emerald-500 transition-colors p-1 rounded"
              aria-label="Respuesta útil"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10h4.764a2 2 0 011.789 1.11L19 16v2a2 2 0 01-2 2h-3M5 8h2.586a1 1 0 01.707.293l2.414 2.414a1 1 0 00.293.707V15a1 1 0 01-1 1H5a1 1 0 01-1-1v-2a1 1 0 00-1-1H4a1 1 0 00-.707-.293L1.293 9.707A1 1 0 012 9h2" />
              </svg>
            </button>
            {rated && <span className="text-xs text-gray-400 ml-1">Gracias</span>}
          </div>
        )}
      </div>
    </div>
  );
}