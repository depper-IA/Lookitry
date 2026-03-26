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
      <main className="min-h-screen bg-[#030303]">
        <section className="px-6 md:px-8 py-16 md:py-24 border-b border-[#1a1a1a]">
          <div className="max-w-5xl mx-auto">
            <p className="text-[11px] font-semibold tracking-[0.12em] uppercase text-[#FF5C3A] mb-3">Transparencia</p>
            <h1 className="font-jakarta font-bold text-3xl md:text-5xl text-white tracking-tight">
              Estado del servicio
            </h1>
            <p className="text-[#999] text-sm md:text-base mt-3 max-w-3xl">
              Publicamos el estado general para que tengas visibilidad sobre la operación de Lookitry.
            </p>
          </div>
        </section>

        <section className="px-6 md:px-8 py-12 md:py-16">
          <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-5">
            <div className="rounded-3xl border border-[#2a2a2a] bg-[#111] p-6">
              <p className="text-[11px] uppercase tracking-wider text-emerald-400 font-semibold">Operativo</p>
              <p className="text-white font-semibold mt-1">Plataforma y dashboard</p>
              <p className="text-[#888] text-xs mt-2">Disponibilidad estable para gestión diaria.</p>
            </div>
            <div className="rounded-3xl border border-[#2a2a2a] bg-[#111] p-6">
              <p className="text-[11px] uppercase tracking-wider text-emerald-400 font-semibold">Operativo</p>
              <p className="text-white font-semibold mt-1">Procesamiento de pagos</p>
              <p className="text-[#888] text-xs mt-2">Wompi y PayPal en funcionamiento.</p>
            </div>
            <div className="rounded-3xl border border-[#2a2a2a] bg-[#111] p-6">
              <p className="text-[11px] uppercase tracking-wider text-emerald-400 font-semibold">Operativo</p>
              <p className="text-white font-semibold mt-1">Generación IA</p>
              <p className="text-[#888] text-xs mt-2">Servicio de generación activo con monitoreo.</p>
            </div>
          </div>
          <div className="max-w-5xl mx-auto mt-6 rounded-3xl border border-[#2a2a2a] bg-[#111] p-6">
            <p className="text-[#FF5C3A] text-[11px] uppercase tracking-wider font-semibold">Historial reciente</p>
            <ul className="mt-3 space-y-2 text-sm text-[#bbb]">
              <li>Sin incidentes críticos reportados en la última semana.</li>
              <li>Mantenimiento menor de frontend realizado durante ventana de baja demanda.</li>
              <li>Monitoreo activo de rendimiento y disponibilidad.</li>
            </ul>
            <p className="text-[#666] text-xs mt-4">Esta página resume estado general; métricas técnicas detalladas se gestionan internamente.</p>
          </div>
        </section>
      </main>
      <LandingFooter />
    </>
  );
}
