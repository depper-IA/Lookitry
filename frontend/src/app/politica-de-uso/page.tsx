import type { Metadata } from 'next';
import Link from 'next/link';
import LandingNav from '@/components/landing/new-landing/LandingNav';
import LandingFooter from '@/components/landing/new-landing/LandingFooter';

export const metadata: Metadata = {
  title: 'Política de Uso — Lookitry',
  description: 'Lineamientos de uso permitido del probador virtual y la plataforma Lookitry.',
};

export default function PoliticaUsoPage() {
  return (
    <>
      <LandingNav />
      <main className="min-h-screen bg-[#030303]">
        <section className="px-6 md:px-8 py-16 md:py-24 border-b border-[#1a1a1a]">
          <div className="max-w-5xl mx-auto">
            <p className="text-[11px] font-semibold tracking-[0.12em] uppercase text-[#FF5C3A] mb-3">Legal</p>
            <h1 className="font-jakarta font-bold text-3xl md:text-5xl text-white tracking-tight">
              Política de uso
            </h1>
            <p className="text-[#999] text-sm md:text-base mt-3 max-w-3xl">
              Lineamientos para uso responsable del probador virtual en web, campañas y canales de venta.
            </p>
          </div>
        </section>

        <section className="px-6 md:px-8 py-12 md:py-16">
          <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="rounded-3xl border border-[#2a2a2a] bg-[#111] p-6 text-sm text-[#bbb]">
              <p className="text-[#FF5C3A] text-[11px] uppercase tracking-wider font-semibold mb-3">Permitido</p>
              <ul className="space-y-2 list-disc pl-4">
                <li>Uso comercial legítimo en tiendas o marcas autorizadas.</li>
                <li>Uso de imágenes con consentimiento del titular.</li>
                <li>Integración del widget respetando esta política y términos.</li>
              </ul>
            </div>
            <div className="rounded-3xl border border-[#2a2a2a] bg-[#111] p-6 text-sm text-[#bbb]">
              <p className="text-[#FF5C3A] text-[11px] uppercase tracking-wider font-semibold mb-3">No permitido</p>
              <ul className="space-y-2 list-disc pl-4">
                <li>Suplantación de identidad o contenido ilícito.</li>
                <li>Uso fraudulento de pagos, API o automatizaciones abusivas.</li>
                <li>Intentos de vulneración técnica o extracción no autorizada.</li>
              </ul>
            </div>
            <div className="rounded-3xl border border-[#2a2a2a] bg-[#111] p-6 md:col-span-2 text-sm text-[#bbb]">
              <p>Lookitry puede suspender cuentas ante incumplimientos graves o reiterados para proteger a usuarios y marcas.</p>
              <p className="pt-3">
              Para términos completos, consulta{' '}
              <Link href="/terminos" className="text-[#FF5C3A] hover:underline">Términos y Condiciones</Link>.
            </p>
            </div>
          </div>
        </section>
      </main>
      <LandingFooter />
    </>
  );
}
