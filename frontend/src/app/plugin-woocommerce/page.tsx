'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { 
  Download, 
  Zap, 
  CheckCircle2, 
  ArrowRight,
  Monitor,
  ShieldCheck,
  XCircle,
  TrendingUp,
  Cpu,
  Palette
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

export default function PluginWooCommercePage() {
  const [currency, setCurrency] = useState<'COP' | 'USD'>('COP');

  useEffect(() => {
    const saved = localStorage.getItem('currency') as 'COP' | 'USD';
    if (saved) setCurrency(saved);
  }, []);

  const handleCurrencyChange = (c: 'COP' | 'USD') => {
    setCurrency(c);
    localStorage.setItem('currency', c);
  };

  // Números estáticos según solicitud del usuario para evitar errores de importación
  const proPrice = currency === 'COP' ? '350.000' : '89';
  const proGens = '1.200';
  const proProducts = '15';

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white font-dm-sans selection:bg-[#FF5C3A]/30 selection:text-[#FF5C3A] overflow-x-hidden">
      <style dangerouslySetInnerHTML={{ __html: PREMIUM_FONTS }} />

      <LandingNav currency={currency} onCurrencyChange={handleCurrencyChange} />

      <main className="pt-32 pb-20 px-6">
        <div className="max-w-7xl mx-auto">
          
          {/* 1. Hero Section (El Gancho Visual) */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center mb-40 mt-12">
            <div className="relative z-10">
              <SectionLabel text="Plugin Oficial WooCommerce" />
              <h1 className="font-jakarta text-[48px] md:text-[64px] font-black leading-[1.1] tracking-tight mb-8">
                Tu tienda WooCommerce con IA en <span className="text-[#FF5C3A]">10 minutos.</span> Cero trabajo manual.
              </h1>
              <p className="text-lg text-white/60 mb-12 leading-relaxed max-w-xl font-dm-sans">
                 Automatiza tu probador virtual con nuestro plugin oficial. Olvídate de subir fotos una por una; nosotros sincronizamos tu catálogo para que tus clientes se prueben tu ropa directamente en tu página de producto.
              </p>
              
              <div className="flex flex-wrap gap-5">
                <Link href="/register?plan=PRO" className="bg-[#FF5C3A] text-white px-10 py-5 rounded-2xl font-bold text-sm transition-all hover:scale-105 shadow-xl shadow-[#FF5C3A]/20 flex items-center gap-3 active:scale-95">
                  Contratar Plan Pro y Descargar <ArrowRight size={18} />
                </Link>
              </div>
            </div>

            <div className="relative group">
               <div className="absolute inset-0 bg-[#FF5C3A]/10 blur-[120px] rounded-full animate-pulse" />
               <div className="relative rounded-[3rem] overflow-hidden border border-white/10 shadow-2xl bg-[#0a0a0a] aspect-[4/3] flex items-center justify-center p-8 group transition-all duration-700 hover:border-[#FF5C3A]/30">
                  <div className="absolute inset-0 bg-gradient-to-br from-[#FF5C3A]/5 to-transparent pointer-events-none" />
                  <div className="w-full h-full relative flex flex-col">
                    {/* Mockup Top Bar */}
                    <div className="flex items-center gap-2 p-4 bg-white/5 border-b border-white/5 rounded-t-2xl">
                      <div className="w-2.5 h-2.5 rounded-full bg-red-500/30" />
                      <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/30" />
                      <div className="w-2.5 h-2.5 rounded-full bg-green-500/30" />
                    </div>
                    {/* Content */}
                    <div className="flex-1 flex items-center justify-center relative bg-white/[0.02]">
                      <Monitor size={120} className="text-white/5" />
                      <div className="absolute inset-x-8 top-1/2 -translate-y-1/2 space-y-4">
                        <div className="p-6 rounded-3xl bg-[#0a0a0a]/80 border border-white/10 backdrop-blur-xl translate-x-[-8%] group-hover:translate-x-0 transition-transform duration-700">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl bg-purple-500/20 flex items-center justify-center">
                              <Image src="https://woocommerce.com/wp-content/themes/woo/images/logo-woocommerce.svg" alt="Woo" width={24} height={24} />
                            </div>
                            <div>
                              <div className="text-[10px] font-extrabold text-purple-400 uppercase tracking-widest">Sincronización Activa</div>
                              <div className="text-sm font-bold text-white/90">Lookitry Connector v2.4</div>
                            </div>
                          </div>
                        </div>
                        <div className="p-6 rounded-3xl bg-[#0a0a0a]/80 border border-white/10 backdrop-blur-xl translate-x-[8%] group-hover:translate-x-0 transition-transform duration-700 delay-150">
                           <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl bg-[#FF5C3A]/20 flex items-center justify-center text-[#FF5C3A]">
                              <TrendingUp size={20} />
                            </div>
                            <div>
                              <div className="text-[10px] font-extrabold text-[#FF5C3A] uppercase tracking-widest">Conversión Estimada</div>
                              <div className="text-sm font-bold text-white/90">+28.5% Ventas Netas</div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
               </div>
            </div>
          </div>

          {/* 2. El Problema vs. La Solución (Dueño E-commerce) */}
          <div className="mb-40" id="problem-solution">
             <div className="text-center mb-20 flex flex-col items-center">
                <SectionLabel text="Productividad E-commerce" />
                <h2 className="font-jakarta text-3xl md:text-5xl font-black mb-6 max-w-3xl leading-tight">
                  Escalar tu tienda es difícil cuando los procesos son <span className="text-white/40 italic">manuales.</span>
                </h2>
             </div>

             <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch">
                {/* Problema */}
                <div className="p-10 md:p-14 rounded-[3.5rem] bg-white/5 border border-white/10 flex flex-col hover:bg-white/[0.08] transition-all">
                   <h3 className="font-jakarta text-2xl font-bold mb-8 text-white/80">Sabemos lo que te frena:</h3>
                   <div className="space-y-8 flex-1">
                      {[
                        "Pierdes horas descargando y resubiendo fotos de tus productos a plataformas externas.",
                        "Tus clientes abandonan el carrito porque dudan de \"cómo les quedará\" la prenda o la talla.",
                        "Las devoluciones por insatisfacción visual se comen tu margen de ganancia real."
                      ].map((text, i) => (
                        <div key={i} className="flex gap-4 group">
                          <XCircle className="text-red-500/40 shrink-0 mt-1 group-hover:scale-110 transition-transform" size={24} />
                          <p className="text-white/40 text-lg leading-relaxed">{text}</p>
                        </div>
                      ))}
                   </div>
                </div>

                {/* Solución */}
                <div className="p-10 md:p-14 rounded-[3.5rem] bg-[#FF5C3A] border border-[#FF5C3A]/20 flex flex-col relative overflow-hidden group shadow-2xl shadow-[#FF5C3A]/20">
                   <div className="absolute top-0 left-0 w-full h-full bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 pointer-events-none mix-blend-overlay" />
                   <div className="relative z-10 flex flex-col h-full">
                      <h3 className="font-jakarta text-2xl font-bold mb-8 text-white">Automatización con el Plugin:</h3>
                      <div className="space-y-8 flex-1">
                          {[
                            { title: "Sincronización Inteligente", desc: "El plugin se conecta a tu tienda y hace que tus prendas estén listas para la IA sin trabajo manual." },
                            { title: "Experiencia Nativa", desc: "El botón de \"Probador Virtual\" se integra perfectamente al lado de tu botón de añadir al carrito." },
                            { title: "Decisión Instantánea", desc: "El cliente se ve con tu ropa puesta sin salir de tu dominio, aumentando la conversión final." }
                          ].map((item, i) => (
                            <div key={i} className="flex gap-4 items-start group">
                              <CheckCircle2 className="text-white shrink-0 mt-1 group-hover:scale-110 transition-transform" size={24} />
                              <div>
                                <span className="block font-bold text-white text-xl mb-1">{item.title}</span>
                                <p className="text-white/80 text-base leading-relaxed">{item.desc}</p>
                              </div>
                            </div>
                          ))}
                      </div>
                   </div>
                </div>
             </div>
          </div>

          {/* 3. Características Clave */}
          <div className="mb-40">
             <div className="text-center mb-20 flex flex-col items-center">
                <SectionLabel text="Lo que incluye" />
                <h2 className="font-jakarta text-3xl md:text-5xl font-black mb-6">Potencia <span className="text-[#FF5C3A]">Plug & Play.</span></h2>
             </div>

             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                  {
                    title: "Integración Plug & Play",
                    desc: "Se instala exactamente igual que cualquier otro plugin de WordPress. Sin tocar código ni desarrolladores.",
                    icon: <Zap size={24} />
                  },
                  {
                    title: "Automatización Total",
                    desc: "Si tienes una tienda online, buscas eficiencia. Este plugin elimina la necesidad de gestionar catálogos paralelos.",
                    icon: <Cpu size={24} />
                  },
                  {
                    title: "Adaptable a tu Tema",
                    desc: "El widget respeta el look and feel de tu tienda, permitiéndote personalizar textos, logos y colores.",
                    icon: <Palette size={24} />
                  },
                  {
                    title: "Fortalecimiento de Marca",
                    desc: "Imágenes de alta calidad sin marcas de agua de terceros. Tus clientes descargan contenido que grita TU marca.",
                    icon: <ShieldCheck size={24} />
                  }
                ].map((feat, idx) => (
                  <div key={idx} className="p-8 rounded-[2.5rem] bg-white/5 border border-white/5 hover:bg-white/10 transition-all flex flex-col items-start h-full group hover:-translate-y-2 duration-500">
                    <div className="w-14 h-14 rounded-2xl bg-[#FF5C3A]/10 flex items-center justify-center text-[#FF5C3A] mb-8 group-hover:scale-110 transition-transform">
                       {feat.icon}
                    </div>
                    <h4 className="font-jakarta font-bold text-xl mb-4 text-white/90">{feat.title}</h4>
                    <p className="text-white/40 text-sm leading-relaxed">{feat.desc}</p>
                  </div>
                ))}
             </div>
          </div>

          {/* 4. La Oferta (Empujando el Upgrade al Plan Pro) */}
          <div className="bg-white rounded-[4rem] p-12 md:p-24 text-center mb-40 relative overflow-hidden group shadow-[0_50px_100px_rgba(255,255,255,0.05)] border border-white/10">
             <div className="absolute inset-0 bg-[#FF5C3A]/5 opacity-50 pointer-events-none" />
             
             <div className="relative z-10 max-w-4xl mx-auto">
                <SectionLabel text="Potencia Premium" />
                <h2 className="font-jakarta text-4xl md:text-7xl font-black text-[#0a0a0a] mb-8 tracking-tighter">
                   Automatización <br /> en piloto automático.
                </h2>
                <p className="text-[#0a0a0a]/60 text-lg md:text-xl mb-12 max-w-2xl mx-auto font-dm-sans leading-relaxed">
                  El plugin de WooCommerce es nuestra herramienta más avanzada para tiendas con volumen. Está incluido de forma exclusiva en nuestro <span className="font-bold text-[#FF5C3A]">Plan Pro</span>.
                </p>

                <div className="flex flex-col md:flex-row items-center justify-center gap-12 mb-16">
                  <div className="text-center">
                    <div className="text-[#FF5C3A] text-6xl md:text-8xl font-black tracking-tighter mb-2 flex items-start gap-1 justify-center">
                      <span className="text-2xl mt-4 md:mt-6">{currency === 'COP' ? '$' : 'USD'}</span>{proPrice}
                    </div>
                    <div className="text-[#0a0a0a]/40 text-xs md:text-sm uppercase font-bold tracking-[0.2em]">Suscripción Mensual</div>
                  </div>
                  <div className="flex flex-col gap-5 text-left p-10 bg-[#0a0a0a]/5 rounded-[2.5rem] border border-black/5 shadow-inner">
                    <div className="flex items-center gap-3 text-[#0a0a0a]/80 font-bold text-lg">
                       <CheckCircle2 size={22} className="text-green-600" />
                       Hasta {proProducts} Productos Activos
                    </div>
                    <div className="flex items-center gap-3 text-[#0a0a0a]/80 font-bold text-lg">
                       <CheckCircle2 size={22} className="text-green-600" />
                       {proGens} Generaciones Mensuales
                    </div>
                    <div className="flex items-center gap-3 text-[#0a0a0a]/80 font-bold text-lg">
                       <CheckCircle2 size={22} className="text-green-600" />
                       Plugin WooCommerce Incluido
                    </div>
                  </div>
                </div>

                <Link href="/register?plan=PRO" id="cta-pro-plugin" className="bg-[#FF5C3A] text-white px-16 py-8 rounded-[2.5rem] font-bold text-xl hover:scale-105 active:scale-95 transition-all shadow-2xl shadow-[#FF5C3A]/30 inline-flex items-center gap-4 group/cta">
                   Contratar Plan Pro y Descargar Plugin <ArrowRight size={24} className="group-hover/cta:translate-x-2 transition-transform" />
                </Link>
                
                <p className="mt-10 text-[#0a0a0a]/40 text-sm font-medium">Porque tu tiempo vale dinero. Nosotros hacemos el trabajo pesado por ti.</p>
             </div>
          </div>

          {/* 5. Llamado a la Acción (CTA) y FAQ */}
          <div className="max-w-4xl mx-auto mb-40">
             <div className="text-center mb-16 flex flex-col items-center">
                <SectionLabel text="Preguntas del Plugin" />
                <h2 className="font-jakarta text-3xl md:text-5xl font-bold">Dudas <span className="text-[#FF5C3A]">Resueltas.</span></h2>
             </div>

             <div className="grid gap-6">
                {[
                  {
                    q: "¿Tengo que subir las fotos a Lookitry y también a WooCommerce?",
                    a: "¡Absolutamente no! Esa es la ventaja competitiva de nuestro plugin. Él elimina la carga manual una por una, sincronizando automáticamente las imágenes que ya tienes en tu servidor de WordPress."
                  },
                  {
                    q: "¿Está incluido en el Plan Básico o de Prueba?",
                    a: "No. El plugin es una herramienta de escala comercial exclusiva del Plan Pro. Los planes básicos están diseñados para marcas que inician, mientras que el plugin automatiza procesos críticos para tiendas en crecimiento."
                  },
                  {
                    q: "¿Ralentizará la velocidad de carga de mi página?",
                    a: "No. Toda la carga pesada del procesamiento de Imagen por IA ocurre en nuestros servidores de alto rendimiento. En tu tienda solo se muestra el resultado final, optimizado para no afectar tus métricas de Google PageSpeed."
                  }
                ].map((faq, i) => (
                  <div key={i} className="p-10 rounded-3xl bg-white/5 border border-white/5 hover:bg-white/10 transition-all group cursor-pointer">
                     <h3 className="font-jakarta font-bold text-xl mb-6 flex items-center justify-between text-white/90">
                       {faq.q}
                       <ArrowRight size={20} className="text-[#FF5C3A] rotate-90 group-hover:rotate-0 transition-transform duration-500" />
                     </h3>
                     <p className="text-white/40 leading-relaxed text-base group-hover:text-white/60 transition-colors">{faq.a}</p>
                  </div>
                ))}
             </div>
             
             <div className="mt-20 text-center">
                <div className="inline-flex flex-col items-center p-12 rounded-[3.5rem] bg-gradient-to-b from-[#FF5C3A]/10 to-transparent border border-[#FF5C3A]/20">
                   <h3 className="text-2xl font-bold font-jakarta mb-6">¿Listo para automatizar?</h3>
                   <Link href="/register?plan=PRO" className="flex items-center gap-3 text-white font-black text-xl hover:text-[#FF5C3A] transition-colors border-b-2 border-[#FF5C3A] pb-2">
                      Empieza tu Plan Pro hoy mismo <ArrowRight size={24} />
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
