'use client';

import React from 'react';
import Link from 'next/link';
import { Zap, RefreshCw, Settings, Download } from 'lucide-react';

export default function LandingPlugin() {
  const features = [
    { 
      title: "Instalación One-Click", 
      desc: "Descarga nuestro archivo .zip e instálalo directamente desde tu panel de WordPress. Sin complicaciones técnicas.",
      icon: <Zap size={24} /> 
    },
    { 
      title: "Sincronización IA", 
      desc: "Tus productos se vinculan automáticamente con nuestro motor de Inteligencia Artificial para una visualización perfecta.",
      icon: <RefreshCw size={24} /> 
    },
    { 
      title: "Personalización Total", 
      desc: "Ajusta la posición, colores y estilos del widget para que combine con tu plantilla, Elementor o Divi.",
      icon: <Settings size={24} /> 
    }
  ];

  return (
    <section id="plugin" className="py-32 px-6 bg-white overflow-hidden relative border-t border-[#eeebe7]">
      <div className="max-w-[1400px] mx-auto px-6">
        <div className="text-center lg:text-left mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#FF5C3A]/10 border border-[#FF5C3A]/20 text-[#FF5C3A] text-[10px] font-bold uppercase tracking-widest mb-6">
            Plugin Oficial WordPress
          </div>
          <h3 className="font-jakarta text-4xl md:text-5xl font-bold text-[#0a0a0a] mb-6 tracking-tight">
            Potencia tu tienda <span className="text-[#FF5C3A]">WooCommerce</span>
          </h3>
          <p className="text-[#666] text-lg font-dm-sans max-w-2xl leading-relaxed">
            Integra el probador virtual líder de Latinoamérica en tu E-commerce sin tocar una sola línea de código. 
            Instalación profesional en menos de 5 minutos.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-20">
          {features.map((item, i) => (
            <div key={i} className="group p-8 rounded-[2.5rem] bg-[#fcfaf8] border border-[#eeebe7] hover:bg-white hover:shadow-2xl hover:shadow-[#FF5C3A]/5 transition-all duration-500">
              <div className="w-14 h-14 rounded-2xl bg-[#FF5C3A]/10 flex items-center justify-center text-[#FF5C3A] mb-6 group-hover:scale-110 group-hover:bg-[#FF5C3A] group-hover:text-white transition-all duration-500">
                {item.icon}
              </div>
              <h4 className="font-jakarta font-bold text-xl text-[#0a0a0a] mb-4">{item.title}</h4>
              <p className="text-[#666] text-sm leading-relaxed font-dm-sans">{item.desc}</p>
            </div>
          ))}
        </div>

        <div className="flex flex-col lg:flex-row items-center justify-between pt-12 border-t border-[#eeebe7] gap-10">
          <div className="flex flex-col sm:flex-row items-center gap-6">
            <Link href="#" className="flex items-center gap-3 bg-[#FF5C3A] px-10 py-5 rounded-full text-white hover:bg-[#0a0a0a] transition-all shadow-xl shadow-[#FF5C3A]/20 active:scale-95 group">
              <Download size={20} className="group-hover:translate-y-1 transition-transform" />
              <span className="font-bold text-sm">Descargar Plugin (.zip)</span>
            </Link>
            <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-black/5 border border-black/10">
              <div className="w-2 h-2 rounded-full bg-[#FF5C3A] animate-pulse" />
              <span className="text-[10px] font-bold text-black uppercase tracking-widest">Exclusivo Plan PRO</span>
            </div>
          </div>
          
          <div className="flex items-center gap-10 opacity-100 transition-all duration-700">
            <span className="text-[10px] font-bold text-[#000000] uppercase tracking-[0.2em]">Compatible con:</span>
            <div className="flex items-center gap-8">
              <img src="/integrations/Woo_logo_color.svg" alt="WooCommerce" className="h-8 md:h-10" />
              <img src="/integrations/shopify.svg" alt="Shopify" className="h-6 md:h-8 grayscale hover:grayscale-0 transition-all" />
              <img src="/integrations/Wix.svg" alt="Wix" className="h-6 md:h-8 grayscale hover:grayscale-0 transition-all" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
