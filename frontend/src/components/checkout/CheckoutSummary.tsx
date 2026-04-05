'use client';

import { motion } from 'framer-motion';
import { Check, Sparkles, ShieldCheck, CreditCard } from 'lucide-react';

export type PlanKey = 'BASIC' | 'PRO' | 'LANDING' | 'TRIAL';
export type SubPlan = 'BASIC' | 'PRO';

interface PlanSummaryData {
  name: PlanKey;
  price: number;
  months: number;
  badge?: string | null;
  features: string[];
  isLanding?: boolean;
  landingPrice?: number;
}

interface CheckoutSummaryProps {
  plan: PlanSummaryData;
  originalPrice?: number;
  discount?: number;
  couponApplied?: { code: string; discount: number; discount_type?: 'percentage' | 'fixed' } | null;
  trm?: number;
  currency?: 'COP' | 'USD';
  isUpgrade?: boolean;
  currentPlan?: string;
  isAuthenticated?: boolean;
  onCouponChange?: (code: string) => void;
  onCouponValidate?: () => void;
  onCouponRemove?: () => void;
  couponCode?: string;
  couponLoading?: boolean;
  couponError?: string;
}

function formatCOP(amount: number): string {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatUSD(amountInCOP: number, trm: number): string {
  if (!trm || trm <= 0) return `$${(amountInCOP / 3900).toFixed(2)} USD`;
  const amountUSD = amountInCOP / trm;
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amountUSD);
}

const PLAN_BADGES: Record<string, string | null> = {
  TRIAL: '#6366f1',
  BASIC: '#10b981',
  PRO: '#FF5C3A',
  LANDING: '#f59e0b',
};

export default function CheckoutSummary({
  plan,
  originalPrice,
  discount = 0,
  couponApplied,
  trm = 3900,
  currency = 'COP',
  isUpgrade = false,
  currentPlan,
  isAuthenticated = false,
  couponCode,
  couponLoading,
  couponError,
  onCouponChange,
  onCouponValidate,
  onCouponRemove,
}: CheckoutSummaryProps) {
  const isTrial = plan.name === 'TRIAL';
  const isLanding = plan.name === 'LANDING';
  const hasDiscount = discount > 0 || !!couponApplied;

  const totalDiscount = couponApplied
    ? couponApplied.discount_type === 'percentage'
      ? Math.round(plan.price * (couponApplied.discount / 100))
      : couponApplied.discount
    : discount;

  const displayTotal = isTrial ? plan.price : plan.price;
  const displayOriginal = originalPrice ?? null;

  const accentColor = '#FF5C3A';
  const bgCard = '#0a0a0a';
  const borderAccent = `${accentColor}33`;

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
      className="sticky top-8"
    >
      <div
        className="rounded-2xl border overflow-hidden shadow-2xl"
        style={{
          backgroundColor: bgCard,
          borderColor: `rgba(255,255,255,0.06)`,
          boxShadow: `0 25px 50px -12px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.03)`,
        }}
      >
        <div className="p-6 border-b border-white/5">
          <div className="flex items-center gap-2 mb-5">
            <Sparkles className="w-4 h-4" style={{ color: accentColor }} />
            <span
              className="text-[10px] font-bold uppercase tracking-widest"
              style={{ color: accentColor }}
            >
              Resumen del pedido
            </span>
          </div>

          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <span className="font-bold text-xl text-white">
                Plan {plan.name}
              </span>
              {plan.badge && (
                <span
                  className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full"
                  style={{
                    backgroundColor: `${plan.badge}20`,
                    color: plan.badge,
                  }}
                >
                  {plan.name === 'PRO' ? 'Popular' : plan.name === 'TRIAL' ? 'Prueba' : ''}
                </span>
              )}
            </div>
          </div>

          {isUpgrade && currentPlan && (
            <div
              className="flex items-center gap-2 p-2 rounded-lg mb-3 text-[11px]"
              style={{
                backgroundColor: '#f59e0b10',
                border: '1px solid #f59e0b30',
              }}
            >
              <span style={{ color: '#f59e0b' }}>
                Upgrade desde <strong>{currentPlan}</strong>
              </span>
            </div>
          )}

          <ul className="space-y-2.5">
            {plan.features.slice(0, 5).map((feature, i) => (
              <li
                key={i}
                className="flex items-start gap-2.5 text-xs"
                style={{ color: '#999' }}
              >
                <Check
                  className="w-3.5 h-3.5 flex-shrink-0 mt-0.5"
                  style={{ color: accentColor }}
                />
                {feature}
              </li>
            ))}
          </ul>
        </div>

        <div className="p-6 space-y-3">
          {!isTrial && !isLanding && (
            <>
              <div className="flex justify-between text-sm">
                <span className="text-[#666]">Precio mensual</span>
                <span className="text-white">{formatCOP(Math.ceil(plan.price / plan.months))}/mes</span>
              </div>

              {plan.months > 1 && (
                <div className="flex justify-between text-sm">
                  <span className="text-[#666]">{plan.months} meses</span>
                  <span className="text-white">{formatCOP(plan.price)}</span>
                </div>
              )}

              {hasDiscount && displayOriginal && (
                <div className="flex justify-between text-sm">
                  <span className="text-[#666]">Descuento</span>
                  <span className="text-emerald-400">-{formatCOP(totalDiscount)}</span>
                </div>
              )}

              {couponApplied && (
                <div className="flex justify-between text-sm">
                  <span className="text-[#666]">
                    Cupón <span style={{ color: accentColor }}>{couponApplied.code}</span>
                  </span>
                  <span className="text-emerald-400">-{formatCOP(totalDiscount)}</span>
                </div>
              )}
            </>
          )}

          {isLanding && (
            <>
              <div className="flex justify-between text-sm">
                <span className="text-[#666]">Mini-landing</span>
                <span className="text-white">{formatCOP(plan.landingPrice ?? 0)}</span>
              </div>
              {plan.price > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-[#666]">Plan inicial ({plan.months} {plan.months === 1 ? 'mes' : 'meses'})</span>
                  <span className="text-white">{formatCOP(plan.price)}</span>
                </div>
              )}
              {hasDiscount && (
                <div className="flex justify-between text-sm">
                  <span className="text-[#666]">Descuento</span>
                  <span className="text-emerald-400">-{formatCOP(totalDiscount)}</span>
                </div>
              )}
            </>
          )}

          {isTrial && (
            <div className="flex justify-between text-sm">
              <span className="text-[#666]">Pago único</span>
              <span className="text-white">{formatCOP(plan.price)}</span>
            </div>
          )}

          <div className="border-t border-white/10 pt-3">
            <div className="flex justify-between font-bold">
              <span className="text-white text-sm">
                {isTrial ? 'Total a pagar' : 'Total'}
              </span>
              <div className="text-right">
                <span className="text-white font-bold text-lg">
                  {currency === 'USD'
                    ? formatUSD(displayTotal, trm)
                    : formatCOP(displayTotal)}
                </span>
                {currency === 'USD' && (
                  <span className="text-[10px] text-[#666] block">
                    ~{formatCOP(displayTotal)} COP
                  </span>
                )}
              </div>
            </div>
          </div>

          {currency === 'USD' && (
            <p className="text-[10px] text-[#666] text-right">
              TRM del día: {formatCOP(trm)} COP/USD
            </p>
          )}
        </div>

        <div className="px-6 pb-6">
          <div
            className="flex items-center justify-center gap-4 pt-4 border-t"
            style={{ borderColor: 'rgba(255,255,255,0.05)' }}
          >
            <div className="flex items-center gap-1.5 text-[#666]">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span className="text-[10px]">Pago seguro</span>
            </div>
            <div className="flex items-center gap-1.5 text-[#666]">
              <CreditCard className="w-3.5 h-3.5" />
              <span className="text-[10px]">Wompi / PayPal</span>
            </div>
          </div>
        </div>
      </div>

      <p className="text-center text-[10px] text-[#666] mt-4">
        ¿Necesitas ayuda?{' '}
        <a
          href="mailto:info@lookitry.com"
          className="hover:underline"
          style={{ color: accentColor }}
        >
          info@lookitry.com
        </a>
      </p>
    </motion.div>
  );
}
