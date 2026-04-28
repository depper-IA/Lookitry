'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import {
  Globe,
  Sparkles,
  MessageCircle,
  ArrowRight,
  CheckCircle2,
  XCircle,
  Palette,
  Zap,
  ShieldCheck,
  ChevronDown,
  Link as LinkIcon,
  Clock,
  Star,
  Users
} from 'lucide-react';
import { motion, useInView, Easing } from 'framer-motion';
import LandingNav from '@/components/landing/LandingNav';
import LandingFooter from '@/components/landing/LandingFooter';
import { formatPrice as formatPriceUtil } from '@/utils/currency';
import { useCurrency } from '@/hooks/useCurrency';

interface PricingConfig {
  features: string[];
  subtitulo: string;
  boton_texto: string;
  precio_unico_cop: number;
  precio_original_cop: number;
  descuento_porcentaje: number;
}

interface FeatureItem {
  icon: React.ReactNode;
  title: string;
  desc: string;
}

const EASING: [number, number, number, number] = [0.25, 0.1, 0.25, 1];

const PREMIUM_FONTS = `
  @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=DM+Sans:ital,opsz,wght@0,100..1000;1,100..1000&display=swap');
  .font-jakarta { font-family: 'Plus Jakarta Sans', sans-serif; }
  .font-dm-sans { font-family: 'DM Sans', sans-serif; }
`;

const SectionLabel = ({ text }: { text: string }) => (
  <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#FF5C3A]/10 border border-[#FF5C3A]/20 text-[#FF5C3A] text-[10px] font-bold uppercase tracking-widest mb-8 border transition-all">
    <div className="w-1 h-1 rounded-full bg-[#FF5C3A] animate-pulse" />
    {text}
  </div>
);

const FEATURES_HARDCODED: FeatureItem[] = [
  {
    icon: <Globe size={24} />,
    title: 'Página Pública Propia',
    desc: 'Tu catálogo visual y profesional en un enlace único (lookitry.com/tu-marca). Ponlo en tu bio de Instagram y deja de enviar fotos una por una.',
  },
  {
    icon: <Sparkles size={24} />,
    title: 'Probador IA Integrado',
    desc: 'El widget de prueba virtual está embebido directamente en tu página, sin redirecciones extrañas para tu cliente. Ven el producto, pruébatelo, compra.',
  },
  {
    icon: <MessageCircle size={24} />,
    title: 'WhatsApp Flotante',
    desc: 'Un botón de contacto siempre visible para que tus clientes cierren la compra directamente contigo con un solo clic, sin salir de la página.',
  },
  {
    icon: <Palette size={24} />,
    title: '3 Plantillas de Diseño',
    desc: 'Elige entre estilo Clásico, Editorial o Moderno desde tu panel. Cambia colores y logo cuando quieras, sin ayuda de nadie.',
  },
  {
    icon: <Zap size={24} />,
    title: 'Activación en 48h',
    desc: 'Pagas y en 48 horas tienes tu página activa. Sin esperas, sin procesos manuales y sin tocar una sola línea de código.',
  },
  {
    icon: <LinkIcon size={24} />,
    title: 'Un solo link para todo',
    desc: 'Compártelo en Instagram, WhatsApp, TikTok o tu bio. Todo tu negocio, un solo enlace profesional que nunca vence.',
  },
];

const PAINS = [
  'Responder mensajes a toda hora enviando las mismas fotos.',
  'Perder ventas porque el cliente duda de "cómo le quedará" la prenda.',
  'Perder horas intentando crear una página web complicada.',
];

const SOLUTIONS = [
  { bold: 'Todo en un solo link:', rest: 'Pon tu URL (lookitry.com/tu-marca) en tu bio de Instagram.' },
  { bold: 'Experiencia Premium:', rest: 'Tus clientes entran, ven tus productos estrella y se los prueban virtualmente al instante.' },
  { bold: 'Cierre de ventas rápido:', rest: 'Si les gusta cómo se ven, te contactan a un clic para comprar.' },
];

const STATS_DEFAULT = [
  { icon: <Users size={20} />, value: '2,500+', label: 'Tiendas activas' },
  { icon: <Star size={20} />, value: '4.8/5', label: 'Satisfacción' },
  { icon: <Clock size={20} />, value: '<48h', label: 'Tiempo de entrega' },
];

const FAQ = [
  {
    q: '¿Necesito saber programar?',
    a: 'No. Todo se configura desde tu panel con formularios simples. Pagas, entras al dashboard y en 48 horas tu página está publicada.',
  },
  {
    q: '¿Cuánto tiempo tarda la activación?',
    a: 'La entrega toma máximo 48 horas hábiles tras confirmar tu pago. No hay procesos manuales ni cola de espera.',
  },
  {
    q: '¿Puedo cambiar mi logo o diseño después?',
    a: '¡Sí! Puedes actualizar tu logo, colores, slogan e incluso tu número de WhatsApp cuando lo necesites desde tu dashboard.',
  },
  {
    q: '¿Qué pasa si cancelo mi plan mensual?',
    a: 'Si tu suscripción expira, la mini-landing se suspende temporalmente. Tras 90 días sin renovar, se elimina la configuración guardada.',
  },
  {
    q: '¿La mini-landing incluye el probador virtual IA?',
    a: 'Sí. El widget de IA está integrado directamente. Tus clientes pueden probarse la ropa sin salir de tu página, lo que reduce drásticamente las dudas antes de comprar.',
  },
];

// Hook para animaciones con scroll
function useScrollAnimation(threshold = 0.1) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, amount: threshold });
  return { ref, isInView };
}

// Animaciones base
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

export default function MiniLandingPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const { currency, setCurrency } = useCurrency();
  const [pricing, setPricing] = useState<PricingConfig | null>(null);
  const [stats, setStats] = useState(STATS_DEFAULT);
  const [loading, setLoading] = useState(true);
  const [trm, setTrm] = useState(3700);

  // Refs para animaciones scroll
  const heroRef = useRef<HTMLDivElement>(null);
  const problemRef = useRef<HTMLDivElement>(null);
  const featuresRef = useRef<HTMLDivElement>(null);
  const priceRef = useRef<HTMLDivElement>(null);
  const faqRef = useRef<HTMLDivElement>(null);

  const heroInView = useInView(heroRef, { once: true, amount: 0.2 });
  const problemInView = useInView(problemRef, { once: true, amount: 0.2 });
  const featuresInView = useInView(featuresRef, { once: true, amount: 0.1 });
  const priceInView = useInView(priceRef, { once: true, amount: 0.2 });
  const faqInView = useInView(faqRef, { once: true, amount: 0.1 });

  useEffect(() => {
    const handleCurrencyChange = () => {
      const saved = localStorage.getItem('currency') as 'COP' | 'USD' | null;
      if (saved === 'COP' || saved === 'USD') {
        setCurrency(saved);
      }
    };
    window.addEventListener('currencyChange', handleCurrencyChange);

    const apiUrl = process.env.NEXT_PUBLIC_API_URL || '';
    Promise.all([
      fetch(`${apiUrl}/api/pricing-config`).then(r => r.ok ? r.json() : null),
      fetch(`${apiUrl}/api/payment-settings/public`).then(r => r.ok ? r.json() : null),
      fetch(`${apiUrl}/api/brands/stats`).then(r => r.ok ? r.json() : null).catch(() => null),
    ]).then(([pricingData, settingsData, statsData]) => {
      if (pricingData?.data) {
        const row = pricingData.data.find((d: any) => d.id === 'mini_landing');
        if (row?.data) setPricing(row.data);
      }
      if (statsData) {
        setStats(prev => prev.map((stat, i) => {
          if (i === 0 && statsData.total_brands) return { ...stat, value: `${statsData.total_brands.toLocaleString()}+` };
          if (i === 2 && statsData.avg_delivery_hours) return { ...stat, value: `<${statsData.avg_delivery_hours}h` };
          return stat;
        }));
      }
      if (settingsData?.trm && Number(settingsData.trm) > 0) {
        setTrm(Number(settingsData.trm));
      }
      setLoading(false);
    }).catch(() => {
      setLoading(false);
    });

    return () => window.removeEventListener('currencyChange', handleCurrencyChange);
  }, [setCurrency]);

  const handleManualCurrencyChange = (c: 'COP' | 'USD') => {
    setCurrency(c);
  };

  const formatPrice = (cop: number) => formatPriceUtil(cop, currency, trm);

  const miniLandingPrice = pricing?.precio_unico_cop ?? 650000;
  const miniLandingOriginal = pricing?.precio_original_cop ?? 850000;
  const buttonText = pricing?.boton_texto ?? 'Quiero mi mini-landing';
  const discountPct = pricing?.descuento_porcentaje ?? 23;

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white font-dm-sans selection:bg-[#FF5C3A]/30 selection:text-white overflow-x-clip">
      <style dangerouslySetInnerHTML={{ __html: PREMIUM_FONTS }} />

      <LandingNav />

      <main className="pt-40 pb-20 px-6">
        <div className="max-w-7xl mx-auto">

          {/* ── 1. HERO ────────────────────────────────────────────────────────────── */}
          <motion.div
            ref={heroRef}
            initial="hidden"
            animate={heroInView ? 'visible' : 'hidden'}
            variants={staggerContainer}
            className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center mb-40"
          >
            <motion.div variants={fadeUp} className="relative">
              <SectionLabel text="Mini-Landing — Add-On" />
              <motion.h1
                variants={fadeUp}
                className="font-jakarta text-[44px] md:text-[60px] font-black leading-[1.1] tracking-tight mb-8"
              >
                Tu tienda online profesional,{' '}
                <span className="text-[#FF5C3A]">sin pagar un diseñador ni saber de código.</span>
              </motion.h1>
              <motion.p
                variants={fadeUp}
                className="text-lg text-white/60 mb-12 leading-relaxed max-w-xl font-dm-sans"
              >
                Deja de enviar fotos una por una por WhatsApp. Obtén un enlace único con tu catálogo, un botón de contacto directo y nuestro Probador Virtual con Inteligencia Artificial integrado. Listo para vender en minutos.
              </motion.p>

              <motion.div variants={fadeUp} className="flex flex-wrap gap-5">
                <Link
                  href="/checkout?plan=LANDING"
                  className="bg-[#FF5C3A] text-white px-10 py-5 rounded-2xl font-bold text-sm transition-all hover:scale-105 hover:shadow-2xl hover:shadow-[#FF5C3A]/30 flex items-center gap-3"
                >
                  {buttonText} <ArrowRight size={18} />
                </Link>
                <Link
                  href="/planes"
                  className="bg-[#1a1a1a] border border-white/10 text-white px-10 py-5 rounded-2xl font-bold text-sm transition-all hover:border-[#FF5C3A]/30 hover:bg-[#1a1a1a]/80 flex items-center gap-3"
                >
                  Ver planes base
                </Link>
              </motion.div>

              <motion.div variants={fadeUp} className="mt-10 flex flex-wrap items-center gap-6">
                <div className="flex items-center gap-2 text-white/40 text-xs font-bold uppercase tracking-widest">
                  <ShieldCheck size={14} className="text-[#FF5C3A]" />
                  Pago único de {formatPrice(miniLandingPrice)}
                </div>
                <div className="flex items-center gap-2 text-white/40 text-xs font-bold uppercase tracking-widest">
                  <Zap size={14} className="text-[#FF5C3A]" />
                  Entrega en menos de 48h
                </div>
              </motion.div>

              {/* Stats */}
              <motion.div variants={fadeUp} className="mt-10 grid grid-cols-3 gap-4 max-w-md">
                {stats.map((stat, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 20 }}
                    animate={heroInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
                    transition={{ delay: 0.5 + i * 0.1, duration: 0.5, ease: EASING }}
                    className="text-center"
                  >
                    <div className="flex items-center justify-center gap-1.5 text-[#FF5C3A] mb-1">
                      {stat.icon}
                      <span className="font-jakarta text-xl font-black">{stat.value}</span>
                    </div>
                    <span className="text-[10px] uppercase tracking-widest text-white/30 font-bold">{stat.label}</span>
                  </motion.div>
                ))}
              </motion.div>
            </motion.div>

            {/* Visual mockup */}
            <motion.div
              variants={fadeUp}
              className="relative"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={heroInView ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.95 }}
              transition={{ delay: 0.3, duration: 0.8, ease: EASING }}
            >
              <div className="absolute inset-0 bg-[#FF5C3A]/10 blur-[100px] rounded-full" />
              <motion.div
                className="relative bg-[#0f0f0f] rounded-[2.5rem] border border-white/5 p-2 shadow-2xl"
                whileHover={{ scale: 1.02 }}
                transition={{ duration: 0.3 }}
              >
                <div className="bg-[#141414] rounded-[2.2rem] p-6 md:p-10 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-[#FF5C3A]/10 blur-[80px] rounded-full translate-x-1/2 -translate-y-1/2" />
                  <div className="relative z-10">
                    <div className="flex items-center gap-3 mb-5 bg-black/50 rounded-xl px-4 py-2.5 border border-white/5">
                      <div className="w-2 h-2 rounded-full bg-[#FF5C3A] animate-pulse" />
                      <span className="text-[11px] font-mono text-white/50">lookitry.com/<span className="text-[#FF5C3A] font-bold">tu-marca</span></span>
                    </div>
                    <div className="bg-[#FF5C3A]/10 rounded-2xl p-5 mb-4 border border-[#FF5C3A]/20">
                      <div className="h-2 w-20 bg-[#FF5C3A]/60 rounded-full mb-3" />
                      <div className="h-5 w-40 bg-white rounded-full mb-2" />
                      <div className="h-2 w-28 bg-white/30 rounded-full mb-5" />
                      <div className="flex gap-2">
                        <div className="h-8 w-24 bg-[#FF5C3A] rounded-xl" />
                        <div className="h-8 w-20 bg-white/10 rounded-xl border border-white/10" />
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-3 mb-4">
                      {[0.9, 1, 0.7].map((op, i) => (
                        <motion.div
                          key={i}
                          className="rounded-xl aspect-[3/4] bg-white/5 border border-white/5 relative overflow-hidden"
                          style={{ opacity: op }}
                          whileHover={{ scale: 1.05 }}
                          transition={{ duration: 0.2 }}
                        >
                          <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/80 to-transparent p-2">
                            <div className="h-1.5 w-10 bg-white/60 rounded-full" />
                            <div className="h-1 w-6 bg-white/30 rounded-full mt-1" />
                          </div>
                          {i === 1 && <div className="absolute top-2 left-2 bg-[#FF5C3A] text-[7px] font-black text-white px-1.5 py-0.5 rounded-full uppercase">IA</div>}
                        </motion.div>
                      ))}
                    </div>
                    <motion.div
                      className="flex items-center gap-2 bg-[#25D366]/20 border border-[#25D366]/30 rounded-xl px-4 py-2.5 cursor-pointer transition-all hover:bg-[#25D366]/30"
                      whileHover={{ scale: 1.02 }}
                    >
                      <div className="w-5 h-5 rounded-full bg-[#25D366] flex items-center justify-center">
                        <MessageCircle size={10} className="text-white fill-white" />
                      </div>
                      <span className="text-[10px] text-white/70 font-bold">Contactar por WhatsApp</span>
                    </motion.div>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          </motion.div>

          {/* ── 2. PROBLEMA VS SOLUCIÓN ───────────────────────────────────────────── */}
          <motion.div
            ref={problemRef}
            initial="hidden"
            animate={problemInView ? 'visible' : 'hidden'}
            variants={staggerContainer}
            className="mb-40"
          >
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">

              {/* Dolor */}
              <motion.div
                variants={cardVariants}
                className="bg-[#141414] border border-white/5 rounded-[3rem] p-10 md:p-12 transition-all hover:border-white/10 hover:bg-[#161616]"
              >
                <h3 className="font-jakarta font-black text-2xl md:text-3xl text-white mb-8 leading-tight">
                  ¿Vendes por redes sociales?<br />
                  <span className="text-white/40">Sabemos lo agotador que es:</span>
                </h3>
                <div className="flex flex-col gap-5">
                  {PAINS.map((pain, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -20 }}
                      animate={problemInView ? { opacity: 1, x: 0 } : { opacity: 0, x: -20 }}
                      transition={{ delay: 0.2 + i * 0.1, duration: 0.5, ease: EASING }}
                      className="flex items-start gap-4"
                    >
                      <XCircle size={20} className="text-red-500/70 shrink-0 mt-0.5" />
                      <p className="text-white/60 font-dm-sans text-sm leading-relaxed">{pain}</p>
                    </motion.div>
                  ))}
                </div>
              </motion.div>

              {/* Solución */}
              <motion.div
                variants={cardVariants}
                className="bg-[#FF5C3A]/5 border border-[#FF5C3A]/20 rounded-[3rem] p-10 md:p-12 relative overflow-hidden transition-all hover:bg-[#FF5C3A]/8 hover:border-[#FF5C3A]/30"
              >
                <div className="absolute top-0 right-0 w-48 h-48 bg-[#FF5C3A]/15 blur-[60px] rounded-full translate-x-1/2 -translate-y-1/2" />
                <h3 className="relative z-10 font-jakarta font-black text-2xl md:text-3xl text-white mb-8 leading-tight">
                  Con la Mini-Landing de Lookitry,<br />
                  <span className="text-[#FF5C3A]">pasas al siguiente nivel:</span>
                </h3>
                <div className="relative z-10 flex flex-col gap-5">
                  {SOLUTIONS.map((s, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: 20 }}
                      animate={problemInView ? { opacity: 1, x: 0 } : { opacity: 0, x: 20 }}
                      transition={{ delay: 0.2 + i * 0.1, duration: 0.5, ease: EASING }}
                      className="flex items-start gap-4"
                    >
                      <CheckCircle2 size={20} className="text-[#FF5C3A] shrink-0 mt-0.5" />
                      <p className="text-white/80 font-dm-sans text-sm leading-relaxed">
                        <strong className="text-white">{s.bold}</strong> {s.rest}
                      </p>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            </div>
          </motion.div>

          {/* ── 3. CARACTERÍSTICAS ────────────────────────────────────────────────── */}
          <motion.div
            ref={featuresRef}
            initial="hidden"
            animate={featuresInView ? 'visible' : 'hidden'}
            variants={staggerContainer}
            className="mb-40"
          >
            <motion.div variants={fadeUp} className="text-center mb-16 flex flex-col items-center">
              <SectionLabel text="Todo incluido" />
              <h2 className="font-jakarta text-3xl md:text-5xl font-black mb-6 max-w-3xl leading-tight">
                Todo lo que necesitas para vender{' '}
                <span className="text-[#FF5C3A]">desde el primer día.</span>
              </h2>
              <p className="text-lg text-white/60 font-dm-sans max-w-2xl mx-auto">
                Una sola página que reúne catálogo, IA, contacto y analítica. Sin plugins. Sin configuraciones. Sin esperas.
              </p>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {FEATURES_HARDCODED.map((feat, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 30 }}
                  animate={featuresInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
                  transition={{ delay: idx * 0.1, duration: 0.6, ease: EASING }}
                  whileHover={{ y: -8, transition: { duration: 0.3 } }}
                  className="group p-8 rounded-[2.5rem] bg-[#141414] border border-white/5 hover:border-[#FF5C3A]/30 hover:bg-[#1a1a1a] transition-all duration-500 relative overflow-hidden cursor-pointer"
                >
                  <div className="absolute top-0 right-0 w-32 h-32 bg-[#FF5C3A]/5 blur-[50px] rounded-full translate-x-1/2 -translate-y-1/2 group-hover:bg-[#FF5C3A]/20 transition-all duration-500" />
                  <motion.div
                    className="w-14 h-14 rounded-2xl bg-[#FF5C3A]/10 flex items-center justify-center text-[#FF5C3A] mb-6 group-hover:scale-110 group-hover:bg-[#FF5C3A] group-hover:text-white transition-all duration-500 relative z-10"
                    whileHover={{ rotate: 90 }}
                    transition={{ duration: 0.3 }}
                  >
                    {feat.icon}
                  </motion.div>
                  <h4 className="font-jakarta font-bold text-xl text-white mb-4 relative z-10 group-hover:text-[#FF5C3A] transition-colors duration-300">{feat.title}</h4>
                  <p className="text-white/60 text-sm leading-relaxed font-dm-sans relative z-10 group-hover:text-white/80 transition-colors duration-300">{feat.desc}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* ── 4. PRECIO ─────────────────────────────────────────────────────────── */}
          <motion.div
            ref={priceRef}
            initial="hidden"
            animate={priceInView ? 'visible' : 'hidden'}
            variants={staggerContainer}
            className="mb-40"
          >
            <div className="rounded-[3.5rem] overflow-hidden relative">
              <div className="absolute inset-0 bg-gradient-to-br from-[#FF5C3A]/10 via-[#141414] to-[#0a0a0a]" />
              <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#FF5C3A] to-transparent" />

              <div className="relative z-10 grid grid-cols-1 lg:grid-cols-[1.2fr_1fr] gap-0">
                {/* Copy de precio */}
                <motion.div
                  variants={cardVariants}
                  className="p-12 md:p-16 lg:p-20 border-b border-white/5 lg:border-b-0 lg:border-r"
                >
                  <SectionLabel text="Un solo pago. Ventas para siempre." />
                  <h2 className="font-jakarta text-3xl md:text-5xl font-black text-white mb-6 leading-tight">
                    Llévate tu Mini-Landing personalizada.
                  </h2>
                  <p className="text-white/60 font-dm-sans text-lg leading-relaxed mb-10">
                    No te cobraremos una mensualidad adicional por el diseño ni el mantenimiento de esta página. Tu Mini-Landing se mantendrá activa siempre y cuando mantengas activa tu suscripción mensual (Plan Básico o Pro) de Lookitry.
                  </p>

                  <div className="flex flex-col sm:flex-row gap-4">
                    <Link
                      href="/checkout?plan=LANDING"
                      className="bg-[#FF5C3A] text-white px-10 py-5 rounded-2xl font-bold text-sm transition-all hover:scale-105 hover:shadow-2xl hover:shadow-[#FF5C3A]/30 flex items-center justify-center gap-3"
                    >
                      {buttonText} <ArrowRight size={18} />
                    </Link>
                  </div>

                  <p className="mt-6 text-white/20 text-xs uppercase tracking-widest font-bold">
                    Requiere plan BASIC o PRO activo
                  </p>
                </motion.div>

                {/* Badge de precio */}
                <motion.div
                  variants={cardVariants}
                  className="p-12 md:p-16 lg:p-20 flex flex-col justify-center items-center text-center"
                >
                  <motion.div
                    initial={{ scale: 0.9 }}
                    animate={priceInView ? { scale: 1 } : { scale: 0.9 }}
                    transition={{ delay: 0.3, duration: 0.5, ease: EASING }}
                    className="text-[11px] text-white/40 uppercase tracking-widest font-bold mb-3"
                  >
                    {discountPct}% descuento de lanzamiento
                  </motion.div>
                  <div className="flex items-end gap-3 mb-2">
                    <motion.span
                      className="font-jakarta text-6xl font-black text-white tracking-tight"
                      initial={{ opacity: 0, y: 20 }}
                      animate={priceInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
                      transition={{ delay: 0.4, duration: 0.6, ease: EASING }}
                    >
                      {loading ? '---' : formatPrice(miniLandingPrice)}
                    </motion.span>
                  </div>
                  <motion.div
                    className="text-white/30 font-dm-sans text-base line-through mb-6"
                    initial={{ opacity: 0 }}
                    animate={priceInView ? { opacity: 1 } : { opacity: 0 }}
                    transition={{ delay: 0.5, duration: 0.5 }}
                  >
                    Precio regular: {loading ? '---' : formatPrice(miniLandingOriginal)}
                  </motion.div>

                  <div className="w-full space-y-3 mt-4">
                    {(pricing?.features || ['Pago único, sin mensualidad adicional', 'Activación en 48 horas', 'Soporte incluido', '3 plantillas elegibles']).map((item, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, x: 20 }}
                        animate={priceInView ? { opacity: 1, x: 0 } : { opacity: 0, x: 20 }}
                        transition={{ delay: 0.6 + i * 0.1, duration: 0.5, ease: EASING }}
                        className="flex items-center gap-3 text-sm text-white/70"
                      >
                        <CheckCircle2 size={16} className="text-[#FF5C3A] shrink-0" />
                        {item}
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              </div>
            </div>
          </motion.div>

          {/* ── 5. FAQ ────────────────────────────────────────────────────────────── */}
          <motion.div
            ref={faqRef}
            initial="hidden"
            animate={faqInView ? 'visible' : 'hidden'}
            variants={staggerContainer}
            className="mb-20"
          >
            <motion.div variants={fadeUp} className="text-center mb-16 flex flex-col items-center">
              <SectionLabel text="Preguntas Frecuentes" />
              <h2 className="font-jakarta text-3xl md:text-4xl font-black mb-4 max-w-2xl leading-tight">
                Todo lo que quieres saber antes de activar tu{' '}
                <span className="text-[#FF5C3A]">mini-landing.</span>
              </h2>
            </motion.div>

            <div className="max-w-3xl mx-auto space-y-4">
              {FAQ.map((item, idx) => {
                const open = openFaq === idx;
                return (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, y: 20 }}
                    animate={faqInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
                    transition={{ delay: idx * 0.1, duration: 0.5, ease: EASING }}
                    className={`rounded-[2rem] border transition-all duration-300 overflow-hidden ${open ? 'border-[#FF5C3A]/30 bg-[#1a1a1a]' : 'border-white/5 bg-[#141414] hover:border-white/10 hover:bg-[#161616]'}`}
                  >
                    <motion.button
                      onClick={() => setOpenFaq(open ? null : idx)}
                      className="w-full flex items-center justify-between px-8 py-6 text-left"
                      whileHover={{ x: 4 }}
                      transition={{ duration: 0.2 }}
                    >
                      <span className="font-jakarta font-bold text-[17px] text-white pr-4">{item.q}</span>
                      <motion.div
                        animate={{ rotate: open ? 180 : 0 }}
                        transition={{ duration: 0.3 }}
                      >
                        <ChevronDown
                          size={20}
                          className={`shrink-0 transition-colors duration-300 ${open ? 'text-[#FF5C3A]' : 'text-white/40'}`}
                        />
                      </motion.div>
                    </motion.button>
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: open ? 'auto' : 0, opacity: open ? 1 : 0 }}
                      transition={{ duration: 0.4, ease: EASING }}
                      className="overflow-hidden"
                    >
                      <p className="font-dm-sans text-white/60 leading-relaxed text-[15px] font-light px-8 pb-6">{item.a}</p>
                    </motion.div>
                  </motion.div>
                );
              })}
            </div>

            {/* CTA final */}
            <motion.div
              variants={fadeUp}
              className="mt-16 text-center"
            >
              <Link
                href="/checkout?plan=LANDING"
                className="inline-flex items-center gap-3 bg-[#FF5C3A] text-white px-12 py-6 rounded-[2rem] font-bold text-lg hover:scale-105 hover:shadow-2xl hover:shadow-[#FF5C3A]/30 active:scale-95 transition-all"
              >
                {buttonText} <ArrowRight size={22} />
              </Link>
              <motion.p
                initial={{ opacity: 0 }}
                animate={faqInView ? { opacity: 1 } : { opacity: 0 }}
                transition={{ delay: 0.5, duration: 0.5 }}
                className="mt-5 text-white/20 text-xs uppercase tracking-widest font-bold"
              >
                Pago único {loading ? '---' : formatPrice(miniLandingPrice)} · Sin mensualidad adicional
              </motion.p>
            </motion.div>
          </motion.div>

        </div>
      </main>

      <LandingFooter />
    </div>
  );
}
