'use client';

import CheckoutSummary, { PlanKey } from './CheckoutSummary';
import { Check, AlertCircle } from 'lucide-react';

interface OrderSummaryAdapterProps {
  isLanding: boolean;
  landingPrice: number;
  subPlanTotal: number;
  currentPlanKey: PlanKey;
  planNames: Record<PlanKey, string>;
  isTrial: boolean;
  selectedMonths: number;
  couponCode: string;
  setCouponCode: (val: string) => void;
  couponLoading: boolean;
  couponError: string;
  appliedCoupon: {
    id: string;
    code: string;
    discount_type: 'pct' | 'fixed';
    discount_value: number;
  } | null;
  setAppliedCoupon: (val: any) => void;
  handleValidateCoupon: () => void;
  couponDiscount: number;
  paymentMethod: 'wompi' | 'paypal';
  totalPrice: number;
  totalPriceUsd: number;
  trm: number;
  PLAN_FEATURES: Record<PlanKey, string[]>;
  OA: string;
}

const PLAN_BADGES: Record<string, string | null> = {
  TRIAL: '#6366f1',
  BASIC: '#10b981',
  PRO: '#FF5C3A',
  LANDING: '#f59e0b',
};

function formatCOP(amount: number): string {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export default function OrderSummaryAdapter(props: OrderSummaryAdapterProps) {
  const {
    isLanding,
    landingPrice,
    subPlanTotal,
    currentPlanKey,
    planNames,
    isTrial,
    selectedMonths,
    couponCode,
    setCouponCode,
    couponLoading,
    couponError,
    appliedCoupon,
    setAppliedCoupon,
    handleValidateCoupon,
    couponDiscount,
    paymentMethod,
    totalPrice,
    totalPriceUsd,
    trm,
    PLAN_FEATURES,
    OA,
  } = props;

  let planPrice = 0;
  let planMonths = selectedMonths;
  let landingPricePart = 0;

  if (isLanding) {
    landingPricePart = landingPrice;
    planPrice = subPlanTotal;
    planMonths = selectedMonths;
  } else if (isTrial) {
    planPrice = subPlanTotal;
    planMonths = 1;
  } else {
    planPrice = subPlanTotal;
    planMonths = selectedMonths;
  }

  const totalDisplay = isTrial || isLanding
    ? landingPricePart + planPrice - couponDiscount
    : planPrice - couponDiscount;

  const plan = {
    name: currentPlanKey,
    price: totalDisplay,
    months: planMonths,
    badge: PLAN_BADGES[currentPlanKey] ?? null,
    features: PLAN_FEATURES[currentPlanKey] ?? [],
    isLanding: isLanding,
    landingPrice: landingPricePart,
  };

  const couponAdapted = appliedCoupon
    ? {
        code: appliedCoupon.code,
        discount: appliedCoupon.discount_value ?? 0,
        discount_type: appliedCoupon.discount_type === 'pct' ? 'percentage' as const : 'fixed' as const,
      }
    : null;

  return (
    <div className="lg:col-span-4 lg:sticky lg:top-24 space-y-4">
      <CheckoutSummary
        plan={plan}
        discount={couponDiscount}
        couponApplied={couponAdapted}
        trm={trm}
        currency={paymentMethod === 'paypal' ? 'USD' : 'COP'}
      />

      <div
        className="rounded-2xl p-4 border"
        style={{
          backgroundColor: 'rgba(255,255,255,0.02)',
          borderColor: 'rgba(255,255,255,0.06)',
        }}
      >
        <div className="flex items-center gap-2 mb-3">
          <div
            className="w-1.5 h-1.5 rounded-full"
            style={{ backgroundColor: '#10b981' }}
          />
          <span className="text-[10px] font-bold uppercase tracking-widest text-[#999]">
            Cupón Promocional
          </span>
        </div>

        {appliedCoupon ? (
          <div
            className="flex items-center justify-between rounded-xl p-3"
            style={{
              backgroundColor: 'rgba(16,185,129,0.05)',
              border: '1px solid rgba(16,185,129,0.2)',
            }}
          >
            <div>
              <span className="text-xs font-black text-emerald-400">
                {appliedCoupon.code}
              </span>
              <p className="text-[9px] font-bold text-emerald-600">ACTIVO</p>
            </div>
            <button
              onClick={() => setAppliedCoupon(null)}
              className="text-[10px] text-[#999] hover:text-red-400 font-bold uppercase transition-colors"
            >
              Quitar
            </button>
          </div>
        ) : (
          <div className="flex gap-2">
            <input
              type="text"
              value={couponCode}
              onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
              placeholder="CÓDIGO"
              className="flex-1 bg-[#050505] border border-[#222] rounded-lg px-3 py-2 text-xs text-white outline-none uppercase font-bold tracking-widest transition-all"
              style={{ borderColor: '#222' }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = OA;
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = '#222';
              }}
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
        {couponError && (
          <p className="text-[9px] text-red-400 font-bold flex items-center gap-1 mt-2 uppercase">
            <AlertCircle className="w-2.5 h-2.5" />
            {couponError}
          </p>
        )}
      </div>

      {/* Ocultar para TRIAL — CheckoutSummary ya muestra todo lo necesario */}
      {!isTrial && (
        <div
          className="rounded-2xl p-4 border"
          style={{
            backgroundColor: 'rgba(255,255,255,0.02)',
            borderColor: 'rgba(255,255,255,0.06)',
          }}
        >
          <p className="text-[10px] font-black uppercase tracking-[0.18em] mb-3" style={{ color: '#666' }}>
            Resumen de compra
          </p>

          <div className="space-y-3">
            {isLanding && (
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm font-bold text-white">Mini-landing Page</p>
                  <p className="text-[10px] text-[#999]">Pago único (requiere plan activo)</p>
                </div>
                <span className="text-sm font-mono text-white">{formatCOP(landingPrice)}</span>
              </div>
            )}
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-bold text-white">{planNames[currentPlanKey]}</p>
                <p className="text-[10px] text-[#999]">
                  {isTrial ? '7 días de prueba' : `${selectedMonths} mes${selectedMonths > 1 ? 'es' : ''}`}
                </p>
              </div>
              <span className="text-sm font-mono text-white">{formatCOP(subPlanTotal)}</span>
            </div>
          </div>

          <div
            className="h-px w-full my-4"
            style={{ backgroundColor: 'rgba(255,255,255,0.06)' }}
          />

          <div
            className="rounded-xl border p-3 mb-4"
            style={{
              backgroundColor: '#050505',
              borderColor: 'rgba(255,255,255,0.04)',
            }}
          >
            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#999]">
              Cobro de hoy
            </p>
            <p className="mt-1.5 text-xs text-[#bbb]">
              {isLanding
                ? 'Hoy pagas la mini-landing y el periodo inicial del plan elegido.'
                : isTrial
                  ? 'Hoy activas tu prueba para configurar tu cuenta.'
                  : 'Hoy activas tu plan y el periodo seleccionado.'}
            </p>
          </div>

          <div className="space-y-1">
            {couponDiscount > 0 && (
              <div className="flex justify-between items-center text-xs text-[#999] font-medium mb-2 uppercase tracking-tight">
                <span>Ahorro Extra</span>
                <span className="text-emerald-500 font-bold">-{formatCOP(couponDiscount)}</span>
              </div>
            )}
            <div className="flex justify-between items-end">
              <span className="text-xs font-bold text-[#999] uppercase tracking-wider mb-1.5">
                Total
              </span>
              <div className="text-right">
                <div className="text-3xl font-black text-white leading-none">
                  {paymentMethod === 'paypal'
                    ? `$${totalPriceUsd.toFixed(2)}`
                    : formatCOP(totalPrice)}
                </div>
                <div
                  className="text-[9px] font-bold mt-1 uppercase tracking-widest"
                  style={{ color: OA }}
                >
                  {paymentMethod === 'paypal'
                    ? `${formatCOP(totalPrice)} COP · TRM ${trm.toLocaleString('es-CO')}`
                    : `~$${(totalPrice / trm).toFixed(2)} USD`}
                </div>
              </div>
            </div>
          </div>

          <div
            className="grid grid-cols-2 gap-3 pt-4 mt-4 border-t"
            style={{ borderColor: 'rgba(255,255,255,0.05)', opacity: 0.5 }}
          >
            <div className="flex items-start gap-2">
              <Check className="w-3 h-3 mt-0.5" style={{ color: OA }} />
              <span className="text-[9px] font-bold text-[#999] leading-tight uppercase tracking-tight">
                {isLanding ? <>Activación<br />&lt;48h hábiles</> : <>Activación<br />Instantánea</>}
              </span>
            </div>
            <div className="flex items-start gap-2">
              <Check className="w-3 h-3 mt-0.5" style={{ color: OA }} />
              <span className="text-[9px] font-bold text-[#999] leading-tight uppercase tracking-tight">
                Sin Cobros<br />Ocultos
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
