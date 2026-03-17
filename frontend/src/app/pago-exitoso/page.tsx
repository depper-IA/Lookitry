'use client';

import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Suspense } from 'react';
import Image from 'next/image';

function IconCheck() {
  return (
    <svg className="w-8 h-8" fill="none" stroke="#FF5C3A" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
    </svg>
  );
}

function PagoExitosoContent() {
  const searchParams = useSearchParams();
  const plan = searchParams.get('plan') || 'PRO';
  const months = Number(searchParams.get('months') || 1);
  const ref = searchParams.get('ref');

  return (
    <main
      className="min-h-screen flex items-center justify-center px-4"
      style={{ fontFamily: 'DM Sans, sans-serif', background: '#0a0a0a' }}
    >
      <div className="w-full max-w-md">

        {/* Logo */}
        <div className="flex justify-center mb-8">
          <Link href="/">
            <Image src="/logo.png" alt="Lookitry" width={140} height={40} priority />
          </Link>
        </div>

        <div className="bg-[#141414] border border-[#2a2a2a] rounded-xl p-7 md:p-8 text-center">

          {/* Icono */}
          <div className="w-16 h-16 bg-[rgba(255,92,58,0.1)] border border-[rgba(255,92,58,0.2)] rounded-full flex items-center justify-center mx-auto mb-5">
            <IconCheck />
          </div>

          <h1 style={{ fontFamily: 'Syne, sans-serif' }} className="font-bold text-[24px] text-white mb-2">
            Pago recibido
          </h1>
          <p className="text-[14px] text-[#666] mb-6">
            Tu pago fue procesado correctamente. En breve activaremos tu Plan {plan} por{' '}
            {months} {months === 1 ? 'mes' : 'meses'}.
          </p>

          {ref && (
            <div className="bg-[#0f0f0f] border border-[#2a2a2a] rounded-lg px-4 py-3 mb-6 text-left">
              <p className="text-[11px] text-[#444] mb-1 uppercase tracking-wide">Referencia de pago</p>
              <p className="text-[13px] font-mono text-[#888] break-all">{ref}</p>
            </div>
          )}

          <div className="bg-[rgba(255,92,58,0.06)] border border-[rgba(255,92,58,0.15)] rounded-lg px-4 py-3 mb-6 text-[13px] text-[#888] text-left">
            Recibirás un correo de confirmación con los detalles de tu suscripción.
            Si tienes dudas escríbenos a{' '}
            <a href="mailto:info@pruebalo.wilkiedevs.com" className="text-[#FF5C3A] hover:underline">
              info@pruebalo.wilkiedevs.com
            </a>
          </div>

          <div className="flex flex-col gap-3">
            <Link
              href="/login"
              className="block w-full py-2.5 bg-[#FF5C3A] hover:bg-[#e84d2c] text-white font-medium rounded-lg transition-colors text-[13px]"
            >
              Ir al dashboard
            </Link>
            <Link
              href="/"
              className="block w-full py-2.5 border border-[#2a2a2a] hover:border-[#444] text-[#666] hover:text-[#aaa] font-medium rounded-lg transition-colors text-[13px]"
            >
              Volver al inicio
            </Link>
          </div>

        </div>
      </div>
    </main>
  );
}

export default function PagoExitosoPage() {
  return (
    <Suspense>
      <PagoExitosoContent />
    </Suspense>
  );
}
