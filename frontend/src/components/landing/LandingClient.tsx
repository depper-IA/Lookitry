'use client';

import Link from 'next/link';
import Image from 'next/image';
import FaqSection from '@/components/landing/FaqSection';
import { PaymentTrustBadges } from '@/components/landing/PaymentTrustBadges';
import { LandingNav } from '@/components/landing/LandingNav';
import { LandingFooter } from '@/components/landing/LandingFooter';
import { PricingConfig } from '@/lib/pricing';
import { formatCurrency } from '@/utils/currency';

const BASIC_FEATURES = ['5 productos activos', '400 generaciones/mes', 'Widget básico personalizable', 'Actualizaciones en tiempo real'];
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

function CtaProButton() {
  return (
    <Link
      href="/checkout?plan=PRO"
      className="inline-flex items-center gap-2 px-8 py-4 rounded-full bg-[#FF5C3A] text-white font-bold text-base shadow-xl hover:opacity-90 active:scale-95 transition-all"
    >
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
      Activar Plan Pro
    </Link>
  );
}

export default function LandingClient({ pricing }: { pricing: PricingConfig }) {
  const basicPrice = pricing?.basic?.precio_mensual_cop ?? 150000;
  const proPrice   = pricing?.pro?.precio_mensual_cop   ?? 250000;
  const isBasicDiscounted = basicPrice < 150000;
  const isProDiscounted   = proPrice < 250000;

  return (
    <main className="min-h-screen overflow-x-hidden bg-[#f5f2ee]">
      <LandingNav />
      <section className="bg-[#0a0a0a] px-6 md:px-8 pt-16 md:pt-20 pb-16 md:pb-20 text-center relative overflow-hidden">
        <p className="sr-only">
          Lookitry es un probador virtual con inteligencia artificial para tiendas de ropa...
        </p>
        <div
          className="absolute w-[600px] h-[600px] rounded-full pointer-events-none"
          style={{ background: 'radial-gradient(circle, rgba(255,92,58,0.09) 0%, transparent 70%)', top: '-100px', left: '50%', transform: 'translateX(-50%)' }}
          aria-hidden="true"
        />
        <div className="relative z-10 max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#FF5C3A15] border border-[#FF5C3A33] mb-8 animate-in fade-in slide-in-from-top-4 duration-1000">
            <span className="w-1.5 h-1.5 rounded-full bg-[#FF5C3A] animate-pulse" />
            <span className="text-[11px] font-bold text-[#FF5C3A] uppercase tracking-widest">Nueva era del e-commerce</span>
          </div>
          <h1 className="text-5xl md:text-7xl font-black text-white leading-[0.95] tracking-tighter mb-8 italic">
            PRUÉBATELO <br />
            <span className="text-[#FF5C3A]">SIN LÍMITES</span>
          </h1>
          <p className="text-gray-400 text-lg md:text-xl max-w-2xl mx-auto mb-10 leading-relaxed font-light">
            Impulsa tus ventas con el probador virtual IA más avanzado para marcas de ropa. <br className="hidden md:block" />
            <span className="text-white font-medium">Tus clientes se ven con tu ropa en segundos.</span>
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/register"
              className="w-full sm:w-auto px-8 py-4 rounded-full bg-white text-black font-bold text-base hover:bg-gray-100 transition-all active:scale-95 shadow-lg"
            >
              Empezar gratis
            </Link>
            <CtaProButton />
          </div>
        </div>
      </section>

      {/* SECCIÓN PRECIOS */}
      <section id="precios" className="py-20 px-6">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl md:text-5xl font-black text-center mb-12 tracking-tighter italic">PLANES QUE ESCALAN</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {/* BASIC */}
            <div className="bg-white rounded-[40px] p-10 border border-gray-100 shadow-sm hover:shadow-xl transition-all flex flex-col">
              <h3 className="text-2xl font-bold mb-2">BÁSICO</h3>
              <p className="text-gray-500 text-sm mb-6">Para marcas que están empezando.</p>
              <div className="mb-8">
                {isBasicDiscounted && <span className="text-sm text-gray-400 line-through">$150.000</span>}
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-black">{formatCurrency(basicPrice)}</span>
                  <span className="text-gray-400 text-sm">/mes</span>
                </div>
              </div>
              <ul className="space-y-4 mb-10 flex-1">
                {BASIC_FEATURES.map(f => (
                  <li key={f} className="flex items-center gap-3 text-sm text-gray-600 italic">
                    <svg className="w-4 h-4 text-[#FF5C3A]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3"><path d="M5 13l4 4L19 7" /></svg>
                    {f}
                  </li>
                ))}
              </ul>
              <Link href="/checkout?plan=BASIC" className="w-full py-4 rounded-3xl bg-black text-white font-bold text-center hover:opacity-90">Contratar Básico</Link>
            </div>
            {/* PRO */}
            <div className="bg-[#FF5C3A] rounded-[40px] p-10 shadow-2xl shadow-[#FF5C3A]/20 flex flex-col relative overflow-hidden">
              <div className="absolute top-6 right-6 px-3 py-1 bg-white/20 rounded-full text-[10px] font-bold text-white uppercase tracking-widest">Recomendado</div>
              <h3 className="text-2xl font-bold text-white mb-2 uppercase">PRO</h3>
              <p className="text-white/80 text-sm mb-6 font-medium">Potencia tu marca al máximo.</p>
              <div className="mb-8">
                {isProDiscounted && <span className="text-sm text-white/60 line-through">$250.000</span>}
                <div className="flex items-baseline gap-1 text-white">
                  <span className="text-4xl font-black">{formatCurrency(proPrice)}</span>
                  <span className="text-white/60 text-sm">/mes</span>
                </div>
              </div>
              <ul className="space-y-4 mb-10 flex-1">
                {PRO_FEATURES.map(f => (
                  <li key={f} className="flex items-center gap-3 text-sm text-white italic">
                    <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3"><path d="M5 13l4 4L19 7" /></svg>
                    {f}
                  </li>
                ))}
              </ul>
              <Link href="/checkout?plan=PRO" className="w-full py-4 rounded-3xl bg-white text-[#FF5C3A] font-bold text-center hover:bg-gray-50">Contratar Pro</Link>
            </div>
          </div>
          <p className="text-center text-gray-400 text-xs mt-10">
            * Los precios están expresados en pesos colombianos (COP). <br />
            * Puedes cancelar o cambiar de plan en cualquier momento desde tu dashboard.
          </p>
        </div>
      </section>

      {/* MEDIOS DE PAGO (Trust Badges) */}
      <PaymentTrustBadges />

      {/* CÓMO FUNCIONA (Placeholder o integrado en landing) */}
      <section className="py-20 bg-white">
        <div className="max-w-5xl mx-auto px-6 text-center">
          <h2 className="text-3xl md:text-5xl font-black mb-12 tracking-tighter italic">CÓMO FUNCIONA</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            {[
              { t: '1. Elige un producto', d: 'Navega por el catálogo de la tienda y elige la prenda que te gusta.' },
              { t: '2. Sube tu foto', d: 'Tómate una foto o sube una desde tu galería. La IA analizará tu cuerpo.' },
              { t: '3. Mira el resultado', d: 'En segundos verás la prenda puesta sobre tu cuerpo con total realismo.' },
            ].map((s, i) => (
              <div key={i} className="text-center">
                <div className="w-12 h-12 rounded-2xl bg-[#FF5C3A15] text-[#FF5C3A] flex items-center justify-center font-bold text-xl mx-auto mb-4">{i + 1}</div>
                <h3 className="font-bold text-xl mb-2">{s.t}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{s.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <FaqSection />

      {/* CTA FINAL */}
      <section className="py-20 px-6 bg-[#0a0a0a] text-center">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-4xl md:text-6xl font-black text-white mb-8 tracking-tighter italic uppercase">
            ¿LISTO PARA <br /> <span className="text-[#FF5C3A]">TRANSFORMAR</span> TU MARCA?
          </h2>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/register"
              className="w-full sm:w-auto px-10 py-4 rounded-full bg-white text-black font-extrabold text-base transition-all hover:scale-105 active:scale-95 shadow-xl"
            >
              Empezar gratis ahora
            </Link>
            <CtaProButton />
          </div>
        </div>
      </section>

      <LandingFooter />
    </main>
  );
}
