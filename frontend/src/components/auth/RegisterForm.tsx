'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

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

async function getFingerprint(): Promise<string | null> {
  try {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.textBaseline = 'top';
      ctx.font = '14px Arial';
      ctx.fillText('fingerprint', 2, 2);
    }
    const nav = [
      navigator.userAgent,
      navigator.language,
      screen.width + 'x' + screen.height,
      new Date().getTimezoneOffset(),
      canvas.toDataURL(),
    ].join('|');
    let hash = 0;
    for (let i = 0; i < nav.length; i++) {
      hash = ((hash << 5) - hash) + nav.charCodeAt(i);
      hash |= 0;
    }
    return Math.abs(hash).toString(36);
  } catch {
    return null;
  }
}

export default function RegisterForm() {
  const router = useRouter();
  const [form, setForm] = useState({ name: '', email: '', password: '', slug: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [trialActive, setTrialActive] = useState<boolean | null>(null); // null = cargando
  const [trialDays, setTrialDays] = useState(7);
  const [fingerprint, setFingerprint] = useState<string | null>(null);

  useEffect(() => {
    getFingerprint().then(setFingerprint);

    fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/trial/status`)
      .then((r) => r.json())
      .then((d) => {
        setTrialActive(d.active === true);
        if (d.active) setTrialDays(d.trial_days ?? 7);
      })
      .catch(() => setTrialActive(false));
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    if (name === 'name') {
      const slug = value
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9\s-]/g, '')
        .trim()
        .replace(/\s+/g, '-');
      setForm((prev) => ({ ...prev, name: value, slug }));
    } else {
      setForm((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, fingerprint }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (data.error === 'TRIAL_ABUSE') {
          setError('Ya existe una cuenta de prueba registrada desde este dispositivo o red. Puedes contratar un plan directamente.');
        } else {
          setError(data.message || 'Error al registrar');
        }
        return;
      }
      // Guardar token y redirigir: con trial → verificar tarjeta, sin trial → verificar email
      localStorage.setItem('token', data.token);
      localStorage.setItem('brandToken', data.token);
      router.push('/verify-email');
    } catch {
      setError('Error de conexión. Intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  // ── Estado de carga ────────────────────────────────────────────────────────
  if (trialActive === null) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#0a0a0a' }}>
        <div className="w-6 h-6 border-2 border-[#FF5C3A] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // ── Sin trial activo → redirigir a planes ─────────────────────────────────
  if (trialActive === false) {
    return (
      <div
        className="min-h-screen flex items-center justify-center px-4 py-12"
        style={{ fontFamily: 'DM Sans, sans-serif', background: '#0a0a0a' }}
      >
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <Link href="/" style={{ fontFamily: 'Syne, sans-serif' }} className="font-extrabold text-xl text-white tracking-tight">
              Virtual<span className="text-[#FF5C3A]">Try</span>On
            </Link>
          </div>

          <div className="bg-[#141414] border border-[#2a2a2a] rounded-xl p-7 md:p-8 text-center">
            {/* Icono */}
            <div className="w-14 h-14 rounded-full bg-[#1f1f1f] flex items-center justify-center mx-auto mb-5">
              <svg className="w-7 h-7 text-[#FF5C3A]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z" />
              </svg>
            </div>

            <h1 style={{ fontFamily: 'Syne, sans-serif' }} className="font-bold text-[20px] text-white mb-2">
              No hay prueba gratuita activa
            </h1>
            <p className="text-[13px] text-[#555] mb-7 leading-relaxed">
              En este momento no hay campañas de prueba disponibles.<br />
              Elige un plan para comenzar a usar tu probador virtual.
            </p>

            <Link
              href="/planes"
              className="block w-full text-center py-2.5 bg-[#FF5C3A] hover:bg-[#e84d2c] text-white text-[13px] font-medium rounded-lg transition-colors mb-3"
            >
              Ver planes y precios
            </Link>

            <p className="text-center text-[13px] text-[#444] mt-4">
              ¿Ya tienes cuenta?{' '}
              <Link href="/login" className="text-[#FF5C3A] hover:text-[#e84d2c] transition-colors">
                Inicia sesión
              </Link>
            </p>
          </div>
        </div>
      </div>
    );
  }

  // ── Trial activo → formulario normal ──────────────────────────────────────
  return (
    <div
      className="min-h-screen flex items-center justify-center px-4 py-12"
      style={{ fontFamily: 'DM Sans, sans-serif', background: '#0a0a0a' }}
    >
      <div className="w-full max-w-md">

        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" style={{ fontFamily: 'Syne, sans-serif' }} className="font-extrabold text-xl text-white tracking-tight">
            Virtual<span className="text-[#FF5C3A]">Try</span>On
          </Link>
        </div>

        <div className="bg-[#141414] border border-[#2a2a2a] rounded-xl p-7 md:p-8">
          <h1 style={{ fontFamily: 'Syne, sans-serif' }} className="font-bold text-[22px] text-white mb-1">
            Crear cuenta
          </h1>
          <p className="text-[13px] text-[#FF5C3A] mb-6">
            Prueba gratis por {trialDays} días — sin tarjeta de crédito
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-[13px] font-medium text-[#888] mb-1.5">
                Nombre de la marca
              </label>
              <input
                name="name"
                value={form.name}
                onChange={handleChange}
                required
                placeholder="Mi Marca"
                className="w-full bg-[#0f0f0f] border border-[#2a2a2a] rounded-lg px-3 py-2.5 text-[13px] text-white placeholder-[#333] focus:outline-none focus:border-[#FF5C3A] transition-colors"
              />
            </div>

            <div>
              <label className="block text-[13px] font-medium text-[#888] mb-1.5">
                Slug (URL del probador)
              </label>
              <div className="flex items-center bg-[#0f0f0f] border border-[#2a2a2a] rounded-lg overflow-hidden focus-within:border-[#FF5C3A] transition-colors">
                <span className="px-3 py-2.5 text-[#333] text-[13px] border-r border-[#2a2a2a] whitespace-nowrap">
                  /pruebalo/
                </span>
                <input
                  name="slug"
                  value={form.slug}
                  onChange={handleChange}
                  required
                  placeholder="mi-marca"
                  className="flex-1 px-3 py-2.5 text-[13px] text-white bg-transparent focus:outline-none placeholder-[#333]"
                />
              </div>
            </div>

            <div>
              <label className="block text-[13px] font-medium text-[#888] mb-1.5">Email</label>
              <input
                name="email"
                type="email"
                value={form.email}
                onChange={handleChange}
                required
                placeholder="hola@mimarca.com"
                className="w-full bg-[#0f0f0f] border border-[#2a2a2a] rounded-lg px-3 py-2.5 text-[13px] text-white placeholder-[#333] focus:outline-none focus:border-[#FF5C3A] transition-colors"
              />
            </div>

            <div>
              <label className="block text-[13px] font-medium text-[#888] mb-1.5">Contraseña</label>
              <div className="relative">
                <input
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  value={form.password}
                  onChange={handleChange}
                  required
                  minLength={6}
                  placeholder="Mínimo 6 caracteres"
                  className="w-full bg-[#0f0f0f] border border-[#2a2a2a] rounded-lg px-3 py-2.5 pr-10 text-[13px] text-white placeholder-[#333] focus:outline-none focus:border-[#FF5C3A] transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#444] hover:text-[#888] focus:outline-none transition-colors"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOffIcon /> : <EyeIcon />}
                </button>
              </div>
            </div>

            {error && (
              <div className="bg-[#1f0f0f] border border-[#5a1a1a] text-[#ff6b6b] text-[13px] px-4 py-3 rounded-lg">
                {error}
                {error.includes('dispositivo') && (
                  <div className="mt-2">
                    <Link href="/planes" className="text-[#FF5C3A] underline font-medium">
                      Ver planes disponibles
                    </Link>
                  </div>
                )}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#FF5C3A] hover:bg-[#e84d2c] disabled:opacity-50 text-white font-medium py-2.5 rounded-lg text-[13px] transition-colors mt-2"
            >
              {loading ? 'Creando cuenta...' : `Empezar prueba de ${trialDays} días`}
            </button>
          </form>

          <p className="text-center text-[13px] text-[#444] mt-6">
            ¿Ya tienes cuenta?{' '}
            <Link href="/login" className="text-[#FF5C3A] hover:text-[#e84d2c] transition-colors">
              Inicia sesión
            </Link>
          </p>
        </div>

      </div>
    </div>
  );
}
