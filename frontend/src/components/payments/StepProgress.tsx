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
                    <div className={`h-full transition-all duration-500 rounded-full ${isCompleted ? 'bg-indigo-600' : 'bg-gray-200 dark:bg-gray-800'}`} />
                  </div>
                )}

                {/* Círculo del paso */}
                <div className="relative z-10 flex flex-col items-center group">
                  <div
                    className={`
                      flex h-10 w-10 items-center justify-center rounded-full border-2 transition-all duration-300
                      ${isCompleted ? 'bg-indigo-600 border-indigo-600 shadow-lg shadow-indigo-500/20' : ''}
                      ${isCurrent ? 'bg-white dark:bg-gray-900 border-indigo-600 ring-4 ring-indigo-100 dark:ring-indigo-900/30' : ''}
                      ${isPending ? 'bg-white dark:bg-gray-950 border-gray-200 dark:border-gray-800' : ''}
                    `}
                  >
                    {isCompleted ? (
                      <Check className="h-5 w-5 text-white" aria-hidden="true" />
                    ) : (
                      <Icon className={`h-5 w-5 ${isCurrent ? 'text-indigo-600' : 'text-gray-400 dark:text-gray-600'}`} aria-hidden="true" />
                    )}
                  </div>
                  
                  {/* Etiqueta */}
                  <span 
                    className={`
                      mt-3 text-xs font-semibold uppercase tracking-wider
                      ${isCurrent || isCompleted ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-400 dark:text-gray-600'}
                    `}
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
