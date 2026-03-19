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
  const paypalToken = searchParams.get('token'); // PayPal devuelve el orderId en el param 'token'
  
  const [dashboardHref, setDashboardHref] = useState<string>('/login');
  const [loading, setLoading] = useState<boolean>(method === 'paypal');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function validatePayment() {
      if (method === 'paypal' && paypalToken) {
        try {
          const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.pruebalo.wilkiedevs.com';
          const res = await fetch(`${API_URL}/api/payments/paypal/capture`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ orderId: paypalToken, reference: ref }),
          });
          const data = await res.json();
          if (!res.ok) throw new Error(data.message || 'Error al capturar el pago');
          
          const token = localStorage.getItem('token') || localStorage.getItem('brandToken');
          const isVisitor = ref?.includes('visitor_') || !token;

          if (isVisitor && ref) {
            setDashboardHref(`/registro-pro?ref=${encodeURIComponent(ref)}&months=${months}&method=paypal&orderId=${paypalToken}`);
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
        const isVisitor = ref?.includes('visitor_') || !token;

        if (isVisitor && ref) {
          setDashboardHref(`/registro-pro?ref=${encodeURIComponent(ref)}&months=${months}`);
        } else if (token) {
          setDashboardHref('/dashboard');
        } else {
          setDashboardHref('/login');
        }
      }

    validatePayment();
  }, [ref, months, method, paypalToken]);

  const dashboardLabel = dashboardHref.startsWith('/registro-pro')
    ? 'Crear mi cuenta'
    : 'Ir al dashboard';

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center px-4 bg-[#0a0a0a]">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-t-transparent border-[#FF5C3A] rounded-full animate-spin mx-auto mb-4"></div>
          <h2 className="text-white font-syne text-xl">Validando tu pago con PayPal...</h2>
          <p className="text-[#666] text-sm mt-2">Esto tomará solo unos segundos.</p>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="min-h-screen flex items-center justify-center px-4 bg-[#0a0a0a]">
        <div className="w-full max-w-md bg-[#141414] border border-[#2a2a2a] rounded-xl p-8 text-center">
          <div className="w-16 h-16 bg-red-500/10 border border-red-500/20 rounded-full flex items-center justify-center mx-auto mb-5 text-red-500">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 6L6 18M6 6l12 12" /></svg>
          </div>
          <h1 className="text-white font-syne text-xl mb-4">¡Ups! Algo salió mal</h1>
          <p className="text-[#666] text-sm mb-8">{error}</p>
          <Link href="/checkout" className="block w-full py-2.5 bg-[#FF5C3A] text-white font-medium rounded-lg">Volver al checkout</Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-4 bg-[#0a0a0a]">
      <div className="w-full max-w-md">

        {/* Logo */}
        <div className="flex justify-center mb-8">
          <Link href="/" className="flex items-center gap-2.5">
            <Image src="/logo.svg" alt="Lookitry" width={28} height={28} className="object-contain h-7 w-auto" priority />
            <span className="font-syne font-extrabold text-xl text-white tracking-tight">
              Look<span className="text-[#FF5C3A]">itry</span>
            </span>
          </Link>
        </div>

        <div className="bg-[#141414] border border-[#2a2a2a] rounded-xl p-7 md:p-8 text-center">

          <div className="w-16 h-16 bg-[rgba(255,92,58,0.1)] border border-[rgba(255,92,58,0.2)] rounded-full flex items-center justify-center mx-auto mb-5">
            <IconCheck />
          </div>

          <h1 className="font-syne font-bold text-[24px] text-white mb-2">
            Pago recibido
          </h1>
          <p className="text-[14px] text-[#666] mb-6">
            {dashboardHref.startsWith('/registro-pro')
              ? 'Tu pago fue confirmado. Ahora crea tu cuenta para activar el plan.'
              : `Tu pago fue procesado correctamente. Tu Plan ${plan} por ${months} ${months === 1 ? 'mes' : 'meses'} ya está activo.`}
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
              href={dashboardHref}
              className="block w-full py-2.5 bg-[#FF5C3A] hover:bg-[#e84d2c] text-white font-medium rounded-lg transition-colors text-[13px]"
            >
              {dashboardLabel}
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
