'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { Zap, RefreshCw, Settings, Download } from 'lucide-react';
import { LANDING_COPY } from './LandingCopy';

export default function LandingPlugin() {
  const features = [
    {
      title: "Instalación One-Click",
      desc: "Descarga nuestro archivo .zip e instálalo directamente desde tu panel de WordPress. Sin tocar una línea de código.",
      icon: <Zap size={24} aria-hidden="true" />
    },
    {
      title: "Sincronización IA",
      desc: "Tus productos se vinculan automáticamente con nuestro motor de Inteligencia Artificial para una visualización perfecta.",
      icon: <RefreshCw size={24} aria-hidden="true" />
    },
    {
      title: "Integración Visual",
      desc: "Ajusta la posición, colores y estilos del probador para que combine con tu plantilla, Elementor o Divi.",
      icon: <Settings size={24} aria-hidden="true" />
    }
  ];

  return (
    <section id="plugin" className="bg-white dark:bg-black py-20 sm:py-24 md:py-32 px-4 sm:px-6 overflow-hidden relative" aria-label="Plugin WooCommerce">
      <div className="max-w-7xl mx-auto px-0 sm:px-6">
        <div className="text-center lg:text-left mb-12 sm:mb-16">
          <div className="inline-flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full bg-accent/10 border border-accent/20 text-accent text-[9px] sm:text-[10px] font-bold uppercase tracking-widest mb-4 sm:mb-6">
            Plugin Oficial WordPress
          </div>
          <h3 className="font-jakarta text-3xl sm:text-4xl md:text-5xl font-bold text-black dark:text-white mb-4 sm:mb-6 tracking-tight">
            Potencia tu tienda <span className="text-accent">WooCommerce</span>
          </h3>
          <p className="text-text-muted dark:text-white/60 text-base sm:text-lg font-dm-sans max-w-2xl leading-relaxed">
            Integra el Espejo Digital líder de Latinoamérica en tu E-commerce sin complicaciones. 
            Instalación profesional en menos de 5 minutos.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 sm:gap-8 mb-12 sm:mb-16 md:mb-20">
          {features.map((item, i) => (
            <motion.div
              key={i}
              whileHover={{ y: -10 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
              className="group p-6 sm:p-8 rounded-2xl sm:rounded-[2.5rem] dark:bg-dark-surface bg-neutral-50 border border-gray-200 dark:border-white/5 hover:bg-dark-input dark:hover:bg-dark-input hover:shadow-2xl hover:shadow-accent/5 transition-all duration-500"
            >
              <motion.div
                whileHover={{ scale: 1.1, rotate: 5 }}
                className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl bg-accent/10 flex items-center justify-center text-accent mb-4 sm:mb-6 group-hover:bg-accent group-hover:text-white transition-all duration-500"
              >
                {item.icon}
              </motion.div>
              <h4 className="font-jakarta font-bold text-lg sm:text-xl text-black dark:text-white mb-3 sm:mb-4"> {item.title}</h4>
              <p className="text-text-muted dark:text-white/60 text-sm leading-relaxed font-dm-sans">{item.desc}</p>
            </motion.div>
          ))}
        </div>

        <div className="flex flex-col lg:flex-row items-center justify-between pt-8 sm:pt-10 md:pt-12 gap-6 sm:gap-8 md:gap-10">
          <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6">
            <Link href="#" className="flex items-center gap-2 sm:gap-3 bg-accent px-6 sm:px-10 py-4 sm:py-5 rounded-full text-white hover:bg-white hover:text-accent dark:hover:bg-accent dark:hover:text-white transition-all shadow-xl shadow-accent/20 active:scale-95 group text-sm">
              <Download size={20} className="group-hover:translate-y-1 transition-transform" aria-hidden="true" />
              <span className="font-bold">Descargar Plugin (.zip)</span>
            </Link>
            <div className="flex items-center gap-2 px-3 sm:px-4 py-2 rounded-xl dark:bg-white/5 bg-black/5 border dark:border-white/10 border-black/10">
              <div className="w-2 h-2 rounded-full bg-accent animate-pulse" aria-hidden="true" />
              <span className="text-[9px] sm:text-[10px] font-bold text-black dark:text-white uppercase tracking-widest">Exclusivo Plan PRO</span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6 md:gap-8 md:gap-10 opacity-100 transition-all duration-700">
            <span className="text-[9px] sm:text-[10px] font-bold text-black dark:text-white uppercase tracking-[0.15em] sm:tracking-[0.2em]">Compatible con:</span>
            <div className="flex items-center gap-6 sm:gap-8">
              <Image src="/integrations/Woo_logo_color.svg" alt="WooCommerce" width={60} height={40} className="h-7 sm:h-8 md:h-10 w-auto" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
