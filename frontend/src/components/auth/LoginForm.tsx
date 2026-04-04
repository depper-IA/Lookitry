'use client';

import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { authService } from '@/services/auth.service';
import Link from 'next/link';
import Image from 'next/image';
import GoogleSignInButton from './GoogleSignInButton';

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

export default function LoginForm({ redirectTo = '/dashboard' }: { redirectTo?: string }) {
  const { login, isLoading, error } = useAuth();
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [showPassword, setShowPassword] = useState(false);
  const [resending, setResending] = useState(false);
  const [resendSuccess, setResendSuccess] = useState<string | null>(null);
  const [showResendBtn, setShowResendBtn] = useState(false);
  const [googleError, setGoogleError] = useState<string | null>(null);

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
    setResendSuccess(null);
    setShowResendBtn(false);
    try { 
      await login(formData, redirectTo); 
    } catch (err: any) {
      const msg = err.message || '';
      if (msg.includes('verificar') || msg.includes('EMAIL_NOT_VERIFIED')) {
        setShowResendBtn(true);
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
    <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-[#0a0a0a]">
      <div className="w-full max-w-md">

        {/* Logo */}
        <div className="flex justify-center mb-8">
          <Link href="/" className="flex items-center gap-2.5">
            <Image src="/logo.svg" alt="Lookitry" width={28} height={28} className="object-contain h-7 w-auto" priority />
            <span className="font-jakarta font-extrabold text-xl text-white tracking-tight">
              Look<span className="text-[#FF5C3A]">itry</span>
            </span>
          </Link>
        </div>

        <div className="bg-[#141414] border border-[#2a2a2a] rounded-xl p-7 md:p-8">
          <h2 className="font-jakarta font-bold text-[22px] text-white mb-1 uppercase tracking-tight">
            Iniciar sesión
          </h2>
          <p className="text-[13px] text-[#999] mb-7 font-medium">
            Accede a tu dashboard de probador virtual profesional
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="bg-[#1f0f0f] border border-[#5a1a1a] text-[#ff6b6b] text-[13px] px-4 py-3 rounded-lg flex flex-col gap-2">
                <p>{error}</p>
                {showResendBtn && (
                  <button
                    type="button"
                    onClick={handleResend}
                    disabled={resending}
                    className="text-left text-white/90 underline hover:text-white font-bold disabled:opacity-50 transition-colors"
                  >
                    {resending ? 'Enviando...' : 'Reenviar email de verificación'}
                  </button>
                )}
              </div>
            )}

            {resendSuccess && (
              <div className="bg-green-500/10 border border-green-500/30 text-green-500 text-[13px] px-4 py-3 rounded-lg font-medium">
                {resendSuccess}
              </div>
            )}

            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-[11px] font-bold text-[#888] mb-1.5 uppercase tracking-widest">
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                className={`block w-full px-4 py-3 bg-[#0f0f0f] border ${
                  validationErrors.email ? 'border-red-900/50' : 'border-[#2a2a2a]'
                } rounded-lg text-white text-[14px] placeholder-[#666] focus:outline-none focus:border-[#FF5C3A] transition-colors`}
                placeholder="tu@tienda.com"
                value={formData.email}
                onChange={handleChange}
              />
              {validationErrors.email && (
                <p className="mt-1 text-[11px] text-red-500">{validationErrors.email}</p>
              )}
            </div>

            {/* Contraseña */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label htmlFor="password" className="block text-[11px] font-bold text-[#888] uppercase tracking-widest">
                  Contraseña
                </label>
                <Link href={`/auth/forgot-password${redirectTo && redirectTo !== '/dashboard' ? `?redirect=${encodeURIComponent(redirectTo)}` : ''}`} className="text-[11px] text-[#999] hover:text-[#FF5C3A] transition-colors">
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
                  className={`block w-full px-4 py-3 pr-10 bg-[#0f0f0f] border ${
                    validationErrors.password ? 'border-red-900/50' : 'border-[#2a2a2a]'
                  } rounded-lg text-white text-[14px] placeholder-[#666] focus:outline-none focus:border-[#FF5C3A] transition-colors`}
                  placeholder="********"
                  value={formData.password}
                  onChange={handleChange}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#999] hover:text-[#FF5C3A] focus:outline-none focus-visible:text-[#FF5C3A] transition-colors"
                  aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                  title={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                >
                  {showPassword ? <EyeOffIcon /> : <EyeIcon />}
                </button>
              </div>
              {validationErrors.password && (
                <p className="mt-1 text-[11px] text-red-500">{validationErrors.password}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-4 bg-[#FF5C3A] hover:bg-[#ff785c] disabled:opacity-50 disabled:cursor-not-allowed text-white text-[14px] font-bold rounded-lg transition-all shadow-lg hover:shadow-[#FF5C3A]/20 mt-4 uppercase tracking-wider"
            >
              {isLoading ? 'Iniciando sesión...' : 'Iniciar sesión'}
            </button>
          </form>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/10" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-[#141414] px-3 text-[#666]">o continúa con</span>
            </div>
          </div>

          {/* Google Sign-In */}
          <GoogleSignInButton
            mode="login"
            onError={(msg) => setGoogleError(msg)}
          />
          {googleError && (
            <p className="mt-2 text-[11px] text-red-500 text-center">{googleError}</p>
          )}

          <p className="text-center text-[13px] text-[#999] mt-8">
            ¿No tienes cuenta?{' '}
            <Link href={`/checkout?plan=TRIAL${redirectTo && redirectTo !== '/dashboard' ? `&redirect=${encodeURIComponent(redirectTo)}` : ''}`} className="text-[#FF5C3A] hover:text-white transition-colors font-bold">
              Regístrate aquí
            </Link>
          </p>
        </div>

      </div>
    </div>
  );
}
