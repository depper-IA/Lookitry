'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, ShieldCheck, Clock, Sparkles, Camera, Check } from 'lucide-react';

const SectionTag = ({ text, light = false }: { text: string; light?: boolean }) => (
  <div
    className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-[9px] font-medium uppercase tracking-[0.15em] shadow-sm transition-all sm:mb-8 sm:px-4 sm:py-2 sm:text-[10px] sm:tracking-[0.2em] ${
      light
        ? 'bg-black/5 border-black/10 text-black/40 dark:bg-white/5 dark:border-white/10 dark:text-white/60'
        : 'bg-[#FF5C3A]/5 border-[#FF5C3A]/20 text-[#FF5C3A]'
    } mb-6`}
  >
    <span
      className={`h-1.5 w-1.5 rounded-full animate-pulse ${light ? 'bg-black/20 dark:bg-white/40' : 'bg-[#FF5C3A]'}`}
      aria-hidden="true"
    />
    {text}
  </div>
);

export default function LandingHero() {
  return (
    <section
      id="hero"
      className="relative flex min-h-screen items-start overflow-hidden bg-white px-4 pt-20 pb-16 dark:bg-[#0a0a0a] sm:px-6 sm:pt-24 sm:pb-24 md:px-12"
      aria-label="Seccion principal"
    >
      <div className="absolute inset-0 z-0" aria-hidden="true">
        <div className="bg-circle absolute top-[-10%] right-[-10%] h-[80vw] w-[80vw] rounded-full bg-[#FF5C3A]/5 blur-[200px]" />
        <div className="bg-circle absolute bottom-[-10%] left-[-10%] h-[60vw] w-[60vw] rounded-full bg-black/5 blur-[150px] dark:bg-white/5" />
        <div className="pointer-events-none absolute inset-0 bg-[url('/noise.svg')] opacity-20 mix-blend-overlay dark:opacity-20" />
      </div>

      <div className="relative z-10 mx-auto grid max-w-7xl grid-cols-1 items-center gap-10 lg:grid-cols-2 lg:gap-16">
        <div className="text-center lg:text-left">
          <SectionTag text="Revolucion Visual con IA" />
          <h1 className="mb-6 font-jakarta text-3xl font-black leading-[1.1] tracking-[-0.03em] sm:mb-8 sm:text-[44px] sm:tracking-[-0.04em] md:text-[56px] lg:text-[64px]">
            <span className="block text-[#0a0a0a] dark:text-white">Vende mas con el</span>
            <span className="block text-[#FF5C3A]">Probador Virtual</span>
            <span className="block text-[#0a0a0a] dark:text-white">N.1 de Latinoamerica.</span>
          </h1>
          <p className="mx-auto mb-8 max-w-xl font-dm-sans text-base font-light leading-[1.6] text-[#666] dark:text-white/80 sm:mb-12 sm:text-lg lg:mx-0">
            Tu tienda online, <span className="font-bold text-[#FF5C3A]">sin pagar un disenador.</span> Permite que tus clientes se prueben tu catalogo en segundos con IA.
          </p>

          <div className="flex flex-wrap justify-center gap-3 sm:gap-5 lg:justify-start">
            <Link
              href="/checkout?plan=TRIAL"
              className="group flex items-center gap-2 rounded-xl bg-[#FF5C3A] px-6 py-4 text-sm font-bold text-white shadow-xl shadow-[#FF5C3A]/20 transition-all hover:scale-105 hover:bg-[#ff7b5e] sm:gap-3 sm:rounded-2xl sm:px-10 sm:py-5 sm:text-base"
            >
              Obten Acceso Premium
              <ArrowRight size={18} className="transition-transform group-hover:translate-x-1" aria-hidden="true" />
            </Link>
            <Link
              href="#como-funciona"
              className="flex items-center gap-2 rounded-xl border border-black/10 bg-black/5 px-6 py-4 text-sm font-bold text-[#0a0a0a] transition-all hover:bg-black/10 dark:border-white/10 dark:bg-white/5 dark:text-white dark:hover:bg-white/10 sm:rounded-2xl sm:px-10 sm:py-5 sm:text-base"
            >
              Ver como funciona
            </Link>
          </div>

          <div className="mt-12 flex flex-wrap items-center justify-center gap-6 font-bold uppercase tracking-[0.2em] text-[#666] dark:text-white/80 sm:mt-16 sm:gap-10 sm:text-[10px] sm:tracking-[0.25em] lg:justify-start">
            <div className="flex items-center gap-2 transition-colors hover:text-[#FF5C3A] sm:gap-2.5">
              <ShieldCheck size={14} className="shrink-0 text-[#FF5C3A]" aria-hidden="true" /> 100% Seguro
            </div>
            <div className="flex items-center gap-2 transition-colors hover:text-[#FF5C3A] sm:gap-2.5">
              <Clock size={14} className="shrink-0 text-[#FF5C3A]" aria-hidden="true" /> Activacion 10min
            </div>
            <div className="flex items-center gap-2 transition-colors hover:text-[#FF5C3A] sm:gap-2.5">
              <Sparkles size={14} className="shrink-0 text-[#FF5C3A]" aria-hidden="true" /> IA Generativa
            </div>
          </div>
        </div>

        <div className="flex w-full items-center justify-center lg:justify-end">
          <div className="group relative z-10 w-full max-w-[400px] overflow-hidden rounded-2xl border border-white/10 bg-[#141414] p-3 shadow-[0_40px_100px_rgba(0,0,0,0.8)] sm:max-w-[500px] sm:rounded-[2rem] sm:p-4 lg:max-w-[620px]">
            <div className="mb-4 flex items-center gap-2 sm:mb-6 sm:gap-3" aria-hidden="true">
              <div className="flex gap-1 sm:gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-[#ff5c5c] sm:h-2 sm:w-2"></span>
                <span className="h-1.5 w-1.5 rounded-full bg-[#ffbd2e] sm:h-2 sm:w-2"></span>
                <span className="h-1.5 w-1.5 rounded-full bg-[#28c840] sm:h-2 sm:w-2"></span>
              </div>
              <div className="flex-1 truncate rounded-md border border-white/5 bg-[#1c1c1c] px-2 py-1 text-center font-dm-sans text-[7px] uppercase tracking-widest text-white/20 sm:px-4 sm:text-[9px]">
                lookitry.com/mi-marca
              </div>
            </div>

            <div className="group/upload relative mb-3 flex flex-col items-center justify-center rounded-xl border border-white/5 bg-[#1c1c1c] p-4 text-center sm:mb-4 sm:rounded-2xl sm:p-6">
              <div className="absolute top-2 left-4 text-[6px] font-bold uppercase tracking-widest text-white/20 sm:top-3 sm:left-6 sm:text-[8px]">Paso 1: Tu Foto</div>
              <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full border border-dashed border-white/10 bg-white/5 text-white/20 transition-all duration-300 group-hover/upload:border-[#FF5C3A]/30 sm:mb-4 sm:h-16 sm:w-16">
                <Camera size={24} strokeWidth={1} aria-hidden="true" />
              </div>
              <p className="text-[8px] font-bold uppercase tracking-widest text-white/40 sm:text-[10px]">Sube una selfie</p>
            </div>

            <div className="grid grid-cols-2 gap-2 sm:gap-4">
              <div className="relative aspect-[3/4] overflow-hidden rounded-xl border border-white/10 bg-[#1a1a1a] sm:rounded-2xl">
                <Image
                  src="/images/photo-1589156229687-496a31ad1d1f.jpeg"
                  alt="Modelo Probador Virtual Lookitry"
                  fill
                  className="object-cover"
                  sizes="(max-width: 600px) 100vw, 300px"
                />
                <div className="absolute top-2 left-2 rounded-full bg-[#FF5C3A] px-2 py-0.5 text-[6px] font-black uppercase tracking-tighter text-white shadow-xl sm:top-3 sm:left-4 sm:px-3 sm:py-1 sm:text-[8px]">
                  Original
                </div>
              </div>

              <div className="flex flex-col gap-2 sm:gap-3">
                <div className="mb-0.5 px-0.5 text-[7px] font-bold uppercase tracking-[0.15em] text-white/30 sm:mb-1 sm:px-1 sm:text-[8px] sm:tracking-[0.2em]">
                  Paso 2: Elige Producto
                </div>

                {[
                  { name: 'Camisa Lino Beige', price: '$120K', img: '/products/camisa_lino_beige.png', active: true },
                  { name: 'Zapatilla Urban', price: '$240K', img: '/images/photo-1549298916-b41d501d3772.jpeg', active: false },
                  { name: 'Bolso Artisan', price: '$180K', img: '/images/photo-1584917865442-de89df76afd3.jpeg', active: false },
                  { name: 'Zapatilla Blanca', price: '$350K', img: '/products/zapatilla_blanca.png', active: false }
                ].map((prod, i) => (
                  <div
                    key={i}
                    className={`group/item flex cursor-pointer items-center gap-2 rounded-lg border p-1.5 transition-all sm:gap-3 sm:rounded-xl sm:p-2.5 ${
                      prod.active ? 'border-[#FF5C3A] bg-[#FF5C3A]/10 shadow-lg shadow-[#FF5C3A]/5' : 'border-white/10 bg-white/5 hover:border-white/20'
                    }`}
                    role="button"
                    tabIndex={0}
                    aria-label={`Seleccionar ${prod.name}`}
                  >
                    <div className="relative h-8 w-8 flex-shrink-0 overflow-hidden rounded-lg bg-[#2a2a2a] sm:h-10 sm:w-10">
                      <Image src={prod.img} alt={prod.name} fill className="object-cover" />
                    </div>
                    <div className="flex min-w-0 flex-col overflow-hidden">
                      <span className={`truncate text-[8px] font-bold sm:text-[10px] ${prod.active ? 'text-white' : 'text-white/60'}`}>{prod.name}</span>
                      <span className="text-[7px] font-medium text-white/30 sm:text-[8px]">{prod.price}</span>
                    </div>
                    {prod.active && (
                      <div className="ml-auto flex h-3 w-3 shrink-0 items-center justify-center rounded-full bg-[#FF5C3A] sm:h-3.5 sm:w-3.5" aria-hidden="true">
                        <Check size={8} className="text-white" />
                      </div>
                    )}
                  </div>
                ))}

                <button className="mt-1 w-full rounded-lg bg-[#FF5C3A] py-2.5 text-[9px] font-bold uppercase tracking-widest text-white shadow-xl shadow-[#FF5C3A]/10 transition-all hover:bg-[#ff7b5e] active:scale-95 sm:mt-2 sm:rounded-xl sm:py-3.5 sm:text-[11px]">
                  Ver Probador IA
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
