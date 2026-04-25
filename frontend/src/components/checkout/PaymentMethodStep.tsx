'use client';

import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import { CreditCard, AlertCircle } from 'lucide-react';
import { PlanKey, SubPlan } from '@/app/checkout/page';

interface PaymentMethodStepProps {
  paymentMethod: 'wompi' | 'paypal';
  setPaymentMethod: (method: 'wompi' | 'paypal') => void;
  totalPrice: number;
  totalPriceUsd: number;
  trm: number;
  error: string;
  loading: boolean;
  handlePrevStep: () => void;
  handlePagar: () => void;
  isLanding: boolean;
  isTrial: boolean;
  planNames: Record<PlanKey, string>;
  subPlan: SubPlan;
  selectedPlan: PlanKey;
  selectedMonths: number;
  formatCop: (val: number) => string;
  formatUsd: (val: number) => string;
  stepNumber?: number;
  OA: string;
}

export default function PaymentMethodStep({
  paymentMethod,
  setPaymentMethod,
  totalPrice,
  totalPriceUsd,
  trm,
  error,
  loading,
  handlePrevStep,
  handlePagar,
  isLanding,
  isTrial,
  planNames,
  subPlan,
  selectedPlan,
  selectedMonths,
  formatCop,
  formatUsd,
  stepNumber = 3,
  OA
}: PaymentMethodStepProps) {
  return (
    <div className="animate-in fade-in slide-in-from-right-4 duration-500">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-jakarta font-bold text-white tracking-tight">Finalizar y Activar</h2>
          <p className="text-sm text-[#999] mt-1">Elige como quieres pagar. Despues te llevamos a confirmacion y activacion.</p>
        </div>
        <div className="text-[10px] font-bold px-2 py-1 rounded border uppercase" style={{ color: OA, backgroundColor: 'rgba(255,92,58,0.07)', borderColor: 'rgba(255,92,58,0.2)' }}>Paso {stepNumber} de 3</div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
        <motion.button
          whileHover={{ scale: 1.02, boxShadow: "0 20px 40px -15px rgba(0, 0, 0, 0.3)" }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setPaymentMethod('wompi')}
          animate={paymentMethod === 'wompi' ? {
            borderColor: OA,
            boxShadow: "0 0 20px rgba(255, 92, 58, 0.3)"
          } : {}}
          className="relative p-6 rounded-2xl border-2 flex flex-col gap-4 text-left transition-all"
          style={{
            borderColor: paymentMethod === 'wompi' ? OA : '#1f1f1f',
            backgroundColor: paymentMethod === 'wompi' ? 'rgba(255,92,58,0.04)' : '#0d0d0d',
          }}
        >
          <div className="flex justify-between items-start">
            <Image src="/wompi-logo.svg" alt="Wompi" width={100} height={30} className="invert brightness-150 h-10 w-auto" />
            <motion.div
              animate={{ 
                scale: paymentMethod === 'wompi' ? 1 : 0,
                rotate: paymentMethod === 'wompi' ? 180 : 0
              }}
              transition={{ duration: 0.4 }}
              className="w-4 h-4 rounded-full"
              style={{ backgroundColor: OA }}
            />
          </div>
          <div>
            <p className="text-xs font-bold text-white uppercase tracking-widest">Tarjeta / PSE / Nequi</p>
            <p className="text-[10px] text-[#999] mt-1">Pago seguro procesado por Bancolombia</p>
          </div>
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.02, boxShadow: "0 20px 40px -15px rgba(0, 0, 0, 0.3)" }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setPaymentMethod('paypal')}
          animate={paymentMethod === 'paypal' ? {
            borderColor: OA,
            boxShadow: "0 0 20px rgba(255, 92, 58, 0.3)"
          } : {}}
          className="relative p-6 rounded-2xl border-2 flex flex-col gap-4 text-left transition-all"
          style={{
            borderColor: paymentMethod === 'paypal' ? OA : '#1f1f1f',
            backgroundColor: paymentMethod === 'paypal' ? 'rgba(255,92,58,0.04)' : '#0d0d0d',
          }}
        >
          <div className="flex justify-between items-start">
            <Image src="/payment-paypal.svg" alt="PayPal" width={100} height={30} className="h-10 w-auto" />
            <motion.div
              animate={{ 
                scale: paymentMethod === 'paypal' ? 1 : 0,
                rotate: paymentMethod === 'paypal' ? 180 : 0
              }}
              transition={{ duration: 0.4 }}
              className="w-4 h-4 rounded-full"
              style={{ backgroundColor: OA }}
            />
          </div>
          <div>
            <p className="text-xs font-bold text-white uppercase tracking-widest">PayPal / USD Internacional</p>
            <p className="text-[10px] text-[#999] mt-1">TRM actual: {formatCop(trm).replace('COP', '').trim()} COP</p>
          </div>
        </motion.button>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl flex items-center gap-3 mb-6">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <p className="text-xs font-medium">{error}</p>
        </div>
      )}

      <div className="mb-6 rounded-2xl border border-[#1f1f1f] bg-[#0a0a0a] p-4">
        <p className="text-[10px] font-black uppercase tracking-[0.18em]" style={{ color: OA }}>
          Que activas con este pago
        </p>
        <p className="mt-2 text-sm text-[#bbb]">
          {isLanding
            ? `Mini-landing + ${planNames[subPlan]} por ${selectedMonths} mes${selectedMonths > 1 ? 'es' : ''}.`
            : isTrial
              ? 'Tu prueba profesional por 7 dias para empezar a configurar y finalizar.'
              : `${planNames[selectedPlan]} por ${selectedMonths} mes${selectedMonths > 1 ? 'es' : ''}.`}
        </p>
        <p className="mt-2 text-[11px] text-[#999]">
          {isLanding
            ? 'La mini-landing es un pago unico. El plan asociado sigue su ciclo normal segun el tiempo que elijas.'
            : 'Al finalizar el pago te llevamos a confirmacion y activacion de tu acceso.'}
        </p>
      </div>

      <div className="flex gap-4 mt-10">
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.97 }}
          onClick={handlePrevStep}
          disabled={loading}
          className="flex-1 bg-[#0d0d0d] hover:bg-[#141414] text-white font-bold py-4 rounded-2xl border border-[#1f1f1f] transition-all flex items-center justify-center gap-2"
        >
          ATRÁS
        </motion.button>
        <motion.button
          whileHover={{ scale: 1.02, boxShadow: paymentMethod === 'wompi'
            ? '0 15px 40px -10px rgba(255,92,58,0.6)'
            : '0 15px 40px -10px rgba(0,112,186,0.6)' }}
          whileTap={{ scale: 0.97 }}
          onClick={handlePagar}
          disabled={loading}
          className="relative overflow-hidden flex-[2] text-white font-extrabold py-4 rounded-2xl transition-all flex items-center justify-center gap-3 group"
          style={{
            backgroundColor: OA,
            boxShadow: paymentMethod === 'wompi'
              ? '0 10px 30px -10px rgba(255,92,58,0.5)'
              : '0 10px 30px -10px rgba(0,112,186,0.5)',
          }}
        >
          <AnimatePresence mode="wait">
            {loading ? (
              <motion.div
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex items-center justify-center gap-2"
              >
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  className="w-5 h-5 border-2 border-white border-t-transparent rounded-full"
                />
                <span>Procesando...</span>
              </motion.div>
            ) : (
              <motion.span
                key="default"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex items-center gap-3"
              >
                <motion.span
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ duration: 0.8, repeat: Infinity }}
                >
                  <CreditCard className="w-5 h-5 group-hover:scale-110 transition-transform" />
                </motion.span>
                <span>{paymentMethod === 'paypal' ? `PAGAR ${formatUsd(totalPriceUsd)} USD` : `PAGAR ${formatCop(totalPrice)} COP`}</span>
              </motion.span>
            )}
          </AnimatePresence>
        </motion.button>
      </div>

      <div className="mt-8 flex justify-center gap-8 opacity-30">
        <Image src="/payment-pse.svg" alt="PSE" width={40} height={40} className="grayscale" />
        <Image src="/payment-mastercard.svg" alt="Mastercard" width={30} height={30} className="grayscale" />
        <Image src="/payment-visa.svg" alt="Visa" width={45} height={15} className="grayscale" />
      </div>
    </div>
  );
}
