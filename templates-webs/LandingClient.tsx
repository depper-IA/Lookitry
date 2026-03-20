import Link from 'next/link';
import Image from 'next/image';
import FaqSection from '@/components/landing/FaqSection';
import { PaymentTrustBadges } from '@/components/landing/PaymentTrustBadges';
import { LandingNav } from '@/components/landing/LandingNav';
import { LandingFooter } from '@/components/landing/LandingFooter';
import { LandingPricingCard } from '@/components/landing/LandingPricingCard';
import { ProPlanButton, CtaProButton } from '@/components/landing/LandingCtaButtons';

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

// ── Datos estáticos ───────────────────────────────────────────────────────────
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

const BASIC_FEATURES = ['5 productos', '400 generaciones/mes', 'Logo y colores', 'Widget embebible', 'Compartir con marca Lookitry'];
const PRO_FEATURES = ['15 productos', '1.200 generaciones/mes', 'Templates avanzados', 'Compartir con tu nombre de marca', 'URL personalizada del widget', 'Soporte prioritario'];

const PRODUCTS = [
  { name: 'Camisa lino beige', price: '$89.000', bg: 'linear-gradient(135deg,#2a2a2a,#444)', active: true },
  { name: 'Zapatillas blancas', price: '$185.000', bg: 'linear-gradient(135deg,#2a2a2a,#555)', active: false },
  { name: 'Bolso cuero café', price: '$210.000', bg: 'linear-gradient(135deg,#3a2a1a,#5a3a2a)', active: false },
];

const MINI_LANDING_FEATURES = [
  { icon: 'M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z M9 22V12h6v10', title: 'Página pública propia', desc: 'URL en pruebalo.wilkiedevs.com/tu-marca. Compártela en redes, WhatsApp o tu bio de Instagram.' },
  { icon: 'M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z', title: 'Catálogo visual', desc: 'Tus productos con foto, precio y badge. Tus clientes los ven y los prueban en segundos.' },
  { icon: 'M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z', title: 'Probador IA integrado', desc: 'El widget de prueba virtual está embebido directamente. Sin redireccionamientos.' },
  { icon: 'M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 7V5z', title: 'WhatsApp flotante', desc: 'Botón de contacto siempre visible. Tus clientes te escriben con un clic.' },
  { icon: 'M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01', title: '3 templates de diseño', desc: 'Clásico, Editorial o Moderno. Cambia el diseño desde tu dashboard cuando quieras.' },
  { icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z', title: 'Activación inmediata', desc: 'Pagas y en minutos tu página está activa. Sin esperas, sin procesos manuales.' },
];

// ── Componente principal (Server Component) ───────────────────────────────────
export default function LandingClient() {
  return (
    <main className="min-h-screen overflow-x-hidden bg-[#f5f2ee]">

      {/* NAV */}
      <LandingNav />

      {/* HERO */}
      <section className="bg-[#0a0a0a] px-6 md:px-8 pt-16 md:pt-20 pb-16 md:pb-20 text-center relative overflow-hidden">
        {/* GEO: resumen extractable — qué es Lookitry */}
        <p className="sr-only">
          Lookitry es un probador virtual con inteligencia artificial para tiendas de ropa, accesorios y calzado en Latinoamérica. Permite a los clientes probarse prendas de forma virtual subiendo una selfie, sin necesidad de apps ni registro. Las marcas integran el widget en su tienda en menos de 10 minutos, compatible con Shopify, WooCommerce, Wix y cualquier sitio HTML.
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
            className="font-syne font-extrabold text-white leading-[1.1] tracking-tight mb-5"
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
              pruebalo.wilkiedevs.com/mi-marca
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
                    <div className="w-7 h-7 rounded-md flex-shrink-0" style={{ background: p.bg }} aria-hidden="true" />
                    <div>
                      <div className={`text-[11px] leading-tight font-medium ${p.active ? 'text-white' : 'text-[#bbb]'}`}>{p.name}</div>
                      <div className="text-[10px] text-[#888]">{p.price}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <button className="col-span-2 bg-[#FF5C3A] hover:bg-[#e84d2c] text-white text-[13px] font-bold py-2.5 rounded-lg text-center transition-transform active:scale-[0.98]" aria-label="Generar prueba virtual de la prenda seleccionada">
              Generar prueba virtual
            </button>
          </div>
        </div>
      </section>

      {/* STATS */}
      <section className="bg-[#f5f2ee] border-y border-[#e0dcd7] py-12 px-6" aria-label="Estadísticas de Lookitry">
        <div className="flex justify-center gap-8 md:gap-16 flex-wrap">
          {[
            { n: '+120', label: 'marcas activas' },
            { n: '18K', label: 'generaciones este mes' },
            { n: '4.8/5', label: 'satisfacción promedio' },
          ].map(s => (
            <div key={s.label} className="text-center min-w-[80px]">
              <div className="font-syne font-extrabold text-3xl md:text-4xl text-[#0a0a0a] tracking-tight">{s.n}</div>
              <div className="text-[13px] text-[#666] mt-1">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* PRICING */}
      <section className="bg-[#0a0a0a] py-16 md:py-20 px-6 md:px-8" aria-labelledby="pricing-heading">
        <div className="max-w-[700px] mx-auto">
          {/* GEO: resumen extractable — precios */}
          <p className="sr-only">
            Lookitry ofrece dos planes mensuales: Plan Básico a $150.000 COP con 5 productos y 400 generaciones al mes, incluye 7 días de prueba gratis. Plan Pro a $250.000 COP con 15 productos y 1.200 generaciones al mes, con activación inmediata. Hay descuentos del 5%, 10% y 15% pagando 3, 6 o 12 meses respectivamente.
          </p>
          <p className="text-[11px] font-medium tracking-[.1em] uppercase text-[#FF5C3A] mb-3">Planes</p>
          <h2 id="pricing-heading" className="font-syne font-bold text-3xl text-white tracking-tight mb-10">
            Precios simples
          </h2>
          {/* pt-4 para dar espacio al badge "-top-3" del Pro */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 pt-4">
            {/* Básico */}
            <div className="bg-[#141414] border border-[#2a2a2a] hover:border-[#FF5C3A]/60 transition-colors duration-200 rounded-xl p-6 md:p-7 flex flex-col h-full">
              <div className="font-syne font-bold text-lg text-white mb-1">Básico</div>
              <div className="font-syne font-extrabold text-[30px] text-white tracking-tight mb-0.5">
                $150.000 <span className="text-[13px] font-normal text-[#555]">/ mes</span>
              </div>
              <div className="text-[12px] text-[#666] mb-5">Pago directo — activación inmediata</div>
              <ul className="flex flex-col gap-2 mb-6 flex-1">
                {BASIC_FEATURES.map(f => (
                  <li key={f} className="flex items-center gap-2 text-[13px] text-[#999]">
                    <span className="w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(255,92,58,0.13)' }} aria-hidden="true">
                      <IconCheckSmall />
                    </span>
                    {f}
                  </li>
                ))}
              </ul>
              <Link
                href="/checkout?plan=BASIC&amount=150000&months=1"
                className="block w-full text-center py-2.5 bg-[#FF5C3A] hover:bg-[#e84d2c] text-white text-[13px] font-medium rounded-lg transition-all duration-200 hover:-translate-y-0.5 active:scale-95 focus-visible:ring-2 focus-visible:ring-[#FF5C3A] mt-auto"
              >
                Contratar Básico
              </Link>
            </div>
            {/* Pro */}
            <div className="bg-[#141414] border border-[#FF5C3A] rounded-xl p-6 md:p-7 relative flex flex-col h-full">
              <div
                className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#FF5C3A] text-white text-[10px] font-semibold tracking-widest uppercase px-3 py-1 rounded-full whitespace-nowrap"
                aria-label="Plan más popular"
              >
                Más popular
              </div>
              <div className="font-syne font-bold text-lg text-white mb-1">Pro</div>
              <div className="font-syne font-extrabold text-[30px] text-white tracking-tight mb-0.5">
                $250.000 <span className="text-[13px] font-normal text-[#555]">/ mes</span>
              </div>
              <div className="text-[12px] text-[#666] mb-5">Pago directo — activación inmediata</div>
              <ul className="flex flex-col gap-2 mb-6 flex-1">
                {PRO_FEATURES.map(f => (
                  <li key={f} className="flex items-center gap-2 text-[13px] text-[#999]">
                    <span className="w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(255,92,58,0.13)' }} aria-hidden="true">
                      <IconCheckSmall />
                    </span>
                    {f}
                  </li>
                ))}
              </ul>
              <div className="mt-auto">
                <ProPlanButton />
              </div>
            </div>
          </div>
          <p className="text-[12px] text-[#666] text-center mt-4">
            Descuentos: 5% (3 meses) · 10% (6 meses) · 15% (12 meses) ·{' '}
            <Link href="/planes" className="text-[#FF5C3A] hover:underline focus-visible:ring-2 focus-visible:ring-[#FF5C3A]">Ver comparativa completa</Link>
          </p>
        </div>
      </section>

      {/* MEDIOS DE PAGO (Trust Badges) */}
      <PaymentTrustBadges />

      {/* CÓMO FUNCIONA */}
      <section className="bg-[#f5f2ee] py-16 md:py-20 px-6 md:px-8" aria-labelledby="how-it-works-heading">
        <div className="max-w-[860px] mx-auto">
          {/* GEO: resumen extractable — cómo funciona */}
          <p className="sr-only">
            Lookitry funciona en tres pasos: el cliente sube una selfie desde su celular o computador, elige el producto del catálogo de la marca, y la inteligencia artificial genera en segundos una imagen realista mostrando cómo le queda la prenda. Sin apps, sin registro, sin fricción. El resultado se puede descargar y compartir directamente.
          </p>
          <p className="text-[11px] font-medium tracking-[.1em] uppercase text-[#FF5C3A] mb-3">Cómo funciona</p>
          <h2 id="how-it-works-heading" className="font-syne font-bold text-[32px] text-[#0a0a0a] tracking-tight mb-10">
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
                    loading={i === 0 ? 'eager' : 'lazy'}
                  />
                  <div className="absolute top-3 left-3">
                    <span className="font-syne inline-block text-white font-extrabold text-sm px-2.5 py-1 rounded-lg leading-none bg-[#FF5C3A]" aria-hidden="true">
                      {s.n}
                    </span>
                  </div>
                </div>
                <div className="p-5">
                  <h3 className="font-syne font-bold text-base text-[#0a0a0a] mb-1.5">{s.title}</h3>
                  <p className="text-[13px] text-[#666] leading-relaxed">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* MINI-LANDING — sección de venta del add-on */}
      <section className="bg-[#f5f2ee] py-16 md:py-24 px-6 md:px-8" aria-labelledby="mini-landing-heading">
        <div className="max-w-[960px] mx-auto">
          <div className="text-center mb-14">
            <div className="inline-flex items-center gap-2 bg-white border border-[#e0dcd7] text-[#FF5C3A] text-[11px] font-semibold tracking-widest uppercase px-3 py-1.5 rounded-full mb-5">
              <span className="w-1.5 h-1.5 bg-[#FF5C3A] rounded-full" aria-hidden="true" />
              Servicio adicional · Pago único
            </div>
            <h2 id="mini-landing-heading" style={{ fontSize: 'clamp(28px,5vw,46px)' }}
              className="font-syne font-extrabold text-[#0a0a0a] tracking-tight leading-tight mb-4">
              Tu tienda online,<br />
              <span className="text-[#FF5C3A]">sin pagar un diseñador</span>
            </h2>
            <p className="text-[#666] text-[15px] max-w-lg mx-auto leading-relaxed">
              Activa tu mini-landing pública por un pago único y obtén una página profesional con probador virtual integrado, lista en minutos.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-[1fr_420px] gap-8 items-start">
            {/* Columna izquierda */}
            <div className="space-y-8">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {MINI_LANDING_FEATURES.map(f => (
                  <div key={f.title} className="bg-white border border-[#e8e4df] hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 rounded-2xl p-5 flex gap-3">
                    <div className="w-9 h-9 rounded-xl flex-shrink-0 flex items-center justify-center" style={{ background: 'rgba(255,92,58,0.1)' }}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#FF5C3A" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <path d={f.icon} />
                      </svg>
                    </div>
                    <div>
                      <p className="text-[13px] font-semibold text-[#0a0a0a]">{f.title}</p>
                      <p className="text-[12px] text-[#666] mt-0.5 leading-relaxed">{f.desc}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Comparativa con/sin */}
              <div className="bg-white border border-[#e8e4df] rounded-2xl overflow-hidden">
                <div className="grid grid-cols-2 divide-x divide-[#e8e4df]">
                  <div className="p-5">
                    <p className="text-[11px] font-semibold uppercase tracking-widest text-[#bbb] mb-3">Sin mini-landing</p>
                    {['Tus clientes no saben dónde encontrarte', 'Pierdes ventas por falta de catálogo', 'Dependes solo de Instagram o WhatsApp', 'Sin probador virtual en tu página'].map(item => (
                      <div key={item} className="flex items-start gap-2 mb-2">
                        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="flex-shrink-0 mt-0.5" aria-hidden="true"><circle cx="7" cy="7" r="7" fill="#fee2e2"/><path d="M4.5 4.5l5 5M9.5 4.5l-5 5" stroke="#ef4444" strokeWidth="1.5" strokeLinecap="round"/></svg>
                        <span className="text-[12px] text-[#999] leading-snug">{item}</span>
                      </div>
                    ))}
                  </div>
                  <div className="p-5">
                    <p className="text-[11px] font-semibold uppercase tracking-widest text-[#FF5C3A] mb-3">Con mini-landing</p>
                    {['Página profesional lista en minutos', 'Catálogo con probador virtual integrado', 'URL propia para compartir en cualquier canal', 'Clientes que prueban, compran más'].map(item => (
                      <div key={item} className="flex items-start gap-2 mb-2">
                        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="flex-shrink-0 mt-0.5" aria-hidden="true"><circle cx="7" cy="7" r="7" fill="rgba(255,92,58,0.15)"/><path d="M4 7l2 2 4-4" stroke="#FF5C3A" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                        <span className="text-[12px] text-[#555] leading-snug">{item}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Columna derecha: card de precio (Client Component con fetch dinámico) */}
            <div className="lg:sticky lg:top-20">
              <LandingPricingCard />
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <FaqSection />

      {/* TESTIMONIOS */}
      <section className="bg-[#f5f2ee] py-16 md:py-20 px-6 md:px-8 border-t border-[#e0dcd7]" aria-labelledby="testimonials-heading">
        <div className="max-w-[860px] mx-auto">
          <p className="text-[11px] font-medium tracking-[.1em] uppercase text-[#FF5C3A] mb-3">Testimonios</p>
          <h2 id="testimonials-heading" className="font-syne font-bold text-[32px] text-[#0a0a0a] tracking-tight mb-10">
            Lo que dicen las marcas
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {TESTIMONIALS.map(t => (
              <div key={t.name} className="bg-white border border-[#e8e4df] hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 rounded-xl p-5">
                <p className="text-[13px] text-[#555] leading-relaxed italic mb-4">"{t.text}"</p>
                <div className="text-[13px] font-medium text-[#0a0a0a]">{t.name}</div>
                <div className="text-[11px] text-[#888] mt-0.5">{t.role}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA FINAL */}
      <section className="bg-[#0a0a0a] py-16 md:py-20 px-6 md:px-8 text-center relative overflow-hidden" aria-labelledby="cta-heading">
        <div
          className="absolute pointer-events-none"
          style={{ width: '500px', height: '300px', background: 'radial-gradient(ellipse, rgba(255,92,58,0.06) 0%, transparent 70%)', top: '50%', left: '50%', transform: 'translate(-50%,-50%)' }}
          aria-hidden="true"
        />
        <div className="relative z-10 max-w-xl mx-auto">
          <h2 id="cta-heading" className="font-syne font-extrabold text-[34px] md:text-[38px] text-white tracking-tight mb-3">
            Empieza hoy sin riesgos
          </h2>
          <p className="text-[15px] text-[#aaa] mb-8">
            7 días gratis con el plan Trial. Plan Básico y Pro con pago directo y seguro.
          </p>
          <div className="flex gap-3 justify-center flex-wrap">
            <Link
              href="/register"
              className="bg-[#FF5C3A] hover:bg-[#e84d2c] text-white text-[15px] font-medium px-8 py-3.5 rounded-xl transition-all duration-200 hover:-translate-y-0.5 active:scale-95 focus-visible:ring-2 focus-visible:ring-[#FF5C3A]"
            >
              Crear cuenta gratis
            </Link>
            <CtaProButton />
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <LandingFooter />

    </main>
  );
}