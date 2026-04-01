'use client';

import React from 'react';
import Link from 'next/link';
import { Check } from 'lucide-react';
import { PricingConfig } from '@/lib/pricing';
import { formatCurrency, formatPrice as formatDynamicPrice } from '@/utils/currency';

interface LandingPricingProps {
  pricing: PricingConfig;
  currency: 'COP' | 'USD';
  trm: number;
}

const SectionTag = ({ text, light = false }: { text: string; light?: boolean }) => (
  <div className={`section-tag inline-flex items-center gap-2 px-4 py-2 rounded-full mb-8 font-medium text-[10px] uppercase tracking-[0.2em] border shadow-sm transition-all ${light
      ? 'bg-white/5 border-white/10 text-white/60'
      : 'bg-[#FF5C3A]/5 border-[#FF5C3A]/20 text-[#FF5C3A]'
    }`}>
    <span className={`w-1.5 h-1.5 rounded-full animate-pulse ${light ? 'bg-white/40' : 'bg-[#FF5C3A]'}`} />
    {text}
  </div>
);

export default function LandingPricing({ pricing, currency, trm }: LandingPricingProps) {
  const formatPrice = (cop: number) => {
    return currency === 'USD'
      ? formatDynamicPrice(cop, 'USD', trm)
      : formatCurrency(cop);
  };

  return (
    <section id="planes" className="py-40 px-6 md:px-12 bg-[#0d0d0d] relative overflow-hidden">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[100%] h-[1px] bg-gradient-to-r from-transparent via-white/10 to-transparent" />

      <div className="max-w-[1400px] mx-auto px-6">
        <div className="text-center mb-24">
          <SectionTag text="Planes de Crecimiento" light />
          <h2 className="font-jakarta text-4xl md:text-5xl font-bold tracking-tight text-white mb-6">
            Precios claros, <span className="text-[#FF5C3A]">sin sorpresas.</span>
          </h2>
          <p className="font-dm-sans text-lg text-white/70 max-w-xl mx-auto">Activa tu plan en minutos con pasarelas 100% seguras y soporte en español.</p>
        </div>

        <div className="features-grid flex flex-wrap justify-center items-stretch gap-8 lg:gap-10">
          {/* Básico */}
          <div className="feature-card w-full md:w-[calc(50%-2rem)] lg:w-[calc(33.33%-2.5rem)] max-w-sm bg-[#1a1a1a] border border-white/10 rounded-[3rem] p-10 flex flex-col hover:border-[#FF5C3A]/60 transition-all duration-500">
            <div className="text-[#FF5C3A] font-bold text-[10px] uppercase tracking-[.25em] mb-4">Emprendedores</div>
            <h3 className="font-jakarta font-bold text-3xl text-white mb-4">Básico</h3>
            <div className="flex items-baseline gap-2 mb-8">
              <span className="font-jakarta font-black text-4xl text-white tracking-tighter">{formatPrice(pricing.basic.precio_mensual_cop)}</span>
              <span className="text-[12px] font-bold text-white/60 uppercase tracking-widest">{currency} / mes</span>
            </div>
            <div className="h-[1px] w-full bg-white/10 mb-10" />
            <ul className="flex flex-col gap-5 mb-12 shrink-0">
              {['5 productos activos', `${pricing.basic.generaciones_mensuales} IA generations / mes`, 'Widget embebible', 'Soporte vía correo'].map(f => (
                <li key={f} className="flex items-center gap-3 text-xs text-white/90 font-medium">
                  <div className="w-5 h-5 rounded-full bg-[#FF5C3A]/10 flex items-center justify-center shrink-0">
                    <Check size={12} className="text-[#FF5C3A]" />
                  </div>
                  {f}
                </li>
              ))}
            </ul>
            <Link href={`/checkout?plan=BASIC&currency=${currency}`} className="mt-auto w-full py-5 rounded-[1.5rem] bg-white/10 border border-white/10 text-white font-bold text-sm text-center hover:bg-white hover:text-black transition-all">
              Contratar Básico
            </Link>
          </div>

          {/* Pro */}
          <div className="feature-card w-full md:w-[calc(50%-2rem)] lg:w-[calc(33.33%-2.5rem)] max-w-sm bg-[#1c1c1c] border border-[#FF5C3A]/60 rounded-[3rem] p-10 flex flex-col relative z-10 shadow-[0_40px_100px_rgba(255,92,58,0.15)] scale-[1.02]">
            <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-[#FF5C3A] text-white text-[9px] font-bold uppercase tracking-widest px-5 py-2 rounded-full shadow-lg">Plan Más Solicitado</div>
            <div className="text-[#FF5C3A] font-bold text-[10px] uppercase tracking-[.25em] mb-4">Profesional</div>
            <h3 className="font-jakarta font-bold text-3xl text-white mb-4">Pro</h3>
            <div className="flex items-baseline gap-2 mb-8">
              <span className="font-jakarta font-black text-4xl text-white tracking-tighter">{formatPrice(pricing.pro.precio_mensual_cop)}</span>
              <span className="text-[12px] font-bold text-white/60 uppercase tracking-widest">{currency} / mes</span>
            </div>
            <div className="h-[1px] w-full bg-white/10 mb-10" />
            <ul className="flex flex-col gap-5 mb-12 shrink-0">
              {['15 productos activos', `${pricing.pro.generaciones_mensuales} IA generations / mes`, 'Multi-templates avanzados', 'Prioridad y Config Asistida', 'Marca blanca básica'].map(f => (
                <li key={f} className="flex items-center gap-3 text-xs text-white/80 font-medium">
                  <div className="w-5 h-5 rounded-full bg-[#FF5C3A]/20 flex items-center justify-center shrink-0">
                    <Check size={12} className="text-[#FF5C3A]" />
                  </div>
                  {f}
                </li>
              ))}
            </ul>
            <Link href={`/checkout?plan=PRO&currency=${currency}`} className="mt-auto w-full py-5 rounded-[1.5rem] bg-[#FF5C3A] text-white font-bold text-sm text-center hover:bg-white hover:text-black transition-all shadow-xl shadow-[#FF5C3A]/20">
              Activar Plan Pro
            </Link>
          </div>

          {/* Enterprise */}
          <div className="feature-card w-full md:w-[calc(50%-2rem)] lg:w-[calc(33.33%-2.5rem)] max-w-sm bg-[#1a1a1a] border border-white/10 rounded-[3rem] p-10 flex flex-col hover:border-[#FF5C3A]/60 transition-all duration-500">
            <div className="text-[#FF5C3A] font-bold text-[10px] uppercase tracking-[.25em] mb-4">Retail y Corp</div>
            <h3 className="font-jakarta font-bold text-3xl text-white mb-4">Enterprise</h3>
            <div className="flex items-baseline gap-2 mb-8">
              <span className="font-jakarta font-black text-4xl text-white tracking-tighter">Custom</span>
            </div>
            <div className="h-[1px] w-full bg-white/10 mb-10" />
            <ul className="flex flex-col gap-5 mb-12 shrink-0">
              {['Catálogo masivo', 'Generaciones ilimitadas', 'Acceso API full', 'Gerente de cuenta 24/7', 'Embed especializado'].map(f => (
                <li key={f} className="flex items-center gap-3 text-xs text-white/90 font-medium">
                  <div className="w-5 h-5 rounded-full bg-[#FF5C3A]/10 flex items-center justify-center shrink-0">
                    <Check size={12} className="text-[#FF5C3A]" />
                  </div>
                  {f}
                </li>
              ))}
            </ul>
            <Link href="/contacto" className="mt-auto w-full py-5 rounded-[1.5rem] bg-white/10 border border-white/10 text-white font-bold text-sm text-center hover:border-[#FF5C3A] hover:text-[#FF5C3A] transition-all">
              Hablar con Ventas
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
