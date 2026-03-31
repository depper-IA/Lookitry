'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  CreditCard,
  Percent,
  RefreshCcw,
  Target,
  Users,
  Zap,
} from 'lucide-react';
import { api } from '@/services/api';

interface ActiveTrialRow {
  id: string;
  name: string;
  email: string;
  slug: string;
  plan: string;
  subscription_status: string | null;
  trial_end_date: string | null;
  created_at: string;
  trial_days_remaining: number;
}

interface ConversionStats {
  totalBrands: number;
  inTrial: number;
  paidTrials: number;
  trialRevenueCOP: number;
  trialToBasic: number;
  trialToPro: number;
  trialToEnterprise: number;
  trialToPaid: number;
  converted: number;
  conversionRate: number;
  trialRate: number;
  conversionsByMonth: {
    month: string;
    count: number;
  }[];
  activeTrials: ActiveTrialRow[];
}

function formatMonth(month: string) {
  const parsed = new Date(`${month}-01T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return month;
  return parsed.toLocaleDateString('es-CO', { month: 'short' });
}

function formatCop(value: number) {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value || 0);
}

function KpiCard({
  label,
  value,
  icon,
  accent,
  helper,
}: {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  accent?: boolean;
  helper: string;
}) {
  return (
    <div
      className="rounded-[1.6rem] border p-5"
      style={{
        background: accent ? 'rgba(255,92,58,0.08)' : 'var(--bg-card)',
        borderColor: accent ? 'rgba(255,92,58,0.18)' : 'var(--border-color)',
      }}
    >
      <div className="flex items-center justify-between">
        <div className="rounded-2xl bg-[#FF5C3A]/10 p-3 text-[#FF5C3A]">{icon}</div>
      </div>
      <p className="mt-4 text-[11px] font-black uppercase tracking-[0.22em]" style={{ color: 'var(--text-muted)' }}>
        {label}
      </p>
      <p className="mt-2 text-3xl font-jakarta font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>
        {value}
      </p>
      <p className="mt-2 text-sm" style={{ color: 'var(--text-secondary)' }}>
        {helper}
      </p>
    </div>
  );
}

export default function AdminConversionPage() {
  const [stats, setStats] = useState<ConversionStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        setError(null);
        const { data } = await api.get<ConversionStats>('/admin/stats/conversion');
        setStats(data);
      } catch (err: any) {
        setError(err?.message || 'Error al cargar conversión');
        setStats(null);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  const churnEstimate = useMemo(
    () => Math.max(0, 100 - (stats?.conversionRate || 0)),
    [stats]
  );
  const maxMonthly = useMemo(
    () => Math.max(1, ...(stats?.conversionsByMonth || []).map((row) => row.count)),
    [stats]
  );

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-[#FF5C3A]" />
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="flex items-center gap-3 rounded-2xl border border-red-500/25 bg-red-500/10 p-4 text-red-400">
        <AlertCircle className="h-5 w-5 flex-shrink-0" />
        <p>{error || 'No se pudieron cargar las métricas de conversión.'}</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-jakarta font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>
          Embudo de conversión
        </h1>
        <p className="mt-1 text-sm" style={{ color: 'var(--text-secondary)' }}>
          Trial como plan pago de entrada, más conversiones visibles a Basic, Pro y Enterprise.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <KpiCard label="Registros" value={stats.totalBrands} icon={<Users className="h-5 w-5" />} helper="Base total de marcas creadas" />
        <KpiCard label="Trials activos" value={stats.inTrial} icon={<Zap className="h-5 w-5" />} helper={`${stats.trialRate}% del total vigente`} accent />
        <KpiCard label="Trials pagados" value={stats.paidTrials} icon={<CreditCard className="h-5 w-5" />} helper={`Ingreso trial: ${formatCop(stats.trialRevenueCOP)}`} />
        <KpiCard label="Conversión" value={`${stats.conversionRate}%`} icon={<Percent className="h-5 w-5" />} helper="Marcas hoy en planes pagos distintos de TRIAL" />
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <section className="rounded-[2rem] border p-6" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-[#FF5C3A]/10 p-3 text-[#FF5C3A]">
              <Target className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-jakarta font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>
                Lectura del embudo
              </h2>
              <p className="mt-1 text-sm" style={{ color: 'var(--text-muted)' }}>
                `TRIAL` se mide como plan pago de entrada. Las subidas posteriores se separan por destino comercial.
              </p>
            </div>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-4">
            {[
              { title: 'Entrada', value: stats.totalBrands, desc: 'Cuentas creadas' },
              { title: 'Trial pagado', value: stats.paidTrials, desc: 'Pagos por prueba registrados' },
              { title: 'Trial -> pago', value: stats.trialToPaid, desc: 'Cambios desde trial a planes superiores' },
              { title: 'Pago activo', value: stats.converted, desc: 'Marcas hoy en plan pago' },
            ].map((step, index) => (
              <div
                key={step.title}
                className="rounded-[1.5rem] border p-5"
                style={{ background: index >= 2 ? 'rgba(255,92,58,0.08)' : 'var(--bg-base)', borderColor: index >= 2 ? 'rgba(255,92,58,0.18)' : 'var(--border-color)' }}
              >
                <p className="text-[10px] font-black uppercase tracking-[0.2em]" style={{ color: 'var(--text-muted)' }}>
                  {step.title}
                </p>
                <p className="mt-3 text-3xl font-jakarta font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>
                  {step.value}
                </p>
                <p className="mt-2 text-sm" style={{ color: 'var(--text-secondary)' }}>
                  {step.desc}
                </p>
              </div>
            ))}
          </div>

          <div className="mt-6 grid gap-3 md:grid-cols-4">
            <div className="rounded-[1.25rem] border p-4" style={{ borderColor: 'var(--border-color)', background: 'var(--bg-base)' }}>
              <p className="text-[10px] font-black uppercase tracking-[0.2em]" style={{ color: 'var(--text-muted)' }}>Trial {'->'} Basic</p>
              <p className="mt-2 text-2xl font-bold text-[#FF5C3A]">{stats.trialToBasic}</p>
            </div>
            <div className="rounded-[1.25rem] border p-4" style={{ borderColor: 'var(--border-color)', background: 'var(--bg-base)' }}>
              <p className="text-[10px] font-black uppercase tracking-[0.2em]" style={{ color: 'var(--text-muted)' }}>Trial {'->'} Pro</p>
              <p className="mt-2 text-2xl font-bold text-[#22c55e]">{stats.trialToPro}</p>
            </div>
            <div className="rounded-[1.25rem] border p-4" style={{ borderColor: 'var(--border-color)', background: 'var(--bg-base)' }}>
              <p className="text-[10px] font-black uppercase tracking-[0.2em]" style={{ color: 'var(--text-muted)' }}>Trial {'->'} Enterprise</p>
              <p className="mt-2 text-2xl font-bold text-[#6366f1]">{stats.trialToEnterprise}</p>
            </div>
            <div className="rounded-[1.25rem] border p-4" style={{ borderColor: 'var(--border-color)', background: 'var(--bg-base)' }}>
              <p className="text-[10px] font-black uppercase tracking-[0.2em]" style={{ color: 'var(--text-muted)' }}>Ingreso trial</p>
              <p className="mt-2 text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>{formatCop(stats.trialRevenueCOP)}</p>
            </div>
          </div>
        </section>

        <section className="rounded-[2rem] border p-6" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-[#FF5C3A]/10 p-3 text-[#FF5C3A]">
              <RefreshCcw className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-jakarta font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>
                Crecimiento mensual
              </h2>
              <p className="mt-1 text-sm" style={{ color: 'var(--text-muted)' }}>
                Conversiones desde trial durante los últimos 6 meses.
              </p>
            </div>
          </div>

          <div className="mt-8 flex h-56 items-end gap-3">
            {(stats?.conversionsByMonth || []).map((row) => {
              const height = row.count > 0 ? Math.max(8, (row.count / maxMonthly) * 100) : 0;
              return (
                <div key={row.month} className="group relative flex flex-1 flex-col items-center gap-3">
                  <div className="flex h-full w-full items-end overflow-hidden rounded-t-2xl bg-[#FF5C3A]/10">
                    <div className="w-full rounded-t-2xl bg-[#FF5C3A]" style={{ height: `${height}%` }} />
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-[0.2em]" style={{ color: 'var(--text-muted)' }}>
                    {formatMonth(row.month)}
                  </span>
                  <div className="pointer-events-none absolute -top-10 left-1/2 z-10 -translate-x-1/2 rounded-lg bg-black px-2 py-1 text-[10px] text-white opacity-0 transition-opacity group-hover:opacity-100">
                    {row.count} conversiones
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </div>

      <section className="rounded-[2rem] border p-6" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
        <div className="mb-5 flex items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-jakarta font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>
              Trials activos
            </h2>
            <p className="mt-1 text-sm" style={{ color: 'var(--text-muted)' }}>
              Lista operativa de cuentas que siguen en trial y aún no deben desaparecer del admin.
            </p>
          </div>
          <span className="rounded-full border px-3 py-1 text-xs font-bold uppercase tracking-[0.18em]" style={{ borderColor: 'var(--border-color)', color: 'var(--text-secondary)' }}>
            {(stats?.activeTrials || []).length} visibles
          </span>
        </div>

        {(!stats?.activeTrials || stats.activeTrials.length === 0) ? (
          <div className="rounded-[1.5rem] border border-dashed p-8 text-center" style={{ borderColor: 'var(--border-color)', background: 'var(--bg-base)' }}>
            <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
              No hay cuentas en trial activo
            </p>
            <p className="mt-1 text-sm" style={{ color: 'var(--text-muted)' }}>
              Cuando existan trials vigentes aparecerán aquí con su fecha de expiración y días restantes.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-sm">
              <thead>
                <tr className="border-b" style={{ borderColor: 'var(--border-color)', color: 'var(--text-muted)' }}>
                  <th className="py-3 text-left text-[11px] font-black uppercase tracking-[0.18em]">Marca</th>
                  <th className="py-3 text-left text-[11px] font-black uppercase tracking-[0.18em]">Estado</th>
                  <th className="py-3 text-left text-[11px] font-black uppercase tracking-[0.18em]">Plan</th>
                  <th className="py-3 text-left text-[11px] font-black uppercase tracking-[0.18em]">Expira</th>
                  <th className="py-3 text-left text-[11px] font-black uppercase tracking-[0.18em]">Días restantes</th>
                </tr>
              </thead>
              <tbody>
                {(stats?.activeTrials || []).map((trial) => (
                  <tr key={trial.id} className="border-b" style={{ borderColor: 'var(--border-color)' }}>
                    <td className="py-4">
                      <div className="font-semibold" style={{ color: 'var(--text-primary)' }}>{trial.name}</div>
                      <div style={{ color: 'var(--text-muted)' }}>{trial.email}</div>
                    </td>
                    <td className="py-4">
                      <span className="rounded-full bg-[#FF5C3A]/10 px-3 py-1 text-xs font-bold uppercase tracking-[0.16em] text-[#FF5C3A]">
                        {trial.subscription_status || 'active'}
                      </span>
                    </td>
                    <td className="py-4" style={{ color: 'var(--text-secondary)' }}>{trial.plan}</td>
                    <td className="py-4" style={{ color: 'var(--text-secondary)' }}>
                      {trial.trial_end_date ? new Date(trial.trial_end_date).toLocaleDateString('es-CO') : '—'}
                    </td>
                    <td className="py-4">
                      <span className="font-bold" style={{ color: trial.trial_days_remaining <= 2 ? '#f59e0b' : 'var(--text-primary)' }}>
                        {trial.trial_days_remaining}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
