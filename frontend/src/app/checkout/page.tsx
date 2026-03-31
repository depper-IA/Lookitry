'use client';

import { useState, useEffect, Suspense, useMemo } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { StepProgress, Step } from '@/components/payments/StepProgress';
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

// ── Tipos ─────────────────────────────────────────────────────────────────────

type PlanKey = 'BASIC' | 'PRO' | 'LANDING' | 'TRIAL' | 'ENTERPRISE';
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
  ENTERPRISE: [
    '+50 productos configurables',
    'Volumen de generaciones a medida',
    'Marca Blanca (sin rastro de Lookitry)',
    'Panel de Analítica Avanzado',
    'Acceso directo a API para integraciones',
    'Soporte Prioritario 24/7',
  ],
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatCOP(n: number) {
  return '$' + Math.floor(n).toLocaleString('es-CO');
}

function formatPaypalUsd(amountCop: number, trm: number) {
  const safeTrm = trm > 0 ? trm : 3900;
  return String(Math.ceil(amountCop / safeTrm));
}

// ── Componente principal ──────────────────────────────────────────────────────

function CheckoutContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  // Estados de flujo (Step 1, 2, 3)
  const [currentStep, setCurrentStep] = useState<Step>(1);

  const planParam = (searchParams.get('plan') ?? 'LANDING').toUpperCase() as PlanKey;
  const initialPlan: PlanKey = ['BASIC', 'PRO', 'LANDING'].includes(planParam) ? planParam : 'LANDING';

  const [selectedPlan, setSelectedPlan] = useState<PlanKey>(initialPlan);
  const [selectedMonths, setSelectedMonths] = useState(1);
  const [subPlan, setSubPlan] = useState<SubPlan>('BASIC');
  const [paymentMethod, setPaymentMethod] = useState<'wompi' | 'paypal'>('wompi');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Datos personales (Step 2)
  const [email, setEmail] = useState('');
  const [brandName, setBrandName] = useState('');
  const [emailError, setEmailError] = useState('');
  const [brandNameError, setBrandNameError] = useState('');
  
  const [hasSession, setHasSession] = useState(false);
  const [sessionInfo, setSessionInfo] = useState<{ name: string; email: string } | null>(null);
  const [pricing, setPricing] = useState<PricingSettings | null>(null);
  const [trm, setTrm] = useState(3900);
  const [currency, setCurrency] = useState<'COP' | 'USD'>('COP');

  const [planBase, setPlanBase] = useState<Record<'BASIC' | 'PRO' | 'TRIAL' | 'ENTERPRISE', number>>({
    ...PLAN_BASE_FALLBACK,
    TRIAL: 20000,
    ENTERPRISE: 800000
  });
  const [discounts, setDiscounts] = useState(DISCOUNTS_FALLBACK);

  const [couponCode, setCouponCode] = useState('');
  const [couponLoading, setCouponLoading] = useState(false);
  const [couponError, setCouponError] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<{
    id: string; code: string; discount_type: 'pct' | 'fixed'; discount_value: number;
  } | null>(null);

  const [activePromos, setActivePromos] = useState<any[]>([]);

  // ── Ciclo de vida y carga ──────────────────────────────────────────────────

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
            ENTERPRISE: pricingRows.find((r: any) => r.id === 'enterprise')?.data?.precio_mensual_cop ?? 800000,
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

  // ── Cálculos de Precio ───────────────────────────────────────────────────────

  const landingPrice    = pricing?.landingPrice         ?? 650000;
  const landingOriginal = pricing?.landingOriginalPrice ?? 900000;
  const landingDiscount = Math.round((1 - landingPrice / landingOriginal) * 100);

  const isLanding = selectedPlan === 'LANDING';
  const isTrial = selectedPlan === 'TRIAL';
  const isEnterprise = selectedPlan === 'ENTERPRISE';
  const currentPlanKey = isLanding ? subPlan : (selectedPlan as 'BASIC' | 'PRO' | 'TRIAL' | 'ENTERPRISE');
  
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

  const baseTotalPrice = isLanding
    ? landingPrice + subPlanTotal
    : subPlanTotal;

  const originalPrice = isLanding
    ? landingOriginal + planBase[subPlan] * selectedMonths
    : planBase[selectedPlan as 'BASIC' | 'PRO' | 'TRIAL'] * (isTrial ? 1 : selectedMonths);

  const monthlyPrice = isLanding ? null : (currentPlanBase * (1 - subMonthDiscount / 100) * (1 - promoDiscountPct / 100));
  const discountPctTotal = isLanding ? landingDiscount : (subMonthDiscount + promoDiscountPct);

  const couponDiscount = appliedCoupon
    ? appliedCoupon.discount_type === 'pct'
      ? Math.ceil(baseTotalPrice * appliedCoupon.discount_value / 100)
      : Math.min(appliedCoupon.discount_value, baseTotalPrice)
    : 0;

  const totalPrice = Math.max(0, baseTotalPrice - couponDiscount);

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

  const validateStep2 = () => {
    let valid = true;
    if (!email.trim()) {
      setEmailError('El correo es obligatorio');
      valid = false;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setEmailError('Formato de correo inválido');
      valid = false;
    }

    if (!hasSession && !brandName.trim()) {
      setBrandNameError('El nombre de la marca es obligatorio');
      valid = false;
    }
    return valid;
  };

  const handleNextStep = () => {
    if (currentStep === 1) {
      setCurrentStep(2);
      window.scrollTo(0, 0);
    } else if (currentStep === 2) {
      if (validateStep2()) {
        setCurrentStep(3);
        window.scrollTo(0, 0);
      }
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

  const handlePagar = async () => {
    setLoading(true);
    setError('');

    try {
      // ── FLUJO FREE CHECKOUT (cupón 100%) ──
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
            brand_name: brandName.trim(), // Enviamos nombre de marca también
          }),
        });

        const responseData = await res.json();
        if (!res.ok) throw new Error(responseData.error || 'Error en checkout gratuito');

        if (responseData.isVisitor && responseData.reference) {
          window.location.href = `/registro-pro?ref=${responseData.reference}&free=1`;
          return;
        }

        window.location.href = `/pago-exitoso?plan=${planToSend}&months=${isTrial ? 1 : selectedMonths}&free=1`;
        return;
      }

      // --- FLUJO PAYPAL ---
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
        window.location.href = data.checkoutUrl;
        return;
      }

      // --- FLUJO WOMPI ---
      const emailParam = `&email=${encodeURIComponent(email.trim())}`;
      const brandParam = !hasSession ? `&brand_name=${encodeURIComponent(brandName.trim())}` : '';
      const landingParam = isLanding ? '&includes_landing=true' : '';
      
      const res = await fetch(
        `${API_URL}/api/payments/wompi/checkout-url?amount=${totalPrice}&months=${isTrial ? 1 : selectedMonths}&plan=${isLanding ? subPlan : selectedPlan}${emailParam}${brandParam}${landingParam}`,
        { credentials: 'include' }
      );

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error checkout Wompi');

      window.location.href = data.checkoutUrl;
    } catch (err: any) {
      setError(err.message || 'Error al conectar con el servidor');
      setLoading(false);
    }
  };

  const planNames: Record<PlanKey, string> = {
    BASIC: 'Plan Básico',
    PRO: 'Plan Pro',
    LANDING: 'Mini-landing',
    TRIAL: 'Trial de Prueba',
    ENTERPRISE: 'Plan Enterprise',
  };

  return (
    <main className="min-h-screen bg-[#050505] text-gray-200">
      {/* Header Premium */}
      <nav className="sticky top-0 z-50 bg-[#050505]/80 backdrop-blur-md border-b border-gray-800/50 px-6 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 group">
          <Image src="/logo.svg" alt="Lookitry" width={28} height={28} className="group-hover:scale-110 transition-transform" priority />
          <span className="font-syne font-extrabold text-lg text-white tracking-tight">
            Look<span className="text-indigo-500">itry</span>
          </span>
        </Link>
        <div className="hidden sm:flex items-center gap-2 text-xs text-gray-500 font-medium">
          <Lock className="w-3.5 h-3.5 text-indigo-500" />
          <span>AES-256 SECURED CHECKOUT</span>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-4 py-8 md:py-12">
        {/* Progress Bar */}
        <div className="mb-12">
          <StepProgress currentStep={currentStep} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Main Column */}
          <div className="lg:col-span-8 space-y-6">
            
            {/* STEP 1: PLAN SELECTION */}
            {currentStep === 1 && (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-syne font-bold text-white tracking-tight">Elige tu potencia</h2>
                  <div className="bg-indigo-500/10 text-indigo-400 text-[10px] font-bold px-2 py-1 rounded border border-indigo-500/20 uppercase">Paso 1 de 3</div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-5 gap-3 mb-8">
                  {(['TRIAL', 'BASIC', 'PRO', 'ENTERPRISE', 'LANDING'] as PlanKey[]).map(p => {
                    const isSelected = selectedPlan === p;
                    return (
                      <button
                        key={p}
                        onClick={() => setSelectedPlan(p)}
                        className={`relative text-left rounded-2xl border-2 p-5 transition-all duration-300 group ${
                          isSelected 
                            ? 'border-indigo-600 bg-indigo-600/5 shadow-2xl shadow-indigo-500/10' 
                            : 'border-gray-800 bg-gray-900/50 hover:border-gray-700'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-3">
                          <span className={`text-xs font-bold uppercase tracking-wider ${isSelected ? 'text-indigo-400' : 'text-gray-500'}`}>
                            {planNames[p]}
                          </span>
                          <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${isSelected ? 'border-indigo-500 bg-indigo-500' : 'border-gray-700'}`}>
                            {isSelected && <Check className="w-3 h-3 text-white" />}
                          </div>
                        </div>
                        
                        <div className="space-y-1">
                          {p === 'LANDING' ? (
                            <>
                              <div className="text-sm text-gray-600 line-through font-medium">{formatCOP(landingOriginal)}</div>
                              <div className="text-2xl font-syne font-extrabold text-white">{formatCOP(landingPrice)}</div>
                              <div className="text-[10px] text-indigo-400 font-bold uppercase">Pago único</div>
                            </>
                          ) : (
                            <>
                              <div className="text-2xl font-syne font-extrabold text-white">
                                {p === 'ENTERPRISE' ? 'Desde ' : ''}{formatCOP(planBase[p as 'BASIC' | 'PRO' | 'TRIAL' | 'ENTERPRISE'])}
                              </div>
                              <div className="text-[10px] text-gray-500 font-bold uppercase mt-0.5">
                                {p === 'TRIAL' ? '7 Días' : 'Mensual'}
                              </div>
                            </>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>

            {isLanding && (
              <div className="bg-gray-900/80 border border-gray-800 rounded-2xl p-6 mb-8 animate-in zoom-in-95 duration-300">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-indigo-500/10 rounded-lg">
                    <Building2 className="w-5 h-5 text-indigo-500" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white">Suscripción vinculada</h3>
                    <p className="text-[11px] text-gray-500">La mini-landing vive dentro de un plan activo</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  {(['BASIC', 'PRO'] as SubPlan[]).map(p => {
                    const isSSelected = subPlan === p;
                    return (
                      <button
                        key={p}
                        onClick={() => setSubPlan(p)}
                        className={`text-left p-4 rounded-xl border-2 transition-all ${
                          isSSelected ? 'border-indigo-500 bg-indigo-500/5' : 'border-gray-800 bg-gray-950'
                        }`}
                      >
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-[11px] font-bold text-white">{planNames[p]}</span>
                          {isSSelected && <div className="w-2 h-2 rounded-full bg-indigo-500" />}
                        </div>
                        <div className="text-sm font-bold text-white">{formatCOP(planBase[p])}/mes</div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Selector de meses (Excepto para Trial y Enterprise) */}
            {(!isTrial && !isEnterprise) && (
              <div className="bg-gray-900/50 border border-gray-800 rounded-2xl p-6">
                <h3 className="text-sm font-bold text-white mb-4">¿Por cuánto tiempo quieres el plan?</h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {discounts.map(d => (
                    <button
                      key={d.months}
                      onClick={() => setSelectedMonths(d.months)}
                      className={`relative py-4 rounded-xl border-2 transition-all ${
                        selectedMonths === d.months ? 'border-indigo-500 bg-indigo-500/5' : 'border-gray-800 bg-gray-950'
                      }`}
                    >
                      <div className="text-lg font-bold text-white">{d.months}</div>
                      <div className="text-[10px] text-gray-500 uppercase font-bold tracking-tighter">Mes{d.months > 1 ? 'es' : ''}</div>
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
                    className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-4 rounded-2xl shadow-xl shadow-indigo-600/20 transition-all flex items-center justify-center gap-2 group"
                  >
                    CONTINUAR A TUS DATOS
                    <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </button>
                </div>
              </div>
            )}

            {/* STEP 2: PERSONAL DATA */}
            {currentStep === 2 && (
              <div className="animate-in fade-in slide-in-from-right-4 duration-500">
                <div className="flex items-center justify-between mb-8">
                  <div>
                    <h2 className="text-2xl font-syne font-bold text-white tracking-tight">Identidad de tu marca</h2>
                    <p className="text-sm text-gray-500 mt-1">Vinculemos este plan a tu correo corporativo</p>
                  </div>
                  <div className="bg-indigo-500/10 text-indigo-400 text-[10px] font-bold px-2 py-1 rounded border border-indigo-500/20 uppercase">Paso 2 de 3</div>
                </div>

                <div className="space-y-6 bg-gray-900/30 border border-gray-800 p-8 rounded-3xl">
                  {/* Email Field */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                      <Mail className="w-3.5 h-3.5 text-indigo-400" />
                      Correo Electrónico
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={e => { setEmail(e.target.value); setEmailError(''); }}
                      placeholder="ejemplo@mimarca.com"
                      className={`w-full bg-gray-950 border ${emailError ? 'border-red-500/50 focus:border-red-500' : 'border-gray-800 focus:border-indigo-500'} rounded-xl px-4 py-4 text-white focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all`}
                    />
                    {emailError && <p className="text-[11px] text-red-400 font-medium flex items-center gap-1.5"><AlertCircle className="w-3 h-3" /> {emailError}</p>}
                  </div>

                  {/* Brand Name (Only if NOT logged in) */}
                  {!hasSession && (
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                        <User className="w-3.5 h-3.5 text-indigo-400" />
                        Nombre de tu Marca
                      </label>
                      <input
                        type="text"
                        value={brandName}
                        onChange={e => { setBrandName(e.target.value); setBrandNameError(''); }}
                        placeholder="Mi Tienda de Moda"
                        className={`w-full bg-gray-950 border ${brandNameError ? 'border-red-500/50 focus:border-red-500' : 'border-gray-800 focus:border-indigo-500'} rounded-xl px-4 py-4 text-white focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all`}
                      />
                      {brandNameError && <p className="text-[11px] text-red-400 font-medium flex items-center gap-1.5"><AlertCircle className="w-3 h-3" /> {brandNameError}</p>}
                    </div>
                  )}

                  {hasSession && sessionInfo && (
                    <div className="bg-indigo-500/5 border border-indigo-500/20 rounded-2xl p-4 flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-indigo-600 flex items-center justify-center font-bold text-white text-lg">
                        {sessionInfo.name[0].toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-white">{sessionInfo.name}</p>
                        <p className="text-xs text-gray-500">Sesión activa detectada</p>
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex gap-4 mt-10">
                  <button 
                    onClick={handlePrevStep}
                    className="flex-1 bg-gray-900 hover:bg-gray-800 text-white font-bold py-4 rounded-2xl border border-gray-800 transition-all flex items-center justify-center gap-2"
                  >
                    <ChevronLeft className="w-5 h-5" />
                    ATRÁS
                  </button>
                  <button 
                    onClick={handleNextStep}
                    className="flex-[2] bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-4 rounded-2xl shadow-xl shadow-indigo-600/20 transition-all flex items-center justify-center gap-2 group"
                  >
                    CONTINUAR AL PAGO
                    <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </button>
                </div>
              </div>
            )}

            {/* STEP 3: PAYMENT METHOD */}
            {currentStep === 3 && (
              <div className="animate-in fade-in slide-in-from-right-4 duration-500">
                <div className="flex items-center justify-between mb-8">
                  <div>
                    <h2 className="text-2xl font-syne font-bold text-white tracking-tight">Finalizar y Activar</h2>
                    <p className="text-sm text-gray-500 mt-1">Elige tu método de pago preferido</p>
                  </div>
                  <div className="bg-indigo-500/10 text-indigo-400 text-[10px] font-bold px-2 py-1 rounded border border-indigo-500/20 uppercase">Paso 3 de 3</div>
                </div>

                 {selectedPlan === 'ENTERPRISE' ? (
                   <div className="flex flex-col gap-4 mt-8">
                     <div className="bg-indigo-500/10 border border-indigo-500/20 p-6 rounded-3xl text-center mb-4">
                       <p className="text-sm text-indigo-300 font-medium leading-relaxed">
                         Has seleccionado nuestro Plan Enterprise. Este nivel requiere una configuración personalizada para tu marca.
                       </p>
                     </div>
                     <div className="flex gap-4">
                       <button 
                         onClick={handlePrevStep}
                         className="flex-1 bg-gray-900 hover:bg-gray-800 text-white font-bold py-4 rounded-2xl border border-gray-800 transition-all flex items-center justify-center gap-2"
                       >
                         ATRÁS
                       </button>
                       <a 
                         href="https://wa.me/573105436281?text=Hola,%20quisiera%20activar%20el%20Plan%20Enterprise%20para%20mi%20marca."
                         target="_blank"
                         className="flex-[2] bg-[#25D366] hover:bg-[#22c35e] text-white font-extrabold py-4 rounded-2xl shadow-xl shadow-green-500/20 transition-all flex items-center justify-center gap-3 transform hover:scale-[1.02]"
                       >
                         <svg className="w-6 h-6 fill-current" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/></svg>
                         HABLAR CON VENTAS
                       </a>
                     </div>
                   </div>
                 ) : (
                   <>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
                      <button
                        onClick={() => setPaymentMethod('wompi')}
                        className={`relative p-6 rounded-2xl border-2 flex flex-col gap-4 text-left transition-all ${
                          paymentMethod === 'wompi' ? 'border-indigo-500 bg-indigo-500/5 shadow-lg shadow-indigo-500/5' : 'border-gray-800 bg-gray-950/50'
                        }`}
                      >
                        <div className="flex justify-between items-start">
                          <Image src="/wompi-logo.svg" alt="Wompi" width={100} height={30} className="invert brightness-150 h-6 w-auto" />
                          {paymentMethod === 'wompi' && <div className="w-4 h-4 rounded-full bg-indigo-500" />}
                        </div>
                        <div>
                          <p className="text-xs font-bold text-white uppercase tracking-widest">Tarjeta / PSE / Nequi</p>
                          <p className="text-[10px] text-gray-500 mt-1">Pago seguro procesado por Bancolombia</p>
                        </div>
                      </button>

                      <button
                        onClick={() => setPaymentMethod('paypal')}
                        className={`relative p-6 rounded-2xl border-2 flex flex-col gap-4 text-left transition-all ${
                          paymentMethod === 'paypal' ? 'border-blue-500 bg-blue-500/5 shadow-lg shadow-blue-500/5' : 'border-gray-800 bg-gray-950/50'
                        }`}
                      >
                        <div className="flex justify-between items-start">
                          <Image src="https://upload.wikimedia.org/wikipedia/commons/b/b5/PayPal.svg" alt="PayPal" width={100} height={30} className="h-6 w-auto" />
                          {paymentMethod === 'paypal' && <div className="w-4 h-4 rounded-full bg-blue-500" />}
                        </div>
                        <div>
                          <p className="text-xs font-bold text-white uppercase tracking-widest">PayPal / USD Internacional</p>
                          <p className="text-[10px] text-gray-500 mt-1">TRM actual vinculada: {formatCOP(trm)} COP</p>
                        </div>
                      </button>
                    </div>

                    {error && (
                      <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl flex items-center gap-3 mb-6 animate-pulse">
                        <AlertCircle className="w-5 h-5 flex-shrink-0" />
                        <p className="text-xs font-medium">{error}</p>
                      </div>
                    )}

                    <div className="flex gap-4 mt-10">
                      <button 
                        onClick={handlePrevStep}
                        disabled={loading}
                        className="flex-1 bg-gray-900 hover:bg-gray-800 text-white font-bold py-4 rounded-2xl border border-gray-800 transition-all flex items-center justify-center gap-2"
                      >
                        ATRÁS
                      </button>
                      <button 
                        onClick={handlePagar}
                        disabled={loading}
                        className={`flex-[2] text-white font-extrabold py-4 rounded-2xl shadow-xl transition-all flex items-center justify-center gap-3 group relative overflow-hidden`}
                        style={{ 
                          backgroundColor: paymentMethod === 'wompi' ? '#4f46e5' : '#0070ba',
                          boxShadow: paymentMethod === 'wompi' ? '0 10px 30px -10px rgba(79, 70, 229, 0.5)' : '0 10px 30px -10px rgba(0, 112, 186, 0.5)'
                        }}
                      >
                        {loading ? (
                          <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                          <>
                            <CreditCard className="w-5 h-5 group-hover:scale-110 transition-transform" />
                            <span>PAGAR {formatCOP(totalPrice)} COP</span>
                          </>
                        )}
                      </button>
                    </div>

                    <div className="mt-8 flex justify-center gap-8 opacity-40">
                      <div className="flex items-center gap-1.5 grayscale">
                        <Image src="https://static.wompi.co/img/pse.png" alt="PSE" width={40} height={40} />
                      </div>
                      <div className="flex items-center gap-1.5 grayscale">
                        <Image src="https://static.wompi.co/img/mastercard.png" alt="Mastercard" width={30} height={30} />
                      </div>
                      <div className="flex items-center gap-1.5 grayscale">
                        <Image src="https://static.wompi.co/img/visa.png" alt="Visa" width={45} height={15} />
                      </div>
                    </div>
                   </>
                 )}
              </div>
            )}
          </div>

          {/* Sidebar Column: SUMMARY */}
          <div className="lg:col-span-4 lg:sticky lg:top-24">
            <div className="bg-[#111111] border border-gray-800 rounded-3xl p-8 shadow-2xl overflow-hidden relative">
              <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-600/5 blur-3xl rounded-full -mr-16 -mt-16" />
              
              <h3 className="text-xs font-black text-indigo-500 uppercase tracking-widest mb-6">Tu Configuración</h3>
              
              <div className="space-y-6">
                {/* Desglose de Items */}
                <div className="space-y-4">
                  {isLanding && (
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-sm font-bold text-white">Mini-landing Page</p>
                        <p className="text-[10px] text-gray-500">Un solo pago de por vida</p>
                      </div>
                      <span className="text-sm font-mono text-white">{formatCOP(landingPrice)}</span>
                    </div>
                  )}

                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-sm font-bold text-white">{planNames[currentPlanKey]}</p>
                      <p className="text-[10px] text-gray-500">Suscripción por {selectedMonths} mes{selectedMonths > 1 ? 'es' : ''}</p>
                    </div>
                    <span className="text-sm font-mono text-white">{formatCOP(subPlanTotal)}</span>
                  </div>
                </div>

                <div className="h-px bg-gray-800/80 w-full" />

                {/* Cupón */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-sm shadow-emerald-500/50" />
                    <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Cupón Promocional</span>
                  </div>
                  
                  {appliedCoupon ? (
                    <div className="flex items-center justify-between bg-emerald-600/5 border border-emerald-500/20 rounded-xl p-3">
                      <div>
                        <span className="text-xs font-black text-emerald-400">{appliedCoupon.code}</span>
                        <p className="text-[9px] text-emerald-600 font-bold">ACTIVO</p>
                      </div>
                      <button onClick={() => setAppliedCoupon(null)} className="text-[10px] text-gray-600 hover:text-red-400 font-bold uppercase transition-colors">Quitar</button>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={couponCode}
                        onChange={e => setCouponCode(e.target.value.toUpperCase())}
                        placeholder="CÓDIGO"
                        className="flex-1 bg-gray-950 border border-gray-800 rounded-lg px-3 py-2 text-xs text-white focus:border-indigo-500 outline-none uppercase font-bold tracking-widest transition-all"
                      />
                      <button
                        onClick={handleValidateCoupon}
                        disabled={couponLoading || !couponCode.trim()}
                        className="bg-gray-800 hover:bg-gray-700 disabled:opacity-50 text-[10px] font-black px-4 py-2 rounded-lg text-white transition-all"
                      >
                        {couponLoading ? '...' : 'OK'}
                      </button>
                    </div>
                  )}
                  {couponError && <p className="text-[9px] text-red-400 font-bold flex items-center gap-1 mt-1 uppercase"><AlertCircle className="w-2.5 h-2.5" /> {couponError}</p>}
                </div>

                <div className="pt-6 border-t border-gray-800 space-y-1">
                  {couponDiscount > 0 && (
                    <div className="flex justify-between items-center text-xs text-gray-500 font-medium mb-2 uppercase tracking-tighter">
                      <span>Ahorro Extra</span>
                      <span className="text-emerald-500 font-bold">-{formatCOP(couponDiscount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between items-end">
                    <span className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 underline decoration-indigo-500/30 underline-offset-4">Total Acceso</span>
                    <div className="text-right">
                      <div className="text-3xl font-syne font-black text-white leading-none">{formatCOP(totalPrice)}</div>
                      <div className="text-[9px] font-bold text-indigo-400 mt-1 uppercase tracking-widest">IVA INCLUIDO (COP)</div>
                    </div>
                  </div>
                </div>

                {/* Garantías */}
                <div className="grid grid-cols-2 gap-4 pt-6 opacity-60">
                   <div className="flex items-start gap-2">
                     <Check className="w-3 h-3 text-indigo-500 mt-0.5" />
                     <span className="text-[9px] font-bold text-gray-400 leading-tight uppercase tracking-tighter">Activación<br/>Instante</span>
                   </div>
                   <div className="flex items-start gap-2">
                     <Check className="w-3 h-3 text-indigo-500 mt-0.5" />
                     <span className="text-[9px] font-bold text-gray-400 leading-tight uppercase tracking-tighter">Sin Letra<br/>Pequeña</span>
                   </div>
                </div>
              </div>
            </div>

            {/* Features Preview (Conditional) */}
            <div className="mt-6 space-y-3 bg-indigo-600/5 border border-indigo-500/10 rounded-2xl p-5">
              <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Beneficios Top en {planNames[currentPlanKey]}</p>
              <ul className="space-y-2">
                {PLAN_FEATURES[currentPlanKey].slice(0, 4).map(f => (
                  <li key={f} className="flex items-center gap-2 text-[11px] text-gray-400 font-medium">
                    <div className="w-1 h-1 rounded-full bg-indigo-500/50" />
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
      <div className="min-h-screen bg-[#050505] flex flex-col items-center justify-center text-gray-500">
        <div className="w-8 h-8 border-2 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin mb-4" />
        <p className="text-xs font-bold uppercase tracking-widest animate-pulse">Iniciando Checkout Seguro</p>
      </div>
    }>
      <CheckoutContent />
    </Suspense>
  );
}
