'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Lock } from 'lucide-react';

interface CheckoutHeaderProps {
  OA: string;
}

export default function CheckoutHeader({ OA }: CheckoutHeaderProps) {
  return (
    <nav className="sticky top-0 z-50 bg-[#050505]/90 backdrop-blur-md border-b border-[#1a1a1a] px-6 h-16 flex items-center justify-between">
      <Link href="/" className="flex items-center gap-2 group">
        <Image src="/logo.svg" alt="Lookitry" width={28} height={28} className="group-hover:scale-110 transition-transform" priority />
        <span className="font-jakarta font-extrabold text-lg text-white tracking-tight">
          Look<span style={{ color: OA }}>itry</span>
        </span>
      </Link>
      <div className="hidden sm:flex items-center gap-2 text-xs text-[#999] font-medium">
        <Lock className="w-3.5 h-3.5" style={{ color: OA }} />
        <span>PAGO 100% SEGURO</span>
      </div>
    </nav>
  );
}
