'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

async function getFingerprint(): Promise<string | null> {
  try {
    // Fingerprint ligero sin dependencia externa
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
    // Hash simple
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
  const [trialActive, setTrialActive] = useState(false);
  const [trialDays, setTrialDays] = useState(7);
  const [fingerprint, setFingerprint] = useState<string | null>(null);

  useEffect(() => {
    getFingerprint().then(setFingerprint);

    fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/trial/status`)
      .then((r) => r.json())
      .then((d) => {
        if (d.active) {
          setTrialActive(true);
          setTrialDays(d.trial_days ?? 7);
        }
      })
      .catch(() => {});
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
      localStorage.setItem('token', data.token);
      localStorage.setItem('brandToken', data.token);
      router.push('/dashboard');
    } catch {
      setError('Error de conexión. Intenta de nuevo.');
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

          {trialActive ? (
            <p className="text-[13px] text-[#FF5C3A] mb-6">
              Prueba gratis por {trialDays} días — sin tarjeta de crédito
            </p>
          ) : (
            <p className="text-[13px] text-[#555] mb-6">
              Empieza a configurar tu probador virtual
            </p>
          )}

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
              <input
                name="password"
                type="password"
                value={form.password}
                onChange={handleChange}
                required
                minLength={6}
                placeholder="Mínimo 6 caracteres"
                className="w-full bg-[#0f0f0f] border border-[#2a2a2a] rounded-lg px-3 py-2.5 text-[13px] text-white placeholder-[#333] focus:outline-none focus:border-[#FF5C3A] transition-colors"
              />
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
              {loading
                ? 'Creando cuenta...'
                : trialActive
                ? `Empezar prueba de ${trialDays} días`
                : 'Crear cuenta'}
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
