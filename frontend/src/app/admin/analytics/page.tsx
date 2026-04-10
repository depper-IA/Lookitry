'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  BarChart3,
  Calendar,
  CheckCircle2,
  Package,
  Sparkles,
  Users,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { adminApi } from '@/services/adminApi';

interface GlobalStats {
  totalBrands: number;
  totalProducts: number;
  totalGenerations: number;
  successfulGenerations: number;
  failedGenerations: number;
  generationsThisMonth: number;
  successRate: number;
  brandsByPlan: {
    BASIC: number;
    PRO: number;
    TRIAL: number;
  };
  landingStats: {
    active: number;
    suspended: number;
    inactive: number;
  };
  generationsByMonth: {
    month: string;
    total: number;
    success: number;
    failed: number;
  }[];
}

function normalizeMonthRow(row: GlobalStats['generationsByMonth'][number]) {
  const total = Number((row as any).total ?? (row as any).count ?? 0);
  const success = Number(row.success || 0);
  const failed = Number(row.failed || Math.max(0, total - success));
  return {
    month: row.month,
    total,
    success,
    failed,
  };
}

function formatMonth(month: string) {
  const parsed = new Date(`${month}-01T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return month;
  return parsed.toLocaleDateString('es-CO', { month: 'short' });
}

function StatCard({
  title,
  value,
  icon,
  description,
}: {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  description: string;
}) {
  return (
    <div
      className="rounded-[1.6rem] border p-5"
      style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}
    >
      <div className="flex items-center justify-between">
        <div className="rounded-2xl bg-[var(--accent)]/10 p-3 text-[var(--accent)]">{icon}</div>
      </div>
      <p className="mt-4 text-[11px] font-black uppercase tracking-[0.22em]" style={{ color: 'var(--text-muted)' }}>
        {title}
      </p>
      <p className="mt-2 text-3xl font-jakarta font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>
        {value}
      </p>
      <p className="mt-2 text-sm" style={{ color: 'var(--text-secondary)' }}>
        {description}
      </p>
    </div>
  );
}

export default function AdminAnalyticsPage() {
  const [stats, setStats] = useState<GlobalStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await adminApi.get<GlobalStats>('/admin/stats');
        setStats(data);
      } catch (err: any) {
        setError(err?.message || 'Error al cargar analíticas');
        setStats(null);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  const chartRows = useMemo(
    () => (stats?.generationsByMonth || []).map(normalizeMonthRow),
    [stats]
  );
  const maxChartValue = useMemo(
    () => Math.max(1, ...chartRows.map((row) => row.total)),
    [chartRows]
  );
  const hasChartData = chartRows.some((row) => row.total > 0);

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-[var(--accent)]" />
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="flex items-center gap-3 rounded-2xl border border-red-500/25 bg-red-500/10 p-4 text-red-400">
        <AlertCircle className="h-5 w-5 flex-shrink-0" />
        <p>{error || 'No se pudieron cargar las estadísticas globales.'}</p>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className="space-y-8"
    >
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
      >
        <h1 className="text-2xl font-jakarta font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>
          Analítica global
        </h1>
        <p className="mt-1 text-sm" style={{ color: 'var(--text-secondary)' }}>
          Volumen real de uso, rendimiento de generaciones y distribución operativa del ecosistema.
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.08 }}
        className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4"
      >
        <StatCard title="Marcas" value={stats.totalBrands} icon={<Users className="h-5 w-5" />} description="Cuentas registradas en el sistema" />
        <StatCard title="Generaciones del mes" value={stats.generationsThisMonth} icon={<Sparkles className="h-5 w-5" />} description="Actividad acumulada del mes en curso" />
        <StatCard title="Tasa de éxito" value={`${stats.successRate.toFixed(1)}%`} icon={<CheckCircle2 className="h-5 w-5" />} description={`${stats.successfulGenerations.toLocaleString('es-CO')} generaciones exitosas`} />
        <StatCard title="Productos activos" value={stats.totalProducts} icon={<Package className="h-5 w-5" />} description="Catálogo activo disponible para generación" />
      </motion.div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.7fr_1fr]">
        <section
          className="rounded-[2rem] border p-6"
          style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}
        >
          <div className="mb-8 flex items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-jakarta font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>
                Uso de IA por mes
              </h2>
              <p className="mt-1 text-xs" style={{ color: 'var(--text-secondary)' }}>
                Generaciones totales y exitosas durante los últimos 6 meses.
              </p>
            </div>
            <BarChart3 className="h-5 w-5" style={{ color: 'var(--text-muted)' }} />
          </div>

          {hasChartData ? (
            <div className="space-y-5">
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
                {chartRows.map((row) => {
                  const totalHeight = Math.max(10, Math.round((row.total / maxChartValue) * 100));
                  const successHeight = row.success > 0 ? Math.max(6, Math.round((row.success / maxChartValue) * 100)) : 0;

                  return (
                    <div key={row.month} className="rounded-[1.4rem] border p-4" style={{ borderColor: 'var(--border-color)', background: 'var(--bg-base)' }}>
                      <div className="mb-4 flex items-start justify-between gap-3">
                        <div>
                          <p className="text-[10px] font-black uppercase tracking-[0.2em]" style={{ color: 'var(--text-muted)' }}>
                            {formatMonth(row.month)}
                          </p>
                          <p className="mt-2 text-2xl font-jakarta font-bold" style={{ color: 'var(--text-primary)' }}>
                            {row.total}
                          </p>
                          <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                            {row.success} exitosas · {row.failed} fallidas
                          </p>
                        </div>
                        <BarChart3 className="h-4 w-4 flex-shrink-0" style={{ color: 'var(--text-muted)' }} />
                      </div>

                      <div className="relative h-40 overflow-hidden rounded-2xl border px-3 pb-3 pt-4" style={{ borderColor: 'var(--border-color)', background: 'linear-gradient(180deg, rgba(255,255,255,0.03), rgba(255,255,255,0.01))' }}>
                        <div className="absolute inset-0 grid grid-rows-4">
                          {[0, 1, 2, 3].map((line) => (
                            <div key={line} className="border-b last:border-b-0" style={{ borderColor: 'rgba(255,255,255,0.05)' }} />
                          ))}
                        </div>
                        <div className="relative flex h-full items-end justify-center gap-3">
                          <div className="flex h-full w-12 items-end">
                            <div className="w-full rounded-t-xl bg-[#FF5C3A]/18" style={{ height: `${totalHeight}%` }} />
                          </div>
                          <div className="flex h-full w-12 items-end">
                            <div className="w-full rounded-t-xl bg-[#FF5C3A]" style={{ height: `${successHeight}%` }} />
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="flex flex-wrap items-center justify-center gap-6 text-[10px] font-black uppercase tracking-[0.2em]" style={{ color: 'var(--text-muted)' }}>
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-sm bg-[#FF5C3A]/18" />
                  <span>Total mensual</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-sm bg-[#FF5C3A]" />
                  <span>Exitosas</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex h-72 flex-col items-center justify-center rounded-[1.5rem] border border-dashed text-center" style={{ borderColor: 'var(--border-color)', background: 'var(--bg-base)' }}>
              <BarChart3 className="h-8 w-8" style={{ color: 'var(--text-muted)' }} />
              <p className="mt-4 text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                Aún no hay generaciones para graficar
              </p>
              <p className="mt-1 max-w-md text-sm" style={{ color: 'var(--text-muted)' }}>
                La tarjeta se mantendrá visible aunque el backend devuelva meses vacíos o sin actividad.
              </p>
            </div>
          )}
        </section>

        <section
          className="rounded-[2rem] border p-6"
          style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}
        >
          <h2 className="text-lg font-jakarta font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>
            Salud operativa
          </h2>

          <div className="mt-6 space-y-5">
            {[
              { label: 'Plan básico', count: stats.brandsByPlan.BASIC },
              { label: 'Plan pro', count: stats.brandsByPlan.PRO },
              { label: 'Plan trial', count: stats.brandsByPlan.TRIAL },
            ].map((row) => {
              const percent = stats.totalBrands > 0 ? (row.count / stats.totalBrands) * 100 : 0;
              return (
                <div key={row.label}>
                  <div className="flex items-center justify-between text-sm">
                    <span style={{ color: 'var(--text-secondary)' }}>{row.label}</span>
                    <span className="font-bold" style={{ color: 'var(--text-primary)' }}>{row.count}</span>
                  </div>
                  <div className="mt-2 h-2 overflow-hidden rounded-full bg-[var(--bg-hover)]">
                    <div className="h-full rounded-full bg-[#FF5C3A]" style={{ width: `${percent}%` }} />
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-3">
            {[
              { label: 'Mini-landings activas', value: stats.landingStats.active, tone: 'text-emerald-400' },
              { label: 'Suspendidas', value: stats.landingStats.suspended, tone: 'text-amber-400' },
              { label: 'Sin activar', value: stats.landingStats.inactive, tone: 'text-slate-300' },
            ].map((item) => (
              <div key={item.label} className="rounded-[1.4rem] border p-4" style={{ borderColor: 'var(--border-color)', background: 'var(--bg-base)' }}>
                <p className="text-[10px] font-black uppercase tracking-[0.2em]" style={{ color: 'var(--text-muted)' }}>
                  {item.label}
                </p>
                <p className={`mt-2 text-2xl font-jakarta font-bold ${item.tone}`}>{item.value}</p>
              </div>
            ))}
          </div>
        </section>
        </div>

      <div className="flex flex-wrap items-center justify-between gap-3 text-xs" style={{ color: 'var(--text-muted)' }}>
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4" />
          <span>Actualizado: {new Date().toLocaleString('es-CO')}</span>
        </div>
        <span>Fuente: `/api/admin/stats`</span>
      </div>
    </motion.div>
  );
}
