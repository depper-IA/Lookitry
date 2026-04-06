'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, Calendar, Clock, Coins, Zap, CheckCircle, XCircle, 
  Edit2, Trash2, ToggleLeft, ToggleRight, AlertCircle, Sparkles, X
} from 'lucide-react';
import { adminApi } from '@/services/adminApi';

// ── Types ────────────────────────────────────────────────────────────────────

interface TrialCampaign {
  id: string;
  name: string;
  active: boolean;
  trial_days: number;
  trial_generations_limit: number;
  price_cop: number;
  ends_at: string | null;
  require_card_verification: boolean;
  created_by: string;
  created_at: string;
  updated_at: string;
}

interface CampaignResponse {
  campaigns: TrialCampaign[];
  activeCampaign: TrialCampaign | null;
}

// ── Toast Component ──────────────────────────────────────────────────────────

function Toast({ message, type, onClose }: { message: string; type: 'success' | 'error'; onClose: () => void }) {
  useEffect(() => { const t = setTimeout(onClose, 4000); return () => clearTimeout(t); }, [onClose]);
  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 20, scale: 0.95 }}
      className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg text-sm font-medium text-white ${
        type === 'success' ? 'bg-emerald-600' : 'bg-red-600'
      }`}
    >
      {type === 'success' ? <CheckCircle className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
      {message}
    </motion.div>
  );
}

// ── Stat Card ────────────────────────────────────────────────────────────────

function StatCard({ icon, label, value, accent }: { icon: React.ReactNode; label: string; value: string | number; accent: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-[1.6rem] border border-[var(--border-color)] bg-[var(--bg-input)] p-5"
    >
      <div className="flex items-center justify-between">
        <div style={{ color: accent }}>{icon}</div>
      </div>
      <p className="mt-3 text-[10px] font-black uppercase tracking-[0.2em]" style={{ color: 'var(--text-muted)' }}>
        {label}
      </p>
      <p className="mt-1 text-2xl font-black tracking-tight" style={{ color: 'var(--text-primary)' }}>
        {value}
      </p>
    </motion.div>
  );
}

// ── Campaign Card ─────────────────────────────────────────────────────────────

function CampaignCard({
  campaign,
  onEdit,
  onToggle,
  onDelete
}: {
  campaign: TrialCampaign;
  onEdit: () => void;
  onToggle: () => void;
  onDelete: () => void;
}) {
  const formatCOP = (value: number) => {
    if (value === 0) return 'Gratis';
    return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(value);
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return 'Sin fecha límite';
    return new Date(dateStr).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="rounded-[1.8rem] border p-5 transition-all hover:border-[var(--accent)]/30"
      style={{
        borderColor: 'var(--border-color)',
        backgroundColor: 'var(--bg-card)',
        borderLeft: campaign.active ? '3px solid #10b981' : undefined,
      }}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div
            className="flex h-11 w-11 items-center justify-center rounded-2xl text-lg font-black"
            style={{ backgroundColor: 'color-mix(in srgb, var(--accent) 10%, transparent)', color: 'var(--accent)' }}
          >
            {(campaign.name || 'C').charAt(0).toUpperCase()}
          </div>
          <div>
            <h4 className="font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>{campaign.name}</h4>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>por {campaign.created_by}</p>
          </div>
        </div>
        <span className="px-2 py-0.5 rounded-full text-xs font-semibold" style={{
          backgroundColor: campaign.active ? 'rgba(16,185,129,0.12)' : 'rgba(107,114,128,0.12)',
          color: campaign.active ? '#10b981' : '#6b7280'
        }}>
          {campaign.active ? 'Activa' : 'Inactiva'}
        </span>
      </div>

      {/* Details */}
      <div className="mb-4 flex flex-wrap gap-2">
        <span className="px-2 py-0.5 rounded-full text-xs font-medium" style={{ backgroundColor: 'rgba(99,102,241,0.12)', color: '#6366f1' }}>
          {campaign.trial_days} días
        </span>
        <span className="px-2 py-0.5 rounded-full text-xs font-medium" style={{ backgroundColor: 'rgba(168,85,247,0.12)', color: '#a855f7' }}>
          {campaign.trial_generations_limit} gen.
        </span>
        <span className="px-2 py-0.5 rounded-full text-xs font-medium" style={{ backgroundColor: 'rgba(16,185,129,0.12)', color: '#10b981' }}>
          {formatCOP(campaign.price_cop)}
        </span>
        {campaign.require_card_verification && (
          <span className="px-2 py-0.5 rounded-full text-xs font-medium" style={{ backgroundColor: 'rgba(245,158,11,0.12)', color: '#f59e0b' }}>
            Verif. tarjeta
          </span>
        )}
      </div>

      {/* Dates */}
      <div className="mb-4 text-xs" style={{ color: 'var(--text-muted)' }}>
        <p>Creada: {new Date(campaign.created_at).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' })}</p>
        <p>Termina: {formatDate(campaign.ends_at)}</p>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2">
        <button
          onClick={onToggle}
          className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border py-2.5 text-xs font-bold transition-all hover:opacity-80"
          style={{
            borderColor: campaign.active ? 'rgba(239,68,68,0.5)' : 'rgba(16,185,129,0.5)',
            backgroundColor: 'var(--bg-input)',
            color: campaign.active ? '#ef4444' : '#10b981'
          }}
        >
          {campaign.active ? <XCircle className="h-3.5 w-3.5" /> : <CheckCircle className="h-3.5 w-3.5" />}
          {campaign.active ? 'Desactivar' : 'Activar'}
        </button>
        <button
          onClick={onEdit}
          className="flex h-10 w-10 items-center justify-center rounded-xl border transition-all hover:border-[var(--accent)]/50"
          style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-input)' }}
          title="Editar"
        >
          <Edit2 className="h-3.5 w-3.5" style={{ color: 'var(--text-muted)' }} />
        </button>
        <button
          onClick={onDelete}
          className="flex h-10 w-10 items-center justify-center rounded-xl border transition-all hover:border-red-500/50"
          style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-input)' }}
          title="Eliminar"
        >
          <Trash2 className="h-3.5 w-3.5" style={{ color: '#ef4444' }} />
        </button>
      </div>
    </motion.div>
  );
}

// ── Campaign Form Modal ──────────────────────────────────────────────────────

function CampaignFormModal({
  campaign,
  onClose,
  onSuccess
}: {
  campaign?: TrialCampaign | null;
  onClose: () => void;
  onSuccess: (message: string) => void;
}) {
  const [form, setForm] = useState({
    name: campaign?.name || '',
    trial_days: campaign?.trial_days || 7,
    trial_generations_limit: campaign?.trial_generations_limit || 15,
    price_cop: campaign?.price_cop || 0,
    ends_at: campaign?.ends_at ? campaign.ends_at.split('T')[0] : '',
    require_card_verification: campaign?.require_card_verification ?? true,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) { setError('El nombre es requerido'); return; }
    setLoading(true);
    setError('');
    try {
      const payload = {
        name: form.name.trim(),
        trial_days: form.trial_days,
        trial_generations_limit: form.trial_generations_limit,
        price_cop: form.price_cop,
        ends_at: form.ends_at || null,
        require_card_verification: form.require_card_verification,
      };
      if (campaign) {
        await adminApi.patch(`/admin/trial-campaign/${campaign.id}`, payload);
        onSuccess('Campaña actualizada');
      } else {
        await adminApi.post('/admin/trial-campaign', payload);
        onSuccess('Campaña creada');
      }
      onClose();
    } catch (err: any) {
      setError(err.message || 'Error al guardar');
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        className="w-full max-w-md rounded-[2rem] border p-6 shadow-2xl"
        style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}
      >
        <div className="mb-6 flex items-center justify-between">
          <h3 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>
            {campaign ? 'Editar Campaña' : 'Nueva Campaña'}
          </h3>
          <button onClick={onClose} className="p-2 rounded-xl transition-colors hover:bg-[var(--bg-hover)]">
            <X className="h-5 w-5" style={{ color: 'var(--text-muted)' }} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Name */}
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--text-secondary)' }}>
              Nombre
            </label>
            <input
              type="text"
              value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              placeholder="Ej: Trial Julio 2024"
              className="w-full h-12 px-4 rounded-xl border text-sm outline-none transition-colors focus:border-[var(--accent)]/50"
              style={{ backgroundColor: 'var(--bg-input)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
            />
          </div>

          {/* Trial Days & Generations Limit */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--text-secondary)' }}>
                Días de trial
              </label>
              <input
                type="number"
                min={1}
                max={90}
                value={form.trial_days}
                onChange={e => setForm(f => ({ ...f, trial_days: parseInt(e.target.value) || 7 }))}
                className="w-full h-12 px-4 rounded-xl border text-sm outline-none transition-colors focus:border-[var(--accent)]/50"
                style={{ backgroundColor: 'var(--bg-input)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--text-secondary)' }}>
                Límite gen.
              </label>
              <input
                type="number"
                min={1}
                max={500}
                value={form.trial_generations_limit}
                onChange={e => setForm(f => ({ ...f, trial_generations_limit: parseInt(e.target.value) || 15 }))}
                className="w-full h-12 px-4 rounded-xl border text-sm outline-none transition-colors focus:border-[var(--accent)]/50"
                style={{ backgroundColor: 'var(--bg-input)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
              />
            </div>
          </div>

          {/* Price COP */}
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--text-secondary)' }}>
              Precio COP (0 = gratis)
            </label>
            <input
              type="number"
              min={0}
              value={form.price_cop}
              onChange={e => setForm(f => ({ ...f, price_cop: parseInt(e.target.value) || 0 }))}
              placeholder="20000"
              className="w-full h-12 px-4 rounded-xl border text-sm outline-none transition-colors focus:border-[var(--accent)]/50"
              style={{ backgroundColor: 'var(--bg-input)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
            />
          </div>

          {/* End Date */}
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--text-secondary)' }}>
              Fecha de fin (opcional)
            </label>
            <input
              type="date"
              value={form.ends_at}
              onChange={e => setForm(f => ({ ...f, ends_at: e.target.value }))}
              className="w-full h-12 px-4 rounded-xl border text-sm outline-none transition-colors focus:border-[var(--accent)]/50"
              style={{ backgroundColor: 'var(--bg-input)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
            />
          </div>

          {/* Require Card Verification Toggle */}
          <div className="flex items-center justify-between rounded-xl border p-4" style={{ backgroundColor: 'var(--bg-input)', borderColor: 'var(--border-color)' }}>
            <div>
              <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>Verificación de tarjeta</p>
              <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>Requiere que el usuario ingrese datos de pago</p>
            </div>
            <button
              type="button"
              onClick={() => setForm(f => ({ ...f, require_card_verification: !f.require_card_verification }))}
              className="relative h-6 w-11 rounded-full transition-colors"
              style={{ backgroundColor: form.require_card_verification ? '#10b981' : 'var(--border-color)' }}
            >
              <span
                className="absolute top-1 h-4 w-4 rounded-full bg-white transition-transform"
                style={{ left: form.require_card_verification ? '22px' : '4px' }}
              />
            </button>
          </div>

          {error && (
            <div className="flex items-center gap-2 text-sm text-red-500">
              <AlertCircle className="h-4 w-4" />
              {error}
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full h-12 rounded-xl font-bold text-sm transition-all disabled:opacity-50"
            style={{ backgroundColor: 'var(--accent)', color: '#fff' }}
          >
            {loading ? 'Guardando...' : campaign ? 'Actualizar Campaña' : 'Crear Campaña'}
          </button>
        </form>
      </motion.div>
    </motion.div>
  );
}

// ── Confirm Modal ─────────────────────────────────────────────────────────────

function ConfirmModal({
  title,
  message,
  confirmLabel,
  confirmClass,
  onConfirm,
  onCancel
}: {
  title: string;
  message: string;
  confirmLabel: string;
  confirmClass: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      onClick={(e) => e.target === e.currentTarget && onCancel()}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        className="w-full max-w-sm rounded-[2rem] border p-6 shadow-2xl"
        style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}
      >
        <h3 className="text-lg font-bold mb-2" style={{ color: 'var(--text-primary)' }}>{title}</h3>
        <p className="text-sm mb-6" style={{ color: 'var(--text-secondary)' }}>{message}</p>
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 h-11 rounded-xl border text-sm font-semibold transition-colors"
            style={{ borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            className={`flex-1 h-11 rounded-xl text-sm font-semibold text-white transition-colors ${confirmClass}`}
          >
            {confirmLabel}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ── Main Page ────────────────────────────────────────────────────────────────

export default function TrialCampaignsPage() {
  const [campaigns, setCampaigns] = useState<TrialCampaign[]>([]);
  const [activeCampaign, setActiveCampaign] = useState<TrialCampaign | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingCampaign, setEditingCampaign] = useState<TrialCampaign | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<TrialCampaign | null>(null);
  const [confirmToggle, setConfirmToggle] = useState<{ campaign: TrialCampaign; newState: boolean } | null>(null);

  const showToast = (message: string, type: 'success' | 'error') => setToast({ message, type });

  const fetchCampaigns = async () => {
    setLoading(true);
    try {
      const data = await adminApi.get<CampaignResponse>('/admin/trial-campaign');
      setCampaigns(data.campaigns ?? []);
      setActiveCampaign(data.activeCampaign ?? null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchCampaigns(); }, []);

  const handleToggle = async () => {
    if (!confirmToggle) return;
    const { campaign, newState } = confirmToggle;
    try {
      await adminApi.patch(`/admin/trial-campaign/${campaign.id}`, { active: newState });
      showToast(newState ? 'Campaña activada' : 'Campaña desactivada', 'success');
      fetchCampaigns();
    } catch (err: any) {
      showToast(err.message || 'Error al actualizar', 'error');
    } finally {
      setConfirmToggle(null);
    }
  };

  const handleDelete = async () => {
    if (!confirmDelete) return;
    try {
      await adminApi.delete(`/admin/trial-campaign/${confirmDelete.id}`);
      showToast('Campaña eliminada', 'success');
      fetchCampaigns();
    } catch (err: any) {
      showToast(err.message || 'Error al eliminar', 'error');
    } finally {
      setConfirmDelete(null);
    }
  };

  const formatCOP = (value: number) => {
    if (value === 0) return 'Gratis';
    return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(value);
  };

  if (loading) return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4">
      <div className="h-12 w-12 rounded-full border-3 border-t-transparent animate-spin" style={{ borderColor: 'var(--accent)', borderTopColor: 'transparent' }} />
      <p className="animate-pulse text-xs font-medium uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>Cargando campañas</p>
    </div>
  );

  if (error) return (
    <div className="mx-auto max-w-[1400px] px-4 pb-20">
      <div className="flex items-center gap-3 rounded-xl border p-4" style={{ backgroundColor: 'rgba(239,68,68,0.1)', borderColor: 'rgba(239,68,68,0.3)' }}>
        <AlertCircle className="h-5 w-5 text-red-500" />
        <p className="text-sm text-red-500">{error}</p>
      </div>
    </div>
  );

  return (
    <div className="mx-auto max-w-[1400px] space-y-6 px-4 pb-20">
      {/* Hero Section */}
      <motion.section
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-[2rem] border border-[var(--accent)]/20 bg-[linear-gradient(135deg,color-mix(in_srgb,var(--accent)_8%,transparent),var(--bg-card)_28%,var(--bg-card)_100%)] p-6 shadow-[0_25px_60px_rgba(0,0,0,0.1)] md:p-8"
      >
        <div className="absolute right-0 top-0 h-36 w-36 rounded-full" style={{ backgroundColor: 'color-mix(in srgb, var(--accent) 10%, transparent)', filter: 'blur(60px)' }} />
        <div className="relative">
          <div className="flex flex-wrap items-center gap-3 mb-4">
            <span className="rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-[0.24em]" style={{ borderColor: 'color-mix(in srgb, var(--accent) 20%, transparent)', backgroundColor: 'color-mix(in srgb, var(--accent) 10%, transparent)', color: 'var(--accent)' }}>
              Trial Campaigns
            </span>
            {activeCampaign && (
              <span className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.24em] text-emerald-500">
                Campaña Activa
              </span>
            )}
          </div>
          <h1 className="font-bold tracking-tight text-2xl" style={{ color: 'var(--text-primary)' }}>Campañas de Trial</h1>
          <p style={{ color: 'var(--text-muted)' }} className="text-sm mt-1">
            Gestiona las campañas de prueba gratuitas o de pago para nuevos usuarios
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
          <StatCard
            icon={<Zap className="h-5 w-5" />}
            label="Campaña Activa"
            value={activeCampaign ? activeCampaign.name : 'Ninguna'}
            accent="#10b981"
          />
          <StatCard
            icon={<Calendar className="h-5 w-5" />}
            label="Total Campaigns"
            value={campaigns.length}
            accent="#3b82f6"
          />
          <StatCard
            icon={<Clock className="h-5 w-5" />}
            label="Días de Trial"
            value={activeCampaign ? `${activeCampaign.trial_days}d` : '-'}
            accent="#6366f1"
          />
          <StatCard
            icon={<Coins className="h-5 w-5" />}
            label="Precio"
            value={activeCampaign ? formatCOP(activeCampaign.price_cop) : '-'}
            accent="#f59e0b"
          />
        </div>
      </motion.section>

      {/* Actions Bar */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.08 }}
        className="flex items-center justify-between rounded-[2rem] border p-5"
        style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}
      >
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5" style={{ color: 'var(--accent)' }} />
          <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
            {campaigns.length} campaña{campaigns.length !== 1 ? 's' : ''} total
          </span>
        </div>
        <button
          onClick={() => { setEditingCampaign(null); setShowForm(true); }}
          className="flex items-center gap-2 h-10 px-4 rounded-xl font-bold text-sm transition-all hover:opacity-90"
          style={{ backgroundColor: 'var(--accent)', color: '#fff' }}
        >
          <Plus className="h-4 w-4" />
          Nueva Campaña
        </button>
      </motion.div>

      {/* Empty State */}
      {campaigns.length === 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center justify-center rounded-[2rem] border py-16"
          style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}
        >
          <Calendar className="h-12 w-12 mb-4" style={{ color: 'var(--text-muted)' }} />
          <h3 className="text-lg font-bold mb-2" style={{ color: 'var(--text-primary)' }}>Sin campañas de trial</h3>
          <p className="text-sm mb-6" style={{ color: 'var(--text-secondary)' }}>
            Crea tu primera campaña para comenzar a captar nuevos usuarios
          </p>
          <button
            onClick={() => { setEditingCampaign(null); setShowForm(true); }}
            className="flex items-center gap-2 h-10 px-5 rounded-xl font-bold text-sm transition-all hover:opacity-90"
            style={{ backgroundColor: 'var(--accent)', color: '#fff' }}
          >
            <Plus className="h-4 w-4" />
            Crear Campaña
          </button>
        </motion.div>
      )}

      {/* Campaigns Grid */}
      {campaigns.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.12 }}
        >
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            <AnimatePresence mode="popLayout">
              {campaigns.map(campaign => (
                <CampaignCard
                  key={campaign.id}
                  campaign={campaign}
                  onEdit={() => { setEditingCampaign(campaign); setShowForm(true); }}
                  onToggle={() => setConfirmToggle({ campaign, newState: !campaign.active })}
                  onDelete={() => setConfirmDelete(campaign)}
                />
              ))}
            </AnimatePresence>
          </div>
        </motion.div>
      )}

      {/* Form Modal */}
      <AnimatePresence>
        {showForm && (
          <CampaignFormModal
            campaign={editingCampaign}
            onClose={() => { setShowForm(false); setEditingCampaign(null); }}
            onSuccess={(message) => { showToast(message, 'success'); fetchCampaigns(); }}
          />
        )}
      </AnimatePresence>

      {/* Confirm Toggle Modal */}
      <AnimatePresence>
        {confirmToggle && (
          <ConfirmModal
            title={confirmToggle.newState ? `Activar ${confirmToggle.campaign.name}` : `Desactivar ${confirmToggle.campaign.name}`}
            message={
              confirmToggle.newState
                ? 'Esta campaña se activará y las demás se desactivarán automáticamente.'
                : 'Esta campaña dejará de estar activa para nuevos usuarios.'
            }
            confirmLabel={confirmToggle.newState ? 'Activar' : 'Desactivar'}
            confirmClass={confirmToggle.newState ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-red-600 hover:bg-red-700'}
            onConfirm={handleToggle}
            onCancel={() => setConfirmToggle(null)}
          />
        )}
      </AnimatePresence>

      {/* Confirm Delete Modal */}
      <AnimatePresence>
        {confirmDelete && (
          <ConfirmModal
            title={`Eliminar ${confirmDelete.name}`}
            message="Esta acción es permanente. La campaña y todos sus datos asociados serán eliminados."
            confirmLabel="Eliminar"
            confirmClass="bg-red-600 hover:bg-red-700"
            onConfirm={handleDelete}
            onCancel={() => setConfirmDelete(null)}
          />
        )}
      </AnimatePresence>

      {/* Toast */}
      <AnimatePresence>
        {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      </AnimatePresence>
    </div>
  );
}
