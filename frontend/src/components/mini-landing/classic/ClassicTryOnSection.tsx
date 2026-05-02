'use client';

import React from 'react';
import { BrandData } from '../shared';
import { TryOnWidget } from '@/components/tryon/TryOnWidget';
import { useContrastTheme } from '../shared';

interface ClassicTryOnSectionProps {
  brand: BrandData;
  primaryColor: string;
  secondaryColor: string;
  selectedProductId: string | null;
  isPreview?: boolean;
}

export function ClassicTryOnSection({ brand, primaryColor, secondaryColor, selectedProductId, isPreview = false }: ClassicTryOnSectionProps) {
  const tryOnTheme = useContrastTheme(brand.widget_bg_color || '#0a0a0a', primaryColor);

  return (
    <section id="probador" className="py-20 px-4 md:px-6" style={{ backgroundColor: brand.widget_bg_color || '#0a0a0a' }}>
      <div className="max-w-4xl mx-auto space-y-12 text-center">
        <div className="space-y-4">
          <span className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.4em]" style={{ color: secondaryColor }}>
            <span className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: primaryColor }} />
            Probador Virtual Premium
          </span>
          <h2 className="text-3xl md:text-4xl font-black tracking-tighter uppercase italic leading-none" style={{ color: tryOnTheme.text }}>Experiencia Inteligente</h2>
          <p className="text-sm font-medium" style={{ color: tryOnTheme.muted }}>Selecciona un producto y pruébatelo virtualmente con nuestra IA</p>
        </div>
        <div className={isPreview ? 'overflow-hidden' : 'rounded-[2.5rem] md:rounded-[3.5rem] overflow-hidden shadow-[0_50px_100px_-20px_rgba(0,0,0,0.5)] border border-white/5'}>
          <TryOnWidget
            brandSlug={brand.slug}
            isEmbed={true}
            initialProductId={selectedProductId}
            forceLayout="bare"
            lockProductSelection={true}
          />
        </div>
      </div>
    </section>
  );
}
