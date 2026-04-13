'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Eye, 
  EyeOff, 
  AlertCircle, 
  ShieldCheck, 
  Rocket, 
  Store, 
  User as UserIcon, 
  Globe, 
  Mail,
  Loader2,
  Check,
  X,
  ArrowRight,
  Sparkles
} from 'lucide-react';
import GoogleSignInButton from './GoogleSignInButton';
import { loadTurnstileWidget } from '@/lib/turnstile';

function formatCOP(amount: number): string {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

const PLANS_PREVIEW_BASE = {
  TRIAL: {
    name: 'Trial',
    price: 20000,
    badge: '#6366f1',
    features: ['1 producto en el probador', '15 generaciones', '7 días de acceso', 'Logo y colores de marca'],
  },
  BASIC: {
    name: 'Básico',
    badge: null,
    features: ['Hasta 5 productos', '400 generaciones/mes', 'Branding básico', 'URL propia del probador'],
  },
  PRO: {
    name: 'Pro',
    badge: '#FF5C3A',
    features: ['Hasta 15 productos', '1.200 generaciones/mes', 'Plugin WooCommerce', 'Templates Pro'],
  },
};

const RESERVED_SLUGS = [
  'admin', 'api', 'dashboard', 'login', 'register', 'checkout', 'planes',
  'blog', 'ayuda', 'sobre-nosotros', 'contacto', 'estado', 'terminos',
  'politicas-privacidad', 'politica-de-uso', 'pruebalo', 'sitio', 'probador-virtual',
  'auth', 'verify', 'reset', 'confirmar', 'wompi', 'paypal', 'subscription',
  'brand', 'brands', 'product', 'products', 'generation', 'generations',
  'payment', 'payments', 'invoice', ' receipt', 'success', 'cancel', 'error',
  'www', 'mail', 'email', 'support', 'help', 'docs', 'documentation',
  'app', 'panel', 'cms', 'manage', 'settings', 'config', '密', '的公司',
];

function slugify(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

function validateSlug(slug: string): { valid: boolean; error?: string } {
  if (!slug || slug.length < 3) {
    return { valid: false, error: 'El slug debe tener al menos 3 caracteres' };
  }
  if (slug.length > 50) {
    return { valid: false, error: 'El slug no puede exceder 50 caracteres' };
  }
  if (!/^[a-z0-9][a-z0-9-]*[a-z0-9]$/.test(slug)) {
    return { valid: false, error: 'Solo letras minúsculas, números y guiones' };
  }
  if (RESERVED_SLUGS.includes(slug)) {
    return { valid: false, error: 'Este URL no está disponible' };
  }
  if (slug.startsWith('-') || slug.endsWith('-')) {
    return { valid: false, error: 'No puede empezar ni terminar con guión' };
  }
  return { valid: true };
}

async function checkSlugAvailable(slug: string): Promise<boolean> {
  try {
    const res = await fetch(`/api/slug-check?slug=${encodeURIComponent(slug)}`);
    const data = await res.json();
    return data.available === true;
  } catch {
    return false;
  }
}

export default function RegisterForm() {
  const router = useRouter();
  
  const [form, setForm] = useState({ 
    name: '', 
    contact_name: '',
    email: '', 
    password: '', 
    confirmPassword: '',
    slug: '' 
  });
  
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [acceptDataAuth, setAcceptDataAuth] = useState(false);
  
  const [slugError, setSlugError] = useState('');
  const [slugChecking, setSlugChecking] = useState(false);
  const [slugAvailable, setSlugAvailable] = useState<boolean | null>(null);
  
  const [planParam, setPlanParam] = useState<keyof typeof PLANS_PREVIEW_BASE | null>(null);
  const [monthsParam, setMonthsParam] = useState(1);
  const [dynamicPrices, setDynamicPrices] = useState<Record<string, number>>({});

  const [googleError, setGoogleError] = useState<string | null>(null);

  // ── Turnstile state ────────────────────────────────────────────────────
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const turnstileRef = useRef<HTMLDivElement>(null);
  const turnstileInstanceRef = useRef<Awaited<ReturnType<typeof loadTurnstileWidget>>>(null);

  // Cargar widget Turnstile al montar
  useEffect(() => {
    if (!process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY) return;
    if (!turnstileRef.current) return;

    loadTurnstileWidget(turnstileRef.current, (token) => {
      setTurnstileToken(token);
    }).then((instance) => {
      turnstileInstanceRef.current = instance;
    });

    return () => {
      turnstileInstanceRef.current?.remove();
    };
  }, []);

  // Cargar precios dinámicos desde Supabase
  useEffect(() => {
    const fetchPricing = async () => {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/pricing_config?select=id,data`, {
          headers: {
            apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            Authorization: `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!}`,
          },
        });
        const rows = await res.json();
        if (Array.isArray(rows)) {
          const basic = rows.find((r: any) => r.id === 'basic')?.data;
          const pro = rows.find((r: any) => r.id === 'pro')?.data;
          setDynamicPrices({
            BASIC: basic?.precio_mensual_cop || 150000,
            PRO: pro?.precio_mensual_cop || 250000,
          });
        }
      } catch (err) {
        console.error('Error fetching pricing:', err);
      }
    };
    fetchPricing();
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const plan = params.get('plan')?.toUpperCase();
    const months = parseInt(params.get('months') || '1', 10);
    
    if (plan && plan in PLANS_PREVIEW_BASE) {
      setPlanParam(plan as keyof typeof PLANS_PREVIEW_BASE);
    }
    if (months && [1, 3, 6, 12].includes(months)) {
      setMonthsParam(months);
    }
  }, []);

  // Construir PLANS_PREVIEW con precios dinámicos
  const PLANS_PREVIEW = {
    ...PLANS_PREVIEW_BASE,
    BASIC: { ...PLANS_PREVIEW_BASE.BASIC, price: dynamicPrices.BASIC || 150000 },
    PRO: { ...PLANS_PREVIEW_BASE.PRO, price: dynamicPrices.PRO || 250000 },
  };

  const suggestedPlan = planParam ? PLANS_PREVIEW[planParam] : null;
  const planDiscount = monthsParam > 1 ? (monthsParam === 3 ? 5 : monthsParam === 6 ? 10 : 15) : 0;
  const planTotal = suggestedPlan ? suggestedPlan.price * monthsParam : 0;
  const planTotalWithDiscount = planDiscount > 0 ? Math.round(planTotal * (1 - planDiscount / 100)) : planTotal;

  const slugifyName = useCallback((value: string) => {
    const generated = slugify(value);
    setForm(prev => ({ ...prev, name: value, slug: prev.slug ? prev.slug : generated }));
  }, []);

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    slugifyName(e.target.value);
    setSlugAvailable(null);
    setSlugError('');
  };

  const handleSlugChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = slugify(e.target.value);
    setForm(prev => ({ ...prev, slug: value }));
    setSlugAvailable(null);
    setSlugError('');
  };

  const checkSlug = useCallback(async (slug: string) => {
    if (!slug || slug.length < 3) return;
    
    const validation = validateSlug(slug);
    if (!validation.valid) {
      setSlugError(validation.error || 'Slug inválido');
      setSlugAvailable(false);
      return;
    }
    
    setSlugChecking(true);
    try {
      const available = await checkSlugAvailable(slug);
      setSlugAvailable(available);
      if (!available) {
        setSlugError('Este URL ya está en uso');
      } else {
        setSlugError('');
      }
    } finally {
      setSlugChecking(false);
    }
  }, []);

  useEffect(() => {
    if (!form.slug || form.slug.length < 3) return;
    const timer = setTimeout(() => checkSlug(form.slug), 500);
    return () => clearTimeout(timer);
  }, [form.slug, checkSlug]);

  const validatePasswordComplexity = (password: string): { isValid: boolean; message: string } => {
    if (password.length < 8) {
      return { isValid: false, message: 'La contraseña debe tener al menos 8 caracteres' };
    }
    if (!/[A-Z]/.test(password)) {
      return { isValid: false, message: 'La contraseña debe contener al menos una letra mayúscula' };
    }
    if (!/[a-z]/.test(password)) {
      return { isValid: false, message: 'La contraseña debe contener al menos una letra minúscula' };
    }
    if (!/[0-9]/.test(password)) {
      return { isValid: false, message: 'La contraseña debe contener al menos un número' };
    }
    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
      return { isValid: false, message: 'La contraseña debe contener al menos un carácter especial (!@#$%^&*...)' };
    }
    return { isValid: true, message: '' };
  };

  const isPasswordValid = form.password.length >= 8;
  const passwordsMatch = form.password === form.confirmPassword;
  const passwordComplexity = validatePasswordComplexity(form.password);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!acceptTerms) {
      setError('Debes aceptar los Términos y Condiciones');
      return;
    }
    if (!acceptDataAuth) {
      setError('Debes autorizar el tratamiento de tus datos personales');
      return;
    }
    if (!form.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      setError('Ingresa un correo electrónico válido');
      return;
    }
    if (!passwordComplexity.isValid) {
      setError(passwordComplexity.message);
      return;
    }
    if (!passwordsMatch) {
      setError('Las contraseñas no coinciden');
      return;
    }
    if (!form.slug || slugAvailable !== true) {
      setError(slugError || 'Elige un URL disponible para tu probador');
      return;
    }

    const slugRegex = /^[a-z0-9-]+$/;
    if (!slugRegex.test(form.slug) || form.slug.length < 3 || form.slug.length > 50) {
      setError('La URL debe tener entre 3 y 50 caracteres, solo letras minúsculas, números y guiones');
      return;
    }

    const reservedSlugs = [
      'admin', 'api', 'app', 'blog', 'checkout', 'dashboard', 'home', 'login',
      'logout', 'register', 'signup', 'signin', 'password', 'reset', 'forgot',
      'account', 'accounts', 'auth', 'authorize', 'callback', 'contact', 'docs',
      'documentation', 'download', 'downloads', 'email', 'help', 'jobs', 'legal',
      'market', 'markets', 'news', 'onboarding', 'payment', 'payments', 'plans',
      'pricing', 'privacy', 'products', 'profile', 'public', 'root', 'secure',
      'security', 'settings', 'shop', 'site', 'sites', 'static', 'support', 'terms',
      'tools', 'trial', 'trial-checkout', 'upload', 'uploads', 'users', 'verify',
      'webhook', 'webhooks', 'www', 'mail', 'superadmin', 'system', 'null', 'undefined',
      'true', 'false', 'none', 'default', 'main', 'test', 'demo', 'dev', 'development',
      'staging', 'stage', 'prod', 'production', 'lookitry', 'mobile', 'desktop'
    ];
    if (reservedSlugs.includes(form.slug.toLowerCase())) {
      setError('Esta URL está reservada. Elige otra.');
      return;
    }

    setLoading(true);

    try {
      setLoadingStep('Creando tu cuenta...');

      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: form.email.trim(),
          password: form.password,
          brandName: form.name.trim(),
          contactName: form.contact_name.trim(),
          slug: form.slug,
          plan: planParam || undefined,
          months: monthsParam,
          turnstileToken: turnstileToken || undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.error === 'EMAIL_EXISTS') {
          setError('Este correo ya está registrado. ¿Ya tienes cuenta?');
        } else if (data.error === 'SLUG_TAKEN') {
          setError('Este URL ya está en uso. Prueba otro.');
        } else if (data.error === 'TRIAL_ABUSE') {
          setError('Ya creaste una cuenta de prueba. Elige un plan de pago para continuar.');
        } else if (data.error === 'CAPTCHA_REQUIRED' || data.error === 'CAPTCHA_FAILED') {
          setError('Verificación de seguridad fallida. Por favor completa el CAPTCHA e intenta de nuevo.');
          setTurnstileToken(null);
          turnstileInstanceRef.current?.reset();
        } else {
          setError(data.message || data.error || 'Error al crear la cuenta');
        }
        setLoading(false);
        return;
      }

      if (data.redirectTo) {
        router.push(data.redirectTo);
        return;
      }

      localStorage.setItem('token', data.token);
      localStorage.setItem('brandToken', data.token);
      if (data.brand) {
        localStorage.setItem('brand', JSON.stringify(data.brand));
      }

      setLoadingStep('¡Cuenta creada! Redirigiendo al pago...');

      const redirectTo = data.redirectTo || '/checkout';
      const checkoutUrl = new URL(redirectTo, window.location.origin);
      if (planParam) {
        checkoutUrl.searchParams.set('plan', planParam);
        checkoutUrl.searchParams.set('months', String(monthsParam));
      }
      router.push(checkoutUrl.toString());

    } catch (err: any) {
      setError(err.message || 'Error de conexión. Intenta de nuevo.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-[#050505] selection:bg-[var(--accent)]/30">
      <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-5 gap-8 lg:gap-12">
        
        {/* Left: Form */}
        <div className="lg:col-span-3">
          <div className="flex flex-col items-center mb-8 lg:hidden">
            <Link href="/" className="flex items-center gap-3 group mb-4">
              <Image src="/logo.svg" alt="Lookitry" width={32} height={32} className="group-hover:rotate-12 transition-transform duration-500" priority />
              <span className="font-jakarta font-extrabold text-2xl text-white tracking-tighter">
                Look<span className="text-[var(--accent)]">itry</span>
              </span>
            </Link>
          </div>

          <div className="relative overflow-hidden rounded-3xl border border-[var(--accent)]/12 bg-[#0a0a0a] p-8 md:p-10 shadow-2xl">
            <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-[var(--accent)]/50 to-transparent" />
            
            <div className="mb-8 text-center lg:text-left">
              <h1 className="text-3xl font-jakarta font-bold text-white tracking-tight mb-2">
                Crea tu cuenta
              </h1>
              <p className="text-sm text-[#999] leading-relaxed">
                Empieza en menos de 2 minutos
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              
              {/* Google Sign-In */}
              <GoogleSignInButton
                mode="register"
                onError={(msg) => setGoogleError(msg)}
                className="w-full"
              />

              {/* Divider */}
              <div className="relative my-4">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-white/10" />
                </div>
                <div className="relative flex justify-center text-xs">
                  <span className="bg-[#0a0a0a] px-3 text-[#666]">o regístrate con email</span>
                </div>
              </div>

              {/* Name + Contact */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-[#999] uppercase tracking-wider flex items-center gap-1.5 ml-1">
                    <Store className="w-3 h-3 text-[var(--accent)]" /> Nombre de marca
                  </label>
                  <input
                    name="name"
                    value={form.name}
                    onChange={handleNameChange}
                    required
                    placeholder="Ej: Velvet Studio"
                    className="w-full rounded-xl border border-[rgba(255,255,255,0.08)] bg-[#050505] px-4 py-3 text-sm text-white placeholder-[#666] outline-none transition-all focus:border-[var(--accent)]"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-[#999] uppercase tracking-wider flex items-center gap-1.5 ml-1">
                    <UserIcon className="w-3 h-3 text-[var(--accent)]" /> Tu nombre
                  </label>
                  <input
                    name="contact_name"
                    value={form.contact_name}
                    onChange={(e) => setForm(prev => ({ ...prev, contact_name: e.target.value }))}
                    required
                    placeholder="Tu nombre completo"
                    className="w-full rounded-xl border border-[rgba(255,255,255,0.08)] bg-[#050505] px-4 py-3 text-sm text-white placeholder-[#666] outline-none transition-all focus:border-[var(--accent)]"
                  />
                </div>
              </div>

              {/* Slug */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-[#999] uppercase tracking-wider flex items-center gap-1.5 ml-1">
                  <Globe className="w-3 h-3 text-[var(--accent)]" /> URL de tu probador
                </label>
                <div className="flex items-center overflow-hidden rounded-xl border bg-[#050505] transition-all focus-within:border-[var(--accent)]"
                  style={{ borderColor: slugError ? 'rgba(239,68,68,0.4)' : 'rgba(255,255,255,0.08)' }}
                >
                  <span className="select-none py-3 pl-3 text-xs font-medium text-[#666]">lookitry.com/sitio/</span>
                  <input
                    name="slug"
                    value={form.slug}
                    onChange={handleSlugChange}
                    className="flex-1 bg-transparent px-1 py-3 text-sm text-white placeholder-[#666] focus:outline-none"
                    placeholder="mi-marca"
                  />
                  {slugChecking && (
                    <div className="pr-3">
                      <Loader2 className="w-4 h-4 text-[#666] animate-spin" />
                    </div>
                  )}
                  {!slugChecking && slugAvailable === true && (
                    <div className="pr-3">
                      <Check className="w-4 h-4 text-[#10b981]" />
                    </div>
                  )}
                  {!slugChecking && slugAvailable === false && (
                    <div className="pr-3">
                      <X className="w-4 h-4 text-red-500" />
                    </div>
                  )}
                </div>
                {slugError ? (
                  <p className="text-[11px] text-red-500 ml-1">{slugError}</p>
                ) : (
                  <p className="text-[11px] text-[#999] ml-1">
                    Esta URL identificará tu probador. Solo letras minúsculas, números y guiones.
                  </p>
                )}
              </div>

              {/* Email */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-[#999] uppercase tracking-wider flex items-center gap-1.5 ml-1">
                  <Mail className="w-3 h-3 text-[var(--accent)]" /> Correo electrónico
                </label>
                <input
                  name="email"
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm(prev => ({ ...prev, email: e.target.value }))}
                  required
                  placeholder="correo@tuempresa.com"
                  className="w-full rounded-xl border border-[rgba(255,255,255,0.08)] bg-[#050505] px-4 py-3 text-sm text-white placeholder-[#666] outline-none transition-all focus:border-[var(--accent)]"
                />
              </div>

              {/* Password */}
              <div className="space-y-2">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-[#999] uppercase tracking-wider flex items-center gap-1.5 ml-1">
                      <ShieldCheck className="w-3 h-3 text-[var(--accent)]" /> Contraseña
                    </label>
                    <div className="relative">
                      <input
                        name="password"
                        type={showPassword ? 'text' : 'password'}
                        value={form.password}
                        onChange={(e) => setForm(prev => ({ ...prev, password: e.target.value }))}
                        required
                        placeholder="8+ caracteres"
                        className="w-full rounded-xl border bg-[#050505] px-4 py-3 pr-10 text-sm text-white placeholder-[#666] outline-none transition-all focus:border-[var(--accent)]"
                        style={{ borderColor: form.password && !isPasswordValid ? 'rgba(239,68,68,0.4)' : 'rgba(255,255,255,0.08)' }}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(v => !v)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-[#666] transition-colors hover:text-white"
                        aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                  
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-[#999] uppercase tracking-wider flex items-center gap-1.5 ml-1">
                      Confirmar contraseña
                    </label>
                    <input
                      name="confirmPassword"
                      type={showPassword ? 'text' : 'password'}
                      value={form.confirmPassword}
                      onChange={(e) => setForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
                      required
                      placeholder="Repite tu contraseña"
                      className="w-full rounded-xl border bg-[#050505] px-4 py-3 text-sm text-white placeholder-[#666] outline-none transition-all focus:border-[var(--accent)]"
                      style={{ borderColor: form.confirmPassword && !passwordsMatch ? 'rgba(239,68,68,0.4)' : 'rgba(255,255,255,0.08)' }}
                    />
                  </div>
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
                    <div className={`flex items-center gap-2 text-[11px] mt-2 pt-2 border-t border-[rgba(255,255,255,0.05)] transition-colors ${passwordsMatch ? 'text-green-500' : 'text-red-400'}`}>
                      {passwordsMatch ? (
                        <Check className="w-3.5 h-3.5 flex-shrink-0" />
                      ) : (
                        <X className="w-3.5 h-3.5 flex-shrink-0" />
                      )}
                      {passwordsMatch ? 'Las contraseñas coinciden' : 'Las contraseñas no coinciden'}
                    </div>
                  )}
                </div>
              </div>

              {/* Terms */}
              <div className="space-y-3 pt-2">
                <div className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    id="acceptTerms"
                    checked={acceptTerms}
                    onChange={(e) => setAcceptTerms(e.target.checked)}
                    className="mt-1 w-4 h-4 rounded border-[#333] bg-[#050505] text-[var(--accent)] focus:ring-[var(--accent)] focus:ring-offset-0 cursor-pointer"
                  />
                  <label htmlFor="acceptTerms" className="text-xs text-[#999] leading-relaxed cursor-pointer">
                    Acepto los{' '}
                    <Link href="/terminos" target="_blank" className="text-[var(--accent)] hover:underline">Términos y Condiciones</Link>
                    {' '}del servicio.
                  </label>
                </div>
                <div className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    id="acceptDataAuth"
                    checked={acceptDataAuth}
                    onChange={(e) => setAcceptDataAuth(e.target.checked)}
                    className="mt-1 w-4 h-4 rounded border-[#333] bg-[#050505] text-[var(--accent)] focus:ring-[var(--accent)] focus:ring-offset-0 cursor-pointer"
                  />
                  <label htmlFor="acceptDataAuth" className="text-xs text-[#999] leading-relaxed cursor-pointer">
                    Autorizo el tratamiento de mis datos de acuerdo a la{' '}
                    <Link href="/politicas-privacidad" target="_blank" className="text-[var(--accent)] hover:underline">Política de Privacidad</Link>.
                  </label>
                </div>
              </div>

              {error && (
                <div className="bg-red-500/5 border border-red-500/20 text-red-400 p-4 rounded-xl flex items-start gap-3">
                  <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <p className="text-[11px] font-bold leading-normal">{error}</p>
                </div>
              )}

              {/* Cloudflare Turnstile widget */}
              <div className="flex justify-center my-4">
                <div ref={turnstileRef} className="[&>div]:!mx-auto [&>iframe]:mx-auto" />
              </div>

              <button
                type="submit"
                disabled={loading || slugChecking || slugAvailable === false}
                className="group relative h-14 w-full overflow-hidden rounded-2xl bg-[var(--accent)] font-bold text-white shadow-xl shadow-[var(--accent)]/20 transition-all active:scale-95 hover:bg-[#ff6c4d] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <div className="relative flex items-center justify-center gap-3">
                  {loading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span className="text-xs uppercase tracking-widest">{loadingStep || 'Creando cuenta...'}</span>
                    </>
                  ) : (
                    <>
                      <Rocket className="w-5 h-5 text-white group-hover:-translate-y-0.5 group-hover:translate-x-0.5 transition-transform" />
                      <span className="text-[13px] uppercase tracking-[0.2em] font-black">
                        Crear mi cuenta
                      </span>
                    </>
                  )}
                </div>
              </button>
            </form>

            <p className="text-center text-xs text-[#999] mt-8">
              ¿Ya tienes cuenta?{' '}
              <Link href="/login" className="text-[var(--accent)] hover:text-[#ff7a5f] font-bold tracking-tight border-b border-transparent hover:border-[var(--accent)] transition-all ml-1">
                Inicia sesión
              </Link>
            </p>
          </div>
        </div>

        {/* Right: Plan Summary Sidebar */}
        <AnimatePresence>
          {suggestedPlan && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.3 }}
              className="lg:col-span-2"
            >
              <div className="sticky top-8">
                <div className="hidden lg:block">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-8 h-8 rounded-full bg-[var(--accent)]/10 flex items-center justify-center">
                      <Sparkles className="w-4 h-4 text-[var(--accent)]" />
                    </div>
                    <span className="text-xs text-[var(--accent)] font-medium uppercase tracking-wider">
                      Plan seleccionado
                    </span>
                  </div>

                  {/* Plan Card */}
                  <div className="rounded-2xl border border-[var(--accent)]/20 bg-[#0a0a0a] overflow-hidden shadow-xl">
                    <div className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-jakarta font-bold text-xl text-white">
                              {suggestedPlan.name}
                            </span>
                            {planParam === 'PRO' && (
                              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-[var(--accent)]/20 text-[var(--accent)]">
                                Popular
                              </span>
                            )}
                            {planParam === 'TRIAL' && (
                              <span 
                                className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full"
                                style={{ backgroundColor: 'rgba(99,102,241,0.2)', color: '#6366f1' }}
                              >
                                Trial
                              </span>
                            )}
                          </div>
                          {monthsParam > 1 && (
                            <p className="text-xs text-[#999]">
                              {monthsParam} meses con {planDiscount}% de descuento
                            </p>
                          )}
                        </div>
                        <div className="text-right">
                          <div className="font-jakarta font-bold text-2xl text-white">
                            {formatCOP(planTotalWithDiscount / monthsParam)}
                          </div>
                          <div className="text-[11px] text-[#666]">/ mes</div>
                        </div>
                      </div>

                      {monthsParam > 1 && (
                        <div className="flex items-center gap-2 p-2 rounded-lg bg-[#10b981]/10 border border-[#10b981]/20 mb-4">
                          <Check className="w-3 h-3 text-[#10b981]" />
                          <span className="text-[11px] text-[#10b981] font-medium">
                            Ahorras {formatCOP(planTotal - planTotalWithDiscount)} con {monthsParam} meses
                          </span>
                        </div>
                      )}

                      {planTotal > 0 && monthsParam > 1 && (
                        <div className="border-t border-white/10 pt-4 mb-4">
                          <div className="flex justify-between text-xs text-[#666] mb-1">
                            <span>Precio mensual</span>
                            <span>{formatCOP(suggestedPlan.price)}</span>
                          </div>
                          <div className="flex justify-between text-xs text-[#666] mb-1">
                            <span>Descuento {monthsParam} meses</span>
                            <span className="text-[#10b981]">-{planDiscount}%</span>
                          </div>
                          <div className="flex justify-between font-medium text-sm text-white pt-2 border-t border-white/10">
                            <span>Total a pagar</span>
                            <span>{formatCOP(planTotalWithDiscount)}</span>
                          </div>
                        </div>
                      )}

                      {planTotal > 0 && monthsParam === 1 && (
                        <div className="flex justify-between font-medium text-sm text-white pt-2 border-t border-white/10">
                          <span>Total a pagar</span>
                          <span>{formatCOP(planTotalWithDiscount)}</span>
                        </div>
                      )}

                      {planParam === 'TRIAL' && (
                        <div className="flex justify-between font-medium text-sm text-white pt-2 border-t border-white/10">
                          <span>Pago único</span>
                          <span>{formatCOP(20000)}</span>
                        </div>
                      )}
                    </div>

                    {/* Features */}
                    <div className="px-6 pb-6">
                      <ul className="space-y-2.5">
                        {suggestedPlan.features.map((feature) => (
                          <li key={feature} className="flex items-center gap-2 text-xs text-[#999]">
                            <Check className="w-3.5 h-3.5 text-[var(--accent)] flex-shrink-0" />
                            {feature}
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* CTA Arrow */}
                    <div className="px-6 pb-6">
                      <div className="flex items-center justify-between text-[11px] text-[#666]">
                        <span>Después del registro</span>
                        <div className="flex items-center gap-1 text-[var(--accent)]">
                          <span>Ir al pago</span>
                          <ArrowRight className="w-3 h-3" />
                        </div>
                      </div>
                    </div>
                  </div>

                  <p className="text-center text-[10px] text-[#666] mt-4">
                    Pago seguro con Wompi o PayPal
                  </p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Desktop Logo */}
        <div className="hidden lg:flex absolute top-8 left-8">
          <Link href="/" className="flex items-center gap-3 group">
            <Image src="/logo.svg" alt="Lookitry" width={32} height={32} className="group-hover:rotate-12 transition-transform duration-500" priority />
            <span className="font-jakarta font-extrabold text-2xl text-white tracking-tighter">
              Look<span className="text-[var(--accent)]">itry</span>
            </span>
          </Link>
        </div>
      </div>
    </div>
  );
}