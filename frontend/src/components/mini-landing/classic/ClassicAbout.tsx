'use client';

import React from 'react';
import { BrandData } from '../shared';
import { useContrastTheme } from '../shared';

interface ClassicAboutProps {
  brand: BrandData;
  primaryColor: string;
}

export function ClassicAbout({ brand, primaryColor }: ClassicAboutProps) {
  const bgColor = brand.widget_bg_color || '#0a0a0a';
  const theme = useContrastTheme(bgColor);
  if (!brand.brand_description) return null;

  return (
    <section className="py-12 md:py-20 px-6">
      <div className="max-w-4xl mx-auto p-8 md:p-16 rounded-[2.5rem] md:rounded-[3.5rem] relative overflow-hidden shadow-2xl" style={{ backgroundColor: bgColor }}>
        <div className="relative z-10 space-y-6 text-center md:text-left">
          <span className="text-xs font-bold uppercase tracking-[0.5em]" style={{ color: theme.muted }}>Nuestra Historia</span>
          <p className="text-xl md:text-3xl leading-tight font-black italic uppercase tracking-tighter max-w-3xl" style={{ color: theme.text }}>
            &quot;{brand.brand_description}&quot;
          </p>
        </div>
      </div>
    </section>
  );
}
