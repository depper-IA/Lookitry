'use client';

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, X, Mail, ArrowRight } from 'lucide-react';
import { cn } from '@/utils/cn';

interface ExitIntentPopupProps {
  isOpen: boolean;
  onClose: () => void;
  onLeadCaptured: () => void;
}

interface FormErrors {
  email?: string;
}

// Validation
function validateEmail(value: string): string | undefined {
  if (!value.trim()) return 'El email es requerido';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return 'Email invalido';
  return undefined;
}

// Custom cubic-bezier for fluid physics
const BACKDROP_VARIANTS = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { duration: 0.3, ease: [0.32, 0.72, 0, 1] as [number, number, number, number] },
  },
  exit: {
    opacity: 0,
    transition: { duration: 0.2, ease: [0.32, 0.72, 0, 1] as [number, number, number, number] },
  },
};

const MODAL_VARIANTS = {
  hidden: { opacity: 0, scale: 0.95, y: 10 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { type: 'spring' as const, stiffness: 400, damping: 30, mass: 1 },
  },
  exit: {
    opacity: 0,
    scale: 0.95,
    y: 10,
    transition: { duration: 0.2, ease: [0.32, 0.72, 0, 1] as [number, number, number, number] },
  },
};

// Double-Bezel Card Component
function DoubleBezelCard({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative overflow-hidden rounded-[2rem] bg-black/5 ring-1 ring-white/10 p-1.5">
      <div
        className="relative h-full rounded-[calc(2rem-0.375rem)] bg-[#141414] p-8"
        style={{ borderRadius: 'calc(2rem - 0.375rem)' }}
      >
        {children}
      </div>
    </div>
  );
}

export function ExitIntentPopup({ isOpen, onClose, onLeadCaptured }: ExitIntentPopupProps) {
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string>();
  const [touched, setTouched] = useState(false);
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success'>('idle');

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value);
    if (touched && error) setError(undefined);
  }, [touched, error]);

  const handleBlur = useCallback(() => {
    setTouched(true);
    setError(validateEmail(email));
  }, [email]);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setTouched(true);
    const emailError = validateEmail(email);
    if (emailError) { setError(emailError); return; }
    setStatus('submitting');
    try {
      const res = await fetch('/api/leads/public', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          nombre: 'Anonimo',
          nombre_negocio: 'No especificado',
          tipo_negocio: 'otro',
          source: 'exit_intent',
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'Error al enviar');
      setStatus('success');
      onLeadCaptured();
    } catch (err: any) {
      console.error('[ExitIntentPopup] Submit error:', err);
      onLeadCaptured();
    }
  }, [email, onLeadCaptured]);

  const handleDecline = useCallback(() => {
    localStorage.setItem('exit_intent_captured', 'true');
    onClose();
  }, [onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-[200] flex items-center justify-center p-4"
          variants={BACKDROP_VARIANTS}
          initial="hidden"
          animate="visible"
          exit="exit"
          style={{ backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(20px)' }}
          role="dialog"
          aria-modal="true"
          aria-labelledby="exit-intent-title"
        >
          <motion.div
            className="relative w-full max-w-md"
            variants={MODAL_VARIANTS}
            initial="hidden"
            animate="visible"
            exit="exit"
            onClick={(e) => e.stopPropagation()}
          >
            <DoubleBezelCard>
              {/* Close Button */}
              <button
                onClick={handleDecline}
                className="absolute top-4 right-4 flex h-8 w-8 items-center justify-center rounded-full bg-white/5 text-white/40 transition-all hover:bg-white/10 hover:text-white"
                aria-label="Cerrar"
              >
                <X className="h-4 w-4" />
              </button>

              {status === 'success' ? (
                /* Success State */
                <div className="flex flex-col items-center py-6 text-center">
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-[#FF5C3A]/10">
                    <Mail className="h-6 w-6 text-[#FF5C3A]" />
                  </div>
                  <h3 id="exit-intent-title" className="mb-2 font-jakarta text-xl font-bold text-white">
                    Estas en la lista
                  </h3>
                  <p className="mb-6 text-sm text-white/60">
                    Te mantendremos informado. Hasta la proxima.
                  </p>
                  <button
                    onClick={handleDecline}
                    className="text-[11px] font-medium uppercase tracking-widest text-white/30 transition-colors hover:text-white/50"
                  >
                    Continuar navegando
                  </button>
                </div>
              ) : (
                /* Form State */
                <form onSubmit={handleSubmit} className="text-center">
                  {/* Header Icon */}
                  <div className="mb-5 flex items-center justify-center">
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#FF5C3A]/10">
                      <Mail className="h-7 w-7 text-[#FF5C3A]" />
                    </div>
                  </div>

                  {/* Title & Description */}
                  <h3 id="exit-intent-title" className="mb-2 font-jakarta text-xl font-bold text-white">
                    Antes de irte...
                  </h3>
                  <p className="mb-6 text-sm text-white/50">
                    Suscribete para recibir contenido exclusivo sobre moda y tecnologia. Sin spam, lo prometemos.
                  </p>

                  {/* Form Field */}
                  <div className="mb-6">
                    <input
                      id="exit-email"
                      name="email"
                      type="email"
                      value={email}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      placeholder="tu@email.com"
                      disabled={status === 'submitting'}
                      className={cn(
                        "w-full rounded-xl border bg-white/5 px-4 py-3.5",
                        "text-sm text-white placeholder:text-white/20",
                        "transition-all duration-200 disabled:opacity-50",
                        "focus:outline-none focus:ring-2",
                        error
                          ? 'border-red-500/50 bg-red-500/5'
                          : 'border-white/10 hover:border-white/20 focus:border-[#FF5C3A]/50 focus:ring-[#FF5C3A]/20'
                      )}
                      aria-invalid={!!error}
                      aria-describedby={error ? 'exit-email-error' : undefined}
                    />
                    {error && (
                      <p id="exit-email-error" className="mt-1.5 text-[10px] text-red-400" role="alert">
                        {error}
                      </p>
                    )}
                  </div>

                  {/* CTA Buttons */}
                  <div className="flex flex-col gap-3">
                    <button
                      type="submit"
                      disabled={status === 'submitting'}
                      className="flex items-center justify-center gap-2 rounded-xl bg-[#FF5C3A] px-6 py-3.5 text-sm font-bold uppercase tracking-wider text-white transition-all hover:bg-[#ff7b5e] disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {status === 'submitting' ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Suscribiendo...
                        </>
                      ) : (
                        <>
                          Mantenerme informado
                          <ArrowRight className="h-4 w-4" />
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={handleDecline}
                      className="text-[11px] font-medium uppercase tracking-widest text-white/30 transition-colors hover:text-white/50"
                    >
                      No gracias
                    </button>
                  </div>
                </form>
              )}
            </DoubleBezelCard>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default ExitIntentPopup;