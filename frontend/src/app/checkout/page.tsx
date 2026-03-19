'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.pruebalo.wilkiedevs.com';

// ── Tipos ─────────────────────────────────────────────────────────────────────

type PlanKey = 'BASIC' | 'PRO' | 'LANDING';

// Cuando se selecciona LANDING, también hay que elegir un plan de suscripción
type SubPlan = 'BASIC' | 'PRO';

interface PricingSettings {
  landingPrice: number;
  landingOriginalPrice: number;
  wompiEnabled: boolean;
  wompiPublicKey: string;
  manualEnabled: boolean;
  manualWhatsapp: string;
  manualEmail: string;
}

// ── Constantes ────────────────────────────────────────────────────────────────

// Fallback estático — se sobreescribe con datos dinámicos de la API
const PLAN_BASE_FALLBACK: Record<'BASIC' | 'PRO', number> = { BASIC: 150000, PRO: 250000 };

const DISCOUNTS_FALLBACK: { months: number; pct: number; label: string }[] = [
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
    '7 días de prueba gratis incluidos',
  ],
  PRO: [
    'Hasta 15 productos en el probador',
    '1.200 generaciones por mes',
    'Branding avanzado y personalización completa',
    'Templates Minimal, Modern y Bold',
    'Modificación del slug del probador',
    'Soporte prioritario',
    'Integración con sistemas externos',
  ],
  LANDING: [
    'Página pública en pruebalo.wilkiedevs.com/tu-marca',
    'Catálogo visual con probador IA integrado',
    '3 templates de diseño (Clásico, Editorial, Probador)',
    'Botón de WhatsApp flotante',
    'Activación inmediata tras el pago',
    'Pago único — sin mensualidad adicional',
  ],
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatCOP(n: number) {
  return '$' + n.toLocaleString('es-CO');
}

// calcTotal eliminada — usar planBase (estado dinámico) directamente

// ── Iconos ────────────────────────────────────────────────────────────────────

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



function IconWhatsapp() {
  return (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
      <path d="M12 0C5.373 0 0 5.373 0 12c0 2.123.554 4.118 1.528 5.845L0 24l6.335-1.508A11.945 11.945 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818a9.818 9.818 0 01-5.006-1.371l-.36-.214-3.727.977.994-3.634-.235-.374A9.818 9.818 0 1112 21.818z" />
    </svg>
  );
}

// ── Componente principal ──────────────────────────────────────────────────────

function CheckoutContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const planParam = (searchParams.get('plan') ?? 'LANDING').toUpperCase() as PlanKey;
  const initialPlan: PlanKey = ['BASIC', 'PRO', 'LANDING'].includes(planParam) ? planParam : 'LANDING';

  const [selectedPlan, setSelectedPlan] = useState<PlanKey>(initialPlan);
  const [selectedMonths, setSelectedMonths] = useState(1);
  const [subPlan, setSubPlan] = useState<SubPlan>('BASIC');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState('');
  const [hasSession, setHasSession] = useState(false);
  const [sessionInfo, setSessionInfo] = useState<{ name: string; email: string } | null>(null);
  const [pricing, setPricing] = useState<PricingSettings | null>(null);

  // Precios dinámicos desde la API de pricing
  const [planBase, setPlanBase] = useState<Record<'BASIC' | 'PRO', number>>(PLAN_BASE_FALLBACK);
  const [discounts, setDiscounts] = useState(DISCOUNTS_FALLBACK);

  // Cupón
  const [couponCode, setCouponCode] = useState('');
  const [couponLoading, setCouponLoading] = useState(false);
  const [couponError, setCouponError] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<{
    id: string; code: string; discount_type: 'pct' | 'fixed'; discount_value: number;
  } | null>(null);

  // Promociones activas
  const [activePromos, setActivePromos] = useState<any[]>([]);

  useEffect(() => {
    // Cargar precios de pago, configuración de pricing y promociones en paralelo
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
      if (paySettings) setPricing(paySettings);
      if (promosRes?.ok) setActivePromos(promosRes.data || []);
      if (Array.isArray(pricingRows)) {
        const basic = pricingRows.find((r: any) => r.id === 'basic')?.data;
        const pro   = pricingRows.find((r: any) => r.id === 'pro')?.data;
        const desc  = pricingRows.find((r: any) => r.id === 'descuentos_duracion')?.data;
        if (basic?.precio_mensual_cop || pro?.precio_mensual_cop) {
          setPlanBase({
            BASIC: basic?.precio_mensual_cop ?? PLAN_BASE_FALLBACK.BASIC,
            PRO:   pro?.precio_mensual_cop   ?? PLAN_BASE_FALLBACK.PRO,
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
    const token = localStorage.getItem('token') || localStorage.getItem('brandToken');
    setHasSession(!!token);
    if (token) {
      try {
        const brand = JSON.parse(localStorage.getItem('brand') || 'null');
        if (brand) setSessionInfo({ name: brand.name || '', email: brand.email || '' });
      } catch {}
    }
  }, []);

  const landingPrice    = pricing?.landingPrice         ?? 650000;
  const landingOriginal = pricing?.landingOriginalPrice ?? 900000;
  const landingDiscount = Math.round((1 - landingPrice / landingOriginal) * 100);

  const isLanding       = selectedPlan === 'LANDING';

  // ── Lógica de Promociones Dinámicas ────────────────────────────────────────

  const currentPlanKey = isLanding ? subPlan : (selectedPlan as 'BASIC' | 'PRO');
  
  // 1. Buscar Overrides de precio
  const overridePromo = activePromos.find(p => p.type === 'plan_override' && p.config?.plan === currentPlanKey);
  const currentPlanBase = overridePromo?.config?.override_price 
    ? Number(overridePromo.config.override_price) 
    : planBase[currentPlanKey];

  // 2. Buscar Descuentos porcentuales globales (launch_offer, modal_timer)
  const promoDiscountPct = activePromos.reduce((max, p) => {
    if ((['launch_offer', 'modal_timer'].includes(p.type)) && p.config?.discount_pct) {
      return Math.max(max, Number(p.config.discount_pct));
    }
    return max;
  }, 0);

  // Precio total según plan seleccionado
  const subMonthDiscount = discounts.find(d => d.months === selectedMonths)?.pct ?? 0;
  
  // Cálculo del total de la suscripción (con descuento por meses y descuento de promo)
  const subPlanTotal = Math.round(
    currentPlanBase * selectedMonths * (1 - subMonthDiscount / 100) * (1 - promoDiscountPct / 100)
  );

  const baseTotalPrice = isLanding
    ? landingPrice + subPlanTotal
    : subPlanTotal;

  const originalPrice = isLanding
    ? landingOriginal + planBase[subPlan] * selectedMonths
    : planBase[selectedPlan as 'BASIC' | 'PRO'] * selectedMonths;

  const monthlyPrice = isLanding ? null : (currentPlanBase * (1 - subMonthDiscount / 100) * (1 - promoDiscountPct / 100));
  const discountPct = isLanding ? landingDiscount : (subMonthDiscount + promoDiscountPct);

  // Descuento por cupón (se aplica sobre el precio ya promocionado)
  const couponDiscount = appliedCoupon
    ? appliedCoupon.discount_type === 'pct'
      ? Math.round(baseTotalPrice * appliedCoupon.discount_value / 100)
      : Math.min(appliedCoupon.discount_value, baseTotalPrice)
    : 0;
  const totalPrice = Math.max(0, baseTotalPrice - couponDiscount);

  const handleValidateCoupon = async () => {
    if (!couponCode.trim()) return;
    setCouponLoading(true);
    setCouponError('');
    try {
      const res = await fetch('/api/coupons/validate', {
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

  function isValidEmail(value: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
  }

  const handlePagar = async () => {
    setLoading(true);
    setError('');

    // Si no hay sesión, validar email
    if (!hasSession) {
      if (!email.trim()) {
        setEmailError('El correo electrónico es requerido');
        setLoading(false);
        return;
      }
      if (!isValidEmail(email)) {
        setEmailError('Formato de correo inválido');
        setLoading(false);
        return;
      }
    }
    setEmailError('');

    try {
      const token = typeof window !== 'undefined'
        ? (localStorage.getItem('token') || localStorage.getItem('brandToken'))
        : null;

      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const emailParam = !hasSession && email.trim() ? `&email=${encodeURIComponent(email.trim())}` : '';
      const landingParam = isLanding ? '&includes_landing=true' : '';
      const res = await fetch(
        `${API_URL}/api/payments/wompi/checkout-url?amount=${totalPrice}&months=${selectedMonths}&plan=${isLanding ? subPlan : selectedPlan}${emailParam}${landingParam}`,
        { headers }
      );

      if (!res.ok) {
        let msg = `Error ${res.status}`;
        try { const d = await res.json(); msg = d.error || d.message || msg; } catch {}
        throw new Error(msg);
      }

      const { checkoutUrl } = await res.json();
      if (!checkoutUrl) throw new Error('No se recibió la URL de pago');

      // Incrementar uses_count del cupón antes de redirigir (fire-and-forget)
      if (appliedCoupon?.id) {
        fetch('/api/coupons/redeem', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ coupon_id: appliedCoupon.id }),
        }).catch(() => {}); // No bloquear el redirect si falla
      }

      window.location.href = checkoutUrl;
    } catch (err: any) {
      setError(err.message || 'Error al conectar con el servidor de pagos');
      setLoading(false);
    }
  };

  const planNames: Record<PlanKey, string> = {
    BASIC: 'Plan Básico',
    PRO: 'Plan Pro',
    LANDING: 'Mini-landing',
  };

  return (
    <main className="min-h-screen bg-[#0a0a0a]">

      {/* Nav */}
      <nav className="bg-[#0a0a0a] border-b border-[#1a1a1a] px-6 md:px-8 h-14 flex items-center justify-between sticky top-0 z-50">
        <Link href="/" className="flex items-center gap-2.5">
          <Image src="/logo.svg" alt="Lookitry" width={28} height={28} className="object-contain h-7 w-auto" priority />
          <span className="font-syne font-extrabold text-base text-white tracking-tight">
            Look<span className="text-[#FF5C3A]">itry</span>
          </span>
        </Link>
        <div className="flex items-center gap-1.5 text-[12px] text-[#888]">
          <IconLock />
          Pago seguro con Wompi
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-4 md:px-6 py-10">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-1.5 text-[13px] text-[#888] hover:text-[#ccc] transition-colors mb-8"
        >
          <IconArrowLeft />
          Volver
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 items-start">

          {/* Columna izquierda: selector + resumen */}
          <div className="lg:col-span-3 space-y-5">

            {/* Selector de plan */}
            <div className="bg-[#141414] border border-[#2a2a2a] rounded-xl p-5">
              <h2 className="font-syne font-bold text-[16px] text-white mb-4">
                Selecciona lo que necesitas
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {(['BASIC', 'PRO', 'LANDING'] as PlanKey[]).map(p => {
                  const isSelected = selectedPlan === p;
                  const isLandingOpt = p === 'LANDING';
                  return (
                    <button
                      key={p}
                      onClick={() => setSelectedPlan(p)}
                      className="text-left rounded-xl border-2 p-4 transition-all"
                      style={{
                        borderColor: isSelected ? '#FF5C3A' : '#2a2a2a',
                        background: isSelected ? 'rgba(255,92,58,0.07)' : '#1a1a1a',
                      }}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-1.5">
                          {isLandingOpt && (
                            <svg className="w-3.5 h-3.5 text-[#FF5C3A]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9" />
                            </svg>
                          )}
                          <span className="text-[12px] font-bold text-white">{planNames[p]}</span>
                        </div>
                        <div
                          className="w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0"
                          style={{ borderColor: isSelected ? '#FF5C3A' : '#444' }}
                        >
                          {isSelected && <div className="w-2 h-2 rounded-full bg-[#FF5C3A]" />}
                        </div>
                      </div>
                      {isLandingOpt ? (
                        <>
                          <div className="text-[11px] text-[#555] line-through">{formatCOP(landingOriginal)}</div>
                          <div className="font-syne text-[16px] font-extrabold text-[#FF5C3A]">
                            {formatCOP(landingPrice)}
                          </div>
                          <div className="text-[10px] text-[#999] mt-0.5">Pago unico</div>
                        </>
                      ) : (
                        <>
                          <div className="font-syne text-[16px] font-extrabold text-white">
                            {formatCOP(planBase[p as 'BASIC' | 'PRO'])}
                          </div>
                          <div className="text-[10px] text-[#999] mt-0.5">/mes</div>
                        </>
                      )}
                    </button>
                  );
                })}
              </div>
              {/* Nota informativa cuando se selecciona LANDING */}
              {isLanding && (
                <div className="mt-3 flex items-start gap-2 bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg px-3 py-2.5">
                  <svg className="w-4 h-4 text-[#FF5C3A] flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="text-[11px] text-[#aaa] leading-relaxed">
                    La mini-landing requiere un plan de suscripcion activo. Selecciona el plan que quieres activar junto con tu pagina.
                  </p>
                </div>
              )}
            </div>

            {/* Selector de plan de suscripcion (solo cuando se elige LANDING) */}
            {isLanding && (
              <div className="bg-[#141414] border border-[#2a2a2a] rounded-xl p-5">
                <h2 className="font-syne font-bold text-[15px] text-white mb-1">
                  Plan de suscripcion incluido
                </h2>
                <p className="text-[11px] text-[#555] mb-3">La mini-landing necesita un plan activo para funcionar</p>
                <div className="grid grid-cols-2 gap-3">
                  {(['BASIC', 'PRO'] as SubPlan[]).map(p => {
                    const isSelected = subPlan === p;
                    return (
                      <button
                        key={p}
                        onClick={() => setSubPlan(p)}
                        className="text-left rounded-xl border-2 p-4 transition-all"
                        style={{
                          borderColor: isSelected ? '#FF5C3A' : '#2a2a2a',
                          background: isSelected ? 'rgba(255,92,58,0.07)' : '#1a1a1a',
                        }}
                      >
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-[12px] font-bold text-white">{planNames[p]}</span>
                          <div className="w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0" style={{ borderColor: isSelected ? '#FF5C3A' : '#444' }}>
                            {isSelected && <div className="w-2 h-2 rounded-full bg-[#FF5C3A]" />}
                          </div>
                        </div>
                        <div className="font-syne text-[15px] font-extrabold text-white">
                          {formatCOP(planBase[p])}
                        </div>
                        <div className="text-[10px] text-[#555] mt-0.5">/mes</div>
                        <ul className="mt-2 space-y-1">
                          {PLAN_FEATURES[p].slice(0, 3).map(f => (
                            <li key={f} className="flex items-start gap-1.5 text-[10px] text-[#555]">
                              <svg className="w-3 h-3 mt-0.5 flex-shrink-0 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                              </svg>
                              {f}
                            </li>
                          ))}
                        </ul>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Selector de meses (para BASIC/PRO directo, o para el subPlan cuando es LANDING) */}
            <div className="bg-[#141414] border border-[#2a2a2a] rounded-xl p-5">
              <h2 className="font-syne font-bold text-[15px] text-white mb-1">
                Duracion del plan
              </h2>
              {isLanding && (
                <p className="text-[11px] text-[#555] mb-3">Elige cuantos meses de suscripcion quieres activar</p>
              )}
              <div className="grid grid-cols-4 gap-2 mt-3">
                {discounts.map(d => (
                  <button
                    key={d.months}
                    onClick={() => setSelectedMonths(d.months)}
                    className="relative py-3 rounded-xl border-2 text-center transition-all"
                    style={{
                      borderColor: selectedMonths === d.months ? '#FF5C3A' : '#2a2a2a',
                      background: selectedMonths === d.months ? 'rgba(255,92,58,0.07)' : '#1a1a1a',
                    }}
                  >
                    <span className="block text-[15px] font-bold text-white">{d.months}</span>
                    <span className="block text-[10px] text-[#555]">mes{d.months > 1 ? 'es' : ''}</span>
                    {d.pct > 0 && (
                      <span className="absolute -top-2 left-1/2 -translate-x-1/2 bg-emerald-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full whitespace-nowrap">
                        -{d.pct}%
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Resumen del pedido */}
            <div className="bg-[#141414] border border-[#2a2a2a] rounded-xl p-6">
              <p className="text-[11px] font-bold text-[#FF5C3A] uppercase tracking-wide mb-4">Resumen del pedido</p>

              {isLanding ? (
                /* Desglose: landing + suscripcion */
                <div className="space-y-3 mb-5">
                  {/* Linea landing */}
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-[13px] font-semibold text-white">Mini-landing</div>
                      <div className="text-[11px] text-[#555]">Pago unico</div>
                    </div>
                    <div className="text-right">
                      {landingDiscount > 0 && (
                        <div className="text-[11px] text-[#666] line-through">{formatCOP(landingOriginal)}</div>
                      )}
                      <div className="text-[15px] font-bold text-white">{formatCOP(landingPrice)}</div>
                    </div>
                  </div>
                  {/* Linea suscripcion */}
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-[13px] font-semibold text-white">{planNames[subPlan]}</div>
                      <div className="text-[11px] text-[#999]">
                        {discounts.find(d => d.months === selectedMonths)?.label}
                      </div>
                    </div>
                    <div className="text-right">
                      {(subMonthDiscount > 0 || promoDiscountPct > 0) && (
                        <div className="text-[11px] text-[#666] line-through">{formatCOP(planBase[subPlan] * selectedMonths)}</div>
                      )}
                      <div className="text-[15px] font-bold text-white">{formatCOP(subPlanTotal)}</div>
                    </div>
                  </div>

                  {/* Detalle de Descuentos Aplicados */}
                  {(subMonthDiscount > 0 || promoDiscountPct > 0) && (
                    <div className="mt-2 space-y-1 bg-[#1a1a1a] rounded-lg p-2.5 border border-[#2a2a2a]">
                      <p className="text-[10px] font-bold text-[#FF5C3A] uppercase mb-1">Ahorros aplicados</p>
                      {subMonthDiscount > 0 && (
                        <div className="flex justify-between text-[11px]">
                          <span className="text-[#aaa]">Ahorro por permanencia ({selectedMonths} meses)</span>
                          <span className="text-emerald-400 font-medium">-{subMonthDiscount}%</span>
                        </div>
                      )}
                      {promoDiscountPct > 0 && (
                        <div className="flex justify-between text-[11px]">
                          <span className="text-[#aaa]">Oferta especial de bienvenida</span>
                          <span className="text-emerald-400 font-medium">-{promoDiscountPct}%</span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Features landing */}
                  <div className="pt-2 border-t border-[#1f1f1f]">
                    <p className="text-[10px] font-semibold text-[#666] uppercase tracking-wide mb-2">Mini-landing incluye</p>
                    <ul className="space-y-1.5">
                      {PLAN_FEATURES.LANDING.map(f => (
                        <li key={f} className="flex items-start gap-2 text-[12px] text-[#bbb]">
                          <span className="w-3.5 h-3.5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 bg-[rgba(255,92,58,0.13)]">
                            <IconCheck />
                          </span>
                          {f}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              ) : (
                /* Plan simple */
                <div className="mb-5">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <div className="text-[14px] font-semibold text-white">{planNames[selectedPlan]}</div>
                      <div className="text-[12px] text-[#555]">{discounts.find(d => d.months === selectedMonths)?.label}</div>
                    </div>
                    <div className="text-right">
                      {(subMonthDiscount > 0 || promoDiscountPct > 0) && (
                        <div className="text-[12px] text-[#666] line-through">{formatCOP(originalPrice)}</div>
                      )}
                      <div className="font-syne font-extrabold text-[20px] text-white">
                        {formatCOP(subPlanTotal)}
                      </div>
                      {selectedMonths > 1 && monthlyPrice && (
                        <div className="text-[11px] text-[#999]">{formatCOP(Math.round(monthlyPrice))}/mes</div>
                      )}
                    </div>
                  </div>

                  {/* Detalle de Descuentos Aplicados */}
                  {(subMonthDiscount > 0 || promoDiscountPct > 0) && (
                    <div className="mb-4 space-y-1 bg-[#1a1a1a] rounded-lg p-3 border border-[#2a2a2a]">
                      <p className="text-[10px] font-bold text-[#FF5C3A] uppercase mb-1">Ahorros aplicados</p>
                      {subMonthDiscount > 0 && (
                        <div className="flex justify-between text-[12px]">
                          <span className="text-[#aaa]">Ahorro por permanencia ({selectedMonths} meses)</span>
                          <span className="text-emerald-400 font-bold">-{subMonthDiscount}%</span>
                        </div>
                      )}
                      {promoDiscountPct > 0 && (
                        <div className="flex justify-between text-[12px]">
                          <span className="text-[#aaa]">Oferta especial por tiempo limitado</span>
                          <span className="text-emerald-400 font-bold">-{promoDiscountPct}%</span>
                        </div>
                      )}
                    </div>
                  )}

                  <ul className="space-y-2">
                    {PLAN_FEATURES[selectedPlan].map(f => (
                      <li key={f} className="flex items-start gap-2.5 text-[12px] text-[#bbb]">
                        <span className="w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 bg-[rgba(255,92,58,0.13)]">
                          <IconCheck />
                        </span>
                        {f}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Campo de cupón */}
              <div className="border-t border-[#2a2a2a] pt-4 mb-4">
                <p className="text-[11px] font-semibold text-[#666] uppercase tracking-wide mb-2">Cupón de descuento</p>
                {appliedCoupon ? (
                  <div className="flex items-center justify-between bg-[#0d1f0d] border border-emerald-800/50 rounded-lg px-3 py-2">
                    <div>
                      <span className="text-[12px] font-bold text-emerald-400">{appliedCoupon.code}</span>
                      <span className="text-[11px] text-emerald-600 ml-2">
                        {appliedCoupon.discount_type === 'pct'
                          ? `−${appliedCoupon.discount_value}%`
                          : `−${formatCOP(appliedCoupon.discount_value)}`}
                      </span>
                    </div>
                    <button
                      onClick={() => { setAppliedCoupon(null); setCouponCode(''); }}
                      className="text-[11px] text-[#666] hover:text-[#ff6b6b] transition-colors"
                    >
                      Quitar
                    </button>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={couponCode}
                      onChange={e => setCouponCode(e.target.value.toUpperCase())}
                      onKeyDown={e => e.key === 'Enter' && handleValidateCoupon()}
                      placeholder="CÓDIGO"
                      className="flex-1 bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg px-3 py-2 text-[12px] text-white placeholder-[#444] focus:outline-none focus:border-[#FF5C3A] transition-colors"
                    />
                    <button
                      onClick={handleValidateCoupon}
                      disabled={couponLoading || !couponCode.trim()}
                      className="px-3 py-2 rounded-lg text-[12px] font-semibold text-white transition-all disabled:opacity-50"
                      style={{ backgroundColor: '#FF5C3A' }}
                    >
                      {couponLoading ? '...' : 'Aplicar'}
                    </button>
                  </div>
                )}
                {couponError && (
                  <p className="text-[11px] text-[#ff6b6b] mt-1.5">{couponError}</p>
                )}
              </div>

              <div className="border-t border-[#2a2a2a] pt-4 space-y-2">
                {couponDiscount > 0 && (
                  <div className="flex items-center justify-between">
                    <span className="text-[12px] text-[#999]">Subtotal</span>
                    <span className="text-[13px] text-[#999]">{formatCOP(baseTotalPrice)} COP</span>
                  </div>
                )}
                {couponDiscount > 0 && (
                  <div className="flex items-center justify-between">
                    <span className="text-[12px] text-emerald-400">Descuento ({appliedCoupon?.code})</span>
                    <span className="text-[13px] text-emerald-400">−{formatCOP(couponDiscount)} COP</span>
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <span className="text-[13px] font-medium text-[#999]">Total a pagar</span>
                  <span className="font-syne font-extrabold text-[22px] text-white">
                    {formatCOP(totalPrice)} COP
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Columna derecha: pago */}
          <div className="lg:col-span-2 space-y-4 lg:sticky lg:top-20">
            <div className="bg-[#141414] border border-[#2a2a2a] rounded-xl p-6">
              <h2 className="font-syne font-bold text-[16px] text-white mb-1">
                Método de pago
              </h2>
              <p className="text-[12px] text-[#aaa] mb-5">
                Serás redirigido a Wompi para completar el pago de forma segura.
                Aceptamos tarjetas débito, crédito, PSE y Nequi.
              </p>

              {error && (
                <div className="bg-[#1f0f0f] border border-[#5a1a1a] text-[#ff6b6b] text-[12px] rounded-lg px-3 py-2 mb-4">
                  {error}
                </div>
              )}

              {/* Sesión activa o campo de email */}
              {hasSession && sessionInfo ? (
                <div className="mb-4 flex items-center gap-3 bg-[#0f1a0f] border border-emerald-900/40 rounded-lg px-3 py-2.5">
                  <div className="w-7 h-7 rounded-full bg-[#FF5C3A] flex items-center justify-center flex-shrink-0">
                    <span className="text-[11px] font-bold text-white">
                      {sessionInfo.name.split(' ').map((w: string) => w[0]).slice(0, 2).join('').toUpperCase() || '?'}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[12px] font-semibold text-white truncate">{sessionInfo.name}</p>
                    <p className="text-[11px] text-[#666] truncate">{sessionInfo.email}</p>
                  </div>
                  <span className="text-[10px] text-emerald-500 font-medium flex-shrink-0">Sesión activa</span>
                </div>
              ) : !hasSession ? (
                <div className="mb-4">
                  <label className="block text-[12px] font-medium text-[#888] mb-1.5">
                    Correo electrónico
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={e => { setEmail(e.target.value); setEmailError(''); }}
                    placeholder="hola@mimarca.com"
                    className={`w-full bg-[#0f0f0f] border ${emailError ? 'border-[#5a1a1a]' : 'border-[#2a2a2a]'} rounded-lg px-3 py-2.5 text-[13px] text-white placeholder-[#333] focus:outline-none focus:border-[#FF5C3A] transition-colors`}
                  />
                  {emailError && (
                    <p className="text-[11px] text-[#ff6b6b] mt-1">{emailError}</p>
                  )}
                  <p className="text-[11px] text-[#444] mt-1">
                    Lo usaremos para vincular tu pago con tu cuenta.
                  </p>
                </div>
              ) : null}

              <button
                onClick={handlePagar}
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 bg-[#FF5C3A] hover:bg-[#e84d2c] disabled:opacity-60 text-white font-semibold py-3.5 rounded-xl transition-colors text-[14px]"
                style={{ boxShadow: '0 6px 20px rgba(255,92,58,0.3)' }}
              >
                {loading ? <IconSpinner /> : null}
                {loading
                  ? 'Redirigiendo...'
                  : isLanding
                    ? `Pagar ${formatCOP(totalPrice)} COP — Landing + ${planNames[subPlan]}`
                    : `Pagar ${formatCOP(totalPrice)} COP`}
              </button>

              <div className="flex items-center justify-center gap-1.5 mt-3 text-[11px] text-[#666]">
                <IconLock />
                Pago procesado por Wompi — 100% seguro
              </div>
            </div>

            {/* Contacto alternativo */}
            <div className="bg-[#141414] border border-[#2a2a2a] rounded-xl p-5 space-y-3">
              <p className="text-[12px] text-[#999] font-medium">¿Prefieres pagar por otro medio?</p>
              <a
                href={`https://wa.me/${(pricing?.manualWhatsapp || '573105436281').replace(/\D/g, '')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-[12px] text-[#999] hover:text-white transition-colors"
              >
                <IconWhatsapp />
                Contactar por WhatsApp
              </a>
              <a
                href={`mailto:${pricing?.manualEmail || 'info@pruebalo.wilkiedevs.com'}`}
                className="flex items-center gap-2 text-[12px] text-[#999] hover:text-white transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                {pricing?.manualEmail || 'info@pruebalo.wilkiedevs.com'}
              </a>
              <p className="text-[11px] text-[#777] pt-1 border-t border-[#1f1f1f]">
                {isLanding
                  ? 'La mini-landing se activa en minutos tras confirmar el pago.'
                  : 'El plan se activa inmediatamente después del pago.'}
              </p>
              <p className="text-[11px] text-[#555] pt-1">
                Al pagar aceptas nuestros{' '}
                <Link href="/terminos" target="_blank" className="text-[#FF5C3A] hover:underline">
                  Términos y Condiciones
                </Link>
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
