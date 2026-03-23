'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { CheckCircle, XCircle, CreditCard, ShieldCheck, ArrowLeft, Globe, ArrowUpCircle, RefreshCw } from 'lucide-react';
import WompiButton from '@/components/payments/WompiButton';
import { subscriptionService } from '@/services/subscription.service';
import { api } from '@/services/api';
import { formatCurrency, formatPrice } from '@/utils/currency';
import type { PlanType } from '@/types';
import type { WompiWidgetResult } from '@/types/wompi';

// ── Constantes ────────────────────────────────────────────────────────────────

const PLAN_INFO_FALLBACK: Record<PlanType, { name: string; price: number; features: string[] }> = {
  BASIC: {
    name: 'Plan Básico',
    price: 150000,
    features: [
      'Hasta 5 productos',
      '400 generaciones por mes',
      'Branding básico (logo y colores)',
      'URL propia del probador',
      'Soporte por WhatsApp/email',
    ],
  },
  PRO: {
    name: 'Plan Pro',
    price: 250000,
    features: [
      'Hasta 15 productos',
      '1.200 generaciones por mes',
      'Branding avanzado y personalización completa',
      'Modificación del slug del probador',
      'Soporte prioritario',
      'Integración con sistemas externos',
    ],
  },
};

const MINI_LANDING_PRICE_FALLBACK = 650000;
const MONTH_DISCOUNTS_FALLBACK = [
  { months: 1,  pct: 0,  label: '1 mes' },
  { months: 3,  pct: 5,  label: '3 meses' },
  { months: 6,  pct: 10, label: '6 meses' },
  { months: 12, pct: 15, label: '12 meses' },
];


type CheckoutState = 'idle' | 'success' | 'error';

// ── Componente principal ──────────────────────────────────────────────────────

import { Suspense } from 'react';

function CheckoutContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const planParam = (searchParams.get('plan') ?? 'BASIC').toUpperCase() as PlanType;
  const initialPlan: PlanType = planParam in PLAN_INFO_FALLBACK ? planParam : 'BASIC';

  const [selectedPlan, setSelectedPlan] = useState<PlanType>(initialPlan);
  const [selectedMonths, setSelectedMonths] = useState(1);
  const [state, setState] = useState<CheckoutState>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  // Estado de la cuenta
  const [currentPlan, setCurrentPlan] = useState<PlanType | null>(null);
  const [isInTrial, setIsInTrial] = useState(false);
  const [hasActiveSub, setHasActiveSub] = useState(false);
  const [hasLandingPage, setHasLandingPage] = useState(false);
  const [daysRemaining, setDaysRemaining] = useState<number | null>(null);
  const [loadingInfo, setLoadingInfo] = useState(true);

  // Pagos
  const [paymentMethod, setPaymentMethod] = useState<'wompi' | 'paypal'>('wompi');
  const [currency, setCurrency] = useState<'COP' | 'USD'>('COP');
  const [wompiEnabled, setWompiEnabled] = useState<boolean | null>(null);
  const [paypalEnabled, setPaypalEnabled] = useState<boolean>(true);
  const [trm, setTrm] = useState(3900);
  const [redirecting, setRedirecting] = useState(false);
  
  const [includeLanding, setIncludeLanding] = useState(false);
  const [miniLandingPrice, setMiniLandingPrice] = useState(MINI_LANDING_PRICE_FALLBACK);
  const [planInfo, setPlanInfo] = useState(PLAN_INFO_FALLBACK);
  const [monthDiscounts, setMonthDiscounts] = useState(MONTH_DISCOUNTS_FALLBACK);

  // Prorrateo y Upgrades
  const [prorationPreview, setProrationPreview] = useState<{
    creditAmount: number;
    amountToPay: number;
    newPlanTotal: number;
    daysRemaining: number;
    isFree: boolean;
  } | null>(null);
  const [loadingProration, setLoadingProration] = useState(false);
  const [applyingFreeUpgrade, setApplyingFreeUpgrade] = useState(false);

  // Lógica de suscripción
  const isUpgrade   = hasActiveSub && currentPlan === 'BASIC' && selectedPlan === 'PRO';
  const isDowngrade = hasActiveSub && currentPlan === 'PRO' && selectedPlan === 'BASIC';
  const isChange    = isUpgrade || isDowngrade;
  const isRenewal   = hasActiveSub && currentPlan === selectedPlan;
  
  const monthDiscount = monthDiscounts.find(d => d.months === selectedMonths)!;
  const planTotal = Math.round(planInfo[selectedPlan].price * selectedMonths * (1 - monthDiscount.pct / 100));
  const totalPrice = isChange && prorationPreview 
    ? Math.max(0, prorationPreview.amountToPay + (includeLanding ? miniLandingPrice : 0))
    : (planTotal + (includeLanding ? miniLandingPrice : 0));

  const handlePagarPaypal = async () => {
    setRedirecting(true);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://api.lookitry.com';
      const landingParam = includeLanding ? '&includes_landing=true' : '';
      const res = await fetch(
        `${apiUrl}/api/payments/paypal/checkout-url?amount=${totalPrice}&months=${selectedMonths}&plan=${selectedPlan}${landingParam}&trm=${trm}`,
        { credentials: 'include' }
      );
      const data = await res.json();
      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
      } else {
        throw new Error('No se pudo generar el link de PayPal');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Error al conectar con PayPal');
      setState('error');
    } finally {
      setRedirecting(false);
    }
  };

  useEffect(() => {
    subscriptionService.getSubscriptionInfo().then((info) => {
      if (info) {
        setCurrentPlan(info.plan);
        setIsInTrial(info.isInTrial);
        setHasActiveSub(info.status === 'active' || info.status === 'expiring_soon');
        setHasLandingPage(info.hasLandingPage);
        setDaysRemaining(info.daysRemaining);
      }
      setLoadingInfo(false);
    });

    api.get(`/payments/wompi/config?plan=${initialPlan}`)
      .then(() => setWompiEnabled(true))
      .catch(() => setWompiEnabled(false));

    Promise.all([
      fetch(`${process.env.NEXT_PUBLIC_API_URL || 'https://api.lookitry.com'}/api/payment-settings/public`)
        .then(r => r.ok ? r.json() : null),
      fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/pricing_config?select=id,data`, {
        headers: {
          apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
          Authorization: `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!}`,
        },
      }).then(r => r.ok ? r.json() : null),
    ]).then(([paySettings, pricingRows]) => {
      if (paySettings) {
        if (paySettings.landingPrice) setMiniLandingPrice(paySettings.landingPrice);
        if (paySettings.trm) setTrm(paySettings.trm);
        if (typeof paySettings.paypalEnabled === 'boolean') setPaypalEnabled(paySettings.paypalEnabled);
      }
      if (Array.isArray(pricingRows)) {
        const basicData = pricingRows.find((r: any) => r.id === 'basic')?.data;
        const proData   = pricingRows.find((r: any) => r.id === 'pro')?.data;
        const descData  = pricingRows.find((r: any) => r.id === 'descuentos_duracion')?.data;
        if (basicData || proData) {
          setPlanInfo({
            BASIC: {
              ...PLAN_INFO_FALLBACK.BASIC,
              price: basicData?.precio_mensual_cop ?? PLAN_INFO_FALLBACK.BASIC.price,
              features: basicData?.features ?? PLAN_INFO_FALLBACK.BASIC.features,
            },
            PRO: {
              ...PLAN_INFO_FALLBACK.PRO,
              price: proData?.precio_mensual_cop ?? PLAN_INFO_FALLBACK.PRO.price,
              features: proData?.features ?? PLAN_INFO_FALLBACK.PRO.features,
            }
          });
        }
        if (descData) {
          setMonthDiscounts([
            { months: 1,  pct: descData.meses_1  ?? 0,  label: '1 mes' },
            { months: 3,  pct: descData.meses_3  ?? 5,  label: '3 meses' },
            { months: 6,  pct: descData.meses_6  ?? 10, label: '6 meses' },
            { months: 12, pct: descData.meses_12 ?? 15, label: '12 meses' },
          ]);
        }
      }
    }).catch(err => {
      console.error('[Checkout] Error loading external settings:', err);
    });
  }, [selectedPlan]);

  // Manejo del cambio de moneda
  useEffect(() => {
    const savedCurrency = localStorage.getItem('currency') as 'COP' | 'USD';
    if (savedCurrency) {
      setCurrency(savedCurrency);
      if (savedCurrency === 'USD') setPaymentMethod('paypal');
    }

    const handleCurrencyChange = () => {
      const current = localStorage.getItem('currency') as 'COP' | 'USD';
      if (current) {
        setCurrency(current);
        if (current === 'USD') setPaymentMethod('paypal');
      }
    };
    window.addEventListener('currencyChange', handleCurrencyChange);
    return () => window.removeEventListener('currencyChange', handleCurrencyChange);
  }, []);

  // Calcular prorrateo cuando hay cambio de plan (Upgrade o Downgrade)
  useEffect(() => {
    if (!isChange || loadingInfo) {
      setProrationPreview(null);
      return;
    }
    setLoadingProration(true);
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://api.lookitry.com';
    const newPlanPricePerMonth = planInfo[selectedPlan].price;
    const currentPlanPriceTotal = Math.ceil(planInfo[currentPlan as PlanType].price * selectedMonths);

    fetch(
      `${apiUrl}/api/payments/wompi/upgrade-preview?newPlan=${selectedPlan}&newMonths=${selectedMonths}&newPlanPricePerMonth=${newPlanPricePerMonth}&currentPlanPriceTotal=${currentPlanPriceTotal}`,
      { credentials: 'include' }
    )
      .then(r => r.ok ? r.json() : null)
      .then(data => { if (data) setProrationPreview(data); })
      .catch(() => {})
      .finally(() => setLoadingProration(false));
  }, [isChange, selectedMonths, loadingInfo, planInfo, selectedPlan]);

  const handleFreeUpgrade = async () => {
    if (!prorationPreview || !prorationPreview.isFree) return;
    setApplyingFreeUpgrade(true);
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://api.lookitry.com';
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    try {
      const res = await fetch(`${apiUrl}/api/payments/wompi/apply-free-upgrade`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          newPlan: selectedPlan,
          newMonths: selectedMonths,
          creditAmount: prorationPreview.creditAmount,
          newPlanTotal: prorationPreview.newPlanTotal,
        }),
      });
      if (res.ok) {
        setState('success');
      } else {
        const err = await res.json();
        setErrorMsg(err.error || 'Error al aplicar el upgrade');
        setState('error');
      }
    } catch {
      setErrorMsg('Error de conexión');
      setState('error');
    } finally {
      setApplyingFreeUpgrade(false);
    }
  };

  const handleSuccess = (result: WompiWidgetResult) => {
    console.log('[Wompi] Pago aprobado:', result.transaction.id);
    setState('success');
  };

  const handleError = (msg: string) => {
    setErrorMsg(msg);
    setState('error');
  };

  // ── Estado: cargando ─────────────────────────────────────────────────────

  if (loadingInfo) {
    return (
      <div className="max-w-lg mx-auto py-16 flex items-center justify-center gap-3">
        <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
        </svg>
        <span className="text-sm" style={{ color: 'var(--text-muted)' }}>Cargando información...</span>
      </div>
    );
  }

  // ── Estado: pago exitoso ──────────────────────────────────────────────────

  if (state === 'success') {
    return (
      <div className="max-w-lg mx-auto py-16 text-center space-y-4">
        <div className="flex justify-center">
          <CheckCircle className="w-16 h-16 text-emerald-500" />
        </div>
        <h2 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>Pago recibido</h2>
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
          Tu pago fue aprobado. Tu suscripción se actualizará automáticamente en los próximos minutos.
          Si no ves el cambio en 5 minutos, contáctanos.
        </p>
        <button
          onClick={() => router.push('/dashboard/subscription')}
          className="mt-4 px-6 py-2.5 min-h-[44px] rounded-xl text-white text-sm font-medium transition-opacity"
          style={{ background: '#FF5C3A' }}
        >
          Ver mi suscripción
        </button>
      </div>
    );
  }

  // ── Estado: error ─────────────────────────────────────────────────────────

  if (state === 'error') {
    return (
      <div className="max-w-lg mx-auto py-16 text-center space-y-4">
        <div className="flex justify-center">
          <XCircle className="w-16 h-16 text-red-500" />
        </div>
        <h2 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>Pago no completado</h2>
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>{errorMsg}</p>
        <div className="flex gap-3 justify-center mt-4">
          <button
            onClick={() => { setState('idle'); setErrorMsg(''); }}
            className="px-5 py-2.5 min-h-[44px] rounded-xl border text-sm transition-colors"
            style={{ borderColor: 'var(--border-color)', color: 'var(--text-secondary)' }}
          >
            Intentar de nuevo
          </button>
          <button
            onClick={() => router.push('/dashboard/subscription')}
            className="px-5 py-2.5 min-h-[44px] rounded-xl text-white text-sm font-medium"
            style={{ background: '#FF5C3A' }}
          >
            Volver a suscripción
          </button>
        </div>
      </div>
    );
  }

  // ── Helpers de UI ─────────────────────────────────────────────────────────

  // Etiqueta de acción según el modo
  const actionLabel = (() => {
    if (!hasActiveSub) return 'Activar suscripción';
    if (isUpgrade) return 'Upgrade a Plan Pro';
    if (isDowngrade) return 'Cambiar a Plan Básico';
    return 'Renovar / Ampliar plan';
  })();

  const actionSubtitle = (() => {
    if (!hasActiveSub) return 'Elige tu plan para continuar después del período de prueba';
    if (isUpgrade) return `Los ${daysRemaining ?? 0} días restantes de tu Plan Básico se conservan — el plan cambia a PRO inmediatamente`;
    if (isDowngrade) return 'El cambio aplica al próximo período de facturación';
    return `Amplía tu suscripción — los días restantes se suman al nuevo período`;
  })();

  // ── Render principal ──────────────────────────────────────────────────────

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-10">

      {/* Encabezado */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => router.back()}
          className="p-2 rounded-lg transition-colors"
          style={{ color: 'var(--text-muted)', background: 'var(--bg-hover)' }}
          aria-label="Volver"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-xl font-bold font-syne" style={{ color: 'var(--text-primary)' }}>{actionLabel}</h1>
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>{actionSubtitle}</p>
        </div>
      </div>

      {/* Banner informativo para usuarios con sub activa */}
      {hasActiveSub && !isUpgrade && (
        <div
          className="rounded-2xl border px-5 py-4 flex items-start gap-3"
          style={{ background: 'rgba(16,185,129,0.06)', borderColor: 'rgba(16,185,129,0.2)' }}
        >
          <RefreshCw className="w-5 h-5 mt-0.5 flex-shrink-0 text-emerald-500" />
          <div>
            <p className="text-sm font-semibold" style={{ color: '#059669' }}>
              {planInfo[currentPlan!]?.name ?? ''} activo{daysRemaining != null ? ` · ${daysRemaining} días restantes` : ''}
            </p>
            <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
              {isRenewal ? 'Los nuevos meses se suman a tu fecha de vencimiento actual.' : 'El cambio de plan aplica desde el próximo período.'}
            </p>
          </div>
        </div>
      )}

      {/* Panel de prorrateo — solo visible en upgrade */}
      {isUpgrade && (
        <div
          className="rounded-2xl border overflow-hidden"
          style={{ borderColor: 'rgba(99,102,241,0.3)', background: 'rgba(99,102,241,0.04)' }}
        >
          <div className="px-5 py-4 flex items-center gap-3 border-b" style={{ borderColor: 'rgba(99,102,241,0.2)' }}>
            <ArrowUpCircle className="w-5 h-5 flex-shrink-0" style={{ color: '#6366f1' }} />
            <div>
              <p className="text-sm font-semibold" style={{ color: '#6366f1' }}>
                Upgrade: {planInfo['BASIC'].name} → {planInfo['PRO'].name}
              </p>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                Tu crédito restante se descuenta del precio del Plan Pro
              </p>
            </div>
          </div>

          {loadingProration ? (
            <div className="px-5 py-4 flex items-center gap-2 text-sm" style={{ color: 'var(--text-muted)' }}>
              <svg className="animate-spin h-4 w-4 flex-shrink-0" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
              </svg>
              Calculando prorrateo...
            </div>
          ) : prorationPreview ? (
            <div className="px-5 py-4 space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span style={{ color: 'var(--text-muted)' }}>Plan Pro · {selectedMonths} {selectedMonths === 1 ? 'mes' : 'meses'}</span>
                <span style={{ color: 'var(--text-primary)' }}>{formatPrice(prorationPreview.newPlanTotal, paymentMethod, trm)}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span style={{ color: 'var(--text-muted)' }}>
                  Crédito por {prorationPreview.daysRemaining} días restantes del Plan Básico
                </span>
                <span className="font-medium" style={{ color: '#10b981' }}>− {formatPrice(prorationPreview.creditAmount, paymentMethod, trm)}</span>
              </div>
              <div className="flex items-center justify-between pt-2 border-t font-semibold" style={{ borderColor: 'rgba(99,102,241,0.2)' }}>
                <span style={{ color: 'var(--text-primary)' }}>Total a pagar</span>
                <span style={{ color: prorationPreview.isFree ? '#10b981' : '#6366f1', fontSize: '1.1rem' }}>
                  {prorationPreview.isFree ? 'Sin costo adicional' : formatPrice(prorationPreview.amountToPay, paymentMethod, trm)}
                </span>
              </div>
              {prorationPreview.isFree && (
                <p className="text-xs pt-1" style={{ color: 'var(--text-muted)' }}>
                  Tu crédito cubre el costo completo del Plan Pro. El upgrade se aplica inmediatamente.
                </p>
              )}
            </div>
          ) : null}
        </div>
      )}

      {/* Selector de plan */}
      <div className="rounded-2xl border overflow-hidden" style={{ background: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
        <div className="px-6 py-4 border-b" style={{ background: 'var(--bg-hover)', borderColor: 'var(--border-color)' }}>
          <h2 className="font-semibold" style={{ color: 'var(--text-primary)' }}>
            {hasActiveSub ? 'Plan a contratar' : 'Selecciona tu plan'}
          </h2>
          <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
            {hasActiveSub ? 'Selecciona el mismo plan para renovar/ampliar, o uno diferente para cambiar' : 'Puedes cambiar de plan antes de pagar'}
          </p>
        </div>
        <div className="p-4 grid grid-cols-2 gap-3">
          {(Object.keys(PLAN_INFO_FALLBACK) as PlanType[]).map((p) => {
            const info = planInfo[p];
            const isSelected = selectedPlan === p;
            const isCurrent = hasActiveSub && p === currentPlan;
            return (
              <button
                key={p}
                type="button"
                onClick={() => setSelectedPlan(p)}
                className="text-left rounded-xl border-2 p-4 transition-all"
                style={{
                  borderColor: isSelected ? '#FF5C3A' : 'var(--border-color)',
                  background: isSelected ? 'rgba(255,92,58,0.06)' : 'var(--bg-hover)',
                }}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>{info.name}</span>
                    {isCurrent && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded font-semibold" style={{ background: 'rgba(255,92,58,0.1)', color: '#FF5C3A' }}>
                        Actual
                      </span>
                    )}
                  </div>
                  <div className="w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0"
                    style={{ borderColor: isSelected ? '#FF5C3A' : 'var(--border-color)' }}>
                    {isSelected && <div className="w-2 h-2 rounded-full" style={{ background: '#FF5C3A' }} />}
                  </div>
                </div>
                <p className="text-lg font-bold" style={{ color: isSelected ? '#FF5C3A' : 'var(--text-primary)' }}>
                  {formatPrice(info.price, paymentMethod, trm)}
                  <span className="text-xs font-normal ml-1" style={{ color: 'var(--text-muted)' }}>/mes</span>
                </p>
                <ul className="mt-2 space-y-1">
                  {info.features.slice(0, 3).map((f) => (
                    <li key={f} className="flex items-start gap-1.5 text-xs" style={{ color: 'var(--text-muted)' }}>
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

      {/* Selector de meses */}
      <div className="rounded-2xl border overflow-hidden" style={{ background: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
        <div className="px-6 py-4 border-b" style={{ background: 'var(--bg-hover)', borderColor: 'var(--border-color)' }}>
          <h2 className="font-semibold" style={{ color: 'var(--text-primary)' }}>Período</h2>
          <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>Más meses = mayor descuento</p>
        </div>
        <div className="p-4">
          <div className="grid grid-cols-4 gap-2">
            {monthDiscounts.map(d => (
              <button
                key={d.months}
                type="button"
                onClick={() => setSelectedMonths(d.months)}
                className="relative py-3 rounded-xl border-2 text-center transition-all min-h-[56px]"
                style={{
                  borderColor: selectedMonths === d.months ? '#FF5C3A' : 'var(--border-color)',
                  background: selectedMonths === d.months ? 'rgba(255,92,58,0.06)' : 'var(--bg-hover)',
                }}
              >
                <span className="block text-sm font-bold" style={{ color: 'var(--text-primary)' }}>{d.months}</span>
                <span className="block text-xs" style={{ color: 'var(--text-muted)' }}>mes{d.months > 1 ? 'es' : ''}</span>
                {d.pct > 0 && (
                  <span className="absolute -top-2 left-1/2 -translate-x-1/2 bg-emerald-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full whitespace-nowrap">
                    -{d.pct}%
                  </span>
                )}
              </button>
            ))}
          </div>
          {monthDiscount.pct > 0 && (
            <div className="mt-3 flex items-center justify-between bg-emerald-500/10 border border-emerald-500/20 rounded-xl px-3 py-2">
              <span className="text-xs text-emerald-600">Ahorro con {monthDiscount.pct}% de descuento</span>
              <span className="text-sm font-bold text-emerald-600">
                − {formatPrice(Math.ceil(planInfo[selectedPlan].price * selectedMonths * (monthDiscount.pct / 100)), paymentMethod, trm)}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Resumen del pedido */}
      <div className="rounded-2xl border overflow-hidden" style={{ background: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
        <div className="px-6 py-4 border-b" style={{ background: 'var(--bg-hover)', borderColor: 'var(--border-color)' }}>
          <h2 className="font-semibold" style={{ color: 'var(--text-primary)' }}>Resumen del pedido</h2>
        </div>
        <div className="px-6 py-5 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium" style={{ color: 'var(--text-primary)' }}>{planInfo[selectedPlan].name}</p>
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                {selectedMonths === 1
                  ? '1 mes (30 días)'
                  : `${selectedMonths} meses${monthDiscount.pct > 0 ? ` · ${monthDiscount.pct}% descuento` : ''}`}
              </p>
            </div>
            <p className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>{formatPrice(planTotal, paymentMethod, trm)}</p>
          </div>

          <ul className="space-y-2 pt-2 border-t" style={{ borderColor: 'var(--border-color)' }}>
            {planInfo[selectedPlan].features.map((f: string) => (
              <li key={f} className="flex items-center gap-2 text-sm" style={{ color: 'var(--text-secondary)' }}>
                <CheckCircle className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                {f}
              </li>
            ))}
          </ul>

          {/* Add-on landing — solo si no tiene landing activa */}
          {!hasLandingPage && (
            <div className="pt-4 border-t" style={{ borderColor: 'var(--border-color)' }}>
              <label className="flex items-start gap-3 cursor-pointer" htmlFor="include-landing">
                <div className="relative mt-0.5 flex-shrink-0">
                  <input id="include-landing" type="checkbox" checked={includeLanding} onChange={e => setIncludeLanding(e.target.checked)} className="sr-only" />
                  <div className="w-5 h-5 rounded border-2 flex items-center justify-center transition-colors"
                    style={{ backgroundColor: includeLanding ? '#FF5C3A' : 'transparent', borderColor: includeLanding ? '#FF5C3A' : 'var(--border-color)' }}>
                    {includeLanding && (
                      <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <div className="flex items-center gap-2">
                      <Globe className="w-4 h-4 flex-shrink-0" style={{ color: '#FF5C3A' }} />
                      <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Mini-landing personalizada</span>
                      <span className="text-xs px-1.5 py-0.5 rounded font-medium" style={{ backgroundColor: 'rgba(255,92,58,0.1)', color: '#FF5C3A' }}>Pago único</span>
                    </div>
                    <span className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>{formatPrice(miniLandingPrice, paymentMethod, trm)}</span>
                  </div>
                  <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                    Página pública en lookitry.com/tu-marca con hero, galería, probador virtual y contacto.
                  </p>
                </div>
              </label>
            </div>
          )}

          <div className="pt-3 border-t space-y-2" style={{ borderColor: 'var(--border-color)' }}>
            {isUpgrade && prorationPreview ? (
              <>
                <div className="flex items-center justify-between text-sm" style={{ color: 'var(--text-muted)' }}>
                  <span>Precio {planInfo[selectedPlan].name} × {selectedMonths} mes{selectedMonths > 1 ? 'es' : ''}</span>
                  <span>{formatPrice(planTotal, paymentMethod, trm)}</span>
                </div>
                <div className="flex items-center justify-between text-sm" style={{ color: '#10b981' }}>
                  <span>Crédito plan actual ({prorationPreview.daysRemaining} días)</span>
                  <span>− {formatPrice(prorationPreview.creditAmount, paymentMethod, trm)}</span>
                </div>
              </>
            ) : (
              isRenewal || isDowngrade ? (
                <>
                  <div className="flex items-center justify-between text-sm" style={{ color: 'var(--text-muted)' }}>
                    <span>Precio {planInfo[selectedPlan].name} × {selectedMonths} mes{selectedMonths > 1 ? 'es' : ''}</span>
                    <span>{formatPrice(planTotal, paymentMethod, trm)}</span>
                  </div>
                  {currentPlan && (
                    <div className="flex items-center justify-between text-sm text-emerald-600">
                      <span>Ya pagaste ({planInfo[currentPlan].name})</span>
                      <span>− {formatPrice(planInfo[currentPlan].price, paymentMethod, trm)}</span>
                    </div>
                  )}
                </>
              ) : null
            )}
            {includeLanding && (
              <div className="flex items-center justify-between text-sm" style={{ color: 'var(--text-muted)' }}>
                <span>Mini-landing (pago único)</span>
                <span>{formatPrice(miniLandingPrice, paymentMethod, trm)}</span>
              </div>
            )}
            <div className="flex items-center justify-between font-semibold pt-2 border-t" style={{ borderColor: 'var(--border-color)' }}>
              <span style={{ color: 'var(--text-primary)' }}>Total a pagar</span>
              <span className="text-xl font-bold" style={{ color: '#FF5C3A' }}>{formatPrice(totalPrice, paymentMethod, trm)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Sección de pago — en upgrade gratuito muestra botón directo */}
      {isUpgrade && prorationPreview?.isFree ? (
        <div className="rounded-2xl border px-6 py-5 space-y-4" style={{ background: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
          <div className="flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
            <ArrowUpCircle className="w-5 h-5" style={{ color: '#6366f1' }} />
            <h2 className="font-semibold">Confirmar upgrade</h2>
          </div>
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
            Tu crédito cubre el costo completo. No se realizará ningún cobro.
          </p>
          <button
            onClick={handleFreeUpgrade}
            disabled={applyingFreeUpgrade}
            className="w-full py-3 min-h-[44px] rounded-xl text-white font-semibold text-sm disabled:opacity-50 disabled:cursor-not-allowed transition-opacity flex items-center justify-center gap-2"
            style={{ background: '#6366f1' }}
          >
            {applyingFreeUpgrade ? (
              <>
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
                Aplicando upgrade...
              </>
            ) : (
              <>
                <ArrowUpCircle className="w-4 h-4" />
                Activar Plan Pro sin costo adicional
              </>
            )}
          </button>
        </div>
      ) : (
        <PaymentSection
          wompiEnabled={wompiEnabled}
          paypalEnabled={paypalEnabled}
          plan={selectedPlan}
          months={selectedMonths}
          amount={totalPrice}
          includesLanding={includeLanding}
          trm={trm}
          redirecting={redirecting}
          onSuccess={handleSuccess}
          onError={handleError}
          onPaypal={handlePagarPaypal}
          paymentMethod={paymentMethod}
          setPaymentMethod={setPaymentMethod}
          currency={currency}
        />
      )}

      <div className="flex items-center gap-2 text-xs justify-center" style={{ color: 'var(--text-muted)' }}>
        <ShieldCheck className="w-4 h-4" />
        <span>Pagos procesados de forma segura por Wompi. No almacenamos datos de tu tarjeta.</span>
      </div>
    </div>
  );
}

// ── Sub-componente: sección de pago ──────────────────────────────────────────

function PaymentSection({
  wompiEnabled,
  paypalEnabled,
  plan,
  months,
  amount,
  includesLanding,
  trm,
  redirecting,
  onSuccess,
  onError,
  onPaypal,
  paymentMethod,
  setPaymentMethod,
  currency,
}: {
  wompiEnabled: boolean | null;
  paypalEnabled: boolean;
  plan: PlanType;
  months: number;
  amount: number;
  includesLanding: boolean;
  trm: number;
  redirecting: boolean;
  onSuccess: (r: WompiWidgetResult) => void;
  onError: (msg: string) => void;
  onPaypal: () => void;
  paymentMethod: 'wompi' | 'paypal';
  setPaymentMethod: (m: 'wompi' | 'paypal') => void;
  currency: 'COP' | 'USD';
}) {
  return (
    <div className="rounded-2xl border px-6 py-5 space-y-4" style={{ background: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
      <div className="flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
        <CreditCard className="w-5 h-5" style={{ color: '#FF5C3A' }} />
        <h2 className="font-semibold">Método de pago</h2>
      </div>

      {/* Selector de método */}
      <div className="flex gap-2 mb-4">
        {currency === 'COP' && (
          <button
            onClick={() => setPaymentMethod('wompi')}
            className={`flex-1 flex flex-col items-center gap-2 py-3 rounded-xl border-2 transition-all ${paymentMethod === 'wompi' ? 'border-[#FF5C3A] bg-[#FF5C3A]/5' : 'border-[#2a2a2a] bg-[#1a1a1a] opacity-60'}`}
          >
            <img src="/wompi-logo.svg" alt="Wompi" className="h-6 w-auto invert brightness-200" />
            <span className="text-[10px] font-bold uppercase tracking-widest text-white">Tarjetas / PSE</span>
          </button>
        )}
        {paypalEnabled && (
          <button
            onClick={() => setPaymentMethod('paypal')}
            className={`flex-1 flex flex-col items-center gap-2 py-3 rounded-xl border-2 transition-all ${paymentMethod === 'paypal' ? 'border-[#0070ba] bg-[#0070ba]/5' : 'border-[#2a2a2a] bg-[#1a1a1a] opacity-60'}`}
          >
            <img src="https://upload.wikimedia.org/wikipedia/commons/b/b5/PayPal.svg" alt="PayPal" className="h-3 w-auto" />
            <span className="text-[10px] font-bold uppercase tracking-widest text-white">PayPal / USD</span>
          </button>
        )}
      </div>

      {paymentMethod === 'wompi' ? (
        <>
          {wompiEnabled === null && (
            <div className="flex items-center gap-2 text-sm" style={{ color: 'var(--text-muted)' }}>
              <RefreshCw className="animate-spin h-4 w-4" />
              Verificando Wompi...
            </div>
          )}

          {wompiEnabled === true && (
            <>
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                Paga de forma segura en COP con tarjeta, PSE o Nequi a través de Wompi.
              </p>
              <WompiButton
                plan={plan}
                months={months}
                amount={amount}
                includesLanding={includesLanding}
                onSuccess={onSuccess}
                onError={onError}
                className="w-full py-3 min-h-[44px] rounded-xl text-white font-semibold text-sm disabled:opacity-50 disabled:cursor-not-allowed transition-opacity flex items-center justify-center gap-2"
                style={{ background: '#FF5C3A' }}
              >
                <CreditCard className="w-4 h-4" />
                Pagar {formatCurrency(amount)} COP con Wompi
              </WompiButton>
            </>
          )}

          {wompiEnabled === false && (
            <p className="text-sm text-red-400">Wompi no está disponible temporalmente.</p>
          )}
        </>
      ) : (
        <>
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
            Paga de forma segura con PayPal. El total se convertirá a USD usando la TRM ($${trm} COP).
          </p>
          <button
            onClick={onPaypal}
            disabled={redirecting}
            className="w-full py-3 min-h-[44px] rounded-xl text-white font-semibold text-sm disabled:opacity-50 disabled:cursor-not-allowed transition-opacity flex items-center justify-center gap-2"
            style={{ background: '#0070ba' }}
          >
            {redirecting ? <RefreshCw className="animate-spin h-4 w-4" /> : <CreditCard className="w-4 h-4" />}
            Pagar USD ${Math.ceil(amount / trm)} con PayPal
          </button>
        </>
      )}

      {wompiEnabled === false && paymentMethod === 'wompi' && (
        <div className="space-y-3 pt-2">
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
            Contáctanos para completar tu suscripción manualmente.
          </p>
          <div className="flex flex-wrap gap-3">
            <a
              href="mailto:info@lookitry.com"
              className="flex items-center gap-2 px-4 py-2.5 min-h-[44px] rounded-xl border text-sm transition-colors hover:opacity-80"
              style={{ borderColor: 'var(--border-color)', color: 'var(--text-secondary)' }}
            >
              info@lookitry.com
            </a>
          </div>
        </div>
      )}
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={
      <div className="max-w-lg mx-auto py-16 flex items-center justify-center gap-3">
        <svg className="animate-spin h-5 w-5" style={{ color: '#FF5C3A' }} viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
        </svg>
        <span className="text-sm" style={{ color: 'var(--text-muted)' }}>Cargando checkout...</span>
      </div>
    }>
      <CheckoutContent />
    </Suspense>
  );
}
