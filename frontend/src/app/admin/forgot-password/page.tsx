'use client';

import { useState } from 'react';
import Link from 'next/link';

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
    <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-[#0a0a0a]">
      <div className="w-full max-w-md">
        <div className="bg-[#141414] border border-[#2a2a2a] rounded-xl p-7 md:p-8">
          {sent ? (
            <div className="text-center py-4">
              <div className="flex justify-center mb-4 text-[#FF5C3A]">
                <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <h1 className="font-jakarta font-bold text-[22px] text-white mb-2">Revisa tu correo</h1>
              <p className="text-[13px] text-[#777] mb-6">
                Si el administrador existe, recibirá un enlace para crear una nueva contraseña. El enlace expira en 1 hora.
              </p>
              <Link href="/admin/login" className="text-[13px] text-[#FF5C3A] hover:text-[#e84d2c] transition-colors">
                Volver al login admin
              </Link>
            </div>
          ) : (
            <>
              <div className="inline-flex items-center gap-1.5 bg-[#1a1a1a] border border-[#2a2a2a] text-[#555] text-[11px] font-medium tracking-widest uppercase px-2.5 py-1 rounded-full mb-5">
                Panel de administración
              </div>
              <h1 className="font-jakarta font-bold text-[22px] text-white mb-1">Recuperar acceso admin</h1>
              <p className="text-[13px] text-[#777] mb-7">
                Enviaremos un enlace seguro para restablecer la contraseña del administrador.
              </p>

              <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                  <div className="bg-[#1f0f0f] border border-[#5a1a1a] text-[#ff6b6b] text-[13px] px-4 py-3 rounded-lg">
                    {error}
                  </div>
                )}

                <div>
                  <label htmlFor="email" className="block text-[13px] font-medium text-[#888] mb-1.5">
                    Email del administrador
                  </label>
                  <input
                    id="email"
                    type="email"
                    required
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    className="block w-full px-3 py-2.5 bg-[#0f0f0f] border border-[#2a2a2a] rounded-lg text-white text-[13px] placeholder-[#333] focus:outline-none focus:border-[#FF5C3A] transition-colors"
                    placeholder="admin@lookitry.com"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2.5 bg-[#FF5C3A] hover:bg-[#e84d2c] disabled:opacity-50 disabled:cursor-not-allowed text-white text-[13px] font-medium rounded-lg transition-colors"
                >
                  {loading ? 'Enviando...' : 'Enviar enlace de recuperación'}
                </button>
              </form>

              <p className="text-center text-[13px] text-[#555] mt-6">
                <Link href="/admin/login" className="text-[#FF5C3A] hover:text-[#e84d2c] transition-colors">
                  Volver al login admin
                </Link>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
