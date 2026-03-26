import type { Metadata } from 'next';
import { LandingNav } from '@/components/landing/LandingNav';
import { LandingFooter } from '@/components/landing/LandingFooter';

export const metadata: Metadata = {
  title: 'Casos de Éxito — Lookitry',
  description: 'Historias de marcas que venden más con el probador virtual de Lookitry.',
};

const CASES = [
  {
    brand: 'Moda Urbana CO',
    result: '+27% en conversión',
    detail: 'Integró Lookitry en su tienda y redujo la indecisión de compra en productos de temporada.',
  },
  {
    brand: 'Zapatos Nómada',
    result: '+31% en interacción',
    detail: 'Activó el probador en campañas de Instagram y aumentó el tiempo de permanencia en página.',
  },
  {
    brand: 'Luna Accesorios',
    result: '+22% en ventas directas',
    detail: 'Implementó mini-landing con WhatsApp y mejoró la tasa de cierre desde móvil.',
  },
];

export default function CasosExitoPage() {
  return (
    <>
      <LandingNav />
      <main className="min-h-screen bg-[#f5f2ee]">
        <section className="bg-[#0a0a0a] px-6 md:px-8 py-14 md:py-20">
          <div className="max-w-4xl mx-auto">
            <p className="text-[11px] font-medium tracking-[.1em] uppercase text-[#FF5C3A] mb-3">Resultados reales</p>
            <h1 className="font-syne font-extrabold text-3xl md:text-4xl text-white tracking-tight">
              Marcas que ya crecen con Lookitry
            </h1>
          </div>
        </section>
        <section className="px-6 md:px-8 py-12 md:py-16">
          <div className="max-w-4xl mx-auto grid gap-4">
            {CASES.map((c) => (
              <article key={c.brand} className="bg-white border border-[#e8e4df] rounded-2xl p-6">
                <p className="text-[11px] uppercase tracking-wider text-[#FF5C3A] font-semibold">{c.result}</p>
                <h2 className="text-lg font-bold text-[#0a0a0a] mt-1">{c.brand}</h2>
                <p className="text-sm text-[#666] mt-2">{c.detail}</p>
              </article>
            ))}
          </div>
        </section>
      </main>
      <LandingFooter />
    </>
  );
}
