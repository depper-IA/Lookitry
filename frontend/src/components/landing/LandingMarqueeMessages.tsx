'use client';

import React from 'react';
import { 
  TrendingUp, 
  Shirt, 
  Zap, 
  Sparkles, 
  ShoppingBag, 
  ArrowDown, 
  Handshake, 
  X 
} from 'lucide-react';

const messages = [
  { text: 'Sin devoluciones, sin perdida de ventas', Icon: TrendingUp },
  { text: 'Tus clientes se prueben la ropa antes de comprar', Icon: Shirt },
  { text: 'Activacion en 10 minutos, sin codigo', Icon: Zap },
  { text: 'IA generativa que muestra resultados realistas', Icon: Sparkles },
  { text: 'Compatible con Shopify, WooCommerce, Wix y mas', Icon: ShoppingBag },
  { text: 'Reduce devoluciones hasta un 40%', Icon: ArrowDown },
  { text: 'Aumenta la confianza de tus clientes', Icon: Handshake },
  { text: 'Sin apps, sin registro, sin friccion', Icon: X },
];

export default function LandingMarqueeMessages() {
  // Duplicar para loop infinito
  const allMessages = [...messages, ...messages];

  return (
    <section 
      className="relative overflow-hidden bg-[var(--color-dark)] py-4 sm:py-5 -mx-4 sm:-mx-8 md:-mx-16" 
      aria-label="Mensajes destacados"
    >
      {/* Gradiente de fade en los bordes */}
      <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-24 bg-gradient-to-r from-[var(--bg-base)] to-transparent sm:w-32 md:w-40" />
      <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-24 bg-gradient-to-l from-[var(--bg-base)] to-transparent sm:w-32 md:w-40" />

      <div className="relative">
        <div className="overflow-hidden">
          <div className="inline-flex w-max animate-marquee">
            {allMessages.map((msg, idx) => (
              <div
                key={idx}
                className="flex-shrink-0 flex items-center justify-center px-6 sm:px-8 md:px-10"
              >
                <div className="flex items-center gap-2 sm:gap-3">
                  <msg.Icon 
                    size={16} 
                    className="shrink-0 text-accent sm:w-[18px] sm:h-[18px]" 
                    aria-hidden="true" 
                  />
                  <span className="whitespace-nowrap text-xs font-bold uppercase tracking-[0.15em] text-[var(--text-primary)] sm:text-sm sm:tracking-[0.2em]">
                    {msg.text}
                  </span>
                  <span className="mx-2 text-[var(--text-muted)]" aria-hidden="true">|</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .animate-marquee {
          animation: marquee 40s linear infinite;
        }
      `}</style>
    </section>
  );
}