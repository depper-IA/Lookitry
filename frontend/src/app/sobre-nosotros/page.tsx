import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { LandingNav } from '@/components/landing/LandingNav';
import { LandingFooter } from '@/components/landing/LandingFooter';

const BASE_URL = 'https://pruebalo.wilkiedevs.com';

export const metadata: Metadata = {
  title: 'Sobre Nosotros — Lookitry',
  description:
    'Conoce el equipo detrás de Lookitry, el probador virtual con IA para tiendas de ropa en Latinoamérica. Nuestra misión, visión y valores.',
  alternates: { canonical: `${BASE_URL}/sobre-nosotros` },
  robots: { index: true, follow: true },
  openGraph: {
    type: 'website',
    url: `${BASE_URL}/sobre-nosotros`,
    title: 'Sobre Nosotros — Lookitry',
    description: 'El equipo detrás del probador virtual con IA para tiendas de ropa en Latinoamérica.',
    images: [{ url: `${BASE_URL}/og-image.png`, width: 1200, height: 630 }],
  },
};

const VALUES = [
  {
    icon: 'M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z',
    title: 'Innovación accesible',
    desc: 'La IA no debería ser solo para grandes empresas. La hacemos simple y asequible para cualquier tienda en Latam.',
  },
  {
    icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z',
    title: 'Enfoque en el cliente',
    desc: 'Cada decisión de producto la tomamos pensando en las marcas que confían en nosotros y en sus clientes finales.',
  },
  {
    icon: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z',
    title: 'Transparencia',
    desc: 'Sin letra pequeña. Precios claros, datos seguros y comunicación directa con nuestro equipo.',
  },
];

export default function SobreNosotrosPage() {
  return (
    <>
      <LandingNav />
      <main className="min-h-screen bg-[#f5f2ee]">

        {/* Header */}
        <div className="bg-[#0a0a0a] px-6 md:px-8 py-14 md:py-20">
          <div className="max-w-3xl mx-auto">
            <p className="text-[11px] font-medium tracking-[.1em] uppercase text-[#FF5C3A] mb-3">Quiénes somos</p>
            <h1 className="font-syne font-extrabold text-3xl md:text-4xl text-white tracking-tight mb-5">
              Construimos el probador virtual<br />
              <span className="text-[#FF5C3A]">que Latam necesitaba</span>
            </h1>
            <p className="text-[#999] text-[15px] leading-relaxed max-w-xl">
              Somos un equipo de desarrolladores y diseñadores colombianos obsesionados con hacer que la tecnología de IA sea práctica y accesible para las tiendas de moda en Latinoamérica.
            </p>
          </div>
        </div>

        <div className="px-6 md:px-8 py-12 md:py-16">
          <div className="max-w-3xl mx-auto space-y-8">

            {/* Misión */}
            <section className="bg-white border border-[#e8e4df] rounded-2xl p-6 md:p-8">
              <h2 className="font-syne font-bold text-base text-[#0a0a0a] mb-3">Nuestra misión</h2>
              <p className="text-[14px] text-[#555] leading-relaxed">
                Reducir la brecha entre el comercio físico y digital para las tiendas de ropa, accesorios y calzado en Latinoamérica. Creemos que cualquier marca, sin importar su tamaño, merece tener acceso a herramientas de IA que aumenten sus ventas y reduzcan las devoluciones.
              </p>
            </section>

            {/* Valores */}
            <section>
              <h2 className="font-syne font-bold text-base text-[#0a0a0a] mb-4">Nuestros valores</h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {VALUES.map(v => (
                  <div key={v.title} className="bg-white border border-[#e8e4df] rounded-2xl p-5">
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center mb-3" style={{ background: 'rgba(255,92,58,0.1)' }}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#FF5C3A" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <path d={v.icon} />
                      </svg>
                    </div>
                    <p className="font-syne font-bold text-[13px] text-[#0a0a0a] mb-1">{v.title}</p>
                    <p className="text-[12px] text-[#666] leading-relaxed">{v.desc}</p>
                  </div>
                ))}
              </div>
            </section>

            {/* Producto */}
            <section className="bg-white border border-[#e8e4df] rounded-2xl p-6 md:p-8">
              <h2 className="font-syne font-bold text-base text-[#0a0a0a] mb-3">El producto</h2>
              <p className="text-[14px] text-[#555] leading-relaxed mb-4">
                Lookitry nació de una necesidad real: las tiendas de ropa en Colombia y Latinoamérica perdían ventas porque sus clientes no podían probarse las prendas antes de comprar online. Construimos un widget de probador virtual con IA que se integra en cualquier tienda en menos de 10 minutos, sin apps, sin desarrollo adicional.
              </p>
              <p className="text-[14px] text-[#555] leading-relaxed">
                Hoy más de 120 marcas en Colombia, México, Venezuela y otros países de la región usan Lookitry para aumentar su conversión y reducir devoluciones.
              </p>
            </section>

            {/* Contacto */}
            <section className="bg-[#0a0a0a] border border-[#2a2a2a] rounded-2xl p-6 md:p-8">
              <h2 className="font-syne font-bold text-base text-white mb-3">Contáctanos</h2>
              <p className="text-[14px] text-[#999] leading-relaxed mb-5">
                ¿Tienes preguntas sobre Lookitry o quieres saber si es la solución correcta para tu marca? Escríbenos directamente.
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <a
                  href="mailto:info@pruebalo.wilkiedevs.com"
                  className="inline-flex items-center gap-2 bg-[#FF5C3A] hover:bg-[#e84d2c] text-white text-[13px] font-medium px-5 py-2.5 rounded-lg transition-colors"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                    <polyline points="22,6 12,13 2,6" />
                  </svg>
                  info@pruebalo.wilkiedevs.com
                </a>
                <a
                  href="https://wa.me/573105436281"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 border border-[#333] hover:border-[#555] text-[#aaa] hover:text-white text-[13px] font-medium px-5 py-2.5 rounded-lg transition-colors"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                    <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.81 19.79 19.79 0 01.01 1.18 2 2 0 012 0h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.09 7.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z" />
                  </svg>
                  +57 310 543 6281
                </a>
              </div>
            </section>

            <div className="text-center pt-2">
              <Link href="/" className="text-[13px] text-[#FF5C3A] hover:underline">
                Volver al inicio
              </Link>
            </div>
          </div>
        </div>
      </main>
      <LandingFooter />
    </>
  );
}
