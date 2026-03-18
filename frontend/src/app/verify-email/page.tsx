'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

const API = process.env.NEXT_PUBLIC_API_URL || 'https://api.pruebalo.wilkiedevs.com';

export default function VerifyEmailPage() {
  const [email, setEmail] = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    // Intentar obtener el email del usuario autenticado desde localStorage
    try {
      const stored = localStorage.getItem('brand');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed?.email) setEmail(parsed.email);
      }
    } catch {}
  }, []);

  const handleResend = async () => {
    if (!email) {
      setError('Ingresa tu email para reenviar el correo');
      return;
    }
    setError('');
    setSending(true);
    try {
      const res = await fetch(`${API}/api/auth/resend-verification`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || 'Error al reenviar');
      }
      setSent(true);
    } catch (err: any) {
      setError(err.message || 'Error al reenviar el correo');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-[#0a0a0a]">
      <div className="w-full max-w-md">

        <div className="text-center mb-8">
          <Link href="/" className="font-syne font-extrabold text-xl text-white tracking-tight">
            Look<span className="text-[#FF5C3A]">itry</span>
          </Link>
        </div>

        <div className="bg-[#141414] border border-[#2a2a2a] rounded-xl p-8 text-center">

          <div className="w-16 h-16 rounded-full bg-[#1f1f1f] flex items-center justify-center mx-auto mb-5">
            <svg className="w-8 h-8 text-[#FF5C3A]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
            </svg>
          </div>

          <h1 className="font-syne font-bold text-[22px] text-white mb-2">
            Verifica tu correo
          </h1>
          <p className="text-[13px] text-[#555] leading-relaxed mb-6">
            Te enviamos un enlace de confirmación. Haz clic en él para activar tu cuenta y poder usar las generaciones.
          </p>

          <div className="bg-[#0f0f0f] border border-[#2a2a2a] rounded-lg px-4 py-3 mb-6 text-left">
            <p className="text-[12px] text-[#444] leading-relaxed">
              Si no ves el correo, revisa tu carpeta de spam. El enlace expira en 24 horas.
            </p>
          </div>

          {sent ? (
            <div className="flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 mb-4">
              <svg className="w-4 h-4 text-emerald-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-[13px] text-emerald-400">Correo reenviado. Revisa tu bandeja.</p>
            </div>
          ) : (
            <div className="space-y-3 mb-4">
              {!email && (
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="tu@email.com"
                  className="w-full px-3 py-2.5 bg-[#0f0f0f] border border-[#2a2a2a] rounded-lg text-white text-[13px] placeholder-[#333] focus:outline-none focus:border-[#FF5C3A] transition-colors"
                />
              )}
              {error && (
                <p className="text-[12px] text-red-400">{error}</p>
              )}
              <button
                onClick={handleResend}
                disabled={sending}
                className="w-full py-2.5 bg-[#1f1f1f] hover:bg-[#2a2a2a] disabled:opacity-50 border border-[#2a2a2a] text-[#888] hover:text-white text-[13px] font-medium rounded-lg transition-colors"
              >
                {sending ? 'Enviando...' : 'Reenviar correo de verificación'}
              </button>
            </div>
          )}

          <p className="text-center text-[13px] text-[#444]">
            ¿Ya verificaste?{' '}
            <Link href="/login" className="text-[#FF5C3A] hover:text-[#e84d2c] transition-colors">
              Inicia sesión
            </Link>
          </p>
        </div>

      </div>
    </div>
  );
}
