'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function TrialPaymentPage() {
  const router = useRouter();

  useEffect(() => {
    const timer = window.setTimeout(() => {
      router.replace('/trial-checkout');
    }, 1400);

    return () => window.clearTimeout(timer);
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-[#0a0a0a]">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="font-jakarta font-extrabold text-xl text-white tracking-tight">
            Look<span className="text-[#FF5C3A]">itry</span>
          </Link>
        </div>

        <div className="bg-[#141414] border border-[#2a2a2a] rounded-xl p-7 md:p-8">
          <div className="w-14 h-14 rounded-full bg-[#1f1f1f] flex items-center justify-center mx-auto mb-5">
            <svg className="w-7 h-7 text-[#FF5C3A]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H6.75A2.25 2.25 0 004.5 8.25v9A2.25 2.25 0 006.75 19.5h10.5a2.25 2.25 0 002.25-2.25V10.5M13.5 6l6 6m-6-6v4.5a1.5 1.5 0 001.5 1.5H19.5" />
            </svg>
          </div>

          <h1 className="font-jakarta font-bold text-[22px] text-white mb-2 text-center">
            Redirigiendo al checkout oficial
          </h1>

          <p className="text-[13px] text-[#999] mb-6 text-center leading-relaxed">
            Este acceso pertenecía al flujo antiguo de trial autenticado. Lookitry ahora inicia el trial desde un solo checkout
            antes de crear la cuenta, con referencias <span className="text-white font-medium">GUEST-TRIAL-*</span>.
          </p>

          <div className="space-y-2.5 mb-6">
            {[
              'Pago primero, acceso después',
              'Una sola referencia para clientes nuevos',
              'Mismo flujo para trial, registro y activación',
              'Sin duplicar estados entre cuenta y pago',
            ].map((item) => (
              <div key={item} className="flex items-center gap-2.5">
                <div className="w-4 h-4 rounded-full bg-[rgba(255,92,58,0.13)] flex items-center justify-center flex-shrink-0">
                  <svg width="8" height="8" viewBox="0 0 10 10" fill="none">
                    <path d="M2 5l2.5 2.5L8 3" stroke="#FF5C3A" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
                <span className="text-[13px] text-[#888]">{item}</span>
              </div>
            ))}
          </div>

          <button
            onClick={() => router.replace('/trial-checkout')}
            className="w-full bg-[#FF5C3A] hover:bg-[#e84d2c] text-white font-medium py-2.5 rounded-lg text-[13px] transition-colors flex items-center justify-center gap-2"
          >
            Ir al checkout trial
          </button>

          <p className="text-center text-[11px] text-[#999] mt-4 leading-relaxed">
            Si llegaste desde un enlace viejo, te llevamos al flujo correcto automáticamente.
          </p>
        </div>
      </div>
    </div>
  );
}
