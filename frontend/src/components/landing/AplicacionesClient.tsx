'use client';

import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { LandingNav } from '@/components/landing/LandingNav';
import { LandingFooter } from '@/components/landing/LandingFooter';

const EXAMPLES = [
  {
    id: '01',
    category: 'Accesorios / Cascos',
    product: 'Casco multi-modular Harley-Davidson',
    imageUrl: 'https://minio.wilkiedevs.com/images/products/1774477727989-7b3e3dea5307.jpeg',
    objectPosition: '50% 45%',
    insight: 'Ideal para e-commerce de motos: sube la claridad visual en productos de ticket alto.',
  },
  {
    id: '02',
    category: 'Calzado',
    product: 'Zapatos Nike personalizados',
    imageUrl: 'https://minio.wilkiedevs.com/images/products/1773627362926-33a6a22727dd.jpg',
    objectPosition: '50% 52%',
    insight: 'Funciona muy bien para colecciones de temporada y campañas de performance.',
  },
  {
    id: '03',
    category: 'Vestidos',
    product: 'Vestido rojo',
    imageUrl: 'https://minio.wilkiedevs.com/images/products/1773768807203-a4775afc208f.jpg',
    objectPosition: '50% 30%',
    insight: 'Ayuda a visualizar mejor caída, color y proporción antes de comprar.',
  },
  {
    id: '04',
    category: 'Franelas / Camisas',
    product: 'Camisa casual',
    imageUrl: 'https://minio.wilkiedevs.com/images/products/1773989501191-3c89617934de.jpeg',
    objectPosition: '50% 36%',
    insight: 'Muy útil para catálogos de alta rotación y ventas asistidas por WhatsApp.',
  },
];

const BEFORE_AFTER = {
  before: 'https://wilkiedevs.com/wp-content/uploads/2026/03/casco.png',
  after: 'https://minio.wilkiedevs.com/images/products/1774477727989-7b3e3dea5307.jpeg',
};

export function AplicacionesClient() {
  return (
    <>
      <LandingNav />
      <main className="min-h-screen bg-[#030303]">
        <section className="border-b border-[#1a1a1a] px-6 py-16 md:px-8 md:py-24">
          <div className="mx-auto max-w-6xl">
            <motion.p
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-4 text-[11px] font-semibold uppercase tracking-[0.12em] text-[#FF5C3A]"
            >
              Ejemplos reales
            </motion.p>
            <motion.h1
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.08 }}
              className="font-jakarta text-3xl font-bold leading-tight tracking-tight text-white md:text-5xl"
            >
              Aplicaciones reales de Lookitry
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.16 }}
              className="mt-4 max-w-3xl text-sm text-[#999] md:text-base"
            >
              Muestras verificadas a partir de generaciones reales. La idea no es solo mostrar IA: es mostrar una prueba visual
              inmediata que retenga más, reduzca dudas y acerque la compra.
            </motion.p>
          </div>
        </section>

        <section className="px-6 py-12 md:px-8 md:py-16">
          <div className="mx-auto max-w-6xl">
            <motion.div
              initial={{ opacity: 0, y: 14 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              className="mb-8 overflow-hidden rounded-[2rem] border border-[#2a2a2a] bg-[#111] p-6 md:rounded-[2.5rem] md:p-8"
            >
              <div className="mb-8 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
                <div className="max-w-2xl">
                  <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-[#FF5C3A]">Antes y después real</p>
                  <h2 className="font-jakarta text-2xl font-bold leading-none tracking-tight text-white md:text-4xl">
                    El valor se entiende mejor cuando se ve completo
                  </h2>
                  <p className="mt-4 text-sm leading-relaxed text-[#a1a1a1] md:text-base">
                    Quitamos el slider y lo reemplazamos por una comparación directa. Así el visitante entiende de inmediato
                    cuál es la foto original y cuál es el resultado generado con Lookitry, sin interacción extra ni fricción.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3 md:gap-4">
                  <div className="rounded-2xl border border-[#242424] bg-[#0b0b0b] px-4 py-3">
                    <p className="text-[10px] uppercase tracking-[0.14em] text-[#6f6f6f]">Antes</p>
                    <p className="mt-1 text-sm font-semibold text-white">Foto original</p>
                  </div>
                  <div className="rounded-2xl border border-[#FF5C3A]/20 bg-[#FF5C3A]/8 px-4 py-3">
                    <p className="text-[10px] uppercase tracking-[0.14em] text-[#ff9a84]">Después</p>
                    <p className="mt-1 text-sm font-semibold text-white">Resultado con IA</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-5 md:gap-6 lg:grid-cols-[1.05fr_1.05fr_0.82fr]">
                <div className="overflow-hidden rounded-[1.75rem] border border-[#242424] bg-[#0b0b0b]">
                  <div className="flex items-center justify-between border-b border-[#1d1d1d] px-4 py-4 md:px-5">
                    <div>
                      <p className="text-[10px] uppercase tracking-[0.14em] text-[#7a7a7a]">Antes</p>
                      <p className="mt-1 text-sm font-semibold text-white">Foto real del cliente</p>
                    </div>
                    <span className="rounded-full border border-white/10 bg-black/50 px-2.5 py-1 text-[10px] uppercase tracking-[0.12em] text-white">
                      Entrada
                    </span>
                  </div>
                  <div className="relative aspect-[4/5] md:aspect-[5/6]">
                    <Image
                      src={BEFORE_AFTER.before}
                      alt="Foto real antes del try-on"
                      fill
                      className="object-cover"
                      sizes="(max-width: 1024px) 100vw, 40vw"
                    />
                  </div>
                </div>

                <div className="overflow-hidden rounded-[1.75rem] border border-[#FF5C3A]/20 bg-[#120c0a] shadow-[0_0_0_1px_rgba(255,92,58,0.06)]">
                  <div className="flex items-center justify-between border-b border-[#2a1b16] px-4 py-4 md:px-5">
                    <div>
                      <p className="text-[10px] uppercase tracking-[0.14em] text-[#ff9a84]">Después</p>
                      <p className="mt-1 text-sm font-semibold text-white">Resultado generado por Lookitry</p>
                    </div>
                    <span className="rounded-full bg-[#FF5C3A] px-2.5 py-1 text-[10px] uppercase tracking-[0.12em] text-white">
                      Salida
                    </span>
                  </div>
                  <div className="relative aspect-[4/5] md:aspect-[5/6]">
                    <Image
                      src={BEFORE_AFTER.after}
                      alt="Foto después del try-on con Lookitry"
                      fill
                      className="object-cover"
                      sizes="(max-width: 1024px) 100vw, 40vw"
                    />
                  </div>
                </div>

                <div className="flex flex-col justify-between rounded-[1.75rem] border border-[#242424] bg-[#0b0b0b] p-5 md:p-6">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#FF5C3A]">Por qué retiene más</p>
                    <div className="mt-5 space-y-4">
                      <div>
                        <p className="text-sm font-semibold text-white">Menos incertidumbre</p>
                        <p className="mt-1 text-sm leading-relaxed text-[#a1a1a1]">
                          El visitante entiende el beneficio en segundos y no necesita descubrirlo con una interacción extra.
                        </p>
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-white">Más claridad comercial</p>
                        <p className="mt-1 text-sm leading-relaxed text-[#a1a1a1]">
                          La promesa del SaaS queda visible: foto real, procesamiento y resultado final.
                        </p>
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-white">Más intención de compra</p>
                        <p className="mt-1 text-sm leading-relaxed text-[#a1a1a1]">
                          La comparación estática favorece lectura rápida en móvil y mejora el entendimiento del producto.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-8 space-y-3">
                    <Link
                      href="/checkout"
                      className="inline-flex w-full items-center justify-center rounded-2xl bg-[#FF5C3A] px-5 py-4 text-[11px] font-semibold uppercase tracking-[0.12em] text-white transition-colors hover:bg-[#ff714f]"
                    >
                      Probar Lookitry ahora
                    </Link>
                    <Link
                      href="/dashboard/integrations/docs"
                      className="inline-flex w-full items-center justify-center rounded-2xl border border-[#2a2a2a] bg-[#111] px-5 py-4 text-[11px] font-semibold uppercase tracking-[0.12em] text-white transition-colors hover:border-[#FF5C3A]/40"
                    >
                      Ver documentación
                    </Link>
                  </div>
                </div>
              </div>
            </motion.div>

            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              {EXAMPLES.map((item, idx) => (
                <motion.article
                  key={item.id}
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.25 }}
                  transition={{ delay: idx * 0.06 }}
                  whileHover={{ y: -4 }}
                  className="overflow-hidden rounded-3xl border border-[#2a2a2a] bg-[#111] shadow-xl shadow-black/20 transition-colors hover:border-[#FF5C3A]/40"
                >
                  <div className="relative aspect-[4/3] w-full bg-[#0d0d0d] md:aspect-[3/4]">
                    <Image
                      src={item.imageUrl}
                      alt={item.product}
                      fill
                      className="object-cover"
                      style={{ objectPosition: item.objectPosition }}
                      sizes="(max-width: 768px) 100vw, 50vw"
                    />
                    <div className="absolute left-4 top-4 rounded-full bg-[#FF5C3A] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-white">
                      Caso {item.id}
                    </div>
                  </div>
                  <div className="p-6">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#FF5C3A]">{item.category}</p>
                    <h2 className="mt-1 font-jakarta text-lg font-semibold text-white">{item.product}</h2>
                    <p className="mt-3 text-sm leading-relaxed text-[#bbb]">{item.insight}</p>
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
