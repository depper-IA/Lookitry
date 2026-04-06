'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';

const API = process.env.NEXT_PUBLIC_API_URL || 'https://api.lookitry.com';

export default function AdminForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch(`${API}/api/admin/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
        credentials: 'include',
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Error al procesar la solicitud');
      setSent(true);
    } catch (err: any) {
      setError(err.message || 'Error al procesar la solicitud');
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
        <div
          className="relative overflow-hidden rounded-[2rem] border p-8 md:p-10"
          style={{
            backgroundColor: 'var(--bg-card)',
            borderColor: 'var(--border-color)',
            boxShadow: '0 25px 60px rgba(0,0,0,0.15)',
          }}
        >
          <div className="absolute right-0 top-0 h-32 w-32 rounded-full bg-[var(--accent)]/5 blur-3xl pointer-events-none" />

          <div className="relative">
            {sent ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center py-4"
              >
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 200, damping: 15 }}
                  className="flex justify-center mb-5"
                >
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl" style={{ backgroundColor: 'rgba(255,92,58,0.1)' }}>
                    <svg className="w-8 h-8" fill="none" stroke="var(--accent)" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                </motion.div>
                <h1 className="font-jakarta font-bold text-[22px] mb-2" style={{ color: 'var(--text-primary)' }}>Revisa tu correo</h1>
                <p className="text-[13px] mb-6" style={{ color: 'var(--text-muted)' }}>
                  Si el administrador existe, recibirá un enlace para crear una nueva contraseña. El enlace expira en 1 hora.
                </p>
                <Link href="/admin/login" className="text-[13px] transition-colors hover:text-[var(--accent)]" style={{ color: 'var(--accent)' }}>
                  Volver al login admin
                </Link>
              </motion.div>
            ) : (
              <>
                <div className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1 mb-6 text-[10px] font-black uppercase tracking-[0.2em]"
                  style={{
                    backgroundColor: 'rgba(255,92,58,0.08)',
                    borderColor: 'rgba(255,92,58,0.2)',
                    color: 'var(--accent)',
                  }}
                >
                  Panel de administración
                </div>
                <motion.h1
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="font-jakarta font-bold text-[22px] mb-1"
                  style={{ color: 'var(--text-primary)' }}
                >
                  Recuperar acceso admin
                </motion.h1>
                <motion.p
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="text-[13px] mb-7"
                  style={{ color: 'var(--text-muted)' }}
                >
                  Enviaremos un enlace seguro para restablecer la contraseña del administrador.
                </motion.p>

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
                      Email del administrador
                    </label>
                    <input
                      id="email"
                      type="email"
                      required
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      className="block w-full px-4 py-3 rounded-xl border text-[13px] outline-none transition-colors"
                      style={{
                        backgroundColor: 'var(--bg-input)',
                        borderColor: 'var(--border-color)',
                        color: 'var(--text-primary)',
                      }}
                      placeholder="admin@lookitry.com"
                    />
                  </div>

                  <motion.button
                    type="submit"
                    disabled={loading}
                    whileHover={{ scale: loading ? 1 : 1.01 }}
                    whileTap={{ scale: loading ? 1 : 0.98 }}
                    className="w-full py-3 rounded-xl text-[13px] font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{ backgroundColor: 'var(--accent)', color: 'white' }}
                  >
                    {loading ? 'Enviando...' : 'Enviar enlace de recuperación'}
                  </motion.button>
                </form>

                <p className="text-center text-[13px] mt-6" style={{ color: 'var(--text-muted)' }}>
                  <Link href="/admin/login" className="transition-colors hover:text-[var(--accent)]" style={{ color: 'var(--accent)' }}>
                    Volver al login admin
                  </Link>
                </p>
              </>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
