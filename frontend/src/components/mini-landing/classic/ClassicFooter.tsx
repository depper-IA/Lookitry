'use client';

import React from 'react';
import { BrandData } from '../shared';
import { useLandingTheme, useContrastTheme, getSmartBorderColor, getVisibleSocialEntries, SocialLinks } from '../shared';

interface ClassicFooterProps {
  brand: BrandData;
  primaryColor: string;
  secondaryColor: string;
  footerUrl?: string;
}

export function ClassicFooter({ brand, primaryColor, secondaryColor, footerUrl }: ClassicFooterProps) {
  const entries = getVisibleSocialEntries(brand.social_links);
  const theme = useLandingTheme(brand);
  const localTheme = useContrastTheme(theme.productsBg, primaryColor);

  return (
    <footer id="contacto" className="pt-24 pb-12 px-6 border-t" style={{ backgroundColor: theme.productsBg, borderColor: getSmartBorderColor(theme.productsBg) }}>
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 lg:gap-20 mb-20">
          {/* Brand Column */}
          <div className="space-y-8">
            <div className="flex items-center gap-4">
              {brand.logo ? (
                <img src={brand.logo_dark || brand.logo} alt={brand.name} className="h-14 md:h-16 object-contain" />
              ) : (
                <span className="font-black text-2xl md:text-3xl uppercase italic" style={{ color: primaryColor }}>{brand.name}</span>
              )}
            </div>
            <SocialLinks
              entries={entries}
              className="gap-3"
              linkClassName="w-12 h-12 rounded-xl hover:scale-110"
              iconClassName="w-5 h-5"
              linkStyle={{ backgroundColor: `${primaryColor}10`, border: `1px solid ${getSmartBorderColor(theme.productsBg)}`, color: localTheme.text }}
            />
          </div>

          {/* Quick Links / Contact */}
          <div className="space-y-8">
            <h4 className="text-xs font-bold uppercase tracking-[0.3em]" style={{ color: secondaryColor || primaryColor }}>Contacto Rápido</h4>

            {/* Contact Info */}
            {(brand.whatsapp_contact || brand.whatsapp_number) && (
              <div className="space-y-3 mb-6">
                {brand.whatsapp_contact && (
                  <p className="text-sm font-medium" style={{ color: localTheme.text }}>WhatsApp: {brand.whatsapp_contact}</p>
                )}
                {brand.whatsapp_number && (
                  <p className="text-sm font-medium" style={{ color: localTheme.text }}>WhatsApp: {brand.whatsapp_number}</p>
                )}
              </div>
            )}
            <div className="space-y-4">
              <button onClick={() => document.getElementById('productos')?.scrollIntoView({ behavior: 'smooth' })}
                className="block text-sm font-medium hover:opacity-70 transition-opacity text-left" style={{ color: localTheme.text }}>
                Ver Catálogo
              </button>
              <button onClick={() => document.getElementById('probador')?.scrollIntoView({ behavior: 'smooth' })}
                className="block text-sm font-medium hover:opacity-70 transition-opacity text-left" style={{ color: localTheme.text }}>
                Probador Virtual IA
              </button>
              <button onClick={() => document.getElementById('contacto')?.scrollIntoView({ behavior: 'smooth' })}
                className="block text-sm font-medium hover:opacity-70 transition-opacity text-left" style={{ color: localTheme.text }}>
                Horarios y Ubicación
              </button>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t flex flex-col md:flex-row items-center justify-between gap-4" style={{ borderColor: getSmartBorderColor(theme.productsBg) }}>
          <p className="text-xs font-bold uppercase tracking-widest text-center md:text-left" style={{ color: localTheme.muted }}>
            © {new Date().getFullYear()} {brand.name}
          </p>
          <p className="text-xs font-bold uppercase tracking-widest text-center md:text-right" style={{ color: localTheme.muted }}>
            Powered by <a href={footerUrl || 'https://lookitry.com'} target="_blank" rel="noopener noreferrer" className="font-bold hover:opacity-80 transition-opacity" style={{ color: localTheme.text }}>Look<span style={{ color: '#FF5C3A' }}>itry</span> IA</a>
          </p>
        </div>
      </div>
    </footer>
  );
}
