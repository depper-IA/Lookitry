'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { UsageStats } from '@/components/dashboard/UsageStats';
import { Spinner } from '@/components/ui/Spinner';
import { usageService } from '@/services/usage.service';
import { brandsService } from '@/services/brands.service';
import { authService } from '@/services/auth.service';
import type { UsageStats as UsageStatsType } from '@/types';
import { Activity, AlertCircle, TrendingUp, Sparkles, ChevronRight, Zap, Target } from 'lucide-react';

const containerVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { 
      duration: 0.7,
      staggerChildren: 0.1
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 }
};

export default function UsagePage() {
  const [stats, setStats] = useState<UsageStatsType | null>(null);
  const [emailVerified, setEmailVerified] = useState<boolean | null>(null);
  const [brandEmail, setBrandEmail] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [resendSending, setResendSending] = useState(false);
  const [resendSent, setResendSent] = useState(false);

  useEffect(() => { loadStats(); }, []);

  const loadStats = async () => {
    try {
      setIsLoading(true);
      const [data, brand] = await Promise.all([
        usageService.getUsageStats(),
        brandsService.getCurrentBrand(),
      ]);
      setStats(data);
      setEmailVerified(brand.emailVerified ?? null);
      setBrandEmail(brand.email ?? '');
      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al cargar estadísticas');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendVerification = async () => {
    if (!brandEmail || resendSending) return;
    try {
      setResendSending(true);
      await authService.resendVerification(brandEmail);
      setResendSent(true);
    } catch (err: any) {
      setError(err?.message || 'No se pudo reenviar el correo de verificación');
    } finally {
      setResendSending(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6">
        <Spinner size="lg" />
        <p className="text-[10px] font-black uppercase tracking-[0.4em] text-[var(--text-muted)] animate-pulse">Sincronizando Cuotas...</p>
      </div>
    );
  }

  return (
    <motion.div 
      initial="hidden" animate="visible" variants={containerVariants}
      className="max-w-5xl mx-auto space-y-12 xl:space-y-16 pb-32 px-4 xl:px-0 relative"
    >
      {/* 🔮 ORBES DE FONDO 🔮 */}
      <div className="absolute top-0 -left-20 w-80 h-80 bg-[#FF5C3A]/5 blur-[120px] rounded-full -z-10" />
      <div className="absolute bottom-20 -right-20 w-[400px] h-[400px] bg-indigo-500/5 blur-[150px] rounded-full -z-10" />

      {/* ══ HEADER ORBITAL ══ */}
      <motion.header variants={itemVariants} className="flex flex-col lg:flex-row lg:items-end justify-between gap-8 border-b border-[var(--border-color)] pb-10 xl:pb-12">
        <div className="space-y-4">
          <div className="flex items-center gap-3 md:gap-4">
            <div className="w-12 h-12 rounded-2xl bg-[#FF5C3A]/10 flex items-center justify-center border border-[#FF5C3A]/10 shadow-inner">
              <Activity className="w-6 h-6 text-[#FF5C3A]" />
            </div>
            <h1 className="text-3xl md:text-4xl xl:text-5xl font-[950] tracking-tighter text-[var(--text-primary)] italic uppercase leading-none font-jakarta">Consumo Vital</h1>
          </div>
          <p className="text-[11px] font-black tracking-[0.3em] text-[var(--text-muted)] uppercase opacity-60 italic">Monitor de Energía y Límites de Red</p>
        </div>

        <div className="flex items-center gap-4 px-6 py-3 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl shadow-xl">
           <Target size={14} className="text-[#FF5C3A]" />
           <span className="text-[10px] font-black uppercase tracking-widest text-[var(--text-primary)]">Ciclo Actual de Facturación</span>
        </div>
      </motion.header>

      {emailVerified === false && (
        <motion.div variants={itemVariants} className="rounded-[2.5rem] border border-[#FF5C3A]/20 bg-[#FF5C3A]/6 p-6 md:p-8 shadow-xl shadow-[#FF5C3A]/5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="space-y-2">
              <p className="text-[10px] font-black uppercase tracking-[0.28em] text-[#FF5C3A]">Cuenta pendiente de verificación</p>
              <h3 className="text-2xl font-[950] tracking-tight text-[var(--text-primary)] font-jakarta">Tu consumo ya está visible, pero falta validar tu correo</h3>
              <p className="max-w-2xl text-[13px] font-bold leading-relaxed text-[var(--text-muted)]">
                Confirmar <span className="text-[var(--text-primary)]">{brandEmail}</span> deja tu acceso completamente validado y evita fricción en compras, recuperación y cambios posteriores.
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
        <motion.div variants={itemVariants} className="flex items-center gap-4 p-8 rounded-[3rem] border border-rose-500/20 bg-rose-500/5 text-rose-500 text-[10px] font-black uppercase tracking-widest shadow-2xl">
          <AlertCircle className="w-6 h-6 shrink-0" />
          {error}
        </motion.div>
      )}

      {stats && (
        <motion.div variants={itemVariants} className="space-y-12">
          {/* USAGE COMPONENT (Already highly stylized but can be improved in its own file if needed) */}
          <div className="bg-[var(--bg-card)] rounded-[2.5rem] xl:rounded-[4rem] border border-[var(--border-color)] p-6 md:p-8 xl:p-12 shadow-4xl relative overflow-hidden group">
             <div className="absolute top-0 right-0 p-12 opacity-5 translate-x-10 translate-y-[-10px] group-hover:scale-110 transition-transform duration-1000">
                <Target size={200} strokeWidth={1} />
             </div>
             <UsageStats stats={stats} />
          </div>
        </motion.div>
      )}

      {/* Sugerencia de Plan — VANGUARDISTA LOOK */}
      {stats && stats.currentMonth.generationsUsed >= stats.currentMonth.generationsLimit * 0.8 && (
        <motion.div 
          variants={itemVariants}
          className="bg-[var(--bg-card)] p-6 md:p-8 xl:p-12 rounded-[2.5rem] xl:rounded-[4rem] border border-[var(--border-color)] shadow-4xl relative overflow-hidden group"
        >
           {/* GLOWING ORBS */}
           <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-[#FF5C3A] blur-[100px] opacity-10 -translate-y-1/2 translate-x-1/4" />
           <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-indigo-500 blur-[80px] opacity-10 translate-y-1/2 -translate-x-1/4" />

           <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-10">
            <div className="space-y-4">
              <div className="w-fit px-4 py-1.5 bg-[#FF5C3A]/10 rounded-full border border-[#FF5C3A]/20 flex items-center gap-3">
                 <div className="w-2 h-2 rounded-full bg-[#FF5C3A] animate-pulse" />
                 <p className="text-[9px] font-black text-[#FF5C3A] uppercase tracking-[0.3em] italic">Prioridad Alta: Alerta de Límites</p>
              </div>
              <h3 className="text-4xl font-[950] italic uppercase tracking-tighter leading-none text-[var(--text-primary)]">¿Expandir tu Universo?</h3>
              <p className="text-[var(--text-muted)] text-xs font-bold max-w-md uppercase tracking-tight leading-relaxed">
                Estás al límite de tu capacidad operativa. Evoluciona a <span className="text-[var(--text-primary)]">Plan PRO</span> para obtener <span className="text-[#FF5C3A]">1,200 Generaciones</span> y <span className="text-[var(--text-primary)]">15 Productos</span>.
              </p>
            </div>
            <button 
              onClick={() => window.location.href='/dashboard/subscription'}
              className="px-10 py-5 bg-[#FF5C3A] text-white rounded-2xl font-[950] uppercase tracking-widest text-[10px] hover:scale-105 active:scale-95 transition-all shadow-4xl flex items-center gap-3"
            >
              Evolucionar ADN <ChevronRight size={14} />
            </button>
          </div>
        </motion.div>
      )}

      {/* INFO EXTRA */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-2 gap-8">
         <div className="p-10 rounded-[3rem] bg-[var(--bg-card)] border border-[var(--border-color)] flex gap-6 items-start shadow-xl">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center border border-emerald-500/10 shrink-0">
               <Zap className="w-6 h-6 text-emerald-500" />
            </div>
            <div className="space-y-2">
               <h4 className="text-sm font-[950] text-[var(--text-primary)] italic uppercase tracking-tight italic">Reset de Energía</h4>
               <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-tight opacity-60 leading-relaxed">Tus cuotas de generación se reinician automáticamente el primer día de cada mes.</p>
            </div>
         </div>
         <div className="p-10 rounded-[3rem] bg-[var(--bg-card)] border border-[var(--border-color)] flex gap-6 items-start shadow-xl">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 flex items-center justify-center border border-amber-500/10 shrink-0">
               <Sparkles className="w-6 h-6 text-amber-500" />
            </div>
            <div className="space-y-2">
               <h4 className="text-sm font-[950] text-[var(--text-primary)] italic uppercase tracking-tight italic">Optimización de ADN</h4>
               <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-tight opacity-60 leading-relaxed">Solo se descuentan las pruebas exitosas del sistema. Los errores no consumen tus créditos.</p>
            </div>
         </div>
      </motion.div>
    </motion.div>
  );
}
