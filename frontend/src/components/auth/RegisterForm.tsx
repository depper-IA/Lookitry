'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';

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
  const [form, setForm] = useState({ name: '', contact_name: '', email: '', password: '', slug: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [trialActive, setTrialActive] = useState<boolean | null>(null);
  const [trialDays, setTrialDays] = useState(7);
  const [fingerprint, setFingerprint] = useState<string | null>(null);
  const [prefilledFields, setPrefilledFields] = useState<Record<string, boolean>>({});

  const [isPaidFlow, setIsPaidFlow] = useState(false);
  const [paymentRef, setPaymentRef] = useState<string | null>(null);

  const slugify = (value: string) =>
    value
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9\s-]/g, '')
      .trim()
      .replace(/\s+/g, '-');

  const suggestAlternativeSlug = () => {
    const base = (form.slug || slugify(form.name) || 'mi-marca').replace(/-+$/g, '');
    const suffix = Math.floor(100 + Math.random() * 900); // 3 dígitos
    setForm(prev => ({ ...prev, slug: `${base}-${suffix}` }));
    setError('');
  };

  useEffect(() => {
    // 1. Verificar si viene de un pago exitoso (funnel invertido)
    const params = new URLSearchParams(window.location.search);
    const ref = params.get('ref');
    const isTrialParam = params.get('isTrial') === 'true';

    if (ref) {
      setPaymentRef(ref);
      setIsPaidFlow(true);
      setLoadingStep('Verificando tu pago...');

      // Cargar datos desde el registro pendiente
      fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/pending-registration/${ref}`)
        .then(r => r.json())
        .then(data => {
          if (data.email) {
            const brandName = data.brand_name || '';
            const slug = (data as any).slug || (brandName
              ? brandName
                .toLowerCase()
                .normalize('NFD')
                .replace(/[\u0300-\u036f]/g, '')
                .replace(/[^a-z0-9\s-]/g, '')
                .trim()
                .replace(/\s+/g, '-')
              : '');

            setForm(prev => ({
              ...prev,
              email: data.email,
              name: brandName,
              slug: slug || prev.slug
            }));

            // Marcar campos como pre-rellenados si traen datos
            setPrefilledFields({
              email: !!data.email,
              name: !!brandName,
              slug: !!(data as any).slug || !!slug
            });
          }
          setLoadingStep('');
        })
        .catch(err => {
          console.error('Error fetching pending registration:', err);
          setLoadingStep('');
        });
    }

    // 2. Fingerprint
    getFingerprint().then(setFingerprint);

    // 3. Status del trial (solo si no es flow pagado)
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/trial/status`)
      .then((r) => r.json())
      .then((d) => {
        const isActive = d.trialAvailable === true || d.active === true;

        // MARKETING OPTIMIZATION: Si no hay trial gratuito y no viene de un pago,
        // redirigimos al checkout de pago para que el usuario no se detenga.
        if (!isActive && !ref) {
          router.push('/trial-checkout');
          return;
        }

        // Si es flujo pagado, forzamos trialActive a true para que no muestre el bloqueo
        setTrialActive(ref ? true : isActive);
        if (isActive || ref) {
          setTrialDays(d.trialDays ?? d.trial_days ?? 7);
        }
      })
      .catch(() => {
        if (!ref) {
          router.push('/trial-checkout');
        } else {
          setTrialActive(true);
        }
      });
  }, [router]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    if (name === 'name') {
      const newSlug = slugify(value);
      setForm((prev) => ({ ...prev, name: value, slug: prev.slug ? prev.slug : newSlug }));
    } else {
      setForm((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      setLoadingStep('Creando tu cuenta...');

      // Si es flujo pagado, usamos el endpoint post-pago que no tiene Turnstile ni validaciones de abuso
      const endpoint = isPaidFlow ? '/api/auth/register-post-payment' : '/api/auth/register';
      const body = isPaidFlow ? { ...form, ref: paymentRef } : { ...form, fingerprint };

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();

      if (!res.ok) {
        if (data.error === 'TRIAL_ABUSE') {
          setError('Ya existe una cuenta de prueba registrada desde este dispositivo o red. Puedes contratar un plan directamente.');
        } else {
          setError(data.message || data.error || 'Error al registrar');
        }
        return;
      }

      // Guardar token
      localStorage.setItem('token', data.token);
      localStorage.setItem('brandToken', data.token);

      // Si ya pagó, va directo al dashboard. Si no, va al checkout.
      if (isPaidFlow) {
        setLoadingStep('¡Listo! Entrando al sistema...');
        router.push('/dashboard');
      } else {
        setLoadingStep('Redirigiendo al checkout...');
        router.push('/trial-checkout');
      }
    } catch (err: any) {
      setError(err.message || 'Error de conexión. Intenta de nuevo.');
    } finally {
      setLoading(false);
      setLoadingStep('');
    }
  };

  // ── Cargando estado del trial ──────────────────────────────────────────────
  if (trialActive === null) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#0a0a0a' }}>
        <div className="w-6 h-6 border-2 border-[#FF5C3A] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // ── Sin trial activo ───────────────────────────────────────────────────────
  if (trialActive === false) {
    return (
      <div
        className="min-h-screen flex items-center justify-center px-4 py-12 bg-[#0a0a0a]"
      >
        <div className="w-full max-w-md">
          <div className="flex justify-center mb-8">
            <Link href="/" className="flex items-center gap-2.5">
              <Image src="/logo.svg" alt="Lookitry" width={28} height={28} className="object-contain h-7 w-auto" priority />
              <span className="font-syne font-extrabold text-xl text-white tracking-tight">
                Look<span className="text-[#FF5C3A]">itry</span>
              </span>
            </Link>
          </div>
          <div className="bg-[#141414] border border-[#2a2a2a] rounded-xl p-7 md:p-8 text-center">
            <div className="w-14 h-14 rounded-full bg-[#1f1f1f] flex items-center justify-center mx-auto mb-5">
              <svg className="w-7 h-7 text-[#FF5C3A]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z" />
              </svg>
            </div>
            <h1 className="font-syne font-bold text-[20px] text-white mb-2">
              No hay prueba activa
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

  // ── Formulario de registro ─────────────────────────────────────────────────
  return (
    <div
      className="min-h-screen flex items-center justify-center px-4 py-12 bg-[#0a0a0a]"
    >
      <div className="w-full max-w-md">

        <div className="flex justify-center mb-8">
          <Link href="/" className="flex items-center gap-2.5">
            <Image src="/logo.svg" alt="Lookitry" width={28} height={28} className="object-contain h-7 w-auto" priority />
            <span className="font-syne font-extrabold text-xl text-white tracking-tight">
              Look<span className="text-[#FF5C3A]">itry</span>
            </span>
          </Link>
        </div>

        <div className="bg-[#141414] border border-[#2a2a2a] rounded-xl p-7 md:p-8">
          <h1 className="font-syne font-bold text-[22px] text-white mb-1">
            {isPaidFlow ? '¡Pago confirmado!' : 'Crear cuenta'}
          </h1>
          <p className="text-[13px] text-[#FF5C3A] mb-6">
            {isPaidFlow
              ? 'Completa estos últimos datos para entrar a tu dashboard'
              : `Prueba por $20.000 COP — ${trialDays} días`}
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Nombre de la marca */}
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
              {isPaidFlow && (
                <p className="text-[11px] text-[#555] mt-1 italic">Puedes ajustar el nombre de marca si ya existe una similar.</p>
              )}
            </div>

            {/* Nombre Completo */}
            <div>
              <label className="block text-[13px] font-medium text-[#888] mb-1.5">
                Nombre completo (Responsable)
              </label>
              <input
                name="contact_name"
                value={form.contact_name}
                onChange={handleChange}
                required
                placeholder="Juan Pérez"
                className="w-full bg-[#0f0f0f] border border-[#2a2a2a] rounded-lg px-3 py-2.5 text-[13px] text-white placeholder-[#333] focus:outline-none focus:border-[#FF5C3A] transition-colors"
              />
            </div>

            {/* Slug */}
            <div>
              <label className="block text-[13px] font-medium text-[#888] mb-1.5">
                Slug (URL del probador)
              </label>
              <div className={`flex items-center bg-[#0f0f0f] border border-[#2a2a2a] rounded-lg overflow-hidden transition-colors ${isPaidFlow ? 'border-[#333]' : 'focus-within:border-[#FF5C3A]'}`}>
                <span className="px-3 py-2.5 text-[#333] text-[13px] border-r border-[#2a2a2a] whitespace-nowrap">
                  /sitio/
                </span>
                <input
                  name="slug"
                  value={form.slug}
                  onChange={(e) => setForm({ ...form, slug: slugify(e.target.value) })}
                  placeholder="mi-marca"
                  className="flex-1 px-3 py-2.5 text-[13px] text-white bg-transparent focus:outline-none placeholder-[#333]"
                />
              </div>
              <div className="flex items-center justify-between mt-1">
                <p className="text-[11px] text-[#555]">Si está ocupado, prueba con una variación.</p>
                <button
                  type="button"
                  onClick={suggestAlternativeSlug}
                  className="text-[11px] text-[#FF5C3A] hover:text-[#e84d2c] transition-colors"
                >
                  Sugerir otro
                </button>
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="block text-[13px] font-medium text-[#888] mb-1.5">Email</label>
              <input
                name="email"
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                required
                readOnly={isPaidFlow && prefilledFields.email}
                placeholder="hola@mimarca.com"
                className={`w-full bg-[#0f0f0f] border border-[#2a2a2a] rounded-lg px-3 py-2.5 text-[13px] text-white placeholder-[#333] focus:outline-none focus:border-[#FF5C3A] transition-colors ${isPaidFlow && prefilledFields.email ? 'opacity-60 cursor-not-allowed' : ''}`}
              />
            </div>

            {/* Contraseña */}
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
                {error.toLowerCase().includes('slug ya está en uso') && (
                  <div className="mt-2">
                    <button
                      type="button"
                      onClick={suggestAlternativeSlug}
                      className="text-[#FF5C3A] underline font-medium"
                    >
                      Generar slug alternativo
                    </button>
                  </div>
                )}
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
              className="w-full bg-[#FF5C3A] hover:bg-[#e84d2c] disabled:opacity-50 text-white font-medium py-2.5 rounded-lg text-[13px] transition-colors mt-2 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <svg className="w-4 h-4 animate-spin shrink-0" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                  </svg>
                  {loadingStep || 'Procesando...'}
                </>
              ) : (
                `Empezar prueba de ${trialDays} días`
              )}
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
