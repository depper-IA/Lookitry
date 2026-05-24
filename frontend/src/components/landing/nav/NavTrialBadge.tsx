'use client';

import React from 'react';
import Link from 'next/link';
import { formatPrice } from '@/utils/currency';

interface NavTrialBadgeProps {
  trialPriceCOP: number;
  currency: 'COP' | 'USD';
  trm: number;
  fetchTrialDataIfNeeded: () => void;
}

export function NavTrialBadge({
  trialPriceCOP,
  currency,
  trm,
  fetchTrialDataIfNeeded,
}: NavTrialBadgeProps) {
  return (
    <Link
      href="/trial-checkout"
      onMouseEnter={fetchTrialDataIfNeeded}
      onFocus={fetchTrialDataIfNeeded}
      className="nav-trial-btn group relative hidden overflow-hidden rounded-full bg-accent px-6 py-3 text-[10px] font-bold uppercase tracking-[0.15em] text-white shadow-xl shadow-accent/20 transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-accent/30 active:scale-95 sm:px-8 sm:py-3.5 md:inline-flex"
    >
      <span className="relative z-10">
        Trial 7 días por {formatPrice(trialPriceCOP, currency, trm)}
      </span>
      <div className="nav-trial-shimmer pointer-events-none absolute inset-0 -translate-y-full bg-gradient-to-r from-transparent via-white/30 to-transparent transition-transform duration-500 group-hover:translate-y-full" />
    </Link>
  );
}
