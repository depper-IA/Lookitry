'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { Zap, RefreshCw, Settings, Download } from 'lucide-react';

export default function LandingPlugin() {
  const features = [
    { 
      title: "Instalación One-Click", 
      desc: "Descarga nuestro archivo .zip e instálalo directamente desde tu panel de WordPress. Sin complicaciones técnicas.",
      icon: <Zap size={24} aria-hidden="true" /> 
    },
    { 
      title: "Sincronización IA", 
      desc: "Tus productos se vinculan automáticamente con nuestro motor de Inteligencia Artificial para una visualización perfecta.",
      icon: <RefreshCw size={24} aria-hidden="true" /> 
    },
    { 
      title: "Personalización Total", 
      desc: "Ajusta la posición, colores y estilos del widget para que combine con tu plantilla, Elementor o Divi.",
      icon: <Settings size={24} aria-hidden="true" /> 
    }
  ];

  return (
    <section id="plugin" className="bg-black dark:bg-white py-20 sm:py-24 md:py-32 px-4 sm:px-6 overflow-hidden relative border-t border-white/5 dark:border-[#eeebe7]" aria-label="Plugin WooCommerce">
      <div className="max-w-7xl mx-auto px-0 sm:px-6">
        <div className="text-center lg:text-left mb-12 sm:mb-16">
          <div className="inline-flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full bg-[#FF5C3A]/10 border border-[#FF5C3A]/20 text-[#FF5C3A] text-[9px] sm:text-[10px] font-bold uppercase tracking-widest mb-4 sm:mb-6">
            Plugin Oficial WordPress
          </div>
          <h3 className="font-jakarta text-3xl sm:text-4xl md:text-5xl font-bold text-white dark:text-black mb-4 sm:mb-6 tracking-tight">
            Potencia tu tienda <span className="text-[#FF5C3A]">WooCommerce</span>
          </h3>
          <p className="text-white/60 dark:text-[#666] text-base sm:text-lg font-dm-sans max-w-2xl leading-relaxed">
            Integra el probador virtual líder de Latinoamérica en tu E-commerce sin tocar una sola línea de código. 
            Instalación profesional en menos de 5 minutos.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 sm:gap-8 mb-12 sm:mb-16 md:mb-20">
          {features.map((item, i) => (
            <motion.div
              key={i}
              whileHover={{ y: -10 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
              className="group p-6 sm:p-8 rounded-2xl sm:rounded-[2.5rem] bg-[#141414] dark:bg-[#fcfaf8] border border-white/5 dark:border-[#eeebe7] hover:bg-[#1a1a1a] dark:hover:bg-white hover:shadow-2xl hover:shadow-[#FF5C3A]/5 transition-all duration-500"
            >
              <motion.div
                whileHover={{ scale: 1.1, rotate: 5 }}
                className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl bg-[#FF5C3A]/10 flex items-center justify-center text-[#FF5C3A] mb-4 sm:mb-6 group-hover:bg-[#FF5C3A] group-hover:text-white transition-all duration-500"
              >
                {item.icon}
              </motion.div>
              <h4 className="font-jakarta font-bold text-lg sm:text-xl text-white dark:text-black mb-3 sm:mb-4"> {item.title}</h4>
              <p className="text-white/60 dark:text-[#666] text-sm leading-relaxed font-dm-sans">{item.desc}</p>
            </motion.div>
          ))}
        </div>

        <div className="flex flex-col lg:flex-row items-center justify-between pt-8 sm:pt-10 md:pt-12 border-t border-white/5 dark:border-[#eeebe7] gap-6 sm:gap-8 md:gap-10">
          <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6">
            <Link href="#" className="flex items-center gap-2 sm:gap-3 bg-[#FF5C3A] px-6 sm:px-10 py-4 sm:py-5 rounded-full text-white hover:bg-white dark:hover:bg-[#0a0a0a] dark:hover:text-white transition-all shadow-xl shadow-[#FF5C3A]/20 active:scale-95 group text-sm">
              <Download size={20} className="group-hover:translate-y-1 transition-transform" aria-hidden="true" />
              <span className="font-bold">Descargar Plugin (.zip)</span>
            </Link>
            <div className="flex items-center gap-2 px-3 sm:px-4 py-2 rounded-xl bg-white/5 dark:bg-black/5 border border-white/10 dark:border-black/10">
              <div className="w-2 h-2 rounded-full bg-[#FF5C3A] animate-pulse" aria-hidden="true" />
              <span className="text-[9px] sm:text-[10px] font-bold text-white dark:text-black uppercase tracking-widest">Exclusivo Plan PRO</span>
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6 md:gap-8 md:gap-10 opacity-100 transition-all duration-700">
            <span className="text-[9px] sm:text-[10px] font-bold text-white dark:text-black uppercase tracking-[0.15em] sm:tracking-[0.2em]">Compatible con:</span>
            <div className="flex items-center gap-6 sm:gap-8">
              <Image src="/integrations/Woo_logo_color.svg" alt="WooCommerce" width={60} height={40} className="h-7 sm:h-8 md:h-10 w-auto" />
              <Image src="/integrations/shopify.svg" alt="Shopify" width={40} height={30} className="h-5 sm:h-6 md:h-8 w-auto grayscale hover:grayscale-0 transition-all" />
              <Image src="/integrations/Wix.svg" alt="Wix" width={40} height={30} className="h-5 sm:h-6 md:h-8 w-auto grayscale hover:grayscale-0 transition-all" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
