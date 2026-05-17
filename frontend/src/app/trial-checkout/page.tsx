'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import Script from 'next/script';
import { Mail, ChevronLeft, ChevronRight, CreditCard, LayoutPanelLeft, AlertCircle } from 'lucide-react';
import { api } from '@/services/api';
import { authService } from '@/services/auth.service';
import { StepProgress, Step } from '@/components/payments/StepProgress';
import { clearCheckoutDraft, loadCheckoutDraft, saveCheckoutDraft } from '@/lib/checkoutDraft';
import { formatCop, formatUsd, priceInUsd } from '@/lib/paymentDisplay';
import GoogleSignInButton from '@/components/auth/GoogleSignInButton';
import { useCurrency } from '@/hooks/useCurrency';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.lookitry.com';
const OA = '#FF5C3A';
const TRIAL_DRAFT_KEY = 'lookitry:trial-checkout-draft';

// Emil Kowalski Design System - Custom Easing & Motion
const CSS_VARS = `
  :root {
    --ease-out-expo: cubic-bezier(0.16, 1, 0.3, 1);
    --ease-spring: cubic-bezier(0.34, 1.56, 0.64, 1);
    --ease-smooth: cubic-bezier(0.4, 0, 0.2, 1);
    --duration-fast: 160ms;
    --duration-normal: 250ms;
    --duration-slow: 400ms;
  }

  @media (hover: hover) and (pointer: fine) {
    .btn-primary:hover {
      transform: translateY(-2px);
      box-shadow: 0 20px 40px -15px rgba(255, 92, 58, 0.4);
    }
    .btn-primary:active {
      transform: translateY(0) scale(0.97);
    }
    .input-field:hover {
      border-color: #333;
    }
    .input-field:focus {
      border-color: #FF5C3A;
      box-shadow: 0 0 0 3px rgba(255, 92, 58, 0.1), 0 0 20px rgba(255, 92, 58, 0.15);
    }
    .payment-option:hover {
      border-color: rgba(255, 92, 58, 0.4);
      background: rgba(255, 92, 58, 0.03);
    }
  }
`;

function IconCheck() {
  return (
    <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke={OA} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
    </svg>
  );
}

export default function TrialCheckoutPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState<Step>(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [campaign, setCampaign] = useState<any>(null);
  const [paymentMethod, setPaymentMethod] = useState<'wompi' | 'paypal'>('wompi');
  const { currency, setCurrency } = useCurrency();
  const [trm, setTrm] = useState(3900);
  const [guestEmail, setGuestEmail] = useState('');
  const [guestName, setGuestName] = useState('');
  const [emailError, setEmailError] = useState('');
  const [nameError, setNameError] = useState('');
  const [redirecting, setRedirecting] = useState(false);

  // Session-related states
  const [hasSession, setHasSession] = useState(false);
  const [sessionInfo, setSessionInfo] = useState<{ name: string; email: string } | null>(null);
  const [hasHadTrial, setHasHadTrial] = useState(false);
  const trialBlockedBySession = hasSession && hasHadTrial;

  // Email check states
  const [emailChecking, setEmailChecking] = useState(false);
  const [emailExists, setEmailExists] = useState<{ exists: boolean; name?: string; plan?: string } | null>(null);

  // Inject Emil Kowalski CSS Variables
  useEffect(() => {
    const styleId = 'emil-kowalski-css';
    if (!document.getElementById(styleId)) {
      const style = document.createElement('style');
      style.id = styleId;
      style.textContent = CSS_VARS;
      document.head.appendChild(style);
    }
  }, []);

  // Guard: si el usuario ya tiene trial activo o plan pago, redirigir al dashboard
  useEffect(() => {
    let cancelled = false;
    const checkExistingSubscription = async () => {
      try {
        const token = typeof window !== 'undefined' ? document.cookie.match(/token=([^;]+)/)?.[1] : null;
        const res = await fetch(`${API_URL}/api/brands/me`, {
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        });
        if (!res.ok) return; // No autenticado, permitir acceso guest

        const { data: brand } = await res.json();
        if (cancelled || !brand) return;

        // Guardar info de sesión
        setHasSession(true);
        setSessionInfo({ name: brand.name || '', email: brand.email || '' });
        setGuestEmail(brand.email || '');
        setGuestName(brand.name || '');
        setHasHadTrial(!!(brand.trial_end_date || brand.trial_generations_limit));

        const isTrialActive =
          brand.plan === 'TRIAL' &&
          brand.trial_end_date &&
          new Date(brand.trial_end_date) > new Date() &&
          brand.subscription_status !== 'suspended';

        const hasPaidPlan =
          brand.subscription_status === 'active' ||
          brand.subscription_status === 'expiring_soon';

        if (isTrialActive || hasPaidPlan) {
          setRedirecting(true);
          router.replace('/dashboard/subscription');
          return;
        }

        // Usuario autenticado con sesión válida → ir directo a paso 3
        if (brand.google_id) {
          setCurrentStep(3);
        }
      } catch {
        // Si falla la verificación, permitir acceso normal
      }
    };

    checkExistingSubscription();
    return () => { cancelled = true; };
  }, [router]);

  useEffect(() => {
    Promise.all([
      api.get<any>('/trial/status'),
      fetch(`${API_URL}/api/payment-settings/public`).then(r => (r.ok ? r.json() : null)),
    ])
      .then(([trialRes, paySettings]) => {
        setCampaign(trialRes.data);
        if (paySettings?.trm) setTrm(paySettings.trm);
      })
      .catch(err => console.error('Error loading checkout data:', err));

    const draft = loadCheckoutDraft(TRIAL_DRAFT_KEY);
    if (draft?.email) setGuestEmail(draft.email);
    if (draft?.brandName) setGuestName(draft.brandName);
    if (draft?.currency) setCurrency(draft.currency);
    if (draft?.paymentMethod) setPaymentMethod(draft.paymentMethod);
    if (typeof draft?.trm === 'number' && draft.trm > 0) setTrm(draft.trm);

    // Pre-llenar datos de Google si existen en localStorage
    const brandData = localStorage.getItem('brand');
    if (brandData) {
      try {
        const brand = JSON.parse(brandData);
        if (brand?.email && !draft?.email) {
          setGuestEmail(brand.email);
        }
        if (brand?.name && !draft?.brandName) {
          setGuestName(brand.name);
        }
        if (brand?.google_id && currentStep === 1) {
          setCurrentStep(3);
        }
      } catch {
        // Ignorar errores de parsing
      }
    }
  }, []);

  useEffect(() => {
    saveCheckoutDraft(TRIAL_DRAFT_KEY, {
      plan: 'TRIAL',
      months: 1,
      includesLanding: false,
      email: guestEmail,
      brandName: guestName,
      paymentMethod,
      currency,
      trm,
    });
  }, [guestEmail, guestName, paymentMethod, currency, trm]);

  const priceCOP = campaign?.priceCOP ?? 20000;
  const trialDays = campaign?.trialDays ?? 7;
  const priceUSD = priceInUsd(priceCOP, trm);

  const formatPrimaryPrice = () => (paymentMethod === 'paypal' ? formatUsd(priceUSD) : formatCop(priceCOP));
  const formatSecondaryPrice = () => (paymentMethod === 'paypal' ? `${formatCop(priceCOP)} COP` : `${formatUsd(priceUSD)} USD`);

  const toggleCurrency = () => {
    const newCurrency = currency === 'COP' ? 'USD' : 'COP';
    setCurrency(newCurrency);
    setPaymentMethod(newCurrency === 'USD' ? 'paypal' : 'wompi');
  };

  // Check email existence
  const checkEmailExists = useCallback(async (emailToCheck: string) => {
    if (!emailToCheck.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailToCheck)) return;
    setEmailChecking(true);
    try {
      const res = await fetch(`${API_URL}/api/auth/check-email?email=${encodeURIComponent(emailToCheck.trim())}`);
      const data = await res.json();
      if (data.exists) {
        setEmailExists({ exists: true, name: data.brand?.name, plan: data.plan });
        // Si tiene cuenta existente, pre-llenar nombre si no está
        if (data.brand?.name && !guestName) {
          setGuestName(data.brand.name);
        }
      } else {
        setEmailExists({ exists: false });
      }
    } catch {
      setEmailExists(null);
    } finally {
      setEmailChecking(false);
    }
  }, [guestName]);

  const handleGoogleCheckoutSuccess = async (data: any) => {
    if (data.checkoutPrefill) {
      localStorage.setItem('checkoutPrefill', JSON.stringify({
        email: data.email,
        name: data.name,
        googleId: data.googleId,
      }));
      setGuestEmail(data.email || '');
      setGuestName(data.name || '');
      setEmailError('');
      setEmailExists({ exists: false });
      setCurrentStep(3);
    } else {
      localStorage.setItem('brand', JSON.stringify(data.brand));
      if (data.token) localStorage.setItem('token', data.token);
      setHasSession(true);
      setSessionInfo({ name: data.brand.name || '', email: data.brand.email || '' });
      setGuestEmail(data.brand.email || '');
      setGuestName(data.brand.name || '');
      setEmailError('');
      setEmailExists({ exists: false });
      // Ir directo a paso 3
      setCurrentStep(3);
    }
  };

  const handleLogoutAndGoToTrial = async () => {
    await authService.logout();
    clearCheckoutDraft(TRIAL_DRAFT_KEY);
    window.location.href = '/trial-checkout';
  };

  const validateStep2 = () => {
    let valid = true;

    if (!guestEmail.trim()) {
      setEmailError('El correo es obligatorio');
      valid = false;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(guestEmail.trim())) {
      setEmailError('Formato de correo inválido');
      valid = false;
    }

    if (!guestName.trim()) {
      setNameError('El nombre de la marca es obligatorio');
      valid = false;
    }

    return valid;
  };

  const handleNextStep = () => {
    if (currentStep === 1) {
      setCurrentStep(2);
      window.scrollTo(0, 0);
      return;
    }

    if (currentStep === 2 && validateStep2()) {
      setCurrentStep(3);
      window.scrollTo(0, 0);
    }
  };

  const handlePrevStep = () => {
    if (currentStep > 1) {
      setCurrentStep((prev) => (prev - 1) as Step);
      window.scrollTo(0, 0);
      return;
    }

    router.back();
  };

  const handleStepChange = (step: Step) => {
    if (step <= currentStep) {
      setCurrentStep(step);
      window.scrollTo(0, 0);
    }
  };

  const handlePagar = async () => {
    setLoading(true);
    setError('');

    try {
      if (trialBlockedBySession) {
        throw new Error('Ya usaste tu prueba gratuita. ¡Upgrade a Basic o Pro para continuar!');
      }

      if (!validateStep2()) {
        setCurrentStep(2);
        setLoading(false);
        return;
      }

      const body: Record<string, unknown> = {
        method: paymentMethod,
        email: guestEmail.trim(),
        brandName: guestName.trim(),
      };

      if (paymentMethod === 'paypal') {
        body.trm = trm;
      }

      const res = await api.post<any>('/trial/initiate-guest', body);

      if (res.data.checkoutUrl) {
        clearCheckoutDraft(TRIAL_DRAFT_KEY);
        window.location.href = res.data.checkoutUrl;
        return;
      }

      throw new Error('No se pudo generar el enlace de pago');
    } catch (err: any) {
      setError(err.message || 'Error al iniciar el pago');
      setLoading(false);
    }
  };

  if (redirecting) {
    return (
      <main className="min-h-screen bg-[#030303] flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-[#FF5C3A] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-[#999] text-sm">Redirigiendo al dashboard...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#030303] text-white selection:bg-[#FF5C3A]/30">
      {/* Google Identity Services — solo en páginas de auth */}
      <Script src="https://accounts.google.com/gsi/client" strategy="afterInteractive" />
      <nav className="border-b border-white/5 bg-black/50 backdrop-blur-xl px-4 md:px-8 h-16 flex items-center justify-between sticky top-0 z-50">
        <Link href="/" className="flex items-center gap-2.5">
          <Image src="/logo.svg" alt="Lookitry" width={28} height={28} className="object-contain h-7 w-auto" priority />
          <span className="font-jakarta font-extrabold text-base tracking-tight">
            Look<span className="text-[#FF5C3A]">itry</span>
          </span>
        </Link>
        <div className="flex items-center gap-4">
          <button
            onClick={toggleCurrency}
            className="flex items-center gap-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-full px-3 py-1.5 transition-all text-[11px] font-bold"
          >
            <span className={currency === 'COP' ? 'text-[#FF5C3A]' : 'text-white/40'}>COP</span>
            <div className="w-px h-3 bg-white/10" />
            <span className={currency === 'USD' ? 'text-[#FF5C3A]' : 'text-white/40'}>USD</span>
          </button>
          <div className="hidden sm:flex items-center gap-1.5 text-[11px] text-[#999]">
            <CreditCard className="w-3.5 h-3.5" style={{ color: OA }} />
            Pago 100% seguro
          </div>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-6 py-8 md:py-16">
        <button
          onClick={handlePrevStep}
          className="flex items-center gap-2 text-[13px] text-[#999] hover:text-white transition-colors mb-8 group"
        >
          <ChevronLeft className="w-4 h-4" />
          Volver
        </button>

        <div className="mb-8">
          <StepProgress currentStep={currentStep} maxNavigableStep={currentStep} onStepChange={handleStepChange} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <div className="lg:col-span-8 space-y-6">
            {currentStep === 1 && (
              <section className="rounded-[2rem] border border-[#1f1f1f] bg-[#0d0d0d] p-8">
                {/* Alerta: usuario ya tuvo trial */}
                {trialBlockedBySession && (
                  <div className="mb-8 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-5 animate-in fade-in slide-in-from-top-2">
                    <p className="text-sm font-bold text-amber-300">Ya usaste tu prueba gratuita.</p>
                    <p className="mt-2 text-sm text-[#d6d6d6]">
                      ¡Tu cuenta ya tuvo un trial! Te invitamos a hacer upgrade a Basic o Pro para continuar.
                    </p>
                    <div className="mt-4 flex flex-col gap-3 sm:flex-row">
                      <button
                        onClick={() => window.location.href = '/checkout?plan=BASIC'}
                        className="rounded-xl bg-[#FF5C3A] px-5 py-3 text-sm font-bold text-white transition-all flex-1 text-center"
                      >
                        Ver planes pagos
                      </button>
                      <button
                        onClick={() => window.location.href = '/dashboard'}
                        className="rounded-xl border border-[#2a2a2a] px-5 py-3 text-sm font-bold text-white transition-all hover:bg-white/5 flex-1 text-center"
                      >
                        Ir al dashboard
                      </button>
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h1 className="font-jakarta font-bold text-3xl md:text-4xl leading-tight text-white">
                      Activa tu <span className="text-[#FF5C3A]">Prueba Profesional</span>
                    </h1>
                    <p className="text-[#bbb] text-[15px] leading-relaxed max-w-xl mt-4">
                      Empieza con el mismo recorrido del funnel principal: eliges el plan, dejas tus datos y activas el pago.
                    </p>
                  </div>
                  <div className="hidden sm:flex items-center gap-2 rounded-full border border-[#FF5C3A]/20 bg-[#FF5C3A]/10 px-4 py-2 text-[11px] font-bold uppercase tracking-widest text-[#FF5C3A]">
                    Paso 1 de 3
                  </div>
                </div>

                <div className="rounded-[1.75rem] border border-[#1f1f1f] bg-[#0a0a0a] p-6">
                  <div className="flex items-center justify-between mb-8">
                    <span className="text-[11px] font-bold uppercase tracking-widest text-[#FF5C3A]">Plan trial</span>
                    <span className="rounded-full border border-[#2a2a2a] bg-[#141414] px-3 py-1 text-[11px] text-[#bbb] font-medium">
                      {trialDays} días
                    </span>
                  </div>

                  <div className="grid gap-3 mb-8">
                    {[
                      '1 producto activo en el catálogo',
                      '15 generaciones con IA',
                      'Widget personalizable para tu sitio',
                      'Logo y colores de tu marca',
                    ].map((item) => (
                      <div key={item} className="flex items-center gap-3">
                        <IconCheck />
                        <span className="text-[14px] text-[#bbb]">{item}</span>
                      </div>
                    ))}
                  </div>

                  <div className="border-t border-[#1f1f1f] pt-6 flex items-end justify-between">
                    <div>
                      <p className="text-[11px] text-[#999] uppercase font-bold tracking-widest mb-2">Total de activación</p>
                      <p className="text-3xl font-jakarta font-extrabold text-white">{formatPrimaryPrice()}</p>
                      <p className="text-[10px] text-[#FF5C3A] font-bold uppercase tracking-widest mt-2">
                        {formatSecondaryPrice()} · TRM {formatCop(trm).replace('COP', '').trim()}
                      </p>
                    </div>
                    <div className="rounded-2xl border border-[#FF5C3A]/15 bg-[#FF5C3A]/5 p-4 text-right">
                      <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest text-[#FF5C3A]">
                        <LayoutPanelLeft className="w-3.5 h-3.5" />
                        Acceso inmediato
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-8 flex justify-end">
                  <button
                    onClick={handleNextStep}
                    className="inline-flex items-center gap-2 rounded-2xl bg-[#FF5C3A] px-8 py-4 text-sm font-bold text-white shadow-[0_10px_30px_-10px_rgba(255,92,58,0.4)] transition-all"
                  >
                    Continuar
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </section>
            )}

            {currentStep === 2 && (
              <section className="rounded-[2rem] border border-[#1f1f1f] bg-[#0d0d0d] p-8">
                <div className="flex items-center justify-between mb-8">
                  <div>
                    <h2 className="font-jakarta font-bold text-2xl text-white tracking-tight">Tus datos</h2>
                    <p className="text-[#999] text-sm mt-1">Usaremos este correo para enviarte el acceso y vincular tu prueba.</p>
                  </div>
                  <div className="text-[11px] font-bold uppercase tracking-widest text-[#FF5C3A]">Paso 2 de 3</div>
                </div>

                {/* Google Sign-In para usuarios no autenticados */}
                {!hasSession && (
                  <div className="mb-6">
                    <GoogleSignInButton
                      flow="checkout"
                      onSuccess={handleGoogleCheckoutSuccess}
                      loginHint={guestEmail || undefined}
                      className="w-full"
                    />
                    <div className="relative my-5">
                      <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-[#1f1f1f]" />
                      </div>
                      <div className="relative flex justify-center">
                        <span className="bg-[#0d0d0d] px-4 text-[11px] text-[#666] font-bold uppercase tracking-widest">
                          o continúa con email
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Alerta: cuenta existente */}
                {emailExists?.exists && (
                  <div className="mb-6 rounded-2xl border border-blue-500/30 bg-blue-500/10 p-5 animate-in fade-in slide-in-from-top-2">
                    <div className="flex items-start gap-3">
                      <AlertCircle className="w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-sm font-bold text-blue-300">Ya tienes una cuenta con este correo.</p>
                        {emailExists.plan && emailExists.plan !== 'TRIAL' && (
                          <p className="mt-1 text-sm text-[#d6d6d6]">
                            Tienes el plan {emailExists.plan}. Puedes hacer upgrade o gestionar tu suscripción desde el dashboard.
                          </p>
                        )}
                        {emailExists.plan === 'TRIAL' && (
                          <p className="mt-1 text-sm text-[#d6d6d6]">
                            Tu trial está activo o vencido. Contacta a soporte si necesitas ayuda.
                          </p>
                        )}
                        <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                          <button
                            onClick={() => window.location.href = '/dashboard'}
                            className="rounded-xl bg-[#FF5C3A] px-5 py-2.5 text-sm font-bold text-white transition-all flex-1 text-center"
                          >
                            Ir al dashboard
                          </button>
                          <button
                            onClick={() => setEmailExists({ exists: false })}
                            className="rounded-xl border border-[#2a2a2a] px-5 py-2.5 text-sm font-bold text-white transition-all hover:bg-white/5 flex-1 text-center"
                          >
                            Usar otro correo
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                <div className="space-y-5">
                  <div>
                    <label className="mb-2 flex items-center gap-2 text-[12px] font-bold uppercase tracking-widest text-[#999]">
                      <Mail className="w-3.5 h-3.5" style={{ color: OA }} />
                      Email corporativo
                      {emailChecking && <span className="text-[#666] font-normal normal-case tracking-normal ml-1">verificando...</span>}
                    </label>
                    <input
                      type="email"
                      value={guestEmail}
                      onChange={(e) => {
                        setGuestEmail(e.target.value);
                        setEmailError('');
                        setEmailExists({ exists: false });
                      }}
                      onBlur={(e) => checkEmailExists(e.target.value)}
                      placeholder="ejemplo@correo.com"
                      className="w-full rounded-2xl border border-[#222] bg-[#050505] px-5 py-4 text-[14px] text-white outline-none transition-colors focus:border-[#FF5C3A]"
                    />
                    {emailError && <p className="mt-2 text-[12px] text-red-400">{emailError}</p>}
                  </div>

                  <div>
                    <label className="mb-2 flex items-center gap-2 text-[12px] font-bold uppercase tracking-widest text-[#999]">
                      <Mail className="w-3.5 h-3.5" style={{ color: OA }} />
                      Nombre de tu marca
                    </label>
                    <input
                      type="text"
                      value={guestName}
                      onChange={(e) => {
                        setGuestName(e.target.value);
                        setNameError('');
                      }}
                      placeholder="Mi marca increíble"
                      className="w-full rounded-2xl border border-[#222] bg-[#050505] px-5 py-4 text-[14px] text-white outline-none transition-colors focus:border-[#FF5C3A]"
                    />
                    {nameError && <p className="mt-2 text-[12px] text-red-400">{nameError}</p>}
                  </div>
                </div>

                <div className="mt-8 flex gap-4">
                  <button
                    onClick={handlePrevStep}
                    className="flex-1 rounded-2xl border border-[#1f1f1f] bg-[#111] px-6 py-4 text-sm font-bold text-white transition-all hover:bg-[#141414]"
                  >
                    Atrás
                  </button>
                  <button
                    onClick={handleNextStep}
                    className="flex-[2] inline-flex items-center justify-center gap-2 rounded-2xl bg-[#FF5C3A] px-8 py-4 text-sm font-bold text-white shadow-[0_10px_30px_-10px_rgba(255,92,58,0.4)] transition-all"
                  >
                    Continuar al pago
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </section>
            )}

            {currentStep === 3 && (
              <section className="rounded-[2rem] border border-[#1f1f1f] bg-[#0d0d0d] p-8">
                <div className="flex items-center justify-between mb-8">
                  <div>
                    <h2 className="font-jakarta font-bold text-2xl text-white tracking-tight">Pago</h2>
                    <p className="text-[#999] text-sm mt-1">Elige la pasarela. El monto se mantiene consistente con la TRM configurada.</p>
                  </div>
                  <div className="text-[11px] font-bold uppercase tracking-widest text-[#FF5C3A]">Paso 3 de 3</div>
                </div>

                <div className="space-y-4 mb-8">
                  <button
                    onClick={() => {
                      setPaymentMethod('wompi');
                      setCurrency('COP');
                      localStorage.setItem('currency', 'COP');
                      window.dispatchEvent(new Event('currencyChange'));
                    }}
                    className={`w-full flex items-center justify-between rounded-2xl border p-5 transition-all ${
                      paymentMethod === 'wompi'
                        ? 'border-[#FF5C3A] bg-[#FF5C3A]/5'
                        : 'border-[#1f1f1f] bg-[#0a0a0a] hover:border-[#FF5C3A]/30'
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <div className={`flex h-5 w-5 items-center justify-center rounded-full border-2 ${paymentMethod === 'wompi' ? 'border-[#FF5C3A]' : 'border-[#333]'}`}>
                        {paymentMethod === 'wompi' && <div className="h-2.5 w-2.5 rounded-full bg-[#FF5C3A]" />}
                      </div>
                      <div className="text-left">
                        <span className="block font-bold text-[15px] text-white">Wompi</span>
                        <span className="text-[11px] text-[#999]">Tarjetas, PSE, Nequi · COP</span>
                      </div>
                    </div>
                    <img src="/wompi-logo.svg" alt="Wompi" className="h-5 w-auto object-contain opacity-70" />
                  </button>

                  <button
                    onClick={() => {
                      setPaymentMethod('paypal');
                      setCurrency('USD');
                      localStorage.setItem('currency', 'USD');
                    }}
                    className={`w-full flex items-center justify-between rounded-2xl border p-5 transition-all ${
                      paymentMethod === 'paypal' ? 'border-[#FF5C3A] bg-[#FF5C3A]/5' : 'border-[#1f1f1f] bg-[#0a0a0a]'
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <div className={`flex h-5 w-5 items-center justify-center rounded-full border-2 ${paymentMethod === 'paypal' ? 'border-[#FF5C3A]' : 'border-[#333]'}`}>
                        {paymentMethod === 'paypal' && <div className="h-2.5 w-2.5 rounded-full bg-[#FF5C3A]" />}
                      </div>
                      <div className="text-left">
                        <span className="block font-bold text-[15px] text-white">PayPal</span>
                        <span className="text-[11px] text-[#999]">Tarjetas globales · USD</span>
                      </div>
                    </div>
                    <img src="/payment-paypal.svg" alt="PayPal" className="h-5 w-auto object-contain opacity-70" />
                  </button>
                </div>

                {error && (
                  <div className="mb-6 rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-[13px] text-red-400">
                    {error}
                  </div>
                )}

                <div className="mt-8 flex gap-4">
                  <button
                    onClick={handlePrevStep}
                    className="flex-1 rounded-2xl border border-[#1f1f1f] bg-[#111] px-6 py-4 text-sm font-bold text-white transition-all hover:bg-[#141414]"
                  >
                    Atrás
                  </button>
                  <button
                    onClick={handlePagar}
                    disabled={loading}
                    className="flex-[2] rounded-2xl bg-[#FF5C3A] px-8 py-4 text-sm font-bold text-white shadow-[0_10px_30px_-10px_rgba(255,92,58,0.4)] transition-all disabled:opacity-50"
                  >
                    {loading ? 'Procesando...' : paymentMethod === 'paypal' ? `Pagar ${formatUsd(priceUSD)} USD` : `Pagar ${formatCop(priceCOP)} COP`}
                  </button>
                </div>

                <div className="mt-8 flex items-center justify-center gap-8 opacity-35">
                  <Image src="/payment-pse.svg" alt="PSE" width={40} height={40} className="grayscale" />
                  <Image src="/payment-mastercard.svg" alt="Mastercard" width={30} height={30} className="grayscale" />
                  <Image src="/payment-visa.svg" alt="Visa" width={45} height={15} className="grayscale" />
                </div>
              </section>
            )}
          </div>

          <aside className="lg:col-span-4 lg:sticky lg:top-24">
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 delay-100 rounded-[2rem] border border-[#1f1f1f] bg-[#0d0d0d] p-8 space-y-5">
              <p className="text-[10px] font-black uppercase tracking-widest text-[#FF5C3A]">Tu resumen</p>

              {/* Total - siempre visible, cambia según currency */}
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-[#999] mb-3">Total a pagar</p>
                <div className="flex items-baseline gap-2">
                  <p className="text-4xl font-jakarta font-black text-white transition-all duration-300">
                    {formatPrimaryPrice()}
                  </p>
                  <span className="text-[11px] text-[#999]">
                    {currency === 'USD' ? 'USD' : 'COP'}
                  </span>
                </div>
                {currency === 'USD' && (
                  <p className="text-[11px] text-[#666] mt-1">~{formatCop(priceCOP)} COP · TRM {formatCop(trm).replace('COP', '').trim()}</p>
                )}
              </div>

              {/* Divider */}
              <div className="h-[1px] bg-gradient-to-r from-transparent via-[#1f1f1f] to-transparent" />

              {/* Método de pago seleccionado */}
              <div className="flex items-center gap-3 animate-in fade-in slide-in-from-top-2 duration-300 delay-100">
                <div className="flex items-center gap-2">
                  {paymentMethod === 'paypal' ? (
                    <img src="/payment-paypal.svg" alt="PayPal" className="h-5 w-auto object-contain opacity-90" />
                  ) : (
                    <div className="relative">
                      <img src="/wompi-logo.svg" alt="Wompi" className={`h-5 w-auto object-contain ${currency === 'USD' ? 'opacity-30' : 'opacity-90'}`} />
                      {currency === 'USD' && (
                        <span className="absolute -top-1 -right-1 text-[7px] font-black text-[#FF5C3A] bg-[#0d0d0d] px-1 rounded">USD</span>
                      )}
                    </div>
                  )}
                </div>
                <div className="h-5 w-[1px] bg-[#1f1f1f]" />
                <span className="text-[11px] text-[#999]">
                  {paymentMethod === 'paypal' ? 'PayPal · USD' : 'Wompi · COP'}
                </span>
              </div>

              {/* Badges de confianza */}
              <div className="flex flex-wrap gap-2 pt-1 animate-in fade-in slide-in-from-top-2 duration-300 delay-200">
                <div className="flex items-center gap-1.5 bg-[#FF5C3A]/10 border border-[#FF5C3A]/20 rounded-full px-3 py-1.5">
                  <svg className="w-3 h-3 text-[#FF5C3A]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-[9px] font-bold uppercase tracking-widest text-[#FF5C3A]">Activación instantánea</span>
                </div>
                <div className="flex items-center gap-1.5 bg-[#FF5C3A]/10 border border-[#FF5C3A]/20 rounded-full px-3 py-1.5">
                  <svg className="w-3 h-3 text-[#FF5C3A]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                  <span className="text-[9px] font-bold uppercase tracking-widest text-[#FF5C3A]">Pago seguro</span>
                </div>
              </div>

              {/* Logos de tarjetas */}
              <div className="flex items-center justify-center gap-4 pt-2 opacity-40">
                <Image src="/payment-pse.svg" alt="PSE" width={28} height={20} className="grayscale" />
                <Image src="/payment-visa.svg" alt="Visa" width={38} height={14} className="grayscale" />
                <Image src="/payment-mastercard.svg" alt="Mastercard" width={26} height={18} className="grayscale" />
              </div>
            </div>
          </aside>
        </div>
      </div>

      <footer className="border-t border-white/5 py-12 text-center">
        <p className="text-[11px] font-jakarta uppercase tracking-widest text-[#999]">Lookitry Secure Payments © 2026</p>
      </footer>
    </main>
  );
}
