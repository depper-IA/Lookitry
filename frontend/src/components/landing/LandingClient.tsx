'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState, useEffect } from 'react';
import FaqSection from '@/components/landing/FaqSection';
import { LandingNav } from '@/components/landing/LandingNav';
import { PaymentTrustBadges } from '@/components/landing/PaymentTrustBadges';
import { LandingFooter } from '@/components/landing/LandingFooter';
import { LandingPricingCard } from '@/components/landing/LandingPricingCard';
import { ProPlanButton, CtaProButton } from '@/components/landing/LandingCtaButtons';
import { PricingConfig } from '@/lib/pricing';
import { formatCurrency } from '@/utils/currency';

// ── Iconos ────────────────────────────────────────────────────────────────────
function IconUser() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#555" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
      <circle cx="12" cy="8" r="4" />
      <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
    </svg>
  );
}

function IconArrow() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
    </svg>
  );
}

function IconCheckSmall() {
  return (
    <svg width="8" height="8" viewBox="0 0 10 10" fill="none" aria-hidden="true">
      <path d="M2 5l2.5 2.5L8 3" stroke="#FF5C3A" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// ── Datos estáticos ───────────────────────────────────────────
const STEPS = [
  { n: '01', title: 'Sube tu foto', desc: 'El cliente toma una selfie o sube una imagen desde su celular o computador.', img: '/steps/paso-1.webp', alt: 'Cliente subiendo una selfie al probador virtual', pos: 'object-top' },
  { n: '02', title: 'Elige el producto', desc: 'Selecciona la prenda, accesorio o calzado del catálogo de tu marca.', img: '/steps/paso-2.webp', alt: 'Selección de producto en el catálogo del probador virtual', pos: 'object-center' },
  { n: '03', title: 'Ve el resultado', desc: 'La IA genera la imagen en segundos. El cliente puede descargarla y compartirla.', img: '/steps/paso-3.webp', alt: 'Resultado generado por IA del probador virtual de ropa', pos: 'object-top' },
];

const TESTIMONIALS = [
  { name: 'Laura M.', role: 'Tienda de moda — Instagram', text: 'Mis clientes pasan más tiempo en el probador que en cualquier otra parte de mi tienda. Las ventas subieron.' },
  { name: 'Carlos R.', role: 'Marca de accesorios y bolsos', text: 'Lo integré en mi web en menos de 10 minutos. Ahora mis clientes ven cómo quedan los accesorios antes de comprar.' },
  { name: 'Valentina G.', role: 'Tienda de calzado online', text: 'El trial me convenció desde el primer día. Mis clientes pueden ver los zapatos puestos antes de decidir. Ahora tengo el plan Pro.' },
];

const MINI_LANDING_FEATURES = [
  { icon: 'M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z M9 22V12h6v10', title: 'Página pública propia', desc: 'URL en lookitry.com/tu-marca. Compártela en redes, WhatsApp o tu bio de Instagram.' },
  { icon: 'M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z', title: 'Catálogo visual', desc: 'Tus productos con foto, precio y badge. Tus clientes los ven y los prueban en segundos.' },
  { icon: 'M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z', title: 'Probador IA integrado', desc: 'El widget de prueba virtual está embebido directamente. Sin redireccionamientos.' },
  { icon: 'M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 7V5z', title: 'WhatsApp flotante', desc: 'Botón de contacto siempre visible. Tus clientes te escriben con un clic.' },
  { icon: 'M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01', title: '3 templates de diseño', desc: 'Clásico, Editorial o Moderno. Cambia el diseño desde tu dashboard cuando quieras.' },
  { icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z', title: 'Activación inmediata', desc: 'Pagas y en minutos tu página está activa. Sin esperas, sin procesos manuales.' },
];

const PRODUCTS = [
  { name: 'Camisa lino beige', price: '$89.000', img: '/products/camisa_lino_beige.png', active: true },
  { name: 'Zapatillas blancas', price: '$185.000', img: '/products/zapatilla_blanca.png', active: false },
  { name: 'Bolso cuero café', price: '$210.000', img: '/products/bolso_cuero_cafe.png', active: false },
];

export default function LandingClient({ pricing }: { pricing: PricingConfig }) {
  const [currency, setCurrency] = useState<'COP' | 'USD'>('COP');
  const [isMounted, setIsMounted] = useState(false);
  const [showBackToTop, setShowBackToTop] = useState(false);
  const trm = pricing?.meta?.trm_referencia ?? 3700;

  useEffect(() => {
    setIsMounted(true);
    const saved = localStorage.getItem('currency') as 'COP' | 'USD';
    if (saved) setCurrency(saved);

    const handleCurrencyChange = () => {
      const current = localStorage.getItem('currency') as 'COP' | 'USD';
      if (current) setCurrency(current);
    };

    const handleScroll = () => {
      setShowBackToTop(window.scrollY > 500);
    };

    window.addEventListener('currencyChange', handleCurrencyChange);
    window.addEventListener('scroll', handleScroll);
    return () => {
      window.removeEventListener('currencyChange', handleCurrencyChange);
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const formatPrice = (cop: number) => {
    if (currency === 'USD') {
      const usd = Math.ceil(cop / trm);
      return new Intl.NumberFormat('en-US', { 
        style: 'currency', 
        currency: 'USD',
        maximumFractionDigits: 0,
        minimumFractionDigits: 0 
      }).format(usd);
    }
    return formatCurrency(cop);
  };

  const basicPrice = pricing?.basic?.precio_mensual_cop ?? 150000;
  const proPrice   = pricing?.pro?.precio_mensual_cop   ?? 250000;
  const basicOrig  = pricing?.basic?.precio_original_cop ?? 150000;
  const proOrig    = pricing?.pro?.precio_original_cop   ?? 250000;

  const basicFeatures = [
    `${pricing?.basic?.productos_max ?? 5} productos`,
    `${isMounted ? (pricing?.basic?.generaciones_mensuales ?? 400).toLocaleString('es-CO') : (pricing?.basic?.generaciones_mensuales ?? 400)} generaciones/mes`,
    'Logo y colores',
    'Widget embebible',
    'Compartir con marca Lookitry'
  ];

  const proFeatures = [
    `${pricing?.pro?.productos_max ?? 15} productos`,
    `${isMounted ? (pricing?.pro?.generaciones_mensuales ?? 1200).toLocaleString('es-CO') : (pricing?.pro?.generaciones_mensuales ?? 1200)} generaciones/mes`,
    'Templates avanzados',
    'Compartir con tu nombre de marca',
    'URL personalizada del widget',
    'Soporte prioritario'
  ];

  return (
    <main className="min-h-screen bg-[#f5f2ee]">
      <LandingNav />
      <div className="overflow-x-hidden">
      {/* HERO */}
      <section className="bg-[#0a0a0a] px-6 md:px-8 pt-16 md:pt-20 pb-16 md:pb-20 text-center relative overflow-hidden">
          <p className="sr-only">
            Lookitry es un probador virtual con inteligencia artificial para tiendas de ropa, accesorios y calzado en Latinoamérica.
          </p>
          <div
            className="absolute w-[600px] h-[600px] rounded-full pointer-events-none"
            style={{ background: 'radial-gradient(circle, rgba(255,92,58,0.09) 0%, transparent 70%)', top: '-100px', left: '50%', transform: 'translateX(-50%)' }}
            aria-hidden="true"
          />
          <div className="relative z-10 max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 bg-[#1a1a1a] border border-[#333] text-[#FF5C3A] text-[11px] font-medium tracking-widest uppercase px-3 py-1.5 rounded-full mb-7">
              <span className="w-1.5 h-1.5 bg-[#FF5C3A] rounded-full animate-pulse" aria-hidden="true" />
              Probador virtual con IA
            </div>
            <h1
              style={{ fontSize: 'clamp(32px, 6vw, 58px)' }}
              className="text-white leading-[1.1] tracking-tight mb-5"
            >
              Tus clientes se prueban<br />
              tu producto <span className="text-[#FF5C3A]">antes de comprar</span>
            </h1>
            <p className="text-[#bbb] text-base max-w-md mx-auto mb-3 leading-relaxed font-light">
              Para tiendas de ropa, accesorios y calzado en Latinoamérica. Intégralo en tu tienda en 10 minutos. Sin apps, sin desarrollo.
            </p>
            <p className="text-[#666] text-sm max-w-lg mx-auto mb-8 leading-relaxed">
              El widget de probador virtual IA Latam más fácil de integrar. Prueba ropa online con inteligencia artificial y aumenta tus conversiones.
            </p>
            <div className="flex gap-3 justify-center flex-wrap mb-3">
              <Link
                href="/register"
                className="bg-[#FF5C3A] hover:bg-[#e84d2c] text-white text-sm font-medium px-7 py-3 rounded-lg transition-all duration-200 hover:-translate-y-0.5 active:scale-95 focus-visible:ring-2 focus-visible:ring-[#FF5C3A]"
              >
                Empezar gratis — 7 días
              </Link>
              <Link
                href="/planes"
                className="text-[#aaa] hover:text-white text-sm px-7 py-3 rounded-lg border border-[#333] hover:border-[#555] transition-all duration-200 hover:-translate-y-0.5 active:scale-95 flex items-center gap-2 focus-visible:ring-2 focus-visible:ring-[#FF5C3A]"
              >
                Ver planes <IconArrow />
              </Link>
            </div>
            <p className="text-[12px] text-[#666]">Requiere verificación de tarjeta · Cancela cuando quieras</p>
          </div>
        </section>

        {/* DEMO MOCKUP */}
        <section className="bg-[#0a0a0a] px-6 md:px-8 pb-16 md:pb-20 flex justify-center" aria-label="Demo del probador virtual">
          <div className="bg-[#1c1c1c] border border-[#333] hover:border-[#FF5C3A]/50 shadow-[0_0_40px_rgba(0,0,0,0.5)] transition-all duration-300 rounded-2xl p-5 md:p-6 w-full max-w-[560px]">
            <div className="flex items-center gap-2 mb-5" aria-hidden="true">
              <span className="w-2.5 h-2.5 rounded-full bg-[#ff5c5c]" />
              <span className="w-2.5 h-2.5 rounded-full bg-[#ffbd2e]" />
              <span className="w-2.5 h-2.5 rounded-full bg-[#28c840]" />
              <div className="flex-1 bg-[#262626] border border-[#333] rounded-md px-3 py-1 text-[11px] text-[#888] text-center truncate">
                lookitry.com/mi-marca
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-[#262626] border border-[#3a3a3a] rounded-xl p-3.5">
                <p className="text-[10px] text-[#aaa] font-bold uppercase tracking-widest mb-2.5">Tu foto</p>
                <div className="bg-[#333] border-2 border-dashed border-[#444] rounded-lg h-28 flex flex-col items-center justify-center gap-1.5 text-[#888] text-[11px]">
                  <div className="w-7 h-7 bg-[#444] rounded-full flex items-center justify-center">
                    <IconUser />
                  </div>
                  <span className="font-medium">Sube una selfie</span>
                </div>
              </div>
              <div className="bg-[#262626] border border-[#3a3a3a] rounded-xl p-3.5">
                <p className="text-[10px] text-[#aaa] font-bold uppercase tracking-widest mb-2.5">Elige producto</p>
                <div className="flex flex-col gap-1.5">
                  {PRODUCTS.map(p => (
                    <div
                      key={p.name}
                      className={`rounded-lg p-2 flex items-center gap-2 border ${p.active ? 'border-[#FF5C3A] bg-[#2d1f1a]' : 'border-[#3a3a3a] bg-[#333]'}`}
                    >
                      <div className="w-8 h-8 rounded-md flex-shrink-0 relative overflow-hidden" aria-hidden="true">
                        <Image src={p.img} alt={p.name} fill className="object-cover" sizes="32px" />
                      </div>
                      <div>
                        <div className={`text-[11px] leading-tight font-medium ${p.active ? 'text-white' : 'text-[#bbb]'}`}>{p.name}</div>
                        <div className="text-[10px] text-[#888]">{p.price}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <Link 
                href="/planes" 
                className="col-span-2 bg-[#FF5C3A] hover:bg-[#e84d2c] text-white text-[13px] font-bold py-2.5 rounded-lg text-center transition-all hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-[#FF5C3A]/20"
              >
                Generar prueba virtual
              </Link>
            </div>
          </div>
        </section>

        {/* STATS */}
        <section className="bg-[#f5f2ee] border-y border-[#e0dcd7] py-12 px-6" aria-label="Estadísticas de Lookitry">
          <div className="flex justify-center gap-8 md:gap-16 flex-wrap">
            {[
              { n: '+30', label: 'marcas activas' },
              { n: '18K', label: 'generaciones este mes' },
              { n: '4.8/5', label: 'satisfacción promedio' },
            ].map(s => (
              <div key={s.label} className="text-center min-w-[80px]">
                <div className="font-extrabold text-3xl md:text-4xl text-[#0a0a0a] tracking-tight">{s.n}</div>
                <div className="text-[13px] text-[#666] mt-1">{s.label}</div>
              </div>
            ))}
          </div>
        </section>

        {/* PRICING */}
        <section className="bg-[#0a0a0a] py-16 md:py-20 px-6 md:px-8" aria-labelledby="pricing-heading">
          <div className="max-w-[700px] mx-auto">
            <p className="text-[11px] font-medium tracking-[.1em] uppercase text-[#FF5C3A] mb-3">Planes</p>
            <h2 id="pricing-heading" className="font-bold text-3xl text-white tracking-tight mb-10">
              Precios simples
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 pt-4">
              {/* Básico */}
              <div className="bg-[#141414] border border-[#2a2a2a] hover:border-[#FF5C3A]/60 transition-colors duration-200 rounded-xl p-6 md:p-7 flex flex-col h-full relative">
                <div className="font-bold text-lg text-white mb-1">Básico</div>
                <div className="mb-0.5 flex flex-wrap items-baseline gap-x-2">
                  <span className="font-extrabold text-[30px] text-white tracking-tight">
                    {formatPrice(basicPrice)}
                  </span>
                  {basicOrig > basicPrice && (
                    <div className="flex items-center gap-1.5">
                      <span className="text-[14px] text-[#666] line-through">
                        {formatPrice(basicOrig)}
                      </span>
                      <span className="text-[11px] font-bold text-[#FF5C3A]">
                        -{Math.round((1 - basicPrice / basicOrig) * 100)}%
                      </span>
                    </div>
                  )}
                  <span className="text-[13px] font-normal text-[#555]">/ mes</span>
                </div>
                <div className="text-[12px] text-[#666] mb-5">Pago directo — activación inmediata</div>
                <ul className="flex flex-col gap-2 mb-6 flex-1">
                  {basicFeatures.map(f => (
                    <li key={f} className="flex items-center gap-2 text-[13px] text-[#999]">
                      <span className="w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(255,92,58,0.13)' }} aria-hidden="true">
                        <IconCheckSmall />
                      </span>
                      {f}
                    </li>
                  ))}
                </ul>
                <Link
                  href={`/checkout?plan=BASIC&currency=${currency}`}
                  className="block w-full text-center py-2.5 bg-[#FF5C3A] hover:bg-[#e84d2c] text-white text-[13px] font-medium rounded-lg transition-all duration-200 hover:-translate-y-0.5 active:scale-95 focus-visible:ring-2 focus-visible:ring-[#FF5C3A] mt-auto"
                >
                  Contratar Básico
                </Link>
              </div>
              {/* Pro */}
              <div className="bg-[#141414] border border-[#FF5C3A] rounded-xl p-6 md:p-7 relative flex flex-col h-full">
                <div
                  className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#FF5C3A] text-white text-[10px] font-semibold tracking-widest uppercase px-3 py-1 rounded-full whitespace-nowrap z-20 shadow-lg shadow-[#FF5C3A]/20"
                  aria-label="Plan más popular"
                >
                  Más popular
                </div>
                <div className="font-bold text-lg text-white mb-1">Pro</div>
                <div className="mb-0.5 flex flex-wrap items-baseline gap-x-2">
                  <span className="font-extrabold text-[30px] text-white tracking-tight">
                    {formatPrice(proPrice)}
                  </span>
                  {proOrig > proPrice && (
                    <div className="flex items-center gap-1.5">
                      <span className="text-[14px] text-[#666] line-through">
                        {formatPrice(proOrig)}
                      </span>
                      <span className="text-[11px] font-bold text-[#FF5C3A]">
                        -{Math.round((1 - proPrice / proOrig) * 100)}%
                      </span>
                    </div>
                  )}
                  <span className="text-[13px] font-normal text-[#555]">/ mes</span>
                </div>
                <div className="text-[12px] text-[#666] mb-5">Pago directo — activación inmediata</div>
                <ul className="flex flex-col gap-2 mb-6 flex-1">
                  {proFeatures.map(f => (
                    <li key={f} className="flex items-center gap-2 text-[13px] text-[#999]">
                      <span className="w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(255,92,58,0.13)' }} aria-hidden="true">
                        <IconCheckSmall />
                      </span>
                      {f}
                    </li>
                  ))}
                </ul>
                <div className="mt-auto">
                  <Link
                    href={`/checkout?plan=PRO&currency=${currency}`}
                    className="block w-full text-center py-2.5 bg-[#FF5C3A] hover:bg-[#e84d2c] text-white text-[13px] font-medium rounded-lg transition-all duration-200 hover:-translate-y-0.5 active:scale-95 focus-visible:ring-2 focus-visible:ring-[#FF5C3A]"
                  >
                    Contratar Pro
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* MEDIOS DE PAGO */}
        <PaymentTrustBadges />

        {/* CÓMO FUNCIONA */}
        <section className="bg-[#f5f2ee] py-16 md:py-20 px-6 md:px-8">
          <div className="max-w-[860px] mx-auto">
            <p className="text-[11px] font-medium tracking-[.1em] uppercase text-[#FF5C3A] mb-3 text-center">Cómo funciona</p>
            <h2 className="font-bold text-[32px] text-[#0a0a0a] tracking-tight mb-10 text-center">
              Tres pasos. Sin complicaciones.
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {STEPS.map((s, i) => (
                <div key={s.n} className="bg-white border border-[#e8e4df] rounded-2xl overflow-hidden hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">
                  <div className="relative w-full aspect-[3/4] overflow-hidden bg-[#f0ece8]">
                    <Image
                      src={s.img}
                      alt={s.alt}
                      fill
                      className={`object-cover ${s.pos}`}
                      sizes="(max-width: 768px) 100vw, 33vw"
                      priority={i === 0}
                    />
                    <div className="absolute top-3 left-3">
                      <span className="inline-block text-white font-extrabold text-sm px-2.5 py-1 rounded-lg leading-none bg-[#FF5C3A]">
                        {s.n}
                      </span>
                    </div>
                  </div>
                  <div className="p-5">
                    <h3 className="font-bold text-base text-[#0a0a0a] mb-1.5">{s.title}</h3>
                    <p className="text-[13px] text-[#666] leading-relaxed">{s.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* MINI-LANDING */}
        <section className="bg-[#f5f2ee] py-16 md:py-24 px-6 md:px-8">
          <div className="max-w-[960px] mx-auto">
            <div className="text-center mb-14">
              <div className="inline-flex items-center gap-2 bg-white border border-[#e0dcd7] text-[#FF5C3A] text-[11px] font-semibold tracking-widest uppercase px-3 py-1.5 rounded-full mb-5">
                Servicio adicional · Pago único
              </div>
              <h2 className="font-extrabold text-[#0a0a0a] tracking-tight leading-tight mb-4 text-3xl md:text-4xl">
                Tu tienda online,<br /><span className="text-[#FF5C3A]">sin pagar un diseñador</span>
              </h2>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_420px] gap-8 items-stretch">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 h-full auto-rows-fr">
                {MINI_LANDING_FEATURES.map(f => (
                  <div key={f.title} className="bg-white border border-[#e8e4df] rounded-2xl p-5 flex gap-3 h-full items-center">
                    <div className="w-9 h-9 rounded-xl flex-shrink-0 flex items-center justify-center bg-[#FF5C3A]/10">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#FF5C3A" strokeWidth="1.8"><path d={f.icon} /></svg>
                    </div>
                    <div>
                      <p className="text-[13px] font-semibold text-[#0a0a0a]">{f.title}</p>
                      <p className="text-[12px] text-[#666] mt-0.5 leading-relaxed">{f.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="lg:sticky lg:top-24">
                <LandingPricingCard />
              </div>
            </div>
          </div>
        </section>

        <FaqSection pricing={pricing} />
        <LandingFooter />
      </div>

      {/* Botón flotante Volver Arriba */}
        <button
          onClick={scrollToTop}
          className={`fixed bottom-8 left-8 p-3.5 rounded-full bg-white border border-[#e0dcd7] text-[#0a0a0a] shadow-xl transition-all duration-300 z-50 hover:scale-110 active:scale-95 group hidden md:block ${
            showBackToTop ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10 pointer-events-none'
          }`}
          aria-label="Volver arriba"
        >
          <svg
            className="w-5 h-5 transition-transform duration-300 group-hover:-translate-y-1"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 15l7-7 7 7" />
          </svg>
        </button>
      </main>
  );
}
