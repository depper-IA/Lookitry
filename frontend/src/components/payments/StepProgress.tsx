'use client';

import React from 'react';
import { Check, User, CreditCard, Rocket, LayoutPanelLeft } from 'lucide-react';

export type Step = 1 | 2 | 3 | 4;

interface StepProgressProps {
  currentStep: Step;
}

const steps = [
  { id: 1, name: 'Plan', icon: LayoutPanelLeft },
  { id: 2, name: 'Tus Datos', icon: User },
  { id: 3, name: 'Pago', icon: CreditCard },
  { id: 4, name: 'Acceso', icon: Rocket },
];

export const StepProgress: React.FC<StepProgressProps> = ({ currentStep }) => {
  return (
    <div className="w-full max-w-3xl mx-auto px-4 py-8">
      <nav aria-label="Progress">
        <ol role="list" className="flex items-center justify-between pointer-events-none">
          {steps.map((step, index) => {
            const isCompleted = step.id < currentStep;
            const isCurrent = step.id === currentStep;
            const isPending = step.id > currentStep;
            const Icon = step.icon;

            return (
              <li key={step.id} className="relative flex flex-col items-center flex-1">
                {/* Conector lineal */}
                {index !== steps.length - 1 && (
                  <div
                    className="absolute top-5 left-1/2 w-full h-[2px] -translate-y-1/2 z-0"
                    aria-hidden="true"
                  >
                    <div
                      className="h-full transition-all duration-500 rounded-full"
                      style={{ backgroundColor: isCompleted ? '#FF5C3A' : '#1f1f1f' }}
                    />
                  </div>
                )}

                {/* Círculo del paso */}
                <div className="relative z-10 flex flex-col items-center">
                  <div
                    className="flex h-10 w-10 items-center justify-center rounded-full border-2 transition-all duration-300"
                    style={{
                      backgroundColor: isCompleted
                        ? '#FF5C3A'
                        : isCurrent
                        ? '#0a0a0a'
                        : '#0a0a0a',
                      borderColor: isCompleted
                        ? '#FF5C3A'
                        : isCurrent
                        ? '#FF5C3A'
                        : '#2a2a2a',
                      boxShadow: isCurrent ? '0 0 0 4px rgba(255,92,58,0.15)' : 'none',
                    }}
                  >
                    {isCompleted ? (
                      <Check className="h-5 w-5 text-white" aria-hidden="true" />
                    ) : (
                      <Icon
                        className="h-5 w-5"
                        style={{ color: isCurrent ? '#FF5C3A' : '#444' }}
                        aria-hidden="true"
                      />
                    )}
                  </div>

                  {/* Etiqueta */}
                  <span
                    className="mt-3 text-[10px] font-bold uppercase tracking-wider"
                    style={{
                      color:
                        isCurrent || isCompleted ? '#FF5C3A' : '#444',
                    }}
                  >
                    {step.name}
                  </span>
                </div>
              </li>
            );
          })}
        </ol>
      </nav>
    </div>
  );
};
