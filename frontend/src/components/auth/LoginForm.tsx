'use client';

import { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { authService } from '@/services/auth.service';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import GoogleSignInButton from './GoogleSignInButton';
import { loadTurnstileWidget } from '@/lib/turnstile';

function EyeIcon() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
    </svg>
  );
}

function EyeOffIcon() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
    </svg>
  );
}

export default function LoginForm({
  redirectTo = '/dashboard',
  compact = false,
  hideLogo = false,
}: {
  redirectTo?: string;
  compact?: boolean;
  hideLogo?: boolean;
}) {
  const { login, isLoading, error } = useAuth();
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [showPassword, setShowPassword] = useState(false);
  const [resending, setResending] = useState(false);
  const [resendSuccess, setResendSuccess] = useState<string | null>(null);
  const [showResendBtn, setShowResendBtn] = useState(false);

  const [googleError, setGoogleError] = useState<string | null>(null);
  const [localError, setLocalError] = useState<string | null>(null);

  // ── Turnstile state ────────────────────────────────────────────────────
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const turnstileRef = useRef<HTMLDivElement>(null);
  const turnstileInstanceRef = useRef<Awaited<ReturnType<typeof loadTurnstileWidget>>>(null);
  const turnstileLoadedRef = useRef(false);

  // Cargar widget Turnstile al montar
  useEffect(() => {
    if (!process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY) return;
    if (!turnstileRef.current) return;
    if (turnstileLoadedRef.current) return;
    turnstileLoadedRef.current = true;

    loadTurnstileWidget(turnstileRef.current, (token) => {
      console.log('[LoginForm] Turnstile token received');
      setTurnstileToken(token);
    }).then((instance) => {
      if (!instance) {
        console.warn('[LoginForm] Turnstile widget could not be initialized');
      }
      turnstileInstanceRef.current = instance;
    });

    return () => {
      turnstileInstanceRef.current?.remove();
    };
  }, []);

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};
    if (!formData.email) {
      errors.email = 'El email es requerido';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = 'Formato de email inválido';
    }
    if (!formData.password) errors.password = 'La contraseña es requerida';
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    // Validación de Turnstile en Frontend
    if (process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY && !turnstileToken) {
      if (!window.turnstile) {
        setLocalError('El sistema de seguridad de Cloudflare fue bloqueado. Desactiva tu bloqueador de anuncios y recarga la página.');
      } else {
        setLocalError('Por favor, completa la verificación de seguridad.');
      }
      return;
    }

    setResendSuccess(null);
    setShowResendBtn(false);
    try {
      await login({ ...formData, turnstileToken: turnstileToken || undefined }, redirectTo);
    } catch (err: any) {
      const msg = err.message || '';
      if (msg.includes('verificar') || msg.includes('EMAIL_NOT_VERIFIED')) {
        setShowResendBtn(true);
      }
      // Manejar errores de Turnstile
      const data = (err as any)?.response?.data;
      if (data?.error === 'CAPTCHA_REQUIRED' || data?.error === 'CAPTCHA_FAILED') {
        setTurnstileToken(null);
        turnstileInstanceRef.current?.reset();
      }
    }
  };

  const handleResend = async () => {
    if (!formData.email) return;
    setResending(true);
    setResendSuccess(null);
    try {
      const res = await authService.resendVerification(formData.email);
      setResendSuccess(res.message);
      setShowResendBtn(false);
    } catch (err: any) {
      setResendSuccess('Error al reenviar. Intenta de nuevo.');
    } finally {
      setResending(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (validationErrors[name]) {
      setValidationErrors(prev => { const n = { ...prev }; delete n[name]; return n; });
    }
  };

  return (
    <div
      className={`flex items-center justify-center ${compact ? 'px-4 py-6' : 'px-4 py-12'}`}
      style={{ backgroundColor: 'var(--bg-base)' }}
    >
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className={`w-full ${compact ? 'max-w-[340px]' : 'max-w-md'}`}
      >
        {/* Logo - hidden on desktop split-screen */}
        {!hideLogo && (
          <div className={`flex justify-center ${compact ? 'mb-5' : 'mb-8'}`}>
            <Link href="/" className="flex items-center gap-2.5 group">
              <div className="relative h-11 w-11 shrink-0">
                <Image src="/Lookitry-logo-dark.svg" alt="Lookitry" fill className="object-contain dark:hidden" priority />
                <Image src="/logo.svg" alt="Lookitry" fill className="hidden object-contain dark:block" priority />
              </div>
              <span className="font-jakarta font-extrabold text-xl text-white tracking-tight">
                Look<span style={{ color: 'var(--accent)' }}>itry</span>
              </span>
            </Link>
          </div>
        )}

        {/* Card */}
        <div
          className={`relative overflow-hidden rounded-${compact ? '[1.25rem]' : '[2rem]'} border ${compact ? 'p-5 md:p-6' : 'p-8 md:p-10'}`}
          style={{
            backgroundColor: 'var(--bg-card)',
            borderColor: 'var(--border-color)',
            boxShadow: compact ? '0 8px 32px rgba(0,0,0,0.12)' : '0 25px 60px rgba(0,0,0,0.15)',
          }}
        >
          <div className="absolute right-0 top-0 h-32 w-32 rounded-full bg-[var(--accent)]/5 blur-3xl pointer-events-none" />

          <div className="relative">
            <motion.h2
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 }}
              className={`font-jakarta font-bold ${compact ? 'text-[18px] mb-0.5' : 'text-[22px] mb-1'}`}
              style={{ color: 'var(--text-primary)' }}
            >
              Iniciar sesión
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className={`${compact ? 'text-[12px] mb-4' : 'text-[13px] mb-7'}`}
              style={{ color: 'var(--text-muted)' }}
            >
              Accede a tu dashboard de probador virtual
            </motion.p>

            {/* Google Button PRIMERO */}
            <GoogleSignInButton
              mode="login"
              onError={(msg) => {
                // Solo mostrar error si no viene del GoogleSignInButton interno
                // (evitar duplicado con el error que ya muestra el botón)
                if (!msg.includes('Google Sign-In no está configurado')) {
                  setGoogleError(msg);
                }
              }}
            />

            {/* Divider */}
            <div className={`flex items-center gap-3 ${compact ? 'my-3.5' : 'my-5'}`}>
              <div className="flex-1 h-px" style={{ backgroundColor: 'var(--border-color)' }} />
              <span className="text-[10px] uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>o continúa con correo</span>
              <div className="flex-1 h-px" style={{ backgroundColor: 'var(--border-color)' }} />
            </div>

            <form onSubmit={handleSubmit} className={`space-y-${compact ? '3' : '4'}`}>
              {error && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="border px-4 py-3 rounded-xl text-[13px]"
                  style={{
                    backgroundColor: 'rgba(239,68,68,0.08)',
                    borderColor: 'rgba(239,68,68,0.2)',
                    color: '#ef4444',
                  }}
                >
                  <p>{error}</p>
                  {showResendBtn && (
                    <button
                      type="button"
                      onClick={handleResend}
                      disabled={resending}
                      className="text-left underline hover:text-white font-bold disabled:opacity-50 transition-colors mt-1"
                    >
                      {resending ? 'Enviando...' : 'Reenviar email de verificación'}
                    </button>
                  )}
                </motion.div>
              )}

              {resendSuccess && (
                <div className="border px-4 py-3 rounded-xl text-[13px]"
                  style={{
                    backgroundColor: 'rgba(34,197,94,0.08)',
                    borderColor: 'rgba(34,197,94,0.2)',
                    color: '#22c55e',
                  }}
                >
                  {resendSuccess}
                </div>
              )}

              {/* Email */}
              <div>
                <label htmlFor="email" className={`block ${compact ? 'text-[12px] mb-1' : 'text-[13px] font-medium mb-1.5'}`} style={{ color: 'var(--text-secondary)' }}>
                  Email
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  className={`block w-full ${compact ? 'px-3.5 py-2.5 text-[12px]' : 'px-4 py-3 text-[13px]'} rounded-xl border outline-none transition-colors`}
                  style={{
                    backgroundColor: 'var(--bg-input)',
                    borderColor: validationErrors.email ? 'rgba(239,68,68,0.5)' : 'var(--border-color)',
                    color: 'var(--text-primary)',
                  }}
                  placeholder="tu@tienda.com"
                />
                {validationErrors.email && (
                  <p className={`mt-0.5 ${compact ? 'text-[10px]' : 'text-[11px]'} text-red-500`}>{validationErrors.email}</p>
                )}
              </div>

              {/* Password */}
              <div>
                <div className={`flex items-center justify-between ${compact ? 'mb-1' : 'mb-1.5'}`}>
                  <label htmlFor="password" className={`block ${compact ? 'text-[12px]' : 'text-[13px] font-medium'}`} style={{ color: 'var(--text-secondary)' }}>
                    Contraseña
                  </label>
                  <Link href={`/auth/forgot-password${redirectTo && redirectTo !== '/dashboard' ? `?redirect=${encodeURIComponent(redirectTo)}` : ''}`} className={`${compact ? 'text-[11px]' : 'text-[12px]'} transition-colors hover:text-[var(--accent)]`} style={{ color: 'var(--text-muted)' }}>
                    ¿Olvidaste tu contraseña?
                  </Link>
                </div>
                <div className="relative">
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    required
                    value={formData.password}
                    onChange={handleChange}
                    className={`block w-full ${compact ? 'px-3.5 py-2.5 pr-10 text-[12px]' : 'px-4 py-3 pr-12 text-[13px]'} rounded-xl border outline-none transition-colors`}
                    style={{
                      backgroundColor: 'var(--bg-input)',
                      borderColor: validationErrors.password ? 'rgba(239,68,68,0.5)' : 'var(--border-color)',
                      color: 'var(--text-primary)',
                    }}
                    placeholder="********"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(v => !v)}
                    className={`absolute ${compact ? 'right-2.5' : 'right-3'} top-1/2 -translate-y-1/2 transition-colors hover:text-[var(--accent)]`}
                    style={{ color: 'var(--text-muted)' }}
                    tabIndex={-1}
                    aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                  >
                    {showPassword ? <EyeOffIcon /> : <EyeIcon />}
                  </button>
                </div>
                {validationErrors.password && (
                  <p className={`mt-0.5 ${compact ? 'text-[10px]' : 'text-[11px]'} text-red-500`}>{validationErrors.password}</p>
                )}
              </div>

              {/* Cloudflare Turnstile widget - minimal footprint */}
              <div className="py-0 my-0">
                <div ref={turnstileRef} className="[&>div]:!mx-auto [&>iframe]:mx-auto [&>div]:!my-0" />
              </div>

              <motion.button
                type="submit"
                disabled={isLoading}
                whileHover={{ scale: isLoading ? 1 : 1.01 }}
                whileTap={{ scale: isLoading ? 1 : 0.98 }}
                className={`w-full flex items-center justify-center gap-2 ${compact ? 'py-2.5 text-[12px]' : 'py-3 text-[13px]'} rounded-xl font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${compact ? 'mt-1' : 'mt-2'}`}
                style={{ backgroundColor: 'var(--accent)', color: 'white' }}
              >
                {isLoading && (
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth={4} />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                )}
                {isLoading ? 'Iniciando sesión...' : 'Iniciar sesión'}
              </motion.button>
            </form>

            <p className={`text-center ${compact ? 'text-[11px] mt-4' : 'text-[12px] mt-6'}`} style={{ color: 'var(--text-muted)' }}>
              ¿No tienes cuenta?{' '}
              <Link href="/planes" className="text-[var(--accent)] hover:text-white transition-colors font-semibold">
                Ver planes
              </Link>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
