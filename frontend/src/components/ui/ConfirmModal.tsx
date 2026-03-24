'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from './Button';
import { AlertCircle, X, Trash2 } from 'lucide-react';

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'warning' | 'info';
  isLoading?: boolean;
}

export function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = 'Confirmar',
  cancelLabel = 'Cancelar',
  variant = 'danger',
  isLoading = false
}: ConfirmModalProps) {
  const colors = {
    danger: {
      bg: 'bg-rose-500/10',
      border: 'border-rose-500/20',
      text: 'text-rose-500',
      button: 'bg-rose-500 hover:bg-rose-600 shadow-rose-500/30'
    },
    warning: {
      bg: 'bg-amber-500/10',
      border: 'border-amber-500/20',
      text: 'text-amber-500',
      button: 'bg-amber-500 hover:bg-amber-600 shadow-amber-500/30'
    },
    info: {
      bg: 'bg-indigo-500/10',
      border: 'border-indigo-500/20',
      text: 'text-indigo-500',
      button: 'bg-[#FF5C3A] hover:bg-[#FF5C3A]/90 shadow-[#FF5C3A]/30'
    }
  };

  const activeColors = colors[variant];

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[9999]"
          />
          <div className="fixed inset-0 flex items-center justify-center pointer-events-none z-[10000] p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="w-full max-w-md bg-[var(--bg-card)] border border-[var(--border-color)] rounded-[3rem] p-10 pointer-events-auto relative overflow-hidden shadow-4xl"
            >
              {/* Glossy Background Effect */}
              <div className={`absolute top-0 left-0 w-full h-[300px] ${activeColors.bg} blur-[80px] -z-10`} />
              
              <button 
                onClick={onClose}
                className="absolute top-8 right-8 p-3 rounded-full hover:bg-white/5 transition-colors text-[var(--text-muted)]"
              >
                <X size={20} />
              </button>

              <div className="space-y-8">
                <div className="flex flex-col items-center text-center space-y-6">
                  <div className={`w-20 h-20 rounded-[2.5rem] ${activeColors.bg} flex items-center justify-center border ${activeColors.border} shadow-inner`}>
                    <Trash2 className={`w-8 h-8 ${activeColors.text}`} />
                  </div>
                  
                  <div className="space-y-3">
                    <h3 className="text-3xl font-[950] text-[var(--text-primary)] uppercase tracking-tighter italic leading-none">
                      {title}
                    </h3>
                    <p className="text-[11px] font-black uppercase text-[var(--text-muted)] tracking-[0.2em] leading-relaxed">
                      {message}
                    </p>
                  </div>
                </div>

                <div className="flex gap-4 pt-4">
                  <button
                    onClick={onClose}
                    className="flex-1 px-8 py-5 bg-[var(--bg-input)] text-[var(--text-primary)] border border-[var(--border-color)] rounded-2xl font-black uppercase tracking-widest text-[10px] hover:border-[#FF5C3A]/30 transition-all active:scale-95"
                  >
                    {cancelLabel}
                  </button>
                  <button
                    onClick={onConfirm}
                    disabled={isLoading}
                    className={`flex-1 px-8 py-5 text-white ${activeColors.button} rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-2xl transition-all active:scale-95 flex items-center justify-center gap-2`}
                  >
                    {isLoading ? (
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      confirmLabel
                    )}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
