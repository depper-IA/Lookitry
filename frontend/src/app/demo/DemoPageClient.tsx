'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, ArrowRight, ArrowDown, TrendingUp, RotateCcw, ShieldCheck, Zap, Users, Activity, ImageIcon, BarChart3, Clock } from 'lucide-react';
import dynamic from 'next/dynamic';
import LandingNav from '@/components/landing/LandingNav';
import LandingFooter from '@/components/landing/LandingFooter';
import { useCurrency } from '@/hooks/useCurrency';
import { formatPrice } from '@/utils/currency';

const TryOnDemoWidget = dynamic(() => import('@/components/tryon/TryOnDemoWidget'), { ssr: false });

const EASING = [0.22, 1, 0.36, 1] as const;

const TICKER_STATS = [
  { icon: Activity, label: '127 tiendas activas' },
  { icon: ImageIcon, label: '2.340 pruebas generadas hoy' },
  { icon: BarChart3, label: '+30% conversión promedio' },
  { icon: Clock, label: 'Activa en menos de 3 min' },
];

// ── LiveTicker ────────────────────────────────────────────────────────────────

function LiveTicker() {
  const [idx, setIdx] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setIdx(i => (i + 1) % TICKER_STATS.length), 3000);
    return () => clearInterval(t);
  }, []);
  const Icon = TICKER_STATS[idx].icon;
  return (
    <div className="flex items-center justify-center gap-2 py-2">
      <span className="h-1.5 w-1.5 flex-shrink-0 rounded-full bg-[var(--accent)] animate-pulse" />
      <AnimatePresence mode="wait">
        <motion.span
          key={idx}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.3, ease: EASING }}
          className="flex items-center gap-1.5 text-[11px] font-bold text-[var(--text-secondary)] tracking-wide"
        >
          <Icon size={12} className="text-[var(--accent)]" />
          {TICKER_STATS[idx].label}
        </motion.span>
      </AnimatePresence>
    </div>
  );
}

// ── StepBadge ─────────────────────────────────────────────────────────────────

function StepBadge({ step, label, done }: { step: number; label: string; done: boolean }) {
  return (
    <div className={`flex items-center gap-1.5 text-[10px] font-bold transition-colors duration-300 ${done ? 'text-[var(--accent)]' : 'text-[var(--text-muted)]'}`}>
      <span className={`flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-full text-[8px] ${done ? 'bg-[var(--accent)] text-white' : 'border border-[var(--border-color)] text-[var(--text-muted)]'}`}>
        {done ? '✓' : step}
      </span>
      {label}
    </div>
  );
}

// ── ResultPanel ───────────────────────────────────────────────────────────────

function ResultPanel({
  resultImage,
  onReset,
  currency,
  trialPriceCOP,
  trm,
}: {
  resultImage: string | null;
  onReset?: () => void;
  currency: 'COP' | 'USD';
  trialPriceCOP: number;
  trm: number;
}) {
  return (
    <div className="flex flex-col gap-5">
      {/* Image area */}
      <div className="relative w-full overflow-hidden rounded-2xl bg-[var(--bg-card)] shadow-2xl shadow-black/20 dark:shadow-black/40"
        style={{ aspectRatio: resultImage ? '3/4' : '4/3' }}>
        <AnimatePresence mode="wait">
          {resultImage ? (
            <motion.div
              key="result"
              initial={{ opacity: 0, scale: 1.04 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, ease: EASING }}
              className="absolute inset-0"
            >
              <img src={resultImage} alt="Resultado del probador virtual" className="h-full w-full object-cover" loading="lazy" decoding="async" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
              <div className="absolute top-3 left-3 rounded-full bg-[var(--accent)] px-2.5 py-0.5 text-[9px] font-black uppercase tracking-tight text-white shadow-md">
                Generado por IA
              </div>
              <div className="absolute bottom-3 left-0 right-0 flex items-center justify-between px-3">
                <span className="rounded-full bg-black/60 backdrop-blur-md px-3 py-1 text-[10px] font-bold text-white">1 de 3 opciones</span>
                {onReset && (
                  <button onClick={onReset} className="flex items-center gap-1 rounded-full bg-[var(--bg-card)]/80 backdrop-blur-md px-2.5 py-1 text-[9px] font-bold text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)] transition-all">
                    <RotateCcw size={9} /> Repetir
                  </button>
                )}
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="absolute inset-0 flex flex-col items-center justify-center gap-5 p-8 text-center"
            >
              {/* Animated placeholder rings */}
              <div className="relative flex items-center justify-center">
                <div className="absolute h-24 w-24 rounded-full border border-[var(--accent)]/10 animate-ping" style={{ animationDuration: '2.5s' }} />
                <div className="absolute h-16 w-16 rounded-full border border-[var(--accent)]/15 animate-ping" style={{ animationDuration: '2s', animationDelay: '0.3s' }} />
                <div className="flex h-12 w-12 items-center justify-center rounded-full border border-[var(--accent)]/20 bg-[var(--accent)]/5">
                  <Sparkles size={20} className="text-[var(--accent)]/50" />
                </div>
              </div>
              <div>
                <p className="text-sm font-black text-[var(--text-muted)] uppercase tracking-widest mb-1">Tu resultado aquí</p>
                <p className="text-xs text-[var(--text-muted)] leading-relaxed max-w-[180px]">
                  Sube tu foto y elige una prenda para ver la magia
                </p>
              </div>
              {/* Progress steps */}
              <div className="flex flex-col gap-1.5 w-full max-w-[180px]">
                <StepBadge step={1} label="Sube tu foto" done={false} />
                <StepBadge step={2} label="Elige una prenda" done={false} />
                <StepBadge step={3} label="Genera tu prueba" done={false} />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Upsell — always visible, changes tone post-result */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2, ease: EASING }}
        className={`rounded-2xl border p-5 text-center transition-all duration-500 ${
          resultImage
            ? 'border-[var(--accent)]/30 bg-[var(--accent)]/5 shadow-xl shadow-[var(--accent)]/10'
            : 'border-[var(--border-color)] bg-[var(--bg-card)]'
        }`}
      >
        <p className="mb-1 font-jakarta text-xl font-black leading-tight text-[var(--text-primary)]">
          {resultImage ? '¡Esto puede ser tu tienda!' : 'Prueba gratis, convierte más'}
        </p>
        <p className="mb-4 text-xs text-[var(--text-secondary)] leading-relaxed">
          {resultImage
            ? 'Tus clientas vivirían esto en tu e-commerce ahora mismo. +30% conversión garantizado.'
            : 'Las tiendas con Lookitry duplican el tiempo de visita y venden más sin más tráfico.'}
        </p>
        <Link
          href="/trial-checkout"
          className="mb-2.5 flex items-center justify-center gap-2 rounded-xl bg-[var(--accent)] py-3.5 text-sm font-black text-white shadow-lg shadow-[var(--accent)]/20 hover:brightness-110 active:scale-[0.98] transition-all"
        >
          <Sparkles size={15} /> Activar trial 7 días — {formatPrice(trialPriceCOP, currency, trm)}
        </Link>
        <Link
          href="/planes"
          className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)] hover:text-[var(--accent)] transition-colors"
        >
          Ver todos los planes <ArrowRight size={10} />
        </Link>
      </motion.div>

      {/* Trust badges */}
      <div className="grid grid-cols-3 gap-2">
        {[
          { icon: ShieldCheck, label: '100% Seguro' },
          { icon: Zap, label: 'Activa en 3 min' },
          { icon: Users, label: '127 tiendas' },
        ].map(({ icon: Icon, label }) => (
          <div key={label} className="flex flex-col items-center gap-1 rounded-xl border border-[var(--border-color)] bg-[var(--bg-card)] py-3 text-center">
            <Icon size={14} className="text-[var(--accent)]" />
            <span className="text-[8px] font-bold uppercase tracking-wider text-[var(--text-muted)]">{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── DemoPageClient ────────────────────────────────────────────────────────────

export default function DemoPageClient() {
  const { currency, setCurrency } = useCurrency();
  const [trialPriceCOP, setTrialPriceCOP] = useState(20000);
  const [trm, setTrm] = useState(4000);
  const [resultImage, setResultImage] = useState<string | null>(null);
  const resultRef = useRef<HTMLDivElement>(null);
  const widgetRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://api.lookitry.com';
    Promise.all([
      fetch(`${apiUrl}/api/trial/status`).then(r => r.ok ? r.json() : null),
      fetch(`${apiUrl}/api/payment-settings/public`).then(r => r.ok ? r.json() : null),
    ])
      .then(([trialData, paySettings]) => {
        if (trialData?.priceCOP && Number(trialData.priceCOP) > 0) setTrialPriceCOP(Number(trialData.priceCOP));
        if (paySettings?.trm && Number(paySettings.trm) > 0) setTrm(Number(paySettings.trm));
      })
      .catch(() => {});
  }, []);

  const handleResult = useCallback((url: string) => {
    setResultImage(url);
    setTimeout(() => {
      resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 300);
  }, []);

  const scrollToWidget = useCallback(() => {
    widgetRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, []);

  return (
    <div className="min-h-screen bg-[var(--bg-base)] text-[var(--text-primary)] font-dm-sans">
      <LandingNav transparent={false} currency={currency} onCurrencyChange={setCurrency} />

      {/* ── Hero compacto ──────────────────────────────────────────────── */}
      <section className="bg-[var(--bg-base)] pt-20 pb-10 px-6 sm:pt-24 sm:pb-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: EASING }}
          className="mx-auto max-w-2xl text-center"
        >
          {/* Live ticker */}
          <div className="mb-4 overflow-hidden rounded-full border border-[var(--border-color)] bg-[var(--bg-card)] px-4">
            <LiveTicker />
          </div>

          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-[var(--accent)]/20 bg-[var(--accent)]/5 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-[var(--accent)]">
            <span className="h-1.5 w-1.5 rounded-full bg-[var(--accent)] animate-pulse" />
            Probador Virtual IA — Gratis
          </div>

          <h1 className="mb-3 font-jakarta font-black leading-[1.05] tracking-[-0.03em] text-[var(--text-primary)]" style={{ fontSize: 'clamp(1.75rem, 5vw, 3rem)' }}>
            Mira cómo te queda la ropa<br />
            <span className="text-[var(--accent)]">antes de comprarla</span>
          </h1>

          <p className="mb-6 text-sm text-[var(--text-secondary)] leading-relaxed max-w-sm mx-auto">
            Sube una foto, elige la prenda y nuestra IA te muestra cómo te verías puesto. Sin registrarte. Sin tarjeta.
          </p>

          <button
            onClick={scrollToWidget}
            className="inline-flex items-center gap-2 rounded-full bg-[var(--accent)] px-8 py-3.5 text-sm font-black text-white shadow-lg shadow-[var(--accent)]/25 hover:brightness-110 active:scale-[0.97] transition-all"
          >
            Hacer mi prueba gratis <ArrowDown size={15} />
          </button>
        </motion.div>
      </section>

      {/* ── Widget + Result Panel ──────────────────────────────────────── */}
      <section className="mx-auto max-w-5xl px-4 py-10 sm:px-8 sm:py-14" ref={widgetRef}>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 lg:gap-10 lg:items-start">

          {/* Widget */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.1, ease: EASING }}
          >
            <TryOnDemoWidget onResult={handleResult} showBrowserChrome={false} />
          </motion.div>

          {/* Result panel */}
          <motion.div
            ref={resultRef}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2, ease: EASING }}
            className="lg:sticky lg:top-24"
          >
            <ResultPanel
              resultImage={resultImage}
              onReset={() => setResultImage(null)}
              currency={currency}
              trialPriceCOP={trialPriceCOP}
              trm={trm}
            />
          </motion.div>
        </div>
      </section>

      {/* ── Stats strip ────────────────────────────────────────────────── */}
      <section className="bg-[var(--bg-card)] px-6 py-10">
        <div className="mx-auto max-w-3xl">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
            {[
              { icon: TrendingUp, stat: '+30%', label: 'Conversión promedio', desc: 'Más ventas sin más tráfico' },
              { icon: ShieldCheck, stat: '-45%', label: 'Menos devoluciones', desc: 'Compras más seguras' },
              { icon: Zap, stat: '3 min', label: 'Para activar', desc: 'Sin desarrollador' },
            ].map(({ icon: Icon, stat, label, desc }) => (
              <div key={label} className="flex flex-col items-center gap-2 text-center p-6 rounded-2xl border border-[var(--border-color)] bg-[var(--bg-base)]">
                <Icon size={20} className="text-[var(--accent)] mb-1" />
                <span className="font-jakarta text-3xl font-black text-[var(--accent)]">{stat}</span>
                <span className="text-xs font-black uppercase tracking-widest text-[var(--text-secondary)]">{label}</span>
                <span className="text-[11px] text-[var(--text-muted)]">{desc}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA final ──────────────────────────────────────────────────── */}
      <section className="px-6 py-14 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, ease: EASING }}
          className="mx-auto max-w-xl"
        >
          <p className="mb-2 font-jakarta text-3xl font-black text-[var(--text-primary)]">
            ¿Lo quieres para tu tienda?
          </p>
          <p className="mb-8 text-sm text-[var(--text-secondary)] leading-relaxed">
            7 días de prueba. Sin contrato. Cancela cuando quieras.
          </p>
          <Link
            href="/trial-checkout"
            className="inline-flex items-center gap-2 rounded-2xl bg-[var(--accent)] px-10 py-4 text-base font-black text-white shadow-2xl shadow-[var(--accent)]/25 hover:brightness-110 active:scale-[0.98] transition-all"
          >
            <Sparkles size={18} /> Empezar trial — {formatPrice(trialPriceCOP, currency, trm)}
          </Link>
          <p className="mt-4 text-xs text-[var(--text-muted)]">Sin tarjeta requerida · Activa en menos de 3 minutos</p>
        </motion.div>
      </section>

      <LandingFooter />
    </div>
  );
}
