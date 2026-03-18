'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export function LandingPricingCard() {
  const router = useRouter();
  const [landingPrice, setLandingPrice] = useState(650000);
  const [landingOriginal, setLandingOriginal] = useState(900000);

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL || 'https://api.pruebalo.wilkiedevs.com'}/api/payment-settings/public`)
      .then(r => r.ok ? r.json() : null)
      .then(d => {
        if (d?.landingPrice) setLandingPrice(d.landingPrice);
        if (d?.landingOriginalPrice) setLandingOriginal(d.landingOriginalPrice);
      })
      .catch(() => {});
  }, []);

  const discountPct = Math.round((1 - landingPrice / landingOriginal) * 100);

  return (
    <div className="bg-[#0a0a0a] rounded-3xl overflow-hidden border border-[#2a2a2a]">
      {/* Preview mockup */}
      <div className="relative" aria-hidden="true">
        <div className="flex items-center gap-1.5 px-4 py-3 border-b border-[#1f1f1f]">
          <span className="w-2 h-2 rounded-full bg-[#ff5c5c]" />
          <span className="w-2 h-2 rounded-full bg-[#ffbd2e]" />
          <span className="w-2 h-2 rounded-full bg-[#28c840]" />
          <div className="flex-1 bg-[#1a1a1a] border border-[#2a2a2a] rounded px-3 py-1 text-[10px] text-[#444] text-center truncate ml-1">
            pruebalo.wilkiedevs.com/sitio/<span className="text-[#FF5C3A]">tu-marca</span>
          </div>
        </div>
        <div className="h-16 flex flex-col items-center justify-center gap-1" style={{ background: 'linear-gradient(135deg,#FF5C3A,#c73d1e)' }}>
          <div className="w-16 h-2.5 rounded-full bg-white/70" />
          <div className="w-24 h-1.5 rounded-full bg-white/40" />
        </div>
        <div className="grid grid-cols-3 gap-2 p-3">
          {[0, 1, 2].map(i => (
            <div key={i} className="aspect-square rounded-xl bg-[#1a1a1a] border border-[#2a2a2a]" />
          ))}
        </div>
        <div className="px-3 pb-3">
          <div className="w-full h-8 rounded-xl bg-[#FF5C3A]/80 flex items-center justify-center">
            <div className="w-20 h-1.5 rounded-full bg-white/50" />
          </div>
        </div>
      </div>

      {/* Precio y CTA */}
      <div className="px-6 py-6 border-t border-[#1f1f1f]">
        <div className="flex items-center justify-between mb-1">
          <span className="text-[#555] text-sm line-through">${landingOriginal.toLocaleString('es-CO')} COP</span>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#FF5C3A]/20 text-[#FF5C3A] uppercase tracking-wider">
            {discountPct}% OFF
          </span>
        </div>
        <div className="flex items-baseline gap-1 mb-1">
          <span className="font-syne text-4xl font-extrabold text-white">
            ${landingPrice.toLocaleString('es-CO')}
          </span>
          <span className="text-[#555] text-sm">COP</span>
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
        <p className="text-[11px] text-[#444] text-center mt-3">Incluido al contratar cualquier plan</p>
      </div>
    </div>
  );
}
