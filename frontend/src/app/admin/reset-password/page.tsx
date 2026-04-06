'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';

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
      <label className="block text-[13px] font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>
        {label}
      </label>
      <div className="relative">
        <input
          type={show ? 'text' : 'password'}
          required
          value={value}
          onChange={e => onChange(e.target.value)}
          className="block w-full px-4 py-3 pr-12 rounded-xl border text-[13px] outline-none transition-colors"
          style={{
            backgroundColor: 'var(--bg-input)',
            borderColor: 'var(--border-color)',
            color: 'var(--text-primary)',
          }}
          placeholder="8+ caracteres, mayúscula, minúscula, número y símbolo"
        />
        <button
          type="button"
          onClick={() => setShow(current => !current)}
          className="absolute right-3 top-1/2 -translate-y-1/2 transition-colors hover:text-[var(--accent)]"
          style={{ color: 'var(--text-muted)' }}
          tabIndex={-1}
          aria-label={show ? 'Ocultar contraseña' : 'Mostrar contraseña'}
        >
          {show ? (
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

  const validatePasswordComplexity = (password: string): { isValid: boolean; message: string } => {
    if (password.length < 8) {
      return { isValid: false, message: 'La contraseña debe tener al menos 8 caracteres' };
    }
    if (!/[A-Z]/.test(password)) {
      return { isValid: false, message: 'La contraseña debe contener al menos una letra mayúscula' };
    }
    if (!/[a-z]/.test(password)) {
      return { isValid: false, message: 'La contraseña debe contener al menos una letra minúscula' };
    }
    if (!/[0-9]/.test(password)) {
      return { isValid: false, message: 'La contraseña debe contener al menos un número' };
    }
    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
      return { isValid: false, message: 'La contraseña debe contener al menos un carácter especial (!@#$%^&*...)' };
    }
    return { isValid: true, message: '' };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const complexityCheck = validatePasswordComplexity(password);
    if (!complexityCheck.isValid) {
      setError(complexityCheck.message);
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
        credentials: 'include',
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
            {success ? (
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
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl" style={{ backgroundColor: 'rgba(34,197,94,0.1)' }}>
                    <svg className="w-8 h-8" fill="none" stroke="#22c55e" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </motion.div>
                <h1 className="font-jakarta font-bold text-[22px] mb-2" style={{ color: 'var(--text-primary)' }}>Contraseña actualizada</h1>
                <p className="text-[13px]" style={{ color: 'var(--text-muted)' }}>
                  Tu acceso de administrador ya quedó actualizado. Te llevaremos al login.
                </p>
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
                  Nueva contraseña
                </motion.h1>
                <motion.p
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="text-[13px] mb-7"
                  style={{ color: 'var(--text-muted)' }}
                >
                  Crea una contraseña nueva para tu acceso administrativo.
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

                  <PasswordField label="Nueva contraseña" value={password} onChange={setPassword} />
                  <PasswordField label="Confirmar contraseña" value={confirm} onChange={setConfirm} />

                  <motion.button
                    type="submit"
                    disabled={loading || !token}
                    whileHover={{ scale: loading || !token ? 1 : 1.01 }}
                    whileTap={{ scale: loading || !token ? 1 : 0.98 }}
                    className="w-full py-3 rounded-xl text-[13px] font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{ backgroundColor: 'var(--accent)', color: 'white' }}
                  >
                    {loading ? 'Guardando...' : 'Guardar nueva contraseña'}
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

export default function AdminResetPasswordPage() {
  return (
    <Suspense>
      <AdminResetPasswordForm />
    </Suspense>
  );
}
