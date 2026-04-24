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
  const [pendingEmail, setPendingEmail] = useState('');

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

    // Precargar datos del pending_registration para flujo trial
    const loadPendingData = async () => {
      if (!refFromQuery) return;
      try {
        const res = await fetch(`/api/auth/pending-registration/${encodeURIComponent(refFromQuery)}`);
        if (res.ok) {
          const pending = await res.json();
          if (pending?.brand_name) {
            const baseSlug = slugify(pending.brand_name);
            setForm(prev => ({ ...prev, name: pending.brand_name }));
            setSlug(baseSlug);
            // Verificar disponibilidad en background
            setCheckingAvailability(true);
            try {
              const response = await fetch('/api/brands/check-availability', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ brandName: pending.brand_name }),
              });
              const data = await response.json();
              if (response.ok) {
                setAvailabilityResult({
                  brandExists: data.brandExists,
                  slugExists: data.slugExists,
                  suggestedSlug: data.suggestedSuffix || data.suggestedSlug || '',
                });
              }
            } catch {
              // No mostrar error al precargar
            } finally {
              setCheckingAvailability(false);
            }
          }
          if (pending?.email) {
            setPendingEmail(pending.email);
          }
        }
      } catch (err) {
        console.error('Error cargando datos del registro pendiente:', err);
      }
    };
    loadPendingData();

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
        suggestedSlug: data.suggestedSuffix || data.suggestedSlug || '',
      });

      // Generate slug based on result
      const baseSlug = slugify(brandName);
      setSlug(baseSlug); // Siempre mostrar el slug base primero

      // Auto-generar sufijo si el nombre completo ya existe
      if (data.brandExists && data.slugExists) {
        autoGenerateSuffix(brandName, baseSlug);
      }
    } catch (err: any) {
      console.error('Error verificando disponibilidad:', err);
      setSlugError(err.message || 'No se pudo verificar');
      // Even on error, set the slug so the preview works
      setSlug(slugify(brandName));
    } finally {
      setCheckingAvailability(false);
    }
  }, []); // Empty deps - brandName is passed as parameter, not closure

  // Auto-genera un sufijo único cuando el nombre ya está ocupado
  const autoGenerateSuffix = async (brandName: string, baseSlug: string) => {
    const suffixes = ['pro', 'studio', 'shop', 'store', 'online', 'boutique', 'moda', 'wear'];
    // Barajar para no siempre empezar con el mismo
    const shuffled = [...suffixes].sort(() => Math.random() - 0.5);

    for (const suffix of shuffled) {
      setForm(prev => ({ ...prev, slugSuffix: suffix }));
      try {
        const response = await fetch('/api/brands/check-availability', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ brandName: `${brandName} ${suffix}` }),
        });
        const data = await response.json();
        if (response.ok && !data.slugExists) {
          return; // Encontramos uno disponible
        }
      } catch {
        // Continuar con siguiente
      }
    }
    // Si ninguno de los prefijados sirve, usar número aleatorio
    const randomSuffix = Math.floor(100 + Math.random() * 900).toString();
    setForm(prev => ({ ...prev, slugSuffix: randomSuffix }));
  };

  const handleNameBlur = () => {
    if (form.name.trim().length >= 2) {
      checkAvailability(form.name);
    }
  };

  const handleSuffixChange = (value: string) => {
    setForm(prev => ({ ...prev, slugSuffix: value }));
  };

  // Verificar disponibilidad del slug cuando cambia el sufijo
  useEffect(() => {
    if (!form.slugSuffix || !availabilityResult?.brandExists || !form.name) return;

    const baseSlug = slugify(form.name);
    const fullSlug = `${baseSlug}-${form.slugSuffix}`;

    const checkSuffixAvailability = async () => {
      setSlugError('');
      try {
        const response = await fetch('/api/brands/check-availability', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ brandName: `${form.name} ${form.slugSuffix}` }),
        });
        const data = await response.json();
        if (data.slugExists) {
          setSlugError('Este nombre completo ya existe, intenta otro');
        }
      } catch (err) {
        console.error('Error verificando disponibilidad del sufijo:', err);
      }
    };

    const timeoutId = setTimeout(checkSuffixAvailability, 300);
    return () => clearTimeout(timeoutId);
  }, [form.slugSuffix, form.name, availabilityResult?.brandExists]);

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

    // Verificar disponibilidad del slug base (sin sufijo personalizado)
    if (availabilityResult?.brandExists && availabilityResult.slugExists && !form.slugSuffix) {
      setSlugError('Agrega algo extra al nombre para diferenciarlo');
      return;
    }
    // Si brandExists con slugSuffix o si es brand nuevo, el backend genera slug único automáticamente

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
    <div className="min-h-screen flex items-center justify-center px-4 py-12 theme-bg-base">
      <div className="w-full max-w-lg">
        <div className="flex flex-col items-center mb-10">
          <Link href="/" className="flex items-center gap-3 group mb-4">
            <Image src="/logo.svg" alt="Lookitry" width={32} height={32} className="group-hover:rotate-12 transition-transform duration-500" priority />
            <span className="font-jakarta font-extrabold text-2xl theme-text tracking-tighter">
              Look<span className="text-[var(--accent)]">itry</span>
            </span>
          </Link>
          <div className="h-1 w-12 rounded-full bg-[var(--accent)]" />
        </div>

        <div className="relative overflow-hidden rounded-3xl border border-[var(--accent)]/12 theme-bg-card p-8 shadow-2xl md:p-10">
          <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-[var(--accent)]/50 to-transparent" />

          <div className="mb-10 text-center">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest mb-4 bg-[var(--accent)]/10 text-[var(--accent)] border border-[var(--accent)]/20">
              {isTrial ? 'Activación de prueba' : 'Último paso'}
            </div>
            <h1 className="text-3xl font-jakarta font-bold theme-text tracking-tight mb-2">
              {isTrial ? 'Activa tu prueba' : 'Configura tu marca'}
            </h1>
            <p className="text-sm theme-text-muted max-w-xs mx-auto leading-relaxed">
              {isTrial
                ? 'Tu pago fue confirmado. Crea tu contraseña para activar 7 días de acceso.'
                : 'Tu pago fue confirmado. Solo necesitamos el nombre de tu marca y crear una contraseña para tu cuenta.'}
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
                <div className="rounded-xl border border-[var(--accent)]/20 bg-[var(--accent)]/5 px-4 py-4 text-[var(--text)] flex items-start gap-3">
                  <Loader2 className="w-4 h-4 mt-0.5 text-[var(--accent)] animate-spin" />
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-tight text-[var(--accent)]">Confirmando pago PayPal</p>
                    <p className="text-[12px] leading-relaxed mt-1">Estamos validando tu pago antes de crear la cuenta. No cierres esta ventana.</p>
                  </div>
                </div>
              )}

              {/* Nombre de marca */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold theme-text-muted uppercase tracking-wider flex items-center gap-1.5 ml-1 leading-none">
                  <Store className="w-3 h-3 text-[var(--accent)]" /> Nombre de tu marca
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
                  className="w-full rounded-xl border theme-border theme-bg-input theme-text placeholder-[var(--text-muted)] outline-none transition-all shadow-inner focus:border-[var(--accent)]"
                />
              </div>

              {/* Preview del slug */}
              {form.name.length >= 2 && (
                <div className="space-y-3">
                  <div className="rounded-xl border theme-border bg-[var(--bg-base)]/50 px-4 py-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Globe className="w-3.5 h-3.5 text-[var(--text-muted)]" />
                        <span className="text-xs theme-text-muted">Así aparecerá en internet:</span>
                      </div>
                      {checkingAvailability ? (
                        <Loader2 className="w-4 h-4 text-[var(--accent)] animate-spin" />
                      ) : availabilityResult ? (
                        availabilityResult.slugExists ? (
                          <XCircle className="w-4 h-4 text-red-500" />
                        ) : (
                          <CheckCircle2 className="w-4 h-4 text-green-500" />
                        )
                      ) : null}
                    </div>
                    <p className="text-sm theme-text font-medium mt-1.5 font-mono">
                      lookitry.com/sitio/<span className="text-[var(--accent)]">{finalSlug || slugify(form.name)}</span>
                    </p>
                  </div>

                  {/* Campo extra si el nombre ya existe */}
                  {availabilityResult?.brandExists && (
                    <div className="rounded-xl border border-[var(--accent)]/20 bg-[var(--accent)]/5 px-4 py-3 space-y-3">
                      <div className="flex items-start gap-2">
                        <AlertCircle className="w-4 h-4 text-[var(--accent)] mt-0.5 flex-shrink-0" />
                        <div className="flex-1">
                          <p className="text-xs theme-text">
                            Este nombre ya existe en nuestra plataforma
                          </p>
                          <p className="text-[11px] theme-text-muted mt-1">
                            Agrega algo extra al final para diferenciarlo
                          </p>
                        </div>
                      </div>
                      <input
                        value={form.slugSuffix}
                        onChange={e => handleSuffixChange(e.target.value)}
                        placeholder='Ej: "pro" o "store"'
                        className="w-full rounded-lg border theme-border theme-bg-input theme-text placeholder-[var(--text-muted)] outline-none transition-all focus:border-[var(--accent)]"
                      />
                      {form.slugSuffix && (
                        <p className="text-[11px] theme-text-muted">
                          Así quedará: <span className="theme-text font-mono">lookitry.com/sitio/{slugify(form.name)}-{form.slugSuffix}</span>
                        </p>
                      )}
                      {!form.slugSuffix && availabilityResult?.slugExists && (
                        <p className="text-[11px] text-[var(--accent)]">
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
                  <label className="text-[11px] font-bold theme-text-muted uppercase tracking-wider flex items-center gap-1.5 ml-1 leading-none">
                    Crear contraseña
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={form.password}
                      onChange={e => setForm(prev => ({ ...prev, password: e.target.value }))}
                      placeholder="Mínimo 8 caracteres"
                      className="w-full rounded-xl border theme-border theme-bg-input theme-text placeholder-[var(--text-muted)] px-4 py-3 pr-10 text-sm outline-none transition-all shadow-inner focus:border-[var(--accent)]"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 theme-text-muted transition-colors hover:theme-text"
                      aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold theme-text-muted uppercase tracking-wider flex items-center gap-1.5 ml-1 leading-none">
                    Confirmar contraseña
                  </label>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={form.confirmPassword}
                    onChange={e => setForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
                    placeholder="Repite tu contraseña"
                    className="w-full rounded-xl border theme-border theme-bg-input theme-text placeholder-[var(--text-muted)] px-4 py-3 text-sm outline-none transition-all shadow-inner focus:border-[var(--accent)]"
                    style={{ borderColor: form.confirmPassword && form.confirmPassword !== form.password ? 'rgba(239,68,68,0.4)' : 'var(--border-color)' }}
                  />
                </div>

                {/* Password requirements checklist */}
                <div className="rounded-xl border theme-border bg-[var(--bg-base)]/50 px-4 py-3 space-y-2">
                  <p className="text-[10px] font-bold theme-text-muted uppercase tracking-wider mb-2">Requisitos de la contraseña:</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1.5">
                    {[
                      { test: form.password.length >= 8, label: 'Mínimo 8 caracteres' },
                      { test: /[A-Z]/.test(form.password), label: 'Al menos una letra mayúscula' },
                      { test: /[a-z]/.test(form.password), label: 'Al menos una letra minúscula' },
                      { test: /[0-9]/.test(form.password), label: 'Al menos un número' },
                      { test: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(form.password), label: 'Al menos un carácter especial (!@#$%^&*)' },
                    ].map(({ test, label }) => (
                      <div key={label} className={`flex items-center gap-2 text-[11px] transition-colors ${test ? 'text-green-500' : 'theme-text-muted'}`}>
                        {test ? (
                          <Check className="w-3.5 h-3.5 flex-shrink-0" />
                        ) : (
                          <span className="w-3.5 h-3.5 flex items-center justify-center flex-shrink-0">
                            <span className="w-1.5 h-1.5 rounded-full bg-current opacity-40" />
                          </span>
                        )}
                        {label}
                      </div>
                    ))}
                  </div>
                  {form.confirmPassword && (
                    <div className={`flex items-center gap-2 text-[11px] mt-2 pt-2 border-t theme-border transition-colors ${form.confirmPassword === form.password && form.password.length >= 8 ? 'text-green-500' : 'text-red-400'}`}>
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
                className="group relative h-14 w-full overflow-hidden rounded-2xl bg-[var(--accent)] font-bold text-white shadow-xl shadow-[var(--accent)]/20 transition-all active:scale-95 hover:brightness-110 disabled:opacity-50"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-[var(--accent)] to-[var(--accent)] opacity-100 transition-opacity" />
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

          <p className="text-center text-xs theme-text-muted mt-8">
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
