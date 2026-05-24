'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldCheck, Clock, Sparkles } from 'lucide-react';
import { LANDING_COPY } from './LandingCopy';

const EASING = [0.22, 1, 0.36, 1] as const;

export default function LandingHero() {
  const [wordIndex, setWordIndex] = useState(0);
  const [videoReady, setVideoReady] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  const words = LANDING_COPY.hero.rotating_words;

  // IntersectionObserver solo en cliente para lazy load del video
  useEffect(() => {
    if (!videoRef.current) return;
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setIsVisible(true);
        observer.disconnect();
      }
    }, { threshold: 0.1 });
    observer.observe(videoRef.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setWordIndex((i) => (i + 1) % words.length);
    }, 3000);
    return () => clearInterval(interval);
  }, [words.length]);

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    if (v.readyState >= 3) {
      setVideoReady(true);
    } else {
      v.load();
      v.play().catch(() => {});
    }
  }, []);

  return (
    <section
      id="hero"
      className="relative flex min-h-screen items-end overflow-hidden bg-black pb-28 sm:pb-28"
      aria-label="Sección principal"
    >
      {/* ── Video Background ─────────────────────────────────────────── */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none" aria-hidden="true">
        {/* Local video — no YouTube UI, no play buttons, loops cleanly */}
        <video
          ref={videoRef}
          autoPlay
          muted
          loop
          playsInline
          preload="none"
          poster="/videos/hero-poster.webp"
          onCanPlay={() => setVideoReady(true)}
          style={{ transition: 'opacity 0.6s ease', opacity: videoReady ? 1 : 0 }}
          className="absolute inset-0 w-full h-full object-cover"
          aria-describedby="hero-video-desc"
        >
          <source src="/videos/hero.mp4" type="video/mp4" />
          <source src="/videos/hero-compressed.webm" type="video/webm" />
        </video>
        <span id="hero-video-desc" className="sr-only">Video de fondo mostrando una modelo probándose ropa virtualmente con la tecnología de IA de Lookitry</span>
        {/* Dark overlay — heavier on left, fades right */}
        <div
          className="absolute inset-0"
          style={{ background: 'linear-gradient(to right, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.6) 45%, rgba(0,0,0,0.2) 100%)' }}
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
          <h1
            className="mb-5 font-jakarta font-black leading-[1.05] tracking-[-0.03em] text-white sm:mb-7"
            style={{ fontSize: 'clamp(2.2rem, 7vw, 4rem)' }}
          >
            <span className="block">{LANDING_COPY.hero.title}</span>
            <span className="relative block h-[2.5em] sm:h-[1.15em] overflow-hidden">
              <AnimatePresence mode="wait">
                <motion.span
                  key={wordIndex}
                  initial={{ opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -14 }}
                  transition={{ duration: 0.45, ease: EASING }}
                  className="absolute left-0 top-0 text-accent"
                >
                  {words[wordIndex]}
                </motion.span>
              </AnimatePresence>
            </span>
          </h1>

          <p className="mb-9 max-w-lg font-dm-sans text-base font-light leading-[1.65] text-white/65 sm:mb-11 sm:text-lg">
            {LANDING_COPY.hero.subtitle}
          </p>

          <div className="flex flex-wrap items-center gap-4">
            <Link
              href="/demo"
              className="flex items-center gap-2 rounded-full bg-white px-8 py-4 text-sm font-black text-black shadow-xl transition-all hover:scale-[1.03] hover:-translate-y-0.5 hover:bg-white/90 active:scale-[0.97] sm:text-base"
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

          <div className="mt-10 flex flex-wrap items-center gap-6 text-[10px] font-bold uppercase tracking-[0.2em] text-white/55 sm:gap-10">
            <div className="nav-link flex items-center gap-2">
              <ShieldCheck size={13} className="shrink-0 text-accent" aria-hidden="true" /> 100% Seguro
            </div>
            <div className="nav-link flex items-center gap-2">
              <Clock size={13} className="shrink-0 text-accent" aria-hidden="true" /> Activación 10min
            </div>
            <div className="nav-link flex items-center gap-2">
              <Sparkles size={13} className="shrink-0 text-accent" aria-hidden="true" /> IA Generativa
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
