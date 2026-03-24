'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '@/hooks/useAuth';
import { usageService } from '@/services/usage.service';
import { analyticsService } from '@/services/analytics.service';
import { UsageStats } from '@/components/dashboard/UsageStats';
import { Spinner } from '@/components/ui/Spinner';
import { 
  Sparkles, 
  ArrowRight, 
  Plus, 
  Settings, 
  Zap, 
  Activity,
  CheckCircle2,
  AlertCircle,
  Trophy,
  TrendingUp,
  Medal
} from 'lucide-react';
import type { UsageStats as UsageStatsType, BrandAnalytics, ProductUsageStats } from '@/types';
import Link from 'next/link';

export default function DashboardPage() {
  const { brand } = useAuth();
  const [usage, setUsage] = useState<UsageStatsType | null>(null);
  const [analytics, setAnalytics] = useState<BrandAnalytics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [usageData, analyticsData] = await Promise.all([
          usageService.getUsageStats(),
          analyticsService.getOverview()
        ]);
        setUsage(usageData);
        setAnalytics(analyticsData);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <Spinner size="lg" />
        <p className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-widest animate-pulse">
          Sincronizando Dashboard...
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-[1400px] mx-auto space-y-10 pb-20">
      {/* ── SECCIÓN DE BIENVENIDA ── */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col md:flex-row md:items-center justify-between gap-6"
      >
        <div>
          <h1 className="text-4xl font-[950] tracking-tighter text-[var(--text-primary)] italic uppercase leading-none font-jakarta mb-3">
            Bienvenido, <span className="text-[#FF5C3A]">{brand?.name}</span>
          </h1>
          <p className="text-sm font-bold text-[var(--text-muted)] uppercase tracking-widest flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-emerald-400" />
            Probador virtual activo y optimizado para hoy
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link 
            href="/dashboard/products" 
            className="flex items-center gap-2 px-6 py-3 bg-[#FF5C3A] text-white rounded-2xl font-black uppercase tracking-widest text-[11px] shadow-lg shadow-[#FF5C3A]/20 hover:scale-[1.02] transition-all"
          >
            <Plus size={16} /> Añadir Producto
          </Link>
          <Link 
            href="/dashboard/settings" 
            className="flex items-center gap-2 px-6 py-3 bg-[var(--bg-card)] text-[var(--text-primary)] border border-[var(--border-color)] rounded-2xl font-black uppercase tracking-widest text-[11px] hover:bg-white/5 transition-all"
          >
            <Settings size={16} /> Configurar Widget
          </Link>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* ── COLUMNA PRINCIPAL (STÁTICAS DE USO) ── */}
        <div className="lg:col-span-2 space-y-8">
          <section>
             <div className="flex items-center justify-between mb-6 px-4">
                <h2 className="text-xs font-black uppercase text-[var(--text-muted)] tracking-[0.3em]">Consumo del Mes</h2>
                <Link href="/dashboard/usage" className="text-[10px] font-black uppercase text-[#FF5C3A] hover:underline tracking-widest">
                  Ver Detalles <ArrowRight size={10} className="inline ml-1" />
                </Link>
             </div>
             {usage && <UsageStats stats={usage} />}
          </section>

          {/* TARJETAS DE ANALYTICS RÁPIDAS */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
             <div className="p-8 rounded-[2.5rem] bg-[var(--bg-card)] border border-[var(--border-color)] shadow-xl relative overflow-hidden group hover:border-[#FF5C3A]/30 transition-all">
                <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:scale-110 transition-transform duration-700 pointer-events-none">
                  <Activity size={100} />
                </div>
                <p className="text-[10px] font-black uppercase text-[var(--text-muted)] tracking-widest mb-2">Tasa de Éxito</p>
                <div className="flex items-end gap-3 mb-4">
                  <span className="text-4xl font-[950] italic tracking-tighter text-[var(--text-primary)] leading-none">
                    {analytics?.successRate ? Math.round(analytics.successRate) : 0}%
                  </span>
                  <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 mb-1">
                    <CheckCircle2 size={12} />
                    <span className="text-[10px] font-bold">Óptimo</span>
                  </div>
                </div>
                <div className="h-1.5 w-full bg-[var(--bg-input)] rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${analytics?.successRate || 0}%` }}
                    className="h-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.3)]"
                  />
                </div>
                <p className="mt-4 text-[11px] text-[var(--text-muted)] font-medium leading-relaxed">
                  Tu probador está funcionando perfectamente. Las marcas exitosas mantienen una tasa superior al 85%.
                </p>
             </div>

             <div className="p-8 rounded-[2.5rem] bg-[var(--bg-card)] border border-[var(--border-color)] shadow-xl relative overflow-hidden group hover:border-[#FF5C3A]/30 transition-all">
                <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:scale-110 transition-transform duration-700 pointer-events-none">
                  <Zap size={100} />
                </div>
                <p className="text-[10px] font-black uppercase text-[var(--text-muted)] tracking-widest mb-2">Pruebas Totales</p>
                <div className="flex items-end gap-3 mb-4">
                  <span className="text-4xl font-[950] italic tracking-tighter text-[var(--text-primary)] leading-none">
                    {analytics?.totalGenerations || 0}
                  </span>
                  <span className="text-[11px] font-bold text-[var(--text-muted)] mb-1 uppercase tracking-tighter">Históricas</span>
                </div>
                <div className="flex items-center gap-2 text-emerald-500">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-[10px] font-black uppercase tracking-widest">IA Procesando ahora</span>
                </div>
                <p className="mt-6 text-[11px] text-[var(--text-muted)] font-medium leading-relaxed">
                  Cada generación es una interacción directa de un cliente con tu marca. ¡Sigue así!
                </p>
             </div>
          </div>

          {/* ── SECCIÓN TOP 3 PRODUCTOS ── */}
          <section className="mt-12">
             <div className="flex items-center justify-between mb-8 px-4">
                <div className="flex items-center gap-3">
                   <div className="w-8 h-8 rounded-xl bg-[#FF5C3A]/10 flex items-center justify-center">
                      <Trophy className="w-4 h-4 text-[#FF5C3A]" />
                   </div>
                   <h2 className="text-xs font-[950] uppercase text-[var(--text-primary)] tracking-[0.3em] italic">Top #3 del Probador</h2>
                </div>
                <Link href="/dashboard/analytics" className="text-[10px] font-black uppercase text-[#FF5C3A] hover:underline tracking-widest">
                  Ver Todo <ArrowRight size={10} className="inline ml-1" />
                </Link>
             </div>

             {!analytics?.mostUsedProducts || analytics.mostUsedProducts.length === 0 ? (
                /* ESTADO VACÍO PARA NUEVOS CLIENTES */
                <div className="p-10 rounded-[2.5rem] bg-[var(--bg-card)] border border-[var(--border-color)] border-dashed flex flex-col items-center text-center gap-4">
                   <div className="w-16 h-16 rounded-3xl bg-[var(--bg-input)] border border-[var(--border-color)] flex items-center justify-center text-[var(--text-muted)]">
                      <TrendingUp size={32} />
                   </div>
                   <div>
                      <h3 className="text-sm font-black text-[var(--text-primary)] uppercase tracking-tighter italic mb-2">¡Tu probador está listo para brillar!</h3>
                      <p className="text-[11px] text-[var(--text-muted)] font-medium max-w-[300px] leading-relaxed mx-auto">
                         Aún no hay datos de interacción. Una vez tus clientes empiecen a probarse prendas, aquí verás cuáles son sus favoritas para impulsar tus ventas.
                      </p>
                   </div>
                </div>
             ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                   {analytics.mostUsedProducts.slice(0, 3).map((item: ProductUsageStats, index: number) => (
                      <div 
                        key={item.productId}
                        className={`group p-6 rounded-[2.5rem] bg-[var(--bg-card)] border border-[var(--border-color)] relative overflow-hidden transition-all hover:scale-[1.02] ${index === 0 ? 'ring-2 ring-[#FF5C3A]/20 md:col-span-1 shadow-2xl shadow-[#FF5C3A]/5' : ''}`}
                      >
                         <div className="flex flex-col gap-5">
                            <div className="relative w-full aspect-square rounded-2xl overflow-hidden bg-[var(--bg-input)]">
                               <img 
                                 src={item.productImageUrl} 
                                 alt={item.productName}
                                 className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                               />
                               {index === 0 && (
                                  <div className="absolute top-2 left-2 px-3 py-1 bg-[#FF5C3A] rounded-full flex items-center gap-1 shadow-lg z-20">
                                     <Sparkles size={10} className="text-white fill-white" />
                                     <span className="text-[9px] font-black text-white uppercase tracking-tighter">Viral</span>
                                  </div>
                               )}
                            </div>
                            
                            <div>
                               <h4 className="text-[12px] font-black text-[var(--text-primary)] uppercase tracking-tighter truncate mb-1">
                                  {item.productName}
                               </h4>
                               <div className="flex items-center gap-2 mb-3">
                                  <Medal size={12} className={index === 0 ? 'text-[#FF5C3A]' : 'text-[var(--text-muted)]'} />
                                  <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest">
                                     {item.successfulGenerations} Pruebas
                                  </span>
                               </div>
                               
                               <div className="h-1.5 w-full bg-[var(--bg-input)] rounded-full overflow-hidden">
                                  <motion.div 
                                    initial={{ width: 0 }}
                                    animate={{ width: `${(item.successfulGenerations / (analytics.totalGenerations || 1)) * 100}%` }}
                                    className="h-full bg-[#FF5C3A]"
                                  />
                               </div>
                            </div>
                         </div>
                         
                         {/* Badge de Posición - ABOVE image (ordered later in DOM) */}
                         <div className={`absolute top-4 right-4 w-8 h-8 rounded-xl flex items-center justify-center font-black italic text-xs shadow-lg z-20 ${
                            index === 0 ? 'bg-[#FF5C3A] text-white' : 
                            index === 1 ? 'bg-slate-400 text-white' : 
                            'bg-[#A16207] text-white'
                         }`}>
                            #{index + 1}
                         </div>

                         {index === 0 && (
                            <div className="mt-4 p-3 rounded-xl bg-[#FF5C3A]/5 border border-[#FF5C3A]/10">
                               <p className="text-[9px] font-bold text-[#FF5C3A] leading-tight italic">
                                  🔥 Este producto está captando la mayor atención. ¡Es ideal para una campaña de marketing!
                               </p>
                            </div>
                         )}
                      </div>
                   ))}
                </div>
             )}
          </section>
        </div>

        {/* ── COLUMNA LATERAL (ACCESOS Y ESTADO) ── */}
        <div className="space-y-8">
           {/* ESTADO DEL WIDGET */}
           <div className="p-8 rounded-[3rem] bg-gradient-to-br from-[var(--bg-card)] to-[var(--bg-base)] border border-[var(--border-color)] shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none">
                 <Settings size={120} />
              </div>
              <h3 className="text-sm font-black text-[var(--text-primary)] uppercase tracking-[0.2em] italic mb-6">Estado del Sistema</h3>
              
              <div className="space-y-6">
                 <div className="flex items-center justify-between p-4 rounded-2xl bg-emerald-500/5 border border-emerald-500/10">
                    <div className="flex items-center gap-3">
                       <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse-dot" />
                       <span className="text-[11px] font-black text-[var(--text-primary)] uppercase tracking-tighter">Probador Online</span>
                    </div>
                    <Link href={`/marca/${brand?.slug}`} target="_blank" className="text-[10px] font-black text-[#FF5C3A] uppercase hover:underline">Ver Demo</Link>
                 </div>

                 <div className="p-5 rounded-2xl bg-[var(--bg-input)] border border-[var(--border-color)] space-y-3">
                    <div className="flex items-center gap-2 text-[11px] font-bold text-[var(--text-primary)]">
                       <Activity size={14} className="text-[#FF5C3A]" />
                       <span>Límites de Plan {brand?.plan}</span>
                    </div>
                    <div className="flex justify-between text-[10px] text-[var(--text-muted)] font-black uppercase tracking-widest">
                       <span>Productos</span>
                       <span>{(usage?.currentMonth?.productsCount || 0)} / {brand?.plan === 'PRO' ? 15 : 5}</span>
                    </div>
                 </div>

                 <Link 
                  href="/dashboard/integrations" 
                  className="w-full flex items-center justify-center gap-2 p-4 rounded-2xl bg-[#FF5C3A] text-white font-black uppercase tracking-[0.2em] text-[10px] hover:scale-105 transition-all shadow-xl shadow-[#FF5C3A]/20"
                 >
                   Instalar en mi Tienda <ArrowRight size={14} />
                 </Link>
              </div>
           </div>

           {/* NOTIFICACIÓN RÁPIDA / CONSEJO */}
           <div className="p-8 rounded-[3rem] bg-[#FF5C3A]/5 border border-[#FF5C3A]/20 shadow-xl relative overflow-hidden group">
              <div className="absolute -top-4 -right-4 text-[#FF5C3A]/10 group-hover:rotate-12 transition-transform duration-700 pointer-events-none">
                 <Zap size={100} strokeWidth={2.5} />
              </div>
              <div className="flex items-start gap-4 relative z-10">
                 <div className="w-10 h-10 rounded-2xl bg-[#FF5C3A] flex items-center justify-center shrink-0 shadow-lg">
                    <AlertCircle size={20} className="text-white" />
                 </div>
                 <div>
                    <h4 className="text-sm font-black text-[var(--text-primary)] uppercase tracking-tighter italic mb-1">Optimización IA</h4>
                    <p className="text-[11px] text-[var(--text-muted)] font-bold leading-relaxed">
                       Sube fotos de tus prendas con fondo blanco para mejorar la precisión del probador en un 30%.
                    </p>
                 </div>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
}
