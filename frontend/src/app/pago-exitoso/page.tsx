'use client';

import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Suspense, useEffect, useState } from 'react';
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
  const method = searchParams.get('method');
  const wompiId = searchParams.get('id'); // Wompi Transaction ID
  const paypalToken = searchParams.get('token'); // PayPal devuelve el orderId en el param 'token'
  
  const [dashboardHref, setDashboardHref] = useState<string>('/login');
  const [loading, setLoading] = useState<boolean>(method === 'paypal' || (!ref && !!wompiId));
  const [error, setError] = useState<string | null>(null);
  const [resolvedRef, setResolvedRef] = useState<string | null>(ref);

  useEffect(() => {
    async function validatePayment() {
      let currentRef = ref;

      if (!currentRef && wompiId) {
        try {
          const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.lookitry.com';
          const res = await fetch(`${API_URL}/api/payments/wompi/transaction/${wompiId}`);
          const data = await res.json();
          if (data && data.reference) {
            currentRef = data.reference;
            setResolvedRef(data.reference);
          } else {
            throw new Error('No se pudo verificar la transacción');
          }
        } catch (err: any) {
          setError('No se pudo recuperar la referencia de tu pago de Wompi. Contacta a soporte.');
          setLoading(false);
          return;
        }
      }

      if (method === 'paypal' && paypalToken) {
        try {
          const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.lookitry.com';
          const res = await fetch(`${API_URL}/api/payments/paypal/capture`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ orderId: paypalToken, reference: currentRef }),
          });
          const data = await res.json();
          if (!res.ok) throw new Error(data.message || 'Error al capturar el pago');
          
          const token = localStorage.getItem('token') || localStorage.getItem('brandToken');
          const isVisitor = currentRef?.includes('visitor_') || !token;

          if (isVisitor && currentRef) {
            setDashboardHref(`/registro-pro?ref=${encodeURIComponent(currentRef)}&months=${months}&method=paypal&orderId=${paypalToken}`);
          } else if (token) {
            setDashboardHref('/dashboard');
          } else {
            setDashboardHref('/login');
          }
        } catch (err: any) {
          setError(err.message || 'No se pudo confirmar tu pago. Contacta a soporte.');
        } finally {
          setLoading(false);
        }
      } else {
        const token = localStorage.getItem('token') || localStorage.getItem('brandToken');
        const isVisitor = currentRef?.includes('visitor_') || !token;

        if (isVisitor && currentRef) {
          setDashboardHref(`/registro-pro?ref=${encodeURIComponent(currentRef)}&months=${months}`);
        } else if (token) {
          setDashboardHref('/dashboard');
        } else {
          setDashboardHref('/login');
        }
        setLoading(false);
      }
    }

    validatePayment();
  }, [ref, months, method, paypalToken, wompiId]);

  const dashboardLabel = dashboardHref.startsWith('/registro-pro')
    ? 'Crear mi cuenta'
    : 'Ir al dashboard';

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center px-4" style={{ backgroundColor: 'var(--bg-base)' }}>
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-t-transparent border-[#FF5C3A] rounded-full animate-spin mx-auto mb-4"></div>
          <h2 className="text-white font-syne text-xl">Validando tu pago con PayPal...</h2>
          <p className="text-sm mt-2" style={{ color: 'var(--text-secondary)' }}>Esto tomará solo unos segundos.</p>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="min-h-screen flex items-center justify-center px-4" style={{ backgroundColor: 'var(--bg-base)' }}>
        <div className="w-full max-w-md rounded-xl p-8 text-center border" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
          <div className="w-16 h-16 bg-red-500/10 border border-red-500/20 rounded-full flex items-center justify-center mx-auto mb-5 text-red-500">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 6L6 18M6 6l12 12" /></svg>
          </div>
          <h1 className="text-white font-syne text-xl mb-4">¡Ups! Algo salió mal</h1>
          <p className="text-sm mb-8" style={{ color: 'var(--text-secondary)' }}>{error}</p>
          <Link href="/checkout" className="block w-full py-2.5 bg-[#FF5C3A] text-white font-medium rounded-lg cursor-pointer">Volver al checkout</Link>
        </div>
      </main>
    );
  }

  return (
  return (
    <main className="min-h-screen flex items-center justify-center px-4 bg-[#030303] selection:bg-[#FF5C3A]/30">
      <div className="w-full max-w-md animate-in fade-in duration-700">

        {/* Logo */}
        <div className="flex justify-center mb-10">
          <Link href="/" className="flex items-center gap-3 group transition-transform hover:scale-105 active:scale-95">
            <div className="relative">
              <Image 
                src="/logo.svg" 
                alt="Lookitry" 
                width={32} 
                height={32} 
                className="object-contain h-8 w-auto brightness-110" 
                priority 
              />
              <div className="absolute inset-0 bg-[#FF5C3A]/20 blur-xl rounded-full -z-10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
            </div>
            <span className="font-syne font-extrabold text-2xl text-white tracking-tight">
              Look<span className="text-[#FF5C3A]">itry</span>
            </span>
          </Link>
        </div>

        <div className="rounded-2xl p-8 md:p-10 text-center border bg-[#0a0a0a] border-[#1a1a1a] shadow-[0_20px_50px_rgba(0,0,0,0.5)] relative overflow-hidden">
          
          {/* Subtle decoration */}
          <div className="absolute -top-24 -right-24 w-48 h-48 bg-[#FF5C3A]/5 blur-[80px] rounded-full"></div>
          <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-[#FF5C3A]/5 blur-[80px] rounded-full"></div>

          <div className="w-20 h-20 bg-[#FF5C3A]/10 border border-[#FF5C3A]/20 rounded-full flex items-center justify-center mx-auto mb-6 shadow-[0_0_20px_rgba(255,92,58,0.1)]">
            <IconCheck />
          </div>

          <h1 className="font-syne font-bold text-[28px] text-white mb-3 tracking-tight">
            ¡Pago confirmado!
          </h1>
          <p className="text-[15px] leading-relaxed mb-8 text-[#a0a0a0]">
            {dashboardHref.startsWith('/registro-pro')
              ? 'Todo está listo. Ahora crea tu cuenta para activar tu suscripción y empezar a usar Lookitry.'
              : `Tu plan ya se encuentra activo. Hemos procesado correctamente tu suscripción al Plan ${plan} por ${months} ${months === 1 ? 'mes' : 'meses'}.`}
          </p>

          {ref && (
            <div className="rounded-xl px-5 py-4 mb-8 text-left border bg-[#111111] border-[#1a1a1a]">
              <p className="text-[10px] mb-2 uppercase tracking-[0.1em] font-bold text-[#666]">Referencia de pago</p>
              <p className="text-[12px] font-mono break-all text-[#d1d1d1] leading-relaxed">{ref}</p>
            </div>
          )}

          <div className="bg-[#FF5C3A]/5 border border-[#FF5C3A]/10 rounded-xl px-5 py-4 mb-10 text-[14px] text-left leading-relaxed text-[#a0a0a0]">
            <p>
              Recibirás un correo de confirmación con los detalles. 
              Si tienes dudas, nuestro equipo está listo para ayudarte en{' '}
              <a href="mailto:info@lookitry.com" className="text-[#FF5C3A] font-medium hover:text-[#ff785c] transition-colors decoration-slice">
                info@lookitry.com
              </a>
            </p>
          </div>

          <div className="flex flex-col gap-4 relative z-10">
            <Link
              href={dashboardHref}
              className="block w-full py-4 bg-[#FF5C3A] hover:bg-[#ff785c] active:scale-[0.98] text-white font-bold rounded-xl transition-all shadow-[0_10px_20px_rgba(255,92,58,0.2)] hover:shadow-[0_15px_30px_rgba(255,92,58,0.3)] text-[15px] cursor-pointer"
            >
              {dashboardLabel}
            </Link>
            <Link
              href="/"
              className="block w-full py-4 rounded-xl transition-all text-[15px] font-semibold border border-[#1a1a1a] text-[#a0a0a0] hover:bg-white/5 hover:text-white cursor-pointer"
            >
              Volver al inicio
            </Link>
          </div>

        </div>

        {/* Trust badge/support */}
        <div className="mt-10 text-center">
          <p className="text-[#444] text-[12px] font-medium tracking-wide">
            LOOKITRY SECURE PAYMENTS © 2026
          </p>
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
