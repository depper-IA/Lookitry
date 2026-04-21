'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Lock } from 'lucide-react';

interface CheckoutHeaderProps {
  OA: string;
}

export default function CheckoutHeader({ OA }: CheckoutHeaderProps) {
  const handleCurrencyToggle = () => {
    const current = localStorage.getItem('currency') as 'COP' | 'USD' | null;
    const newCurrency = current === 'USD' ? 'COP' : 'USD';
    localStorage.setItem('currency', newCurrency);
    window.dispatchEvent(new Event('currencyChange'));
  };

  const currentCurrency = localStorage.getItem('currency') as 'COP' | 'USD' | null;

  return (
    <nav className="sticky top-0 z-50 bg-[#050505]/90 backdrop-blur-md border-b border-[#1a1a1a] px-6 h-16 flex items-center justify-between">
      <Link href="/" className="flex items-center gap-2 group">
        <Image src="/logo.svg" alt="Lookitry" width={28} height={28} className="group-hover:scale-110 transition-transform" priority />
        <span className="font-jakarta font-extrabold text-lg text-white tracking-tight">
          Look<span style={{ color: OA }}>itry</span>
        </span>
      </Link>
      <div className="flex items-center gap-4">
        <button
          onClick={handleCurrencyToggle}
          className="flex items-center gap-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-full px-3 py-1.5 transition-all text-[11px] font-bold"
        >
          <span style={{ color: currentCurrency === 'COP' ? '#FF5C3A' : 'rgba(255,255,255,0.25)' }}>COP</span>
          <div className="w-px h-3 bg-white/10" />
          <span style={{ color: currentCurrency === 'USD' ? '#FF5C3A' : 'rgba(255,255,255,0.25)' }}>USD</span>
        </button>
        <div className="hidden sm:flex items-center gap-1.5 text-[11px] text-[#999]">
          <Lock className="w-3.5 h-3.5" style={{ color: OA }} />
          <span>PAGO 100% SEGURO</span>
        </div>
      </div>
    </nav>
  );
}
