'use client';

import { useEffect, useState, useCallback } from 'react';
import { formatCurrency } from '@/utils/currency';
import { motion } from 'framer-motion';
import { adminApi } from '@/services/adminApi';

// ── Tipos ─────────────────────────────────────────────────────────────────────

interface MonthlyRevenue {
  month: string; total: number; basic: number; pro: number; landing: number; count: number;
}
interface RevenueStats {
  monthlyRevenue: MonthlyRevenue[];
  currentMonth: { month: string; total: number; basic: number; pro: number; landing: number; paymentsCount: number };
  projection: { 
    nextMonth: string; total: number; basic: number; pro: number; 
    activeSubscriptions: number;
    activeLandings: number;
  };
  planBreakdown: {
    basic:   { totalRevenue: number; paymentsCount: number; averagePayment: number };
    pro:     { totalRevenue: number; paymentsCount: number; averagePayment: number };
    landing: { totalRevenue: number; paymentsCount: number; averagePayment: number };
  };
}
interface CostsConfig {
  costo_vps_cop: number;
  costo_dominio_cop_mensual: number;
  costo_openrouter_por_gen_cop: number;
  notas?: string;
}
interface MetaConfig {
  gastos_personales_cop: number;
  meta_ingreso_cop: number;
  trm_referencia?: number;
  trm_auto?: boolean;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatMonth(s: string) {
  const [y, m] = s.split('-');
  return new Date(parseInt(y), parseInt(m) - 1).toLocaleDateString('es-CO', { year: 'numeric', month: 'long' });
}
function pct(a: number, b: number) { return b === 0 ? 0 : Math.round((a / b) * 100); }

// ── Tarjeta KPI ───────────────────────────────────────────────────────────────

function KpiCard({ label, value, sub, color }: { label: string; value: string; sub?: string; color?: string }) {
  return (
    <div className="rounded-[2rem] border p-5" style={{ background: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
      <p className="text-sm mb-1" style={{ color: 'var(--text-muted)' }}>{label}</p>
      <p className="text-2xl font-bold font-jakarta" style={{ color: color ?? 'var(--text-primary)' }}>{value}</p>
      {sub && <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>{sub}</p>}
    </div>
  );
}

// ── Barra de progreso ─────────────────────────────────────────────────────────

function ProgressBar({ value, max, color }: { value: number; max: number; color: string }) {
  const w = max > 0 ? Math.min(Math.round((value / max) * 100), 100) : 0;
  return (
    <div className="h-2 rounded-full overflow-hidden" style={{ background: 'var(--border-color)' }}>
      <div className="h-full rounded-full transition-all duration-500" style={{ width: `${w}%`, backgroundColor: color }} />
    </div>
  );
}

// ── Fila de costo ─────────────────────────────────────────────────────────────

function CostRow({ label, valor, tipo, sub }: { label: string; valor: number; tipo: 'Fijo' | 'Variable'; sub?: string }) {
  return (
    <div className="flex items-center justify-between py-2.5 border-b last:border-0" style={{ borderColor: 'var(--border-color)' }}>
      <div>
        <div className="flex items-center gap-2">
          <span className="text-sm" style={{ color: 'var(--text-primary)' }}>{label}</span>
          <span className="text-[11px] px-1.5 py-0.5 rounded font-medium"
            style={tipo === 'Fijo'
              ? { background: 'rgba(59,130,246,0.1)', color: '#3b82f6' }
              : { background: 'rgba(245,158,11,0.1)', color: '#f59e0b' }}>
            {tipo}
          </span>
        </div>
        {sub && <p className="text-[11px] mt-0.5" style={{ color: 'var(--text-muted)' }}>{sub}</p>}
      </div>
      <span className="text-sm font-semibold tabular-nums" style={{ color: 'var(--text-primary)' }}>{formatCurrency(valor)}</span>
    </div>
  );
}

// ── Campo editable ────────────────────────────────────────────────────────────

function Field({
  label, value, onChange, type = 'text', prefix, suffix, hint, disabled,
}: {
  label: string; value: string | number; onChange: (v: string) => void;
  type?: 'text' | 'number'; prefix?: string; suffix?: string; hint?: string; disabled?: boolean;
}) {
  return (
    <div>
      <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>{label}</label>
      <div className="flex items-center gap-1.5">
        {prefix && <span className="text-sm flex-shrink-0" style={{ color: 'var(--text-muted)' }}>{prefix}</span>}
        <input
          type={type} value={value} disabled={disabled}
          onChange={e => onChange(e.target.value)}
          className="w-full px-3 py-2 rounded-lg text-sm border outline-none focus:ring-2 focus:ring-[#FF5C3A]/40 transition-opacity"
          style={{ background: 'var(--bg-base)', borderColor: 'var(--border-color)', color: 'var(--text-primary)', opacity: disabled ? 0.45 : 1 }}
        />
        {suffix && <span className="text-sm flex-shrink-0" style={{ color: 'var(--text-muted)' }}>{suffix}</span>}
      </div>
      {hint && <p className="text-[11px] mt-1" style={{ color: 'var(--text-muted)' }}>{hint}</p>}
    </div>
  );
}

// ── Tarjeta clientes necesarios ───────────────────────────────────────────────

function ClientesCard({
  planLabel, precio, clientesParaCostos, clientesParaMeta, clientesActuales, color,
}: {
  planLabel: string; precio: number; clientesParaCostos: number;
  clientesParaMeta: number; clientesActuales: number; color: string;
}) {
  const pctCostos  = Math.min(Math.round((clientesActuales / clientesParaCostos) * 100), 100);
  const pctMetaVal = Math.min(Math.round((clientesActuales / clientesParaMeta)   * 100), 100);
  const colorCostos = pctCostos  >= 100 ? '#10b981' : pctCostos  >= 60 ? '#f59e0b' : '#ef4444';
  const colorMeta   = pctMetaVal >= 100 ? '#10b981' : pctMetaVal >= 60 ? '#f59e0b' : '#ef4444';

  return (
    <div className="rounded-[2rem] border p-5" style={{ background: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
      <div className="flex items-center justify-between mb-4">
        <span className="text-sm font-semibold px-2.5 py-1 rounded-full"
          style={{ background: `${color}18`, color }}>{planLabel}</span>
        <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{formatCurrency(precio)}/mes</span>
      </div>
      <div className="text-center mb-5 py-3 rounded-xl" style={{ background: 'var(--bg-base)' }}>
        <p className="text-3xl font-bold font-jakarta" style={{ color: 'var(--text-primary)' }}>{clientesActuales}</p>
        <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>clientes activos ahora</p>
      </div>
      <div className="mb-4">
        <div className="flex justify-between items-center mb-1.5">
          <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>Para cubrir costos</span>
          <span className="text-xs font-semibold" style={{ color: colorCostos }}>{clientesActuales} / {clientesParaCostos}</span>
        </div>
        <ProgressBar value={clientesActuales} max={clientesParaCostos} color={colorCostos} />
        {clientesActuales < clientesParaCostos
          ? <p className="text-[11px] mt-1" style={{ color: '#ef4444' }}>Faltan {clientesParaCostos - clientesActuales} clientes para no perder dinero</p>
          : <p className="text-[11px] mt-1" style={{ color: '#10b981' }}>Costos cubiertos</p>
        }
      </div>
      <div>
        <div className="flex justify-between items-center mb-1.5">
          <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>Para alcanzar meta</span>
          <span className="text-xs font-semibold" style={{ color: colorMeta }}>{clientesActuales} / {clientesParaMeta}</span>
        </div>
        <ProgressBar value={clientesActuales} max={clientesParaMeta} color={colorMeta} />
        {clientesActuales < clientesParaMeta
          ? <p className="text-[11px] mt-1" style={{ color: 'var(--text-muted)' }}>Faltan {clientesParaMeta - clientesActuales} clientes para cumplir la meta</p>
          : <p className="text-[11px] mt-1" style={{ color: '#10b981' }}>Meta alcanzada con este plan</p>
        }
      </div>
    </div>
  );
}

// ── Pestaña Configuración ─────────────────────────────────────────────────────

function TabConfig({
  costs, meta, trm, trmAuto, trmLive, saving, saved,
  onSaveCosts, onSaveMeta, onSaveTrm,
  onCostsChange, onMetaChange, onTrmChange, onTrmAutoChange,
}: {
  costs: CostsConfig; meta: MetaConfig; trm: number; trmAuto: boolean; trmLive: number;
  saving: string | null; saved: string | null;
  onSaveCosts: () => void; onSaveMeta: () => void; onSaveTrm: () => void;
  onCostsChange: (c: CostsConfig) => void; onMetaChange: (m: MetaConfig) => void;
  onTrmChange: (v: number) => void; onTrmAutoChange: (v: boolean) => void;
}) {
  return (
    <div className="space-y-6 max-w-2xl">

      {/* Costos operativos */}
      <div className="rounded-2xl border p-6 space-y-5" style={{ background: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
        <div>
          <h3 className="text-base font-semibold" style={{ color: 'var(--text-primary)' }}>Costos operativos del negocio</h3>
          <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
            Gastos fijos y variables del servicio. Se usan para calcular el ROI y el margen.
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field
            label="VPS Hostinger (COP/mes)" type="number" prefix="$"
            value={costs.costo_vps_cop}
            onChange={v => onCostsChange({ ...costs, costo_vps_cop: Number(v) })}
          />
          <Field
            label="Dominio (COP/mes)" type="number" prefix="$"
            value={costs.costo_dominio_cop_mensual}
            onChange={v => onCostsChange({ ...costs, costo_dominio_cop_mensual: Number(v) })}
          />
          <Field
            label="Costo por generación IA (COP)" type="number" prefix="$"
            value={costs.costo_openrouter_por_gen_cop}
            onChange={v => onCostsChange({ ...costs, costo_openrouter_por_gen_cop: Number(v) })}
            hint="Se multiplica por clientes × 400 gen/mes estimadas"
          />
          <Field
            label="Notas (opcional)"
            value={costs.notas ?? ''}
            onChange={v => onCostsChange({ ...costs, notas: v })}
          />
        </div>
        <div className="flex justify-end">
          <button
            onClick={onSaveCosts} disabled={saving === 'costs'}
            className="px-4 py-2 rounded-2xl text-sm font-black uppercase tracking-widest transition-all"
            style={{ background: saved === 'costs' ? '#10b981' : '#FF5C3A', color: '#fff', opacity: saving === 'costs' ? 0.7 : 1 }}
          >
            {saving === 'costs' ? 'Guardando...' : saved === 'costs' ? 'Guardado' : 'Guardar costos'}
          </button>
        </div>
      </div>

      {/* Metas financieras */}
      <div className="rounded-2xl border p-6 space-y-5" style={{ background: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
        <div>
          <h3 className="text-base font-semibold" style={{ color: 'var(--text-primary)' }}>Metas financieras</h3>
          <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
            Define cuánto necesitas ganar y cuánto gastas en tu vida personal.
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field
            label="Meta de ingreso mensual (COP)" type="number" prefix="$"
            value={meta.meta_ingreso_cop}
            onChange={v => onMetaChange({ ...meta, meta_ingreso_cop: Number(v) })}
            hint="Lo que quieres facturar en total cada mes"
          />
          <Field
            label="Gastos personales / costo de vida (COP)" type="number" prefix="$"
            value={meta.gastos_personales_cop}
            onChange={v => onMetaChange({ ...meta, gastos_personales_cop: Number(v) })}
            hint="Alquiler, comida, servicios y otros gastos personales"
          />
        </div>
        <div className="flex justify-end">
          <button
            onClick={onSaveMeta} disabled={saving === 'meta_financiera'}
            className="px-4 py-2 rounded-2xl text-sm font-black uppercase tracking-widest transition-all"
            style={{ background: saved === 'meta_financiera' ? '#10b981' : '#FF5C3A', color: '#fff', opacity: saving === 'meta_financiera' ? 0.7 : 1 }}
          >
            {saving === 'meta_financiera' ? 'Guardando...' : saved === 'meta_financiera' ? 'Guardado' : 'Guardar metas'}
          </button>
        </div>
      </div>

      {/* TRM */}
      <div className="rounded-2xl border p-6 space-y-5" style={{ background: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
        <div>
          <h3 className="text-base font-semibold" style={{ color: 'var(--text-primary)' }}>TRM — Tasa de cambio COP/USD</h3>
          <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
            Se usa para mostrar precios en USD en la landing y en los cálculos de planes.
          </p>
        </div>
        <div className="flex items-center justify-between p-3 rounded-xl" style={{ background: 'var(--bg-base)' }}>
          <div>
            <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>TRM automática (Superfinanciera)</p>
            <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
              Valor actual: <strong style={{ color: '#FF5C3A' }}>{trmLive.toLocaleString('es-CO')}</strong>
            </p>
          </div>
          <button
            onClick={() => onTrmAutoChange(!trmAuto)}
            className="relative inline-flex h-6 w-11 items-center rounded-full transition-colors"
            style={{ background: trmAuto ? '#FF5C3A' : 'var(--border-color)' }}
          >
            <span
              className="inline-block h-4 w-4 transform rounded-full bg-white transition-transform"
              style={{ transform: trmAuto ? 'translateX(22px)' : 'translateX(2px)' }}
            />
          </button>
        </div>
        <Field
          label="TRM manual (COP por 1 USD)" type="number"
          value={trm}
          onChange={v => onTrmChange(Number(v))}
          disabled={trmAuto}
          hint={trmAuto ? 'Desactiva la TRM automática para editar manualmente' : undefined}
        />
        <div className="flex justify-end">
          <button
            onClick={onSaveTrm} disabled={saving === 'trm'}
            className="px-4 py-2 rounded-2xl text-sm font-black uppercase tracking-widest transition-all"
            style={{ background: saved === 'trm' ? '#10b981' : '#FF5C3A', color: '#fff', opacity: saving === 'trm' ? 0.7 : 1 }}
          >
            {saving === 'trm' ? 'Guardando...' : saved === 'trm' ? 'Guardado' : 'Guardar TRM'}
          </button>
        </div>
      </div>

    </div>
  );
}

// ── Pestaña Ingresos ──────────────────────────────────────────────────────────

function TabIngresos({ stats, basicPrecio, proPrecio, landingPrecio }: {
  stats: RevenueStats; basicPrecio: number; proPrecio: number; landingPrecio: number;
}) {
  const maxRevenue = Math.max(...stats.monthlyRevenue.map(m => m.total), 1);
  const historico =
    stats.planBreakdown.basic.totalRevenue +
    stats.planBreakdown.pro.totalRevenue +
    stats.planBreakdown.landing.totalRevenue;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard label="Mes actual" value={formatCurrency(stats.currentMonth.total)} sub={`${stats.currentMonth.paymentsCount} pagos`} />
        <KpiCard label="Proyección próximo mes" value={formatCurrency(stats.projection.total)} sub={`${stats.projection.activeSubscriptions} suscripciones activas`} color="#FF5C3A" />
        <KpiCard label="Landings activas" value={String(stats.projection.activeLandings)} sub="Total de landings publicadas" color="#10b981" />
        <KpiCard label="Total histórico" value={formatCurrency(historico)} sub={`${stats.planBreakdown.basic.paymentsCount + stats.planBreakdown.pro.paymentsCount + stats.planBreakdown.landing.paymentsCount} pagos totales`} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {(['basic', 'pro', 'landing'] as const).map(planKey => {
          const planLabel = planKey === 'basic' ? 'BASIC' : planKey === 'pro' ? 'PRO' : 'LANDING';
          const data = stats.planBreakdown[planKey];
          // Colores diferenciales: BASIC (Azul #3b82f6), PRO (Púrpura #8b5cf6), LANDING (Verde #10b981)
          const planColor = planKey === 'basic' ? '#3b82f6' : planKey === 'pro' ? '#8b5cf6' : '#10b981';
          const planBg    = planKey === 'basic' ? 'rgba(59,130,246,0.12)' : planKey === 'pro' ? 'rgba(139,92,246,0.12)' : 'rgba(16,185,129,0.12)';
          
          return (
            <div key={planKey} className="rounded-2xl border p-5" style={{ background: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
              <div className="flex items-center gap-2 mb-4">
                <span className="px-2 py-0.5 rounded-full text-xs font-semibold"
                  style={{ backgroundColor: planBg, color: planColor }}>
                  {planLabel}
                </span>
                <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                  {planKey === 'landing' ? 'Pago único' : planKey === 'basic' ? formatCurrency(basicPrecio) + '/mes' : formatCurrency(proPrecio) + '/mes'}
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

      <div className="rounded-[2rem] border p-6" style={{ background: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
        <h3 className="text-base font-jakarta font-bold tracking-tight mb-6" style={{ color: 'var(--text-primary)' }}>Ingresos mensuales (últimos 12 meses)</h3>
        <div className="space-y-4">
          {stats.monthlyRevenue.slice(-12).map(month => {
            const basicPct   = (month.basic   / maxRevenue) * 100;
            const proPct     = (month.pro     / maxRevenue) * 100;
            const landingPct = (month.landing / maxRevenue) * 100;
            return (
              <div key={month.month}>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>{formatMonth(month.month)}</span>
                  <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{formatCurrency(month.total)}</span>
                </div>
                <div className="relative h-6 rounded-full overflow-hidden" style={{ background: 'var(--border-color)' }}>
                  {/* Colores diferenciales en la barra: BASIC (Azul), PRO (Púrpura), LANDING (Verde) */}
                  <div className="absolute top-0 left-0 h-full bg-[#3b82f6] rounded-l-full" style={{ width: `${basicPct}%` }} />
                  <div className="absolute top-0 h-full bg-[#8b5cf6]" style={{ left: `${basicPct}%`, width: `${proPct}%` }} />
                  <div className="absolute top-0 h-full bg-[#10b981] rounded-r-full" style={{ left: `${basicPct + proPct}%`, width: `${landingPct}%` }} />
                </div>
                <div className="flex justify-between mt-1 text-xs" style={{ color: 'var(--text-muted)' }}>
                  <span style={{ color: '#3b82f6' }}>BASIC: {formatCurrency(month.basic)}</span>
                  <span style={{ color: '#8b5cf6' }}>PRO: {formatCurrency(month.pro)}</span>
                  {month.landing > 0 && <span style={{ color: '#10b981' }}>LANDING: {formatCurrency(month.landing)}</span>}
                </div>
              </div>
            );
          })}
        </div>
        <div className="flex items-center justify-center gap-6 mt-6 pt-6 border-t flex-wrap" style={{ borderColor: 'var(--border-color)' }}>
          {[
            ['#3b82f6', 'Plan BASIC'], 
            ['#8b5cf6', 'Plan PRO'], 
            ['#10b981', 'Landing']
          ].map(([color, label]) => (
            <div key={label} className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: color }} />
              <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>{label}</span>
            </div>
          ))}
        </div>
      </div>

      <span className="hidden">{landingPrecio}</span>
    </div>
  );
}

// ── Pestaña ROI / Metas ───────────────────────────────────────────────────────

function TabROI({
  stats, costs, meta, trm, basicPrecio, proPrecio, onGoToConfig,
}: {
  stats: RevenueStats;
  costs: CostsConfig | null;
  meta: MetaConfig | null;
  trm: number;
  basicPrecio: number;
  proPrecio: number;
  onGoToConfig: () => void;
}) {
  const metaCop         = meta?.meta_ingreso_cop ?? 2000000;
  const gastosPers      = meta?.gastos_personales_cop ?? 1400000;
  const ingresosMes     = stats.currentMonth.total;
  const clientesActivos = stats.projection.activeSubscriptions;

  const costoVps    = costs?.costo_vps_cop ?? 37000;
  const costoDom    = costs?.costo_dominio_cop_mensual ?? 5000;
  const costoGenCop = costs?.costo_openrouter_por_gen_cop ?? 25;

  const genEstimadas    = clientesActivos * 400;
  const costoOpenRouter = genEstimadas * costoGenCop;
  const costosFijos     = costoVps + costoDom;
  const costosOperativos = costosFijos + costoOpenRouter;

  const totalNecesario = costosOperativos + gastosPers;
  const gananciaReal   = ingresosMes - totalNecesario;
  const margenPct      = ingresosMes > 0 ? Math.round(((ingresosMes - costosOperativos) / ingresosMes) * 100) : 0;
  const roi            = costosOperativos > 0 ? Math.round(((ingresosMes - costosOperativos) / costosOperativos) * 100) : 0;
  const brechaVsMeta   = metaCop - ingresosMes;

  const peqBasicReal      = Math.ceil(totalNecesario / basicPrecio);
  const peqProReal        = Math.ceil(totalNecesario / proPrecio);
  const clientesMetaBasic = Math.ceil(metaCop / basicPrecio);
  const clientesMetaPro   = Math.ceil(metaCop / proPrecio);

  const pctMeta     = pct(ingresosMes, metaCop);
  const metaColor   = pctMeta >= 100 ? '#10b981' : pctMeta >= 70 ? '#f59e0b' : '#ef4444';
  const roiColor    = roi >= 0 ? '#10b981' : '#ef4444';
  const margenColor = margenPct >= 60 ? '#10b981' : margenPct >= 30 ? '#f59e0b' : '#ef4444';

  const last3 = stats.monthlyRevenue.slice(-3);
  const avg3  = last3.length ? Math.round(last3.reduce((s, m) => s + m.total, 0) / last3.length) : ingresosMes;

  return (
    <div className="space-y-6">

      {/* 1. Estado actual vs meta */}
      <div className="rounded-[2rem] border p-6" style={{ background: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
        <h3 className="text-base font-jakarta font-bold tracking-tight mb-5" style={{ color: 'var(--text-primary)' }}>Estado actual vs meta mensual</h3>
        <div className="mb-4">
          <div className="flex justify-between items-end mb-2">
            <div>
              <span className="text-3xl font-bold font-jakarta" style={{ color: metaColor }}>{pctMeta}%</span>
              <span className="text-sm ml-2" style={{ color: 'var(--text-muted)' }}>de la meta alcanzada</span>
            </div>
            <span className="text-sm" style={{ color: 'var(--text-muted)' }}>Objetivo: {formatCurrency(metaCop)}</span>
          </div>
          <div className="h-4 rounded-full overflow-hidden" style={{ background: 'var(--bg-base)' }}>
            <div className="h-full rounded-full transition-all duration-500"
              style={{ width: `${Math.min(pctMeta, 100)}%`, backgroundColor: metaColor }} />
          </div>
          <div className="flex justify-between mt-2 text-xs" style={{ color: 'var(--text-muted)' }}>
            <span>Facturación este mes: <strong style={{ color: 'var(--text-primary)' }}>{formatCurrency(ingresosMes)}</strong></span>
            {brechaVsMeta > 0
              ? <span style={{ color: '#ef4444' }}>Faltan {formatCurrency(brechaVsMeta)} para el objetivo</span>
              : <span style={{ color: '#10b981' }}>¡Objetivo superado en {formatCurrency(Math.abs(brechaVsMeta))}!</span>
            }
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-5 pt-5 border-t" style={{ borderColor: 'var(--border-color)' }}>
          {[
            { label: 'Ingresos brutos', value: formatCurrency(ingresosMes), color: 'var(--text-primary)' },
            { label: 'Costos + Vida',  value: formatCurrency(totalNecesario), color: '#ef4444' },
            { label: 'Ganancia neta',    value: formatCurrency(gananciaReal), color: gananciaReal >= 0 ? '#10b981' : '#ef4444' },
            { label: 'ROI operativo',   value: `${roi}%`, color: roiColor },
          ].map(item => (
            <div key={item.label} className="text-center">
              <p className="text-[11px] mb-1" style={{ color: 'var(--text-muted)' }}>{item.label}</p>
              <p className="text-lg font-bold font-jakarta" style={{ color: item.color }}>{item.value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* 2. Desglose de gastos */}
      <div className="rounded-[2rem] border p-6" style={{ background: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-jakarta font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>Desglose de gastos y punto de equilibrio</h3>
          <button
            onClick={onGoToConfig}
            className="text-xs font-medium px-3 py-1 rounded-lg border border-[#FF5C3A]/30 hover:bg-[#FF5C3A]/5 transition-colors"
            style={{ color: '#FF5C3A' }}
          >
            Ajustar costos →
          </button>
        </div>
        <p className="text-[11px] font-semibold uppercase tracking-wide mb-2" style={{ color: 'var(--text-muted)' }}>
          Costos operativos (Infraestructura)
        </p>
        <CostRow label="Servidor VPS" valor={costoVps} tipo="Fijo" />
        <CostRow label="Dominio y SSL" valor={costoDom} tipo="Fijo" />
        <CostRow
          label="API IA (OpenRouter)" valor={costoOpenRouter} tipo="Variable"
          sub={`${clientesActivos} clientes × 400 usos × ${formatCurrency(costoGenCop)}/uso`}
        />
        <div className="flex justify-between text-sm font-medium py-2 mb-4" style={{ color: 'var(--text-secondary)' }}>
          <span>Subtotal operativo mensual</span>
          <span style={{ color: 'var(--text-primary)' }}>{formatCurrency(costosOperativos)}</span>
        </div>
        <p className="text-[11px] font-semibold uppercase tracking-wide mb-2" style={{ color: 'var(--text-muted)' }}>
          Gastos personales (Costo de vida)
        </p>
        <CostRow
          label="Alquiler, alimentación, salud, etc." valor={gastosPers} tipo="Fijo"
          sub="Lo que necesitas retirar del negocio para vivir"
        />
        <div className="mt-4 pt-4 border-t space-y-2" style={{ borderColor: 'var(--border-color)' }}>
          <div className="flex justify-between text-sm">
            <span style={{ color: 'var(--text-secondary)' }}>Mantenimiento del negocio</span>
            <span className="font-medium" style={{ color: 'var(--text-primary)' }}>{formatCurrency(costosOperativos)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span style={{ color: 'var(--text-secondary)' }}>Costo de vida personal</span>
            <span className="font-medium" style={{ color: 'var(--text-primary)' }}>{formatCurrency(gastosPers)}</span>
          </div>
          <div className="flex justify-between text-base font-bold pt-2 border-t" style={{ borderColor: 'var(--border-color)' }}>
            <span style={{ color: 'var(--text-primary)' }}>Punto de equilibrio mensual</span>
            <span style={{ color: '#ef4444' }}>{formatCurrency(totalNecesario)}</span>
          </div>
          <div className="flex justify-between text-lg font-bold">
            <span style={{ color: 'var(--text-primary)' }}>Excedente real (Neto)</span>
            <span style={{ color: gananciaReal >= 0 ? '#10b981' : '#ef4444' }}>{formatCurrency(gananciaReal)}</span>
          </div>
        </div>
        <div className="mt-4 p-3 rounded-xl flex items-center justify-between" style={{ background: 'var(--bg-base)' }}>
          <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>Margen de beneficio operativo</span>
          <span className="text-lg font-bold font-jakarta" style={{ color: margenColor }}>{margenPct}%</span>
        </div>
      </div>

      {/* 3. Clientes necesarios */}
      <div>
        <div className="mb-4">
          <h3 className="text-base font-semibold" style={{ color: 'var(--text-primary)' }}>Hitos de crecimiento</h3>
          <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
            Cálculo de volumen necesario para alcanzar la sostenibilidad y los objetivos de facturación.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <ClientesCard
            planLabel="Plan Básico" precio={basicPrecio}
            clientesParaCostos={peqBasicReal} clientesParaMeta={clientesMetaBasic}
            clientesActuales={clientesActivos} color="#3b82f6"
          />
          <ClientesCard
            planLabel="Plan Pro" precio={proPrecio}
            clientesParaCostos={peqProReal} clientesParaMeta={clientesMetaPro}
            clientesActuales={clientesActivos} color="#8b5cf6"
          />
        </div>
        <p className="text-[11px] mt-3" style={{ color: 'var(--text-muted)' }}>
          Basado en {clientesActivos} clientes con suscripción activa. El análisis asume una composición de cartera uniforme por plan.
        </p>
      </div>

      {/* 4. Proyección */}
      <div className="rounded-[2rem] border p-6" style={{ background: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
        <h3 className="text-base font-jakarta font-bold tracking-tight mb-4" style={{ color: 'var(--text-primary)' }}>
          Resumen histórico y Proyecciones
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 rounded-xl" style={{ background: 'var(--bg-base)' }}>
            <p className="text-xs mb-1" style={{ color: 'var(--text-muted)' }}>Media de ingresos (3 meses)</p>
            <p className="text-xl font-bold font-jakarta" style={{ color: 'var(--text-primary)' }}>{formatCurrency(avg3)}</p>
            <p className="text-[11px] mt-1" style={{ color: 'var(--text-muted)' }}>{pct(avg3, metaCop)}% del objetivo mensual</p>
          </div>
          <div className="p-4 rounded-xl" style={{ background: 'var(--bg-base)' }}>
            <p className="text-xs mb-1" style={{ color: 'var(--text-muted)' }}>Neto proyectado/mes</p>
            <p className="text-xl font-bold font-jakarta" style={{ color: (avg3 - totalNecesario) >= 0 ? '#10b981' : '#ef4444' }}>
              {formatCurrency(avg3 - totalNecesario)}
            </p>
            <p className="text-[11px] mt-1" style={{ color: 'var(--text-muted)' }}>Después de cubrir {formatCurrency(totalNecesario)}</p>
          </div>
          <div className="p-4 rounded-xl" style={{ background: 'var(--bg-base)' }}>
            <p className="text-xs mb-1" style={{ color: 'var(--text-muted)' }}>Tasa TRM aplicada</p>
            <p className="text-xl font-bold font-jakarta" style={{ color: 'var(--text-primary)' }}>{trm.toLocaleString('es-CO')}</p>
            <p className="text-[11px] mt-1" style={{ color: 'var(--text-muted)' }}>COP/USD — Referencia Superfinanciera</p>
          </div>
        </div>
      </div>

    </div>
  );
}

// ── Página principal ──────────────────────────────────────────────────────────

export default function RevenuePage() {
  const [stats, setStats]     = useState<RevenueStats | null>(null);
  const [costs, setCosts]     = useState<CostsConfig | null>(null);
  const [meta, setMeta]       = useState<MetaConfig | null>(null);
  const [trm, setTrm]         = useState(3700);
  const [trmLive, setTrmLive] = useState(3700);
  const [basicPrecio, setBasicPrecio]     = useState(150000);
  const [proPrecio, setProPrecio]         = useState(250000);
  const [landingPrecio, setLandingPrecio] = useState(650000);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState('');
  const [tab, setTab]         = useState<'ingresos' | 'roi' | 'config'>('ingresos');

  // Estados de edición para TabConfig (separados para no romper cálculos mientras se edita)
  const [costsEdit, setCostsEdit]     = useState<CostsConfig>({ costo_vps_cop: 37000, costo_dominio_cop_mensual: 5000, costo_openrouter_por_gen_cop: 25 });
  const [metaEdit, setMetaEdit]       = useState<MetaConfig>({ gastos_personales_cop: 1400000, meta_ingreso_cop: 2000000 });
  const [trmEdit, setTrmEdit]         = useState(3700);
  const [trmAutoEdit, setTrmAutoEdit] = useState(true);
  const [saving, setSaving]   = useState<string | null>(null);
  const [saved, setSaved]     = useState<string | null>(null);

  const handleSave = useCallback(async (id: string, data: Record<string, unknown>) => {
    setSaving(id);
    try {
      const apiBase = process.env.NEXT_PUBLIC_API_URL || 'https://api.lookitry.com';
      const res = await fetch(`${apiBase}/api/admin/pricing`, {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, data }),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) throw new Error(json.message || json.error || 'Error al guardar');
      // Actualizar estados del dashboard con los valores guardados
      if (id === 'costs') setCosts(data as unknown as CostsConfig);
      if (id === 'meta') {
        const m = data as unknown as MetaConfig;
        setMeta(m);
        setTrmAutoEdit(m.trm_auto ?? true);
        if (!m.trm_auto && m.trm_referencia) setTrm(m.trm_referencia);
      }
      setSaved(id);
      setTimeout(() => setSaved(null), 2500);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al guardar');
    } finally {
      setSaving(null);
    }
  }, []);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const [statsJson, pricingJson] = await Promise.all([
        adminApi.get<RevenueStats>('/admin/revenue/stats'),
        adminApi.get<{ ok?: boolean; data?: { id: string; data: Record<string, unknown> }[] }>('/admin/pricing'),
      ]);

      setStats(statsJson);

      if (pricingJson.ok && Array.isArray(pricingJson.data)) {
        const rows: { id: string; data: Record<string, unknown> }[] = pricingJson.data;
        const costsRow   = rows.find(r => r.id === 'costs')?.data        as unknown as CostsConfig;
        const metaRow    = rows.find(r => r.id === 'meta')?.data         as unknown as MetaConfig;
        const basicRow   = rows.find(r => r.id === 'basic')?.data        as unknown as { precio_mensual_cop: number };
        const proRow     = rows.find(r => r.id === 'pro')?.data          as unknown as { precio_mensual_cop: number };
        const landingRow = rows.find(r => r.id === 'mini_landing')?.data as unknown as { precio_unico_cop: number };
        if (costsRow) { setCosts(costsRow); setCostsEdit(costsRow); }
        if (metaRow)  {
          setMeta(metaRow);
          setMetaEdit(metaRow);
          setTrmAutoEdit(metaRow.trm_auto ?? true);
          if (metaRow.trm_referencia) {
            setTrmLive(metaRow.trm_referencia);
            setTrm(metaRow.trm_referencia);
            setTrmEdit(metaRow.trm_referencia);
          }
        }
        if (basicRow?.precio_mensual_cop)   setBasicPrecio(basicRow.precio_mensual_cop);
        if (proRow?.precio_mensual_cop)     setProPrecio(proRow.precio_mensual_cop);
        if (landingRow?.precio_unico_cop)   setLandingPrecio(landingRow.precio_unico_cop);
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
      <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 flex items-center justify-between">
        <p className="text-red-400 text-sm">{error}</p>
        <button className="ml-3 underline text-xs text-red-400" onClick={() => setError('')}>Cerrar</button>
      </div>
    );
  }

  if (!stats) return null;

return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className="space-y-6"
    >
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="flex items-center justify-between flex-wrap gap-3"
      >
        <div>
          <h1 className="text-2xl font-jakarta font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>Ingresos y ROI</h1>
          <p className="mt-1 text-sm" style={{ color: 'var(--text-muted)' }}>Estadísticas financieras, metas y proyecciones</p>
        </div>
        <button
          onClick={load}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-[13px] font-medium transition-colors"
          style={{ background: 'rgba(255,92,58,0.1)', color: '#FF5C3A' }}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Actualizar
        </button>
      </motion.div>

      {/* Pestañas */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.08 }}
        className="overflow-x-auto"
      >
        <div className="flex gap-4 p-1.5 bg-[var(--bg-card)] rounded-2xl border border-[var(--border-color)] w-fit">
          {([
            ['ingresos', 'Ingresos'],
            ['roi',      'ROI / Metas'],
            ['config',   'Configuración'],
          ] as const).map(([key, label]) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`px-4 py-2 rounded-xl text-[13px] transition-all whitespace-nowrap ${
                tab === key
                  ? 'bg-[#FF5C3A] text-white shadow-lg font-black uppercase tracking-widest'
                  : 'text-gray-500 hover:text-gray-300 font-medium'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </motion.div>

      {/* Contenido */}
      {tab === 'ingresos' && (
        <TabIngresos stats={stats} basicPrecio={basicPrecio} proPrecio={proPrecio} landingPrecio={landingPrecio} />
      )}
      {tab === 'roi' && (
        <TabROI
          stats={stats} costs={costs} meta={meta} trm={trm}
          basicPrecio={basicPrecio} proPrecio={proPrecio}
          onGoToConfig={() => setTab('config')}
        />
      )}
      {tab === 'config' && (
        <TabConfig
          costs={costsEdit}
          meta={metaEdit}
          trm={trmEdit}
          trmAuto={trmAutoEdit}
          trmLive={trmLive}
          saving={saving}
          saved={saved}
          onCostsChange={setCostsEdit}
          onMetaChange={setMetaEdit}
          onTrmChange={setTrmEdit}
          onTrmAutoChange={v => {
            setTrmAutoEdit(v);
            setMetaEdit(prev => ({ ...prev, trm_auto: v }));
          }}
          onSaveCosts={() => handleSave('costs', costsEdit as unknown as Record<string, unknown>)}
          onSaveMeta={() => handleSave('meta', { ...metaEdit, trm_referencia: trmEdit, trm_auto: trmAutoEdit } as unknown as Record<string, unknown>)}
          onSaveTrm={() => handleSave('meta', { ...metaEdit, trm_referencia: trmEdit, trm_auto: trmAutoEdit } as unknown as Record<string, unknown>)}
        />
      )}
      {tab === 'config' && (
        <TabConfig
          costs={costsEdit}
          meta={metaEdit}
          trm={trmEdit}
          trmAuto={trmAutoEdit}
          trmLive={trmLive}
          saving={saving}
          saved={saved}
          onCostsChange={setCostsEdit}
          onMetaChange={setMetaEdit}
          onTrmChange={setTrmEdit}
          onTrmAutoChange={v => {
            setTrmAutoEdit(v);
            setMetaEdit(prev => ({ ...prev, trm_auto: v }));
          }}
          onSaveCosts={() => handleSave('costs', costsEdit as unknown as Record<string, unknown>)}
          onSaveMeta={() => handleSave('meta', { ...metaEdit, trm_referencia: trmEdit, trm_auto: trmAutoEdit } as unknown as Record<string, unknown>)}
          onSaveTrm={() => handleSave('meta', { ...metaEdit, trm_referencia: trmEdit, trm_auto: trmAutoEdit } as unknown as Record<string, unknown>)}
        />
      )}

    </motion.div>
  );
}
