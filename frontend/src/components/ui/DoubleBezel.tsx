'use client';
import React from 'react';

interface DoubleBezelProps {
  children: React.ReactNode;
  className?: string;
  innerClassName?: string;
}

export function DoubleBezel({ children, className = '', innerClassName = '' }: DoubleBezelProps) {
  return (
    <div className={`relative p-[1px] rounded-3xl overflow-hidden shadow-lg transition-all duration-700 ease-[cubic-bezier(0.32, 0.72, 0, 1)] ${className}`}>
      {/* Outer Shell (Glassmorphism + Subtle Gradient) */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent backdrop-blur-sm" />
      
      {/* Inner Core */}
      <div className={`relative bg-[var(--bg-card)] rounded-[22px] border border-white/5 ${innerClassName}`}>
        {children}
      </div>
    </div>
  );
}
