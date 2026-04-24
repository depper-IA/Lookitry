'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Zap, Trash2 } from 'lucide-react';

interface ConfirmState {
  kind: 'trigger' | 'delete';
  title: string;
  message: string;
  confirmLabel: string;
  postId?: string;
}

interface ConfirmModalProps {
  confirmState: ConfirmState | null;
  onClose: () => void;
  onConfirm: () => void;
}

export default function ConfirmModal({ confirmState, onClose, onConfirm }: ConfirmModalProps) {
  return (
    <AnimatePresence>
      {confirmState && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-lg rounded-[3rem] border border-[var(--border-color)] overflow-hidden shadow-2xl bg-[var(--bg-card)]"
          >
            <div className="p-10 text-center">
              <div className={`w-20 h-20 rounded-[2.2rem] mx-auto mb-6 flex items-center justify-center shadow-inner ${
                confirmState.kind === 'trigger' ? 'bg-[var(--accent)]/10 text-[var(--accent)]' : 'bg-red-500/10 text-red-500'
              }`}>
                {confirmState.kind === 'trigger' ? <Zap className="w-10 h-10 fill-current" /> : <Trash2 className="w-10 h-10" />}
              </div>

              <h3 className="font-jakarta text-3xl font-black tracking-tight mb-4 text-[var(--text-primary)]">
                {confirmState.title}
              </h3>

              <p className="text-sm font-medium opacity-60 leading-relaxed mb-8 text-[var(--text-primary)]">
                {confirmState.message}
              </p>

              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={onClose}
                  className="flex-1 px-8 py-4 rounded-2xl border border-[var(--border-color)] font-black text-[11px] uppercase tracking-widest hover:bg-black/5 dark:hover:bg-white/5 transition-all text-[var(--text-primary)]"
                >
                  Retroceder
                </button>
                <button
                  onClick={onConfirm}
                  className={`flex-1 px-8 py-4 rounded-2xl text-white font-black text-[11px] uppercase tracking-widest shadow-xl transition-all hover:scale-[1.02] active:scale-95 ${
                    confirmState.kind === 'trigger' ? 'bg-[var(--accent)] shadow-[var(--accent)]/20' : 'bg-red-500 shadow-red-500/20'
                  }`}
                >
                  {confirmState.confirmLabel}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}