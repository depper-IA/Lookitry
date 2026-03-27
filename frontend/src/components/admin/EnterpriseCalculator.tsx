'use client';

import { useState } from 'react';
import { formatCurrency } from '@/utils/currency';

const IconShield = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
  </svg>
);

const IconAlert = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <circle cx="12" cy="12" r="10" />
    <line x1="12" y1="8" x2="12" y2="12" />
    <line x1="12" y1="16" x2="12.01" y2="16" />
  </svg>
);

const BASE_PRICE = 800000;
const BASE_GENS = 2000;
const BASE_PRODS = 50;
const EXTRA_PROD_FEE = 10000;
const CUSTOMER_GEN_PRICE = 150;
const INTERNAL_API_COST = 135;

export default function EnterpriseCalculator() {
  const [numProducts, setNumProducts] = useState(50);
  const [monthlyGens, setMonthlyGens] = useState(2000);
  const [setupFeeBase, setSetupFeeBase] = useState(500000);

  const extraProducts = Math.max(0, numProducts - BASE_PRODS);
  const extraGens = Math.max(0, monthlyGens - BASE_GENS);

  const subTotal = BASE_PRICE + extraGens * CUSTOMER_GEN_PRICE;
  const setupProductsTotal = extraProducts * EXTRA_PROD_FEE;
  const setupTotal = setupFeeBase + setupProductsTotal;
  const apiCost = monthlyGens * INTERNAL_API_COST;
  const netProfit = subTotal - apiCost;
  const margin = subTotal > 0 ? (netProfit / subTotal) * 100 : 0;
  const isLowMargin = margin < 30;

  return (
    <section className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
      <div
        className="rounded-[2rem] border p-5 md:p-8"
        style={{ background: 'var(--bg-card)', borderColor: 'var(--border-color)' }}
      >
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="mb-2 flex items-center gap-2 text-[#FF5C3A]">
              <IconShield />
              <span className="text-[11px] font-black uppercase tracking-[0.24em]">
                Enterprise Division
              </span>
            </div>
            <h2
              className="text-2xl font-syne font-bold tracking-tight md:text-3xl"
              style={{ color: 'var(--text-primary)' }}
            >
              Calculadora de margen enterprise
            </h2>
            <p className="mt-2 max-w-2xl text-sm" style={{ color: 'var(--text-secondary)' }}>
              Modela la propuesta al cliente y revisa tu margen real antes de cerrar una cuenta de alto volumen.
            </p>
          </div>

          <div
            className="rounded-2xl border px-4 py-3 text-sm"
            style={{ background: 'var(--bg-base)', borderColor: 'var(--border-color)' }}
          >
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-black uppercase tracking-[0.24em] text-[#FF5C3A]">
                Base enterprise
              </span>
            </div>
            <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs" style={{ color: 'var(--text-muted)' }}>
              <span>{formatCurrency(BASE_PRICE)} / mes</span>
              <span>{BASE_PRODS} productos</span>
              <span>{BASE_GENS.toLocaleString('es-CO')} generaciones</span>
            </div>
          </div>
        </div>

        <div className="mt-8 grid grid-cols-1 gap-6 xl:grid-cols-12">
          <div className="xl:col-span-7">
            <div
              className="rounded-[1.75rem] border p-5 md:p-7"
              style={{ background: 'var(--bg-base)', borderColor: 'var(--border-color)' }}
            >
              <div className="mb-8 flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#FF5C3A]/10 text-sm font-black text-[#FF5C3A]">
                  1
                </div>
                <div>
                  <h3 className="text-base font-bold" style={{ color: 'var(--text-primary)' }}>
                    Variables del cliente
                  </h3>
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                    Ajusta volumen, generaciones y setup según la complejidad real del caso.
                  </p>
                </div>
              </div>

              <div className="space-y-8">
                <div>
                  <div className="mb-4 flex items-end justify-between gap-4">
                    <div>
                      <label className="block text-sm font-bold" style={{ color: 'var(--text-primary)' }}>
                        Catálogo de productos
                      </label>
                      <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                        La base incluye 50 SKUs. Los adicionales se cobran en setup.
                      </p>
                    </div>
                    <span className="text-2xl font-black text-[#FF5C3A]">{numProducts}</span>
                  </div>
                  <input
                    type="range"
                    min="10"
                    max="1000"
                    step="10"
                    value={numProducts}
                    onChange={(e) => setNumProducts(Number(e.target.value))}
                    className="w-full accent-[#FF5C3A]"
                  />
                  <div className="mt-3 flex justify-between text-[11px]" style={{ color: 'var(--text-muted)' }}>
                    <span>Base: {BASE_PRODS}</span>
                    <span>Extra: {formatCurrency(EXTRA_PROD_FEE)} c/u</span>
                  </div>
                </div>

                <div>
                  <div className="mb-4 flex items-end justify-between gap-4">
                    <div>
                      <label className="block text-sm font-bold" style={{ color: 'var(--text-primary)' }}>
                        Generaciones por mes
                      </label>
                      <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                        Costo interno: {formatCurrency(INTERNAL_API_COST)} | Cobro cliente por excedente:{' '}
                        {formatCurrency(CUSTOMER_GEN_PRICE)}
                      </p>
                    </div>
                    <span className="text-2xl font-black text-[#FF5C3A]">
                      {monthlyGens.toLocaleString('es-CO')}
                    </span>
                  </div>
                  <input
                    type="range"
                    min="500"
                    max="30000"
                    step="500"
                    value={monthlyGens}
                    onChange={(e) => setMonthlyGens(Number(e.target.value))}
                    className="w-full accent-[#FF5C3A]"
                  />
                  <div className="mt-3 flex justify-between text-[11px]" style={{ color: 'var(--text-muted)' }}>
                    <span>Base: {BASE_GENS.toLocaleString('es-CO')}</span>
                    <span>Excedente: {extraGens.toLocaleString('es-CO')}</span>
                  </div>
                </div>

                <div className="border-t pt-6" style={{ borderColor: 'var(--border-color)' }}>
                  <label className="mb-2 block text-sm font-bold" style={{ color: 'var(--text-primary)' }}>
                    Setup base
                  </label>
                  <p className="mb-3 text-xs" style={{ color: 'var(--text-muted)' }}>
                    Sube este valor si el cliente trae fotos de baja calidad o requiere limpieza y edición intensiva.
                  </p>
                  <div className="relative">
                    <span
                      className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-sm font-black"
                      style={{ color: 'var(--text-muted)' }}
                    >
                      $
                    </span>
                    <input
                      type="number"
                      min={0}
                      value={setupFeeBase}
                      onChange={(e) => setSetupFeeBase(Number(e.target.value) || 0)}
                      className="w-full rounded-2xl border px-10 py-4 text-sm font-bold outline-none transition-all focus:ring-2 focus:ring-[#FF5C3A]/30"
                      style={{
                        background: 'var(--bg-card)',
                        borderColor: 'var(--border-color)',
                        color: 'var(--text-primary)',
                      }}
                    />
                  </div>
                  <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-3">
                    <MetricPill label="Prod. extra" value={formatCurrency(setupProductsTotal)} />
                    <MetricPill label="Setup final" value={formatCurrency(setupTotal)} />
                    <MetricPill
                      label="Excedente gens."
                      value={formatCurrency(extraGens * CUSTOMER_GEN_PRICE)}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-6 xl:col-span-5">
            <div className="rounded-[1.75rem] bg-[#111827] p-6 text-white shadow-xl shadow-black/20 md:p-7">
              <h3 className="text-[11px] font-black uppercase tracking-[0.24em] text-white/55">
                Propuesta económica
              </h3>

              <div className="mt-8 space-y-8">
                <div>
                  <p className="mb-2 text-sm text-white/70">Inversión mensual</p>
                  <p className="text-4xl font-black tracking-tight md:text-5xl">
                    {formatCurrency(subTotal)}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4 border-t border-white/10 pt-6">
                  <div>
                    <p className="mb-1 text-[10px] font-black uppercase tracking-[0.18em] text-white/45">
                      Setup total
                    </p>
                    <p className="text-lg font-bold">{formatCurrency(setupTotal)}</p>
                  </div>
                  <div>
                    <p className="mb-1 text-[10px] font-black uppercase tracking-[0.18em] text-white/45">
                      Gen. extra
                    </p>
                    <p className="text-lg font-bold">
                      {formatCurrency(CUSTOMER_GEN_PRICE)} <span className="text-xs font-medium text-white/55">COP</span>
                    </p>
                  </div>
                </div>

                <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-4">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-[0.18em] text-white/45">
                        Mes 1 estimado
                      </p>
                      <p className="mt-1 text-2xl font-black">
                        {formatCurrency(subTotal + setupTotal)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] font-black uppercase tracking-[0.18em] text-white/45">
                        Recurrente
                      </p>
                      <p className="mt-1 text-lg font-bold text-white/82">{formatCurrency(subTotal)}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div
              className="rounded-[1.75rem] border p-6 md:p-7"
              style={{ background: 'var(--bg-base)', borderColor: 'var(--border-color)' }}
            >
              <div className="mb-6 flex items-center justify-between gap-4">
                <h3
                  className="text-[11px] font-black uppercase tracking-[0.24em]"
                  style={{ color: 'var(--text-muted)' }}
                >
                  Análisis interno
                </h3>

                {isLowMargin && (
                  <div className="flex items-center gap-2 rounded-full bg-amber-100 px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-amber-700">
                    <IconAlert />
                    Margen bajo
                  </div>
                )}
              </div>

              <div className="space-y-4">
                <AnalysisRow label="Costo API total" value={`-${formatCurrency(apiCost)}`} tone="danger" />
                <AnalysisRow label="Utilidad bruta mensual" value={formatCurrency(netProfit)} tone="success" />
                <AnalysisRow
                  label="Ingreso mensual cliente"
                  value={formatCurrency(subTotal)}
                />
              </div>

              <div className="mt-6">
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase tracking-[0.18em]" style={{ color: 'var(--text-muted)' }}>
                    Salud del negocio
                  </span>
                  <span className={`text-sm font-black ${isLowMargin ? 'text-amber-500' : 'text-emerald-500'}`}>
                    {margin.toFixed(1)}%
                  </span>
                </div>
                <div className="h-3 w-full overflow-hidden rounded-full bg-[#e5e7eb]">
                  <div
                    className={`h-full transition-all duration-500 ${isLowMargin ? 'bg-amber-500' : 'bg-emerald-500'}`}
                    style={{ width: `${Math.max(0, Math.min(100, margin))}%` }}
                  />
                </div>
                {isLowMargin ? (
                  <p className="mt-3 text-xs font-medium text-amber-600">
                    El margen está por debajo del 30%. Conviene renegociar mensualidad, setup o cobro por generación.
                  </p>
                ) : (
                  <p className="mt-3 text-xs" style={{ color: 'var(--text-secondary)' }}>
                    El negocio mantiene una zona de margen saludable con los parámetros actuales.
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function MetricPill({ label, value }: { label: string; value: string }) {
  return (
    <div
      className="rounded-2xl border px-4 py-3"
      style={{ background: 'var(--bg-base)', borderColor: 'var(--border-color)' }}
    >
      <p className="text-[10px] font-black uppercase tracking-[0.16em]" style={{ color: 'var(--text-muted)' }}>
        {label}
      </p>
      <p className="mt-1 text-sm font-bold" style={{ color: 'var(--text-primary)' }}>
        {value}
      </p>
    </div>
  );
}

function AnalysisRow({
  label,
  value,
  tone = 'neutral',
}: {
  label: string;
  value: string;
  tone?: 'neutral' | 'success' | 'danger';
}) {
  const color =
    tone === 'success' ? '#10b981' : tone === 'danger' ? '#ef4444' : 'var(--text-primary)';

  return (
    <div className="flex items-center justify-between gap-4 text-sm">
      <span style={{ color: 'var(--text-secondary)' }}>{label}</span>
      <span className="font-bold" style={{ color }}>
        {value}
      </span>
    </div>
  );
}
