'use client';

import { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Loader2, X, Download, ArrowRight } from 'lucide-react';
import { cn } from '@/utils/cn';
import { useTheme } from './BlogThemeWrapper';

interface LeadMagnetBannerProps {
  title?: string;
  description?: string;
}

interface FormState {
  email: string;
  nombre: string;
}

interface FormErrors {
  email?: string;
  nombre?: string;
}

const DEFAULT_TITLE = 'Descarga nuestra guia paso a paso';
const DEFAULT_DESCRIPTION = 'Recibe contenido exclusivo sobre moda y tecnologia';

// Validation
function validateEmail(value: string): string | undefined {
  if (!value.trim()) return 'El email es requerido';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return 'Email invalido';
  return undefined;
}

function validateNombre(value: string): string | undefined {
  if (value.trim().length > 0 && value.trim().length < 2) return 'Minimo 2 caracteres';
  return undefined;
}

// Custom cubic-bezier for fluid physics
const CONTAINER_VARIANTS = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      ease: [0.32, 0.72, 0, 1] as [number, number, number, number],
    },
  },
};

const INPUT_VARIANTS = {
  hidden: { opacity: 0, x: -10 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { delay: 0.1, duration: 0.3 },
  },
};

export function LeadMagnetBanner({
  title = DEFAULT_TITLE,
  description = DEFAULT_DESCRIPTION,
}: LeadMagnetBannerProps) {
  const { isDark } = useTheme();
  const [formData, setFormData] = useState<FormState>({ email: '', nombre: '' });
  const [errors, setErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState(false);
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success'>('idle');
  const [isCollapsed, setIsCollapsed] = useState(false);

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
    if (name === 'email') setErrors((prev) => ({ ...prev, email: validateEmail(value) }));
    if (name === 'nombre') setErrors((prev) => ({ ...prev, nombre: validateNombre(value) }));
  }, []);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setTouched(true);
    const emailError = validateEmail(formData.email);
    if (emailError) { setErrors({ email: emailError }); return; }
    setStatus('submitting');
    try {
      const res = await fetch('/api/leads/public', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.email,
          nombre: formData.nombre || 'Anonimo',
          nombre_negocio: 'No especificado',
          tipo_negocio: 'otro',
          source: 'blog_lead_magnet',
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'Error al enviar');
      setStatus('success');
      setTimeout(() => setIsCollapsed(true), 2000);
    } catch (err: any) {
      console.error('[LeadMagnetBanner] Submit error:', err);
      setIsCollapsed(true);
    }
  }, [formData]);

  if (isCollapsed) return null;

  return (
    <motion.div
      variants={CONTAINER_VARIANTS}
      initial="hidden"
      animate="visible"
      className={cn(
        "relative overflow-hidden rounded-[2rem] border p-1.5 my-12",
        isDark
          ? "bg-black/5 ring-1 ring-white/10"
          : "bg-white/50 ring-1 ring-black/5"
      )}
    >
      {/* Gradient accent bar */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#FF5C3A]/50 to-transparent" />
      
      <div
        className={cn(
          "relative rounded-[calc(2rem-0.375rem)] p-8 md:p-10",
          isDark ? "bg-[#141414]" : "bg-white"
        )}
        style={{ borderRadius: 'calc(2rem - 0.375rem)' }}
      >
        {status === 'success' ? (
          /* Success State */
          <div className="flex flex-col md:flex-row items-center gap-6">
            <div className={cn(
              "flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl",
              isDark ? "bg-[#FF5C3A]/10" : "bg-[#FF5C3A]/5"
            )}>
              <Download className="h-8 w-8 text-[#FF5C3A]" />
            </div>
            <div className="text-center md:text-left">
              <h3 className={cn(
                "font-plus-jakarta text-xl font-bold",
                isDark ? "text-white" : "text-gray-900"
              )}>
                Guia en camino
              </h3>
              <p className={cn(
                "mt-1 text-sm",
                isDark ? "text-[#999]" : "text-gray-500"
              )}>
                Revisa tu bandeja de entrada en los proximos minutos.
              </p>
            </div>
            <button
              onClick={() => setIsCollapsed(true)}
              className={cn(
                "absolute top-4 right-4 flex h-8 w-8 items-center justify-center rounded-full transition-colors",
                isDark ? "bg-white/5 text-white/40 hover:bg-white/10 hover:text-white" : "bg-black/5 text-black/40 hover:bg-black/10 hover:text-black"
              )}
              aria-label="Cerrar"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ) : (
          /* Form State */
          <div className="flex flex-col md:flex-row md:items-center gap-8">
            {/* Left: Icon + Text */}
            <div className="flex items-center gap-5 md:w-1/2">
              <div className={cn(
                "flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl",
                isDark ? "bg-[#FF5C3A]/10" : "bg-[#FF5C3A]/5"
              )}>
                <Download className="h-7 w-7 text-[#FF5C3A]" />
              </div>
              <div>
                <h3 className={cn(
                  "font-plus-jakarta text-lg font-bold leading-tight",
                  isDark ? "text-white" : "text-gray-900"
                )}>
                  {title}
                </h3>
                <p className={cn(
                  "mt-1 text-sm",
                  isDark ? "text-[#999]" : "text-gray-500"
                )}>
                  {description}
                </p>
              </div>
            </div>

            {/* Right: Form */}
            <form
              onSubmit={handleSubmit}
              className="flex flex-col sm:flex-row gap-3 md:flex-1"
            >
              <div className="flex-1 space-y-1">
                <motion.input
                  variants={INPUT_VARIANTS}
                  initial="hidden"
                  animate="visible"
                  id="lm-email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  placeholder="tu@email.com"
                  disabled={status === 'submitting'}
                  className={cn(
                    "w-full rounded-xl border bg-transparent px-4 py-3 text-sm",
                    "transition-all duration-200 focus:outline-none focus:ring-2",
                    "disabled:opacity-50",
                    isDark
                      ? "text-white placeholder:text-white/20 border-white/10 hover:border-white/20 focus:border-[#FF5C3A]/50 focus:ring-[#FF5C3A]/20"
                      : "text-gray-900 placeholder:text-gray-400 border-black/10 hover:border-black/20 focus:border-[#FF5C3A]/50 focus:ring-[#FF5C3A]/20",
                    errors.email && (isDark ? "border-red-500/50" : "border-red-400/50")
                  )}
                  aria-invalid={!!errors.email}
                  aria-describedby={errors.email ? 'lm-email-error' : undefined}
                />
                {errors.email && (
                  <p id="lm-email-error" className="text-[10px] text-red-400" role="alert">
                    {errors.email}
                  </p>
                )}
              </div>

              <div className="flex-1 space-y-1">
                <input
                  id="lm-nombre"
                  name="nombre"
                  type="text"
                  value={formData.nombre}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  placeholder="Tu nombre (opcional)"
                  disabled={status === 'submitting'}
                  className={cn(
                    "w-full rounded-xl border bg-transparent px-4 py-3 text-sm",
                    "transition-all duration-200 focus:outline-none focus:ring-2",
                    "disabled:opacity-50",
                    isDark
                      ? "text-white placeholder:text-white/20 border-white/10 hover:border-white/20 focus:border-[#FF5C3A]/50 focus:ring-[#FF5C3A]/20"
                      : "text-gray-900 placeholder:text-gray-400 border-black/10 hover:border-black/20 focus:border-[#FF5C3A]/50 focus:ring-[#FF5C3A]/20"
                  )}
                />
              </div>

              <button
                type="submit"
                disabled={status === 'submitting'}
                className={cn(
                  "flex items-center justify-center gap-2 rounded-xl px-6 py-3 text-sm font-bold uppercase tracking-wider text-white transition-all",
                  "disabled:cursor-not-allowed disabled:opacity-50",
                  isDark
                    ? "bg-[#FF5C3A] hover:bg-[#ff7b5e]"
                    : "bg-[#FF5C3A] hover:bg-[#ff7b5e]"
                )}
              >
                {status === 'submitting' ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="hidden sm:inline">Enviando...</span>
                  </>
                ) : (
                  <>
                    Descargar
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>
            </form>

            {/* Close button */}
            <button
              onClick={() => setIsCollapsed(true)}
              className={cn(
                "absolute top-4 right-4 flex h-8 w-8 items-center justify-center rounded-full transition-colors",
                isDark ? "bg-white/5 text-white/40 hover:bg-white/10 hover:text-white" : "bg-black/5 text-black/40 hover:bg-black/10 hover:text-black"
              )}
              aria-label="Cerrar"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>
    </motion.div>
  );
}

export default LeadMagnetBanner;