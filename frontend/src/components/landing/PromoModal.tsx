'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';

interface PromoModalConfig {
  title: string;
  description: string;
  cta_text: string;
  cta_url: string;
  delay_seconds: number;
  ends_at?: string;
}

interface Promotion {
  id: string;
  type: string;
  name: string;
  config: PromoModalConfig;
  active: boolean;
  ends_at?: string;
}

function IconClose() {
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
  );
}

function IconTag() {
  return (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75} aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
    </svg>
  );
}

function useCountdown(endsAt?: string) {
  const getRemaining = useCallback(() => {
    if (!endsAt) return null;
    const diff = new Date(endsAt).getTime() - Date.now();
    if (diff <= 0) return null;
    const h = Math.floor(diff / 3600000);
    const m = Math.floor((diff % 3600000) / 60000);
    const s = Math.floor((diff % 60000) / 1000);
    return { h, m, s };
  }, [endsAt]);

  const [remaining, setRemaining] = useState(getRemaining);

  useEffect(() => {
    if (!endsAt) return;
    const id = setInterval(() => {
      const r = getRemaining();
      setRemaining(r);
      if (!r) clearInterval(id);
    }, 1000);
    return () => clearInterval(id);
  }, [endsAt, getRemaining]);

  return remaining;
}

function CountdownUnit({ value, label }: { value: number; label: string }) {
  return (
    <div className="flex flex-col items-center">
      <span
        className="font-syne font-extrabold text-2xl leading-none tabular-nums"
        style={{ color: '#FF5C3A' }}
      >
        {String(value).padStart(2, '0')}
      </span>
      <span className="text-[10px] uppercase tracking-widest mt-0.5" style={{ color: '#888' }}>
        {label}
      </span>
    </div>
  );
}

export function PromoModal() {
  const [promo, setPromo] = useState<Promotion | null>(null);
  const [visible, setVisible] = useState(false);
  const remaining = useCountdown(promo?.config?.ends_at ?? promo?.ends_at);

  useEffect(() => {
    // Verificar si ya fue cerrado en esta sesión
    const dismissed = sessionStorage.getItem('promo_modal_dismissed');
    if (dismissed) return;

    fetch('/api/promotions')
      .then(r => r.ok ? r.json() : null)
      .then((d: { ok: boolean; data: Promotion[] } | null) => {
        if (!d?.ok) return;
        const modal = d.data.find(p => p.type === 'modal_timer' || p.type === 'launch_offer');
        if (!modal) return;

        const delay = (modal.config?.delay_seconds ?? 5) * 1000;
        const timer = setTimeout(() => setVisible(true), delay);
        setPromo(modal);
        return () => clearTimeout(timer);
      })
      .catch(() => {});
  }, []);

  const handleClose = () => {
    setVisible(false);
    sessionStorage.setItem('promo_modal_dismissed', '1');
  };

  if (!visible || !promo) return null;

  const cfg = promo.config;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.7)' }}
      onClick={handleClose}
      role="dialog"
      aria-modal="true"
      aria-label={cfg.title}
    >
      <div
        className="relative w-full max-w-md rounded-3xl overflow-hidden shadow-2xl"
        style={{ backgroundColor: '#141414', border: '1px solid #2a2a2a' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 pt-6 pb-4 text-center" style={{ borderBottom: '1px solid #1f1f1f' }}>
          <div
            className="inline-flex items-center justify-center w-10 h-10 rounded-2xl mb-3"
            style={{ backgroundColor: 'rgba(255,92,58,0.15)' }}
          >
            <IconTag />
          </div>
          <h2 className="font-syne font-extrabold text-xl text-white leading-tight">
            {cfg.title}
          </h2>
        </div>

        {/* Body */}
        <div className="px-6 py-5 text-center">
          <p className="text-sm leading-relaxed mb-5" style={{ color: '#bbb' }}>
            {cfg.description}
          </p>

          {/* Countdown */}
          {remaining && (
            <div className="flex items-center justify-center gap-4 mb-5">
              <CountdownUnit value={remaining.h} label="horas" />
              <span className="font-bold text-xl pb-3" style={{ color: '#333' }}>:</span>
              <CountdownUnit value={remaining.m} label="min" />
              <span className="font-bold text-xl pb-3" style={{ color: '#333' }}>:</span>
              <CountdownUnit value={remaining.s} label="seg" />
            </div>
          )}

          <Link
            href={cfg.cta_url || '/checkout'}
            onClick={handleClose}
            className="block w-full py-3.5 rounded-2xl text-white text-sm font-bold text-center transition-all duration-200 hover:opacity-90 hover:-translate-y-0.5 active:scale-95 focus-visible:ring-2 focus-visible:ring-[#FF5C3A]"
            style={{ background: '#FF5C3A', boxShadow: '0 8px 24px rgba(255,92,58,0.3)' }}
          >
            {cfg.cta_text || 'Aprovechar oferta'}
          </Link>
        </div>

        {/* Cerrar */}
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg transition-colors"
          style={{ color: '#555' }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = '#fff'; }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = '#555'; }}
          aria-label="Cerrar"
        >
          <IconClose />
        </button>
      </div>
    </div>
  );
}
