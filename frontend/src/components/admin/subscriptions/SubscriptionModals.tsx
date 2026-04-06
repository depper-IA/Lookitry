'use client';

import { useState, useEffect } from 'react';
import { RefreshCw, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';
import { formatCurrency, formatPlanPrice } from '@/utils/currency';

const PERIOD_OPTIONS = [
  { months: 1, label: '1 mes', discount: 0 },
  { months: 3, label: '3 meses', discount: 5 },
  { months: 6, label: '6 meses', discount: 10 },
];

export interface Subscription {
  id: string;
  name: string;
  email: string;
  slug: string;
  plan: string;
  is_in_trial?: boolean;
  trial_end_date?: string | null;
  trial_days_remaining?: number | null;
  subscription_status: 'active' | 'expiring_soon' | 'expired' | 'suspended' | null;
  subscription_start_date: string | null;
  subscription_end_date: string | null;
  last_payment_date: string | null;
  next_payment_date: string | null;
  daysRemaining: number;
}

export type FilterStatus = 'all' | 'active' | 'expiring_soon' | 'expired' | 'suspended' | 'trial' | 'venciendo';
export type SortField = 'name' | 'plan' | 'vencimiento' | 'dias' | 'estado';

export function ConfirmModal({
  title, message, confirmLabel, confirmClass, onConfirm, onCancel,
}: {
  title: string; message: string; confirmLabel: string;
  confirmClass: string; onConfirm: () => void; onCancel: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div style={{ background: 'var(--bg-card)', borderColor: 'var(--border-color)' }} className="rounded-[2rem] border shadow-xl w-full max-w-sm p-6 space-y-4">
        <h3 style={{ color: 'var(--text-primary)' }} className="font-jakarta font-bold tracking-tight text-lg">{title}</h3>
        <p style={{ color: 'var(--text-secondary)' }} className="text-sm">{message}</p>
        <div className="flex gap-3 justify-end pt-2">
          <button onClick={onCancel} style={{ borderColor: 'var(--border-color)', color: 'var(--text-secondary)' }} className="px-4 py-2 rounded-xl border text-sm hover:opacity-80 transition-opacity">Cancelar</button>
          <button onClick={onConfirm} className={`px-4 py-2 rounded-xl text-sm font-semibold text-white transition-colors ${confirmClass}`}>{confirmLabel}</button>
        </div>
      </div>
    </div>
  );
}

export function Toast({ message, type, onClose }: { message: string; type: 'success' | 'error'; onClose: () => void }) {
  useEffect(() => { const t = setTimeout(onClose, 4000); return () => clearTimeout(t); }, [onClose]);
  return (
    <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg text-sm font-medium text-white ${type === 'success' ? 'bg-emerald-600' : 'bg-red-600'}`}>
      {type === 'success' ? <CheckCircle className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
      {message}
    </div>
  );
}

export function RenewModal({
  brand, onClose, onSuccess,
}: { brand: Subscription; onClose: () => void; onSuccess: () => void }) {
  const baseAmount = brand.plan === 'PRO' ? 250000 : 150000;
  const [months, setMonths] = useState(1);
  const [selectedPlan, setSelectedPlan] = useState<'BASIC' | 'PRO'>(
    brand.plan === 'TRIAL' ? 'BASIC' : (brand.plan as 'BASIC' | 'PRO')
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
      const base = process.env.NEXT_PUBLIC_API_URL || 'https://api.lookitry.com';
      const res = await fetch(`${base}/api/admin/subscriptions/${brand.id}/payment`, {
        method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: discountedAmount, months, plan: selectedPlan, currency: 'COP', status: 'completed', ...form }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Error al renovar');
      onSuccess();
    } catch (e: any) { setError(e.message); }
    finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div style={{ background: 'var(--bg-card)', borderColor: 'var(--border-color)' }} className="rounded-[2rem] border shadow-xl w-full max-w-md">
        <div style={{ borderColor: 'var(--border-color)' }} className="px-6 py-5 border-b">
          <h3 style={{ color: 'var(--text-primary)' }} className="font-jakarta font-bold tracking-tight text-lg">Registrar pago - {brand.name}</h3>
          <p style={{ color: 'var(--text-muted)' }} className="text-sm mt-0.5">
            {brand.plan === 'TRIAL' ? 'Plan Trial' : `Plan ${brand.plan}`} · {brand.plan === 'TRIAL' ? formatPlanPrice('BASIC') : formatPlanPrice(brand.plan as 'BASIC' | 'PRO')}/mes
          </p>
        </div>
        <div className="px-6 py-5 space-y-4">
          {error && <p className="text-sm text-red-500 bg-red-500/10 px-3 py-2 rounded-lg">{error}</p>}
          <div>
            <label style={{ color: 'var(--text-secondary)' }} className="block text-sm font-medium mb-2">Plan a activar</label>
            <div className="grid grid-cols-2 gap-2">
              {(['BASIC', 'PRO'] as const).map(p => (
                <button key={p} type="button" onClick={() => setSelectedPlan(p)}
                  style={selectedPlan !== p ? { borderColor: 'var(--border-color)' } : {}}
                  className={`rounded-xl border-2 px-3 py-2.5 text-center transition-all ${selectedPlan === p ? 'border-[#FF5C3A] bg-[rgba(255,92,58,0.08)]' : 'hover:opacity-80'}`}>
                  <p style={{ color: 'var(--text-primary)' }} className="text-sm font-semibold">{p}</p>
                  <p style={{ color: 'var(--text-muted)' }} className="text-xs">{formatPlanPrice(p)}/mes</p>
                </button>
              ))}
            </div>
          </div>
          <div>
            <label style={{ color: 'var(--text-secondary)' }} className="block text-sm font-medium mb-2">Período de renovación</label>
            <div className="grid grid-cols-3 gap-2">
              {PERIOD_OPTIONS.map(opt => (
                <button key={opt.months} type="button" onClick={() => setMonths(opt.months)}
                  style={months !== opt.months ? { borderColor: 'var(--border-color)' } : {}}
                  className={`relative rounded-xl border-2 px-3 py-2.5 text-center transition-all ${months === opt.months ? 'border-[#FF5C3A] bg-[rgba(255,92,58,0.08)]' : 'hover:opacity-80'}`}>
                  <p style={{ color: 'var(--text-primary)' }} className="text-sm font-semibold">{opt.label}</p>
                  {opt.discount > 0 && (
                    <span className="absolute -top-2 left-1/2 -translate-x-1/2 bg-emerald-500 text-white text-xs font-bold px-1.5 py-0.5 rounded-full whitespace-nowrap">-{opt.discount}%</span>
                  )}
                </button>
              ))}
            </div>
          </div>
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
            <label style={{ color: 'var(--text-secondary)' }} className="block text-sm font-medium mb-1">Fecha de pago</label>
            <input type="date" value={form.payment_date} onChange={e => setForm({ ...form, payment_date: e.target.value })}
              style={{ background: 'var(--bg-input)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
              className="w-full px-3 py-2 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#FF5C3A]" />
          </div>
          <div>
            <label style={{ color: 'var(--text-secondary)' }} className="block text-sm font-medium mb-1">Notas</label>
            <textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} rows={2}
              style={{ background: 'var(--bg-input)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
              className="w-full px-3 py-2 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#FF5C3A] resize-none" />
          </div>
        </div>
        <div style={{ borderColor: 'var(--border-color)' }} className="px-6 py-4 border-t flex justify-end gap-3">
          <button onClick={onClose} style={{ borderColor: 'var(--border-color)', color: 'var(--text-secondary)' }} className="px-4 py-2 rounded-xl border text-sm hover:opacity-80 transition-opacity">Cancelar</button>
          <button onClick={handleSubmit} disabled={loading}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#FF5C3A] text-white text-sm font-semibold hover:bg-[#e04e30] disabled:opacity-50 transition-colors">
            {loading && <RefreshCw className="w-4 h-4 animate-spin" />}
            Confirmar pago
          </button>
        </div>
      </div>
    </div>
  );
}

export function ChangePlanModal({
  brand, onClose, onSuccess,
}: { brand: Subscription; onClose: () => void; onSuccess: () => void }) {
  const [newPlan, setNewPlan] = useState<'BASIC' | 'PRO'>(brand.plan === 'PRO' ? 'BASIC' : 'PRO');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    if (brand.plan === 'TRIAL') { setError('Para convertir un Trial en Basic o Pro primero debes registrar el pago.'); return; }
    if (brand.subscription_status === 'suspended' || brand.subscription_status === 'expired') { setError('Para cambiar el plan de una suscripción suspendida o vencida primero registra el pago.'); return; }
    setLoading(true); setError('');
    try {
      const base = process.env.NEXT_PUBLIC_API_URL || 'https://api.lookitry.com';
      const res = await fetch(`${base}/api/admin/brands/${brand.id}/plan`, {
        method: 'PATCH', credentials: 'include', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan: newPlan }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Error al cambiar plan');
      onSuccess();
    } catch (e: any) { setError(e.message); }
    finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div style={{ background: 'var(--bg-card)', borderColor: 'var(--border-color)' }} className="rounded-[2rem] border shadow-xl w-full max-w-sm">
        <div style={{ borderColor: 'var(--border-color)' }} className="px-6 py-5 border-b">
          <h3 style={{ color: 'var(--text-primary)' }} className="font-jakarta font-bold tracking-tight text-lg">Cambiar plan - {brand.name}</h3>
        </div>
        <div className="px-6 py-5 space-y-4">
          {error && <p className="text-sm text-red-500 bg-red-500/10 px-3 py-2 rounded-lg">{error}</p>}
          <div style={{ background: 'var(--bg-hover)', borderColor: 'var(--border-color)' }} className="rounded-xl border px-4 py-3">
            <p style={{ color: 'var(--text-muted)' }} className="text-xs mb-0.5">Plan actual</p>
            <p style={{ color: 'var(--text-primary)' }} className="font-semibold">
              {brand.plan}
              {brand.plan !== 'TRIAL' && brand.plan !== 'LANDING' && ` — ${formatPlanPrice(brand.plan as 'BASIC' | 'PRO')}/mes`}
              {brand.plan === 'LANDING' && ' — Pago único'}
              {brand.plan === 'TRIAL' && ` — ${brand.trial_days_remaining ?? '?'} días restantes`}
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
            <p className="text-xs text-amber-500">Este cambio no registra pago. Úsalo solo para ajustes internos.</p>
          </div>
        </div>
        <div style={{ borderColor: 'var(--border-color)' }} className="px-6 py-4 border-t flex justify-end gap-3">
          <button onClick={onClose} style={{ borderColor: 'var(--border-color)', color: 'var(--text-secondary)' }} className="px-4 py-2 rounded-xl border text-sm hover:opacity-80 transition-opacity">Cancelar</button>
          <button
            onClick={handleSubmit}
            disabled={loading || newPlan === brand.plan || brand.plan === 'TRIAL' || brand.subscription_status === 'suspended' || brand.subscription_status === 'expired'}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#FF5C3A] text-white text-sm font-semibold hover:bg-[#e04e30] disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
            {loading && <RefreshCw className="w-4 h-4 animate-spin" />}
            Confirmar cambio
          </button>
        </div>
      </div>
    </div>
  );
}

export { PERIOD_OPTIONS };
