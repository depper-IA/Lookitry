import type { Metadata } from 'next';
import { LandingNav } from '@/components/landing/LandingNav';
import { LandingFooter } from '@/components/landing/LandingFooter';

export const metadata: Metadata = {
  title: 'Aviso Legal — Lookitry',
  description: 'Información legal y societaria de Lookitry.',
};

export default function AvisoLegalPage() {
  return (
    <>
      <LandingNav />
      <main className="min-h-screen bg-[#030303]">
        <section className="px-6 md:px-8 py-16 md:py-24 border-b border-[#1a1a1a]">
          <div className="max-w-5xl mx-auto">
            <p className="text-[11px] font-semibold tracking-[0.12em] uppercase text-[#FF5C3A] mb-3">Legal</p>
            <h1 className="font-jakarta font-bold text-3xl md:text-5xl text-white tracking-tight">
              Aviso legal
            </h1>
            <p className="text-[#999] text-sm md:text-base mt-3 max-w-3xl">
              Información de titularidad, responsabilidad y contacto legal de la plataforma.
            </p>
          </div>
        </section>

        <section className="px-6 md:px-8 py-12 md:py-16">
          <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="rounded-3xl border border-[#2a2a2a] bg-[#111] p-6 space-y-2 text-sm text-[#bbb]">
              <p><strong className="text-white">Razón social:</strong> Wilkie Devs SAS</p>
              <p><strong className="text-white">Marca comercial:</strong> Lookitry</p>
              <p><strong className="text-white">País:</strong> Colombia</p>
            </div>
            <div className="rounded-3xl border border-[#2a2a2a] bg-[#111] p-6 space-y-2 text-sm text-[#bbb]">
              <p><strong className="text-white">Email legal:</strong> info@lookitry.com</p>
              <p><strong className="text-white">WhatsApp:</strong> +57 310 543 6281</p>
              <p><strong className="text-white">Sitio:</strong> https://lookitry.com</p>
            </div>
          </div>
        </section>
      </main>
      <LandingFooter />
    </>
  );
}
