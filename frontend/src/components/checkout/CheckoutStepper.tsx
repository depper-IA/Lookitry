'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Check, User, CreditCard, ShoppingBag } from 'lucide-react';

export type Step = 1 | 2 | 3 | 4;

interface StepConfig {
  label: string;
  sublabel: string;
  icon: React.ElementType;
}

interface CheckoutStepperProps {
  currentStep: Step;
  maxNavigableStep?: Step;
  onStepChange?: (step: Step) => void;
  locked?: boolean;
  variant?: 'checkout' | 'success';
}

const STEP_CONFIG: Record<'checkout' | 'success', StepConfig[]> = {
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

// Step status variants for animation
const stepVariants = {
  completed: { 
    scale: 1,
    backgroundColor: ACCENT
  },
  active: { 
    scale: 1.1,
    backgroundColor: ACCENT
  },
  pending: { 
    scale: 1,
    backgroundColor: BG_DARK
  }
};

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

  // Helper to determine step status
  const getStepStatus = (index: number): 'completed' | 'active' | 'pending' => {
    const stepId = index + 1;
    if (stepId < currentStep) return 'completed';
    if (stepId === currentStep) return 'active';
    return 'pending';
  };

  return (
    <div className="w-full">
      {/* Desktop */}
      <nav aria-label="Progreso del checkout" className="hidden md:block">
        <div className="flex items-center justify-between">
          {steps.map((step, index) => {
            const stepId = (index + 1) as Step;
            const status = getStepStatus(index);
            const isCompleted = status === 'completed';
            const isCurrent = status === 'active';
            const Icon = step.icon;
            const clickable = isClickable(stepId);

            return (
              <div key={stepId} className="relative flex flex-col items-center flex-1">
                {/* Connector lines - positioned between steps */}
                {index < steps.length - 1 && (
                  <div 
                    className="absolute top-5 left-[calc(50%+20px)] w-[calc(100%-40px)] h-0.5 z-0"
                    aria-hidden="true"
                  >
                    <div className="h-full w-full bg-[#2a2a2a] rounded-full overflow-hidden">
                      <motion.div
                        className="h-full bg-[#FF5C3A] origin-left"
                        initial={{ scaleX: 0 }}
                        animate={{ scaleX: isCompleted ? 1 : 0 }}
                        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1], delay: 0.1 }}
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
                  {/* Circle with animated state */}
                  <motion.div
                    initial={false}
                    animate={stepVariants[status]}
                    transition={{ duration: 0.3, ease: 'easeOut' }}
                    className="flex h-11 w-11 items-center justify-center rounded-full border-2"
                    style={{
                      borderColor: isCompleted || isCurrent ? ACCENT : BORDER_INACTIVE,
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
              </div>
            );
          })}
        </div>
      </nav>

      {/* Mobile */}
      <div className="md:hidden">
        <div className="flex items-center justify-between px-2">
          {steps.slice(0, 3).map((step, index) => {
            const stepId = (index + 1) as Step;
            const status = getStepStatus(index);
            const isCompleted = status === 'completed';
            const isCurrent = status === 'active';

            return (
              <div
                key={stepId}
                className="relative flex flex-col items-center flex-1"
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
                          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                          style={{ backgroundColor: ACCENT, originX: 0 }}
                        />
                      )}
                    </div>
                  </div>
                )}

                {/* Dot */}
                <motion.div
                  initial={false}
                  animate={stepVariants[status]}
                  transition={{ duration: 0.3 }}
                  className="relative z-10 flex h-8 w-8 items-center justify-center rounded-full border-2"
                  style={{
                    borderColor: isCompleted || isCurrent ? ACCENT : BORDER_INACTIVE,
                    boxShadow: isCurrent
                      ? `0 0 0 3px rgba(255,92,58,0.15)`
                      : 'none',
                  }}
                >
                  {isCompleted ? (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: 'spring', stiffness: 300 }}
                    >
                      <Check className="h-4 w-4 text-white" />
                    </motion.div>
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

// Step content wrapper with slide + fade animation
export function StepContent({ 
  children, 
  stepId 
}: { 
  children: React.ReactNode; 
  stepId: number;
}) {
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={stepId}
        initial={{ opacity: 0, x: 50 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -50 }}
        transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}

export default CheckoutStepper;
