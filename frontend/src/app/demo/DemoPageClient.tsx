'use client';

import React, { useState, useRef } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Sparkles, ArrowRight } from 'lucide-react';
import dynamic from 'next/dynamic';
import LandingNav from '@/components/landing/LandingNav';
import LandingFooter from '@/components/landing/LandingFooter';

const TryOnDemoWidget = dynamic(() => import('@/components/tryon/TryOnDemoWidget'), { ssr: false });

const EASING = [0.22, 1, 0.36, 1] as const;

// ── ResultPanel ───────────────────────────────────────────────────────────────

function ResultPanel({ resultImage }: { resultImage: string | null }) {
  return (
    <div className="flex flex-col gap-6">
      {/* Result image or empty state */}
      <div className="relative aspect-[3/4] w-full overflow-hidden rounded-2xl border border-white/10 bg-dark-card">
        {resultImage ? (
          <>
            <img src={resultImage} alt="Resultado del probador virtual" className="h-full w-full object-cover" />
            <div className="absolute top-3 left-3 rounded-full bg-accent px-2.5 py-0.5 text-[9px] font-black uppercase tracking-tight text-white">
              IA
            </div>
          </>
        ) : (
          <div className="flex h-full flex-col items-center justify-center gap-3 p-8 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full border border-dashed border-white/10 bg-white/5">
              <Sparkles size={22} className="text-white/20" />
            </div>
            <p className="text-[11px] font-bold uppercase tracking-widest text-white/30">
              Tu resultado aparece acá
            </p>
            <p className="text-[9px] text-white/20">
              Subí tu foto y generá tu prueba virtual →
            </p>
          </div>
        )}
      </div>

      {/* Upsell card — visible after generation */}
      {resultImage && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: EASING }}
          className="rounded-2xl border border-accent/25 bg-accent/8 p-6 text-center"
        >
          <p className="mb-1 font-jakarta text-xl font-black text-accent">¿Te gustó el resultado?</p>
          <p className="mb-5 text-sm text-white/50 leading-relaxed">
            Activá esto en tu tienda y tus clientes también pueden probarse la ropa antes de comprar.
          </p>
          <Link
            href="/trial-checkout"
            className="mb-3 flex items-center justify-center gap-2 rounded-xl bg-accent py-3.5 text-sm font-black text-white shadow-lg shadow-accent/20 hover:brightness-110 active:scale-[0.98] transition-all"
          >
            <Sparkles size={15} /> Activar en mi tienda — $20.000
          </Link>
          <Link
            href="/planes"
            className="flex items-center justify-center gap-1 text-xs text-white/35 hover:text-white/60 transition-colors"
          >
            Ver todos los planes <ArrowRight size={11} />
          </Link>
        </motion.div>
      )}
    </div>
  );
}

// ── DemoPageClient ────────────────────────────────────────────────────────────

export default function DemoPageClient() {
  const [resultImage, setResultImage] = useState<string | null>(null);
  const widgetRef = useRef<HTMLDivElement>(null);

  const scrollToWidget = () => {
    widgetRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  return (
    <div className="min-h-screen bg-dark text-white font-dm-sans">
      <LandingNav transparent={false} />

      {/* ── Mini Hero ──────────────────────────────────────────────── */}
      <section className="bg-dark pt-24 pb-14 px-6 text-center sm:pt-28 sm:pb-16">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: EASING }}
        >
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-accent/20 bg-accent/10 px-4 py-1.5 text-[10px] font-bold uppercase tracking-widest text-accent">
            <span className="h-1.5 w-1.5 rounded-full bg-accent animate-pulse" />
            Probador Virtual Gratuito
          </div>

          <h1 className="mb-4 font-jakarta text-4xl font-black leading-[1.1] tracking-[-0.03em] text-white sm:text-5xl">
            Mirá cómo te queda<br />
            <span className="text-accent">antes de comprar.</span>
          </h1>

          <p className="mx-auto mb-8 max-w-lg text-base text-white/50 leading-relaxed">
            1 generación gratis · Sin registro · Resultado en 30 segundos
          </p>

          <div className="flex items-center justify-center gap-3">
            <button
              onClick={scrollToWidget}
              className="flex items-center gap-2 rounded-full bg-white px-7 py-3.5 text-sm font-black text-dark hover:bg-white/90 transition-all active:scale-[0.97]"
            >
              Subir mi foto
            </button>
            <Link
              href="/casos-de-exito"
              className="flex items-center gap-2 rounded-full border border-white/20 px-7 py-3.5 text-sm font-bold text-white/70 hover:border-white/40 hover:text-white transition-all"
            >
              Ver ejemplos
            </Link>
          </div>
        </motion.div>
      </section>

      {/* ── Widget + Result Panel ──────────────────────────────────── */}
      <section className="mx-auto max-w-5xl px-6 pb-20 sm:px-10" ref={widgetRef}>
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2 lg:gap-12 lg:items-start">
          {/* Left: Widget */}
          <div>
            <TryOnDemoWidget onResult={(url) => setResultImage(url)} />
          </div>

          {/* Right: Result Panel */}
          <div className="lg:sticky lg:top-28">
            <ResultPanel resultImage={resultImage} />
          </div>
        </div>
      </section>

      <LandingFooter />
    </div>
  );
}
