'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, CheckCircle2, Copy, Gift, Loader2, Users } from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.lookitry.com';

interface ReferralData {
  referralCode: string;
  rewardCredits: number;
  referralCount: number;
  successfulReferrals: number;
  pendingReferrals: number;
  totalCreditsEarned: number;
  recentReferrals: Array<{
    id: string;
    referred_brand_id: string;
    status: string;
    created_at: string;
    converted_at?: string | null;
  }>;
}

export default function ReferralPage() {
  const [data, setData] = useState<ReferralData | null>(null);
  const [loading, setLoading] = useState(true);
  const [claimCode, setClaimCode] = useState('');
  const [claimLoading, setClaimLoading] = useState(false);
  const [claimSuccess, setClaimSuccess] = useState<string | null>(null);
  const [claimError, setClaimError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    loadReferralData();
  }, []);

  const loadReferralData = async () => {
    try {
      const res = await fetch(`${API_URL}/api/brands/me/referral`, { credentials: 'include' });
      if (!res.ok) throw new Error('Error al cargar');
      const json = await res.json();
      setData(json);
    } finally {
      setLoading(false);
    }
  };

  const copyCode = () => {
    if (data?.referralCode) {
      navigator.clipboard.writeText(data.referralCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleClaim = async () => {
    if (!claimCode.trim()) return;
    setClaimLoading(true);
    setClaimError(null);
    setClaimSuccess(null);

    try {
      const res = await fetch(`${API_URL}/api/brands/me/referral/claim`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ code: claimCode }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Error');
      setClaimSuccess(json.message);
      setClaimCode('');
      await loadReferralData();
    } catch (err: any) {
      setClaimError(err.message || 'Código inválido');
    } finally {
      setClaimLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#FF5C3A]" />
      </div>
    );
  }

  const rewardCredits = data?.rewardCredits || 500;

  return (
    <div className="mx-auto max-w-4xl space-y-8 p-6">
      <div>
        <h1 className="text-2xl font-bold text-[var(--text-primary)]">Programa de Referidos</h1>
        <p className="mt-1 text-[var(--text-muted)]">Invita a otras tiendas y gana {rewardCredits} créditos extra por cada conversión válida.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="rounded-2xl border border-[var(--border-color)] bg-[var(--bg-card)] p-6">
          <div className="mb-2 flex items-center gap-3">
            <div className="rounded-lg bg-[#FF5C3A]/10 p-2">
              <Gift className="h-5 w-5 text-[#FF5C3A]" />
            </div>
            <span className="text-sm text-[var(--text-muted)]">Tu código</span>
          </div>
          <div className="mt-3 flex items-center gap-2">
            <code className="text-2xl font-bold text-white">{data?.referralCode || '—'}</code>
            <button
              onClick={copyCode}
              aria-label="Copiar código de referido"
              className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg p-3 transition-colors hover:bg-[var(--bg-hover)] active:scale-95"
            >
              {copied ? (
                <CheckCircle2 className="h-5 w-5 text-emerald-500" />
              ) : (
                <Copy className="h-5 w-5 text-[var(--text-muted)]" />
              )}
              {copied && (
                <span className="absolute -top-9 left-1/2 -translate-x-1/2 rounded bg-emerald-500 px-2 py-1 text-[10px] font-bold text-white whitespace-nowrap">
                  ¡Copiado!
                </span>
              )}
            </button>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="rounded-2xl border border-[var(--border-color)] bg-[var(--bg-card)] p-6">
          <div className="mb-2 flex items-center gap-3">
            <div className="rounded-lg bg-emerald-500/10 p-2">
              <Users className="h-5 w-5 text-emerald-500" />
            </div>
            <span className="text-sm text-[var(--text-muted)]">Total referidos</span>
          </div>
          <p className="text-3xl font-bold text-white">{data?.referralCount || 0}</p>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="rounded-2xl border border-[var(--border-color)] bg-[var(--bg-card)] p-6">
          <div className="mb-2 flex items-center gap-3">
            <div className="rounded-lg bg-amber-500/10 p-2">
              <CheckCircle2 className="h-5 w-5 text-amber-500" />
            </div>
            <span className="text-sm text-[var(--text-muted)]">Convertidos</span>
          </div>
          <p className="text-3xl font-bold text-white">{data?.successfulReferrals || 0}</p>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="rounded-2xl border border-[var(--border-color)] bg-[var(--bg-card)] p-6">
          <div className="mb-2 flex items-center gap-3">
            <div className="rounded-lg bg-sky-500/10 p-2">
              <Gift className="h-5 w-5 text-sky-400" />
            </div>
            <span className="text-sm text-[var(--text-muted)]">Créditos ganados</span>
          </div>
          <p className="text-3xl font-bold text-white">{data?.totalCreditsEarned || 0}</p>
        </motion.div>
      </div>

      <div className="rounded-2xl border border-[var(--border-color)] bg-[var(--bg-card)] p-6">
        <h2 className="mb-4 text-lg font-bold text-white">¿Cómo funciona?</h2>
        <div className="space-y-4">
          <div className="flex gap-4">
            <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-[#FF5C3A] text-sm font-bold text-white">1</div>
            <div>
              <p className="font-medium text-white">Comparte tu código</p>
              <p className="text-sm text-[var(--text-muted)]">Envíalo a otras tiendas que puedan necesitar el probador virtual.</p>
            </div>
          </div>
          <div className="flex gap-4">
            <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-[#FF5C3A] text-sm font-bold text-white">2</div>
            <div>
              <p className="font-medium text-white">Ellos lo reclaman</p>
              <p className="text-sm text-[var(--text-muted)]">La nueva marca registra tu código una sola vez desde su cuenta.</p>
            </div>
          </div>
          <div className="flex gap-4">
            <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-[#FF5C3A] text-sm font-bold text-white">3</div>
            <div>
              <p className="font-medium text-white">Tú ganas {rewardCredits} créditos extra</p>
              <p className="text-sm text-[var(--text-muted)]">Se liberan automáticamente cuando ese referido paga por primera vez un plan mensual real.</p>
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-[var(--border-color)] bg-[var(--bg-card)] p-6">
        <h2 className="mb-4 text-lg font-bold text-white">¿Tienes un código de referido?</h2>
        <p className="mb-4 text-sm text-[var(--text-muted)]">Ingresa el código que te compartieron. El beneficio se acredita al referente cuando completes tu primer pago mensual elegible.</p>

        {claimSuccess ? (
          <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4">
            <p className="flex items-center gap-2 text-emerald-400">
              <CheckCircle2 className="h-5 w-5" />
              {claimSuccess}
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-3 sm:flex-row">
            <input
              type="text"
              value={claimCode}
              onChange={(e) => setClaimCode(e.target.value.toUpperCase())}
              placeholder="Ej: ABC12345"
              aria-label="Código de referido"
              className="flex-1 rounded-xl border border-[var(--border-color)] bg-[var(--bg-primary)] px-4 py-4 text-white placeholder:text-[var(--text-muted)] focus:border-[#FF5C3A] focus:outline-none min-h-[48px] text-base"
            />
            <button
              onClick={handleClaim}
              disabled={claimLoading || !claimCode.trim()}
              aria-label="Aplicar código de referido"
              className="flex items-center justify-center gap-2 rounded-xl bg-[#FF5C3A] px-8 py-4 font-medium text-white transition-colors hover:bg-[#FF5C3A]/90 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50 min-h-[48px] text-base"
            >
              {claimLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <>Aplicar <ArrowRight className="h-5 w-5" /></>}
            </button>
          </div>
        )}
        {claimError && <p className="mt-2 text-sm text-red-400">{claimError}</p>}
      </div>

      {data?.recentReferrals && data.recentReferrals.length > 0 && (
        <div className="rounded-2xl border border-[var(--border-color)] bg-[var(--bg-card)] p-6">
          <h2 className="mb-4 text-lg font-bold text-white">Referidos recientes</h2>
          <div className="space-y-3">
            {data.recentReferrals.map(ref => (
              <div key={ref.id} className="flex items-center justify-between rounded-xl bg-[var(--bg-primary)] p-3">
                <span className="text-sm text-[var(--text-muted)]">Referido #{ref.id.slice(0, 8)}</span>
                <span className={`text-sm font-medium ${ref.status === 'converted' ? 'text-emerald-400' : 'text-amber-400'}`}>
                  {ref.status === 'converted' ? 'Convertido' : 'Pendiente'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
