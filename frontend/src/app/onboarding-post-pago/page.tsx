'use client';

import { useEffect, useState, Suspense, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Loader2, Store, Globe, AlertCircle, CheckCircle2, XCircle, Check, Eye, EyeOff } from 'lucide-react';

function slugify(value: string) {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-');
}

interface AvailabilityResult {
  brandExists: boolean;
  slugExists: boolean;
  suggestedSlug?: string;
}

function OnboardingContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const plan = searchParams.get('plan') || 'PRO';
  const months = Number(searchParams.get('months') || 1);
  const refFromQuery = searchParams.get('ref') || '';
  const paymentMethod = searchParams.get('method') || '';
  const paypalOrderId = searchParams.get('token') || '';
  const isTrial = searchParams.get('isTrial') === 'true';

  const [form, setForm] = useState({
    name: '',
    slugSuffix: '',
    password: '',
    confirmPassword: '',
  });
  const [slug, setSlug] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [resolvedRef, setResolvedRef] = useState(refFromQuery);
  const [confirmingPayment, setConfirmingPayment] = useState(paymentMethod === 'paypal' && Boolean(paypalOrderId));
  const [paymentChecked, setPaymentChecked] = useState(paymentMethod !== 'paypal' || !paypalOrderId);

  // Availability states
  const [checkingAvailability, setCheckingAvailability] = useState(false);
  const [availabilityResult, setAvailabilityResult] = useState<AvailabilityResult | null>(null);
  const [slugError, setSlugError] = useState('');

  useEffect(() => {
    let cancelled = false;

    const confirmPaypalPayment = async () => {
      if (paymentMethod !== 'paypal' || !paypalOrderId) {
        setPaymentChecked(true);
        setConfirmingPayment(false);
        return;
      }

      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://api.lookitry.com';
        const res = await fetch(`${apiUrl}/api/payments/paypal/capture`, {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            orderId: paypalOrderId,
            reference: refFromQuery || undefined,
          }),
        });
        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.message || data.error || 'No se pudo confirmar el pago con PayPal');
        }

        if (!cancelled) {
          if (data?.reference) {
            setResolvedRef(data.reference);
          }
          setError('');
          setPaymentChecked(true);
        }
      } catch (err: any) {
        if (!cancelled) {
          setError(err?.message || 'No se pudo confirmar el pago con PayPal');
          setPaymentChecked(false);
        }
      } finally {
        if (!cancelled) {
          setConfirmingPayment(false);
        }
      }
    };

    confirmPaypalPayment();

    return () => {
      cancelled = true;
    };
  }, [paymentMethod, paypalOrderId, refFromQuery]);

  const checkAvailability = useCallback(async (brandName: string) => {
    if (!brandName.trim() || brandName.length < 2) {
      setAvailabilityResult(null);
      setSlug('');
      return;
    }

    setCheckingAvailability(true);
    setSlugError('');

    try {
      const response = await fetch('/api/brands/check-availability', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ brandName }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error al verificar disponibilidad');
      }

      setAvailabilityResult({
        brandExists: data.brandExists,
        slugExists: data.slugExists,
        suggestedSlug: data.suggestedSlug,
      });

      // Generate slug based on result
      const baseSlug = slugify(brandName);
      if (data.brandExists && form.slugSuffix) {
        setSlug(`${baseSlug}-${form.slugSuffix}`);
      } else if (data.brandExists) {
        setSlug(baseSlug);
      } else {
        setSlug(baseSlug);
      }
    } catch (err: any) {
      console.error('Error verificando disponibilidad:', err);
      setSlugError(err.message || 'No se pudo verificar');
    } finally {
      setCheckingAvailability(false);
    }
  }, [form.slugSuffix]);

  const handleNameBlur = () => {
    if (form.name.trim().length >= 2) {
      checkAvailability(form.name);
    }
  };

  const handleSuffixChange = (value: string) => {
    setForm(prev => ({ ...prev, slugSuffix: value }));
    const baseSlug = slugify(form.name);
    if (availabilityResult?.brandExists && value) {
      setSlug(`${baseSlug}-${value}`);
      setSlugError('');
    } else if (availabilityResult?.brandExists) {
      setSlug(baseSlug);
    }
  };

  const validatePassword = (pwd: string) => {
    if (pwd.length < 8) return 'Mínimo 8 caracteres';
    if (!/[A-Z]/.test(pwd)) return 'Debe tener al menos una mayúscula';
    if (!/[a-z]/.test(pwd)) return 'Debe tener al menos una minúscula';
    if (!/[0-9]/.test(pwd)) return 'Debe tener al menos un número';
    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(pwd)) return 'Debe tener al menos un carácter especial';
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSlugError('');

    if (!paymentChecked || !resolvedRef) {
      setError('Aún no pudimos validar tu pago. Espera unos segundos o recarga la página.');
      return;
    }

    if (!form.name.trim()) {
      setError('El nombre de tu marca es requerido');
      return;
    }

    if (!slug.trim()) {
      setError('El nombre de tu marca es requerido');
      return;
    }

    // Check slug availability one more time if brand exists
    if (availabilityResult?.brandExists) {
      if (availabilityResult.slugExists && !form.slugSuffix) {
        setSlugError('Agrega algo extra al nombre para diferenciarlo');
        return;
      }
      if (availabilityResult.slugExists && form.slugSuffix) {
        setSlugError('Este nombre ya existe, intenta otro');
        return;
      }
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
          slug: slug.trim(),
          customSuffix: form.slugSuffix.trim() || '',
          password: form.password,
          reference: resolvedRef,
          plan,
          months,
          isTrial,
          method: paymentMethod === 'paypal' || resolvedRef.startsWith('PAYPAL-') ? 'paypal' : 'wompi',
          orderId: paymentMethod === 'paypal' ? paypalOrderId : undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.error === 'SLUG_TAKEN') {
          setSlugError('Esta URL ya está en uso. Agrega algo diferente al nombre.');
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

  const finalSlug = availabilityResult?.brandExists && form.slugSuffix
    ? `${slugify(form.name)}-${form.slugSuffix}`
    : slug;

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-[#050505]">
      <div className="w-full max-w-lg">
        <div className="flex flex-col items-center mb-10">
          <Link href="/" className="flex items-center gap-3 group mb-4">
            <Image src="/logo.svg" alt="Lookitry" width={32} height={32} className="group-hover:rotate-12 transition-transform duration-500" priority />
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
              Configura tu marca
            </h1>
            <p className="text-sm text-[#999] max-w-xs mx-auto leading-relaxed">
              Tu pago fue confirmado. Solo necesitamos el nombre de tu marca y crear una contraseña para tu cuenta.
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
              {confirmingPayment && (
                <div className="rounded-xl border border-[#FF5C3A]/20 bg-[#FF5C3A]/5 px-4 py-4 text-[#bbb] flex items-start gap-3">
                  <Loader2 className="w-4 h-4 mt-0.5 text-[#FF5C3A] animate-spin" />
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-tight text-[#FF5C3A]">Confirmando pago PayPal</p>
                    <p className="text-[12px] leading-relaxed mt-1">Estamos validando tu pago antes de crear la cuenta. No cierres esta ventana.</p>
                  </div>
                </div>
              )}

              {/* Nombre de marca */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-[#999] uppercase tracking-wider flex items-center gap-1.5 ml-1 leading-none">
                  <Store className="w-3 h-3 text-[#FF5C3A]" /> Nombre de tu marca
                </label>
                <input
                  value={form.name}
                  onChange={e => {
                    setForm(prev => ({ ...prev, name: e.target.value }));
                    setAvailabilityResult(null);
                    setSlug('');
                  }}
                  onBlur={handleNameBlur}
                  required
                  placeholder="Ej: Velvet Studio"
                  className="w-full rounded-xl border border-[rgba(255,255,255,0.08)] bg-[#050505] px-4 py-3 text-sm text-white placeholder-[#666] outline-none transition-all shadow-inner focus:border-[#FF5C3A]"
                />
              </div>

              {/* Preview del slug */}
              {form.name.length >= 2 && (
                <div className="space-y-3">
                  <div className="rounded-xl border border-[rgba(255,255,255,0.06)] bg-[#050505]/50 px-4 py-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Globe className="w-3.5 h-3.5 text-[#666]" />
                        <span className="text-xs text-[#999]">Así aparecerá en internet:</span>
                      </div>
                      {checkingAvailability ? (
                        <Loader2 className="w-4 h-4 text-[#FF5C3A] animate-spin" />
                      ) : availabilityResult ? (
                        availabilityResult.slugExists ? (
                          <XCircle className="w-4 h-4 text-red-500" />
                        ) : (
                          <CheckCircle2 className="w-4 h-4 text-green-500" />
                        )
                      ) : null}
                    </div>
                    <p className="text-sm text-white font-medium mt-1.5 font-mono">
                      lookitry.com/sitio/<span className="text-[#FF5C3A]">{finalSlug || slugify(form.name)}</span>
                    </p>
                  </div>

                  {/* Campo extra si el nombre ya existe */}
                  {availabilityResult?.brandExists && (
                    <div className="rounded-xl border border-[#FF5C3A]/20 bg-[#FF5C3A]/5 px-4 py-3 space-y-3">
                      <div className="flex items-start gap-2">
                        <AlertCircle className="w-4 h-4 text-[#FF5C3A] mt-0.5 flex-shrink-0" />
                        <div className="flex-1">
                          <p className="text-xs text-[#bbb]">
                            Este nombre ya existe en nuestra plataforma
                          </p>
                          <p className="text-[11px] text-[#999] mt-1">
                            Agrega algo extra al final para diferenciarlo
                          </p>
                        </div>
                      </div>
                      <input
                        value={form.slugSuffix}
                        onChange={e => handleSuffixChange(e.target.value)}
                        placeholder='Ej: "pro" o "store"'
                        className="w-full rounded-lg border border-[rgba(255,255,255,0.1)] bg-[#0a0a0a] px-3 py-2.5 text-sm text-white placeholder-[#666] outline-none transition-all focus:border-[#FF5C3A]"
                      />
                      {form.slugSuffix && (
                        <p className="text-[11px] text-[#999]">
                          Así quedará: <span className="text-white font-mono">lookitry.com/sitio/{slugify(form.name)}-{form.slugSuffix}</span>
                        </p>
                      )}
                      {!form.slugSuffix && availabilityResult?.slugExists && (
                        <p className="text-[11px] text-[#FF5C3A]">
                          Si lo dejas vacío, agregaremos un número aleatorio
                        </p>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Error de slug */}
              {slugError && (
                <div className="bg-red-500/5 border border-red-500/20 text-red-400 p-4 rounded-xl flex items-start gap-3">
                  <AlertCircle className="w-4 h-4 mt-0.5" />
                  <p className="text-[11px] font-bold uppercase tracking-tight leading-normal">{slugError}</p>
                </div>
              )}

              {/* Contraseña con checklist */}
              <div className="space-y-2">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-[#999] uppercase tracking-wider flex items-center gap-1.5 ml-1 leading-none">
                    Crear contraseña
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={form.password}
                      onChange={e => setForm(prev => ({ ...prev, password: e.target.value }))}
                      placeholder="Mínimo 8 caracteres"
                      className="w-full rounded-xl border border-[rgba(255,255,255,0.08)] bg-[#050505] px-4 py-3 pr-10 text-sm text-white placeholder-[#666] outline-none transition-all shadow-inner focus:border-[#FF5C3A]"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[#666] hover:text-white transition-colors"
                      aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-[#999] uppercase tracking-wider flex items-center gap-1.5 ml-1 leading-none">
                    Confirmar contraseña
                  </label>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={form.confirmPassword}
                    onChange={e => setForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
                    placeholder="Repite tu contraseña"
                    className="w-full rounded-xl border border-[rgba(255,255,255,0.08)] bg-[#050505] px-4 py-3 text-sm text-white placeholder-[#666] outline-none transition-all shadow-inner focus:border-[#FF5C3A]"
                    style={{ borderColor: form.confirmPassword && form.confirmPassword !== form.password ? 'rgba(239,68,68,0.4)' : 'rgba(255,255,255,0.08)' }}
                  />
                </div>

                {/* Password requirements checklist */}
                <div className="rounded-xl border border-[rgba(255,255,255,0.05)] bg-[#050505]/50 px-4 py-3 space-y-2">
                  <p className="text-[10px] font-bold text-[#666] uppercase tracking-wider mb-2">Requisitos de la contraseña:</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1.5">
                    {[
                      { test: form.password.length >= 8, label: 'Mínimo 8 caracteres' },
                      { test: /[A-Z]/.test(form.password), label: 'Al menos una letra mayúscula' },
                      { test: /[a-z]/.test(form.password), label: 'Al menos una letra minúscula' },
                      { test: /[0-9]/.test(form.password), label: 'Al menos un número' },
                      { test: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(form.password), label: 'Al menos un carácter especial (!@#$%^&*)' },
                    ].map(({ test, label }) => (
                      <div key={label} className={`flex items-center gap-2 text-[11px] transition-colors ${test ? 'text-green-500' : 'text-[#999]'}`}>
                        {test ? (
                          <Check className="w-3.5 h-3.5 flex-shrink-0" />
                        ) : (
                          <span className="w-3.5 h-3.5 flex items-center justify-center flex-shrink-0">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#555]" />
                          </span>
                        )}
                        {label}
                      </div>
                    ))}
                  </div>
                  {form.confirmPassword && (
                    <div className={`flex items-center gap-2 text-[11px] mt-2 pt-2 border-t border-[rgba(255,255,255,0.05)] transition-colors ${form.confirmPassword === form.password && form.password.length >= 8 ? 'text-green-500' : 'text-red-400'}`}>
                      {form.confirmPassword === form.password && form.password.length >= 8 ? (
                        <Check className="w-3.5 h-3.5 flex-shrink-0" />
                      ) : (
                        <span className="w-3.5 h-3.5 flex items-center justify-center flex-shrink-0">
                          <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                        </span>
                      )}
                      {form.confirmPassword === form.password && form.password.length >= 8 ? 'Las contraseñas coinciden' : 'Las contraseñas no coinciden'}
                    </div>
                  )}
                </div>
              </div>

              {/* Error general */}
              {error && (
                <div className="bg-red-500/5 border border-red-500/20 text-red-400 p-4 rounded-xl flex items-start gap-3">
                  <AlertCircle className="w-4 h-4 mt-0.5" />
                  <p className="text-[11px] font-bold uppercase tracking-tight leading-normal">{error}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={loading || success || confirmingPayment || !paymentChecked || checkingAvailability}
                className="group relative h-14 w-full overflow-hidden rounded-2xl bg-[#FF5C3A] font-bold text-white shadow-xl shadow-[#FF5C3A]/20 transition-all active:scale-95 hover:bg-[#ff6c4d] disabled:opacity-50"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-[#FF5C3A] to-[#ff7a5f] opacity-100 transition-opacity" />
                <div className="relative flex items-center justify-center gap-3">
                  {loading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span className="text-xs uppercase tracking-widest">Guardando...</span>
                    </>
                  ) : success ? (
                    <>
                      <CheckCircle2 className="w-5 h-5 text-white" />
                      <span className="text-xs uppercase tracking-widest">¡Cuenta creada!</span>
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

          <p className="text-center text-xs text-[#999] mt-8">
            Al registrarte, aceptas nuestros Términos y Condiciones
          </p>
        </div>
      </div>
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
