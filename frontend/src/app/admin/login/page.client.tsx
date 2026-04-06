'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import GoogleSignInButton from '@/components/auth/GoogleSignInButton';

export const dynamic = 'force-dynamic';

export default function AdminLoginPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setError('Por favor, ingresa un email válido');
      setLoading(false);
      return;
    }

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'https://api.lookitry.com'}/api/admin/auth/login`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
          credentials: 'include',
        }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Error al iniciar sesión');

      localStorage.setItem('adminUser', JSON.stringify(data.admin));
      router.push('/admin/dashboard');
    } catch (err: any) {
      setError(err.message || 'Error al iniciar sesión');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12" style={{ backgroundColor: '#0a0a0a' }}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="w-full max-w-md"
      >
        <div className="flex justify-center mb-8">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="relative h-11 w-11 shrink-0">
                <Image src="/Lookitry-logo-dark.svg" alt="Lookitry" fill className="object-contain dark:hidden" priority />
                <Image src="/logo.svg" alt="Lookitry" fill className="hidden object-contain dark:block" priority />
              </div>
              <span className="font-jakarta font-extrabold text-xl text-white tracking-tight">
                Look<span style={{ color: '#FF5C3A' }}>itry</span>
              </span>
          </Link>
        </div>

        <div
          className="relative overflow-hidden rounded-[2rem] border p-8 md:p-10"
          style={{
            backgroundColor: 'var(--bg-card)',
            borderColor: 'var(--border-color)',
            boxShadow: '0 25px 60px rgba(0,0,0,0.15)',
          }}
        >
          <div className="absolute right-0 top-0 h-32 w-32 rounded-full bg-[#FF5C3A]/5 blur-3xl pointer-events-none" />

          <div className="relative">
            <div className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1 mb-6 text-[10px] font-black uppercase tracking-[0.2em]"
              style={{
                backgroundColor: 'rgba(255,92,58,0.08)',
                borderColor: 'rgba(255,92,58,0.2)',
                color: '#FF5C3A',
              }}
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              Panel de administración
            </div>

            <motion.h2
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="font-jakarta font-bold text-[22px] mb-1"
              style={{ color: 'var(--text-primary)' }}
            >
              Acceso admin
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="text-[13px] mb-7"
              style={{ color: 'var(--text-muted)' }}
            >
              Área restringida — solo administradores
            </motion.p>

            <div className="mb-6">
              <GoogleSignInButton
                mode="login"
                variant="admin"
                onSuccess={() => router.push('/admin/dashboard')}
                onError={(err) => setError(err)}
              />
              <div className="flex items-center gap-4 my-5">
                <div className="flex-1 h-px" style={{ backgroundColor: 'var(--border-color)' }} />
                <span className="text-[11px] uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>o continúa con correo</span>
                <div className="flex-1 h-px" style={{ backgroundColor: 'var(--border-color)' }} />
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
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
                  {error}
                </motion.div>
              )}

              <div>
                <label htmlFor="email" className="block text-[13px] font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>
                  Email
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  value={formData.email}
                  onChange={e => setFormData({ ...formData, email: e.target.value })}
                  className="block w-full px-4 py-3 rounded-xl border text-[13px] outline-none transition-colors"
                  style={{
                    backgroundColor: 'var(--bg-input)',
                    borderColor: 'var(--border-color)',
                    color: 'var(--text-primary)',
                  }}
                  placeholder="admin@ejemplo.com"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label htmlFor="password" className="block text-[13px] font-medium" style={{ color: 'var(--text-secondary)' }}>
                    Contraseña
                  </label>
                  <Link href="/admin/forgot-password" className="text-[12px] transition-colors hover:text-[#FF5C3A]" style={{ color: 'var(--text-muted)' }}>
                    Recuperar contraseña
                  </Link>
                </div>
                <div className="relative">
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={formData.password}
                    onChange={e => setFormData({ ...formData, password: e.target.value })}
                    className="block w-full px-4 py-3 pr-12 rounded-xl border text-[13px] outline-none transition-colors"
                    style={{
                      backgroundColor: 'var(--bg-input)',
                      borderColor: 'var(--border-color)',
                      color: 'var(--text-primary)',
                    }}
                    placeholder="Contraseña"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(v => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 transition-colors hover:text-[#FF5C3A]"
                    style={{ color: 'var(--text-muted)' }}
                    tabIndex={-1}
                    aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                  >
                    {showPassword ? (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                      </svg>
                    ) : (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              <motion.button
                type="submit"
                disabled={loading}
                whileHover={{ scale: loading ? 1 : 1.01 }}
                whileTap={{ scale: loading ? 1 : 0.98 }}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-[13px] font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed mt-2"
                style={{ backgroundColor: '#FF5C3A', color: 'white' }}
              >
                {loading && (
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth={4} />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                )}
                {loading ? 'Iniciando sesión...' : 'Iniciar sesión'}
              </motion.button>
            </form>

            <p className="text-center text-[12px] mt-6" style={{ color: 'var(--text-muted)' }}>
              <Link href="/" className="hover:text-[#FF5C3A] transition-colors">
                Volver al inicio
              </Link>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
