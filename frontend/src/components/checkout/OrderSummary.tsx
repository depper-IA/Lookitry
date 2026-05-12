'use client';

import { motion } from 'framer-motion';
import { Check, AlertCircle } from 'lucide-react';
import { PlanKey } from '@/app/checkout/page';

interface OrderSummaryProps {
  isLanding: boolean;
  landingPrice: number;
  subPlanTotal: number;
  currentPlanKey: PlanKey;
  planNames: Record<PlanKey, string>;
  isTrial: boolean;
  selectedMonths: number;
  formatCop: (val: number) => string;
  formatUsd: (val: number) => string;
  couponCode: string;
  setCouponCode: (val: string) => void;
  couponLoading: boolean;
  couponError: string;
  appliedCoupon: any;
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

export default function OrderSummary({
  isLanding,
  landingPrice,
  subPlanTotal,
  currentPlanKey,
  planNames,
  isTrial,
  selectedMonths,
  formatCop,
  formatUsd,
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
  OA
}: OrderSummaryProps) {
  return (
    <div className="lg:col-span-4 lg:sticky lg:top-24">
      <div className="bg-[#0d0d0d] border border-[#1f1f1f] rounded-3xl p-8 shadow-2xl overflow-hidden relative">
        <div className="absolute top-0 right-0 w-32 h-32 blur-3xl rounded-full -mr-16 -mt-16" style={{ backgroundColor: 'rgba(255,92,58,0.05)' }} />

        <h3 className="text-xs font-black uppercase tracking-widest mb-6" style={{ color: OA }}>Resumen de compra</h3>

        <div className="space-y-6">
          <div className="space-y-4">
            {isLanding && (
              <motion.div 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3 }}
                className="flex justify-between items-start"
              >
                <div>
                  <p className="text-sm font-bold text-white">Mini-landing Page</p>
                  <p className="text-[10px] text-[#999]">Un solo pago de por vida</p>
                </div>
                <span className="text-sm font-mono text-white">{formatCop(landingPrice)}</span>
              </motion.div>
            )}
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: 0.1 }}
              className="flex justify-between items-start"
            >
              <div>
                <p className="text-sm font-bold text-white">{planNames[currentPlanKey]}</p>
                <p className="text-[10px] text-[#999]">
                  {isTrial ? '7 días de prueba' : `${selectedMonths} mes${selectedMonths > 1 ? 'es' : ''}`}
                </p>
              </div>
              <motion.span
                key={subPlanTotal}
                initial={{ scale: 1.2, color: OA }}
                animate={{ scale: 1, color: 'inherit' }}
                transition={{ duration: 0.3 }}
                className="text-sm font-mono text-white"
              >
                {formatCop(subPlanTotal)}
              </motion.span>
            </motion.div>
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
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex justify-between items-center text-xs text-[#999] font-medium mb-2 uppercase tracking-tighter"
              >
                <span>Ahorro Extra</span>
                <motion.span 
                  initial={{ scale: 1.3, color: '#22c55e' }}
                  animate={{ scale: 1, color: '#22c55e' }}
                  className="font-bold"
                >
                  -{formatCop(couponDiscount)}
                </motion.span>
              </motion.div>
            )}
            <motion.div 
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              className="flex justify-between items-end"
            >
              <span className="text-xs font-bold text-[#999] uppercase tracking-wider mb-1.5">Total</span>
              <div className="text-right">
                <motion.div 
                  key={totalPrice}
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ type: "spring", stiffness: 300 }}
                  className="text-3xl font-jakarta font-black text-white leading-none"
                >
                  {paymentMethod === 'paypal' ? formatUsd(totalPriceUsd) : formatCop(totalPrice)}
                </motion.div>
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.2 }}
                  className="text-[9px] font-bold mt-1 uppercase tracking-widest"
                  style={{ color: OA }}
                >
                  {paymentMethod === 'paypal' 
                    ? `${formatCop(totalPrice)} COP · TRM ${formatCop(trm).replace('COP', '').replace('$', '').trim()}` 
                    : `${formatUsd(totalPriceUsd)} USD · REFERENCIA`}
                </motion.div>
              </div>
            </motion.div>
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
          {PLAN_FEATURES[currentPlanKey]?.slice(0, 4).map(f => (
            <li key={f} className="flex items-center gap-2 text-[11px] text-[#bbb] font-medium">
              <div className="w-1 h-1 rounded-full" style={{ backgroundColor: OA, opacity: 0.6 }} />
              {f}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
