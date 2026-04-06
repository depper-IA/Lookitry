'use client';

import { useEffect, useState } from 'react';
import { DollarSign, TrendingUp, BarChart3 } from 'lucide-react';
import { motion } from 'framer-motion';
import { adminApi } from '@/services/adminApi';

interface PlanEconomics {
  plan: string;
  revenue: number;
  payment_count: number;
  generations_this_month: number;
  estimated_ia_cost: number;
  margin: number;
  margin_percent: number;
  avg_revenue_per_brand: number;
}

interface EconomicsData {
  by_plan: PlanEconomics[];
  summary: {
    total_revenue: number;
    total_estimated_ia_cost: number;
    total_margin: number;
    total_margin_percent: number;
    total_generations_this_month: number;
  };
  cohorts: Array<{ month: string; brands: number; revenue: number }>;
}

function formatCOP(value: number) {
  return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(value);
}

export default function AdminUnitEconomicsPage() {
  const [data, setData] = useState<EconomicsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    adminApi.get('/admin/economics')
      .then(d => { if (d.error) throw new Error(d.message); setData(d); })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 rounded-full border-2 animate-spin" style={{ borderColor: '#FF5C3A', borderTopColor: 'transparent' }} />
    </div>
  );

  if (error) return (
    <div className="px-4 py-3 rounded-xl text-sm" style={{ backgroundColor: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: '#ef4444' }}>
      {error}
    </div>
  );

  if (!data) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className="mx-auto max-w-[1400px] space-y-6 px-4 pb-20"
    >
      {/* Hero Section */}
      <motion.section
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-[2rem] border p-6 shadow-[0_25px_60px_rgba(0,0,0,0.1)] md:p-8"
        style={{ borderColor: 'color-mix(in srgb, var(--accent) 20%, transparent)', background: 'linear-gradient(135deg,color-mix(in_srgb,var(--accent)_8%,transparent),var(--bg-card)_28%,var(--bg-card)_100%)' }}
      >
        <div className="absolute right-0 top-0 h-36 w-36 rounded-full" style={{ backgroundColor: 'color-mix(in srgb, var(--accent) 10%, transparent)', filter: 'blur(60px)' }} />
        <div className="relative">
          <div className="flex flex-wrap items-center gap-3 mb-4">
            <span className="rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-[0.24em]" style={{ borderColor: 'color-mix(in srgb, var(--accent) 20%, transparent)', backgroundColor: 'color-mix(in srgb, var(--accent) 10%, transparent)', color: 'var(--accent)' }}>
              Economia
            </span>
            <span className="rounded-full border border-[var(--border-color)] bg-[var(--bg-input)] px-3 py-1 text-[10px] font-black uppercase tracking-[0.24em]" style={{ color: 'var(--text-primary)' }}>
              {data.by_plan.length} planes
            </span>
          </div>
          <h1 className="font-bold tracking-tight text-2xl" style={{ color: 'var(--text-primary)' }}>Economia Unitaria</h1>
          <p style={{ color: 'var(--text-muted)' }} className="text-sm mt-1">
            Ingresos, costos IA y margen por plan y cohorte
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
          {[
            { label: 'Ingreso total', value: formatCOP(data.summary.total_revenue), icon: <DollarSign className="h-5 w-5" />, color: '#10b981' },
            { label: 'Costo IA estimado', value: formatCOP(data.summary.total_estimated_ia_cost), icon: <BarChart3 className="h-5 w-5" />, color: '#f59e0b' },
            { label: 'Margen total', value: formatCOP(data.summary.total_margin), icon: <TrendingUp className="h-5 w-5" />, color: data.summary.total_margin >= 0 ? '#10b981' : '#ef4444' },
            { label: 'Margen %', value: `${data.summary.total_margin_percent}%`, icon: <TrendingUp className="h-5 w-5" />, color: data.summary.total_margin_percent >= 50 ? '#10b981' : data.summary.total_margin_percent >= 0 ? '#f59e0b' : '#ef4444' },
          ].map(c => (
            <div key={c.label} className="rounded-[1.6rem] border border-[var(--border-color)] bg-[var(--bg-input)] p-5">
              <div className="flex items-center justify-between">
                <div style={{ color: c.color }}>{c.icon}</div>
              </div>
              <p className="mt-3 text-[10px] font-black uppercase tracking-[0.2em]" style={{ color: 'var(--text-muted)' }}>
                {c.label}
              </p>
              <p className="mt-1 text-2xl font-black tracking-tight" style={{ color: c.color }}>
                {c.value}
              </p>
            </div>
          ))}
        </div>
      </motion.section>

      <div className="rounded-[2rem] p-5" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
        <h2 className="font-jakarta font-bold text-sm mb-5" style={{ color: 'var(--text-primary)' }}>Por Plan</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                {['Plan', 'Ingreso', 'Pagos', 'Gen/mes', 'Costo IA', 'Margen', 'Margen %', 'Ingreso/marca'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.by_plan.map(row => (
                <tr key={row.plan} style={{ borderTop: '1px solid var(--border-color)' }}>
                  <td className="px-4 py-3 font-semibold" style={{ color: row.plan === 'PRO' ? '#FF5C3A' : 'var(--text-primary)' }}>{row.plan}</td>
                  <td className="px-4 py-3 font-mono" style={{ color: 'var(--text-primary)' }}>{formatCOP(row.revenue)}</td>
                  <td className="px-4 py-3" style={{ color: 'var(--text-secondary)' }}>{row.payment_count}</td>
                  <td className="px-4 py-3 font-mono" style={{ color: 'var(--text-secondary)' }}>{row.generations_this_month}</td>
                  <td className="px-4 py-3 font-mono" style={{ color: '#f59e0b' }}>{formatCOP(row.estimated_ia_cost)}</td>
                  <td className="px-4 py-3 font-mono font-semibold" style={{ color: row.margin >= 0 ? '#10b981' : '#ef4444' }}>{formatCOP(row.margin)}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${row.margin_percent >= 50 ? 'bg-emerald-500/15 text-emerald-500' : row.margin_percent >= 0 ? 'bg-amber-500/15 text-amber-500' : 'bg-red-500/15 text-red-500'}`}>
                      {row.margin_percent}%
                    </span>
                  </td>
                  <td className="px-4 py-3 font-mono" style={{ color: 'var(--text-secondary)' }}>{formatCOP(row.avg_revenue_per_brand)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {data.cohorts.length > 0 && (
        <div className="rounded-[2rem] p-5" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
          <h2 className="font-jakarta font-bold text-sm mb-5" style={{ color: 'var(--text-primary)' }}>Cohortes de ingreso</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                  {['Cohorte', 'Marcas', 'Ingreso total'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[...data.cohorts].reverse().map(cohort => (
                  <tr key={cohort.month} style={{ borderTop: '1px solid var(--border-color)' }}>
                    <td className="px-4 py-3 font-mono" style={{ color: 'var(--text-primary)' }}>{cohort.month}</td>
                    <td className="px-4 py-3" style={{ color: 'var(--text-secondary)' }}>{cohort.brands}</td>
                    <td className="px-4 py-3 font-mono font-semibold" style={{ color: '#10b981' }}>{formatCOP(cohort.revenue)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </motion.div>
  );
}
