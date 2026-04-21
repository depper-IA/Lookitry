'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, CheckCircle2, Copy, Gift, Loader2, Star, Users, Zap } from 'lucide-react';
import { referralService, ReferralData } from '@/services/referral.service';

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
      const json = await referralService.getReferralInfo();
      setData(json);
    } finally {
      setLoading(false);
    }
  };

  const copyCode = () => {
    if (data?.referralCode) {
      try {
        navigator.clipboard.writeText(data.referralCode);
      } catch {
        const input = document.createElement('input');
        input.value = data.referralCode;
        document.body.appendChild(input);
        input.select();
        document.execCommand('copy');
        document.body.removeChild(input);
      }
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
      const result = await referralService.claimReferralCode(claimCode);
      setClaimSuccess(result.message);
      setClaimCode('');
      await loadReferralData();
    } catch (err: any) {
      const message = err?.response?.data?.message || err?.message || 'Código inválido';
      setClaimError(message);
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

  const rewardCredits = data?.rewardCredits || 200;
  const referredRewardCredits = data?.referredRewardCredits || 100;

  return (
    <div className="mx-auto max-w-4xl space-y-8 p-4 sm:p-6">

      {/* ── Header ─────────────────────────────────────────────── */}
      <div className="space-y-1">
        <h1 className="text-display-md font-bold text-[var(--text-primary)]">
          Recomienda y gana
        </h1>
        <p className="text-body text-[var(--text-secondary)] max-w-xl">
          Cada tienda que conviertas te da <span className="font-semibold text-[#FF5C3A]">{rewardCredits} créditos</span>.
          Y tu invitado también gana <span className="font-semibold text-[#FF5C3A]">{referredRewardCredits}</span> al activar su plan.
        </p>
      </div>

      {/* ── Hero Card (Código de referido) ──────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#FF5C3A] to-[#ff7a5c] p-8 text-white"
      >
        <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-white/10 blur-2xl" />
        <div className="absolute -bottom-6 -left-6 h-24 w-24 rounded-full bg-white/5 blur-xl" />

        <div className="relative">
          <div className="mb-2 flex items-center gap-2">
            <Gift className="h-5 w-5" />
            <span className="text-sm font-medium uppercase tracking-wider opacity-80">Tu código de referido</span>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <code className="text-3xl sm:text-4xl font-bold tracking-tight">{data?.referralCode || '—'}</code>
            <button
              onClick={copyCode}
              aria-label="Copiar código de referido"
              className="flex w-fit items-center gap-2 rounded-xl bg-white/20 px-5 py-3 text-sm font-medium backdrop-blur-sm transition-all hover:bg-white/30 active:scale-95"
            >
              {copied ? (
                <>
                  <CheckCircle2 className="h-4 w-4" />
                  ¡Copiado!
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4" />
                  Copiar código
                </>
              )}
            </button>
          </div>

          <p className="mt-4 text-sm opacity-80">
            Compártelo con tiendas de moda que necesiten un probador virtual con IA
          </p>
        </div>
      </motion.div>

      {/* ── Stats Row ───────────────────────────────────────────── */}
      <div className="grid grid-cols-3 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="rounded-2xl border border-[var(--border-color)] bg-[var(--bg-card)] p-5 text-center"
        >
          <Users className="mx-auto mb-2 h-5 w-5 text-[var(--text-muted)]" />
          <p className="text-2xl font-bold text-[var(--text-primary)]">{data?.referralCount || 0}</p>
          <p className="text-xs text-[var(--text-muted)] mt-1">Invitados</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="rounded-2xl border border-[var(--border-color)] bg-[var(--bg-card)] p-5 text-center"
        >
          <CheckCircle2 className="mx-auto mb-2 h-5 w-5 text-emerald-500" />
          <p className="text-2xl font-bold text-[var(--text-primary)]">{data?.successfulReferrals || 0}</p>
          <p className="text-xs text-[var(--text-muted)] mt-1">Convertidos</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="rounded-2xl border border-[var(--border-color)] bg-[var(--bg-card)] p-5 text-center"
        >
          <Zap className="mx-auto mb-2 h-5 w-5 text-[#FF5C3A]" />
          <p className="text-2xl font-bold text-[var(--text-primary)]">{data?.totalCreditsEarned || 0}</p>
          <p className="text-xs text-[var(--text-muted)] mt-1">Créditos ganados</p>
        </motion.div>
      </div>

      {/* ── Beneficios (Dos columnas) ───────────────────────────── */}
      <div className="grid gap-4 md:grid-cols-2">

        {/* Beneficio del Referidor */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="rounded-2xl border border-[var(--border-color)] bg-[var(--bg-card)] p-6"
        >
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#FF5C3A]/10">
              <Star className="h-5 w-5 text-[#FF5C3A]" />
            </div>
            <span className="text-label font-semibold text-[var(--text-secondary)] uppercase tracking-wider">Tu beneficio</span>
          </div>

          <div className="space-y-3">
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-bold text-[#FF5C3A]">{rewardCredits}</span>
              <span className="text-lg text-[var(--text-secondary)]">créditos</span>
            </div>
            <p className="text-sm text-[var(--text-muted)] leading-relaxed">
              Cuando tu invitado pague su primer plan Basic, Pro o Enterprise.
            </p>
          </div>

          <div className="mt-5 flex items-center gap-2 rounded-xl bg-emerald-500/10 px-4 py-3">
            <CheckCircle2 className="h-4 w-4 flex-shrink-0 text-emerald-500" />
            <span className="text-sm text-emerald-400">Se acreditan automáticamente</span>
          </div>
        </motion.div>

        {/* Beneficio del Referido */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="rounded-2xl border border-[var(--border-color)] bg-[var(--bg-card)] p-6"
        >
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-500/10">
              <Gift className="h-5 w-5 text-violet-500" />
            </div>
            <span className="text-label font-semibold text-[var(--text-secondary)] uppercase tracking-wider">Beneficio del invitado</span>
          </div>

          <div className="space-y-3">
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-bold text-violet-500">{referredRewardCredits}</span>
              <span className="text-lg text-[var(--text-secondary)]">créditos</span>
            </div>
            <p className="text-sm text-[var(--text-muted)] leading-relaxed">
              Al activar su plan con tu código de referido.
            </p>
          </div>

          <div className="mt-5 rounded-xl bg-violet-500/10 px-4 py-3">
            <p className="text-sm text-violet-400">
              Tu código hace que sea más fácil para ellos empezar
            </p>
          </div>
        </motion.div>
      </div>

      {/* ── Sección: ¿Te invitaron? (Para el referido) ────────── */}
      {!data?.hasReferredCode ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="rounded-2xl border border-[var(--border-color)] bg-[var(--bg-card)] p-6"
        >
          <div className="mb-1">
            <h2 className="text-lg font-bold text-[var(--text-primary)]">¿Te invitaron?</h2>
            <p className="mt-1 text-sm text-[var(--text-secondary)]">
              Ingresa el código que te compartieron y gana{' '}
              <span className="font-semibold text-violet-500">{referredRewardCredits} créditos</span> al activar tu plan.
            </p>
          </div>

          {claimSuccess ? (
            <div className="mt-4 flex items-center gap-3 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-5 py-4">
              <CheckCircle2 className="h-5 w-5 flex-shrink-0 text-emerald-500" />
              <div>
                <p className="font-medium text-emerald-400">¡Código aplicado!</p>
                <p className="text-sm text-emerald-400/80">{claimSuccess}</p>
              </div>
            </div>
          ) : (
            <div className="mt-4 flex flex-col gap-3 sm:flex-row">
              <input
                type="text"
                value={claimCode}
                onChange={(e) => setClaimCode(e.target.value.toUpperCase())}
                placeholder={`Ej: ${data?.referralCode || 'ABC12345'}`}
                aria-label="Código de referido"
                className="flex-1 rounded-xl border border-[var(--border-color)] bg-[var(--bg-input)] px-4 py-4 text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:border-[#FF5C3A] focus:outline-none min-h-[48px] text-base tracking-wider font-mono"
              />
              <button
                onClick={handleClaim}
                disabled={claimLoading || !claimCode.trim()}
                aria-label="Aplicar código de referido"
                className="flex items-center justify-center gap-2 rounded-xl bg-[#FF5C3A] px-8 py-4 font-medium text-white transition-colors hover:bg-[#FF5C3A]/90 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50 min-h-[48px]"
              >
                {claimLoading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <>Aplicar código <ArrowRight className="h-5 w-5" /></>
                )}
              </button>
            </div>
          )}
          {claimError && <p className="mt-3 text-sm text-red-400">{claimError}</p>}
        </motion.div>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="rounded-2xl border border-violet-500/30 bg-violet-500/5 p-6"
        >
          <div className="flex items-start gap-4">
            <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-violet-500/20">
              <CheckCircle2 className="h-5 w-5 text-violet-500" />
            </div>
            <div>
              <h2 className="font-bold text-[var(--text-primary)]">Código aplicado</h2>
              <p className="mt-1 text-sm text-[var(--text-secondary)]">
                Te invitó{' '}
                <span className="font-medium text-[var(--text-primary)]">
                  {data?.referrerName || 'una tienda'}
                </span>
              </p>
              <div className="mt-3 flex items-center gap-2">
                <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ${
                  data?.referredCodeStatus === 'converted'
                    ? 'bg-emerald-500/20 text-emerald-400'
                    : 'bg-amber-500/20 text-amber-400'
                }`}>
                  {data?.referredCodeStatus === 'converted' ? (
                    <>
                      <CheckCircle2 className="h-3 w-3" />
                      {referredRewardCredits} créditos desbloqueados
                    </>
                  ) : (
                    <>
                      <Gift className="h-3 w-3" />
                      {referredRewardCredits} créditos al activar tu plan
                    </>
                  )}
                </span>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* ── Cómo funciona ──────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="rounded-2xl border border-[var(--border-color)] bg-[var(--bg-card)] p-6"
      >
        <h2 className="mb-5 text-lg font-bold text-[var(--text-primary)]">Cómo funciona</h2>

        <div className="space-y-5">
          {/* Paso 1 */}
          <div className="flex gap-4">
            <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-[#FF5C3A] text-sm font-bold text-white">
              1
            </div>
            <div className="pt-1">
              <p className="font-semibold text-[var(--text-primary)]">Compartes tu código</p>
              <p className="mt-1 text-sm text-[var(--text-muted)]">
                Tu invitado lo usa al registrarse en Lookitry.
              </p>
            </div>
          </div>

          {/* Conexión visual */}
          <div className="ml-5 h-6 w-0.5 bg-[var(--border-color)]" />

          {/* Paso 2 */}
          <div className="flex gap-4">
            <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-[#FF5C3A] text-sm font-bold text-white">
              2
            </div>
            <div className="pt-1">
              <p className="font-semibold text-[var(--text-primary)]">Ellos activan su plan</p>
              <p className="mt-1 text-sm text-[var(--text-muted)]">
                Cuando se suscriben a Basic o Pro, ellos reciben{' '}
                <span className="font-medium text-violet-500">{referredRewardCredits} créditos</span> y tú recibes{' '}
                <span className="font-medium text-[#FF5C3A]">{rewardCredits} créditos</span>.
              </p>
            </div>
          </div>

          {/* Conexión visual */}
          <div className="ml-5 h-6 w-0.5 bg-[var(--border-color)]" />

          {/* Paso 3 */}
          <div className="flex gap-4">
            <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-emerald-500 text-sm font-bold text-white">
              3
            </div>
            <div className="pt-1">
              <p className="font-semibold text-[var(--text-primary)]">Ambos ganan</p>
              <p className="mt-1 text-sm text-[var(--text-muted)]">
                Los créditos se acreditan automáticamente. Sin pasos extra.
              </p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* ── Referidos Recientes ────────────────────────────────── */}
      {data?.recentReferrals && data.recentReferrals.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45 }}
          className="rounded-2xl border border-[var(--border-color)] bg-[var(--bg-card)] p-6"
        >
          <h2 className="mb-4 text-lg font-bold text-[var(--text-primary)]">Personas que has invitado</h2>
          <div className="space-y-3">
            {data.recentReferrals.map((ref, idx) => (
              <div
                key={ref.id}
                className="flex items-center justify-between rounded-xl bg-[var(--bg-base)] px-4 py-3"
              >
                <div className="flex items-center gap-3">
                  <div className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold ${
                    ref.status === 'converted'
                      ? 'bg-emerald-500/20 text-emerald-400'
                      : 'bg-amber-500/20 text-amber-400'
                  }`}>
                    {idx + 1}
                  </div>
                  <span className="text-sm text-[var(--text-muted)]">
                    {ref.referredName || `Referido #${ref.id.slice(0, 8).toUpperCase()}`}
                  </span>
                </div>
                <span className={`text-xs font-medium ${
                  ref.status === 'converted'
                    ? 'text-emerald-400'
                    : 'text-amber-400'
                }`}>
                  {ref.status === 'converted' ? 'Convertido' : 'Pendiente'}
                </span>
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
}
