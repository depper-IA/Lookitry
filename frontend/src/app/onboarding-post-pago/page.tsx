'use client';

import { useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Loader2, Store, Globe, AlertCircle, CheckCircle2 } from 'lucide-react';

function slugify(value: string) {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-');
}

function OnboardingContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const plan = searchParams.get('plan') || 'PRO';
  const months = Number(searchParams.get('months') || 1);
  const ref = searchParams.get('ref') || '';
  const isTrial = searchParams.get('isTrial') === 'true';

  const [form, setForm] = useState({
    name: '',
    slug: '',
    password: '',
    confirmPassword: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [slugSuggested, setSlugSuggested] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const suggestSlug = () => {
    const base = form.name ? slugify(form.name) : 'mi-marca';
    const suffix = Math.floor(100 + Math.random() * 900);
    setForm(prev => ({ ...prev, slug: `${base}-${suffix}` }));
    setSlugSuggested(true);
    setError('');
  };

  const validatePassword = (pwd: string) => {
    if (pwd.length < 8) return 'Mínimo 8 caracteres';
    if (!/[A-Z]/.test(pwd)) return 'Debe tener al menos una mayúscula';
    if (!/[a-z]/.test(pwd)) return 'Debe tener al menos una minúscula';
    if (!/[0-9]/.test(pwd)) return 'Debe tener al menos un número';
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(pwd)) return 'Debe tener al menos un carácter especial';
    return null;
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

    if (!form.password.trim()) {
      setError('La contraseña es requerida');
      return;
    }

    const pwdError = validatePassword(form.password);
    if (pwdError) {
      setError(pwdError);
      return;
    }

    if (form.password !== form.confirmPassword) {
      setError('Las contraseñas no coinciden');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/auth/register-post-payment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          name: form.name.trim(),
          slug: form.slug.trim(),
          password: form.password,
          reference: ref,
          plan,
          months,
          isTrial,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.error === 'SLUG_TAKEN') {
          setError('Esta URL ya está en uso. Prueba con otra o usa "Sugerir".');
        } else if (data.error === 'REFERENCE_NOT_FOUND') {
          setError('No se encontró el pago asociado. Contacta a soporte.');
        } else {
          setError(data.message || 'Error al completar la configuración');
        }
        setLoading(false);
        return;
      }

      if (data.token) {
        localStorage.setItem('token', data.token);
      }
      if (data.brand) {
        localStorage.setItem('brand', JSON.stringify(data.brand));
        localStorage.setItem('brand_plan', data.brand.plan);
      }

      setSuccess(true);
      setTimeout(() => {
        router.push('/dashboard');
      }, 1500);
    } catch {
      setError('Error de conexión. Intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] text-gray-200 flex flex-col">
      <header className="flex items-center justify-center py-8">
        <Link href="/" className="flex items-center gap-2.5">
          <Image src="/logo.svg" alt="Lookitry" width={28} height={28} className="object-contain h-7 w-auto" priority />
          <span className="font-jakarta font-extrabold text-xl text-white tracking-tight">
            Look<span className="text-[#FF5C3A]">itry</span>
          </span>
        </Link>
      </header>

      <main className="flex-1 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-[#FF5C3A]/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-8 h-8 text-[#FF5C3A]" />
            </div>
            <h1 className="font-jakarta font-bold text-2xl text-white tracking-tight">
              ¡Pago confirmado!
            </h1>
            <p className="text-sm text-[#999] mt-2">
              Solo falta configurar tu cuenta para comenzar a usar Lookitry
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6 bg-[#0d0d0d] border border-[#1f1f1f] p-8 rounded-3xl">
            <div className="space-y-2">
              <label className="text-xs font-bold text-[#999] uppercase tracking-widest flex items-center gap-2">
                <Store className="w-3.5 h-3.5 text-[#FF5C3A]" />
                Nombre de tu Marca
              </label>
              <input
                type="text"
                value={form.name}
                onChange={e => { setForm(prev => ({ ...prev, name: e.target.value })); setError(''); }}
                placeholder="Mi Tienda de Moda"
                className="w-full bg-[#050505] border border-[#222] rounded-xl px-4 py-4 text-white outline-none transition-all focus:border-[#FF5C3A]"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-[#999] uppercase tracking-widest flex items-center gap-2">
                <Globe className="w-3.5 h-3.5 text-[#FF5C3A]" />
                URL de tu probador
              </label>
              <div className="flex gap-2">
                <div className="flex-1 relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#666] text-sm">lookitry.com/</span>
                  <input
                    type="text"
                    value={form.slug}
                    onChange={e => { setForm(prev => ({ ...prev, slug: slugify(e.target.value) })); setError(''); setSlugSuggested(false); }}
                    placeholder="mi-marca"
                    className="w-full bg-[#050505] border border-[#222] rounded-xl pl-36 pr-4 py-4 text-white outline-none transition-all focus:border-[#FF5C3A] font-mono text-sm"
                  />
                </div>
                <button
                  type="button"
                  onClick={suggestSlug}
                  className="px-4 py-3 rounded-xl bg-[#1a1a1a] text-[#999] text-sm font-medium hover:bg-[#222] transition-colors"
                >
                  Sugerir
                </button>
              </div>
              {slugSuggested && (
                <p className="text-[11px] text-[#999]">URL generada automáticamente</p>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-[#999] uppercase tracking-widest">
                Crear Contraseña
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={form.password}
                  onChange={e => { setForm(prev => ({ ...prev, password: e.target.value })); setError(''); }}
                  placeholder="Mínimo 8 caracteres"
                  className="w-full bg-[#050505] border border-[#222] rounded-xl px-4 py-4 text-white outline-none transition-all focus:border-[#FF5C3A]"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-[#666] hover:text-white"
                >
                  {showPassword ? 'Ocultar' : 'Mostrar'}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-[#999] uppercase tracking-widest">
                Confirmar Contraseña
              </label>
              <input
                type={showPassword ? 'text' : 'password'}
                value={form.confirmPassword}
                onChange={e => { setForm(prev => ({ ...prev, confirmPassword: e.target.value })); setError(''); }}
                placeholder="Repite tu contraseña"
                className="w-full bg-[#050505] border border-[#222] rounded-xl px-4 py-4 text-white outline-none transition-all focus:border-[#FF5C3A]"
              />
            </div>

            {error && (
              <div className="flex items-center gap-2 text-red-400 text-sm bg-red-400/10 p-3 rounded-xl">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || success}
              className="w-full py-4 bg-[#FF5C3A] hover:bg-[#ff785c] disabled:opacity-50 text-white font-bold rounded-xl transition-all flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Creando cuenta...
                </>
              ) : success ? (
                <>
                  <CheckCircle2 className="w-5 h-5" />
                  ¡Cuenta creada! Redireccionando...
                </>
              ) : (
                'Completar Registro'
              )}
            </button>
          </form>

          <p className="text-center text-[11px] text-[#666] mt-6">
            Al registrarte, aceptas nuestros Términos y Condiciones
          </p>
        </div>
      </main>
    </div>
  );
}

export default function OnboardingPostPagoPage() {
  return (
    <Suspense>
      <OnboardingContent />
    </Suspense>
  );
}
