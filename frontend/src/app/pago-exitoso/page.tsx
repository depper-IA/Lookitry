'use client';

import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Suspense, useEffect, useState } from 'react';
import Image from 'next/image';

import { Alert } from '@/components/ui/Alert';
import { fetchPublicPaymentSettings } from '@/services/public-config.service';
import { CheckoutStepper } from '@/components/checkout/CheckoutStepper';

function IconCheck() {
  return (
    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
    </svg>
  );
}

function extractPlanFromReference(reference: string | null): string | null {
  if (!reference) return null;
  if (reference.startsWith('TRIAL-') || reference.startsWith('GUEST-TRIAL-')) return 'TRIAL';

  const planMatch = reference.match(/-P([A-Z]+)(?:-|$)/i);
  return planMatch?.[1]?.toUpperCase() ?? null;
}

function extractMonthsFromReference(reference: string | null): number | null {
  if (!reference) return null;

  const monthsMatch = reference.match(/-M(\d+)(?:-|$)/i);
  if (!monthsMatch) return null;

  const parsedMonths = Number(monthsMatch[1]);
  return Number.isFinite(parsedMonths) ? parsedMonths : null;
}

function isVisitorPaypalReference(reference: string | null): boolean {
  if (!reference) return false;
  return /^PAYPAL-visitor_[^-]+-M\d+-P[A-Z]+(?:-|$)/i.test(reference);
}

function clearLocalBrandSession() {
  localStorage.removeItem('brand');
  localStorage.removeItem('brand_plan');
  localStorage.removeItem('token');
  localStorage.removeItem('brandToken');
}

function PagoExitosoContent() {
  const searchParams = useSearchParams();
  const planParam = searchParams.get('plan');
  const monthsParam = Number(searchParams.get('months') || 1);
  const ref = searchParams.get('ref');
  const method = searchParams.get('method');
  const wompiId = searchParams.get('id');
  const paypalToken = searchParams.get('token');

  const [dashboardHref, setDashboardHref] = useState<string>('/login');
  const [loading, setLoading] = useState<boolean>(method === 'paypal' || (!ref && !!wompiId));
  const [error, setError] = useState<string | null>(null);
  const [resolvedRef, setResolvedRef] = useState<string | null>(ref);
  const [supportEmail, setSupportEmail] = useState('info@lookitry.com');

  const isTrialParam = searchParams.get('isTrial') === 'true';
  const effectiveRef = resolvedRef || ref;
  const resolvedPlan = extractPlanFromReference(effectiveRef) || planParam || 'PRO';
  const resolvedMonths = extractMonthsFromReference(effectiveRef) ?? monthsParam;
  const isTrial = resolvedPlan === 'TRIAL' || isTrialParam;

  useEffect(() => {
    fetchPublicPaymentSettings()
      .then((data) => {
        if (data?.manualEmail) setSupportEmail(data.manualEmail);
      })
      .catch(() => {});
  }, []);

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
            throw new Error('No se pudo verificar la transaccion');
          }
        } catch {
          setError('No se pudo recuperar la referencia de tu pago. Contacta a soporte.');
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
          if (data?.reference) {
            currentRef = data.reference;
            setResolvedRef(data.reference);
          }

          const token = localStorage.getItem('token') || localStorage.getItem('brandToken');
          const brandData = localStorage.getItem('brand');
          const isTrialRef = currentRef?.startsWith('TRIAL-') || currentRef?.startsWith('GUEST-TRIAL-') || /PAYPAL-.+-PTRIAL-/.test(currentRef || '');
          const isGuestTrial = currentRef?.startsWith('GUEST-TRIAL-');
          const isGoogleUser = brandData ? JSON.parse(brandData)?.google_id : false;
          const isVisitorPaypal = isVisitorPaypalReference(currentRef);
          const isNewVisitor = !token && currentRef && !isTrialRef;

          if (isVisitorPaypal && currentRef) {
            clearLocalBrandSession();
            setDashboardHref(`/onboarding-post-pago?ref=${encodeURIComponent(currentRef)}&months=${resolvedMonths}&plan=${resolvedPlan}`);
          } else if (isGuestTrial && currentRef && (isGoogleUser || token)) {
            try {
              await fetch(`${API_URL}/api/trial/activate-guest`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ ref: currentRef }),
              });
            } catch {
              // Ignorar errores - el trial se activará en siguiente visita
            }
            setDashboardHref('/dashboard');
          } else if (isGuestTrial && currentRef) {
            setDashboardHref(`/register?ref=${encodeURIComponent(currentRef)}&isTrial=true`);
          } else if (isTrialRef && currentRef && !token) {
            setDashboardHref(`/register?ref=${encodeURIComponent(currentRef)}&isTrial=true`);
          } else if (isNewVisitor && currentRef) {
            setDashboardHref(`/onboarding-post-pago?ref=${encodeURIComponent(currentRef)}&months=${resolvedMonths}&plan=${resolvedPlan}`);
          } else if (token && currentRef) {
            setDashboardHref('/dashboard');
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
        const brandData = localStorage.getItem('brand');
        const isTrialRef = currentRef?.startsWith('TRIAL-') || currentRef?.startsWith('GUEST-TRIAL-') || /PAYPAL-.+-PTRIAL-/.test(currentRef || '');
        const isGuestTrial = currentRef?.startsWith('GUEST-TRIAL-');
        const isGoogleUser = brandData ? JSON.parse(brandData)?.google_id : false;
        const isVisitorPaypal = isVisitorPaypalReference(currentRef);
        const isNewVisitor = !token && currentRef && !isTrialRef;

        if (isVisitorPaypal && currentRef) {
          clearLocalBrandSession();
          setDashboardHref(`/onboarding-post-pago?ref=${encodeURIComponent(currentRef)}&months=${resolvedMonths}&plan=${resolvedPlan}`);
        } else if (isGuestTrial && currentRef && (isGoogleUser || token)) {
          try {
            const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.lookitry.com';
            await fetch(`${API_URL}/api/trial/activate-guest`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              credentials: 'include',
              body: JSON.stringify({ ref: currentRef }),
            });
          } catch {
            // Ignorar errores - el trial se activará en siguiente visita
          }
          setDashboardHref('/dashboard');
        } else if (isGuestTrial && currentRef) {
          setDashboardHref(`/register?ref=${encodeURIComponent(currentRef)}&isTrial=true&plan=TRIAL`);
        } else if (isNewVisitor && currentRef) {
          setDashboardHref(`/onboarding-post-pago?ref=${encodeURIComponent(currentRef)}&months=${resolvedMonths}&plan=${resolvedPlan}`);
        } else if (token && currentRef) {
          setDashboardHref('/dashboard');
        } else if (token) {
          setDashboardHref('/dashboard');
        } else {
          setDashboardHref('/login');
        }
        setLoading(false);
      }
    }

    validatePayment();
  }, [ref, resolvedMonths, method, paypalToken, wompiId]);

  useEffect(() => {
    if (loading || error || !dashboardHref.startsWith('/onboarding-post-pago')) return;

    const timeout = window.setTimeout(() => {
      window.location.href = dashboardHref;
    }, 1200);

    return () => window.clearTimeout(timeout);
  }, [dashboardHref, error, loading]);

  const dashboardLabel =
    dashboardHref.startsWith('/onboarding') || dashboardHref.startsWith('/registro-pro') || dashboardHref.startsWith('/register')
      ? 'COMPLETAR REGISTRO'
      : 'IR AL DASHBOARD';

  if (loading) {
    return (
      <div className="dark">
        <main className="min-h-screen flex items-center justify-center px-4 bg-[#030303]">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-t-transparent border-[#FF5C3A] rounded-full animate-spin mx-auto mb-4"></div>
            <h2 className="text-white font-jakarta text-xl uppercase tracking-wider">Confirmando tu pago...</h2>
            <p className="text-[#999] text-sm mt-2">Por favor no cierres esta ventana.</p>
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
                <span className="font-jakarta font-extrabold text-xl text-white tracking-tight">
                  Look<span className="text-[#FF5C3A]">itry</span>
                </span>
              </Link>
            </div>
            <Alert type="error" title="Pago por verificar" message={error} className="mb-8" />
            <div className="text-center flex flex-col gap-4">
              <Link
                href={dashboardHref}
                className="inline-block px-8 py-3 bg-[#FF5C3A] text-white text-[13px] font-bold rounded-xl transition-all shadow-lg hover:bg-opacity-90 uppercase"
              >
                Ir al dashboard
              </Link>
              <p className="text-[#999] text-[11px]">
                Incluso si ves este error, tu pago esta siendo procesado. El acceso se activara en pocos minutos.
              </p>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="dark">
      <main className="min-h-screen flex flex-col items-center justify-center px-4 py-12 bg-[#030303] selection:bg-[#FF5C3A]/30">
        <div className="w-full max-w-xl mb-12 animate-in fade-in slide-in-from-top-4 duration-700">
          <CheckoutStepper currentStep={4} variant="success" />
        </div>

        <div className="w-full max-w-md animate-in fade-in slide-in-from-bottom-4 duration-700 delay-150">
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
              <span className="font-jakarta font-extrabold text-2xl text-white tracking-tight">
                Look<span className="text-[#FF5C3A]">itry</span>
              </span>
            </Link>
          </div>

          <div className="rounded-3xl p-8 md:p-10 text-center border bg-[#0a0a0a] border-[#1a1a1a] shadow-[0_20px_50px_rgba(0,0,0,0.5)] relative overflow-hidden">
            <div className="absolute -top-24 -right-24 w-48 h-48 bg-[#FF5C3A]/5 blur-[80px] rounded-full"></div>
            <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-[#FF5C3A]/5 blur-[80px] rounded-full"></div>

            <div className="w-20 h-20 bg-[#FF5C3A]/10 border border-[#FF5C3A]/20 text-[#FF5C3A] rounded-full flex items-center justify-center mx-auto mb-6 shadow-[0_0_20px_rgba(255,92,58,0.12)]">
              <IconCheck />
            </div>

            <h1 className="font-jakarta font-bold text-[28px] text-white mb-3 tracking-tight uppercase">
              Pago confirmado
            </h1>
            <p className="text-[15px] leading-relaxed mb-8 text-[#a0a0a0]">
              {dashboardHref.startsWith('/onboarding') || dashboardHref.startsWith('/registro-pro') || dashboardHref.startsWith('/register')
                ? 'Tu transaccion ha sido validada con exito. Ahora solo falta activar tu acceso para entrar a Lookitry.'
                : isTrial
                  ? 'Tu periodo trial fue confirmado correctamente. Ya puedes activar tu cuenta y empezar a usar Lookitry.'
                  : `Tu plan ya se encuentra activo. Hemos procesado correctamente tu suscripcion al Plan ${resolvedPlan} ${resolvedMonths > 0 ? `por ${resolvedMonths} ${resolvedMonths === 1 ? 'mes' : 'meses'}` : ''}.`}
            </p>

            {(resolvedRef || ref) && (
              <div className="rounded-xl px-5 py-4 mb-6 text-left border bg-[#050505] border-[#1a1a1a]">
                <p className="text-[10px] mb-1 uppercase tracking-[0.1em] font-bold text-[#999]">Referencia de pago</p>
                <p className="text-[11px] font-mono break-all text-[#888] leading-relaxed font-bold">{resolvedRef || ref}</p>
              </div>
            )}

            <Alert
              type="info"
              message={
                <>
                  Recibiras un correo de confirmacion. Si tienes dudas, escribenos a{' '}
                  <a href={`mailto:${supportEmail}`} className="text-white font-bold hover:text-[#FF5C3A] transition-colors">
                    {supportEmail}
                  </a>
                </>
              }
              className="mb-8"
            />

            <div className="flex flex-col gap-4 relative z-10">
              <Link
                href={dashboardHref}
                className="block w-full py-4 bg-[#FF5C3A] hover:bg-[#ff785c] active:scale-[0.98] text-white font-bold rounded-xl transition-all shadow-[0_10px_20px_rgba(255,92,58,0.2)] hover:shadow-[0_15px_30px_rgba(255,92,58,0.3)] text-[15px] cursor-pointer tracking-wider"
              >
                {dashboardLabel}
              </Link>
              <Link
                href="/"
                className="block w-full py-4 rounded-xl transition-all text-[15px] font-semibold border border-[#1a1a1a] text-[#999] hover:bg-white/5 hover:text-white cursor-pointer uppercase tracking-tight"
              >
                Volver al inicio
              </Link>
            </div>
          </div>

          <div className="mt-10 text-center">
            <p className="text-[#999] text-[12px] font-medium tracking-widest uppercase">LOOKITRY SECURE PAYMENTS © 2026</p>
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
