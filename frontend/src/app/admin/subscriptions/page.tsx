'use client';

import { useEffect, useState } from 'react';
import { AlertTriangle, RefreshCw, Ban, RotateCcw, Search, Plus, CreditCard, Users, TrendingUp, Clock, CheckCircle, XCircle, ExternalLink } from 'lucide-react';
import { formatCurrency, formatPlanPrice } from '@/utils/currency';
import { motion, AnimatePresence } from 'framer-motion';
import { adminApi } from '@/services/adminApi';
import { ConfirmModal, Toast, RenewModal, ChangePlanModal, Subscription } from '@/components/admin/subscriptions/SubscriptionModals';

type PlanStatus = Subscription['subscription_status'];
type FilterStatus = 'all' | 'active' | 'expiring_soon' | 'expired' | 'suspended' | 'trial' | 'venciendo';

// ── Toast helper ──────────────────────────────────────────────────────────────

function ToastComponent({ message, type, onClose }: { message: string; type: 'success' | 'error'; onClose: () => void }) {
  useEffect(() => { const t = setTimeout(onClose, 4000); return () => clearTimeout(t); }, [onClose]);
  return (
    <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg text-sm font-medium text-white ${type === 'success' ? 'bg-emerald-600' : 'bg-red-600'}`}>
      {type === 'success' ? <CheckCircle className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
      {message}
    </div>
  );
}

// ── Stat Card ─────────────────────────────────────────────────────────────────

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

// ── Subscription Card ─────────────────────────────────────────────────────────

function SubscriptionCard({ sub, onRenew, onChangePlan, onToggle }: {
  sub: Subscription;
  onRenew: () => void;
  onChangePlan: () => void;
  onToggle: () => void;
}) {
  const isTrial = sub.plan === 'TRIAL';
  const isActive = sub.subscription_status === 'active';
  const isExpiring = sub.subscription_status === 'expiring_soon';
  const isSuspended = sub.subscription_status === 'suspended' || sub.subscription_status === 'expired';

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
        borderLeft: (isExpiring || (!isTrial && !isActive)) ? '3px solid' : undefined,
        borderLeftColor: isExpiring ? '#f59e0b' : (!isTrial && !isActive) ? '#ef4444' : undefined,
      }}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div
            className="flex h-11 w-11 items-center justify-center rounded-2xl text-lg font-black"
            style={{ backgroundColor: 'color-mix(in srgb, var(--accent) 10%, transparent)', color: 'var(--accent)' }}
          >
            {(sub.name || 'M').charAt(0).toUpperCase()}
          </div>
          <div>
            <h4 className="font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>{sub.name}</h4>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{sub.email}</p>
          </div>
        </div>
        <span className="px-2 py-0.5 rounded-full text-xs font-semibold" style={{
          backgroundColor: isTrial ? 'rgba(99,102,241,0.12)' : sub.plan === 'PRO' ? 'rgba(168,85,247,0.12)' : 'rgba(16,185,129,0.12)',
          color: isTrial ? '#6366f1' : sub.plan === 'PRO' ? '#a855f7' : '#10b981'
        }}>
          {sub.plan}
        </span>
      </div>

      {/* Status */}
      <div className="mb-4 flex flex-wrap gap-2">
        <span className="px-2 py-0.5 rounded-full text-xs font-medium" style={{
          backgroundColor: isActive ? 'rgba(16,185,129,0.12)' : isExpiring ? 'rgba(245,158,11,0.12)' : isSuspended ? 'rgba(239,68,68,0.12)' : 'rgba(107,114,128,0.12)',
          color: isActive ? '#10b981' : isExpiring ? '#f59e0b' : isSuspended ? '#ef4444' : '#6b7280'
        }}>
          {isActive ? 'Activa' : isExpiring ? 'Por vencer' : isSuspended ? 'Suspendida' : isTrial ? 'Trial' : 'Sin estado'}
        </span>
        {!isTrial && (
          <span className="px-2 py-0.5 rounded-full text-xs font-medium" style={{ backgroundColor: 'var(--bg-hover)', color: 'var(--text-muted)' }}>
            {sub.daysRemaining} días
          </span>
        )}
        {isTrial && (
          <span className="px-2 py-0.5 rounded-full text-xs font-medium" style={{ backgroundColor: 'rgba(99,102,241,0.12)', color: '#6366f1' }}>
            {sub.trial_days_remaining ?? 0}d restantes
          </span>
        )}
      </div>

      {/* Price */}
      {!isTrial && (
        <div className="mb-4 text-sm">
          <span className="font-bold" style={{ color: 'var(--text-primary)' }}>
            {formatPlanPrice(sub.plan as 'BASIC' | 'PRO')}
          </span>
          <span style={{ color: 'var(--text-muted)' }}>/mes</span>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-2">
        <button
          onClick={onRenew}
          className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-[var(--border-color)] bg-[var(--bg-input)] py-2.5 text-xs font-bold transition-all hover:border-emerald-500/50 hover:text-emerald-500"
          style={{ color: 'var(--text-primary)' }}
        >
          <CreditCard className="h-3.5 w-3.5" />
          {isTrial ? 'Activar' : 'Renovar'}
        </button>
        {!isTrial && (
          <button
            onClick={onChangePlan}
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-[var(--border-color)] bg-[var(--bg-input)] transition-all hover:border-[var(--accent)]/50"
            title="Cambiar plan"
          >
            <RefreshCw className="h-3.5 w-3.5" style={{ color: 'var(--text-muted)' }} />
          </button>
        )}
        <button
          onClick={onToggle}
          className="flex h-10 w-10 items-center justify-center rounded-xl border border-[var(--border-color)] bg-[var(--bg-input)] transition-all hover:border-red-500/50"
          title={isSuspended ? 'Reactivar' : 'Suspender'}
        >
          {isSuspended
            ? <RotateCcw className="h-3.5 w-3.5" style={{ color: '#3b82f6' }} />
            : <Ban className="h-3.5 w-3.5" style={{ color: '#ef4444' }} />
          }
        </button>
      </div>
    </motion.div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function AdminSubscriptionsPage() {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState<FilterStatus>('all');
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const itemsPerPage = 12;

  // Modales
  const [renewTarget, setRenewTarget] = useState<Subscription | null>(null);
  const [changePlanTarget, setChangePlanTarget] = useState<Subscription | null>(null);
  const [confirmAction, setConfirmAction] = useState<{ brand: Subscription; action: 'suspend' | 'reactivate' } | null>(null);

  // Toast
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const showToast = (message: string, type: 'success' | 'error') => setToast({ message, type });

  useEffect(() => { fetchSubscriptions(); }, []);
  useEffect(() => { setCurrentPage(1); }, [filter, search]);

  const fetchSubscriptions = async () => {
    setLoading(true);
    try {
      const data = await adminApi.get<{ subscriptions: Subscription[] }>('/admin/subscriptions');
      setSubscriptions(data.subscriptions ?? []);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmAction = async () => {
    if (!confirmAction) return;
    const { brand, action } = confirmAction;
    try {
      await adminApi.patch(`/admin/subscriptions/${brand.id}/${action}`);
      showToast(action === 'suspend' ? 'Marca suspendida' : 'Marca reactivada', 'success');
      fetchSubscriptions();
    } catch (e: any) {
      showToast(e.message, 'error');
    } finally {
      setConfirmAction(null);
    }
  };

  // Filtrado
  const filtered = subscriptions.filter(s => {
    const matchStatus = filter === 'all'
      ? true
      : filter === 'trial'
      ? s.plan === 'TRIAL'
      : filter === 'venciendo'
      ? (s.daysRemaining !== null && s.daysRemaining >= 0 && s.daysRemaining <= 7 && s.plan !== 'TRIAL')
      : s.subscription_status === filter;
    const q = search.toLowerCase();
    const matchSearch = !q || s.name.toLowerCase().includes(q) || s.email.toLowerCase().includes(q) || s.slug.toLowerCase().includes(q);
    return matchStatus && matchSearch;
  });

  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const paginated = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  // Stats
  const counts = {
    all: subscriptions.length,
    active: subscriptions.filter(s => s.subscription_status === 'active').length,
    expiring_soon: subscriptions.filter(s => s.subscription_status === 'expiring_soon').length,
    expired: subscriptions.filter(s => s.subscription_status === 'expired').length,
    suspended: subscriptions.filter(s => s.subscription_status === 'suspended').length,
    trial: subscriptions.filter(s => s.plan === 'TRIAL').length,
    venciendo: subscriptions.filter(s => s.plan !== 'TRIAL' && s.daysRemaining !== null && s.daysRemaining >= 0 && s.daysRemaining <= 7).length,
  };

  // MRR
  const mrr = subscriptions
    .filter(s => s.subscription_status === 'active' && s.plan !== 'TRIAL' && s.plan !== 'LANDING')
    .reduce((acc, s) => acc + (s.plan === 'PRO' ? 250000 : 150000), 0);

  const expiringSoon = subscriptions.filter(s =>
    s.plan !== 'TRIAL' &&
    s.daysRemaining !== null &&
    s.daysRemaining >= 0 &&
    s.daysRemaining <= 7
  );

  if (loading) return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4">
      <div className="h-12 w-12 rounded-full border-3 border-t-transparent animate-spin" style={{ borderColor: 'var(--accent)', borderTopColor: 'transparent' }} />
      <p className="animate-pulse text-xs font-medium uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>Cargando suscripciones</p>
    </div>
  );

  if (error) return (
    <div className="px-4 py-3 rounded-xl text-sm" style={{ backgroundColor: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#ef4444' }}>{error}</div>
  );

  const filterChips: { value: FilterStatus; label: string; count: number; color: string }[] = [
    { value: 'all', label: 'Todas', count: counts.all, color: '#3b82f6' },
    { value: 'active', label: 'Activas', count: counts.active, color: '#10b981' },
    { value: 'venciendo', label: 'Vencen 7d', count: counts.venciendo, color: '#f59e0b' },
    { value: 'expiring_soon', label: 'Por vencer', count: counts.expiring_soon, color: '#f59e0b' },
    { value: 'trial', label: 'Trial', count: counts.trial, color: '#6366f1' },
    { value: 'suspended', label: 'Suspendidas', count: counts.suspended, color: '#ef4444' },
  ];

  return (
    <div className="mx-auto max-w-[1400px] space-y-6 px-4 pb-20">
      {/* Hero Section */}
      <motion.section
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-[2rem] border p-6 shadow-[0_25px_60px_rgba(0,0,0,0.1)] md:p-8"
        style={{ borderColor: 'color-mix(in srgb, var(--accent) 20%, transparent)', background: 'linear-gradient(135deg,color-mix(in_srgb,var(--accent)_8%,transparent),var(--bg-card)_28%,var(--bg-card)_100%)' }}
      >
        <div className="absolute right-0 top-0 h-36 w-36 rounded-full" style={{ backgroundColor: 'color-mix(in srgb, var(--accent) 10%, transparent)', filter: 'blur(60px)' }} />
        <div className="relative">
          <div className="flex flex-wrap items-center gap-3 mb-4">
            <span className="rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-[0.24em]" style={{ borderColor: 'color-mix(in srgb, var(--accent) 20%, transparent)', backgroundColor: 'color-mix(in srgb, var(--accent) 10%, transparent)', color: 'var(--accent)' }}>
              Gestión
            </span>
            <span className="rounded-full border border-[var(--border-color)] bg-[var(--bg-input)] px-3 py-1 text-[10px] font-black uppercase tracking-[0.24em]" style={{ color: 'var(--text-primary)' }}>
              {subscriptions.length} suscripciones
            </span>
          </div>
          <h1 className="font-bold tracking-tight text-2xl" style={{ color: 'var(--text-primary)' }}>Suscripciones</h1>
          <p style={{ color: 'var(--text-muted)' }} className="text-sm mt-1">
            {counts.active} activas · {counts.venciendo + counts.expiring_soon} por vencer · MRR: {formatCurrency(mrr)}
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
          <StatCard icon={<CreditCard className="h-5 w-5" />} label="Total" value={counts.all} accent="#3b82f6" />
          <StatCard icon={<CheckCircle className="h-5 w-5" />} label="Activas" value={counts.active} accent="#10b981" />
          <StatCard icon={<Clock className="h-5 w-5" />} label="Por vencer" value={counts.expiring_soon + counts.venciendo} accent="#f59e0b" />
          <StatCard icon={<TrendingUp className="h-5 w-5" />} label="MRR" value={formatCurrency(mrr)} accent="var(--accent)" />
        </div>
      </motion.section>

      {/* Alerta por vencer */}
      {expiringSoon.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-start gap-3 rounded-xl border px-4 py-3"
          style={{ backgroundColor: 'rgba(245,158,11,0.08)', borderColor: 'rgba(245,158,11,0.25)' }}
        >
          <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: '#f59e0b' }} />
          <p className="text-sm" style={{ color: 'var(--text-primary)' }}>
            <span className="font-semibold">{expiringSoon.length} suscripción{expiringSoon.length > 1 ? 'es' : ''}</span> vence{expiringSoon.length === 1 ? '' : 'n'} en los próximos 7 días.
          </p>
        </motion.div>
      )}

      {/* Search & Filters */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.08 }}
        className="rounded-[2rem] border p-5 space-y-4" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}
      >
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
          <input type="text" value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Buscar por nombre, email o slug..."
            className="w-full h-12 pl-10 pr-4 rounded-xl border text-sm outline-none transition-colors focus:border-[var(--accent)]/50"
            style={{ backgroundColor: 'var(--bg-input)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
          />
        </div>

        {/* Filter Chips */}
        <div className="flex flex-wrap gap-2">
          {filterChips.map(chip => (
            <button
              key={chip.value}
              onClick={() => setFilter(chip.value)}
              className="px-3 py-1.5 rounded-xl text-xs font-semibold transition-all border"
              style={filter === chip.value
                ? { backgroundColor: chip.color, color: '#fff', borderColor: chip.color }
                : { backgroundColor: 'var(--bg-input)', color: 'var(--text-secondary)', borderColor: 'var(--border-color)' }
              }
            >
              {chip.label} ({chip.count})
            </button>
          ))}
        </div>

        {/* View Toggle */}
        <div className="flex items-center justify-between">
          <p style={{ color: 'var(--text-muted)' }} className="text-sm">
            {filtered.length} resultado{filtered.length !== 1 ? 's' : ''}
          </p>
          <div className="flex gap-1">
            <button
              onClick={() => setViewMode('grid')}
              className="px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
              style={viewMode === 'grid' ? { backgroundColor: 'var(--bg-input)', color: 'var(--text-primary)' } : { color: 'var(--text-muted)' }}
            >
              Grid
            </button>
            <button
              onClick={() => setViewMode('table')}
              className="px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
              style={viewMode === 'table' ? { backgroundColor: 'var(--bg-input)', color: 'var(--text-primary)' } : { color: 'var(--text-muted)' }}
            >
              Tabla
            </button>
          </div>
        </div>
      </motion.div>

      {/* Subscriptions Grid/Table */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12 }}>
        {viewMode === 'grid' ? (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            <AnimatePresence mode="popLayout">
              {paginated.map(sub => (
                <SubscriptionCard
                  key={sub.id}
                  sub={sub}
                  onRenew={() => setRenewTarget(sub)}
                  onChangePlan={() => setChangePlanTarget(sub)}
                  onToggle={() => setConfirmAction({ brand: sub, action: sub.subscription_status === 'suspended' || sub.subscription_status === 'expired' ? 'reactivate' : 'suspend' })}
                />
              ))}
            </AnimatePresence>
            {filtered.length === 0 && (
              <div className="col-span-full text-center py-12">
                <CreditCard className="mx-auto h-10 w-10 mb-3" style={{ color: 'var(--text-muted)' }} />
                <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>No hay suscripciones</p>
                <p className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>Intenta ajustar los filtros</p>
              </div>
            )}
          </div>
        ) : (
          <div className="rounded-[2rem] border overflow-hidden" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ backgroundColor: 'var(--bg-hover)', borderColor: 'var(--border-color)' }} className="border-b">
                    <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--text-secondary)' }}>Marca</th>
                    <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--text-secondary)' }}>Plan</th>
                    <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--text-secondary)' }}>Estado</th>
                    <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--text-secondary)' }}>Vencimiento</th>
                    <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--text-secondary)' }}>Acciones</th>
                  </tr>
                </thead>
                <tbody style={{ borderColor: 'var(--border-color)' }} className="divide-y">
                  {paginated.map(s => (
                    <tr key={s.id} className="hover:opacity-90 transition-opacity">
                      <td className="px-5 py-4">
                        <p style={{ color: 'var(--text-primary)' }} className="font-medium">{s.name}</p>
                        <p style={{ color: 'var(--text-muted)' }} className="text-xs">{s.email}</p>
                      </td>
                      <td className="px-5 py-4">
                        <span className="px-2 py-0.5 rounded-full text-xs font-semibold" style={{
                          backgroundColor: s.plan === 'PRO' ? 'rgba(168,85,247,0.12)' : s.plan === 'TRIAL' ? 'rgba(99,102,241,0.12)' : 'rgba(16,185,129,0.12)',
                          color: s.plan === 'PRO' ? '#a855f7' : s.plan === 'TRIAL' ? '#6366f1' : '#10b981'
                        }}>
                          {s.plan}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <span className="px-2 py-0.5 rounded-full text-xs font-semibold" style={{
                          backgroundColor: s.subscription_status === 'active' ? 'rgba(16,185,129,0.12)' :
                            s.subscription_status === 'expiring_soon' ? 'rgba(245,158,11,0.12)' :
                            s.subscription_status === 'suspended' ? 'rgba(239,68,68,0.12)' : 'rgba(107,114,128,0.12)',
                          color: s.subscription_status === 'active' ? '#10b981' :
                            s.subscription_status === 'expiring_soon' ? '#f59e0b' :
                            s.subscription_status === 'suspended' ? '#ef4444' : '#6b7280'
                        }}>
                          {s.subscription_status === 'active' ? 'Activa' :
                           s.subscription_status === 'expiring_soon' ? 'Por vencer' :
                           s.subscription_status === 'suspended' ? 'Suspendida' :
                           s.subscription_status === 'expired' ? 'Vencida' :
                           s.plan === 'TRIAL' ? 'Trial' : 'Sin estado'}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-sm" style={{ color: 'var(--text-secondary)' }}>
                        {s.plan === 'TRIAL'
                          ? `${s.trial_days_remaining ?? '?'} días`
                          : `${s.daysRemaining} días`}
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2">
                          <button onClick={() => setRenewTarget(s)} className="p-2 rounded-xl transition-colors" style={{ backgroundColor: 'rgba(16,185,129,0.1)', color: '#10b981' }}>
                            <CreditCard className="h-4 w-4" />
                          </button>
                          <button onClick={() => setChangePlanTarget(s)} className="p-2 rounded-xl transition-colors" style={{ backgroundColor: 'color-mix(in srgb, var(--accent) 10%, transparent)', color: 'var(--accent)' }}>
                            <RefreshCw className="h-4 w-4" />
                          </button>
                          <button onClick={() => setConfirmAction({ brand: s, action: s.subscription_status === 'suspended' || s.subscription_status === 'expired' ? 'reactivate' : 'suspend' })}
                            className="p-2 rounded-xl transition-colors" style={{ backgroundColor: s.subscription_status === 'suspended' ? 'rgba(59,130,246,0.1)' : 'rgba(239,68,68,0.1)', color: s.subscription_status === 'suspended' ? '#3b82f6' : '#ef4444' }}>
                            {s.subscription_status === 'suspended' ? <RotateCcw className="h-4 w-4" /> : <Ban className="h-4 w-4" />}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </motion.div>

      {/* Paginación */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between rounded-xl border px-5 py-3" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
          <p style={{ color: 'var(--text-muted)' }} className="text-sm">
            {(currentPage - 1) * itemsPerPage + 1}–{Math.min(currentPage * itemsPerPage, filtered.length)} de {filtered.length}
          </p>
          <div className="flex gap-1">
            <button onClick={() => setCurrentPage(p => p - 1)} disabled={currentPage === 1}
              style={{ borderColor: 'var(--border-color)', color: 'var(--text-secondary)' }}
              className="px-3 py-1.5 rounded-xl border text-sm disabled:opacity-40 hover:opacity-80 transition-opacity">
              Anterior
            </button>
            {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
              const p = totalPages <= 5 ? i + 1 : currentPage <= 3 ? i + 1 : currentPage >= totalPages - 2 ? totalPages - 4 + i : currentPage - 2 + i;
              return (
                <button key={p} onClick={() => setCurrentPage(p)}
                  className={`px-3 py-1.5 rounded-xl border text-sm transition-colors ${currentPage === p ? 'text-white border-[var(--accent)]' : 'hover:opacity-80'}`}
                  style={currentPage === p ? { backgroundColor: 'var(--accent)', borderColor: 'var(--accent)' } : { borderColor: 'var(--border-color)', color: 'var(--text-secondary)' }}>
                  {p}
                </button>
              );
            })}
            <button onClick={() => setCurrentPage(p => p + 1)} disabled={currentPage === totalPages}
              style={{ borderColor: 'var(--border-color)', color: 'var(--text-secondary)' }}
              className="px-3 py-1.5 rounded-xl border text-sm disabled:opacity-40 hover:opacity-80 transition-opacity">
              Siguiente
            </button>
          </div>
        </div>
      )}

      {/* Modales */}
      {renewTarget && (
        <RenewModal brand={renewTarget} onClose={() => setRenewTarget(null)}
          onSuccess={() => { setRenewTarget(null); showToast('Suscripción renovada', 'success'); fetchSubscriptions(); }} />
      )}
      {changePlanTarget && (
        <ChangePlanModal brand={changePlanTarget} onClose={() => setChangePlanTarget(null)}
          onSuccess={() => { setChangePlanTarget(null); showToast('Plan actualizado', 'success'); fetchSubscriptions(); }} />
      )}
      {confirmAction && (
        <ConfirmModal
          title={confirmAction.action === 'suspend' ? `Suspender ${confirmAction.brand.name}` : `Reactivar ${confirmAction.brand.name}`}
          message={confirmAction.action === 'suspend'
            ? 'La marca perderá acceso al dashboard y al probador público.'
            : confirmAction.brand.plan === 'TRIAL'
              ? 'Se restaurará solo el Trial restante.'
              : 'Solo se reactivará el acceso si la marca todavía tiene un período pago vigente.'}
          confirmLabel={confirmAction.action === 'suspend' ? 'Suspender' : 'Reactivar'}
          confirmClass={confirmAction.action === 'suspend' ? 'bg-red-600 hover:bg-red-700' : 'bg-blue-600 hover:bg-blue-700'}
          onConfirm={handleConfirmAction}
          onCancel={() => setConfirmAction(null)}
        />
      )}

      {/* Toast */}
      {toast && <ToastComponent message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}
