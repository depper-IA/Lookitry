'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion, useReducedMotion } from 'framer-motion';
import { Zap, RefreshCw, Settings, Download } from 'lucide-react';

const fadeInUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0 },
};

const fadeInScale = {
  hidden: { opacity: 0, scale: 0.9 },
  visible: { opacity: 1, scale: 1 },
};

const cardVariants = {
  hidden: { opacity: 0, y: 40, scale: 0.95 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      delay: i * 0.12,
      duration: 0.6,
      ease: [0.22, 1, 0.36, 1],
    },
  }),
};

const staggerContainer = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2,
    },
  },
};

export default function LandingPlugin() {
  const shouldReduceMotion = useReducedMotion();

  const features = [
    {
      title: "Instalación One-Click",
      desc: "Descarga nuestro archivo .zip e instálalo directamente desde tu panel de WordPress. Sin complicaciones técnicas.",
      icon: <Zap size={24} aria-hidden="true" />,
    },
    {
      title: "Sincronización IA",
      desc: "Tus productos se vinculan automáticamente con nuestro motor de Inteligencia Artificial para una visualización perfecta.",
      icon: <RefreshCw size={24} aria-hidden="true" />,
    },
    {
      title: "Personalización Total",
      desc: "Ajusta la posición, colores y estilos del widget para que combine con tu plantilla, Elementor o Divi.",
      icon: <Settings size={24} aria-hidden="true" />,
    },
  ];

  return (
    <section
      id="plugin"
      className="bg-white dark:bg-black py-20 sm:py-24 md:py-32 px-4 sm:px-6 overflow-hidden relative border-t border-[#eeebe7] dark:border-white/5"
      aria-label="Plugin WooCommerce"
    >
      <div className="max-w-7xl mx-auto px-0 sm:px-6">
        {/* Badge de etiqueta */}
        <motion.div
          initial={shouldReduceMotion ? "visible" : "hidden"}
          whileInView="visible"
          viewport={{ once: true, margin: "-50px" }}
          variants={fadeInScale}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="inline-flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full bg-[#FF5C3A]/10 border border-[#FF5C3A]/20 text-[#FF5C3A] text-[9px] sm:text-[10px] font-bold uppercase tracking-widest mb-4 sm:mb-6"
        >
          <motion.span
            className="relative flex h-2 w-2"
            animate={shouldReduceMotion ? {} : { scale: [1, 1.3, 1] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          >
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#FF5C3A] opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-[#FF5C3A]" />
          </motion.span>
          Plugin Oficial WordPress
        </motion.div>

        {/* Título y descripción */}
        <motion.div
          initial={shouldReduceMotion ? "visible" : "hidden"}
          whileInView="visible"
          viewport={{ once: true, margin: "-50px" }}
          variants={staggerContainer}
          className="text-center lg:text-left mb-12 sm:mb-16"
        >
          <motion.h3
            variants={fadeInUp}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            className="font-jakarta text-3xl sm:text-4xl md:text-5xl font-bold text-black dark:text-white mb-4 sm:mb-6 tracking-tight"
          >
            Potencia tu tienda <span className="text-[#FF5C3A]">WooCommerce</span>
          </motion.h3>
          <motion.p
            variants={fadeInUp}
            transition={{ duration: 0.7, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
            className="text-[#666] dark:text-white/60 text-base sm:text-lg font-dm-sans max-w-2xl leading-relaxed"
          >
            Integra el probador virtual líder de Latinoamérica en tu E-commerce sin tocar una sola línea de código.
            Instalación profesional en menos de 5 minutos.
          </motion.p>
        </motion.div>

        {/* Cards de features */}
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-50px" }}
          className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 sm:gap-8 mb-12 sm:mb-16 md:mb-20"
        >
          {features.map((item, i) => (
            <motion.div
              key={i}
              custom={i}
              variants={cardVariants}
              className="group relative p-6 sm:p-8 rounded-2xl sm:rounded-[2.5rem] dark:bg-[#141414] bg-[#fcfaf8] border border-[#eeebe7] dark:border-white/5 transition-all duration-300 hover:bg-[#1a1a1a] hover:-translate-y-2 hover:shadow-xl hover:shadow-[#FF5C3A]/10 cursor-pointer overflow-hidden"
            >
              {/* Efecto de borde luminoso en hover (CSS) */}
              <div className="absolute inset-0 rounded-2xl sm:rounded-[2.5rem] opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none border border-[#FF5C3A]/20" />

              {/* Icono con CSS hover (instantáneo) */}
              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl bg-[#FF5C3A]/10 flex items-center justify-center text-[#FF5C3A] mb-4 sm:mb-6 group-hover:bg-[#FF5C3A] group-hover:text-white group-hover:scale-110 group-hover:rotate-3 transition-all duration-200 relative z-10">
                {item.icon}
              </div>

              <h4 className="font-jakarta font-bold text-lg sm:text-xl text-black dark:text-white mb-3 sm:mb-4 relative z-10">
                {item.title}
              </h4>
              <p className="text-[#666] dark:text-white/60 text-sm leading-relaxed font-dm-sans relative z-10">
                {item.desc}
              </p>

              {/* Flecha decorativa que aparece en hover */}
              <div className="absolute right-6 sm:right-8 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 group-hover:translate-x-0 translate-x-[-10px] transition-all duration-200">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="text-[#FF5C3A]">
                  <path d="M5 12h14M12 5l7 7-7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* CTA Row */}
        <motion.div
          initial={shouldReduceMotion ? "visible" : "hidden"}
          whileInView="visible"
          viewport={{ once: true, margin: "-50px" }}
          variants={fadeInUp}
          transition={{ duration: 0.6, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
          className="flex flex-col lg:flex-row items-center justify-between pt-8 sm:pt-10 md:pt-12 border-t border-[#eeebe7] dark:border-white/5 gap-6 sm:gap-8 md:gap-10"
        >
          <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6">
            {/* Botón de descarga mejorado */}
            <div className="relative group">
              <Link
                href="#"
                className="flex items-center gap-2 sm:gap-3 bg-[#FF5C3A] px-6 sm:px-10 py-4 sm:py-5 rounded-full text-white hover:bg-[#e54a2e] hover:scale-105 active:scale-95 transition-all duration-200 shadow-xl shadow-[#FF5C3A]/20 text-sm"
              >
                <Download size={20} className="group-hover:translate-y-0.5 transition-transform duration-200" aria-hidden="true" />
                <span className="font-bold">Descargar Plugin (.zip)</span>
              </Link>
            </div>

            {/* Badge Exclusivo PRO */}
            <div className="flex items-center gap-2 px-3 sm:px-4 py-2 rounded-xl dark:bg-white/5 bg-black/5 border dark:border-white/10 border-black/10 relative overflow-hidden">
              <div className="w-2 h-2 rounded-full bg-[#FF5C3A] animate-pulse" />
              <span className="text-[9px] sm:text-[10px] font-bold text-black dark:text-white uppercase tracking-widest">Exclusivo Plan PRO</span>
            </div>
          </div>

          {/* Compatible con */}
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6 md:gap-8 md:gap-10"
          >
            <span className="text-[9px] sm:text-[10px] font-bold text-black dark:text-white uppercase tracking-[0.15em] sm:tracking-[0.2em]">Compatible con:</span>
            <div className="flex items-center gap-6 sm:gap-8">
              <div className="relative group">
                <Image
                  src="/integrations/Woo_logo_color.svg"
                  alt="WooCommerce"
                  width={60}
                  height={40}
                  className="h-7 sm:h-8 md:h-10 w-auto transition-all duration-200 group-hover:scale-110 group-hover:drop-shadow-[0_0_8px_rgba(255,92,58,0.4)]"
                />
              </div>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
