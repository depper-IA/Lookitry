import type { Metadata } from 'next';
import LandingNav from '@/components/landing/new-landing/LandingNav';
import LandingFooter from '@/components/landing/new-landing/LandingFooter';

export const metadata: Metadata = {
  title: 'Aviso Legal — Lookitry',
  description: 'Información legal y societaria de Lookitry.',
};

export default function AvisoLegalPage() {
  return (
    <div className="overflow-x-clip">
      <LandingNav />
      <main className="min-h-screen theme-bg-base">
        <section className="px-6 md:px-8 py-16 md:py-24 border-b theme-border">
          <div className="max-w-5xl mx-auto">
            <p className="text-[11px] font-semibold tracking-[0.12em] uppercase text-[#FF5C3A] mb-3">Legal</p>
            <h1 className="font-jakarta font-bold text-3xl md:text-5xl theme-text tracking-tight">
              Aviso legal
            </h1>
            <p className="text-sm md:text-base mt-3 max-w-3xl theme-text-muted">
              Información de titularidad, responsabilidad y contacto legal de la plataforma.
            </p>
          </div>
        </section>

        <section className="px-6 md:px-8 py-12 md:py-16">
          <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="rounded-3xl border theme-border theme-bg-card p-6 space-y-2 text-sm theme-text">
              <p><strong className="theme-text">Titular:</strong> Samuel Wilkie</p>
              <p><strong className="theme-text">NIT:</strong> 700.403.166-3 (persona natural)</p>
              <p><strong className="theme-text">Marca:</strong> Wilkie Devs</p>
              <p><strong className="theme-text">Marca comercial:</strong> Lookitry</p>
              <p><strong className="theme-text">País:</strong> Colombia</p>
            </div>
            <div className="rounded-3xl border theme-border theme-bg-card p-6 space-y-2 text-sm theme-text">
              <p><strong className="theme-text">Email legal:</strong> info@lookitry.com</p>
              <p><strong className="theme-text">WhatsApp:</strong> +57 310 543 6281</p>
              <p><strong className="theme-text">Sitio:</strong> https://lookitry.com</p>
            </div>
          </div>
        </section>
      </main>
      <LandingFooter />
    </div>
  );
}
