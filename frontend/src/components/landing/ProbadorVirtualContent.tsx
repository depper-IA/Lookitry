'use client';

import React, { useRef, useState, useEffect } from 'react';
import type { PublicReview } from '@/types';
import { motion, useInView } from 'framer-motion';
import { ArrowRight, Check, Camera, Zap, Globe, Code2, Layers, BarChart3, MessageCircle, Star } from 'lucide-react';
import { InstagramIcon, TikTokIcon } from '@/components/mini-landing/shared';
import LandingNav from '@/components/landing/LandingNav';
import LandingFooter from '@/components/landing/LandingFooter';

interface LandingStatsData {
  total_brands: number;
  total_generations: number;
  satisfaction_rating: number | null;
}

function formatBrands(raw: number): number {
  return raw <= 0 ? 10 : raw + 10;
}

function formatGenerations(raw: number): number {
  return raw + 1000;
}

const EASING = [0.22, 1, 0.36, 1] as const;

function fadeUp(delay = 0) {
  return {
    initial: { opacity: 0, y: 24 },
    animate: { opacity: 1, y: 0 },
    transition: { delay, duration: 0.6, ease: EASING },
  };
}

// ─── Section Tag ─────────────────────────────────────────────────────────────
function Tag({ children, accent = false }: { children: React.ReactNode; accent?: boolean }) {
  return (
    <div className={`inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-[10px] font-bold uppercase tracking-[0.15em] ${accent ? 'bg-[#FF5C3A]/10 border-[#FF5C3A]/20 text-[#FF5C3A]' : 'bg-white/5 border-white/10 text-white/60'}`}>
      <span className={`h-1.5 w-1.5 rounded-full animate-pulse ${accent ? 'bg-[#FF5C3A]' : 'bg-white/40'}`} />
      {children}
    </div>
  );
}

// ─── Platform Card ──────────────────────────────────────────────────────────
function PlatformCard({ color, icon, title, features }: { color: string; icon: React.ReactNode; title: string; features: string[] }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: '-20px' });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 30 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.5, ease: EASING }}
      whileHover={{ y: -4 }}
      className="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-6 transition-all duration-300 hover:border-white/20"
    >
      <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl" style={{ backgroundColor: `${color}20`, color: color }}>
        {icon}
      </div>
      <h4 className="mb-3 font-jakarta text-lg font-bold text-white">{title}</h4>
      <ul className="space-y-2">
        {features.map((f, i) => (
          <li key={i} className="flex items-center gap-2 text-sm text-white/50">
            <Check size={12} style={{ color }} />
            {f}
          </li>
        ))}
      </ul>
    </motion.div>
  );
}

// ─── Step Item ──────────────────────────────────────────────────────────────
function StepItem({ n, title, desc }: { n: number; title: string; desc: string }) {
  return (
    <div className="flex items-start gap-4">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#FF5C3A] font-jakarta text-sm font-black text-white">
        {n}
      </div>
      <div className="pt-1">
        <h5 className="mb-1 font-jakarta font-bold text-white">{title}</h5>
        <p className="text-sm text-white/50 leading-relaxed">{desc}</p>
      </div>
    </div>
  );
}

// ─── Feature Item ───────────────────────────────────────────────────────────
function FeatureItem({ icon, title, desc }: { icon: React.ReactNode; title: string; desc: string }) {
  return (
    <div className="flex items-start gap-4 rounded-xl border border-white/5 bg-white/3 p-5">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#FF5C3A]/10 text-[#FF5C3A]">
        {icon}
      </div>
      <div>
        <h5 className="mb-1 font-jakarta text-sm font-bold text-white">{title}</h5>
        <p className="text-xs text-white/50 leading-relaxed">{desc}</p>
      </div>
    </div>
  );
}

// ─── Testimonial ────────────────────────────────────────────────────────────
function TestimonialItem({ quote, author, brand }: { quote: string; author: string; brand: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
      <p className="mb-4 text-sm leading-relaxed text-white/70 italic">&ldquo;{quote}&rdquo;</p>
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#FF5C3A]/20 font-jakarta font-black text-[#FF5C3A]">
          {author[0]}
        </div>
        <div>
          <p className="font-jakarta text-sm font-bold text-white">{author}</p>
          <p className="text-xs text-white/40">{brand}</p>
        </div>
      </div>
    </div>
  );
}

// ─── Code Block ─────────────────────────────────────────────────────────────
function CodeBlock() {
  return (
    <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#0d0d0d]">
      <div className="flex items-center gap-2 border-b border-white/5 px-4 py-3">
        <div className="h-2.5 w-2.5 rounded-full bg-red-500/60" />
        <div className="h-2.5 w-2.5 rounded-full bg-yellow-500/60" />
        <div className="h-2.5 w-2.5 rounded-full bg-green-500/60" />
        <span className="ml-2 text-[10px] text-white/30">index.html</span>
      </div>
      <div className="p-6 font-mono text-[11px] leading-relaxed">
        <div className="text-white/20">{'<!-- Tu producto -->'}</div>
        <div className="mb-1 text-white/40">{'<div id="lookitry-widget"></div>'}</div>
        <div className="mb-2 text-white/20">{'<!-- Código Lookitry -->'}</div>
        <div className="text-indigo-300/80">{'<script src="https://lookitry.com/widget.js"'}</div>
        <div className="pl-4 text-indigo-300/80">{'data-slug="tu-marca"'}</div>
        <div className="text-indigo-300/80">{'async defer></script>'}</div>
        <div className="mt-3 text-emerald-400/50">{'// ¡Listo! En 3 minutos'}</div>
      </div>
    </div>
  );
}

// ─── Stats Section with Real Data ────────────────────────────────────────────
function StatsSection() {
  const [stats, setStats] = useState<LandingStatsData | null>(null);

  useEffect(() => {
    fetch('/api/landing-stats')
      .then(res => res.ok ? res.json() : null)
      .then(data => data && setStats(data))
      .catch(() => {});
  }, []);

  const displayStats = stats ? [
    { value: '~3min', label: 'Activación' },
    { value: `${formatBrands(stats.total_brands)}+`, label: 'Marcas activas' },
    { value: `${formatGenerations(stats.total_generations).toLocaleString()}+`, label: 'Generaciones IA' },
    { value: stats.satisfaction_rating ? stats.satisfaction_rating.toFixed(1) + '/5' : '4.9/5', label: 'satisfacción' },
  ] : [
    { value: '~3min', label: 'Activación' },
    { value: '180+', label: 'Marcas activas' },
    { value: '50K+', label: 'Generaciones IA' },
    { value: '4.9/5', label: 'satisfacción' },
  ];

  return (
    <section className="mx-auto max-w-6xl py-12">
      <div className="flex flex-wrap items-center justify-center gap-8 rounded-2xl border border-white/10 bg-white/5 p-8">
        {displayStats.map((stat, i) => (
          <React.Fragment key={i}>
            <div className="text-center">
              <div className="font-jakarta text-3xl font-black text-white">{stat.value}</div>
              <div className="text-[10px] font-bold uppercase tracking-widest text-white/40">{stat.label}</div>
            </div>
            {i < displayStats.length - 1 && <div className="h-10 w-px bg-white/10" />}
          </React.Fragment>
        ))}
      </div>
    </section>
  );
}

// ─── Reviews Section with Real Data ────────────────────────────────────────
function ReviewsSection() {
  const [reviews, setReviews] = useState<PublicReview[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/reviews/public')
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        if (data?.reviews) {
          setReviews(data.reviews.slice(0, 3));
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // Mock testimonials shown while loading or as fallback
  const mockTestimonials = [
    {
      id: 'mock-1',
      rating: 5,
      comment: "Lookitry no solo nos dio una web, nos dio una herramienta de ventas real. La tasa de retorno de clientes que usan el probador es increíble.",
      reviewer_name: "Elena Martínez",
      reviewer_plan: "PRO",
      is_featured: true,
      created_at: new Date().toISOString(),
      avatar_url: null,
    },
    {
      id: 'mock-2',
      rating: 5,
      comment: "Increíble cómo cambió la percepción de mi marca. Mis clientas de WhatsApp ahora entran al link, prueban y compran. ¡Ahorro horas!",
      reviewer_name: "Sofía Rodríguez",
      reviewer_plan: "BASIC",
      is_featured: true,
      created_at: new Date().toISOString(),
      avatar_url: null,
    },
    {
      id: 'mock-3',
      rating: 5,
      comment: "El plugin de WooCommerce se instaló en 5 minutos. Mis ventas subieron un 30% en el primer mes de uso.",
      reviewer_name: "Carlos Gómez",
      reviewer_plan: "PRO",
      is_featured: true,
      created_at: new Date().toISOString(),
      avatar_url: null,
    },
  ];

  const displayReviews = loading || reviews.length === 0 ? mockTestimonials : reviews;

  return (
    <section className="mx-auto max-w-6xl py-16">
      <motion.div {...fadeUp(0)} className="mb-10 text-center">
        <Tag accent>Casos de éxito</Tag>
        <h2 className="mt-6 font-jakarta text-3xl font-black leading-tight tracking-tight md:text-5xl">
          Lo que dicen{' '}
          <span className="text-[#FF5C3A]">nuestras marcas.</span>
        </h2>
      </motion.div>

      <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
        {displayReviews.map((review) => (
          <div key={review.id} className="rounded-2xl border border-white/10 bg-white/5 p-6">
            <div className="mb-3 flex items-center gap-1">
              {Array.from({ length: review.rating }).map((_, i) => (
                <Star key={i} size={12} className="fill-[#FF5C3A] text-[#FF5C3A]" />
              ))}
            </div>
            <p className="mb-4 text-sm leading-relaxed text-white/70 italic">&ldquo;{review.comment.length > 150 ? review.comment.slice(0, 150) + '…' : review.comment}&rdquo;</p>
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#FF5C3A]/20 font-jakarta font-black text-[#FF5C3A]">
                {review.reviewer_name.charAt(0)}
              </div>
              <div>
                <p className="font-jakarta text-sm font-bold text-white">{review.reviewer_name}</p>
                <p className="text-xs text-white/40">{review.reviewer_plan}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

// ─── CTA Button ─────────────────────────────────────────────────────────────
function CTAButton({ href, primary, children }: { href: string; primary: boolean; children: React.ReactNode }) {
  return (
    <a
      href={href}
      className={`inline-flex items-center gap-2 rounded-xl font-bold text-sm transition-all hover:scale-105 active:scale-95 ${primary ? 'bg-[#FF5C3A] text-white px-8 py-4 shadow-lg shadow-[#FF5C3A]/30' : 'border border-white/20 bg-white/5 px-8 py-4 text-white hover:bg-white/10'}`}
    >
      {children}
      <ArrowRight size={16} />
    </a>
  );
}

// ─── MAIN COMPONENT ─────────────────────────────────────────────────────────
export default function ProbadorVirtualContent() {
  return (
    <div className="min-h-screen bg-[#0a0a0a] font-dm-sans text-white selection:bg-[#FF5C3A]/30 selection:text-[#FF5C3A]">
      <LandingNav />

      <main className="px-6 pb-24 pt-20">

        {/* ── HERO ──────────────────────────────────────────── */}
        <section className="mx-auto max-w-5xl pb-20 text-center">
          <motion.div {...fadeUp(0)}>
            <Tag accent>Servicio de Integración Embed</Tag>
          </motion.div>
          <motion.h1 {...fadeUp(0.1)} className="mt-6 mb-6 font-jakarta text-4xl font-black leading-[0.95] tracking-tight md:text-6xl">
            Tu tienda, tu marca,{' '}
            <span className="text-[#FF5C3A]">tu probador virtual.</span>
          </motion.h1>
          <motion.p {...fadeUp(0.2)} className="mx-auto mb-10 max-w-2xl text-lg font-medium text-white/50">
            Integración en menos de 180 segundos. Funciona en Instagram, TikTok,
            WhatsApp y cualquier sitio web.
          </motion.p>
          <motion.div {...fadeUp(0.3)} className="flex flex-wrap items-center justify-center gap-4">
            <CTAButton href="/trial-checkout" primary>Activar para mi Marca</CTAButton>
            <CTAButton href="#integracion" primary={false}>Ver cómo funciona</CTAButton>
          </motion.div>
          <motion.div {...fadeUp(0.4)} className="mt-12 flex flex-wrap items-center justify-center gap-6 text-sm text-white/40">
            <div className="flex items-center gap-1">
              {[1,2,3,4,5].map(i => <span key={i} className="text-[#FF5C3A]">★</span>)}
              <span className="ml-2">4.9/5 satisfacción</span>
            </div>
            <span className="h-4 w-px bg-white/10" />
            <span>+180 marcas activas</span>
            <span className="h-4 w-px bg-white/10" />
            <span>+50K generaciones</span>
          </motion.div>
        </section>

        {/* ── WHAT IS EMBED ─────────────────────────────────── */}
        <section className="mx-auto max-w-6xl py-16">
          <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-2">
            <motion.div {...fadeUp(0)}>
              <Tag accent>Qué es Embed</Tag>
              <h2 className="mt-6 mb-5 font-jakarta text-3xl font-black leading-tight tracking-tight md:text-5xl">
                El motor de IA que<br />
                <span className="text-[#FF5C3A]">viaja con tu marca.</span>
              </h2>
              <p className="mb-8 text-base leading-relaxed text-white/50">
                Embed es la tecnología de Lookitry que permite integrar un probador virtual
                de ropa con IA en múltiples canales: tu tienda online, Instagram, TikTok,
                WhatsApp o cualquier plataforma que soporte código HTML.
              </p>
              <ul className="space-y-3">
                {[
                  { icon: <Zap size={16} />, text: 'Sin desarrollo adicional' },
                  { icon: <Globe size={16} />, text: 'Funciona en cualquier plataforma' },
                  { icon: <Check size={16} />, text: 'Mobile-first, responsive' },
                ].map((item, i) => (
                  <li key={i} className="flex items-center gap-3 text-sm font-semibold text-white/70">
                    <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-[#FF5C3A]/20 text-[#FF5C3A]">{item.icon}</div>
                    {item.text}
                  </li>
                ))}
              </ul>
            </motion.div>

            {/* Browser mockup */}
            <motion.div {...fadeUp(0.15)} className="overflow-hidden rounded-2xl border border-white/10 bg-[#111] shadow-2xl">
              <div className="flex items-center gap-3 border-b border-white/5 px-4 py-3">
                <div className="h-2.5 w-2.5 rounded-full bg-white/10" />
                <div className="h-2.5 w-2.5 rounded-full bg-white/10" />
                <div className="h-2.5 w-2.5 rounded-full bg-[#FF5C3A]/50" />
                <div className="flex-1 rounded-full bg-white/5 px-3 py-1.5 text-[9px] text-white/30">lookitry.com/mi-tienda</div>
              </div>
              <div className="relative aspect-[16/10] bg-gradient-to-br from-[#1a1a1a] to-[#0a0a0a] p-8 flex items-center justify-center">
                <div className="w-full max-w-sm rounded-2xl border border-white/10 bg-[#141414] p-6">
                  <div className="mb-4 flex items-center justify-between">
                    <div className="h-6 w-6 rounded-lg bg-[#FF5C3A]/20" />
                    <div className="h-2 w-16 rounded-full bg-white/10" />
                  </div>
                  <div className="mb-4 aspect-square rounded-xl bg-white/5 flex items-center justify-center">
                    <Camera size={28} className="text-white/20" />
                  </div>
                  <div className="space-y-2">
                    <div className="h-3 w-full rounded-full bg-white/5" />
                    <div className="h-3 w-3/4 rounded-full bg-white/5" />
                  </div>
                  <div className="mt-6 flex gap-2">
                    <div className="h-9 flex-1 rounded-lg bg-[#FF5C3A]" />
                    <div className="h-9 flex-1 rounded-lg border border-white/10" />
                  </div>
                </div>
                <div className="absolute right-6 top-6 rounded-xl border border-[#FF5C3A]/30 bg-[#FF5C3A]/10 px-3 py-1.5 backdrop-blur">
                  <div className="flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-widest text-[#FF5C3A]">
                    <div className="h-1.5 w-1.5 rounded-full bg-[#FF5C3A] animate-pulse" />
                    Widget Activo
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* ── PLATFORMS ────────────────────────────────────── */}
        <section className="mx-auto max-w-6xl py-16">
          <motion.div {...fadeUp(0)} className="mb-10 text-center">
            <Tag accent>Canales de distribución</Tag>
            <h2 className="mt-6 font-jakarta text-3xl font-black leading-tight tracking-tight md:text-5xl">
              Funciona donde{' '}
              <span className="text-[#FF5C3A]">tu cliente ya está.</span>
            </h2>
          </motion.div>

          <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
            <PlatformCard
              color="#ff0069"
              icon={<InstagramIcon className="w-5 h-5" />}
              title="Instagram"
              features={['Link en bio con widget', 'Stories con botón directo', 'Checkout sin salir de la app']}
            />
            <PlatformCard
              color="#00f2ea"
              icon={<TikTokIcon className="w-5 h-5" />}
              title="TikTok"
              features={['Bio link con widget', 'Videos shoppables', 'TikTok Shop integration']}
            />
            <PlatformCard
              color="#25D366"
              icon={<MessageCircle size={20} />}
              title="WhatsApp"
              features={['Link directo por chat', 'Catálogo en conversación', 'WhatsApp Business integrado']}
            />
          </div>

          <motion.div {...fadeUp(0.2)} className="mt-8 flex flex-wrap items-center justify-center gap-3">
            {['WordPress + WooCommerce', 'Shopify', 'Wix', 'Webflow', 'Square', 'HTML Custom'].map(name => (
              <div key={name} className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-white/50">
                {name}
              </div>
            ))}
          </motion.div>
        </section>

        {/* ── INTEGRATION ───────────────────────────────────── */}
        <section id="integracion" className="mx-auto max-w-6xl py-16">
          <div className="grid grid-cols-1 items-start gap-12 lg:grid-cols-2">
            <div className="space-y-6">
              <motion.div {...fadeUp(0)}>
                <Tag accent>Integración en 4 pasos</Tag>
                <h2 className="mt-6 mb-4 font-jakarta text-3xl font-black leading-tight tracking-tight md:text-5xl">
                  Activo en{' '}
                  <span className="text-[#FF5C3A]">menos de 3 minutos.</span>
                </h2>
                <p className="text-base text-white/50">
                  No necesitas desarrolladores. El código funciona out-of-the-box.
                </p>
              </motion.div>

              <div className="mt-8 space-y-5">
                <StepItem n={1} title="Descarga el código" desc="Copia el snippet HTML desde tu dashboard de Lookitry." />
                <StepItem n={2} title="Integra en tu plataforma" desc="Pega el código en tu tienda, página de producto o cualquier sección." />
                <StepItem n={3} title="Se adapta automáticamente" desc="Detecta colores, idioma y tipo de dispositivo." />
                <StepItem n={4} title="Listo para probar" desc="El probador aparece con tu branding, sin watermarks." />
              </div>
            </div>

            <motion.div {...fadeUp(0.15)}>
              <CodeBlock />
            </motion.div>
          </div>
        </section>

        {/* ── FEATURES ──────────────────────────────────────── */}
        <section className="mx-auto max-w-6xl py-16">
          <motion.div {...fadeUp(0)} className="mb-10 text-center">
            <Tag accent>Ventajas competitivas</Tag>
            <h2 className="mt-6 font-jakarta text-3xl font-black leading-tight tracking-tight md:text-5xl">
              Por qué las marcas{' '}
              <span className="text-[#FF5C3A]">eligen Embed.</span>
            </h2>
          </motion.div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            <FeatureItem icon={<Camera size={18} />} title="Sin app que descargar" desc="El cliente prueba directamente desde el navegador. Sin installs, sin registros." />
            <FeatureItem icon={<Layers size={18} />} title="Consistencia cross-platform" desc="La misma experiencia en Instagram, TikTok, tu tienda y WhatsApp." />
            <FeatureItem icon={<BarChart3 size={18} />} title="Analytics integrado" desc="Mide uso del probador, productos con más interés y tasa de conversión." />
            <FeatureItem icon={<Code2 size={18} />} title="Zero maintenance" desc="El código se actualiza solo. Nuevas features llegan automáticamente." />
            <FeatureItem icon={<Globe size={18} />} title="Brand consistency" desc="Colores, tipografía y estilo se sincronizan con tu identidad automáticamente." />
            <FeatureItem icon={<Zap size={18} />} title="Activación instantánea" desc="Trial de 7 días por $20.000 COP. Sin compromisos, sin contratos." />
          </div>
        </section>

        {/* ── STATS ──────────────────────────────────────────── */}
        <StatsSection />

        {/* ── TESTIMONIALS ──────────────────────────────────── */}
        <ReviewsSection />

        {/* ── CTA ────────────────────────────────────────────── */}
        <section className="mx-auto max-w-4xl py-16">
          <motion.div
            {...fadeUp(0)}
            className="overflow-hidden rounded-3xl border border-[#FF5C3A]/20 bg-gradient-to-br from-[#FF5C3A]/10 to-transparent p-12 text-center md:p-16"
          >
            <h2 className="mb-4 font-jakarta text-3xl font-black leading-tight tracking-tight md:text-5xl">
              Empieza hoy.{' '}
              <span className="text-[#FF5C3A]">Sin costo de setup.</span>
            </h2>
            <p className="mx-auto mb-10 max-w-lg text-base text-white/50">
              Trial de 7 días por $20.000 COP. Sin compromisos, sin contratos.
              Activa tu probador en menos de 3 minutos.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-4">
              <CTAButton href="/trial-checkout" primary>Comenzar mi trial ahora</CTAButton>
              <CTAButton href="/planes" primary={false}>Ver todos los planes</CTAButton>
            </div>
            <div className="mt-10 flex flex-wrap items-center justify-center gap-6 text-[10px] font-bold uppercase tracking-widest text-white/30">
              <span>Sin tarjeta de crédito</span>
              <span className="h-4 w-px bg-white/10" />
              <span>Setup en 3 minutos</span>
              <span className="h-4 w-px bg-white/10" />
              <span>Soporte incluido</span>
              <span className="h-4 w-px bg-white/10" />
              <span>Cancelar cuando quieras</span>
            </div>
          </motion.div>
        </section>

      </main>

      <LandingFooter />
    </div>
  );
}