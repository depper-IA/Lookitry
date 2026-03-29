'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  CheckCircle, XCircle, CreditCard, ShieldCheck, ArrowLeft,
  Globe, ArrowUpCircle, RefreshCw, Zap, Star, Check,
} from 'lucide-react';
import WompiButton from '@/components/payments/WompiButton';
import { subscriptionService } from '@/services/subscription.service';
import { brandsService } from '@/services/brands.service';
import { api } from '@/services/api';
import { formatCurrency, formatPrice } from '@/utils/currency';
import { Spinner } from '@/components/ui/Spinner';
import type { PlanType } from '@/types';
import type { WompiWidgetResult } from '@/types/wompi';

type CheckoutPlan = Exclude<PlanType, 'ENTERPRISE'>;

// ── Fallbacks (solo si la API falla) ─────────────────────────────────────────

const PLAN_INFO_FALLBACK: Record<PlanType, { name: string; price: number; features: string[] }> = {
  BASIC: {
    name: 'Plan Básico',
    price: 150000,
    features: [
      'Hasta 5 productos activos',
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
      'Hasta 15 productos activos',
      '1.200 generaciones por mes',
      'Branding avanzado y personalización completa',
      'Modificación del slug del probador',
      'Soporte prioritario',
      'Integración con sistemas externos',
    ],
  },
  ENTERPRISE: {
    name: 'Plan Enterprise',
    price: 0,
    features: [
      'Catalogo y operaciones a medida',
      'Integraciones avanzadas',
      'Acompanamiento tecnico prioritario',
      'Infraestructura y limites personalizados',
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

function formatPaypalUsd(amountCop: number, trm: number): string {
  const safeTrm = trm > 0 ? trm : 3900;
  return String(Math.ceil(amountCop / safeTrm));
}

type CheckoutState = 'idle' | 'verifying' | 'success' | 'error';

// ── Sub-componente: sección de pago ──────────────────────────────────────────

function PaymentSection({
  wompiEnabled, paypalEnabled, plan, months, amount, includesLanding,
  trm, redirecting, onSuccess, onError, onPaypal,
  paymentMethod, setPaymentMethod, currency, supportEmail,
}: {
  wompiEnabled: boolean | null;
  paypalEnabled: boolean;
  plan: CheckoutPlan;
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
  supportEmail: string;
}) {
  return (
    <div
      className="rounded-2xl border overflow-hidden"
      style={{ background: 'var(--bg-card)', borderColor: 'var(--border-color)' }}
    >
      <div className="px-5 py-4 border-b flex items-center gap-2" style={{ borderColor: 'var(--border-color)' }}>
        <CreditCard className="w-4 h-4" style={{ color: '#FF5C3A' }} />
        <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Método de pago</p>
      </div>

      <div className="px-5 py-4 space-y-4">
        {/* Selector de método */}
        <div className="grid grid-cols-2 gap-2">
          {currency === 'COP' && (
            <button
              onClick={() => setPaymentMethod('wompi')}
              className="flex items-center gap-3 px-4 py-3 rounded-xl border-2 transition-all cursor-pointer"
              style={{
                borderColor: paymentMethod === 'wompi' ? '#FF5C3A' : 'var(--border-color)',
                background:  paymentMethod === 'wompi' ? 'rgba(255,92,58,0.07)' : 'transparent',
              }}
            >
              <CreditCard
                className="w-4 h-4 flex-shrink-0"
                style={{ color: paymentMethod === 'wompi' ? '#FF5C3A' : 'var(--text-muted)' }}
              />
              <div className="text-left">
                <p
                  className="text-xs font-semibold leading-tight"
                  style={{ color: paymentMethod === 'wompi' ? '#FF5C3A' : 'var(--text-primary)' }}
                >
                  Wompi
                </p>
                <p className="text-[10px] leading-tight mt-0.5" style={{ color: 'var(--text-muted)' }}>
                  Tarjeta · PSE · Nequi
                </p>
              </div>
            </button>
          )}
          {paypalEnabled && (
            <button
              onClick={() => setPaymentMethod('paypal')}
              className="flex items-center gap-3 px-4 py-3 rounded-xl border-2 transition-all cursor-pointer"
              style={{
                borderColor: paymentMethod === 'paypal' ? '#0070ba' : 'var(--border-color)',
                background:  paymentMethod === 'paypal' ? 'rgba(0,112,186,0.07)' : 'transparent',
              }}
            >
              <Globe
                className="w-4 h-4 flex-shrink-0"
                style={{ color: paymentMethod === 'paypal' ? '#0070ba' : 'var(--text-muted)' }}
              />
              <div className="text-left">
                <p
                  className="text-xs font-semibold leading-tight"
                  style={{ color: paymentMethod === 'paypal' ? '#0070ba' : 'var(--text-primary)' }}
                >
                  PayPal
                </p>
                <p className="text-[10px] leading-tight mt-0.5" style={{ color: 'var(--text-muted)' }}>
                  Internacional · USD
                </p>
              </div>
            </button>
          )}
        </div>

        {/* Wompi */}
        {paymentMethod === 'wompi' && (
          <>
            {wompiEnabled === null && (
              <div className="flex items-center gap-2 text-sm" style={{ color: 'var(--text-muted)' }}>
                <div
                  className="w-4 h-4 rounded-full border-2 animate-spin"
                  style={{ borderColor: '#FF5C3A', borderTopColor: 'transparent' }}
                />
                Verificando Wompi...
              </div>
            )}
            {wompiEnabled === true && (
              <>
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                  Paga de forma segura en COP con tarjeta, PSE o Nequi a través de Wompi.
                </p>
                <WompiButton
                  plan={plan}
                  months={months}
                  amount={amount}
                  includesLanding={includesLanding}
                  onSuccess={onSuccess}
                  onError={onError}
                  className="w-full py-3 min-h-[44px] rounded-xl text-white font-semibold text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90 cursor-pointer flex items-center justify-center gap-2"
                  style={{ background: '#FF5C3A' }}
                >
                  <CreditCard className="w-4 h-4" />
                  Pagar {formatCurrency(amount)} COP con Wompi
                </WompiButton>
              </>
            )}
            {wompiEnabled === false && (
              <div className="space-y-3">
                <p className="text-xs text-red-400">Wompi no está disponible temporalmente.</p>
                <a
                  href={`mailto:${supportEmail}`}
                  className="flex items-center justify-center gap-2 w-full px-4 py-2.5 min-h-[44px] rounded-xl border text-sm hover:opacity-80 cursor-pointer"
                  style={{ borderColor: 'var(--border-color)', color: 'var(--text-secondary)' }}
                >
                  Contactar soporte
                </a>
              </div>
            )}
          </>
        )}

        {/* PayPal */}
        {paymentMethod === 'paypal' && (
          <>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
              Paga con PayPal. El total se convertirá a USD usando la TRM (${trm} COP).
            </p>
            <button
              onClick={onPaypal}
              disabled={redirecting}
              className="w-full py-3 min-h-[44px] rounded-xl text-white font-semibold text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90 cursor-pointer flex items-center justify-center gap-2"
              style={{ background: '#0070ba' }}
            >
              {redirecting ? (
                <div
                  className="w-4 h-4 rounded-full border-2 animate-spin"
                  style={{ borderColor: 'white', borderTopColor: 'transparent' }}
                />
              ) : (
                <Globe className="w-4 h-4" />
              )}
              Pagar USD ${formatPaypalUsd(amount, trm)} con PayPal
            </button>
          </>
        )}
      </div>
    </div>
  );
}

// ── Componente principal ──────────────────────────────────────────────────────

function CheckoutContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const planParam = (searchParams.get('plan') ?? 'BASIC').toUpperCase();
  const initialPlan: CheckoutPlan = planParam === 'PRO' ? 'PRO' : 'BASIC';

  const [selectedPlan, setSelectedPlan] = useState<CheckoutPlan>(initialPlan);
  const [selectedMonths, setSelectedMonths] = useState(1);
  const [state, setState] = useState<CheckoutState>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  // Estado de la cuenta
  const [currentPlan, setCurrentPlan] = useState<PlanType | null>(null);
  const [hasActiveSub, setHasActiveSub] = useState(false);
  const [hasLandingPage, setHasLandingPage] = useState(false);
  const [daysRemaining, setDaysRemaining] = useState<number | null>(null);
  const [loadingInfo, setLoadingInfo] = useState(true);
  const [isOperationalTrial, setIsOperationalTrial] = useState(false);
  const [trialViewTracked, setTrialViewTracked] = useState(false);

  // Pagos
  const [paymentMethod, setPaymentMethod] = useState<'wompi' | 'paypal'>('wompi');
  const [currency, setCurrency] = useState<'COP' | 'USD'>('COP');
  const [wompiEnabled, setWompiEnabled] = useState<boolean | null>(null);
  const [paypalEnabled, setPaypalEnabled] = useState<boolean>(true);
  const [trm, setTrm] = useState(3900);
  const [redirecting, setRedirecting] = useState(false);
  const [supportEmail, setSupportEmail] = useState('info@lookitry.com');

  const [includeLanding, setIncludeLanding] = useState(false);
  const [miniLandingPrice, setMiniLandingPrice] = useState(MINI_LANDING_PRICE_FALLBACK);

  // Datos dinámicos de planes (desde pricing_config en Supabase)
  const [planInfo, setPlanInfo] = useState(PLAN_INFO_FALLBACK);
  const [monthDiscounts, setMonthDiscounts] = useState(MONTH_DISCOUNTS_FALLBACK);
  const [pricingLoaded, setPricingLoaded] = useState(false);

  // Prorrateo
  const [prorationPreview, setProrationPreview] = useState<{
    basePlanTotal: number;
    creditAmount: number;
    amountToPay: number;
    newPlanTotal: number;
    daysRemaining: number;
    isFree: boolean;
    newEndDate: string;
    creditLabel: string;
  } | null>(null);
  const [loadingProration, setLoadingProration] = useState(false);
  const [applyingFreeUpgrade, setApplyingFreeUpgrade] = useState(false);

  // Lógica de suscripción
  const isUpgrade   = hasActiveSub && currentPlan?.toUpperCase() === 'BASIC' && selectedPlan.toUpperCase() === 'PRO';
  const isDowngrade = hasActiveSub && currentPlan?.toUpperCase() === 'PRO'   && selectedPlan.toUpperCase() === 'BASIC';
  const isRenewal   = hasActiveSub && currentPlan?.toUpperCase() === selectedPlan.toUpperCase();

  const monthDiscount = monthDiscounts.find(d => d.months === selectedMonths) ?? monthDiscounts[0];
  const planTotal  = Math.round(planInfo[selectedPlan].price * selectedMonths * (1 - monthDiscount.pct / 100));

  // Cálculo del total final: 
  // 1. Si es Upgrade, usar el prorrateo (crédito).
  // 2. Si es Renovación o Downgrade diferido, cobrar el monto completo.
  const totalPrice = isUpgrade && prorationPreview
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

  // Carga inicial: suscripción + precios dinámicos (una sola vez)
  useEffect(() => {
    subscriptionService.getSubscriptionInfo().then((info) => {
      if (info) {
        setCurrentPlan(info.plan === 'PRO' ? 'PRO' : info.plan === 'BASIC' ? 'BASIC' : null);
        setHasActiveSub(info.status === 'active' || info.status === 'expiring_soon');
        setHasLandingPage(info.hasLandingPage);
        setDaysRemaining(info.daysRemaining);
        setIsOperationalTrial(Boolean((info as any).isInTrial));
      }
      setLoadingInfo(false);
    });

    const supabaseUrl  = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    const apiUrl       = process.env.NEXT_PUBLIC_API_URL || 'https://api.lookitry.com';

    Promise.all([
      fetch(`${apiUrl}/api/payment-settings/public`).then(r => r.ok ? r.json() : null),
      fetch(`${supabaseUrl}/rest/v1/pricing_config?select=id,data`, {
        headers: {
          apikey: supabaseAnon!,
          Authorization: `Bearer ${supabaseAnon!}`,
        },
      }).then(r => r.ok ? r.json() : null),
    ]).then(([paySettings, pricingRows]) => {
      if (paySettings) {
        if (paySettings.landingPrice)                       setMiniLandingPrice(paySettings.landingPrice);
        if (paySettings.trm)                                setTrm(paySettings.trm);
        if (typeof paySettings.paypalEnabled === 'boolean') setPaypalEnabled(paySettings.paypalEnabled);
        if (paySettings.manualEmail)                        setSupportEmail(paySettings.manualEmail);
        // Si Wompi está habilitado globalmente, lo habilitamos por defecto en el estado local
        if (typeof paySettings.wompiEnabled === 'boolean')  setWompiEnabled(paySettings.wompiEnabled);

        // UX/Conversión: si Wompi no está disponible, forzar PayPal (si está disponible)
        if (paySettings.wompiEnabled === false && paySettings.paypalEnabled === true) {
          setPaymentMethod('paypal');
        }
      }
      if (Array.isArray(pricingRows)) {
        const basicData = pricingRows.find((r: any) => r.id === 'basic')?.data;
        const proData   = pricingRows.find((r: any) => r.id === 'pro')?.data;
        const descData  = pricingRows.find((r: any) => r.id === 'descuentos_duracion')?.data;

        setPlanInfo({
          BASIC: {
            name:     basicData?.nombre            ?? PLAN_INFO_FALLBACK.BASIC.name,
            price:    basicData?.precio_mensual_cop ?? PLAN_INFO_FALLBACK.BASIC.price,
            features: basicData?.features          ?? PLAN_INFO_FALLBACK.BASIC.features,
          },
          PRO: {
            name:     proData?.nombre              ?? PLAN_INFO_FALLBACK.PRO.name,
            price:    proData?.precio_mensual_cop   ?? PLAN_INFO_FALLBACK.PRO.price,
            features: proData?.features            ?? PLAN_INFO_FALLBACK.PRO.features,
          },
          ENTERPRISE: PLAN_INFO_FALLBACK.ENTERPRISE,
        });

        if (descData) {
          setMonthDiscounts([
            { months: 1,  pct: descData.meses_1  ?? 0,  label: '1 mes' },
            { months: 3,  pct: descData.meses_3  ?? 5,  label: '3 meses' },
            { months: 6,  pct: descData.meses_6  ?? 10, label: '6 meses' },
            { months: 12, pct: descData.meses_12 ?? 15, label: '12 meses' },
          ]);
        }
      }
      setPricingLoaded(true);
    }).catch(err => {
      console.error('[Checkout] Error cargando precios:', err);
      setPricingLoaded(true); // mostrar fallback si falla
    });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Re-verificar Wompi al cambiar de plan
  useEffect(() => {
    setWompiEnabled(null);
    api.get(`/payments/wompi/config?plan=${selectedPlan}`)
      .then(() => setWompiEnabled(true))
      .catch(() => setWompiEnabled(false));
  }, [selectedPlan]);

  // Si Wompi queda deshabilitado y PayPal está habilitado, mover método para evitar bloqueo
  useEffect(() => {
    if (wompiEnabled === false && paypalEnabled) {
      setPaymentMethod('paypal');
    }
  }, [wompiEnabled, paypalEnabled]);

  // Moneda desde localStorage
  useEffect(() => {
    const saved = localStorage.getItem('currency') as 'COP' | 'USD';
    if (saved) { setCurrency(saved); if (saved === 'USD') setPaymentMethod('paypal'); }
    const handler = () => {
      const cur = localStorage.getItem('currency') as 'COP' | 'USD';
      if (cur) { setCurrency(cur); if (cur === 'USD') setPaymentMethod('paypal'); }
    };
    window.addEventListener('currencyChange', handler);
    return () => window.removeEventListener('currencyChange', handler);
  }, []);

  useEffect(() => {
    if (!isOperationalTrial || trialViewTracked) return;
    brandsService.createTrialEvent('checkout_viewed', {
      selectedPlan,
      selectedMonths,
    }).catch(() => {});
    setTrialViewTracked(true);
  }, [isOperationalTrial, trialViewTracked, selectedPlan, selectedMonths]);

  // Calcular prorrateo cuando hay cambio de plan (SOLO UPGRADES)
  useEffect(() => {
    if (!isUpgrade || loadingInfo) { setProrationPreview(null); return; }
    setLoadingProration(true);
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://api.lookitry.com';
    const token  = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    const currentPlanPriceFallback = planInfo[currentPlan as PlanType].price; // Precio mensual base
    fetch(
      `${apiUrl}/api/payments/wompi/upgrade-preview?newPlan=${selectedPlan}&newMonths=${selectedMonths}&newPlanTotal=${planTotal}&currentPlanPriceTotalFallback=${currentPlanPriceFallback}`,
      {
        credentials: 'include',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      }
    )
      .then(r => r.ok ? r.json() : null)
      .then(data => { if (data) setProrationPreview(data); })
      .catch(() => {})
      .finally(() => setLoadingProration(false));
  }, [isUpgrade, selectedMonths, loadingInfo, planInfo, selectedPlan, currentPlan, planTotal]);

  const handleFreeUpgrade = async () => {
    if (!prorationPreview?.isFree) return;
    setApplyingFreeUpgrade(true);
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://api.lookitry.com';
    const token  = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    try {
      const res = await fetch(`${apiUrl}/api/payments/wompi/apply-free-upgrade`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          newPlan: selectedPlan, newMonths: selectedMonths,
          creditAmount: prorationPreview.creditAmount, newPlanTotal: prorationPreview.newPlanTotal,
          forcedEndDate: prorationPreview.newEndDate // Enviamos la fecha con días extra
        }),
      });
      if (res.ok) { setState('success'); }
      else { const e = await res.json(); setErrorMsg(e.error || 'Error al aplicar el cambio'); setState('error'); }
    } catch { setErrorMsg('Error de conexión'); setState('error'); }
    finally { setApplyingFreeUpgrade(false); }
  };

  const handleSuccess = (result: WompiWidgetResult) => {
    console.log('[Wompi] Pago aprobado:', result.transaction.id);
    setErrorMsg('');
    setState('verifying');
  };
  const handleError = (msg: string) => {
    const normalized = msg.toLowerCase();
    if (
      normalized.includes('verificando tu pago') ||
      normalized.includes('widget de wompi') ||
      normalized.includes('wompi no está disponible') ||
      normalized.includes('wompi no esta disponible')
    ) {
      setErrorMsg('Estamos verificando tu pago. Si la transacción ya fue aprobada, tu plan se actualizará automáticamente.');
      setState('verifying');
      return;
    }
    setErrorMsg(msg);
    setState('error');
  };

  useEffect(() => {
    if (state !== 'verifying') return;

    let cancelled = false;
    let attempts = 0;
    const expectedPlan = selectedPlan;

    const verify = async () => {
      attempts += 1;
      try {
        const info = await subscriptionService.getSubscriptionInfo();
        const hasPlanUpdated = info.plan === expectedPlan && (info.status === 'active' || info.status === 'expiring_soon');
        if (!cancelled && hasPlanUpdated) {
          setState('success');
          return;
        }
      } catch (error) {
        console.error('[Checkout] Error verificando suscripción:', error);
      }

      if (!cancelled && attempts >= 6) {
        setErrorMsg('Tu pago quedó en verificación. Si ya fue aprobado, la actualización aparecerá en tu suscripción en pocos minutos.');
        setState('error');
      }
    };

    verify();
    const interval = window.setInterval(verify, 3500);

    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, [state, selectedPlan]);

  // ── Spinner de carga ──────────────────────────────────────────────────────
  if (loadingInfo || !pricingLoaded) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="flex flex-col items-center gap-4">
          <Spinner size="lg" />
          <span className="text-sm" style={{ color: 'var(--text-muted)' }}>Cargando información...</span>
        </div>
      </div>
    );
  }

  // ── Estado: pago exitoso ──────────────────────────────────────────────────
  if (state === 'success') {
    return (
      <div className="max-w-md mx-auto py-20 text-center space-y-6">
        <div className="flex justify-center">
          <div
            className="w-20 h-20 rounded-full flex items-center justify-center"
            style={{ background: 'rgba(16,185,129,0.1)' }}
          >
            <CheckCircle className="w-10 h-10 text-emerald-500" />
          </div>
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>Pago recibido</h2>
          <p className="text-sm leading-relaxed" style={{ color: 'var(--text-muted)' }}>
            Tu pago fue aprobado. Tu suscripción se actualizará automáticamente en los próximos minutos.
          </p>
        </div>
        <button
          onClick={() => router.push('/dashboard/subscription')}
          className="px-8 py-3 min-h-[44px] rounded-xl text-white text-sm font-semibold hover:opacity-90 cursor-pointer"
          style={{ background: '#FF5C3A' }}
        >
          Ver mi suscripción
        </button>
      </div>
    );
  }

  if (state === 'verifying') {
    return (
      <div className="max-w-md mx-auto py-20 text-center space-y-6">
        <div className="flex justify-center">
          <div
            className="w-20 h-20 rounded-full flex items-center justify-center"
            style={{ background: 'rgba(99,102,241,0.1)' }}
          >
            <div
              className="w-10 h-10 rounded-full border-4 animate-spin"
              style={{ borderColor: '#6366f1', borderTopColor: 'transparent' }}
            />
          </div>
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>Verificando tu pago</h2>
          <p className="text-sm leading-relaxed" style={{ color: 'var(--text-muted)' }}>
            {errorMsg || 'Estamos confirmando la transacción con la pasarela. Si el cobro ya fue aprobado, tu plan se actualizará automáticamente.'}
          </p>
        </div>
        <button
          onClick={() => router.push('/dashboard/subscription')}
          className="px-8 py-3 min-h-[44px] rounded-xl text-white text-sm font-semibold hover:opacity-90 cursor-pointer"
          style={{ background: '#6366f1' }}
        >
          Ir a mi suscripción
        </button>
      </div>
    );
  }

  // ── Estado: error ─────────────────────────────────────────────────────────
  if (state === 'error') {
    return (
      <div className="max-w-md mx-auto py-20 text-center space-y-6">
        <div className="flex justify-center">
          <div
            className="w-20 h-20 rounded-full flex items-center justify-center"
            style={{ background: 'rgba(239,68,68,0.1)' }}
          >
            <XCircle className="w-10 h-10 text-red-500" />
          </div>
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>Pago no completado</h2>
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>{errorMsg}</p>
        </div>
        <div className="flex gap-3 justify-center">
          <button
            onClick={() => { setState('idle'); setErrorMsg(''); }}
            className="px-5 py-2.5 min-h-[44px] rounded-xl border text-sm hover:opacity-80 cursor-pointer"
            style={{ borderColor: 'var(--border-color)', color: 'var(--text-secondary)' }}
          >
            Intentar de nuevo
          </button>
          <button
            onClick={() => router.push('/dashboard/subscription')}
            className="px-5 py-2.5 min-h-[44px] rounded-xl text-white text-sm font-semibold hover:opacity-90 cursor-pointer"
            style={{ background: '#FF5C3A' }}
          >
            Volver a suscripción
          </button>
        </div>
      </div>
    );
  }

  // ── Helpers ───────────────────────────────────────────────────────────────
  const actionLabel = !hasActiveSub ? 'Activar suscripción'
    : isUpgrade   ? 'Upgrade a Plan Pro'
    : isDowngrade ? 'Cambiar a Plan Básico'
    : 'Renovar plan';

  const savingsAmount = monthDiscount.pct > 0
    ? Math.ceil(planInfo[selectedPlan].price * selectedMonths * (monthDiscount.pct / 100))
    : 0;

  // Badge del plan activo para el header
  const currentPlanBadge = currentPlan ? (
    <span
      className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full"
      style={{
        background: currentPlan === 'PRO' ? 'rgba(255,92,58,0.12)' : 'rgba(99,102,241,0.12)',
        color:      currentPlan === 'PRO' ? '#FF5C3A'              : '#6366f1',
        border:     `1px solid ${currentPlan === 'PRO' ? 'rgba(255,92,58,0.25)' : 'rgba(99,102,241,0.25)'}`,
      }}
    >
      <span
        className="w-1.5 h-1.5 rounded-full inline-block"
        style={{ background: currentPlan === 'PRO' ? '#FF5C3A' : '#6366f1' }}
      />
      {planInfo[currentPlan].name} activo
      {daysRemaining != null && (
        <span className="font-normal opacity-70">&nbsp;· {daysRemaining}d</span>
      )}
    </span>
  ) : null;

  // ── Render principal ──────────────────────────────────────────────────────
  return (
    <div className="max-w-5xl mx-auto pb-12">

      {/* Encabezado con plan activo */}
      <div className="flex items-start gap-3 mb-8">
        <button
          onClick={() => router.back()}
          className="p-2 rounded-lg hover:opacity-80 cursor-pointer mt-0.5"
          style={{ color: 'var(--text-muted)', background: 'var(--bg-hover)' }}
          aria-label="Volver"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 flex-wrap">
            <h1
              className="text-xl font-bold"
              style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-jakarta)' }}
            >
              {actionLabel}
            </h1>
            {currentPlanBadge}
          </div>
          <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
            {!hasActiveSub
              ? 'Elige tu plan para continuar después del período de prueba'
              : isUpgrade
              ? 'Tu crédito se calcula según el valor real restante de tu ciclo actual'
              : isDowngrade
              ? 'El cambio aplica al próximo período de facturación'
              : 'Los nuevos meses se suman a tu fecha de vencimiento actual'}
          </p>
        </div>
      </div>

      {/* Layout dos columnas */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-6 items-start">

        {/* ── Columna izquierda ── */}
        <div className="space-y-5">

          {/* Banner plan activo (renovación / downgrade) */}
          {hasActiveSub && !isUpgrade && (
            <div
              className="rounded-2xl border px-5 py-4 flex items-center gap-3"
              style={{ background: 'rgba(16,185,129,0.05)', borderColor: 'rgba(16,185,129,0.2)' }}
            >
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                style={{ background: 'rgba(16,185,129,0.15)' }}
              >
                <RefreshCw className="w-4 h-4 text-emerald-500" />
              </div>
              <div>
                <p className="text-sm font-semibold" style={{ color: '#059669' }}>
                  {planInfo[currentPlan!]?.name ?? ''} activo
                  {daysRemaining != null && (
                    <span className="font-normal ml-1.5" style={{ color: 'var(--text-muted)' }}>
                      · {daysRemaining} días restantes
                    </span>
                  )}
                </p>
                <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                  {isRenewal
                    ? 'Los nuevos meses se suman a tu fecha de vencimiento actual.'
                    : 'El cambio de plan aplica desde el próximo período.'}
                </p>
              </div>
            </div>
          )}

          {/* Banner upgrade */}
          {isUpgrade && (
            <div
              className="rounded-2xl border px-5 py-4 flex items-center gap-3"
              style={{ borderColor: 'rgba(99,102,241,0.3)', background: 'rgba(99,102,241,0.05)' }}
            >
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                style={{ background: 'rgba(99,102,241,0.15)' }}
              >
                <ArrowUpCircle className="w-4 h-4" style={{ color: '#6366f1' }} />
              </div>
              <div>
                <p className="text-sm font-semibold" style={{ color: '#6366f1' }}>
                  Upgrade: {planInfo['BASIC'].name} → {planInfo['PRO'].name}
                </p>
                <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                  Tu crédito restante ({daysRemaining ?? 0} días) se descuenta del total
                </p>
              </div>
            </div>
          )}

          {/* Selector de plan */}
          <div
            className="rounded-2xl border overflow-hidden"
            style={{ background: 'var(--bg-card)', borderColor: 'var(--border-color)' }}
          >
            <div className="px-5 py-4 border-b" style={{ borderColor: 'var(--border-color)' }}>
              <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                {hasActiveSub ? 'Plan a contratar' : 'Selecciona tu plan'}
              </p>
              <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                {hasActiveSub
                  ? 'Selecciona el mismo para renovar, o uno diferente para cambiar'
                  : 'Puedes cambiar antes de pagar'}
              </p>
            </div>
            <div className="p-4 grid grid-cols-2 gap-3">
              {(['BASIC', 'PRO'] as CheckoutPlan[]).map((p) => {
                const info       = planInfo[p];
                const isSelected = selectedPlan === p;
                const isCurrent  = hasActiveSub && p === currentPlan;
                const isPro      = p === 'PRO';
                return (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setSelectedPlan(p)}
                    className="relative text-left rounded-xl border-2 p-4 transition-all cursor-pointer"
                    style={{
                      borderColor: isSelected ? '#FF5C3A' : 'var(--border-color)',
                      background:  isSelected ? 'rgba(255,92,58,0.06)' : 'var(--bg-hover)',
                    }}
                  >
                    {isPro && !isCurrent && (
                      <div
                        className="absolute -top-2.5 left-1/2 -translate-x-1/2 flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold text-white"
                        style={{ background: '#FF5C3A' }}
                      >
                        <Star className="w-2.5 h-2.5" />Popular
                      </div>
                    )}
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <span className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>
                          {info.name}
                        </span>
                        {isCurrent && (
                          <span
                            className="ml-2 text-[10px] px-1.5 py-0.5 rounded font-semibold"
                            style={{ background: 'rgba(255,92,58,0.1)', color: '#FF5C3A' }}
                          >
                            Actual
                          </span>
                        )}
                      </div>
                      <div
                        className="w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-0.5"
                        style={{ borderColor: isSelected ? '#FF5C3A' : 'var(--border-color)' }}
                      >
                        {isSelected && (
                          <div className="w-2 h-2 rounded-full" style={{ background: '#FF5C3A' }} />
                        )}
                      </div>
                    </div>
                    <p
                      className="text-xl font-bold mb-3"
                      style={{ color: isSelected ? '#FF5C3A' : 'var(--text-primary)' }}
                    >
                      {formatPrice(info.price, paymentMethod, trm)}
                      <span className="text-xs font-normal ml-1" style={{ color: 'var(--text-muted)' }}>/mes</span>
                    </p>
                    <ul className="space-y-1.5">
                      {info.features.slice(0, 3).map((f) => (
                        <li key={f} className="flex items-start gap-1.5 text-xs" style={{ color: 'var(--text-muted)' }}>
                          <Check className="w-3 h-3 mt-0.5 flex-shrink-0 text-emerald-500" />{f}
                        </li>
                      ))}
                    </ul>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Selector de meses */}
          <div
            className="rounded-2xl border overflow-hidden"
            style={{ background: 'var(--bg-card)', borderColor: 'var(--border-color)' }}
          >
            <div className="px-5 py-4 border-b" style={{ borderColor: 'var(--border-color)' }}>
              <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                Período de suscripción
              </p>
              <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>Más meses = mayor descuento</p>
            </div>
            <div className="p-4 space-y-3">
              <div className="grid grid-cols-4 gap-2">
                {monthDiscounts.map(d => (
                  <button
                    key={d.months}
                    type="button"
                    onClick={() => setSelectedMonths(d.months)}
                    className="relative py-3.5 rounded-xl border-2 text-center transition-all cursor-pointer"
                    style={{
                      borderColor: selectedMonths === d.months ? '#FF5C3A' : 'var(--border-color)',
                      background:  selectedMonths === d.months ? 'rgba(255,92,58,0.06)' : 'var(--bg-hover)',
                    }}
                  >
                    <span
                      className="block text-base font-bold"
                      style={{ color: selectedMonths === d.months ? '#FF5C3A' : 'var(--text-primary)' }}
                    >
                      {d.months}
                    </span>
                    <span className="block text-[11px]" style={{ color: 'var(--text-muted)' }}>
                      mes{d.months > 1 ? 'es' : ''}
                    </span>
                    {d.pct > 0 && (
                      <span
                        className="absolute -top-2 left-1/2 -translate-x-1/2 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full whitespace-nowrap"
                        style={{ background: '#10b981' }}
                      >
                        -{d.pct}%
                      </span>
                    )}
                  </button>
                ))}
              </div>
              {savingsAmount > 0 && (
                <div
                  className="flex items-center justify-between rounded-xl px-4 py-2.5"
                  style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)' }}
                >
                  <div className="flex items-center gap-2">
                    <Zap className="w-3.5 h-3.5 text-emerald-500" />
                    <span className="text-xs font-medium text-emerald-600">
                      Ahorro con {monthDiscount.pct}% de descuento
                    </span>
                  </div>
                  <span className="text-sm font-bold text-emerald-600">
                    − {formatPrice(savingsAmount, paymentMethod, trm)}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Add-on mini-landing */}
          {!hasLandingPage && (
            <div
              className="rounded-2xl border overflow-hidden"
              style={{ background: 'var(--bg-card)', borderColor: 'var(--border-color)' }}
            >
              <div className="px-5 py-4 border-b" style={{ borderColor: 'var(--border-color)' }}>
                <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Complementos</p>
              </div>
              <div className="p-4">
                <label
                  htmlFor="include-landing"
                  className="flex items-start gap-4 cursor-pointer rounded-xl border-2 p-4 transition-all"
                  style={{
                    borderColor: includeLanding ? '#FF5C3A' : 'var(--border-color)',
                    background:  includeLanding ? 'rgba(255,92,58,0.04)' : 'var(--bg-hover)',
                  }}
                >
                  <div className="relative mt-0.5 flex-shrink-0">
                    <input
                      id="include-landing"
                      type="checkbox"
                      checked={includeLanding}
                      onChange={e => setIncludeLanding(e.target.checked)}
                      className="sr-only"
                    />
                    <div
                      className="w-5 h-5 rounded border-2 flex items-center justify-center transition-colors"
                      style={{
                        backgroundColor: includeLanding ? '#FF5C3A' : 'transparent',
                        borderColor:     includeLanding ? '#FF5C3A' : 'var(--border-color)',
                      }}
                    >
                      {includeLanding && (
                        <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24"
                          stroke="currentColor" strokeWidth={3}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 flex-wrap mb-1">
                      <div className="flex items-center gap-2">
                        <Globe className="w-4 h-4 flex-shrink-0" style={{ color: '#FF5C3A' }} />
                        <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                          Mini-landing personalizada
                        </span>
                        <span
                          className="text-[10px] px-1.5 py-0.5 rounded font-semibold"
                          style={{ background: 'rgba(255,92,58,0.1)', color: '#FF5C3A' }}
                        >
                          Pago único
                        </span>
                      </div>
                      <span className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>
                        {formatPrice(miniLandingPrice, paymentMethod, trm)}
                      </span>
                    </div>
                    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                      Página pública en lookitry.com/tu-marca con hero, galería, probador virtual y contacto.
                    </p>
                  </div>
                </label>
              </div>
            </div>
          )}
        </div>

        {/* ── Columna derecha: resumen + pago ── */}
        <div className="space-y-4 lg:sticky lg:top-6">

          {/* Resumen del pedido */}
          <div
            className="rounded-2xl border overflow-hidden"
            style={{ background: 'var(--bg-card)', borderColor: 'var(--border-color)' }}
          >
            <div className="px-5 py-4 border-b" style={{ borderColor: 'var(--border-color)' }}>
              <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Resumen del pedido</p>
            </div>
            <div className="px-5 py-4 space-y-2.5">

              {/* Features del plan seleccionado */}
              <ul className="space-y-1.5 pb-3 border-b" style={{ borderColor: 'var(--border-color)' }}>
                {planInfo[selectedPlan].features.map((f: string) => (
                  <li key={f} className="flex items-center gap-2 text-xs" style={{ color: 'var(--text-muted)' }}>
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />{f}
                  </li>
                ))}
              </ul>

              {/* Desglose de cambio con prorrateo (SOLO UPGRADES) */}
              {isUpgrade ? (
                loadingProration ? (
                  <div className="flex items-center gap-2 py-2 text-xs" style={{ color: 'var(--text-muted)' }}>
                    <div
                      className="w-3.5 h-3.5 rounded-full border-2 animate-spin"
                      style={{ borderColor: '#FF5C3A', borderTopColor: 'transparent' }}
                    />
                    Calculando prorrateo...
                  </div>
                ) : prorationPreview ? (
                  <div
                    className="space-y-2 rounded-xl p-3"
                    style={{ background: 'rgba(99,102,241,0.05)', border: '1px solid rgba(99,102,241,0.15)' }}
                  >
                    <div className="flex items-center justify-between text-xs" style={{ color: 'var(--text-muted)' }}>
                      <span>
                        {planInfo[selectedPlan].name} · {selectedMonths} {selectedMonths === 1 ? 'mes' : 'meses'}
                      </span>
                      <span>{formatPrice(prorationPreview.basePlanTotal, paymentMethod, trm)}</span>
                    </div>
                    <div
                      className="flex items-center justify-between text-xs font-semibold"
                      style={{ color: '#10b981' }}
                    >
                      <span>{prorationPreview.creditLabel}</span>
                      <span>− {formatPrice(prorationPreview.creditAmount, paymentMethod, trm)}</span>
                    </div>
                    <div
                      className="flex items-center justify-between text-xs font-bold pt-1.5 border-t"
                      style={{
                        borderColor: 'rgba(99,102,241,0.2)',
                        color: prorationPreview.isFree ? '#10b981' : '#6366f1',
                      }}
                    >
                      <span>Subtotal upgrade</span>
                      <span>
                        {prorationPreview.isFree
                          ? 'Sin costo'
                          : formatPrice(prorationPreview.amountToPay, paymentMethod, trm)}
                      </span>
                    </div>
                  </div>
                ) : null
              ) : (
                <div className="flex items-center justify-between text-sm" style={{ color: 'var(--text-muted)' }}>
                  <span>
                    {planInfo[selectedPlan].name} · {selectedMonths} {selectedMonths === 1 ? 'mes' : 'meses'}
                    {monthDiscount.pct > 0 ? ` (−${monthDiscount.pct}%)` : ''}
                  </span>
                  <span>{formatPrice(planTotal, paymentMethod, trm)}</span>
                </div>
              )}

              {/* Landing add-on */}
              {includeLanding && (
                <div className="flex items-center justify-between text-sm" style={{ color: 'var(--text-muted)' }}>
                  <span>Mini-landing (pago único)</span>
                  <span>{formatPrice(miniLandingPrice, paymentMethod, trm)}</span>
                </div>
              )}

              {/* Total */}
              <div
                className="flex items-center justify-between pt-3 border-t"
                style={{ borderColor: 'var(--border-color)' }}
              >
                <span className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>Total a pagar</span>
                <span
                  className="text-2xl font-bold"
                  style={{ color: isUpgrade && prorationPreview?.isFree ? '#10b981' : '#FF5C3A' }}
                >
                  {isUpgrade && prorationPreview?.isFree
                    ? 'Sin costo'
                    : formatPrice(totalPrice, paymentMethod, trm)}
                </span>
              </div>
            </div>
          </div>

          {/* Sección de pago */}
          {isUpgrade && prorationPreview?.isFree ? (
            <div
              className="rounded-2xl border px-5 py-5 space-y-4"
              style={{ background: 'var(--bg-card)', borderColor: 'var(--border-color)' }}
            >
              <div className="flex items-center gap-2">
                <ArrowUpCircle className="w-5 h-5" style={{ color: '#6366f1' }} />
                <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                  Confirmar upgrade
                </p>
              </div>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                Tu crédito cubre el costo completo. No se realizará ningún cobro.
              </p>
              <button
                onClick={handleFreeUpgrade}
                disabled={applyingFreeUpgrade}
                className="w-full py-3 min-h-[44px] rounded-xl text-white font-semibold text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90 cursor-pointer flex items-center justify-center gap-2"
                style={{ background: '#6366f1' }}
              >
                {applyingFreeUpgrade ? (
                  <>
                    <div
                      className="w-4 h-4 rounded-full border-2 animate-spin"
                      style={{ borderColor: 'white', borderTopColor: 'transparent' }}
                    />
                    Aplicando upgrade...
                  </>
                ) : (
                  <><ArrowUpCircle className="w-4 h-4" />Activar Plan Pro sin costo</>
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
          supportEmail={supportEmail}
        />
          )}

          {/* Seguridad */}
          <div className="flex items-center gap-2 text-xs justify-center" style={{ color: 'var(--text-muted)' }}>
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Pagos procesados de forma segura. No almacenamos datos de tu tarjeta.</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Export ────────────────────────────────────────────────────────────────────

export default function CheckoutPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center py-24">
          <div className="flex flex-col items-center gap-4">
            <Spinner size="lg" />
            <span className="text-sm" style={{ color: 'var(--text-muted)' }}>Cargando checkout...</span>
          </div>
        </div>
      }
    >
      <CheckoutContent />
    </Suspense>
  );
}
