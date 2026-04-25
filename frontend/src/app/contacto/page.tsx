import type { Metadata } from 'next';
import LandingNav from '@/components/landing/LandingNav';
import LandingFooter from '@/components/landing/LandingFooter';
import { ContactCards } from '@/components/landing/ContactCards';

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
        <section className="px-6 md:px-8 py-16 md:py-24 border-b border-[#1a1a1a]">
          <div className="max-w-5xl mx-auto">
            <p className="text-[11px] font-semibold tracking-[0.12em] uppercase text-[#FF5C3A] mb-3">Contacto</p>
            <h1 className="font-jakarta font-bold text-3xl md:text-5xl text-white tracking-tight mb-3">
              Te ayudamos a vender mas con Lookitry
            </h1>
            <p className="text-[#999] text-sm md:text-base max-w-3xl">
              Equipo comercial y tecnico para activacion, integracion y optimizacion del probador virtual.
            </p>
          </div>
        </section>

        <section className="px-6 md:px-8 py-12 md:py-16">
          <ContactCards />
        </section>
      </main>
      <LandingFooter />
    </div>
  );
}
