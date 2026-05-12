import type { Metadata } from 'next';
import LandingNav from '@/components/landing/LandingNav';
import LandingFooter from '@/components/landing/LandingFooter';
import ContactoClient from './ContactoClient';
import HeroStatsClient from './HeroStatsClient';

const BASE_URL = 'https://lookitry.com';

export const metadata: Metadata = {
  title: 'Contacto - Lookitry',
  description: 'Canales de contacto y soporte comercial de Lookitry.',
  alternates: { canonical: `${BASE_URL}/contacto` },
};

export default function ContactoPage() {
  return (
    <div className="overflow-x-clip">
      <LandingNav />
      <main className="min-h-screen bg-[#030303]">
        {/* Hero Section with Stats */}
        <section className="px-6 md:px-8 pt-16 pb-12">
          <div className="max-w-5xl mx-auto">
            <p className="text-[11px] font-semibold tracking-[0.12em] uppercase text-[#FF5C3A] mb-3 text-center">
              Contacto
            </p>
            <h1 className="font-jakarta font-bold text-3xl md:text-5xl text-white tracking-tight mb-4 text-center">
              Te ayudamos a vender más con Lookitry
            </h1>
            <p className="text-[#999] text-sm md:text-base max-w-2xl mx-auto text-center mb-8">
              Equipo comercial y técnico para activación, integración y optimización del probador virtual.
            </p>

            {/* Stats Row - Dynamic */}
            <HeroStatsClient />

            {/* Trust Bar */}
            <div className="flex flex-wrap items-center justify-center gap-6 md:gap-8 py-4">
              <div className="flex items-center gap-2 text-white/50">
                <svg className="h-4 w-4 text-[#FF5C3A]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
                <span className="text-xs font-medium">Datos seguros</span>
              </div>
              <div className="flex items-center gap-2 text-white/50">
                <svg className="h-4 w-4 text-[#FF5C3A]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                <span className="text-xs font-medium">Respuesta rápida</span>
              </div>
              <div className="flex items-center gap-2 text-white/50">
                <svg className="h-4 w-4 text-[#FF5C3A]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
                <span className="text-xs font-medium">Soporte dedicado</span>
              </div>
            </div>
          </div>
        </section>

        {/* Main Content - 2 Column Layout */}
        <section className="px-6 md:px-8 py-12 md:py-16">
          <div className="max-w-6xl mx-auto">
            <ContactoClient />
          </div>
        </section>
      </main>
      <LandingFooter />
    </div>
  );
}