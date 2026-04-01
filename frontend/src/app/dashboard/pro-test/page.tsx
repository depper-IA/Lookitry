'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  Activity,
  ArrowRight,
  CheckCircle2,
  CircleDashed,
  ExternalLink,
  Gauge,
  LayoutTemplate,
  Package,
  PlugZap,
  Sparkles,
  TrendingUp,
  Zap,
  CreditCard,
  Target,
  BarChart3,
  ShieldCheck
} from 'lucide-react';
import { Spinner } from '@/components/ui/Spinner';
import { api } from '@/services/api';
import { usageService } from '@/services/usage.service';
import { analyticsService, type BrandAnalytics } from '@/services/analytics.service';
import { subscriptionService, type SubscriptionInfo } from '@/services/subscription.service';
import { brandsService } from '@/services/brands.service';
import type { Brand, UsageStats as UsageStatsType } from '@/types';
import { deriveDashboardAccountState, type WooMetricsSummary } from '@/lib/dashboardAccountState';
import { getSubscriptionDisplayState } from '@/lib/subscription-display';

// ——————————————————————————————————————————————————————————————————————————————————————
// PREMIUM UI COMPONENTS
// ——————————————————————————————————————————————————————————————————————————————————————

const StatCard = ({ title, value, unit, icon: Icon, color = '#FF5C3A' }: any) => (
  <div className="p-8 rounded-[2.5rem] bg-[#141414] border border-white/5 relative overflow-hidden group hover:border-white/10 transition-all">
    <div className="absolute top-0 right-0 w-32 h-32 blur-[80px] opacity-10 group-hover:opacity-20 transition-opacity" style={{ backgroundColor: color }} />
    <div className="flex justify-between items-start mb-6">
       <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center text-white/40 group-hover:text-white transition-colors">
         <Icon size={24} />
       </div>
       <div className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-500 text-[10px] font-black uppercase tracking-widest">+12%</div>
    </div>
    <p className="text-[10px] font-bold text-[#999] uppercase tracking-widest mb-1 font-jakarta">{title}</p>
    <div className="flex items-baseline gap-2">
      <h3 className="text-4xl font-black text-white tracking-tighter font-jakarta">{value}</h3>
      <span className="text-[10px] font-black text-[#555] uppercase tracking-widest">{unit}</span>
    </div>
  </div>
);

// ——————————————————————————————————————————————————————————————————————————————————————
// DASHBOARD PRO-TEST COMPONENT
// ——————————————————————————————————————————————————————————————————————————————————————

export default function DashboardProTest() {
  const [brand, setBrand] = useState<Brand | null>(null);
  const [usage, setUsage] = useState<UsageStatsType | null>(null);
  const [analytics, setAnalytics] = useState<BrandAnalytics | null>(null);
  const [subscriptionInfo, setSubscriptionInfo] = useState<SubscriptionInfo | null>(null);
  const [wooMetrics, setWooMetrics] = useState<WooMetricsSummary>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    const loadDashboard = async () => {
      try {
        const [brandResult, usageResult, analyticsResult, subscriptionResult, wooMetricsResult] = await Promise.allSettled([
          brandsService.getCurrentBrand(),
          usageService.getUsageStats(),
          analyticsService.getOverview(),
          subscriptionService.getSubscriptionInfo(),
          api.get('/brands/me/woocommerce-metrics'),
        ]);

        if (!mounted) return;

        if (brandResult.status === 'fulfilled') setBrand(brandResult.value);
        if (usageResult.status === 'fulfilled') setUsage(usageResult.value);
        if (analyticsResult.status === 'fulfilled') setAnalytics(analyticsResult.value);
        if (subscriptionResult.status === 'fulfilled') setSubscriptionInfo(subscriptionResult.value);
        if (wooMetricsResult.status === 'fulfilled') setWooMetrics((wooMetricsResult.value?.data as WooMetricsSummary) ?? null);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        if (mounted) setLoading(false);
      }
    };
    loadDashboard();
    return () => { mounted = false; };
  }, []);

  const accountState = useMemo(() => deriveDashboardAccountState({ brand, usage, analytics, subscriptionInfo, wooMetrics }), [brand, usage, analytics, subscriptionInfo, wooMetrics]);

  if (loading) {
    return (
      <div className="flex min-h-[80vh] flex-col items-center justify-center gap-6">
        <Spinner size="lg" className="border-[#FF5C3A]" />
        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-[#999] animate-pulse font-jakarta">Estructurando tu panel...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-10 pb-20 px-8">
      
      {/* ———— WELCOME HEADER ———— */}
      <div className="flex flex-col md:flex-row justify-between items-end gap-10 mb-16 px-4">
        <div>
           <span className="px-3 py-1 rounded-full bg-[#FF5C3A]/10 text-[#FF5C3A] text-[9px] font-black uppercase tracking-widest mb-4 inline-block font-jakarta">Dashboard Activo</span>
           <h1 className="text-4xl md:text-5xl font-black text-white tracking-tighter font-jakarta">
             Hola, <span className="text-[#FF5C3A]">{brand?.name || 'Marca'}</span>.
           </h1>
           <p className="text-[#999] font-bold uppercase tracking-widest text-[10px] mt-2">Bienvenido a la gestión premium de Lookitry.</p>
        </div>
        <div className="flex gap-4">
           <button className="px-8 py-4 bg-white/5 border border-white/10 text-white font-black uppercase text-[10px] tracking-widest rounded-full hover:bg-white/10 transition-all font-jakarta">Configurar Widget</button>
           <button className="px-8 py-4 bg-[#FF5C3A] text-white font-black uppercase text-[10px] tracking-widest rounded-full shadow-2xl hover:scale-105 transition-all font-jakarta">Nueva Prueba IA</button>
        </div>
      </div>

      {/* ———— BUSINESS STATS ———— */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
         <StatCard title="Total Generaciones" value={analytics?.totalGenerations || 0} unit="Pruebas" icon={Zap} />
         <StatCard title="Tasa Conversión" value="2.4" unit="%" icon={TrendingUp} color="#10b981" />
         <StatCard title="Créditos Extra" value={subscriptionInfo?.brand?.extraCreditsBalance || 0} unit="Disponibles" icon={CreditCard} color="#3b82f6" />
         <StatCard title="Productos Activos" value={brand?.plan === 'PRO' ? '15' : '5'} unit="Max" icon={Package} color="#f59e0b" />
      </div>

      {/* ———— MAIN CONTENT GRID ———— */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 px-4">
        
        {/* ACCOUNT STATUS (PREMIUM LOOK) */}
        <div className="lg:col-span-2">
           <div className="p-12 rounded-[3.5rem] bg-[#141414] border border-white/5 relative overflow-hidden mb-8">
              <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-[#FF5C3A]/5 blur-[120px] rounded-full pointer-events-none" />
              
              <div className="flex items-center gap-4 mb-10">
                 <div className="w-10 h-10 rounded-full bg-[#FF5C3A]/10 flex items-center justify-center text-[#FF5C3A]">
                    <Target size={20} />
                 </div>
                 <h2 className="text-2xl font-black text-white tracking-tighter uppercase font-jakarta">Estado de Activación</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                  {accountState.checklist.map((step: any, i: number) => (
                     <div key={i} className={`p-8 rounded-3xl border transition-all ${step.done ? 'bg-emerald-500/5 border-emerald-500/10 opacity-70' : 'bg-white/5 border-white/10 ring-1 ring-[#FF5C3A]/20'}`}>
                       <div className="flex justify-between items-start mb-6">
                           <div className={`p-3 rounded-2xl ${step.done ? 'bg-emerald-500/20 text-emerald-500' : 'bg-[#FF5C3A]/10 text-[#FF5C3A]'}`}>
                             {step.done ? <CheckCircle2 size={18}/> : React.createElement(Package, { size: 18 })}
                          </div>
                           <p className={`text-[9px] font-black uppercase tracking-widest ${step.done ? 'text-emerald-500' : 'text-[#FF5C3A]'}`}>
                              {step.done ? 'Completado' : 'Pendiente'}
                          </p>
                       </div>
                        <h4 className="text-white font-black tracking-tight text-lg mb-2 font-jakarta">{step.title}</h4>
                       <p className="text-[11px] text-[#999] font-bold uppercase tracking-tight mb-6">{step.description}</p>
                       
                       {!step.done && (
                           <Link href={step.href || '#'} className="flex items-center justify-between w-full p-4 bg-white/5 rounded-xl text-[10px] font-black uppercase tracking-widest text-white hover:bg-white/10 transition-all font-jakarta">
                             Ir a Configurar <ArrowRight size={14} className="text-[#FF5C3A]" />
                           </Link>
                       )}
                    </div>
                 ))}
              </div>
           </div>
        </div>

        {/* SUBSCRIPTION & HIGHLIGHTS */}
        <div className="flex flex-col gap-6">
           <div className="p-10 rounded-[3rem] bg-[#FF5C3A] text-white shadow-2xl relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-black/20 blur-3xl opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="flex items-center gap-3 mb-8">
                 <ShieldCheck size={24} />
                 <span className="text-[10px] font-black uppercase tracking-widest">Plan Vigente</span>
              </div>
              <h3 className="text-4xl font-black tracking-tighter mb-2 uppercase font-jakarta">{brand?.plan || 'Básico'}</h3>
              <p className="text-[10px] font-bold uppercase tracking-widest text-white/70 mb-10">Suscripción Activa</p>
              
              <div className="p-6 rounded-2xl bg-black/20 backdrop-blur-md mb-8">
                 <p className="text-[9px] font-black uppercase tracking-widest text-white/50 mb-1">Próximo Cobro</p>
                 <p className="text-sm font-black font-jakarta">12 de Abril, 2026</p>
              </div>

              <Link href="/dashboard/subscription" className="flex items-center justify-center w-full py-5 bg-white text-black font-black uppercase text-[10px] tracking-widest rounded-2xl hover:bg-black hover:text-white transition-all font-jakarta">
                Gestionar Cuenta
              </Link>
           </div>

           <div className="p-10 rounded-[3rem] bg-[#141414] border border-white/5">
              <div className="flex items-center gap-3 mb-8">
                 <BarChart3 size={20} className="text-[#999]" />
                 <span className="text-[10px] font-black uppercase tracking-widest text-[#999] font-jakarta">Soporte Express</span>
              </div>
              <p className="text-xs text-[#bbb] font-bold uppercase tracking-tight leading-relaxed mb-6">
                 ¿Tienes dudas técnicas o necesitas ayuda con la integración?
              </p>
              <button className="flex items-center gap-3 text-[#FF5C3A] font-black uppercase text-[10px] tracking-widest hover:translate-x-2 transition-transform font-jakarta">
                Contactar por WhatsApp <ArrowRight size={16} />
              </button>
           </div>
        </div>

      </div>

    </div>
  );
}
