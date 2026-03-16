'use client';

import { useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.pruebalo.wilkiedevs.com';

function IconCheck() {
  return (
    <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="#FF5C3A" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
    </svg>
  );
}

function IconSpinner() {
  return (
    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round"
        d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
    </svg>
  );
}

function RegistroProContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const months = Number(searchParams.get('months') || 1);
  const ref = searchParams.get('ref') || '';

  const [form, setForm] = useState({ name: '', email: '', password: '', slug: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState('');

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
    if (name === 'name' && !form.slug) {
      setForm(prev => ({
        ...prev,
        slug: value.toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-').trim(),
      }));
    }
    if (errors[name]) setErrors(prev => { const e = { ...prev }; delete e[name]; return e; });
  }

  function validate() {
    const e: Record<string, string> = {};
    if (!form.name.trim() || form.name.length < 2) e.name = 'Mínimo 2 caracteres';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = 'Email inválido';
    if (form.password.length < 6) e.password = 'Mínimo 6 caracteres';
    if (!/^[a-z0-9-]{3,}$/.test(form.slug)) e.slug = 'Solo minúsculas, números y guiones (mín. 3 caracteres)';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    setApiError('');
    try {
      const res = await fetch(`${API_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: form.name, email: form.email, password: form.password, slug: form.slug }),
      });
      const data = await res.json();
      if (!res.ok) { setApiError(data.message || 'Error al crear la cuenta'); return; }
      localStorage.setItem('token', data.token);
      localStorage.setItem('brand', JSON.stringify(data.brand));
      router.push(`/pago-exitoso?plan=PRO&months=${months}&ref=${ref}`);
    } catch {
      setApiError('Error de conexión. Intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main
      className="min-h-screen flex items-center justify-center px-4 py-12"
      style={{ fontFamily: 'DM Sans, sans-serif', background: '#0a0a0a' }}
    >
      <div className="w-full max-w-md">

        {/* Logo */}
        <div className="text-center mb-6">
          <Link href="/" style={{ fontFamily: 'Syne, sans-serif' }} className="font-extrabold text-xl text-white tracking-tight">
            Virtual<span className="text-[#FF5C3A]">Try</span>On
          </Link>
        </div>

        {/* Confirmación de pago */}
        <div className="bg-[rgba(255,92,58,0.06)] border border-[rgba(255,92,58,0.2)] rounded-xl px-5 py-4 mb-5 flex items-start gap-3">
          <IconCheck />
          <div>
            <p className="text-[13px] font-semibold text-[#FF5C3A]">Pago recibido correctamente</p>
            <p className="text-[12px] text-[#666] mt-0.5">
              Crea tu cuenta para activar tu Plan Pro por {months} {months === 1 ? 'mes' : 'meses'}.
            </p>
          </div>
        </div>

        <div className="bg-[#141414] border border-[#2a2a2a] rounded-xl p-7 md:p-8">
          <h1 style={{ fontFamily: 'Syne, sans-serif' }} className="font-bold text-[22px] text-white mb-1">
            Crea tu cuenta
          </h1>
          <p className="text-[13px] text-[#555] mb-6">
            Un paso más para activar tu probador virtual.
          </p>

          {apiError && (
            <div className="bg-[#1f0f0f] border border-[#5a1a1a] text-[#ff6b6b] text-[13px] px-4 py-3 rounded-lg mb-5">
              {apiError}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-[13px] font-medium text-[#888] mb-1.5">Nombre de tu marca</label>
              <input
                name="name" type="text" value={form.name} onChange={handleChange} placeholder="Mi Tienda"
                className={`w-full bg-[#0f0f0f] border ${errors.name ? 'border-[#5a1a1a]' : 'border-[#2a2a2a]'} rounded-lg px-3 py-2.5 text-[13px] text-white placeholder-[#333] focus:outline-none focus:border-[#FF5C3A] transition-colors`}
              />
              {errors.name && <p className="text-[11px] text-[#ff6b6b] mt-1">{errors.name}</p>}
            </div>

            <div>
              <label className="block text-[13px] font-medium text-[#888] mb-1.5">URL del probador</label>
              <div className={`flex bg-[#0f0f0f] border ${errors.slug ? 'border-[#5a1a1a]' : 'border-[#2a2a2a]'} rounded-lg overflow-hidden focus-within:border-[#FF5C3A] transition-colors`}>
                <span className="inline-flex items-center px-3 text-[#333] text-[13px] border-r border-[#2a2a2a]">/pruebalo/</span>
                <input
                  name="slug" type="text" value={form.slug} onChange={handleChange} placeholder="mi-tienda"
                  className="flex-1 px-3 py-2.5 text-[13px] text-white bg-transparent focus:outline-none placeholder-[#333]"
                />
              </div>
              {errors.slug && <p className="text-[11px] text-[#ff6b6b] mt-1">{errors.slug}</p>}
              <p className="text-[11px] text-[#333] mt-1">Con Plan Pro puedes cambiarlo después desde tu dashboard.</p>
            </div>

            <div>
              <label className="block text-[13px] font-medium text-[#888] mb-1.5">Correo electrónico</label>
              <input
                name="email" type="email" value={form.email} onChange={handleChange} placeholder="tu@correo.com"
                className={`w-full bg-[#0f0f0f] border ${errors.email ? 'border-[#5a1a1a]' : 'border-[#2a2a2a]'} rounded-lg px-3 py-2.5 text-[13px] text-white placeholder-[#333] focus:outline-none focus:border-[#FF5C3A] transition-colors`}
              />
              {errors.email && <p className="text-[11px] text-[#ff6b6b] mt-1">{errors.email}</p>}
            </div>

            <div>
              <label className="block text-[13px] font-medium text-[#888] mb-1.5">Contraseña</label>
              <input
                name="password" type="password" value={form.password} onChange={handleChange} placeholder="Mínimo 6 caracteres"
                className={`w-full bg-[#0f0f0f] border ${errors.password ? 'border-[#5a1a1a]' : 'border-[#2a2a2a]'} rounded-lg px-3 py-2.5 text-[13px] text-white placeholder-[#333] focus:outline-none focus:border-[#FF5C3A] transition-colors`}
              />
              {errors.password && <p className="text-[11px] text-[#ff6b6b] mt-1">{errors.password}</p>}
            </div>

            <button
              type="submit" disabled={loading}
              className="w-full py-2.5 bg-[#FF5C3A] hover:bg-[#e84d2c] disabled:opacity-60 text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2 text-[13px] mt-2"
            >
              {loading && <IconSpinner />}
              {loading ? 'Creando cuenta...' : 'Activar Plan Pro'}
            </button>
          </form>

          <p className="text-center text-[12px] text-[#333] mt-5">
            ¿Ya tienes cuenta?{' '}
            <Link href="/login" className="text-[#FF5C3A] hover:underline">Inicia sesión</Link>
          </p>
        </div>

        {ref && (
          <p className="text-center text-[11px] text-[#333] mt-4">
            Referencia de pago: <span className="font-mono">{ref}</span>
          </p>
        )}
      </div>
    </main>
  );
}

export default function RegistroProPage() {
  return (
    <Suspense>
      <RegistroProContent />
    </Suspense>
  );
}
