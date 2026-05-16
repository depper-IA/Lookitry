'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, ArrowRight } from 'lucide-react';
import dynamic from 'next/dynamic';
import LandingNav from '@/components/landing/LandingNav';
import LandingFooter from '@/components/landing/LandingFooter';

const TryOnDemoWidget = dynamic(() => import('@/components/tryon/TryOnDemoWidget'), { ssr: false });

const EASING = [0.22, 1, 0.36, 1] as const;

const DEMO_WORDS = [
  "3 resultados hiperrealistas.",
  "3 opciones generadas por IA.",
  "3 looks a partir de una foto.",
  "3 pruebas en cuestión de segundos."
];

// ── ResultPanel ───────────────────────────────────────────────────────────────

function ResultPanel({ resultImage }: { resultImage: string | null }) {
  return (
    <div className="flex flex-col gap-6">
      {/* Result image or empty state */}
      <div className="relative aspect-[3/4] w-full overflow-hidden rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-dark-card shadow-lg">
        {resultImage ? (
          <>
            <img src={resultImage} alt="Resultado del probador virtual" className="h-full w-full object-cover" />
            <div className="absolute top-3 left-3 rounded-full bg-accent px-2.5 py-0.5 text-[9px] font-black uppercase tracking-tight text-white shadow-md">
              Generado por IA
            </div>
            <div className="absolute bottom-3 right-3 rounded-full bg-black/60 backdrop-blur-md px-3 py-1 text-[10px] font-bold text-white shadow-lg">
              1 de 3 opciones
            </div>
          </>
        ) : (
          <div className="flex h-full flex-col items-center justify-center gap-4 p-8 text-center bg-gray-50/50 dark:bg-white/5">
            <div className="flex h-16 w-16 items-center justify-center rounded-full border border-dashed border-gray-300 dark:border-white/10 bg-white dark:bg-white/5 shadow-sm">
              <Sparkles size={24} className="text-gray-400 dark:text-white/20" />
            </div>
            <p className="text-[12px] font-bold uppercase tracking-widest text-gray-500 dark:text-white/30 mt-2">
              El probador virtual te espera
            </p>
            <p className="text-sm text-gray-500 dark:text-white/40 leading-relaxed px-4">
              Sube tu foto y en segundos te mostraremos <span className="font-bold text-accent">3 generaciones distintas</span> con la prenda elegida.
            </p>
          </div>
        )}
      </div>

      {/* Upsell card */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: EASING }}
        className="rounded-2xl border border-accent/25 bg-accent/5 dark:bg-accent/10 p-6 text-center shadow-lg shadow-accent/5"
      >
        <p className="mb-2 font-jakarta text-2xl font-black text-accent">
          {resultImage ? "¡Imagínate esto en tu tienda!" : "Lleva tu e-commerce al futuro"}
        </p>
        <p className="mb-6 text-sm text-gray-600 dark:text-white/60 leading-relaxed">
          {resultImage 
            ? "Tus clientas podrían estar viviendo esta experiencia ahora mismo. Aumenta tu conversión un 30% y reduce tus devoluciones drásticamente." 
            : "Las tiendas que integran Lookitry duplican el tiempo de permanencia de sus usuarios y aumentan sus ventas."}
        </p>
        <Link
          href="/trial-checkout"
          className="mb-3 flex items-center justify-center gap-2 rounded-xl bg-accent py-4 text-sm font-black text-white shadow-lg shadow-accent/20 hover:brightness-110 active:scale-[0.98] transition-all"
        >
          <Sparkles size={16} /> Iniciar mi prueba de 7 días
        </Link>
        <p className="text-xs text-gray-500 dark:text-white/40 mb-3 font-medium">Por solo $20.000 COP, activa en menos de 3 min.</p>
        <Link
          href="/planes"
          className="inline-flex items-center justify-center gap-1 text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-white/40 hover:text-accent transition-colors"
        >
          Ver todos los planes <ArrowRight size={11} />
        </Link>
      </motion.div>
    </div>
  );
}

// ── DemoPageClient ────────────────────────────────────────────────────────────

export default function DemoPageClient() {
  const [resultImage, setResultImage] = useState<string | null>(null);
  const [wordIndex, setWordIndex] = useState(0);
  const widgetRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const interval = setInterval(() => {
      setWordIndex((i) => (i + 1) % DEMO_WORDS.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const scrollToWidget = () => {
    widgetRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  return (
    <div className="min-h-screen bg-white dark:bg-dark text-dark dark:text-white font-dm-sans transition-colors duration-300">
      <LandingNav transparent={false} />

      {/* ── Mini Hero ──────────────────────────────────────────────── */}
      <section className="bg-gray-50 dark:bg-dark pt-24 pb-14 px-6 text-center sm:pt-28 sm:pb-16 transition-colors duration-300">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: EASING }}
        >
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-accent/20 bg-accent/10 px-4 py-1.5 text-[10px] font-bold uppercase tracking-widest text-accent">
            <span className="h-1.5 w-1.5 rounded-full bg-accent animate-pulse" />
            Demostración Interactiva
          </div>

          <h1 className="mb-4 font-jakarta text-4xl font-black leading-[1.1] tracking-[-0.03em] text-dark dark:text-white sm:text-5xl">
            <span className="block">Descubre cómo te queda con</span>
            <span className="relative flex justify-center h-[1.15em] overflow-hidden text-accent">
              <AnimatePresence mode="wait">
                <motion.span
                  key={wordIndex}
                  initial={{ opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -14 }}
                  transition={{ duration: 0.45, ease: EASING }}
                  className="absolute w-full text-center"
                >
                  {DEMO_WORDS[wordIndex]}
                </motion.span>
              </AnimatePresence>
            </span>
          </h1>

          <p className="mx-auto mb-8 max-w-xl text-base text-gray-500 dark:text-white/50 leading-relaxed font-medium">
            Por cada producto que elijas, nuestra IA generará 3 variaciones distintas de prueba en menos de 30 segundos. Experimenta la magia que impulsará tus ventas.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              onClick={scrollToWidget}
              className="flex items-center justify-center gap-2 rounded-full bg-accent px-8 py-4 text-sm font-black text-white hover:brightness-110 shadow-lg shadow-accent/20 transition-all active:scale-[0.97]"
            >
              Hacer mi prueba gratis <ArrowRight size={16} />
            </button>
            <Link
              href="/trial-checkout"
              className="flex items-center justify-center gap-2 rounded-full border border-gray-300 dark:border-white/20 px-8 py-4 text-sm font-bold text-gray-600 dark:text-white/70 hover:bg-gray-100 dark:hover:bg-white/10 hover:text-dark dark:hover:text-white transition-all"
            >
              Comenzar trial para mi marca
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
