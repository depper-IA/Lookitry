'use client';

import React from 'react';

interface NavCurrencySelectorProps {
  currency: 'COP' | 'USD';
  onCurrencyChange: (c: 'COP' | 'USD') => void;
  isHeroMode: boolean;
}

export function NavCurrencySelector({
  currency,
  onCurrencyChange,
  isHeroMode,
}: NavCurrencySelectorProps) {
  return (
    <div
      className={`ml-1 hidden items-center gap-2 rounded-full border px-2.5 py-1.5 sm:ml-2 sm:flex sm:px-3 ${
        isHeroMode
          ? 'border-white/10 bg-white/5'
          : 'border-black/10 bg-black/5 dark:border-white/10 dark:bg-white/5'
      }`}
      role="group"
      aria-label="Selector de moneda"
    >
      <button
        onClick={() => onCurrencyChange('COP')}
        aria-pressed={currency === 'COP'}
        className={`nav-currency-btn cursor-pointer text-[9px] font-bold uppercase transition-all duration-200 sm:text-[8px] ${
          currency === 'COP'
            ? 'text-accent scale-110'
            : isHeroMode
            ? 'text-white/50 hover:text-white'
            : 'text-black/45 hover:text-black dark:text-white/50 dark:hover:text-white'
        }`}
      >
        COP
      </button>
      <div
        className={`h-2.5 w-[1px] ${
          isHeroMode ? 'bg-white/10' : 'bg-black/10 dark:bg-white/10'
        }`}
        aria-hidden="true"
      />
      <button
        onClick={() => onCurrencyChange('USD')}
        aria-pressed={currency === 'USD'}
        className={`nav-currency-btn cursor-pointer text-[9px] font-bold uppercase transition-all duration-200 sm:text-[8px] ${
          currency === 'USD'
            ? 'text-accent scale-110'
            : isHeroMode
            ? 'text-white/50 hover:text-white'
            : 'text-black/45 hover:text-black dark:text-white/50 dark:hover:text-white'
        }`}
      >
        USD
      </button>
    </div>
  );
}
