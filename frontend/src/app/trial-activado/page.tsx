'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function TrialActivadoPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirigir al dashboard después de 3 segundos
    const t = setTimeout(() => router.push('/dashboard'), 3000);
    return () => clearTimeout(t);
  }, [router]);

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4 py-12"
      style={{ fontFamily: 'DM Sans, sans-serif', background: '#0a0a0a' }}
    >
      <div className="w-full max-w-md">

        <div className="text-center mb-8">
          <Link href="/" style={{ fontFamily: 'Syne, sans-serif' }} className="font-extrabold text-xl text-white tracking-tight">
            Virtual<span className="text-[#FF5C3A]">Try</span>On
          </Link>
        </div>

        <div className="bg-[#141414] border border-[#2a2a2a] rounded-xl p-8 text-center">

          <div className="w-16 h-16 rounded-full bg-[#0f2a1a] flex items-center justify-center mx-auto mb-5">
            <svg className="w-8 h-8 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>

          <h1 style={{ fontFamily: 'Syne, sans-serif' }} className="font-bold text-[22px] text-white mb-2">
            Trial activado
          </h1>
          <p className="text-[13px] text-[#555] mb-6 leading-relaxed">
            Tu tarjeta fue verificada correctamente. Ya tienes acceso completo durante tu período de prueba.
          </p>

          <div className="bg-[#0f0f0f] border border-[#2a2a2a] rounded-lg px-4 py-3 mb-6">
            <p className="text-[12px] text-[#444]">
              El cobro de $100 COP será reembolsado automáticamente en los próximos días hábiles.
            </p>
          </div>

          <p className="text-[12px] text-[#333]">Redirigiendo al dashboard...</p>

          <Link
            href="/dashboard"
            className="inline-block mt-4 bg-[#FF5C3A] hover:bg-[#e84d2c] text-white text-[13px] font-medium px-6 py-2.5 rounded-lg transition-colors"
          >
            Ir al dashboard ahora
          </Link>
        </div>

      </div>
    </div>
  );
}
