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
      <main className="min-h-screen bg-[#f5f2ee]">
        <section className="bg-[#0a0a0a] px-6 md:px-8 py-14 md:py-20">
          <div className="max-w-3xl mx-auto">
            <p className="text-[11px] font-medium tracking-[.1em] uppercase text-[#FF5C3A] mb-3">Contacto</p>
            <h1 className="font-syne font-extrabold text-3xl md:text-4xl text-white tracking-tight mb-3">
              Hablemos de tu tienda
            </h1>
            <p className="text-[#777] text-sm">Soporte comercial y técnico en horario Colombia.</p>
          </div>
        </section>
        <section className="px-6 md:px-8 py-12 md:py-16">
          <div className="max-w-3xl mx-auto grid gap-4">
            <a href="mailto:info@lookitry.com" className="bg-white border border-[#e8e4df] rounded-2xl p-6">
              <p className="text-sm font-semibold text-[#0a0a0a]">Email</p>
              <p className="text-[#666] text-sm mt-1">info@lookitry.com</p>
            </a>
            <a href="https://wa.me/573105436281" className="bg-white border border-[#e8e4df] rounded-2xl p-6">
              <p className="text-sm font-semibold text-[#0a0a0a]">WhatsApp</p>
              <p className="text-[#666] text-sm mt-1">+57 310 543 6281</p>
            </a>
            <div className="bg-white border border-[#e8e4df] rounded-2xl p-6">
              <p className="text-sm font-semibold text-[#0a0a0a]">Horario de atención</p>
              <p className="text-[#666] text-sm mt-1">Lunes a viernes, 9:00 a.m. - 6:00 p.m. (COL)</p>
            </div>
          </div>
        </section>
      </main>
      <LandingFooter />
    </>
  );
}
