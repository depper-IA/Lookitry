'use client';

import { useEffect, useState } from 'react';
import { formatCurrency } from '@/utils/currency';

interface MonthlyRevenue {
  month: string;
  total: number;
  basic: number;
  pro: number;
  landing: number;
  count: number;
}

interface RevenueStats {
  monthlyRevenue: MonthlyRevenue[];
  currentMonth: {
    month: string;
    total: number;
    basic: number;
    pro: number;
    landing: number;
    paymentsCount: number;
  };
  projection: {
    nextMonth: string;
    total: number;
    basic: number;
    pro: number;
    activeSubscriptions: number;
  };
  planBreakdown: {
    basic: {
      totalRevenue: number;
      paymentsCount: number;
      averagePayment: number;
    };
    pro: {
      totalRevenue: number;
      paymentsCount: number;
      averagePayment: number;
    };
    landing: {
      totalRevenue: number;
      paymentsCount: number;
      averagePayment: number;
    };
  };
}

export default function RevenuePage() {
  const [stats, setStats] = useState<RevenueStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchRevenueStats();
  }, []);

  const fetchRevenueStats = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('adminToken');
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'https://api.pruebalo.wilkiedevs.com'}/api/admin/revenue/stats`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Error al cargar estadísticas');
      setStats(data);
    } catch (err: any) {
      console.error('Error fetching revenue stats:', err);
      setError(err.message || 'Error al cargar estadísticas');
    } finally {
      setLoading(false);
    }
  };

  const formatMonth = (monthStr: string) => {
    const [year, month] = monthStr.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1);
    return date.toLocaleDateString('es-CO', { year: 'numeric', month: 'long' });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#FF5C3A]" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4">
        <p className="text-red-500 text-sm">{error}</p>
      </div>
    );
  }

  if (!stats) return null;

  const maxRevenue = Math.max(...stats.monthlyRevenue.map((m) => m.total), 1);

  return (
    <div className="space-y-6">
      <div>
        <h1 style={{ color: 'var(--text-primary)' }} className="text-2xl font-syne font-bold">Reporte de Ingresos</h1>
        <p style={{ color: 'var(--text-muted)' }} className="mt-1 text-sm">Estadísticas de ingresos mensuales y proyecciones</p>
      </div>

      {/* Tarjetas de resumen */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          {
            label: 'Mes Actual',
            value: formatCurrency(stats.currentMonth.total),
            sub: `${stats.currentMonth.paymentsCount} pagos`,
            icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />,
          },
          {
            label: 'Proyección Próximo Mes',
            value: formatCurrency(stats.projection.total),
            sub: `${stats.projection.activeSubscriptions} suscripciones activas`,
            icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />,
          },
          {
            label: 'Total Histórico',
            value: formatCurrency(
              stats.planBreakdown.basic.totalRevenue +
              stats.planBreakdown.pro.totalRevenue +
              stats.planBreakdown.landing.totalRevenue
            ),
            sub: `${
              stats.planBreakdown.basic.paymentsCount +
              stats.planBreakdown.pro.paymentsCount +
              stats.planBreakdown.landing.paymentsCount
            } pagos totales`,
            icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />,
          },
        ].map(card => (
          <div key={card.label} style={{ background: 'var(--bg-card)', borderColor: 'var(--border-color)' }} className="rounded-2xl border p-5">
            <div className="flex items-center justify-between">
              <div>
                <p style={{ color: 'var(--text-muted)' }} className="text-sm">{card.label}</p>
                <p style={{ color: 'var(--text-primary)' }} className="text-2xl font-bold mt-1">{card.value}</p>
                <p style={{ color: 'var(--text-muted)' }} className="text-xs mt-1">{card.sub}</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-[#FF5C3A]/10 flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5 text-[#FF5C3A]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  {card.icon}
                </svg>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Desglose por plan */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {(['basic', 'pro', 'landing'] as const).map(planKey => {
          const planLabel = planKey === 'basic' ? 'BASIC' : planKey === 'pro' ? 'PRO' : 'LANDING';
          const data = stats.planBreakdown[planKey];
          return (
            <div key={planKey} style={{ background: 'var(--bg-card)', borderColor: 'var(--border-color)' }} className="rounded-2xl border p-5">
              <div className="flex items-center gap-2 mb-4">
                <span
                  className="px-2 py-0.5 rounded-full text-xs font-semibold"
                  style={
                    planKey === 'pro'
                      ? { backgroundColor: 'rgba(255,92,58,0.12)', color: '#FF5C3A' }
                      : planKey === 'landing'
                      ? { backgroundColor: 'rgba(59,130,246,0.12)', color: '#3b82f6' }
                      : { backgroundColor: 'var(--bg-base)', color: 'var(--text-secondary)', border: '1px solid var(--border-color)' }
                  }
                >
                  {planLabel}
                </span>
                {planKey === 'landing' && (
                  <span style={{ color: 'var(--text-muted)' }} className="text-xs">Pago único</span>
                )}
                {planKey !== 'landing' && (
                  <span style={{ color: 'var(--text-muted)' }} className="text-xs">
                    {planKey === 'basic' ? '$150.000/mes' : '$250.000/mes'}
                  </span>
                )}
              </div>
              <div className="space-y-2.5">
                {[
                  { label: 'Ingresos totales', value: formatCurrency(data.totalRevenue), color: 'var(--text-primary)' },
                  { label: 'Número de pagos', value: String(data.paymentsCount), color: 'var(--text-primary)' },
                  { label: 'Promedio por pago', value: formatCurrency(data.averagePayment), color: 'var(--text-primary)' },
                  ...(planKey !== 'landing' ? [
                    {
                      label: 'Mes actual',
                      value: formatCurrency(planKey === 'basic' ? stats.currentMonth.basic : stats.currentMonth.pro),
                      color: '#10b981',
                    },
                    {
                      label: 'Proyección próximo mes',
                      value: formatCurrency(planKey === 'basic' ? stats.projection.basic : stats.projection.pro),
                      color: '#FF5C3A',
                    },
                  ] : [
                    {
                      label: 'Mes actual',
                      value: formatCurrency(stats.currentMonth.landing),
                      color: '#10b981',
                    },
                  ]),
                ].map(row => (
                  <div key={row.label} className="flex justify-between items-center">
                    <span style={{ color: 'var(--text-secondary)' }} className="text-sm">{row.label}:</span>
                    <span style={{ color: row.color }} className="text-sm font-semibold">{row.value}</span>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Gráfico de ingresos por mes */}
      <div style={{ background: 'var(--bg-card)', borderColor: 'var(--border-color)' }} className="rounded-2xl border p-6">
        <h3 style={{ color: 'var(--text-primary)' }} className="text-base font-semibold mb-6">
          Ingresos Mensuales (Últimos 12 meses)
        </h3>
        <div className="space-y-4">
          {stats.monthlyRevenue.slice(-12).map((month) => {
            const basicPct = (month.basic / maxRevenue) * 100;
            const proPct = (month.pro / maxRevenue) * 100;
            const landingPct = (month.landing / maxRevenue) * 100;
            return (
              <div key={month.month}>
                <div className="flex justify-between items-center mb-2">
                  <span style={{ color: 'var(--text-secondary)' }} className="text-sm font-medium">{formatMonth(month.month)}</span>
                  <span style={{ color: 'var(--text-primary)' }} className="text-sm font-semibold">{formatCurrency(month.total)}</span>
                </div>
                <div style={{ background: 'var(--bg-hover)' }} className="relative h-6 rounded-full overflow-hidden">
                  {/* BASIC */}
                  <div className="absolute top-0 left-0 h-full bg-[#FF5C3A]/50 rounded-full"
                    style={{ width: `${basicPct}%` }} />
                  {/* PRO */}
                  <div className="absolute top-0 h-full bg-[#FF5C3A] rounded-full"
                    style={{ left: `${basicPct}%`, width: `${proPct}%` }} />
                  {/* LANDING */}
                  <div className="absolute top-0 h-full bg-[#3b82f6] rounded-full"
                    style={{ left: `${basicPct + proPct}%`, width: `${landingPct}%` }} />
                </div>
                <div className="flex justify-between mt-1 text-xs" style={{ color: 'var(--text-muted)' }}>
                  <span>BASIC: {formatCurrency(month.basic)}</span>
                  <span>PRO: {formatCurrency(month.pro)}</span>
                  {month.landing > 0 && <span style={{ color: '#3b82f6' }}>LANDING: {formatCurrency(month.landing)}</span>}
                </div>
              </div>
            );
          })}
        </div>
        <div style={{ borderColor: 'var(--border-color)' }} className="flex items-center justify-center gap-6 mt-6 pt-6 border-t flex-wrap">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-[#FF5C3A]/50" />
            <span style={{ color: 'var(--text-secondary)' }} className="text-sm">Plan BASIC</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-[#FF5C3A]" />
            <span style={{ color: 'var(--text-secondary)' }} className="text-sm">Plan PRO</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-[#3b82f6]" />
            <span style={{ color: 'var(--text-secondary)' }} className="text-sm">Landing</span>
          </div>
        </div>
      </div>
    </div>
  );
}
