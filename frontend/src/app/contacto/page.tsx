import type { Metadata } from 'next';
import { LandingNav } from '@/components/landing/LandingNav';
import { LandingFooter } from '@/components/landing/LandingFooter';

const BASE_URL = 'https://lookitry.com';

export const metadata: Metadata = {
  title: 'Contacto — Lookitry',
  description: 'Canales de contacto y soporte comercial de Lookitry.',
  alternates: { canonical: `${BASE_URL}/contacto` },
};

export default function ContactoPage() {
  return (
    <>
      <LandingNav />
      <main className="min-h-screen bg-[#030303]">
        <section className="px-6 md:px-8 py-16 md:py-24 border-b border-[#1a1a1a]">
          <div className="max-w-5xl mx-auto">
            <p className="text-[11px] font-semibold tracking-[0.12em] uppercase text-[#FF5C3A] mb-3">Contacto</p>
            <h1 className="font-jakarta font-bold text-3xl md:text-5xl text-white tracking-tight mb-3">
              Te ayudamos a vender más con Lookitry
            </h1>
            <p className="text-[#999] text-sm md:text-base max-w-3xl">
              Equipo comercial y técnico para activación, integración y optimización del probador virtual.
            </p>
          </div>
        </section>

        <section className="px-6 md:px-8 py-12 md:py-16">
          <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-5">
            <a
              href="mailto:info@lookitry.com"
              className="rounded-3xl border border-[#2a2a2a] bg-[#111] p-6 hover:border-[#FF5C3A]/40 transition-colors"
            >
              <p className="text-[11px] uppercase tracking-[0.1em] text-[#FF5C3A] font-semibold">Canal oficial</p>
              <p className="text-white text-lg font-semibold mt-1">Email corporativo</p>
              <p className="text-[#bbb] text-sm mt-2">info@lookitry.com</p>
              <p className="text-[#666] text-xs mt-3">Respuesta típica: menos de 24h hábiles.</p>
            </a>
            <a
              href="https://wa.me/573105436281"
              className="rounded-3xl border border-[#2a2a2a] bg-[#111] p-6 hover:border-[#FF5C3A]/40 transition-colors"
            >
              <p className="text-[11px] uppercase tracking-[0.1em] text-[#FF5C3A] font-semibold">Canal rápido</p>
              <p className="text-white text-lg font-semibold mt-1">WhatsApp de soporte</p>
              <p className="text-[#bbb] text-sm mt-2">+57 310 543 6281</p>
              <p className="text-[#666] text-xs mt-3">Ideal para onboarding e integración inicial.</p>
            </a>
            <div className="rounded-3xl border border-[#2a2a2a] bg-[#111] p-6 md:col-span-2">
              <p className="text-white text-lg font-semibold">Horario y cobertura</p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4">
                <div>
                  <p className="text-[#FF5C3A] text-xs uppercase tracking-wider">Horario COL</p>
                  <p className="text-[#bbb] text-sm mt-1">Lunes a viernes, 9:00 a.m. - 6:00 p.m.</p>
                </div>
                <div>
                  <p className="text-[#FF5C3A] text-xs uppercase tracking-wider">Implementación</p>
                  <p className="text-[#bbb] text-sm mt-1">Activación guiada para Shopify, WooCommerce y HTML.</p>
                </div>
                <div>
                  <p className="text-[#FF5C3A] text-xs uppercase tracking-wider">Soporte técnico</p>
                  <p className="text-[#bbb] text-sm mt-1">Acompañamiento en integración y configuración del widget.</p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
      <LandingFooter />
    </>
  );
}
