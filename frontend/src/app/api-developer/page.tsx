'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { 
  Terminal, 
  Cpu, 
  Zap, 
  ShieldCheck, 
  ArrowRight,
  Code2,
  Blocks,
  Globe,
  Database,
  BarChart3,
  Smartphone,
  EyeOff,
  ServerOff,
  XCircle,
  CheckCircle2,
  Loader2,
  RefreshCw
} from 'lucide-react';
import { motion, useInView, Easing } from 'framer-motion';
import LandingNav from '@/components/landing/LandingNav';
import LandingFooter from '@/components/landing/LandingFooter';
import { useCurrency } from '@/hooks/useCurrency';

const EASING: [number, number, number, number] = [0.25, 0.1, 0.25, 1];

const PREMIUM_FONTS = `
  @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=DM+Sans:ital,opsz,wght@0,100..1000;1,100..1000&family=JetBrains+Mono:wght@400;500&display=swap');
  .font-jakarta { font-family: 'Plus Jakarta Sans', sans-serif; }
  .font-dm-sans { font-family: 'DM Sans', sans-serif; }
  .font-mono { font-family: 'JetBrains Mono', monospace; }
`;

const SectionLabel = ({ text }: { text: string }) => (
  <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#FF5C3A]/10 border border-[#FF5C3A]/20 text-[#FF5C3A] text-[10px] font-bold uppercase tracking-widest mb-8 border transition-all">
    <div className="w-1 h-1 rounded-full bg-[#FF5C3A] animate-pulse" />
    {text}
  </div>
);

// Animations
const fadeUp = {
  hidden: { opacity: 0, y: 40 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.7, ease: EASING } }
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1, delayChildren: 0.1 } }
};

const cardVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: EASING } }
};

const techSpecs = [
  {
    title: "SLA Garantizado (< 5s)",
    desc: "Rendimiento asegurado por contrato. Procesamiento distribuido que devuelve la imagen en milisegundos.",
    icon: <Zap size={24} />,
    tag: "Performance"
  },
  {
    title: "API Access Nativo",
    desc: "Documentación REST y SDKs oficiales para iOS (Swift), Android (Kotlin) y React Native.",
    icon: <Smartphone size={24} />,
    tag: "Connectivity"
  },
  {
    title: "White Label Total",
    desc: "Imágenes crudas a resolución completa sin marcas de agua ni menciones a nuestra plataforma.",
    icon: <EyeOff size={24} />,
    tag: "Branding"
  },
  {
    title: "bulk_sync (The Sync)",
    desc: "Conecta tu API de inventario y pre-procesamos tus catálogos automáticamente cada 24 horas.",
    icon: <RefreshCw size={24} />,
    tag: "Automation"
  },
  {
    title: "Analítica (Data Lab)",
    desc: "Endpoints analíticos para saber qué prendas, tallas y estilos son tendencia en tiempo real.",
    icon: <BarChart3 size={24} />,
    tag: "Insights"
  },
  {
    title: "Webhooks Avanzados",
    desc: "Notificaciones asíncronas para flujos de trabajo de alta disponibilidad y manejo de errores.",
    icon: <Globe size={24} />,
    tag: "Architecture"
  }
];

const challenges = [
  { title: "Orquestación Compleja", desc: "Meses intentando sincronizar modelos de visión por computadora con stacks modernos de web/mobile.", icon: <ServerOff size={24} /> },
  { title: "Costos Inasumibles", desc: "Facturas impredecibles en AWS/GCP por instancias GPU inactivas o mal optimizadas.", icon: <XCircle size={24} /> },
  { title: "Picos de Tráfico", desc: "Caídas sistemáticas durante eventos de venta masiva por falta de gestión de colas distribuida.", icon: <XCircle size={24} /> }
];

const solutions = [
  { title: "Integración End-to-End", desc: "Endpoints diseñados para recibir fotos crudas y devolver resultados procesados en tiempo récord.", icon: <CheckCircle2 size={24} /> },
  { title: "Managed Queue Engine", desc: "Nuestro sistema absorbe picos masivos de tráfico automáticamente sin afectar los tiempos de respuesta.", icon: <CheckCircle2 size={24} /> },
  { title: "Agnóstico al Frontend", desc: "Usa tu propio diseño nativo en iOS, Android o Web. Nosotros somos el motor invisible.", icon: <CheckCircle2 size={24} /> }
];

export default function ApiDeveloperPage() {
  const { currency, setCurrency } = useCurrency();
  const apiKeyPlaceholder = "***REMOVED-SECRET*** (Usa tu propia Key)";

  // Refs for scroll animations
  const heroRef = useRef<HTMLDivElement>(null);
  const problemRef = useRef<HTMLDivElement>(null);
  const specsRef = useRef<HTMLDivElement>(null);
  const supportRef = useRef<HTMLDivElement>(null);

  const heroInView = useInView(heroRef, { once: true, amount: 0.2 });
  const problemInView = useInView(problemRef, { once: true, amount: 0.2 });
  const specsInView = useInView(specsRef, { once: true, amount: 0.1 });
  const supportInView = useInView(supportRef, { once: true, amount: 0.3 });

  useEffect(() => {
    const handleCurrencyChange = () => {
      const saved = localStorage.getItem('currency') as 'COP' | 'USD' | null;
      if (saved === 'COP' || saved === 'USD') {
        setCurrency(saved);
      }
    };
    window.addEventListener('currencyChange', handleCurrencyChange);
    return () => window.removeEventListener('currencyChange', handleCurrencyChange);
  }, [setCurrency]);

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white font-dm-sans selection:bg-[#FF5C3A]/30 selection:text-white overflow-x-clip">
      <style dangerouslySetInnerHTML={{ __html: PREMIUM_FONTS }} />

      <LandingNav />

      <main className="pt-40 pb-20 px-6">
        <div className="max-w-7xl mx-auto">
          
          {/* 1. Hero Section */}
          <motion.div
            ref={heroRef}
            initial="hidden"
            animate={heroInView ? 'visible' : 'hidden'}
            variants={staggerContainer}
            className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center mb-40"
          >
            <motion.div variants={fadeUp}>
              <SectionLabel text="API v3.0 Early Access" />
              <motion.h1 variants={fadeUp} className="font-jakarta text-[48px] md:text-[64px] font-black leading-[1.1] tracking-tight mb-8">
                 API de Lookitry <br />
                 <span className="text-[#FF5C3A]">IA en tu App</span> en días, no meses.
              </motion.h1>
              <motion.p variants={fadeUp} className="text-lg text-white/60 mb-12 leading-relaxed max-w-xl font-dm-sans">
                 Olvídate de entrenar modelos complejos o gestionar costosos servidores GPU. Conecta nuestra API robusta y lleva la experiencia del probador virtual directamente a tu plataforma móvil o e-commerce a medida.
              </motion.p>
              
              <motion.div variants={fadeUp} className="flex flex-wrap gap-5">
                <Link 
                  href="/checkout?plan=PRO" 
                  className="bg-[#FF5C3A] text-white px-10 py-5 rounded-2xl font-bold text-sm transition-all hover:scale-105 hover:shadow-2xl hover:shadow-[#FF5C3A]/30 flex items-center gap-3"
                >
                  Obtener API Key (Pro) <ArrowRight size={18} />
                </Link>
                <div className="flex items-center gap-2 text-white/40 text-xs font-mono bg-white/5 px-4 py-2 rounded-xl border border-white/10">
                  $ curl -X POST https://api.lookitry.com/v3/render
                </div>
              </motion.div>
            </motion.div>

            {/* Mockup de Código */}
            <motion.div
              variants={fadeUp}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={heroInView ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.95 }}
              transition={{ delay: 0.3, duration: 0.8, ease: EASING }}
              className="bg-[#0f0f0f] rounded-[2.5rem] border border-white/5 p-1 md:p-2 shadow-2xl relative overflow-hidden group"
            >
               <div className="bg-[#1a1a1a] rounded-[2.2rem] p-6 md:p-10">
                  <div className="flex items-center justify-between mb-10">
                    <div className="flex gap-2">
                       <div className="w-3 h-3 rounded-full bg-[#ff5f56]" />
                       <div className="w-3 h-3 rounded-full bg-[#ffbd2e]" />
                       <div className="w-3 h-3 rounded-full bg-[#27c93f]" />
                    </div>
                    <div className="text-[10px] font-mono font-bold text-white/20 uppercase tracking-widest">integration_example.js</div>
                  </div>
                  
                  <div className="font-mono text-xs md:text-sm lg:text-base space-y-2 opacity-90">
                    <div className="text-purple-400">const<span className="text-white"> lookitry = </span>require<span className="text-yellow-400">(&apos;@lookitry/sdk&apos;)</span>;</div>
                    <div className="text-white/20">{'// 1. Auth & Config'}</div>
                    <div className="text-purple-400">await<span className="text-white"> lookitry.</span>init<span className="text-white">(</span><span className="text-green-400">&quot;{apiKeyPlaceholder}&quot;</span><span className="text-white">);</span></div>
                    <div className="text-white">&nbsp;</div>
                    <div className="text-white/20">{'// 2. Magic happens here'}</div>
                    <div className="text-purple-400">const<span className="text-white"> &#123; result_url, latency_ms &#125; = </span>await<span className="text-white"> lookitry.</span>render<span className="text-white">(&#123;</span></div>
                    <div className="text-white">&nbsp;&nbsp;user_photo: <span className="text-green-400">&quot;s3://bucket/selfie.jpg&quot;</span>,</div>
                    <div className="text-white">&nbsp;&nbsp;sku: <span className="text-green-400">&quot;PRO-VESTIDO-RED&quot;</span>,</div>
                    <div className="text-white">&nbsp;&nbsp;webhook: <span className="text-green-400">&quot;https://tu-app.com/callback&quot;</span></div>
                    <div className="text-white">&#125;);</div>
                    <div className="text-white">&nbsp;</div>
                    <div className="text-purple-400">console<span className="text-white">.</span>log<span className="text-white">(</span><span className="text-green-400">`IA Ready in $&#123;latency_ms&#125;ms: $&#123;result_url&#125;`</span><span className="text-white">);</span></div>
                  </div>

                  <motion.div 
                    className="mt-10 pt-10 border-t border-white/5 flex items-center justify-between text-[11px] text-white/20 font-mono"
                    initial={{ opacity: 0 }}
                    animate={heroInView ? { opacity: 1 } : { opacity: 0 }}
                    transition={{ delay: 0.8, duration: 0.5 }}
                  >
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-1"><Loader2 size={12} className="animate-spin text-green-500" /> GPU Cluster: 12 Ready</div>
                      <div>Region: us-east-1</div>
                    </div>
                    <motion.div 
                      className="hover:text-white cursor-pointer transition-colors"
                      whileHover={{ scale: 1.05 }}
                    >
                      Copy Code
                    </motion.div>
                  </motion.div>
               </div>
            </motion.div>
          </motion.div>

          {/* 2. El Problema vs. La Solución */}
          <motion.div
            ref={problemRef}
            initial="hidden"
            animate={problemInView ? 'visible' : 'hidden'}
            variants={staggerContainer}
            className="mb-40"
          >
             <motion.div variants={fadeUp} className="text-center mb-20 flex flex-col items-center">
                <SectionLabel text="Perspectiva Técnica" />
                <h2 className="font-jakarta text-3xl md:text-5xl font-black mb-6 max-w-4xl leading-tight">
                  Construir IA in-house es una pesadilla de <span className="text-white/40 italic">infraestructura.</span>
                </h2>
             </motion.div>

             <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch">
                {/* Problema */}
                <motion.div
                  variants={cardVariants}
                  className="p-12 rounded-[3.5rem] bg-white/5 border border-white/10 flex flex-col hover:bg-white/[0.08] hover:border-[#FF5C3A]/20 transition-all"
                >
                   <h3 className="font-jakarta text-2xl font-bold mb-10 text-white/80">Desafíos Críticos:</h3>
                   <div className="space-y-10 flex-1">
                      {challenges.map((item, i) => (
                        <motion.div
                          key={i}
                          initial={{ opacity: 0, x: -20 }}
                          animate={problemInView ? { opacity: 1, x: 0 } : { opacity: 0, x: -20 }}
                          transition={{ delay: 0.2 + i * 0.1, duration: 0.5, ease: EASING }}
                          className="flex gap-5 group"
                        >
                          <div className="text-red-500/40 shrink-0 mt-1 group-hover:text-red-500/60 group-hover:scale-110 transition-all">{item.icon}</div>
                          <div>
                            <span className="block font-bold text-white text-lg mb-1 group-hover:text-white/90 transition-colors">{item.title}</span>
                            <p className="text-white/40 text-sm leading-relaxed group-hover:text-white/50 transition-colors">{item.desc}</p>
                          </div>
                        </motion.div>
                      ))}
                   </div>
                </motion.div>

                {/* Solución */}
                <motion.div
                  variants={cardVariants}
                  className="p-12 rounded-[3.5rem] bg-[#FF5C3A] border border-[#FF5C3A]/20 flex flex-col relative overflow-hidden shadow-2xl shadow-[#FF5C3A]/20 hover:shadow-[#FF5C3A]/30 transition-all"
                >
                   <div className="relative z-10 flex flex-col h-full">
                      <h3 className="font-jakarta text-2xl font-bold mb-10 text-white">Externaliza la complejidad:</h3>
                      <div className="space-y-10 flex-1">
                          {solutions.map((item, i) => (
                            <motion.div
                              key={i}
                              initial={{ opacity: 0, x: 20 }}
                              animate={problemInView ? { opacity: 1, x: 0 } : { opacity: 0, x: 20 }}
                              transition={{ delay: 0.2 + i * 0.1, duration: 0.5, ease: EASING }}
                              className="flex gap-5 items-start group"
                            >
                              <div className="text-white shrink-0 mt-1 group-hover:scale-110 transition-transform">{item.icon}</div>
                              <div>
                                <span className="block font-bold text-white text-xl mb-1">{item.title}</span>
                                <p className="text-white/80 text-base leading-relaxed">{item.desc}</p>
                              </div>
                            </motion.div>
                          ))}
                      </div>
                   </div>
                </motion.div>
             </div>
          </motion.div>

          {/* 3. Características Clave */}
          <motion.div
            ref={specsRef}
            initial="hidden"
            animate={specsInView ? 'visible' : 'hidden'}
            variants={staggerContainer}
            className="mb-40"
          >
             <motion.div variants={fadeUp} className="text-center mb-28 flex flex-col items-center">
                <SectionLabel text="API Features" />
                <h2 className="font-jakarta text-3xl md:text-5xl font-black mb-6 italic text-[#FF5C3A]">Tech Specs.</h2>
             </motion.div>

             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {techSpecs.map((feat, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, y: 30 }}
                    animate={specsInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
                    transition={{ delay: idx * 0.1, duration: 0.6, ease: EASING }}
                    whileHover={{ y: -8, transition: { duration: 0.3 } }}
                    className="p-10 rounded-[2.5rem] bg-white/5 border border-white/5 hover:bg-white/10 hover:border-[#FF5C3A]/30 transition-all flex flex-col items-start h-full group relative overflow-hidden cursor-pointer"
                  >
                    <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
                       {feat.icon}
                    </div>
                    <motion.div 
                      className="w-14 h-14 rounded-2xl bg-[#FF5C3A]/10 flex items-center justify-center text-[#FF5C3A] mb-8 group-hover:rotate-90 group-hover:bg-[#FF5C3A] group-hover:text-white transition-all duration-300"
                      whileHover={{ scale: 1.1 }}
                    >
                       {feat.icon}
                    </motion.div>
                    <div className="text-[10px] font-black uppercase text-[#FF5C3A] tracking-widest mb-2 px-3 py-1 rounded-full bg-[#FF5C3A]/10 border border-[#FF5C3A]/10">
                      {feat.tag}
                    </div>
                    <h4 className="font-jakarta font-bold text-xl mb-4 text-white/90 group-hover:text-[#FF5C3A] transition-colors">{feat.title}</h4>
                    <p className="text-white/40 text-sm leading-relaxed group-hover:text-white/60 transition-colors">{feat.desc}</p>
                  </motion.div>
                ))}
             </div>
          </motion.div>

          {/* 4. Soporte de Ingeniería */}
          <motion.div
            ref={supportRef}
            initial="hidden"
            animate={supportInView ? 'visible' : 'hidden'}
            variants={staggerContainer}
            className="bg-[#FF5C3A] rounded-[3.5rem] p-12 md:p-24 text-center relative overflow-hidden group shadow-[0_50px_100px_rgba(255,92,58,0.1)]"
          >
             <motion.div 
               className="absolute inset-0 bg-[#0a0a0a]/5 opacity-50 pointer-events-none"
               animate={{ scale: supportInView ? 1 : 1.1 }}
               transition={{ duration: 1 }}
             />
             <motion.div 
               className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-white/10 blur-[150px] rounded-full"
               animate={{ scale: supportInView ? 1 : 1.1 }}
               transition={{ duration: 1 }}
             />
              
              <div className="relative z-10 max-w-4xl mx-auto">
                 <SectionLabel text="Soporte de Ingeniería" />
                 <motion.h2 variants={fadeUp} className="font-jakarta text-4xl md:text-6xl font-black text-white mb-8 tracking-tighter">
                    Habla el lenguaje <br /> de tus servidores.
                 </motion.h2>
                 <motion.p variants={fadeUp} className="text-white/80 text-lg md:text-xl mb-12 max-w-2xl mx-auto font-dm-sans leading-relaxed">
                    ¿Necesitas ayuda con la orquestación de la API o la sincronización masiva de SKUs? Nuestro equipo de ingeniería está listo para asistirte.
                 </motion.p>
                 <motion.div
                   initial={{ opacity: 0, y: 20 }}
                   animate={supportInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
                   transition={{ delay: 0.4, duration: 0.6 }}
                 >
                   <Link 
                     href="/contacto" 
                     className="bg-[#0a0a0a] text-white px-16 py-8 rounded-[2.5rem] font-bold text-xl hover:scale-105 active:scale-95 transition-all shadow-2xl shadow-black/40 inline-flex items-center gap-4 group/cta"
                   >
                      Agendar llamada técnica <ArrowRight size={24} className="group-hover/cta:translate-x-2 transition-transform" />
                   </Link>
                 </motion.div>
              </div>
          </motion.div>

        </div>
      </main>

      <LandingFooter />
    </div>
  );
}
