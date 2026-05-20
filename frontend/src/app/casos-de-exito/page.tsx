'use client';

import React, { useEffect, useRef } from 'react';
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
import { motion, useInView, Easing } from 'framer-motion';
import LandingNav from '@/components/landing/LandingNav';
import LandingFooter from '@/components/landing/LandingFooter';
import { useCurrency } from '@/hooks/useCurrency';

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

const CASES = [
  {
    brand: 'Nómada Urban',
    category: 'Streatwear Ropa Urbana',
    result: '+42%',
    kpi: 'Conversión',
    desc: 'Los usuarios de Nómada Urban tenían una gran tasa de rebote por incertidumbre sobre cómo quedaría el fit oversizado de las prendas. Incorporar Lookitry resolvió esa duda en segundos, transformando sesiones inactivas en ventas directas.',
    icon: <TrendingUp className="text-[#FF5C3A]" size={20} />
  },
  {
    brand: 'Aura Boutique',
    category: 'Moda y Alta Costura',
    result: '-28%',
    kpi: 'Devoluciones',
    desc: 'El gran volumen de devoluciones por "no se me ve como a la modelo" generaba estrés logístico a Aura. Al brindar contexto realista con IA Generativa, Lookitry logró que los clientes sepan exactamente cómo caerá el vestido oscuro.',
    icon: <RefreshCcw className="text-[#FF5C3A]" size={20} />
  },
  {
    brand: 'Vigor Active',
    category: 'Fitness & Deportiva',
    result: 'x3.4',
    kpi: 'Retención',
    desc: 'Vigor Active incorporó nuestro widget en su página de productos. Sus clientes pasaron de un scrolleo rápido a jugar probándose múltiples combinaciones deportivas. El resultado es un aumento drástico en retención y engagement.',
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

const STATS_MOCKUP = [
  { label: 'Aumento en Conversión', value: '+45%', icon: <TrendingUp size={24} /> },
  { label: 'Aumento en Retención', value: 'x3.4', icon: <Crosshair size={24} /> },
  { label: 'Reducción Devoluciones', value: '-30%', icon: <RefreshCcw size={24} /> },
];

export default function CasosDeUsoPage() {
  const { setCurrency } = useCurrency();

  // Refs for scroll animations
  const heroRef = useRef<HTMLDivElement>(null);
  const visualRef = useRef<HTMLDivElement>(null);
  const casesRef = useRef<HTMLDivElement>(null);
  const whatYouGetRef = useRef<HTMLDivElement>(null);
  const ctaRef = useRef<HTMLDivElement>(null);

  const heroInView = useInView(heroRef, { once: true, amount: 0.2 });
  const visualInView = useInView(visualRef, { once: true, amount: 0.2 });
  const casesInView = useInView(casesRef, { once: true, amount: 0.1 });
  const whatYouGetInView = useInView(whatYouGetRef, { once: true, amount: 0.2 });
  const ctaInView = useInView(ctaRef, { once: true, amount: 0.3 });

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
    <div className="min-h-screen bg-[#0a0a0a] text-white font-dm-sans selection:bg-[#FF5C3A]/30 selection:text-[#FF5C3A] overflow-x-clip">
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
              <SectionLabel text="Aplicaciones Reales" />
              <motion.h1 variants={fadeUp} className="font-jakarta text-[48px] md:text-[64px] font-black leading-[1.1] tracking-tight mb-8">
                 Convierte tu catálogo <br />
                 en una <span className="text-[#FF5C3A]">experiencia que vende.</span>
              </motion.h1>
              <motion.p variants={fadeUp} className="text-lg text-white/60 mb-12 leading-relaxed max-w-xl font-dm-sans">
                 Lookitry hace que tus productos se entiendan más rápido, se vean más deseables y generen más intención de compra desde el primer vistazo. Integra el probador virtual en tu tienda en 10 minutos. Sin apps, sin desarrollo.
              </motion.p>
              
              <motion.div variants={fadeUp} className="flex flex-wrap gap-5">
                <Link 
                  href="/checkout" 
                  className="bg-[#FF5C3A] text-white px-10 py-5 rounded-2xl font-bold text-sm transition-all hover:scale-105 hover:shadow-2xl hover:shadow-[#FF5C3A]/30 flex items-center gap-3"
                >
                  Quiero usar Lookitry <ArrowRight size={18} />
                </Link>
                <Link 
                  href="/trial-checkout" 
                  className="bg-[#1a1a1a] border border-white/10 text-white px-10 py-5 rounded-2xl font-bold text-sm transition-all hover:border-[#FF5C3A]/30 hover:bg-[#1a1a1a]/80 flex items-center gap-3"
                >
                  Empezar con mi marca
                </Link>
              </motion.div>
            </motion.div>

            {/* Stats Mockup */}
            <motion.div
              variants={fadeUp}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={heroInView ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.95 }}
              transition={{ delay: 0.3, duration: 0.8, ease: EASING }}
              className="bg-[#0f0f0f] rounded-[2.5rem] border border-white/5 p-1 md:p-2 shadow-2xl relative overflow-hidden group"
            >
               <div className="bg-[#1a1a1a] rounded-[2.2rem] p-6 lg:p-10 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-[#FF5C3A]/10 blur-[80px] rounded-full translate-x-1/2 -translate-y-1/2" />
                   
                   <div className="relative z-10 grid gap-6">
                       <motion.div 
                        className="bg-white/5 border border-white/5 rounded-3xl p-6 flex flex-col justify-between backdrop-blur-sm"
                        initial={{ opacity: 0, y: 20 }}
                        animate={heroInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
                        transition={{ delay: 0.4, duration: 0.5 }}
                        whileHover={{ scale: 1.02, borderColor: 'rgba(255,92,58,0.2)' }}
                       >
                         <TrendingUp size={32} className="text-[#FF5C3A] mb-4" />
                         <div>
                             <div className="text-4xl font-black font-jakarta mb-1 text-white">{STATS_MOCKUP[0].value}</div>
                             <div className="text-xs text-white/40 uppercase font-bold tracking-widest">{STATS_MOCKUP[0].label}</div>
                         </div>
                       </motion.div>
                       
                       <div className="grid grid-cols-2 gap-6">
                         {STATS_MOCKUP.slice(1).map((stat, i) => (
                           <motion.div
                             key={i}
                             initial={{ opacity: 0, y: 20 }}
                             animate={heroInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
                             transition={{ delay: 0.5 + i * 0.1, duration: 0.5 }}
                             whileHover={{ scale: 1.03 }}
                             className="bg-white/5 border border-white/5 rounded-3xl p-6 flex flex-col justify-between backdrop-blur-sm cursor-pointer hover:border-[#FF5C3A]/20"
                           >
                             <div className="text-[#FF5C3A] mb-4">{stat.icon}</div>
                             <div>
                               <div className="text-2xl font-black font-jakarta mb-1 text-white">{stat.value}</div>
                               <div className="text-[10px] text-white/40 uppercase font-bold tracking-widest">{stat.label}</div>
                             </div>
                           </motion.div>
                         ))}
                       </div>
                   </div>
                </div>
            </motion.div>
          </motion.div>

          {/* 2. Visual Proof Section */}
          <motion.div
            ref={visualRef}
            initial="hidden"
            animate={visualInView ? 'visible' : 'hidden'}
            variants={staggerContainer}
            className="mb-40"
          >
            <motion.div variants={fadeUp} className="text-center mb-16 flex flex-col items-center">
              <SectionLabel text="Prueba Visual Real" />
              <h2 className="font-jakarta text-3xl md:text-5xl font-black mb-6 max-w-3xl leading-tight">
                Haz visible el cambio.<br />Haz más <span className="text-[#FF5C3A]">fácil la compra.</span>
              </h2>
              <p className="text-lg text-white/60 font-dm-sans max-w-2xl mx-auto">
                Una comparación directa comunica mejor el valor del producto: foto original a un lado, resultado con Lookitry al otro.
                Menos fricción para entenderlo, más claridad para avanzar.
              </p>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
               {/* Antes */}
               <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={visualInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
                transition={{ delay: 0.2, duration: 0.6, ease: EASING }}
                whileHover={{ y: -8, transition: { duration: 0.3 } }}
                className="rounded-[2.5rem] bg-[#141414] border border-white/5 p-8 flex flex-col items-center text-center group hover:border-[#FF5C3A]/30 transition-all cursor-pointer"
               >
                   <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-6 group-hover:bg-[#FF5C3A]/10 transition-all">
                      <Image src="/logo.svg" alt="Lookitry" width={24} height={24} className="opacity-40 grayscale group-hover:grayscale-0 group-hover:opacity-100 transition-all" />
                   </div>
                   <h4 className="font-jakarta font-bold text-xl text-white mb-2">Paso 1: Foto Original</h4>
                   <p className="text-sm text-white/50 leading-relaxed group-hover:text-white/60 transition-colors">
                      El cliente ingresa a tu tienda y sube una foto real que se toma en segundos desde el probador.
                   </p>
                </motion.div>
                
                {/* Proceso */}
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  animate={visualInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
                  transition={{ delay: 0.3, duration: 0.6, ease: EASING }}
                  className="rounded-[2.5rem] bg-[#FF5C3A]/5 border border-[#FF5C3A]/20 p-8 flex flex-col items-center text-center relative overflow-hidden group"
                >
                   <div className="absolute inset-0 bg-gradient-to-br from-[#FF5C3A]/10 to-transparent pointer-events-none" />
                   <motion.div 
                    className="relative z-10 w-16 h-16 rounded-full bg-[#FF5C3A] flex items-center justify-center mb-6 shadow-xl shadow-[#FF5C3A]/30"
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                   >
                      <Zap size={24} className="text-white fill-white" />
                   </motion.div>
                   <h4 className="relative z-10 font-jakarta font-bold text-xl text-white mb-2">Motor IA Generativa</h4>
                   <p className="relative z-10 text-sm text-white/70 leading-relaxed">
                      Nuestro motor procesa de inmediato la prenda seleccionada para ajustarla al cuerpo del usuario.
                   </p>
                </motion.div>

                {/* Después */}
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  animate={visualInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
                  transition={{ delay: 0.4, duration: 0.6, ease: EASING }}
                  whileHover={{ y: -8, transition: { duration: 0.3 } }}
                  className="rounded-[2.5rem] bg-[#141414] border border-[#FF5C3A]/30 p-8 flex flex-col items-center text-center group shadow-[0_0_30px_rgba(255,92,58,0.1)] hover:shadow-[0_0_50px_rgba(255,92,58,0.2)] transition-all cursor-pointer"
                >
                   <div className="w-16 h-16 rounded-full bg-[#FF5C3A]/20 flex items-center justify-center mb-6">
                      <CheckCircle2 size={24} className="text-[#FF5C3A]" />
                   </div>
                   <h4 className="font-jakarta font-bold text-xl text-white mb-2">Paso 3: Resultado</h4>
                   <p className="text-sm text-white/50 leading-relaxed group-hover:text-white/60 transition-colors">
                      Magia pura. El usuario se ve luciendo la prenda en un entorno ultra realista, eliminando las dudas.
                   </p>
                </motion.div>
            </div>
          </motion.div>

          {/* 3. Cases Grid */}
          <motion.div
            ref={casesRef}
            initial="hidden"
            animate={casesInView ? 'visible' : 'hidden'}
            variants={staggerContainer}
            className="mb-40"
          >
            <motion.div variants={fadeUp} className="text-center mb-16 flex flex-col items-center">
              <SectionLabel text="Sector por Sector" />
              <h2 className="font-jakarta text-3xl md:text-5xl font-black mb-6 max-w-3xl leading-tight">
                Modelos probados en diversas industrias del <span className="text-[#FF5C3A]">Retail.</span>
              </h2>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
               {CASES.map((item, idx) => (
                 <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 30 }}
                  animate={casesInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
                  transition={{ delay: idx * 0.1, duration: 0.6, ease: EASING }}
                  whileHover={{ y: -8, transition: { duration: 0.3 } }}
                  className="group p-8 rounded-[2.5rem] bg-[#141414] border border-white/5 hover:border-[#FF5C3A]/30 hover:bg-[#1a1a1a] transition-all duration-500 relative overflow-hidden flex flex-col h-full cursor-pointer"
                >
                    <div className="absolute top-0 right-0 w-32 h-32 bg-[#FF5C3A]/5 blur-[50px] rounded-full translate-x-1/2 -translate-y-1/2 group-hover:bg-[#FF5C3A]/20 transition-all" />
                    
                    <div className="flex items-center gap-3 mb-6 relative z-10">
                       <motion.div 
                        className="w-12 h-12 rounded-2xl bg-[#FF5C3A]/10 flex items-center justify-center text-[#FF5C3A] group-hover:scale-110 group-hover:bg-[#FF5C3A] group-hover:text-white transition-all duration-500"
                        whileHover={{ rotate: 90 }}
                       >
                         {item.icon}
                       </motion.div>
                       <div>
                          <h4 className="font-jakarta font-bold text-xl text-white group-hover:text-[#FF5C3A] transition-colors">{item.brand}</h4>
                          <span className="text-[10px] text-[#FF5C3A] uppercase tracking-widest font-bold">{item.category}</span>
                       </div>
                    </div>

                    <p className="text-white/60 text-sm leading-relaxed font-dm-sans mb-8 flex-grow relative z-10 group-hover:text-white/80 transition-colors">
                      {item.desc}
                    </p>

                    <div className="pt-6 border-t border-white/10 flex justify-between items-end relative z-10">
                       <div>
                          <span className="text-[10px] uppercase font-bold tracking-widest text-white/40 block mb-1">{item.kpi}</span>
                          <span className="text-3xl font-black font-jakarta text-[#FF5C3A]">{item.result}</span>
                       </div>
                       <motion.div
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.95 }}
                       >
                         <Link href="/checkout?plan=PRO" className="w-10 h-10 rounded-full border border-white/10 flex items-center justify-center text-white/50 hover:bg-[#FF5C3A] hover:text-white hover:border-[#FF5C3A] transition-all">
                            <ArrowRight size={16} />
                         </Link>
                       </motion.div>
                    </div>
                  </motion.div>
               ))}
            </div>
          </motion.div>

          {/* 4. What You Actually Buy */}
          <motion.div
            ref={whatYouGetRef}
            initial="hidden"
            animate={whatYouGetInView ? 'visible' : 'hidden'}
            variants={staggerContainer}
            className="mb-40 grid grid-cols-1 gap-12 lg:grid-cols-[1fr_1fr] items-center"
          >
             <motion.div variants={fadeUp} className="relative group">
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

                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Link href="/checkout" className="bg-white text-black px-8 py-4 rounded-2xl font-bold text-sm text-center transition-all hover:bg-white/90 w-fit inline-flex items-center gap-2">
                       Ver planes disponibles <ArrowRight size={16} />
                    </Link>
                  </motion.div>
                </div>
              </motion.div>

              <div className="space-y-6">
                 {SALES_BLOCKS.map((item, idx) => (
                   <motion.div
                    key={idx}
                    initial={{ opacity: 0, x: 30 }}
                    animate={whatYouGetInView ? { opacity: 1, x: 0 } : { opacity: 0, x: 30 }}
                    transition={{ delay: 0.2 + idx * 0.1, duration: 0.5, ease: EASING }}
                    whileHover={{ x: 8, transition: { duration: 0.2 } }}
                    className="bg-[#141414] border border-white/5 rounded-[2rem] p-8 flex gap-6 group hover:border-[#FF5C3A]/30 transition-all duration-300 cursor-pointer"
                   >
                      <motion.div 
                       className="shrink-0 w-12 h-12 rounded-full bg-[#FF5C3A]/10 flex items-center justify-center group-hover:scale-110 group-hover:bg-[#FF5C3A] group-hover:text-white transition-all duration-300"
                       whileHover={{ rotate: 90 }}
                      >
                         {item.icon}
                      </motion.div>
                      <div>
                         <span className="text-[10px] font-bold uppercase tracking-widest text-[#FF5C3A] mb-2 block">{item.eyebrow}</span>
                         <h4 className="text-xl font-bold font-jakarta text-white mb-3 group-hover:text-[#FF5C3A] transition-colors">{item.title}</h4>
                         <p className="text-white/60 text-sm font-dm-sans leading-relaxed group-hover:text-white/80 transition-colors">{item.body}</p>
                      </div>
                   </motion.div>
                 ))}
              </div>
          </motion.div>
          
          {/* 5. CTA Final */}
          <motion.div
            ref={ctaRef}
            initial="hidden"
            animate={ctaInView ? 'visible' : 'hidden'}
            variants={staggerContainer}
            className="bg-[#111] rounded-[4rem] p-12 md:p-24 text-center mb-20 relative overflow-hidden group shadow-[0_50px_100px_rgba(255,255,255,0.02)] border border-white/10"
          >
             <div className="absolute inset-0 bg-gradient-to-t from-[#FF5C3A]/10 to-transparent opacity-60 pointer-events-none" />
              
              <div className="relative z-10 max-w-3xl mx-auto">
                 <SectionLabel text="Pensado para crecer" />
                 <motion.h2 variants={fadeUp} className="font-jakarta text-4xl md:text-5xl lg:text-6xl font-black text-white mb-8 tracking-tighter">
                    Empieza con el paquete que mejor se ajuste <br className="hidden md:block" /> a tu etapa.
                 </motion.h2>
                 <motion.p variants={fadeUp} className="text-white/50 text-lg md:text-xl mb-12 font-dm-sans leading-relaxed">
                   Para marcas que quieren validar rápido y para tiendas que buscan una experiencia más premium. Activa tu marca, muestra tu catálogo y convierte visitas en decisiones.
                 </motion.p>

                 <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={ctaInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
                  transition={{ delay: 0.4, duration: 0.5 }}
                 >
                   <Link 
                    href="/planes" 
                    className="bg-[#FF5C3A] text-white px-10 py-5 rounded-[2rem] font-bold text-lg hover:scale-105 hover:shadow-2xl hover:shadow-[#FF5C3A]/30 active:scale-95 transition-all shadow-xl shadow-[#FF5C3A]/20 flex items-center justify-center gap-3 inline-flex"
                   >
                      Explorar Planes Válidos <ArrowRight size={20} />
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
