'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, X, Sparkles, ArrowRight } from 'lucide-react';
import Link from 'next/link';

interface PostDemoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLeadCaptured: () => void;
}

interface FormState {
  email: string;
  nombre_marca: string;
}

interface FormErrors {
  email?: string;
}

// Validation
function validateEmail(value: string): string | undefined {
  if (!value.trim()) return 'El email es requerido';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return 'Email inválido';
  return undefined;
}

// Custom cubic-bezier for fluid physics (no linear/ease-in-out)
const BACKDROP_VARIANTS = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { duration: 0.3, ease: [0.32, 0.72, 0, 1] as [number, number, number, number] }
  },
  exit: {
    opacity: 0,
    transition: { duration: 0.2, ease: [0.32, 0.72, 0, 1] as [number, number, number, number] }
  },
};

const MODAL_VARIANTS = {
  hidden: {
    opacity: 0,
    scale: 0.95,
    y: 10,
  },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: {
      type: 'spring' as const,
      stiffness: 400,
      damping: 30,
      mass: 1,
    },
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
        className="relative h-full rounded-[calc(2rem-0.375rem)] bg-dark-surface p-8"
        style={{ borderRadius: 'calc(2rem - 0.375rem)' }}
      >
        {children}
      </div>
    </div>
  );
}

export function PostDemoModal({ isOpen, onClose, onLeadCaptured }: PostDemoModalProps) {
  const [formData, setFormData] = useState<FormState>({
    email: '',
    nombre_marca: '',
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState(false);
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success'>('idle');

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    if (touched && errors[name as keyof FormErrors]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  }, [touched, errors]);

  const handleBlur = useCallback((e: React.FocusEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setTouched(true);
    const fieldError = validateEmail(value);
    setErrors((prev) => ({ ...prev, [name]: fieldError }));
  }, []);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setTouched(true);

    const emailError = validateEmail(formData.email);
    if (emailError) {
      setErrors({ email: emailError });
      return;
    }

    setStatus('submitting');

    try {
      const res = await fetch('/api/leads/public', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nombre: formData.nombre_marca || 'No especificado',
          email: formData.email,
          nombre_negocio: formData.nombre_marca || 'No especificado',
          tipo_negocio: 'otro',
          source: 'post_demo_capture',
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Error al enviar');
      }

      setStatus('success');
      onLeadCaptured();
    } catch (err: any) {
      console.error('[PostDemoModal] Submit error:', err);
      // Still mark as captured on error to not annoy user
      onLeadCaptured();
    }
  }, [formData, onLeadCaptured]);

  const handleDecline = useCallback(() => {
    localStorage.setItem('lead_captured', 'true');
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
          aria-labelledby="post-demo-title"
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
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-accent/10">
                    <Sparkles className="h-6 w-6 text-accent" />
                  </div>
                  <h3 id="post-demo-title" className="mb-2 font-jakarta text-xl font-bold text-white">
                    ¡Resultado enviado!
                  </h3>
                  <p className="mb-6 text-sm text-white/60">
                    Te contactaremos pronto. Mientras tanto, explora nuestra plataforma.
                  </p>
                  <Link
                    href="/planes"
                    onClick={handleDecline}
                    className="flex items-center gap-2 rounded-xl bg-accent px-6 py-3 text-sm font-bold text-white transition-all hover:bg-accent-bright"
                  >
                    Ver planes
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              ) : (
                /* Form State */
                <form onSubmit={handleSubmit} className="text-center">
                  {/* Header Icon */}
                  <div className="mb-5 flex items-center justify-center">
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-accent/10">
                      <Sparkles className="h-7 w-7 text-accent" />
                    </div>
                  </div>

                  {/* Title & Description */}
                  <h3 id="post-demo-title" className="mb-2 font-jakarta text-xl font-bold text-white">
                    ¿Quieres recibir tu resultado?
                  </h3>
                  <p className="mb-6 text-sm text-white/50">
                    Déjanos tu email y te enviaremos el resultado de tu prueba + una oferta especial.
                  </p>

                  {/* Form Fields */}
                  <div className="space-y-4">
                    <div>
                      <input
                        id="email"
                        name="email"
                        type="email"
                        value={formData.email}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        placeholder="tu@email.com"
                        disabled={status === 'submitting'}
                        className={`
                          w-full rounded-xl border bg-white/5 px-4 py-3.5
                          text-sm text-white placeholder:text-white/20
                          transition-all duration-200
                          disabled:opacity-50
                          focus:outline-none
                          ${errors.email
                            ? 'border-red-500/50 bg-red-500/5'
                            : 'border-white/10 hover:border-white/20 focus:border-accent/50 focus:bg-accent/5 focus:ring-2 focus:ring-accent/20'
                          }
                        `}
                        aria-invalid={!!errors.email}
                        aria-describedby={errors.email ? 'email-error' : undefined}
                      />
                      {errors.email && (
                        <p id="email-error" className="mt-1.5 text-[10px] text-red-400" role="alert">
                          {errors.email}
                        </p>
                      )}
                    </div>

                    <div>
                      <input
                        id="nombre_marca"
                        name="nombre_marca"
                        type="text"
                        value={formData.nombre_marca}
                        onChange={handleChange}
                        placeholder="Tu marca (opcional)"
                        disabled={status === 'submitting'}
                        className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3.5 text-sm text-white placeholder:text-white/20 transition-all duration-200 hover:border-white/20 focus:border-accent/50 focus:bg-accent/5 focus:outline-none focus:ring-2 focus:ring-accent/20 disabled:opacity-50"
                      />
                    </div>
                  </div>

                  {/* CTA Buttons */}
                  <div className="mt-6 flex flex-col gap-3">
                    <button
                      type="submit"
                      disabled={status === 'submitting'}
                      className="flex items-center justify-center gap-2 rounded-xl bg-accent px-6 py-3.5 text-sm font-bold uppercase tracking-wider text-white transition-all hover:bg-accent-bright disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {status === 'submitting' ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Enviando...
                        </>
                      ) : (
                        <>
                          Enviar resultado
                          <ArrowRight className="h-4 w-4" />
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={handleDecline}
                      className="text-[11px] font-medium uppercase tracking-widest text-white/30 transition-colors hover:text-white/50"
                    >
                      No gracias, solo explorar
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

export default PostDemoModal;