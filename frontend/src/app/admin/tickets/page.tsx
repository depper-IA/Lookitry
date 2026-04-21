'use client';

import { useEffect, useMemo, useState, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { adminApi } from '@/services/adminApi';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import {
  Search, Plus, X, ChevronLeft, ChevronRight, Ticket, AlertTriangle,
  Clock, CheckCircle2, User, Building2, Tag, Users, Edit2, Trash2, Filter, Send, MessageCircle
} from 'lucide-react';

// ── Types ─────────────────────────────────────────────────────────────────────

type TicketStatus = 'open' | 'in_progress' | 'resolved' | 'closed';
type TicketPriority = 'low' | 'medium' | 'high' | 'urgent';
type TicketCategory = 'technical' | 'billing' | 'feature_request' | 'bug' | 'other';

interface Ticket {
  id: string;
  brand_id: string | null;
  brand_name: string | null;
  subject: string;
  description: string;
  priority: TicketPriority;
  status: TicketStatus;
  category: TicketCategory;
  assigned_to: string | null;
  assigned_to_name: string | null;
  created_at: string;
  updated_at: string;
  resolved_at: string | null;
}

interface TicketMessage {
  id: string;
  ticket_id: string;
  sender_type: 'admin' | 'brand' | 'system';
  sender_id: string | null;
  content: string;
  created_at: string;
}

interface Admin {
  id: string;
  name: string;
  email: string;
}

interface Brand {
  id: string;
  name: string;
}

interface TicketStats {
  total_open: number;
  high_priority: number;
  resolved_this_week: number;
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

// ── Toast Component ───────────────────────────────────────────────────────────

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

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function TicketsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [stats, setStats] = useState<TicketStats>({ total_open: 0, high_priority: 0, resolved_this_week: 0 });
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Filters
  const [filterStatus, setFilterStatus] = useState(searchParams.get('status') || '');
  const [filterPriority, setFilterPriority] = useState(searchParams.get('priority') || '');
  const [filterBrand, setFilterBrand] = useState(searchParams.get('brand') || '');
  const [filterAssigned, setFilterAssigned] = useState(searchParams.get('assigned') || '');
  const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '');

  // Pagination
  const [page, setPage] = useState(Number(searchParams.get('page')) || 1);
  const [limit, setLimit] = useState(Number(searchParams.get('limit')) || 20);
  const [total, setTotal] = useState(0);
  const totalPages = Math.ceil(total / limit) || 1;

  // CRUD Modal
  const [showModal, setShowModal] = useState(false);
  const [editingTicket, setEditingTicket] = useState<Ticket | null>(null);
  const [saving, setSaving] = useState(false);

  // Detail panel
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);

  // Messages
  const [messages, setMessages] = useState<TicketMessage[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [messageText, setMessageText] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);

  // Bulk actions
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkActionLoading, setBulkActionLoading] = useState(false);

  // Delete confirm
  const [deleteTarget, setDeleteTarget] = useState<Ticket | null>(null);

  const fetchBrands = useCallback(async () => {
    try {
      const data = await adminApi.get<{ brands: Brand[] }>('/api/admin/brands?limit=1000');
      setBrands(data.brands || []);
    } catch { /* silent */ }
  }, []);

  const fetchAdmins = useCallback(async () => {
    try {
      const data = await adminApi.get<{ admins: Admin[] }>('/api/admin/admins');
      setAdmins(data.admins || []);
    } catch { /* silent */ }
  }, []);

  const fetchTickets = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filterStatus) params.set('status', filterStatus);
      if (filterPriority) params.set('priority', filterPriority);
      if (filterBrand) params.set('brand_id', filterBrand);
      if (filterAssigned) params.set('assigned_to', filterAssigned);
      if (searchTerm) params.set('search', searchTerm);
      params.set('page', String(page));
      params.set('limit', String(limit));

      const data = await adminApi.get<{ tickets: Ticket[]; total: number; stats?: TicketStats }>(
        `/api/admin/tickets?${params.toString()}`
      );
      setTickets(data.tickets || []);
      setTotal(data.total || 0);
      if (data.stats) setStats(data.stats);
    } catch (err: any) {
      setToast({ message: err.message || 'Error al cargar tickets', type: 'error' });
    } finally {
      setLoading(false);
    }
  }, [filterStatus, filterPriority, filterBrand, filterAssigned, searchTerm, page, limit]);

  const fetchMessages = useCallback(async (ticketId: string) => {
    setLoadingMessages(true);
    try {
      const data = await adminApi.get<{ messages: TicketMessage[] }>(
        `/api/admin/tickets/${ticketId}/messages`
      );
      setMessages(data.messages || []);
    } catch (err: any) {
      console.error('Error fetching messages:', err);
      setMessages([]);
    } finally {
      setLoadingMessages(false);
    }
  }, []);

  const sendMessage = async () => {
    if (!selectedTicket || !messageText.trim()) return;
    setSendingMessage(true);
    try {
      const data = await adminApi.post<{ data: TicketMessage }>(
        `/api/admin/tickets/${selectedTicket.id}/messages`,
        { content: messageText.trim() }
      );
      setMessages(prev => [...prev, data.data]);
      setMessageText('');
      fetchTickets(); // refresh to update status
    } catch (err: any) {
      setToast({ message: err.message || 'Error al enviar mensaje', type: 'error' });
    } finally {
      setSendingMessage(false);
    }
  };

  useEffect(() => {
    fetchBrands();
    fetchAdmins();
  }, [fetchBrands, fetchAdmins]);

  useEffect(() => {
    fetchTickets();
  }, [fetchTickets]);

  useEffect(() => {
    if (selectedTicket) {
      fetchMessages(selectedTicket.id);
    } else {
      setMessages([]);
      setMessageText('');
    }
  }, [selectedTicket, fetchMessages]);

  const clearFilters = () => {
    setFilterStatus('');
    setFilterPriority('');
    setFilterBrand('');
    setFilterAssigned('');
    setSearchTerm('');
    setPage(1);
  };

  const hasActiveFilters = Boolean(filterStatus || filterPriority || filterBrand || filterAssigned || searchTerm);

  const handleCreateOrUpdate = async (formData: Partial<Ticket>) => {
    setSaving(true);
    try {
      if (editingTicket) {
        await adminApi.patch(`/api/admin/tickets/${editingTicket.id}`, formData);
        setToast({ message: 'Ticket actualizado correctamente', type: 'success' });
      } else {
        await adminApi.post('/api/admin/tickets', formData);
        setToast({ message: 'Ticket creado correctamente', type: 'success' });
      }
      setShowModal(false);
      setEditingTicket(null);
      fetchTickets();
    } catch (err: any) {
      setToast({ message: err.message || 'Error al guardar ticket', type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setSaving(true);
    try {
      await adminApi.delete(`/api/admin/tickets/${deleteTarget.id}`);
      setToast({ message: 'Ticket eliminado', type: 'success' });
      setDeleteTarget(null);
      setSelectedTicket(null);
      fetchTickets();
    } catch (err: any) {
      setToast({ message: err.message || 'Error al eliminar', type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const handleBulkAction = async (action: 'status' | 'assign', value: string) => {
    if (selectedIds.size === 0) return;
    setBulkActionLoading(true);
    try {
      const body = action === 'status'
        ? { ids: Array.from(selectedIds), status: value }
        : { ids: Array.from(selectedIds), assigned_to: value };

      await adminApi.post('/api/admin/tickets/bulk-action', body);
      setToast({ message: `${selectedIds.size} tickets actualizados`, type: 'success' });
      setSelectedIds(new Set());
      fetchTickets();
    } catch (err: any) {
      setToast({ message: err.message || 'Error en acción masiva', type: 'error' });
    } finally {
      setBulkActionLoading(false);
    }
  };

  const toggleSelect = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === tickets.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(tickets.map(t => t.id)));
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
            Tickets de Soporte
          </h1>
          <p className="mt-1 text-sm" style={{ color: 'var(--text-secondary)' }}>
            {total.toLocaleString()} tickets totales
          </p>
        </div>
        <button
          onClick={() => { setEditingTicket(null); setShowModal(true); }}
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
            <div className="rounded-xl bg-red-500/10 p-2.5">
              <AlertTriangle className="h-5 w-5 text-red-400" />
            </div>
            <div>
              <p className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>{stats.high_priority}</p>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Alta prioridad</p>
            </div>
          </div>
        </div>
        <div className="rounded-2xl border border-[var(--border-color)] bg-[var(--bg-card)] p-4">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-emerald-500/10 p-2.5">
              <CheckCircle2 className="h-5 w-5 text-emerald-400" />
            </div>
            <div>
              <p className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>{stats.resolved_this_week}</p>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Resueltos esta semana</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="rounded-[2rem] border border-[var(--border-color)] bg-[var(--bg-card)] p-4">
        <div className="flex flex-col gap-3 lg:flex-row">
          {/* Search */}
          <form
            onSubmit={(e) => { e.preventDefault(); setPage(1); }}
            className="relative flex-1"
          >
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-muted)]" />
            <input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por asunto, descripción..."
              className="w-full rounded-2xl border border-[var(--border-color)] bg-[var(--bg-base)] py-3 pl-11 pr-4 text-sm text-[var(--text-primary)] outline-none transition-colors placeholder:text-[var(--text-muted)] focus:border-[var(--accent)]/50"
            />
          </form>

          {/* Status Filter */}
          <select
            value={filterStatus}
            onChange={(e) => { setFilterStatus(e.target.value); setPage(1); }}
            className="rounded-2xl border border-[var(--border-color)] bg-[var(--bg-base)] px-4 py-3 text-sm text-[var(--text-primary)] outline-none min-w-[150px]"
          >
            <option value="">Todos los estados</option>
            <option value="open">Abierto</option>
            <option value="in_progress">En Progreso</option>
            <option value="resolved">Resuelto</option>
            <option value="closed">Cerrado</option>
          </select>

          {/* Priority Filter */}
          <select
            value={filterPriority}
            onChange={(e) => { setFilterPriority(e.target.value); setPage(1); }}
            className="rounded-2xl border border-[var(--border-color)] bg-[var(--bg-base)] px-4 py-3 text-sm text-[var(--text-primary)] outline-none min-w-[150px]"
          >
            <option value="">Todas las prioridades</option>
            <option value="low">Baja</option>
            <option value="medium">Media</option>
            <option value="high">Alta</option>
            <option value="urgent">Urgente</option>
          </select>

          {/* Brand Filter */}
          <select
            value={filterBrand}
            onChange={(e) => { setFilterBrand(e.target.value); setPage(1); }}
            className="rounded-2xl border border-[var(--border-color)] bg-[var(--bg-base)] px-4 py-3 text-sm text-[var(--text-primary)] outline-none min-w-[180px]"
          >
            <option value="">Todas las marcas</option>
            {brands.map((b) => (
              <option key={b.id} value={b.id}>{b.name}</option>
            ))}
          </select>

          {/* Assigned Filter */}
          <select
            value={filterAssigned}
            onChange={(e) => { setFilterAssigned(e.target.value); setPage(1); }}
            className="rounded-2xl border border-[var(--border-color)] bg-[var(--bg-base)] px-4 py-3 text-sm text-[var(--text-primary)] outline-none min-w-[160px]"
          >
            <option value="">Todos los asignados</option>
            {admins.map((a) => (
              <option key={a.id} value={a.id}>{a.name}</option>
            ))}
          </select>

          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="rounded-2xl border border-[var(--border-color)] px-4 py-3 text-sm font-semibold text-[var(--text-secondary)] transition-colors hover:text-white flex items-center gap-2"
            >
              <X className="h-4 w-4" /> Limpiar
            </button>
          )}
        </div>
      </div>

      {/* Bulk Actions Bar */}
      {selectedIds.size > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-4 rounded-2xl border border-[var(--accent)]/30 bg-[var(--accent)]/10 px-5 py-3"
        >
          <span className="text-sm font-semibold" style={{ color: 'var(--accent)' }}>
            {selectedIds.size} seleccionado(s)
          </span>
          <div className="flex items-center gap-2">
            <select
              onChange={(e) => {
                if (e.target.value) handleBulkAction('status', e.target.value);
              }}
              className="rounded-xl border border-[var(--border-color)] bg-[var(--bg-base)] px-3 py-1.5 text-sm text-[var(--text-primary)] outline-none"
              defaultValue=""
            >
              <option value="" disabled>Cambiar estado...</option>
              <option value="open">Abierto</option>
              <option value="in_progress">En Progreso</option>
              <option value="resolved">Resuelto</option>
              <option value="closed">Cerrado</option>
            </select>
            <select
              onChange={(e) => {
                if (e.target.value) handleBulkAction('assign', e.target.value);
              }}
              className="rounded-xl border border-[var(--border-color)] bg-[var(--bg-base)] px-3 py-1.5 text-sm text-[var(--text-primary)] outline-none"
              defaultValue=""
            >
              <option value="" disabled>Asignar a...</option>
              {admins.map((a) => (
                <option key={a.id} value={a.id}>{a.name}</option>
              ))}
            </select>
          </div>
          <button
            onClick={() => setSelectedIds(new Set())}
            className="ml-auto text-sm text-[var(--text-muted)] hover:text-white transition-colors"
          >
            Cancelar
          </button>
        </motion.div>
      )}

      {/* Table + Detail Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Table */}
        <div className="lg:col-span-2 rounded-[2rem] border border-[var(--border-color)] bg-[var(--bg-card)] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-sm">
              <thead className="border-b border-[var(--border-color)] bg-[var(--bg-base)] text-left">
                <tr>
                  <th className="px-4 py-4 w-10">
                    <input
                      type="checkbox"
                      checked={selectedIds.size === tickets.length && tickets.length > 0}
                      onChange={toggleSelectAll}
                      className="rounded border-[var(--border-color)]"
                    />
                  </th>
                  <th className="px-4 py-4 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--text-muted)]">ID</th>
                  <th className="px-4 py-4 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--text-muted)]">Marca</th>
                  <th className="px-4 py-4 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--text-muted)]">Asunto</th>
                  <th className="px-4 py-4 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--text-muted)]">Prioridad</th>
                  <th className="px-4 py-4 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--text-muted)]">Estado</th>
                  <th className="px-4 py-4 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--text-muted)]">Categoría</th>
                  <th className="px-4 py-4 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--text-muted)]">Asignado</th>
                  <th className="px-4 py-4 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--text-muted)]">Fecha</th>
                  <th className="px-4 py-4 text-center text-xs font-semibold uppercase tracking-[0.18em] text-[var(--text-muted)]">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={10} className="px-4 py-16 text-center">
                      <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-[var(--accent)]/20 border-t-[var(--accent)]" />
                    </td>
                  </tr>
                ) : tickets.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="px-4 py-16">
                      <div className="flex flex-col items-center justify-center text-center">
                        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-white/5 text-[var(--accent)]">
                          <Ticket className="h-7 w-7" />
                        </div>
                        <p className="text-base font-semibold" style={{ color: 'var(--text-primary)' }}>
                          No hay tickets
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  tickets.map((ticket) => (
                    <tr
                      key={ticket.id}
                      className={`border-t border-[var(--border-color)] transition-colors cursor-pointer ${
                        selectedTicket?.id === ticket.id ? 'bg-[var(--accent)]/5' : 'hover:bg-[var(--bg-hover)]'
                      }`}
                      onClick={() => setSelectedTicket(ticket)}
                    >
                      <td className="px-4 py-4" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={selectedIds.has(ticket.id)}
                          onChange={() => toggleSelect(ticket.id)}
                          className="rounded border-[var(--border-color)]"
                        />
                      </td>
                      <td className="px-4 py-4">
                        <span className="font-mono text-xs text-[var(--text-muted)]">{ticket.id.slice(0, 8)}</span>
                      </td>
                      <td className="px-4 py-4">
                        <span className="text-[var(--text-secondary)] truncate max-w-[120px] block">
                          {ticket.brand_name || '—'}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <p className="font-medium truncate max-w-[200px]" style={{ color: 'var(--text-primary)' }} title={ticket.subject}>
                          {ticket.subject}
                        </p>
                      </td>
                      <td className="px-4 py-4">
                        <span
                          className="inline-flex rounded-full px-2.5 py-1 text-xs font-semibold"
                          style={{
                            backgroundColor: PRIORITY_CONFIG[ticket.priority].bg,
                            color: PRIORITY_CONFIG[ticket.priority].text,
                          }}
                        >
                          {PRIORITY_CONFIG[ticket.priority].label}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <span
                          className="inline-flex rounded-full px-2.5 py-1 text-xs font-semibold"
                          style={{
                            backgroundColor: STATUS_CONFIG[ticket.status].bg,
                            color: STATUS_CONFIG[ticket.status].text,
                          }}
                        >
                          {STATUS_CONFIG[ticket.status].label}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <span className="text-[var(--text-secondary)] text-xs">
                          {CATEGORY_LABELS[ticket.category]}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <span className="text-[var(--text-secondary)] text-xs">
                          {ticket.assigned_to_name || '—'}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-[var(--text-secondary)] text-xs whitespace-nowrap">
                        {new Date(ticket.created_at).toLocaleDateString('es-CO', {
                          day: '2-digit',
                          month: 'short',
                        })}
                      </td>
                      <td className="px-4 py-4" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => { setEditingTicket(ticket); setShowModal(true); }}
                            className="rounded-xl bg-white/5 p-2 text-[var(--text-secondary)] transition-colors hover:bg-white/10 hover:text-white"
                            title="Editar"
                          >
                            <Edit2 className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => setDeleteTarget(ticket)}
                            className="rounded-xl bg-white/5 p-2 text-[var(--text-secondary)] transition-colors hover:bg-red-500/10 hover:text-red-400"
                            title="Eliminar"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex flex-col gap-3 border-t border-[var(--border-color)] px-5 py-4 md:flex-row md:items-center md:justify-between">
            <p className="text-sm text-[var(--text-secondary)]">
              Mostrando {showingFrom} - {showingTo} de {total.toLocaleString()}
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage(Math.max(1, page - 1))}
                disabled={page <= 1}
                className="rounded-xl border border-[var(--border-color)] px-3 py-2 text-sm text-[var(--text-secondary)] transition-colors hover:text-white disabled:cursor-not-allowed disabled:opacity-40 flex items-center gap-1"
              >
                <ChevronLeft className="h-4 w-4" /> Anterior
              </button>
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let p: number;
                if (totalPages <= 5) p = i + 1;
                else if (page <= 3) p = i + 1;
                else if (page >= totalPages - 2) p = totalPages - 4 + i;
                else p = page - 2 + i;
                return (
                  <button
                    key={p}
                    onClick={() => setPage(p)}
                    className={`rounded-xl px-3 py-2 text-sm transition-colors ${
                      p === page ? 'bg-[var(--accent)] text-white' : 'border border-[var(--border-color)] text-[var(--text-secondary)] hover:text-white'
                    }`}
                  >
                    {p}
                  </button>
                );
              })}
              <button
                onClick={() => setPage(Math.min(totalPages, page + 1))}
                disabled={page >= totalPages}
                className="rounded-xl border border-[var(--border-color)] px-3 py-2 text-sm text-[var(--text-secondary)] transition-colors hover:text-white disabled:cursor-not-allowed disabled:opacity-40 flex items-center gap-1"
              >
                Siguiente <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Detail Panel */}
        <div className="rounded-[2rem] border border-[var(--border-color)] bg-[var(--bg-card)] p-5 h-fit">
          {selectedTicket ? (
            <div className="space-y-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="font-jakarta font-bold text-lg" style={{ color: 'var(--text-primary)' }}>
                    {selectedTicket.subject}
                  </h3>
                  <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                    #{selectedTicket.id.slice(0, 8)}
                  </p>
                </div>
                <button
                  onClick={() => setSelectedTicket(null)}
                  className="rounded-full p-1.5 text-[var(--text-muted)] hover:bg-white/5"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Priority & Status */}
              <div className="flex gap-2">
                <span
                  className="inline-flex rounded-full px-3 py-1.5 text-xs font-semibold"
                  style={{
                    backgroundColor: PRIORITY_CONFIG[selectedTicket.priority].bg,
                    color: PRIORITY_CONFIG[selectedTicket.priority].text,
                  }}
                >
                  {PRIORITY_CONFIG[selectedTicket.priority].label}
                </span>
                <span
                  className="inline-flex rounded-full px-3 py-1.5 text-xs font-semibold"
                  style={{
                    backgroundColor: STATUS_CONFIG[selectedTicket.status].bg,
                    color: STATUS_CONFIG[selectedTicket.status].text,
                  }}
                >
                  {STATUS_CONFIG[selectedTicket.status].label}
                </span>
              </div>

              {/* Info Grid */}
              <div className="space-y-3 text-sm">
                {selectedTicket.brand_name && (
                  <div className="flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-[var(--text-muted)]" />
                    <span style={{ color: 'var(--text-secondary)' }}>{selectedTicket.brand_name}</span>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <Tag className="h-4 w-4 text-[var(--text-muted)]" />
                  <span style={{ color: 'var(--text-secondary)' }}>{CATEGORY_LABELS[selectedTicket.category]}</span>
                </div>
                {selectedTicket.assigned_to_name && (
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-[var(--text-muted)]" />
                    <span style={{ color: 'var(--text-secondary)' }}>{selectedTicket.assigned_to_name}</span>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-[var(--text-muted)]" />
                  <span style={{ color: 'var(--text-secondary)' }}>
                    {new Date(selectedTicket.created_at).toLocaleString('es-CO')}
                  </span>
                </div>
              </div>

              {/* Description */}
              <div className="rounded-xl border border-[var(--border-color)] p-4">
                <p className="text-xs uppercase tracking-wider mb-2" style={{ color: 'var(--text-muted)' }}>Descripción</p>
                <p className="text-sm whitespace-pre-wrap" style={{ color: 'var(--text-primary)' }}>
                  {selectedTicket.description}
                </p>
              </div>

              {/* Messages Thread */}
              <div className="rounded-xl border border-[var(--border-color)] p-4">
                <div className="flex items-center gap-2 mb-3">
                  <MessageCircle className="h-4 w-4 text-[var(--text-muted)]" />
                  <p className="text-xs uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Conversación</p>
                </div>

                {loadingMessages ? (
                  <div className="flex items-center justify-center py-4">
                    <div className="h-5 w-5 animate-spin rounded-full border-2 border-[var(--accent)] border-t-transparent" />
                  </div>
                ) : messages.length === 0 ? (
                  <p className="text-sm text-center py-4" style={{ color: 'var(--text-muted)' }}>
                    Sin mensajes aún. Usa el campo de abajo para responder.
                  </p>
                ) : (
                  <div className="space-y-3 max-h-60 overflow-y-auto">
                    {messages.map((msg) => (
                      <div
                        key={msg.id}
                        className={`rounded-xl p-3 text-sm ${
                          msg.sender_type === 'admin'
                            ? 'bg-[var(--accent)]/10 border border-[var(--accent)]/20 ml-4'
                            : msg.sender_type === 'brand'
                            ? 'bg-white/5 border border-[var(--border-color)] mr-4'
                            : 'bg-gray-500/10 border border-gray-500/20 mx-4'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <span className="text-xs font-semibold" style={{ color: 'var(--text-muted)' }}>
                            {msg.sender_type === 'admin' ? 'Admin' : msg.sender_type === 'brand' ? (selectedTicket.brand_name || 'Cliente') : 'Sistema'}
                          </span>
                          <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                            {new Date(msg.created_at).toLocaleString('es-CO', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <p className="whitespace-pre-wrap" style={{ color: 'var(--text-primary)' }}>{msg.content}</p>
                      </div>
                    ))}
                  </div>
                )}

                {/* Reply Input */}
                {selectedTicket.status !== 'resolved' && selectedTicket.status !== 'closed' && (
                  <div className="mt-3 flex gap-2">
                    <input
                      type="text"
                      value={messageText}
                      onChange={(e) => setMessageText(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage()}
                      placeholder="Escribe una respuesta..."
                      className="flex-1 rounded-xl border border-[var(--border-color)] bg-[var(--bg-base)] px-3 py-2 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--accent)]/50"
                    />
                    <button
                      onClick={sendMessage}
                      disabled={sendingMessage || !messageText.trim()}
                      className="rounded-xl bg-[var(--accent)] p-2 text-white transition-colors hover:bg-[var(--accent)]/90 disabled:opacity-50 flex items-center justify-center"
                    >
                      {sendingMessage ? (
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                      ) : (
                        <Send className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                )}
              </div>

              {/* Quick Actions */}
              <div className="flex gap-2 pt-2">
                <button
                  onClick={() => { setEditingTicket(selectedTicket); setShowModal(true); }}
                  className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-white/5 px-3 py-2.5 text-sm font-semibold text-[var(--text-secondary)] transition-colors hover:bg-white/10 hover:text-white"
                >
                  <Edit2 className="h-4 w-4" /> Editar
                </button>
                {selectedTicket.status !== 'resolved' && (
                  <button
                    onClick={async () => {
                      await adminApi.patch(`/api/admin/tickets/${selectedTicket.id}`, { status: 'resolved' });
                      setToast({ message: 'Ticket resuelto', type: 'success' });
                      fetchTickets();
                      setSelectedTicket({ ...selectedTicket, status: 'resolved' });
                    }}
                    className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-emerald-500/10 px-3 py-2.5 text-sm font-semibold text-emerald-400 transition-colors hover:bg-emerald-500/20"
                  >
                    <CheckCircle2 className="h-4 w-4" /> Resolver
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="py-8 text-center">
              <Ticket className="mx-auto h-10 w-10 mb-3 text-[var(--text-muted)]" />
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                Selecciona un ticket para ver los detalles
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Create/Edit Modal */}
      {showModal && (
        <TicketModal
          ticket={editingTicket}
          brands={brands}
          admins={admins}
          onSave={handleCreateOrUpdate}
          onClose={() => { setShowModal(false); setEditingTicket(null); }}
          isLoading={saving}
        />
      )}

      {/* Delete Confirm */}
      <ConfirmModal
        isOpen={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Eliminar Ticket"
        message={`¿Eliminar el ticket "${deleteTarget?.subject}"? Esta acción no se puede deshacer.`}
        confirmLabel={saving ? 'Eliminando...' : 'Eliminar'}
        cancelLabel="Cancelar"
        variant="danger"
        isLoading={saving}
      />

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </motion.div>
  );
}

// ── Create/Edit Modal ─────────────────────────────────────────────────────────

interface TicketModalProps {
  ticket?: Ticket | null;
  brands: Brand[];
  admins: Admin[];
  onSave: (data: Partial<Ticket>) => void;
  onClose: () => void;
  isLoading: boolean;
}

function TicketModal({ ticket, brands, admins, onSave, onClose, isLoading }: TicketModalProps) {
  const [form, setForm] = useState({
    subject: ticket?.subject || '',
    description: ticket?.description || '',
    brand_id: ticket?.brand_id || '',
    priority: ticket?.priority || 'medium',
    category: ticket?.category || 'technical',
    assigned_to: ticket?.assigned_to || '',
    status: ticket?.status || 'open',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.subject.trim()) return;
    onSave({
      subject: form.subject,
      description: form.description,
      brand_id: form.brand_id || null,
      priority: form.priority as TicketPriority,
      category: form.category as TicketCategory,
      assigned_to: form.assigned_to || null,
      status: form.status as TicketStatus,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-[2rem] border border-[var(--border-color)] bg-[var(--bg-card)] p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-start justify-between gap-4 mb-6">
          <div>
            <h2 className="font-jakarta text-xl font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>
              {ticket ? 'Editar Ticket' : 'Nuevo Ticket'}
            </h2>
            {ticket && (
              <p className="mt-1 text-xs" style={{ color: 'var(--text-muted)' }}>#{ticket.id.slice(0, 8)}</p>
            )}
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-2 text-[var(--text-muted)] transition-colors hover:bg-white/5 hover:text-white"
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
              className="w-full rounded-xl border border-[var(--border-color)] bg-[var(--bg-base)] px-4 py-2.5 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--accent)]/50"
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
              className="w-full resize-none rounded-xl border border-[var(--border-color)] bg-[var(--bg-base)] px-4 py-2.5 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--accent)]/50"
              placeholder="Detalles adicionales..."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold mb-1.5" style={{ color: 'var(--text-secondary)' }}>
                Marca
              </label>
              <select
                value={form.brand_id}
                onChange={(e) => setForm({ ...form, brand_id: e.target.value })}
                className="w-full rounded-xl border border-[var(--border-color)] bg-[var(--bg-base)] px-3 py-2.5 text-sm text-[var(--text-primary)] outline-none"
              >
                <option value="">Ninguna</option>
                {brands.map((b) => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold mb-1.5" style={{ color: 'var(--text-secondary)' }}>
                Prioridad
              </label>
              <select
                value={form.priority}
                onChange={(e) => setForm({ ...form, priority: e.target.value as TicketPriority })}
                className="w-full rounded-xl border border-[var(--border-color)] bg-[var(--bg-base)] px-3 py-2.5 text-sm text-[var(--text-primary)] outline-none"
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
                className="w-full rounded-xl border border-[var(--border-color)] bg-[var(--bg-base)] px-3 py-2.5 text-sm text-[var(--text-primary)] outline-none"
              >
                <option value="technical">Soporte Técnico</option>
                <option value="billing">Facturación</option>
                <option value="feature_request">Solicitud de Función</option>
                <option value="bug">Bug</option>
                <option value="other">Otro</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold mb-1.5" style={{ color: 'var(--text-secondary)' }}>
                Estado
              </label>
              <select
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value as TicketStatus })}
                className="w-full rounded-xl border border-[var(--border-color)] bg-[var(--bg-base)] px-3 py-2.5 text-sm text-[var(--text-primary)] outline-none"
              >
                <option value="open">Abierto</option>
                <option value="in_progress">En Progreso</option>
                <option value="resolved">Resuelto</option>
                <option value="closed">Cerrado</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold mb-1.5" style={{ color: 'var(--text-secondary)' }}>
              Asignado a
            </label>
            <select
              value={form.assigned_to}
              onChange={(e) => setForm({ ...form, assigned_to: e.target.value })}
              className="w-full rounded-xl border border-[var(--border-color)] bg-[var(--bg-base)] px-3 py-2.5 text-sm text-[var(--text-primary)] outline-none"
            >
              <option value="">Sin asignar</option>
              {admins.map((a) => (
                <option key={a.id} value={a.id}>{a.name}</option>
              ))}
            </select>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-xl border border-[var(--border-color)] px-4 py-2.5 text-sm font-semibold text-[var(--text-secondary)] transition-colors hover:text-white"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isLoading || !form.subject.trim()}
              className="flex-1 rounded-xl bg-[var(--accent)] px-4 py-2.5 text-sm font-bold text-white transition-colors hover:bg-[var(--accent)]/90 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
              ) : ticket ? 'Guardar' : 'Crear Ticket'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
