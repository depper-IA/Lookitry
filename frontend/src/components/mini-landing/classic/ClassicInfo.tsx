'use client';

import React from 'react';
import { BrandData } from '../shared';
import { useLandingTheme, useContrastTheme, getSmartBorderColor } from '../shared';
import { MapPinIcon, TruckIcon, StarIcon } from './Icons';

interface ClassicInfoProps {
  brand: BrandData;
  primaryColor: string;
  secondaryColor: string;
}

export function ClassicInfo({ brand, primaryColor, secondaryColor }: ClassicInfoProps) {
  const theme = useLandingTheme(brand);
  const localTheme = useContrastTheme(theme.productsBg, primaryColor);
  const DAYS_ORDER = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
  let scheduleEntries: [string, string][] = [];
  try {
    const raw = brand.schedule ?? {};
    if (raw && typeof raw === 'object') {
      scheduleEntries = DAYS_ORDER.filter(d => raw[d] || raw[d.toLowerCase()]).map(d => [d, (raw[d] || raw[d.toLowerCase()]) as string]);
    }
  } catch (e) { }

  const hasLocationBlock = !!brand.city_display || !!brand.national_shipping;
  const hasRatings = typeof brand.rating === 'number' || typeof brand.total_reviews === 'number';

  if (!hasLocationBlock && scheduleEntries.length === 0 && !hasRatings) return null;

  return (
    <section className="py-16 px-6 border-b" style={{ backgroundColor: theme.productsBg, borderColor: getSmartBorderColor(theme.productsBg) }}>
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10 lg:gap-16">
          {hasLocationBlock && (
            <div className="space-y-6">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center" style={{ backgroundColor: `${primaryColor}15` }}>
                  <MapPinIcon className="w-7 h-7" style={{ color: primaryColor }} />
                </div>
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-widest" style={{ color: secondaryColor || primaryColor }}>Encuéntranos</h4>
                  <p className="text-lg font-black italic" style={{ color: localTheme.text }}>{brand.city_display}</p>
                </div>
              </div>
              {brand.national_shipping && (
                <div className="flex items-center gap-2 px-4 py-2 rounded-xl w-fit" style={{ backgroundColor: `${primaryColor}15` }}>
                  <span className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: primaryColor }} />
                  <span className="text-xs font-bold uppercase tracking-widest" style={{ color: localTheme.text }}>Envíos Nacionales</span>
                </div>
              )}
            </div>
          )}

          {scheduleEntries.length > 0 && (
            <div className="space-y-6">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center" style={{ backgroundColor: `${primaryColor}15` }}>
                  <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke={primaryColor} strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-12 0 9 9 0 0112 0z" />
                  </svg>
                </div>
                <h4 className="text-xs font-bold uppercase tracking-widest" style={{ color: secondaryColor || primaryColor }}>Horarios de Atención</h4>
              </div>
              <div className="space-y-3">
                {scheduleEntries.slice(0, 5).map(([d, h]) => (
                  <div key={d} className="flex justify-between items-center py-2 border-b text-sm" style={{ borderColor: getSmartBorderColor(theme.productsBg) }}>
                    <span className="font-bold uppercase" style={{ color: localTheme.muted }}>{d}</span>
                    <span className={`font-black ${h.toLowerCase().includes('cerrado') ? 'italic' : ''}`} style={{ color: h.toLowerCase().includes('cerrado') ? '#ef4444' : localTheme.text }}>{h}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {hasRatings && (
            <div className="space-y-6">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center" style={{ backgroundColor: `${primaryColor}15` }}>
                  <StarIcon className="w-7 h-7" style={{ color: primaryColor }} filled />
                </div>
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-widest" style={{ color: secondaryColor || primaryColor }}>Valoraciones</h4>
                  <p className="text-3xl font-black" style={{ color: localTheme.text }}>{brand.rating?.toFixed(1) ?? '—'}</p>
                </div>
              </div>
              <FiveStars rating={brand.rating ?? undefined} />
              <p className="text-sm font-bold" style={{ color: localTheme.muted }}>{(brand.total_reviews || 0).toLocaleString()} reseñas de clientes</p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

function FiveStars({ rating }: { rating?: number }) {
  if (!rating) return null;
  const fullStars = Math.round(rating);
  return (
    <div className="flex gap-1">
      {[1,2,3,4,5].map(i => (
        <svg key={i} className="w-5 h-5" fill={i <= fullStars ? '#f59e0b' : 'none'} viewBox="0 0 24 24" stroke="#f59e0b" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.54 1.118l-3.976-2.888a1 1 0 00-1.175 0l-3.976 2.888c-.784.57-1.838-.197-1.539-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
        </svg>
      ))}
    </div>
  );
}
