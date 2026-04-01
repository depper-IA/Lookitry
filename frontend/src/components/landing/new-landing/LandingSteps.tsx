'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';

const SectionTag = ({ text, light = false }: { text: string; light?: boolean }) => (
  <div className={`section-tag inline-flex items-center gap-2 px-4 py-2 rounded-full mb-8 font-medium text-[10px] uppercase tracking-[0.2em] border shadow-sm transition-all ${light
      ? 'bg-white/5 border-white/10 text-white/60'
      : 'bg-[#FF5C3A]/5 border-[#FF5C3A]/20 text-[#FF5C3A]'
    }`}>
    <span className={`w-1.5 h-1.5 rounded-full animate-pulse ${light ? 'bg-white/40' : 'bg-[#FF5C3A]'}`} />
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
    <section id="como-funciona" className="bg-white py-20 px-6 md:px-12 relative">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-24">
          <SectionTag text="Proceso impecable" />
          <h2 className="font-jakarta text-4xl md:text-6xl font-bold tracking-tight text-[#0a0a0a] mb-8">
            Tus clientes lo aman,<br /><span className="text-[#FF5C3A]">tú vendes más.</span>
          </h2>
          <p className="font-dm-sans text-lg text-[#666] max-w-2xl mx-auto font-light leading-relaxed">
            Una experiencia de 3 pasos diseñada para eliminar la fricción técnica y maximizar el deleite del cliente final.
          </p>
        </div>

        <div className="steps-grid grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-16">
          {STEPS.map((step, i) => (
            <div
              key={i}
              className="step-card group relative"
            >
              <div className="relative aspect-[3/4] rounded-[2.5rem] overflow-hidden mb-8 border border-[#e8e4df] bg-[#f0ece8] shadow-sm transition-all duration-500 group-hover:shadow-xl">
                <Image
                  src={step.img}
                  alt={step.alt}
                  fill
                  className={`object-cover ${step.pos} transition-transform duration-1000 group-hover:scale-110`}
                  sizes="(max-width: 768px) 100vw, 33vw"
                />
                <div className="absolute top-8 left-8 w-12 h-12 bg-[#FF5C3A] text-white rounded-2xl flex items-center justify-center font-jakarta font-bold text-xl shadow-2xl">
                  {step.n}
                </div>
              </div>
              <h3 className="font-jakarta text-2xl font-bold text-[#0a0a0a] mb-4 transition-colors group-hover:text-[#FF5C3A]">{step.title}</h3>
              <p className="font-dm-sans text-[#666] leading-relaxed text-sm font-light">
                {step.desc}
              </p>
            </div>
          ))}
        </div>

        <div className="flex justify-center mt-16">
          <Link href="/register" className="bg-[#FF5C3A] text-white px-10 py-5 rounded-2xl font-bold hover:scale-105 transition-all shadow-xl shadow-[#FF5C3A]/20">
            ¡Comenzar mi transformación ahora!
          </Link>
        </div>
      </div>
    </section>
  );
}
