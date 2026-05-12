import React, { useState, useEffect, useRef } from 'react';
import { adminApi } from '@/services/adminApi';
import { Message } from '../types';
import { Send, User, Bot, ShieldAlert } from 'lucide-react';

interface Props {
  conversationId: string;
}

export default function ChatThread({ conversationId }: Props) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [reply, setReply] = useState('');
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchMessages();
    // In a real app, you might want to setup polling or WebSockets here
  }, [conversationId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const fetchMessages = async () => {
    try {
      setLoading(true);
      const data = await adminApi.get<{ messages: Message[] }>(`/chat/conversations/${conversationId}`);
      setMessages(data.messages || []);
    } catch (error) {
      console.error('Error fetching messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reply.trim()) return;

    try {
      setSending(true);
      const data = await adminApi.post<{ success: boolean; message: Message }>(`/chat/conversations/${conversationId}/reply`, {
        content: reply
      });
      
      if (data.success && data.message) {
        setMessages([...messages, data.message]);
        setReply('');
      }
    } catch (error) {
      console.error('Error sending reply:', error);
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-full text-[var(--text-muted)]">Cargando mensajes...</div>;
  }

  return (
    <div className="flex flex-col h-full bg-[var(--bg-card)] rounded-2xl border border-[var(--border-color)] overflow-hidden">
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="text-center text-[var(--text-muted)] mt-10">No hay mensajes en esta conversación</div>
        ) : (
          messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${msg.sender_type === 'lead' ? 'justify-start' : 'justify-end'}`}
            >
              <div
                className={`max-w-[70%] p-3 rounded-2xl flex flex-col gap-1 ${
                  msg.sender_type === 'lead'
                    ? 'bg-[var(--bg-hover)] text-[var(--text-primary)] rounded-tl-none'
                    : msg.sender_type === 'bot'
                    ? 'bg-blue-100 text-blue-900 border border-blue-200 rounded-tr-none'
                    : 'bg-[var(--accent)] text-white rounded-tr-none'
                }`}
              >
                <div className="flex items-center gap-1.5 text-xs opacity-70 mb-1">
                  {msg.sender_type === 'lead' && <User size={12} />}
                  {msg.sender_type === 'bot' && <Bot size={12} />}
                  {msg.sender_type === 'agent' && <ShieldAlert size={12} />}
                  <span className="font-semibold capitalize">{msg.sender_type}</span>
                </div>
                <p className="text-sm whitespace-pre-wrap break-words">{msg.content}</p>
                <span className="text-[10px] text-right opacity-60 mt-1">
                  {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>
      
      <div className="p-3 border-t border-[var(--border-color)] bg-[var(--bg-body)]">
        <form onSubmit={handleSend} className="flex gap-2">
          <input
            type="text"
            value={reply}
            onChange={(e) => setReply(e.target.value)}
            placeholder="Escribe un mensaje como agente humano..."
            className="flex-1 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-[var(--accent)]"
            disabled={sending}
          />
          <button
            type="submit"
            disabled={!reply.trim() || sending}
            className="bg-[var(--accent)] text-white p-2.5 rounded-xl hover:opacity-90 disabled:opacity-50 transition-opacity flex items-center justify-center"
          >
            <Send size={18} />
          </button>
        </form>
      </div>
    </div>
  );
}
