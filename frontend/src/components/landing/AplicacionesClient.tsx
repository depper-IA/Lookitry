'use client';

import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { LandingNav } from '@/components/landing/LandingNav';
import { LandingFooter } from '@/components/landing/LandingFooter';

const BEFORE_AFTER = {
  before: 'https://wilkiedevs.com/wp-content/uploads/2026/03/casco.png',
  after: 'https://minio.wilkiedevs.com/images/products/1774477727989-7b3e3dea5307.jpeg',
};

const SALES_BLOCKS = [
  {
    eyebrow: 'Convierte mejor',
    title: 'Tu cliente entiende el producto al instante',
    body: 'Cuando el antes y después se ve claro, hay menos duda, más atención y una decisión de compra mucho más rápida.',
  },
  {
    eyebrow: 'Vende en más canales',
    title: 'Usa la misma experiencia en tienda, landing y campañas',
    body: 'Lookitry te ayuda a presentar mejor tu catálogo en tu web, en una mini-landing y en flujos comerciales donde cada clic cuenta.',
  },
  {
    eyebrow: 'Escala con más valor',
    title: 'Empieza simple y evoluciona a una experiencia premium',
    body: 'Puedes arrancar con lo esencial y luego sumar mini-landing, integraciones y una presentación más fuerte según el plan que elijas.',
  },
];

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
              Casos de uso
            </motion.p>
            <motion.h1
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.08 }}
              className="font-jakarta text-3xl font-bold leading-tight tracking-tight text-white md:text-5xl"
            >
              Convierte tu catálogo en una experiencia que vende más
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.16 }}
              className="mt-4 max-w-3xl text-sm leading-relaxed text-[#999] md:text-base"
            >
              Lookitry hace que tus productos se entiendan más rápido, se vean más deseables y generen más intención de compra
              desde el primer vistazo.
            </motion.p>
          </div>
        </section>

        <section className="px-6 py-12 md:px-8 md:py-16">
          <div className="mx-auto max-w-6xl space-y-8">
            <motion.div
              initial={{ opacity: 0, y: 14 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              className="overflow-hidden rounded-[2rem] border border-[#2a2a2a] bg-[#111] p-6 md:rounded-[2.5rem] md:p-8"
            >
              <div className="mb-8 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
                <div className="max-w-2xl">
                  <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-[#FF5C3A]">Prueba visual real</p>
                  <h2 className="font-jakarta text-2xl font-bold leading-none tracking-tight text-white md:text-4xl">
                    Haz visible el cambio. Haz más fácil la compra.
                  </h2>
                  <p className="mt-4 text-sm leading-relaxed text-[#a1a1a1] md:text-base">
                    Una comparación directa comunica mejor el valor del producto: foto original a un lado, resultado con Lookitry al otro.
                    Menos fricción para entenderlo, más claridad para avanzar.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3 md:gap-4">
                  <div className="rounded-2xl border border-[#242424] bg-[#0b0b0b] px-4 py-3">
                    <p className="text-[10px] uppercase tracking-[0.14em] text-[#6f6f6f]">Antes</p>
                    <p className="mt-1 text-sm font-semibold text-white">Foto original</p>
                  </div>
                  <div className="rounded-2xl border border-[#FF5C3A]/20 bg-[#FF5C3A]/8 px-4 py-3">
                    <p className="text-[10px] uppercase tracking-[0.14em] text-[#ff9a84]">Después</p>
                    <p className="mt-1 text-sm font-semibold text-white">Resultado con Lookitry</p>
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
                    <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#FF5C3A]">Por qué ayuda a vender</p>
                    <div className="mt-5 space-y-4">
                      <div>
                        <p className="text-sm font-semibold text-white">Menos duda antes de comprar</p>
                        <p className="mt-1 text-sm leading-relaxed text-[#a1a1a1]">
                          El visitante entiende rápido cómo se vería el producto y necesita menos esfuerzo para imaginarlo en uso real.
                        </p>
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-white">Más confianza visual</p>
                        <p className="mt-1 text-sm leading-relaxed text-[#a1a1a1]">
                          La propuesta del SaaS queda clara en segundos: entrada real, procesamiento y salida lista para convertir.
                        </p>
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-white">Más intención de acción</p>
                        <p className="mt-1 text-sm leading-relaxed text-[#a1a1a1]">
                          La comparación directa funciona especialmente bien en móvil, donde cada segundo de atención vale oro.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-8 space-y-3">
                    <Link
                      href="/checkout"
                      className="inline-flex w-full items-center justify-center rounded-2xl bg-[#FF5C3A] px-5 py-4 text-[11px] font-semibold uppercase tracking-[0.12em] text-white transition-colors hover:bg-[#ff714f]"
                    >
                      Quiero usar Lookitry
                    </Link>
                    <Link
                      href="/registro-pro"
                      className="inline-flex w-full items-center justify-center rounded-2xl border border-[#2a2a2a] bg-[#111] px-5 py-4 text-[11px] font-semibold uppercase tracking-[0.12em] text-white transition-colors hover:border-[#FF5C3A]/40"
                    >
                      Empezar con mi marca
                    </Link>
                  </div>
                </div>
              </div>
            </motion.div>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1.1fr_0.9fr]">
              <motion.section
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.25 }}
                className="rounded-[2.5rem] border border-[#2a2a2a] bg-[#0c0c0c] p-7 md:p-8"
              >
                <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#FF5C3A]">Lo que compras en realidad</p>
                <h3 className="mt-3 font-jakarta text-2xl font-bold leading-tight text-white md:text-3xl">
                  Una experiencia que hace ver tu catálogo más deseable
                </h3>
                <div className="mt-8 space-y-6">
                  {SALES_BLOCKS.map((item) => (
                    <div key={item.title} className="rounded-[1.75rem] border border-[#1f1f1f] bg-[#101010] p-5">
                      <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#ff9a84]">{item.eyebrow}</p>
                      <h4 className="mt-2 text-lg font-semibold text-white">{item.title}</h4>
                      <p className="mt-2 text-sm leading-relaxed text-[#b6b6b6]">{item.body}</p>
                    </div>
                  ))}
                </div>
              </motion.section>

              <motion.section
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.25 }}
                transition={{ delay: 0.05 }}
                className="rounded-[2.5rem] border border-[#FF5C3A]/20 bg-[linear-gradient(180deg,rgba(255,92,58,0.12),rgba(8,8,8,0.96))] p-7 md:p-8"
              >
                <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#ffd0c5]">Pensado para crecer</p>
                <h3 className="mt-3 font-jakarta text-2xl font-bold leading-tight text-white md:text-3xl">
                  Empieza con el paquete que mejor se ajuste a tu etapa
                </h3>
                <div className="mt-8 space-y-4">
                  <div className="rounded-[1.5rem] border border-white/10 bg-black/20 p-5">
                    <p className="text-sm font-semibold text-white">Para marcas que quieren validar rápido</p>
                    <p className="mt-2 text-sm leading-relaxed text-[#f1d4cd]">
                      Usa tu probador para mostrar productos, captar atención y empezar a vender sin una integración compleja.
                    </p>
                  </div>
                  <div className="rounded-[1.5rem] border border-white/10 bg-black/20 p-5">
                    <p className="text-sm font-semibold text-white">Para tiendas que quieren una experiencia más premium</p>
                    <p className="mt-2 text-sm leading-relaxed text-[#f1d4cd]">
                      Suma mini-landing, integraciones y una presentación más fuerte para campañas, tráfico y conversión.
                    </p>
                  </div>
                </div>
                <div className="mt-8 space-y-3">
                  <Link
                    href="/checkout"
                    className="inline-flex w-full items-center justify-center rounded-2xl bg-white px-5 py-4 text-[11px] font-semibold uppercase tracking-[0.12em] text-black transition-colors hover:bg-[#f6eae6]"
                  >
                    Ver planes disponibles
                  </Link>
                  <p className="text-center text-xs text-[#ffd8cf]">
                    Activa tu marca, muestra tu catálogo y convierte visitas en decisiones de compra.
                  </p>
                </div>
              </motion.section>
            </div>
          </div>
        </section>
      </main>
      <LandingFooter />
    </>
  );
}
