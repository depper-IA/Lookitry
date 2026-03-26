import type { Metadata } from 'next';
import { LandingNav } from '@/components/landing/LandingNav';
import { LandingFooter } from '@/components/landing/LandingFooter';

export const metadata: Metadata = {
  title: 'Estado del Servicio — Lookitry',
  description: 'Estado operativo general de la plataforma Lookitry.',
};

export default function EstadoPage() {
  return (
    <>
      <LandingNav />
      <main className="min-h-screen bg-[#f5f2ee]">
        <section className="bg-[#0a0a0a] px-6 md:px-8 py-14 md:py-20">
          <div className="max-w-3xl mx-auto">
            <p className="text-[11px] font-medium tracking-[.1em] uppercase text-[#FF5C3A] mb-3">Transparencia</p>
            <h1 className="font-syne font-extrabold text-3xl md:text-4xl text-white tracking-tight">
              Estado del servicio
            </h1>
          </div>
        </section>
        <section className="px-6 md:px-8 py-12 md:py-16">
          <div className="max-w-3xl mx-auto grid gap-4">
            <div className="bg-white border border-[#e8e4df] rounded-2xl p-6">
              <p className="text-[11px] uppercase tracking-wider text-emerald-600 font-semibold">Operativo</p>
              <p className="text-[#0a0a0a] font-semibold mt-1">Plataforma y dashboard</p>
            </div>
            <div className="bg-white border border-[#e8e4df] rounded-2xl p-6">
              <p className="text-[11px] uppercase tracking-wider text-emerald-600 font-semibold">Operativo</p>
              <p className="text-[#0a0a0a] font-semibold mt-1">Procesamiento de pagos</p>
            </div>
            <div className="bg-white border border-[#e8e4df] rounded-2xl p-6">
              <p className="text-[11px] uppercase tracking-wider text-emerald-600 font-semibold">Operativo</p>
              <p className="text-[#0a0a0a] font-semibold mt-1">Generación IA</p>
            </div>
          </div>
        </section>
      </main>
      <LandingFooter />
    </>
  );
}
