import type { Metadata } from 'next';
import { LandingNav } from '@/components/landing/LandingNav';
import { LandingFooter } from '@/components/landing/LandingFooter';

export const metadata: Metadata = {
  title: 'Política de Cookies — Lookitry',
  description: 'Uso de cookies y tecnologías similares en Lookitry.',
};

export default function CookiesPage() {
  return (
    <>
      <LandingNav />
      <main className="min-h-screen bg-[#f5f2ee]">
        <section className="bg-[#0a0a0a] px-6 md:px-8 py-14 md:py-20">
          <div className="max-w-3xl mx-auto">
            <p className="text-[11px] font-medium tracking-[.1em] uppercase text-[#FF5C3A] mb-3">Legal</p>
            <h1 className="font-syne font-extrabold text-3xl md:text-4xl text-white tracking-tight">
              Política de cookies
            </h1>
          </div>
        </section>
        <section className="px-6 md:px-8 py-12 md:py-16">
          <div className="max-w-3xl mx-auto bg-white border border-[#e8e4df] rounded-2xl p-6 md:p-8 space-y-4 text-sm text-[#555]">
            <p>Usamos cookies técnicas necesarias para autenticación, seguridad y preferencias básicas del sitio.</p>
            <p>No usamos cookies de publicidad invasiva ni vendemos datos de navegación a terceros.</p>
            <p>Puedes gestionar o bloquear cookies desde la configuración de tu navegador.</p>
          </div>
        </section>
      </main>
      <LandingFooter />
    </>
  );
}
