'use client';

import { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { adminApi } from '@/services/adminApi';
import { Plus, Pencil, Trash2, Search, X, ChevronDown, Bot, ToggleLeft, ToggleRight, Save } from 'lucide-react';

// ── Types ────────────────────────────────────────────────────────────────────

interface KnowledgeItem {
  id: string;
  category: string;
  title: string;
  content: string;
  is_active: boolean;
  updated_at: string;
}

const CATEGORIES = [
  { value: 'all', label: 'Todas' },
  { value: 'planes', label: 'Planes y Precios' },
  { value: 'features', label: 'Features' },
  { value: 'faq', label: 'FAQ' },
  { value: 'proceso', label: 'Proceso de Venta' },
  { value: 'contacto', label: 'Contacto' },
];

const CATEGORY_COLORS: Record<string, string> = {
  planes:   'bg-blue-500/15 text-blue-400 border-blue-500/30',
  features: 'bg-purple-500/15 text-purple-400 border-purple-500/30',
  faq:      'bg-amber-500/15 text-amber-400 border-amber-500/30',
  proceso:  'bg-green-500/15 text-green-400 border-green-500/30',
  contacto: 'bg-pink-500/15 text-pink-400 border-pink-500/30',
};

const EMPTY_FORM = { id: '', category: 'planes', title: '', content: '', is_active: true };

// ── Modal ────────────────────────────────────────────────────────────────────

function KnowledgeModal({
  item,
  onClose,
  onSave,
}: {
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
    try {
      await onSave(form);
      onClose();
    } catch (err: any) {
      setError(err?.data?.message || err.message || 'Error al guardar');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-2xl rounded-2xl border border-[var(--border-color)] bg-[var(--bg-card)] shadow-2xl"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[var(--border-color)] px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--accent)]/10">
              <Bot className="h-5 w-5 text-[var(--accent)]" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-[var(--text-primary)]">
                {isNew ? 'Nuevo item de conocimiento' : 'Editar item'}
              </h2>
              <p className="text-xs text-[var(--text-secondary)]">Rebecca usará esta información para responder</p>
            </div>
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)]">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            {/* ID */}
            <div>
              <label className="mb-1.5 block text-xs font-medium text-[var(--text-secondary)]">
                ID único <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={form.id || ''}
                onChange={e => setForm(f => ({ ...f, id: e.target.value.toLowerCase().replace(/\s+/g, '_') }))}
                disabled={!isNew}
                placeholder="plan_basic, faq_instalacion..."
                className="w-full rounded-lg border border-[var(--border-color)] bg-[var(--bg-input)] px-3 py-2 text-sm text-[var(--text-primary)] placeholder-[var(--text-secondary)] focus:border-[var(--accent)] focus:outline-none disabled:opacity-50"
              />
            </div>

            {/* Category */}
            <div>
              <label className="mb-1.5 block text-xs font-medium text-[var(--text-secondary)]">
                Categoría <span className="text-red-400">*</span>
              </label>
              <div className="relative">
                <select
                  value={form.category || 'planes'}
                  onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                  className="w-full appearance-none rounded-lg border border-[var(--border-color)] bg-[var(--bg-input)] px-3 py-2 text-sm text-[var(--text-primary)] focus:border-[var(--accent)] focus:outline-none"
                >
                  {CATEGORIES.filter(c => c.value !== 'all').map(c => (
                    <option key={c.value} value={c.value}>{c.label}</option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-secondary)]" />
              </div>
            </div>
          </div>

          {/* Title */}
          <div>
            <label className="mb-1.5 block text-xs font-medium text-[var(--text-secondary)]">
              Título <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={form.title || ''}
              onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
              placeholder="Plan BASIC, ¿Cómo se instala?, etc."
              className="w-full rounded-lg border border-[var(--border-color)] bg-[var(--bg-input)] px-3 py-2 text-sm text-[var(--text-primary)] placeholder-[var(--text-secondary)] focus:border-[var(--accent)] focus:outline-none"
            />
          </div>

          {/* Content */}
          <div>
            <label className="mb-1.5 block text-xs font-medium text-[var(--text-secondary)]">
              Contenido <span className="text-red-400">*</span>
              <span className="ml-2 font-normal text-[var(--text-secondary)]">— Rebecca leerá esto textualmente</span>
            </label>
            <textarea
              value={form.content || ''}
              onChange={e => setForm(f => ({ ...f, content: e.target.value }))}
              rows={8}
              placeholder="Escribe la información que Rebecca debe conocer sobre este tema..."
              className="w-full rounded-lg border border-[var(--border-color)] bg-[var(--bg-input)] px-3 py-2 text-sm text-[var(--text-primary)] placeholder-[var(--text-secondary)] focus:border-[var(--accent)] focus:outline-none resize-none font-mono"
            />
            <p className="mt-1 text-xs text-[var(--text-secondary)]">{form.content?.length || 0} caracteres</p>
          </div>

          {/* Active toggle */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setForm(f => ({ ...f, is_active: !f.is_active }))}
              className="flex items-center gap-2 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            >
              {form.is_active
                ? <ToggleRight className="h-5 w-5 text-green-400" />
                : <ToggleLeft className="h-5 w-5 text-[var(--text-secondary)]" />}
              {form.is_active ? 'Activo — Rebecca puede usar este item' : 'Inactivo — Rebecca no lo usará'}
            </button>
          </div>

          {error && (
            <p className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-400">{error}</p>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-[var(--border-color)] px-4 py-2 text-sm text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50"
            >
              {saving ? (
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              {saving ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

// ── Main Page ────────────────────────────────────────────────────────────────

export default function KnowledgePage() {
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

  const activeCount = items.filter(i => i.is_active).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">Knowledge Base</h1>
          <p className="mt-1 text-sm text-[var(--text-secondary)]">
            Información que Rebecca (agente WhatsApp) usa para responder a prospectos.
            <span className="ml-2 font-medium text-green-400">{activeCount} items activos</span>
          </p>
        </div>
        <button
          onClick={() => { setModalItem({ ...EMPTY_FORM }); setShowModal(true); }}
          className="flex items-center gap-2 rounded-xl bg-[var(--accent)] px-4 py-2.5 text-sm font-medium text-white hover:opacity-90"
        >
          <Plus className="h-4 w-4" />
          Nuevo item
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
            placeholder="Buscar en título o contenido..."
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
              {cat.value !== 'all' && (
                <span className="ml-1.5 opacity-70">
                  {items.filter(i => i.category === cat.value).length}
                </span>
              )}
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
          <p className="mt-1 text-xs text-[var(--text-secondary)]">Crea el primer item para que Rebecca pueda responder</p>
        </div>
      ) : filterCategory !== 'all' ? (
        /* Flat list when filtered */
        <div className="space-y-3">
          {items.map(item => (
            <KnowledgeCard
              key={item.id}
              item={item}
              actionLoading={actionLoading}
              onEdit={() => { setModalItem(item); setShowModal(true); }}
              onToggle={() => handleToggleActive(item)}
              onDelete={() => handleDelete(item)}
            />
          ))}
        </div>
      ) : (
        /* Grouped by category */
        <div className="space-y-8">
          {CATEGORIES.filter(c => c.value !== 'all').map(cat => {
            const catItems = grouped[cat.value] || [];
            if (catItems.length === 0) return null;
            return (
              <div key={cat.value}>
                <div className="mb-3 flex items-center gap-2">
                  <span className={`rounded-md border px-2 py-0.5 text-xs font-medium ${CATEGORY_COLORS[cat.value] || ''}`}>
                    {cat.label}
                  </span>
                  <span className="text-xs text-[var(--text-secondary)]">{catItems.length} items</span>
                </div>
                <div className="space-y-3">
                  {catItems.map(item => (
                    <KnowledgeCard
                      key={item.id}
                      item={item}
                      actionLoading={actionLoading}
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

      {/* Modal */}
      <AnimatePresence>
        {showModal && (
          <KnowledgeModal
            item={modalItem}
            onClose={() => { setShowModal(false); setModalItem(null); }}
            onSave={handleSave}
          />
        )}
      </AnimatePresence>

      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className={`fixed bottom-6 right-6 z-50 rounded-xl px-4 py-3 text-sm font-medium shadow-lg ${
              toast.type === 'success'
                ? 'bg-green-500 text-white'
                : 'bg-red-500 text-white'
            }`}
          >
            {toast.msg}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Knowledge Card ────────────────────────────────────────────────────────────

function KnowledgeCard({
  item,
  actionLoading,
  onEdit,
  onToggle,
  onDelete,
}: {
  item: KnowledgeItem;
  actionLoading: string | null;
  onEdit: () => void;
  onToggle: () => void;
  onDelete: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const isLoading = actionLoading === item.id;

  return (
    <motion.div
      layout
      className={`rounded-xl border bg-[var(--bg-card)] transition-colors ${
        item.is_active
          ? 'border-[var(--border-color)]'
          : 'border-[var(--border-color)] opacity-50'
      }`}
    >
      <div className="flex items-start gap-4 p-4">
        {/* Status dot */}
        <div className={`mt-1 h-2 w-2 flex-shrink-0 rounded-full ${item.is_active ? 'bg-green-400' : 'bg-[var(--text-secondary)]'}`} />

        {/* Content */}
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

          {/* Preview / expanded content */}
          <div className="mt-2">
            <p className={`text-xs text-[var(--text-secondary)] ${expanded ? '' : 'line-clamp-2'}`}>
              {item.content}
            </p>
            {item.content.length > 120 && (
              <button
                onClick={() => setExpanded(e => !e)}
                className="mt-1 text-xs text-[var(--accent)] hover:underline"
              >
                {expanded ? 'Ver menos' : 'Ver más'}
              </button>
            )}
          </div>

          {/* Updated at */}
          <p className="mt-2 text-xs text-[var(--text-secondary)]">
            Actualizado: {new Date(item.updated_at).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
          </p>
        </div>

        {/* Actions */}
        <div className="flex flex-shrink-0 items-center gap-1">
          <button
            onClick={onToggle}
            disabled={isLoading}
            title={item.is_active ? 'Desactivar' : 'Activar'}
            className="rounded-lg p-1.5 text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)] disabled:opacity-50"
          >
            {item.is_active
              ? <ToggleRight className="h-4 w-4 text-green-400" />
              : <ToggleLeft className="h-4 w-4" />}
          </button>
          <button
            onClick={onEdit}
            title="Editar"
            className="rounded-lg p-1.5 text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)]"
          >
            <Pencil className="h-4 w-4" />
          </button>
          <button
            onClick={onDelete}
            disabled={isLoading}
            title="Eliminar"
            className="rounded-lg p-1.5 text-[var(--text-secondary)] hover:bg-red-500/10 hover:text-red-400 disabled:opacity-50"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>
    </motion.div>
  );
}