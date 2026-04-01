'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { 
  Camera, 
  Sparkles, 
  Zap, 
  ShoppingBag, 
  ArrowRight,
  Smile,
  Maximize2,
  Share2,
  Infinity as InfinityIcon
} from 'lucide-react';

import LandingNav from '@/components/landing/new-landing/LandingNav';
import LandingFooter from '@/components/landing/new-landing/LandingFooter';

const PREMIUM_FONTS = `
  @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=DM+Sans:ital,opsz,wght@0,100..1000;1,100..1000&display=swap');
  .font-jakarta { font-family: 'Plus Jakarta Sans', sans-serif; }
  .font-dm-sans { font-family: 'DM Sans', sans-serif; }
`;

export default function ProbadorVirtualContent() {
  const [currency, setCurrency] = useState<'COP' | 'USD'>('COP');

  useEffect(() => {
    const saved = localStorage.getItem('currency') as 'COP' | 'USD';
    if (saved) setCurrency(saved);
  }, []);

  const handleCurrencyChange = (c: 'COP' | 'USD') => {
    setCurrency(c);
    localStorage.setItem('currency', c);
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white font-dm-sans selection:bg-[#FF5C3A]/30 selection:text-[#FF5C3A] overflow-x-hidden">
      <style dangerouslySetInnerHTML={{ __html: PREMIUM_FONTS }} />

      <LandingNav currency={currency} onCurrencyChange={handleCurrencyChange} />

      <main className="pt-32 pb-20 px-6">
        <div className="max-w-7xl mx-auto">
          {/* Hero Section */}
          <div className="flex flex-col items-center text-center mb-40 mt-12">
             <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#FF5C3A]/10 border border-[#FF5C3A]/20 text-[#FF5C3A] text-[10px] font-bold uppercase tracking-widest mb-8">
                Tecnología de Vanguardia
             </div>
             <h1 className="font-jakarta text-[48px] md:text-[84px] font-black leading-[0.95] tracking-tight mb-10 max-w-4xl">
               La Nueva Forma de <span className="text-[#FF5C3A]">Comprar Moda.</span>
             </h1>
             <p className="text-xl text-white/60 mb-12 leading-relaxed max-w-2xl font-medium">
               Elimina la incertidumbre del &quot;me quedará bien&quot; con nuestro probador virtual potenciado por IA generativa de alta fidelidad.
             </p>
             <div className="flex flex-wrap justify-center gap-6">
                <Link href="/pruebalo/demo" className="bg-[#FF5C3A] text-white px-12 py-6 rounded-2xl font-bold text-sm hover:scale-105 transition-all shadow-xl shadow-[#FF5C3A]/30">
                   Prueba Premium
                </Link>
                <Link href="/register" className="bg-white/5 text-white px-12 py-6 rounded-2xl font-bold text-sm border border-white/10 hover:bg-white/10 transition-all">
                   Activar para mi Marca
                </Link>
             </div>
          </div>

          {/* Interactive Steps */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10 mb-52">
             {[
               {
                 title: "1. Sube tu Selfie",
                 desc: "Solo una foto de cuerpo completo desde tu cámara. Sin necesidad de apps extra.",
                 icon: <Camera size={32} className="text-[#FF5C3A]" />
               },
               {
                 title: "2. Escoge la Prenda",
                 desc: "Navega por el catálogo de la marca y elige el outfit que quieres probar.",
                 icon: <ShoppingBag size={32} className="text-[#FF5C3A]" />
               },
               {
                 title: "3. Mira el Resultado",
                 desc: "En segundos, nuestra IA ajustará la prenda a tu cuerpo con sombras y texturas realistas.",
                 icon: <Sparkles size={32} className="text-[#FF5C3A]" />
               }
             ].map((step, i) => (
               <div key={i} className="text-center group">
                  <div className="w-24 h-24 rounded-[2rem] bg-white/5 border border-white/10 flex items-center justify-center mx-auto mb-10 group-hover:bg-[#FF5C3A]/10 group-hover:border-[#FF5C3A]/40 transition-all duration-500">
                     {step.icon}
                  </div>
                  <h4 className="font-jakarta font-bold text-2xl mb-6">{step.title}</h4>
                  <p className="text-white/40 text-sm leading-relaxed max-w-xs mx-auto">{step.desc}</p>
               </div>
             ))}
          </div>

          {/* Value Stats Section */}
          <div className="bg-white rounded-[4rem] p-12 md:p-24 grid grid-cols-1 lg:grid-cols-2 gap-20 items-center mb-40 overflow-hidden relative">
             <div className="absolute top-0 right-0 w-1/2 h-full bg-[#FF5C3A]/5 pointer-events-none" />
             <div>
                <h2 className="font-jakarta text-4xl md:text-6xl font-black text-[#0a0a0a] mb-10 leading-tight">
                   Reduce un <span className="text-[#FF5C3A]">40%</span> las devoluciones.
                </h2>
                <div className="space-y-6">
                   {[
                     "Confianza inmediata en el talle y estilo.",
                     "Aumento del 30% en la tasa de conversión.",
                     "Experiencia de compra lúdica y viralizable.",
                     "Integración nativa con tu catálogo actual."
                   ].map((item, i) => (
                     <div key={i} className="flex items-center gap-4 text-[#0a0a0a]/80 font-bold">
                        <div className="w-6 h-6 rounded-full bg-[#FF5C3A] flex items-center justify-center">
                           <ArrowRight size={14} className="text-white" />
                        </div>
                        {item}
                     </div>
                   ))}
                </div>
             </div>
             <div className="relative aspect-square">
                <div className="absolute inset-4 rounded-[3rem] overflow-hidden border-[12px] border-[#0a0a0a]/5 shadow-2xl">
                   <div className="w-full h-full bg-zinc-100 flex items-center justify-center">
                      <Image src="/logo.svg" alt="Preview IA" width={120} height={120} className="opacity-10 grayscale" />
                   </div>
                </div>
             </div>
          </div>

          {/* Engagement Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-52">
             {[
               { title: "Latencia", value: "< 5s", icon: <Zap size={20} /> },
               { title: "Precisión", value: "98%", icon: <Maximize2 size={20} /> },
               { title: "Engagement", value: "x3.5", icon: <Smile size={20} /> },
               { title: "Social Sharing", value: "Viral", icon: <Share2 size={20} /> }
             ].map((stat, i) => (
               <div key={i} className="p-10 rounded-[2.5rem] bg-white/5 border border-white/5 text-center hover:bg-[#FF5C3A] group transition-all cursor-default relative overflow-hidden">
                  <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-6 group-hover:bg-white/20">
                     {stat.icon}
                  </div>
                  <h5 className="font-jakarta font-bold text-3xl mb-2 group-hover:scale-110 transition-transform">{stat.value}</h5>
                  <p className="text-white/30 text-xs font-bold uppercase tracking-widest group-hover:text-white/70">{stat.title}</p>
               </div>
             ))}
          </div>

          {/* CTA Footer Section */}
          <div className="text-center max-w-4xl mx-auto mb-40">
             <h2 className="font-jakarta text-4xl md:text-7xl font-black mb-12 tracking-tight">¿Listo para el <br /><span className="text-[#FF5C3A]">Futuro de la Moda?</span></h2>
             <Link href="/register" className="inline-flex items-center gap-4 bg-[#FF5C3A] text-white px-16 py-8 rounded-[2.5rem] font-black text-lg transition-all hover:scale-105 shadow-2xl shadow-[#FF5C3A]/20 active:scale-95">
                Empezar Ahora <InfinityIcon size={24} />
             </Link>
          </div>
        </div>
      </main>

      <LandingFooter />
    </div>
  );
}
