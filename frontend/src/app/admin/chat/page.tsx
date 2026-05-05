'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { adminApi } from '@/services/adminApi';
import ConversationList from './components/ConversationList';
import ChatThread from './components/ChatThread';
import { Conversation } from './types';
import { MessageSquare } from 'lucide-react';

export default function ChatAdminPage() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchConversations();
  }, []);

  const fetchConversations = async () => {
    try {
      setLoading(true);
      const data = await adminApi.get<{ conversations: Conversation[] }>('/chat/conversations');
      setConversations(data.conversations || []);
    } catch (error) {
      console.error('Error fetching conversations:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className="flex flex-col h-[calc(100vh-120px)] space-y-4"
    >
      <div>
        <h1 className="font-jakarta text-2xl font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>
          Chat IA (MiniMax) & Humano
        </h1>
        <p className="mt-1 text-sm" style={{ color: 'var(--text-secondary)' }}>
          Supervisa y responde a las conversaciones de WhatsApp con los leads.
        </p>
      </div>

      <div className="flex flex-1 gap-4 overflow-hidden">
        {/* Sidebar: Conversation List */}
        <div className="w-1/3 flex flex-col bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl overflow-hidden">
          <div className="p-4 border-b border-[var(--border-color)] font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>
            Conversaciones Activas
          </div>
          {loading ? (
            <div className="p-4 text-center text-sm text-[var(--text-muted)]">Cargando...</div>
          ) : (
            <ConversationList
              conversations={conversations}
              selectedId={selectedId}
              onSelect={setSelectedId}
            />
          )}
        </div>

        {/* Main Content: Chat Thread */}
        <div className="w-2/3 flex flex-col">
          {selectedId ? (
            <ChatThread conversationId={selectedId} />
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl text-[var(--text-muted)]">
              <MessageSquare className="h-12 w-12 mb-4 opacity-50" />
              <p>Selecciona una conversación para ver los mensajes</p>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
