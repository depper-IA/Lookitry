'use client';

import React from 'react';
import { motion } from 'framer-motion';
import type { UsageStats as UsageStatsType } from '@/types';
import { Activity, Package, Calendar, AlertTriangle, TrendingUp, Zap, Gift } from 'lucide-react';

interface UsageStatsProps {
  stats: UsageStatsType;
  isTrial?: boolean;
  trialEndsAt?: string | null;
}

function ProgressBar({ value, max }: { value: number; max: number }) {
  const pct = Math.min((value / max) * 100, 100);
  const color =
    pct >= 90
      ? 'from-red-500 to-red-600'
      : pct >= 70
        ? 'from-amber-400 to-amber-600'
        : 'from-[#FF5C3A] to-[#E84E2E]';

  return (
    <div className="h-4 overflow-hidden rounded-full border border-[var(--border-color)] bg-[var(--bg-input)] p-1 shadow-inner">
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: `${pct}%` }}
        transition={{ duration: 1, ease: 'easeOut' }}
        className={`h-full rounded-full bg-gradient-to-r ${color} shadow-lg shadow-[#FF5C3A]/20`}
      />
    </div>
  );
}

export function UsageStats({ stats, isTrial = false, trialEndsAt = null }: UsageStatsProps) {
  const { generationsUsed, generationsLimit, productsCount, productsLimit } = stats.currentMonth;
  const genPct = (generationsUsed / generationsLimit) * 100;
  const prodPct = (productsCount / productsLimit) * 100;

  const formatDate = (date: string) =>
    new Date(date).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

  const statsItems = [
    {
      id: 'generations',
      label: 'Creditos de generacion',
      used: generationsUsed,
      limit: generationsLimit,
      pct: genPct,
      icon: <Activity className="h-6 w-6" />,
      description: isTrial ? 'Creditos incluidos en tu prueba.' : 'Pruebas virtuales mensuales.',
      warning: genPct >= 90 ? 'Limite critico. Estas a punto de agotar tus creditos.' : null,
    },
    {
      id: 'products',
      label: 'Slots de catalogo',
      used: productsCount,
      limit: productsLimit,
      pct: prodPct,
      icon: <Package className="h-6 w-6" />,
      description: 'Capacidad de prendas activas.',
      warning: prodPct >= 100 ? 'Inventario lleno. Libera slots para nuevos productos.' : null,
    },
  ];

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {statsItems.map((item) => (
          <motion.div
            key={item.id}
            whileHover={{ y: -5 }}
            className="group relative overflow-hidden rounded-[3rem] border border-[var(--border-color)] bg-[var(--bg-card)] p-8 shadow-xl transition-all hover:border-[#FF5C3A]/30"
          >
            <div className="absolute right-0 top-0 p-8 opacity-5 transition-transform duration-700 group-hover:scale-110">
              {item.icon}
            </div>

            <div className="relative z-10 space-y-6">
              <div className="flex items-center gap-5">
                <div className="flex h-16 w-16 items-center justify-center rounded-[2rem] bg-[#FF5C3A]/10 text-[#FF5C3A] shadow-inner">
                  {item.icon}
                </div>
                <div>
                  <h4 className="max-w-[13rem] text-base font-bold leading-tight tracking-tight text-[var(--text-primary)] md:max-w-none md:text-lg">
                    {item.label}
                  </h4>
                  <p className="text-[10px] font-black uppercase leading-tight tracking-[0.2em] text-[var(--text-muted)]">
                    {item.description}
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-end justify-between">
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-4xl font-extrabold tracking-tighter text-[var(--text-primary)]">{item.used}</span>
                    <span className="text-lg font-bold text-[var(--text-muted)]">/ {item.limit}</span>
                  </div>
                  <span
                    className={`rounded-xl border p-2 text-xs font-black ${
                      item.pct >= 90
                        ? 'border-red-500 bg-red-500/10 text-red-500'
                        : 'border-[#FF5C3A]/20 bg-[#FF5C3A]/10 text-[#FF5C3A]'
                    }`}
                  >
                    {item.pct.toFixed(0)}%
                  </span>
                </div>
                <ProgressBar value={item.used} max={item.limit} />
              </div>

              {item.warning && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center gap-3 rounded-2xl border border-red-500/20 bg-red-500/5 p-4 text-[10px] font-black uppercase tracking-widest text-red-500"
                >
                  <AlertTriangle className="h-4 w-4 shrink-0" />
                  {item.warning}
                </motion.div>
              )}
            </div>
          </motion.div>
        ))}
      </div>

      {/* Extra Credits from Referrals - Permanent credits */}
      {stats.extraCreditsBalance > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="group relative overflow-hidden rounded-[2.5rem] border border-emerald-500/20 bg-gradient-to-br from-emerald-500/10 via-[var(--bg-card)] to-[var(--bg-base)] p-8 shadow-2xl"
        >
          <div className="absolute right-0 top-0 p-10 opacity-10 transition-transform duration-700 group-hover:scale-110">
            <Gift size={140} strokeWidth={1} />
          </div>

          <div className="relative z-10 flex flex-col gap-8 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-6">
              <div className="flex h-16 w-16 items-center justify-center rounded-[2rem] border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 shadow-inner">
                <Gift className="h-7 w-7" />
              </div>
              <div>
                <p className="mb-1 font-jakarta text-[9px] font-black uppercase tracking-[0.3em] text-emerald-400/70">
                  Creditos de referidos
                </p>
                <h4 className="text-3xl font-extrabold tracking-tighter text-emerald-400">
                  {stats.extraCreditsBalance}
                </h4>
                <p className="text-[10px] font-bold uppercase tracking-tight text-[var(--text-muted)]">
                  Creditos extras permanentes
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 rounded-2xl border border-emerald-500/20 bg-[var(--bg-card)] px-6 py-3 shadow-sm">
              <div className="h-2 w-2 animate-pulse rounded-full bg-emerald-400" />
              <span className="whitespace-nowrap text-[10px] font-black uppercase tracking-widest text-emerald-400">
                No se reinician nunca
              </span>
            </div>
          </div>
        </motion.div>
      )}

      {isTrial ? (
        <motion.div className="relative flex flex-col items-center justify-between gap-6 overflow-hidden rounded-[2.5rem] border border-[var(--border-color)] bg-gradient-to-br from-[var(--bg-card)] to-[var(--bg-base)] p-8 shadow-2xl sm:flex-row">
          <div className="absolute left-0 top-0 p-8 opacity-[0.03]">
            <Zap size={120} />
          </div>
          <div className="relative z-10 flex items-center gap-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-[#FF5C3A]/20 bg-[#FF5C3A]/10 text-[#FF5C3A]">
              <Zap className="h-6 w-6" />
            </div>
            <div>
              <p className="mb-1 font-jakarta text-[9px] font-black uppercase tracking-[0.3em] text-[var(--text-muted)]">
                Periodo trial activo
              </p>
              <h4 className="text-xl font-bold uppercase tracking-tight text-[var(--text-primary)]">
                Finaliza: {formatDate(trialEndsAt || stats.resetDate)}
              </h4>
            </div>
          </div>

          <div className="relative z-10 flex items-center gap-3 rounded-2xl border border-[var(--border-color)] bg-[var(--bg-card)] px-6 py-3 shadow-sm">
            <Zap className="h-4 w-4 text-[#FF5C3A]" />
            <span className="whitespace-nowrap text-[10px] font-black uppercase tracking-widest text-[var(--text-primary)]">
              Usas solo los creditos incluidos en tu prueba
            </span>
          </div>
        </motion.div>
      ) : (
        <motion.div className="relative flex flex-col items-center justify-between gap-6 overflow-hidden rounded-[2.5rem] border border-[var(--border-color)] bg-gradient-to-br from-[var(--bg-card)] to-[var(--bg-base)] p-8 shadow-2xl sm:flex-row">
          <div className="absolute left-0 top-0 p-8 opacity-[0.03]">
            <Calendar size={120} />
          </div>
          <div className="relative z-10 flex items-center gap-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-[var(--border-color)] bg-[var(--text-primary)]/5 text-[var(--text-primary)]/40">
              <Calendar className="h-6 w-6" />
            </div>
            <div>
              <p className="mb-1 font-jakarta text-[9px] font-black uppercase tracking-[0.3em] text-[var(--text-muted)]">
                Proximo ciclo de facturacion
              </p>
              <h4 className="text-xl font-bold uppercase tracking-tight text-[var(--text-primary)]">
                Reinicio: {formatDate(stats.resetDate)}
              </h4>
            </div>
          </div>

          <div className="relative z-10 flex items-center gap-3 rounded-2xl border border-[var(--border-color)] bg-[var(--bg-card)] px-6 py-3 shadow-sm">
            <Zap className="h-4 w-4 animate-bounce text-[#FF5C3A]" />
            <span className="whitespace-nowrap text-[10px] font-black uppercase tracking-widest text-[var(--text-primary)]">
              Tus creditos se restauraran al 100%
            </span>
          </div>
        </motion.div>
      )}

      {!isTrial && genPct >= 80 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="group relative overflow-hidden rounded-[3.5rem] border border-white/5 bg-zinc-900 p-12 shadow-2xl"
        >
          <div className="absolute right-0 top-0 rotate-12 p-12 opacity-[0.03] transition-transform duration-1000 group-hover:rotate-45">
            <TrendingUp size={280} strokeWidth={1} />
          </div>
          <div className="relative z-10 flex flex-col items-center justify-between gap-10 lg:flex-row">
            <div className="space-y-4 text-center lg:text-left">
              <div className="inline-flex items-center gap-2 rounded-full border border-[#FF5C3A]/30 bg-[#FF5C3A]/20 px-3 py-1">
                <Zap className="h-3 w-3 fill-[#FF5C3A] text-[#FF5C3A]" />
                <span className="text-[9px] font-black uppercase tracking-widest text-[#FF5C3A]">
                  Optimizacion de rendimiento
                </span>
              </div>
              <h3 className="font-jakarta text-4xl font-[950] uppercase italic leading-none tracking-tighter text-white md:text-5xl">
                Buscas <span className="text-[#FF5C3A]">maxima</span> potencia?
              </h3>
              <p className="max-w-xl text-sm font-medium uppercase tracking-tighter text-zinc-400">
                Has alcanzado el <span className="font-black text-white">{genPct.toFixed(0)}%</span> de tus creditos mensuales.
                <br className="hidden md:block" />
                El Plan PRO desbloquea <span className="font-black text-white">1,200 generaciones</span> y soporte prioritario VIP.
              </p>
            </div>
            <button
              onClick={() => { window.location.href = '/dashboard/subscription'; }}
              className="whitespace-nowrap rounded-2xl bg-white px-12 py-6 text-[11px] font-black uppercase tracking-[0.2em] text-black shadow-xl transition-all hover:scale-105 active:scale-95"
            >
              Mejorar mi plan
            </button>
          </div>
        </motion.div>
      )}
    </div>
  );
}
