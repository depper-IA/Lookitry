import React from 'react';
import { Conversation } from '../types';
import StatusBadge from './StatusBadge';

interface Props {
  conversations: Conversation[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}

export default function ConversationList({ conversations, selectedId, onSelect }: Props) {
  if (conversations.length === 0) {
    return <div className="p-4 text-center text-[var(--text-muted)]">No hay conversaciones</div>;
  }

  return (
    <div className="flex flex-col gap-2 p-2 overflow-y-auto">
      {conversations.map((conv) => (
        <button
          key={conv.id}
          onClick={() => onSelect(conv.id)}
          className={`flex flex-col p-3 rounded-xl border text-left transition-colors ${
            selectedId === conv.id
              ? 'bg-[var(--accent)]/10 border-[var(--accent)]/30'
              : 'bg-[var(--bg-card)] border-[var(--border-color)] hover:bg-[var(--bg-hover)]'
          }`}
        >
          <div className="flex justify-between items-center w-full mb-2">
            <span className="font-semibold text-sm truncate" style={{ color: 'var(--text-primary)' }}>
              {conv.brands?.name || conv.platform_id}
            </span>
            <StatusBadge status={conv.status} />
          </div>
          <div className="flex justify-between items-center w-full text-xs" style={{ color: 'var(--text-muted)' }}>
            <span>{conv.source}</span>
            <span>{new Date(conv.updated_at).toLocaleDateString()}</span>
          </div>
        </button>
      ))}
    </div>
  );
}
