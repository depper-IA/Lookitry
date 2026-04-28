'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';

const cardVariants = {
  hidden: { opacity: 0, y: 50, scale: 0.9, rotateX: 10 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    scale: 1,
    rotateX: 0,
    transition: {
      delay: i * 0.15,
      duration: 0.7,
      ease: [0.22, 1, 0.36, 1] as const,
    },
  }),
};

const staggerContainer = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.12,
      delayChildren: 0.1,
    },
  },
};

const SectionTag = ({ text, light = false }: { text: string; light?: boolean }) => (
  <div className={`inline-flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full mb-6 sm:mb-8 font-medium text-[9px] sm:text-[10px] uppercase tracking-[0.15em] sm:tracking-[0.2em] border shadow-sm ${light
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
    title: 'Elige el producto',
    desc: 'Selecciona la prenda, accesorio o calzado del catálogo de tu marca.',
    img: '/steps/paso-2.webp',
    alt: 'Seleccion de producto en el catalogo del probador virtual',
    pos: 'object-center'
  },
  {
    n: '02',
    title: 'Sube la foto',
    desc: 'El cliente toma una selfie o sube una imagen desde su celular o computador.',
    img: '/steps/paso-1.webp',
    alt: 'Cliente subiendo una selfie al probador virtual',
    pos: 'object-top'
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
    <section id="como-funciona" className="bg-white dark:bg-black py-16 sm:py-20 px-4 sm:px-6 md:px-12 relative" aria-label="Como funciona">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-50px" }}
          variants={staggerContainer}
          className="text-center mb-12 sm:mb-16 md:mb-24"
        >
          <motion.div variants={cardVariants} custom={0}>
            <SectionTag text="Proceso impecable" />
          </motion.div>
          <motion.h2
            variants={cardVariants}
            custom={1}
            className="font-jakarta text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-black dark:text-white mb-4 sm:mb-6 md:mb-8"
          >
            Tus clientes lo aman,<br /><span className="text-[#FF5C3A]">tu vendes más.</span>
          </motion.h2>
          <motion.p
            variants={cardVariants}
            custom={2}
            className="font-dm-sans text-base sm:text-lg text-[#666] dark:text-white/60 max-w-2xl mx-auto font-light leading-relaxed"
          >
            Una experiencia de 3 pasos diseñada para eliminar la fricción técnica y maximizar el deleite del cliente final.
          </motion.p>
        </motion.div>

        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-50px" }}
          className="steps-grid grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8 lg:gap-12 md:gap-10"
          style={{ perspective: 1000 }}
        >
          {STEPS.map((step, i) => (
            <motion.div
              key={i}
              custom={i}
              variants={cardVariants}
              className="step-card group relative"
            >
              {/* Card image container */}
              <div className="relative aspect-[3/4] rounded-2xl sm:rounded-[2rem] md:rounded-[2.5rem] overflow-hidden mb-6 sm:mb-8 border border-[#e8e4df] dark:border-[#2a2a2a] bg-[#f0ece8] dark:bg-[#1a1a1a] shadow-sm transition-all duration-300 group-hover:shadow-2xl group-hover:shadow-[#FF5C3A]/10 group-hover:-translate-y-2 group-hover:border-[#FF5C3A]/30">
                <Image
                  src={step.img}
                  alt={step.alt}
                  fill
                  className={`object-cover ${step.pos} transition-transform duration-500 group-hover:scale-105`}
                  sizes="(max-width: 768px) 100vw, 33vw"
                />
                {/* Overlay gradient on hover */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                {/* Step number badge */}
                <div className="absolute top-4 sm:top-6 md:top-8 left-4 sm:left-6 md:left-8 w-10 h-10 sm:w-11 sm:h-11 md:w-12 md:h-12 bg-[#FF5C3A] text-white rounded-xl sm:rounded-2xl flex items-center justify-center font-jakarta font-bold text-lg sm:text-xl shadow-2xl transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3">
                  {step.n}
                </div>

                {/* Arrow connector (except last) */}
                {i < STEPS.length - 1 && (
                  <div className="hidden md:block absolute -right-[calc(2.5rem+1.5rem)] top-1/2 -translate-y-1/2 z-20 w-12 h-12">
                    <motion.svg
                      viewBox="0 0 48 48"
                      fill="none"
                      className="w-full h-full text-[#FF5C3A]"
                      animate={{ x: [0, 5, 0] }}
                      transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                    >
                      <path
                        d="M24 8 L38 24 L24 40 M38 24 L10 24"
                        stroke="currentColor"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </motion.svg>
                  </div>
                )}
              </div>

              {/* Step title */}
              <h3 className="font-jakarta text-xl sm:text-2xl font-bold text-black dark:text-white mb-3 sm:mb-4 transition-colors duration-300 group-hover:text-[#FF5C3A]">
                {step.title}
              </h3>

              {/* Step description */}
              <p className="font-dm-sans text-[#666] dark:text-white/60 leading-relaxed text-sm font-light transition-colors duration-300 group-hover:text-[#555] dark:group-hover:text-white/80">
                {step.desc}
              </p>

              {/* Decorative line */}
              <div className="mt-4 sm:mt-6 h-[2px] w-0 group-hover:w-16 bg-gradient-to-r from-[#FF5C3A] to-transparent transition-all duration-500 rounded-full" />
            </motion.div>
          ))}
        </motion.div>

        {/* CTA Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="flex justify-center mt-10 sm:mt-12 md:mt-16"
        >
          <Link
            href="/trial-checkout"
            className="bg-[#FF5C3A] text-white px-6 sm:px-10 py-4 sm:py-5 rounded-xl sm:rounded-2xl font-bold hover:!bg-[#e54a2e] hover:scale-105 active:scale-[0.98] transition-all duration-200 shadow-xl shadow-[#FF5C3A]/20 text-sm sm:text-base inline-flex items-center gap-2"
          >
            <span>Comenzar mi transformación ahora</span>
            <motion.svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              className="transition-transform duration-200"
              animate={{ x: [0, 3, 0] }}
              transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
            >
              <path d="M5 12h14M12 5l7 7-7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </motion.svg>
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
