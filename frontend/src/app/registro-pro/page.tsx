'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/hooks/useAuth';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.pruebalo.wilkiedevs.com';

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

function IconCheck() {
  return (
    <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="#FF5C3A" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
    </svg>
  );
}

function IconSpinner() {
  return (
    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
    </svg>
  );
}

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

function RegistroProContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const months = Number(searchParams.get('months') || 1);
  const ref = searchParams.get('ref') || '';
  const wompiId = searchParams.get('id');

  const [form, setForm] = useState({
    contact_name: '',
    name: '',
    slug: '',
    password: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [fingerprint, setFingerprint] = useState<string | null>(null);
  const [recoveringRef, setRecoveringRef] = useState(false);
  // Email alternativo — solo visible cuando el email de pago ya está registrado
  const [showAltEmail, setShowAltEmail] = useState(false);
  const [altEmail, setAltEmail] = useState('');
  const [altEmailError, setAltEmailError] = useState('');
  const [pendingData, setPendingData] = useState<{ plan: string; months: number; includes_landing: boolean; status: string } | null>(null);
  const [fetchingPending, setFetchingPending] = useState(true);
  const { brand, isAuthenticated } = useAuth();
  const [autoLinking, setAutoLinking] = useState(false);

  useEffect(() => {
    getFingerprint().then(setFingerprint);
  }, []);

  useEffect(() => {
    if (!ref && wompiId) {
      setRecoveringRef(true);
      fetch(`${API_URL}/api/payments/wompi/transaction/${wompiId}`)
        .then(res => res.json())
        .then(data => {
          if (data && data.reference) {
            router.replace(`/registro-pro?ref=${data.reference}&months=${months}`);
          } else {
            setRecoveringRef(false);
          }
        })
        .catch(() => {
          setRecoveringRef(false);
        });
    }
  }, [ref, wompiId, months, router]);

  useEffect(() => {
    if (ref) {
      setFetchingPending(true);
      fetch(`${API_URL}/api/auth/pending-registration/${ref}`)
        .then(res => res.json())
        .then(data => {
          if (data && !data.error) {
            setPendingData(data);
          }
          setFetchingPending(false);
        })
        .catch(() => {
          setFetchingPending(false);
        });
    } else {
      setFetchingPending(false);
    }
  }, [ref]);

  // Efecto de auto-vinculación si ya hay sesión
  useEffect(() => {
    if (isAuthenticated && ref && pendingData && !loading && !autoLinking && !apiError) {
      if (pendingData.status === 'paid' || pendingData.status === 'confirmed') {
        // Si el pending es solo landing (plan=NONE) y el usuario ya tiene plan activo,
        // igual vinculamos — el backend ya protege el plan existente.
        // Pero si el email del pending no coincide con el usuario logueado y el plan no es NONE,
        // mostramos el formulario normal en lugar de auto-vincular para evitar sobreescribir planes.
        const brandPlanUpper = brand?.plan?.toUpperCase() || '';
        const hasActivePlan = brandPlanUpper === 'BASIC' || brandPlanUpper === 'PRO';
        const pendingPlanIsNone = !pendingData.plan || pendingData.plan.toUpperCase() === 'NONE';

        // Auto-vincular si: es solo landing (NONE) con plan activo, o si el plan del pending coincide
        if (pendingPlanIsNone || !hasActivePlan) {
          handleAutoLink();
        }
        // Si tiene plan activo y el pending quiere cambiar el plan, mostrar formulario normal
      }
    }
  }, [isAuthenticated, ref, pendingData]);

  async function handleAutoLink() {
    setAutoLinking(true);
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/api/auth/register-post-payment`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ ref, fingerprint }),
      });
      const data = await res.json();
      if (res.ok) {
        // Actualizar datos locales y redirigir
        localStorage.setItem('brand', JSON.stringify(data.brand));
        router.push('/dashboard');
      } else {
        setApiError(data.message || 'No se pudo vincular la compra automáticamente.');
        setAutoLinking(false);
      }
    } catch (err) {
      console.error('Auto-link error:', err);
      setAutoLinking(false);
    } finally {
      setLoading(false);
    }
  }

  if (recoveringRef || fetchingPending || autoLinking) {
    return (
      <main className="min-h-screen flex items-center justify-center px-4 py-12 bg-[#0a0a0a]">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-t-transparent border-[#FF5C3A] rounded-full animate-spin mx-auto mb-4"></div>
          <h2 className="text-white font-syne text-xl">
            {recoveringRef ? 'Recuperando tu pago...' : autoLinking ? 'Vinculando compra a tu cuenta...' : 'Cargando detalles...'}
          </h2>
          <p className="text-[#666] text-sm mt-2">
            {recoveringRef ? 'Estamos verificando la transacción.' : autoLinking ? `Detectamos tu sesión activa como ${brand?.name || 'marca'}.` : 'Preparando tu cuenta.'}
          </p>
        </div>
      </main>
    );
  }

  // Si no hay ref, mostrar error en lugar del formulario
  if (!ref) {
    return (
      <main className="min-h-screen flex items-center justify-center px-4 py-12 bg-[#0a0a0a]">
        <div className="w-full max-w-md text-center">
          <div className="flex justify-center mb-6">
            <Link href="/" className="flex items-center gap-2.5">
              <Image src="/logo.svg" alt="Lookitry" width={28} height={28} className="object-contain h-7 w-auto" priority />
              <span className="font-syne font-extrabold text-xl text-white tracking-tight">
                Look<span className="text-[#FF5C3A]">itry</span>
              </span>
            </Link>
          </div>
          <div className="bg-[#1f0f0f] border border-[#5a1a1a] rounded-xl p-8">
            <p className="text-[#ff6b6b] font-semibold text-[15px] mb-2">Referencia de pago requerida</p>
            <p className="text-[#666] text-[13px] mb-6">Accede desde el enlace de confirmación de tu pago.</p>
            <Link
              href="/"
              className="inline-block px-6 py-2 bg-[#2a2a2a] hover:bg-[#333] text-white text-[13px] font-medium rounded-lg transition-colors border border-[#444]"
            >
              Volver al inicio
            </Link>
          </div>
        </div>
      </main>
    );
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const { name, value } = e.target;
    if (name === 'name') {
      const slug = value
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9\s-]/g, '')
        .trim()
        .replace(/\s+/g, '-');
      setForm(prev => ({ ...prev, name: value, slug }));
    } else {
      setForm(prev => ({ ...prev, [name]: value }));
    }
    if (errors[name]) setErrors(prev => { const e = { ...prev }; delete e[name]; return e; });
  }

  function validate() {
    const e: Record<string, string> = {};
    if (!form.contact_name.trim() || form.contact_name.trim().length < 3) e.contact_name = 'Mínimo 3 caracteres';
    if (!form.name.trim() || form.name.trim().length < 2) e.name = 'Mínimo 2 caracteres';
    if (!/^[a-z0-9-]{3,}$/.test(form.slug)) e.slug = 'Solo minúsculas, números y guiones (mín. 3 caracteres)';
    if (form.password.length < 6) e.password = 'Mínimo 6 caracteres';
    // Validar email alternativo solo si está visible
    if (showAltEmail) {
      if (!altEmail.trim()) { setAltEmailError('Ingresa el correo electrónico'); return false; }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(altEmail.trim())) { setAltEmailError('Formato de correo inválido'); return false; }
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    setApiError('');
    setAltEmailError('');
    try {
      const body: Record<string, unknown> = { ...form, fingerprint, ref: ref || undefined };
      // Si el usuario ingresó un email alternativo, enviarlo para sobreescribir el del pago
      if (showAltEmail && altEmail.trim()) {
        body.override_email = altEmail.trim();
      }
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/api/auth/register-post-payment`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) {
        // Si el error es email duplicado, mostrar campo alternativo
        const msg: string = data.message || data.error || '';
        if (msg.toLowerCase().includes('email') || msg.toLowerCase().includes('correo') || msg.toLowerCase().includes('ya está')) {
          setShowAltEmail(true);
          setApiError('El correo del pago ya está registrado. Ingresa un correo diferente para crear tu cuenta:');
        } else {
          setApiError(msg || 'Error al crear la cuenta');
        }
        return;
      }
      localStorage.setItem('token', data.token);
      localStorage.setItem('brandToken', data.token);
      localStorage.setItem('brand', JSON.stringify(data.brand));
      router.push('/dashboard');
    } catch {
      setApiError('Error de conexión. Intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-4 py-12 bg-[#0a0a0a]">
      <div className="w-full max-w-md">

        <div className="flex justify-center mb-6">
          <Link href="/" className="flex items-center gap-2.5">
            <Image src="/logo.svg" alt="Lookitry" width={28} height={28} className="object-contain h-7 w-auto" priority />
            <span className="font-syne font-extrabold text-xl text-white tracking-tight">
              Look<span className="text-[#FF5C3A]">itry</span>
            </span>
          </Link>
        </div>

        <div className="bg-[rgba(255,92,58,0.06)] border border-[rgba(255,92,58,0.2)] rounded-xl px-5 py-4 mb-5 flex items-start gap-3">
          <IconCheck />
          <div>
            <p className="text-[13px] font-semibold text-[#FF5C3A]">Pago recibido correctamente</p>
            <p className="text-[12px] text-[#666] mt-0.5">
              Crea tu cuenta para activar tu Plan {pendingData ? pendingData.plan : 'Pro'} por {pendingData ? pendingData.months : months} {(!pendingData && months === 1) || pendingData?.months === 1 ? 'mes' : 'meses'}
              {pendingData?.includes_landing && ' + Mini-landing'}.
            </p>
          </div>
        </div>

        <div className="bg-[#141414] border border-[#2a2a2a] rounded-xl p-7 md:p-8">
          <h1 className="font-syne font-bold text-[22px] text-white mb-1">Crea tu cuenta</h1>
          <p className="text-[13px] text-[#555] mb-6">Un paso más para activar tu probador virtual.</p>

          {apiError && (
            <div className="bg-[#1f0f0f] border border-[#5a1a1a] text-[#ff6b6b] text-[13px] px-4 py-3 rounded-lg mb-3">
              {apiError}
            </div>
          )}

          {/* Campo de email alternativo — solo aparece cuando el email del pago ya existe */}
          {showAltEmail && (
            <div className="mb-5 border border-[#FF5C3A]/30 bg-[#FF5C3A]/5 rounded-lg px-4 py-3">
              <label className="block text-[12px] font-semibold text-[#FF5C3A] mb-1.5">
                Nuevo correo electrónico
              </label>
              <input
                type="email"
                value={altEmail}
                onChange={e => { setAltEmail(e.target.value); setAltEmailError(''); }}
                placeholder="otro@correo.com"
                className={`w-full bg-[#0f0f0f] border ${altEmailError ? 'border-[#5a1a1a]' : 'border-[#2a2a2a]'} rounded-lg px-3 py-2.5 text-[13px] text-white placeholder-[#333] focus:outline-none focus:border-[#FF5C3A] transition-colors`}
              />
              {altEmailError && <p className="text-[11px] text-[#ff6b6b] mt-1">{altEmailError}</p>}
              <p className="text-[11px] text-[#555] mt-1.5">
                Este correo se usará para iniciar sesión. El plan quedará activo en tu nueva cuenta.
              </p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">

            {/* Nombre y apellido */}
            <div>
              <label className="block text-[13px] font-medium text-[#888] mb-1.5">Nombre y apellido</label>
              <input
                name="contact_name" type="text" value={form.contact_name} onChange={handleChange}
                placeholder="Juan Pérez" required minLength={3}
                className={`w-full bg-[#0f0f0f] border ${errors.contact_name ? 'border-[#5a1a1a]' : 'border-[#2a2a2a]'} rounded-lg px-3 py-2.5 text-[13px] text-white placeholder-[#333] focus:outline-none focus:border-[#FF5C3A] transition-colors`}
              />
              {errors.contact_name && <p className="text-[11px] text-[#ff6b6b] mt-1">{errors.contact_name}</p>}
            </div>

            {/* Nombre de la marca */}
            <div>
              <label className="block text-[13px] font-medium text-[#888] mb-1.5">Nombre de la marca</label>
              <input
                name="name" type="text" value={form.name} onChange={handleChange}
                placeholder="Mi Tienda" required
                className={`w-full bg-[#0f0f0f] border ${errors.name ? 'border-[#5a1a1a]' : 'border-[#2a2a2a]'} rounded-lg px-3 py-2.5 text-[13px] text-white placeholder-[#333] focus:outline-none focus:border-[#FF5C3A] transition-colors`}
              />
              {errors.name && <p className="text-[11px] text-[#ff6b6b] mt-1">{errors.name}</p>}
            </div>

            {/* Slug */}
            <div>
              <label className="block text-[13px] font-medium text-[#888] mb-1.5">URL del probador</label>
              <div className={`flex bg-[#0f0f0f] border ${errors.slug ? 'border-[#5a1a1a]' : 'border-[#2a2a2a]'} rounded-lg overflow-hidden focus-within:border-[#FF5C3A] transition-colors`}>
                <span className="inline-flex items-center px-3 text-[#333] text-[13px] border-r border-[#2a2a2a]">/sitio/</span>
                <input
                  name="slug" type="text" value={form.slug} onChange={handleChange}
                  placeholder="mi-tienda" required
                  className="flex-1 px-3 py-2.5 text-[13px] text-white bg-transparent focus:outline-none placeholder-[#333]"
                />
              </div>
              {errors.slug && <p className="text-[11px] text-[#ff6b6b] mt-1">{errors.slug}</p>}
              <p className="text-[11px] text-[#333] mt-1">Con planes activos puedes cambiarlo después desde tu dashboard.</p>
            </div>

            {/* Contraseña */}
            <div>
              <label className="block text-[13px] font-medium text-[#888] mb-1.5">Contraseña</label>
              <div className="relative">
                <input
                  name="password" type={showPassword ? 'text' : 'password'} value={form.password}
                  onChange={handleChange} placeholder="Mínimo 6 caracteres" required minLength={6}
                  className={`w-full bg-[#0f0f0f] border ${errors.password ? 'border-[#5a1a1a]' : 'border-[#2a2a2a]'} rounded-lg px-3 py-2.5 pr-10 text-[13px] text-white placeholder-[#333] focus:outline-none focus:border-[#FF5C3A] transition-colors`}
                />
                <button
                  type="button" onClick={() => setShowPassword(v => !v)} tabIndex={-1}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#444] hover:text-[#888] focus:outline-none transition-colors"
                >
                  {showPassword ? <EyeOffIcon /> : <EyeIcon />}
                </button>
              </div>
              {errors.password && <p className="text-[11px] text-[#ff6b6b] mt-1">{errors.password}</p>}
            </div>

            <button
              type="submit" disabled={loading}
              className="w-full py-2.5 bg-[#FF5C3A] hover:bg-[#e84d2c] disabled:opacity-60 text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2 text-[13px] mt-2"
            >
              {loading ? <><IconSpinner /> Creando cuenta...</> : 'Activar Cuenta'}
            </button>
          </form>

          <p className="text-center text-[12px] text-[#444] mt-5">
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
