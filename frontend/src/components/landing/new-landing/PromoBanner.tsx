'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePromoBanner } from '@/context/PromoBannerContext';

interface PromoBannerConfig {
  text: string;
  bg_color: string;
  text_color?: string;
  cta_text?: string;
  cta_url?: string;
  coupon_code?: string;
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
    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5} aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2" />
    </svg>
  );
}

export function PromoBanner() {
  const { setBannerVisible } = usePromoBanner();
  const [promo, setPromo] = useState<Promotion | null>(null);
  const [visible, setVisible] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const dismissed = sessionStorage.getItem('promo_banner_dismissed');
    if (dismissed) return;

    fetch(`/api/promotions?t=${Date.now()}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d: { ok: boolean; data: Promotion[] } | null) => {
        if (!d?.ok) return;
        const banner = d.data.find((p) => p.type === 'banner' && p.active);
        if (!banner) return;
        setPromo(banner);
        setVisible(true);
        setBannerVisible(true);
      })
      .catch(() => {});
  }, [setBannerVisible]);

  const handleCopy = () => {
    if (!promo?.config?.coupon_code) return;
    navigator.clipboard.writeText(promo.config.coupon_code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleClose = () => {
    setVisible(false);
    setBannerVisible(false);
    sessionStorage.setItem('promo_banner_dismissed', '1');
  };

  if (!visible || !promo) return null;

  const cfg = promo.config;
  const bg = cfg.bg_color || '#FF5C3A';
  const textColor = cfg.text_color || '#ffffff';

  return (
    <div
      className="relative z-[80] flex w-full items-center justify-center px-10 py-2.5 text-[13px] font-medium shadow-md transition-all duration-300"
      style={{ backgroundColor: bg, color: textColor }}
      role="banner"
    >
      <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-center">
        <span className="leading-snug">{cfg.text}</span>

        {cfg.coupon_code && (
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold uppercase opacity-80">Codigo:</span>
            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 rounded-md border border-white/10 bg-white/20 px-2 py-0.5 font-mono text-[12px] font-bold transition-all hover:bg-white/30"
              title="Click para copiar"
            >
              {cfg.coupon_code}
              {copied ? (
                <span className="rounded bg-emerald-500 px-1 text-[10px] text-white animate-in fade-in scale-in-95">Copiado</span>
              ) : (
                <IconCopy />
              )}
            </button>
          </div>
        )}

        {cfg.cta_text && cfg.cta_url && (
          <Link
            href={cfg.cta_url}
            className="font-bold underline underline-offset-2 transition-opacity hover:opacity-80"
            style={{ color: textColor }}
          >
            {cfg.cta_text}
          </Link>
        )}
      </div>

      <button
        onClick={handleClose}
        className="absolute right-3 top-1/2 rounded p-1 transition-opacity hover:opacity-70"
        style={{ color: textColor, transform: 'translateY(-50%)' }}
        aria-label="Cerrar banner"
      >
        <IconClose />
      </button>
    </div>
  );
}
