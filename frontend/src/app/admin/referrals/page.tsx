'use client';

import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Check, Gift, Users, X, Loader2, RefreshCw } from 'lucide-react';

interface Referral {
  id: string;
  referral_code: string;
  bonus_months: number;
  status: 'pending' | 'converted';
  bonus_credited: boolean;
  referrer_claimed: boolean;
  referred_claimed: boolean;
  created_at: string;
  referrer_claimed_at: string | null;
  referred_claimed_at: string | null;
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
  const config = {
    pending: 'border-amber-500/20 bg-amber-500/10 text-amber-300',
    converted: 'border-emerald-500/20 bg-emerald-500/10 text-emerald-300',
  } as const;

  const label = {
    pending: 'Pendiente',
    converted: 'Convertido',
  } as const;

  return (
    <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${config[status]}`}>
      {label[status]}
    </span>
  );
}

function ClaimedBadge({ claimed }: { claimed: boolean }) {
  if (claimed) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2 py-1 text-xs font-semibold text-emerald-300">
        <Check className="w-3 h-3" />
        Aplicado
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-gray-500/20 bg-gray-500/10 px-2 py-1 text-xs font-semibold text-gray-400">
      <X className="w-3 h-3" />
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
  const searchParams = useSearchParams();
  
  const [loading, setLoading] = useState(true);
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [stats, setStats] = useState({ total: 0, pending: 0, converted: 0, bonusApplied: 0 });
  const [toast, setToast] = useState<ToastState>(null);
  const [crediting, setCrediting] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');

  const fetchReferrals = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/api/admin/referrals`, {
        credentials: 'include',
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Error al cargar referidos');
      setReferrals(data.referrals || []);
      
      const allRefs = data.referrals || [];
      setStats({
        total: allRefs.length,
        pending: allRefs.filter((r: Referral) => r.status === 'pending').length,
        converted: allRefs.filter((r: Referral) => r.status === 'converted').length,
        bonusApplied: allRefs.filter((r: Referral) => r.bonus_credited).length,
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
    return referrals.filter(r => r.status === statusFilter);
  }, [referrals, statusFilter]);

  const handleCredit = async (referralId: string, target: 'referrer' | 'referred') => {
    setCrediting(referralId);
    try {
      const response = await fetch(`${API_BASE}/api/admin/referrals/${referralId}/credit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ target }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Error al acreditar bonus');
      
      setToast({ message: `Bonus acreditado exitosamente`, type: 'success' });
      fetchReferrals();
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
          <p className="text-[var(--text-muted)]">Gestiona los referidos y acredita bonuses</p>
        </div>
        <button
          onClick={fetchReferrals}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl text-white hover:bg-[var(--bg-hover)] transition-colors"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Actualizar
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl p-5">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[#FF5C3A]/10 rounded-lg">
              <Users className="w-5 h-5 text-[#FF5C3A]" />
            </div>
            <span className="text-sm text-[var(--text-muted)]">Total Referidos</span>
          </div>
          <p className="text-2xl font-bold text-white mt-2">{stats.total}</p>
        </div>

        <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl p-5">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-500/10 rounded-lg">
              <Users className="w-5 h-5 text-amber-500" />
            </div>
            <span className="text-sm text-[var(--text-muted)]">Pendientes</span>
          </div>
          <p className="text-2xl font-bold text-white mt-2">{stats.pending}</p>
        </div>

        <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl p-5">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-500/10 rounded-lg">
              <Check className="w-5 h-5 text-emerald-500" />
            </div>
            <span className="text-sm text-[var(--text-muted)]">Convertidos</span>
          </div>
          <p className="text-2xl font-bold text-white mt-2">{stats.converted}</p>
        </div>

        <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl p-5">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-500/10 rounded-lg">
              <Gift className="w-5 h-5 text-purple-500" />
            </div>
            <span className="text-sm text-[var(--text-muted)]">Bonus Aplicados</span>
          </div>
          <p className="text-2xl font-bold text-white mt-2">{stats.bonusApplied}</p>
        </div>
      </div>

      <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold text-white">Lista de Referidos</h2>
          <div className="flex gap-2">
            {(['all', 'pending', 'converted'] as StatusFilter[]).map((filter) => (
              <button
                key={filter}
                onClick={() => setStatusFilter(filter)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
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
            <Loader2 className="w-8 h-8 animate-spin text-[#FF5C3A]" />
          </div>
        ) : filteredReferrals.length === 0 ? (
          <div className="text-center py-12 text-[var(--text-muted)]">
            No hay referidos que mostrar
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[var(--border-color)]">
                  <th className="text-left text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider pb-3 px-2">Código</th>
                  <th className="text-left text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider pb-3 px-2">Referente</th>
                  <th className="text-left text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider pb-3 px-2">Referido</th>
                  <th className="text-left text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider pb-3 px-2">Bonus</th>
                  <th className="text-left text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider pb-3 px-2">Status</th>
                  <th className="text-left text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider pb-3 px-2">Referente</th>
                  <th className="text-left text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider pb-3 px-2">Referido</th>
                  <th className="text-left text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider pb-3 px-2">Fecha</th>
                  <th className="text-left text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider pb-3 px-2">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-color)]">
                {filteredReferrals.map((referral) => (
                  <tr key={referral.id} className="hover:bg-[var(--bg-hover)] transition-colors">
                    <td className="py-4 px-2">
                      <code className="text-sm font-mono text-white bg-[var(--bg-primary)] px-2 py-1 rounded">
                        {referral.referral_code}
                      </code>
                    </td>
                    <td className="py-4 px-2">
                      <div>
                        <p className="text-white font-medium text-sm">{referral.referrer?.name || '—'}</p>
                        <p className="text-xs text-[var(--text-muted)]">{referral.referrer?.email || ''}</p>
                      </div>
                    </td>
                    <td className="py-4 px-2">
                      <div>
                        <p className="text-white font-medium text-sm">{referral.referred?.name || '—'}</p>
                        <p className="text-xs text-[var(--text-muted)]">{referral.referred?.email || ''}</p>
                      </div>
                    </td>
                    <td className="py-4 px-2">
                      <span className="text-sm text-white">{referral.bonus_months} mes{referral.bonus_months > 1 ? 'es' : ''}</span>
                    </td>
                    <td className="py-4 px-2">
                      <StatusBadge status={referral.status} />
                    </td>
                    <td className="py-4 px-2">
                      <ClaimedBadge claimed={referral.referrer_claimed} />
                    </td>
                    <td className="py-4 px-2">
                      <ClaimedBadge claimed={referral.referred_claimed} />
                    </td>
                    <td className="py-4 px-2">
                      <span className="text-sm text-[var(--text-muted)]">{formatDate(referral.created_at)}</span>
                    </td>
                    <td className="py-4 px-2">
                      {referral.status === 'converted' && (
                        <div className="flex gap-2">
                          {!referral.referrer_claimed && (
                            <button
                              onClick={() => handleCredit(referral.id, 'referrer')}
                              disabled={crediting === referral.id}
                              className="px-2 py-1 text-xs bg-emerald-500/10 text-emerald-400 rounded hover:bg-emerald-500/20 transition-colors disabled:opacity-50"
                            >
                              +Referente
                            </button>
                          )}
                          {!referral.referred_claimed && (
                            <button
                              onClick={() => handleCredit(referral.id, 'referred')}
                              disabled={crediting === referral.id}
                              className="px-2 py-1 text-xs bg-emerald-500/10 text-emerald-400 rounded hover:bg-emerald-500/20 transition-colors disabled:opacity-50"
                            >
                              +Referido
                            </button>
                          )}
                        </div>
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
