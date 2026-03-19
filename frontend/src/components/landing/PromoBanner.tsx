'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface PromoBannerConfig {
  text: string;
  bg_color: string;
  text_color?: string;
  cta_text?: string;
  cta_url?: string;
  coupon_code?: string; // Nuevo campo
}

interface Promotion {
  id: string;
  type: string;
  config: PromoBannerConfig;
  active: boolean;
}

function IconClose() {
  return (
    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5} aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
  );
}

function IconCopy() {
  return (
    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2" />
    </svg>
  );
}

export function PromoBanner() {
  const [promo, setPromo] = useState<Promotion | null>(null);
  const [visible, setVisible] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const dismissed = sessionStorage.getItem('promo_banner_dismissed');
    if (dismissed) return;

    fetch('/api/promotions')
      .then(r => r.ok ? r.json() : null)
      .then((d: { ok: boolean; data: Promotion[] } | null) => {
        if (!d?.ok) return;
        const banner = d.data.find(p => p.type === 'banner');
        if (!banner) return;
        setPromo(banner);
        setVisible(true);
      })
      .catch(() => {});
  }, []);

  const handleCopy = () => {
    if (!promo?.config?.coupon_code) return;
    navigator.clipboard.writeText(promo.config.coupon_code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleClose = () => {
    setVisible(false);
    sessionStorage.setItem('promo_banner_dismissed', '1');
  };

  if (!visible || !promo) return null;

  const cfg = promo.config;
  const bg = cfg.bg_color || '#FF5C3A';
  const textColor = cfg.text_color || '#ffffff';

  return (
    <div
      className="sticky top-0 z-[60] w-full flex items-center justify-center px-10 py-2.5 text-[13px] font-medium shadow-md transition-all duration-300"
      style={{ backgroundColor: bg, color: textColor }}
      role="banner"
    >
      <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-center">
        <span className="leading-snug">
          {cfg.text}
        </span>

        {cfg.coupon_code && (
          <div className="flex items-center gap-2">
            <span className="text-[10px] uppercase font-bold opacity-80">Código:</span>
            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 px-2 py-0.5 rounded-md font-mono font-bold text-[12px] bg-white/20 hover:bg-white/30 transition-all border border-white/10"
              title="Click para copiar"
            >
              {cfg.coupon_code}
              {copied ? (
                <span className="text-[10px] text-white bg-emerald-500 px-1 rounded animate-in fade-in scale-in-95">¡Copiado!</span>
              ) : (
                <IconCopy />
              )}
            </button>
          </div>
        )}

        {cfg.cta_text && cfg.cta_url && (
          <Link
            href={cfg.cta_url}
            className="underline underline-offset-2 font-bold hover:opacity-80 transition-opacity"
            style={{ color: textColor }}
          >
            {cfg.cta_text}
          </Link>
        )}
      </div>

      <button
        onClick={handleClose}
        className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded transition-opacity hover:opacity-70"
        style={{ color: textColor }}
        aria-label="Cerrar banner"
      >
        <IconClose />
      </button>
    </div>
  );
}
