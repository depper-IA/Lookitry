'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { formatPrice } from '@/utils/currency';

export function LandingPricingCard() {
  const router = useRouter();
  const [landingPrice, setLandingPrice] = useState(650000);
  const [landingOriginal, setLandingOriginal] = useState(900000);
  const [currency, setCurrency] = useState<'COP' | 'USD'>('COP');
  const [trm, setTrm] = useState(3900);

  useEffect(() => {
    // 1. Cargar precios y TRM
    fetch(`${process.env.NEXT_PUBLIC_API_URL || 'https://api.pruebalo.wilkiedevs.com'}/api/payment-settings/public`)
      .then(r => r.ok ? r.json() : null)
      .then(d => {
        if (d?.landingPrice) setLandingPrice(d.landingPrice);
        if (d?.landingOriginalPrice) setLandingOriginal(d.landingOriginalPrice);
        if (d?.trm) setTrm(d.trm);
      })
      .catch(() => {});

    // 2. Detectar moneda actual
    const saved = localStorage.getItem('currency') as 'COP' | 'USD';
    if (saved) setCurrency(saved);

    const handleCurrencyChange = () => {
      const current = localStorage.getItem('currency') as 'COP' | 'USD';
      if (current) setCurrency(current);
    };

    window.addEventListener('currencyChange', handleCurrencyChange);
    return () => window.removeEventListener('currencyChange', handleCurrencyChange);
  }, []);

  const discountPct = Math.round((1 - landingPrice / landingOriginal) * 100);

  return (
    <div className="bg-[#0a0a0a] rounded-3xl overflow-hidden border border-[#2a2a2a]">
      {/* Preview mockup */}
      <div className="relative w-full aspect-[4/3] border-b border-[#1f1f1f]" aria-hidden="true">
        <Image src="/hero/promo_landing.png" alt="Demo de Mini-Landing" fill className="object-cover" sizes="(max-width: 768px) 100vw, 420px" />
      </div>

      {/* Precio y CTA */}
      <div className="px-6 py-6 border-t border-[#1f1f1f]">
        <div className="flex items-center justify-between mb-1">
          <span className="text-[#555] text-sm line-through">
            {formatPrice(landingOriginal, currency, trm)}
          </span>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#FF5C3A]/20 text-[#FF5C3A] uppercase tracking-wider">
            {discountPct}% OFF
          </span>
        </div>
        <div className="flex items-baseline gap-1 mb-1">
          <span className="font-syne text-4xl font-extrabold text-white">
            {formatPrice(landingPrice, currency, trm)}
          </span>
        </div>
        <p className="text-[12px] text-[#555] mb-5">Pago único · Sin mensualidad adicional</p>

        <ul className="space-y-2 mb-6">
          {['Página pública activa', 'Probador IA integrado', '3 templates incluidos', 'WhatsApp flotante', 'Activación inmediata'].map(f => (
            <li key={f} className="flex items-center gap-2 text-[13px] text-[#888]">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
                <circle cx="7" cy="7" r="7" fill="rgba(255,92,58,0.15)" />
                <path d="M4 7l2 2 4-4" stroke="#FF5C3A" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              {f}
            </li>
          ))}
        </ul>

        <button
          onClick={() => router.push('/checkout?plan=LANDING')}
          className="w-full py-3.5 rounded-2xl text-white text-[14px] font-bold transition-all duration-200 hover:opacity-90 hover:-translate-y-0.5 active:scale-95 focus-visible:ring-2 focus-visible:ring-[#FF5C3A]"
          style={{ background: '#FF5C3A', boxShadow: '0 8px 24px rgba(255,92,58,0.35)' }}
        >
          Obtener mi mini-landing
        </button>
        <p className="text-[11px] text-[#444] text-center mt-3">Servicio adicional · Pago único</p>
      </div>
    </div>
  );
}
