'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState, useEffect } from 'react';

interface LandingNavProps {
  /** Si se pasa, muestra el botón CTA con ese href. Por defecto apunta a /register */
  ctaHref?: string;
  ctaLabel?: string;
}

export function LandingNav({ ctaHref, ctaLabel }: LandingNavProps) {
  const [trialActive, setTrialActive] = useState(false);

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/trial/status`)
      .then(r => r.json())
      .then(d => setTrialActive(d.active === true))
      .catch(() => setTrialActive(false));
  }, []);

  const resolvedCtaHref = ctaHref ?? (trialActive ? '/register' : '/planes');
  const resolvedCtaLabel = ctaLabel ?? (trialActive ? 'Empezar gratis' : 'Contratar ahora');

  return (
    <nav className="bg-[#0a0a0a] border-b border-[#1a1a1a] px-6 md:px-8 h-14 flex items-center justify-between sticky top-0 z-50">
      <Link href="/" className="flex items-center gap-2.5">
        <Image
          src="/logo.svg"
          alt="Lookitry"
          width={28}
          height={28}
          className="object-contain h-7 w-auto"
          priority
        />
        <span
          className="font-syne font-extrabold text-base text-white tracking-tight leading-none"
        >
          Look<span className="text-[#FF5C3A]">itry</span>
        </span>
      </Link>

      <div className="flex items-center gap-1 md:gap-2">
        <Link
          href="/planes"
          className="text-[13px] text-[#888] hover:text-white px-2 md:px-3.5 py-1.5 rounded-md transition-colors hidden sm:block"
        >
          Planes
        </Link>
        <Link
          href="/login"
          className="text-[13px] text-[#888] hover:text-white px-2 md:px-3.5 py-1.5 rounded-md transition-colors hidden sm:block"
        >
          Iniciar sesión
        </Link>
        <Link
          href={resolvedCtaHref}
          className="text-[13px] font-medium bg-[#FF5C3A] hover:bg-[#e84d2c] text-white px-3 md:px-4 py-1.5 rounded-md transition-colors"
        >
          {resolvedCtaLabel}
        </Link>
      </div>
    </nav>
  );
}
