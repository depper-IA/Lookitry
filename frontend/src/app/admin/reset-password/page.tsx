'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

const API = process.env.NEXT_PUBLIC_API_URL || 'https://api.lookitry.com';

function PasswordField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  const [show, setShow] = useState(false);

  return (
    <div>
      <label className="block text-[13px] font-medium text-[#888] mb-1.5">{label}</label>
      <div className="relative">
        <input
          type={show ? 'text' : 'password'}
          required
          value={value}
          onChange={e => onChange(e.target.value)}
          className="block w-full px-3 py-2.5 pr-10 bg-[#0f0f0f] border border-[#2a2a2a] rounded-lg text-white text-[13px] placeholder-[#333] focus:outline-none focus:border-[#FF5C3A] transition-colors"
          placeholder="Mínimo 8 caracteres"
        />
        <button
          type="button"
          onClick={() => setShow(current => !current)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-[#444] hover:text-[#888] transition-colors"
          tabIndex={-1}
        >
          {show ? 'Ocultar' : 'Mostrar'}
        </button>
      </div>
    </div>
  );
}

function AdminResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!token) {
      setError('El enlace es inválido. Solicita uno nuevo.');
    }
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password.length < 8) {
      setError('La contraseña debe tener al menos 8 caracteres');
      return;
    }

    if (password !== confirm) {
      setError('Las contraseñas no coinciden');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API}/api/admin/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Error al restablecer la contraseña');
      setSuccess(true);
      window.setTimeout(() => router.push('/admin/login'), 2500);
    } catch (err: any) {
      setError(err.message || 'Error al restablecer la contraseña');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-[#0a0a0a]">
      <div className="w-full max-w-md">
        <div className="bg-[#141414] border border-[#2a2a2a] rounded-xl p-7 md:p-8">
          {success ? (
            <div className="text-center py-4">
              <div className="flex justify-center mb-4 text-emerald-500">
                <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h1 className="font-jakarta font-bold text-[22px] text-white mb-2">Contraseña actualizada</h1>
              <p className="text-[13px] text-[#777]">
                Tu acceso de administrador ya quedó actualizado. Te llevaremos al login.
              </p>
            </div>
          ) : (
            <>
              <div className="inline-flex items-center gap-1.5 bg-[#1a1a1a] border border-[#2a2a2a] text-[#555] text-[11px] font-medium tracking-widest uppercase px-2.5 py-1 rounded-full mb-5">
                Panel de administración
              </div>
              <h1 className="font-jakarta font-bold text-[22px] text-white mb-1">Nueva contraseña</h1>
              <p className="text-[13px] text-[#777] mb-7">
                Crea una contraseña nueva para tu acceso administrativo.
              </p>

              <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                  <div className="bg-[#1f0f0f] border border-[#5a1a1a] text-[#ff6b6b] text-[13px] px-4 py-3 rounded-lg">
                    {error}
                  </div>
                )}

                <PasswordField label="Nueva contraseña" value={password} onChange={setPassword} />
                <PasswordField label="Confirmar contraseña" value={confirm} onChange={setConfirm} />

                <button
                  type="submit"
                  disabled={loading || !token}
                  className="w-full py-2.5 bg-[#FF5C3A] hover:bg-[#e84d2c] disabled:opacity-50 disabled:cursor-not-allowed text-white text-[13px] font-medium rounded-lg transition-colors"
                >
                  {loading ? 'Guardando...' : 'Guardar nueva contraseña'}
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

export default function AdminResetPasswordPage() {
  return (
    <Suspense>
      <AdminResetPasswordForm />
    </Suspense>
  );
}
