'use client';

import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Suspense, useEffect, useState } from 'react';
import Image from 'next/image';

import { Alert } from '@/components/ui/Alert';

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
  const isTrialParam = searchParams.get('isTrial') === 'true';
  const isTrial = resolvedRef?.startsWith('TRIAL-') || resolvedRef?.startsWith('GUEST-TRIAL-') || ref?.startsWith('TRIAL-') || ref?.startsWith('GUEST-TRIAL-') || isTrialParam;

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
          const isTrialRef = currentRef?.startsWith('TRIAL-') || currentRef?.startsWith('GUEST-TRIAL-');
          const isGuestTrial = currentRef?.startsWith('GUEST-TRIAL-');
          const isStandardVisitor = (currentRef?.includes('visitor_') || !token) && !isTrialRef;

          if (isGuestTrial && currentRef) {
            setDashboardHref(`/register?ref=${encodeURIComponent(currentRef)}&isTrial=true`);
          } else if (isStandardVisitor && currentRef) {
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
          const isTrialRef = currentRef?.startsWith('TRIAL-') || currentRef?.startsWith('GUEST-TRIAL-');
          const isGuestTrial = currentRef?.startsWith('GUEST-TRIAL-');
          // Un visitante estándar es alguien sin token que NO es de trial, o alguien con referencia visitor_ que no es trial
          const isStandardVisitor = (currentRef?.includes('visitor_') || !token) && !isTrialRef;

        if (isGuestTrial && currentRef) {
          setDashboardHref(`/register?ref=${encodeURIComponent(currentRef)}&isTrial=true`);
        } else if (isStandardVisitor && currentRef) {
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

  const dashboardLabel = dashboardHref.startsWith('/registro-pro') || dashboardHref.startsWith('/register')
    ? 'Crear mi cuenta'
    : 'Ir al dashboard';

  if (loading) {
    return (
      <div className="dark">
        <main className="min-h-screen flex items-center justify-center px-4 bg-[#030303]">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-t-transparent border-[#FF5C3A] rounded-full animate-spin mx-auto mb-4"></div>
            <h2 className="text-white font-syne text-xl">Confirmando tu pago...</h2>
            <p className="text-[#666] text-sm mt-2">Por favor no cierres esta ventana.</p>
          </div>
        </main>
      </div>
    );
  }

  if (error) {
    return (
      <div className="dark">
        <main className="min-h-screen flex items-center justify-center px-4 bg-[#030303]">
          <div className="w-full max-w-md">
             <div className="flex justify-center mb-8">
              <Link href="/" className="flex items-center gap-2.5">
                <Image src="/logo.svg" alt="Lookitry" width={28} height={28} className="object-contain h-7 w-auto" priority />
                <span className="font-syne font-extrabold text-xl text-white tracking-tight">
                  Look<span className="text-[#FF5C3A]">itry</span>
                </span>
              </Link>
            </div>
            <Alert 
              type="error"
              title="¡Pago por verificar!"
              message={error}
              className="mb-8"
            />
            <div className="text-center flex flex-col gap-4">
              <Link href={dashboardHref} className="inline-block px-8 py-3 bg-[#FF5C3A] text-white text-[13px] font-bold rounded-xl transition-all shadow-lg hover:bg-opacity-90">
                Ir al Dashboard
              </Link>
              <p className="text-[#444] text-[11px]">
                Incluso si ves este error, tu pago está siendo procesado. El acceso se activará en pocos minutos.
              </p>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="dark">
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

        <div className="rounded-3xl p-8 md:p-10 text-center border bg-[#0a0a0a] border-[#1a1a1a] shadow-[0_20px_50px_rgba(0,0,0,0.5)] relative overflow-hidden">
          
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
            {(dashboardHref.startsWith('/registro-pro') || dashboardHref.startsWith('/register'))
              ? 'Todo está listo. Ahora crea tu cuenta para activar tu suscripción y empezar a usar Lookitry.'
              : isTrial
                ? '¡Tu prueba profesional ha sido activada! Ya puedes empezar a usar todas las herramientas de Lookitry.'
                : `Tu plan ya se encuentra activo. Hemos procesado correctamente tu suscripción al Plan ${plan} ${months > 0 ? `por ${months} ${months === 1 ? 'mes' : 'meses'}` : ''}.`}
          </p>


          {(resolvedRef || ref) && (
            <div className="rounded-xl px-5 py-4 mb-6 text-left border bg-[#050505] border-[#1a1a1a]">
              <p className="text-[10px] mb-2 uppercase tracking-[0.1em] font-bold text-[#444]">Referencia de pago</p>
              <p className="text-[12px] font-mono break-all text-[#888] leading-relaxed">{resolvedRef || ref}</p>
            </div>
          )}

          <Alert 
            type="info"
            message={
              <>
                Recibirás un correo de confirmación con los detalles. Si tienes dudas, escríbenos a {' '}
                <a href="mailto:info@lookitry.com" className="text-white font-bold hover:text-[#FF5C3A] transition-colors">
                  info@lookitry.com
                </a>
              </>
            }
            className="mb-8"
          />

          <div className="flex flex-col gap-4 relative z-10">
            <Link
              href={dashboardHref}
              className="block w-full py-4 bg-[#FF5C3A] hover:bg-[#ff785c] active:scale-[0.98] text-white font-bold rounded-xl transition-all shadow-[0_10px_20px_rgba(255,92,58,0.2)] hover:shadow-[0_15px_30px_rgba(255,92,58,0.3)] text-[15px] cursor-pointer"
            >
              {dashboardLabel}
            </Link>
            <Link
              href="/"
              className="block w-full py-4 rounded-xl transition-all text-[15px] font-semibold border border-[#1a1a1a] text-[#444] hover:bg-white/5 hover:text-white cursor-pointer"
            >
              Volver al inicio
            </Link>
          </div>

        </div>

        <div className="mt-10 text-center">
          <p className="text-[#333] text-[12px] font-medium tracking-wide uppercase">
            LOOKITRY SECURE PAYMENTS © 2026
          </p>
        </div>
      </div>
    </main>
    </div>
  );
}

export default function PagoExitosoPage() {
  return (
    <Suspense>
      <PagoExitosoContent />
    </Suspense>
  );
}
