'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Loader2, Store, Globe, AlertCircle, CheckCircle2, User } from 'lucide-react';

const slugify = (value: string) =>
  value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-');

export interface OnboardingFormProps {
  title: string;
  subtitle: string;
  showContactName?: boolean;
  showPassword?: boolean;
  onSubmit: (data: { name: string; slug: string; contactName?: string; password?: string }) => Promise<void>;
  loginLink?: string;
}

export default function OnboardingForm({
  title,
  subtitle,
  showContactName = false,
  showPassword = false,
  onSubmit,
  loginLink = '/login',
}: OnboardingFormProps) {
  const router = useRouter();
  const [form, setForm] = useState({ name: '', slug: '', contactName: '', password: '', confirmPassword: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [slugSuggested, setSlugSuggested] = useState(false);
  const [showPasswordText, setShowPasswordText] = useState(false);

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

    if (showPassword) {
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
    }

    setLoading(true);

    try {
      await onSubmit({
        name: form.name.trim(),
        slug: form.slug.trim(),
        contactName: form.contactName.trim() || undefined,
        password: showPassword ? form.password : undefined,
      });

      setSuccess(true);
      setTimeout(() => {
        router.push('/dashboard');
      }, 1500);
    } catch (err: any) {
      setError(err.message || 'Error de conexión. Intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-[#050505]">
      <div className="w-full max-w-lg">
        <div className="flex flex-col items-center mb-10">
          <Link href="/" className="flex items-center gap-3 group mb-4">
            <img src="/logo.svg" alt="Lookitry" className="w-8 h-8 group-hover:rotate-12 transition-transform duration-500" />
            <span className="font-jakarta font-extrabold text-2xl text-white tracking-tighter">
              Look<span className="text-[#FF5C3A]">itry</span>
            </span>
          </Link>
          <div className="h-1 w-12 rounded-full bg-[#FF5C3A]" />
        </div>

        <div className="relative overflow-hidden rounded-3xl border border-[#FF5C3A]/12 bg-[#0a0a0a] p-8 shadow-2xl md:p-10">
          <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-[#FF5C3A]/50 to-transparent" />

          <div className="mb-10 text-center">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest mb-4 bg-[#FF5C3A]/10 text-[#FF5C3A] border border-[#FF5C3A]/20">
              Último paso
            </div>
            <h1 className="text-3xl font-jakarta font-bold text-white tracking-tight mb-2">
              {title}
            </h1>
            <p className="text-sm text-[#999] max-w-xs mx-auto leading-relaxed">
              {subtitle}
            </p>
          </div>

          {success ? (
            <div className="text-center py-8">
              <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-4" />
              <h2 className="text-xl font-bold text-white mb-2">¡Todo listo!</h2>
              <p className="text-[#999]">Redirigiendo al dashboard...</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              {showContactName && (
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-[#999] uppercase tracking-wider flex items-center gap-1.5 ml-1 leading-none">
                    <User className="w-3 h-3 text-[#FF5C3A]" /> Nombre de contacto
                  </label>
                  <input
                    value={form.contactName}
                    onChange={e => setForm(prev => ({ ...prev, contactName: e.target.value }))}
                    placeholder="Tu nombre completo"
                    className="w-full rounded-xl border border-[rgba(255,255,255,0.08)] bg-[#050505] px-4 py-3 text-sm text-white placeholder-[#666] outline-none transition-all shadow-inner focus:border-[#FF5C3A]"
                  />
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-[#999] uppercase tracking-wider flex items-center gap-1.5 ml-1 leading-none">
                  <Store className="w-3 h-3 text-[#FF5C3A]" /> Nombre de tu marca
                </label>
                <input
                  value={form.name}
                  onChange={e => setForm(prev => ({ ...prev, name: e.target.value }))}
                  required
                  placeholder="Ej: Velvet Studio"
                  className="w-full rounded-xl border border-[rgba(255,255,255,0.08)] bg-[#050505] px-4 py-3 text-sm text-white placeholder-[#666] outline-none transition-all shadow-inner focus:border-[#FF5C3A]"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-[#999] uppercase tracking-wider flex items-center gap-1.5 ml-1 leading-none">
                  <Globe className="w-3 h-3 text-[#FF5C3A]" /> URL del probador
                </label>
                <div className="flex items-center overflow-hidden rounded-xl border border-[rgba(255,255,255,0.08)] bg-[#050505] px-1 shadow-inner transition-all focus-within:border-[#FF5C3A]">
                  <span className="select-none py-3 pl-3 text-xs font-medium text-[#666]">lookitry.com/sitio/</span>
                  <input
                    value={form.slug}
                    onChange={e => setForm(prev => ({ ...prev, slug: slugify(e.target.value) }))}
                    className="flex-1 bg-transparent px-1 py-3 text-sm text-white placeholder-[#666] focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={suggestSlug}
                    className="mr-1 h-8 px-2.5 text-[9px] font-black text-[#FF5C3A] hover:text-[#ff7a5f] uppercase tracking-tighter transition-colors"
                  >
                    Sugerir
                  </button>
                </div>
                <p className="ml-1 text-[11px] leading-relaxed text-[#999]">
                  Esta URL identificará tu probador virtual. Puedes ajustarla cuando quieras.
                </p>
              </div>

              {showPassword && (
                <>
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-[#999] uppercase tracking-wider flex items-center gap-1.5 ml-1 leading-none">
                      Crear contraseña
                    </label>
                    <div className="relative">
                      <input
                        type={showPasswordText ? 'text' : 'password'}
                        value={form.password}
                        onChange={e => setForm(prev => ({ ...prev, password: e.target.value }))}
                        placeholder="Mínimo 8 caracteres"
                        className="w-full rounded-xl border border-[rgba(255,255,255,0.08)] bg-[#050505] px-4 py-3 pr-20 text-sm text-white placeholder-[#666] outline-none transition-all shadow-inner focus:border-[#FF5C3A]"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPasswordText(!showPasswordText)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] text-[#666] hover:text-[#FF5C3A] transition-colors"
                      >
                        {showPasswordText ? 'Ocultar' : 'Mostrar'}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-[#999] uppercase tracking-wider flex items-center gap-1.5 ml-1 leading-none">
                      Confirmar contraseña
                    </label>
                    <input
                      type={showPasswordText ? 'text' : 'password'}
                      value={form.confirmPassword}
                      onChange={e => setForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
                      placeholder="Repite tu contraseña"
                      className="w-full rounded-xl border border-[rgba(255,255,255,0.08)] bg-[#050505] px-4 py-3 text-sm text-white placeholder-[#666] outline-none transition-all shadow-inner focus:border-[#FF5C3A]"
                    />
                  </div>
                </>
              )}

              {error && (
                <div className="bg-red-500/5 border border-red-500/20 text-red-400 p-4 rounded-xl flex items-start gap-3">
                  <AlertCircle className="w-4 h-4 mt-0.5" />
                  <p className="text-[11px] font-bold uppercase tracking-tight leading-normal">{error}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="group relative h-14 w-full overflow-hidden rounded-2xl bg-[#FF5C3A] font-bold text-white shadow-xl shadow-[#FF5C3A]/20 transition-all active:scale-95 hover:bg-[#ff6c4d] disabled:opacity-50"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-[#FF5C3A] to-[#ff7a5f] opacity-100 transition-opacity" />
                <div className="relative flex items-center justify-center gap-3">
                  {loading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span className="text-xs uppercase tracking-widest">Guardando...</span>
                    </>
                  ) : (
                    <>
                      <Store className="w-5 h-5 text-white" />
                      <span className="text-[13px] uppercase tracking-[0.2em] font-black">
                        Completar registro
                      </span>
                    </>
                  )}
                </div>
              </button>
            </form>
          )}

          {loginLink && (
            <p className="text-center text-xs text-[#999] mt-8">
              ¿Ya tienes cuenta?{' '}
              <Link href={loginLink} className="text-[#FF5C3A] hover:text-[#ff7a5f] font-bold tracking-tight border-b border-transparent hover:border-[#FF5C3A] transition-all ml-1">
                Inicia sesión
              </Link>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
