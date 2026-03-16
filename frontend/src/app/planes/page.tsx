'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

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

// ── Datos ─────────────────────────────────────────────────────────────────────

const DURATIONS = [
  { months: 1,  label: '1 mes',    pct: 0  },
  { months: 3,  label: '3 meses',  pct: 5  },
  { months: 6,  label: '6 meses',  pct: 10 },
  { months: 12, label: '12 meses', pct: 15 },
];

const PLAN_FEATURES = {
  BASIC: [
    { label: '5 productos en el probador',              included: true  },
    { label: '400 generaciones por mes',                included: true  },
    { label: 'Logo y colores de marca',                 included: true  },
    { label: 'Template Bare (widget limpio)',            included: true  },
    { label: 'Widget embebible (iframe)',                included: true  },
    { label: 'Analytics de uso',                        included: true  },
    { label: 'Templates Minimal, Modern y Bold',        included: false },
    { label: 'Texto del botón personalizado',           included: false },
    { label: 'Mensaje de bienvenida en widget',         included: false },
    { label: 'Modificación del slug del probador',      included: false },
    { label: 'Integración con sistemas externos',       included: false },
    { label: 'Soporte prioritario',                     included: false },
  ],
  PRO: [
    { label: '15 productos en el probador',             included: true },
    { label: '1.200 generaciones por mes',              included: true },
    { label: 'Logo y colores de marca',                 included: true },
    { label: 'Template Bare (widget limpio)',            included: true },
    { label: 'Widget embebible (iframe)',                included: true },
    { label: 'Analytics de uso',                        included: true },
    { label: 'Templates Minimal, Modern y Bold',        included: true },
    { label: 'Texto del botón personalizado',           included: true },
    { label: 'Mensaje de bienvenida en widget',         included: true },
    { label: 'Modificación del slug del probador',      included: true },
    { label: 'Integración con sistemas externos',       included: true },
    { label: 'Soporte prioritario',                     included: true },
  ],
};

const COMPARE_ROWS = [
  { label: 'Productos en el probador',           basic: '5',     pro: '15'    },
  { label: 'Generaciones por mes',               basic: '400',   pro: '1.200' },
  { label: 'Logo y colores de marca',            basic: true,    pro: true    },
  { label: 'Template Bare',                      basic: true,    pro: true    },
  { label: 'Templates Minimal, Modern y Bold',   basic: false,   pro: true    },
  { label: 'Texto del botón personalizado',      basic: false,   pro: true    },
  { label: 'Mensaje de bienvenida en widget',    basic: false,   pro: true    },
  { label: 'Modificación del slug del probador', basic: false,   pro: true    },
  { label: 'Widget embebible (iframe)',           basic: true,    pro: true    },
  { label: 'Analytics de uso',                   basic: true,    pro: true    },
  { label: 'Integración con sistemas externos',  basic: false,   pro: true    },
  { label: 'Soporte prioritario',                basic: false,   pro: true    },
];

function formatCOP(n: number) {
  return '$' + n.toLocaleString('es-CO');
}

// ── Página ────────────────────────────────────────────────────────────────────

export default function PlanesPage() {
  const router = useRouter();
  const [selectedMonths, setSelectedMonths] = useState(1);
  const [trialActive, setTrialActive] = useState(false);
  const duration = DURATIONS.find(d => d.months === selectedMonths)!;

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/trial/status`)
      .then(r => r.json())
      .then(d => setTrialActive(d.active === true))
      .catch(() => setTrialActive(false));
  }, []);

  const proMonthlyPrice = Math.round(250000 * (1 - duration.pct / 100));
  const proTotalPrice = proMonthlyPrice * selectedMonths;
  const proOriginalTotal = 250000 * selectedMonths;

  const basicMonthlyPrice = Math.round(150000 * (1 - duration.pct / 100));
  const basicTotalPrice = basicMonthlyPrice * selectedMonths;
  const basicOriginalTotal = 150000 * selectedMonths;

  return (
    <main style={{ fontFamily: 'DM Sans, sans-serif' }} className="min-h-screen bg-[#0a0a0a]">

      {/* Nav */}
      <nav className="bg-[#0a0a0a] border-b border-[#1a1a1a] px-6 md:px-8 h-14 flex items-center justify-between sticky top-0 z-50">
        <Link href="/" style={{ fontFamily: 'Syne, sans-serif' }} className="font-extrabold text-base text-white tracking-tight">
          Look<span className="text-[#FF5C3A]">itry</span>
        </Link>
        <div className="flex items-center gap-1 md:gap-2">
          <Link href="/login" className="text-[13px] text-[#888] hover:text-white px-2 md:px-3.5 py-1.5 rounded-md transition-colors hidden sm:block">
            Iniciar sesión
          </Link>
          <Link href={trialActive ? '/register' : `/checkout?plan=BASIC&amount=${basicTotalPrice}&months=${selectedMonths}`} className="text-[13px] font-medium bg-[#FF5C3A] hover:bg-[#e84d2c] text-white px-3 md:px-4 py-1.5 rounded-md transition-colors">
            {trialActive ? 'Empezar gratis' : 'Contratar ahora'}
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="bg-[#0a0a0a] pt-14 pb-10 px-6 md:px-8 text-center">
        <div className="max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-2 bg-[#1a1a1a] border border-[#333] text-[#FF5C3A] text-[11px] font-medium tracking-widest uppercase px-3 py-1.5 rounded-full mb-6">
            <span className="w-1.5 h-1.5 bg-[#FF5C3A] rounded-full" />
            Planes y precios
          </div>
          <h1 style={{ fontFamily: 'Syne, sans-serif' }} className="font-extrabold text-[36px] md:text-[46px] text-white tracking-tight leading-[1.1] mb-4">
            Precios simples.<br />Sin sorpresas.
          </h1>
          <p className="text-[#666] text-base max-w-md mx-auto">
            Precios en pesos. Paga varios meses y ahorra hasta un{' '}
            <span className="text-[#FF5C3A] font-medium">15%</span>.
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
              <div style={{ fontFamily: 'Syne, sans-serif' }} className="font-bold text-lg text-white mb-1">Básico</div>
              <p className="text-[13px] text-[#555] mb-5">Para marcas pequeñas en Instagram y WhatsApp</p>

              <div className="mb-1 h-5">
                {duration.pct > 0 && (
                  <span className="text-[12px] text-[#444] line-through">{formatCOP(150000)}/mes</span>
                )}
              </div>
              <div style={{ fontFamily: 'Syne, sans-serif' }} className="font-extrabold text-[32px] text-white tracking-tight mb-0.5">
                {formatCOP(basicMonthlyPrice)}
                <span className="text-[13px] font-normal text-[#555]" style={{ fontFamily: 'DM Sans, sans-serif' }}> / mes</span>
              </div>
              {selectedMonths > 1 && (
                <p className="text-[12px] text-[#444] mb-1">
                  Total {selectedMonths} meses:{' '}
                  <span className="text-[#888]">{formatCOP(basicTotalPrice)}</span>
                  {duration.pct > 0 && <span className="ml-1 line-through text-[#333]">{formatCOP(basicOriginalTotal)}</span>}
                </p>
              )}
              <p className="text-[12px] text-[#FF5C3A] mb-6">{trialActive ? '7 días de prueba gratuita incluidos' : 'Pago directo — sin período de prueba'}</p>

              <Link
                href="/register"
                className="block w-full text-center py-2.5 border border-[#333] hover:border-[#555] text-[#aaa] hover:text-white text-[13px] font-medium rounded-lg transition-colors mb-6"
              >
                {trialActive ? 'Empezar gratis — 7 días' : 'Contratar Básico'}
              </Link>

              <ul className="flex flex-col gap-2.5">
                {PLAN_FEATURES.BASIC.map(f => (
                  <li key={f.label} className="flex items-center gap-2.5 text-[13px]">
                    <span className={`w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 ${
                      f.included ? 'bg-[rgba(255,92,58,0.13)]' : 'bg-[#1a1a1a]'
                    }`}>
                      {f.included ? <IconCheck /> : <IconX />}
                    </span>
                    <span className={f.included ? 'text-[#999]' : 'text-[#444]'}>{f.label}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Plan Pro */}
            <div className="bg-[#141414] border border-[#FF5C3A] rounded-xl p-6 md:p-7 relative">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#FF5C3A] text-white text-[10px] font-semibold tracking-widest uppercase px-3 py-1 rounded-full whitespace-nowrap">
                Más popular
              </div>
              <div style={{ fontFamily: 'Syne, sans-serif' }} className="font-bold text-lg text-white mb-1">Pro</div>
              <p className="text-[13px] text-[#555] mb-5">Para tiendas online con mayor volumen</p>

              <div className="mb-1 h-5">
                {duration.pct > 0 && (
                  <span className="text-[12px] text-[#444] line-through">{formatCOP(250000)}/mes</span>
                )}
              </div>
              <div style={{ fontFamily: 'Syne, sans-serif' }} className="font-extrabold text-[32px] text-white tracking-tight mb-0.5">
                {formatCOP(proMonthlyPrice)}
                <span className="text-[13px] font-normal text-[#555]" style={{ fontFamily: 'DM Sans, sans-serif' }}> / mes</span>
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
                Contratar Pro
              </button>

              <ul className="flex flex-col gap-2.5">
                {PLAN_FEATURES.PRO.map(f => (
                  <li key={f.label} className="flex items-center gap-2.5 text-[13px]">
                    <span className="w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 bg-[rgba(255,92,58,0.13)]">
                      <IconCheck />
                    </span>
                    <span className="text-[#999]">{f.label}</span>
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
          <h2 style={{ fontFamily: 'Syne, sans-serif' }} className="font-bold text-[26px] text-white text-center mb-8">
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
                {COMPARE_ROWS.map(row => (
                  <tr key={row.label} className="hover:bg-[#1a1a1a] transition-colors">
                    <td className="px-5 py-3 text-[#777]">{row.label}</td>
                    <td className="px-5 py-3 text-center">
                      {typeof row.basic === 'string'
                        ? <span className="font-medium text-[#888]">{row.basic}</span>
                        : row.basic ? <IconCheckTable /> : <IconXTable />}
                    </td>
                    <td className="px-5 py-3 text-center">
                      {typeof row.pro === 'string'
                        ? <span className="font-medium text-[#FF5C3A]">{row.pro}</span>
                        : row.pro ? <IconCheckTable /> : <IconXTable />}
                    </td>
                  </tr>
                ))}
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
          <h2 style={{ fontFamily: 'Syne, sans-serif' }} className="font-extrabold text-[32px] text-white tracking-tight mb-3">
            {trialActive ? 'Empieza hoy sin riesgos' : 'Empieza hoy'}
          </h2>
          <p className="text-[15px] text-[#555] mb-8">
            {trialActive
              ? 'Plan Básico con 7 días gratis. Plan Pro con pago directo y seguro.'
              : 'Elige el plan que mejor se adapte a tu marca.'}
          </p>
          <div className="flex gap-3 justify-center flex-wrap">
            <Link href={trialActive ? '/register' : `/checkout?plan=BASIC&amount=${basicTotalPrice}&months=${selectedMonths}`}
              className="bg-[#FF5C3A] hover:bg-[#e84d2c] text-white text-[14px] font-medium px-7 py-3 rounded-lg transition-colors flex items-center gap-2">
              {trialActive ? 'Crear cuenta gratis' : 'Contratar Básico'} <IconArrow />
            </Link>
            <button
              onClick={() => router.push(`/checkout?plan=PRO&amount=${proTotalPrice}&months=${selectedMonths}`)}
              className="text-[#aaa] hover:text-white text-[14px] px-7 py-3 rounded-lg border border-[#333] hover:border-[#555] transition-colors">
              Contratar Pro ahora
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#050505] border-t border-[#1a1a1a] px-6 md:px-8 py-7">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <Link href="/" style={{ fontFamily: 'Syne, sans-serif' }} className="font-extrabold text-sm text-white">
            Look<span className="text-[#FF5C3A]">itry</span>
          </Link>
          <div className="flex items-center gap-4 md:gap-5 flex-wrap justify-center">
            <Link href="/" className="text-[12px] text-[#555] hover:text-[#aaa] transition-colors">Inicio</Link>
            <Link href="/login" className="text-[12px] text-[#555] hover:text-[#aaa] transition-colors">Iniciar sesión</Link>
            <a href="mailto:info@pruebalo.wilkiedevs.com" className="text-[12px] text-[#555] hover:text-[#aaa] transition-colors">
              info@pruebalo.wilkiedevs.com
            </a>
            <a href="https://wa.me/573105436281" target="_blank" rel="noopener noreferrer"
              className="text-[12px] text-[#555] hover:text-[#aaa] transition-colors">
              +57 310 543 6281
            </a>
            <Link href="/admin/login" className="text-[12px] text-[#333] hover:text-[#555] transition-colors">
              Admin
            </Link>
          </div>
        </div>
      </footer>

    </main>
  );
}
