'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { LandingNav } from '@/components/landing/LandingNav';
import { LandingFooter } from '@/components/landing/LandingFooter';
import type { PricingConfig } from '@/lib/pricing';
import { precioConDescuento } from '@/lib/pricing';

// ── Iconos ────────────────────────────────────────────────────────────────────

function IconCheck() {
  return (
    <svg width="8" height="8" viewBox="0 0 10 10" fill="none">
      <path d="M2 5l2.5 2.5L8 3" stroke="#FF5C3A" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IconX() {
  return (
    <svg width="8" height="8" viewBox="0 0 10 10" fill="none">
      <path d="M3 3l4 4M7 3l-4 4" stroke="#444" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function IconCheckTable() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="mx-auto">
      <path d="M2.5 7l3 3L11.5 4" stroke="#FF5C3A" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IconXTable() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" className="mx-auto">
      <path d="M3 3l6 6M9 3l-6 6" stroke="#333" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function IconArrow() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
    </svg>
  );
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatCOP(n: number) {
  return '$' + n.toLocaleString('es-CO');
}

// ── Componente ────────────────────────────────────────────────────────────────

interface Props {
  pricing: PricingConfig;
}

export default function PlanesClient({ pricing }: Props) {
  const router = useRouter();
  const [selectedMonths, setSelectedMonths] = useState(1);
  const [trialActive, setTrialActive] = useState(false);

  const { basic, pro, descuentos_duracion } = pricing;

  // Duraciones con descuentos desde config
  const DURATIONS = [
    { months: 1,  label: '1 mes',    pct: descuentos_duracion.meses_1  },
    { months: 3,  label: '3 meses',  pct: descuentos_duracion.meses_3  },
    { months: 6,  label: '6 meses',  pct: descuentos_duracion.meses_6  },
    { months: 12, label: '12 meses', pct: descuentos_duracion.meses_12 },
  ];

  const duration = DURATIONS.find(d => d.months === selectedMonths)!;

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/trial/status`)
      .then(r => r.json())
      .then(d => setTrialActive(d.active === true))
      .catch(() => setTrialActive(false));
  }, []);

  // Precios calculados dinámicamente
  const basicMonthlyPrice = precioConDescuento(basic.precio_mensual_cop, selectedMonths, descuentos_duracion);
  const basicTotalPrice   = basicMonthlyPrice * selectedMonths;
  const basicOriginalTotal = basic.precio_mensual_cop * selectedMonths;

  const proMonthlyPrice   = precioConDescuento(pro.precio_mensual_cop, selectedMonths, descuentos_duracion);
  const proTotalPrice     = proMonthlyPrice * selectedMonths;
  const proOriginalTotal  = pro.precio_mensual_cop * selectedMonths;

  // Tabla comparativa generada desde features de ambos planes
  const allFeatures = Array.from(new Set([
    ...basic.features,
    ...(basic.features_excluidas ?? []),
  ]));

  return (
    <main className="min-h-screen bg-[#0a0a0a]">

      <LandingNav
        ctaHref={trialActive ? '/register' : `/checkout?plan=BASIC&amount=${basicTotalPrice}&months=${selectedMonths}`}
        ctaLabel={trialActive ? 'Empezar gratis' : 'Contratar ahora'}
      />

      {/* Hero */}
      <section className="bg-[#0a0a0a] pt-14 pb-10 px-6 md:px-8 text-center">
        <div className="max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-2 bg-[#1a1a1a] border border-[#333] text-[#FF5C3A] text-[11px] font-medium tracking-widest uppercase px-3 py-1.5 rounded-full mb-6">
            <span className="w-1.5 h-1.5 bg-[#FF5C3A] rounded-full" />
            Planes y precios
          </div>
          <h1 className="font-syne font-extrabold text-[36px] md:text-[46px] text-white tracking-tight leading-[1.1] mb-4">
            Precios simples.<br />Sin sorpresas.
          </h1>
          <p className="text-[#666] text-base max-w-md mx-auto">
            Precios en pesos. Paga varios meses y ahorra hasta un{' '}
            <span className="text-[#FF5C3A] font-medium">{descuentos_duracion.meses_12}%</span>.
          </p>
        </div>
      </section>

      {/* Selector de duración */}
      <section className="pt-8 pb-2 px-6 md:px-8">
        <div className="flex justify-center">
          <div className="inline-flex bg-[#141414] border border-[#2a2a2a] rounded-xl p-1 gap-1">
            {DURATIONS.map(d => (
              <button
                key={d.months}
                onClick={() => setSelectedMonths(d.months)}
                className={`relative px-4 py-2 rounded-lg text-[13px] font-medium transition-all ${
                  selectedMonths === d.months
                    ? 'bg-[#1f1f1f] text-white shadow-sm'
                    : 'text-[#555] hover:text-[#888]'
                }`}
              >
                {d.label}
                {d.pct > 0 && (
                  <span className={`absolute -top-2.5 left-1/2 -translate-x-1/2 text-[9px] font-bold px-1.5 py-0.5 rounded-full whitespace-nowrap ${
                    selectedMonths === d.months
                      ? 'bg-[#FF5C3A] text-white'
                      : 'bg-[#1f1f1f] text-[#FF5C3A] border border-[#FF5C3A]/30'
                  }`}>
                    -{d.pct}%
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
        {duration.pct > 0 && (
          <p className="text-center text-[13px] text-[#FF5C3A] font-medium mt-3">
            Ahorra un {duration.pct}% pagando {duration.months} meses por adelantado
          </p>
        )}
      </section>

      {/* Cards de planes */}
      <section className="py-10 px-6 md:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 items-start">

            {/* Plan Básico */}
            <div className="bg-[#141414] border border-[#2a2a2a] rounded-xl p-6 md:p-7">
              <div className="font-syne font-bold text-lg text-white mb-1">Básico</div>
              <p className="text-[13px] text-[#555] mb-5">{basic.subtitulo}</p>

              <div className="mb-1 h-5">
                {duration.pct > 0 && (
                  <span className="text-[12px] text-[#444] line-through">{formatCOP(basic.precio_mensual_cop)}/mes</span>
                )}
              </div>
              <div className="font-syne font-extrabold text-[32px] text-white tracking-tight mb-0.5">
                {formatCOP(basicMonthlyPrice)}
                <span className="text-[13px] font-normal text-[#555]"> / mes</span>
              </div>
              {selectedMonths > 1 && (
                <p className="text-[12px] text-[#444] mb-1">
                  Total {selectedMonths} meses:{' '}
                  <span className="text-[#888]">{formatCOP(basicTotalPrice)}</span>
                  {duration.pct > 0 && <span className="ml-1 line-through text-[#333]">{formatCOP(basicOriginalTotal)}</span>}
                </p>
              )}
              <p className="text-[12px] text-[#FF5C3A] mb-6">
                {trialActive ? '7 días de prueba gratuita incluidos' : 'Pago directo — sin período de prueba'}
              </p>

              <Link
                href="/register"
                className="block w-full text-center py-2.5 border border-[#333] hover:border-[#555] text-[#aaa] hover:text-white text-[13px] font-medium rounded-lg transition-colors mb-6"
              >
                {trialActive ? (basic.boton_texto ?? 'Empezar gratis — 7 días') : (basic.boton_texto_sin_trial ?? 'Contratar Básico')}
              </Link>

              <ul className="flex flex-col gap-2.5">
                {basic.features.map(f => (
                  <li key={f} className="flex items-center gap-2.5 text-[13px]">
                    <span className="w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 bg-[rgba(255,92,58,0.13)]">
                      <IconCheck />
                    </span>
                    <span className="text-[#999]">{f}</span>
                  </li>
                ))}
                {(basic.features_excluidas ?? []).map(f => (
                  <li key={f} className="flex items-center gap-2.5 text-[13px]">
                    <span className="w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 bg-[#1a1a1a]">
                      <IconX />
                    </span>
                    <span className="text-[#444]">{f}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Plan Pro */}
            <div className="bg-[#141414] border border-[#FF5C3A] rounded-xl p-6 md:p-7 relative">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#FF5C3A] text-white text-[10px] font-semibold tracking-widest uppercase px-3 py-1 rounded-full whitespace-nowrap">
                Más popular
              </div>
              <div className="font-syne font-bold text-lg text-white mb-1">Pro</div>
              <p className="text-[13px] text-[#555] mb-5">{pro.subtitulo}</p>

              <div className="mb-1 h-5">
                {duration.pct > 0 && (
                  <span className="text-[12px] text-[#444] line-through">{formatCOP(pro.precio_mensual_cop)}/mes</span>
                )}
              </div>
              <div className="font-syne font-extrabold text-[32px] text-white tracking-tight mb-0.5">
                {formatCOP(proMonthlyPrice)}
                <span className="text-[13px] font-normal text-[#555]"> / mes</span>
              </div>
              {selectedMonths > 1 && (
                <p className="text-[12px] text-[#444] mb-1">
                  Total {selectedMonths} meses:{' '}
                  <span className="text-[#888]">{formatCOP(proTotalPrice)}</span>
                  {duration.pct > 0 && <span className="ml-1 line-through text-[#333]">{formatCOP(proOriginalTotal)}</span>}
                </p>
              )}
              <p className="text-[12px] text-[#444] mb-6">Contratación directa — sin período de prueba</p>

              <button
                onClick={() => router.push(`/checkout?plan=PRO&amount=${proTotalPrice}&months=${selectedMonths}`)}
                className="block w-full text-center py-2.5 bg-[#FF5C3A] hover:bg-[#e84d2c] text-white text-[13px] font-medium rounded-lg transition-colors mb-6"
              >
                {pro.boton_texto}
              </button>

              <ul className="flex flex-col gap-2.5">
                {pro.features.map(f => (
                  <li key={f} className="flex items-center gap-2.5 text-[13px]">
                    <span className="w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 bg-[rgba(255,92,58,0.13)]">
                      <IconCheck />
                    </span>
                    <span className="text-[#999]">{f}</span>
                  </li>
                ))}
              </ul>
            </div>

          </div>

          <p className="text-center text-[12px] text-[#333] mt-5">
            Todos los planes se pagan por adelantado. El precio mensual refleja el total del período dividido entre los meses contratados.
          </p>
        </div>
      </section>

      {/* Tabla comparativa */}
      <section className="py-14 px-6 md:px-8 bg-[#0a0a0a] border-t border-[#1a1a1a]">
        <div className="max-w-4xl mx-auto">
          <h2 className="font-syne font-bold text-[26px] text-white text-center mb-8">
            Comparativa completa
          </h2>
          <div className="bg-[#141414] border border-[#2a2a2a] rounded-xl overflow-hidden">
            <table className="w-full text-[13px]">
              <thead>
                <tr className="border-b border-[#2a2a2a]">
                  <th className="text-left px-5 py-3.5 font-medium text-[#555] w-1/2">Característica</th>
                  <th className="text-center px-5 py-3.5 font-medium text-[#555] w-1/4">Básico</th>
                  <th className="text-center px-5 py-3.5 font-medium text-[#FF5C3A] w-1/4">Pro</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1f1f1f]">
                {/* Filas de límites */}
                <tr className="hover:bg-[#1a1a1a] transition-colors">
                  <td className="px-5 py-3 text-[#777]">Productos en el probador</td>
                  <td className="px-5 py-3 text-center"><span className="font-medium text-[#888]">{basic.productos_max}</span></td>
                  <td className="px-5 py-3 text-center"><span className="font-medium text-[#FF5C3A]">{pro.productos_max}</span></td>
                </tr>
                <tr className="hover:bg-[#1a1a1a] transition-colors">
                  <td className="px-5 py-3 text-[#777]">Generaciones por mes</td>
                  <td className="px-5 py-3 text-center"><span className="font-medium text-[#888]">{basic.generaciones_mensuales.toLocaleString('es-CO')}</span></td>
                  <td className="px-5 py-3 text-center"><span className="font-medium text-[#FF5C3A]">{pro.generaciones_mensuales.toLocaleString('es-CO')}</span></td>
                </tr>
                {/* Filas de features */}
                {allFeatures.map(feature => {
                  const inBasic = basic.features.includes(feature);
                  const inPro   = pro.features.includes(feature);
                  return (
                    <tr key={feature} className="hover:bg-[#1a1a1a] transition-colors">
                      <td className="px-5 py-3 text-[#777]">{feature}</td>
                      <td className="px-5 py-3 text-center">{inBasic ? <IconCheckTable /> : <IconXTable />}</td>
                      <td className="px-5 py-3 text-center">{inPro   ? <IconCheckTable /> : <IconXTable />}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* CTA final */}
      <section className="py-16 md:py-20 px-6 md:px-8 bg-[#0a0a0a] text-center relative overflow-hidden">
        <div className="absolute pointer-events-none"
          style={{ width: '500px', height: '300px', background: 'radial-gradient(ellipse, rgba(255,92,58,0.06) 0%, transparent 70%)', top: '50%', left: '50%', transform: 'translate(-50%,-50%)' }} />
        <div className="relative z-10 max-w-xl mx-auto">
          <h2 className="font-syne font-extrabold text-[32px] text-white tracking-tight mb-3">
            {trialActive ? 'Empieza hoy sin riesgos' : 'Empieza hoy'}
          </h2>
          <p className="text-[15px] text-[#555] mb-8">
            {trialActive
              ? 'Plan Básico con 7 días gratis. Plan Pro con pago directo y seguro.'
              : 'Elige el plan que mejor se adapte a tu marca.'}
          </p>
          <div className="flex gap-3 justify-center flex-wrap">
            <Link
              href={trialActive ? '/register' : `/checkout?plan=BASIC&amount=${basicTotalPrice}&months=${selectedMonths}`}
              className="bg-[#FF5C3A] hover:bg-[#e84d2c] text-white text-[14px] font-medium px-7 py-3 rounded-lg transition-colors flex items-center gap-2"
            >
              {trialActive ? 'Crear cuenta gratis' : 'Contratar Básico'} <IconArrow />
            </Link>
            <button
              onClick={() => router.push(`/checkout?plan=PRO&amount=${proTotalPrice}&months=${selectedMonths}`)}
              className="text-[#aaa] hover:text-white text-[14px] px-7 py-3 rounded-lg border border-[#333] hover:border-[#555] transition-colors"
            >
              {pro.boton_texto}
            </button>
          </div>
        </div>
      </section>

      <LandingFooter />

    </main>
  );
}
