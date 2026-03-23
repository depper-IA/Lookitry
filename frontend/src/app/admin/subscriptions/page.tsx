'use client';

import { useEffect, useState } from 'react';
import { AlertTriangle, CheckCircle, XCircle, RefreshCw, Ban, RotateCcw, ArrowUpDown } from 'lucide-react';
import { formatCurrency, formatPlanPrice } from '@/utils/currency';

// ── Tipos ─────────────────────────────────────────────────────────────────────

interface Subscription {
  id: string;
  name: string;
  email: string;
  slug: string;
  plan: string;
  is_in_trial?: boolean;
  trial_days_remaining?: number | null;
  subscription_status: 'active' | 'expiring_soon' | 'expired' | 'suspended';
  subscription_start_date: string;
  subscription_end_date: string;
  last_payment_date: string | null;
  next_payment_date: string | null;
  daysRemaining: number;
}

type FilterStatus = 'all' | 'active' | 'expiring_soon' | 'expired' | 'suspended' | 'trial';

// ── Helpers ───────────────────────────────────────────────────────────────────

function adminApi(path: string, options: RequestInit = {}) {
  const base = process.env.NEXT_PUBLIC_API_URL || 'https://api.lookitry.com';
  return fetch(`${base}/api${path}`, {
    ...options,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers ?? {}),
    },
  });
}

function formatDate(d: string | null) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' });
}

function DaysChip({ days }: { days: number }) {
  if (days < 0) return <span className="text-xs font-semibold text-red-600">Vencida hace {Math.abs(days)}d</span>;
  if (days <= 3) return <span className="text-xs font-semibold text-red-600">{days} días</span>;
  if (days <= 7) return <span className="text-xs font-semibold text-amber-600">{days} días</span>;
  return <span className="text-xs text-emerald-600">{days} días</span>;
}

function PlanBadge({ plan, isInTrial }: { plan: string; isInTrial?: boolean }) {
  if (isInTrial) {
    return (
      <span className="px-2 py-0.5 rounded-full text-xs font-semibold"
        style={{ backgroundColor: 'rgba(107,114,128,0.15)', color: '#6b7280' }}>
        TRIAL
      </span>
    );
  }
  if (plan === 'PRO') {
    return (
      <span className="px-2 py-0.5 rounded-full text-xs font-semibold"
        style={{ backgroundColor: 'rgba(168,85,247,0.12)', color: '#a855f7' }}>
        PRO
      </span>
    );
  }
  if (plan === 'LANDING') {
    return (
      <span className="px-2 py-0.5 rounded-full text-xs font-semibold"
        style={{ backgroundColor: 'rgba(59,130,246,0.12)', color: '#3b82f6' }}>
        LANDING
      </span>
    );
  }
  // BASIC
  return (
    <span className="px-2 py-0.5 rounded-full text-xs font-semibold"
      style={{ backgroundColor: 'rgba(16,185,129,0.12)', color: '#10b981' }}>
      BASIC
    </span>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { bg: string; color: string }> = {
    active:        { bg: 'rgba(16,185,129,0.12)',  color: '#10b981' },
    expiring_soon: { bg: 'rgba(245,158,11,0.12)',  color: '#f59e0b' },
    expired:       { bg: 'rgba(239,68,68,0.12)',   color: '#ef4444' },
    suspended:     { bg: 'rgba(107,114,128,0.12)', color: '#6b7280' },
  };
  const labels: Record<string, string> = {
    active: 'Activa', expiring_soon: 'Por vencer', expired: 'Vencida', suspended: 'Suspendida',
  };
  const style = map[status] ?? { bg: 'rgba(107,114,128,0.12)', color: '#6b7280' };
  return (
    <span className="px-2 py-0.5 rounded-full text-xs font-semibold"
      style={{ backgroundColor: style.bg, color: style.color }}>
      {labels[status] ?? status}
    </span>
  );
}

// ── Modal de confirmación genérico ────────────────────────────────────────────

function ConfirmModal({
  title, message, confirmLabel, confirmClass, onConfirm, onCancel,
}: {
  title: string; message: string; confirmLabel: string;
  confirmClass: string; onConfirm: () => void; onCancel: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div style={{ background: 'var(--bg-card)', borderColor: 'var(--border-color)' }} className="rounded-[2rem] border shadow-xl w-full max-w-sm p-6 space-y-4">
        <h3 style={{ color: 'var(--text-primary)' }} className="font-jakarta font-bold uppercase italic text-lg">{title}</h3>
        <p style={{ color: 'var(--text-secondary)' }} className="text-sm">{message}</p>
        <div className="flex gap-3 justify-end pt-2">
          <button onClick={onCancel} style={{ borderColor: 'var(--border-color)', color: 'var(--text-secondary)' }} className="px-4 py-2 rounded-xl border text-sm hover:opacity-80 transition-opacity">
            Cancelar
          </button>
          <button onClick={onConfirm} className={`px-4 py-2 rounded-xl text-sm font-semibold text-white transition-colors ${confirmClass}`}>
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Toast ─────────────────────────────────────────────────────────────────────

function Toast({ message, type, onClose }: { message: string; type: 'success' | 'error'; onClose: () => void }) {
  useEffect(() => { const t = setTimeout(onClose, 4000); return () => clearTimeout(t); }, [onClose]);
  return (
    <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg text-sm font-medium text-white ${type === 'success' ? 'bg-emerald-600' : 'bg-red-600'}`}>
      {type === 'success' ? <CheckCircle className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
      {message}
    </div>
  );
}

// ── Modal de renovación ───────────────────────────────────────────────────────

const PERIOD_OPTIONS = [
  { months: 1, label: '1 mes', discount: 0 },
  { months: 3, label: '3 meses', discount: 5 },
  { months: 6, label: '6 meses', discount: 10 },
];

function RenewModal({
  brand, onClose, onSuccess,
}: { brand: Subscription; onClose: () => void; onSuccess: () => void }) {
  const baseAmount = brand.plan === 'PRO' ? 250000 : 150000;
  const [months, setMonths] = useState(1);
  const [selectedPlan, setSelectedPlan] = useState<'BASIC' | 'PRO'>(
    brand.is_in_trial ? 'BASIC' : (brand.plan as 'BASIC' | 'PRO')
  );
  const [form, setForm] = useState({
    payment_date: new Date().toISOString().split('T')[0],
    payment_method: 'transferencia',
    notes: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const planBaseAmount = selectedPlan === 'PRO' ? 250000 : 150000;
  const selectedPeriod = PERIOD_OPTIONS.find(p => p.months === months)!;
  const discountedAmount = Math.ceil(planBaseAmount * months * (1 - selectedPeriod.discount / 100));

  const handleSubmit = async () => {
    setLoading(true); setError('');
    try {
      const res = await adminApi(`/admin/subscriptions/${brand.id}/payment`, {
        method: 'POST',
        body: JSON.stringify({
          amount: discountedAmount,
          months,
          plan: selectedPlan,
          currency: 'COP',
          status: 'completed',
          ...form,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Error al renovar');
      onSuccess();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div style={{ background: 'var(--bg-card)', borderColor: 'var(--border-color)' }} className="rounded-[2rem] border shadow-xl w-full max-w-md">
        <div style={{ borderColor: 'var(--border-color)' }} className="px-6 py-5 border-b">
          <h3 style={{ color: 'var(--text-primary)' }} className="font-jakarta font-bold uppercase italic text-lg">Registrar pago — {brand.name}</h3>
          <p style={{ color: 'var(--text-muted)' }} className="text-sm mt-0.5">
            {brand.is_in_trial ? 'Plan Trial' : `Plan ${brand.plan}`} · {brand.is_in_trial ? formatPlanPrice('BASIC') : formatPlanPrice(brand.plan as 'BASIC' | 'PRO')}/mes
          </p>
        </div>
        <div className="px-6 py-5 space-y-4">
          {error && <p className="text-sm text-red-500 bg-red-500/10 px-3 py-2 rounded-lg">{error}</p>}

          {/* Selector de plan */}
          <div>
            <label style={{ color: 'var(--text-secondary)' }} className="block text-sm font-medium mb-2">Plan a activar</label>
            <div className="grid grid-cols-2 gap-2">
              {(['BASIC', 'PRO'] as const).map(p => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setSelectedPlan(p)}
                  style={selectedPlan !== p ? { borderColor: 'var(--border-color)' } : {}}
                  className={`rounded-xl border-2 px-3 py-2.5 text-center transition-all ${
                    selectedPlan === p ? 'border-[#FF5C3A] bg-[rgba(255,92,58,0.08)]' : 'hover:opacity-80'
                  }`}
                >
                  <p style={{ color: 'var(--text-primary)' }} className="text-sm font-semibold">{p}</p>
                  <p style={{ color: 'var(--text-muted)' }} className="text-xs">{formatPlanPrice(p)}/mes</p>
                </button>
              ))}
            </div>
          </div>

          {/* Selector de período */}
          <div>
            <label style={{ color: 'var(--text-secondary)' }} className="block text-sm font-medium mb-2">Período de renovación</label>
            <div className="grid grid-cols-3 gap-2">
              {PERIOD_OPTIONS.map(opt => (
                <button
                  key={opt.months}
                  type="button"
                  onClick={() => setMonths(opt.months)}
                  style={months !== opt.months ? { borderColor: 'var(--border-color)' } : {}}
                  className={`relative rounded-xl border-2 px-3 py-2.5 text-center transition-all ${
                    months === opt.months
                      ? 'border-[#FF5C3A] bg-[rgba(255,92,58,0.08)]'
                      : 'hover:opacity-80'
                  }`}
                >
                  <p style={{ color: 'var(--text-primary)' }} className="text-sm font-semibold">{opt.label}</p>
                  {opt.discount > 0 && (
                    <span className="absolute -top-2 left-1/2 -translate-x-1/2 bg-emerald-500 text-white text-xs font-bold px-1.5 py-0.5 rounded-full whitespace-nowrap">
                      -{opt.discount}%
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Resumen de monto */}
          <div style={{ background: 'var(--bg-hover)', borderColor: 'var(--border-color)' }} className="rounded-xl border px-4 py-3 flex items-center justify-between">
            <div>
              <p style={{ color: 'var(--text-muted)' }} className="text-xs">Monto a cobrar</p>
              <p style={{ color: 'var(--text-primary)' }} className="text-lg font-bold">{formatCurrency(discountedAmount)}</p>
            </div>
            {selectedPeriod.discount > 0 && (
              <div className="text-right">
                <p style={{ color: 'var(--text-muted)' }} className="text-xs line-through">{formatCurrency(baseAmount * months)}</p>
                <p className="text-xs font-semibold text-emerald-500">Ahorro: {formatCurrency(baseAmount * months - discountedAmount)}</p>
              </div>
            )}
          </div>

          <div>
            <label style={{ color: 'var(--text-secondary)' }} className="block text-sm font-medium mb-1">Fecha de pago <span className="text-red-500">*</span></label>
            <input type="date" value={form.payment_date} onChange={e => setForm({ ...form, payment_date: e.target.value })}
              style={{ background: 'var(--bg-input)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
              className="w-full px-3 py-2 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#FF5C3A]" />
          </div>
          <div>
            <label style={{ color: 'var(--text-secondary)' }} className="block text-sm font-medium mb-1">Método de pago</label>
            <select value={form.payment_method} onChange={e => setForm({ ...form, payment_method: e.target.value })}
              style={{ background: 'var(--bg-input)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
              className="w-full px-3 py-2 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#FF5C3A]">
              <option value="transferencia">Transferencia</option>
              <option value="efectivo">Efectivo</option>
              <option value="tarjeta">Tarjeta</option>
              <option value="wompi">Wompi</option>
              <option value="otro">Otro</option>
            </select>
          </div>
          <div>
            <label style={{ color: 'var(--text-secondary)' }} className="block text-sm font-medium mb-1">Notas (opcional)</label>
            <textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} rows={2}
              style={{ background: 'var(--bg-input)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
              className="w-full px-3 py-2 border rounded-xl text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[#FF5C3A]"
              placeholder="Referencia de pago, observaciones..." />
          </div>
          <div className="flex items-start gap-2 bg-amber-500/10 border border-amber-500/20 rounded-xl px-3 py-2.5">
            <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-amber-500">
              Al confirmar se registrará el pago y la suscripción se renovará por <strong>{months * 30} días</strong>.
            </p>
          </div>
        </div>
        <div style={{ borderColor: 'var(--border-color)' }} className="px-6 py-4 border-t flex justify-end gap-3">
          <button onClick={onClose} style={{ borderColor: 'var(--border-color)', color: 'var(--text-secondary)' }} className="px-4 py-2 rounded-xl border text-sm hover:opacity-80 transition-opacity">Cancelar</button>
          <button onClick={handleSubmit} disabled={loading}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
            {loading && <RefreshCw className="w-4 h-4 animate-spin" />}
            Confirmar renovación
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Modal cambio de plan ──────────────────────────────────────────────────────

function ChangePlanModal({
  brand, onClose, onSuccess,
}: { brand: Subscription; onClose: () => void; onSuccess: () => void }) {
  const [newPlan, setNewPlan] = useState<'BASIC' | 'PRO'>(brand.plan === 'PRO' ? 'BASIC' : 'PRO');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    setLoading(true); setError('');
    try {
      const res = await adminApi(`/admin/brands/${brand.id}/plan`, {
        method: 'PATCH',
        body: JSON.stringify({ plan: newPlan }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Error al cambiar plan');
      onSuccess();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div style={{ background: 'var(--bg-card)', borderColor: 'var(--border-color)' }} className="rounded-[2rem] border shadow-xl w-full max-w-sm">
        <div style={{ borderColor: 'var(--border-color)' }} className="px-6 py-5 border-b">
          <h3 style={{ color: 'var(--text-primary)' }} className="font-jakarta font-bold uppercase italic text-lg">Cambiar plan — {brand.name}</h3>
        </div>
        <div className="px-6 py-5 space-y-4">
          {error && <p className="text-sm text-red-500 bg-red-500/10 px-3 py-2 rounded-lg">{error}</p>}
          <div style={{ background: 'var(--bg-hover)', borderColor: 'var(--border-color)' }} className="rounded-xl border px-4 py-3">
            <p style={{ color: 'var(--text-muted)' }} className="text-xs mb-0.5">Plan actual</p>
            <p style={{ color: 'var(--text-primary)' }} className="font-semibold">
              {brand.is_in_trial ? 'TRIAL' : brand.plan}
              {!brand.is_in_trial && brand.plan !== 'LANDING' && ` — ${formatPlanPrice(brand.plan as 'BASIC' | 'PRO')}/mes`}
              {!brand.is_in_trial && brand.plan === 'LANDING' && ' — Pago único'}
              {brand.is_in_trial && ` — ${brand.trial_days_remaining ?? '?'} días restantes`}
            </p>
          </div>
          <div>
            <label style={{ color: 'var(--text-secondary)' }} className="block text-sm font-medium mb-1">Nuevo plan</label>
            <select value={newPlan} onChange={e => setNewPlan(e.target.value as 'BASIC' | 'PRO')}
              style={{ background: 'var(--bg-input)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
              className="w-full px-3 py-2 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#FF5C3A]">
              <option value="BASIC">BASIC — {formatPlanPrice('BASIC')}/mes</option>
              <option value="PRO">PRO — {formatPlanPrice('PRO')}/mes</option>
            </select>
          </div>
          <div className="flex items-start gap-2 bg-amber-500/10 border border-amber-500/20 rounded-xl px-3 py-2.5">
            <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-amber-500">El cambio se aplica inmediatamente. Los límites de productos y generaciones se actualizarán al instante.</p>
          </div>
        </div>
        <div style={{ borderColor: 'var(--border-color)' }} className="px-6 py-4 border-t flex justify-end gap-3">
          <button onClick={onClose} style={{ borderColor: 'var(--border-color)', color: 'var(--text-secondary)' }} className="px-4 py-2 rounded-xl border text-sm hover:opacity-80 transition-opacity">Cancelar</button>
          <button onClick={handleSubmit} disabled={loading || newPlan === brand.plan}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#FF5C3A] text-white text-sm font-semibold hover:bg-[#e04e30] disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
            {loading && <RefreshCw className="w-4 h-4 animate-spin" />}
            Confirmar cambio
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Página principal ──────────────────────────────────────────────────────────

export default function AdminSubscriptionsPage() {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState<FilterStatus>('all');
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Ordenamiento
  const [sortField, setSortField] = useState<'name' | 'plan' | 'vencimiento'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  // Selección masiva
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkLoading, setBulkLoading] = useState(false);
  const [confirmBulk, setConfirmBulk] = useState<'suspend' | 'reactivate' | null>(null);

  // Modales
  const [renewTarget, setRenewTarget] = useState<Subscription | null>(null);
  const [changePlanTarget, setChangePlanTarget] = useState<Subscription | null>(null);
  const [confirmAction, setConfirmAction] = useState<{ brand: Subscription; action: 'suspend' | 'reactivate' } | null>(null);

  // Toast
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const showToast = (message: string, type: 'success' | 'error') => setToast({ message, type });

  useEffect(() => { fetchSubscriptions(); }, []);
  useEffect(() => { setCurrentPage(1); setSelected(new Set()); }, [filter, search]);

  const fetchSubscriptions = async () => {
    setLoading(true);
    try {
      const res = await adminApi('/admin/subscriptions');
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Error al cargar');
      setSubscriptions(data.subscriptions ?? []);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const toggleSort = (field: 'name' | 'plan' | 'vencimiento') => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const handleConfirmAction = async () => {
    if (!confirmAction) return;
    const { brand, action } = confirmAction;
    try {
      const res = await adminApi(`/admin/subscriptions/${brand.id}/${action}`, { method: 'PATCH' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Error');
      showToast(action === 'suspend' ? 'Marca suspendida' : 'Marca reactivada', 'success');
      fetchSubscriptions();
    } catch (e: any) {
      showToast(e.message, 'error');
    } finally {
      setConfirmAction(null);
    }
  };

  // Selección masiva helpers
  const toggleSelect = (id: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selected.size === paginated.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(paginated.map(s => s.id)));
    }
  };

  const handleBulkAction = async (action: 'suspend' | 'reactivate') => {
    setBulkLoading(true);
    const ids = Array.from(selected);
    let ok = 0; let fail = 0;
    await Promise.all(ids.map(async id => {
      try {
        const res = await adminApi(`/admin/subscriptions/${id}/${action}`, { method: 'PATCH' });
        if (res.ok) ok++; else fail++;
      } catch { fail++; }
    }));
    setBulkLoading(false);
    setConfirmBulk(null);
    setSelected(new Set());
    showToast(
      fail === 0
        ? `${ok} suscripción${ok > 1 ? 'es' : ''} ${action === 'suspend' ? 'suspendida' : 'reactivada'}${ok > 1 ? 's' : ''}`
        : `${ok} exitosa${ok > 1 ? 's' : ''}, ${fail} con error`,
      fail === 0 ? 'success' : 'error'
    );
    fetchSubscriptions();
  };

  // Filtrado
  const filtered = subscriptions.filter(s => {
    const matchStatus = filter === 'all'
      ? true
      : filter === 'trial'
      ? s.is_in_trial === true
      : s.subscription_status === filter;
    const q = search.toLowerCase();
    const matchSearch = !q || s.name.toLowerCase().includes(q) || s.email.toLowerCase().includes(q) || s.slug.toLowerCase().includes(q);
    return matchStatus && matchSearch;
  });

  // Ordenamiento
  const sorted = [...filtered].sort((a, b) => {
    let valA: any = '';
    let valB: any = '';

    if (sortField === 'name') {
      valA = a.name.toLowerCase();
      valB = b.name.toLowerCase();
    } else if (sortField === 'plan') {
      valA = a.plan;
      valB = b.plan;
    } else if (sortField === 'vencimiento') {
      valA = new Date(a.subscription_end_date || 0).getTime();
      valB = new Date(b.subscription_end_date || 0).getTime();
    }

    if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
    if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
    return 0;
  });

  const totalPages = Math.ceil(sorted.length / itemsPerPage);
  const paginated = sorted.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const counts = {
    all: subscriptions.length,
    active: subscriptions.filter(s => s.subscription_status === 'active').length,
    expiring_soon: subscriptions.filter(s => s.subscription_status === 'expiring_soon').length,
    expired: subscriptions.filter(s => s.subscription_status === 'expired').length,
    suspended: subscriptions.filter(s => s.subscription_status === 'suspended').length,
    trial: subscriptions.filter(s => s.is_in_trial === true).length,
  };

  const expiringSoon = subscriptions.filter(s => s.daysRemaining !== null && s.daysRemaining >= 0 && s.daysRemaining <= 7);

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-10 h-10 border-4 border-[#FF5C3A]/30 border-t-[#FF5C3A] rounded-full animate-spin" />
    </div>
  );

  if (error) return (
    <div className="bg-red-500/10 border border-red-500/20 text-red-500 px-4 py-3 rounded-xl text-sm">{error}</div>
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 style={{ color: 'var(--text-primary)' }} className="font-jakarta font-black uppercase italic tracking-tight text-2xl">Suscripciones</h1>
        <p style={{ color: 'var(--text-muted)' }} className="text-sm mt-1">{subscriptions.length} suscripciones en total</p>
      </div>

      {/* Alerta por vencer */}
      {expiringSoon.length > 0 && (
        <div className="flex items-start gap-3 bg-amber-500/10 border border-amber-500/20 rounded-xl px-4 py-3">
          <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-amber-500">
            <span className="font-semibold">{expiringSoon.length} suscripción{expiringSoon.length > 1 ? 'es' : ''}</span> vence{expiringSoon.length === 1 ? '' : 'n'} en los próximos 7 días.
          </p>
        </div>
      )}

      {/* Filtros */}
      <div style={{ background: 'var(--bg-card)', borderColor: 'var(--border-color)' }} className="rounded-[2rem] border p-4 space-y-4">
        <input type="text" value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Buscar por nombre, email o slug..."
          style={{ background: 'var(--bg-input)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
          className="w-full px-3 py-2 min-h-[44px] border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#FF5C3A]" />
        <div className="flex flex-wrap gap-2">
          {(['all', 'active', 'expiring_soon', 'expired', 'suspended', 'trial'] as FilterStatus[]).map(f => {
            const labels: Record<FilterStatus, string> = { all: 'Todas', active: 'Activas', expiring_soon: 'Por vencer', expired: 'Vencidas', suspended: 'Suspendidas', trial: 'Trial' };
            const colors: Record<FilterStatus, string> = { all: 'bg-[#FF5C3A]', active: 'bg-emerald-600', expiring_soon: 'bg-amber-500', expired: 'bg-red-600', suspended: 'bg-gray-600', trial: 'bg-[#6366f1]' };
            const active = filter === f;
            return (
              <button key={f} onClick={() => setFilter(f)}
                style={!active ? { background: 'var(--bg-hover)', color: 'var(--text-secondary)', borderColor: 'var(--border-color)' } : {}}
                className={`px-3 py-1.5 min-h-[36px] rounded-xl text-sm font-medium transition-colors border ${active ? `${colors[f]} text-white border-transparent` : 'hover:opacity-80'}`}>
                {labels[f]} ({counts[f]})
              </button>
            );
          })}
        </div>
      </div>

      {/* Tabla */}
      <div style={{ background: 'var(--bg-card)', borderColor: 'var(--border-color)' }} className="rounded-[2rem] border overflow-hidden">

        {/* Barra de acciones masivas */}
        {selected.size > 0 && (
          <div style={{ background: 'rgba(255,92,58,0.06)', borderColor: 'rgba(255,92,58,0.2)' }} className="flex items-center gap-3 px-5 py-3 border-b">
            <span className="text-sm font-medium text-[#FF5C3A]">
              {selected.size} seleccionada{selected.size > 1 ? 's' : ''}
            </span>
            <div className="flex items-center flex-wrap gap-2 ml-auto">
              <button onClick={() => setConfirmBulk('suspend')} disabled={bulkLoading}
                className="flex items-center gap-1.5 px-3 py-1.5 min-h-[36px] rounded-xl bg-red-600 text-white text-xs font-semibold hover:bg-red-700 disabled:opacity-50 transition-colors">
                <Ban className="w-3.5 h-3.5" /> Suspender
              </button>
              <button onClick={() => setConfirmBulk('reactivate')} disabled={bulkLoading}
                className="flex items-center gap-1.5 px-3 py-1.5 min-h-[36px] rounded-xl bg-[#FF5C3A] text-white text-xs font-semibold hover:bg-[#e04e30] disabled:opacity-50 transition-colors">
                <RotateCcw className="w-3.5 h-3.5" /> Reactivar
              </button>
              <button onClick={() => setSelected(new Set())}
                style={{ borderColor: 'var(--border-color)', color: 'var(--text-secondary)' }}
                className="px-3 py-1.5 min-h-[36px] rounded-xl border text-xs hover:opacity-80 transition-opacity">
                Cancelar
              </button>
            </div>
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ background: 'var(--bg-hover)', borderColor: 'var(--border-color)' }} className="border-b">
                <th className="px-4 py-3 w-10 text-center">
                  <input type="checkbox"
                    checked={paginated.length > 0 && selected.size === paginated.length}
                    ref={el => { if (el) el.indeterminate = selected.size > 0 && selected.size < paginated.length; }}
                    onChange={toggleSelectAll}
                    style={{ borderColor: 'var(--border-color)' }}
                    className="w-4 h-4 rounded accent-[#FF5C3A] cursor-pointer" />
                </th>
                <th onClick={() => toggleSort('name')} className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide cursor-pointer hover:bg-black/5 transition-colors">
                  <div className="flex items-center gap-1">
                    Marca
                    <ArrowUpDown className="w-3 h-3" style={{ color: sortField === 'name' ? '#FF5C3A' : 'var(--text-muted)' }} />
                  </div>
                </th>
                <th onClick={() => toggleSort('plan')} className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide cursor-pointer hover:bg-black/5 transition-colors">
                  <div className="flex items-center gap-1">
                    Plan
                    <ArrowUpDown className="w-3 h-3" style={{ color: sortField === 'plan' ? '#FF5C3A' : 'var(--text-muted)' }} />
                  </div>
                </th>
                <th onClick={() => toggleSort('vencimiento')} className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide cursor-pointer hover:bg-black/5 transition-colors">
                  <div className="flex items-center gap-1">
                    Vencimiento
                    <ArrowUpDown className="w-3 h-3" style={{ color: sortField === 'vencimiento' ? '#FF5C3A' : 'var(--text-muted)' }} />
                  </div>
                </th>
                <th style={{ color: 'var(--text-muted)' }} className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide">Días</th>
                <th style={{ color: 'var(--text-muted)' }} className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide">Estado</th>
                <th style={{ color: 'var(--text-muted)' }} className="px-5 py-3 text-center text-xs font-semibold uppercase tracking-wide">Acciones</th>
              </tr>
            </thead>
            <tbody style={{ borderColor: 'var(--border-color)' }} className="divide-y">
              {paginated.map(s => (
                <tr key={s.id} style={{
                  background: selected.has(s.id) ? 'rgba(255,92,58,0.05)' :
                    (s.daysRemaining >= 0 && s.daysRemaining <= 3) ? 'rgba(239,68,68,0.05)' : undefined,
                }} className="hover:opacity-90 transition-opacity">
                  <td className="px-4 py-3.5 text-center">
                    <input type="checkbox" checked={selected.has(s.id)} onChange={() => toggleSelect(s.id)}
                      style={{ borderColor: 'var(--border-color)' }}
                      className="w-4 h-4 rounded accent-[#FF5C3A] cursor-pointer" />
                  </td>
                  <td className="px-5 py-3.5">
                    <p style={{ color: 'var(--text-primary)' }} className="font-medium">{s.name}</p>
                    <p style={{ color: 'var(--text-muted)' }} className="text-xs">{s.email}</p>
                    <p style={{ color: 'var(--text-muted)' }} className="text-xs">/{s.slug}</p>
                  </td>
                  <td className="px-5 py-3.5">
                    <PlanBadge plan={s.plan} isInTrial={s.is_in_trial} />
                    <p style={{ color: 'var(--text-muted)' }} className="text-xs mt-1">
                      {s.is_in_trial
                        ? `${s.trial_days_remaining ?? '?'} días restantes`
                        : s.plan === 'LANDING' ? 'Pago único' : formatPlanPrice(s.plan as 'BASIC' | 'PRO')}
                    </p>
                  </td>
                  <td style={{ color: 'var(--text-secondary)' }} className="px-5 py-3.5">{formatDate(s.subscription_end_date)}</td>
                  <td className="px-5 py-3.5">
                    <DaysChip days={s.is_in_trial ? (s.trial_days_remaining ?? 0) : s.daysRemaining} />
                  </td>
                  <td className="px-5 py-3.5"><StatusBadge status={s.subscription_status} /></td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center justify-center gap-1.5">
                      <button onClick={() => setRenewTarget(s)} title="Renovar / Registrar pago"
                        className="p-2 rounded-xl bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 transition-colors">
                        <RefreshCw className="w-4 h-4" />
                      </button>
                      <button onClick={() => setChangePlanTarget(s)} title="Cambiar Plan"
                        className="p-2 rounded-xl bg-[#FF5C3A]/10 text-[#FF5C3A] hover:bg-[#FF5C3A]/20 transition-colors">
                        <ArrowUpDown className="w-4 h-4" />
                      </button>
                      {s.subscription_status === 'suspended' ? (
                        <button onClick={() => setConfirmAction({ brand: s, action: 'reactivate' })} title="Reactivar"
                          className="p-2 rounded-xl bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 transition-colors">
                          <RotateCcw className="w-4 h-4" />
                        </button>
                      ) : (
                        <button onClick={() => setConfirmAction({ brand: s, action: 'suspend' })} title="Suspender"
                          className="p-2 rounded-xl bg-[#ef4444]/10 text-[#ef4444] hover:bg-[#ef4444]/20 transition-colors">
                          <Ban className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filtered.length === 0 && (
          <div className="text-center py-12" style={{ color: 'var(--text-muted)' }}>
            <p className="text-sm">No hay suscripciones con el filtro seleccionado.</p>
          </div>
        )}
      </div>

      {/* Paginación */}
      {totalPages > 1 && (
        <div style={{ background: 'var(--bg-card)', borderColor: 'var(--border-color)' }} className="flex items-center justify-between border rounded-[2rem] px-5 py-3">
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
                  style={currentPage !== p ? { borderColor: 'var(--border-color)', color: 'var(--text-secondary)' } : {}}
                  className={`px-3 py-1.5 rounded-xl border text-sm transition-colors ${currentPage === p ? 'bg-[#FF5C3A] text-white border-[#FF5C3A]' : 'hover:opacity-80'}`}>
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
          onSuccess={() => { setRenewTarget(null); showToast('Suscripción renovada exitosamente', 'success'); fetchSubscriptions(); }} />
      )}
      {changePlanTarget && (
        <ChangePlanModal brand={changePlanTarget} onClose={() => setChangePlanTarget(null)}
          onSuccess={() => { setChangePlanTarget(null); showToast('Plan actualizado exitosamente', 'success'); fetchSubscriptions(); }} />
      )}
      {confirmAction && (
        <ConfirmModal
          title={confirmAction.action === 'suspend' ? `Suspender ${confirmAction.brand.name}` : `Reactivar ${confirmAction.brand.name}`}
          message={confirmAction.action === 'suspend'
            ? 'La marca perderá acceso al dashboard y al probador público.'
            : 'La marca recuperará acceso completo al sistema.'}
          confirmLabel={confirmAction.action === 'suspend' ? 'Suspender' : 'Reactivar'}
          confirmClass={confirmAction.action === 'suspend' ? 'bg-red-600 hover:bg-red-700' : 'bg-blue-600 hover:bg-blue-700'}
          onConfirm={handleConfirmAction}
          onCancel={() => setConfirmAction(null)}
        />
      )}

      {/* Modal confirmación acción masiva */}
      {confirmBulk && (
        <ConfirmModal
          title={confirmBulk === 'suspend' ? `Suspender ${selected.size} suscripción${selected.size > 1 ? 'es' : ''}` : `Reactivar ${selected.size} suscripción${selected.size > 1 ? 'es' : ''}`}
          message={confirmBulk === 'suspend'
            ? `Las ${selected.size} marcas seleccionadas perderán acceso al dashboard y al probador público.`
            : `Las ${selected.size} marcas seleccionadas recuperarán acceso completo al sistema.`}
          confirmLabel={confirmBulk === 'suspend' ? 'Suspender todas' : 'Reactivar todas'}
          confirmClass={confirmBulk === 'suspend' ? 'bg-red-600 hover:bg-red-700' : 'bg-blue-600 hover:bg-blue-700'}
          onConfirm={() => handleBulkAction(confirmBulk)}
          onCancel={() => setConfirmBulk(null)}
        />
      )}

      {/* Toast */}
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}
