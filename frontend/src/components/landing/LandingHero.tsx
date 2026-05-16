'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldCheck, Clock, Sparkles } from 'lucide-react';
import { LANDING_COPY } from './LandingCopy';

const EASING = [0.22, 1, 0.36, 1] as const;

export default function LandingHero() {
  const [wordIndex, setWordIndex] = useState(0);
  const words = LANDING_COPY.hero.rotating_words;

  useEffect(() => {
    const interval = setInterval(() => {
      setWordIndex((i) => (i + 1) % words.length);
    }, 3000);
    return () => clearInterval(interval);
  }, [words.length]);

  return (
    <section
      id="hero"
      className="relative flex min-h-screen items-end overflow-hidden bg-black pb-20 sm:pb-28"
      aria-label="Sección principal"
    >
      {/* ── Video Background ─────────────────────────────────────────── */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none" aria-hidden="true">
        <iframe
          title="Video de fondo decorativo"
          src="https://www.youtube.com/embed/1ap0baidLVo?autoplay=1&mute=1&loop=1&playlist=1ap0baidLVo&controls=0&disablekb=1&playsinline=1&modestbranding=1&rel=0"
          className="absolute top-1/2 left-1/2 w-[177.78vh] h-[56.25vw] min-w-full min-h-full -translate-x-1/2 -translate-y-1/2 border-0"
          allow="autoplay; encrypted-media"
          loading="lazy"
        />
        {/* Dark overlay — heavier on left, fades right (Shopify style) */}
        <div
          className="absolute inset-0"
          style={{
            background: 'linear-gradient(to right, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.6) 45%, rgba(0,0,0,0.2) 100%)',
          }}
        />
        {/* Fallback gradient shown when iframe fails to load */}
        <div
          className="absolute inset-0 -z-10"
          style={{
            background: 'linear-gradient(135deg, #1a0e0a 0%, #080810 50%, #0a0808 100%)',
          }}
        />
      </div>

      {/* ── Content — bottom-left, Shopify style ────────────────────── */}
      <div className="relative z-10 mx-auto w-full max-w-7xl px-6 sm:px-10 md:px-16">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: EASING }}
          className="max-w-2xl"
        >
          {/* Headline */}
          <h1
            className="mb-5 font-jakarta font-black leading-[1.05] tracking-[-0.03em] text-white sm:mb-7"
            style={{ fontSize: 'clamp(2.5rem, 5vw, 4rem)' }}
          >
            <span className="block">{LANDING_COPY.hero.title}</span>
            {/* Cycling word */}
            <span className="relative block h-[1.15em] overflow-hidden">
              <AnimatePresence mode="wait">
                <motion.span
                  key={wordIndex}
                  initial={{ opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -14 }}
                  transition={{ duration: 0.45, ease: EASING }}
                  className="absolute left-0 top-0 text-white"
                >
                  {words[wordIndex]}
                </motion.span>
              </AnimatePresence>
            </span>
          </h1>

          {/* Subtitle */}
          <p className="mb-9 max-w-lg font-dm-sans text-base font-light leading-[1.65] text-white/65 sm:mb-11 sm:text-lg">
            {LANDING_COPY.hero.subtitle}
          </p>

          {/* CTAs */}
          <div className="flex flex-wrap items-center gap-4">
            <Link
              href="/demo"
              className="flex items-center gap-2 rounded-full bg-white px-8 py-4 text-sm font-black text-dark shadow-xl transition-all hover:scale-[1.03] hover:-translate-y-0.5 hover:bg-white/90 active:scale-[0.97] sm:text-base"
            >
              {LANDING_COPY.hero.cta_primary}
            </Link>
            <Link
              href="/planes"
              className="flex items-center gap-2 rounded-full border-2 border-white/50 px-8 py-[14px] text-sm font-bold text-white transition-all hover:border-white hover:bg-white/5 active:scale-[0.97] sm:text-base"
            >
              {LANDING_COPY.hero.cta_secondary}
            </Link>
          </div>

          {/* Trust pills */}
          <div className="mt-10 flex flex-wrap items-center gap-6 text-[10px] font-bold uppercase tracking-[0.2em] text-white/55 sm:gap-10">
            <div className="flex items-center gap-2 hover:text-white/80 transition-colors">
              <ShieldCheck size={13} className="shrink-0 text-accent" aria-hidden="true" /> 100% Seguro
            </div>
            <div className="flex items-center gap-2 hover:text-white/80 transition-colors">
              <Clock size={13} className="shrink-0 text-accent" aria-hidden="true" /> Activación 10min
            </div>
            <div className="flex items-center gap-2 hover:text-white/80 transition-colors">
              <Sparkles size={13} className="shrink-0 text-accent" aria-hidden="true" /> IA Generativa
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
