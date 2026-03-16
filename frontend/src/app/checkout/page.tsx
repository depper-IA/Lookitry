'use client';

import { useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.pruebalo.wilkiedevs.com';

const PLAN_FEATURES = [
  '15 productos en el probador',
  '1.200 generaciones por mes',
  'Templates Minimal, Modern y Bold',
  'Texto del botón personalizado',
  'Mensaje de bienvenida en widget',
  'Modificación del slug del probador',
  'Soporte prioritario',
];

const DURATION_LABELS: Record<number, string> = {
  1: '1 mes', 3: '3 meses', 6: '6 meses', 12: '12 meses',
};

const DISCOUNTS: Record<number, number> = { 1: 0, 3: 5, 6: 10, 12: 15 };

function formatCOP(n: number) {
  return '$' + n.toLocaleString('es-CO');
}

function IconCheck() {
  return (
    <svg width="8" height="8" viewBox="0 0 10 10" fill="none" className="flex-shrink-0 mt-0.5">
      <path d="M2 5l2.5 2.5L8 3" stroke="#FF5C3A" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IconLock() {
  return (
    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
    </svg>
  );
}

function IconSpinner() {
  return (
    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round"
        d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
    </svg>
  );
}

function IconArrowLeft() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
    </svg>
  );
}

function CheckoutContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const months = parseInt(searchParams.get('months') || '1', 10);
  const discount = DISCOUNTS[months] ?? 0;
  const baseMonthly = 250000;
  const discountedMonthly = Math.round(baseMonthly * (1 - discount / 100));
  const total = discountedMonthly * months;
  const originalTotal = baseMonthly * months;

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handlePagar = async () => {
    setLoading(true);
    setError('');
    try {
      const token = typeof window !== 'undefined'
        ? (localStorage.getItem('token') || localStorage.getItem('brandToken'))
        : null;

      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch(
        `${API_URL}/api/payments/wompi/checkout-url?amount=${total}&months=${months}`,
        { headers }
      );

      if (!res.ok) {
        let msg = `Error ${res.status}`;
        try { const d = await res.json(); msg = d.error || d.message || msg; } catch {}
        throw new Error(msg);
      }

      const { checkoutUrl } = await res.json();
      if (!checkoutUrl) throw new Error('No se recibió la URL de pago');
      window.location.href = checkoutUrl;
    } catch (err: any) {
      setError(err.message || 'Error al conectar con el servidor de pagos');
      setLoading(false);
    }
  };

  return (
    <main style={{ fontFamily: 'DM Sans, sans-serif' }} className="min-h-screen bg-[#0a0a0a]">

      {/* Nav */}
      <nav className="bg-[#0a0a0a] border-b border-[#1a1a1a] px-6 md:px-8 h-14 flex items-center justify-between sticky top-0 z-50">
        <Link href="/" style={{ fontFamily: 'Syne, sans-serif' }} className="font-extrabold text-base text-white tracking-tight">
          Virtual<span className="text-[#FF5C3A]">Try</span>On
        </Link>
        <div className="flex items-center gap-1.5 text-[12px] text-[#444]">
          <IconLock />
          Pago seguro con Wompi
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-4 md:px-6 py-10">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-1.5 text-[13px] text-[#555] hover:text-[#aaa] transition-colors mb-8"
        >
          <IconArrowLeft />
          Volver
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 items-start">

          {/* Resumen del pedido */}
          <div className="lg:col-span-3 bg-[#141414] border border-[#2a2a2a] rounded-xl p-6 md:p-7">
            <h1 style={{ fontFamily: 'Syne, sans-serif' }} className="font-bold text-[20px] text-white mb-1">
              Resumen del pedido
            </h1>
            <p className="text-[13px] text-[#555] mb-6">Revisa los detalles antes de continuar al pago</p>

            {/* Plan */}
            <div className="flex items-start justify-between bg-[rgba(255,92,58,0.06)] border border-[rgba(255,92,58,0.15)] rounded-xl p-4 mb-6">
              <div>
                <div className="text-[11px] font-bold text-[#FF5C3A] uppercase tracking-wide mb-0.5">Plan Pro</div>
                <div className="font-semibold text-white text-[15px]">{DURATION_LABELS[months] ?? `${months} meses`}</div>
                {discount > 0 && (
                  <div className="text-[12px] text-[#FF5C3A] mt-0.5">{discount}% de descuento aplicado</div>
                )}
              </div>
              <div className="text-right">
                <div style={{ fontFamily: 'Syne, sans-serif' }} className="font-extrabold text-[20px] text-white">
                  {formatCOP(total)}
                </div>
                {discount > 0 && (
                  <div className="text-[12px] text-[#333] line-through">{formatCOP(originalTotal)}</div>
                )}
                {months > 1 && (
                  <div className="text-[12px] text-[#555]">{formatCOP(discountedMonthly)}/mes</div>
                )}
              </div>
            </div>

            {/* Incluye */}
            <p className="text-[11px] font-semibold text-[#444] uppercase tracking-wide mb-3">Incluye</p>
            <ul className="space-y-2 mb-6">
              {PLAN_FEATURES.map(f => (
                <li key={f} className="flex items-start gap-2.5 text-[13px] text-[#777]">
                  <span className="w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 bg-[rgba(255,92,58,0.13)]">
                    <IconCheck />
                  </span>
                  {f}
                </li>
              ))}
            </ul>

            <div className="border-t border-[#2a2a2a] pt-4 flex items-center justify-between">
              <span className="text-[13px] font-medium text-[#666]">Total a pagar</span>
              <span style={{ fontFamily: 'Syne, sans-serif' }} className="font-extrabold text-[22px] text-white">
                {formatCOP(total)} COP
              </span>
            </div>
          </div>

          {/* Panel de pago */}
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-[#141414] border border-[#2a2a2a] rounded-xl p-6">
              <h2 style={{ fontFamily: 'Syne, sans-serif' }} className="font-bold text-[16px] text-white mb-1">
                Método de pago
              </h2>
              <p className="text-[12px] text-[#555] mb-5">
                Serás redirigido a Wompi para completar el pago de forma segura.
                Aceptamos tarjetas débito, crédito, PSE y Nequi.
              </p>

              {error && (
                <div className="bg-[#1f0f0f] border border-[#5a1a1a] text-[#ff6b6b] text-[12px] rounded-lg px-3 py-2 mb-4">
                  {error}
                </div>
              )}

              <button
                onClick={handlePagar}
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 bg-[#FF5C3A] hover:bg-[#e84d2c] disabled:opacity-60 text-white font-medium py-3 rounded-lg transition-colors text-[13px]"
              >
                {loading ? <IconSpinner /> : null}
                {loading ? 'Redirigiendo...' : `Pagar ${formatCOP(total)} COP`}
              </button>

              <div className="flex items-center justify-center gap-1.5 mt-3 text-[11px] text-[#333]">
                <IconLock />
                Pago procesado por Wompi — 100% seguro
              </div>
            </div>

            <div className="bg-[#141414] border border-[#2a2a2a] rounded-xl p-5 text-[12px] text-[#444] space-y-1.5">
              <p>El plan se activa inmediatamente después del pago.</p>
              <p>Si no tienes cuenta, podrás crearla en el siguiente paso.</p>
              <p>
                ¿Tienes dudas?{' '}
                <a href="mailto:info@pruebalo.wilkiedevs.com" className="text-[#FF5C3A] hover:underline">
                  Escríbenos
                </a>
              </p>
            </div>
          </div>

        </div>
      </div>
    </main>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center text-[#333] text-[13px]">
        Cargando...
      </div>
    }>
      <CheckoutContent />
    </Suspense>
  );
}
