'use client';

import { useEffect, useMemo, useState } from 'react';
import { Check, Gift, Loader2, RefreshCw, Users, X } from 'lucide-react';

interface Referral {
  id: string;
  referral_code: string;
  reward_credits: number;
  status: 'pending' | 'converted';
  bonus_credited: boolean;
  referrer_claimed: boolean;
  created_at: string;
  converted_at: string | null;
  conversion_payment_reference: string | null;
  referrer_claimed_at: string | null;
  referrer: {
    id: string;
    name: string;
    email: string;
    slug: string;
  };
  referred: {
    id: string;
    name: string;
    email: string;
    slug: string;
  };
}

type StatusFilter = 'all' | 'pending' | 'converted';
type ToastState = { message: string; type: 'success' | 'error' } | null;

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'https://api.lookitry.com';

function StatusBadge({ status }: { status: Referral['status'] }) {
  const label = status === 'converted' ? 'Convertido' : 'Pendiente';
  const color = status === 'converted'
    ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-300'
    : 'border-amber-500/20 bg-amber-500/10 text-amber-300';

  return <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${color}`}>{label}</span>;
}

function ClaimedBadge({ claimed }: { claimed: boolean }) {
  if (claimed) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2 py-1 text-xs font-semibold text-emerald-300">
        <Check className="h-3 w-3" />
        Acreditado
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-gray-500/20 bg-gray-500/10 px-2 py-1 text-xs font-semibold text-gray-400">
      <X className="h-3 w-3" />
      Pendiente
    </span>
  );
}

function Toast({ toast, onClose }: { toast: Exclude<ToastState, null>; onClose: () => void }) {
  useEffect(() => {
    const timer = window.setTimeout(onClose, 3200);
    return () => window.clearTimeout(timer);
  }, [onClose]);

  return (
    <div className={`fixed bottom-6 right-6 z-50 rounded-2xl border px-4 py-3 text-sm text-white shadow-2xl backdrop-blur-sm ${toast.type === 'success' ? 'border-emerald-500/20 bg-emerald-600/90' : 'border-red-500/20 bg-red-600/90'}`}>
      {toast.message}
    </div>
  );
}

export default function AdminReferralsPage() {
  const [loading, setLoading] = useState(true);
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [stats, setStats] = useState({ total: 0, pending: 0, converted: 0, bonusApplied: 0, creditedRewards: 0 });
  const [toast, setToast] = useState<ToastState>(null);
  const [crediting, setCrediting] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');

  const fetchReferrals = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/api/admin/referrals`, { credentials: 'include' });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Error al cargar referidos');

      const allRefs = data.referrals || [];
      setReferrals(allRefs);
      setStats({
        total: allRefs.length,
        pending: allRefs.filter((r: Referral) => r.status === 'pending').length,
        converted: allRefs.filter((r: Referral) => r.status === 'converted').length,
        bonusApplied: allRefs.filter((r: Referral) => r.referrer_claimed).length,
        creditedRewards: allRefs
          .filter((r: Referral) => r.referrer_claimed)
          .reduce((sum: number, r: Referral) => sum + Number(r.reward_credits || 0), 0),
      });
    } catch (error: any) {
      setToast({ message: error.message || 'Error al cargar referidos', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReferrals();
  }, []);

  const filteredReferrals = useMemo(() => {
    if (statusFilter === 'all') return referrals;
    return referrals.filter(referral => referral.status === statusFilter);
  }, [referrals, statusFilter]);

  const handleCredit = async (referralId: string) => {
    setCrediting(referralId);
    try {
      const response = await fetch(`${API_BASE}/api/admin/referrals/${referralId}/credit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ target: 'referrer' }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Error al acreditar bonus');

      setToast({ message: data.message || 'Bonus acreditado exitosamente', type: 'success' });
      await fetchReferrals();
    } catch (error: any) {
      setToast({ message: error.message || 'Error al acreditar bonus', type: 'error' });
    } finally {
      setCrediting(null);
    }
  };

  const formatDate = (date: string | null) => {
    if (!date) return '—';
    return new Date(date).toLocaleDateString('es-CO', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Programa de Referidos</h1>
          <p className="text-[var(--text-muted)]">Audita conversiones y acredita manualmente solo como rescate operativo.</p>
        </div>
        <button
          onClick={fetchReferrals}
          disabled={loading}
          className="flex items-center gap-2 rounded-xl border border-[var(--border-color)] bg-[var(--bg-card)] px-4 py-2 text-white transition-colors hover:bg-[var(--bg-hover)]"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Actualizar
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <div className="rounded-2xl border border-[var(--border-color)] bg-[var(--bg-card)] p-5">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-[#FF5C3A]/10 p-2">
              <Users className="h-5 w-5 text-[#FF5C3A]" />
            </div>
            <span className="text-sm text-[var(--text-muted)]">Total referidos</span>
          </div>
          <p className="mt-2 text-2xl font-bold text-white">{stats.total}</p>
        </div>

        <div className="rounded-2xl border border-[var(--border-color)] bg-[var(--bg-card)] p-5">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-amber-500/10 p-2">
              <Users className="h-5 w-5 text-amber-500" />
            </div>
            <span className="text-sm text-[var(--text-muted)]">Pendientes</span>
          </div>
          <p className="mt-2 text-2xl font-bold text-white">{stats.pending}</p>
        </div>

        <div className="rounded-2xl border border-[var(--border-color)] bg-[var(--bg-card)] p-5">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-emerald-500/10 p-2">
              <Check className="h-5 w-5 text-emerald-500" />
            </div>
            <span className="text-sm text-[var(--text-muted)]">Convertidos</span>
          </div>
          <p className="mt-2 text-2xl font-bold text-white">{stats.converted}</p>
        </div>

        <div className="rounded-2xl border border-[var(--border-color)] bg-[var(--bg-card)] p-5">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-purple-500/10 p-2">
              <Gift className="h-5 w-5 text-purple-400" />
            </div>
            <span className="text-sm text-[var(--text-muted)]">Créditos entregados</span>
          </div>
          <p className="mt-2 text-2xl font-bold text-white">{stats.creditedRewards}</p>
          <p className="mt-1 text-xs text-[var(--text-muted)]">{stats.bonusApplied} rewards acreditados</p>
        </div>
      </div>

      <div className="rounded-2xl border border-[var(--border-color)] bg-[var(--bg-card)] p-6">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-lg font-bold text-white">Lista de referidos</h2>
          <div className="flex gap-2">
            {(['all', 'pending', 'converted'] as StatusFilter[]).map(filter => (
              <button
                key={filter}
                onClick={() => setStatusFilter(filter)}
                className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                  statusFilter === filter
                    ? 'bg-[#FF5C3A] text-white'
                    : 'bg-[var(--bg-primary)] text-[var(--text-muted)] hover:text-white'
                }`}
              >
                {filter === 'all' ? 'Todos' : filter === 'pending' ? 'Pendientes' : 'Convertidos'}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-[#FF5C3A]" />
          </div>
        ) : filteredReferrals.length === 0 ? (
          <div className="py-12 text-center text-[var(--text-muted)]">No hay referidos que mostrar</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[var(--border-color)]">
                  <th className="px-2 pb-3 text-left text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">Código</th>
                  <th className="px-2 pb-3 text-left text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">Referente</th>
                  <th className="px-2 pb-3 text-left text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">Referido</th>
                  <th className="px-2 pb-3 text-left text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">Reward</th>
                  <th className="px-2 pb-3 text-left text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">Estado</th>
                  <th className="px-2 pb-3 text-left text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">Aplicado</th>
                  <th className="px-2 pb-3 text-left text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">Conversión</th>
                  <th className="px-2 pb-3 text-left text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">Referencia</th>
                  <th className="px-2 pb-3 text-left text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-color)]">
                {filteredReferrals.map(referral => (
                  <tr key={referral.id} className="transition-colors hover:bg-[var(--bg-hover)]">
                    <td className="px-2 py-4">
                      <code className="rounded bg-[var(--bg-primary)] px-2 py-1 text-sm font-mono text-white">{referral.referral_code}</code>
                    </td>
                    <td className="px-2 py-4">
                      <p className="text-sm font-medium text-white">{referral.referrer?.name || '—'}</p>
                      <p className="text-xs text-[var(--text-muted)]">{referral.referrer?.email || ''}</p>
                    </td>
                    <td className="px-2 py-4">
                      <p className="text-sm font-medium text-white">{referral.referred?.name || '—'}</p>
                      <p className="text-xs text-[var(--text-muted)]">{referral.referred?.email || ''}</p>
                    </td>
                    <td className="px-2 py-4 text-sm text-white">{referral.reward_credits} créditos</td>
                    <td className="px-2 py-4">
                      <StatusBadge status={referral.status} />
                    </td>
                    <td className="px-2 py-4">
                      <ClaimedBadge claimed={referral.referrer_claimed} />
                      <p className="mt-1 text-xs text-[var(--text-muted)]">{formatDate(referral.referrer_claimed_at)}</p>
                    </td>
                    <td className="px-2 py-4 text-sm text-[var(--text-muted)]">{formatDate(referral.converted_at || referral.created_at)}</td>
                    <td className="px-2 py-4">
                      <span className="text-xs text-[var(--text-muted)]">{referral.conversion_payment_reference || '—'}</span>
                    </td>
                    <td className="px-2 py-4">
                      {referral.status === 'converted' && !referral.referrer_claimed ? (
                        <button
                          onClick={() => handleCredit(referral.id)}
                          disabled={crediting === referral.id}
                          className="rounded bg-emerald-500/10 px-2 py-1 text-xs text-emerald-400 transition-colors hover:bg-emerald-500/20 disabled:opacity-50"
                        >
                          {crediting === referral.id ? 'Acreditando...' : '+500 al referente'}
                        </button>
                      ) : (
                        <span className="text-xs text-[var(--text-muted)]">Automático</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {toast && <Toast toast={toast} onClose={() => setToast(null)} />}
    </div>
  );
}
