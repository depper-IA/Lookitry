'use client';

import { motion } from 'framer-motion';

interface Step {
  num: number;
  label: string;
  active: boolean;
  done: boolean;
}

interface SidebarProgressStepsProps {
  steps: Step[];
  isSmall: boolean;
  primaryColor: string;
  sidebarLuminance: boolean;
  sidebarText: string;
  sidebarMuted: string;
  sidebarSubtle: string;
  primaryGlow: string;
}

export function SidebarProgressSteps({
  steps,
  isSmall,
  primaryColor,
  sidebarLuminance,
  sidebarText,
  sidebarMuted,
  sidebarSubtle,
  primaryGlow,
}: SidebarProgressStepsProps) {
  return (
    <div 
      className={`${isSmall 
        ? 'flex items-center justify-between gap-2 px-3 py-2 border-t border-b' 
        : 'px-3 py-2.5 space-y-1'
      }`}
      style={{ borderColor: `${primaryColor}20` }}
    >
      {steps.map((s, idx) => (
        <div 
          key={s.num} 
          className={`flex items-center transition-all duration-300 ${
            isSmall 
              ? `flex-1 justify-center gap-1.5 py-2 rounded-xl ${
                  s.active ? 'shadow-lg scale-105' : ''
                }`
              : `gap-3 px-3 py-2.5 rounded-xl ${
                  s.active ? 'shadow-md' : ''
                }`
          }`}
          style={{
            backgroundColor: s.active 
              ? `${primaryColor}20` 
              : s.done 
                ? `${primaryColor}10` 
                : 'transparent',
            ...(s.active && !isSmall && { boxShadow: `0 4px 15px ${primaryGlow}` }),
          }}
        >
          {/* Step indicator */}
          <div 
            className={`flex-shrink-0 rounded-full flex items-center justify-center font-black transition-all ${
              isSmall ? 'w-5 h-5 text-[9px]' : 'w-6 h-6 text-xs'
            } ${s.active ? 'text-white' : s.done ? (sidebarLuminance ? 'text-black/80' : 'text-white/80') : (sidebarLuminance ? 'text-black/40' : 'text-white/40')}`}
            style={{ 
              backgroundColor: s.active 
                ? primaryColor 
                : s.done 
                  ? `${primaryColor}80` 
                  : 'rgba(255,255,255,0.1)',
              boxShadow: s.active ? `0 4px 12px ${primaryGlow}` : 'none'
            }}
          >
            {s.done ? (
              <svg className={isSmall ? 'w-3 h-3' : 'w-4 h-4'} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            ) : s.num}
          </div>
          
          {!isSmall && (
            <span 
              className={`text-sm font-semibold tracking-wide transition-colors ${
                s.active ? (sidebarLuminance ? 'text-black' : 'text-white') : s.done ? sidebarMuted : sidebarSubtle
              }`}
              style={{ color: s.active ? sidebarText : (s.done ? sidebarMuted : sidebarSubtle) }}
            >
              {s.label}
            </span>
          )}
          
          {!isSmall && idx < steps.length - 1 && (
            <div 
              className="absolute left-[22px] top-full h-4 w-0.5 -mt-1"
              style={{ backgroundColor: s.done ? primaryColor : (sidebarLuminance ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.1)') }}
            />
          )}
        </div>
      ))}
    </div>
  );
}
