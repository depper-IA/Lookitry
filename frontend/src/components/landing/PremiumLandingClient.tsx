'use client';

import React, { useRef, useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';
import {
  Check,
  ArrowRight,
  Play,
  ShieldCheck,
  Zap,
  Store,
  MessageCircle,
  Mail,
  Phone,
  Instagram,
  Facebook,
  ChevronDown,
  Globe,
  CreditCard,
  Shirt,
  Layers,
  ArrowUpRight,
  TrendingUp,
  Clock,
  Sparkles,
  Box,
  Download,
  Layout,
  LayoutGrid,
  Camera,
  RefreshCw,
  Settings
} from 'lucide-react';

import { LandingNav } from './LandingNav';
import { LandingFooter } from './LandingFooter';
import { PricingConfig } from '@/lib/pricing';

// Registrar plugins de GSAP
if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

const PREMIUM_FONTS = `
  @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=DM+Sans:ital,opsz,wght@0,9..40,100..1000;1,9..40,100..1000&display=swap');
  
  .font-jakarta { font-family: 'Plus Jakarta Sans', sans-serif; }
  .font-dm-sans { font-family: 'DM Sans', sans-serif; }
`;

const STEPS = [
  {
    n: '01',
    title: 'Sube tu foto',
    desc: 'El cliente toma una selfie o sube una imagen desde su celular o computador.',
    img: '/steps/paso-1.webp',
    alt: 'Cliente subiendo una selfie al probador virtual',
    pos: 'object-top'
  },
  {
    n: '02',
    title: 'Elige el producto',
    desc: 'Selecciona la prenda, accesorio o calzado del catálogo de tu marca.',
    img: '/steps/paso-2.webp',
    alt: 'Selección de producto en el catálogo del probador virtual',
    pos: 'object-center'
  },
  {
    n: '03',
    title: 'Ve el resultado',
    desc: 'Nuestra tecnología de IA genera una imagen realista del producto puesto en tiempo real.',
    img: '/steps/paso-3.webp',
    alt: 'Resultado generado por IA del probador virtual de ropa',
    pos: 'object-top'
  },
];

const FAQ_TABS = [
  {
    id: 'probador',
    label: 'Probador IA',
    icon: <Shirt size={16} />,
    items: [
      { q: '¿Cómo funciona el probador virtual?', a: 'El cliente sube una foto suya (selfie o foto de cuerpo completo), selecciona el producto que quiere probar y la IA genera en segundos una imagen realista mostrando cómo le quedaría la prenda o accesorio.' },
      { q: '¿Qué tipos de productos soporta el probador?', a: 'Ropa (camisas, vestidos, pantalones, chaquetas), accesorios (bolsos, cinturones, sombreros) y calzado. La calidad del resultado depende de la claridad de la foto del producto.' },
      { q: '¿Cómo integro el probador en mi tienda o web?', a: 'Tienes dos opciones: usar tu mini-landing (sin código) o copiar el widget embebible desde tu dashboard y pegarlo en tu sitio web. Funciona en Shopify, WordPress, Wix, etc.' },
      { q: '¿Mis clientes necesitan crear una cuenta?', a: 'No. El probador es completamente público. Tus clientes solo necesitan subir una foto y elegir el producto. Sin registro, sin apps, sin fricción.' },
      { q: '¿Las fotos de mis clientes se almacenan?', a: 'Las selfies se procesan de forma temporal y se eliminan automáticamente después de generar el resultado. No almacenamos imágenes de los clientes permanentemente.' },
      { q: '¿Cuántos productos puedo tener?', a: 'El Plan Básico permite hasta 5 productos activos. El Plan Pro permite hasta 15 productos. Puedes editarlos desde tu dashboard en cualquier momento.' },
    ]
  },
  {
    id: 'mini-landing',
    label: 'Mini-Landing',
    icon: <Store size={16} />,
    items: [
      { q: '¿Qué es la mini-landing y para qué sirve?', a: 'Es una página pública profesional en lookitry.com/tu-marca. Incluye tu catálogo con probador virtual integrado, botón de WhatsApp flotante y hasta 3 templates de diseño. Ideal para compartir en redes o bio de Instagram.' },
      { q: '¿Cuánto cuesta y cuánto tarda en activarse?', a: 'Es un pago único y no tiene mensualidad adicional. La activación es inmediata: en minutos después de confirmar el pago, tu página ya está disponible.' },
      { q: '¿Puedo cambiar el diseño de mi mini-landing?', a: 'Sí. Desde tu dashboard puedes elegir entre 3 templates: Clásico, Editorial y Probador. También puedes actualizar tu logo, colores, slogan y horarios.' },
      { q: '¿Incluye el probador virtual?', a: 'Sí, el probador de IA está integrado directamente en tu página. Tus clientes pueden probarse productos sin salir de tu mini-landing.' },
      { q: '¿Necesito saber programar?', a: 'No. Todo se configura desde tu dashboard con formularios simples. No necesitas tocar código ni contratar desarrolladores.' },
      { q: '¿Se paga mensualidad?', a: 'No. El precio de la mini-landing es un pago único de por vida. Solo requiere que mantengas tu suscripción de Lookitry activa para que el probador siga funcionando.' },
    ]
  },
  {
    id: 'pagos',
    label: 'Pagos',
    icon: <CreditCard size={16} />,
    items: [
      { q: '¿Qué métodos de pago aceptan?', a: 'Aceptamos pagos a través de Wompi (Visa, Mastercard, PSE y Nequi) y PayPal para pagos en USD. También coordinamos pagos manuales por WhatsApp.' },
      { q: '¿Hay descuentos por pagar varios meses?', a: 'Pagar 3 meses te da 5% de descuento, 6 meses 10% y 12 meses 15%. Se aplican automáticamente al finalizar la compra.' },
      { q: '¿El pago es seguro?', a: 'Sí. Todos los pagos se procesan a través de Wompi, una pasarela certificada. Nosotros nunca almacenamos los datos de tu tarjeta.' },
      { q: '¿Puedo cancelar en cualquier momento?', a: 'Sí. No hay contratos de permanencia. Puedes cancelar tu suscripción cuando quieras desde tu dashboard.' },
      { q: '¿Qué pasa si no renuevo mi plan?', a: 'Tu cuenta queda suspendida al vencer el período pagado. Tus datos se conservan por 30 días para que puedas reactivar sin perder nada.' },
      { q: '¿Ofrecen factura legal?', a: 'Sí, emitimos factura para todas las transacciones. Puedes solicitarla directamente a nuestro equipo administrativo.' }
    ]
  },
];

const SectionTag = ({ text, light = false }: { text: string; light?: boolean }) => (
  <div className={`section-tag inline-flex items-center gap-2 px-4 py-2 rounded-full mb-8 font-medium text-[10px] uppercase tracking-[0.2em] border shadow-sm transition-all ${light
      ? 'bg-white/5 border-white/10 text-white/60'
      : 'bg-[#FF5C3A]/5 border-[#FF5C3A]/20 text-[#FF5C3A]'
    }`}>
    <span className={`w-1.5 h-1.5 rounded-full animate-pulse ${light ? 'bg-white/40' : 'bg-[#FF5C3A]'}`} />
    {text}
  </div>
);

interface PremiumLandingClientProps {
  pricing: PricingConfig;
  reviews?: any[];
}

export default function PremiumLandingClient({ pricing }: PremiumLandingClientProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [activeTab, setActiveTab] = useState<string>('probador');
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);
  const [currency, setCurrency] = useState<'COP' | 'USD'>('COP');

  useGSAP(() => {
    const tl = gsap.timeline();
    tl.from('.hero-content > *', {
      y: 40,
      opacity: 0,
      duration: 1,
      stagger: 0.2,
      ease: 'expo.out'
    }).from('.hero-mockup-wrapper', {
      opacity: 0,
      y: 40,
      duration: 1.2,
      ease: 'power3.out'
    }, '-=0.8');

    gsap.from('.feature-card', {
      scrollTrigger: {
        trigger: '.features-grid',
        start: 'top 85%',
      },
      y: 40,
      duration: 0.8,
      stagger: 0.1,
      ease: 'power2.out'
    });
  }, { scope: containerRef });

  const formatPrice = (priceCop: number, plan: 'basic' | 'pro' | 'landing') => {
    if (currency === 'USD') {
      const usdPrices = {
        basic: 45,
        pro: 75,
        landing: 199
      };
      return `$${usdPrices[plan]}`;
    }
    return `$${priceCop.toLocaleString('es-CO')}`;
  };

  return (
    <div ref={containerRef} className="min-h-screen bg-[#0a0a0a] text-white selection:bg-[#FF5C3A]/30 selection:text-[#FF5C3A] font-dm-sans overflow-x-hidden">
      <style dangerouslySetInnerHTML={{ __html: PREMIUM_FONTS }} />

      <LandingNav onCurrencyChange={setCurrency} currentCurrency={currency} />

      <main>
        {/* HERO SECTION */}
        <section className="relative min-h-screen flex items-center pt-32 pb-24 px-6 md:px-12 overflow-hidden">
          <div className="absolute inset-0 z-0">
            <div className="bg-circle absolute top-[-10%] right-[-10%] w-[80vw] h-[80vw] bg-[#FF5C3A]/5 blur-[200px] rounded-full" />
            <div className="bg-circle absolute bottom-[-10%] left-[-10%] w-[60vw] h-[60vw] bg-white/5 blur-[150px] rounded-full" />
            <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 pointer-events-none mix-blend-overlay" />
          </div>

          <div className="max-w-7xl mx-auto relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div className="text-center lg:text-left hero-content">
              <SectionTag text="Revolución Visual con IA" light />
              <h1 className="font-jakarta text-[38px] md:text-[64px] font-black leading-[1.1] tracking-[-0.04em] mb-8">
                <span className="block text-white">Vende más con el</span>
                <span className="block text-[#FF5C3A]">Probador Virtual</span>
                <span className="block text-white">Nº1 de Latinoamérica.</span>
              </h1>
              <p className="font-dm-sans text-lg text-white/80 max-w-xl mx-auto lg:mx-0 mb-12 leading-[1.6] font-light">
                Tu tienda online, <span className="text-[#FF5C3A] font-bold">sin pagar un diseñador.</span> Permite que tus clientes se prueben tu catálogo en segundos con IA.
              </p>

              <div className="flex flex-wrap justify-center lg:justify-start gap-5">
                <Link href="/register" className="group bg-[#FF5C3A] text-white px-10 py-5 rounded-2xl font-bold flex items-center gap-3 transition-all hover:scale-105 hover:bg-[#ff7b5e] shadow-xl shadow-[#FF5C3A]/20">
                  ¡Probar Ahora!
                  <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                </Link>
                <Link href="#como-funciona" className="bg-white/5 text-white px-10 py-5 rounded-2xl font-bold border border-white/10 hover:bg-white/10 transition-all flex items-center gap-2">
                   Ver cómo funciona
                </Link>
              </div>

              <div className="mt-16 flex flex-wrap justify-center lg:justify-start items-center gap-10 text-white/90 font-bold text-[10px] uppercase tracking-[0.25em]">
                <div className="flex items-center gap-2.5">
                  <ShieldCheck size={16} className="text-[#FF5C3A]" /> 100% Seguro
                </div>
                <div className="flex items-center gap-2.5">
                  <Clock size={16} className="text-[#FF5C3A]" /> Activación 10min
                </div>
                <div className="flex items-center gap-2.5">
                  <Sparkles size={16} className="text-[#FF5C3A]" /> IA Generativa
                </div>
              </div>
            </div>

            <div className="flex justify-center lg:justify-end items-center hero-mockup-wrapper relative w-full lg:translate-x-12">
              {/* Mockup visual similar al anterior pero optimizado */}
              <div className="bg-[#141414] border border-white/10 shadow-[0_40px_100px_rgba(0,0,0,0.8)] rounded-[2.5rem] p-4 w-full max-w-[620px] relative z-10 overflow-hidden">
                <div className="flex items-center gap-3 mb-6">
                  <div className="flex gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-[#ff5c5c]"></span>
                    <span className="w-2 h-2 rounded-full bg-[#ffbd2e]"></span>
                    <span className="w-2 h-2 rounded-full bg-[#28c840]"></span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4">
                  <div className="relative aspect-[3/4] rounded-2xl overflow-hidden border border-white/5">
                    <Image src="/hero/landing_hero_mockup.webp" alt="Probador IA" fill className="object-cover" />
                  </div>
                  <div className="flex flex-col justify-center gap-4">
                    <div className="p-4 rounded-2xl bg-white/5 border border-white/5">
                      <p className="text-[10px] text-white/40 uppercase tracking-widest mb-1">Resultado IA</p>
                      <p className="text-xs font-bold text-[#FF5C3A]">Generación Exitosa</p>
                    </div>
                    <div className="p-4 rounded-2xl bg-[#FF5C3A]/10 border border-[#FF5C3A]/20">
                      <p className="text-[10px] text-white/40 uppercase tracking-widest mb-1">Impacto</p>
                      <p className="text-xs font-bold text-white">+45% Conversión</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CÓMO FUNCIONA */}
        <section id="como-funciona" className="bg-white py-32 px-6 md:px-12 relative">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-24">
              <SectionTag text="Proceso impecable" />
              <h2 className="font-jakarta text-4xl md:text-6xl font-bold tracking-tight text-[#0a0a0a] mb-8">
                Tus clientes lo aman,<br /><span className="text-[#FF5C3A]">tú vendes más.</span>
              </h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
              {STEPS.map((step, i) => (
                <div key={i} className="group">
                  <div className="relative aspect-[4/5] rounded-[2.5rem] overflow-hidden mb-8 border border-[#eee] bg-[#fdfaf8]">
                    <Image src={step.img} alt={step.title} fill className="object-cover group-hover:scale-105 transition-transform duration-700" />
                    <div className="absolute top-8 left-8 w-12 h-12 bg-[#FF5C3A] text-white rounded-2xl flex items-center justify-center font-bold text-xl">{step.n}</div>
                  </div>
                  <h3 className="font-jakarta text-2xl font-bold text-[#0a0a0a] mb-4">{step.title}</h3>
                  <p className="text-[#666] font-light leading-relaxed">{step.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* PRICING */}
        <section id="planes" className="py-40 px-6 md:px-12 bg-[#0c0c0c] relative">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-24">
              <SectionTag text="Planes de Crecimiento" light />
              <h2 className="font-jakarta text-4xl md:text-5xl font-bold text-white mb-6">
                Precios claros, <span className="text-[#FF5C3A]">sin sorpresas.</span>
              </h2>
              <p className="text-white/60 max-w-xl mx-auto">Elige el plan que mejor se adapte a tu marca y comienza hoy mismo.</p>
            </div>

            <div className="features-grid grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 justify-items-center">
              {/* BASIC */}
              <div className="feature-card w-full max-w-sm bg-[#161616] border border-white/5 rounded-[3rem] p-10 flex flex-col h-full hover:border-[#FF5C3A]/30 transition-all">
                <div className="text-[#FF5C3A] font-bold text-[10px] uppercase tracking-[.25em] mb-4">Emprendedores</div>
                <h3 className="font-jakarta font-bold text-3xl text-white mb-4">Básico</h3>
                <div className="flex items-baseline gap-2 mb-8">
                  <span className="font-jakarta font-black text-4xl text-white tracking-tighter">
                    {formatPrice(pricing.basic.precio_mensual_cop, 'basic')}
                  </span>
                  <span className="text-[12px] font-bold text-white/40 uppercase tracking-widest">
                    {currency === 'COP' ? 'COP / mes' : 'USD / mes'}
                  </span>
                </div>
                <ul className="flex flex-col gap-4 mb-12 flex-grow">
                  {pricing.basic.features.map(f => (
                    <li key={f} className="flex items-center gap-3 text-xs text-white/70">
                      <Check size={14} className="text-[#FF5C3A] shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Link href="/checkout?plan=BASIC" className="w-full py-5 rounded-2xl bg-white/5 border border-white/10 text-white font-bold text-center hover:bg-white hover:text-black transition-all">
                  Comenzar con Básico
                </Link>
              </div>

              {/* PRO */}
              <div className="feature-card w-full max-w-sm bg-[#1a1a1a] border border-[#FF5C3A]/40 rounded-[3rem] p-10 flex flex-col h-full relative shadow-[0_40px_80px_rgba(255,92,58,0.1)] scale-105 z-10">
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-[#FF5C3A] text-white text-[9px] font-bold px-5 py-2 rounded-full uppercase tracking-widest">Recomendado</div>
                <div className="text-[#FF5C3A] font-bold text-[10px] uppercase tracking-[.25em] mb-4">Profesional</div>
                <h3 className="font-jakarta font-bold text-3xl text-white mb-4">Pro</h3>
                <div className="flex items-baseline gap-2 mb-8">
                  <span className="font-jakarta font-black text-4xl text-white tracking-tighter">
                    {formatPrice(pricing.pro.precio_mensual_cop, 'pro')}
                  </span>
                  <span className="text-[12px] font-bold text-white/40 uppercase tracking-widest">
                    {currency === 'COP' ? 'COP / mes' : 'USD / mes'}
                  </span>
                </div>
                <ul className="flex flex-col gap-4 mb-12 flex-grow">
                  {pricing.pro.features.map(f => (
                    <li key={f} className="flex items-center gap-3 text-xs text-white/80">
                      <Check size={14} className="text-[#FF5C3A] shrink-0" />
                      {f}
                    </li>
                  ))}
                  <li className="flex items-center gap-3 text-xs text-white font-bold">
                    <Sparkles size={14} className="text-[#FF5C3A] shrink-0" />
                    Plugin WooCommerce Incluido
                  </li>
                </ul>
                <Link href="/checkout?plan=PRO" className="w-full py-5 rounded-2xl bg-[#FF5C3A] text-white font-bold text-center hover:bg-white hover:text-black transition-all shadow-xl shadow-[#FF5C3A]/20">
                  Activar Plan Pro
                </Link>
              </div>

              {/* ENTERPRISE / MODULAR */}
              <div className="feature-card w-full max-w-sm bg-[#161616] border border-white/5 rounded-[3rem] p-10 flex flex-col h-full hover:border-[#FF5C3A]/30 transition-all">
                <div className="text-[#FF5C3A] font-bold text-[10px] uppercase tracking-[.25em] mb-4">Corporativo</div>
                <h3 className="font-jakarta font-bold text-3xl text-white mb-4">Enterprise</h3>
                <div className="flex items-baseline gap-2 mb-8">
                  <span className="font-jakarta font-black text-4xl text-white tracking-tighter">Custom</span>
                </div>
                <ul className="flex flex-col gap-4 mb-12 flex-grow">
                  <li className="flex items-center gap-3 text-xs text-white/70">
                    <Check size={14} className="text-[#FF5C3A] shrink-0" />
                    Generaciones Ilimitadas
                  </li>
                  <li className="flex items-center gap-3 text-xs text-white/70">
                    <Check size={14} className="text-[#FF5C3A] shrink-0" />
                    Acceso Full API Developer
                  </li>
                  <li className="flex items-center gap-3 text-xs text-white/70">
                    <Check size={14} className="text-[#FF5C3A] shrink-0" />
                    SLA y Soporte Directo
                  </li>
                  <li className="flex items-center gap-3 text-xs text-white/70">
                    <Check size={14} className="text-[#FF5C3A] shrink-0" />
                    Implementación In-House
                  </li>
                </ul>
                <Link href="/contacto" className="w-full py-5 rounded-2xl bg-white/5 border border-white/10 text-white font-bold text-center hover:bg-[#FF5C3A] transition-all">
                  Hablar con Ventas
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="bg-[#0a0a0a] py-32 px-6 md:px-12 border-t border-white/5">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-16">
              <SectionTag text="Resolviendo dudas" light />
              <h2 className="font-jakarta text-4xl font-bold text-white mb-4">Preguntas Frecuentes</h2>
            </div>
            {/* FAQ implementation remains similar to pro-test but cleaner */}
            <div className="flex justify-center flex-wrap gap-4 mb-12">
              {FAQ_TABS.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-6 py-3 rounded-2xl text-[10px] font-bold uppercase tracking-widest transition-all ${activeTab === tab.id ? 'bg-[#FF5C3A] text-white shadow-xl shadow-[#FF5C3A]/20' : 'bg-white/5 text-white/40 hover:bg-white/10'}`}
                >
                  {tab.icon} {tab.label}
                </button>
              ))}
            </div>
            <div className="bg-[#111] border border-white/5 rounded-[2.5rem] p-8">
              {FAQ_TABS.find(t => t.id === activeTab)?.items.map((item, idx) => (
                <div key={idx} className="border-b border-white/5 last:border-0">
                  <button
                    onClick={() => setOpenFaqIndex(openFaqIndex === idx ? null : idx)}
                    className="w-full py-6 flex items-center justify-between text-left group"
                  >
                    <span className={`font-jakarta text-lg font-bold transition-colors ${openFaqIndex === idx ? 'text-[#FF5C3A]' : 'text-white/60 group-hover:text-white'}`}>{item.q}</span>
                    <ChevronDown size={20} className={`transition-transform duration-300 ${openFaqIndex === idx ? 'rotate-180 text-[#FF5C3A]' : 'text-white/20'}`} />
                  </button>
                  {openFaqIndex === idx && (
                    <div className="pb-8 text-white/50 text-sm leading-relaxed font-light">
                      {item.a}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      <LandingFooter />
    </div>
  );
}
