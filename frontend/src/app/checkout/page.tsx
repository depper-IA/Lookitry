'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { StepProgress, Step } from '@/components/payments/StepProgress';
import { clearCheckoutDraft, loadCheckoutDraft, saveCheckoutDraft } from '@/lib/checkoutDraft';
import { formatCop, formatUsd, priceInUsd } from '@/lib/paymentDisplay';
import { authService } from '@/services/auth.service';
import { 
  Check, 
  ChevronLeft, 
  ChevronRight, 
  Lock, 
  Mail, 
  User, 
  AlertCircle,
  CreditCard,
  Building2
} from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.lookitry.com';
const CHECKOUT_DRAFT_KEY = 'lookitry:checkout-draft';

// ── Tipos ─────────────────────────────────────────────────────────────────────

type PlanKey = 'BASIC' | 'PRO' | 'LANDING' | 'TRIAL';
type SubPlan = 'BASIC' | 'PRO';

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

const PLAN_BASE_FALLBACK: Record<'BASIC' | 'PRO', number> = { BASIC: 150000, PRO: 250000 };

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
  const [emailExists, setEmailExists] = useState<{ exists: boolean; name?: string } | null>(null);

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
  const trialBlockedBySession = hasSession && selectedPlan === 'TRIAL';

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
        }
      } catch {}
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
    if (['BASIC', 'PRO', 'LANDING', 'TRIAL'].includes(draftPlan)) {
      setSelectedPlan(draftPlan as PlanKey);
    }
    if (typeof draft.months === 'number' && [1, 3, 6, 12].includes(draft.months)) {
      setSelectedMonths(draft.months);
    }
    if (draft.email) setEmail(draft.email);
    if (draft.brandName) setBrandName(draft.brandName);
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

  const validateStep1 = async () => {
    let valid = true;
    
    if (!email.trim()) {
      setEmailError('El correo es obligatorio');
      setEmailExists(null);
      valid = false;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setEmailError('Formato de correo inválido');
      setEmailExists(null);
      valid = false;
    } else {
      setEmailChecking(true);
      try {
        const res = await fetch(`${API_URL}/api/auth/check-email?email=${encodeURIComponent(email.trim())}`);
        const data = await res.json();
        if (data.exists) {
          setEmailExists({ exists: true, name: data.brand?.name });
          setEmailError('Este correo ya está registrado');
          valid = false;
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
      const isValid = await validateStep1();
      if (isValid) {
        setCurrentStep(2);
        window.scrollTo(0, 0);
      }
    } else if (currentStep === 2) {
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
        throw new Error('El trial solo puede comprarse sin una sesion activa. Cierra sesion y continua desde el checkout de trial.');
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
          window.location.href = `/registro-pro?ref=${responseData.reference}&free=1`;
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

const planNames: Record<PlanKey, string> = {
  BASIC: 'Plan Básico',
  PRO: 'Plan Pro',
  LANDING: 'Mini-landing',
  TRIAL: 'Prueba',
};

const getTrialLabel = (): string => {
  const trialBase = planBase.TRIAL ?? 20000;
  return trialBase > 0 ? 'Prueba' : 'Prueba Gratuita';
};

  // Accent color
  const OA = '#FF5C3A';

  return (
    <main className="min-h-screen bg-[#050505] text-gray-200">
      {/* Header */}
      <nav className="sticky top-0 z-50 bg-[#050505]/90 backdrop-blur-md border-b border-[#1a1a1a] px-6 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 group">
          <Image src="/logo.svg" alt="Lookitry" width={28} height={28} className="group-hover:scale-110 transition-transform" priority />
          <span className="font-jakarta font-extrabold text-lg text-white tracking-tight">
            Look<span style={{ color: OA }}>itry</span>
          </span>
        </Link>
        <div className="hidden sm:flex items-center gap-2 text-xs text-[#999] font-medium">
          <Lock className="w-3.5 h-3.5" style={{ color: OA }} />
          <span>PAGO 100% SEGURO</span>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-4 py-8 md:py-12">
        {/* Progress Bar */}
        <div className="mb-12">
          <StepProgress currentStep={currentStep} maxNavigableStep={canNavigateToStep} onStepChange={handleStepChange} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

          {/* Main Column */}
          <div className="lg:col-span-8 space-y-6">

            {/* STEP 1: PLAN SELECTION */}
            {currentStep === 1 && (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-2xl font-jakarta font-bold text-white tracking-tight">Elige tu plan</h2>
                    <p className="mt-1 text-sm text-[#999]">
                      Primero define que quieres activar hoy. Luego te mostramos el cobro y el siguiente paso con claridad.
                    </p>
                  </div>
                  <div className="text-[10px] font-bold px-2 py-1 rounded border uppercase" style={{ color: OA, backgroundColor: 'rgba(255,92,58,0.07)', borderColor: 'rgba(255,92,58,0.2)' }}>Paso 1 de 3</div>
                </div>

                {/* Plan Cards — solo TRIAL, BASIC, PRO, LANDING */}
                {trialBlockedBySession && (
                  <div className="mb-8 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-5">
                    <p className="text-sm font-bold text-amber-300">La sesion activa bloquea compras de trial.</p>
                    <p className="mt-2 text-sm text-[#d6d6d6]">
                      El trial publico debe comprarse sin una cuenta abierta. Asi evitamos que el pago se aplique sobre tu marca actual.
                    </p>
                    <div className="mt-4 flex flex-col gap-3 sm:flex-row">
                      <button
                        onClick={handleLogoutAndGoToTrial}
                        className="rounded-xl bg-[#FF5C3A] px-5 py-3 text-sm font-bold text-white transition-all"
                      >
                        Cerrar sesion y seguir con trial
                      </button>
                      <Link
                        href="/dashboard"
                        className="rounded-xl border border-[#2a2a2a] px-5 py-3 text-sm font-bold text-white transition-all hover:bg-white/5"
                      >
                        Volver al dashboard
                      </Link>
                    </div>
                  </div>
                )}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
                  {(['TRIAL', 'BASIC', 'PRO', 'LANDING'] as PlanKey[]).map(p => {
                    const isSelected = selectedPlan === p;
                    return (
                      <button
                        key={p}
                        onClick={() => {
                          if (p === 'TRIAL' && !hasSession) {
                            clearCheckoutDraft(CHECKOUT_DRAFT_KEY);
                            window.location.href = '/trial-checkout';
                            return;
                          }
                          setSelectedPlan(p);
                          if (p !== 'TRIAL') setError('');
                        }}
                        className={`relative text-left rounded-2xl border-2 p-5 transition-all duration-300`}
                        style={{
                          borderColor: isSelected ? OA : '#1f1f1f',
                          backgroundColor: isSelected ? 'rgba(255,92,58,0.04)' : '#0d0d0d',
                          boxShadow: isSelected ? `0 0 20px rgba(255,92,58,0.08)` : 'none',
                        }}
                      >
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-xs font-bold uppercase tracking-wider" style={{ color: isSelected ? OA : '#999' }}>
                            {planNames[p]}
                          </span>
                          <div
                            className="w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all"
                            style={{ borderColor: isSelected ? OA : '#333', backgroundColor: isSelected ? OA : 'transparent' }}
                          >
                            {isSelected && <Check className="w-3 h-3 text-white" />}
                          </div>
                        </div>

                        <div className="space-y-1">
                          {p === 'LANDING' ? (
                            <>
                              <div className="text-sm text-[#999] line-through font-medium">{formatCop(landingOriginal)}</div>
                              <div className="text-2xl font-jakarta font-extrabold text-white">{formatCop(landingPrice)}</div>
                              <div className="text-[10px] font-bold uppercase" style={{ color: OA }}>Pago único</div>
                            </>
                          ) : (
                            <>
                              <div className="text-2xl font-jakarta font-extrabold text-white">
                                {p === 'TRIAL' 
                                  ? (planBase.TRIAL > 0 ? formatCop(planBase.TRIAL) : 'GRATIS')
                                  : formatCop(planBase[p as 'BASIC' | 'PRO' | 'TRIAL'])
                                }
                              </div>
                              <div className="text-[10px] text-[#999] font-bold uppercase mt-0.5">
                                {p === 'TRIAL' ? (planBase.TRIAL > 0 ? 'Pago único' : '7 Días') : 'Mensual'}
                              </div>
                            </>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* Sub-plan para LANDING */}
                {isLanding && (
                  <div className="bg-[#0d0d0d] border border-[#1f1f1f] rounded-2xl p-6 mb-8 animate-in zoom-in-95 duration-300">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="p-2 rounded-lg" style={{ backgroundColor: 'rgba(255,92,58,0.08)' }}>
                        <Building2 className="w-5 h-5" style={{ color: OA }} />
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-white">Suscripción vinculada</h3>
                        <p className="text-[11px] text-[#999]">La mini-landing requiere un plan activo</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      {(['BASIC', 'PRO'] as SubPlan[]).map(p => {
                        const isSSelected = subPlan === p;
                        return (
                          <button
                            key={p}
                            onClick={() => setSubPlan(p)}
                            className="text-left p-4 rounded-xl border-2 transition-all"
                            style={{
                              borderColor: isSSelected ? OA : '#1f1f1f',
                              backgroundColor: isSSelected ? 'rgba(255,92,58,0.05)' : '#0a0a0a',
                            }}
                          >
                            <div className="flex justify-between items-center mb-1">
                              <span className="text-[11px] font-bold text-white">{planNames[p]}</span>
                              {isSSelected && <div className="w-2 h-2 rounded-full" style={{ backgroundColor: OA }} />}
                            </div>
                            <div className="text-sm font-bold text-white">{formatCop(planBase[p])}/mes</div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Selector de meses */}
                {!isTrial && (
                  <div className="bg-[#0d0d0d] border border-[#1f1f1f] rounded-2xl p-6">
                    <h3 className="text-sm font-bold text-white mb-4">¿Por cuánto tiempo?</h3>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {discounts.map(d => (
                        <button
                          key={d.months}
                          onClick={() => setSelectedMonths(d.months)}
                          className="relative py-4 rounded-xl border-2 transition-all"
                          style={{
                            borderColor: selectedMonths === d.months ? OA : '#1f1f1f',
                            backgroundColor: selectedMonths === d.months ? 'rgba(255,92,58,0.05)' : '#0a0a0a',
                          }}
                        >
                          <div className="text-lg font-bold text-white">{d.months}</div>
                          <div className="text-[10px] text-[#999] font-bold uppercase tracking-tighter">
                            Mes{d.months > 1 ? 'es' : ''}
                          </div>
                          {d.pct > 0 && (
                            <div className="absolute -top-2.5 right-2 bg-emerald-500 text-white text-[9px] font-black px-1.5 py-0.5 rounded-full">
                              -{d.pct}%
                            </div>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div className="mt-10">
                  <button
                    onClick={handleNextStep}
                    className="w-full text-white font-bold py-4 rounded-2xl transition-all flex items-center justify-center gap-2 group"
                    style={{ backgroundColor: OA, boxShadow: `0 10px 30px -10px rgba(255,92,58,0.4)` }}
                  >
                    CONTINUAR
                    <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </button>
                </div>
              </div>
            )}

            {/* STEP 2: DATOS */}
            {currentStep === 2 && (
              <div className="animate-in fade-in slide-in-from-right-4 duration-500">
                <div className="flex items-center justify-between mb-8">
                  <div>
                    <h2 className="text-2xl font-jakarta font-bold text-white tracking-tight">Tus datos</h2>
                    <p className="text-sm text-[#999] mt-1">Vinculamos tu compra al correo con el que entraras y administraras la cuenta</p>
                  </div>
                  <div className="text-[10px] font-bold px-2 py-1 rounded border uppercase" style={{ color: OA, backgroundColor: 'rgba(255,92,58,0.07)', borderColor: 'rgba(255,92,58,0.2)' }}>Paso 2 de 3</div>
                </div>

                <div className="space-y-6 bg-[#0d0d0d] border border-[#1f1f1f] p-8 rounded-3xl">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-[#999] uppercase tracking-widest flex items-center gap-2">
                      <Mail className="w-3.5 h-3.5" style={{ color: OA }} />
                      Correo Electrónico
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={e => { setEmail(e.target.value); setEmailError(''); }}
                      placeholder="ejemplo@mimarca.com"
                      className="w-full bg-[#050505] border rounded-xl px-4 py-4 text-white outline-none transition-all"
                      style={{ borderColor: emailError ? 'rgba(239,68,68,0.5)' : '#222' }}
                      onFocus={e => { e.currentTarget.style.borderColor = OA; }}
                      onBlur={e => { e.currentTarget.style.borderColor = emailError ? 'rgba(239,68,68,0.5)' : '#222'; }}
                    />
                    {emailError && <p className="text-[11px] text-red-400 font-medium flex items-center gap-1.5"><AlertCircle className="w-3 h-3" /> {emailError}</p>}
                  </div>

                  {!hasSession && (
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-[#999] uppercase tracking-widest flex items-center gap-2">
                        <User className="w-3.5 h-3.5" style={{ color: OA }} />
                        Nombre de tu Marca
                      </label>
                      <input
                        type="text"
                        value={brandName}
                        onChange={e => { setBrandName(e.target.value); setBrandNameError(''); }}
                        placeholder="Mi Tienda de Moda"
                        className="w-full bg-[#050505] border rounded-xl px-4 py-4 text-white outline-none transition-all"
                        style={{ borderColor: brandNameError ? 'rgba(239,68,68,0.5)' : '#222' }}
                        onFocus={e => { e.currentTarget.style.borderColor = OA; }}
                        onBlur={e => { e.currentTarget.style.borderColor = brandNameError ? 'rgba(239,68,68,0.5)' : '#222'; }}
                      />
                      {brandNameError && <p className="text-[11px] text-red-400 font-medium flex items-center gap-1.5"><AlertCircle className="w-3 h-3" /> {brandNameError}</p>}
                    </div>
                  )}

                  {hasSession && sessionInfo && (
                    <div className="rounded-2xl p-4 flex items-center gap-4 border" style={{ backgroundColor: 'rgba(255,92,58,0.04)', borderColor: 'rgba(255,92,58,0.2)' }}>
                      <div className="w-12 h-12 rounded-full flex items-center justify-center font-bold text-white text-lg" style={{ backgroundColor: OA }}>
                        {sessionInfo.name[0]?.toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-white">{sessionInfo.name}</p>
                        <p className="text-xs text-[#999]">Sesión activa detectada</p>
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex gap-4 mt-10">
                  <button
                    onClick={handlePrevStep}
                    className="flex-1 bg-[#0d0d0d] hover:bg-[#141414] text-white font-bold py-4 rounded-2xl border border-[#1f1f1f] transition-all flex items-center justify-center gap-2"
                  >
                    <ChevronLeft className="w-5 h-5" />
                    ATRÁS
                  </button>
                  <button
                    onClick={handleNextStep}
                    className="flex-[2] text-white font-bold py-4 rounded-2xl transition-all flex items-center justify-center gap-2 group"
                    style={{ backgroundColor: OA, boxShadow: `0 10px 30px -10px rgba(255,92,58,0.4)` }}
                  >
                    CONTINUAR AL PAGO
                    <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </button>
                </div>
              </div>
            )}

            {/* STEP 3: MÉTODO DE PAGO */}
            {currentStep === 3 && (
              <div className="animate-in fade-in slide-in-from-right-4 duration-500">
                <div className="flex items-center justify-between mb-8">
                  <div>
                    <h2 className="text-2xl font-jakarta font-bold text-white tracking-tight">Finalizar y Activar</h2>
                    <p className="text-sm text-[#999] mt-1">Elige como quieres pagar. Despues te llevamos a confirmacion y activacion.</p>
                  </div>
                  <div className="text-[10px] font-bold px-2 py-1 rounded border uppercase" style={{ color: OA, backgroundColor: 'rgba(255,92,58,0.07)', borderColor: 'rgba(255,92,58,0.2)' }}>Paso 3 de 3</div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
                  <button
                    onClick={() => setPaymentMethod('wompi')}
                    className="relative p-6 rounded-2xl border-2 flex flex-col gap-4 text-left transition-all"
                    style={{
                      borderColor: paymentMethod === 'wompi' ? OA : '#1f1f1f',
                      backgroundColor: paymentMethod === 'wompi' ? 'rgba(255,92,58,0.04)' : '#0d0d0d',
                    }}
                  >
                    <div className="flex justify-between items-start">
                      <Image src="/wompi-logo.svg" alt="Wompi" width={100} height={30} className="invert brightness-150 h-6 w-auto" />
                      {paymentMethod === 'wompi' && <div className="w-4 h-4 rounded-full" style={{ backgroundColor: OA }} />}
                    </div>
                    <div>
                      <p className="text-xs font-bold text-white uppercase tracking-widest">Tarjeta / PSE / Nequi</p>
                      <p className="text-[10px] text-[#999] mt-1">Pago seguro procesado por Bancolombia</p>
                    </div>
                  </button>

                  <button
                    onClick={() => setPaymentMethod('paypal')}
                    className="relative p-6 rounded-2xl border-2 flex flex-col gap-4 text-left transition-all"
                    style={{
                      borderColor: paymentMethod === 'paypal' ? OA : '#1f1f1f',
                      backgroundColor: paymentMethod === 'paypal' ? 'rgba(255,92,58,0.04)' : '#0d0d0d',
                    }}
                  >
                    <div className="flex justify-between items-start">
                      <Image src="/payment-paypal.svg" alt="PayPal" width={100} height={30} className="h-6 w-auto" />
                      {paymentMethod === 'paypal' && <div className="w-4 h-4 rounded-full" style={{ backgroundColor: OA }} />}
                    </div>
                    <div>
                      <p className="text-xs font-bold text-white uppercase tracking-widest">PayPal / USD Internacional</p>
                      <p className="text-[10px] text-[#999] mt-1">TRM actual: {formatCop(trm).replace('COP', '').trim()} COP</p>
                    </div>
                  </button>
                </div>

                {error && (
                  <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl flex items-center gap-3 mb-6">
                    <AlertCircle className="w-5 h-5 flex-shrink-0" />
                    <p className="text-xs font-medium">{error}</p>
                  </div>
                )}

                <div className="mb-6 rounded-2xl border border-[#1f1f1f] bg-[#0a0a0a] p-4">
                  <p className="text-[10px] font-black uppercase tracking-[0.18em]" style={{ color: OA }}>
                    Que activas con este pago
                  </p>
                  <p className="mt-2 text-sm text-[#bbb]">
                    {isLanding
                      ? `Mini-landing + ${planNames[subPlan]} por ${selectedMonths} mes${selectedMonths > 1 ? 'es' : ''}.`
                      : isTrial
                        ? 'Tu prueba profesional por 7 dias para empezar a configurar y validar la experiencia.'
                        : `${planNames[selectedPlan]} por ${selectedMonths} mes${selectedMonths > 1 ? 'es' : ''}.`}
                  </p>
                  <p className="mt-2 text-[11px] text-[#999]">
                    {isLanding
                      ? 'La mini-landing es un pago unico. El plan asociado cubre el uso y la operacion mensual.'
                      : 'Al completar el pago te llevamos a confirmacion y activacion de tu acceso.'}
                  </p>
                </div>

                <div className="flex gap-4 mt-10">
                  <button
                    onClick={handlePrevStep}
                    disabled={loading}
                    className="flex-1 bg-[#0d0d0d] hover:bg-[#141414] text-white font-bold py-4 rounded-2xl border border-[#1f1f1f] transition-all flex items-center justify-center gap-2"
                  >
                    ATRÁS
                  </button>
                  <button
                    onClick={handlePagar}
                    disabled={loading}
                    className="flex-[2] text-white font-extrabold py-4 rounded-2xl transition-all flex items-center justify-center gap-3 group"
                    style={{
                      backgroundColor: OA,
                      boxShadow: paymentMethod === 'wompi'
                        ? '0 10px 30px -10px rgba(255,92,58,0.5)'
                        : '0 10px 30px -10px rgba(0,112,186,0.5)',
                    }}
                  >
                    {loading ? (
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <>
                        <CreditCard className="w-5 h-5 group-hover:scale-110 transition-transform" />
                        <span>{paymentMethod === 'paypal' ? `PAGAR ${formatUsd(totalPriceUsd)} USD` : `PAGAR ${formatCop(totalPrice)} COP`}</span>
                      </>
                    )}
                  </button>
                </div>

                <div className="mt-8 flex justify-center gap-8 opacity-30">
                  <Image src="/payment-pse.svg" alt="PSE" width={40} height={40} className="grayscale" />
                  <Image src="/payment-mastercard.svg" alt="Mastercard" width={30} height={30} className="grayscale" />
                  <Image src="/payment-visa.svg" alt="Visa" width={45} height={15} className="grayscale" />
                </div>
              </div>
            )}
          </div>

          {/* Sidebar: Resumen */}
          <div className="lg:col-span-4 lg:sticky lg:top-24">
            <div className="bg-[#0d0d0d] border border-[#1f1f1f] rounded-3xl p-8 shadow-2xl overflow-hidden relative">
              <div className="absolute top-0 right-0 w-32 h-32 blur-3xl rounded-full -mr-16 -mt-16" style={{ backgroundColor: 'rgba(255,92,58,0.05)' }} />

              <h3 className="text-xs font-black uppercase tracking-widest mb-6" style={{ color: OA }}>Resumen de compra</h3>

              <div className="space-y-6">
                <div className="space-y-4">
                  {isLanding && (
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-sm font-bold text-white">Mini-landing Page</p>
                        <p className="text-[10px] text-[#999]">Un solo pago de por vida</p>
                      </div>
                      <span className="text-sm font-mono text-white">{formatCop(landingPrice)}</span>
                    </div>
                  )}
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-sm font-bold text-white">{planNames[currentPlanKey]}</p>
                      <p className="text-[10px] text-[#999]">
                        {isTrial ? '7 días de prueba' : `${selectedMonths} mes${selectedMonths > 1 ? 'es' : ''}`}
                      </p>
                    </div>
                    <span className="text-sm font-mono text-white">{formatCop(subPlanTotal)}</span>
                  </div>
                </div>

                <div className="h-px bg-[#1f1f1f] w-full" />

                <div className="rounded-2xl border border-[#1f1f1f] bg-[#050505] p-4">
                  <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#999]">Cobro de hoy</p>
                  <p className="mt-2 text-sm text-white">
                    {isLanding
                      ? 'Hoy pagas la mini-landing y el periodo inicial del plan elegido.'
                      : isTrial
                        ? 'Hoy activas tu prueba para configurar tu cuenta y entrar al dashboard.'
                        : 'Hoy activas tu plan y el periodo seleccionado.'}
                  </p>
                  <p className="mt-2 text-[11px] text-[#999]">
                    {isLanding
                      ? 'La landing es pago unico. El plan asociado sigue su ciclo normal segun el tiempo que elijas.'
                      : isTrial
                        ? 'No hay cobros compuestos en este paso.'
                        : 'El total ya incluye el periodo que elegiste y cualquier descuento aplicado.'}
                  </p>
                </div>

                {/* Cupón */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    <span className="text-[10px] font-bold text-[#999] uppercase tracking-widest">Cupón Promocional</span>
                  </div>

                  {appliedCoupon ? (
                    <div className="flex items-center justify-between bg-emerald-600/5 border border-emerald-500/20 rounded-xl p-3">
                      <div>
                        <span className="text-xs font-black text-emerald-400">{appliedCoupon.code}</span>
                        <p className="text-[9px] text-emerald-600 font-bold">ACTIVO</p>
                      </div>
                      <button onClick={() => setAppliedCoupon(null)} className="text-[10px] text-[#999] hover:text-red-400 font-bold uppercase transition-colors">Quitar</button>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={couponCode}
                        onChange={e => setCouponCode(e.target.value.toUpperCase())}
                        placeholder="CÓDIGO"
                        className="flex-1 bg-[#050505] border border-[#222] rounded-lg px-3 py-2 text-xs text-white outline-none uppercase font-bold tracking-widest transition-all"
                        onFocus={e => { e.currentTarget.style.borderColor = OA; }}
                        onBlur={e => { e.currentTarget.style.borderColor = '#222'; }}
                      />
                      <button
                        onClick={handleValidateCoupon}
                        disabled={couponLoading || !couponCode.trim()}
                        className="bg-[#1a1a1a] hover:bg-[#222] disabled:opacity-50 text-[10px] font-black px-4 py-2 rounded-lg text-white transition-all"
                      >
                        {couponLoading ? '...' : 'OK'}
                      </button>
                    </div>
                  )}
                  {couponError && <p className="text-[9px] text-red-400 font-bold flex items-center gap-1 mt-1 uppercase"><AlertCircle className="w-2.5 h-2.5" /> {couponError}</p>}
                </div>

                <div className="pt-6 border-t border-[#1f1f1f] space-y-1">
                  {couponDiscount > 0 && (
                    <div className="flex justify-between items-center text-xs text-[#999] font-medium mb-2 uppercase tracking-tighter">
                      <span>Ahorro Extra</span>
                      <span className="text-emerald-500 font-bold">-{formatCop(couponDiscount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between items-end">
                    <span className="text-xs font-bold text-[#999] uppercase tracking-wider mb-1.5">Total</span>
                    <div className="text-right">
                      <div className="text-3xl font-jakarta font-black text-white leading-none">{paymentMethod === 'paypal' ? formatUsd(totalPriceUsd) : formatCop(totalPrice)}</div>
                      <div className="text-[9px] font-bold mt-1 uppercase tracking-widest" style={{ color: OA }}>
                        {paymentMethod === 'paypal' ? `${formatCop(totalPrice)} COP · TRM ${formatCop(trm).replace('COP', '').trim()}` : `${formatUsd(totalPriceUsd)} USD REFERENCIA`}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-6 opacity-50">
                  <div className="flex items-start gap-2">
                    <Check className="w-3 h-3 mt-0.5" style={{ color: OA }} />
                    <span className="text-[9px] font-bold text-[#999] leading-tight uppercase tracking-tighter">Activación<br/>Instantánea</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <Check className="w-3 h-3 mt-0.5" style={{ color: OA }} />
                    <span className="text-[9px] font-bold text-[#999] leading-tight uppercase tracking-tighter">Sin Letra<br/>Pequeña</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Features Preview */}
            <div className="mt-6 space-y-3 rounded-2xl p-5 border" style={{ backgroundColor: 'rgba(255,92,58,0.03)', borderColor: 'rgba(255,92,58,0.1)' }}>
              <p className="text-[10px] font-black uppercase tracking-widest" style={{ color: OA }}>Incluye en {planNames[currentPlanKey]}</p>
              <ul className="space-y-2">
                {PLAN_FEATURES[currentPlanKey].slice(0, 4).map(f => (
                  <li key={f} className="flex items-center gap-2 text-[11px] text-[#bbb] font-medium">
                    <div className="w-1 h-1 rounded-full" style={{ backgroundColor: OA, opacity: 0.6 }} />
                    {f}
                  </li>
                ))}
              </ul>
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
      <div className="min-h-screen bg-[#050505] flex flex-col items-center justify-center text-[#999]">
        <div className="w-8 h-8 border-2 border-t-[#FF5C3A] rounded-full animate-spin mb-4" style={{ borderColor: 'rgba(255,92,58,0.2)', borderTopColor: '#FF5C3A' }} />
        <p className="text-xs font-bold uppercase tracking-widest animate-pulse">Iniciando Checkout Seguro</p>
      </div>
    }>
      <CheckoutContent />
    </Suspense>
  );
}
