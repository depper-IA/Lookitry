'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';

interface PromoModalConfig {
  title: string;
  description: string;
  cta_text: string;
  cta_url: string;
  delay_seconds: number;
  // Nuevos campos de duración
  duration_days?: number;
  duration_hours?: number;
  duration_minutes?: number;
  ends_at?: string; // Mantenemos por compatibilidad
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

function useCountdown(targetTimestamp: number | null) {
  const getRemaining = useCallback(() => {
    if (!targetTimestamp) return null;
    const diff = targetTimestamp - Date.now();
    if (diff <= 0) return null;
    
    const d = Math.floor(diff / 86400000);
    const h = Math.floor((diff % 86400000) / 3600000);
    const m = Math.floor((diff % 3600000) / 60000);
    const s = Math.floor((diff % 60000) / 1000);
    return { d, h, m, s };
  }, [targetTimestamp]);

  const [remaining, setRemaining] = useState(getRemaining);

  useEffect(() => {
    if (!targetTimestamp) return;
    const id = setInterval(() => {
      const r = getRemaining();
      setRemaining(r);
      if (!r) clearInterval(id);
    }, 1000);
    return () => clearInterval(id);
  }, [targetTimestamp, getRemaining]);

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
      <span className="text-[9px] uppercase tracking-widest mt-1 font-bold" style={{ color: '#666' }}>
        {label}
      </span>
    </div>
  );
}

export function PromoModal() {
  const [promo, setPromo] = useState<Promotion | null>(null);
  const [visible, setVisible] = useState(false);
  const [targetTimestamp, setTargetTimestamp] = useState<number | null>(null);
  const remaining = useCountdown(targetTimestamp);

  useEffect(() => {
    // Verificar si ya fue cerrado en esta sesión
    const dismissed = sessionStorage.getItem('promo_modal_dismissed');
    if (dismissed) return;

    // Añadimos timestamp para evitar cache del navegador
    fetch(`/api/promotions?t=${Date.now()}`)
      .then(r => r.ok ? r.json() : null)
      .then((d: { ok: boolean; data: Promotion[] } | null) => {
        if (!d?.ok) return;
        // Buscamos el modal que esté marcado como activo
        const modal = d.data.find(p => (p.type === 'modal_timer' || p.type === 'launch_offer') && p.active);
        if (!modal) return;

        setPromo(modal);

        // --- Lógica de Temporizador Inteligente ---
        const cfg = modal.config;
        let finalTs: number | null = null;

        // 1. Prioridad: Duración personalizada (Días/Horas/Minutos)
        if (cfg.duration_days || cfg.duration_hours || cfg.duration_minutes) {
          const storageKey = `promo_timer_end_${modal.id}`;
          const savedEnd = localStorage.getItem(storageKey);

          if (savedEnd) {
            finalTs = parseInt(savedEnd, 10);
          } else {
            // Calcular nuevo fin basado en duración
            const durationMs = 
              ((cfg.duration_days || 0) * 86400000) +
              ((cfg.duration_hours || 0) * 3600000) +
              ((cfg.duration_minutes || 0) * 60000);
            
            finalTs = Date.now() + durationMs;
            localStorage.setItem(storageKey, finalTs.toString());
          }
        } 
        // 2. Fallback: Fecha fija
        else if (cfg.ends_at || modal.ends_at) {
          finalTs = new Date(cfg.ends_at || modal.ends_at!).getTime();
        }

        setTargetTimestamp(finalTs);

        const delay = (cfg.delay_seconds ?? 5) * 1000;
        const timer = setTimeout(() => setVisible(true), delay);
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
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(4px)' }}
      onClick={handleClose}
      role="dialog"
      aria-modal="true"
      aria-label={cfg.title}
    >
      <div
        className="relative w-full max-w-sm rounded-3xl overflow-hidden shadow-2xl"
        style={{ backgroundColor: '#141414', border: '1px solid #2a2a2a' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 pt-8 pb-4 text-center">
          <div
            className="inline-flex items-center justify-center w-12 h-12 rounded-2xl mb-4"
            style={{ backgroundColor: 'rgba(255,92,58,0.1)' }}
          >
            <IconTag />
          </div>
          <h2 className="font-syne font-extrabold text-2xl text-white leading-tight px-2">
            {cfg.title}
          </h2>
        </div>

        {/* Body */}
        <div className="px-8 py-5 text-center">
          <p className="text-sm leading-relaxed mb-6" style={{ color: '#aaa' }}>
            {cfg.description}
          </p>

          {/* Countdown */}
          {remaining && (
            <div className="flex items-center justify-center gap-4 mb-8 bg-[#1a1a1a] py-4 rounded-2xl border border-[#222]">
              {remaining.d > 0 && (
                <>
                  <CountdownUnit value={remaining.d} label="días" />
                  <span className="font-bold text-lg pb-4 text-[#333]">:</span>
                </>
              )}
              <CountdownUnit value={remaining.h} label="horas" />
              <span className="font-bold text-lg pb-4 text-[#333]">:</span>
              <CountdownUnit value={remaining.m} label="min" />
              <span className="font-bold text-lg pb-4 text-[#333]">:</span>
              <CountdownUnit value={remaining.s} label="seg" />
            </div>
          )}

          <Link
            href={cfg.cta_url || '/checkout'}
            onClick={handleClose}
            className="block w-full py-4 rounded-2xl text-white text-sm font-bold text-center transition-all duration-200 hover:scale-[1.02] active:scale-95"
            style={{ background: '#FF5C3A', boxShadow: '0 8px 30px rgba(255,92,58,0.25)' }}
          >
            {cfg.cta_text || 'Aprovechar oferta'}
          </Link>
          
          <button 
            onClick={handleClose}
            className="mt-4 text-[11px] font-medium uppercase tracking-widest hover:text-white transition-colors"
            style={{ color: '#555' }}
          >
            No me interesa por ahora
          </button>
        </div>

        {/* Cerrar */}
        <button
          onClick={handleClose}
          className="absolute top-5 right-5 p-1.5 rounded-lg transition-colors text-gray-500 hover:text-white"
          aria-label="Cerrar"
        >
          <IconClose />
        </button>
      </div>
    </div>
  );
}
