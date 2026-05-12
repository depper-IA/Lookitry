'use client';

import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { useState, useEffect, useRef } from 'react';
import LandingNav from '@/components/landing/LandingNav';
import LandingFooter from '@/components/landing/LandingFooter';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { motion, useInView, Easing } from 'framer-motion';
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
import { useCurrency } from '@/hooks/useCurrency';

const EASING: [number, number, number, number] = [0.25, 0.1, 0.25, 1];

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
      behance: 'https://www.behance.net/ummell',
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
  const { setCurrency } = useCurrency();
  const [support, setSupport] = useState({ whatsapp: 'https://wa.me/573105436281', email: 'info@lookitry.com' });

  // Refs for scroll animations
  const headerRef = useRef<HTMLDivElement>(null);
  const historyRef = useRef<HTMLDivElement>(null);
  const missionRef = useRef<HTMLDivElement>(null);
  const teamRef = useRef<HTMLDivElement>(null);
  const valuesRef = useRef<HTMLDivElement>(null);
  const contactRef = useRef<HTMLDivElement>(null);

  const headerInView = useInView(headerRef, { once: true, amount: 0.2 });
  const historyInView = useInView(historyRef, { once: true, amount: 0.2 });
  const missionInView = useInView(missionRef, { once: true, amount: 0.2 });
  const teamInView = useInView(teamRef, { once: true, amount: 0.1 });
  const valuesInView = useInView(valuesRef, { once: true, amount: 0.1 });
  const contactInView = useInView(contactRef, { once: true, amount: 0.3 });

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
        <motion.div
          ref={headerRef}
          initial="hidden"
          animate={headerInView ? 'visible' : 'hidden'}
          variants={staggerContainer}
          className="px-6 md:px-8 py-14 md:py-24 relative overflow-hidden"
        >
          <div className="absolute top-0 left-0 w-full h-full opacity-[0.05] pointer-events-none" 
            style={{ backgroundImage: 'radial-gradient(#FF5C3A 1px, transparent 1px)', backgroundSize: '32px 32px' }} 
          />
          <div className="max-w-4xl mx-auto relative z-10">
            <motion.div variants={fadeUp}>
              <Breadcrumbs items={[{ label: 'Sobre Nosotros' }]} light className="mb-8" />
            </motion.div>
            <motion.p variants={fadeUp} className="text-[11px] font-medium tracking-[.2em] uppercase text-[#FF5C3A] mb-4">Quiénes somos</motion.p>
            <motion.h1 variants={fadeUp} className="font-syne font-extrabold text-4xl md:text-6xl text-white tracking-tight mb-6 leading-tight">
              Construimos el probador virtual<br />
              <span className="text-[#FF5C3A]">que Latam necesitaba</span>
            </motion.h1>
            <motion.p variants={fadeUp} className="text-[#999] text-lg md:text-xl leading-relaxed max-w-2xl font-light">
              Somos un equipo apasionado por Lookitry, obsesionados con hacer que la tecnología de IA sea práctica y aumente las ventas reales de las marcas en toda la región.
            </motion.p>
          </div>
        </motion.div>

        <div className="px-6 md:px-8 py-16">
          <div className="max-w-4xl mx-auto space-y-24">

            {/* Historia y Evolución */}
            <motion.section
              ref={historyRef}
              initial="hidden"
              animate={historyInView ? 'visible' : 'hidden'}
              variants={staggerContainer}
              className="relative"
            >
              <div className="space-y-6">
                <motion.h2 variants={fadeUp} className="font-syne font-bold text-2xl text-white">Nuestra Historia</motion.h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                  <motion.div variants={cardVariants} className="space-y-4">
                    <p className="text-[15px] text-[#999] leading-relaxed font-light">
                      <strong className="text-white font-medium">2024: La Concepción.</strong> Lookitry nació de la unión de dos visiones en WilkieDevs. Notamos que el 30% de las devoluciones en e-commerce ocurrían porque los clientes no podían visualizar las prendas en sí mismos. Iniciamos el entrenamiento de modelos de IA específicos para la fisionomía latina.
                    </p>
                    <p className="text-[15px] text-[#999] leading-relaxed font-light">
                      <strong className="text-white font-medium">2025: Refinamiento y Beta.</strong> Durante un año, trabajamos de la mano con 120 marcas pioneras en Colombia y Venezuela para perfeccionar el algoritmo. Logramos que el widget fuera tan ligero que se instalara en menos de 10 minutos.
                    </p>
                  </motion.div>
                  <motion.div variants={cardVariants} className="space-y-4">
                    <p className="text-[15px] text-[#999] leading-relaxed font-light">
                      <strong className="text-white font-medium">Marzo 2026: El Lanzamiento Oficial.</strong> Tras procesar más de <span className="text-[#FF5C3A] font-bold">18,000 generaciones mensuales</span> en nuestra fase final, estamos a días de abrir nuestras puertas al mercado global (finales de marzo / inicios de abril).
                    </p>
                    <p className="text-[15px] text-[#999] leading-relaxed font-light">
                      Con un equipo multicultural, Lookitry no es solo un software, es el nuevo estándar de confianza para el retail digital en Latinoamérica.
                    </p>
                  </motion.div>
                </div>
              </div>
            </motion.section>

            {/* Misión y Visión */}
            <motion.section
              ref={missionRef}
              initial="hidden"
              animate={missionInView ? 'visible' : 'hidden'}
              variants={staggerContainer}
              className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center"
            >
              <motion.div variants={cardVariants}>
                <h2 className="font-syne font-bold text-2xl text-white mb-4">Nuestra misión</h2>
                <p className="text-[15px] text-[#999] leading-relaxed mb-6 font-light">
                  Reducir la brecha entre el comercio físico y digital. En Lookitry, construimos el puente tecnológico que permite a las marcas latinas competir a nivel global usando Inteligencia Artificial.
                </p>
                <motion.div 
                  className="flex items-center gap-3 text-[#FF5C3A] font-bold text-sm"
                  whileHover={{ x: 8, transition: { duration: 0.2 } }}
                >
                  <CheckCircle2 size={18} />
                  <span>+120 marcas confían en nosotros</span>
                </motion.div>
              </motion.div>
              <motion.div 
                variants={cardVariants}
                whileHover={{ y: -5, transition: { duration: 0.2 } }}
                className="bg-[#141414] border border-[#2a2a2a] p-8 rounded-[2rem] hover:border-[#FF5C3A]/30 transition-all cursor-pointer"
              >
                <h2 className="font-syne font-bold text-2xl text-white mb-4">El impacto</h2>
                <p className="text-[15px] text-[#999] leading-relaxed font-light">
                  Entendimos que la IA no debía ser un lujo para pocos. Diseñamos un ecosistema que se integra en 10 minutos, permitiendo que cualquier emprendedor tenga un probador de nivel mundial en su tienda.
                </p>
              </motion.div>
            </motion.section>

            {/* Equipo */}
            <section id="equipo" ref={teamRef}>
              <motion.div variants={fadeUp} className="text-center mb-16">
                <p className="text-[#FF5C3A] text-xs font-bold tracking-[0.2em] uppercase mb-4">El Talento</p>
                <h2 className="font-syne font-bold text-3xl md:text-4xl text-white tracking-tight">
                  Mentes detrás del <span className="text-[#FF5C3A]">algoritmo</span>
                </h2>
              </motion.div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-3xl mx-auto">
                {TEAM.map((m, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 30 }}
                    animate={teamInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
                    transition={{ delay: i * 0.2, duration: 0.6, ease: EASING }}
                    whileHover={{ y: -8, transition: { duration: 0.3 } }}
                    className="bg-[#141414] border border-[#2a2a2a] rounded-[2rem] p-8 hover:border-[#FF5C3A]/30 transition-all group cursor-pointer"
                  >
                    <div className="flex flex-col items-center text-center">
                      <motion.div 
                        className="relative w-24 h-24 rounded-2xl overflow-hidden mb-6 bg-[#0a0a0a]"
                        whileHover={{ scale: 1.05, transition: { duration: 0.3 } }}
                      >
                        <Image src={m.img} alt={m.name} fill className="object-cover" />
                      </motion.div>
                      <h3 className="font-syne font-bold text-xl text-white mb-1 group-hover:text-[#FF5C3A] transition-colors">{m.name}</h3>
                      <p className="text-[#FF5C3A] font-bold text-[10px] uppercase tracking-widest mb-4">{m.role}</p>
                      <p className="text-[#777] leading-relaxed text-sm font-light mb-6 group-hover:text-[#999] transition-colors">{m.desc}</p>
                      <div className="flex gap-4">
                        {m.social.linkedin && (
                          <motion.a 
                            href={m.social.linkedin} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="text-[#444] hover:text-white transition-colors"
                            whileHover={{ scale: 1.2, y: -2 }}
                          >
                            <Linkedin size={18} />
                          </motion.a>
                        )}
                        {m.social.instagram && (
                          <motion.a 
                            href={m.social.instagram} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="text-[#444] hover:text-white transition-colors"
                            whileHover={{ scale: 1.2, y: -2 }}
                          >
                            <Instagram size={18} />
                          </motion.a>
                        )}
                        {m.social.behance && (
                          <motion.a 
                            href={m.social.behance} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="text-[#444] hover:text-white transition-colors"
                            whileHover={{ scale: 1.2, y: -2 }}
                          >
                            <IconBehance size={18} />
                          </motion.a>
                        )}
                        {m.social.github && (
                          <motion.a 
                            href={m.social.github} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="text-[#444] hover:text-white transition-colors"
                            whileHover={{ scale: 1.2, y: -2 }}
                          >
                            <Github size={18} />
                          </motion.a>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </section>

            {/* Valores */}
            <motion.section
              ref={valuesRef}
              initial="hidden"
              animate={valuesInView ? 'visible' : 'hidden'}
              variants={staggerContainer}
            >
              <motion.h2 variants={fadeUp} className="font-syne font-bold text-2xl text-white mb-8 text-center">Nuestros valores</motion.h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                {VALUES.map((v, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 30 }}
                    animate={valuesInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
                    transition={{ delay: i * 0.1, duration: 0.6, ease: EASING }}
                    whileHover={{ y: -8, transition: { duration: 0.3 } }}
                    className="bg-[#141414] border border-[#2a2a2a] rounded-2xl p-6 hover:border-[#FF5C3A]/30 transition-all cursor-pointer group"
                  >
                    <motion.div 
                      className="w-10 h-10 rounded-xl flex items-center justify-center mb-4 bg-[#FF5C3A]/10 text-[#FF5C3A] group-hover:bg-[#FF5C3A] group-hover:text-white transition-all duration-300"
                      whileHover={{ rotate: 90 }}
                    >
                      {v.icon}
                    </motion.div>
                    <p className="font-syne font-bold text-[15px] text-white mb-2 group-hover:text-[#FF5C3A] transition-colors">{v.title}</p>
                    <p className="text-[13px] text-[#777] leading-relaxed font-light group-hover:text-[#999] transition-colors">{v.desc}</p>
                  </motion.div>
                ))}
              </div>
            </motion.section>

            {/* Contacto Final */}
            <motion.section
              ref={contactRef}
              initial="hidden"
              animate={contactInView ? 'visible' : 'hidden'}
              variants={staggerContainer}
              className="bg-[#FF5C3A] rounded-[2.5rem] p-10 md:p-16 text-center relative overflow-hidden group"
            >
              <motion.div 
                className="relative z-10"
                initial={{ opacity: 0, y: 20 }}
                animate={contactInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
                transition={{ delay: 0.2, duration: 0.6 }}
              >
                <h2 className="font-syne font-bold text-3xl text-white mb-6">¿Quieres saber más?</h2>
                <p className="text-white/80 mb-8 max-w-lg mx-auto font-light">
                  Estamos aquí para ayudarte a escalar tu marca con la mejor tecnología de IA del mercado.
                </p>
                <div className="flex flex-col sm:flex-row justify-center gap-4">
                  <motion.a 
                    href={`mailto:${support.email}`} 
                    className="bg-white text-[#FF5C3A] px-8 py-3 rounded-xl font-bold hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-2"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Mail size={18} /> Escríbenos
                  </motion.a>
                  <motion.a 
                    href={support.whatsapp} 
                    target="_blank" 
                    className="bg-[#0a0a0a] text-white px-8 py-3 rounded-xl font-bold hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-2"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Globe size={18} /> WhatsApp
                  </motion.a>
                </div>
              </motion.div>
            </motion.section>

            <motion.div 
              className="text-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5, duration: 0.5 }}
            >
              <Link 
                href="/" 
                className="text-[13px] text-[#555] hover:text-[#FF5C3A] transition-colors inline-flex items-center gap-2"
              >
                Volver al inicio <ArrowRight size={14} />
              </Link>
            </motion.div>
          </div>
        </div>
      </main>
      <LandingFooter />
    </div>
  );
}

function ArrowRight({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 12h14" />
      <path d="m12 5 7 7-7 7" />
    </svg>
  );
}
