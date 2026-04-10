'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  Camera,
  Sparkles,
  Zap,
  ShoppingBag,
  ArrowRight,
  Smile,
  Maximize2,
  Share2,
  Infinity as InfinityIcon,
} from 'lucide-react';

import LandingNav from '@/components/landing/new-landing/LandingNav';
import LandingFooter from '@/components/landing/new-landing/LandingFooter';

const PREMIUM_FONTS = `
  @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=DM+Sans:ital,opsz,wght@0,100..1000;1,100..1000&display=swap');
  .font-jakarta { font-family: 'Plus Jakarta Sans', sans-serif; }
  .font-dm-sans { font-family: 'DM Sans', sans-serif; }
`;

export default function ProbadorVirtualContent() {
  const [currency, setCurrency] = useState<'COP' | 'USD'>('COP');

  useEffect(() => {
    const saved = localStorage.getItem('currency') as 'COP' | 'USD';
    if (saved) setCurrency(saved);
  }, []);

  const handleCurrencyChange = (c: 'COP' | 'USD') => {
    setCurrency(c);
    localStorage.setItem('currency', c);
  };

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#0a0a0a] font-dm-sans text-white selection:bg-[#FF5C3A]/30 selection:text-[#FF5C3A]">
      <style dangerouslySetInnerHTML={{ __html: PREMIUM_FONTS }} />

      <LandingNav currency={currency} onCurrencyChange={handleCurrencyChange} />

      <main className="px-6 pb-20 pt-24 sm:pt-28">
        <div className="mx-auto max-w-7xl">
          <div className="mb-40 mt-12 flex flex-col items-center text-center">
            <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-[#FF5C3A]/20 bg-[#FF5C3A]/10 px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-[#FF5C3A]">
              Tecnologia de Vanguardia
            </div>
            <h1 className="mb-10 font-jakarta text-[48px] font-black leading-[0.95] tracking-tight md:text-[84px]">
              La Nueva Forma de <span className="text-[#FF5C3A]">Comprar Moda.</span>
            </h1>
            <p className="mb-12 max-w-2xl text-xl font-medium leading-relaxed text-white/60">
              Elimina la incertidumbre del &quot;me quedara bien&quot; con nuestro probador virtual potenciado por IA generativa de alta fidelidad.
            </p>
            <div className="flex flex-wrap justify-center gap-6">
              <Link href="/marca/demo" className="rounded-2xl bg-[#FF5C3A] px-12 py-6 text-sm font-bold text-white shadow-xl shadow-[#FF5C3A]/30 transition-all hover:scale-105">
                Prueba Premium
              </Link>
              <Link href="/checkout?plan=TRIAL" className="rounded-2xl border border-white/10 bg-white/5 px-12 py-6 text-sm font-bold text-white transition-all hover:bg-white/10">
                Activar para mi Marca
              </Link>
            </div>
          </div>

          <div className="mb-52 grid grid-cols-1 gap-10 md:grid-cols-3">
            {[
              {
                title: '1. Sube tu Selfie',
                desc: 'Solo una foto de cuerpo completo desde tu camara. Sin necesidad de apps extra.',
                icon: <Camera size={32} className="text-[#FF5C3A]" />,
              },
              {
                title: '2. Escoge la Prenda',
                desc: 'Navega por el catálogo de la marca y elige el outfit que quieres probar.',
                icon: <ShoppingBag size={32} className="text-[#FF5C3A]" />,
              },
              {
                title: '3. Mira el Resultado',
                desc: 'En segundos, nuestra IA ajustara la prenda a tu cuerpo con sombras y texturas realistas.',
                icon: <Sparkles size={32} className="text-[#FF5C3A]" />,
              },
            ].map((step, i) => (
              <div key={i} className="group text-center">
                <div className="mx-auto mb-10 flex h-24 w-24 items-center justify-center rounded-[2rem] border border-white/10 bg-white/5 transition-all duration-500 group-hover:border-[#FF5C3A]/40 group-hover:bg-[#FF5C3A]/10">
                  {step.icon}
                </div>
                <h4 className="mb-6 font-jakarta text-2xl font-bold">{step.title}</h4>
                <p className="mx-auto max-w-xs text-sm leading-relaxed text-white/40">{step.desc}</p>
              </div>
            ))}
          </div>

          <div className="relative mb-40 grid grid-cols-1 items-center gap-20 overflow-hidden rounded-[4rem] bg-white p-12 md:grid-cols-2 md:p-24">
            <div className="pointer-events-none absolute top-0 right-0 h-full w-1/2 bg-[#FF5C3A]/5" />
            <div>
              <h2 className="mb-10 font-jakarta text-4xl font-black leading-tight text-[#0a0a0a] md:text-6xl">
                Reduce un <span className="text-[#FF5C3A]">40%</span> las devoluciones.
              </h2>
              <div className="space-y-6">
                {[
                  'Confianza inmediata en el talle y estilo.',
                  'Aumento del 30% en la tasa de conversion.',
                  'Experiencia de compra ludica y viralizable.',
                  'Integración nativa con tu catálogo actual.',
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-4 font-bold text-[#0a0a0a]/80">
                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-[#FF5C3A]">
                      <ArrowRight size={14} className="text-white" />
                    </div>
                    {item}
                  </div>
                ))}
              </div>
            </div>
            <div className="relative aspect-square">
              <div className="absolute inset-4 overflow-hidden rounded-[3rem] border-[12px] border-[#0a0a0a]/5 shadow-2xl">
                <div className="flex h-full w-full items-center justify-center bg-zinc-100">
                  <Image src="/logo.svg" alt="Preview IA" width={120} height={120} className="opacity-10 grayscale" />
                </div>
              </div>
            </div>
          </div>

          <div className="mb-52 grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4">
            {[
              { title: 'Latencia', value: '< 5s', icon: <Zap size={20} /> },
              { title: 'Precision', value: '98%', icon: <Maximize2 size={20} /> },
              { title: 'Engagement', value: 'x3.5', icon: <Smile size={20} /> },
              { title: 'Social Sharing', value: 'Viral', icon: <Share2 size={20} /> },
            ].map((stat, i) => (
              <div key={i} className="group relative cursor-default overflow-hidden rounded-[2.5rem] border border-white/5 bg-white/5 p-10 text-center transition-all hover:bg-[#FF5C3A]">
                <div className="mx-auto mb-6 flex h-10 w-10 items-center justify-center rounded-full bg-white/5 group-hover:bg-white/20">
                  {stat.icon}
                </div>
                <h5 className="mb-2 font-jakarta text-3xl font-bold transition-transform group-hover:scale-110">{stat.value}</h5>
                <p className="text-xs font-bold uppercase tracking-widest text-white/30 group-hover:text-white/70">{stat.title}</p>
              </div>
            ))}
          </div>

          <div className="mx-auto mb-40 max-w-4xl text-center">
            <h2 className="mb-12 font-jakarta text-4xl font-black tracking-tight md:text-7xl">
              Listo para el <br />
              <span className="text-[#FF5C3A]">Futuro de la Moda?</span>
            </h2>
            <Link
              href="/checkout?plan=TRIAL"
              className="inline-flex items-center gap-4 rounded-[2.5rem] bg-[#FF5C3A] px-16 py-8 text-lg font-black text-white shadow-2xl shadow-[#FF5C3A]/20 transition-all hover:scale-105 active:scale-95"
            >
              Empezar Ahora <InfinityIcon size={24} />
            </Link>
          </div>
        </div>
      </main>

      <LandingFooter />
    </div>
  );
}
