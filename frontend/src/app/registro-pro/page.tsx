'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/hooks/useAuth';
import { StepProgress } from '@/components/payments/StepProgress';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.lookitry.com';

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

import { Alert } from '@/components/ui/Alert';

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
    confirmPassword: '',
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
  const [pendingData, setPendingData] = useState<{
    plan: string;
    months: number;
    includes_landing: boolean;
    status: string;
    reference?: string;
    normalized_reference?: string;
    brand_name?: string;
  } | null>(null);
  const [fetchingPending, setFetchingPending] = useState(true);
  const [recheckingPending, setRecheckingPending] = useState(false);
  const { brand, isAuthenticated } = useAuth();
  const [autoLinking, setAutoLinking] = useState(false);
  const [loadingHelpVisible, setLoadingHelpVisible] = useState(false);

  useEffect(() => {
    getFingerprint().then(setFingerprint);
  }, []);

  async function recoverReferenceByTransactionId(transactionId: string, retries = 5): Promise<boolean> {
    try {
      const res = await fetch(`${API_URL}/api/payments/wompi/transaction/${transactionId}`);
      const data = await res.json();

      if (data && data.reference) {
        router.replace(`/registro-pro?ref=${data.reference}&months=${months}`);
        return true;
      }
    } catch {
      // noop
    }

    if (retries > 0) {
      await new Promise((resolve) => window.setTimeout(resolve, 1800));
      return recoverReferenceByTransactionId(transactionId, retries - 1);
    }

    return false;
  }

  useEffect(() => {
    let cancelled = false;

    if (!ref && wompiId) {
      setRecoveringRef(true);
      recoverReferenceByTransactionId(wompiId, 6)
        .then((resolved) => {
          if (!resolved && !cancelled) {
            setRecoveringRef(false);
          }
        })
        .catch(() => {
          if (!cancelled) {
            setRecoveringRef(false);
          }
        });
    }

    return () => {
      cancelled = true;
    };
  }, [ref, wompiId, months, router]);

  async function fetchPending(retries = 0): Promise<boolean> {
    if (!ref) return false;
    try {
      const res = await fetch(`${API_URL}/api/auth/pending-registration/${ref}`);
      const data = await res.json();
      if (data && !data.error) {
        setPendingData(data);
        return true;
      }
    } catch {
      // noop
    }

    if (retries > 0) {
      await new Promise((resolve) => window.setTimeout(resolve, 1200));
      return fetchPending(retries - 1);
    }

    return false;
  }

  useEffect(() => {
    if (ref) {
      setFetchingPending(true);
      fetchPending(2)
        .finally(() => setFetchingPending(false));
    } else {
      setFetchingPending(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ref]);

  useEffect(() => {
    if (!(recoveringRef || fetchingPending || autoLinking)) {
      setLoadingHelpVisible(false);
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setLoadingHelpVisible(true);
    }, 12000);

    return () => window.clearTimeout(timeoutId);
  }, [recoveringRef, fetchingPending, autoLinking]);

  // Efecto de auto-vinculación si ya hay sesión
  useEffect(() => {
    if (isAuthenticated && ref && pendingData && !loading && !autoLinking && !apiError) {
      if (pendingData.status === 'paid' || pendingData.status === 'confirmed') {
        const brandPlanUpper = brand?.plan?.toUpperCase() || '';
        const hasActivePlan = brandPlanUpper === 'BASIC' || brandPlanUpper === 'PRO';
        const pendingPlanIsNone = !pendingData.plan || pendingData.plan.toUpperCase() === 'NONE';

        if (pendingPlanIsNone || !hasActivePlan) {
          handleAutoLink();
        }
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
        localStorage.setItem('brand', JSON.stringify(data.brand));
        window.location.href = '/dashboard';
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
        <div className="w-full max-w-xl rounded-[28px] border border-[#262626] bg-[#101010] p-8 md:p-10 shadow-[0_30px_80px_rgba(0,0,0,0.45)]">
          <div className="w-12 h-12 border-4 border-t-transparent border-[#FF5C3A] rounded-full animate-spin mx-auto mb-4"></div>
          <h2 className="text-white font-jakarta text-2xl font-bold tracking-tight">
            {recoveringRef ? 'Estamos localizando tu compra' : autoLinking ? 'Estamos activando tu compra' : 'Estamos preparando tu activacion'}
          </h2>
          <p className="mx-auto mt-3 max-w-md text-[15px] leading-7 text-[#b0b0b0]">
            {recoveringRef ? 'Estamos verificando la transacción.' : autoLinking ? `Detectamos tu sesión activa como ${brand?.name || 'tu marca'}.` : 'Preparando tu cuenta.'}
          </p>
          <div className="mt-6 max-w-md rounded-2xl border border-[#262626] bg-[#111] px-5 py-4 text-left">
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#FF5C3A]">
              Que esta pasando
            </p>
            <p className="mt-2 text-sm leading-6 text-[#c8c8c8]">
              Estamos validando el pago y sincronizando la referencia para terminar la activacion sin duplicar el cobro.
            </p>
          </div>
          {loadingHelpVisible && (
            <div className="mt-4 max-w-md rounded-2xl border border-[#FF5C3A]/20 bg-[#FF5C3A]/8 px-5 py-4 text-left">
              <p className="text-sm font-bold text-white">Esto ya esta tardando mas de lo normal.</p>
              <p className="mt-2 text-sm leading-6 text-[#d6c0b8]">
                Si el pago ya fue aprobado, no necesitas volver a pagar. Puedes reintentar la verificacion o revisar tu suscripcion.
              </p>
              <div className="mt-4 flex flex-wrap gap-3">
                {wompiId && !ref && (
                  <button
                    type="button"
                    onClick={() => {
                      setLoadingHelpVisible(false);
                      setRecoveringRef(true);
                      recoverReferenceByTransactionId(wompiId, 3).then((resolved) => {
                        if (!resolved) {
                          setRecoveringRef(false);
                        }
                      });
                    }}
                    className="rounded-xl bg-[#FF5C3A] px-4 py-2.5 text-[11px] font-bold uppercase tracking-[0.14em] text-white transition-all hover:bg-[#ff6c4d]"
                  >
                    Reintentar
                  </button>
                )}
                {ref && (
                  <button
                    type="button"
                    onClick={async () => {
                      setLoadingHelpVisible(false);
                      setRecheckingPending(true);
                      await fetchPending(2);
                      setRecheckingPending(false);
                    }}
                    className="rounded-xl bg-[#FF5C3A] px-4 py-2.5 text-[11px] font-bold uppercase tracking-[0.14em] text-white transition-all hover:bg-[#ff6c4d]"
                  >
                    {recheckingPending ? 'Verificando...' : 'Revisar pago'}
                  </button>
                )}
                <Link
                  href="/dashboard/subscription"
                  className="rounded-xl border border-[#303030] px-4 py-2.5 text-[11px] font-bold uppercase tracking-[0.14em] text-white/85 transition-all hover:border-[#FF5C3A]/40 hover:text-white"
                >
                  Ver suscripcion
                </Link>
              </div>
            </div>
          )}
        </div>
      </main>
    );
  }

  // Si no hay ref o no se encuentra (Error corregido para que no se muera la página si falla el fetch inicial)
  const noRefFound = (ref && !pendingData && !fetchingPending);

  if (!ref || noRefFound) {
    return (
      <main className="min-h-screen flex items-center justify-center px-4 py-12 bg-[#0a0a0a]">
        <div className="w-full max-w-md">
          <div className="flex justify-center mb-8">
            <Link href="/" className="flex items-center gap-2.5">
              <Image src="/logo.svg" alt="Lookitry" width={28} height={28} className="object-contain h-7 w-auto" priority />
              <span className="font-jakarta font-extrabold text-xl text-white tracking-tight">
                Look<span className="text-[#FF5C3A]">itry</span>
              </span>
            </Link>
          </div>
          <Alert 
            type="error"
            title={noRefFound ? "Referencia no encontrada" : "Referencia de pago requerida"}
            message={noRefFound 
              ? "No pudimos encontrar la información de tu compra. Si completaste el pago, contacta a soporte."
              : "Accede desde el enlace de confirmación de tu pago para terminar el registro."
            }
            className="mb-8"
          />
          <div className="text-center">
            <Link
              href="/"
              className="inline-block px-8 py-3 bg-[#111] hover:bg-[#1a1a1a] text-white text-[13px] font-bold rounded-xl transition-all border border-[#222] hover:border-[#333]"
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
    if (form.password.length < 8) e.password = 'La contraseña debe tener al menos 8 caracteres';
    if (form.password !== form.confirmPassword) e.confirmPassword = 'Las contraseñas no coinciden';
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
        const msg: string = data.message || data.error || '';
        if (msg.toLowerCase().includes('email') || msg.toLowerCase().includes('correo') || msg.toLowerCase().includes('ya está')) {
          setShowAltEmail(true);
          setApiError('El correo del pago ya está registrado. Ingresa uno nuevo:');
        } else {
          setApiError(msg || 'Error al crear la cuenta');
        }
        return;
      }
      localStorage.setItem('token', data.token);
      localStorage.setItem('brandToken', data.token);
      localStorage.setItem('brand', JSON.stringify(data.brand));
      window.location.href = '/dashboard';
    } catch {
      setApiError('Error de conexión. Intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-4 py-12 bg-[#0a0a0a]">
      <div className="w-full max-w-md">

        <div className="flex justify-center mb-8">
          <Link href="/" className="flex items-center gap-2.5">
            <Image src="/logo.svg" alt="Lookitry" width={28} height={28} className="object-contain h-7 w-auto" priority />
            <span className="font-jakarta font-extrabold text-xl text-white tracking-tight">
              Look<span className="text-[#FF5C3A]">itry</span>
            </span>
          </Link>
        </div>

        {/* Progress Bar (Step 4: Activation) */}
        <div className="mb-12">
          <StepProgress currentStep={4} maxNavigableStep={4} lockedAfterPayment />
        </div>

        <Alert 
          type="success"
          title="Pago validado correctamente"
          message={`Tu cuenta está lista para ser activada. Completa estos datos finales para activar tu Plan ${pendingData ? pendingData.plan : 'Pro'} por ${pendingData ? pendingData.months : months} ${(!pendingData && months === 1) || pendingData?.months === 1 ? 'mes' : 'meses'}${pendingData?.includes_landing ? ' + Mini-landing' : ''}.`}
          className="mb-6 shadow-[0_0_20px_rgba(255,92,58,0.12)] border-[#FF5C3A]/20"
        />

        {pendingData?.status && pendingData.status !== 'paid' && pendingData.status !== 'used' && (
          <Alert
            type="info"
            title="Verificando confirmación del pago"
            message="Tu pago puede tardar unos minutos en reflejarse. Si ya pagaste, espera 1–2 minutos y vuelve a verificar."
            className="mb-6"
          />
        )}

        <div className="bg-[#111] border border-[#222] rounded-2xl p-8 shadow-2xl relative overflow-hidden">
          {/* Subtle background glow */}
          <div className="absolute -top-24 -right-24 w-48 h-48 bg-[#FF5C3A] rounded-full blur-[100px] opacity-10 pointer-events-none" />
          
          <h1 className="font-jakarta font-bold text-[24px] text-white mb-1 tracking-tight">Activa tu acceso</h1>
          <p className="text-[13px] text-[#999] mb-8">Tu pago ya fue localizado. Completa estos datos finales para entrar a Lookitry.</p>

          {apiError && (
            <Alert type="error" message={apiError} className="mb-6" />
          )}

          <div className="mb-6 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={async () => {
                if (!ref) return;
                setRecheckingPending(true);
                await fetchPending(1);
                setRecheckingPending(false);
              }}
              className="px-4 py-2 rounded-xl border border-[#222] bg-[#0d0d0d] hover:bg-[#141414] text-[12px] text-white/80 font-bold transition-all disabled:opacity-50"
              disabled={recheckingPending}
            >
              {recheckingPending ? 'Verificando...' : 'Volver a verificar pago'}
            </button>
            {pendingData?.status && (
              <span className="text-[10px] text-white/30 font-mono uppercase tracking-widest">
                Estado: {{
                  'paid': 'Pagado',
                  'confirmed': 'Confirmado',
                  'used': 'Completado',
                  'expired': 'Expirado',
                  'pending_activation': 'Pendiente de activación'
                }[pendingData.status] || pendingData.status}
              </span>
            )}
          </div>

          {showAltEmail && (
            <div className="mb-6 bg-[#1a1a1a] rounded-xl p-4 border border-[#222]">
              <label className="block text-[12px] font-bold text-[#FF5C3A] uppercase tracking-wider mb-2">
                Nuevo correo de acceso
              </label>
              <input
                type="email"
                value={altEmail}
                onChange={e => { setAltEmail(e.target.value); setAltEmailError(''); }}
                placeholder="ejemplo@correo.com"
                className={`w-full bg-[#050505] border ${altEmailError ? 'border-red-500/50' : 'border-[#333]'} rounded-xl px-4 py-3 text-[14px] text-white placeholder-[#444] focus:outline-none focus:border-[#FF5C3A] transition-all`}
              />
              {altEmailError && <p className="text-[11px] text-red-500 mt-1.5">{altEmailError}</p>}
              <p className="text-[11px] text-[#999] mt-2 leading-relaxed">
                Este correo se usará para iniciar sesión. El plan se activará en esta nueva cuenta.
              </p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-[13px] font-semibold text-[#888] mb-2 font-jakarta uppercase tracking-wider">Nombre del responsable</label>
              <input
                name="contact_name" type="text" value={form.contact_name} onChange={handleChange}
                placeholder="Nombre y Apellido" required minLength={3}
                className={`w-full bg-[#0d0d0d] border ${errors.contact_name ? 'border-red-500/50' : 'border-[#222]'} rounded-xl px-4 py-3 text-[14px] text-white placeholder-[#2a2a2a] focus:outline-none focus:border-[#FF5C3A] transition-all`}
              />
              {errors.contact_name && <p className="text-[11px] text-red-500 mt-1.5">{errors.contact_name}</p>}
            </div>

            <div>
              <label className="block text-[13px] font-semibold text-[#888] mb-2 font-jakarta uppercase tracking-wider">Nombre de tu marca</label>
              <input
                name="name" type="text" value={form.name} onChange={handleChange}
                placeholder="Ej. Glow Fashion" required
                className={`w-full bg-[#0d0d0d] border ${errors.name ? 'border-red-500/50' : 'border-[#222]'} rounded-xl px-4 py-3 text-[14px] text-white placeholder-[#2a2a2a] focus:outline-none focus:border-[#FF5C3A] transition-all`}
              />
              {errors.name && <p className="text-[11px] text-red-500 mt-1.5">{errors.name}</p>}
            </div>

            <div>
              <label className="block text-[13px] font-semibold text-[#888] mb-2 font-jakarta uppercase tracking-wider">URL de tu sitio</label>
              <div className={`flex bg-[#0d0d0d] border ${errors.slug ? 'border-red-500/50' : 'border-[#222]'} rounded-xl overflow-hidden focus-within:border-[#FF5C3A] transition-all`}>
                <span className="inline-flex items-center px-4 text-[#444] text-[13px] border-r border-[#222] font-mono">/sitio/</span>
                <input
                  name="slug" type="text" value={form.slug} onChange={handleChange}
                  placeholder="mi-tienda" required autoComplete="off"
                  className="flex-1 px-4 py-3 text-[14px] text-white bg-transparent focus:outline-none placeholder-[#2a2a2a]"
                />
              </div>
              {errors.slug && <p className="text-[11px] text-red-500 mt-1.5">{errors.slug}</p>}
              <p className="text-[10px] text-[#444] mt-2 italic">Podrás cambiarlo después desde tu panel.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-[13px] font-semibold text-[#888] mb-2 font-jakarta uppercase tracking-wider">Contraseña</label>
                <div className="relative">
                  <input
                    name="password" type={showPassword ? 'text' : 'password'} value={form.password}
                    onChange={handleChange} placeholder="8+ caracteres" required minLength={8}
                    className={`w-full bg-[#0d0d0d] border ${errors.password ? 'border-red-500/50' : 'border-[#222]'} rounded-xl px-4 py-3 pr-12 text-[14px] text-white placeholder-[#2a2a2a] focus:outline-none focus:border-[#FF5C3A] transition-all`}
                  />
                  <button
                    type="button" onClick={() => setShowPassword(v => !v)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-[#444] hover:text-[#FF5C3A] transition-colors"
                  >
                    {showPassword ? <EyeOffIcon /> : <EyeIcon />}
                  </button>
                </div>
                {errors.password && <p className="text-[11px] text-red-500 mt-1.5">{errors.password}</p>}
              </div>

              <div>
                <label className="block text-[13px] font-semibold text-[#888] mb-2 font-jakarta uppercase tracking-wider">Confirmar</label>
                <div className="relative">
                  <input
                    name="confirmPassword" type={showPassword ? 'text' : 'password'} value={form.confirmPassword}
                    onChange={handleChange} placeholder="Repite contraseña" required minLength={8}
                    className={`w-full bg-[#0d0d0d] border ${errors.confirmPassword ? 'border-red-500/50' : 'border-[#222]'} rounded-xl px-4 py-3 pr-12 text-[14px] text-white placeholder-[#2a2a2a] focus:outline-none focus:border-[#FF5C3A] transition-all`}
                  />
                </div>
                {errors.confirmPassword && <p className="text-[11px] text-red-500 mt-1.5">{errors.confirmPassword}</p>}
              </div>
            </div>

            <button
              type="submit" disabled={loading}
              className="w-full py-4 bg-[#FF5C3A] hover:bg-[#ff6c4d] disabled:opacity-50 text-white font-bold rounded-xl transition-all shadow-lg hover:shadow-[#FF5C3A]/20 flex items-center justify-center gap-3 text-[14px] mt-6"
            >
              {loading ? <><IconSpinner /> Validando datos...</> : 'Confirmar y Activar Probador'}
            </button>
          </form>

          <div className="mt-8 border-t border-[#222] pt-6 text-center">
            <p className="text-[12px] text-[#999]">
              ¿Ya tienes cuenta activa?{' '}
              <Link href="/login" className="text-white hover:text-[#FF5C3A] transition-colors font-bold underline underline-offset-4 decoration-[#FF5C3A]/30">Ingresa aquí</Link>
            </p>
          </div>
        </div>

        {ref && (
          <div className="mt-8 text-center">
            <span className="inline-block px-3 py-1 bg-[#111] rounded-full border border-[#222] text-[10px] text-[#444] font-mono tracking-widest uppercase">
              Código de activación: {ref}
            </span>
          </div>
        )}
      </div>
    </main>
  );
}

export default function RegistroProPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#FF5C3A] border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <RegistroProContent />
    </Suspense>
  );
}
