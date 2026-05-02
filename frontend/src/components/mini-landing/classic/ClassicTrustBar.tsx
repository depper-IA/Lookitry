'use client';

import React from 'react';
import { BrandData } from '../shared';
import { StarIcon } from './Icons';
import { useLandingTheme, useContrastTheme } from '../shared';

interface ClassicTrustBarProps {
  brand: BrandData;
  primaryColor: string;
}

export function ClassicTrustBar({ brand, primaryColor }: ClassicTrustBarProps) {
  const theme = useLandingTheme(brand);
  const localTheme = useContrastTheme(theme.surface, primaryColor);
  const rating = brand.rating ?? 0;
  const reviews = brand.total_reviews ?? 0;
  const hasRating = rating > 0;
  const hasReviews = reviews > 0;

  const items = [
    ...(hasRating ? [{ value: rating.toFixed(1), label: 'Valoración Global', icon: 'star' as const }] : []),
    ...(hasReviews ? [{ value: `+${reviews}`, label: 'Clientes Satisfechos', icon: 'users' as const }] : []),
  ];

  if (items.length === 0) return null;

  return (
    <div className="relative z-20 -mt-10 md:-mt-14 px-6 max-w-4xl mx-auto w-full group animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-500">
      <div className="backdrop-blur-xl border shadow-[0_20px_40px_-15px_rgba(0,0,0,0.1)] rounded-[2rem] p-2 transition-all duration-500 hover:shadow-[0_30px_60px_-15px_rgba(0,0,0,0.15)]" style={{ backgroundColor: theme.surface, borderColor: theme.border }}>
        <div className="flex flex-col sm:flex-row items-stretch rounded-[1.5rem] overflow-hidden">
          {items.map((item, i) => (
            <div
              key={i}
              className={`flex-1 flex items-center justify-center gap-5 sm:gap-6 py-6 px-4 text-center sm:text-left ${i !== items.length - 1 ? 'border-b sm:border-b-0 sm:border-r' : ''}`}
              style={{ borderColor: theme.borderLight }}
            >
              <div className="shrink-0 w-14 h-14 sm:w-16 sm:h-16 rounded-2xl flex items-center justify-center shadow-inner transition-transform duration-500 group-hover:scale-110 group-hover:rotate-3" style={{ backgroundColor: `${primaryColor}15` }}>
                {item.icon === 'star' ? (
                  <StarIcon className="w-7 h-7 sm:w-8 sm:h-8" style={{ color: primaryColor }} filled />
                ) : (
                  <svg className="w-7 h-7 sm:w-8 sm:h-8" style={{ color: primaryColor }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                )}
              </div>
              <div className="flex flex-col items-center sm:items-start">
                <div className="flex items-baseline gap-1.5">
                  <span className="text-3xl sm:text-4xl font-black tracking-tighter" style={{ color: localTheme.text }}>{item.value}</span>
                  {item.icon === 'star' && <span className="text-sm font-bold" style={{ color: localTheme.muted }}>/ 5.0</span>}
                </div>
                <span className="text-[10px] sm:text-xs font-bold uppercase tracking-[0.2em] mt-1" style={{ color: localTheme.muted }}>{item.label}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
