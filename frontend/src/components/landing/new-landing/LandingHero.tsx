'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, ShieldCheck, Clock, Sparkles, Camera, Check } from 'lucide-react';

const SectionTag = ({ text, light = false }: { text: string; light?: boolean }) => (
  <div className={`inline-flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full mb-6 sm:mb-8 font-medium text-[9px] sm:text-[10px] uppercase tracking-[0.15em] sm:tracking-[0.2em] border shadow-sm transition-all ${light
      ? 'bg-black/5 border-black/10 text-black/40 dark:bg-white/5 dark:border-white/10 dark:text-white/60'
      : 'bg-[#FF5C3A]/5 border-[#FF5C3A]/20 text-[#FF5C3A]'
    }`}>
    <span className={`w-1.5 h-1.5 rounded-full animate-pulse ${light ? 'bg-black/20 dark:bg-white/40' : 'bg-[#FF5C3A]'}`} aria-hidden="true" />
    {text}
  </div>
);

export default function LandingHero() {
  return (
    <section id="hero" className="relative min-h-screen flex items-center pt-24 sm:pt-32 pb-16 sm:pb-24 px-4 sm:px-6 md:px-12 overflow-hidden bg-white dark:bg-[#0a0a0a]" aria-label="Sección principal">
      <div className="absolute inset-0 z-0" aria-hidden="true">
        <div className="bg-circle absolute top-[-10%] right-[-10%] w-[80vw] h-[80vw] bg-[#FF5C3A]/5 blur-[200px] rounded-full" />
        <div className="bg-circle absolute bottom-[-10%] left-[-10%] w-[60vw] h-[60vw] bg-black/5 dark:bg-white/5 blur-[150px] rounded-full" />
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 dark:opacity-20 pointer-events-none mix-blend-overlay" />
      </div>

      <div className="max-w-7xl mx-auto relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center">
        <div className="text-center lg:text-left">
          <SectionTag text="Revolución Visual con IA" />
          <h1 className="font-jakarta text-3xl sm:text-[44px] md:text-[56px] lg:text-[64px] font-black leading-[1.1] tracking-[-0.03em] sm:tracking-[-0.04em] mb-6 sm:mb-8">
            <span className="block text-[#0a0a0a] dark:text-white">Vende más con el</span>
            <span className="block text-[#FF5C3A]">Probador Virtual</span>
            <span className="block text-[#0a0a0a] dark:text-white">Nº1 de Latinoamérica.</span>
          </h1>
          <p className="font-dm-sans text-base sm:text-lg text-[#666] dark:text-white/80 max-w-xl mx-auto lg:mx-0 mb-8 sm:mb-12 leading-[1.6] font-light">
            Tu tienda online, <span className="text-[#FF5C3A] font-bold">sin pagar un diseñador.</span> Permite que tus clientes se prueben tu catálogo en segundos con IA.
          </p>

          <div className="flex flex-wrap justify-center lg:justify-start gap-3 sm:gap-5">
            <Link href="/checkout?plan=TRIAL" className="group bg-[#FF5C3A] text-white px-6 sm:px-10 py-4 sm:py-5 rounded-xl sm:rounded-2xl font-bold flex items-center gap-2 sm:gap-3 transition-all hover:scale-105 hover:bg-[#ff7b5e] shadow-xl shadow-[#FF5C3A]/20 text-sm sm:text-base">
              Obtén Acceso Premium
              <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" aria-hidden="true" />
            </Link>
            <Link href="#como-funciona" className="bg-black/5 dark:bg-white/5 text-[#0a0a0a] dark:text-white px-6 sm:px-10 py-4 sm:py-5 rounded-xl sm:rounded-2xl font-bold border border-black/10 dark:border-white/10 hover:bg-black/10 dark:hover:bg-white/10 transition-all flex items-center gap-2 text-sm sm:text-base">
               Ver cómo funciona
            </Link>
          </div>

          <div className="mt-12 sm:mt-16 flex flex-wrap justify-center lg:justify-start items-center gap-6 sm:gap-10 text-[#666] dark:text-white/80 font-bold text-[9px] sm:text-[10px] uppercase tracking-[0.2em] sm:tracking-[0.25em]">
            <div className="flex items-center gap-2 sm:gap-2.5 hover:text-[#FF5C3A] transition-colors">
              <ShieldCheck size={14} className="text-[#FF5C3A] shrink-0" aria-hidden="true" /> 100% Seguro
            </div>
            <div className="flex items-center gap-2 sm:gap-2.5 hover:text-[#FF5C3A] transition-colors">
              <Clock size={14} className="text-[#FF5C3A] shrink-0" aria-hidden="true" /> Activación 10min
            </div>
            <div className="flex items-center gap-2 sm:gap-2.5 hover:text-[#FF5C3A] transition-colors">
              <Sparkles size={14} className="text-[#FF5C3A] shrink-0" aria-hidden="true" /> IA Generativa
            </div>
          </div>
        </div>

        <div className="flex justify-center lg:justify-end items-center w-full">
          <div className="bg-[#141414] border border-white/10 shadow-[0_40px_100px_rgba(0,0,0,0.8)] rounded-2xl sm:rounded-[2rem] p-3 sm:p-4 w-full max-w-[400px] sm:max-w-[500px] lg:max-w-[620px] relative z-10 overflow-hidden group">
            {/* Browser Top Bar */}
            <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6" aria-hidden="true">
              <div className="flex gap-1 sm:gap-1.5">
                <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-[#ff5c5c]"></span>
                <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-[#ffbd2e]"></span>
                <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-[#28c840]"></span>
              </div>
              <div className="flex-1 bg-[#1c1c1c] border border-white/5 rounded-md px-2 sm:px-4 py-1 text-[7px] sm:text-[9px] text-white/20 text-center font-dm-sans uppercase tracking-widest truncate">
                lookitry.com/mi-marca
              </div>
            </div>

            <div className="bg-[#1c1c1c] border border-white/5 rounded-xl sm:rounded-2xl p-4 sm:p-6 flex flex-col items-center justify-center text-center relative group/upload mb-3 sm:mb-4">
              <div className="absolute top-2 sm:top-3 left-4 sm:left-6 text-[6px] sm:text-[8px] font-bold text-white/20 uppercase tracking-widest">Paso 1: Tu Foto</div>
              <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-white/5 flex items-center justify-center text-white/20 mb-3 sm:mb-4 border border-dashed border-white/10 group-hover/upload:border-[#FF5C3A]/30 transition-all duration-300">
                 <Camera size={24} strokeWidth={1} aria-hidden="true" />
              </div>
              <p className="text-[8px] sm:text-[10px] text-white/40 font-bold uppercase tracking-widest">Sube una selfie</p>
            </div>

            <div className="grid grid-cols-2 gap-2 sm:gap-4">
              {/* Left: Model */}
              <div className="relative aspect-[3/4] rounded-xl sm:rounded-2xl overflow-hidden border border-white/10 bg-[#1a1a1a]">
                <Image 
                  src="/images/photo-1589156229687-496a31ad1d1f.jpeg" 
                  alt="Modelo Probador Virtual Lookitry" 
                  fill 
                  className="object-cover" 
                  sizes="(max-width: 600px) 100vw, 300px"
                />
                <div className="absolute top-2 sm:top-3 left-2 sm:left-4 bg-[#FF5C3A] text-white px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-[6px] sm:text-[8px] font-black uppercase tracking-tighter shadow-xl">
                  Original
                </div>
              </div>

              {/* Right: Products List */}
              <div className="flex flex-col gap-2 sm:gap-3">
                <div className="text-[7px] sm:text-[8px] font-bold text-white/30 uppercase tracking-[0.15em] sm:tracking-[0.2em] mb-0.5 sm:mb-1 px-0.5 sm:px-1">Paso 2: Elige Producto</div>
                
                {[
                   { name: 'Camisa Lino Beige', price: '$120K', img: '/products/camisa_lino_beige.png', active: true },
                   { name: 'Zapatilla Urban', price: '$240K', img: '/images/photo-1549298916-b41d501d3772.jpeg', active: false },
                   { name: 'Bolso Artisan', price: '$180K', img: '/images/photo-1584917865442-de89df76afd3.jpeg', active: false },
                   { name: 'Zapatilla Blanca', price: '$350K', img: '/products/zapatilla_blanca.png', active: false }
                ].map((prod, i) => (
                  <div 
                    key={i} 
                    className={`group/item flex items-center gap-2 sm:gap-3 p-1.5 sm:p-2.5 rounded-lg sm:rounded-xl border transition-all cursor-pointer ${
                      prod.active 
                      ? 'bg-[#FF5C3A]/10 border-[#FF5C3A] shadow-lg shadow-[#FF5C3A]/5' 
                      : 'bg-white/5 border-white/10 hover:border-white/20'
                    }`}
                    role="button"
                    tabIndex={0}
                    aria-label={`Seleccionar ${prod.name}`}
                  >
                    <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-[#2a2a2a] overflow-hidden relative flex-shrink-0">
                      <Image src={prod.img} alt={prod.name} fill className="object-cover" />
                    </div>
                    <div className="flex flex-col overflow-hidden min-w-0">
                      <span className={`text-[8px] sm:text-[10px] font-bold truncate ${prod.active ? 'text-white' : 'text-white/60'}`}>{prod.name}</span>
                      <span className="text-[7px] sm:text-[8px] text-white/30 font-medium">{prod.price}</span>
                    </div>
                    {prod.active && (
                      <div className="ml-auto w-3 h-3 sm:w-3.5 sm:h-3.5 rounded-full bg-[#FF5C3A] flex items-center justify-center shrink-0" aria-hidden="true">
                         <Check size={8} className="text-white" />
                      </div>
                    )}
                  </div>
                ))}
                
                <button className="mt-1 sm:mt-2 w-full bg-[#FF5C3A] hover:bg-[#ff7b5e] text-white py-2.5 sm:py-3.5 rounded-lg sm:rounded-xl font-bold text-[9px] sm:text-[11px] shadow-xl shadow-[#FF5C3A]/10 transition-all uppercase tracking-widest active:scale-95">
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
