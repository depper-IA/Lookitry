'use client';

import Image from 'next/image';
import { motion } from 'framer-motion';
import { useState } from 'react';
import { LandingNav } from '@/components/landing/LandingNav';
import { LandingFooter } from '@/components/landing/LandingFooter';

const EXAMPLES = [
  {
    id: '01',
    category: 'Accesorios / Cascos',
    product: 'Casco multi-modular Harley-Davidson',
    imageUrl: 'https://minio.wilkiedevs.com/images/products/1774477727989-7b3e3dea5307.jpeg',
    objectPosition: '50% 45%',
    insight: 'Ideal para e-commerce de motos: mejora intención de compra en productos de mayor ticket.',
  },
  {
    id: '02',
    category: 'Calzado',
    product: 'Zapatos Nike Personalizados',
    imageUrl: 'https://minio.wilkiedevs.com/images/products/1773627362926-33a6a22727dd.jpg',
    objectPosition: '50% 52%',
    insight: 'Perfecto para colecciones de temporada y campañas de performance.',
  },
  {
    id: '03',
    category: 'Vestidos',
    product: 'Vestido sexy Rojo',
    imageUrl: 'https://minio.wilkiedevs.com/images/products/1773768807203-a4775afc208f.jpg',
    objectPosition: '50% 30%',
    insight: 'Mayor confianza visual antes de comprar: mejor contexto de caída, color y proporción.',
  },
  {
    id: '04',
    category: 'Franelas / Camisas',
    product: 'Camisa',
    imageUrl: 'https://minio.wilkiedevs.com/images/products/1773989501191-3c89617934de.jpeg',
    objectPosition: '50% 36%',
    insight: 'Útil para catálogos de alta rotación y ventas por WhatsApp.',
  },
];

const BEFORE_AFTER = {
  before: 'https://wilkiedevs.com/wp-content/uploads/2026/03/casco.png',
  after: 'https://minio.wilkiedevs.com/images/products/1774477727989-7b3e3dea5307.jpeg',
};

export function AplicacionesClient() {
  const [split, setSplit] = useState(50);

  return (
    <>
      <LandingNav />
      <main className="min-h-screen bg-[#030303]">
        <section className="px-6 md:px-8 py-16 md:py-24 border-b border-[#1a1a1a]">
          <div className="max-w-6xl mx-auto">
            <motion.p
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-[11px] tracking-[0.12em] uppercase text-[#FF5C3A] font-semibold mb-4"
            >
              Ejemplos reales
            </motion.p>
            <motion.h1
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.08 }}
              className="text-white text-3xl md:text-5xl font-jakarta font-bold tracking-tight leading-tight"
            >
              Aplicaciones reales de Lookitry
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.16 }}
              className="text-[#999] text-sm md:text-base max-w-3xl mt-4"
            >
              Muestras verificadas en base de datos de generaciones exitosas. Ajustamos el encuadre para mostrar mejor rostro y cuerpo completo según cada categoría.
            </motion.p>
          </div>
        </section>

        <section className="px-6 md:px-8 py-12 md:py-16">
          <div className="max-w-6xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 14 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              className="rounded-3xl border border-[#2a2a2a] bg-[#111] p-5 md:p-7 mb-8"
            >
              <div className="flex items-center justify-between gap-4 mb-4">
                <p className="text-[#FF5C3A] text-[11px] tracking-[0.12em] uppercase font-semibold">Antes / Después</p>
                <p className="text-[#999] text-xs">Desliza para comparar</p>
              </div>
              <div className="relative rounded-2xl overflow-hidden border border-[#242424] bg-[#0b0b0b] aspect-[16/9] md:aspect-[21/9]">
                <Image src={BEFORE_AFTER.before} alt="Antes" fill className="object-cover" sizes="100vw" />
                <div className="absolute inset-y-0 left-0 overflow-hidden" style={{ width: `${split}%` }}>
                  <Image src={BEFORE_AFTER.after} alt="Después" fill className="object-cover" sizes="100vw" />
                </div>
                <div className="absolute inset-y-0" style={{ left: `${split}%` }}>
                  <div className="h-full w-[2px] bg-white/90" />
                  <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-[#FF5C3A] border border-white/30 shadow-lg" />
                </div>
                <span className="absolute top-3 left-3 text-[10px] uppercase tracking-wider px-2 py-1 rounded-full bg-black/60 text-white">Antes</span>
                <span className="absolute top-3 right-3 text-[10px] uppercase tracking-wider px-2 py-1 rounded-full bg-[#FF5C3A]/90 text-white">Después</span>
              </div>
              <input
                type="range"
                min={10}
                max={90}
                value={split}
                onChange={(e) => setSplit(Number(e.target.value))}
                className="w-full mt-4 accent-[#FF5C3A] cursor-pointer"
                aria-label="Control de comparación antes y después"
              />
            </motion.div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {EXAMPLES.map((item, idx) => (
                <motion.article
                  key={item.id}
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.25 }}
                  transition={{ delay: idx * 0.06 }}
                  whileHover={{ y: -4 }}
                  className="rounded-3xl border border-[#2a2a2a] bg-[#111] overflow-hidden shadow-xl shadow-black/20 hover:border-[#FF5C3A]/40 transition-colors"
                >
                  <div className="relative w-full aspect-[4/3] md:aspect-[3/4] bg-[#0d0d0d]">
                    <Image
                      src={item.imageUrl}
                      alt={item.product}
                      fill
                      className="object-cover"
                      style={{ objectPosition: item.objectPosition }}
                      sizes="(max-width: 768px) 100vw, 50vw"
                    />
                    <div className="absolute top-4 left-4 text-[10px] font-semibold tracking-[0.12em] uppercase px-2.5 py-1 rounded-full bg-[#FF5C3A] text-white">
                      Caso {item.id}
                    </div>
                  </div>
                  <div className="p-6">
                    <p className="text-[#FF5C3A] text-[11px] tracking-[0.08em] uppercase font-semibold">{item.category}</p>
                    <h2 className="text-white text-lg font-jakarta font-semibold mt-1">{item.product}</h2>
                    <p className="text-[#bbb] text-sm mt-3 leading-relaxed">{item.insight}</p>
                  </div>
                </motion.article>
              ))}
            </div>
          </div>
        </section>
      </main>
      <LandingFooter />
    </>
  );
}
