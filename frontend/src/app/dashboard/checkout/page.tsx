'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { CheckCircle, XCircle, CreditCard, ShieldCheck, ArrowLeft, Globe, ArrowUpCircle, RefreshCw } from 'lucide-react';
import WompiButton from '@/components/payments/WompiButton';
import { subscriptionService } from '@/services/subscription.service';
import { api } from '@/services/api';
import { formatCurrency } from '@/utils/currency';
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

export default function CheckoutPage() {
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
  const [wompiEnabled, setWompiEnabled] = useState<boolean | null>(null);
  const [includeLanding, setIncludeLanding] = useState(false);
  const [miniLandingPrice, setMiniLandingPrice] = useState(MINI_LANDING_PRICE_FALLBACK);
  const [planInfo, setPlanInfo] = useState(PLAN_INFO_FALLBACK);
  const [monthDiscounts, setMonthDiscounts] = useState(MONTH_DISCOUNTS_FALLBACK);

  // Prorrateo de upgrade
  const [prorationPreview, setProrationPreview] = useState<{
    daysRemaining: number;
    creditAmount: number;
    newPlanTotal: number;
    amountToPay: number;
    newEndDate: string;
    isFree: boolean;
  } | null>(null);
  const [loadingProration, setLoadingProration] = useState(false);
  const [applyingFreeUpgrade, setApplyingFreeUpgrade] = useState(false);

  const plan = selectedPlan;
  const monthDiscount = monthDiscounts.find(d => d.months === selectedMonths) ?? monthDiscounts[0];
  const planTotal = Math.round(planInfo[plan].price * selectedMonths * (1 - monthDiscount.pct / 100));

  // Lógica de precio total:
  // - Si tiene sub activa y NO está cambiando plan ni renovando: solo landing
  // - En cualquier otro caso: plan + landing opcional
  const isUpgrade = hasActiveSub && currentPlan !== null && selectedPlan !== currentPlan && selectedPlan === 'PRO';
  const isDowngrade = hasActiveSub && currentPlan !== null && selectedPlan !== currentPlan && selectedPlan === 'BASIC';
  const isRenewal = hasActiveSub && selectedPlan === currentPlan;

  // En upgrade: el monto a pagar viene del prorrateo, no del precio normal
  const effectivePlanTotal = isUpgrade && prorationPreview ? prorationPreview.amountToPay : planTotal;
  const totalPrice = effectivePlanTotal + (includeLanding ? miniLandingPrice : 0);

  useEffect(() => {
    subscriptionService.getSubscriptionInfo().then((info) => {
      const p = info.brand.plan as PlanType;
      const status = (info.brand as any).subscriptionStatus ?? (info.brand as any).subscription_status;
      const inTrial = info.isInTrial ?? false;
      const activeSub = !inTrial && (status === 'active' || status === 'expiring_soon');

      setCurrentPlan(p);
      setIsInTrial(inTrial);
      setHasActiveSub(activeSub);
      setHasLandingPage((info.brand as any).has_landing_page ?? false);
      setDaysRemaining(info.daysRemaining ?? null);
      // Pre-seleccionar el plan actual si viene sin param
      if (!searchParams.get('plan') && p in PLAN_INFO_FALLBACK) {
        setSelectedPlan(p as PlanType);
      }
      setLoadingInfo(false);
    }).catch(() => setLoadingInfo(false));

    api.get(`/payments/wompi/config?plan=${plan}`)
      .then(() => setWompiEnabled(true))
      .catch(() => setWompiEnabled(false));

    Promise.all([
      fetch(`${process.env.NEXT_PUBLIC_API_URL || 'https://api.pruebalo.wilkiedevs.com'}/api/payment-settings/public`)
        .then(r => r.ok ? r.json() : null),
      fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/pricing_config?select=id,config`, {
        headers: {
          apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
          Authorization: `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!}`,
        },
      }).then(r => r.ok ? r.json() : null),
    ]).then(([paySettings, pricingRows]) => {
      if (paySettings?.landingPrice) setMiniLandingPrice(paySettings.landingPrice);
      if (Array.isArray(pricingRows)) {
        const basic = pricingRows.find((r: any) => r.id === 'basic')?.config;
        const pro   = pricingRows.find((r: any) => r.id === 'pro')?.config;
        const desc  = pricingRows.find((r: any) => r.id === 'descuentos_duracion')?.config;
        if (basic?.precio_mensual_cop || pro?.precio_mensual_cop) {
          setPlanInfo(prev => ({
            BASIC: { ...prev.BASIC, price: basic?.precio_mensual_cop ?? prev.BASIC.price },
            PRO:   { ...prev.PRO,   price: pro?.precio_mensual_cop   ?? prev.PRO.price },
          }));
        }
        if (desc) {
          setMonthDiscounts([
            { months: 1,  pct: desc.meses_1  ?? 0,  label: '1 mes' },
            { months: 3,  pct: desc.meses_3  ?? 5,  label: '3 meses' },
            { months: 6,  pct: desc.meses_6  ?? 10, label: '6 meses' },
            { months: 12, pct: desc.meses_12 ?? 15, label: '12 meses' },
          ]);
        }
      }
    }).catch(() => {});
  }, []);

  // Calcular prorrateo cuando es upgrade
  useEffect(() => {
    if (!isUpgrade || loadingInfo) {
      setProrationPreview(null);
      return;
    }
    setLoadingProration(true);
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://api.pruebalo.wilkiedevs.com';
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    // currentPlanPriceTotal: estimamos el precio que pagó basado en el plan actual y meses
    // Usamos el precio mensual del plan actual × 30 días × daysRemaining como proxy
    // El backend lo calcula con las fechas reales de la BD
    const newPlanPricePerMonth = planInfo['PRO'].price;
    const currentPlanPriceTotal = Math.round(planInfo['BASIC'].price * 12); // worst case: 12 meses

    fetch(
      `${apiUrl}/api/payments/wompi/upgrade-preview?newPlan=PRO&newMonths=${selectedMonths}&newPlanPricePerMonth=${newPlanPricePerMonth}&currentPlanPriceTotal=${currentPlanPriceTotal}`,
      { headers: { Authorization: `Bearer ${token}` } }
    )
      .then(r => r.ok ? r.json() : null)
      .then(data => { if (data) setProrationPreview(data); })
      .catch(() => {})
      .finally(() => setLoadingProration(false));
  }, [isUpgrade, selectedMonths, loadingInfo, planInfo]);

  const handleFreeUpgrade = async () => {
    if (!prorationPreview || !prorationPreview.isFree) return;
    setApplyingFreeUpgrade(true);
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://api.pruebalo.wilkiedevs.com';
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    try {
      const res = await fetch(`${apiUrl}/api/payments/wompi/apply-free-upgrade`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          newPlan: 'PRO',
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
                <span style={{ color: 'var(--text-primary)' }}>{formatCurrency(prorationPreview.newPlanTotal)}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span style={{ color: 'var(--text-muted)' }}>
                  Crédito por {prorationPreview.daysRemaining} días restantes del Plan Básico
                </span>
                <span className="font-medium" style={{ color: '#10b981' }}>− {formatCurrency(prorationPreview.creditAmount)}</span>
              </div>
              <div className="flex items-center justify-between pt-2 border-t font-semibold" style={{ borderColor: 'rgba(99,102,241,0.2)' }}>
                <span style={{ color: 'var(--text-primary)' }}>Total a pagar</span>
                <span style={{ color: prorationPreview.isFree ? '#10b981' : '#6366f1', fontSize: '1.1rem' }}>
                  {prorationPreview.isFree ? 'Sin costo adicional' : formatCurrency(prorationPreview.amountToPay)}
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
                  {formatCurrency(info.price)}
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
                − {formatCurrency(Math.round(planInfo[plan].price * selectedMonths * (monthDiscount.pct / 100)))}
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
              <p className="font-medium" style={{ color: 'var(--text-primary)' }}>{planInfo[plan].name}</p>
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                {selectedMonths === 1
                  ? '1 mes (30 días)'
                  : `${selectedMonths} meses${monthDiscount.pct > 0 ? ` · ${monthDiscount.pct}% descuento` : ''}`}
              </p>
            </div>
            <p className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>{formatCurrency(planTotal)}</p>
          </div>

          <ul className="space-y-2 pt-2 border-t" style={{ borderColor: 'var(--border-color)' }}>
            {planInfo[plan].features.map((f) => (
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
                    <span className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>{formatCurrency(miniLandingPrice)}</span>
                  </div>
                  <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                    Página pública en pruebalo.wilkiedevs.com/tu-marca con hero, galería, probador virtual y contacto.
                  </p>
                </div>
              </label>
            </div>
          )}

          <div className="pt-3 border-t space-y-2" style={{ borderColor: 'var(--border-color)' }}>
            {includeLanding && (
              <div className="flex items-center justify-between text-sm" style={{ color: 'var(--text-muted)' }}>
                <span>Mini-landing (pago único)</span>
                <span>{formatCurrency(miniLandingPrice)}</span>
              </div>
            )}
            {isUpgrade && prorationPreview && (
              <div className="flex items-center justify-between text-sm" style={{ color: '#10b981' }}>
                <span>Crédito plan actual ({prorationPreview.daysRemaining} días)</span>
                <span>− {formatCurrency(prorationPreview.creditAmount)}</span>
              </div>
            )}
            <div className="flex items-center justify-between">
              <p className="font-semibold" style={{ color: 'var(--text-primary)' }}>Total a pagar</p>
              <p className="text-xl font-bold" style={{ color: '#FF5C3A' }}>{formatCurrency(totalPrice)}</p>
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
          plan={plan}
          months={selectedMonths}
          amount={totalPrice}
          onSuccess={handleSuccess}
          onError={handleError}
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
  plan,
  months,
  amount,
  onSuccess,
  onError,
}: {
  wompiEnabled: boolean | null;
  plan: PlanType;
  months: number;
  amount: number;
  onSuccess: (r: WompiWidgetResult) => void;
  onError: (msg: string) => void;
}) {
  return (
    <div className="rounded-2xl border px-6 py-5 space-y-4" style={{ background: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
      <div className="flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
        <CreditCard className="w-5 h-5" style={{ color: '#FF5C3A' }} />
        <h2 className="font-semibold">Método de pago</h2>
      </div>

      {wompiEnabled === null && (
        <div className="flex items-center gap-2 text-sm" style={{ color: 'var(--text-muted)' }}>
          <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
          </svg>
          Verificando disponibilidad...
        </div>
      )}

      {wompiEnabled === true && (
        <>
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
            Paga de forma segura con tarjeta de crédito, débito, PSE o Nequi a través de Wompi.
          </p>
          <WompiButton
            plan={plan}
            months={months}
            amount={amount}
            onSuccess={onSuccess}
            onError={onError}
            className="w-full py-3 min-h-[44px] rounded-xl text-white font-semibold text-sm disabled:opacity-50 disabled:cursor-not-allowed transition-opacity flex items-center justify-center gap-2"
            style={{ background: '#FF5C3A' }}
          >
            <CreditCard className="w-4 h-4" />
            Pagar {formatCurrency(amount)} con Wompi
          </WompiButton>
        </>
      )}

      {wompiEnabled === false && (
        <div className="space-y-3">
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
            El pago en línea no está disponible en este momento. Contáctanos para completar tu suscripción.
          </p>
          <div className="flex flex-wrap gap-3">
            <a
              href="mailto:info@pruebalo.wilkiedevs.com"
              className="flex items-center gap-2 px-4 py-2.5 min-h-[44px] rounded-xl border text-sm transition-colors hover:opacity-80"
              style={{ borderColor: 'var(--border-color)', color: 'var(--text-secondary)' }}
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="2" y="4" width="20" height="16" rx="2" />
                <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
              </svg>
              info@pruebalo.wilkiedevs.com
            </a>
            <a
              href="https://wa.me/573105436281"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-4 py-2.5 min-h-[44px] rounded-xl border text-sm transition-colors hover:opacity-80"
              style={{ borderColor: 'var(--border-color)', color: 'var(--text-secondary)' }}
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
                <path d="M12 0C5.373 0 0 5.373 0 12c0 2.127.558 4.126 1.533 5.858L.057 23.428a.5.5 0 0 0 .609.61l5.699-1.48A11.95 11.95 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0z" />
              </svg>
              WhatsApp
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
