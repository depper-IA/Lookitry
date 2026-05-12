'use client';

import React, { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  ArrowRight,
  CheckCircle2,
  Cpu,
  Monitor,
  ShieldCheck,
  TrendingUp,
  XCircle,
  Zap,
  Eye,
  Sparkles,
  BarChart3,
  Shirt,
  Watch,
  Sparkle,
  Footprints,
  ImageIcon,
  Gauge,
} from 'lucide-react';
import { motion, useInView, Easing } from 'framer-motion';
import LandingNav from '@/components/landing/LandingNav';
import LandingFooter from '@/components/landing/LandingFooter';
import { useCurrency } from '@/hooks/useCurrency';
import { formatPrice as formatPriceUtil } from '@/utils/currency';

interface PricingPlan {
  monthly_price_cop: number;
  generations_limit: number;
  products_limit: number;
  price_cop?: number;
  original_price_cop?: number;
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

const benefitCards = [
  {
    title: 'Aumenta Conversiones',
    desc: 'Cuando los shoppers pueden ver como les quedara una prenda o accesorio antes de comprar, toman decisiones con mas confianza.',
    icon: <TrendingUp size={28} />,
  },
  {
    title: 'Reduce Devoluciones',
    desc: 'Elimina la incertidumbre de compra online. Clientes que pueden ver como les queda un producto tienen menos probabilidades de devolverlo.',
    icon: <ShieldCheck size={28} />,
  },
  {
    title: 'Potenciado por IA',
    desc: 'Nuestra tecnologia de inteligencia artificial de vanguardia fusiona productos con fotos de clientes creando visualizaciones realistas en segundos.',
    icon: <Sparkles size={28} />,
  },
];

const perfectForItems = [
  { icon: <Shirt size={24} />, title: 'Ropa y Fashion', desc: 'Permite a tus clientes visualizar como queda la ropa en ellos antes de comprar.' },
  { icon: <Footprints size={24} />, title: 'Calzado', desc: 'Ayuda a tus clientes a ver como lucira un zapato o tennis con su estilo personal.' },
  { icon: <Watch size={24} />, title: 'Accesorios', desc: 'Ideal para bolsos, cinturones, cascos, gorras y demas accesorios.' },
  { icon: <Sparkle size={24} />, title: 'Joyas y Complementos', desc: 'Perfecto para collares, pulseras, anillos, aretes y accesorios de lujo.' },
];

const featureCards = [
  {
    title: 'One-Click en Producto',
    desc: 'El probador se activa desde la ficha de producto y respeta el flujo nativo de WooCommerce. Sin interrupciones para tu cliente.',
    icon: <Zap size={24} />,
  },
  {
    title: 'Sin Registro para el Cliente',
    desc: 'El cliente final solo toca el boton, sube su foto y recibe el resultado. No necesita crear cuenta ni descargar nada.',
    icon: <Cpu size={24} />,
  },
  {
    title: 'Generacion con IA Precisa',
    desc: 'La inteligencia artificial de Lookitry crea una imagen realista de la prenda sobre la persona, mostrando exactamente como lucira.',
    icon: <ImageIcon size={24} />,
  },
  {
    title: 'Dashboard Completo',
    desc: 'Accede a todas las estadisticas de tu dashboard Lookitry: productos, generaciones, consumo, analytics y mas desde tu cuenta.',
    icon: <BarChart3 size={24} />,
  },
  {
    title: 'Integracion Directa',
    desc: 'Conecta tu tienda WooCommerce con Lookitry para gestionar productos, configuraciones y monitorear el rendimiento.',
    icon: <Gauge size={24} />,
  },
  {
    title: 'Telemetria de Soporte',
    desc: 'El plugin reporta errores y latencia para que el equipo de Lookitry pueda darte soporte tecnico efectivo.',
    icon: <ShieldCheck size={24} />,
  },
];

const technicalSpecs = [
  { label: 'PHP Version', value: '7.4 o superior' },
  { label: 'WordPress', value: '5.8 o superior' },
  { label: 'WooCommerce', value: '9.0 o superior' },
];

const problemPoints = [
  'El cliente no sabe como se vera la prenda en su cuerpo y pospone la compra.',
  'Mandarlo a una herramienta externa rompe el flujo y baja la intencion de compra.',
  'Las devoluciones por expectativa visual incorrecta erosionan margen y confianza.',
];

const solutionPoints = [
  {
    title: 'Boton directo en la ficha',
    desc: 'El CTA del probador aparece dentro de la pagina de producto, junto al flujo natural de compra.',
  },
  {
    title: 'Modal embebido sin salir de la tienda',
    desc: 'La experiencia se abre en overlay y mantiene al usuario en tu dominio, sin apps ni pasos innecesarios.',
  },
  {
    title: 'Sincronizacion y validacion operativa',
    desc: 'El plugin conecta catalogo, valida la tienda con tu cuenta de Lookitry y reporta telemetria para operacion real.',
  },
];

const faqs = [
  {
    q: '¿El cliente tiene que salir de mi tienda o crear una cuenta aparte?',
    a: 'No. La experiencia se abre en un modal dentro de la misma pagina de producto para que el recorrido siga ocurriendo en tu storefront.',
  },
  {
    q: '¿Tengo que mantener un catalogo separado para usar el plugin?',
    a: 'No deberias operar dos catalogos. El plugin toma tus productos de WooCommerce y te permite sincronizarlos con Lookitry desde la configuracion del conector.',
  },
  {
    q: '¿Esta incluido en el Plan Basico o Trial?',
    a: 'No. El plugin requiere un plan PRO o ENTERPRISE porque depende de activacion operativa, sincronizacion y uso productivo del motor de IA de Lookitry.',
  },
  {
    q: '¿Ralentizara la velocidad de mi producto?',
    a: 'No deberia impactar el performance principal de la ficha. La generacion corre en la infraestructura de Lookitry y la tienda solo inicializa el modal y la sesion segura.',
  },
];

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

export default function PluginWooCommercePage() {
  const { currency, setCurrency } = useCurrency();
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [pricing, setPricing] = useState<PricingPlan | null>(null);
  const [loading, setLoading] = useState(true);
  const [trm, setTrm] = useState(3700);

  // Refs for scroll animations
  const heroRef = useRef<HTMLDivElement>(null);
  const perfectForRef = useRef<HTMLDivElement>(null);
  const tryOnRef = useRef<HTMLDivElement>(null);
  const benefitsRef = useRef<HTMLDivElement>(null);
  const featuresRef = useRef<HTMLDivElement>(null);
  const problemRef = useRef<HTMLDivElement>(null);
  const pricingRef = useRef<HTMLDivElement>(null);
  const specsRef = useRef<HTMLDivElement>(null);
  const faqRef = useRef<HTMLDivElement>(null);

  const heroInView = useInView(heroRef, { once: true, amount: 0.2 });
  const perfectForInView = useInView(perfectForRef, { once: true, amount: 0.2 });
  const tryOnInView = useInView(tryOnRef, { once: true, amount: 0.2 });
  const benefitsInView = useInView(benefitsRef, { once: true, amount: 0.2 });
  const featuresInView = useInView(featuresRef, { once: true, amount: 0.1 });
  const problemInView = useInView(problemRef, { once: true, amount: 0.2 });
  const pricingInView = useInView(pricingRef, { once: true, amount: 0.2 });
  const specsInView = useInView(specsRef, { once: true, amount: 0.2 });
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
    ]).then(([pricingData, settingsData]) => {
      if (pricingData?.data) {
        const row = pricingData.data.find((d: any) => d.id === 'pro');
        if (row?.data) setPricing(row.data);
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

  const handleCurrencyChange = (nextCurrency: 'COP' | 'USD') => {
    setCurrency(nextCurrency);
  };

  const formatPrice = (cop: number) => formatPriceUtil(cop, currency, trm);

  const proPrice = pricing?.monthly_price_cop ?? 350000;
  const proGens = pricing?.generations_limit ?? 1200;
  const proProducts = pricing?.products_limit ?? 15;

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white font-dm-sans selection:bg-[#FF5C3A]/30 selection:text-white overflow-x-clip">
      <style dangerouslySetInnerHTML={{ __html: PREMIUM_FONTS }} />

      <LandingNav currency={currency} onCurrencyChange={handleCurrencyChange} />

      <main className="pt-32 pb-20 px-6">
        <div className="max-w-7xl mx-auto">

          {/* Hero Section */}
          <motion.div
            ref={heroRef}
            initial="hidden"
            animate={heroInView ? 'visible' : 'hidden'}
            variants={staggerContainer}
            className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center mb-40 mt-12"
          >
            <motion.div variants={fadeUp} className="relative z-10">
              <SectionLabel text="Plugin Oficial WooCommerce" />
              <motion.h1 variants={fadeUp} className="font-jakarta text-[48px] md:text-[64px] font-black leading-[1.1] tracking-tight mb-8">
                Activa el probador Lookitry en tu ficha de producto y deja que tu cliente{' '}
                <span className="text-[#FF5C3A]">pruebe antes de comprar.</span>
              </motion.h1>
              <motion.p variants={fadeUp} className="text-lg text-white/60 mb-12 leading-relaxed max-w-xl font-dm-sans">
                Lookitry se integra directamente con WooCommerce para mostrar un boton de visualizacion con IA dentro de cada
                producto. El cliente sube su foto, abre un modal sin salir de tu tienda y ve el resultado en una
                experiencia pensada para reducir friccion, dudas y devoluciones.
              </motion.p>

              <motion.div variants={fadeUp} className="flex flex-wrap gap-5">
                <Link
                  href="/checkout?plan=PRO"
                  className="bg-[#FF5C3A] text-white px-10 py-5 rounded-2xl font-bold text-sm transition-all hover:scale-105 hover:shadow-2xl hover:shadow-[#FF5C3A]/30 flex items-center gap-3 active:scale-95"
                >
                  Contratar Plan Pro y Descargar <ArrowRight size={18} />
                </Link>
              </motion.div>
            </motion.div>

            <motion.div
              variants={fadeUp}
              className="relative group"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={heroInView ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.95 }}
              transition={{ delay: 0.3, duration: 0.8, ease: EASING }}
            >
              <div className="absolute inset-0 bg-[#FF5C3A]/10 blur-[120px] rounded-full animate-pulse" />
              <motion.div
                className="relative rounded-[3rem] overflow-hidden border border-white/10 shadow-2xl bg-[#0a0a0a] aspect-[4/3] flex items-center justify-center p-8 group transition-all duration-700 hover:border-[#FF5C3A]/30"
                whileHover={{ scale: 1.02 }}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-[#FF5C3A]/5 to-transparent pointer-events-none" />
                <div className="w-full h-full relative flex flex-col">
                  <div className="flex items-center gap-2 p-4 bg-white/5 border-b border-white/5 rounded-t-2xl">
                    <div className="w-2.5 h-2.5 rounded-full bg-red-500/30" />
                    <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/30" />
                    <div className="w-2.5 h-2.5 rounded-full bg-green-500/30" />
                  </div>
                  <div className="flex-1 flex items-center justify-center relative bg-white/[0.02]">
                    <Monitor size={120} className="text-white/5" />
                    <div className="absolute inset-x-8 top-1/2 -translate-y-1/2 space-y-4">
                      <motion.div
                        className="p-6 rounded-3xl bg-[#0a0a0a]/80 border border-white/10 backdrop-blur-xl"
                        initial={{ x: -20 }}
                        animate={heroInView ? { x: 0 } : { x: -20 }}
                        transition={{ delay: 0.5, duration: 0.5 }}
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-xl bg-[#7f54b3]/20 flex items-center justify-center p-1">
                            <Image
                              src="/integrations/Woo_logo_color.svg"
                              alt="WooCommerce"
                              width={40}
                              height={24}
                              className="object-contain"
                            />
                          </div>
                          <div>
                            <div className="text-[10px] font-extrabold text-[#c4b5fd] uppercase tracking-widest">
                              Sincronizacion activa
                            </div>
                            <div className="text-sm font-bold text-white/90">Lookitry Plugin Oficial</div>
                          </div>
                        </div>
                      </motion.div>
                      <motion.div
                        className="p-6 rounded-3xl bg-[#0a0a0a]/80 border border-white/10 backdrop-blur-xl"
                        initial={{ x: 20 }}
                        animate={heroInView ? { x: 0 } : { x: 20 }}
                        transition={{ delay: 0.7, duration: 0.5 }}
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-xl bg-[#FF5C3A]/20 flex items-center justify-center text-[#FF5C3A]">
                            <TrendingUp size={20} />
                          </div>
                          <div>
                            <div className="text-[10px] font-extrabold text-[#FF5C3A] uppercase tracking-widest">
                              Experiencia embebida
                            </div>
                            <div className="text-sm font-bold text-white/90">Modal nativo en producto</div>
                          </div>
                        </div>
                      </motion.div>
                    </div>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          </motion.div>

          {/* Perfect For Section */}
          <motion.div
            ref={perfectForRef}
            initial="hidden"
            animate={perfectForInView ? 'visible' : 'hidden'}
            variants={staggerContainer}
            className="mb-40"
          >
            <motion.div variants={fadeUp} className="text-center mb-16">
              <SectionLabel text="Casos de Uso" />
              <h2 className="font-jakarta text-3xl md:text-5xl font-black mb-6">
                Ideal para tu <span className="text-[#FF5C3A]">industria.</span>
              </h2>
            </motion.div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {perfectForItems.map((item, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 30 }}
                  animate={perfectForInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
                  transition={{ delay: idx * 0.1, duration: 0.6, ease: EASING }}
                  whileHover={{ y: -8, transition: { duration: 0.3 } }}
                  className="p-8 rounded-[2.5rem] bg-white/5 border border-white/5 hover:bg-white/10 hover:border-[#FF5C3A]/30 transition-all group cursor-pointer"
                >
                  <motion.div
                    className="w-14 h-14 rounded-2xl bg-[#FF5C3A]/10 flex items-center justify-center text-[#FF5C3A] mb-6 group-hover:scale-110 group-hover:bg-[#FF5C3A] group-hover:text-white transition-all duration-300"
                    whileHover={{ rotate: 90 }}
                  >
                    {item.icon}
                  </motion.div>
                  <h4 className="font-jakarta font-bold text-lg mb-3 text-white/90 group-hover:text-[#FF5C3A] transition-colors">{item.title}</h4>
                  <p className="text-white/40 text-sm leading-relaxed group-hover:text-white/60 transition-colors">{item.desc}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Try Before You Buy with AI */}
          <motion.div
            ref={tryOnRef}
            initial="hidden"
            animate={tryOnInView ? 'visible' : 'hidden'}
            variants={staggerContainer}
            className="mb-40 bg-gradient-to-b from-[#FF5C3A]/5 to-transparent rounded-[4rem] p-12 md:p-20 border border-[#FF5C3A]/10"
          >
            <motion.div variants={fadeUp} className="text-center mb-16">
              <SectionLabel text="Probador IA" />
              <h2 className="font-jakarta text-3xl md:text-5xl font-black mb-6">
                Prueba antes de comprar con <span className="text-[#FF5C3A]">Inteligencia Artificial</span>
              </h2>
              <p className="text-white/60 text-lg max-w-3xl mx-auto leading-relaxed">
                Deja que tus clientes visualicen productos en su propio espacio o en ellos mismos. Sube una foto y ve como luce cualquier producto en la vida real antes de hacer una compra.
              </p>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                { icon: <Eye size={28} />, title: 'Simple para clientes', desc: 'Solo dale click al boton del probador Lookitry, sube una foto y ve resultados instantaneos. Sin apps que descargar ni cuentas que crear.' },
                { icon: <Monitor size={28} />, title: 'Funciona en fichas de producto', desc: 'Integrado perfectamente en tus paginas de producto WooCommerce con una interfaz modal elegante que combina con el diseno de tu tienda.' },
                { icon: <TrendingUp size={28} />, title: 'Incrementa confianza y reduce devoluciones', desc: 'Cuando los clientes pueden ver como les queda una prenda o accesorio antes de comprar, toman mejores decisiones y reducen las devoluciones.' },
              ].map((item, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 30 }}
                  animate={tryOnInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
                  transition={{ delay: 0.2 + idx * 0.1, duration: 0.6, ease: EASING }}
                  whileHover={{ y: -8, transition: { duration: 0.3 } }}
                  className="p-10 rounded-[2.5rem] bg-white/5 border border-white/5 text-center hover:bg-white/10 hover:border-[#FF5C3A]/30 transition-all cursor-pointer"
                >
                  <motion.div
                    className="w-16 h-16 rounded-full bg-[#FF5C3A]/10 flex items-center justify-center text-[#FF5C3A] mx-auto mb-6"
                    whileHover={{ scale: 1.1, backgroundColor: 'rgba(255, 92, 58, 0.2)' }}
                  >
                    {item.icon}
                  </motion.div>
                  <h4 className="font-jakarta font-bold text-xl mb-4 text-white/90">{item.title}</h4>
                  <p className="text-white/40 text-sm leading-relaxed">{item.desc}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Key Benefits */}
          <motion.div
            ref={benefitsRef}
            initial="hidden"
            animate={benefitsInView ? 'visible' : 'hidden'}
            variants={staggerContainer}
            className="mb-40"
          >
            <motion.div variants={fadeUp} className="text-center mb-16">
              <SectionLabel text="Beneficios Clave" />
              <h2 className="font-jakarta text-3xl md:text-5xl font-black">
                Lo que obtienes con <span className="text-[#FF5C3A]">Lookitry</span>
              </h2>
            </motion.div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {benefitCards.map((benefit, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 30 }}
                  animate={benefitsInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
                  transition={{ delay: 0.2 + idx * 0.1, duration: 0.6, ease: EASING }}
                  whileHover={{ y: -8, transition: { duration: 0.3 } }}
                  className="p-10 rounded-[2.5rem] bg-gradient-to-b from-[#FF5C3A]/10 to-transparent border border-[#FF5C3A]/20 hover:border-[#FF5C3A]/50 transition-all cursor-pointer"
                >
                  <motion.div
                    className="w-16 h-16 rounded-2xl bg-[#FF5C3A]/20 flex items-center justify-center text-[#FF5C3A] mb-8"
                    whileHover={{ rotate: 90, scale: 1.1 }}
                  >
                    {benefit.icon}
                  </motion.div>
                  <h4 className="font-jakarta font-bold text-2xl mb-4 text-white/90">{benefit.title}</h4>
                  <p className="text-white/50 text-sm leading-relaxed">{benefit.desc}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Features Grid */}
          <motion.div
            ref={featuresRef}
            initial="hidden"
            animate={featuresInView ? 'visible' : 'hidden'}
            variants={staggerContainer}
            className="mb-40"
          >
            <motion.div variants={fadeUp} className="text-center mb-16">
              <SectionLabel text="Features" />
              <h2 className="font-jakarta text-3xl md:text-5xl font-black mb-6">
                Caracteristicas <span className="text-[#FF5C3A]">principales.</span>
              </h2>
            </motion.div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {featureCards.map((feat, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 30 }}
                  animate={featuresInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
                  transition={{ delay: idx * 0.1, duration: 0.6, ease: EASING }}
                  whileHover={{ y: -8, transition: { duration: 0.3 } }}
                  className="p-8 rounded-[2.5rem] bg-white/5 border border-white/5 hover:bg-white/10 hover:border-[#FF5C3A]/30 transition-all flex flex-col h-full group cursor-pointer"
                >
                  <motion.div
                    className="w-14 h-14 rounded-2xl bg-[#FF5C3A]/10 flex items-center justify-center text-[#FF5C3A] mb-6 group-hover:scale-110 group-hover:bg-[#FF5C3A] group-hover:text-white transition-all duration-300"
                    whileHover={{ rotate: 90 }}
                  >
                    {feat.icon}
                  </motion.div>
                  <h4 className="font-jakarta font-bold text-xl mb-4 text-white/90 group-hover:text-[#FF5C3A] transition-colors">{feat.title}</h4>
                  <p className="text-white/40 text-sm leading-relaxed flex-1 group-hover:text-white/60 transition-colors">{feat.desc}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Problem/Solution */}
          <motion.div
            ref={problemRef}
            initial="hidden"
            animate={problemInView ? 'visible' : 'hidden'}
            variants={staggerContainer}
            className="mb-40"
          >
            <motion.div variants={fadeUp} className="text-center mb-20 flex flex-col items-center">
              <SectionLabel text="Productividad E-commerce" />
              <h2 className="font-jakarta text-3xl md:text-5xl font-black mb-6 max-w-3xl leading-tight">
                Escalar tu tienda es dificil cuando el cliente todavia no puede <span className="text-white/40 italic">verse comprando.</span>
              </h2>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch">
              <motion.div
                variants={cardVariants}
                className="p-10 md:p-14 rounded-[3.5rem] bg-white/5 border border-white/10 flex flex-col hover:bg-white/[0.08] hover:border-[#FF5C3A]/20 transition-all"
              >
                <h3 className="font-jakarta text-2xl font-bold mb-8 text-white/80">Lo que hoy frena la compra online:</h3>
                <div className="space-y-8 flex-1">
                  {problemPoints.map((text, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -20 }}
                      animate={problemInView ? { opacity: 1, x: 0 } : { opacity: 0, x: -20 }}
                      transition={{ delay: 0.2 + i * 0.1, duration: 0.5, ease: EASING }}
                      className="flex gap-4 group"
                    >
                      <XCircle className="text-red-500/40 shrink-0 mt-1 group-hover:scale-110 group-hover:text-red-500/60 transition-all" size={24} />
                      <p className="text-white/40 text-lg leading-relaxed group-hover:text-white/50 transition-colors">{text}</p>
                    </motion.div>
                  ))}
                </div>
              </motion.div>

              <motion.div
                variants={cardVariants}
                className="p-10 md:p-14 rounded-[3.5rem] bg-[#FF5C3A] border border-[#FF5C3A]/20 flex flex-col relative overflow-hidden group shadow-2xl shadow-[#FF5C3A]/20 hover:shadow-[#FF5C3A]/30 transition-all"
              >
                <div className="relative z-10 flex flex-col h-full">
                  <h3 className="font-jakarta text-2xl font-bold mb-8 text-white">Lo que resuelve Lookitry en WooCommerce:</h3>
                  <div className="space-y-8 flex-1">
                    {solutionPoints.map((item, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, x: 20 }}
                        animate={problemInView ? { opacity: 1, x: 0 } : { opacity: 0, x: 20 }}
                        transition={{ delay: 0.2 + i * 0.1, duration: 0.5, ease: EASING }}
                        className="flex gap-4 items-start group"
                      >
                        <CheckCircle2 className="text-white shrink-0 mt-1 group-hover:scale-110 transition-transform" size={24} />
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

          {/* Pricing */}
          <motion.div
            ref={pricingRef}
            initial="hidden"
            animate={pricingInView ? 'visible' : 'hidden'}
            variants={staggerContainer}
            className="bg-white rounded-[4rem] p-12 md:p-24 text-center mb-40 relative overflow-hidden group shadow-[0_50px_100px_rgba(255,255,255,0.05)] border border-white/10"
          >
            <div className="absolute inset-0 bg-[#FF5C3A]/5 opacity-50 pointer-events-none" />

            <div className="relative z-10 max-w-4xl mx-auto">
              <SectionLabel text="Potencia Premium" />
              <motion.h2 variants={fadeUp} className="font-jakarta text-4xl md:text-7xl font-black text-[#0a0a0a] mb-8 tracking-tighter">
                Convierte mejor sin agregar <br /> friccion al checkout.
              </motion.h2>
              <motion.p variants={fadeUp} className="text-[#0a0a0a]/60 text-lg md:text-xl mb-12 max-w-2xl mx-auto font-dm-sans leading-relaxed">
                El plugin de WooCommerce esta disenado para tiendas que necesitan una experiencia de visualizacion integrada,
                rapida y operable. Se incluye de forma exclusiva en nuestro <span className="font-bold text-[#FF5C3A]">Plan Pro</span>.
              </motion.p>

              <div className="flex flex-col md:flex-row items-center justify-center gap-12 mb-16">
                <motion.div
                  variants={fadeUp}
                  className="text-center"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={pricingInView ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.9 }}
                  transition={{ delay: 0.3, duration: 0.6 }}
                >
                  <div className="text-[#FF5C3A] text-6xl md:text-8xl font-black tracking-tighter mb-2 flex items-start gap-1 justify-center">
                    {loading ? '---' : formatPrice(proPrice)}
                  </div>
                  <div className="text-[#0a0a0a]/40 text-xs md:text-sm uppercase font-bold tracking-[0.2em]">Suscripcion mensual</div>
                </motion.div>
                <motion.div
                  variants={cardVariants}
                  className="flex flex-col gap-5 text-left p-10 bg-[#0a0a0a]/5 rounded-[2.5rem] border border-black/5 shadow-inner"
                >
                  {[
                    { value: proProducts, label: 'productos activos' },
                    { value: proGens.toLocaleString(), label: 'generaciones mensuales' },
                    { value: 'Plugin, sync y activacion oficial', label: '' },
                  ].map((item, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: 20 }}
                      animate={pricingInView ? { opacity: 1, x: 0 } : { opacity: 0, x: 20 }}
                      transition={{ delay: 0.4 + i * 0.1, duration: 0.5, ease: EASING }}
                      className="flex items-center gap-3 text-[#0a0a0a]/80 font-bold text-lg"
                    >
                      <CheckCircle2 size={22} className="text-green-600 shrink-0" />
                      {item.value} {item.label}
                    </motion.div>
                  ))}
                </motion.div>
              </div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={pricingInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
                transition={{ delay: 0.7, duration: 0.5 }}
              >
                <Link
                  href="/checkout?plan=PRO"
                  id="cta-pro-plugin"
                  className="bg-[#FF5C3A] text-white px-16 py-8 rounded-[2.5rem] font-bold text-xl hover:scale-105 hover:shadow-2xl hover:shadow-[#FF5C3A]/30 active:scale-95 transition-all shadow-2xl shadow-[#FF5C3A]/30 inline-flex items-center gap-4 group/cta"
                >
                  Contratar Plan Pro y Descargar Plugin <ArrowRight size={24} className="group-hover/cta:translate-x-2 transition-transform" />
                </Link>
              </motion.div>

              <motion.p
                initial={{ opacity: 0 }}
                animate={pricingInView ? { opacity: 1 } : { opacity: 0 }}
                transition={{ delay: 0.9, duration: 0.5 }}
                className="mt-10 text-[#0a0a0a]/40 text-sm font-medium"
              >
                Mas claridad para comprar. Menos friccion para instalar. Mejor base para escalar.
              </motion.p>
            </div>
          </motion.div>

          {/* Technical Specs */}
          <motion.div
            ref={specsRef}
            initial="hidden"
            animate={specsInView ? 'visible' : 'hidden'}
            variants={staggerContainer}
            className="mb-40 p-12 rounded-[3rem] bg-white/5 border border-white/10"
          >
            <motion.div variants={fadeUp} className="text-center mb-12">
              <SectionLabel text="Especificaciones Tecnicas" />
              <h2 className="font-jakarta text-2xl md:text-3xl font-black text-white/80">
                Requisitos del sistema
              </h2>
            </motion.div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
              {technicalSpecs.map((spec, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 20 }}
                  animate={specsInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
                  transition={{ delay: 0.2 + idx * 0.1, duration: 0.5, ease: EASING }}
                  whileHover={{ y: -5, transition: { duration: 0.2 } }}
                  className="text-center p-6 rounded-[1.5rem] bg-white/[0.02] hover:bg-white/[0.05] transition-all cursor-default"
                >
                  <div className="text-[#FF5C3A] text-xs font-bold uppercase tracking-widest mb-3">{spec.label}</div>
                  <div className="text-white/90 text-lg font-bold">{spec.value}</div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Final CTA */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.6, ease: EASING }}
            className="text-center mb-20"
          >
            <div className="inline-flex flex-col items-center p-12 rounded-[3.5rem] bg-gradient-to-b from-[#FF5C3A]/10 to-transparent border border-[#FF5C3A]/20 hover:border-[#FF5C3A]/40 transition-all">
              <h3 className="text-2xl font-bold font-jakarta mb-6">¿Listo para activar el probador en tu tienda?</h3>
              <Link
                href="/checkout?plan=PRO"
                className="flex items-center gap-3 text-white font-black text-xl hover:text-[#FF5C3A] transition-colors border-b-2 border-[#FF5C3A] pb-2 hover:scale-105 transition-transform"
              >
                Empieza tu Plan Pro hoy mismo <ArrowRight size={24} />
              </Link>
            </div>
          </motion.div>

          {/* FAQ */}
          <motion.div
            ref={faqRef}
            initial="hidden"
            animate={faqInView ? 'visible' : 'hidden'}
            variants={staggerContainer}
            className="max-w-4xl mx-auto mb-20"
          >
            <motion.div variants={fadeUp} className="text-center mb-16 flex flex-col items-center">
              <SectionLabel text="Preguntas del Plugin" />
              <h2 className="font-jakarta text-3xl md:text-5xl font-bold">
                Dudas <span className="text-[#FF5C3A]">Resueltas.</span>
              </h2>
            </motion.div>

            <div className="grid gap-6">
              {faqs.map((faq, i) => {
                const open = openFaq === i;
                return (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 20 }}
                    animate={faqInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
                    transition={{ delay: i * 0.1, duration: 0.5, ease: EASING }}
                    className={`rounded-3xl border transition-all duration-300 overflow-hidden cursor-pointer ${open ? 'border-[#FF5C3A]/30 bg-[#1a1a1a]' : 'border-white/5 bg-white/5 hover:border-white/10 hover:bg-white/10'}`}
                    onClick={() => setOpenFaq(open ? null : i)}
                  >
                    <motion.button
                      className="w-full flex items-center justify-between px-10 py-6 text-left"
                      whileHover={{ x: 4 }}
                      transition={{ duration: 0.2 }}
                    >
                      <span className="font-jakarta font-bold text-xl text-white/90 pr-4">{faq.q}</span>
                      <motion.div
                        animate={{ rotate: open ? 90 : 0 }}
                        transition={{ duration: 0.3 }}
                      >
                        <ArrowRight
                          size={20}
                          className={`transition-colors duration-300 ${open ? 'text-[#FF5C3A]' : 'text-[#FF5C3A]/50'}`}
                        />
                      </motion.div>
                    </motion.button>
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: open ? 'auto' : 0, opacity: open ? 1 : 0 }}
                      transition={{ duration: 0.4, ease: EASING }}
                      className="overflow-hidden"
                    >
                      <p className="text-white/50 leading-relaxed text-base px-10 pb-6">{faq.a}</p>
                    </motion.div>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>

        </div>
      </main>

      <LandingFooter />
    </div>
  );
}
