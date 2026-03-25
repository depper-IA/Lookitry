'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Spinner } from '@/components/ui/Spinner';
import { analyticsService, type BrandAnalytics } from '@/services/analytics.service';
import { 
  BarChart3, 
  Zap, 
  CheckCircle2, 
  XCircle, 
  TrendingUp, 
  Calendar,
  Package,
  ArrowRight,
  Sparkles,
  Search
} from 'lucide-react';

// ── Animaciones ──────────────────────────────────────────────────────────────
const containerVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { staggerChildren: 0.1 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 }
};

export default function AnalyticsPage() {
  const [analytics, setAnalytics] = useState<BrandAnalytics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    try {
      setIsLoading(true);
      const data = await analyticsService.getOverview();
      setAnalytics(data);
      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al sincronizar analíticas');
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-CO', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatMonthYear = (monthString: string) => {
    const [year, month] = monthString.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1);
    return date.toLocaleDateString('es-CO', {
      year: 'numeric',
      month: 'short',
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4">
        <Spinner size="lg" />
        <p className="text-[10px] font-black uppercase tracking-[0.4em] text-[var(--text-muted)] animate-pulse">Analizando Datos de Red...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-[1400px] mx-auto p-10">
        <div className="p-8 bg-rose-500/5 border border-rose-500/20 rounded-[3rem] text-rose-500 text-[11px] font-black uppercase tracking-widest flex items-center justify-between shadow-2xl">
          <div className="flex items-center gap-4">
            <XCircle size={22} />
            {error}
          </div>
          <button onClick={loadAnalytics} className="px-6 py-2 bg-rose-500 text-white rounded-xl hover:scale-105 transition-all">Reintentar</button>
        </div>
      </div>
    );
  }

  if (!analytics) return null;

  const maxGenerations = Math.max(...analytics.generationsByMonth.map(m => m.count), 1);

  return (
    <motion.div 
      variants={containerVariants} initial="hidden" animate="visible"
      className="max-w-[1400px] mx-auto space-y-12 pb-32"
    >
      {/* 🔮 ELEMENTOS DECORATIVOS 🔮 */}
      <div className="absolute top-0 -right-20 w-[400px] h-[400px] bg-indigo-500/5 blur-[150px] rounded-full -z-10" />

      {/* ══ HEADER ══ */}
      <motion.header variants={itemVariants} className="flex flex-col md:flex-row md:items-end justify-between gap-8 border-b border-[var(--border-color)] pb-10">
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-[2rem] bg-[#FF5C3A]/10 flex items-center justify-center border border-[#FF5C3A]/10 shadow-inner">
              <BarChart3 className="w-7 h-7 text-[#FF5C3A]" />
            </div>
            <h1 className="text-5xl font-[950] tracking-tighter text-[var(--text-primary)] uppercase leading-none font-jakarta">Analíticas</h1>
          </div>
          <p className="text-[11px] font-black tracking-[0.3em] text-[var(--text-muted)] uppercase opacity-60">Rendimiento en tiempo real de tu probador virtual</p>
        </div>
        
        <div className="flex items-center gap-3 p-4 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)] shadow-sm">
           <Calendar className="w-4 h-4 text-[#FF5C3A]" />
           <span className="text-[10px] font-black uppercase text-[var(--text-primary)] tracking-widest">Periodo: Últimos 12 meses</span>
        </div>
      </motion.header>

      {/* ══ KPI GRID ══ */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'Generaciones', value: analytics.totalGenerations, sub: 'Pruebas totales', icon: Zap, color: 'text-indigo-400', bg: 'bg-indigo-400/10' },
          { label: 'Exitosas', value: analytics.successfulGenerations, sub: 'Renderizado OK', icon: CheckCircle2, color: 'text-emerald-400', bg: 'bg-emerald-400/10' },
          { label: 'Fallidas', value: analytics.failedGenerations, sub: 'Revisión técnica', icon: XCircle, color: 'text-rose-400', bg: 'bg-rose-400/10' },
          { label: 'Éxito IA', value: `${analytics.successRate.toFixed(1)}%`, sub: 'Precisión media', icon: Sparkles, color: 'text-[#FF5C3A]', bg: 'bg-[#FF5C3A]/10' },
        ].map((kpi) => (
          <div key={kpi.label} className="p-8 rounded-[2.5rem] bg-[var(--bg-card)] border border-[var(--border-color)] shadow-xl relative overflow-hidden group hover:border-[#FF5C3A]/30 transition-all">
            <div className="absolute top-0 right-0 p-6 opacity-[0.03] group-hover:scale-110 transition-transform duration-700">
              <kpi.icon size={100} />
            </div>
            <div className="relative z-10 space-y-4">
              <div className={`w-12 h-12 rounded-2xl ${kpi.bg} flex items-center justify-center ${kpi.color}`}>
                <kpi.icon size={24} />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase text-[var(--text-muted)] tracking-widest mb-1">{kpi.label}</p>
                <h3 className="text-3xl font-[950] tracking-tighter text-[var(--text-primary)] tabular-nums">{kpi.value}</h3>
                <p className="text-[9px] font-bold text-gray-500 uppercase tracking-tighter mt-1">{kpi.sub}</p>
              </div>
            </div>
          </div>
        ))}
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        {/* ══ GRÁFICO MENSUAL ══ */}
        <motion.section variants={itemVariants} className="p-10 rounded-[3.5rem] bg-[var(--bg-card)] border border-[var(--border-color)] shadow-2xl relative overflow-hidden group">
           <div className="absolute top-0 right-0 p-10 opacity-[0.02] group-hover:rotate-6 transition-transform duration-1000">
              <TrendingUp size={200} />
           </div>
           
           <header className="flex items-center justify-between mb-12">
              <div className="flex items-center gap-4">
                 <div className="w-10 h-10 rounded-2xl bg-[#FF5C3A]/10 flex items-center justify-center text-[#FF5C3A]">
                    <TrendingUp size={20} />
                 </div>
                 <h2 className="text-xl font-[950] uppercase tracking-tighter text-[var(--text-primary)]">Tracción Mensual</h2>
              </div>
           </header>

           {analytics.generationsByMonth.length === 0 ? (
             <div className="py-20 text-center text-[var(--text-muted)] uppercase text-[10px] font-black tracking-[0.3em] opacity-30">Sin historial de red</div>
           ) : (
             <div className="space-y-8">
               {analytics.generationsByMonth.map((monthData) => (
                 <div key={monthData.month} className="space-y-3 group/bar">
                   <div className="flex items-center justify-between">
                     <span className="text-[11px] font-black uppercase text-[var(--text-secondary)] tracking-widest group-hover/bar:text-[#FF5C3A] transition-colors">
                       {formatMonthYear(monthData.month)}
                     </span>
                     <span className="text-[13px] font-[950] text-[var(--text-primary)] tabular-nums">
                       {monthData.count} <span className="text-[9px] text-[var(--text-muted)] font-bold">GEN</span>
                     </span>
                   </div>
                   <div className="h-2 w-full bg-[var(--text-primary)]/5 rounded-full overflow-hidden shadow-inner p-[1px] border border-[var(--border-color)]">
                     <motion.div
                       initial={{ width: 0 }}
                       animate={{ width: `${(monthData.count / maxGenerations) * 100}%` }}
                       transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1], delay: 0.1 }}
                       className="h-full bg-[#FF5C3A] rounded-full shadow-[0_0_12px_rgba(255,92,58,0.25)]"
                     />
                   </div>
                 </div>
               ))}
             </div>
           )}
        </motion.section>

        {/* ══ PRODUCTOS TOP ══ */}
        <motion.section variants={itemVariants} className="p-10 rounded-[3.5rem] bg-[var(--bg-card)] border border-[var(--border-color)] shadow-2xl relative overflow-hidden">
           <header className="flex items-center justify-between mb-12">
              <div className="flex items-center gap-4">
                 <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-indigo-400">
                    <Package size={20} />
                 </div>
                 <h2 className="text-xl font-[950] uppercase tracking-tighter text-[var(--text-primary)]">Prendas Más Probadas</h2>
              </div>
           </header>

           {analytics.mostUsedProducts.length === 0 ? (
             <div className="py-20 text-center text-[var(--text-muted)] uppercase text-[10px] font-black tracking-[0.3em] opacity-30">Catálogo sin interacciones</div>
           ) : (
             <div className="space-y-6">
               {analytics.mostUsedProducts.map((product, idx) => (
                 <div 
                  key={product.productId} 
                  className="flex items-center gap-5 p-4 rounded-3xl bg-white/5 border border-white/5 hover:bg-[#FF5C3A]/5 hover:border-[#FF5C3A]/20 transition-all group/item"
                 >
                    <div className="relative shrink-0">
                       <img className="h-16 w-16 rounded-2xl object-cover shadow-2xl group-hover/item:scale-105 transition-transform" src={product.productImageUrl} alt={product.productName} />
                       <div className="absolute -top-2 -left-2 w-6 h-6 rounded-lg bg-black border border-white/10 flex items-center justify-center text-[10px] font-black text-white shadow-xl">
                          {idx + 1}
                       </div>
                    </div>
                    <div className="flex-1 min-w-0">
                       <h4 className="text-sm font-black text-[var(--text-primary)] uppercase tracking-tighter truncate leading-none mb-1.5">{product.productName}</h4>
                       <div className="flex items-center gap-3">
                          <span className="text-[9px] font-black px-2 py-0.5 rounded-md bg-white/5 text-gray-400 uppercase tracking-widest">{product.category}</span>
                          <span className="text-[9px] font-black text-[#FF5C3A] uppercase tracking-widest">Último: {formatDate(product.lastUsed)}</span>
                       </div>
                    </div>
                    <div className="text-right">
                       <div className="text-lg font-[950] text-[var(--text-primary)] tabular-nums leading-none">{product.totalGenerations}</div>
                       <p className="text-[8px] font-black text-[var(--text-muted)] uppercase tracking-widest">Impactos</p>
                    </div>
                 </div>
               ))}
             </div>
           )}
        </motion.section>
      </div>
    </motion.div>
  );
}
