'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import LandingNav from '@/components/landing/new-landing/LandingNav';
import LandingFooter from '@/components/landing/new-landing/LandingFooter';
import type { PricingConfig, PlanPriceOverride } from '@/lib/pricing';
import { precioConDescuento } from '@/lib/pricing';
import { formatPrice as formatPriceUtil } from '@/utils/currency';

const PREMIUM_FONTS = `
  @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=DM+Sans:ital,opsz,wght@0,100..1000;1,100..1000&display=swap');
  .font-jakarta { font-family: 'Plus Jakarta Sans', sans-serif; }
  .font-dm-sans { font-family: 'DM Sans', sans-serif; }
`;

function IconCheck() {
  return (
    <svg width="8" height="8" viewBox="0 0 10 10" fill="none">
      <path d="M2 5l2.5 2.5L8 3" stroke="#FF5C3A" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IconX() {
  return (
    <svg width="8" height="8" viewBox="0 0 10 10" fill="none" className="[&_path]:stroke-[var(--text-secondary)]">
      <path d="M3 3l4 4M7 3l-4 4" strokeWidth="1.5" strokeLinecap="round" />
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
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" className="mx-auto [&_path]:stroke-[var(--text-secondary)]">
      <path d="M3 3l6 6M9 3l-6 6" strokeWidth="1.5" strokeLinecap="round" />
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

function IconStar() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="#FF5C3A" className="shrink-0">
      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
    </svg>
  );
}

interface Props {
  pricing: PricingConfig;
  overrides?: PlanPriceOverride[];
}

export default function PlanesClient({ pricing, overrides = [] }: Props) {
  const router = useRouter();
  const [selectedMonths, setSelectedMonths] = useState(1);
  const [currency, setCurrency] = useState<'COP' | 'USD'>('COP');
  const [trm, setTrm] = useState(pricing.meta?.trm_referencia ?? 3700);

  const { basic, pro, enterprise, descuentos_duracion } = pricing;

  useEffect(() => {
    const saved = localStorage.getItem('currency') as 'COP' | 'USD';
    if (saved) setCurrency(saved);

    const apiUrl = process.env.NEXT_PUBLIC_API_URL || '';
    if (apiUrl) {
      fetch(`${apiUrl}/api/payment-settings/public`)
        .then(r => r.ok ? r.json() : null)
        .then(data => {
          if (data?.trm && Number(data.trm) > 0) {
            setTrm(Number(data.trm));
          }
        })
        .catch(() => {});
    }

    const handleCurrencyChange = () => {
      const current = localStorage.getItem('currency') as 'COP' | 'USD';
      if (current) setCurrency(current);
    };

    window.addEventListener('currencyChange', handleCurrencyChange);
    return () => window.removeEventListener('currencyChange', handleCurrencyChange);
  }, []);

  const handleManualCurrencyChange = (c: 'COP' | 'USD') => {
    setCurrency(c);
    localStorage.setItem('currency', c);
    window.dispatchEvent(new Event('currencyChange'));
  };

  const formatPrice = (cop: number) => formatPriceUtil(cop, currency, trm);

  const basicOverride = overrides.find(o => o.plan === 'BASIC');
  const proOverride = overrides.find(o => o.plan === 'PRO');

  const DURATIONS = [
    { months: 1, label: '1 mes', pct: descuentos_duracion.meses_1 },
    { months: 3, label: '3 meses', pct: descuentos_duracion.meses_3 },
    { months: 6, label: '6 meses', pct: descuentos_duracion.meses_6 },
    { months: 12, label: '12 meses', pct: descuentos_duracion.meses_12 },
  ];

  const duration = DURATIONS.find(d => d.months === selectedMonths)!;

  const basicMonthlyPrice = basicOverride
    ? basicOverride.override_price
    : precioConDescuento(basic.precio_mensual_cop, selectedMonths, descuentos_duracion);
  const basicTotalPrice = basicMonthlyPrice * selectedMonths;
  const basicOriginalTotal = (basicOverride ? basicOverride.original_price : basic.precio_mensual_cop) * selectedMonths;

  const proMonthlyPrice = proOverride
    ? proOverride.override_price
    : precioConDescuento(pro.precio_mensual_cop, selectedMonths, descuentos_duracion);
  const proTotalPrice = proMonthlyPrice * selectedMonths;
  const proOriginalTotal = (proOverride ? proOverride.original_price : pro.precio_mensual_cop) * selectedMonths;

  const allFeatures = Array.from(new Set([
    ...basic.features,
    ...pro.features,
    ...enterprise.features,
  ]));

  return (
    <div className="min-h-screen theme-bg-base theme-text font-dm-sans selection:bg-[#FF5C3A]/30 selection:text-white overflow-x-clip">
      <style dangerouslySetInnerHTML={{ __html: PREMIUM_FONTS }} />

      <LandingNav currency={currency} onCurrencyChange={handleManualCurrencyChange} />

      <main className="pt-32 pb-20">
        {/* Hero Section */}
        <section className="theme-bg-base pt-14 pb-16 px-6 md:px-8 text-center mt-12">
          <div className="max-w-2xl mx-auto">
            {/* Urgency Badge */}
            <div className="inline-flex items-center gap-2 bg-[#FF5C3A]/10 border border-[#FF5C3A]/30 text-[#FF5C3A] text-[11px] font-bold tracking-widest uppercase px-4 py-2 rounded-full mb-6">
              <span className="w-2 h-2 bg-[#FF5C3A] rounded-full animate-pulse" />
              Precios exclusivos por tiempo limitado
            </div>
            
            <h1 className="font-jakarta font-extrabold text-4xl md:text-6xl lg:text-7xl theme-text tracking-tight leading-[1.05] mb-6">
              Elige tu plan y<br />
              <span className="text-[#FF5C3A]">empieza hoy.</span>
            </h1>
            <p className="theme-text-muted text-lg md:text-xl max-w-lg mx-auto font-dm-sans leading-relaxed">
              Sin contratos. Cancela cuando quieras. Paga por adelantado y ahorra hasta un{' '}
              <span className="text-[#FF5C3A] font-bold">{descuentos_duracion.meses_12}%</span>.
            </p>
          </div>
        </section>

        {/* Social Proof */}
        <section className="px-6 md:px-8 pb-8">
          <div className="max-w-2xl mx-auto flex flex-col items-center gap-4">
            <div className="flex items-center gap-2">
              {[1,2,3,4,5].map(i => (
                <IconStar key={i} />
              ))}
            </div>
            <p className="theme-text-muted text-sm font-medium">
              Más de <span className="theme-text font-bold">500+</span> tiendas en Colombia confían en Lookitry
            </p>
            <div className="flex items-center gap-6 theme-text-muted text-xs font-medium">
              <span>CO Cali</span>
              <span>CO Bogotá</span>
              <span>CO Medellín</span>
            </div>
          </div>
        </section>

        {/* Duration Selector */}
        <section className="pt-6 pb-2 px-6 md:px-8">
          <div className="flex justify-center">
            <div className="inline-flex theme-bg-card theme-border border rounded-2xl p-1.5 gap-1">
              {DURATIONS.map(d => (
                <button
                  key={d.months}
                  onClick={() => setSelectedMonths(d.months)}
                  className={`relative px-5 py-2.5 rounded-xl text-[13px] font-bold transition-all duration-300 ${
                    selectedMonths === d.months 
                      ? 'bg-[#FF5C3A] theme-text shadow-lg shadow-[#FF5C3A]/20' 
                      : 'theme-text-muted hover:theme-text'
                  }`}
                >
                  {d.label}
                  {d.pct > 0 && (
                    <span className={`absolute -top-2.5 left-1/2 -translate-x-1/2 text-[9px] font-bold px-1.5 py-0.5 rounded-full whitespace-nowrap ${
                    selectedMonths === d.months
                      ? 'bg-white text-[#FF5C3A]'
                      : 'bg-[#FF5C3A]/20 text-[#FF5C3A] border border-[#FF5C3A]/30'
                  }`}>
                      -{d.pct}%
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>
          {duration.pct > 0 && (
            <p className="text-center text-[14px] text-[#FF5C3A] font-semibold mt-4">
              ¡Ahorra ${((pro.precio_mensual_cop * selectedMonths * duration.pct / 100)).toLocaleString('es-CO')} COP con {duration.months} meses!
            </p>
          )}
        </section>

        {/* Pricing Cards */}
        <section className="py-12 px-6 md:px-8">
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 xl:gap-8 items-stretch">
              
              {/* BASIC CARD */}
              <div className="theme-bg-card theme-border border rounded-[2rem] p-8 md:p-10 flex flex-col min-h-[580px] hover:border-[#FF5C3A] transition-all duration-500">
                <div className="font-jakarta font-bold text-2xl theme-text mb-2">Básico</div>
                <p className="text-[14px] theme-text-muted mb-6">{basic.subtitulo}</p>

                <div className="mb-2">
                  {(duration.pct > 0 || basicOverride) && (
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[16px] theme-text-muted line-through font-medium">
                        {formatPrice(basicOverride ? basicOverride.original_price : basic.precio_mensual_cop)}
                      </span>
                      <span className="bg-[#FF5C3A]/20 text-[#FF5C3A] text-[10px] font-bold px-2 py-0.5 rounded-full">
                        -{Math.round((1 - basicMonthlyPrice / basic.precio_mensual_cop) * 100)}%
                      </span>
                    </div>
                  )}
                </div>
                <div className="font-jakarta font-extrabold text-[48px] theme-text tracking-tight mb-1">
                  {formatPrice(basicMonthlyPrice)}
                  <span className="text-xl font-normal theme-text-muted"> / mes</span>
                </div>
                {basicOverride && (
                  <p className="text-[12px] text-[#FF5C3A] font-semibold mb-2">
                    {basicOverride.label ?? 'Precio especial'}
                  </p>
                )}
                {selectedMonths > 1 && (
                  <p className="text-[13px] theme-text-muted mb-2">
                    Total: <span className="theme-text font-semibold">{formatPrice(basicTotalPrice)}</span>
                    <span className="ml-2 line-through theme-text-muted/70">{formatPrice(basicOriginalTotal)}</span>
                  </p>
                )}
                <p className="text-[12px] theme-text-muted/80 mb-8">Pago único · Activa en minutos</p>

                <a
                  href={`/checkout?plan=BASIC&months=${selectedMonths}`}
                  className="block w-full text-center py-4 bg-white/5 hover:bg-white/10 theme-border border theme-text text-sm font-bold rounded-2xl transition-all hover:scale-[1.02] active:scale-95 mb-8"
                >
                  {basic.boton_texto_sin_trial ?? 'Contratar ahora'}
                </a>

                <ul className="flex flex-col gap-4 flex-1">
                  {basic.features.map(f => (
                    <li key={f} className="flex items-start gap-3 text-[14px]">
                      <span className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 bg-[#FF5C3A]/10 mt-0.5">
                        <IconCheck />
                      </span>
                      <span className="theme-text/80">{f}</span>
                    </li>
                  ))}
                  {(basic.features_excluidas ?? []).map(f => (
                    <li key={f} className="flex items-start gap-3 text-[14px]">
                      <span className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 bg-white/5 mt-0.5">
                        <IconX />
                      </span>
                      <span className="theme-text-muted/50 line-through">{f}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* PRO CARD - HIGHLIGHTED */}
              <div className="bg-gradient-to-b from-[#1a1515] to-[#141414] border-2 border-[#FF5C3A] rounded-[2rem] p-8 md:p-10 relative shadow-2xl shadow-[#FF5C3A]/10 flex flex-col min-h-[580px] transition-all duration-500">
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-[#FF5C3A] theme-text text-[11px] font-black tracking-widest uppercase px-6 py-2 rounded-full shadow-lg">
                  Más popular
                </div>
                <div className="font-jakarta font-bold text-2xl theme-text mb-2">Pro</div>
                <p className="text-[14px] theme-text-muted mb-6">{pro.subtitulo}</p>

                <div className="mb-2">
                  {(duration.pct > 0 || proOverride) && (
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[16px] theme-text-muted line-through font-medium">
                        {formatPrice(proOverride ? proOverride.original_price : pro.precio_mensual_cop)}
                      </span>
                      <span className="bg-[#FF5C3A] theme-text text-[10px] font-bold px-2 py-0.5 rounded-full">
                        -{Math.round((1 - proMonthlyPrice / pro.precio_mensual_cop) * 100)}%
                      </span>
                    </div>
                  )}
                </div>
                <div className="font-jakarta font-extrabold text-[48px] theme-text tracking-tight mb-1">
                  {formatPrice(proMonthlyPrice)}
                  <span className="text-xl font-normal theme-text-muted"> / mes</span>
                </div>
                {proOverride && (
                  <p className="text-[12px] text-[#FF5C3A] font-semibold mb-2">
                    {proOverride.label ?? 'Precio especial'}
                  </p>
                )}
                {selectedMonths > 1 && (
                  <p className="text-[13px] theme-text-muted mb-2">
                    Total: <span className="theme-text font-semibold">{formatPrice(proTotalPrice)}</span>
                    <span className="ml-2 line-through theme-text-muted/70">{formatPrice(proOriginalTotal)}</span>
                  </p>
                )}
                <p className="text-[12px] theme-text-muted/80 mb-8">Sin trial · Activa inmediatamente</p>

                <a
                  href={`/checkout?plan=PRO&months=${selectedMonths}`}
                  className="block w-full text-center py-4 bg-[#FF5C3A] hover:bg-[#e84d2c] theme-text text-sm font-bold rounded-2xl transition-all hover:scale-[1.02] active:scale-95 mb-8 shadow-lg shadow-[#FF5C3A]/20"
                >
                  {pro.boton_texto}
                </a>

                <ul className="flex flex-col gap-4 flex-1">
                  {pro.features.map(f => (
                    <li key={f} className="flex items-start gap-3 text-[14px]">
                      <span className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 bg-[#FF5C3A]/20 mt-0.5">
                        <IconCheck />
                      </span>
                      <span className="theme-text/80">{f}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* ENTERPRISE CARD */}
              <div className="theme-bg-card theme-border border rounded-[2rem] p-8 md:p-10 flex flex-col min-h-[580px] hover:border-[#FF5C3A] transition-all duration-500">
                <div className="font-jakarta font-bold text-2xl theme-text mb-2">Enterprise</div>
                <p className="text-[14px] theme-text-muted mb-6">Para grandes operaciones</p>

                <div className="font-jakarta font-extrabold text-[36px] theme-text tracking-tight mb-2">
                  Custom
                </div>
                <p className="text-[12px] theme-text-muted/80 mb-8">Talk to sales for pricing</p>

                <a
                  href="https://wa.me/573105436281?text=Hola,%20me%20interesa%20conocer%20más%20sobre%20el%20Plan%20Enterprise%20de%20Lookitry."
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block w-full text-center py-4 bg-white hover:bg-gray-100 text-black text-sm font-bold rounded-2xl transition-all hover:scale-[1.02] active:scale-95 mb-8"
                >
                  {enterprise.boton_texto}
                </a>

                <ul className="flex flex-col gap-4 flex-1">
                  <li className="flex items-start gap-3 text-[14px]">
                    <span className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 bg-[#FF5C3A]/20 mt-0.5">
                      <IconCheck />
                    </span>
                    <span className="theme-text/80">Todo lo del Plan Pro</span>
                  </li>
                  <li className="flex items-start gap-3 text-[14px]">
                    <span className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 bg-[#FF5C3A]/20 mt-0.5">
                      <IconCheck />
                    </span>
                    <span className="text-[#FF5C3A] font-semibold">+50 productos en el probador</span>
                  </li>
                  <li className="flex items-start gap-3 text-[14px]">
                    <span className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 bg-[#FF5C3A]/20 mt-0.5">
                      <IconCheck />
                    </span>
                    <span className="text-[#FF5C3A] font-semibold">Volumen a medida de tu negocio</span>
                  </li>
                  <li className="flex items-start gap-3 text-[14px]">
                    <span className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 bg-[#FF5C3A]/20 mt-0.5">
                      <IconCheck />
                    </span>
                    <span className="text-[#FF5C3A] font-semibold">Marca Blanca</span>
                  </li>
                  <li className="flex items-start gap-3 text-[14px]">
                    <span className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 bg-[#FF5C3A]/20 mt-0.5">
                      <IconCheck />
                    </span>
                    <span className="text-[#FF5C3A] font-semibold">Panel de Analitica Avanzado</span>
                  </li>
                  <li className="flex items-start gap-3 text-[14px]">
                    <span className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 bg-[#FF5C3A]/20 mt-0.5">
                      <IconCheck />
                    </span>
                    <span className="text-[#FF5C3A] font-semibold">Acceso a API</span>
                  </li>
                </ul>
              </div>
            </div>

            <p className="text-center text-[13px] theme-text-muted/80 mt-10 font-medium">
              Pagos seguros con Wompi · Mastercard, Visa, PSE, Nequi
            </p>
          </div>
        </section>

{/* Comparativa Table */}
        <section className="py-16 px-4 md:px-6 theme-bg-base">
          <div className="max-w-4xl mx-auto">
            <h2 className="font-jakarta font-bold text-2xl md:text-3xl theme-text text-center mb-8">
              Comparativa completa
            </h2>
            <div className="theme-bg-card border border-white/5 rounded-2xl overflow-hidden shadow-2xl">
              <table className="w-full text-[13px] font-dm-sans">
                <thead>
                  <tr className="border-b border-white/5">
                    <th className="text-left px-5 py-4 font-bold theme-text-muted uppercase tracking-widest text-[9px] w-1/2">Característica</th>
                    <th className="text-center px-4 py-4 font-bold theme-text-muted uppercase tracking-widest text-[9px] w-1/6">Básico</th>
                    <th className="text-center px-4 py-4 font-bold text-[#FF5C3A] uppercase tracking-widest text-[9px] w-1/6">Pro</th>
                    <th className="text-center px-4 py-4 font-bold theme-text uppercase tracking-widest text-[9px] w-1/6">Enterprise</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  <tr className="hover:bg-white/[0.02] transition-colors">
                    <td className="px-5 py-4 theme-text/80 font-medium">Productos en el probador</td>
                    <td className="px-4 py-4 text-center"><span className="font-bold theme-text-muted">{basic.productos_max}</span></td>
                    <td className="px-4 py-4 text-center"><span className="font-bold text-[#FF5C3A]">{pro.productos_max}</span></td>
                    <td className="px-4 py-4 text-center"><span className="font-bold theme-text">{enterprise.productos_max}+</span></td>
                  </tr>
                  <tr className="hover:bg-white/[0.02] transition-colors">
                    <td className="px-5 py-4 theme-text/80 font-medium">Generaciones por mes</td>
                    <td className="px-4 py-4 text-center"><span className="font-bold theme-text-muted">{basic.generaciones_mensuales.toLocaleString('es-CO')}</span></td>
                    <td className="px-4 py-4 text-center"><span className="font-bold text-[#FF5C3A]">{pro.generaciones_mensuales.toLocaleString('es-CO')}</span></td>
                    <td className="px-4 py-4 text-center"><span className="font-bold theme-text">{enterprise.generaciones_mensuales.toLocaleString('es-CO')}+</span></td>
                  </tr>
                  {allFeatures.filter(f => 
                    f !== 'Template Bare, minimal y classical' && 
                    f !== 'Widget embebible (script)'
                  ).map(feature => {
                    if (
                      feature.includes('productos en el probador') ||
                      feature.includes('generaciones por mes') ||
                      feature.includes('Volumen a medida') ||
                      feature.includes('+50 productos')
                    ) return null;

                    const inPro = pro.features.includes(feature);
                    // Enterprise incluye todo lo de Pro + las suyas
                    const inEnterprise = inPro || enterprise.features.includes(feature);

                    return (
                      <tr key={feature} className="hover:bg-white/[0.02] transition-colors">
                        <td className="px-5 py-3.5 theme-text-muted/90">{feature}</td>
                        <td className="px-4 py-3.5 text-center">
                          {basic.features.includes(feature) 
                            ? <IconCheckTable /> 
                            : <span className="theme-text-muted/50 text-sm">—</span>
                          }
                        </td>
                        <td className="px-4 py-3.5 text-center">
                          {inPro 
                            ? <IconCheckTable /> 
                            : <span className="theme-text-muted/50 text-sm">—</span>
                          }
                        </td>
                        <td className="px-4 py-3.5 text-center">
                          {inEnterprise 
                            ? <IconCheckTable /> 
                            : <span className="theme-text-muted/50 text-sm">—</span>
                          }
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="py-24 md:py-32 px-6 md:px-8 theme-bg-base text-center relative overflow-hidden">
          <div
            className="absolute pointer-events-none"
            style={{ width: '800px', height: '400px', background: 'radial-gradient(ellipse, rgba(255,92,58,0.1) 0%, transparent 70%)', top: '50%', left: '50%', transform: 'translate(-50%,-50%)' }}
          />
          <div className="relative z-10 max-w-4xl mx-auto">
            <h2 className="font-jakarta font-black text-4xl md:text-6xl lg:text-7xl theme-text tracking-tighter mb-6 leading-[1]">
              ¿Listo para <span className="text-[#FF5C3A]">vender más</span>?<br />Empieza ahora.
            </h2>
            <p className="theme-text-muted text-lg md:text-xl mb-12 max-w-xl mx-auto font-dm-sans">
              Únete a las tiendas que ya están transformando su negocio con IA.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href={`/checkout?plan=PRO&months=${selectedMonths}`}
                className="inline-flex items-center justify-center gap-3 bg-[#FF5C3A] hover:bg-[#e84d2c] theme-text px-10 py-5 rounded-2xl font-bold text-sm transition-all hover:scale-105 shadow-xl shadow-[#FF5C3A]/20"
              >
                Contratar Pro <IconArrow />
              </a>
              <a
                href={`/checkout?plan=BASIC&months=${selectedMonths}`}
                className="inline-flex items-center justify-center gap-3 bg-white/5 hover:bg-white/10 theme-text px-10 py-5 rounded-2xl font-bold text-sm theme-border border transition-all"
              >
                Empezar con Básico
              </a>
            </div>
            <p className="theme-text-muted/80 text-sm mt-8">
              Sin tarjeta de crédito para comenzar · Cancela cuando quieras
            </p>
          </div>
        </section>
      </main>

      <LandingFooter />
    </div>
  );
}
