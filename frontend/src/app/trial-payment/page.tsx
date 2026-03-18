'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function TrialPaymentPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [trialDays, setTrialDays] = useState(7);

  useEffect(() => {
    // Verificar que hay sesión activa
    const token = localStorage.getItem('token') || localStorage.getItem('brandToken');
    if (!token) {
      router.push('/register');
      return;
    }
    // Obtener días del trial
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/trial/status`)
      .then(r => r.json())
      .then(d => { if (d.trial_days) setTrialDays(d.trial_days); })
      .catch(() => {});
  }, [router]);

  const handleProceed = async () => {
    setError('');
    setLoading(true);
    try {
      const token = localStorage.getItem('token') || localStorage.getItem('brandToken');
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/trial/initiate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message || 'Error al iniciar el proceso de verificación');
        return;
      }
      // Redirigir a Wompi
      window.location.href = data.checkoutUrl;
    } catch {
      setError('Error de conexión. Intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-[#0a0a0a]">
      <div className="w-full max-w-md">

        <div className="text-center mb-8">
          <Link href="/" className="font-syne font-extrabold text-xl text-white tracking-tight">
            Look<span className="text-[#FF5C3A]">itry</span>
          </Link>
        </div>

        <div className="bg-[#141414] border border-[#2a2a2a] rounded-xl p-7 md:p-8">

          {/* Icono tarjeta */}
          <div className="w-14 h-14 rounded-full bg-[#1f1f1f] flex items-center justify-center mx-auto mb-5">
            <svg className="w-7 h-7 text-[#FF5C3A]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z" />
            </svg>
          </div>

          <h1 className="font-syne font-bold text-[22px] text-white mb-2 text-center">
            Verifica tu tarjeta
          </h1>
          <p className="text-[13px] text-[#555] mb-6 text-center leading-relaxed">
            Para activar tu prueba de {trialDays} días necesitamos verificar tu tarjeta. Solo se realizará un cobro de{' '}
            <span className="text-white font-medium">$100 COP</span> que será reembolsado automáticamente.
          </p>

          {/* Beneficios */}
          <div className="space-y-2.5 mb-6">
            {[
              `${trialDays} días de acceso completo`,
              'Sin cobros adicionales durante el trial',
              'Cancela antes de que termine sin cargos',
              'Reembolso automático del cobro de verificación',
            ].map(item => (
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

          {error && (
            <div className="bg-[#1f0f0f] border border-[#5a1a1a] text-[#ff6b6b] text-[13px] px-4 py-3 rounded-lg mb-4">
              {error}
            </div>
          )}

          <button
            onClick={handleProceed}
            disabled={loading}
            className="w-full bg-[#FF5C3A] hover:bg-[#e84d2c] disabled:opacity-50 text-white font-medium py-2.5 rounded-lg text-[13px] transition-colors flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
                Redirigiendo...
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
                Verificar tarjeta con Wompi
              </>
            )}
          </button>

          <p className="text-center text-[11px] text-[#333] mt-4 leading-relaxed">
            El pago es procesado de forma segura por Wompi. No almacenamos datos de tu tarjeta.
          </p>
        </div>

      </div>
    </div>
  );
}
