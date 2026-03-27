'use client';

import React from 'react';
import { motion } from 'framer-motion';
import type { UsageStats as UsageStatsType } from '@/types';
import { Activity, Package, Calendar, AlertTriangle, TrendingUp, Zap } from 'lucide-react';

interface UsageStatsProps {
  stats: UsageStatsType;
}

function ProgressBar({ value, max }: { value: number; max: number }) {
  const pct = Math.min((value / max) * 100, 100);
  const color = pct >= 90 ? 'from-red-500 to-red-600' : pct >= 70 ? 'from-amber-400 to-amber-600' : 'from-[#FF5C3A] to-[#E84E2E]';
  
  return (
    <div className="h-4 bg-[var(--bg-input)] rounded-full border border-[var(--border-color)] p-1 overflow-hidden shadow-inner">
      <motion.div 
        initial={{ width: 0 }}
        animate={{ width: `${pct}%` }}
        transition={{ duration: 1, ease: "easeOut" }}
        className={`h-full rounded-full bg-gradient-to-r ${color} shadow-lg shadow-[#FF5C3A]/20`}
      />
    </div>
  );
}

export function UsageStats({ stats }: UsageStatsProps) {
  const { generationsUsed, generationsLimit, productsCount, productsLimit } = stats.currentMonth;
  const genPct = (generationsUsed / generationsLimit) * 100;
  const prodPct = (productsCount / productsLimit) * 100;

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' });

  const stats_items = [
    {
      id: 'generations',
      label: 'Créditos de Generación',
      used: generationsUsed,
      limit: generationsLimit,
      pct: genPct,
      icon: <Activity className="w-6 h-6" />,
      description: 'Pruebas virtuales mensuales.',
      warning: genPct >= 90 ? '¡Límite crítico! Estás a punto de agotar tus créditos.' : null
    },
    {
      id: 'products',
      label: 'Slots de Catálogo',
      used: productsCount,
      limit: productsLimit,
      pct: prodPct,
      icon: <Package className="w-6 h-6" />,
      description: 'Capacidad de prendas activas.',
      warning: prodPct >= 100 ? 'Inventario lleno. Libera slots para nuevos productos.' : null
    }
  ];

  return (
    <div className="space-y-8">
      {/* ── SUMMARY CARDS ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {stats_items.map((item) => (
          <motion.div 
            key={item.id}
            whileHover={{ y: -5 }}
            className="group p-8 rounded-[3rem] bg-[var(--bg-card)] border border-[var(--border-color)] shadow-xl hover:border-[#FF5C3A]/30 transition-all relative overflow-hidden"
          >
            <div className={`absolute top-0 right-0 p-8 opacity-5 group-hover:scale-110 transition-transform duration-700`}>
              {item.icon}
            </div>

            <div className="relative z-10 space-y-6">
              <div className="flex items-center gap-5">
                <div className="w-16 h-16 rounded-[2rem] bg-[#FF5C3A]/10 flex items-center justify-center text-[#FF5C3A] shadow-inner">
                  {item.icon}
                </div>
                <div>
                  <h4 className="text-base md:text-lg font-bold text-[var(--text-primary)] tracking-tight leading-tight max-w-[13rem] md:max-w-none">{item.label}</h4>
                  <p className="text-[10px] font-black uppercase text-[var(--text-muted)] tracking-[0.2em] leading-tight">{item.description}</p>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between items-end">
                   <div className="flex items-baseline gap-1.5">
                    <span className="text-4xl font-extrabold tracking-tighter text-[var(--text-primary)]">{item.used}</span>
                    <span className="text-lg font-bold text-[var(--text-muted)]">/ {item.limit}</span>
                  </div>
                  <span className={`text-xs font-black p-2 rounded-xl border ${item.pct >= 90 ? 'bg-red-500/10 border-red-500 text-red-500' : 'bg-[#FF5C3A]/10 border-[#FF5C3A]/20 text-[#FF5C3A]'}`}>
                    {item.pct.toFixed(0)}%
                  </span>
                </div>
                <ProgressBar value={item.used} max={item.limit} />
              </div>

              {item.warning && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-4 rounded-2xl bg-red-500/5 border border-red-500/20 text-red-500 text-[10px] font-black uppercase tracking-widest flex items-center gap-3 animate-pulse"
                >
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  {item.warning}
                </motion.div>
              )}
            </div>
          </motion.div>
        ))}
      </div>

      {/* ── TIMELINE RESET ── */}
      <motion.div 
        className="p-8 rounded-[2.5rem] bg-gradient-to-br from-[var(--bg-card)] to-[var(--bg-base)] border border-[var(--border-color)] flex flex-col sm:flex-row items-center justify-between gap-6 shadow-2xl relative overflow-hidden"
      >
         <div className="absolute top-0 left-0 p-8 opacity-[0.03]">
          <Calendar size={120} />
        </div>
        <div className="flex items-center gap-6 relative z-10">
          <div className="w-12 h-12 rounded-2xl bg-[var(--text-primary)]/5 flex items-center justify-center text-[var(--text-primary)]/40 border border-[var(--border-color)]">
            <Calendar className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[9px] font-black text-[var(--text-muted)] uppercase tracking-[0.3em] font-jakarta mb-1">Próximo Ciclo de Facturación</p>
            <h4 className="text-xl font-bold uppercase text-[var(--text-primary)] tracking-tight">
              Reinicio: {formatDate(stats.resetDate)}
            </h4>
          </div>
        </div>

        <div className="relative z-10 flex items-center gap-3 px-6 py-3 bg-[var(--bg-card)] rounded-2xl border border-[var(--border-color)] shadow-sm">
           <Zap className="w-4 h-4 text-[#FF5C3A] animate-bounce" />
           <span className="text-[10px] font-black uppercase text-[var(--text-primary)] tracking-widest whitespace-nowrap">Tus créditos se restaurarán al 100%</span>
        </div>
      </motion.div>

      {/* ── UPGRADE SUGGESTION ── */}
      {genPct >= 80 && (
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="p-12 rounded-[3.5rem] bg-zinc-900 border border-white/5 relative overflow-hidden shadow-2xl group"
        >
          <div className="absolute top-0 right-0 p-12 opacity-[0.03] rotate-12 transition-transform duration-1000 group-hover:rotate-45">
             <TrendingUp size={280} strokeWidth={1} />
          </div>
          <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-10">
            <div className="space-y-4 text-center lg:text-left">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FF5C3A]/20 border border-[#FF5C3A]/30">
                <Zap className="w-3 h-3 text-[#FF5C3A] fill-[#FF5C3A]" />
                <span className="text-[#FF5C3A] text-[9px] font-black uppercase tracking-widest">Optimización de Rendimiento</span>
              </div>
              <h3 className="text-4xl md:text-5xl font-jakarta font-[950] uppercase italic tracking-tighter leading-none text-white">
                ¿Buscas <span className="text-[#FF5C3A]">máxima</span> potencia?
              </h3>
              <p className="text-zinc-400 text-sm font-medium max-w-xl leading-relaxed uppercase tracking-tighter">
                Has alcanzado el <span className="text-white font-black">{genPct.toFixed(0)}%</span> de tus créditos mensuales. <br className="hidden md:block" />
                El Plan PRO desbloquea <span className="text-white font-black">1,200 generaciones</span> y soporte prioritario VIP.
              </p>
            </div>
            <button 
              onClick={() => window.location.href='/dashboard/subscription'}
              className="px-12 py-6 bg-white text-black rounded-2xl font-black uppercase tracking-[0.2em] text-[11px] hover:scale-105 active:scale-95 transition-all whitespace-nowrap shadow-xl"
            >
              Mejorar Mi Plan
            </button>
          </div>
        </motion.div>
      )}
    </div>
  );
}
