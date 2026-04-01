'use client';

import React from 'react';
import Link from 'next/link';
import { Globe, Box, Sparkles, MessageCircle } from 'lucide-react';

export default function LandingMiniLanding() {
  const features = [
    { title: "Página pública propia", desc: "URL en lookitry.com/tu-marca. Compártela en redes o tu bio.", icon: <Globe size={20} /> },
    { title: "Catálogo visual", desc: "Tus productos con foto, precio y badge. Listos en segundos.", icon: <Box size={20} /> },
    { title: "Probador IA integrado", desc: "El widget de prueba virtual está embebido directamente.", icon: <Sparkles size={20} /> },
    { title: "WhatsApp flotante", desc: "Botón de contacto siempre visible para cerrar ventas con un clic.", icon: <MessageCircle size={20} /> }
  ];

  return (
    <section id="mini-landing" className="py-20 px-6 bg-white overflow-hidden">
      <div className="max-w-[1400px] mx-auto px-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div>
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-6 font-medium text-[10px] uppercase tracking-[0.2em] bg-[#FF5C3A]/5 border border-[#FF5C3A]/20 text-[#FF5C3A]">
              Tu propia página
            </div>
            <h2 className="font-jakarta text-4xl md:text-5xl font-bold tracking-tight text-[#0a0a0a] mb-6 leading-tight">
              Tu tienda online, <br />
              <span className="text-[#FF5C3A]">sin pagar un diseñador.</span>
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
              {features.map((feat, idx) => (
                <div key={idx} className="bg-[#f8f6f4] border border-[#e8e4df] p-6 rounded-2xl hover:bg-white hover:shadow-xl transition-all group">
                  <div className="w-10 h-10 rounded-xl bg-[#FF5C3A]/10 flex items-center justify-center text-[#FF5C3A] mb-4 group-hover:scale-110 transition-transform">
                    {feat.icon}
                  </div>
                  <h4 className="font-jakarta font-bold text-[#0a0a0a] mb-2">{feat.title}</h4>
                  <p className="text-[#666] text-xs leading-relaxed">{feat.desc}</p>
                </div>
              ))}
            </div>

            <div className="flex flex-wrap gap-4">
              <Link href="/register" className="bg-[#FF5C3A] text-white px-8 py-4 rounded-2xl font-bold text-sm transition-all hover:scale-105 shadow-xl shadow-[#FF5C3A]/20">
                Crear mi página ahora
              </Link>
              <Link href="/planes" className="bg-[#0a0a0a] text-white px-8 py-4 rounded-2xl font-bold text-sm transition-all hover:bg-[#FF5C3A]">
                Ver planes y precios
              </Link>
            </div>
          </div>

          <div className="hidden lg:block relative">
            <div className="relative z-10 rounded-[2rem] overflow-hidden border border-[#e8e4df] shadow-2xl">
               <img src="/hero/promo_landing.png" alt="Lookitry Landing Preview" className="w-full h-auto" />
            </div>
            <div className="absolute -top-10 -right-10 w-40 h-40 bg-[#FF5C3A]/10 blur-3xl rounded-full" />
          </div>
        </div>
      </div>
    </section>
  );
}
