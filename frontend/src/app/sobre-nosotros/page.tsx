'use client';

import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { useState, useEffect } from 'react';
import LandingNav from '@/components/landing/new-landing/LandingNav';
import LandingFooter from '@/components/landing/new-landing/LandingFooter';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { 
  Instagram, 
  Linkedin, 
  Github, 
  Mail, 
  CheckCircle2, 
  Code2, 
  Layout, 
  Cpu,
  Globe,
  Palette
} from 'lucide-react';
import { fetchPublicPaymentSettings, toWhatsAppUrl } from '@/services/public-config.service';

// Icono personalizado para Behance
function IconBehance({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4z" />
      <path d="M9 12v8" />
      <path d="M13 12h6" />
      <path d="M13 16h6" />
      <path d="M13 8h6" />
    </svg>
  );
}

const TEAM = [
  {
    name: 'Sam Wilkie',
    role: 'Full Stack Developer & Founder',
    desc: 'Líder técnico y visionario venezolano detrás de Lookitry. Especialista en arquitectura de software y soluciones de IA escalables para el mercado global.',
    img: '/team/sam.webp',
    social: {
      linkedin: 'https://www.linkedin.com/in/samu-wilkie/', 
      instagram: 'https://www.instagram.com/wilkie_design/',
      github: 'https://github.com/depper-IA',
      behance: 'https://www.behance.net/samuelwilkie'
    }
  },
  {
    name: 'Melissa Urbano',
    role: 'Junior Front-End Developer',
    desc: 'Desarrolladora colombiana especialista en interfaces modernas. Encargada de la evolución estética y experiencia de usuario en Lookitry.',
    img: '/team/juli.webp',
    social: {
      linkedin: 'https://www.linkedin.com/in/juliana-urbano-69b13939b/',
      behance: 'https://www.behance.net/ummel',
      github: 'https://github.com/ummell'
    }
  }
];

const VALUES = [
  {
    icon: <Code2 size={20} />,
    title: 'Innovación accesible',
    desc: 'La IA no debería ser solo para grandes empresas. La hacemos simple y asequible para cualquier tienda en Latam.',
  },
  {
    icon: <Layout size={20} />,
    title: 'Enfoque en el cliente',
    desc: 'Cada decisión de producto la tomamos pensando en las marcas que confían en nosotros y en sus clientes finales.',
  },
  {
    icon: <CheckCircle2 size={20} />,
    title: 'Transparencia',
    desc: 'Sin letra pequeña. Precios claros, datos seguros y comunicación directa con nuestro equipo.',
  },
];

export default function SobreNosotrosPage() {
  const [support, setSupport] = useState({ whatsapp: 'https://wa.me/573105436281', email: 'info@lookitry.com' });

  useEffect(() => {
    fetchPublicPaymentSettings()
      .then(data => {
        if (!data) return;
        setSupport({
          whatsapp: toWhatsAppUrl(data.manualWhatsapp) || 'https://wa.me/573105436281',
          email: data.manualEmail || 'info@lookitry.com',
        });
      })
      .catch(() => {});
  }, []);

  return (
    <div className="overflow-x-clip">
      <LandingNav />
      <main className="min-h-screen bg-[#0a0a0a]">

        {/* Header */}
        <div className="bg-[#0a0a0a] px-6 md:px-8 py-14 md:py-24 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-full opacity-[0.05] pointer-events-none" 
            style={{ backgroundImage: 'radial-gradient(#FF5C3A 1px, transparent 1px)', backgroundSize: '32px 32px' }} 
          />
          <div className="max-w-4xl mx-auto relative z-10">
            <Breadcrumbs items={[{ label: 'Sobre Nosotros' }]} light className="mb-8" />
            <p className="text-[11px] font-medium tracking-[.2em] uppercase text-[#FF5C3A] mb-4">Quiénes somos</p>
            <h1 className="font-syne font-extrabold text-4xl md:text-6xl text-white tracking-tight mb-6 leading-tight">
              Construimos el probador virtual<br />
              <span className="text-[#FF5C3A]">que Latam necesitaba</span>
            </h1>
            <p className="text-[#999] text-lg md:text-xl leading-relaxed max-w-2xl font-light">
              Somos un equipo apasionado por Lookitry, obsesionados con hacer que la tecnología de IA sea práctica y aumente las ventas reales de las marcas en toda la región.
            </p>
          </div>
        </div>

        <div className="px-6 md:px-8 py-16">
          <div className="max-w-4xl mx-auto space-y-24">

            {/* Historia y Evolución */}
            <section className="relative">
              <div className="absolute -left-4 top-0 w-1 h-full bg-gradient-to-b from-[#FF5C3A] to-transparent opacity-20 hidden md:block" />
              <div className="space-y-6">
                <h2 className="font-syne font-bold text-2xl text-white">Nuestra Historia</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                  <div className="space-y-4">
                    <p className="text-[15px] text-[#999] leading-relaxed font-light">
                      <strong className="text-white font-medium">2024: La Concepción.</strong> Lookitry nació de la unión de dos visiones en WilkieDevs. Notamos que el 30% de las devoluciones en e-commerce ocurrían porque los clientes no podían visualizar las prendas en sí mismos. Iniciamos el entrenamiento de modelos de IA específicos para la fisionomía latina.
                    </p>
                    <p className="text-[15px] text-[#999] leading-relaxed font-light">
                      <strong className="text-white font-medium">2025: Refinamiento y Beta.</strong> Durante un año, trabajamos de la mano con 120 marcas pioneras en Colombia y Venezuela para perfeccionar el algoritmo. Logramos que el widget fuera tan ligero que se instalara en menos de 10 minutos.
                    </p>
                  </div>
                  <div className="space-y-4">
                    <p className="text-[15px] text-[#999] leading-relaxed font-light">
                      <strong className="text-white font-medium">Marzo 2026: El Lanzamiento Oficial.</strong> Tras procesar más de <span className="text-[#FF5C3A] font-bold">18,000 generaciones mensuales</span> en nuestra fase final, estamos a días de abrir nuestras puertas al mercado global (finales de marzo / inicios de abril).
                    </p>
                    <p className="text-[15px] text-[#999] leading-relaxed font-light">
                      Con un equipo multicultural, Lookitry no es solo un software, es el nuevo estándar de confianza para el retail digital en Latinoamérica.
                    </p>
                  </div>
                </div>
              </div>
            </section>

            {/* Misión y Visión */}
            <section className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
              <div>
                <h2 className="font-syne font-bold text-2xl text-white mb-4">Nuestra misión</h2>
                <p className="text-[15px] text-[#999] leading-relaxed mb-6 font-light">
                  Reducir la brecha entre el comercio físico y digital. En Lookitry, construimos el puente tecnológico que permite a las marcas latinas competir a nivel global usando Inteligencia Artificial.
                </p>
                <div className="flex items-center gap-3 text-[#FF5C3A] font-bold text-sm">
                  <CheckCircle2 size={18} />
                  <span>+120 marcas confían en nosotros</span>
                </div>
              </div>
              <div className="bg-[#141414] border border-[#2a2a2a] p-8 rounded-[2rem]">
                <h2 className="font-syne font-bold text-2xl text-white mb-4">El impacto</h2>
                <p className="text-[15px] text-[#999] leading-relaxed font-light">
                  Entendimos que la IA no debía ser un lujo para pocos. Diseñamos un ecosistema que se integra en 10 minutos, permitiendo que cualquier emprendedor tenga un probador de nivel mundial en su tienda.
                </p>
              </div>
            </section>

            {/* Equipo */}
            <section id="equipo">
              <div className="text-center mb-16">
                <p className="text-[#FF5C3A] text-xs font-bold tracking-[0.2em] uppercase mb-4">El Talento</p>
                <h2 className="font-syne font-bold text-3xl md:text-4xl text-white tracking-tight">
                  Mentes detrás del <span className="text-[#FF5C3A]">algoritmo</span>
                </h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-3xl mx-auto">
                {TEAM.map((m, i) => (
                  <div key={i} className="bg-[#141414] border border-[#2a2a2a] rounded-[2rem] p-8 hover:border-[#FF5C3A]/30 transition-all group">
                    <div className="flex flex-col items-center text-center">
                      <div className="relative w-24 h-24 rounded-2xl overflow-hidden mb-6 bg-[#0a0a0a]">
                        <Image src={m.img} alt={m.name} fill className="object-cover" />
                      </div>
                      <h3 className="font-syne font-bold text-xl text-white mb-1">{m.name}</h3>
                      <p className="text-[#FF5C3A] font-bold text-[10px] uppercase tracking-widest mb-4">{m.role}</p>
                      <p className="text-[#777] leading-relaxed text-sm font-light mb-6">{m.desc}</p>
                      <div className="flex gap-4">
                        {m.social.linkedin && <a href={m.social.linkedin} target="_blank" rel="noopener noreferrer" className="text-[#444] hover:text-white transition-colors"><Linkedin size={18} /></a>}
                        {m.social.instagram && <a href={m.social.instagram} target="_blank" rel="noopener noreferrer" className="text-[#444] hover:text-white transition-colors"><Instagram size={18} /></a>}
                        {m.social.behance && <a href={m.social.behance} target="_blank" rel="noopener noreferrer" className="text-[#444] hover:text-white transition-colors"><Palette size={18} /></a>}
                        {/* @ts-ignore */}
                        {m.social.github && <a href={m.social.github} target="_blank" rel="noopener noreferrer" className="text-[#444] hover:text-white transition-colors"><Github size={18} /></a>}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Valores */}
            <section>
              <h2 className="font-syne font-bold text-2xl text-white mb-8 text-center">Nuestros valores</h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                {VALUES.map((v, i) => (
                  <div key={i} className="bg-[#141414] border border-[#2a2a2a] rounded-2xl p-6">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-4 bg-[#FF5C3A]/10 text-[#FF5C3A]">
                      {v.icon}
                    </div>
                    <p className="font-syne font-bold text-[15px] text-white mb-2">{v.title}</p>
                    <p className="text-[13px] text-[#777] leading-relaxed font-light">{v.desc}</p>
                  </div>
                ))}
              </div>
            </section>

            {/* Contacto Final */}
            <section className="bg-[#FF5C3A] rounded-[2.5rem] p-10 md:p-16 text-center relative overflow-hidden">
              <div className="relative z-10">
                <h2 className="font-syne font-bold text-3xl text-white mb-6">¿Quieres saber más?</h2>
                <p className="text-white/80 mb-8 max-w-lg mx-auto font-light">
                  Estamos aquí para ayudarte a escalar tu marca con la mejor tecnología de IA del mercado.
                </p>
                <div className="flex flex-col sm:flex-row justify-center gap-4">
                  <a href={`mailto:${support.email}`} className="bg-white text-[#FF5C3A] px-8 py-3 rounded-xl font-bold hover:scale-105 transition-all flex items-center justify-center gap-2">
                    <Mail size={18} /> Escríbenos
                  </a>
                  <a href={support.whatsapp} target="_blank" className="bg-[#0a0a0a] text-white px-8 py-3 rounded-xl font-bold hover:scale-105 transition-all flex items-center justify-center gap-2">
                    <Globe size={18} /> WhatsApp
                  </a>
                </div>
              </div>
            </section>

            <div className="text-center">
              <Link href="/" className="text-[13px] text-[#555] hover:text-[#FF5C3A] transition-colors">
                Volver al inicio
              </Link>
            </div>
          </div>
        </div>
      </main>
      <LandingFooter />
    </div>
  );
}
