'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CreditCard, Globe, Smartphone, ArrowRight, Loader2 } from 'lucide-react';

interface PaymentMethodSelectorProps {
  value: 'wompi' | 'paypal';
  onChange: (method: 'wompi' | 'paypal') => void;
  amountCOP: number;
  trm: number;
  loading?: boolean;
  onPay: () => void;
  disabled?: boolean;
  error?: string | null;
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
  const amountUSD = amountInCOP / trm;
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amountUSD);
}

export default function PaymentMethodSelector({
  value,
  onChange,
  amountCOP,
  trm,
  loading = false,
  onPay,
  disabled = false,
  error,
}: PaymentMethodSelectorProps) {
  const [showMethods, setShowMethods] = useState(value === 'wompi');

  return (
    <div className="space-y-4">
      {/* Currency/Method Tabs */}
      <div className="flex rounded-xl border border-[rgba(255,255,255,0.08)] bg-[#050505] p-1">
        <button
          type="button"
          onClick={() => { onChange('wompi'); setShowMethods(true); }}
          className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-lg text-sm font-medium transition-all ${
            value === 'wompi'
              ? 'bg-[#1f1f1f] text-white shadow-sm'
              : 'text-[#666] hover:text-[#999]'
          }`}
        >
          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: value === 'wompi' ? '#FF5C3A' : '#333' }} />
          Pagar en COP
        </button>
        <button
          type="button"
          onClick={() => { onChange('paypal'); setShowMethods(true); }}
          className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-lg text-sm font-medium transition-all ${
            value === 'paypal'
              ? 'bg-[#1f1f1f] text-white shadow-sm'
              : 'text-[#666] hover:text-[#999]'
          }`}
        >
          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: value === 'paypal' ? '#FF5C3A' : '#333' }} />
          Pagar en USD
        </button>
      </div>

      {/* Payment Methods */}
      <AnimatePresence mode="wait">
        {value === 'wompi' && (
          <motion.div
            key="wompi"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="space-y-3"
          >
            <div className="p-4 rounded-xl border border-[rgba(255,255,255,0.08)] bg-[#0a0a0a]">
              <p className="text-xs text-[#999] mb-3">Selecciona tu método de pago:</p>
              
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'CARD', label: 'Tarjeta', sublabel: 'Débito/Crédito', icon: CreditCard },
                  { id: 'PSE', label: 'PSE', sublabel: 'Débito bancario', icon: Globe },
                  { id: 'NEQUI', label: 'Nequi', sublabel: 'Billetera digital', icon: Smartphone },
                ].map((method) => (
                  <button
                    key={method.id}
                    type="button"
                    className="flex flex-col items-center gap-1 p-3 rounded-lg border border-[rgba(255,255,255,0.08)] bg-[#050505] hover:border-[#FF5C3A]/30 hover:bg-[#0a0a0a] transition-all"
                  >
                    <method.icon className="w-5 h-5 text-[#999]" />
                    <span className="text-xs text-white font-medium">{method.label}</span>
                    <span className="text-[10px] text-[#666]">{method.sublabel}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Amount */}
            <div className="flex justify-between items-center p-4 rounded-xl border border-[rgba(255,255,255,0.08)] bg-[#0a0a0a]">
              <span className="text-sm text-[#999]">Total a pagar</span>
              <span className="text-lg font-bold text-white">
                {formatCOP(amountCOP)}
              </span>
            </div>

            {/* Wompi security */}
            <div className="flex items-center justify-center gap-2 text-[#666]">
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm0 10.99h7c-.53 4.12-3.28 7.79-7 8.94V12H5V6.3l7-3.11v8.8z"/>
              </svg>
              <span className="text-xs">Pago seguro procesado por Wompi</span>
            </div>
          </motion.div>
        )}

        {value === 'paypal' && (
          <motion.div
            key="paypal"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="space-y-3"
          >
            <div className="p-4 rounded-xl border border-[rgba(255,255,255,0.08)] bg-[#0a0a0a]">
              <p className="text-xs text-[#999] mb-3">Resumen de tu compra:</p>
              
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-[#666]">Subtotal</span>
                  <span className="text-white">{formatUSD(amountCOP, trm)} USD</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-[#666]">TRM del día</span>
                  <span className="text-[#999]">{formatCOP(trm)} COP/USD</span>
                </div>
                <div className="border-t border-white/10 pt-2 mt-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-[#999]">Total</span>
                    <div className="text-right">
                      <span className="text-lg font-bold text-white">{formatUSD(amountCOP, trm)} USD</span>
                      <span className="text-[10px] text-[#666] block">~{formatCOP(amountCOP)} COP</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* PayPal notice */}
            <div className="p-3 rounded-xl border border-[rgba(255,255,255,0.08)] bg-[#050505]">
              <p className="text-xs text-[#666] text-center">
                Serás redirigido a PayPal para completar tu pago de forma segura.
              </p>
            </div>

            {/* PayPal logo */}
            <div className="flex justify-center">
              <svg className="h-6 opacity-60" viewBox="0 0 100 25" fill="none">
                <text x="50" y="18" textAnchor="middle" fill="#666" fontSize="14" fontWeight="bold" fontFamily="sans-serif">PayPal</text>
              </svg>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Error */}
      {error && (
        <div className="bg-red-500/5 border border-red-500/20 text-red-400 p-3 rounded-lg text-xs">
          {error}
        </div>
      )}

      {/* Pay Button */}
      <button
        type="button"
        onClick={onPay}
        disabled={disabled || loading}
        className="group relative h-14 w-full overflow-hidden rounded-2xl bg-[#FF5C3A] font-bold text-white shadow-xl shadow-[#FF5C3A]/20 transition-all active:scale-95 hover:bg-[#ff6c4d] disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <div className="relative flex items-center justify-center gap-3">
          {loading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              <span className="text-xs uppercase tracking-widest">Procesando...</span>
            </>
          ) : (
            <>
              <span className="text-[13px] uppercase tracking-[0.2em] font-black">
                {value === 'wompi' ? 'Pagar ahora' : 'Continuar con PayPal'}
              </span>
              <ArrowRight className="w-4 h-4 text-white/70 group-hover:translate-x-1 transition-transform" />
            </>
          )}
        </div>
      </button>
    </div>
  );
}