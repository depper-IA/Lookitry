'use client';

import { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { adminApi } from '@/services/adminApi';
import {
  Bot, MessageSquare, Star, Settings, TrendingUp, ChevronRight,
  ThumbsUp, ThumbsDown, Clock, User, AlertTriangle, CheckCircle,
  X, Search, RefreshCw, Eye, ChevronDown, Save, ToggleLeft, ToggleRight, BookOpen
} from 'lucide-react';

// ── Types ────────────────────────────────────────────────────────────────────

type TabId = 'knowledge' | 'ratings' | 'patterns' | 'config' | 'prompt';

interface Tab {
  id: TabId;
  label: string;
  icon: React.ReactNode;
}

interface RatingEntry {
  id: string;
  session_id: string;
  message_index: number;
  message_content: string;
  rebecca_response: string | null;
  rating: number;
  rating_label: 'thumbs_up' | 'thumbs_down';
  lead_intent: string | null;
  conversation_outcome: string | null;
  admin_reviewed: boolean;
  admin_notes: string | null;
  created_at: string;
}

interface SalesPattern {
  id: string;
  trigger_phrase: string;
  rebecca_response: string;
  intent_detected: string;
  outcome: string;
  created_at: string;
}

interface RebeccaConfig {
  model: string;
  max_output_tokens: number;
  temperature: number;
  is_enabled: boolean;
  rate_limit_max: number;
  rate_limit_window_ms: number;
  web_instructions: string;
  whatsapp_instructions: string;
  system_prompt_extra: string;
  max_history: number;
}

interface KnowledgeItem {
  id: string;
  category: string;
  title: string;
  content: string;
  is_active: boolean;
  updated_at: string;
}

// ── Constants ────────────────────────────────────────────────────────────────

const TABS: Tab[] = [
  { id: 'knowledge', label: 'Knowledge', icon: <BookOpen className="h-4 w-4" /> },
  { id: 'ratings', label: 'Feedback', icon: <Star className="h-4 w-4" /> },
  { id: 'patterns', label: 'Patrones', icon: <TrendingUp className="h-4 w-4" /> },
  { id: 'prompt', label: 'Prompt', icon: <Bot className="h-4 w-4" /> },
  { id: 'config', label: 'Config', icon: <Settings className="h-4 w-4" /> },
];

const EMPTY_FORM = { id: '', category: 'planes', title: '', content: '', is_active: true };

const CATEGORIES = [
  { value: 'all', label: 'Todas' },
  { value: 'planes', label: 'Planes y Precios' },
  { value: 'features', label: 'Features' },
  { value: 'faq', label: 'FAQ' },
  { value: 'proceso', label: 'Proceso de Venta' },
  { value: 'contacto', label: 'Contacto' },
];

const CATEGORY_COLORS: Record<string, string> = {
  planes: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
  features: 'bg-purple-500/15 text-purple-400 border-purple-500/30',
  faq: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
  proceso: 'bg-green-500/15 text-green-400 border-green-500/30',
  contacto: 'bg-pink-500/15 text-pink-400 border-pink-500/30',
};

// ── Tab: Knowledge ────────────────────────────────────────────────────────────

function KnowledgeTab() {
  const [items, setItems] = useState<KnowledgeItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [modalItem, setModalItem] = useState<Partial<KnowledgeItem> | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchItems = useCallback(async () => {
    try {
      setLoading(true);
      let url = '/admin/knowledge?';
      if (filterCategory !== 'all') url += `category=${filterCategory}&`;
      if (search) url += `search=${encodeURIComponent(search)}&`;
      const data = await adminApi.get<{ items: KnowledgeItem[] }>(url);
      setItems(data.items || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [filterCategory, search]);

  useEffect(() => { fetchItems(); }, [fetchItems]);

  const handleSave = async (form: Partial<KnowledgeItem>) => {
    const isNew = !items.find(i => i.id === form.id);
    if (isNew) {
      await adminApi.post('/admin/knowledge', form);
      showToast('Item creado correctamente');
    } else {
      await adminApi.patch(`/admin/knowledge/${form.id}`, form);
      showToast('Item actualizado correctamente');
    }
    fetchItems();
  };

  const handleToggleActive = async (item: KnowledgeItem) => {
    setActionLoading(item.id);
    try {
      await adminApi.patch(`/admin/knowledge/${item.id}`, { is_active: !item.is_active });
      showToast(item.is_active ? 'Item desactivado' : 'Item activado');
      fetchItems();
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async (item: KnowledgeItem) => {
    if (!confirm(`¿Eliminar "${item.title}"? Rebecca dejará de usar esta información.`)) return;
    setActionLoading(item.id);
    try {
      await adminApi.delete(`/admin/knowledge/${item.id}`);
      showToast('Item eliminado');
      fetchItems();
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setActionLoading(null);
    }
  };

  const grouped = CATEGORIES.filter(c => c.value !== 'all').reduce((acc, cat) => {
    acc[cat.value] = items.filter(i => i.category === cat.value);
    return acc;
  }, {} as Record<string, KnowledgeItem[]>);

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-[var(--text-secondary)]">
            Información que Rebecca usa para responder. <span className="font-medium text-green-400">{items.filter(i => i.is_active).length} activos</span>
          </p>
        </div>
        <button
          onClick={() => { setModalItem({ ...EMPTY_FORM }); setShowModal(true); }}
          className="flex items-center gap-2 rounded-xl bg-[var(--accent)] px-4 py-2.5 text-sm font-medium text-white hover:opacity-90"
        >
          <span className="text-lg">+</span> Nuevo item
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-secondary)]" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar..."
            className="w-full rounded-xl border border-[var(--border-color)] bg-[var(--bg-card)] py-2.5 pl-9 pr-4 text-sm text-[var(--text-primary)] placeholder-[var(--text-secondary)] focus:border-[var(--accent)] focus:outline-none"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          {CATEGORIES.map(cat => (
            <button
              key={cat.value}
              onClick={() => setFilterCategory(cat.value)}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                filterCategory === cat.value
                  ? 'bg-[var(--accent)] text-white'
                  : 'border border-[var(--border-color)] text-[var(--text-secondary)] hover:border-[var(--accent)] hover:text-[var(--accent)]'
              }`}
            >
              {cat.label}
              {cat.value !== 'all' && <span className="ml-1.5 opacity-70">{items.filter(i => i.category === cat.value).length}</span>}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-[var(--accent)]/30 border-t-[var(--accent)]" />
        </div>
      ) : error ? (
        <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-400">{error}</div>
      ) : items.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-[var(--border-color)] py-20 text-center">
          <Bot className="mb-3 h-10 w-10 text-[var(--text-secondary)]" />
          <p className="text-sm font-medium text-[var(--text-primary)]">Sin items de conocimiento</p>
        </div>
      ) : filterCategory !== 'all' ? (
        <div className="space-y-3">
          {items.map(item => (
            <KnowledgeCard key={item.id} item={item} actionLoading={actionLoading}
              onEdit={() => { setModalItem(item); setShowModal(true); }}
              onToggle={() => handleToggleActive(item)}
              onDelete={() => handleDelete(item)}
            />
          ))}
        </div>
      ) : (
        <div className="space-y-8">
          {CATEGORIES.filter(c => c.value !== 'all').map(cat => {
            const catItems = grouped[cat.value] || [];
            if (catItems.length === 0) return null;
            return (
              <div key={cat.value}>
                <div className="mb-3 flex items-center gap-2">
                  <span className={`rounded-md border px-2 py-0.5 text-xs font-medium ${CATEGORY_COLORS[cat.value] || ''}`}>{cat.label}</span>
                  <span className="text-xs text-[var(--text-secondary)]">{catItems.length} items</span>
                </div>
                <div className="space-y-3">
                  {catItems.map(item => (
                    <KnowledgeCard key={item.id} item={item} actionLoading={actionLoading}
                      onEdit={() => { setModalItem(item); setShowModal(true); }}
                      onToggle={() => handleToggleActive(item)}
                      onDelete={() => handleDelete(item)}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <AnimatePresence>
        {showModal && (
          <KnowledgeModal item={modalItem} onClose={() => { setShowModal(false); setModalItem(null); }} onSave={handleSave} />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {toast && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }}
            className={`fixed bottom-6 right-6 z-50 rounded-xl px-4 py-3 text-sm font-medium shadow-lg ${toast.type === 'success' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'}`}>
            {toast.msg}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Knowledge Card & Modal (reused) ──────────────────────────────────────────

function KnowledgeCard({ item, actionLoading, onEdit, onToggle, onDelete }: {
  item: KnowledgeItem; actionLoading: string | null;
  onEdit: () => void; onToggle: () => void; onDelete: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const isLoading = actionLoading === item.id;
  return (
    <motion.div layout className={`rounded-xl border bg-[var(--bg-card)] transition-colors ${item.is_active ? 'border-[var(--border-color)]' : 'border-[var(--border-color)] opacity-50'}`}>
      <div className="flex items-start gap-4 p-4">
        <div className={`mt-1 h-2 w-2 flex-shrink-0 rounded-full ${item.is_active ? 'bg-green-400' : 'bg-[var(--text-secondary)]'}`} />
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="text-sm font-medium text-[var(--text-primary)]">{item.title}</p>
              <p className="mt-0.5 font-mono text-xs text-[var(--text-secondary)]">{item.id}</p>
            </div>
            <span className={`flex-shrink-0 rounded-md border px-2 py-0.5 text-xs font-medium ${CATEGORY_COLORS[item.category] || 'bg-gray-500/15 text-gray-400 border-gray-500/30'}`}>
              {CATEGORIES.find(c => c.value === item.category)?.label || item.category}
            </span>
          </div>
          <p className={`mt-2 text-xs text-[var(--text-secondary)] ${expanded ? '' : 'line-clamp-2'}`}>{item.content}</p>
          {item.content.length > 120 && (
            <button onClick={() => setExpanded(e => !e)} className="mt-1 text-xs text-[var(--accent)] hover:underline">{expanded ? 'Ver menos' : 'Ver más'}</button>
          )}
          <p className="mt-2 text-xs text-[var(--text-secondary)]">Actualizado: {new Date(item.updated_at).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
        </div>
        <div className="flex flex-shrink-0 items-center gap-1">
          <button onClick={onToggle} disabled={isLoading} title={item.is_active ? 'Desactivar' : 'Activar'}
            className="rounded-lg p-1.5 text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)] disabled:opacity-50">
            {item.is_active ? <ToggleRight className="h-4 w-4 text-green-400" /> : <ToggleLeft className="h-4 w-4" />}
          </button>
          <button onClick={onEdit} title="Editar" className="rounded-lg p-1.5 text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)]">
            <span className="text-sm">✏️</span>
          </button>
          <button onClick={onDelete} disabled={isLoading} title="Eliminar"
            className="rounded-lg p-1.5 text-[var(--text-secondary)] hover:bg-red-500/10 hover:text-red-400 disabled:opacity-50">
            <span className="text-sm">🗑️</span>
          </button>
        </div>
      </div>
    </motion.div>
  );
}

function KnowledgeModal({ item, onClose, onSave }: {
  item: Partial<KnowledgeItem> | null;
  onClose: () => void;
  onSave: (data: Partial<KnowledgeItem>) => Promise<void>;
}) {
  const isNew = !item?.id || item.id === '';
  const [form, setForm] = useState<Partial<KnowledgeItem>>(item || EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.id?.trim() || !form.title?.trim() || !form.content?.trim()) {
      setError('ID, título y contenido son requeridos');
      return;
    }
    setSaving(true);
    setError('');
    try { await onSave(form); onClose(); } catch (err: any) { setError(err?.data?.message || err.message || 'Error al guardar'); }
    finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-2xl rounded-2xl border border-[var(--border-color)] bg-[var(--bg-card)] shadow-2xl">
        <div className="flex items-center justify-between border-b border-[var(--border-color)] px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--accent)]/10">
              <Bot className="h-5 w-5 text-[var(--accent)]" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-[var(--text-primary)]">{isNew ? 'Nuevo item' : 'Editar item'}</h2>
              <p className="text-xs text-[var(--text-secondary)]">Rebecca usará esta información para responder</p>
            </div>
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]">
            <X className="h-5 w-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-[var(--text-secondary)]">ID único <span className="text-red-400">*</span></label>
              <input type="text" value={form.id || ''}
                onChange={e => setForm(f => ({ ...f, id: e.target.value.toLowerCase().replace(/\s+/g, '_') }))}
                disabled={!isNew} placeholder="plan_basic, faq_instalacion..."
                className="w-full rounded-lg border border-[var(--border-color)] bg-[var(--bg-input)] px-3 py-2 text-sm text-[var(--text-primary)] placeholder-[var(--text-secondary)] focus:border-[var(--accent)] focus:outline-none disabled:opacity-50" />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-[var(--text-secondary)]">Categoría <span className="text-red-400">*</span></label>
              <div className="relative">
                <select value={form.category || 'planes'} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                  className="w-full appearance-none rounded-lg border border-[var(--border-color)] bg-[var(--bg-input)] px-3 py-2 text-sm text-[var(--text-primary)] focus:border-[var(--accent)] focus:outline-none">
                  {CATEGORIES.filter(c => c.value !== 'all').map(c => (<option key={c.value} value={c.value}>{c.label}</option>))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-secondary)]" />
              </div>
            </div>
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium text-[var(--text-secondary)]">Título <span className="text-red-400">*</span></label>
            <input type="text" value={form.title || ''} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
              placeholder="Plan BASIC, ¿Cómo se instala?, etc."
              className="w-full rounded-lg border border-[var(--border-color)] bg-[var(--bg-input)] px-3 py-2 text-sm text-[var(--text-primary)] placeholder-[var(--text-secondary)] focus:border-[var(--accent)] focus:outline-none" />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium text-[var(--text-secondary)]">Contenido <span className="text-red-400">*</span></label>
            <textarea value={form.content || ''} onChange={e => setForm(f => ({ ...f, content: e.target.value }))}
              rows={8} placeholder="Información que Rebecca debe conocer..."
              className="w-full rounded-lg border border-[var(--border-color)] bg-[var(--bg-input)] px-3 py-2 text-sm text-[var(--text-primary)] placeholder-[var(--text-secondary)] focus:border-[var(--accent)] focus:outline-none resize-none font-mono" />
            <p className="mt-1 text-xs text-[var(--text-secondary)]">{form.content?.length || 0} caracteres</p>
          </div>
          <div className="flex items-center gap-3">
            <button type="button" onClick={() => setForm(f => ({ ...f, is_active: !f.is_active }))}
              className="flex items-center gap-2 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)]">
              {form.is_active ? <ToggleRight className="h-5 w-5 text-green-400" /> : <ToggleLeft className="h-5 w-5" />}
              {form.is_active ? 'Activo' : 'Inactivo'}
            </button>
          </div>
          {error && <p className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-400">{error}</p>}
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="rounded-lg border border-[var(--border-color)] px-4 py-2 text-sm text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]">Cancelar</button>
            <button type="submit" disabled={saving}
              className="flex items-center gap-2 rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50">
              {saving ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" /> : <Save className="h-4 w-4" />}
              {saving ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

// ── Tab: Ratings ──────────────────────────────────────────────────────────────

function RatingsTab() {
  const [ratings, setRatings] = useState<RatingEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'negative' | 'positive' | 'unreviewed'>('unreviewed');
  const [stats, setStats] = useState<{ total: number; positive: number; negative: number; avg_rating: number; unreviewed: number } | null>(null);
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);
  const [selectedRating, setSelectedRating] = useState<RatingEntry | null>(null);

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchRatings = useCallback(async () => {
    try {
      setLoading(true);
      let url = '/chat/ratings/unreviewed?limit=50';
      if (filter === 'negative') url = '/chat/ratings/negative?limit=50';
      const data = await adminApi.get<{ ratings: RatingEntry[] }>(url);
      setRatings(data.ratings || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [filter]);

  const fetchStats = useCallback(async () => {
    try {
      const data = await adminApi.get('/chat/ratings/stats');
      setStats(data);
    } catch { /* ignore */ }
  }, []);

  useEffect(() => { fetchRatings(); fetchStats(); }, [fetchRatings, fetchStats]);

  const handleMarkReviewed = async (id: string, notes?: string) => {
    try {
      await adminApi.patch(`/chat/ratings/${id}/review`, { notes });
      showToast('Marcado como revisado');
      fetchRatings();
      fetchStats();
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="rounded-xl border border-[var(--border-color)] bg-[var(--bg-card)] p-4">
            <p className="text-xs text-[var(--text-secondary)]">Total ratings</p>
            <p className="mt-1 text-2xl font-bold text-[var(--text-primary)]">{stats.total}</p>
          </div>
          <div className="rounded-xl border border-[var(--border-color)] bg-[var(--bg-card)] p-4">
            <p className="text-xs text-[var(--text-secondary)]">Positivos</p>
            <p className="mt-1 text-2xl font-bold text-green-400">{stats.positive}</p>
          </div>
          <div className="rounded-xl border border-[var(--border-color)] bg-[var(--bg-card)] p-4">
            <p className="text-xs text-[var(--text-secondary)]">Negativos</p>
            <p className="mt-1 text-2xl font-bold text-red-400">{stats.negative}</p>
          </div>
          <div className="rounded-xl border border-[var(--border-color)] bg-[var(--bg-card)] p-4">
            <p className="text-xs text-[var(--text-secondary)]">Sin revisar</p>
            <p className="mt-1 text-2xl font-bold text-amber-400">{stats.unreviewed}</p>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex gap-2">
        {(['unreviewed', 'negative', 'positive', 'all'] as const).map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
              filter === f ? 'bg-[var(--accent)] text-white' : 'border border-[var(--border-color)] text-[var(--text-secondary)] hover:border-[var(--accent)]'
            }`}>
            {f === 'unreviewed' ? 'Sin revisar' : f === 'negative' ? 'Negativos' : f === 'positive' ? 'Positivos' : 'Todos'}
          </button>
        ))}
      </div>

      {/* List */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-[var(--accent)]/30 border-t-[var(--accent)]" />
        </div>
      ) : error ? (
        <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-400">{error}</div>
      ) : ratings.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-[var(--border-color)] py-20 text-center">
          <Star className="mb-3 h-10 w-10 text-[var(--text-secondary)]" />
          <p className="text-sm font-medium text-[var(--text-primary)]">No hay ratings {filter !== 'all' ? `(${filter})` : ''}</p>
        </div>
      ) : (
        <div className="space-y-4">
          {ratings.map(rating => (
            <div key={rating.id} className={`rounded-xl border bg-[var(--bg-card)] p-4 ${rating.rating_label === 'thumbs_down' ? 'border-red-500/30' : 'border-green-500/30'}`}>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  {rating.rating_label === 'thumbs_down' ? (
                    <ThumbsDown className="h-4 w-4 text-red-400" />
                  ) : (
                    <ThumbsUp className="h-4 w-4 text-green-400" />
                  )}
                  <div>
                    <p className="text-sm font-medium text-[var(--text-primary)]">
                      Rating: {rating.rating}/5 — {rating.rating_label === 'thumbs_down' ? 'Negativo' : 'Positivo'}
                    </p>
                    <p className="text-xs text-[var(--text-secondary)]">
                      {rating.lead_intent || 'sin intent'} • Session: {rating.session_id.slice(0, 8)}... • {new Date(rating.created_at).toLocaleDateString('es-CO')}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {rating.admin_reviewed ? (
                    <span className="rounded-md bg-green-500/10 px-2 py-1 text-xs text-green-400">✅ Revisado</span>
                  ) : (
                    <button onClick={() => handleMarkReviewed(rating.id)}
                      className="rounded-md bg-[var(--accent)]/10 px-3 py-1 text-xs text-[var(--accent)] hover:bg-[var(--accent)]/20">
                      Marcar revisado
                    </button>
                  )}
                  <button onClick={() => setSelectedRating(rating)}
                    className="rounded-lg p-1.5 text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]">
                    <Eye className="h-4 w-4" />
                  </button>
                </div>
              </div>
              <div className="mt-3 rounded-lg bg-[var(--bg-input)] p-3">
                <p className="text-xs text-[var(--text-secondary)]">Mensaje del lead:</p>
                <p className="mt-1 text-sm text-[var(--text-primary)]">{rating.message_content}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Detail Modal */}
      <AnimatePresence>
        {selectedRating && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-2xl rounded-2xl border border-[var(--border-color)] bg-[var(--bg-card)] shadow-2xl">
              <div className="flex items-center justify-between border-b border-[var(--border-color)] px-6 py-4">
                <div className="flex items-center gap-3">
                  {selectedRating.rating_label === 'thumbs_down' ? (
                    <ThumbsDown className="h-5 w-5 text-red-400" />
                  ) : (
                    <ThumbsUp className="h-5 w-5 text-green-400" />
                  )}
                  <div>
                    <h2 className="text-base font-semibold text-[var(--text-primary)]">Detalle del rating</h2>
                    <p className="text-xs text-[var(--text-secondary)]">Rating {selectedRating.rating}/5 — {selectedRating.rating_label}</p>
                  </div>
                </div>
                <button onClick={() => setSelectedRating(null)} className="rounded-lg p-1.5 text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]">
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <p className="text-xs font-medium text-[var(--text-secondary)]">MENSAJE DEL LEAD</p>
                  <div className="mt-2 rounded-lg bg-[var(--bg-input)] p-3">
                    <p className="text-sm text-[var(--text-primary)]">{selectedRating.message_content}</p>
                  </div>
                </div>
                {selectedRating.rebecca_response && (
                  <div>
                    <p className="text-xs font-medium text-[var(--text-secondary)]">RESPUESTA DE REBECCA</p>
                    <div className="mt-2 rounded-lg bg-[var(--accent)]/5 border border-[var(--accent)]/20 p-3">
                      <p className="text-sm text-[var(--text-primary)]">{selectedRating.rebecca_response}</p>
                    </div>
                  </div>
                )}
                <div className="flex items-center gap-4 text-xs text-[var(--text-secondary)]">
                  <span><Clock className="inline h-3 w-3 mr-1" />{new Date(selectedRating.created_at).toLocaleString('es-CO')}</span>
                  <span><User className="inline h-3 w-3 mr-1" />Intent: {selectedRating.lead_intent || 'N/A'}</span>
                  <span>Session: {selectedRating.session_id.slice(0, 12)}...</span>
                </div>
                {!selectedRating.admin_reviewed && (
                  <div className="flex justify-end gap-3 pt-2">
                    <button onClick={() => { handleMarkReviewed(selectedRating.id); setSelectedRating(null); }}
                      className="flex items-center gap-2 rounded-lg bg-green-500 px-4 py-2 text-sm font-medium text-white hover:opacity-90">
                      <CheckCircle className="h-4 w-4" /> Marcar como revisado
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {toast && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }}
            className={`fixed bottom-6 right-6 z-50 rounded-xl px-4 py-3 text-sm font-medium shadow-lg ${toast.type === 'success' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'}`}>
            {toast.msg}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Tab: Patterns ─────────────────────────────────────────────────────────────

function PatternsTab() {
  const [patterns, setPatterns] = useState<SalesPattern[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPatterns = async () => {
      try {
        setLoading(true);
        const data = await adminApi.get<{ patterns: SalesPattern[] }>('/admin/sales-patterns?limit=100');
        setPatterns(data.patterns || []);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchPatterns();
  }, []);

  const intentCounts = patterns.reduce((acc, p) => {
    acc[p.intent_detected] = (acc[p.intent_detected] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const outcomeCounts = patterns.reduce((acc, p) => {
    acc[p.outcome] = (acc[p.outcome] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="rounded-xl border border-[var(--border-color)] bg-[var(--bg-card)] p-4">
          <p className="text-xs text-[var(--text-secondary)]">Total patrones</p>
          <p className="mt-1 text-2xl font-bold text-[var(--text-primary)]">{patterns.length}</p>
        </div>
        {Object.entries(intentCounts).slice(0, 4).map(([intent, count]) => (
          <div key={intent} className="rounded-xl border border-[var(--border-color)] bg-[var(--bg-card)] p-4">
            <p className="text-xs text-[var(--text-secondary)] capitalize">{intent.replace('_', ' ')}</p>
            <p className="mt-1 text-2xl font-bold text-[var(--accent)]">{count}</p>
          </div>
        ))}
      </div>

      {/* List */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-[var(--accent)]/30 border-t-[var(--accent)]" />
        </div>
      ) : error ? (
        <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-400">{error}</div>
      ) : patterns.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-[var(--border-color)] py-20 text-center">
          <TrendingUp className="mb-3 h-10 w-10 text-[var(--text-secondary)]" />
          <p className="text-sm font-medium text-[var(--text-primary)]">No hay patrones registrados</p>
        </div>
      ) : (
        <div className="space-y-3">
          {patterns.slice(0, 50).map(pattern => (
            <div key={pattern.id} className="rounded-xl border border-[var(--border-color)] bg-[var(--bg-card)] p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className={`rounded-md px-2 py-0.5 text-xs font-medium ${
                      pattern.outcome === 'converted' ? 'bg-green-500/10 text-green-400' :
                      pattern.outcome === 'abandoned' ? 'bg-red-500/10 text-red-400' : 'bg-gray-500/10 text-gray-400'
                    }`}>
                      {pattern.outcome}
                    </span>
                    <span className="rounded-md bg-[var(--accent)]/10 px-2 py-0.5 text-xs text-[var(--accent)]">{pattern.intent_detected}</span>
                  </div>
                  <p className="mt-2 text-sm text-[var(--text-secondary)]">Trigger: <span className="text-[var(--text-primary)]">{pattern.trigger_phrase.slice(0, 80)}{pattern.trigger_phrase.length > 80 ? '...' : ''}</span></p>
                  <p className="mt-1 text-sm text-[var(--text-secondary)]">Response: <span className="text-[var(--text-primary)]">{pattern.rebecca_response.slice(0, 80)}{pattern.rebecca_response.length > 80 ? '...' : ''}</span></p>
                </div>
                <p className="text-xs text-[var(--text-secondary)]">{new Date(pattern.created_at).toLocaleDateString('es-CO')}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Tab: Prompt ───────────────────────────────────────────────────────────────

function PromptTab() {
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    adminApi.get<{ config: string }>('/admin/rebecca/system-prompt').then(data => {
      setPrompt(data.config || '');
      setLoading(false);
    }).catch(() => {
      // Si no existe el endpoint, mostrar placeholder
      setPrompt('# System Prompt de Rebecca\n\nEdita este prompt para cambiar el comportamiento de Rebecca.');
      setLoading(false);
    });
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      await adminApi.post('/admin/rebecca/system-prompt', { config: prompt });
      showToast('Prompt actualizado');
    } catch (err: any) {
      setError(err.message);
      showToast(err.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[var(--accent)]/30 border-t-[var(--accent)]" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-[var(--text-secondary)]">
            Este es el system prompt que usa Rebecca. Cambialo con cuidado — afecta directamente sus respuestas.
          </p>
        </div>
        <button onClick={handleSave} disabled={saving}
          className="flex items-center gap-2 rounded-xl bg-[var(--accent)] px-4 py-2.5 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50">
          {saving ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" /> : <Save className="h-4 w-4" />}
          {saving ? 'Guardando...' : 'Guardar prompt'}
        </button>
      </div>

      {error && <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-400">{error}</div>}

      <div className="rounded-xl border border-[var(--border-color)] bg-[var(--bg-card)]">
        <textarea
          value={prompt}
          onChange={e => setPrompt(e.target.value)}
          rows={30}
          className="w-full rounded-t-xl border-b border-[var(--border-color)] bg-[var(--bg-input)] px-4 py-3 text-sm text-[var(--text-primary)] font-mono focus:outline-none resize-none"
          spellCheck={false}
        />
        <div className="flex items-center justify-between border-t border-[var(--border-color)] px-4 py-2">
          <p className="text-xs text-[var(--text-secondary)]">{prompt.length} caracteres</p>
          <p className="text-xs text-[var(--text-secondary)]">Usa {"{{variable}}"} para placeholders del sistema</p>
        </div>
      </div>

      <AnimatePresence>
        {toast && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }}
            className={`fixed bottom-6 right-6 z-50 rounded-xl px-4 py-3 text-sm font-medium shadow-lg ${toast.type === 'success' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'}`}>
            {toast.msg}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Tab: Config ───────────────────────────────────────────────────────────────

function ConfigTab() {
  const [config, setConfig] = useState<RebeccaConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    adminApi.get<{ config: RebeccaConfig }>('/admin/rebecca/config').then(data => {
      setConfig(data.config);
      setLoading(false);
    }).catch(() => {
      setConfig({
        model: 'gemini-2.5-flash',
        max_output_tokens: 600,
        temperature: 0.7,
        is_enabled: true,
        rate_limit_max: 20,
        rate_limit_window_ms: 3600000,
        web_instructions: 'Respuestas completas pero concisas. Máximo 3 párrafos.',
        whatsapp_instructions: 'Máximo 200 caracteres por mensaje.',
        system_prompt_extra: '',
        max_history: 10,
      });
      setLoading(false);
    });
  }, []);

  const handleSave = async () => {
    if (!config) return;
    setSaving(true);
    setError(null);
    try {
      await adminApi.post('/admin/rebecca/config', config);
      showToast('Configuración guardada');
    } catch (err: any) {
      setError(err.message);
      showToast(err.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[var(--accent)]/30 border-t-[var(--accent)]" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-[var(--text-secondary)]">
            Configuración técnica de Rebecca. Cambia con precaución.
          </p>
        </div>
        <button onClick={handleSave} disabled={saving}
          className="flex items-center gap-2 rounded-xl bg-[var(--accent)] px-4 py-2.5 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50">
          {saving ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" /> : <Save className="h-4 w-4" />}
          {saving ? 'Guardando...' : 'Guardar config'}
        </button>
      </div>

      {error && <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-400">{error}</div>}

      {config && (
        <div className="space-y-6">
          {/* Enable/Disable */}
          <div className="rounded-xl border border-[var(--border-color)] bg-[var(--bg-card)] p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-[var(--text-primary)]">Rebecca habilitada</p>
                <p className="mt-1 text-xs text-[var(--text-secondary)]">Si está desactivada, Rebecca no responderá a mensajes</p>
              </div>
              <button onClick={() => setConfig({ ...config, is_enabled: !config.is_enabled })}
                className={`relative h-6 w-11 rounded-full transition-colors ${config.is_enabled ? 'bg-green-500' : 'bg-gray-600'}`}>
                <span className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${config.is_enabled ? 'translate-x-5' : ''}`} />
              </button>
            </div>
          </div>

          {/* Model settings */}
          <div className="rounded-xl border border-[var(--border-color)] bg-[var(--bg-card)] p-6 space-y-4">
            <h3 className="text-sm font-medium text-[var(--text-primary)]">Modelo AI</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-[var(--text-secondary)]">Modelo</label>
                <input type="text" value={config.model}
                  onChange={e => setConfig({ ...config, model: e.target.value })}
                  className="w-full rounded-lg border border-[var(--border-color)] bg-[var(--bg-input)] px-3 py-2 text-sm text-[var(--text-primary)] focus:border-[var(--accent)] focus:outline-none" />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-[var(--text-secondary)]">Max output tokens</label>
                <input type="number" value={config.max_output_tokens}
                  onChange={e => setConfig({ ...config, max_output_tokens: parseInt(e.target.value) || 600 })}
                  className="w-full rounded-lg border border-[var(--border-color)] bg-[var(--bg-input)] px-3 py-2 text-sm text-[var(--text-primary)] focus:border-[var(--accent)] focus:outline-none" />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-[var(--text-secondary)]">Temperature (0-1)</label>
                <input type="number" step="0.1" min="0" max="1" value={config.temperature}
                  onChange={e => setConfig({ ...config, temperature: parseFloat(e.target.value) || 0.7 })}
                  className="w-full rounded-lg border border-[var(--border-color)] bg-[var(--bg-input)] px-3 py-2 text-sm text-[var(--text-primary)] focus:border-[var(--accent)] focus:outline-none" />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-[var(--text-secondary)]">Max history messages</label>
                <input type="number" value={config.max_history}
                  onChange={e => setConfig({ ...config, max_history: parseInt(e.target.value) || 10 })}
                  className="w-full rounded-lg border border-[var(--border-color)] bg-[var(--bg-input)] px-3 py-2 text-sm text-[var(--text-primary)] focus:border-[var(--accent)] focus:outline-none" />
              </div>
            </div>
          </div>

          {/* Rate limit */}
          <div className="rounded-xl border border-[var(--border-color)] bg-[var(--bg-card)] p-6 space-y-4">
            <h3 className="text-sm font-medium text-[var(--text-primary)]">Rate Limit</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-[var(--text-secondary)]">Máximo requests</label>
                <input type="number" value={config.rate_limit_max}
                  onChange={e => setConfig({ ...config, rate_limit_max: parseInt(e.target.value) || 20 })}
                  className="w-full rounded-lg border border-[var(--border-color)] bg-[var(--bg-input)] px-3 py-2 text-sm text-[var(--text-primary)] focus:border-[var(--accent)] focus:outline-none" />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-[var(--text-secondary)]">Ventana (ms)</label>
                <input type="number" value={config.rate_limit_window_ms}
                  onChange={e => setConfig({ ...config, rate_limit_window_ms: parseInt(e.target.value) || 3600000 })}
                  className="w-full rounded-lg border border-[var(--border-color)] bg-[var(--bg-input)] px-3 py-2 text-sm text-[var(--text-primary)] focus:border-[var(--accent)] focus:outline-none" />
              </div>
            </div>
          </div>

          {/* Channel instructions */}
          <div className="rounded-xl border border-[var(--border-color)] bg-[var(--bg-card)] p-6 space-y-4">
            <h3 className="text-sm font-medium text-[var(--text-primary)]">Instrucciones por canal</h3>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-[var(--text-secondary)]">Web</label>
              <textarea value={config.web_instructions}
                onChange={e => setConfig({ ...config, web_instructions: e.target.value })}
                rows={2}
                className="w-full rounded-lg border border-[var(--border-color)] bg-[var(--bg-input)] px-3 py-2 text-sm text-[var(--text-primary)] focus:border-[var(--accent)] focus:outline-none resize-none" />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-[var(--text-secondary)]">WhatsApp</label>
              <textarea value={config.whatsapp_instructions}
                onChange={e => setConfig({ ...config, whatsapp_instructions: e.target.value })}
                rows={2}
                className="w-full rounded-lg border border-[var(--border-color)] bg-[var(--bg-input)] px-3 py-2 text-sm text-[var(--text-primary)] focus:border-[var(--accent)] focus:outline-none resize-none" />
            </div>
          </div>
        </div>
      )}

      <AnimatePresence>
        {toast && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }}
            className={`fixed bottom-6 right-6 z-50 rounded-xl px-4 py-3 text-sm font-medium shadow-lg ${toast.type === 'success' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'}`}>
            {toast.msg}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Main Page ────────────────────────────────────────────────────────────────

export default function RebeccaAdminPage() {
  const [activeTab, setActiveTab] = useState<TabId>('ratings');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--accent)]/10">
            <Bot className="h-6 w-6 text-[var(--accent)]" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-[var(--text-primary)]">Rebecca Hub</h1>
            <p className="mt-1 text-sm text-[var(--text-secondary)]">
              Centro de control para el agente de ventas de Lookitry.
            </p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-[var(--border-color)] pb-4">
        {TABS.map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition-colors ${
              activeTab === tab.id
                ? 'bg-[var(--accent)] text-white'
                : 'text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)]'
            }`}>
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'knowledge' && <KnowledgeTab />}
      {activeTab === 'ratings' && <RatingsTab />}
      {activeTab === 'patterns' && <PatternsTab />}
      {activeTab === 'prompt' && <PromptTab />}
      {activeTab === 'config' && <ConfigTab />}
    </div>
  );
}