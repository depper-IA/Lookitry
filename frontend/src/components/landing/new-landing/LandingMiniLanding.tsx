'use client';

import React from 'react';
import Link from 'next/link';
import { Globe, Box, Sparkles, MessageCircle } from 'lucide-react';

export default function LandingMiniLanding() {
  const features = [
    { title: "Página pública propia", desc: "URL en lookitry.com/tu-marca. Compártela en redes o tu bio.", icon: <Globe size={20} aria-hidden="true" /> },
    { title: "Catálogo visual", desc: "Tus productos con foto, precio y badge. Listos en segundos.", icon: <Box size={20} aria-hidden="true" /> },
    { title: "Probador IA integrado", desc: "El widget de prueba virtual está embebido directamente.", icon: <Sparkles size={20} aria-hidden="true" /> },
    { title: "WhatsApp flotante", desc: "Botón de contacto siempre visible para cerrar ventas con un clic.", icon: <MessageCircle size={20} aria-hidden="true" /> }
  ];

  return (
    <section id="mini-landing" className="bg-[#0a0a0a] dark:bg-white py-16 sm:py-20 px-4 sm:px-6 overflow-hidden" aria-label="Mini Landing Pro">
      <div className="max-w-7xl mx-auto px-0 sm:px-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center">
          <div>
            <div className="inline-flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full mb-4 sm:mb-6 font-medium text-[9px] sm:text-[10px] uppercase tracking-[0.15em] sm:tracking-[0.2em] bg-[#FF5C3A]/5 border border-[#FF5C3A]/20 text-[#FF5C3A]">
              Tu propia página
            </div>
            <h2 className="font-jakarta text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-white dark:text-[#0a0a0a] mb-4 sm:mb-6 leading-tight">
              Tu tienda online, <br />
              <span className="text-[#FF5C3A]">sin pagar un diseñador.</span>
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5 md:gap-6 mb-8 sm:mb-10">
              {features.map((feat, idx) => (
                <div key={idx} className="bg-[#1a1a1a] dark:bg-[#f8f6f4] border border-white/5 dark:border-[#e8e4df] p-4 sm:p-5 md:p-6 rounded-xl sm:rounded-2xl hover:bg-[#141414] dark:hover:bg-white hover:shadow-xl transition-all group">
                  <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-[#FF5C3A]/10 flex items-center justify-center text-[#FF5C3A] mb-3 sm:mb-4 group-hover:scale-110 transition-transform">
                    {feat.icon}
                  </div>
                  <h4 className="font-jakarta font-bold text-sm sm:text-base text-white dark:text-[#0a0a0a] mb-1.5 sm:mb-2">{feat.title}</h4>
                  <p className="text-white/60 dark:text-[#666] text-xs leading-relaxed">{feat.desc}</p>
                </div>
              ))}
            </div>

            <div className="flex flex-wrap gap-3 sm:gap-4">
              <Link href="/checkout?plan=TRIAL" className="bg-[#FF5C3A] text-white px-6 sm:px-8 py-3.5 sm:py-4 rounded-xl sm:rounded-2xl font-bold text-sm transition-all hover:scale-105 shadow-xl shadow-[#FF5C3A]/20">
                Crear mi página ahora
              </Link>
              <Link href="/planes" className="bg-white dark:bg-[#0a0a0a] text-[#0a0a0a] dark:text-white px-6 sm:px-8 py-3.5 sm:py-4 rounded-xl sm:rounded-2xl font-bold text-sm transition-all hover:bg-[#FF5C3A] dark:hover:bg-[#FF5C3A] dark:hover:text-white">
                Ver planes y precios
              </Link>
            </div>
          </div>

          <div className="hidden lg:block relative">
            <div className="relative z-10 rounded-2xl sm:rounded-[2rem] overflow-hidden border border-white/10 dark:border-[#e8e4df] shadow-2xl">
               <img src="/hero/promo_landing.png" alt="Vista previa de Lookitry Landing" className="w-full h-auto" />
            </div>
            <div className="absolute -top-6 sm:-top-10 -right-6 sm:-right-10 w-32 h-32 sm:w-40 sm:h-40 bg-[#FF5C3A]/10 blur-3xl rounded-full" aria-hidden="true" />
          </div>
        </div>
      </div>
    </section>
  );
}
