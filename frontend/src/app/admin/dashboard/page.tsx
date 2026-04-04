'use client';

import { useEffect, useState } from 'react';
import { Users, TrendingUp, UserCheck, BarChart2, Image as ImageIcon, Package, Globe, PauseCircle, MinusCircle, CreditCard, Building2, AlertTriangle, XCircle, Clock, ArrowRight, ExternalLink } from 'lucide-react';

interface GlobalStats {
  totalBrands: number; totalProducts: number; totalGenerations: number;
  generationsThisMonth: number; successRate: number; brandsByPlan: { BASIC: number; PRO: number; TRIAL: number };
  landingStats: { active: number; suspended: number; inactive: number };
}
interface ConversionStats {
  totalBrands: number; inTrial: number; paidTrials: number; trialToBasic: number; trialToPro: number; trialToEnterprise: number; converted: number; conversionRate: number;
  conversionsByMonth: { month: string; count: number }[];
}

function adminFetch(path: string) {
  const base = process.env.NEXT_PUBLIC_API_URL || 'https://api.lookitry.com';
  return fetch(`${base}/api${path}`, { credentials: 'include' });
}

function formatMonth(key: string) {
  const [year, month] = key.split('-');
  return new Date(Number(year), Number(month) - 1).toLocaleDateString('es-CO', { month: 'short', year: '2-digit' });
}

export default function AdminDashboardPage() {
  const [global, setGlobal] = useState<GlobalStats | null>(null);
  const [conversion, setConversion] = useState<ConversionStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // alertas críticas
  const [alerts, setAlerts] = useState<{ expiring: number; failed: number; critical: number }>({ expiring: 0, failed: 0, critical: 0 });
  const [recentPayments, setRecentPayments] = useState<any[]>([]);
  const [recentBrands, setRecentBrands] = useState<any[]>([]);
  const [loadingActivity, setLoadingActivity] = useState(true);

  useEffect(() => {
    Promise.all([
      adminFetch('/admin/stats').then(r => r.json()),
      adminFetch('/admin/stats/conversion').then(r => r.json()),
    ])
      .then(([g, c]) => { if (g.error) throw new Error(g.message); setGlobal(g); setConversion(c); })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
      
    // Cargar alertas críticas y actividad reciente
    Promise.all([
      adminFetch('/admin/alerts').then(r => r.json()).catch(() => ({})),
      adminFetch('/api/payments?limit=5').then(r => r.json()).catch(() => ({ payments: [] })),
      adminFetch('/api/brands?limit=5&sort=created_at:desc').then(r => r.json()).catch(() => ({ brands: [] })),
    ])
      .then(([alertsData, paymentsData, brandsData]) => {
        if (alertsData.expiring) setAlerts(prev => ({ ...prev, expiring: alertsData.expiring }));
        if (alertsData.failed) setAlerts(prev => ({ ...prev, failed: alertsData.failed }));
        if (alertsData.critical) setAlerts(prev => ({ ...prev, critical: alertsData.critical }));
        setRecentPayments(paymentsData.payments || paymentsData || []);
        setRecentBrands(brandsData.brands || brandsData || []);
      })
      .finally(() => setLoadingActivity(false));
  }, []);

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 rounded-full border-2 animate-spin" style={{ borderColor: '#FF5C3A', borderTopColor: 'transparent' }} />
    </div>
  );

  if (error) return (
    <div className="flex items-start gap-2.5 px-4 py-3 rounded-xl text-sm" style={{ backgroundColor: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: '#ef4444' }}>
      <svg className="w-4 h-4 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
      </svg>
      {error}
    </div>
  );

  if (!global || !conversion) return null;

  const conversionsByMonth = conversion?.conversionsByMonth || [];
  const maxCount = Math.max(...conversionsByMonth.map(m => m.count || 0), 1);
  const brandsByPlan = global?.brandsByPlan || { BASIC: 0, PRO: 0, TRIAL: 0 };
  const landingStats = global?.landingStats || { active: 0, suspended: 0, inactive: 0 };

  const topCards = [
    { label: 'Total marcas', value: global?.totalBrands || 0, icon: <Users className="w-4 h-4" />, accent: '#3b82f6' },
    { label: 'Productos activos', value: global?.totalProducts || 0, icon: <Package className="w-4 h-4" />, accent: '#10b981' },
    { label: 'Generaciones totales', value: global?.totalGenerations || 0, icon: <ImageIcon className="w-4 h-4" />, accent: '#8b5cf6' },
    { label: 'Generaciones este mes', value: global?.generationsThisMonth || 0, icon: <BarChart2 className="w-4 h-4" />, accent: '#FF5C3A' },
    { label: 'Trials activos', value: conversion?.inTrial || 0, icon: <BarChart2 className="w-4 h-4" />, accent: '#f59e0b' },
    { label: 'Trials pagados', value: conversion?.paidTrials || 0, icon: <CreditCard className="w-4 h-4" />, accent: '#f97316' },
    { label: 'Trial -> Basic', value: conversion?.trialToBasic || 0, icon: <TrendingUp className="w-4 h-4" />, accent: '#0ea5e9' },
    { label: 'Trial -> Pro', value: conversion?.trialToPro || 0, icon: <TrendingUp className="w-4 h-4" />, accent: '#22c55e' },
    { label: 'Trial -> Enterprise', value: conversion?.trialToEnterprise || 0, icon: <Building2 className="w-4 h-4" />, accent: '#6366f1' },
    { label: 'Convertidas a pago', value: conversion?.converted || 0, icon: <UserCheck className="w-4 h-4" />, accent: '#14b8a6' },
    { label: 'Tasa de conversión', value: `${conversion?.conversionRate || 0}%`, icon: <TrendingUp className="w-4 h-4" />, accent: '#6366f1' },
    { label: 'Tasa de éxito IA', value: `${Math.round(global?.successRate || 0)}%`, icon: <TrendingUp className="w-4 h-4" />, accent: '#ec4899' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-jakarta font-bold tracking-tight text-2xl" style={{ color: 'var(--text-primary)' }}>Dashboard</h1>
        <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>Métricas globales y seguimiento de conversiones</p>
      </div>

      {/* ALERTAS CRÍTICAS */}
      {(alerts.expiring > 0 || alerts.failed > 0) && (
        <div className="space-y-2">
          {alerts.expiring > 0 && (
            <a href="/admin/subscriptions?filter=expiring" className="flex items-center gap-3 p-4 rounded-xl transition-all hover:scale-[1.01]" style={{ backgroundColor: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.3)' }}>
              <Clock className="w-5 h-5 text-amber-500" />
              <div className="flex-1">
                <p className="text-sm font-semibold text-amber-500">{alerts.expiring} suscripción{alerts.expiring > 1 ? 'es' : ''} vence{alerts.expiring === 1 ? '' : 'n'} en los próximos 7 días</p>
                <p className="text-xs text-amber-500/70">Requiere atención antes de que venzan</p>
              </div>
              <ArrowRight className="w-4 h-4 text-amber-500" />
            </a>
          )}
          {alerts.failed > 0 && (
            <a href="/admin/payments?filter=failed" className="flex items-center gap-3 p-4 rounded-xl transition-all hover:scale-[1.01]" style={{ backgroundColor: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.3)' }}>
              <XCircle className="w-5 h-5 text-red-500" />
              <div className="flex-1">
                <p className="text-sm font-semibold text-red-500">{alerts.failed} pago{alerts.failed > 1 ? 's' : ''} fallido{alerts.failed > 1 ? '' : 's'}</p>
                <p className="text-xs text-red-500/70">Revisar y contactar a los clientes afectados</p>
              </div>
              <ArrowRight className="w-4 h-4 text-red-500" />
            </a>
          )}
        </div>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {topCards.map(c => (
          <div key={c.label} className="rounded-[1.5rem] p-5 transition-all duration-200" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)', borderLeft: '3px solid #FF5C3A' }}>
            <div className="flex items-start justify-between mb-3">
              <p className="text-xs leading-snug pr-2" style={{ color: 'var(--text-secondary)' }}>{c.label}</p>
              <div className="flex-shrink-0 mt-0.5" style={{ color: c.accent }}>{c.icon}</div>
            </div>
            <p className="text-2xl font-bold font-jakarta" style={{ color: 'var(--text-primary)' }}>{c.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="rounded-[2rem] p-5" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
          <h2 className="font-jakarta font-bold text-sm mb-5" style={{ color: 'var(--text-primary)' }}>Distribución por plan</h2>
          <div className="space-y-4">
            {[
              { label: 'Plan Basic', count: brandsByPlan.BASIC || 0, color: '#64748b' },
              { label: 'Plan Pro', count: brandsByPlan.PRO || 0, color: '#FF5C3A' },
              { label: 'Plan Trial', count: brandsByPlan.TRIAL || 0, color: '#f59e0b' },
            ].map(p => {
              const total = global?.totalBrands || 0;
              const pct = total > 0 ? Math.round((p.count / total) * 100) : 0;
              return (
                <div key={p.label}>
                  <div className="flex justify-between text-xs mb-2">
                    <span style={{ color: 'var(--text-secondary)' }}>{p.label}</span>
                    <span className="font-semibold tabular-nums" style={{ color: 'var(--text-primary)' }}>
                      {p.count} <span style={{ color: 'var(--text-muted)' }}>({pct}%)</span>
                    </span>
                  </div>
                  <div className="h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--border-color)' }}>
                    <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, backgroundColor: p.color }} />
                  </div>
                </div>
              );
            })}
            <div className="pt-4 mt-2" style={{ borderTop: '1px solid var(--border-color)' }}>
              <div className="flex justify-between text-xs">
                <span style={{ color: 'var(--text-secondary)' }}>Tasa de conversión</span>
                <span className="font-bold tabular-nums" style={{ color: '#FF5C3A' }}>{conversion?.conversionRate || 0}%</span>
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-2 rounded-[2rem] p-5" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
          <h2 className="font-jakarta font-bold text-sm" style={{ color: 'var(--text-primary)' }}>Conversiones por mes</h2>
          <p className="text-xs mb-5 mt-0.5" style={{ color: 'var(--text-secondary)' }}>Cambios desde trial a planes superiores</p>
          <div className="flex items-end gap-2 h-36">
            {conversionsByMonth.map(m => {
              const heightPct = (m.count / maxCount) * 100;
              return (
                <div key={m.month} className="flex-1 flex flex-col items-center gap-1">
                  <span className="text-xs font-semibold tabular-nums" style={{ color: 'var(--text-primary)', minHeight: '1rem' }}>
                    {m.count > 0 ? m.count : ''}
                  </span>
                  <div className="w-full rounded-t relative" style={{ height: '100px', backgroundColor: 'var(--border-color)' }}>
                    <div className="absolute bottom-0 left-0 right-0 rounded-t transition-all duration-700" style={{ height: `${heightPct}%`, backgroundColor: '#FF5C3A', opacity: heightPct > 0 ? 1 : 0 }} />
                  </div>
                  <span className="text-[10px] whitespace-nowrap" style={{ color: 'var(--text-muted)' }}>{formatMonth(m.month)}</span>
                </div>
              );
            })}
          </div>
          {(conversionsByMonth.length === 0 || conversionsByMonth.every(m => m.count === 0)) && (
            <p className="text-center text-xs mt-3" style={{ color: 'var(--text-muted)' }}>Sin conversiones en los últimos 6 meses</p>
          )}
        </div>
      </div>

      {landingStats && (
        <div className="rounded-[2rem] p-5" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
          <h2 className="font-jakarta font-bold tracking-tight text-sm mb-4" style={{ color: 'var(--text-primary)' }}>Mini-landings</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[
              { label: 'Activas', value: landingStats.active || 0, icon: <Globe className="w-4 h-4" />, accent: '#10b981' },
              { label: 'Suspendidas', value: landingStats.suspended || 0, icon: <PauseCircle className="w-4 h-4" />, accent: '#f59e0b' },
              { label: 'Sin activar', value: landingStats.inactive || 0, icon: <MinusCircle className="w-4 h-4" />, accent: '#64748b' },
            ].map(c => (
              <div key={c.label} className="rounded-lg p-4 flex items-center gap-3" style={{ backgroundColor: 'var(--bg-base)', border: '1px solid var(--border-color)', borderLeft: `3px solid ${c.accent}` }}>
                <div style={{ color: c.accent }}>{c.icon}</div>
                <div>
                  <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>{c.label}</p>
                  <p className="text-xl font-bold font-jakarta tabular-nums" style={{ color: 'var(--text-primary)' }}>{c.value}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="rounded-[2rem] overflow-hidden" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
        <div className="px-5 py-4" style={{ borderBottom: '1px solid var(--border-color)' }}>
          <h2 className="font-jakarta font-bold tracking-tight text-sm" style={{ color: 'var(--text-primary)' }}>Detalle mensual de conversiones</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ backgroundColor: 'var(--bg-base)' }}>
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>Mes</th>
                <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>Conversiones</th>
              </tr>
            </thead>
            <tbody>
              {[...conversionsByMonth].reverse().map((m) => (
                <tr key={m.month} style={{ borderTop: '1px solid var(--border-color)' }}>
                  <td className="px-5 py-3 capitalize" style={{ color: 'var(--text-secondary)' }}>{formatMonth(m.month)}</td>
                  <td className="px-5 py-3 text-right font-semibold tabular-nums" style={{ color: (m.count || 0) > 0 ? '#FF5C3A' : 'var(--text-muted)' }}>{m.count || 0}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ACTIVIDAD RECIENTE */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="rounded-[2rem] p-5" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-jakarta font-bold text-sm" style={{ color: 'var(--text-primary)' }}>Últimos pagos</h2>
            <a href="/admin/payments" className="text-xs text-[#FF5C3A] hover:underline flex items-center gap-1">
              Ver todos <ExternalLink className="w-3 h-3" />
            </a>
          </div>
          <div className="space-y-3">
            {recentPayments.length > 0 ? recentPayments.slice(0, 5).map((p: any) => (
              <div key={p.id} className="flex items-center justify-between py-2" style={{ borderBottom: '1px solid var(--border-color)' }}>
                <div className="flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full ${p.status === 'completed' ? 'bg-emerald-500' : p.status === 'failed' ? 'bg-red-500' : 'bg-amber-500'}`} />
                  <div>
                    <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{p.brands?.name || p.brandName || '—'}</p>
                    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{p.payment_method || p.paymentMethod || '—'}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>${(p.amount_cop || p.amount || 0).toLocaleString('es-CO')}</p>
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{new Date(p.created_at || p.payment_date).toLocaleDateString('es-CO')}</p>
                </div>
              </div>
            )) : (
              <p className="text-sm text-center py-4" style={{ color: 'var(--text-muted)' }}>Sin pagos recientes</p>
            )}
          </div>
        </div>

        <div className="rounded-[2rem] p-5" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-jakarta font-bold text-sm" style={{ color: 'var(--text-primary)' }}>Últimas marcas</h2>
            <a href="/admin/brands" className="text-xs text-[#FF5C3A] hover:underline flex items-center gap-1">
              Ver todas <ExternalLink className="w-3 h-3" />
            </a>
          </div>
          <div className="space-y-3">
            {recentBrands.length > 0 ? recentBrands.slice(0, 5).map((b: any) => (
              <a href={`/admin/brands/${b.id}`} key={b.id} className="flex items-center justify-between py-2 hover:bg-[var(--bg-hover)] rounded-lg px-2 -mx-2 transition-colors" style={{ borderBottom: '1px solid var(--border-color)' }}>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-[#FF5C3A]/10 flex items-center justify-center">
                    <span className="text-xs font-bold text-[#FF5C3A]">{(b.name || 'M').charAt(0).toUpperCase()}</span>
                  </div>
                  <div>
                    <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{b.name}</p>
                    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{b.email}</p>
                  </div>
                </div>
                <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${b.plan === 'PRO' ? 'bg-[#FF5C3A]/10 text-[#FF5C3A]' : b.plan === 'TRIAL' ? 'bg-indigo-500/10 text-indigo-500' : 'bg-gray-500/10 text-gray-400'}`}>
                  {b.plan}
                </span>
              </a>
            )) : (
              <p className="text-sm text-center py-4" style={{ color: 'var(--text-muted)' }}>Sin marcas registradas</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
