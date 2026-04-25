'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
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
import LandingNav from '@/components/landing/LandingNav';
import LandingFooter from '@/components/landing/LandingFooter';

const PREMIUM_FONTS = `
  @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=DM+Sans:ital,opsz,wght@0,100..1000;1,100..1000&family=JetBrains+Mono:wght@400;500&display=swap');
  .font-jakarta { font-family: 'Plus Jakarta Sans', sans-serif; }
  .font-dm-sans { font-family: 'DM Sans', sans-serif; }
  .font-mono { font-family: 'JetBrains Mono', monospace; }
`;

const SectionLabel = ({ text, dark = false }: { text: string; dark?: boolean }) => (
  <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full ${dark ? 'bg-black/10 border-black/10 text-black/60' : 'bg-[#FF5C3A]/10 border-[#FF5C3A]/20 text-[#FF5C3A]'} text-[10px] font-bold uppercase tracking-widest mb-8 border transition-all`}>
    <div className={`w-1 h-1 rounded-full ${dark ? 'bg-black/40' : 'bg-[#FF5C3A]'} animate-pulse`} />
    {text}
  </div>
);

export default function ApiDeveloperPage() {
  const apiKeyPlaceholder = "LK-PRV-3x9a2kLp0m... (Usa tu propia Key)";

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white font-dm-sans selection:bg-[#FF5C3A]/30 selection:text-white overflow-x-clip">
      <style dangerouslySetInnerHTML={{ __html: PREMIUM_FONTS }} />

      <LandingNav />

      <main className="pt-40 pb-20 px-6">
        <div className="max-w-7xl mx-auto">
          
          {/* 1. Hero Section (El Gancho Técnico) */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center mb-40">
            <div>
              <SectionLabel text="API v3.0 Early Access" />
              <h1 className="font-jakarta text-[48px] md:text-[64px] font-black leading-[1.1] tracking-tight mb-8">
                 API de Lookitry <br />
                 <span className="text-[#FF5C3A]">IA en tu App</span> en días, no meses.
              </h1>
              <p className="text-lg text-white/60 mb-12 leading-relaxed max-w-xl font-dm-sans">
                 Olvídate de entrenar modelos complejos o gestionar costosos servidores GPU. Conecta nuestra API robusta y lleva la experiencia del probador virtual directamente a tu plataforma móvil o e-commerce a medida.
              </p>
              
              <div className="flex flex-wrap gap-5">
                <Link href="/checkout?plan=PRO" className="bg-[#FF5C3A] text-white px-10 py-5 rounded-2xl font-bold text-sm transition-all hover:scale-105 shadow-xl shadow-[#FF5C3A]/20 flex items-center gap-3">
                  Obtener API Key (Pro) <ArrowRight size={18} />
                </Link>
                <div className="flex items-center gap-2 text-white/40 text-xs font-mono">
                  $ curl -X POST https://api.lookitry.com/v3/render
                </div>
              </div>
            </div>

            {/* Mockup de Código (Estilo VS Code) */}
            <div className="bg-[#0f0f0f] rounded-[2.5rem] border border-white/5 p-1 md:p-2 shadow-2xl relative overflow-hidden group">
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

                  <div className="mt-10 pt-10 border-t border-white/5 flex items-center justify-between text-[11px] text-white/20 font-mono">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-1"><Loader2 size={12} className="animate-spin text-green-500" /> GPU Cluster: 12 Ready</div>
                      <div>Region: us-east-1</div>
                    </div>
                    <div className="hover:text-white cursor-pointer transition-colors">Copy Code</div>
                  </div>
               </div>
            </div>
          </div>

          {/* 2. El Problema vs. La Solución (Visión CTO) */}
          <div className="mb-40" id="infra-nightmare">
             <div className="text-center mb-20 flex flex-col items-center">
                <SectionLabel text="Perspectiva Técnica" />
                <h2 className="font-jakarta text-3xl md:text-5xl font-black mb-6 max-w-4xl leading-tight text-reveal">
                  Construir IA in-house es una pesadilla de <span className="text-white/40 italic">infraestructura.</span>
                </h2>
             </div>

             <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch">
                {/* Problema */}
                <div className="p-12 rounded-[3.5rem] bg-white/5 border border-white/10 flex flex-col hover:bg-white/[0.08] transition-all">
                   <h3 className="font-jakarta text-2xl font-bold mb-10 text-white/80">Desafíos Críticos:</h3>
                   <div className="space-y-10 flex-1">
                      {[
                        { title: "Orquestación Compleja", desc: "Meses intentando sincronizar modelos de visión por computadora con stacks modernos de web/mobile.", icon: <ServerOff size={24} /> },
                        { title: "Costos Inasumibles", desc: "Facturas impredecibles en AWS/GCP por instancias GPU inactivas o mal optimizadas.", icon: <XCircle size={24} /> },
                        { title: "Picos de Tráfico", desc: "Caídas sistemáticas durante eventos de venta masiva por falta de gestión de colas distribuida.", icon: <XCircle size={24} /> }
                      ].map((item, i) => (
                        <div key={i} className="flex gap-5 group">
                          <div className="text-red-500/40 shrink-0 mt-1">{item.icon}</div>
                          <div>
                            <span className="block font-bold text-white text-lg mb-1">{item.title}</span>
                            <p className="text-white/40 text-sm leading-relaxed">{item.desc}</p>
                          </div>
                        </div>
                      ))}
                   </div>
                </div>

                {/* Solución */}
                <div className="p-12 rounded-[3.5rem] bg-[#FF5C3A] border border-[#FF5C3A]/20 flex flex-col relative overflow-hidden shadow-2xl shadow-[#FF5C3A]/20">
                   {/* Noise overlay removed for premium clean look */}
                   <div className="relative z-10 flex flex-col h-full">
                      <h3 className="font-jakarta text-2xl font-bold mb-10 text-white">Externaliza la complejidad:</h3>
                      <div className="space-y-10 flex-1">
                          {[
                            { title: "Integración End-to-End", desc: "Endpoints diseñados para recibir fotos crudas y devolver resultados procesados en tiempo récord.", icon: <CheckCircle2 size={24} /> },
                            { title: "Managed Queue Engine", desc: "Nuestro sistema absorbe picos masivos de tráfico automáticamente sin afectar los tiempos de respuesta.", icon: <CheckCircle2 size={24} /> },
                            { title: "Agnóstico al Frontend", desc: "Usa tu propio diseño nativo en iOS, Android o Web. Nosotros somos el motor invisible.", icon: <CheckCircle2 size={24} /> }
                          ].map((item, i) => (
                            <div key={i} className="flex gap-5 items-start group">
                              <div className="text-white shrink-0 mt-1">{item.icon}</div>
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

          {/* 3. Características Clave (Specs Técnicos) */}
          <div className="mb-40">
             <div className="text-center mb-28 flex flex-col items-center">
                <SectionLabel text="API Features" />
                <h2 className="font-jakarta text-3xl md:text-5xl font-black mb-6 italic text-[#FF5C3A]">Tech Specs.</h2>
             </div>

             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {[
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
                ].map((feat, idx) => (
                  <div key={idx} className="p-10 rounded-[2.5rem] bg-white/5 border border-white/5 hover:bg-white/10 transition-all flex flex-col items-start h-full group relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
                       {feat.icon}
                    </div>
                    <div className="w-14 h-14 rounded-2xl bg-[#FF5C3A]/10 flex items-center justify-center text-[#FF5C3A] mb-8 group-hover:rotate-12 transition-transform">
                       {feat.icon}
                    </div>
                    <div className="text-[10px] font-black uppercase text-[#FF5C3A] tracking-widest mb-2 px-3 py-1 rounded-full bg-[#FF5C3A]/10 border border-[#FF5C3A]/10">
                      {feat.tag}
                    </div>
                    <h4 className="font-jakarta font-bold text-xl mb-4 text-white/90">{feat.title}</h4>
                    <p className="text-white/40 text-sm leading-relaxed">{feat.desc}</p>
                  </div>
                ))}
             </div>
          </div>

          {/* Integration Support Technical */}
          <div className="bg-[#FF5C3A] rounded-[3.5rem] p-12 md:p-24 text-center relative overflow-hidden group shadow-[0_50px_100px_rgba(255,92,58,0.1)]">
             <div className="absolute inset-0 bg-[#0a0a0a]/5 opacity-50 pointer-events-none" />
             <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-white/10 blur-[150px] rounded-full group-hover:scale-110 transition-transform duration-1000" />
             
             <div className="relative z-10 max-w-4xl mx-auto">
                <SectionLabel text="Soporte de Ingeniería" dark />
                <h2 className="font-jakarta text-4xl md:text-6xl font-black text-white mb-8 tracking-tighter">
                   Habla el lenguaje <br /> de tus servidores.
                </h2>
                <p className="text-white/80 text-lg md:text-xl mb-12 max-w-2xl mx-auto font-dm-sans leading-relaxed">
                   ¿Necesitas ayuda con la orquestación de la API o la sincronización masiva de SKUs? Nuestro equipo de ingeniería está listo para asistirte.
                </p>
                <Link href="/contacto" className="bg-[#0a0a0a] text-white px-16 py-8 rounded-[2.5rem] font-bold text-xl hover:scale-105 active:scale-95 transition-all shadow-2xl shadow-black/40 inline-flex items-center gap-4 group/cta">
                   Agendar llamada técnica <ArrowRight size={24} className="group-hover/cta:translate-x-2 transition-transform" />
                </Link>
             </div>
          </div>

        </div>
      </main>

      <LandingFooter />
    </div>
  );
}
