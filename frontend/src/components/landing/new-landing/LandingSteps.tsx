'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';

const SectionTag = ({ text, light = false }: { text: string; light?: boolean }) => (
  <div className={`inline-flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full mb-6 sm:mb-8 font-medium text-[9px] sm:text-[10px] uppercase tracking-[0.15em] sm:tracking-[0.2em] border shadow-sm transition-all ${light
      ? 'bg-white/5 border-white/10 text-white/60 dark:bg-gray-100 dark:border-gray-200 dark:text-gray-600'
      : 'bg-[#FF5C3A]/5 border-[#FF5C3A]/20 text-[#FF5C3A]'
    }`}>
    <span className={`w-1.5 h-1.5 rounded-full animate-pulse ${light ? 'bg-white/40 dark:bg-gray-400' : 'bg-[#FF5C3A]'}`} aria-hidden="true" />
    {text}
  </div>
);

const STEPS = [
  {
    n: '01',
    title: 'Sube tu foto',
    desc: 'El cliente toma una selfie o sube una imagen desde su celular o computador.',
    img: '/steps/paso-1.webp',
    alt: 'Cliente subiendo una selfie al probador virtual',
    pos: 'object-top'
  },
  {
    n: '02',
    title: 'Elige el producto',
    desc: 'Selecciona la prenda, accesorio o calzado del catálogo de tu marca.',
    img: '/steps/paso-2.webp',
    alt: 'Selección de producto en el catálogo del probador virtual',
    pos: 'object-center'
  },
  {
    n: '03',
    title: 'Ve el resultado',
    desc: 'Nuestra tecnología de IA genera una imagen realista del producto puesto en tiempo real.',
    img: '/steps/paso-3.webp',
    alt: 'Resultado generado por IA del probador virtual de ropa',
    pos: 'object-top'
  },
];

export default function LandingSteps() {
  return (
    <section id="como-funciona" className="bg-black dark:bg-white py-16 sm:py-20 px-4 sm:px-6 md:px-12 relative" aria-label="Cómo funciona">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12 sm:mb-16 md:mb-24">
          <SectionTag text="Proceso impecable" />
          <h2 className="font-jakarta text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-white dark:text-black mb-4 sm:mb-6 md:mb-8">
            Tus clientes lo aman,<br /><span className="text-[#FF5C3A]">tú vendes más.</span>
          </h2>
          <p className="font-dm-sans text-base sm:text-lg text-white/60 dark:text-[#666] max-w-2xl mx-auto font-light leading-relaxed">
            Una experiencia de 3 pasos diseñada para eliminar la fricción técnica y maximizar el deleite del cliente final.
          </p>
        </div>

        <div className="steps-grid grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8 lg:gap-12 md:gap-10">
          {STEPS.map((step, i) => (
            <div
              key={i}
              className="step-card group relative"
            >
              <div className="relative aspect-[3/4] rounded-2xl sm:rounded-[2rem] md:rounded-[2.5rem] overflow-hidden mb-6 sm:mb-8 border border-white/10 dark:border-[#e8e4df] bg-[#1a1a1a] dark:bg-[#f0ece8] shadow-sm transition-all duration-500 group-hover:shadow-xl">
                <Image
                  src={step.img}
                  alt={step.alt}
                  fill
                  className={`object-cover ${step.pos} transition-transform duration-1000 group-hover:scale-110`}
                  sizes="(max-width: 768px) 100vw, 33vw"
                />
                <div className="absolute top-4 sm:top-6 md:top-8 left-4 sm:left-6 md:left-8 w-10 h-10 sm:w-11 sm:h-11 md:w-12 md:h-12 bg-[#FF5C3A] text-white rounded-xl sm:rounded-2xl flex items-center justify-center font-jakarta font-bold text-lg sm:text-xl shadow-2xl">
                  {step.n}
                </div>
              </div>
              <h3 className="font-jakarta text-xl sm:text-2xl font-bold text-white dark:text-black mb-3 sm:mb-4 transition-colors group-hover:text-[#FF5C3A]">{step.title}</h3>
              <p className="font-dm-sans text-white/60 dark:text-[#666] leading-relaxed text-sm font-light">
                {step.desc}
              </p>
            </div>
          ))}
        </div>

        <div className="flex justify-center mt-10 sm:mt-12 md:mt-16">
          <Link href="/trial-checkout" className="bg-[#FF5C3A] text-white px-6 sm:px-10 py-4 sm:py-5 rounded-xl sm:rounded-2xl font-bold hover:scale-105 transition-all shadow-xl shadow-[#FF5C3A]/20 text-sm sm:text-base">
            ¡Comenzar mi transformación ahora!
          </Link>
        </div>
      </div>
    </section>
  );
}
