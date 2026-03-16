'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { CheckCircle, XCircle, CreditCard, ShieldCheck, ArrowLeft, Globe } from 'lucide-react';
import WompiButton from '@/components/payments/WompiButton';
import { subscriptionService } from '@/services/subscription.service';
import { api } from '@/services/api';
import { formatCurrency } from '@/utils/currency';
import type { PlanType } from '@/types';
import type { WompiWidgetResult } from '@/types/wompi';

// ── Constantes ────────────────────────────────────────────────────────────────

const PLAN_INFO: Record<PlanType, { name: string; price: number; features: string[] }> = {
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

const MINI_LANDING_PRICE = 500000;

// Precio a cobrar según plan actual → plan destino
function getEffectivePrice(targetPlan: PlanType, currentPlan: PlanType | null): number {
  const target = PLAN_INFO[targetPlan].price;
  if (!currentPlan || currentPlan === targetPlan) return target;
  const current = PLAN_INFO[currentPlan]?.price ?? 0;
  return target > current ? target - current : target;
}

type CheckoutState = 'idle' | 'success' | 'error';

// ── Componente principal ──────────────────────────────────────────────────────

export default function CheckoutPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const planParam = (searchParams.get('plan') ?? 'BASIC').toUpperCase() as PlanType;
  const initialPlan: PlanType = planParam in PLAN_INFO ? planParam : 'BASIC';

  // plan es estado local — el usuario puede cambiarlo desde el selector
  const [selectedPlan, setSelectedPlan] = useState<PlanType>(initialPlan);

  const [state, setState] = useState<CheckoutState>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const [currentPlan, setCurrentPlan] = useState<PlanType | null>(null);
  const [isInTrial, setIsInTrial] = useState(false);
  const [wompiEnabled, setWompiEnabled] = useState<boolean | null>(null);
  const [hasLandingPage, setHasLandingPage] = useState(false);
  const [includeLanding, setIncludeLanding] = useState(false);

  const plan = selectedPlan;
  const planInfo = PLAN_INFO[plan];
  const effectivePlanPrice = isInTrial ? planInfo.price : getEffectivePrice(plan, currentPlan);
  const isUpgrade = !isInTrial && currentPlan !== null && currentPlan !== plan && effectivePlanPrice < planInfo.price;
  const totalPrice = effectivePlanPrice + (includeLanding ? MINI_LANDING_PRICE : 0);

  useEffect(() => {
    subscriptionService.getSubscriptionInfo().then((info) => {
      setCurrentPlan(info.brand.plan as PlanType);
      setIsInTrial(info.isInTrial ?? false);
      setHasLandingPage((info.brand as any).has_landing_page ?? false);
    });

    api.get(`/payments/wompi/config?plan=${plan}`)
      .then(() => setWompiEnabled(true))
      .catch(() => setWompiEnabled(false));
  }, [plan]);

  const handleSuccess = (result: WompiWidgetResult) => {
    console.log('[Wompi] Pago aprobado:', result.transaction.id);
    setState('success');
  };

  const handleError = (msg: string) => {
    setErrorMsg(msg);
    setState('error');
  };

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
          onMouseEnter={e => (e.currentTarget.style.opacity = '0.88')}
          onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
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
            className="px-5 py-2.5 min-h-[44px] rounded-xl text-white text-sm font-medium transition-opacity"
            style={{ background: '#FF5C3A' }}
            onMouseEnter={e => (e.currentTarget.style.opacity = '0.88')}
            onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
          >
            Volver a suscripción
          </button>
        </div>
      </div>
    );
  }

  // ── Estado: formulario de checkout ────────────────────────────────────────

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
          <h1 className="text-xl font-bold font-syne" style={{ color: 'var(--text-primary)' }}>Checkout</h1>
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
            {isInTrial
              ? `Activar ${planInfo.name} — desde tu período de prueba`
              : isUpgrade
                ? `Upgrade de ${PLAN_INFO[currentPlan!].name} a ${planInfo.name}`
                : `Activa tu suscripción — ${planInfo.name}`}
          </p>
        </div>
      </div>

      {/* Selector de plan */}
      <div
        className="rounded-2xl border overflow-hidden"
        style={{ background: 'var(--bg-card)', borderColor: 'var(--border-color)' }}
      >
        <div className="px-6 py-4 border-b" style={{ background: 'var(--bg-hover)', borderColor: 'var(--border-color)' }}>
          <h2 className="font-semibold" style={{ color: 'var(--text-primary)' }}>Selecciona tu plan</h2>
          <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>Puedes cambiar de plan antes de pagar</p>
        </div>
        <div className="p-4 grid grid-cols-2 gap-3">
          {(Object.keys(PLAN_INFO) as PlanType[]).map((p) => {
            const info = PLAN_INFO[p];
            const isSelected = selectedPlan === p;
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
                  <span className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>{info.name}</span>
                  <div
                    className="w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0"
                    style={{ borderColor: isSelected ? '#FF5C3A' : 'var(--border-color)' }}
                  >
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

      {/* Resumen del plan */}
      <div
        className="rounded-2xl border overflow-hidden"
        style={{ background: 'var(--bg-card)', borderColor: 'var(--border-color)' }}
      >
        <div className="px-6 py-4 border-b" style={{ background: 'var(--bg-hover)', borderColor: 'var(--border-color)' }}>
          <h2 className="font-semibold" style={{ color: 'var(--text-primary)' }}>Resumen del pedido</h2>
        </div>
        <div className="px-6 py-5 space-y-4">

          {/* Línea del plan */}
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium" style={{ color: 'var(--text-primary)' }}>{planInfo.name}</p>
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Suscripción mensual — 30 días</p>
            </div>
            <p className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>{formatCurrency(planInfo.price)}</p>
          </div>

          <ul className="space-y-2 pt-2 border-t" style={{ borderColor: 'var(--border-color)' }}>
            {planInfo.features.map((f) => (
              <li key={f} className="flex items-center gap-2 text-sm" style={{ color: 'var(--text-secondary)' }}>
                <CheckCircle className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                {f}
              </li>
            ))}
          </ul>

          {/* Add-on: Mini-landing (solo si no la tiene ya) */}
          {!hasLandingPage && (
            <div className="pt-4 border-t" style={{ borderColor: 'var(--border-color)' }}>
              <label className="flex items-start gap-3 cursor-pointer" htmlFor="include-landing">
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
                      borderColor: includeLanding ? '#FF5C3A' : 'var(--border-color)',
                    }}
                  >
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
                      <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                        Mini-landing personalizada
                      </span>
                      <span
                        className="text-xs px-1.5 py-0.5 rounded font-medium"
                        style={{ backgroundColor: 'rgba(255,92,58,0.1)', color: '#FF5C3A' }}
                      >
                        Pago único
                      </span>
                    </div>
                    <span className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>
                      {formatCurrency(MINI_LANDING_PRICE)}
                    </span>
                  </div>
                  <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                    Página pública en probador.wilkiedevs.com/tu-marca con hero, galería de productos, probador virtual y contacto.
                  </p>
                </div>
              </label>
            </div>
          )}

          {/* Desglose cuando es upgrade */}
          {isUpgrade ? (
            <div className="pt-3 border-t space-y-2" style={{ borderColor: 'var(--border-color)' }}>
              <div className="flex items-center justify-between text-sm" style={{ color: 'var(--text-muted)' }}>
                <span>Precio {planInfo.name}</span>
                <span>{formatCurrency(planInfo.price)}</span>
              </div>
              <div className="flex items-center justify-between text-sm text-emerald-600">
                <span>Ya pagaste ({PLAN_INFO[currentPlan!].name})</span>
                <span>− {formatCurrency(PLAN_INFO[currentPlan!].price)}</span>
              </div>
              {includeLanding && (
                <div className="flex items-center justify-between text-sm" style={{ color: 'var(--text-muted)' }}>
                  <span>Mini-landing (pago único)</span>
                  <span>{formatCurrency(MINI_LANDING_PRICE)}</span>
                </div>
              )}
              <div
                className="flex items-center justify-between pt-2 border-t font-semibold"
                style={{ borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
              >
                <span>Total a pagar hoy</span>
                <span className="text-xl font-bold" style={{ color: '#FF5C3A' }}>{formatCurrency(totalPrice)}</span>
              </div>
            </div>
          ) : (
            <div className="pt-3 border-t space-y-2" style={{ borderColor: 'var(--border-color)' }}>
              {includeLanding && (
                <div className="flex items-center justify-between text-sm" style={{ color: 'var(--text-muted)' }}>
                  <span>Mini-landing (pago único)</span>
                  <span>{formatCurrency(MINI_LANDING_PRICE)}</span>
                </div>
              )}
              <div className="flex items-center justify-between">
                <p className="font-semibold" style={{ color: 'var(--text-primary)' }}>Total</p>
                <p className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>{formatCurrency(totalPrice)}</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Botón de pago o fallback manual */}
      <div
        className="rounded-2xl border px-6 py-5 space-y-4"
        style={{ background: 'var(--bg-card)', borderColor: 'var(--border-color)' }}
      >
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
              onSuccess={handleSuccess}
              onError={handleError}
              className="w-full py-3 min-h-[44px] rounded-xl text-white font-semibold text-sm disabled:opacity-50 disabled:cursor-not-allowed transition-opacity flex items-center justify-center gap-2"
              style={{ background: '#FF5C3A' }}
            >
              <CreditCard className="w-4 h-4" />
              Pagar {formatCurrency(totalPrice)} con Wompi
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
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
                  <path d="M12 0C5.373 0 0 5.373 0 12c0 2.123.554 4.118 1.528 5.845L0 24l6.335-1.508A11.945 11.945 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818a9.818 9.818 0 0 1-5.006-1.371l-.36-.214-3.727.977.994-3.634-.235-.374A9.818 9.818 0 1 1 12 21.818z" />
                </svg>
                +57 310 543 6281
              </a>
            </div>
          </div>
        )}
      </div>

      {/* Seguridad */}
      <div className="flex items-center gap-2 text-xs justify-center" style={{ color: 'var(--text-muted)' }}>
        <ShieldCheck className="w-4 h-4" />
        <span>Pagos procesados de forma segura por Wompi. No almacenamos datos de tu tarjeta.</span>
      </div>
    </div>
  );
}
