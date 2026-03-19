
'use client';

import React from 'react';

const LOGOS = [
  { name: 'Visa', url: '/payment-visa.svg' },
  { name: 'Mastercard', url: '/payment-mastercard.svg' },
  { name: 'PSE', url: '/payment-pse.svg' },
  { name: 'Nequi', url: '/payment-nequi.svg' },
  { name: 'Bancolombia', url: '/payment-bancolombia.svg' },
  { name: 'PayPal', url: '/payment-paypal.svg' },
];

export function PaymentTrustBadges() {
  return (
    <section className="py-12 bg-[#0a0a0a] border-t border-[#1a1a1a]">
      <div className="max-w-6xl mx-auto px-6">
        <div className="flex flex-col items-center text-center mb-8">
          <div className="flex items-center gap-2 mb-2 text-[#10b981]">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
            <span className="text-xs font-bold uppercase tracking-widest">Pagos 100% Seguros</span>
          </div>
          <h2 className="font-syne font-extrabold text-2xl text-white">Medios de pago aceptados</h2>
          <p className="text-sm text-[#666] mt-2 max-w-md">
            Procesamos tus pagos de forma segura a través de Wompi y PayPal con encriptación de grado bancario.
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-8 md:gap-14 opacity-80 hover:opacity-100 transition-opacity duration-500">
          {LOGOS.map((logo) => (
            <img
              key={logo.name}
              src={logo.url}
              alt={logo.name}
              title={logo.name}
              className="h-8 md:h-10 w-auto object-contain transition-all duration-300 hover:scale-110"
            />
          ))}
        </div>
        
        <div className="mt-10 flex flex-wrap items-center justify-center gap-6 text-[11px] text-[#444] font-medium uppercase tracking-tighter">
          <span className="flex items-center gap-1.5">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
            SSL Encrypted
          </span>
          <span className="flex items-center gap-1.5">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            PCI Compliance
          </span>
          <span className="flex items-center gap-1.5">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
            Activación Instantánea
          </span>
        </div>
      </div>
    </section>
  );
}
