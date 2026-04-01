'use client';

import React from 'react';
import Image from 'next/image';
import { ShieldCheck, Check, Zap } from 'lucide-react';

const PAYMENT_LOGOS = [
  { name: 'Visa', url: '/payment-visa.svg' },
  { name: 'Mastercard', url: '/payment-mastercard.svg' },
  { name: 'PSE', url: '/payment-pse.svg' },
  { name: 'Nequi', url: '/payment-nequi.svg' },
  { name: 'Bancolombia', url: '/payment-bancolombia.svg' },
  { name: 'PayPal', url: '/payment-paypal.svg' },
];

export default function LandingPayments() {
  return (
    <section className="bg-[#0a0a0a] py-32 px-6">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <div className="flex items-center justify-center gap-2 mb-4 text-[#10b981]">
            <ShieldCheck size={18} />
            <span className="text-[10px] font-bold uppercase tracking-[.25em]">Transacciones Protegidas</span>
          </div>
          <h2 className="font-jakarta font-bold text-4xl text-white mb-4">Medios de pago disponibles</h2>
          <p className="text-sm text-white/80 max-w-md mx-auto font-dm-sans font-light">
            Utilizamos pasarelas certificadas Wompi y PayPal para garantizar que tus datos estén siempre seguros.
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-12 lg:gap-16 transition-all duration-700">
          {PAYMENT_LOGOS.map((logo) => (
            <div key={logo.name} className="relative h-10 w-28 brightness-0 invert hover:scale-110 transition-all duration-300">
              <Image
                src={logo.url}
                alt={logo.name}
                title={logo.name}
                fill
                className="object-contain"
              />
            </div>
          ))}
        </div>

        <div className="mt-16 flex flex-wrap items-center justify-center gap-10 text-[10px] text-white font-bold uppercase tracking-[0.2em]">
          <span className="flex items-center gap-2 hover:text-[#FF5C3A] transition-colors">
            <ShieldCheck size={16} className="text-[#FF5C3A]" /> SSL Encrypted 256-bit
          </span>
          <span className="flex items-center gap-2 hover:text-[#FF5C3A] transition-colors">
            <Check size={16} className="text-[#FF5C3A]" /> PCI DSS Verified
          </span>
          <span className="flex items-center gap-2 hover:text-[#FF5C3A] transition-colors">
            <Zap size={16} className="text-[#FF5C3A]" /> Activación Inmediata
          </span>
        </div>
      </div>
    </section>
  );
}
