'use client';

import { useEffect, useState, useCallback } from 'react';
import { formatCurrency } from '@/utils/currency';

// ── Tipos ─────────────────────────────────────────────────────────────────────

interface MonthlyRevenue {
  month: string; total: number; basic: number; pro: number; landing: number; count: number;
}
interface RevenueStats {
  monthlyRevenue: MonthlyRevenue[];
  currentMonth: { month: string; total: number; basic: number; pro: number; landing: number; paymentsCount: number };
  projection: { nextMonth: string; total: number; basic: number; pro: number; activeSubscriptions: number };
  planBreakdown: {
    basic:   { totalRevenue: number; paymentsCount: number; averagePayment: number };
    pro:     { totalRevenue: number; paymentsCount: number; averagePayment: number };
    landing: { totalRevenue: number; paymentsCount: number; averagePayment: number };
  };
}
interface CostsConfig {
  costo_vps_cop: number; costo_dominio_cop_mensual: number; costo_openrouter_por_gen_cop: number;
}
interface MetaConfig { meta_mensual_cop: number }

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatMonth(s: string) {
  const [y, m] = s.split('-');
  return new Date(parseInt(y), parseInt(m) - 1).toLocaleDateString('es-CO', { year: 'numeric', month: 'long' });
}
function pct(a: number, b: number) { return b === 0 ? 0 : Math.round((a / b) * 100); }

// ── Tarjeta KPI ───────────────────────────────────────────────────────────────

function KpiCard({ label, value, sub, color }: { label: string; value: string; sub?: string; color?: string }) {
  return (
    <div className="rounded-2xl border p-5" style={{ background: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
      <p className="text-sm mb-1" style={{ color: 'var(--text-muted)' }}>{label}</p>
      <p className="text-2xl font-bold font-syne" style={{ color: color ?? 'var(--text-primary)' }}>{value}</p>
      {sub && <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>{sub}</p>}
    </div>
  );
}

// ── Pestaña Ingresos (existente, mejorada) ────────────────────────────────────

function TabIngresos({ stats }: { stats: RevenueStats }) {
  const maxRevenue = Math.max(...stats.monthlyRevenue.map(m => m.total), 1);
  const historico =
    stats.planBreakdown.basic.totalRevenue +
    stats.planBreakdown.pro.totalRevenue +
    stats.planBreakdown.landing.totalRevenue;

  return (
    <div className="space-y-6">
      {/* KPIs resumen */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <KpiCard label="Mes actual" value={formatCurrency(stats.currentMonth.total)} sub={`${stats.currentMonth.paymentsCount} pagos`} />
        <KpiCard label="Proyección próximo mes" value={formatCurrency(stats.projection.total)} sub={`${stats.projection.activeSubscriptions} suscripciones activas`} color="#FF5C3A" />
        <KpiCard label="Total histórico" value={formatCurrency(historico)} sub={`${stats.planBreakdown.basic.paymentsCount + stats.planBreakdown.pro.paymentsCount + stats.planBreakdown.landing.paymentsCount} pagos totales`} />
      </div>

      {/* Desglose por plan */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {(['basic', 'pro', 'landing'] as const).map(planKey => {
          const planLabel = planKey === 'basic' ? 'BASIC' : planKey === 'pro' ? 'PRO' : 'LANDING';
          const data = stats.planBreakdown[planKey];
          return (
            <div key={planKey} className="rounded-2xl border p-5" style={{ background: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
              <div className="flex items-center gap-2 mb-4">
                <span className="px-2 py-0.5 rounded-full text-xs font-semibold"
                  style={planKey === 'pro'
                    ? { backgroundColor: 'rgba(255,92,58,0.12)', color: '#FF5C3A' }
                    : planKey === 'landing'
                    ? { backgroundColor: 'rgba(59,130,246,0.12)', color: '#3b82f6' }
                    : { backgroundColor: 'var(--bg-base)', color: 'var(--text-secondary)', border: '1px solid var(--border-color)' }}>
                  {planLabel}
                </span>
                <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                  {planKey === 'landing' ? 'Pago único' : planKey === 'basic' ? '$150.000/mes' : '$250.000/mes'}
                </span>
              </div>
              <div className="space-y-2.5">
                {[
                  { label: 'Ingresos totales', value: formatCurrency(data.totalRevenue), color: 'var(--text-primary)' },
                  { label: 'Número de pagos', value: String(data.paymentsCount), color: 'var(--text-primary)' },
                  { label: 'Promedio por pago', value: formatCurrency(data.averagePayment), color: 'var(--text-primary)' },
                  { label: 'Mes actual', value: formatCurrency(planKey === 'basic' ? stats.currentMonth.basic : planKey === 'pro' ? stats.currentMonth.pro : stats.currentMonth.landing), color: '#10b981' },
                  ...(planKey !== 'landing' ? [{ label: 'Proyección próx. mes', value: formatCurrency(planKey === 'basic' ? stats.projection.basic : stats.projection.pro), color: '#FF5C3A' }] : []),
                ].map(row => (
                  <div key={row.label} className="flex justify-between items-center">
                    <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>{row.label}:</span>
                    <span className="text-sm font-semibold" style={{ color: row.color }}>{row.value}</span>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Gráfico barras mensuales */}
      <div className="rounded-2xl border p-6" style={{ background: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
        <h3 className="text-base font-semibold mb-6" style={{ color: 'var(--text-primary)' }}>Ingresos mensuales (últimos 12 meses)</h3>
        <div className="space-y-4">
          {stats.monthlyRevenue.slice(-12).map(month => {
            const basicPct  = (month.basic   / maxRevenue) * 100;
            const proPct    = (month.pro     / maxRevenue) * 100;
            const landingPct = (month.landing / maxRevenue) * 100;
            return (
              <div key={month.month}>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>{formatMonth(month.month)}</span>
                  <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{formatCurrency(month.total)}</span>
                </div>
                <div className="relative h-6 rounded-full overflow-hidden" style={{ background: 'var(--bg-hover)' }}>
                  <div className="absolute top-0 left-0 h-full bg-[#FF5C3A]/50 rounded-full" style={{ width: `${basicPct}%` }} />
                  <div className="absolute top-0 h-full bg-[#FF5C3A] rounded-full" style={{ left: `${basicPct}%`, width: `${proPct}%` }} />
                  <div className="absolute top-0 h-full bg-[#3b82f6] rounded-full" style={{ left: `${basicPct + proPct}%`, width: `${landingPct}%` }} />
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
        <div className="flex items-center justify-center gap-6 mt-6 pt-6 border-t flex-wrap" style={{ borderColor: 'var(--border-color)' }}>
          {[['#FF5C3A', 50, 'Plan BASIC'], ['#FF5C3A', 100, 'Plan PRO'], ['#3b82f6', 100, 'Landing']].map(([color, op, label]) => (
            <div key={String(label)} className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: `${color}${op === 50 ? '80' : ''}` }} />
              <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>{label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Pestaña ROI / Metas ───────────────────────────────────────────────────────

function TabROI({
  stats, costs, meta, trm,
}: {
  stats: RevenueStats;
  costs: CostsConfig | null;
  meta: MetaConfig | null;
  trm: number;
}) {
  const metaCop = meta?.meta_mensual_cop ?? 1400000;
  const ingresosMes = stats.currentMonth.total;
  const pctMeta = pct(ingresosMes, metaCop);

  // Costos del mes
  const costoVps    = costs?.costo_vps_cop ?? 37000;
  const costoDom    = costs?.costo_dominio_cop_mensual ?? 5000;
  const costoGenCop = costs?.costo_openrouter_por_gen_cop ?? 25;

  // Estimación generaciones del mes: suma de clientes × generaciones promedio
  // Usamos activeSubscriptions como proxy de clientes activos
  const clientesActivos = stats.projection.activeSubscriptions;
  const genEstimadas = clientesActivos * 400; // promedio conservador
  const costoOpenRouter = genEstimadas * costoGenCop;
  const costosFijos = costoVps + costoDom;
  const costosTotales = costosFijos + costoOpenRouter;

  const margenBruto = ingresosMes - costosTotales;
  const margenPct   = ingresosMes > 0 ? Math.round((margenBruto / ingresosMes) * 100) : 0;
  const roi         = costosTotales > 0 ? Math.round(((ingresosMes - costosTotales) / costosTotales) * 100) : 0;
  const arpu        = clientesActivos > 0 ? Math.round(ingresosMes / clientesActivos) : 0;

  // Proyección 3 y 6 meses (promedio últimos 3 meses × tendencia)
  const last3 = stats.monthlyRevenue.slice(-3);
  const avg3  = last3.length ? Math.round(last3.reduce((s, m) => s + m.total, 0) / last3.length) : ingresosMes;
  const proj3 = avg3 * 3;
  const proj6 = avg3 * 6;

  // Color según % meta
  const metaColor = pctMeta >= 100 ? '#10b981' : pctMeta >= 70 ? '#f59e0b' : '#ef4444';

  // Punto de equilibrio
  const peqBasic = costosFijos > 0 ? Math.ceil(costosFijos / 150000) : 1;
  const peqPro   = costosFijos > 0 ? Math.ceil(costosFijos / 250000) : 1;

  return (
    <div className="space-y-6">

      {/* Fila 1: Meta + ROI + Margen + ARPU */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="rounded-2xl border p-5 col-span-2 md:col-span-1" style={{ background: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
          <p className="text-sm mb-2" style={{ color: 'var(--text-muted)' }}>% Meta mensual</p>
          <p className="text-3xl font-bold font-syne" style={{ color: metaColor }}>{pctMeta}%</p>
          <div className="mt-3 h-2 rounded-full overflow-hidden" style={{ background: 'var(--bg-hover)' }}>
            <div className="h-full rounded-full transition-all" style={{ width: `${Math.min(pctMeta, 100)}%`, backgroundColor: metaColor }} />
          </div>
          <p className="text-xs mt-2" style={{ color: 'var(--text-muted)' }}>
            {formatCurrency(ingresosMes)} / {formatCurrency(metaCop)}
          </p>
        </div>
        <KpiCard label="ROI mensual" value={`${roi}%`} sub="(Ingresos − Costos) / Costos" color={roi >= 0 ? '#10b981' : '#ef4444'} />
        <KpiCard label="Margen bruto" value={`${margenPct}%`} sub={formatCurrency(margenBruto)} color={margenPct >= 60 ? '#10b981' : '#f59e0b'} />
        <KpiCard label="ARPU" value={formatCurrency(arpu)} sub={`${clientesActivos} clientes activos`} />
      </div>

      {/* Costos del mes */}
      <div className="rounded-2xl border p-6" style={{ background: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
        <h3 className="text-base font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>Costos operativos estimados — mes actual</h3>
        <div className="space-y-3">
          {[
            { label: 'VPS Hostinger', valor: costoVps, tipo: 'Fijo' },
            { label: 'Dominio', valor: costoDom, tipo: 'Fijo' },
            { label: `OpenRouter (~${genEstimadas.toLocaleString('es-CO')} gen × ${formatCurrency(costoGenCop)})`, valor: costoOpenRouter, tipo: 'Variable' },
          ].map(row => (
            <div key={row.label} className="flex items-center justify-between py-2 border-b last:border-0" style={{ borderColor: 'var(--border-color)' }}>
              <div>
                <span className="text-sm" style={{ color: 'var(--text-primary)' }}>{row.label}</span>
                <span className="ml-2 text-[11px] px-1.5 py-0.5 rounded" style={{ background: row.tipo === 'Fijo' ? 'rgba(59,130,246,0.1)' : 'rgba(245,158,11,0.1)', color: row.tipo === 'Fijo' ? '#3b82f6' : '#f59e0b' }}>{row.tipo}</span>
              </div>
              <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{formatCurrency(row.valor)}</span>
            </div>
          ))}
          <div className="flex items-center justify-between pt-2">
            <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Total costos</span>
            <span className="text-base font-bold" style={{ color: '#ef4444' }}>{formatCurrency(costosTotales)}</span>
          </div>
        </div>
        <p className="text-[11px] mt-3" style={{ color: 'var(--text-muted)' }}>
          Generaciones estimadas basadas en {clientesActivos} clientes activos × 400 gen promedio. Ajusta el costo/gen en Configuración de Precios.
        </p>
      </div>

      {/* Punto de equilibrio */}
      <div className="rounded-2xl border p-6" style={{ background: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
        <h3 className="text-base font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>Punto de equilibrio (costos fijos)</h3>
        <div className="grid grid-cols-2 gap-4">
          {[
            { plan: 'Plan Básico', precio: 150000, peq: peqBasic },
            { plan: 'Plan Pro',    precio: 250000, peq: peqPro   },
          ].map(row => (
            <div key={row.plan} className="p-4 rounded-xl" style={{ background: 'var(--bg-base)' }}>
              <p className="text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>{row.plan}</p>
              <p className="text-2xl font-bold font-syne" style={{ color: 'var(--text-primary)' }}>{row.peq} <span className="text-sm font-normal" style={{ color: 'var(--text-muted)' }}>clientes</span></p>
              <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>para cubrir {formatCurrency(costosFijos)}/mes en costos fijos</p>
            </div>
          ))}
        </div>
      </div>

      {/* Proyección 3 y 6 meses */}
      <div className="rounded-2xl border p-6" style={{ background: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
        <h3 className="text-base font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>Proyección (promedio últimos 3 meses)</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 rounded-xl" style={{ background: 'var(--bg-base)' }}>
            <p className="text-xs mb-1" style={{ color: 'var(--text-muted)' }}>Promedio mensual</p>
            <p className="text-xl font-bold font-syne" style={{ color: 'var(--text-primary)' }}>{formatCurrency(avg3)}</p>
          </div>
          <div className="p-4 rounded-xl" style={{ background: 'var(--bg-base)' }}>
            <p className="text-xs mb-1" style={{ color: 'var(--text-muted)' }}>Proyección 3 meses</p>
            <p className="text-xl font-bold font-syne" style={{ color: '#FF5C3A' }}>{formatCurrency(proj3)}</p>
          </div>
          <div className="p-4 rounded-xl" style={{ background: 'var(--bg-base)' }}>
            <p className="text-xs mb-1" style={{ color: 'var(--text-muted)' }}>Proyección 6 meses</p>
            <p className="text-xl font-bold font-syne" style={{ color: '#FF5C3A' }}>{formatCurrency(proj6)}</p>
          </div>
        </div>
        <p className="text-[11px] mt-3" style={{ color: 'var(--text-muted)' }}>
          TRM de referencia: {formatCurrency(trm)} COP/USD (Superfinanciera Colombia)
        </p>
      </div>

    </div>
  );
}

// ── Página principal ──────────────────────────────────────────────────────────

export default function RevenuePage() {
  const [stats, setStats]   = useState<RevenueStats | null>(null);
  const [costs, setCosts]   = useState<CostsConfig | null>(null);
  const [meta, setMeta]     = useState<MetaConfig | null>(null);
  const [trm, setTrm]       = useState(3700);
  const [loading, setLoading] = useState(true);
  const [error, setError]   = useState('');
  const [tab, setTab]       = useState<'ingresos' | 'roi'>('ingresos');

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('adminToken');
      const apiBase = process.env.NEXT_PUBLIC_API_URL || 'https://api.pruebalo.wilkiedevs.com';
      const headers = { Authorization: `Bearer ${token}` };

      const [statsRes, pricingRes, trmRes] = await Promise.all([
        fetch(`${apiBase}/api/admin/revenue/stats`, { headers }),
        fetch('/api/pricing', { headers }),
        fetch('/api/pricing/trm'),
      ]);

      if (!statsRes.ok) throw new Error('Error al cargar estadísticas');
      const statsData = await statsRes.json();
      setStats(statsData);

      if (pricingRes.ok) {
        const pricingJson = await pricingRes.json();
        if (pricingJson.ok) {
          const rows: { id: string; data: Record<string, unknown> }[] = pricingJson.data;
          const costsRow = rows.find(r => r.id === 'costs')?.data as unknown as CostsConfig;
          const metaRow  = rows.find(r => r.id === 'meta')?.data  as unknown as MetaConfig;
          if (costsRow) setCosts(costsRow);
          if (metaRow)  setMeta(metaRow);
        }
      }

      if (trmRes.ok) {
        const trmJson = await trmRes.json();
        if (trmJson.trm) setTrm(trmJson.trm);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

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
        <p className="text-red-400 text-sm">{error}</p>
      </div>
    );
  }

  if (!stats) return null;

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-syne font-bold" style={{ color: 'var(--text-primary)' }}>Ingresos y ROI</h1>
          <p className="mt-1 text-sm" style={{ color: 'var(--text-muted)' }}>Estadísticas financieras, metas y proyecciones</p>
        </div>
        <button
          onClick={load}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-[13px] font-medium transition-colors"
          style={{ background: 'rgba(255,92,58,0.1)', color: '#FF5C3A' }}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Actualizar
        </button>
      </div>

      {/* Pestañas */}
      <div className="flex gap-1 p-1 rounded-xl w-fit" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
        {([['ingresos', 'Ingresos'], ['roi', 'ROI / Metas']] as const).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className="px-4 py-2 rounded-lg text-[13px] font-medium transition-all"
            style={{
              background: tab === key ? '#FF5C3A' : 'transparent',
              color: tab === key ? '#fff' : 'var(--text-secondary)',
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Contenido */}
      {tab === 'ingresos'
        ? <TabIngresos stats={stats} />
        : <TabROI stats={stats} costs={costs} meta={meta} trm={trm} />
      }

    </div>
  );
}
