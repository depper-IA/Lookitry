'use client';

export const dynamic = 'force-dynamic';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { CheckoutStepper, Step } from '@/components/checkout/CheckoutStepper';
import { clearCheckoutDraft, loadCheckoutDraft, saveCheckoutDraft } from '@/lib/checkoutDraft';
import { formatCop, formatUsd, priceInUsd } from '@/lib/paymentDisplay';
import { authService } from '@/services/auth.service';

export type PlanKey = 'BASIC' | 'PRO' | 'LANDING' | 'TRIAL';
export type SubPlan = 'BASIC' | 'PRO';

import CheckoutHeader from '@/components/checkout/CheckoutHeader';
import PlanSelectionStep from '@/components/checkout/PlanSelectionStep';
import UserDataStep from '@/components/checkout/UserDataStep';
import PaymentMethodStep from '@/components/checkout/PaymentMethodStep';
import OrderSummaryAdapter from '@/components/checkout/OrderSummaryAdapter';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.lookitry.com';
const CHECKOUT_DRAFT_KEY = 'lookitry:checkout-draft';

// ── Tipos ─────────────────────────────────────────────────────────────────────



interface PricingSettings {
  landingPrice: number;
  landingOriginalPrice: number;
  wompiEnabled: boolean;
  wompiPublicKey: string;
  paypalEnabled: boolean;
  paypalEmail: string;
  manualEnabled: boolean;
  manualWhatsapp: string;
  manualEmail: string;
}

// ── Constantes ────────────────────────────────────────────────────────────────

const PLAN_BASE_FALLBACK: Record<'BASIC' | 'PRO', number> = { BASIC: 180000, PRO: 350000 };

const DISCOUNTS_FALLBACK = [
  { months: 1,  pct: 0,  label: '1 mes' },
  { months: 3,  pct: 5,  label: '3 meses' },
  { months: 6,  pct: 10, label: '6 meses' },
  { months: 12, pct: 15, label: '12 meses' },
];

const PLAN_FEATURES: Record<PlanKey, string[]> = {
  BASIC: [
    'Hasta 5 productos en el probador',
    '400 generaciones por mes',
    'Branding básico (logo y colores)',
    'URL propia del probador',
    'Soporte por WhatsApp/email',
    '7 días de prueba incluidos',
  ],
  PRO: [
    'Hasta 15 productos en el probador',
    '1.200 generaciones por mes',
    'Plugin WooCommerce',
    'Branding avanzado (templates Pro)',
    'Templates Minimal, Modern y Bold',
    'Modificación del slug del probador',
    'Soporte prioritario',
  ],
  LANDING: [
    'Página pública en lookitry.com/tu-marca',
    'Catálogo visual con probador IA',
    '3 templates de diseño premium',
    'Botón de WhatsApp flotante',
    'Activación inmediata tras el pago',
    'Pago único — sin mensualidad extra',
  ],
  TRIAL: [
    '1 producto en el probador',
    '15 generaciones incluidas',
    '7 días de acceso completo',
    'Logo y colores de marca',
    'Widget embebible (iframe)',
  ],
};

// ── Helpers ───────────────────────────────────────────────────────────────────

// ── Componente principal ──────────────────────────────────────────────────────

function CheckoutContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [currentStep, setCurrentStep] = useState<Step>(1);

  const planParam = (searchParams.get('plan') ?? 'LANDING').toUpperCase() as PlanKey;
  const initialPlan: PlanKey = (['BASIC', 'PRO', 'LANDING', 'TRIAL'] as PlanKey[]).includes(planParam) ? planParam : 'LANDING';

  const [selectedPlan, setSelectedPlan] = useState<PlanKey>(initialPlan);
  const [selectedMonths, setSelectedMonths] = useState(1);
  const [subPlan, setSubPlan] = useState<SubPlan>('BASIC');
  const [paymentMethod, setPaymentMethod] = useState<'wompi' | 'paypal'>('wompi');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [email, setEmail] = useState('');
  const [brandName, setBrandName] = useState('');
  const [emailError, setEmailError] = useState('');
  const [brandNameError, setBrandNameError] = useState('');
  const [emailChecking, setEmailChecking] = useState(false);
  const [emailExists, setEmailExists] = useState<{ exists: boolean; name?: string; plan?: string } | null>(null);

  const [hasSession, setHasSession] = useState(false);
  const [sessionInfo, setSessionInfo] = useState<{ name: string; email: string } | null>(null);
  const [pricing, setPricing] = useState<PricingSettings | null>(null);
  const [trm, setTrm] = useState(3900);
  const [currency, setCurrency] = useState<'COP' | 'USD'>('COP');

  const [planBase, setPlanBase] = useState<Record<'BASIC' | 'PRO' | 'TRIAL', number>>({
    ...PLAN_BASE_FALLBACK,
    TRIAL: 20000,
  });
  const [discounts, setDiscounts] = useState(DISCOUNTS_FALLBACK);

  const [couponCode, setCouponCode] = useState('');
  const [couponLoading, setCouponLoading] = useState(false);
  const [couponError, setCouponError] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<{
    id: string; code: string; discount_type: 'pct' | 'fixed'; discount_value: number;
  } | null>(null);

  const [activePromos, setActivePromos] = useState<any[]>([]);
  const [hasHadTrial, setHasHadTrial] = useState(false);
  const trialBlockedBySession = hasSession && selectedPlan === 'TRIAL' && hasHadTrial;

  // ── Ciclo de vida ──────────────────────────────────────────────────────────

  useEffect(() => {
    Promise.all([
      fetch(`${API_URL}/api/payment-settings/public`).then(r => r.ok ? r.json() : null),
      fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/pricing_config?select=id,data`, {
        headers: {
          apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
          Authorization: `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!}`,
        },
      }).then(r => r.ok ? r.json() : null),
      fetch('/api/promotions').then(r => r.ok ? r.json() : null),
    ]).then(([paySettings, pricingRows, promosRes]) => {
      if (paySettings) {
        setPricing(paySettings);
        if (paySettings.trm) setTrm(paySettings.trm);
      }
      if (promosRes?.ok) setActivePromos(promosRes.data || []);
      if (Array.isArray(pricingRows)) {
        const basic = pricingRows.find((r: any) => r.id === 'basic')?.data;
        const pro   = pricingRows.find((r: any) => r.id === 'pro')?.data;
        const desc  = pricingRows.find((r: any) => r.id === 'descuentos_duracion')?.data;
        if (basic?.precio_mensual_cop || pro?.precio_mensual_cop) {
          setPlanBase({
            BASIC: basic?.precio_mensual_cop ?? PLAN_BASE_FALLBACK.BASIC,
            PRO:   pro?.precio_mensual_cop   ?? PLAN_BASE_FALLBACK.PRO,
            TRIAL: pricingRows.find((r: any) => r.id === 'trial')?.data?.precio_mensual_cop ?? 20000,
          });
        }
        if (desc) {
          setDiscounts([
            { months: 1,  pct: desc.meses_1  ?? 0,  label: '1 mes' },
            { months: 3,  pct: desc.meses_3  ?? 5,  label: '3 meses' },
            { months: 6,  pct: desc.meses_6  ?? 10, label: '6 meses' },
            { months: 12, pct: desc.meses_12 ?? 15, label: '12 meses' },
          ]);
        }
      }
    }).catch(() => {});
  }, []);

  useEffect(() => {
    const brandStr = localStorage.getItem('brand');
    setHasSession(!!brandStr);
    if (brandStr) {
      try {
        const brand = JSON.parse(brandStr);
        if (brand) {
          setSessionInfo({ name: brand.name || '', email: brand.email || '' });
          setEmail(brand.email || '');
          setBrandName(brand.name || '');
          setHasHadTrial(!!(brand.trial_end_date || brand.trial_generations_limit));
        }
      } catch {}
    } else {
      // Verificar si hay datos de checkoutPrefill (usuario nuevo con Google)
      const prefillStr = localStorage.getItem('checkoutPrefill');
      if (prefillStr) {
        try {
          const prefill = JSON.parse(prefillStr);
          if (prefill) {
            setEmail(prefill.email || '');
            setBrandName(prefill.name || '');
            // No establecemos hasSession - es un usuario nuevo sin cuenta
          }
        } catch {}
      }
    }
    const savedCurrency = localStorage.getItem('currency') as 'COP' | 'USD';
    if (savedCurrency) {
      setCurrency(savedCurrency);
      if (savedCurrency === 'USD') setPaymentMethod('paypal');
    }
  }, []);

  useEffect(() => {
    const draft = loadCheckoutDraft(CHECKOUT_DRAFT_KEY);
    if (!draft) return;

    const draftPlan = String(draft.plan || '').toUpperCase();
    const urlHasPlan = searchParams.has('plan');
    if (!urlHasPlan && ['BASIC', 'PRO', 'LANDING', 'TRIAL'].includes(draftPlan)) {
      setSelectedPlan(draftPlan as PlanKey);
    }
    if (typeof draft.months === 'number' && [1, 3, 6, 12].includes(draft.months)) {
      setSelectedMonths(draft.months);
    }
    // SECURITY: Never override email from draft when user has an active session.
    // The email must always come from the authenticated session (set above in the session useEffect).
    // Only restore email from draft for unauthenticated users (visitors).
    const hasActiveSession = !!localStorage.getItem('brand');
    if (!hasActiveSession && draft.email) setEmail(draft.email);
    if (draft.brandName && !hasActiveSession) setBrandName(draft.brandName);
    if (draft.paymentMethod) setPaymentMethod(draft.paymentMethod);
    if (draft.currency) setCurrency(draft.currency);
    if (typeof draft.trm === 'number' && draft.trm > 0) setTrm(draft.trm);
  }, []);

  // ── Cálculos ───────────────────────────────────────────────────────────────

  const landingPrice    = pricing?.landingPrice         ?? 650000;
  const landingOriginal = pricing?.landingOriginalPrice ?? 900000;

  const isLanding = selectedPlan === 'LANDING';
  const isTrial   = selectedPlan === 'TRIAL';
  const currentPlanKey = isLanding ? subPlan : (selectedPlan as 'BASIC' | 'PRO' | 'TRIAL');

  const overridePromo = activePromos.find(p => p.type === 'plan_override' && p.config?.plan === currentPlanKey);
  const currentPlanBase = overridePromo?.config?.override_price
    ? Number(overridePromo.config.override_price)
    : planBase[currentPlanKey];

  const promoDiscountPct = activePromos.reduce((max, p) => {
    if ((['launch_offer', 'modal_timer'].includes(p.type)) && p.config?.discount_pct) {
      return Math.max(max, Number(p.config.discount_pct));
    }
    return max;
  }, 0);

  const subMonthDiscount = isTrial ? 0 : (discounts.find(d => d.months === selectedMonths)?.pct ?? 0);

  const subPlanTotal = Math.ceil(
    currentPlanBase * (isTrial ? 1 : selectedMonths) * (1 - subMonthDiscount / 100) * (1 - promoDiscountPct / 100)
  );

  const baseTotalPrice = isLanding ? landingPrice + subPlanTotal : subPlanTotal;

  const couponDiscount = appliedCoupon
    ? appliedCoupon.discount_type === 'pct'
      ? Math.ceil(baseTotalPrice * appliedCoupon.discount_value / 100)
      : Math.min(appliedCoupon.discount_value, baseTotalPrice)
    : 0;

  const totalPrice = Math.max(0, baseTotalPrice - couponDiscount);
  const totalPriceUsd = priceInUsd(totalPrice, trm);
  const canNavigateToStep: Step = currentStep === 3 ? 3 : currentStep;

  useEffect(() => {
    saveCheckoutDraft(CHECKOUT_DRAFT_KEY, {
      plan: selectedPlan,
      months: selectedMonths,
      includesLanding: isLanding,
      email,
      brandName,
      paymentMethod,
      currency,
      trm,
    });
  }, [selectedPlan, selectedMonths, isLanding, email, brandName, paymentMethod, currency, trm]);

  // ── Acciones ───────────────────────────────────────────────────────────────

  const handleValidateCoupon = async () => {
    if (!couponCode.trim()) return;
    setCouponLoading(true);
    setCouponError('');
    try {
      const res = await fetch(`${API_URL}/api/coupons/validate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: couponCode.trim(), plan: selectedPlan }),
      });
      const data = await res.json();
      if (!data.ok) throw new Error(data.error || 'Cupón inválido');
      setAppliedCoupon(data.coupon);
      setCouponError('');
    } catch (err: any) {
      setCouponError(err.message || 'Error al validar el cupón');
      setAppliedCoupon(null);
    } finally {
      setCouponLoading(false);
    }
  };

  const validateStep2 = async () => {
    let valid = true;
    
    // SECURITY: If user has an active session, the email MUST match the session email.
    // Changing the email while authenticated would create orders for the wrong account.
    if (hasSession && sessionInfo?.email && email.trim().toLowerCase() !== sessionInfo.email.toLowerCase()) {
      setEmailError('No puedes cambiar el correo mientras tienes una sesión activa. Cierra sesión primero para comprar con otro correo.');
      setEmailExists(null);
      valid = false;
      return valid;
    }

    if (!email.trim()) {
      setEmailError('El correo es obligatorio');
      setEmailExists(null);
      valid = false;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setEmailError('Formato de correo inválido');
      setEmailExists(null);
      valid = false;
    } else {
      // Only check email existence for visitors (no session).
      // Authenticated users already have an account — their email WILL exist in DB.
      if (hasSession) {
        setEmailExists({ exists: false });
        setEmailError('');
      } else {
        setEmailChecking(true);
        try {
          const res = await fetch(`${API_URL}/api/auth/check-email?email=${encodeURIComponent(email.trim())}`);
          const data = await res.json();
          if (data.exists) {
            const existingPlan = data.plan;
            
            if (existingPlan === 'ENTERPRISE') {
              setEmailExists({ exists: true, name: data.brand?.name, plan: existingPlan });
              setEmailError('Tu cuenta tiene un plan Enterprise. Por favor contacta a soporte para cambios.');
              valid = false;
            } else {
              // Redirigir inmediatamente según el plan
              let redirectUrl = '/dashboard';
              if (existingPlan === 'BASIC') {
                redirectUrl = '/dashboard/checkout?plan=PRO';
              } else if (existingPlan === 'PRO') {
                redirectUrl = '/dashboard/checkout?plan=BASIC';
              }
              // TRIAL vencido → modal en dashboard
              window.location.href = redirectUrl;
              return false;
            }
          } else {
            setEmailExists({ exists: false });
            setEmailError('');
          }
        } catch {
          setEmailExists(null);
        } finally {
          setEmailChecking(false);
        }
      }
    }
    
    if (!hasSession && !brandName.trim()) {
      setBrandNameError('El nombre de la marca es obligatorio');
      valid = false;
    } else {
      setBrandNameError('');
    }
    
    return valid;
  };

  const handleNextStep = async () => {
    if (currentStep === 1) {
      // Step 1 = Datos: validate before advancing
      const isValid = await validateStep2();
      if (isValid) {
        setCurrentStep(2);
        window.scrollTo(0, 0);
      }
    } else if (currentStep === 2) {
      // Step 2 = Plan: no validation needed, advance directly
      setCurrentStep(3);
      window.scrollTo(0, 0);
    }
  };

  const handlePrevStep = () => {
    if (currentStep > 1) {
      setCurrentStep((prev) => (prev - 1) as Step);
      window.scrollTo(0, 0);
    } else {
      router.back();
    }
  };

  const handleStepChange = (step: Step) => {
    if (step <= canNavigateToStep) {
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

      // SECURITY: Double-check email matches session before sending payment.
      // This is a safety net in case UI validation was bypassed.
      if (hasSession && sessionInfo?.email && email.trim().toLowerCase() !== sessionInfo.email.toLowerCase()) {
        throw new Error('El correo no coincide con tu sesión activa. Cierra sesión para comprar con otro correo.');
      }

      if (totalPrice === 0) {
        const planToSend = isLanding ? subPlan : selectedPlan;
        const res = await fetch(`${API_URL}/api/payments/wompi/free-checkout`, {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            plan: planToSend,
            months: isTrial ? 1 : selectedMonths,
            includes_landing: isLanding,
            coupon_id: appliedCoupon?.id || null,
            email: email.trim(),
            brand_name: brandName.trim(),
          }),
        });
        const responseData = await res.json();
        if (!res.ok) throw new Error(responseData.error || 'Error en checkout gratuito');
        if (responseData.isVisitor && responseData.reference) {
          clearCheckoutDraft(CHECKOUT_DRAFT_KEY);
          window.location.href = `/onboarding-post-pago?ref=${responseData.reference}&free=1`;
          return;
        }
        clearCheckoutDraft(CHECKOUT_DRAFT_KEY);
        window.location.href = `/pago-exitoso?plan=${planToSend}&months=${isTrial ? 1 : selectedMonths}&free=1`;
        return;
      }

      if (paymentMethod === 'paypal') {
        const emailParam = `&email=${encodeURIComponent(email.trim())}`;
        const brandParam = !hasSession ? `&brand_name=${encodeURIComponent(brandName.trim())}` : '';
        const landingParam = isLanding ? '&includes_landing=true' : '';
        const res = await fetch(
          `${API_URL}/api/payments/paypal/checkout-url?amount=${totalPrice}&months=${isTrial ? 1 : selectedMonths}&plan=${isLanding ? subPlan : selectedPlan}${emailParam}${brandParam}${landingParam}&trm=${trm}`,
          { credentials: 'include' }
        );
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Error link PayPal');
        clearCheckoutDraft(CHECKOUT_DRAFT_KEY);
        window.location.href = data.checkoutUrl;
        return;
      }

      const emailParam = `&email=${encodeURIComponent(email.trim())}`;
      const brandParam = !hasSession ? `&brand_name=${encodeURIComponent(brandName.trim())}` : '';
      const landingParam = isLanding ? '&includes_landing=true' : '';
      const res = await fetch(
        `${API_URL}/api/payments/wompi/checkout-url?amount=${totalPrice}&months=${isTrial ? 1 : selectedMonths}&plan=${isLanding ? subPlan : selectedPlan}${emailParam}${brandParam}${landingParam}`,
        { credentials: 'include' }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error checkout Wompi');
      clearCheckoutDraft(CHECKOUT_DRAFT_KEY);
      window.location.href = data.checkoutUrl;
    } catch (err: any) {
      setError(err.message || 'Error al conectar con el servidor');
      setLoading(false);
    }
  };

  const handleLogoutAndGoToTrial = async () => {
    await authService.logout();
    clearCheckoutDraft(CHECKOUT_DRAFT_KEY);
    window.location.href = '/trial-checkout';
  };

  const handleGoogleCheckoutSuccess = async (data: any) => {
    if (data.checkoutPrefill) {
      // Usuario nuevo - solo precargar datos, NO crear sesión
      // Guardar en localStorage temporal para el checkout
      localStorage.setItem('checkoutPrefill', JSON.stringify({
        email: data.email,
        name: data.name,
        googleId: data.googleId,
      }));
      setEmail(data.email || '');
      setBrandName(data.name || '');
      setEmailError('');
      setEmailExists({ exists: false });
      setBrandNameError('');
      // NO establecemos hasSession = true - es un usuario nuevo sin cuenta
    } else {
      // Usuario existente con cuenta real - crear sesión
      localStorage.setItem('brand', JSON.stringify(data.brand));
      if (data.token) localStorage.setItem('token', data.token);
      setHasSession(true);
      setSessionInfo({ name: data.brand.name || '', email: data.brand.email || '' });
      setEmail(data.brand.email || '');
      setBrandName(data.brand.name || '');
      setEmailError('');
      setEmailExists({ exists: false });
      setBrandNameError('');
    }
  };

  const getTrialName = () => {
    const trialPrice = planBase.TRIAL ?? 20000;
    return trialPrice > 0 ? 'Prueba' : 'Prueba Gratuita';
  };

  const planNames: Record<PlanKey, string> = {
    BASIC: 'Plan Básico',
    PRO: 'Plan Pro',
    LANDING: 'Mini-landing',
    TRIAL: getTrialName(),
  };

  // Accent color
  const OA = '#FF5C3A';

  return (
    <main className="min-h-screen bg-[#050505] text-gray-200">
      <CheckoutHeader OA={OA} />

      <div className="max-w-6xl mx-auto px-4 py-8 md:py-12">
        {/* Progress Bar */}
        <div className="mb-12">
          <CheckoutStepper currentStep={currentStep} maxNavigableStep={canNavigateToStep} onStepChange={handleStepChange} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Main Column */}
          <div className="lg:col-span-8 space-y-6">
            {currentStep === 1 && (
              <UserDataStep
                email={email}
                setEmail={setEmail}
                brandName={brandName}
                setBrandName={setBrandName}
                emailError={emailError}
                setEmailError={setEmailError}
                brandNameError={brandNameError}
                setBrandNameError={setBrandNameError}
                emailChecking={emailChecking}
                emailExists={emailExists}
                hasSession={hasSession}
                sessionInfo={sessionInfo}
                validateStep2={validateStep2}
                handlePrevStep={handlePrevStep}
                setCurrentStep={setCurrentStep}
                handleGoogleCheckoutSuccess={handleGoogleCheckoutSuccess}
                loginHint={email || ''}
                stepNumber={1}
                OA={OA}
              />
            )}

            {currentStep === 2 && (
              <PlanSelectionStep
                selectedPlan={selectedPlan}
                setSelectedPlan={setSelectedPlan}
                selectedMonths={selectedMonths}
                setSelectedMonths={setSelectedMonths}
                subPlan={subPlan}
                setSubPlan={setSubPlan}
                planBase={planBase}
                discounts={discounts}
                isLanding={isLanding}
                isTrial={isTrial}
                trialBlockedBySession={trialBlockedBySession}
                handleLogoutAndGoToTrial={handleLogoutAndGoToTrial}
                handleNextStep={handleNextStep}
                planNames={planNames}
                landingPrice={landingPrice}
                landingOriginal={landingOriginal}
                stepNumber={2}
                OA={OA}
                hasSession={hasSession}
                clearCheckoutDraft={clearCheckoutDraft}
                CHECKOUT_DRAFT_KEY={CHECKOUT_DRAFT_KEY}
                existingAccountPlan={emailExists?.plan}
                hasEmailAccount={emailExists?.exists}
              />
            )}

            {currentStep === 3 && (
              <PaymentMethodStep
                paymentMethod={paymentMethod}
                setPaymentMethod={setPaymentMethod}
                totalPrice={totalPrice}
                totalPriceUsd={totalPriceUsd}
                trm={trm}
                error={error}
                loading={loading}
                handlePrevStep={handlePrevStep}
                handlePagar={handlePagar}
                isLanding={isLanding}
                isTrial={isTrial}
                planNames={planNames}
                subPlan={subPlan}
                selectedPlan={selectedPlan}
                selectedMonths={selectedMonths}
                formatCop={formatCop}
                formatUsd={formatUsd}
                stepNumber={3}
                OA={OA}
              />
            )}
          </div>

          {/* Sidebar: Resumen */}
          <OrderSummaryAdapter
            isLanding={isLanding}
            landingPrice={landingPrice}
            subPlanTotal={subPlanTotal}
            currentPlanKey={currentPlanKey}
            planNames={planNames}
            isTrial={isTrial}
            selectedMonths={selectedMonths}
            couponCode={couponCode}
            setCouponCode={setCouponCode}
            couponLoading={couponLoading}
            couponError={couponError}
            appliedCoupon={appliedCoupon}
            setAppliedCoupon={setAppliedCoupon}
            handleValidateCoupon={handleValidateCoupon}
            couponDiscount={couponDiscount}
            paymentMethod={paymentMethod}
            totalPrice={totalPrice}
            totalPriceUsd={totalPriceUsd}
            trm={trm}
            PLAN_FEATURES={PLAN_FEATURES}
            OA={OA}
          />
        </div>
      </div>
    </main>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#050505] flex flex-col items-center justify-center text-[#999]">
        <div className="w-8 h-8 border-2 border-t-[#FF5C3A] rounded-full animate-spin mb-4" style={{ borderColor: 'rgba(255,92,58,0.2)', borderTopColor: '#FF5C3A' }} />
        <p className="text-xs font-bold uppercase tracking-widest animate-pulse">Iniciando Checkout Seguro</p>
      </div>
    }>
      <CheckoutContent />
    </Suspense>
  );
}
