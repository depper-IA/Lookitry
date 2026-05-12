'use client';

import React, { useState } from 'react';
import { BrandData } from '../shared';
import { useLandingTheme, getSmartBorderColor, getVisibleSocialEntries, SocialLinks } from '../shared';
import { MenuIcon, XMarkIcon } from './Icons';

interface ClassicHeaderProps {
  brand: BrandData;
  primaryColor: string;
  secondaryColor: string;
  onScrollDown: () => void;
}

export function ClassicHeader({ brand, primaryColor, secondaryColor, onScrollDown }: ClassicHeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const theme = useLandingTheme(brand);

  const headerColor = brand.header_color || theme.productsBg;
  const headerIsDark = (headerColor && (
    headerColor === '#0a0a0a' || headerColor === '#000000' || headerColor === '#111111' ||
    headerColor === '#121212' || headerColor === '#1a1a1a'
  )) || false;

  const headerBg = headerColor || theme.productsBg;
  const headerTextColor = headerIsDark ? '#ffffff' : '#111111';
  const headerMutedColor = headerIsDark ? 'rgba(255,255,255,0.7)' : '#6b7280';

  const logoSrc = headerIsDark ? (brand.logo_light || brand.logo) : (brand.logo_dark || brand.logo);
  const socialLinks = brand.social_links || {};
  const entries = getVisibleSocialEntries(socialLinks);

  return (
    <header
      className="sticky top-0 z-50 w-full md:h-20 backdrop-blur-md border-b transition-all"
      style={{
        backgroundColor: `${headerBg}ee`,
        borderColor: headerIsDark ? 'rgba(255,255,255,0.08)' : '#f3f4f6',
      }}
    >
      <div className="max-w-6xl mx-auto h-full px-4 md:px-8 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          {brand.logo ? (
            <img src={logoSrc} alt={brand.name} className="h-8 md:h-10 w-auto max-w-[160px] object-contain shrink-0" />
          ) : (
            brand.show_brand_name !== false ? (
              <span className="font-black text-xl md:text-2xl uppercase tracking-tighter truncate" style={{ color: headerIsDark ? '#ffffff' : primaryColor }}>
                {brand.name}
              </span>
            ) : null
          )}
          {brand.logo && brand.show_brand_name !== false && (
            <span className="font-black text-lg md:text-xl uppercase tracking-tighter truncate hidden sm:block" style={{ color: headerTextColor }}>
              {brand.name}
            </span>
          )}
        </div>

        <nav className="hidden lg:flex items-center gap-8">
          <button onClick={onScrollDown} aria-label="Ir a productos" className="text-xs font-bold uppercase tracking-widest transition-colors hover:opacity-80" style={{ color: headerMutedColor }}>Catálogo</button>
          <button onClick={() => document.getElementById('probador')?.scrollIntoView({ behavior: 'smooth' })} aria-label="Ir a probador IA" className="text-xs font-bold uppercase tracking-widest transition-colors hover:opacity-80" style={{ color: headerMutedColor }}>Probador IA</button>
          <button onClick={() => document.getElementById('contacto')?.scrollIntoView({ behavior: 'smooth' })} aria-label="Ir a horarios y contacto" className="text-xs font-bold uppercase tracking-widest transition-colors hover:opacity-80" style={{ color: headerMutedColor }}>Horarios</button>
        </nav>

        {/* Social Icons - Desktop */}
        <SocialLinks
          entries={entries}
          limit={4}
          className="hidden lg:flex items-center gap-2"
          linkClassName="w-9 h-9 rounded-xl hover:scale-110"
          iconClassName="w-4 h-4"
          linkStyle={{ backgroundColor: headerIsDark ? 'rgba(255,255,255,0.1)' : `${primaryColor}10`, color: headerIsDark ? '#ffffff' : primaryColor }}
        />

        <div className="flex items-center gap-3">
          <button
            onClick={() => document.getElementById('probador')?.scrollIntoView({ behavior: 'smooth' })}
            className="px-6 py-2.5 rounded-full text-white text-xs font-black uppercase tracking-widest shadow-xl transition-all hover:brightness-110 active:scale-95"
            style={{ backgroundColor: primaryColor }}
          >
            Probar Ahora
          </button>
          <button
            onClick={() => setMobileMenuOpen(v => !v)}
            className="lg:hidden p-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF5C3A] focus-visible:ring-offset-2 rounded-lg"
            style={{ color: headerMutedColor }}
            aria-label={mobileMenuOpen ? "Cerrar menú" : "Abrir menú"}
            aria-expanded={mobileMenuOpen}
          >
            {mobileMenuOpen ? <XMarkIcon className="w-6 h-6" /> : <MenuIcon className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {mobileMenuOpen && (
        <div
          className="lg:hidden absolute top-full left-0 w-full shadow-2xl animate-in slide-in-from-top duration-300"
          style={{
            backgroundColor: headerBg,
            borderBottom: `1px solid ${headerIsDark ? 'rgba(255,255,255,0.08)' : '#f3f4f6'}`,
          }}
        >
          <nav className="flex flex-col p-6 gap-4">
            <button onClick={() => { onScrollDown(); setMobileMenuOpen(false); }} aria-label="Ir a productos" className="text-sm font-bold uppercase tracking-widest text-left py-3 border-b" style={{ color: headerTextColor, borderColor: headerIsDark ? 'rgba(255,255,255,0.08)' : '#f9fafb' }}>Catálogo</button>
            <button onClick={() => { document.getElementById('probador')?.scrollIntoView({ behavior: 'smooth' }); setMobileMenuOpen(false); }} aria-label="Ir a probador IA" className="text-sm font-bold uppercase tracking-widest text-left py-3 border-b" style={{ color: headerTextColor, borderColor: headerIsDark ? 'rgba(255,255,255,0.08)' : '#f9fafb' }}>Probador IA</button>
            <button onClick={() => { document.getElementById('contacto')?.scrollIntoView({ behavior: 'smooth' }); setMobileMenuOpen(false); }} aria-label="Ir a horarios y contacto" className="text-sm font-bold uppercase tracking-widest text-left py-3" style={{ color: headerTextColor }}>Horarios y Contacto</button>
            {entries.length > 0 && (
              <div className="pt-4 border-t" style={{ borderColor: headerIsDark ? 'rgba(255,255,255,0.08)' : '#f9fafb' }}>
                <SocialLinks
                  entries={entries}
                  className="gap-3"
                  linkClassName="w-10 h-10 rounded-xl"
                  iconClassName="w-4 h-4"
                  linkStyle={{ backgroundColor: headerIsDark ? 'rgba(255,255,255,0.1)' : `${primaryColor}15`, color: headerIsDark ? '#ffffff' : primaryColor }}
                />
              </div>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}
