import type { Metadata } from 'next';
import Image from 'next/image';
import { LandingNav } from '@/components/landing/LandingNav';
import { LandingFooter } from '@/components/landing/LandingFooter';

export const metadata: Metadata = {
  title: 'Aplicaciones Reales — Lookitry',
  description: 'Ejemplos reales de categorías que ya usan el probador virtual de Lookitry.',
};

const EXAMPLES = [
  {
    id: '01',
    category: 'Accesorios / Cascos',
    product: 'Casco multi-modular Harley-Davidson',
    imageUrl: 'https://minio.wilkiedevs.com/images/products/1774477727989-7b3e3dea5307.jpeg',
    insight: 'Ideal para e-commerce de motos: mejora intención de compra en productos de mayor ticket.',
  },
  {
    id: '02',
    category: 'Calzado',
    product: 'Zapatos Nike Personalizados',
    imageUrl: 'https://minio.wilkiedevs.com/images/products/1773991073099-9c21d68dd347.jpeg',
    insight: 'Perfecto para colecciones de temporada y campañas de performance.',
  },
  {
    id: '03',
    category: 'Vestidos',
    product: 'Vestido',
    imageUrl: 'https://minio.wilkiedevs.com/images/products/1773990739465-13d9cdb436dc.jpeg',
    insight: 'Aporta confianza visual para decisiones rápidas desde móvil.',
  },
  {
    id: '04',
    category: 'Franelas / Camisas',
    product: 'Camisa',
    imageUrl: 'https://minio.wilkiedevs.com/images/products/1773989501191-3c89617934de.jpeg',
    insight: 'Útil para catálogos de alta rotación y ventas por WhatsApp.',
  },
];

export default function AplicacionesPage() {
  return (
    <>
      <LandingNav />
      <main className="min-h-screen bg-[#030303]">
        <section className="px-6 md:px-8 py-16 md:py-24 border-b border-[#1a1a1a]">
          <div className="max-w-6xl mx-auto">
            <p className="text-[11px] tracking-[0.12em] uppercase text-[#FF5C3A] font-semibold mb-4">Ejemplos reales</p>
            <h1 className="text-white text-3xl md:text-5xl font-jakarta font-bold tracking-tight leading-tight">
              Aplicaciones reales de Lookitry
            </h1>
            <p className="text-[#999] text-sm md:text-base max-w-3xl mt-4">
              Muestras verificadas en base de datos de generaciones exitosas. Estos ejemplos reflejan categorías activas en uso comercial real.
            </p>
            <p className="text-[#666] text-xs mt-2">Actualizado con evidencia de generaciones exitosas en marzo 2026.</p>
          </div>
        </section>

        <section className="px-6 md:px-8 py-12 md:py-16">
          <div className="max-w-6xl mx-auto grid grid-cols-1 sm:grid-cols-2 gap-6">
            {EXAMPLES.map((item) => (
              <article
                key={item.id}
                className="rounded-3xl border border-[#2a2a2a] bg-[#111] overflow-hidden shadow-xl shadow-black/20 hover:border-[#FF5C3A]/40 transition-colors"
              >
                <div className="relative w-full aspect-[4/3] bg-[#0d0d0d]">
                  <Image src={item.imageUrl} alt={item.product} fill className="object-cover" sizes="(max-width: 768px) 100vw, 50vw" />
                  <div className="absolute top-4 left-4 text-[10px] font-semibold tracking-[0.12em] uppercase px-2.5 py-1 rounded-full bg-[#FF5C3A] text-white">
                    Caso {item.id}
                  </div>
                </div>
                <div className="p-6">
                  <p className="text-[#FF5C3A] text-[11px] tracking-[0.08em] uppercase font-semibold">{item.category}</p>
                  <h2 className="text-white text-lg font-jakarta font-semibold mt-1">{item.product}</h2>
                  <p className="text-[#bbb] text-sm mt-3 leading-relaxed">{item.insight}</p>
                </div>
              </article>
            ))}
          </div>
        </section>
      </main>
      <LandingFooter />
    </>
  );
}
