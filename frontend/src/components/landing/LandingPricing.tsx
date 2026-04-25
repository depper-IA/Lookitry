'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Check, Tag } from 'lucide-react';
import { PricingConfig } from '@/lib/pricing';
import { formatCurrency, formatPrice as formatDynamicPrice } from '@/utils/currency';
import { useActivePromotions } from '@/hooks/useActivePromotions';

interface LandingPricingProps {
  pricing: PricingConfig;
  currency: 'COP' | 'USD';
  trm: number;
}

const SectionTag = ({ text, light = false }: { text: string; light?: boolean }) => (
  <div className={`inline-flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full mb-6 sm:mb-8 font-medium text-[9px] sm:text-[10px] uppercase tracking-[0.15em] sm:tracking-[0.2em] border shadow-sm transition-all ${light
      ? 'bg-black/5 border-black/10 text-black/40 dark:bg-white/5 dark:border-white/10 dark:text-white/60'
      : 'bg-[#FF5C3A]/5 border-[#FF5C3A]/20 text-[#FF5C3A]'
    }`}>
    <span className={`w-1.5 h-1.5 rounded-full animate-pulse ${light ? 'bg-black/20 dark:bg-white/40' : 'bg-[#FF5C3A]'}`} aria-hidden="true" />
    {text}
  </div>
);

export default function LandingPricing({ pricing, currency, trm }: LandingPricingProps) {
  const { planOverrides } = useActivePromotions();

  const formatPrice = (cop: number) => {
    return currency === 'USD'
      ? formatDynamicPrice(cop, 'USD', trm)
      : formatCurrency(cop);
  };

  const basicOverride = planOverrides.BASIC;
  const proOverride = planOverrides.PRO;

  const basicPrice = basicOverride ? basicOverride.override_price : pricing.basic.precio_mensual_cop;
  const basicOriginal = basicOverride ? basicOverride.original_price : pricing.basic.precio_mensual_cop;
  const basicLabel = basicOverride?.label;

  const proPrice = proOverride ? proOverride.override_price : pricing.pro.precio_mensual_cop;
  const proOriginal = proOverride ? proOverride.original_price : pricing.pro.precio_mensual_cop;
  const proLabel = proOverride?.label;

  const hasBasicDiscount = basicPrice < pricing.basic.precio_mensual_cop;
  const hasProDiscount = proPrice < pricing.pro.precio_mensual_cop;

  return (
    <section id="planes" className="py-20 sm:py-24 md:py-32 lg:py-40 px-4 sm:px-6 bg-white dark:bg-black relative overflow-hidden" aria-label="Planes y precios">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[100%] h-[1px] bg-gradient-to-r from-transparent via-black/10 dark:via-white/10 to-transparent" aria-hidden="true" />

      <div className="max-w-7xl mx-auto px-0 sm:px-6">
        <div className="text-center mb-12 sm:mb-16 md:mb-20 lg:mb-24">
          <SectionTag text="Planes de Crecimiento" light />
          <h2 className="font-jakarta text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-black dark:text-white mb-4 sm:mb-6">
            Precios claros, <span className="text-[#FF5C3A]">sin sorpresas.</span>
          </h2>
          <p className="font-dm-sans text-base sm:text-lg text-[#555] dark:text-white/70 max-w-xl mx-auto">Activa tu plan en minutos con pasarelas 100% seguras y soporte en español.</p>
        </div>

        <div className="features-grid flex flex-wrap justify-center items-stretch gap-6 sm:gap-8 lg:gap-10">
          {/* Básico */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="feature-card w-full sm:w-[calc(50%-1.5rem)] lg:w-[calc(33.33%-2.5rem)] max-w-sm bg-[#f8f6f4] dark:bg-[#1a1a1a] border border-[#e8e4df] dark:border-white/10 rounded-2xl sm:rounded-[2.5rem] md:rounded-[3rem] p-6 sm:p-8 md:p-10 flex flex-col hover:border-[#FF5C3A]/60 transition-all duration-500 relative hover:shadow-xl hover:shadow-black/5"
          >
            {hasBasicDiscount && basicLabel && (
              <div className="absolute -top-3 sm:-top-4 left-1/2 -translate-x-1/2 bg-emerald-500 text-white text-[8px] sm:text-[9px] font-bold uppercase tracking-widest px-4 sm:px-5 py-1.5 sm:py-2 rounded-full shadow-lg flex items-center gap-1.5 whitespace-nowrap z-10">
                <Tag size={10} aria-hidden="true" /> {basicLabel}
              </div>
            )}
            <div className="text-[#FF5C3A] font-bold text-[9px] sm:text-[10px] uppercase tracking-[.2em] sm:tracking-[.25em] mb-3 sm:mb-4">Emprendedores</div>
            <h3 className="font-jakarta font-bold text-2xl sm:text-3xl text-black dark:text-white mb-3 sm:mb-4">Básico</h3>
            <div className="flex flex-col mb-6 sm:mb-8">
              <div className="flex items-baseline gap-2">
                <span className="font-jakarta font-black text-3xl sm:text-4xl text-black dark:text-white tracking-tighter">{formatPrice(basicPrice)}</span>
                  <span className="text-[10px] sm:text-[12px] font-bold text-[#555] dark:text-white/60 uppercase tracking-widest">{currency} / mes</span>
              </div>
              {hasBasicDiscount && basicOriginal > basicPrice && (
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-[12px] sm:text-[14px] text-[#666]/40 dark:text-white/40 line-through">{formatPrice(basicOriginal)}</span>
                  <span className="text-[10px] sm:text-[11px] font-bold text-emerald-500 dark:text-emerald-400">-{Math.round((1 - basicPrice / basicOriginal) * 100)}%</span>
                </div>
              )}
            </div>
            <div className="h-[1px] w-full bg-black/10 dark:bg-white/10 mb-6 sm:mb-8 md:mb-10" />
            <ul className="flex flex-col gap-4 sm:gap-5 mb-8 sm:mb-10 md:mb-12 shrink-0">
              {['5 productos activos', `${pricing.basic.generaciones_mensuales} IA generations / mes`, 'Widget embebible', 'Soporte vía correo'].map(f => (
                <li key={f} className="flex items-center gap-3 text-xs text-[#333] dark:text-white/90 font-medium">
                  <div className="w-5 h-5 rounded-full bg-[#FF5C3A]/10 flex items-center justify-center shrink-0" aria-hidden="true">
                    <Check size={12} className="text-[#FF5C3A]" />
                  </div>
                  {f}
                </li>
              ))}
            </ul>
            <Link href={`/checkout?plan=BASIC&currency=${currency}`} className="mt-auto w-full py-4 sm:py-5 rounded-xl sm:rounded-[1.5rem] bg-black/10 dark:bg-white/10 border border-black/10 dark:border-white/10 text-black dark:text-white font-bold text-sm text-center hover:bg-[#FF5C3A] hover:text-white hover:border-[#FF5C3A] transition-all active:scale-95">
              Contratar Básico
            </Link>
          </motion.div>

          {/* Pro */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.6, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
            className="feature-card w-full sm:w-[calc(50%-1.5rem)] lg:w-[calc(33.33%-2.5rem)] max-w-sm bg-[#1c1c1c] dark:bg-[#1c1c1c] border border-[#FF5C3A]/60 rounded-2xl sm:rounded-[2.5rem] md:rounded-[3rem] p-6 sm:p-8 md:p-10 flex flex-col relative z-10 shadow-[0_40px_100px_rgba(255,92,58,0.15)] scale-[1.02] hover:shadow-[0_50px_120px_rgba(255,92,58,0.25)] transition-all duration-500"
          >
            {hasProDiscount && proLabel && (
              <div className="absolute -top-3 sm:-top-4 left-1/2 -translate-x-1/2 bg-emerald-500 text-white text-[8px] sm:text-[9px] font-bold uppercase tracking-widest px-4 sm:px-5 py-1.5 sm:py-2 rounded-full shadow-lg flex items-center gap-1.5 whitespace-nowrap z-10">
                <Tag size={10} aria-hidden="true" /> {proLabel}
              </div>
            )}
            {!hasProDiscount && (
              <div className="absolute -top-3 sm:-top-4 left-1/2 -translate-x-1/2 bg-[#FF5C3A] text-white text-[8px] sm:text-[9px] font-bold uppercase tracking-widest px-4 sm:px-5 py-1.5 sm:py-2 rounded-full shadow-lg whitespace-nowrap z-10">Plan Más Solicitado</div>
            )}
            <div className="text-[#FF5C3A] font-bold text-[9px] sm:text-[10px] uppercase tracking-[.2em] sm:tracking-[.25em] mb-3 sm:mb-4">Profesional</div>
            <h3 className="font-jakarta font-bold text-2xl sm:text-3xl text-white mb-3 sm:mb-4">Pro</h3>
            <div className="flex flex-col mb-6 sm:mb-8">
              <div className="flex items-baseline gap-2">
                <span className="font-jakarta font-black text-3xl sm:text-4xl text-white tracking-tighter">{formatPrice(proPrice)}</span>
                <span className="text-[10px] sm:text-[12px] font-bold text-white/60 uppercase tracking-widest">{currency} / mes</span>
              </div>
              {hasProDiscount && proOriginal > proPrice && (
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-[12px] sm:text-[14px] text-white/40 line-through">{formatPrice(proOriginal)}</span>
                  <span className="text-[10px] sm:text-[11px] font-bold text-emerald-400">-{Math.round((1 - proPrice / proOriginal) * 100)}%</span>
                </div>
              )}
            </div>
            <div className="h-[1px] w-full bg-white/10 mb-6 sm:mb-8 md:mb-10" />
            <ul className="flex flex-col gap-4 sm:gap-5 mb-8 sm:mb-10 md:mb-12 shrink-0">
              {['15 productos activos', `${pricing.pro.generaciones_mensuales} IA generations / mes`, 'Multi-templates avanzados', 'Prioridad y Config Asistida', 'Marca blanca básica'].map(f => (
                <li key={f} className="flex items-center gap-3 text-xs text-white/80 font-medium">
                  <div className="w-5 h-5 rounded-full bg-[#FF5C3A]/20 flex items-center justify-center shrink-0" aria-hidden="true">
                    <Check size={12} className="text-[#FF5C3A]" />
                  </div>
                  {f}
                </li>
              ))}
            </ul>
            <Link href={`/checkout?plan=PRO&currency=${currency}`} className="mt-auto w-full py-4 sm:py-5 rounded-xl sm:rounded-[1.5rem] bg-[#FF5C3A] text-white font-bold text-sm text-center hover:bg-white hover:text-black transition-all shadow-xl shadow-[#FF5C3A]/20 active:scale-95">
              Activar Plan Pro
            </Link>
          </motion.div>

          {/* Enterprise */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.6, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="feature-card w-full sm:w-[calc(50%-1.5rem)] lg:w-[calc(33.33%-2.5rem)] max-w-sm bg-[#f8f6f4] dark:bg-[#1a1a1a] border border-[#e8e4df] dark:border-white/10 rounded-2xl sm:rounded-[2.5rem] md:rounded-[3rem] p-6 sm:p-8 md:p-10 flex flex-col hover:border-[#FF5C3A]/60 transition-all duration-500 hover:shadow-xl hover:shadow-black/5"
          >
            <div className="text-[#FF5C3A] font-bold text-[9px] sm:text-[10px] uppercase tracking-[.2em] sm:tracking-[.25em] mb-3 sm:mb-4">Retail y Corp</div>
            <h3 className="font-jakarta font-bold text-2xl sm:text-3xl text-black dark:text-white mb-3 sm:mb-4">Enterprise</h3>
            <div className="flex items-baseline gap-2 mb-6 sm:mb-8">
              <span className="font-jakarta font-black text-3xl sm:text-4xl text-black dark:text-white tracking-tighter">Custom</span>
            </div>
            <div className="h-[1px] w-full bg-black/10 dark:bg-white/10 mb-6 sm:mb-8 md:mb-10" />
            <ul className="flex flex-col gap-4 sm:gap-5 mb-8 sm:mb-10 md:mb-12 shrink-0">
              {['Catálogo masivo', 'Generaciones ilimitadas', 'Acceso API full', 'Gerente de cuenta 24/7', 'Embed especializado'].map(f => (
                <li key={f} className="flex items-center gap-3 text-xs text-[#333] dark:text-white/90 font-medium">
                  <div className="w-5 h-5 rounded-full bg-[#FF5C3A]/10 flex items-center justify-center shrink-0" aria-hidden="true">
                    <Check size={12} className="text-[#FF5C3A]" />
                  </div>
                  {f}
                </li>
              ))}
            </ul>
            <Link href="/contacto" className="mt-auto w-full py-4 sm:py-5 rounded-xl sm:rounded-[1.5rem] bg-black/10 dark:bg-white/10 border border-black/10 dark:border-white/10 text-black dark:text-white font-bold text-sm text-center hover:border-[#FF5C3A] hover:text-[#FF5C3A] dark:hover:text-[#FF5C3A] transition-all active:scale-95">
              Hablar con Ventas
            </Link>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
