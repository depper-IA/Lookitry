'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface PromoBannerConfig {
  text: string;
  bg_color: string;
  text_color?: string;
  cta_text?: string;
  cta_url?: string;
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

export function PromoBanner() {
  const [promo, setPromo] = useState<Promotion | null>(null);
  const [visible, setVisible] = useState(false);

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
      className="relative w-full flex items-center justify-center px-10 py-2.5 text-sm font-medium"
      style={{ backgroundColor: bg, color: textColor }}
      role="banner"
    >
      <span className="text-center leading-snug">
        {cfg.text}
        {cfg.cta_text && cfg.cta_url && (
          <>
            {' '}
            <Link
              href={cfg.cta_url}
              className="underline underline-offset-2 font-bold hover:opacity-80 transition-opacity"
              style={{ color: textColor }}
            >
              {cfg.cta_text}
            </Link>
          </>
        )}
      </span>

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
