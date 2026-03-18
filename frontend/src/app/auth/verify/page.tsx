'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

type Status = 'loading' | 'success' | 'error';

export default function AuthVerifyPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<Status>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const token = searchParams.get('token');
    if (!token) {
      setStatus('error');
      setMessage('Token de verificación no encontrado.');
      return;
    }

    fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/verify-email?token=${token}`)
      .then(r => r.json())
      .then(data => {
        if (data.error) {
          setStatus('error');
          setMessage(data.message || 'El enlace es inválido o ya expiró.');
        } else {
          setStatus('success');
          setMessage(data.message || 'Correo verificado correctamente.');
          // Actualizar emailVerified en localStorage para que el banner desaparezca
          try {
            const stored = localStorage.getItem('brand');
            if (stored) {
              const parsed = JSON.parse(stored);
              localStorage.setItem('brand', JSON.stringify({ ...parsed, emailVerified: true }));
            }
          } catch {}
          // Redirigir al dashboard después de 2 segundos
          setTimeout(() => router.push('/dashboard'), 2500);
        }
      })
      .catch(() => {
        setStatus('error');
        setMessage('Error de conexión. Intenta de nuevo.');
      });
  }, [searchParams, router]);

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-[#0a0a0a]">
      <div className="w-full max-w-md">

        <div className="text-center mb-8">
          <Link href="/" className="font-syne font-extrabold text-xl text-white tracking-tight">
            Look<span className="text-[#FF5C3A]">itry</span>
          </Link>
        </div>

        <div className="bg-[#141414] border border-[#2a2a2a] rounded-xl p-8 text-center">

          {status === 'loading' && (
            <>
              <div className="w-12 h-12 border-2 border-[#FF5C3A] border-t-transparent rounded-full animate-spin mx-auto mb-5" />
              <p className="text-[14px] text-[#555]">Verificando tu correo...</p>
            </>
          )}

          {status === 'success' && (
            <>
              <div className="w-16 h-16 rounded-full bg-[#0f2a1a] flex items-center justify-center mx-auto mb-5">
                <svg className="w-8 h-8 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h1 className="font-syne font-bold text-[20px] text-white mb-2">
                Correo verificado
              </h1>
              <p className="text-[13px] text-[#555] mb-5">{message}</p>
              <p className="text-[12px] text-[#333]">Redirigiendo al dashboard...</p>
            </>
          )}

          {status === 'error' && (
            <>
              <div className="w-16 h-16 rounded-full bg-[#2a0f0f] flex items-center justify-center mx-auto mb-5">
                <svg className="w-8 h-8 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                </svg>
              </div>
              <h1 className="font-syne font-bold text-[20px] text-white mb-2">
                Enlace inválido
              </h1>
              <p className="text-[13px] text-[#555] mb-6">{message}</p>
              <Link
                href="/login"
                className="inline-block bg-[#FF5C3A] hover:bg-[#e84d2c] text-white text-[13px] font-medium px-6 py-2.5 rounded-lg transition-colors"
              >
                Ir al inicio de sesión
              </Link>
            </>
          )}

        </div>
      </div>
    </div>
  );
}
