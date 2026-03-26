import type { Metadata } from 'next';
import Link from 'next/link';
import { LandingNav } from '@/components/landing/LandingNav';
import { LandingFooter } from '@/components/landing/LandingFooter';

export const metadata: Metadata = {
  title: 'Política de Uso — Lookitry',
  description: 'Lineamientos de uso permitido del probador virtual y la plataforma Lookitry.',
};

export default function PoliticaUsoPage() {
  return (
    <>
      <LandingNav />
      <main className="min-h-screen bg-[#f5f2ee]">
        <section className="bg-[#0a0a0a] px-6 md:px-8 py-14 md:py-20">
          <div className="max-w-3xl mx-auto">
            <p className="text-[11px] font-medium tracking-[.1em] uppercase text-[#FF5C3A] mb-3">Legal</p>
            <h1 className="font-syne font-extrabold text-3xl md:text-4xl text-white tracking-tight">
              Política de uso
            </h1>
          </div>
        </section>
        <section className="px-6 md:px-8 py-12 md:py-16">
          <div className="max-w-3xl mx-auto bg-white border border-[#e8e4df] rounded-2xl p-6 md:p-8 space-y-4 text-sm text-[#555]">
            <p>Lookitry debe usarse solo para fines comerciales legítimos y conforme a la ley.</p>
            <p>Está prohibido subir contenido ilícito, suplantar identidad o vulnerar derechos de terceros.</p>
            <p>Las imágenes subidas por usuarios finales deben contar con autorización de uso por parte del titular.</p>
            <p>Lookitry puede suspender cuentas con uso abusivo, fraude o intentos de explotación técnica de la plataforma.</p>
            <p className="pt-2">
              Para términos completos, consulta{' '}
              <Link href="/terminos" className="text-[#FF5C3A] hover:underline">Términos y Condiciones</Link>.
            </p>
          </div>
        </section>
      </main>
      <LandingFooter />
    </>
  );
}
