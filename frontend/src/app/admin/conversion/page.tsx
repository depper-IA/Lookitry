'use client';

import { useEffect, useState, useCallback } from 'react';
import { RefreshCw, TrendingUp, Users, UserCheck, Clock } from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.pruebalo.wilkiedevs.com';

// ── Tipos ─────────────────────────────────────────────────────────────────────

interface ConversionStats {
  totalBrands: number;
  inTrial: number;
  converted: number;
  conversionRate: number;
  conversionsByMonth: { month: string; count: number }[];
}

interface GlobalStats {
  totalBrands: number;
  brandsByPlan: { BASIC: number; PRO: number };
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function adminFetch(path: string) {
  const base = process.env.NEXT_PUBLIC_API_URL || 'https://api.pruebalo.wilkiedevs.com';
  return fetch(`${base}/api${path}`, { credentials: 'include' });
}

function formatMonth(key: string) {
  const [year, month] = key.split('-');
  return new Date(Number(year), Number(month) - 1).toLocaleDateString('es-CO', { month: 'long', year: 'numeric' });
}

function formatMonthShort(key: string) {
  const [year, month] = key.split('-');
  return new Date(Number(year), Number(month) - 1).toLocaleDateString('es-CO', { month: 'short', year: '2-digit' });
}

// ── Tarjeta KPI ───────────────────────────────────────────────────────────────

function KpiCard({ label, value, sub, icon, color }: {
  label: string; value: string | number; sub?: string;
  icon: React.ReactNode; color: string;
}) {
  return (
    <div className="rounded-2xl border p-5" style={{ background: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{label}</p>
        <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white flex-shrink-0" style={{ backgroundColor: color }}>
          {icon}
        </div>
      </div>
      <p className="text-2xl font-bold font-syne" style={{ color: 'var(--text-primary)' }}>{value}</p>
      {sub && <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>{sub}</p>}
    </div>
  );
}

// ── Página principal ──────────────────────────────────────────────────────────

export default function AdminConversionPage() {
  const [conversion, setConversion] = useState<ConversionStats | null>(null);
  const [global, setGlobal] = useState<GlobalStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [convRes, statsRes] = await Promise.all([
        adminFetch('/admin/stats/conversion'),
        adminFetch('/admin/stats'),
      ]);
      const convJson = await convRes.json();
      const statsJson = await statsRes.json();
      if (!convRes.ok) throw new Error(convJson.message || 'Error al cargar datos');
      setConversion(convJson);
      setGlobal(statsJson);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-4 rounded-full animate-spin" style={{ borderColor: 'rgba(255,92,58,0.2)', borderTopColor: '#FF5C3A' }} />
    </div>
  );

  if (error) return (
    <div className="px-4 py-3 rounded-xl border text-sm" style={{ background: 'rgba(239,68,68,0.08)', borderColor: 'rgba(239,68,68,0.2)', color: '#ef4444' }}>
      {error}
    </div>
  );

  if (!conversion) return null;

  const maxCount = Math.max(...conversion.conversionsByMonth.map(m => m.count), 1);
  const noConvertidos = conversion.totalBrands - conversion.converted - conversion.inTrial;
  const rateColor = conversion.conversionRate >= 30 ? '#10b981' : conversion.conversionRate >= 15 ? '#f59e0b' : '#ef4444';

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold font-syne" style={{ color: 'var(--text-primary)' }}>Conversión</h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>Funnel de trial a suscripción activa</p>
        </div>
        <button
          onClick={fetchData}
          className="flex items-center gap-2 px-4 py-2 min-h-[44px] rounded-xl border text-sm transition-opacity hover:opacity-80"
          style={{ borderColor: 'var(--border-color)', color: 'var(--text-secondary)', background: 'var(--bg-card)' }}
        >
          <RefreshCw className="w-4 h-4" />
          Actualizar
        </button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <KpiCard
          label="Total marcas"
          value={conversion.totalBrands}
          icon={<Users className="w-4 h-4" />}
          color="#3b82f6"
        />
        <KpiCard
          label="En trial activo"
          value={conversion.inTrial}
          sub={`${conversion.totalBrands > 0 ? Math.round((conversion.inTrial / conversion.totalBrands) * 100) : 0}% del total`}
          icon={<Clock className="w-4 h-4" />}
          color="#f59e0b"
        />
        <KpiCard
          label="Convertidas a pago"
          value={conversion.converted}
          sub={`${conversion.totalBrands > 0 ? Math.round((conversion.converted / conversion.totalBrands) * 100) : 0}% del total`}
          icon={<UserCheck className="w-4 h-4" />}
          color="#10b981"
        />
        <KpiCard
          label="Tasa de conversión"
          value={`${conversion.conversionRate}%`}
          sub={conversion.conversionRate >= 30 ? 'Excelente' : conversion.conversionRate >= 15 ? 'Normal' : 'Mejorar'}
          icon={<TrendingUp className="w-4 h-4" />}
          color={rateColor}
        />
      </div>

      {/* Funnel visual + distribución por plan */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

        {/* Funnel */}
        <div className="rounded-2xl border p-5" style={{ background: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
          <h2 className="text-sm font-semibold mb-5" style={{ color: 'var(--text-primary)' }}>Funnel de conversión</h2>
          <div className="space-y-3">
            {[
              {
                label: 'Registros totales',
                value: conversion.totalBrands,
                pct: 100,
                color: '#3b82f6',
                bg: 'rgba(59,130,246,0.1)',
              },
              {
                label: 'En trial activo',
                value: conversion.inTrial,
                pct: conversion.totalBrands > 0 ? Math.round((conversion.inTrial / conversion.totalBrands) * 100) : 0,
                color: '#f59e0b',
                bg: 'rgba(245,158,11,0.1)',
              },
              {
                label: 'Convertidas a pago',
                value: conversion.converted,
                pct: conversion.totalBrands > 0 ? Math.round((conversion.converted / conversion.totalBrands) * 100) : 0,
                color: '#10b981',
                bg: 'rgba(16,185,129,0.1)',
              },
            ].map(step => (
              <div key={step.label}>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>{step.label}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold" style={{ color: step.color }}>{step.value}</span>
                    <span className="text-xs px-1.5 py-0.5 rounded-full font-medium" style={{ background: step.bg, color: step.color }}>
                      {step.pct}%
                    </span>
                  </div>
                </div>
                <div className="h-2.5 rounded-full overflow-hidden" style={{ background: 'var(--border-color)' }}>
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{ width: `${step.pct}%`, backgroundColor: step.color }}
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Marcas sin actividad */}
          {noConvertidos > 0 && (
            <div className="mt-4 pt-4 border-t" style={{ borderColor: 'var(--border-color)' }}>
              <div className="flex items-center justify-between text-sm">
                <span style={{ color: 'var(--text-muted)' }}>Sin suscripción activa ni trial</span>
                <span className="font-semibold" style={{ color: 'var(--text-muted)' }}>{noConvertidos}</span>
              </div>
            </div>
          )}
        </div>

        {/* Distribución por plan */}
        {global && (
          <div className="rounded-2xl border p-5" style={{ background: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
            <h2 className="text-sm font-semibold mb-5" style={{ color: 'var(--text-primary)' }}>Distribución por plan</h2>
            <div className="space-y-4">
              {[
                { label: 'Plan Basic', count: global.brandsByPlan.BASIC, color: '#64748b' },
                { label: 'Plan Pro',   count: global.brandsByPlan.PRO,   color: '#FF5C3A' },
              ].map(p => {
                const pct = conversion.converted > 0 ? Math.round((p.count / conversion.converted) * 100) : 0;
                return (
                  <div key={p.label}>
                    <div className="flex justify-between text-xs mb-1.5">
                      <span style={{ color: 'var(--text-secondary)' }}>{p.label}</span>
                      <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>
                        {p.count} <span style={{ color: 'var(--text-muted)' }}>({pct}%)</span>
                      </span>
                    </div>
                    <div className="h-2 rounded-full overflow-hidden" style={{ background: 'var(--border-color)' }}>
                      <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, backgroundColor: p.color }} />
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Resumen numérico */}
            <div className="mt-5 pt-4 border-t grid grid-cols-2 gap-3" style={{ borderColor: 'var(--border-color)' }}>
              <div className="rounded-xl p-3 text-center" style={{ background: 'var(--bg-hover)' }}>
                <p className="text-xl font-bold font-syne" style={{ color: '#64748b' }}>{global.brandsByPlan.BASIC}</p>
                <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>Plan Basic</p>
              </div>
              <div className="rounded-xl p-3 text-center" style={{ background: 'rgba(255,92,58,0.06)', border: '1px solid rgba(255,92,58,0.15)' }}>
                <p className="text-xl font-bold font-syne" style={{ color: '#FF5C3A' }}>{global.brandsByPlan.PRO}</p>
                <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>Plan Pro</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Gráfico conversiones por mes */}
      <div className="rounded-2xl border p-5" style={{ background: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
        <h2 className="text-sm font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>Conversiones por mes</h2>
        <p className="text-xs mb-5" style={{ color: 'var(--text-muted)' }}>Marcas que pasaron a suscripción activa en los últimos 6 meses</p>
        <div className="flex items-end gap-3 h-40">
          {conversion.conversionsByMonth.map(m => {
            const h = Math.round((m.count / maxCount) * 100);
            return (
              <div key={m.month} className="flex-1 flex flex-col items-center gap-1.5">
                <span className="text-xs font-semibold" style={{ color: m.count > 0 ? 'var(--text-primary)' : 'transparent' }}>
                  {m.count}
                </span>
                <div className="w-full rounded-t-lg relative" style={{ height: '100px', background: 'var(--border-color)' }}>
                  <div
                    className="absolute bottom-0 left-0 right-0 rounded-t-lg transition-all duration-700"
                    style={{ height: `${Math.max(h, m.count > 0 ? 4 : 0)}%`, backgroundColor: '#FF5C3A' }}
                  />
                </div>
                <span className="text-[10px] whitespace-nowrap" style={{ color: 'var(--text-muted)' }}>
                  {formatMonthShort(m.month)}
                </span>
              </div>
            );
          })}
        </div>
        {conversion.conversionsByMonth.every(m => m.count === 0) && (
          <p className="text-center text-xs mt-3" style={{ color: 'var(--text-muted)' }}>
            Sin conversiones registradas en los últimos 6 meses
          </p>
        )}
      </div>

      {/* Tabla detalle */}
      <div className="rounded-2xl border overflow-hidden" style={{ background: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
        <div className="px-5 py-4 border-b" style={{ borderColor: 'var(--border-color)' }}>
          <h2 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Detalle mensual</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ background: 'var(--bg-hover)' }}>
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>Mes</th>
                <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>Conversiones</th>
                <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>Tendencia</th>
              </tr>
            </thead>
            <tbody>
              {[...conversion.conversionsByMonth].reverse().map((m, i, arr) => {
                const prev = arr[i + 1];
                const diff = prev ? m.count - prev.count : null;
                return (
                  <tr key={m.month} className="border-t transition-opacity hover:opacity-80" style={{ borderColor: 'var(--border-color)' }}>
                    <td className="px-5 py-3 capitalize" style={{ color: 'var(--text-secondary)' }}>{formatMonth(m.month)}</td>
                    <td className="px-5 py-3 text-right font-semibold" style={{ color: m.count > 0 ? '#FF5C3A' : 'var(--text-muted)' }}>
                      {m.count}
                    </td>
                    <td className="px-5 py-3 text-right text-xs">
                      {diff !== null && diff !== 0 ? (
                        <span style={{ color: diff > 0 ? '#10b981' : '#ef4444' }}>
                          {diff > 0 ? '+' : ''}{diff}
                        </span>
                      ) : (
                        <span style={{ color: 'var(--text-muted)' }}>—</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
