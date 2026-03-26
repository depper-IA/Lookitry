import type { Metadata } from 'next';
import Link from 'next/link';
import { LandingNav } from '@/components/landing/LandingNav';
import { LandingFooter } from '@/components/landing/LandingFooter';

export const metadata: Metadata = {
  title: 'Centro de Ayuda — Lookitry',
  description: 'Guías rápidas para activar, integrar y operar Lookitry.',
};

export default function AyudaPage() {
  return (
    <>
      <LandingNav />
      <main className="min-h-screen bg-[#f5f2ee]">
        <section className="bg-[#0a0a0a] px-6 md:px-8 py-14 md:py-20">
          <div className="max-w-3xl mx-auto">
            <p className="text-[11px] font-medium tracking-[.1em] uppercase text-[#FF5C3A] mb-3">Soporte</p>
            <h1 className="font-syne font-extrabold text-3xl md:text-4xl text-white tracking-tight">
              Centro de ayuda
            </h1>
          </div>
        </section>
        <section className="px-6 md:px-8 py-12 md:py-16">
          <div className="max-w-3xl mx-auto grid gap-4">
            <Link href="/planes" className="bg-white border border-[#e8e4df] rounded-2xl p-6 block">
              <h2 className="text-base font-bold text-[#0a0a0a]">Planes y precios</h2>
              <p className="text-sm text-[#666] mt-1">Compara planes y elige la mejor opción para tu marca.</p>
            </Link>
            <Link href="/register" className="bg-white border border-[#e8e4df] rounded-2xl p-6 block">
              <h2 className="text-base font-bold text-[#0a0a0a]">Activación de cuenta</h2>
              <p className="text-sm text-[#666] mt-1">Crea tu marca, paga y entra al dashboard.</p>
            </Link>
            <Link href="/contacto" className="bg-white border border-[#e8e4df] rounded-2xl p-6 block">
              <h2 className="text-base font-bold text-[#0a0a0a]">Soporte técnico y comercial</h2>
              <p className="text-sm text-[#666] mt-1">Habla con nuestro equipo para integración y dudas.</p>
            </Link>
          </div>
        </section>
      </main>
      <LandingFooter />
    </>
  );
}
