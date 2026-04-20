'use client';

import { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { 
  Ticket, Plus, X, ChevronLeft, ChevronRight, 
  Clock, CheckCircle2, AlertTriangle, MessageSquare,
  Loader2, Send, Filter, Mail, Globe
} from 'lucide-react';
import { api } from '@/services/api';
import { useAuth } from '@/hooks/useAuth';
import { fetchPublicPaymentSettings, toWhatsAppUrl } from '@/services/public-config.service';

type TicketStatus = 'open' | 'in_progress' | 'resolved' | 'closed';
type TicketPriority = 'low' | 'medium' | 'high' | 'urgent';
type TicketCategory = 'technical' | 'billing' | 'feature_request' | 'bug' | 'other';

interface Ticket {
  id: string;
  subject: string;
  description: string;
  priority: TicketPriority;
  status: TicketStatus;
  category: TicketCategory;
  created_at: string;
  updated_at: string;
  resolved_at: string | null;
}

interface TicketStats {
  total_open: number;
  in_progress: number;
  resolved: number;
}

const STATUS_CONFIG: Record<TicketStatus, { bg: string; text: string; label: string }> = {
  open: { bg: 'rgba(245,158,11,0.12)', text: '#f59e0b', label: 'Abierto' },
  in_progress: { bg: 'rgba(59,130,246,0.12)', text: '#3b82f6', label: 'En Progreso' },
  resolved: { bg: 'rgba(16,185,129,0.12)', text: '#10b981', label: 'Resuelto' },
  closed: { bg: 'rgba(107,114,128,0.12)', text: '#6b7280', label: 'Cerrado' },
};

const PRIORITY_CONFIG: Record<TicketPriority, { bg: string; text: string; label: string }> = {
  low: { bg: 'rgba(107,114,128,0.12)', text: '#6b7280', label: 'Baja' },
  medium: { bg: 'rgba(59,130,246,0.12)', text: '#3b82f6', label: 'Media' },
  high: { bg: 'rgba(245,158,11,0.12)', text: '#f59e0b', label: 'Alta' },
  urgent: { bg: 'rgba(239,68,68,0.12)', text: '#ef4444', label: 'Urgente' },
};

const CATEGORY_LABELS: Record<TicketCategory, string> = {
  technical: 'Soporte Técnico',
  billing: 'Facturación',
  feature_request: 'Solicitud de Función',
  bug: 'Bug',
  other: 'Otro',
};

function Toast({ message, type, onClose }: { message: string; type: 'success' | 'error'; onClose: () => void }) {
  useEffect(() => {
    const t = setTimeout(onClose, 3200);
    return () => clearTimeout(t);
  }, [onClose]);
  return (
    <div className={`fixed bottom-6 right-6 z-50 rounded-2xl border px-4 py-3 text-sm text-white shadow-2xl backdrop-blur-sm ${
      type === 'success' ? 'border-emerald-500/20 bg-emerald-600/90' : 'border-red-500/20 bg-red-600/90'
    }`}>
      {message}
    </div>
  );
}

export default function SupportPage() {
  const { brand } = useAuth();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [stats, setStats] = useState<TicketStats>({ total_open: 0, in_progress: 0, resolved: 0 });
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [supportContact, setSupportContact] = useState({ whatsapp: '', email: 'info@lookitry.com' });

  const [filterStatus, setFilterStatus] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 10;
  const totalPages = Math.ceil(total / limit) || 1;

  const fetchTickets = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('offset', String((page - 1) * limit));
      params.set('limit', String(limit));
      if (filterStatus) params.set('status', filterStatus);

      const response = await api.get<{ data: Ticket[]; total: number }>(
        `/api/brands/me/tickets?${params.toString()}`
      );
      const data = response.data;
      setTickets(data.data || []);
      setTotal(data.total || 0);
    } catch (err: any) {
      setToast({ message: err.message || 'Error al cargar tickets', type: 'error' });
    } finally {
      setLoading(false);
    }
  }, [page, filterStatus]);

  useEffect(() => {
    fetchTickets();
  }, [fetchTickets]);

  const fetchStats = useCallback(async () => {
    try {
      const response = await api.get<{ total_open: number; in_progress: number; resolved: number }>(
        '/api/brands/me/tickets/stats'
      );
      setStats({
        total_open: response.data.total_open,
        in_progress: response.data.in_progress,
        resolved: response.data.resolved,
      });
    } catch (err: any) {
      // Stats are non-critical, silently fail
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  useEffect(() => {
    fetchPublicPaymentSettings()
      .then(data => {
        if (!data) return;
        setSupportContact({
          whatsapp: toWhatsAppUrl(data.manualWhatsapp) || '',
          email: data.manualEmail || 'info@lookitry.com',
        });
      })
      .catch(() => {});
  }, []);

  const handleCreateTicket = async (formData: { subject: string; description: string; priority: TicketPriority; category: TicketCategory }) => {
    setSaving(true);
    try {
      await api.post('/api/brands/me/tickets', {
        subject: formData.subject,
        description: formData.description,
        priority: formData.priority,
        category: formData.category,
      });
      setToast({ message: 'Ticket enviado. Te responderemos pronto.', type: 'success' });
      setShowCreateModal(false);
      fetchTickets();
      fetchStats();
    } catch (err: any) {
      setToast({ message: err.message || 'Error al crear ticket', type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const showingFrom = total === 0 ? 0 : (page - 1) * limit + 1;
  const showingTo = Math.min(page * limit, total);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-jakarta text-2xl font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>
            Soporte
          </h1>
          <p className="mt-1 text-sm" style={{ color: 'var(--text-secondary)' }}>
            ¿Necesitas ayuda? Estamos aquí para ti.
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 rounded-2xl bg-[var(--accent)] px-5 py-2.5 text-sm font-bold text-white transition-colors hover:bg-[var(--accent)]/90"
        >
          <Plus className="h-4 w-4" /> Nuevo Ticket
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-3 gap-4">
        <div className="rounded-2xl border border-[var(--border-color)] bg-[var(--bg-card)] p-4">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-amber-500/10 p-2.5">
              <Ticket className="h-5 w-5 text-amber-400" />
            </div>
            <div>
              <p className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>{stats.total_open}</p>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Abiertos</p>
            </div>
          </div>
        </div>
        <div className="rounded-2xl border border-[var(--border-color)] bg-[var(--bg-card)] p-4">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-blue-500/10 p-2.5">
              <MessageSquare className="h-5 w-5 text-blue-400" />
            </div>
            <div>
              <p className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>{stats.in_progress}</p>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>En progreso</p>
            </div>
          </div>
        </div>
        <div className="rounded-2xl border border-[var(--border-color)] bg-[var(--bg-card)] p-4">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-emerald-500/10 p-2.5">
              <CheckCircle2 className="h-5 w-5 text-emerald-400" />
            </div>
            <div>
              <p className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>{stats.resolved}</p>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Resueltos</p>
            </div>
          </div>
        </div>
      </div>

      {/* Contact Info */}
      <div className="rounded-2xl border border-[var(--border-color)] bg-[var(--bg-card)] p-5">
        <h3 className="font-jakarta font-bold text-lg mb-3" style={{ color: 'var(--text-primary)' }}>
          ¿Necesitas ayuda inmediata?
        </h3>
        <p className="text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>
          También puedes contactarnos directamente:
        </p>
        <div className="flex flex-wrap gap-4">
          <a
            href={`mailto:${supportContact.email}`}
            className="flex items-center gap-2 text-sm font-medium transition-colors hover:text-[var(--accent)]"
            style={{ color: 'var(--accent)' }}
          >
            <Mail className="h-4 w-4" />
            {supportContact.email}
          </a>
          {supportContact.whatsapp && (
            <a
              href={supportContact.whatsapp}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-sm font-medium transition-colors hover:text-[var(--accent)]"
              style={{ color: 'var(--accent)' }}
            >
              <MessageSquare className="h-4 w-4" />
              WhatsApp
            </a>
          )}
          {process.env.NEXT_PUBLIC_STATUS_URL && (
            <a
              href={process.env.NEXT_PUBLIC_STATUS_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-sm font-medium transition-colors hover:text-[var(--accent)]"
              style={{ color: 'var(--accent)' }}
            >
              <Globe className="h-4 w-4" />
              Estado del servicio
            </a>
          )}
        </div>
      </div>

      {/* Tickets List */}
      <div className="rounded-2xl border border-[var(--border-color)] bg-[var(--bg-card)] overflow-hidden">
        {/* Filters */}
        <div className="flex items-center gap-4 border-b border-[var(--border-color)] p-4">
          <Filter className="h-4 w-4 text-[var(--text-muted)]" />
          <select
            value={filterStatus}
            onChange={(e) => { setFilterStatus(e.target.value); setPage(1); }}
            className="rounded-xl border border-[var(--border-color)] bg-[var(--bg-base)] px-3 py-1.5 text-sm text-[var(--text-primary)] outline-none"
          >
            <option value="">Todos</option>
            <option value="open">Abierto</option>
            <option value="in_progress">En Progreso</option>
            <option value="resolved">Resuelto</option>
            <option value="closed">Cerrado</option>
          </select>
        </div>

        {/* Table */}
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-[var(--accent)]" />
          </div>
        ) : tickets.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 px-4">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-white/5">
              <Ticket className="h-7 w-7 text-[var(--text-muted)]" />
            </div>
            <p className="text-base font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
              No tienes tickets de soporte
            </p>
            <p className="text-sm text-center" style={{ color: 'var(--text-muted)' }}>
              ¿Tienes un problema? Crea un ticket y te ayudaremos.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-[var(--border-color)]">
            {tickets.map((ticket) => (
              <div 
                key={ticket.id} 
                className="p-4 hover:bg-[var(--bg-hover)] transition-colors cursor-pointer"
                onClick={() => {/* could expand to show details */}}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-medium truncate" style={{ color: 'var(--text-primary)' }}>
                        {ticket.subject}
                      </h4>
                      <span
                        className="inline-flex rounded-full px-2 py-0.5 text-xs font-semibold shrink-0"
                        style={{
                          backgroundColor: PRIORITY_CONFIG[ticket.priority].bg,
                          color: PRIORITY_CONFIG[ticket.priority].text,
                        }}
                      >
                        {PRIORITY_CONFIG[ticket.priority].label}
                      </span>
                    </div>
                    <p className="text-sm truncate" style={{ color: 'var(--text-secondary)' }}>
                      {ticket.description}
                    </p>
                    <div className="flex items-center gap-3 mt-2">
                      <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                        {CATEGORY_LABELS[ticket.category]}
                      </span>
                      <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                        {new Date(ticket.created_at).toLocaleDateString('es-CO')}
                      </span>
                    </div>
                  </div>
                  <span
                    className="inline-flex rounded-full px-3 py-1.5 text-xs font-semibold shrink-0"
                    style={{
                      backgroundColor: STATUS_CONFIG[ticket.status].bg,
                      color: STATUS_CONFIG[ticket.status].text,
                    }}
                  >
                    {STATUS_CONFIG[ticket.status].label}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {total > 0 && (
          <div className="flex items-center justify-between border-t border-[var(--border-color)] px-5 py-4">
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              Mostrando {showingFrom} - {showingTo} de {total}
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage(Math.max(1, page - 1))}
                disabled={page <= 1}
                className="rounded-xl border border-[var(--border-color)] px-3 py-2 text-sm transition-colors disabled:cursor-not-allowed disabled:opacity-40 flex items-center gap-1"
                style={{ color: 'var(--text-secondary)' }}
              >
                <ChevronLeft className="h-4 w-4" /> Anterior
              </button>
              <span className="text-sm px-2" style={{ color: 'var(--text-secondary)' }}>
                {page} / {totalPages}
              </span>
              <button
                onClick={() => setPage(Math.min(totalPages, page + 1))}
                disabled={page >= totalPages}
                className="rounded-xl border border-[var(--border-color)] px-3 py-2 text-sm transition-colors disabled:cursor-not-allowed disabled:opacity-40 flex items-center gap-1"
                style={{ color: 'var(--text-secondary)' }}
              >
                Siguiente <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <CreateTicketModal
          onSave={handleCreateTicket}
          onClose={() => setShowCreateModal(false)}
          isLoading={saving}
        />
      )}

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </motion.div>
  );
}

interface CreateTicketModalProps {
  onSave: (data: { subject: string; description: string; priority: TicketPriority; category: TicketCategory }) => void;
  onClose: () => void;
  isLoading: boolean;
}

function CreateTicketModal({ onSave, onClose, isLoading }: CreateTicketModalProps) {
  const [form, setForm] = useState({
    subject: '',
    description: '',
    priority: 'medium' as TicketPriority,
    category: 'technical' as TicketCategory,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.subject.trim()) return;
    onSave(form);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-[2rem] border border-[var(--border-color)] bg-[var(--bg-card)] p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-start justify-between gap-4 mb-6">
          <div>
            <h2 className="font-jakarta text-xl font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>
              Crear Ticket de Soporte
            </h2>
            <p className="mt-1 text-xs" style={{ color: 'var(--text-muted)' }}>
              Te responderemos lo antes posible
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-2 transition-colors hover:bg-white/5"
            style={{ color: 'var(--text-muted)' }}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold mb-1.5" style={{ color: 'var(--text-secondary)' }}>
              Asunto *
            </label>
            <input
              type="text"
              value={form.subject}
              onChange={(e) => setForm({ ...form, subject: e.target.value })}
              required
              className="w-full rounded-xl border border-[var(--border-color)] bg-[var(--bg-base)] px-4 py-2.5 text-sm outline-none focus:border-[var(--accent)]/50"
              style={{ color: 'var(--text-primary)' }}
              placeholder="Breve descripción del problema..."
            />
          </div>

          <div>
            <label className="block text-sm font-semibold mb-1.5" style={{ color: 'var(--text-secondary)' }}>
              Descripción
            </label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows={4}
              className="w-full resize-none rounded-xl border border-[var(--border-color)] bg-[var(--bg-base)] px-4 py-2.5 text-sm outline-none focus:border-[var(--accent)]/50"
              style={{ color: 'var(--text-primary)' }}
              placeholder="Detalles adicionales que nos ayuden a ayudarte mejor..."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold mb-1.5" style={{ color: 'var(--text-secondary)' }}>
                Prioridad
              </label>
              <select
                value={form.priority}
                onChange={(e) => setForm({ ...form, priority: e.target.value as TicketPriority })}
                className="w-full rounded-xl border border-[var(--border-color)] bg-[var(--bg-base)] px-3 py-2.5 text-sm outline-none"
                style={{ color: 'var(--text-primary)' }}
              >
                <option value="low">Baja</option>
                <option value="medium">Media</option>
                <option value="high">Alta</option>
                <option value="urgent">Urgente</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold mb-1.5" style={{ color: 'var(--text-secondary)' }}>
                Categoría
              </label>
              <select
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value as TicketCategory })}
                className="w-full rounded-xl border border-[var(--border-color)] bg-[var(--bg-base)] px-3 py-2.5 text-sm outline-none"
                style={{ color: 'var(--text-primary)' }}
              >
                <option value="technical">Soporte Técnico</option>
                <option value="billing">Facturación</option>
                <option value="feature_request">Solicitud de Función</option>
                <option value="bug">Bug</option>
                <option value="other">Otro</option>
              </select>
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-xl border border-[var(--border-color)] px-4 py-2.5 text-sm font-semibold transition-colors"
              style={{ color: 'var(--text-secondary)' }}
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isLoading || !form.subject.trim()}
              className="flex-1 rounded-xl bg-[var(--accent)] px-4 py-2.5 text-sm font-bold text-white transition-colors hover:bg-[var(--accent)]/90 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <Send className="h-4 w-4" /> Enviar Ticket
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
