import type { Metadata } from 'next';
import Link from 'next/link';
import LandingNav from '@/components/landing/new-landing/LandingNav';
import LandingFooter from '@/components/landing/new-landing/LandingFooter';

export const metadata: Metadata = {
  title: 'Centro de Ayuda — Lookitry',
  description: 'Guías rápidas para activar, integrar y operar Lookitry.',
};

export default function AyudaPage() {
  return (
    <>
      <LandingNav />
      <main className="min-h-screen bg-[#030303]">
        <section className="px-6 md:px-8 py-16 md:py-24 border-b border-[#1a1a1a]">
          <div className="max-w-5xl mx-auto">
            <p className="text-[11px] font-semibold tracking-[0.12em] uppercase text-[#FF5C3A] mb-3">Soporte</p>
            <h1 className="font-jakarta font-bold text-3xl md:text-5xl text-white tracking-tight">
              Centro de ayuda
            </h1>
            <p className="text-[#999] text-sm md:text-base mt-3 max-w-3xl">
              Guías prácticas para activar tu marca, integrar el widget y operar el dashboard con confianza.
            </p>
          </div>
        </section>

        <section className="px-6 md:px-8 py-12 md:py-16">
          <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-5">
            <Link href="/planes" className="rounded-3xl border border-[#2a2a2a] bg-[#111] p-6 block hover:border-[#FF5C3A]/40 transition-colors">
              <p className="text-[11px] uppercase tracking-[0.1em] text-[#FF5C3A] font-semibold">Paso 1</p>
              <h2 className="text-base font-semibold text-white mt-1">Elige plan y método de pago</h2>
              <p className="text-sm text-[#bbb] mt-2">Compara planes, define tu inversión y activa tu cuenta de forma inmediata.</p>
            </Link>
            <Link href="/register" className="rounded-3xl border border-[#2a2a2a] bg-[#111] p-6 block hover:border-[#FF5C3A]/40 transition-colors">
              <p className="text-[11px] uppercase tracking-[0.1em] text-[#FF5C3A] font-semibold">Paso 2</p>
              <h2 className="text-base font-semibold text-white mt-1">Crea y configura tu marca</h2>
              <p className="text-sm text-[#bbb] mt-2">Completa identidad, carga productos y deja listo tu probador virtual.</p>
            </Link>
            <Link href="/casos-de-exito" className="rounded-3xl border border-[#2a2a2a] bg-[#111] p-6 block hover:border-[#FF5C3A]/40 transition-colors">
              <p className="text-[11px] uppercase tracking-[0.1em] text-[#FF5C3A] font-semibold">Inspiración</p>
              <h2 className="text-base font-semibold text-white mt-1">Casos de éxito reales</h2>
              <p className="text-sm text-[#bbb] mt-2">Revisa cómo otras marcas están escalando sus ventas con Lookitry.</p>
            </Link>
            <Link href="/contacto" className="rounded-3xl border border-[#2a2a2a] bg-[#111] p-6 block hover:border-[#FF5C3A]/40 transition-colors">
              <p className="text-[11px] uppercase tracking-[0.1em] text-[#FF5C3A] font-semibold">Soporte</p>
              <h2 className="text-base font-semibold text-white mt-1">Habla con el equipo Lookitry</h2>
              <p className="text-sm text-[#bbb] mt-2">Acompañamiento comercial y técnico para despliegue en producción.</p>
            </Link>
          </div>
        </section>
      </main>
      <LandingFooter />
    </>
  );
}
