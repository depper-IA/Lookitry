'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState, useEffect, useRef } from 'react';
import { LookitryLogoText } from '@/components/mini-landing/shared';

interface LandingNavProps {
  ctaHref?: string;
  ctaLabel?: string;
}

export function LandingNav({ ctaHref, ctaLabel }: LandingNavProps) {
  const [trialActive, setTrialActive] = useState(false);
  const [session, setSession] = useState<{ name: string; email: string } | null>(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [currency, setCurrency] = useState<'COP' | 'USD'>('COP');
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Cargar preferencia de moneda
    const saved = localStorage.getItem('currency') as 'COP' | 'USD';
    if (saved) setCurrency(saved);

    const apiUrl = process.env.NEXT_PUBLIC_API_URL || '';
    if (!apiUrl) return;
    fetch(`${apiUrl}/api/trial/status`)
      .then(r => r.json())
      .then(d => setTrialActive(d.active === true))
      .catch(() => setTrialActive(false));
  }, []);

  useEffect(() => {
    const token = localStorage.getItem('token') || localStorage.getItem('brandToken');
    if (!token) return;
    try {
      const brand = JSON.parse(localStorage.getItem('brand') || 'null');
      if (brand?.name || brand?.email) {
        setSession({ name: brand.name || '', email: brand.email || '' });
      }
    } catch {}
  }, []);

  // Cerrar dropdown al hacer click fuera
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleCurrency = () => {
    const next = currency === 'COP' ? 'USD' : 'COP';
    setCurrency(next);
    localStorage.setItem('currency', next);
    window.dispatchEvent(new Event('currencyChange'));
  };

  function handleLogout() {
    localStorage.removeItem('token');
    localStorage.removeItem('brandToken');
    localStorage.removeItem('brand');
    setSession(null);
    setDropdownOpen(false);
  }

  const resolvedCtaHref = ctaHref ?? (trialActive ? '/register' : '/planes');
  const resolvedCtaLabel = ctaLabel ?? (trialActive ? 'Prueba $20.000' : 'Contratar ahora');

  const initials = session?.name
    ? session.name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()
    : '?';

  return (
    <nav className="bg-[#0a0a0a] border-b border-[#1a1a1a] px-6 md:px-8 h-14 flex items-center justify-between sticky top-0 z-50">
      <div className="flex items-center gap-6">
        <Link href="/" className="flex items-center gap-2.5">
          <Image
            src="/logo.svg"
            alt="Lookitry"
            width={28}
            height={28}
            className="object-contain h-7 w-auto"
            priority
          />
          <LookitryLogoText className="text-base text-white leading-none" />
        </Link>

        {/* Selector de moneda */}
        <button
          onClick={toggleCurrency}
          className="hidden sm:flex items-center gap-1.5 px-2 py-1 rounded-lg border border-[#2a2a2a] hover:border-[#444] transition-all bg-[#141414]"
          title="Cambiar moneda"
        >
          <span className={`text-[10px] font-bold ${currency === 'COP' ? 'text-[#FF5C3A]' : 'text-[#555]'}`}>COP</span>
          <div className="w-px h-2.5 bg-[#2a2a2a]" />
          <span className={`text-[10px] font-bold ${currency === 'USD' ? 'text-[#FF5C3A]' : 'text-[#555]'}`}>USD</span>
        </button>
      </div>

      <div className="flex items-center gap-1 md:gap-2">
        {/* Selector móvil */}
        <button
          onClick={toggleCurrency}
          className="sm:hidden flex items-center justify-center w-8 h-8 rounded-lg border border-[#2a2a2a] bg-[#141414] text-[10px] font-bold text-[#FF5C3A]"
        >
          {currency}
        </button>

        <Link
          href="/planes"
          className="text-[13px] text-[#888] hover:text-white px-2 md:px-3.5 py-1.5 rounded-md transition-colors hidden sm:block"
        >
          Planes
        </Link>

        {session ? (
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setDropdownOpen(v => !v)}
              className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-[#1a1a1a] transition-colors"
            >
              <div className="w-7 h-7 rounded-full bg-[#FF5C3A] flex items-center justify-center flex-shrink-0">
                <span className="text-[11px] font-bold text-white">{initials}</span>
              </div>
              <span className="text-[13px] text-[#ccc] hidden sm:block max-w-[120px] truncate">
                {session.name || session.email}
              </span>
              <svg className={`w-3.5 h-3.5 text-[#666] transition-transform hidden sm:block ${dropdownOpen ? 'rotate-180' : ''}`}
                fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {dropdownOpen && (
              <div className="absolute right-0 top-full mt-1.5 w-52 bg-[#141414] border border-[#2a2a2a] rounded-xl shadow-xl overflow-hidden z-50">
                <div className="px-4 py-3 border-b border-[#2a2a2a]">
                  <p className="text-[13px] font-semibold text-white truncate">{session.name}</p>
                  <p className="text-[11px] text-[#666] truncate mt-0.5">{session.email}</p>
                </div>
                <Link href="/dashboard" onClick={() => setDropdownOpen(false)}
                  className="flex items-center gap-2.5 px-4 py-2.5 text-[13px] text-[#ccc] hover:bg-[#1f1f1f] hover:text-white transition-colors">
                  <svg className="w-4 h-4 text-[#666]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001m-6 0h6" />
                  </svg>
                  Ir al dashboard
                </Link>
                <button onClick={handleLogout}
                  className="w-full flex items-center gap-2.5 px-4 py-2.5 text-[13px] text-[#999] hover:bg-[#1f1f1f] hover:text-[#ff6b6b] transition-colors">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  Cerrar sesión
                </button>
              </div>
            )}
          </div>
        ) : (
          <Link href="/login" className="text-[13px] bg-[#FF5C3A] sm:bg-transparent text-white sm:text-[#888] sm:hover:text-white font-medium sm:font-normal px-4 sm:px-3.5 py-1.5 rounded-md transition-colors">
            Iniciar sesión
          </Link>
        )}

        {!session && (
          <Link href={resolvedCtaHref} className="hidden sm:block text-[13px] font-medium bg-[#FF5C3A] hover:bg-[#e84d2c] text-white px-3 md:px-4 py-1.5 rounded-md transition-colors">
            {resolvedCtaLabel}
          </Link>
        )}
      </div>
    </nav>
  );
}
