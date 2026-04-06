'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { 
  ArrowRight,
  TrendingUp,
  RefreshCcw,
  ShoppingCart,
  CheckCircle2,
  Star,
  Globe,
  Zap,
  Eye,
  Crosshair,
  BarChart3
} from 'lucide-react';
import LandingNav from '@/components/landing/new-landing/LandingNav';
import LandingFooter from '@/components/landing/new-landing/LandingFooter';

const PREMIUM_FONTS = `
  @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=DM+Sans:ital,opsz,wght@0,100..1000;1,100..1000&display=swap');
  .font-jakarta { font-family: 'Plus Jakarta Sans', sans-serif; }
  .font-dm-sans { font-family: 'DM Sans', sans-serif; }
`;

const SectionLabel = ({ text, dark = false }: { text: string; dark?: boolean }) => (
  <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full ${dark ? 'bg-black/10 border-black/10 text-black/60' : 'bg-[#FF5C3A]/10 border-[#FF5C3A]/20 text-[#FF5C3A]'} text-[10px] font-bold uppercase tracking-widest mb-8 border transition-all`}>
    <div className={`w-1 h-1 rounded-full ${dark ? 'bg-black/40' : 'bg-[#FF5C3A]'} animate-pulse`} />
    {text}
  </div>
);

const CASES = [
  {
    brand: 'Nómada Urban',
    category: 'Streatwear Ropa Urbana',
    result: '+42%',
    kpi: 'Conversión',
    desc: 'Los usuarios de Nómada Urban tenían una gran tasa de rebote por incertidumbre sobre cómo quedaría el fit oversizado de las prendas. Incorporar Lookitry resolvió esa duda en segundos, transformando sesiones inactivas en ventas directas.',
    image: '/images/cases/urban-story.png',
    statLabel: 'Ventas Increadas',
    icon: <TrendingUp className="text-[#FF5C3A]" size={20} />
  },
  {
    brand: 'Aura Boutique',
    category: 'Moda y Alta Costura',
    result: '-28%',
    kpi: 'Devoluciones',
    desc: 'El gran volumen de devoluciones por "no se me ve como a la modelo" generaba estrés logístico a Aura. Al brindar contexto realista con IA Generativa, Lookitry logró que las clientas sepan exactamente cómo caerá el vestido oscuro.',
    image: '/images/cases/boutique-story.png',
    statLabel: 'Eficiencia Logística',
    icon: <RefreshCcw className="text-[#FF5C3A]" size={20} />
  },
  {
    brand: 'Vigor Active',
    category: 'Fitness & Deportiva',
    result: 'x3.4',
    kpi: 'Retención',
    desc: 'Vigor Active incorporó nuestro widget en su página de productos. Sus clientes pasaron de un scrolleo rápido a jugar probándose múltiples combinaciones deportivas. El resultado es un aumento drástico en retención y engagement.',
    image: '/images/cases/fitness-story.png',
    statLabel: 'Tiempo de Sesión',
    icon: <ShoppingCart className="text-[#FF5C3A]" size={20} />
  }
];

const SALES_BLOCKS = [
  {
    eyebrow: 'Convierte mejor',
    title: 'Tu cliente entiende el producto al instante',
    body: 'Cuando el antes y después se ve claro, hay menos duda, más atención y una decisión de compra mucho más rápida.',
    icon: <Eye size={20} className="text-[#FF5C3A]" />
  },
  {
    eyebrow: 'Vende en más canales',
    title: 'Usa la misma experiencia en tienda, landing y campañas',
    body: 'Lookitry te ayuda a presentar mejor tu catálogo en tu web, en una mini-landing y en flujos comerciales donde cada clic cuenta.',
    icon: <Globe size={20} className="text-[#FF5C3A]" />
  },
  {
    eyebrow: 'Escala con más valor',
    title: 'Empieza simple y evoluciona a premium',
    body: 'Puedes arrancar con lo esencial y luego sumar mini-landing, integraciones y una presentación más fuerte según el plan que elijas.',
    icon: <TrendingUp size={20} className="text-[#FF5C3A]" />
  },
];

export default function CasosDeUsoPage() {
  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white font-dm-sans selection:bg-[#FF5C3A]/30 selection:text-[#FF5C3A] overflow-x-clip">
      <style dangerouslySetInnerHTML={{ __html: PREMIUM_FONTS }} />
      
      <LandingNav />

      <main className="pt-40 pb-20 px-6">
        <div className="max-w-7xl mx-auto">
          
          {/* 1. Hero Section Fusionado (API Developer Style) */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center mb-40">
            <div>
              <SectionLabel text="Aplicaciones Reales" />
              <h1 className="font-jakarta text-[48px] md:text-[64px] font-black leading-[1.1] tracking-tight mb-8">
                 Convierte tu catálogo <br />
                 en una <span className="text-[#FF5C3A]">experiencia que vende.</span>
              </h1>
              <p className="text-lg text-white/60 mb-12 leading-relaxed max-w-xl font-dm-sans">
                 Lookitry hace que tus productos se entiendan más rápido, se vean más deseables y generen más intención de compra desde el primer vistazo. Integra el probador virtual en tu tienda en 10 minutos. Sin apps, sin desarrollo.
              </p>
              
              <div className="flex flex-wrap gap-5">
                <Link href="/checkout" className="bg-[#FF5C3A] text-white px-10 py-5 rounded-2xl font-bold text-sm transition-all hover:scale-105 shadow-xl shadow-[#FF5C3A]/20 flex items-center gap-3">
                  Quiero usar Lookitry <ArrowRight size={18} />
                </Link>
                <Link href="/checkout?plan=TRIAL" className="bg-[#1a1a1a] border border-white/10 text-white px-10 py-5 rounded-2xl font-bold text-sm transition-all hover:border-[#FF5C3A]/30 flex items-center gap-3">
                  Empezar con mi marca
                </Link>
              </div>
            </div>

            {/* Visual Header Grid (Estética Premium API Developer / Plugin) */}
            <div className="bg-[#0f0f0f] rounded-[2.5rem] border border-white/5 p-1 md:p-2 shadow-2xl relative overflow-hidden group">
               <div className="bg-[#1a1a1a] rounded-[2.2rem] p-6 lg:p-10 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-[#FF5C3A]/10 blur-[80px] rounded-full translate-x-1/2 -translate-y-1/2" />
                  
                  <div className="relative z-10 grid gap-6">
                      <div className="bg-white/5 border border-white/5 rounded-3xl p-6 flex flex-col justify-between backdrop-blur-sm">
                        <TrendingUp size={32} className="text-[#FF5C3A] mb-4" />
                        <div>
                            <div className="text-4xl font-black font-jakarta mb-1 text-white">+45%</div>
                            <div className="text-xs text-white/40 uppercase font-bold tracking-widest">Aumento en Conversión</div>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-6">
                        <div className="bg-white/5 border border-white/5 rounded-3xl p-6 flex flex-col justify-between backdrop-blur-sm">
                            <Crosshair size={28} className="text-[#FF5C3A] mb-4" />
                            <div>
                              <div className="text-2xl font-black font-jakarta mb-1 text-white">x3.4</div>
                              <div className="text-[10px] text-white/40 uppercase font-bold tracking-widest">Aumento en Retención</div>
                            </div>
                        </div>
                        <div className="bg-white/5 border border-white/5 rounded-3xl p-6 flex flex-col justify-between backdrop-blur-sm">
                            <RefreshCcw size={28} className="text-[#FF5C3A] mb-4" />
                            <div>
                              <div className="text-2xl font-black font-jakarta mb-1 text-white">-30%</div>
                              <div className="text-[10px] text-white/40 uppercase font-bold tracking-widest">Reducción Devoluciones</div>
                            </div>
                        </div>
                      </div>
                  </div>
               </div>
            </div>
          </div>

          {/* 2. Sección: Prueba Visual Real (Diseño Limpio) */}
          <div className="mb-40 pt-10 border-t border-white/10">
            <div className="text-center mb-16 flex flex-col items-center">
              <SectionLabel text="Prueba Visual Real" />
              <h2 className="font-jakarta text-3xl md:text-5xl font-black mb-6 max-w-3xl leading-tight">
                Haz visible el cambio.<br />Haz más <span className="text-[#FF5C3A]">fácil la compra.</span>
              </h2>
              <p className="text-lg text-white/60 font-dm-sans max-w-2xl mx-auto">
                Una comparación directa comunica mejor el valor del producto: foto original a un lado, resultado con Lookitry al otro.
                Menos fricción para entenderlo, más claridad para avanzar.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
               {/* Antes */}
               <div className="rounded-[2.5rem] bg-[#141414] border border-white/5 p-8 flex flex-col items-center text-center group hover:border-white/20 transition-all">
                  <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-6">
                     <Image src="/logo.svg" alt="Lookitry" width={24} height={24} className="opacity-40 grayscale" />
                  </div>
                  <h4 className="font-jakarta font-bold text-xl text-white mb-2">Paso 1: Foto Original</h4>
                  <p className="text-sm text-white/50 leading-relaxed">
                     El cliente ingresa a tu tienda y sube una foto real que se toma en segundos desde el probador.
                  </p>
               </div>
               
               {/* Proceso */}
               <div className="rounded-[2.5rem] bg-[#FF5C3A]/5 border border-[#FF5C3A]/20 p-8 flex flex-col items-center text-center relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-[#FF5C3A]/10 to-transparent pointer-events-none" />
                  <div className="relative z-10 w-16 h-16 rounded-full bg-[#FF5C3A] flex items-center justify-center mb-6 shadow-xl shadow-[#FF5C3A]/30">
                     <Zap size={24} className="text-white fill-white animate-pulse" />
                  </div>
                  <h4 className="relative z-10 font-jakarta font-bold text-xl text-white mb-2">Motor IA Generativa</h4>
                  <p className="relative z-10 text-sm text-white/70 leading-relaxed">
                     Nuestro motor procesa de inmediato la prenda seleccionada para ajustarla al cuerpo del usuario.
                  </p>
               </div>

               {/* Después */}
               <div className="rounded-[2.5rem] bg-[#141414] border border-[#FF5C3A]/30 p-8 flex flex-col items-center text-center group shadow-[0_0_30px_rgba(255,92,58,0.1)]">
                  <div className="w-16 h-16 rounded-full bg-[#FF5C3A]/20 flex items-center justify-center mb-6">
                     <CheckCircle2 size={24} className="text-[#FF5C3A]" />
                  </div>
                  <h4 className="font-jakarta font-bold text-xl text-white mb-2">Paso 3: Resultado</h4>
                  <p className="text-sm text-white/50 leading-relaxed">
                     Magia pura. El usuario se ve luciendo la prenda en un entorno ultra realista, eliminando las dudas.
                  </p>
               </div>
            </div>
          </div>

          {/* 3. Re-diseño Grid de Casos Clave (Plugin WooCommerce Style) */}
          <div className="mb-40 pt-10 border-t border-white/10">
            <div className="text-center mb-16 flex flex-col items-center">
              <SectionLabel text="Sector por Sector" />
              <h2 className="font-jakarta text-3xl md:text-5xl font-black mb-6 max-w-3xl leading-tight">
                Modelos probados en diversas industrias del <span className="text-[#FF5C3A]">Retail.</span>
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
               {CASES.map((item, idx) => (
                 <div key={idx} className="group p-8 rounded-[2.5rem] bg-[#141414] border border-white/5 hover:border-[#FF5C3A]/30 hover:bg-[#1a1a1a] transition-all duration-500 relative overflow-hidden flex flex-col h-full">
                   <div className="absolute top-0 right-0 w-32 h-32 bg-[#FF5C3A]/5 blur-[50px] rounded-full translate-x-1/2 -translate-y-1/2 group-hover:bg-[#FF5C3A]/20 transition-all" />
                   
                   <div className="flex items-center gap-3 mb-6 relative z-10">
                      <div className="w-12 h-12 rounded-2xl bg-[#FF5C3A]/10 flex items-center justify-center text-[#FF5C3A] group-hover:scale-110 group-hover:bg-[#FF5C3A] group-hover:text-white transition-all duration-500">
                        {item.icon}
                      </div>
                      <div>
                         <h4 className="font-jakarta font-bold text-xl text-white">{item.brand}</h4>
                         <span className="text-[10px] text-[#FF5C3A] uppercase tracking-widest font-bold">{item.category}</span>
                      </div>
                   </div>

                   <p className="text-white/60 text-sm leading-relaxed font-dm-sans mb-8 flex-grow relative z-10">
                     {item.desc}
                   </p>

                   <div className="pt-6 border-t border-white/10 flex justify-between items-end relative z-10">
                      <div>
                         <span className="text-[10px] uppercase font-bold tracking-widest text-white/40 block mb-1">{item.kpi}</span>
                         <span className="text-3xl font-black font-jakarta text-[#FF5C3A]">{item.result}</span>
                      </div>
                      <Link href="/checkout?plan=PRO" className="w-10 h-10 rounded-full border border-white/10 flex items-center justify-center text-white/50 hover:bg-[#FF5C3A] hover:text-white hover:border-[#FF5C3A] transition-all group-hover:border-[#FF5C3A]/50">
                         <ArrowRight size={16} />
                      </Link>
                   </div>
                 </div>
               ))}
            </div>
          </div>

          {/* 4. Lo que compras en realidad */}
          <div className="mb-40 pt-10 border-t border-white/10 grid grid-cols-1 gap-12 lg:grid-cols-[1fr_1fr] items-center">
             <div className="relative group">
               <div className="absolute inset-0 bg-gradient-to-r from-transparent to-[#FF5C3A]/5 blur-3xl opacity-50" />
               <div className="rounded-[3rem] border border-[#FF5C3A]/20 bg-[#141414] p-10 md:p-14 relative z-10 overflow-hidden">
                 <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[#FF5C3A] to-transparent opacity-50" />
                 
                 <SectionLabel text="Lo que compras en realidad" />
                 <h3 className="mt-2 font-jakarta text-3xl md:text-5xl font-black leading-tight text-white mb-6">
                   Una experiencia que hace ver tu <span className="text-white/40 italic">catálogo más deseable.</span>
                 </h3>
                 <p className="text-white/60 text-lg font-dm-sans mb-10 leading-relaxed max-w-lg">
                    Activa la confianza inmediata de tus clientes en el probador virtual y expande tus operaciones de ventas en cada canal disponible.
                 </p>

                 <div className="flex flex-col gap-6">
                    <Link href="/checkout" className="bg-white text-black px-8 py-4 rounded-2xl font-bold text-sm text-center transition-all hover:bg-white/90 w-fit">
                       Ver planes disponibles
                    </Link>
                 </div>
               </div>
             </div>

             <div className="space-y-6">
                {SALES_BLOCKS.map((item, idx) => (
                  <div key={idx} className="bg-[#141414] border border-white/5 rounded-[2rem] p-8 flex gap-6 group hover:border-[#FF5C3A]/30 transition-all duration-300">
                     <div className="shrink-0 w-12 h-12 rounded-full bg-[#FF5C3A]/10 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                        {item.icon}
                     </div>
                     <div>
                        <span className="text-[10px] font-bold uppercase tracking-widest text-[#FF5C3A] mb-2 block">{item.eyebrow}</span>
                        <h4 className="text-xl font-bold font-jakarta text-white mb-3">{item.title}</h4>
                        <p className="text-white/60 text-sm font-dm-sans leading-relaxed">{item.body}</p>
                     </div>
                  </div>
                ))}
             </div>
          </div>
          
          {/* 5. CTA Integrado */}
          <div className="bg-[#111] rounded-[4rem] p-12 md:p-24 text-center mb-20 relative overflow-hidden group shadow-[0_50px_100px_rgba(255,255,255,0.02)] border border-white/10">
             <div className="absolute inset-0 bg-gradient-to-t from-[#FF5C3A]/10 to-transparent opacity-60 pointer-events-none" />
             
             <div className="relative z-10 max-w-3xl mx-auto">
                <SectionLabel text="Pensado para crecer" />
                <h2 className="font-jakarta text-4xl md:text-5xl lg:text-6xl font-black text-white mb-8 tracking-tighter">
                   Empieza con el paquete que mejor se ajuste <br className="hidden md:block" /> a tu etapa.
                </h2>
                <p className="text-white/50 text-lg md:text-xl mb-12 font-dm-sans leading-relaxed">
                  Para marcas que quieren validar rápido y para tiendas que buscan una experiencia más premium. Activa tu marca, muestra tu catálogo y convierte visitas en decisiones.
                </p>

                <div className="flex flex-col sm:flex-row justify-center gap-6">
                  <Link href="/planes" className="bg-[#FF5C3A] text-white px-10 py-5 rounded-[2rem] font-bold text-lg hover:scale-105 active:scale-95 transition-all shadow-xl shadow-[#FF5C3A]/20 flex items-center justify-center gap-3">
                     Explorar Planes Válidos <ArrowRight size={20} />
                  </Link>
                </div>
             </div>
          </div>

        </div>
      </main>

      <LandingFooter />
    </div>
  );
}
