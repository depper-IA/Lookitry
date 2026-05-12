'use client';

import React from 'react';
import { BrandData, ImageUrlProvider } from '../shared';
import { useLandingTheme, useContrastTheme, getCoverPresentation, isDarkColor, getContrastColor } from '../shared';
import { SparklesIcon, StarIcon } from './Icons';

interface ClassicHeroProps {
  brand: BrandData;
  primaryColor: string;
  secondaryColor: string;
  onScrollDown: () => void;
  isPreview?: boolean;
}

export function ClassicHero({ brand, primaryColor, secondaryColor, onScrollDown, isPreview = false }: ClassicHeroProps) {
  const theme = useLandingTheme(brand);
  const hasCover = !!brand.cover_image_url;
  const { backgroundColor: coverBaseColor, imageOpacity } = getCoverPresentation(brand, primaryColor + '10');
  const bgColor = brand.cover_bg_color || '#f9f8f6';
  const isBgDark = isDarkColor(bgColor);
  const textColor = isBgDark ? '#ffffff' : '#111111';
  const mutedColor = bgColor && isDarkColor(bgColor)
    ? 'rgba(255,255,255,0.85)'
    : '#6b7280';

  return (
    <section
      className={`relative w-full ${isPreview ? 'py-8 md:py-12' : 'py-12 md:py-20'} px-6 overflow-hidden`}
      style={{ backgroundColor: bgColor }}
    >
      {/* Decorative Elements */}
      <div className="absolute top-0 right-0 w-64 h-64 opacity-5" style={{
        background: `radial-gradient(circle, ${primaryColor} 0%, transparent 70%)`,
        transform: 'translate(30%, -30%)'
      }} />
      <div className="absolute bottom-0 left-0 w-48 h-48 opacity-5" style={{
        background: `radial-gradient(circle, ${secondaryColor} 0%, transparent 70%)`,
        transform: 'translate(-30%, 30%)'
      }} />

      <div className="max-w-6xl mx-auto flex flex-col lg:flex-row items-center gap-10 md:gap-16 z-10">
        <div className="flex-1 text-center lg:text-left space-y-6 md:space-y-8">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border text-xs font-bold uppercase tracking-wider animate-in fade-in slide-in-from-bottom-2 duration-700"
            style={{
              backgroundColor: isBgDark ? 'rgba(255,255,255,0.1)' : `${primaryColor}15`,
              borderColor: isBgDark ? 'rgba(255,255,255,0.2)' : `${primaryColor}30`,
              color: isBgDark ? '#ffffff' : primaryColor
            }}
          >
            <SparklesIcon className="w-4 h-4" />
            Nueva tecnología de probador IA
          </div>

          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black leading-[1.05] tracking-tighter uppercase italic animate-in fade-in slide-in-from-bottom-4 duration-700 delay-150" style={{ color: secondaryColor || textColor }}>
            {brand.name}<br />
            <span style={{ color: primaryColor }}>{brand.slogan || 'Colección 2026'}</span>
          </h1>

          {brand.brand_description && (
            <p className="text-sm md:text-base max-w-xl mx-auto lg:mx-0 leading-relaxed font-medium animate-in fade-in slide-in-from-bottom-2 duration-700 delay-300" style={{ color: mutedColor }}>
              {brand.brand_description}
            </p>
          )}

          <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-5 animate-in fade-in slide-in-from-bottom-2 duration-700 delay-500">
            <button onClick={onScrollDown} className="w-full sm:w-auto px-10 py-4 rounded-xl font-black text-xs uppercase tracking-[0.2em] shadow-xl hover:brightness-110 active:scale-95 transition-all" style={{ backgroundColor: primaryColor, color: getContrastColor(primaryColor) }}>Ver Productos</button>
            <div className="flex items-center gap-1.5">
              {brand.total_reviews ? (
                <>
                  <div className="flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-br from-orange-500 to-rose-500 shadow-lg">
                    <StarIcon className="w-5 h-5 text-white" />
                  </div>
                  <span className="text-sm font-black" style={{ color: textColor }}>
                    +{(brand.total_reviews as number).toLocaleString()}
                  </span>
                </>
              ) : null}
            </div>
          </div>
        </div>

        <div className="flex-1 w-full relative aspect-square lg:aspect-[4/5] rounded-[2rem] md:rounded-[2.5rem] overflow-hidden shadow-2xl transition-transform duration-700 hover:scale-[1.02] animate-in fade-in zoom-in duration-1000 delay-200">
          {hasCover ? (
            <>
              <div className="absolute inset-0" style={{ backgroundColor: coverBaseColor }} />
              <ImageUrlProvider 
                src={brand.cover_image_url || ''} 
                alt={brand.name} 
                className="absolute inset-0 w-full h-full object-cover" 
                style={{ opacity: imageOpacity }} 
                primaryColor={primaryColor}
              />
            </>
          ) : (
            <div className="w-full h-full flex items-center justify-center" style={{ backgroundColor: coverBaseColor }}>
              <div className="text-center">
                <SparklesIcon className="w-20 h-20 mx-auto opacity-20" style={{ color: primaryColor }} />
                <p className="mt-4 text-sm font-bold uppercase tracking-widest opacity-40">Cover Image</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
