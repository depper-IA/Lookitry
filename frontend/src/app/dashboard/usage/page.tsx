'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Activity, AlertCircle, ChevronRight, Sparkles, Target, Zap } from 'lucide-react';
import { UsageStats } from '@/components/dashboard/UsageStats';
import { Spinner } from '@/components/ui/Spinner';
import { usageService } from '@/services/usage.service';
import { brandsService } from '@/services/brands.service';
import { authService } from '@/services/auth.service';
import type { Brand, UsageStats as UsageStatsType } from '@/types';
import { getSubscriptionDisplayState } from '@/lib/subscription-display';

const containerVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.7,
      staggerChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

export default function UsagePage() {
  const [stats, setStats] = useState<UsageStatsType | null>(null);
  const [brand, setBrand] = useState<Brand | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [resendSending, setResendSending] = useState(false);
  const [resendSent, setResendSent] = useState(false);

  useEffect(() => {
    void loadStats();
  }, []);

  const loadStats = async () => {
    try {
      setIsLoading(true);
      const [usageData, currentBrand] = await Promise.all([
        usageService.getUsageStats(),
        brandsService.getCurrentBrand(),
      ]);
      setStats(usageData);
      setBrand(currentBrand);
      setError(null);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Error al cargar las estadisticas de uso');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendVerification = async () => {
    if (!brand?.email || resendSending) return;
    try {
      setResendSending(true);
      await authService.resendVerification(brand.email);
      setResendSent(true);
    } catch (err: any) {
      setError(err?.message || 'No se pudo reenviar el correo de verificacion');
    } finally {
      setResendSending(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-6">
        <Spinner size="lg" />
        <p className="animate-pulse text-[10px] font-black uppercase tracking-[0.4em] text-[var(--text-muted)]">
          Sincronizando cuotas...
        </p>
      </div>
    );
  }

  const subscriptionState = getSubscriptionDisplayState(brand);
  const isTrialAccount = subscriptionState.isTrial || subscriptionState.displayPlan === 'TRIAL';
  const needsEmailVerification = brand?.emailVerified === false;

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className="relative mx-auto max-w-5xl space-y-12 px-4 pb-32 xl:space-y-16 xl:px-0"
    >
      <div className="absolute -left-20 top-0 -z-10 h-80 w-80 rounded-full bg-[#FF5C3A]/5 blur-[120px]" />
      <div className="absolute -right-20 bottom-20 -z-10 h-[400px] w-[400px] rounded-full bg-[#FF5C3A]/4 blur-[150px]" />

      <motion.header
        variants={itemVariants}
        className="flex flex-col justify-between gap-8 border-b border-[var(--border-color)] pb-10 lg:flex-row lg:items-end xl:pb-12"
      >
        <div className="space-y-4">
          <div className="flex items-center gap-3 md:gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-[#FF5C3A]/10 bg-[#FF5C3A]/10 shadow-inner">
              <Activity className="h-6 w-6 text-[#FF5C3A]" />
            </div>
            <h1 className="font-jakarta text-3xl font-[950] uppercase italic leading-none tracking-tighter text-[var(--text-primary)] md:text-4xl xl:text-5xl">
              Consumo vital
            </h1>
          </div>
          <p className="text-[11px] font-black uppercase tracking-[0.3em] text-[var(--text-muted)] opacity-60 italic">
            Monitor de capacidad y creditos
          </p>
        </div>

        <div className="flex items-center gap-4 rounded-2xl border border-[var(--border-color)] bg-[var(--bg-card)] px-6 py-3 shadow-xl">
          <Target size={14} className="text-[#FF5C3A]" />
          <span className="text-[10px] font-black uppercase tracking-widest text-[var(--text-primary)]">
            {isTrialAccount ? 'Estado del periodo trial' : 'Ciclo actual de facturacion'}
          </span>
        </div>
      </motion.header>

      {needsEmailVerification && (
        <motion.div
          variants={itemVariants}
          className="rounded-[2.5rem] border border-[#FF5C3A]/20 bg-[#FF5C3A]/6 p-6 shadow-xl shadow-[#FF5C3A]/5 md:p-8"
        >
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="space-y-2">
              <p className="text-[10px] font-black uppercase tracking-[0.28em] text-[#FF5C3A]">
                Verificacion pendiente
              </p>
              <h3 className="font-jakarta text-2xl font-[950] tracking-tight text-[var(--text-primary)]">
                Confirma tu correo para habilitar el uso de creditos y del widget
              </h3>
              <p className="max-w-2xl text-[13px] font-bold leading-relaxed text-[var(--text-muted)]">
                Mientras <span className="text-[var(--text-primary)]">{brand?.email}</span> siga sin confirmar, tu cuenta no puede consumir creditos ni permitir nuevas pruebas en el probador virtual.
              </p>
            </div>
            <button
              onClick={handleResendVerification}
              disabled={resendSending}
              className="inline-flex items-center justify-center rounded-2xl bg-[#FF5C3A] px-6 py-3 text-[11px] font-black uppercase tracking-[0.2em] text-white shadow-lg shadow-[#FF5C3A]/25 transition-all hover:brightness-110 disabled:opacity-60"
            >
              {resendSending ? 'Enviando...' : resendSent ? 'Correo reenviado' : 'Reenviar correo'}
            </button>
          </div>
        </motion.div>
      )}

      {error && (
        <motion.div
          variants={itemVariants}
          className="flex items-center gap-4 rounded-[3rem] border border-rose-500/20 bg-rose-500/5 p-8 text-[10px] font-black uppercase tracking-widest text-rose-500 shadow-2xl"
        >
          <AlertCircle className="h-6 w-6 shrink-0" />
          {error}
        </motion.div>
      )}

      {stats && (
        <motion.div variants={itemVariants} className="space-y-12">
          <div className="group relative overflow-hidden rounded-[2.5rem] border border-[var(--border-color)] bg-[var(--bg-card)] p-6 shadow-4xl xl:rounded-[4rem] xl:p-12">
            <div className="absolute right-0 top-0 translate-x-10 translate-y-[-10px] p-12 opacity-5 transition-transform duration-1000 group-hover:scale-110">
              <Target size={200} strokeWidth={1} />
            </div>
            <UsageStats
              stats={stats}
              isTrial={isTrialAccount}
              trialEndsAt={brand?.trialEndDate ?? null}
            />
          </div>
        </motion.div>
      )}

      {stats && !isTrialAccount && stats.currentMonth.generationsUsed >= stats.currentMonth.generationsLimit * 0.8 && (
        <motion.div
          variants={itemVariants}
          className="group relative overflow-hidden rounded-[2.5rem] border border-[var(--border-color)] bg-[var(--bg-card)] p-6 shadow-4xl xl:rounded-[4rem] xl:p-12"
        >
          <div className="absolute right-0 top-0 h-[400px] w-[400px] translate-x-1/4 -translate-y-1/2 bg-[#FF5C3A] opacity-10 blur-[100px]" />
          <div className="absolute bottom-0 left-0 h-[300px] w-[300px] -translate-x-1/4 translate-y-1/2 bg-[#FF5C3A] opacity-10 blur-[80px]" />

          <div className="relative z-10 flex flex-col justify-between gap-10 md:flex-row md:items-center">
            <div className="space-y-4">
              <div className="flex w-fit items-center gap-3 rounded-full border border-[#FF5C3A]/20 bg-[#FF5C3A]/10 px-4 py-1.5">
                <div className="h-2 w-2 animate-pulse rounded-full bg-[#FF5C3A]" />
                <p className="text-[9px] font-black uppercase tracking-[0.3em] italic text-[#FF5C3A]">
                  Prioridad alta: alerta de limites
                </p>
              </div>
              <h3 className="text-4xl font-[950] uppercase italic leading-none tracking-tighter text-[var(--text-primary)]">
                Expandir tu capacidad?
              </h3>
              <p className="max-w-md text-xs font-bold uppercase leading-relaxed tracking-tight text-[var(--text-muted)]">
                Estas al limite de tu capacidad operativa. Evoluciona a <span className="text-[var(--text-primary)]">Plan PRO</span> para obtener <span className="text-[#FF5C3A]">1,200 fotos</span> y <span className="text-[var(--text-primary)]">15 productos</span>.
              </p>
            </div>
            <button
              onClick={() => { window.location.href = '/dashboard/subscription'; }}
              className="flex items-center gap-3 rounded-2xl bg-[#FF5C3A] px-10 py-5 text-[10px] font-[950] uppercase tracking-widest text-white shadow-4xl transition-all hover:scale-105 active:scale-95"
            >
              Evolucionar plan <ChevronRight size={14} />
            </button>
          </div>
        </motion.div>
      )}

      <motion.div variants={itemVariants} className="grid grid-cols-1 gap-8 md:grid-cols-2">
        <div className="flex items-start gap-6 rounded-[3rem] border border-[var(--border-color)] bg-[var(--bg-card)] p-10 shadow-xl">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-emerald-500/10 bg-emerald-500/10">
            <Zap className="h-6 w-6 text-emerald-500" />
          </div>
          <div className="space-y-2">
            <h4 className="text-sm font-[950] uppercase tracking-tight text-[var(--text-primary)] italic">
              {isTrialAccount ? 'Estado del trial' : 'Reset de energia'}
            </h4>
            <p className="text-[10px] font-bold uppercase leading-relaxed tracking-tight text-[var(--text-muted)] opacity-60">
              {isTrialAccount
                ? 'Durante el trial usas un cupo fijo de prueba. Los ciclos mensuales aparecen cuando activas un plan pago.'
                : 'Tus cuotas de generacion se reinician automaticamente el primer dia de cada mes.'}
            </p>
          </div>
        </div>
        <div className="flex items-start gap-6 rounded-[3rem] border border-[var(--border-color)] bg-[var(--bg-card)] p-10 shadow-xl">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-amber-500/10 bg-amber-500/10">
            <Sparkles className="h-6 w-6 text-amber-500" />
          </div>
          <div className="space-y-2">
            <h4 className="text-sm font-[950] uppercase tracking-tight text-[var(--text-primary)] italic">
              Regla de consumo
            </h4>
            <p className="text-[10px] font-bold uppercase leading-relaxed tracking-tight text-[var(--text-muted)] opacity-60">
              Solo se descuentan las pruebas exitosas del sistema. Los errores no consumen tus creditos.
            </p>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
