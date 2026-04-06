'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { Loader2, AlertCircle, CheckCircle2, ArrowRight } from 'lucide-react';

const slugify = (value: string) =>
  value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-');

export default function ActivateAccountPage() {
  const router = useRouter();
  const [form, setForm] = useState({ name: '', slug: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [slugSuggested, setSlugSuggested] = useState(false);

  const suggestSlug = () => {
    const base = form.name ? slugify(form.name) : 'mi-marca';
    const suffix = Math.floor(100 + Math.random() * 900);
    setForm(prev => ({ ...prev, slug: `${base}-${suffix}` }));
    setSlugSuggested(true);
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!form.name.trim()) {
      setError('El nombre de tu marca es requerido');
      return;
    }

    if (!form.slug.trim()) {
      setError('La URL de tu probador es requerida');
      return;
    }

    const slugRegex = /^[a-z0-9-]+$/;
    if (!slugRegex.test(form.slug)) {
      setError('La URL solo puede contener letras minúsculas, números y guiones');
      return;
    }

    if (form.slug.length < 3 || form.slug.length > 50) {
      setError('La URL debe tener entre 3 y 50 caracteres');
      return;
    }

    setLoading(true);

    try {
      // Get pending registration from localStorage
      const pendingRef = localStorage.getItem('pendingRegistrationId');

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'https://api.lookitry.com'}/api/auth/google/onboarding`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ name: form.name, slug: form.slug, ref: pendingRef }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.error === 'SLUG_TAKEN') {
          setError('Esta URL ya está en uso. Prueba con otra o usa "Sugerir".');
        } else {
          setError(data.message || 'Error al activar tu cuenta');
        }
        return;
      }

      // Guardar sesión
      if (data.brand) localStorage.setItem('brand', JSON.stringify(data.brand));
      if (data.token) localStorage.setItem('token', data.token);
      localStorage.removeItem('pendingRegistrationId');

      // Ir al checkout con trial
      router.push('/trial-checkout');
    } catch (err: any) {
      setError(err.message || 'Error de conexión');
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
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="relative h-11 w-11 shrink-0">
              <Image src="/Lookitry-logo-dark.svg" alt="Lookitry" fill className="object-contain dark:hidden" priority />
              <Image src="/logo.svg" alt="Lookitry" fill className="hidden object-contain dark:block" priority />
            </div>
            <span className="font-jakarta font-extrabold text-xl text-white tracking-tight">
              Look<span style={{ color: '#FF5C3A' }}>itry</span>
            </span>
          </Link>
        </div>

        {/* Card */}
        <div
          className="relative overflow-hidden rounded-[2rem] border p-8 md:p-10"
          style={{
            backgroundColor: 'var(--bg-card)',
            borderColor: 'var(--border-color)',
            boxShadow: '0 25px 60px rgba(0,0,0,0.15)',
          }}
        >
          <div className="absolute right-0 top-0 h-32 w-32 rounded-full bg-[#FF5C3A]/5 blur-3xl pointer-events-none" />

          <div className="relative">
            {/* Badge */}
            <div className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1 mb-6 text-[10px] font-black uppercase tracking-[0.2em]"
              style={{
                backgroundColor: 'rgba(255,92,58,0.08)',
                borderColor: 'rgba(255,92,58,0.2)',
                color: '#FF5C3A',
              }}
            >
              <AlertCircle className="w-3 h-3" />
              Cuenta no activada
            </div>

            <motion.h2
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 }}
              className="font-jakarta font-bold text-[22px] mb-1"
              style={{ color: 'var(--text-primary)' }}
            >
              Activa tu cuenta
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-[13px] mb-7"
              style={{ color: 'var(--text-muted)' }}
            >
              Ya tienes una cuenta con Google. Solo necesitamos tu nombre de marca y URL para continuar.
            </motion.p>

            {error && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="border px-4 py-3 rounded-xl text-[13px] mb-5"
                style={{
                  backgroundColor: 'rgba(239,68,68,0.08)',
                  borderColor: 'rgba(239,68,68,0.2)',
                  color: '#ef4444',
                }}
              >
                {error}
              </motion.div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Nombre de marca */}
              <div>
                <label htmlFor="name" className="block text-[13px] font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>
                  Nombre de tu marca
                </label>
                <input
                  id="name"
                  type="text"
                  required
                  value={form.name}
                  onChange={e => {
                    setForm({ ...form, name: e.target.value });
                    setSlugSuggested(false);
                  }}
                  className="block w-full px-4 py-3 rounded-xl border text-[13px] outline-none transition-colors"
                  style={{
                    backgroundColor: 'var(--bg-input)',
                    borderColor: 'var(--border-color)',
                    color: 'var(--text-primary)',
                  }}
                  placeholder="Mi Tienda"
                />
              </div>

              {/* Slug */}
              <div>
                <label htmlFor="slug" className="block text-[13px] font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>
                  URL de tu probador
                </label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <input
                      id="slug"
                      type="text"
                      required
                      value={form.slug}
                      onChange={e => {
                        setForm({ ...form, slug: slugify(e.target.value) });
                        setSlugSuggested(false);
                      }}
                      className="block w-full px-4 py-3 rounded-xl border text-[13px] outline-none transition-colors pr-16"
                      style={{
                        backgroundColor: 'var(--bg-input)',
                        borderColor: 'var(--border-color)',
                        color: 'var(--text-primary)',
                      }}
                      placeholder="mi-tienda"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px]" style={{ color: 'var(--text-muted)' }}>
                      .lookitry.com
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={suggestSlug}
                    className="px-4 py-3 rounded-xl border text-[12px] font-medium transition-colors"
                    style={{
                      backgroundColor: 'var(--bg-input)',
                      borderColor: 'var(--border-color)',
                      color: 'var(--text-secondary)',
                    }}
                  >
                    Sugerir
                  </button>
                </div>
              </div>

              <motion.button
                type="submit"
                disabled={loading}
                whileHover={{ scale: loading ? 1 : 1.01 }}
                whileTap={{ scale: loading ? 1 : 0.98 }}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-[13px] font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed mt-2"
                style={{ backgroundColor: '#FF5C3A', color: 'white' }}
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <ArrowRight className="w-4 h-4" />
                )}
                {loading ? 'Activando...' : 'Activar y continuar'}
              </motion.button>
            </form>

            <div className="flex items-center gap-2 my-5">
              <div className="flex-1 h-px" style={{ backgroundColor: 'var(--border-color)' }} />
              <span className="text-[11px]" style={{ color: 'var(--text-muted)' }}>ó</span>
              <div className="flex-1 h-px" style={{ backgroundColor: 'var(--border-color)' }} />
            </div>

            <p className="text-center text-[12px]" style={{ color: 'var(--text-muted)' }}>
              <Link href="/planes" className="text-[#FF5C3A] hover:text-white transition-colors font-semibold">
                Ver planes disponibles
              </Link>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
