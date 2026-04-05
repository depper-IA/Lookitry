'use client';

import { motion } from 'framer-motion';
import { Check, User, CreditCard, Rocket, Store, Mail } from 'lucide-react';

export type CheckoutStep = 1 | 2 | 3 | 4;

interface Step {
  id: CheckoutStep;
  label: string;
  icon: React.ElementType;
}

interface CheckoutProgressBarProps {
  currentStep: CheckoutStep;
  completedSteps?: CheckoutStep[];
  onStepClick?: (step: CheckoutStep) => void;
  maxNavigableStep?: CheckoutStep;
  showLabels?: boolean;
}

const DEFAULT_STEPS: Step[] = [
  { id: 1, label: 'Tu cuenta', icon: User },
  { id: 2, label: 'Verificación', icon: Mail },
  { id: 3, label: 'Pago', icon: CreditCard },
  { id: 4, label: '¡Listo!', icon: Rocket },
];

const MOBILE_STEPS = ['Cuenta', 'Pago', '¡Listo!'];

export default function CheckoutProgressBar({
  currentStep,
  completedSteps = [],
  onStepClick,
  maxNavigableStep,
  showLabels = true,
}: CheckoutProgressBarProps) {
  const steps = DEFAULT_STEPS;
  const isClickable = (stepId: CheckoutStep) => {
    if (!onStepClick || !maxNavigableStep) return false;
    return stepId <= maxNavigableStep && !completedSteps.includes(stepId);
  };

  return (
    <div className="w-full">
      {/* Desktop */}
      <nav aria-label="Progress" className="hidden md:block">
        <ol role="list" className="flex items-center justify-between">
          {steps.map((step, index) => {
            const isCompleted = completedSteps.includes(step.id);
            const isCurrent = step.id === currentStep;
            const Icon = step.icon;
            const clickable = isClickable(step.id);

            return (
              <li key={step.id} className="relative flex flex-col items-center flex-1">
                {/* Connector line */}
                {index !== steps.length - 1 && (
                  <div
                    className="absolute top-5 left-1/2 w-full h-[2px] -translate-y-1/2 z-0"
                    aria-hidden="true"
                  >
                    <motion.div
                      initial={{ scaleX: 0 }}
                      animate={{ scaleX: isCompleted || step.id < currentStep ? 1 : 0 }}
                      transition={{ duration: 0.4, ease: 'easeOut' }}
                      className="h-full rounded-full"
                      style={{
                        backgroundColor: isCompleted || step.id < currentStep ? '#FF5C3A' : '#1f1f1f',
                      }}
                    />
                  </div>
                )}

                {/* Step circle */}
                <button
                  type="button"
                  className={`relative z-10 flex flex-col items-center disabled:cursor-default transition-transform ${
                    clickable ? 'cursor-pointer hover:scale-105' : ''
                  }`}
                  onClick={() => clickable && onStepClick?.(step.id)}
                  disabled={!clickable}
                  aria-current={isCurrent ? 'step' : undefined}
                  aria-label={`Paso ${step.id}: ${step.label}`}
                >
                  <motion.div
                    initial={false}
                    animate={{
                      backgroundColor: isCompleted || step.id < currentStep ? '#FF5C3A' : '#0a0a0a',
                      borderColor: isCompleted || step.id < currentStep ? '#FF5C3A' : isCurrent ? '#FF5C3A' : '#2a2a2a',
                      scale: isCurrent ? 1.1 : 1,
                    }}
                    transition={{ duration: 0.3 }}
                    className="flex h-10 w-10 items-center justify-center rounded-full border-2"
                    style={{
                      boxShadow: isCurrent ? '0 0 0 4px rgba(255,92,58,0.15)' : 'none',
                    }}
                  >
                    {isCompleted || step.id < currentStep ? (
                      <Check className="h-5 w-5 text-white" aria-hidden="true" />
                    ) : (
                      <Icon
                        className="h-5 w-5"
                        style={{ color: isCurrent ? '#FF5C3A' : '#444' }}
                        aria-hidden="true"
                      />
                    )}
                  </motion.div>

                  {showLabels && (
                    <span
                      className="mt-3 text-[10px] font-bold uppercase tracking-wider transition-colors whitespace-nowrap"
                      style={{
                        color: isCompleted || step.id < currentStep ? '#FF5C3A' : isCurrent ? '#FF5C3A' : '#444',
                      }}
                    >
                      {step.label}
                    </span>
                  )}
                </button>
              </li>
            );
          })}
        </ol>
      </nav>

      {/* Mobile - simplified */}
      <div className="md:hidden">
        <div className="flex items-center justify-between px-4">
          {MOBILE_STEPS.map((label, index) => {
            const stepNum = (index + 1) as CheckoutStep;
            const isCompleted = completedSteps.includes(stepNum);
            const isCurrent = stepNum === currentStep;
            const stepIndex = index;

            return (
              <div key={stepNum} className="flex flex-col items-center flex-1">
                <div
                  className="flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold transition-all"
                  style={{
                    backgroundColor: isCompleted || stepIndex < currentStep - 1 ? '#FF5C3A' : isCurrent ? '#FF5C3A' : '#1f1f1f',
                    color: isCompleted || stepIndex < currentStep - 1 || isCurrent ? 'white' : '#444',
                    boxShadow: isCurrent ? '0 0 0 3px rgba(255,92,58,0.2)' : 'none',
                  }}
                >
                  {isCompleted || stepIndex < currentStep - 1 ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    stepNum
                  )}
                </div>
                <span
                  className="mt-2 text-[9px] font-medium uppercase tracking-wider"
                  style={{ color: isCurrent ? '#FF5C3A' : '#666' }}
                >
                  {label}
                </span>

                {/* Connector */}
                {index !== MOBILE_STEPS.length - 1 && (
                  <div className="absolute top-4 left-1/2 w-full h-[2px] -translate-y-1/2 z-0">
                    <div
                      className="h-full rounded-full"
                      style={{
                        backgroundColor: stepIndex < currentStep - 1 ? '#FF5C3A' : '#1f1f1f',
                      }}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}