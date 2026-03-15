'use client';

import { useEffect, useState } from 'react';
import { Users, TrendingUp, UserCheck, BarChart2, Image, Package } from 'lucide-react';

interface GlobalStats {
  totalBrands: number; totalProducts: number; totalGenerations: number;
  generationsThisMonth: number; successRate: number; brandsByPlan: { BASIC: number; PRO: number };
}
interface ConversionStats {
  totalBrands: number; inTrial: number; converted: number; conversionRate: number;
  conversionsByMonth: { month: string; count: number }[];
}

function adminFetch(path: string) {
  const base = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
  const token = typeof window !== 'undefined' ? localStorage.getItem('adminToken') ?? '' : '';
  return fetch(`${base}/api${path}`, { headers: { Authorization: `Bearer ${token}` } });
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

  useEffect(() => {
    Promise.all([
      adminFetch('/admin/stats').then(r => r.json()),
      adminFetch('/admin/stats/conversion').then(r => r.json()),
    ])
      .then(([g, c]) => { if (g.error) throw new Error(g.message); setGlobal(g); setConversion(c); })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: '#FF5C3A', borderTopColor: 'transparent' }} />
    </div>
  );

  if (error) return (
    <div className="flex items-start gap-2 px-4 py-3 rounded-xl border border-red-200 bg-red-50 text-red-700 text-sm">
      <svg className="w-4 h-4 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
      </svg>
      {error}
    </div>
  );

  if (!global || !conversion) return null;

  const maxCount = Math.max(...conversion.conversionsByMonth.map(m => m.count), 1);

  const topCards = [
    { label: 'Total marcas',         value: global.totalBrands,                        icon: <Users className="w-4 h-4" />,     color: '#3b82f6' },
    { label: 'Productos activos',     value: global.totalProducts,                      icon: <Package className="w-4 h-4" />,   color: '#10b981' },
    { label: 'Generaciones totales',  value: global.totalGenerations,                   icon: <Image className="w-4 h-4" />,     color: '#8b5cf6' },
    { label: 'Generaciones este mes', value: global.generationsThisMonth,               icon: <BarChart2 className="w-4 h-4" />, color: '#FF5C3A' },
    { label: 'En período de prueba',  value: conversion.inTrial,                        icon: <BarChart2 className="w-4 h-4" />, color: '#f59e0b' },
    { label: 'Convertidas a pago',    value: conversion.converted,                      icon: <UserCheck className="w-4 h-4" />, color: '#14b8a6' },
    { label: 'Tasa de conversión',    value: `${conversion.conversionRate}%`,           icon: <TrendingUp className="w-4 h-4" />, color: '#6366f1' },
    { label: 'Tasa de éxito IA',      value: `${Math.round(global.successRate)}%`,      icon: <TrendingUp className="w-4 h-4" />, color: '#ec4899' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-syne font-bold text-2xl" style={{ color: 'var(--text-primary)' }}>Dashboard</h1>
        <p className="text-sm mt-0.5" style={{ color: 'var(--text-secondary)' }}>Métricas globales y seguimiento de conversiones</p>
      </div>

      {/* Tarjetas */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {topCards.map(c => (
          <div key={c.label} className="rounded-xl border p-4" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs leading-tight" style={{ color: 'var(--text-secondary)' }}>{c.label}</p>
              <div className="w-7 h-7 rounded-lg flex items-center justify-center text-white flex-shrink-0" style={{ backgroundColor: c.color }}>
                {c.icon}
              </div>
            </div>
            <p className="text-2xl font-bold font-syne" style={{ color: 'var(--text-primary)' }}>{c.value}</p>
          </div>
        ))}
      </div>

      {/* Distribución + gráfico */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Distribución por plan */}
        <div className="rounded-xl border p-5" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
          <h2 className="font-syne font-semibold text-sm mb-4" style={{ color: 'var(--text-primary)' }}>Distribución por plan</h2>
          <div className="space-y-4">
            {[
              { label: 'Plan Basic', count: global.brandsByPlan.BASIC, color: '#64748b' },
              { label: 'Plan Pro',   count: global.brandsByPlan.PRO,   color: '#FF5C3A' },
            ].map(p => {
              const pct = global.totalBrands > 0 ? Math.round((p.count / global.totalBrands) * 100) : 0;
              return (
                <div key={p.label}>
                  <div className="flex justify-between text-xs mb-1.5">
                    <span style={{ color: 'var(--text-secondary)' }}>{p.label}</span>
                    <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>{p.count} <span style={{ color: 'var(--text-muted)' }}>({pct}%)</span></span>
                  </div>
                  <div className="h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--border-color)' }}>
                    <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, backgroundColor: p.color }} />
                  </div>
                </div>
              );
            })}
            <div className="pt-3 border-t" style={{ borderColor: 'var(--border-color)' }}>
              <div className="flex justify-between text-xs">
                <span style={{ color: 'var(--text-secondary)' }}>Tasa de conversión</span>
                <span className="font-semibold" style={{ color: '#FF5C3A' }}>{conversion.conversionRate}%</span>
              </div>
            </div>
          </div>
        </div>

        {/* Gráfico conversiones */}
        <div className="lg:col-span-2 rounded-xl border p-5" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
          <h2 className="font-syne font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>Conversiones por mes</h2>
          <p className="text-xs mb-4" style={{ color: 'var(--text-secondary)' }}>Marcas que pasaron a suscripción activa</p>
          <div className="flex items-end gap-2 h-36">
            {conversion.conversionsByMonth.map(m => {
              const heightPct = (m.count / maxCount) * 100;
              return (
                <div key={m.month} className="flex-1 flex flex-col items-center gap-1">
                  <span className="text-xs font-semibold" style={{ color: 'var(--text-primary)' }}>{m.count > 0 ? m.count : ''}</span>
                  <div className="w-full rounded-t-md relative" style={{ height: '100px', backgroundColor: 'var(--border-color)' }}>
                    <div className="absolute bottom-0 left-0 right-0 rounded-t-md transition-all duration-500" style={{ height: `${heightPct}%`, backgroundColor: '#FF5C3A' }} />
                  </div>
                  <span className="text-[10px] whitespace-nowrap" style={{ color: 'var(--text-muted)' }}>{formatMonth(m.month)}</span>
                </div>
              );
            })}
          </div>
          {conversion.conversionsByMonth.every(m => m.count === 0) && (
            <p className="text-center text-xs mt-2" style={{ color: 'var(--text-muted)' }}>Sin conversiones en los últimos 6 meses</p>
          )}
        </div>
      </div>

      {/* Tabla detalle */}
      <div className="rounded-xl border overflow-hidden" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
        <div className="px-5 py-4 border-b" style={{ borderColor: 'var(--border-color)' }}>
          <h2 className="font-syne font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>Detalle mensual de conversiones</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ backgroundColor: 'var(--bg-base)' }}>
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--text-secondary)' }}>Mes</th>
                <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--text-secondary)' }}>Conversiones</th>
              </tr>
            </thead>
            <tbody>
              {[...conversion.conversionsByMonth].reverse().map((m, i) => (
                <tr key={m.month} className="border-t" style={{ borderColor: 'var(--border-color)' }}>
                  <td className="px-5 py-3 capitalize" style={{ color: 'var(--text-secondary)' }}>{formatMonth(m.month)}</td>
                  <td className="px-5 py-3 text-right font-semibold" style={{ color: m.count > 0 ? '#FF5C3A' : 'var(--text-muted)' }}>{m.count}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
