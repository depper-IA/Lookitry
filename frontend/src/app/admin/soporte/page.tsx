'use client';

import { useEffect, useState } from 'react';
import { Mail, MessageCircle, Send, Search, Filter, Clock, CheckCircle, XCircle, AlertTriangle, RefreshCw, User, Building2, FileText } from 'lucide-react';
import { motion } from 'framer-motion';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.lookitry.com';

interface SupportTicket {
  id: string;
  brand_id: string;
  brand_name: string;
  brand_email: string;
  type: 'refund' | 'support' | 'billing' | 'other';
  subject: string;
  message: string;
  status: 'pending' | 'in_progress' | 'resolved' | 'rejected';
  created_at: string;
  updated_at: string;
  admin_response?: string;
  resolved_at?: string;
}

interface BrandEmail {
  brand_id: string;
  brand_name: string;
  brand_email: string;
  subject: string;
  body: string;
  sent_at: string;
}

type FilterStatus = 'all' | 'pending' | 'in_progress' | 'resolved' | 'rejected';
type FilterType = 'all' | 'refund' | 'support' | 'billing' | 'other';

export default function AdminSoportePage() {
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [responseText, setResponseText] = useState('');
  const [sending, setSending] = useState(false);
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all');
  const [filterType, setFilterType] = useState<FilterType>('all');
  const [searchTerm, setSearchTerm] = useState('');
  
  // Email modal
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [emailForm, setEmailForm] = useState({ brandId: '', brandEmail: '', subject: '', body: '' });
  const [sendingEmail, setSendingEmail] = useState(false);

  const fetchTickets = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/admin/support/tickets`, { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        setTickets(data.tickets || []);
      }
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchTickets(); }, []);

  const filteredTickets = tickets.filter(t => {
    if (filterStatus !== 'all' && t.status !== filterStatus) return false;
    if (filterType !== 'all' && t.type !== filterType) return false;
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      return t.brand_name.toLowerCase().includes(term) || t.subject.toLowerCase().includes(term);
    }
    return true;
  });

  const handleSendResponse = async () => {
    if (!selectedTicket || !responseText.trim()) return;
    setSending(true);
    try {
      const res = await fetch(`${API_URL}/api/admin/support/tickets/${selectedTicket.id}/respond`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ response: responseText }),
      });
      if (res.ok) {
        alert('Respuesta enviada');
        setResponseText('');
        fetchTickets();
      }
    } catch (e) { alert('Error al enviar'); }
    finally { setSending(false); }
  };

  const handleResolveTicket = async (ticketId: string) => {
    try {
      const res = await fetch(`${API_URL}/api/admin/support/tickets/${ticketId}/resolve`, {
        method: 'POST',
        credentials: 'include',
      });
      if (res.ok) fetchTickets();
    } catch (e) { console.error(e); }
  };

  const handleSendEmail = async () => {
    if (!emailForm.brandId || !emailForm.subject || !emailForm.body) return;
    setSendingEmail(true);
    try {
      const res = await fetch(`${API_URL}/api/admin/support/send-email`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(emailForm),
      });
      if (res.ok) {
        alert('Email enviado');
        setShowEmailModal(false);
        setEmailForm({ brandId: '', brandEmail: '', subject: '', body: '' });
      }
    } catch (e) { alert('Error al enviar'); }
    finally { setSendingEmail(false); }
  };

  const statusColors = {
    pending: { bg: 'rgba(245,158,11,0.12)', text: '#f59e0b', label: 'Pendiente' },
    in_progress: { bg: 'rgba(59,130,246,0.12)', text: '#3b82f6', label: 'En progreso' },
    resolved: { bg: 'rgba(16,185,129,0.12)', text: '#10b981', label: 'Resuelto' },
    rejected: { bg: 'rgba(239,68,68,0.12)', text: '#ef4444', label: 'Rechazado' },
  };

  const typeLabels = {
    refund: 'Reembolso',
    support: 'Soporte técnico',
    billing: 'Facturación',
    other: 'Otro',
  };

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, ease: 'easeOut' }} className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-jakarta font-bold tracking-tight text-2xl" style={{ color: 'var(--text-primary)' }}>Soporte</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>Gestiona tickets de ayuda y comunica con tus clientes</p>
        </div>
        <button
          onClick={() => setShowEmailModal(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#FF5C3A] text-white text-sm font-semibold hover:bg-[#e04e30] transition-colors"
        >
          <Mail className="w-4 h-4" />
          Enviar email
        </button>
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--text-muted)' }} />
          <input
            type="text"
            placeholder="Buscar por marca o asunto..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-xl text-sm"
            style={{ backgroundColor: 'var(--bg-input)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
          />
        </div>
        <select
          value={filterStatus}
          onChange={e => setFilterStatus(e.target.value as FilterStatus)}
          className="px-3 py-2 rounded-xl text-sm"
          style={{ backgroundColor: 'var(--bg-input)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
        >
          <option value="all">Todos los estados</option>
          <option value="pending">Pendiente</option>
          <option value="in_progress">En progreso</option>
          <option value="resolved">Resuelto</option>
          <option value="rejected">Rechazado</option>
        </select>
        <select
          value={filterType}
          onChange={e => setFilterType(e.target.value as FilterType)}
          className="px-3 py-2 rounded-xl text-sm"
          style={{ backgroundColor: 'var(--bg-input)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
        >
          <option value="all">Todos los tipos</option>
          <option value="refund">Reembolso</option>
          <option value="support">Soporte</option>
          <option value="billing">Facturación</option>
          <option value="other">Otro</option>
        </select>
      </div>

      {/* Lista de tickets */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 rounded-[2rem] p-5" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
          <h2 className="font-jakarta font-bold text-sm mb-4" style={{ color: 'var(--text-primary)' }}>Tickets ({filteredTickets.length})</h2>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-8 h-8 rounded-full border-2 animate-spin" style={{ borderColor: '#FF5C3A', borderTopColor: 'transparent' }} />
            </div>
          ) : filteredTickets.length === 0 ? (
            <p className="text-center py-8" style={{ color: 'var(--text-muted)' }}>No hay tickets</p>
          ) : (
            <div className="space-y-2">
              {filteredTickets.map(ticket => (
                <div
                  key={ticket.id}
                  onClick={() => setSelectedTicket(ticket)}
                  className={`p-4 rounded-xl cursor-pointer transition-all ${selectedTicket?.id === ticket.id ? 'ring-2 ring-[#FF5C3A]' : 'hover:bg-[var(--bg-hover)]'}`}
                  style={{ backgroundColor: 'var(--bg-base)', border: '1px solid var(--border-color)' }}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-semibold`} style={{ backgroundColor: statusColors[ticket.status].bg, color: statusColors[ticket.status].text }}>
                          {statusColors[ticket.status].label}
                        </span>
                        <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{typeLabels[ticket.type]}</span>
                      </div>
                      <p className="text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>{ticket.subject}</p>
                      <p className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>{ticket.brand_name}</p>
                    </div>
                    <span className="text-xs whitespace-nowrap" style={{ color: 'var(--text-muted)' }}>
                      {new Date(ticket.created_at).toLocaleDateString('es-CO')}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Detalle del ticket */}
        <div className="rounded-[2rem] p-5" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
          {selectedTicket ? (
            <div className="space-y-4">
              <div>
                <h3 className="font-jakarta font-bold text-sm" style={{ color: 'var(--text-primary)' }}>{selectedTicket.subject}</h3>
                <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                  De: {selectedTicket.brand_name} ({selectedTicket.brand_email})
                </p>
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                  Fecha: {new Date(selectedTicket.created_at).toLocaleString('es-CO')}
                </p>
              </div>
              <div className="p-3 rounded-xl" style={{ backgroundColor: 'var(--bg-base)' }}>
                <p className="text-sm whitespace-pre-wrap" style={{ color: 'var(--text-primary)' }}>{selectedTicket.message}</p>
              </div>
              {selectedTicket.admin_response && (
                <div className="p-3 rounded-xl" style={{ backgroundColor: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)' }}>
                  <p className="text-xs font-semibold text-emerald-500 mb-1">Respuesta:</p>
                  <p className="text-sm whitespace-pre-wrap" style={{ color: 'var(--text-primary)' }}>{selectedTicket.admin_response}</p>
                </div>
              )}
              <div className="border-t pt-4" style={{ borderColor: 'var(--border-color)' }}>
                <textarea
                  value={responseText}
                  onChange={e => setResponseText(e.target.value)}
                  placeholder="Escribe tu respuesta..."
                  className="w-full px-3 py-2 rounded-xl text-sm resize-none"
                  style={{ backgroundColor: 'var(--bg-input)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
                  rows={4}
                />
                <div className="flex gap-2 mt-2">
                  <button
                    onClick={handleSendResponse}
                    disabled={sending || !responseText.trim()}
                    className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-semibold bg-[#FF5C3A] text-white disabled:opacity-50"
                  >
                    {sending ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                    Enviar
                  </button>
                  {selectedTicket.status !== 'resolved' && (
                    <button
                      onClick={() => handleResolveTicket(selectedTicket.id)}
                      className="flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-semibold"
                      style={{ backgroundColor: 'rgba(16,185,129,0.12)', color: '#10b981' }}
                    >
                      <CheckCircle className="w-4 h-4" />
                      Resolver
                    </button>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <p className="text-center py-8" style={{ color: 'var(--text-muted)' }}>Selecciona un ticket para ver los detalles</p>
          )}
        </div>
      </div>

      {/* Modal enviar email */}
      {showEmailModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="rounded-[2rem] p-6 max-w-lg w-full" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
            <h2 className="font-jakarta font-bold text-xl mb-4" style={{ color: 'var(--text-primary)' }}>Enviar email a cliente</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--text-secondary)' }}>Marca</label>
                <select
                  value={emailForm.brandId}
                  onChange={e => {
                    const brand = tickets.find(t => t.brand_id === e.target.value);
                    setEmailForm({ ...emailForm, brandId: e.target.value, brandEmail: brand?.brand_email || '' });
                  }}
                  className="w-full px-3 py-2 rounded-xl text-sm"
                  style={{ backgroundColor: 'var(--bg-input)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
                >
                  <option value="">Seleccionar marca...</option>
                  {tickets.map(t => (
                    <option key={t.brand_id} value={t.brand_id}>{t.brand_name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--text-secondary)' }}>Asunto</label>
                <input
                  type="text"
                  value={emailForm.subject}
                  onChange={e => setEmailForm({ ...emailForm, subject: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl text-sm"
                  style={{ backgroundColor: 'var(--bg-input)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--text-secondary)' }}>Mensaje</label>
                <textarea
                  value={emailForm.body}
                  onChange={e => setEmailForm({ ...emailForm, body: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl text-sm resize-none"
                  style={{ backgroundColor: 'var(--bg-input)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
                  rows={6}
                />
              </div>
            </div>
            <div className="flex gap-2 mt-6">
              <button
                onClick={() => setShowEmailModal(false)}
                className="flex-1 px-4 py-2 rounded-xl text-sm font-semibold"
                style={{ backgroundColor: 'var(--bg-base)', color: 'var(--text-primary)', border: '1px solid var(--border-color)' }}
              >
                Cancelar
              </button>
              <button
                onClick={handleSendEmail}
                disabled={sendingEmail || !emailForm.brandId || !emailForm.subject || !emailForm.body}
                className="flex-1 px-4 py-2 rounded-xl text-sm font-semibold bg-[#FF5C3A] text-white disabled:opacity-50"
              >
                {sendingEmail ? 'Enviando...' : 'Enviar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
}
