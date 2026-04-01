'use client';

// GSAP usa window — debe renderizarse solo en cliente para evitar 404 en SSR
import dynamic from 'next/dynamic';
import React, { useRef, useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import LandingNav from '@/components/landing/new-landing/LandingNav';
import LandingFooter from '@/components/landing/new-landing/LandingFooter';
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

// Registrar plugins de GSAP
if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

const PREMIUM_FONTS = `
  @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=DM+Sans:ital,opsz,wght@0,9..40,100..1000;1,9..40,100..1000&display=swap');
  
  .font-jakarta { font-family: 'Plus Jakarta Sans', sans-serif; }
  .font-dm-sans { font-family: 'DM Sans', sans-serif; }
`;

// ── Datos e Iconos ─────────────────────────────────────────────────────────────

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
  {
    id: 'generaciones',
    label: 'Generaciones',
    icon: <Zap size={16} />,
    items: [
      { q: '¿Qué es una &quot;generación&quot;?', a: 'Cada vez que un cliente usa el probador virtual para ver cómo le queda un producto, se consume una generación. Es el proceso de IA que crea la imagen personalizada.' },
      { q: '¿Qué pasa si agoto mis generaciones?', a: 'El probador deja de estar disponible hasta que se reinicie el contador el siguiente mes o hasta que hagas un upgrade de plan.' },
      { q: '¿Cuántas generaciones incluye cada plan?', a: 'El Plan Básico incluye 400 generaciones por mes. El Plan Pro incluye 1.200 generaciones por mes. El contador se reinicia el primer día de cada mes.' },
      { q: '¿Puedo ver cuántas he usado?', a: 'Sí. En tu dashboard tienes analíticas en tiempo real del consumo de generaciones y visitas a tu catálogo.' },
      { q: '¿Las no usadas se acumulan?', a: 'No. Las generaciones no utilizadas en el periodo actual no se transfieren al siguiente mes.' },
      { q: '¿Cuánto tarda en generar una imagen?', a: 'Normalmente entre 10 y 25 segundos, dependiendo de la complejidad de la prenda y la pose del cliente.' }
    ]
  },
  {
    id: 'plugin',
    label: 'Plugin/Integración',
    icon: <LayoutGrid size={16} />,
    items: [
      { q: '¿Tienen plugin para WooCommerce?', a: 'Sí, contamos con un plugin oficial para WordPress/WooCommerce que permite integrar el probador en minutos sin tocar código.' },
      { q: '¿Funciona en Shopify o Wix?', a: 'Sí. Aunque no sea vía plugin directo, puedes usar nuestro widget embebible (Iframe) que se copia y pega en la sección de descripción o liquid de cualquier plataforma.' },
      { q: '¿El plugin tiene costo adicional?', a: 'No. El uso del plugin o el widget está incluido en cualquiera de nuestros planes de suscripción (Básico o Pro).' },
      { q: '¿Es compatible con mi plantilla actual?', a: 'Nuestra tecnología es agnóstica al diseño. Se adapta al contenedor donde lo coloques, manteniendo siempre un aspecto limpio y profesional.' }
    ]
  }
];

const PAYMENT_LOGOS = [
  { name: 'Visa', url: '/payment-visa.svg' },
  { name: 'Mastercard', url: '/payment-mastercard.svg' },
  { name: 'PSE', url: '/payment-pse.svg' },
  { name: 'Nequi', url: '/payment-nequi.svg' },
  { name: 'Bancolombia', url: '/payment-bancolombia.svg' },
  { name: 'PayPal', url: '/payment-paypal.svg' },
];

// ── Componentes Atómicos ──────────────────────────────────────────────────────

const SectionTag = ({ text, light = false }: { text: string; light?: boolean }) => (
  <div className={`section-tag inline-flex items-center gap-2 px-4 py-2 rounded-full mb-8 font-medium text-[10px] uppercase tracking-[0.2em] border shadow-sm transition-all ${light
      ? 'bg-white/5 border-white/10 text-white/60'
      : 'bg-[#FF5C3A]/5 border-[#FF5C3A]/20 text-[#FF5C3A]'
    }`}>
    <span className={`w-1.5 h-1.5 rounded-full animate-pulse ${light ? 'bg-white/40' : 'bg-[#FF5C3A]'}`} />
    {text}
  </div>
);

// ── Página Principal ──────────────────────────────────────────────────────────

export default function LandingProTest() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [activeTab, setActiveTab] = useState<string>('probador');
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);
  const navRef = useRef<HTMLElement>(null);
  const floatingCtaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let lastScrollY = window.scrollY;
    let isStuck = false;
    let isAtBottom = false;

    const handleScroll = () => {
      const scrollPos = window.scrollY;
      const windowHeight = window.innerHeight;
      const fullHeight = document.documentElement.scrollHeight;
      
      const shouldBeStuck = scrollPos > 40;
      if (shouldBeStuck !== isStuck && navRef.current) {
        isStuck = shouldBeStuck;
        if (isStuck) {
          navRef.current.classList.add('bg-[#0a0a0a]/90', 'backdrop-blur-md', 'border-b', 'border-white/5', 'py-4');
          navRef.current.classList.remove('bg-transparent', 'py-8');
        } else {
          navRef.current.classList.add('bg-transparent', 'py-8');
          navRef.current.classList.remove('bg-[#0a0a0a]/90', 'backdrop-blur-md', 'border-b', 'border-white/5', 'py-4');
        }
      }

      const shouldHide = fullHeight - (scrollPos + windowHeight) < 350; // Esconderse solo al llegar al footer
      if (shouldHide !== isAtBottom && floatingCtaRef.current) {
        isAtBottom = shouldHide;
        if (isAtBottom) {
          floatingCtaRef.current.classList.add('opacity-0', 'pointer-events-none', 'translate-y-10');
          floatingCtaRef.current.classList.remove('opacity-100', 'translate-y-0');
        } else {
          floatingCtaRef.current.classList.add('opacity-100', 'translate-y-0', 'pointer-events-auto');
          floatingCtaRef.current.classList.remove('opacity-0', 'pointer-events-none', 'translate-y-10');
        }
      }
      lastScrollY = scrollPos;
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useGSAP(() => {
    const tl = gsap.timeline();
    tl.from('.hero-title span', {
      y: 100,
      opacity: 0,
      duration: 1,
      stagger: 0.2,
      ease: 'expo.out'
    }).from('.hero-desc', {
      opacity: 0,
      y: 20,
      duration: 1,
      ease: 'power2.out'
    }, '-=0.5').from('.hero-mockup-wrapper', {
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

    gsap.from('.step-card', {
      scrollTrigger: {
        trigger: '.steps-grid',
        start: 'top 80%',
      },
      x: (i: number) => i % 2 === 0 ? -40 : 40,
      opacity: 0,
      duration: 1.2,
      stagger: 0.2,
      ease: 'power4.out'
    });
  }, { scope: containerRef });

  return (
    <div ref={containerRef} className="min-h-screen bg-[#0a0a0a] text-white selection:bg-[#FF5C3A]/30 selection:text-[#FF5C3A] font-dm-sans overflow-x-hidden">
      <style dangerouslySetInnerHTML={{ __html: PREMIUM_FONTS }} />

      <LandingNav />

      <main>
        <section className="relative min-h-screen flex items-center pt-32 pb-24 px-6 md:px-12 overflow-hidden">
          <div className="absolute inset-0 z-0">
            <div className="bg-circle absolute top-[-10%] right-[-10%] w-[80vw] h-[80vw] bg-[#FF5C3A]/5 blur-[200px] rounded-full" />
            <div className="bg-circle absolute bottom-[-10%] left-[-10%] w-[60vw] h-[60vw] bg-white/5 blur-[150px] rounded-full" />
            <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 pointer-events-none mix-blend-overlay" />
          </div>

          <div className="max-w-7xl mx-auto relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div className="text-center lg:text-left">
              <SectionTag text="Revolución Visual con IA" light />
              <h1 className="hero-title font-jakarta text-[38px] md:text-[64px] font-black leading-[1.1] tracking-[-0.04em] mb-8">
                <span className="block text-white">Vende más con el</span>
                <span className="block text-[#FF5C3A]">Probador Virtual</span>
                <span className="block text-white">Nº1 de Latinoamérica.</span>
              </h1>
              <p className="hero-desc font-dm-sans text-lg text-white/80 max-w-xl mx-auto lg:mx-0 mb-12 leading-[1.6] font-light">
                Tu tienda online, <span className="text-[#FF5C3A] font-bold">sin pagar un diseñador.</span> Permite que tus clientes se prueben tu catálogo en segundos con IA.
              </p>

              <div className="flex flex-wrap justify-center lg:justify-start gap-5">
                <Link href="/register" className="group bg-[#FF5C3A] text-white px-10 py-5 rounded-2xl font-bold flex items-center gap-3 transition-all hover:scale-105 hover:bg-[#ff7b5e] shadow-xl shadow-[#FF5C3A]/20">
                  ¡Probar Gratis Ahora!
                  <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                </Link>
                <Link href="#como-funciona" className="bg-white/5 text-white px-10 py-5 rounded-2xl font-bold border border-white/10 hover:bg-white/10 transition-all flex items-center gap-2">
                   Ver cómo funciona
                </Link>
              </div>

              <div className="hero-btn mt-16 flex flex-wrap justify-center lg:justify-start items-center gap-10 text-white/90 font-bold text-[10px] uppercase tracking-[0.25em]">
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
              <div className="absolute inset-0 bg-[#FF5C3A]/20 blur-[120px] rounded-full animate-pulse" />
              <div className="bg-[#141414] border border-white/10 shadow-[0_40px_100px_rgba(0,0,0,0.8)] rounded-[2.5rem] p-4 w-full max-w-[620px] relative z-10 overflow-hidden group">
                {/* Browser Top Bar */}
                <div className="flex items-center gap-3 mb-6" aria-hidden="true">
                  <div className="flex gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-[#ff5c5c]"></span>
                    <span className="w-2 h-2 rounded-full bg-[#ffbd2e]"></span>
                    <span className="w-2 h-2 rounded-full bg-[#28c840]"></span>
                  </div>
                  <div className="flex-1 bg-[#1c1c1c] border border-white/5 rounded-md px-4 py-1 text-[9px] text-white/20 text-center font-dm-sans uppercase tracking-widest">
                    lookitry.com/mi-marca
                  </div>
                </div>

                <div className="bg-[#1c1c1c] border border-white/5 rounded-2xl p-6 flex flex-col items-center justify-center text-center relative group/upload mb-4">
                  <div className="absolute top-3 left-6 text-[8px] font-bold text-white/20 uppercase tracking-widest">Paso 1: Tu Foto</div>
                  <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center text-white/20 mb-4 border border-dashed border-white/10 group-hover/upload:border-[#FF5C3A]/30 transition-all">
                     <Camera size={24} strokeWidth={1} />
                  </div>
                  <p className="text-[10px] text-white/40 font-bold uppercase tracking-widest">Sube una selfie</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {/* Left: Redhead Model */}
                  <div className="relative aspect-[3/4] rounded-2xl overflow-hidden border border-white/10 bg-[#1a1a1a]">
                    <img 
                      src="https://images.unsplash.com/photo-1589156229687-496a31ad1d1f?q=80&w=1000&auto=format&fit=crop" 
                      alt="Modelo Probador Virtual Lookitry" 
                      className="absolute inset-0 w-full h-full object-cover" 
                    />
                    <div className="absolute top-3 left-4 bg-[#FF5C3A] text-white px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-tighter shadow-xl">
                      Original
                    </div>
                  </div>

                  {/* Right: Products List */}
                  <div className="flex flex-col gap-3">
                    <div className="text-[8px] font-bold text-white/30 uppercase tracking-[0.2em] mb-1 px-1">Paso 2: Elige Producto</div>
                    
                    {[
                       { name: 'Camisa Lino Cream', price: '$120K', img: '/products/camisa_lino_beige.png', active: true },
                       { name: 'Zapatilla Urban Classic', price: '$240K', img: '/products/zapatilla_blanca.png', active: false },
                       { name: 'Bolso Cuero Artisan', price: '$180K', img: '/products/bolso_cuero_cafe.png', active: false },
                       { name: 'Vestido Summer Bloom', price: '$350K', img: 'https://images.unsplash.com/photo-1496747611176-843222e1e57c?q=80&w=200&auto=format&fit=crop', active: false }
                    ].map((prod, i) => (
                      <div 
                        key={i} 
                        className={`group/item flex items-center gap-3 p-2.5 rounded-xl border transition-all cursor-pointer ${
                          prod.active 
                          ? 'bg-[#FF5C3A]/10 border-[#FF5C3A] shadow-lg shadow-[#FF5C3A]/5' 
                          : 'bg-white/5 border-white/10 hover:border-white/20'
                        }`}
                      >
                        <div className="w-10 h-10 rounded-lg bg-[#2a2a2a] overflow-hidden relative flex-shrink-0">
                          <img src={prod.img} alt={prod.name} className="absolute inset-0 w-full h-full object-cover" />
                        </div>
                        <div className="flex flex-col overflow-hidden">
                          <span className={`text-[10px] font-bold truncate ${prod.active ? 'text-white' : 'text-white/60'}`}>{prod.name}</span>
                          <span className="text-[8px] text-white/30 font-medium">{prod.price}</span>
                        </div>
                        {prod.active && (
                          <div className="ml-auto w-3.5 h-3.5 rounded-full bg-[#FF5C3A] flex items-center justify-center">
                             <Check size={8} className="text-white" />
                          </div>
                        )}
                      </div>
                    ))}
                    
                    <button className="mt-2 w-full bg-[#FF5C3A] hover:bg-[#ff7b5e] text-white py-3.5 rounded-xl font-bold text-[11px] shadow-xl shadow-[#FF5C3A]/10 transition-all uppercase tracking-widest active:scale-95">
                       Ver Probador IA
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── STATS SECTION ────────────────────────────────────────────────────── */}
        <section className="bg-[#0a0a0a] py-20 px-6">
          <div className="max-w-[1400px] mx-auto px-6 md:px-12 flex flex-wrap justify-center md:justify-between items-center gap-12 md:gap-8">
            {[
              { val: '+50', label: 'Marcas activas', icon: <Store className="text-[#FF5C3A]" /> },
              { val: '400k', label: 'IA Generations', icon: <Zap className="text-[#FF5C3A]" /> },
              { val: '24/7', label: 'Soporte VIP', icon: <MessageCircle className="text-[#FF5C3A]" /> },
              { val: '4.9', label: 'Satisfaction score', icon: <Check className="text-[#FF5C3A]" /> },
            ].map((stat, i) => (
              <div key={i} className="flex items-center gap-5">
                <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center">
                  {stat.icon}
                </div>
                <div>
                  <div className="font-jakarta text-3xl font-bold text-white mb-0.5">{stat.val}</div>
                  <div className="font-dm-sans text-[10px] font-bold uppercase tracking-widest text-white/60">{stat.label}</div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── CÓMO FUNCIONA ───────────────────────────────────────────────────── */}
        <section id="como-funciona" className="bg-white py-20 px-6 md:px-12 relative">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-24">
              <SectionTag text="Proceso impecable" />
              <h2 className="font-jakarta text-4xl md:text-6xl font-bold tracking-tight text-[#0a0a0a] mb-8">
                Tus clientes lo aman,<br /><span className="text-[#FF5C3A]">tú vendes más.</span>
              </h2>
              <p className="font-dm-sans text-lg text-[#666] max-w-2xl mx-auto font-light leading-relaxed">
                Una experiencia de 3 pasos diseñada para eliminar la fricción técnica y maximizar el deleite del cliente final.
              </p>
            </div>

            <div className="steps-grid grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-16">
              {STEPS.map((step, i) => (
                <div
                  key={i}
                  className="step-card group relative"
                >
                  <div className="relative aspect-[3/4] rounded-[2.5rem] overflow-hidden mb-8 border border-[#e8e4df] bg-[#f0ece8] shadow-sm transition-all duration-500 group-hover:shadow-xl">
                    <Image
                      src={step.img}
                      alt={step.alt}
                      fill
                      className={`object-cover ${step.pos} transition-transform duration-1000 group-hover:scale-110`}
                      sizes="(max-width: 768px) 100vw, 33vw"
                    />
                    <div className="absolute top-8 left-8 w-12 h-12 bg-[#FF5C3A] text-white rounded-2xl flex items-center justify-center font-jakarta font-bold text-xl shadow-2xl">
                      {step.n}
                    </div>
                  </div>
                  <h3 className="font-jakarta text-2xl font-bold text-[#0a0a0a] mb-4 transition-colors group-hover:text-[#FF5C3A]">{step.title}</h3>
                  <p className="font-dm-sans text-[#666] leading-relaxed text-sm font-light">
                    {step.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
          <div className="flex justify-center mt-16">
          <Link href="/register" className="bg-[#FF5C3A] text-white px-10 py-5 rounded-2xl font-bold hover:scale-105 transition-all shadow-xl shadow-[#FF5C3A]/20">
            ¡Comenzar mi transformación ahora!
          </Link>
        </div>
      </section>

      {/* ── SECCIÓN: MINI-LANDING (TU TIENDA ONLINE) ───────────────────────── */}
      <section className="py-20 px-6 bg-white overflow-hidden">
        <div className="max-w-[1400px] mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-6 font-medium text-[10px] uppercase tracking-[0.2em] bg-[#FF5C3A]/5 border border-[#FF5C3A]/20 text-[#FF5C3A]">
                Tu propia página
              </div>
              <h2 className="font-jakarta text-4xl md:text-5xl font-bold tracking-tight text-[#0a0a0a] mb-6 leading-tight">
                Tu tienda online, <br />
                <span className="text-[#FF5C3A]">sin pagar un diseñador.</span>
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
                {[
                  { title: "Página pública propia", desc: "URL en lookitry.com/tu-marca. Compártela en redes o tu bio.", icon: <Globe size={20} /> },
                  { title: "Catálogo visual", desc: "Tus productos con foto, precio y badge. Listos en segundos.", icon: <Box size={20} /> },
                  { title: "Probador IA integrado", desc: "El widget de prueba virtual está embebido directamente.", icon: <Sparkles size={20} /> },
                  { title: "WhatsApp flotante", desc: "Botón de contacto siempre visible para cerrar ventas con un clic.", icon: <MessageCircle size={20} /> }
                ].map((feat, idx) => (
                  <div key={idx} className="bg-[#f8f6f4] border border-[#e8e4df] p-6 rounded-2xl hover:bg-white hover:shadow-xl transition-all group">
                    <div className="w-10 h-10 rounded-xl bg-[#FF5C3A]/10 flex items-center justify-center text-[#FF5C3A] mb-4 group-hover:scale-110 transition-transform">
                      {feat.icon}
                    </div>
                    <h4 className="font-jakarta font-bold text-[#0a0a0a] mb-2">{feat.title}</h4>
                    <p className="text-[#666] text-xs leading-relaxed">{feat.desc}</p>
                  </div>
                ))}
              </div>

              <div className="flex flex-wrap gap-4">
                <Link href="/register" className="bg-[#FF5C3A] text-white px-8 py-4 rounded-2xl font-bold text-sm transition-all hover:scale-105 shadow-xl shadow-[#FF5C3A]/20">
                  Crear mi página ahora
                </Link>
                <Link href="/planes" className="bg-[#0a0a0a] text-white px-8 py-4 rounded-2xl font-bold text-sm transition-all hover:bg-[#FF5C3A]">
                  Ver planes y precios
                </Link>
              </div>
            </div>

            <div className="hidden lg:block relative">
              <div className="relative z-10 rounded-[2rem] overflow-hidden border border-[#e8e4df] shadow-2xl">
                 <img src="/hero/promo_landing.png" alt="Lookitry Landing Preview" className="w-full h-auto" />
              </div>
              <div className="absolute -top-10 -right-10 w-40 h-40 bg-[#FF5C3A]/10 blur-3xl rounded-full" />
            </div>
          </div>
        </div>
      </section>

      {/* ── SECCIÓN: PLUGIN WOOCOMMERCE ─────────────────────────────────────── */}
      <section className="py-32 px-6 bg-white overflow-hidden relative">
        <div className="max-w-[1400px] mx-auto px-6">
          <div className="text-center lg:text-left mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#FF5C3A]/10 border border-[#FF5C3A]/20 text-[#FF5C3A] text-[10px] font-bold uppercase tracking-widest mb-6">
              Plugin Oficial WordPress
            </div>
            <h3 className="font-jakarta text-4xl md:text-5xl font-bold text-[#0a0a0a] mb-6 tracking-tight">
              Potencia tu tienda <span className="text-[#FF5C3A]">WooCommerce</span>
            </h3>
            <p className="text-[#666] text-lg font-dm-sans max-w-2xl leading-relaxed">
              Integra el probador virtual líder de Latinoamérica en tu E-commerce sin tocar una sola línea de código. 
              Instalación profesional en menos de 5 minutos.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-20">
            {[
              { 
                title: "Instalación One-Click", 
                desc: "Descarga nuestro archivo .zip e instálalo directamente desde tu panel de WordPress. Sin complicaciones técnicas.",
                icon: <Zap size={24} /> 
              },
              { 
                title: "Sincronización IA", 
                desc: "Tus productos se vinculan automáticamente con nuestro motor de Inteligencia Artificial para una visualización perfecta.",
                icon: <RefreshCw size={24} /> 
              },
              { 
                title: "Personalización Total", 
                desc: "Ajusta la posición, colores y estilos del widget para que combine con tu plantilla, Elementor o Divi.",
                icon: <Settings size={24} /> 
              }
            ].map((item, i) => (
              <div key={i} className="group p-8 rounded-[2.5rem] bg-[#fcfaf8] border border-[#eeebe7] hover:bg-white hover:shadow-2xl hover:shadow-[#FF5C3A]/5 transition-all duration-500">
                <div className="w-14 h-14 rounded-2xl bg-[#FF5C3A]/10 flex items-center justify-center text-[#FF5C3A] mb-6 group-hover:scale-110 group-hover:bg-[#FF5C3A] group-hover:text-white transition-all duration-500">
                  {item.icon}
                </div>
                <h4 className="font-jakarta font-bold text-xl text-[#0a0a0a] mb-4">{item.title}</h4>
                <p className="text-[#666] text-sm leading-relaxed font-dm-sans">{item.desc}</p>
              </div>
            ))}
          </div>

          <div className="flex flex-col lg:flex-row items-center justify-between pt-12 border-t border-[#eeebe7] gap-10">
            <div className="flex flex-col sm:flex-row items-center gap-6">
              <Link href="#" className="flex items-center gap-3 bg-[#FF5C3A] px-10 py-5 rounded-full text-white hover:bg-[#0a0a0a] transition-all shadow-xl shadow-[#FF5C3A]/20 active:scale-95 group">
                <Download size={20} className="group-hover:translate-y-1 transition-transform" />
                <span className="font-bold text-sm">Descargar Plugin (.zip)</span>
              </Link>
              <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-black/5 border border-black/10">
                <div className="w-2 h-2 rounded-full bg-[#FF5C3A] animate-pulse" />
                <span className="text-[10px] font-bold text-black uppercase tracking-widest">Exclusivo Plan PRO</span>
              </div>
            </div>
            
            <div className="flex items-center gap-10 opacity-100 transition-all duration-700">
              <span className="text-[10px] font-bold text-[#000000] uppercase tracking-[0.2em]">Compatible con:</span>
              <div className="flex items-center gap-8">
                <img src="/integrations/Woo_logo_color.svg" alt="WooCommerce" className="h-8 md:h-10" />
                <img src="/integrations/shopify.svg" alt="Shopify" className="h-6 md:h-8 grayscale hover:grayscale-0 transition-all" />
                <img src="/integrations/Wix.svg" alt="Wix" className="h-6 md:h-8 grayscale hover:grayscale-0 transition-all" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── PRICING ─────────────────────────────────────────────────────────── */}
      <section className="py-40 px-6 md:px-12 bg-[#0d0d0d] relative overflow-hidden">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[100%] h-[1px] bg-gradient-to-r from-transparent via-white/10 to-transparent" />

          <div className="max-w-[1400px] mx-auto px-6">
            <div className="text-center mb-24">
              <SectionTag text="Planes de Crecimiento" light />
              <h2 className="font-jakarta text-4xl md:text-5xl font-bold tracking-tight text-white mb-6">
                Precios claros, <span className="text-[#FF5C3A]">sin sorpresas.</span>
              </h2>
              <p className="font-dm-sans text-lg text-white/70 max-w-xl mx-auto">Activa tu plan en minutos con pasarelas 100% seguras y soporte en español.</p>
            </div>

            <div className="features-grid flex flex-wrap justify-center items-stretch gap-8 lg:gap-10">
              {/* Básico */}
              <div className="feature-card w-full md:w-[calc(50%-2rem)] lg:w-[calc(33.33%-2.5rem)] max-w-sm bg-[#1a1a1a] border border-white/10 rounded-[3rem] p-10 flex flex-col h-full hover:border-[#FF5C3A]/60 transition-all duration-500">
                <div className="text-[#FF5C3A] font-bold text-[10px] uppercase tracking-[.25em] mb-4">Emprendedores</div>
                <h3 className="font-jakarta font-bold text-3xl text-white mb-4">Básico</h3>
                <div className="flex items-baseline gap-2 mb-8">
                  <span className="font-jakarta font-black text-4xl text-white tracking-tighter">$150.000</span>
                  <span className="text-[12px] font-bold text-white/60 uppercase tracking-widest">COP / mes</span>
                </div>
                <div className="h-[1px] w-full bg-white/10 mb-10" />
                <ul className="flex flex-col gap-5 mb-12 shrink-0">
                  {['5 productos activos', '400 IA generations / mes', 'Widget embebible', 'Soporte vía correo'].map(f => (
                    <li key={f} className="flex items-center gap-3 text-xs text-white/90 font-medium">
                      <div className="w-5 h-5 rounded-full bg-[#FF5C3A]/10 flex items-center justify-center shrink-0">
                        <Check size={12} className="text-[#FF5C3A]" />
                      </div>
                      {f}
                    </li>
                  ))}
                </ul>
                <Link href="/checkout?plan=BASIC" className="mt-auto w-full py-5 rounded-[1.5rem] bg-white/10 border border-white/10 text-white font-bold text-sm text-center hover:bg-white hover:text-black transition-all">
                  Contratar Básico
                </Link>
              </div>

              {/* Pro */}
              <div className="feature-card w-full md:w-[calc(50%-2rem)] lg:w-[calc(33.33%-2.5rem)] max-w-sm bg-[#1c1c1c] border border-[#FF5C3A]/60 rounded-[3rem] p-10 flex flex-col h-full relative z-10 shadow-[0_40px_100px_rgba(255,92,58,0.15)] scale-[1.02]">
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-[#FF5C3A] text-white text-[9px] font-bold uppercase tracking-widest px-5 py-2 rounded-full shadow-lg">Plan Más Solicitado</div>
                <div className="text-[#FF5C3A] font-bold text-[10px] uppercase tracking-[.25em] mb-4">Profesional</div>
                <h3 className="font-jakarta font-bold text-3xl text-white mb-4">Pro</h3>
                <div className="flex items-baseline gap-2 mb-8">
                  <span className="font-jakarta font-black text-4xl text-white tracking-tighter">$250.000</span>
                  <span className="text-[12px] font-bold text-white/60 uppercase tracking-widest">COP / mes</span>
                </div>
                <div className="h-[1px] w-full bg-white/10 mb-10" />
                <ul className="flex flex-col gap-5 mb-12 shrink-0">
                  {['15 productos activos', '1.200 IA generations / mes', 'Multi-templates avanzados', 'Prioridad y Config Asistida', 'Marca blanca básica'].map(f => (
                    <li key={f} className="flex items-center gap-3 text-xs text-white/80 font-medium">
                      <div className="w-5 h-5 rounded-full bg-[#FF5C3A]/20 flex items-center justify-center shrink-0">
                        <Check size={12} className="text-[#FF5C3A]" />
                      </div>
                      {f}
                    </li>
                  ))}
                </ul>
                <Link href="/checkout?plan=PRO" className="mt-auto w-full py-5 rounded-[1.5rem] bg-[#FF5C3A] text-white font-bold text-sm text-center hover:bg-white hover:text-black transition-all shadow-xl shadow-[#FF5C3A]/20">
                  Activar Plan Pro
                </Link>
              </div>

              {/* Enterprise */}
              <div className="feature-card w-full md:w-[calc(50%-2rem)] lg:w-[calc(33.33%-2.5rem)] max-w-sm bg-[#1a1a1a] border border-white/10 rounded-[3rem] p-10 flex flex-col h-full hover:border-[#FF5C3A]/60 transition-all duration-500">
                <div className="text-[#FF5C3A] font-bold text-[10px] uppercase tracking-[.25em] mb-4">Retail y Corp</div>
                <h3 className="font-jakarta font-bold text-3xl text-white mb-4">Enterprise</h3>
                <div className="flex items-baseline gap-2 mb-8">
                  <span className="font-jakarta font-black text-4xl text-white tracking-tighter">Custom</span>
                </div>
                <div className="h-[1px] w-full bg-white/10 mb-10" />
                <ul className="flex flex-col gap-5 mb-12 shrink-0">
                  {['Catálogo masivo', 'Generaciones ilimitadas', 'Acceso API full', 'Gerente de cuenta 24/7', 'Embed especializado'].map(f => (
                    <li key={f} className="flex items-center gap-3 text-xs text-white/90 font-medium">
                      <div className="w-5 h-5 rounded-full bg-[#FF5C3A]/10 flex items-center justify-center shrink-0">
                        <Check size={12} className="text-[#FF5C3A]" />
                      </div>
                      {f}
                    </li>
                  ))}
                </ul>
                <Link href="/contacto" className="mt-auto w-full py-5 rounded-[1.5rem] bg-white/10 border border-white/10 text-white font-bold text-sm text-center hover:border-[#FF5C3A] hover:text-[#FF5C3A] transition-all">
                  Hablar con Ventas
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* ── MEDIOS DE PAGO ───────────────────────────────────────────────────── */}
        <section className="bg-[#0a0a0a] py-32 px-6">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <div className="flex items-center justify-center gap-2 mb-4 text-[#10b981]">
                <ShieldCheck size={18} />
                <span className="text-[10px] font-bold uppercase tracking-[.25em]">Transacciones Protegidas</span>
              </div>
              <h2 className="font-jakarta font-bold text-4xl text-white mb-4">Medios de pago disponibles</h2>
              <p className="text-sm text-white/80 max-w-md mx-auto font-dm-sans font-light">
                Utilizamos pasarelas certificadas Wompi y PayPal para garantizar que tus datos estén siempre seguros.
              </p>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-12 lg:gap-16 transition-all duration-700">
              {PAYMENT_LOGOS.map((logo) => (
                <div key={logo.name} className="relative h-10 w-28 brightness-0 invert hover:scale-110 transition-all duration-300">
                  <Image
                    src={logo.url}
                    alt={logo.name}
                    title={logo.name}
                    fill
                    className="object-contain"
                  />
                </div>
              ))}
            </div>

            <div className="mt-16 flex flex-wrap items-center justify-center gap-10 text-[10px] text-white font-bold uppercase tracking-[0.2em]">
              <span className="flex items-center gap-2 hover:text-[#FF5C3A] transition-colors">
                <ShieldCheck size={16} className="text-[#FF5C3A]" /> SSL Encrypted 256-bit
              </span>
              <span className="flex items-center gap-2 hover:text-[#FF5C3A] transition-colors">
                <Check size={16} className="text-[#FF5C3A]" /> PCI DSS Verified
              </span>
              <span className="flex items-center gap-2 hover:text-[#FF5C3A] transition-colors">
                <Zap size={16} className="text-[#FF5C3A]" /> Activación Inmediata
              </span>
            </div>
          </div>
        </section>

        {/* ── FAQ SECTION ─────────────────────────────────────────────────────── */}
        <section className="bg-[#0a0a0a] py-40 px-6 md:px-12 border-t border-white/5">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-20 text-reveal">
              <SectionTag text="Resolviendo dudas" light />
              <h2 className="font-jakarta text-4xl md:text-6xl font-bold text-white tracking-tight mb-8">Preguntas <span className="text-[#FF5C3A]">frecuentes.</span></h2>
            </div>

            {/* Tabs dinámicos */}
            <div className="flex justify-center flex-wrap gap-3 mb-12">
              {FAQ_TABS.map(tab => {
                const active = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => { setActiveTab(tab.id); setOpenFaqIndex(0); }}
                    className={`flex items-center gap-2.5 px-7 py-3.5 rounded-[1.2rem] text-[11px] font-bold uppercase tracking-widest transition-all duration-300 border ${active
                        ? 'bg-[#FF5C3A] border-[#FF5C3A] text-white shadow-2xl shadow-[#FF5C3A]/30'
                        : 'bg-white/5 border-white/5 text-white/30 hover:bg-white/10 hover:text-white/60'
                      }`}
                  >
                    {tab.icon} {tab.label}
                  </button>
                );
              })}
            </div>

            <div className="bg-[#111] border border-white/5 rounded-[2.5rem] p-6 md:p-10 shadow-2xl overflow-hidden">
              {FAQ_TABS.find(t => t.id === activeTab)?.items.map((item, idx) => {
                const open = openFaqIndex === idx;
                return (
                  <div key={idx} className="border-b border-white/5 last:border-0">
                    <button
                      onClick={() => setOpenFaqIndex(open ? null : idx)}
                      className="w-full py-7 flex items-center justify-between text-left group transition-all"
                    >
                      <span className={`font-jakarta text-lg font-bold transition-all duration-300 ${open ? 'text-[#FF5C3A]' : 'text-white/80 group-hover:text-white'}`}>
                        {item.q}
                      </span>
                      <div className={`w-8 h-8 rounded-full border flex items-center justify-center shrink-0 transition-all duration-500 ${open ? 'bg-[#FF5C3A] border-[#FF5C3A] rotate-180' : 'border-white/10'
                        }`}>
                        <ChevronDown size={18} />
                      </div>
                    </button>
                    <div
                      className={`overflow-hidden transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] ${open ? 'max-h-[500px] opacity-100 pb-8' : 'max-h-0 opacity-0'
                        }`}
                    >
                      <p className="font-dm-sans text-white/40 leading-relaxed text-[15px] font-light max-w-2xl pr-10">
                        {item.a}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-20 bg-[#141414] border border-white/5 rounded-[3.5rem] p-10 md:p-14 flex flex-col lg:flex-row items-center justify-between gap-10 shadow-2xl relative overflow-hidden group">
              <div className="absolute inset-0 bg-[#FF5C3A]/5 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />
              <div className="text-center lg:text-left relative z-10">
                <h4 className="text-white font-jakarta font-bold text-4xl mb-4 tracking-tight">¿Aún tienes dudas?</h4>
                <p className="text-white/40 text-[15px] font-dm-sans font-medium max-w-sm">Charla con nuestro equipo de expertos ahora mismo.</p>
              </div>
              <div className="flex flex-col sm:flex-row gap-5 w-full lg:w-auto relative z-10 items-center">
                <Link href="https://wa.me/573105436281" className="bg-[#25D366] text-white px-10 py-5 rounded-[2rem] font-bold flex items-center justify-center gap-3 transition-all hover:scale-105 shadow-2xl shadow-[#25D366]/30 hover:shadow-[#25D366]/50 w-full sm:w-auto text-sm">
                  <MessageCircle size={20} fill="white" /> WhatsApp
                </Link>
                <Link href="mailto:info@lookitry.com" className="bg-[#1a1a1a] text-white px-10 py-5 rounded-[2rem] font-bold flex flex-col items-center justify-center gap-0 border border-white/10 hover:border-[#FF5C3A]/30 transition-all w-full sm:w-auto relative group/email">
                  <div className="flex items-center gap-2 mb-0.5">
                     <Mail size={16} className="text-white/60 group-hover/email:text-[#FF5C3A]" />
                     <span className="text-[14px]">Soporte</span>
                  </div>
                  <span className="text-[14px]">Email</span>
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* ── FOOTER ──────────────────────────────────────────────────────────── */}
      <LandingFooter />

      {/* ── BOTÓN FLOTANTE ─────────────────────────────────────────────────── */}
      <div 
        ref={floatingCtaRef}
        className="fixed bottom-10 right-10 z-[100] transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] transform opacity-100 translate-y-0"
      >
        <Link 
          href="/register" 
          className="flex items-center gap-3 bg-[#FF5C3A] text-white px-8 py-5 rounded-full font-bold shadow-2xl shadow-[#FF5C3A]/50 hover:scale-110 active:scale-95 transition-all group overflow-hidden relative"
        >
          <div className="absolute inset-0 bg-white translate-y-full group-hover:translate-y-0 transition-transform duration-300 pointer-events-none opacity-20" />
          <Zap size={20} className="fill-white" />
          <span className="tracking-tight">Probar mi marca ahora</span>
        </Link>
      </div>
    </div>
  );
}
