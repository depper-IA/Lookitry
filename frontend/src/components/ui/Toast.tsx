'use client';

import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, XCircle, Info, AlertTriangle, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

interface ToastProps {
  show: boolean;
  message: string;
  type?: ToastType;
  onClose: () => void;
  duration?: number;
}

export function Toast({
  show,
  message,
  type = 'info',
  onClose,
  duration = 5000
}: ToastProps) {
  useEffect(() => {
    if (show && duration > 0) {
      const timer = setTimeout(onClose, duration);
      return () => clearTimeout(timer);
    }
  }, [show, duration, onClose]);

  const configs = {
    success: {
      bg: 'bg-emerald-950/90',
      border: 'border-emerald-500/50',
      icon: <CheckCircle className="w-5 h-5 text-emerald-400" />,
      accent: 'bg-emerald-500'
    },
    error: {
      bg: 'bg-red-950/90',
      border: 'border-red-500/50',
      icon: <XCircle className="w-5 h-5 text-red-400" />,
      accent: 'bg-red-500'
    },
    warning: {
      bg: 'bg-amber-950/90',
      border: 'border-amber-500/50',
      icon: <AlertTriangle className="w-5 h-5 text-amber-400" />,
      accent: 'bg-amber-500'
    },
    info: {
      bg: 'bg-dark-surface/90',
      border: 'border-accent/50',
      icon: <Info className="w-5 h-5 text-accent" />,
      accent: 'bg-accent'
    }
  };

  const config = configs[type];

  return (
    <AnimatePresence>
      {show && (
        <div className="fixed top-6 right-6 z-[10001] pointer-events-none min-w-[320px] max-w-[420px]">
          <motion.div
            initial={{ opacity: 0, x: 50, scale: 0.9 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 20, scale: 0.95, transition: { duration: 0.2 } }}
            className={`pointer-events-auto relative overflow-hidden backdrop-blur-xl border ${config.border} ${config.bg} p-4 rounded-2xl shadow-2xl flex items-center gap-4`}
          >
            {/* Accent line */}
            <div className={`absolute left-0 top-0 bottom-0 w-1 ${config.accent} opacity-100`} />
            
            <div className="flex-shrink-0">
              {config.icon}
            </div>
            
            <div className="flex-1 pr-2">
              <p className="text-[13px] font-bold text-white tracking-tight leading-snug">
                {message}
              </p>
            </div>

            <button 
              onClick={onClose}
              className="flex-shrink-0 p-1 rounded-lg hover:bg-white/10 transition-colors text-white/40 hover:text-white"
            >
              <X size={16} />
            </button>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
