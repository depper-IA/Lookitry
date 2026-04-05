'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Check, User, CreditCard, ShoppingBag } from 'lucide-react';

export type Step = 1 | 2 | 3 | 4;

interface CheckoutStepperProps {
  currentStep: Step;
  maxNavigableStep?: Step;
  onStepChange?: (step: Step) => void;
  locked?: boolean;
  variant?: 'checkout' | 'success';
}

const STEP_CONFIG = {
  checkout: [
    { label: 'Tus Datos', sublabel: 'Email y marca', icon: User },
    { label: 'Plan', sublabel: 'Elige tu plan', icon: ShoppingBag },
    { label: 'Pago', sublabel: 'Finalizar', icon: CreditCard },
  ],
  success: [
    { label: 'Tus Datos', sublabel: 'Completado', icon: User },
    { label: 'Plan', sublabel: 'Completado', icon: ShoppingBag },
    { label: 'Pago', sublabel: 'Completado', icon: CreditCard },
    { label: '¡Listo!', sublabel: 'Activado', icon: Check },
  ],
};

const ACCENT = '#FF5C3A';
const BG_DARK = '#0a0a0a';
const BORDER_INACTIVE = '#1f1f1f';
const TEXT_INACTIVE = '#444';
const TEXT_LABEL_INACTIVE = '#555';

export function CheckoutStepper({
  currentStep,
  maxNavigableStep,
  onStepChange,
  locked = false,
  variant = 'checkout',
}: CheckoutStepperProps) {
  const steps = STEP_CONFIG[variant];
  const isClickable = (stepId: number) =>
    !locked && !!onStepChange && stepId <= (maxNavigableStep ?? currentStep);

  return (
    <div className="w-full">
      {/* Desktop */}
      <nav aria-label="Progreso del checkout" className="hidden md:block">
        <ol role="list" className="relative flex items-center justify-between">
          {steps.map((step, index) => {
            const stepId = (index + 1) as Step;
            const isCompleted = stepId < currentStep;
            const isCurrent = stepId === currentStep;
            const Icon = step.icon;
            const clickable = isClickable(stepId);

            return (
              <li key={stepId} className="relative flex flex-col items-center flex-1 z-10">
                {/* Connector line — positioned absolutely behind circles */}
                {index < steps.length - 1 && (
                  <div
                    className="absolute top-5 left-[calc(50%+20px)] w-[calc(100%-40px)] h-[2px] z-0"
                    aria-hidden="true"
                  >
                    <div className="h-full w-full bg-[#1a1a1a] rounded-full overflow-hidden">
                      <motion.div
                        className="h-full rounded-full"
                        initial={{ scaleX: 0 }}
                        animate={{ scaleX: isCompleted ? 1 : 0 }}
                        transition={{ duration: 0.5, ease: 'easeOut', delay: 0.1 }}
                        style={{ backgroundColor: ACCENT, originX: 0 }}
                      />
                    </div>
                  </div>
                )}

                {/* Step button */}
                <button
                  type="button"
                  className={`relative z-10 flex flex-col items-center transition-transform ${
                    clickable ? 'cursor-pointer hover:scale-105 active:scale-95' : 'cursor-default'
                  }`}
                  onClick={() => clickable && onStepChange?.(stepId)}
                  disabled={!clickable}
                  aria-current={isCurrent ? 'step' : undefined}
                  aria-label={`Paso ${stepId}: ${step.label}`}
                >
                  {/* Circle */}
                  <motion.div
                    initial={false}
                    animate={{
                      backgroundColor: isCompleted ? ACCENT : isCurrent ? ACCENT : BG_DARK,
                      borderColor: isCompleted || isCurrent ? ACCENT : BORDER_INACTIVE,
                      scale: isCurrent ? 1.15 : 1,
                    }}
                    transition={{ duration: 0.3, ease: 'easeOut' }}
                    className="flex h-11 w-11 items-center justify-center rounded-full border-2"
                    style={{
                      boxShadow: isCurrent
                        ? `0 0 0 6px rgba(255,92,58,0.12), 0 4px 12px rgba(255,92,58,0.25)`
                        : 'none',
                    }}
                  >
                    <AnimatePresence mode="wait">
                      {isCompleted ? (
                        <motion.div
                          key="check"
                          initial={{ scale: 0, rotate: -45 }}
                          animate={{ scale: 1, rotate: 0 }}
                          exit={{ scale: 0 }}
                          transition={{ duration: 0.25, ease: 'backOut' }}
                        >
                          <Icon className="h-5 w-5 text-white" aria-hidden="true" />
                        </motion.div>
                      ) : (
                        <motion.div
                          key="icon"
                          initial={{ opacity: 0, scale: 0.5 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.5 }}
                          transition={{ duration: 0.2 }}
                        >
                          <Icon
                            className="h-5 w-5"
                            style={{ color: isCurrent ? '#fff' : TEXT_INACTIVE }}
                            aria-hidden="true"
                          />
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>

                  {/* Labels */}
                  <div className="mt-3 flex flex-col items-center">
                    <span
                      className="text-[11px] font-black uppercase tracking-wider transition-colors"
                      style={{
                        color: isCompleted || isCurrent ? ACCENT : TEXT_LABEL_INACTIVE,
                      }}
                    >
                      {step.label}
                    </span>
                    <span
                      className="text-[9px] font-medium transition-colors mt-0.5"
                      style={{
                        color: isCurrent ? '#888' : '#444',
                      }}
                    >
                      {step.sublabel}
                    </span>
                  </div>
                </button>
              </li>
            );
          })}
        </ol>
      </nav>

      {/* Mobile */}
      <div className="md:hidden">
        <div className="flex items-center justify-between px-2">
          {steps.slice(0, 3).map((step, index) => {
            const stepId = (index + 1) as Step;
            const isCompleted = stepId < currentStep;
            const isCurrent = stepId === currentStep;

            return (
              <div
                key={stepId}
                className="flex flex-col items-center flex-1"
              >
                {/* Connector */}
                {index < 2 && (
                  <div className="absolute top-4 w-full h-[2px] left-[calc(16.67%+8px)]">
                    <div
                      className="h-full bg-[#1a1a1a] rounded-full overflow-hidden"
                      style={{ width: 'calc(100% - 16px)' }}
                    >
                      {isCompleted && (
                        <motion.div
                          className="h-full rounded-full"
                          initial={{ scaleX: 0 }}
                          animate={{ scaleX: 1 }}
                          transition={{ duration: 0.4, ease: 'easeOut' }}
                          style={{ backgroundColor: ACCENT, originX: 0 }}
                        />
                      )}
                    </div>
                  </div>
                )}

                {/* Dot */}
                <motion.div
                  initial={false}
                  animate={{
                    backgroundColor: isCompleted || isCurrent ? ACCENT : '#1a1a1a',
                    scale: isCurrent ? 1.2 : 1,
                  }}
                  transition={{ duration: 0.3 }}
                  className="relative z-10 flex h-8 w-8 items-center justify-center rounded-full"
                  style={{
                    boxShadow: isCurrent
                      ? `0 0 0 3px rgba(255,92,58,0.15)`
                      : 'none',
                  }}
                >
                  {isCompleted ? (
                    <Check className="h-4 w-4 text-white" />
                  ) : (
                    <span
                      className="text-[10px] font-black"
                      style={{ color: isCurrent ? '#fff' : '#555' }}
                    >
                      {stepId}
                    </span>
                  )}
                </motion.div>

                {/* Label */}
                <span
                  className="mt-2 text-[9px] font-bold uppercase tracking-wide"
                  style={{ color: isCurrent ? ACCENT : '#555' }}
                >
                  {step.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default CheckoutStepper;
