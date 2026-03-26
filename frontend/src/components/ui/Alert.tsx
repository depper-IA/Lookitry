import React from 'react';

interface AlertProps {
  type?: 'success' | 'error' | 'warning' | 'info';
  title?: string;
  message: string | React.ReactNode;
  className?: string;
}

export const Alert: React.FC<AlertProps> = ({ type = 'info', title, message, className = '' }) => {
  const configs = {
    success: {
      bg: 'bg-[#0d1f0d]/30',
      border: 'border-emerald-500/20',
      accent: 'bg-emerald-500',
      icon: (
        <svg className="w-5 h-5 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
        </svg>
      )
    },
    error: {
      bg: 'bg-[#1f0d0d]/30',
      border: 'border-red-500/20',
      accent: 'bg-red-500',
      icon: (
        <svg className="w-5 h-5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )
    },
    warning: {
      bg: 'bg-[#1f1a0d]/30',
      border: 'border-amber-500/20',
      accent: 'bg-amber-500',
      icon: (
        <svg className="w-5 h-5 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      )
    },
    info: {
      bg: 'bg-[#0d161f]/30',
      border: 'border-[#FF5C3A]/20',
      accent: 'bg-[#FF5C3A]',
      icon: (
        <svg className="w-5 h-5 text-[#FF5C3A]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )
    }
  };

  const config = configs[type];

  return (
    <div className={`relative overflow-hidden rounded-xl border ${config.border} ${config.bg} backdrop-blur-md p-4 md:p-5 ${className}`}>
      {/* Accent line */}
      <div className={`absolute left-0 top-0 bottom-0 w-1 ${config.accent} opacity-40`} />
      
      <div className="flex gap-3 md:gap-4">
        <div className="flex-shrink-0 mt-0.5">
          {config.icon}
        </div>
        <div className="flex-1 space-y-0.5">
          {title && (
            <h3 className="font-syne font-bold text-[14px] md:text-[15px] text-white tracking-tight">
              {title}
            </h3>
          )}
          <div className="text-[12.5px] md:text-[13px] text-[#888] leading-relaxed">
            {message}
          </div>
        </div>
      </div>
    </div>
  );
};
