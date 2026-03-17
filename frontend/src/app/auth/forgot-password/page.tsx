'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'https://api.pruebalo.wilkiedevs.com'}/api/auth/forgot-password`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email }),
        }
      );
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || 'Error al procesar la solicitud');
      }
      setSent(true);
    } catch (err: any) {
      setError(err.message || 'Error al procesar la solicitud');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4 py-12"
      style={{ fontFamily: 'DM Sans, sans-serif', background: '#0a0a0a' }}
    >
      <div className="w-full max-w-md">
        <div className="flex justify-center mb-8">
          <Link href="/" className="flex items-center gap-2.5">
            <Image src="/logo.png" alt="Lookitry" width={28} height={28} className="object-contain h-7 w-auto" priority />
            <span style={{ fontFamily: 'Syne, sans-serif' }} className="font-extrabold text-xl text-white tracking-tight">
              Look<span className="text-[#FF5C3A]">itry</span>
            </span>
          </Link>
        </div>

        <div className="bg-[#141414] border border-[#2a2a2a] rounded-xl p-7 md:p-8">
          {sent ? (
            <div className="text-center py-4">
              <div className="flex justify-center mb-4">
                <svg className="w-12 h-12 text-[#FF5C3A]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                    d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <h2 style={{ fontFamily: 'Syne, sans-serif' }} className="font-bold text-[20px] text-white mb-2">
                Revisa tu correo
              </h2>
              <p className="text-[13px] text-[#555] mb-6">
                Si el email está registrado, recibirás un enlace para restablecer tu contraseña. El enlace expira en 1 hora.
              </p>
              <Link href="/login" className="text-[13px] text-[#FF5C3A] hover:text-[#e84d2c] transition-colors">
                Volver al inicio de sesión
              </Link>
            </div>
          ) : (
            <>
              <h2 style={{ fontFamily: 'Syne, sans-serif' }} className="font-bold text-[22px] text-white mb-1">
                Recuperar contraseña
              </h2>
              <p className="text-[13px] text-[#555] mb-7">
                Ingresa tu email y te enviaremos un enlace para restablecer tu contraseña.
              </p>

              <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                  <div className="bg-[#1f0f0f] border border-[#5a1a1a] text-[#ff6b6b] text-[13px] px-4 py-3 rounded-lg">
                    {error}
                  </div>
                )}

                <div>
                  <label htmlFor="email" className="block text-[13px] font-medium text-[#888] mb-1.5">
                    Email
                  </label>
                  <input
                    id="email"
                    type="email"
                    required
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    className="block w-full px-3 py-2.5 bg-[#0f0f0f] border border-[#2a2a2a] rounded-lg text-white text-[13px] placeholder-[#333] focus:outline-none focus:border-[#FF5C3A] transition-colors"
                    placeholder="tu@email.com"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2.5 bg-[#FF5C3A] hover:bg-[#e84d2c] disabled:opacity-50 disabled:cursor-not-allowed text-white text-[13px] font-medium rounded-lg transition-colors mt-2"
                >
                  {loading ? 'Enviando...' : 'Enviar enlace de recuperación'}
                </button>
              </form>

              <p className="text-center text-[13px] text-[#444] mt-6">
                <Link href="/login" className="text-[#FF5C3A] hover:text-[#e84d2c] transition-colors">
                  Volver al inicio de sesión
                </Link>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
