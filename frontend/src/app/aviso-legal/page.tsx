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
      <main className="min-h-screen bg-[#f5f2ee]">
        <section className="bg-[#0a0a0a] px-6 md:px-8 py-14 md:py-20">
          <div className="max-w-3xl mx-auto">
            <p className="text-[11px] font-medium tracking-[.1em] uppercase text-[#FF5C3A] mb-3">Legal</p>
            <h1 className="font-syne font-extrabold text-3xl md:text-4xl text-white tracking-tight">
              Aviso legal
            </h1>
          </div>
        </section>
        <section className="px-6 md:px-8 py-12 md:py-16">
          <div className="max-w-3xl mx-auto bg-white border border-[#e8e4df] rounded-2xl p-6 md:p-8 space-y-3 text-sm text-[#555]">
            <p><strong className="text-[#0a0a0a]">Razón social:</strong> Wilkie Devs SAS</p>
            <p><strong className="text-[#0a0a0a]">Marca comercial:</strong> Lookitry</p>
            <p><strong className="text-[#0a0a0a]">País:</strong> Colombia</p>
            <p><strong className="text-[#0a0a0a]">Email:</strong> info@lookitry.com</p>
            <p><strong className="text-[#0a0a0a]">WhatsApp:</strong> +57 310 543 6281</p>
          </div>
        </section>
      </main>
      <LandingFooter />
    </>
  );
}
