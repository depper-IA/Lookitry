'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { StepProgress } from '@/components/payments/StepProgress';
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
  Loader2
} from 'lucide-react';

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
  const trialActive = true;
  const trialDays = 7;
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
    const suffix = Math.floor(100 + Math.random() * 900);
    setForm(prev => ({ ...prev, slug: `${base}-${suffix}` }));
    setError('');
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const ref = params.get('ref');

    if (ref) {
      setPaymentRef(ref);
      setIsPaidFlow(true);
      setLoadingStep('Verificando tu acceso...');

      fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/pending-registration/${ref}`)
        .then(r => r.json())
        .then(data => {
          if (data.email) {
            const brandName = data.brand_name || '';
            const slug = (data as any).slug || (brandName ? slugify(brandName) : '');

            setForm(prev => ({
              ...prev,
              email: data.email,
              name: brandName,
              slug: slug || prev.slug
            }));

            setPrefilledFields({
              email: !!data.email,
              name: !!brandName,
              slug: !!(data as any).slug || !!slug
            });
          }
          setLoadingStep('');
        })
        .catch(err => {
          console.error('[Register] Error fetching pending:', err);
          setLoadingStep('');
        });
    } else {
      // Si no hay referencia de pago, redirigir al checkout unificado para comprar el TRIAL
      router.push('/checkout?plan=TRIAL');
    }

    getFingerprint().then(setFingerprint);
  }, [router]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    if (name === 'name') {
      const newSlug = slugify(value);
      setForm((prev) => ({ 
        ...prev, 
        name: value, 
        slug: prev.slug && prefilledFields.slug ? prev.slug : newSlug 
      }));
    } else {
      setForm((prev) => ({ ...prev, [name]: value }));
    }
  };

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
    if (!passwordComplexity.isValid) {
      setError(passwordComplexity.message);
      return;
    }
    if (!passwordsMatch) {
      setError('Las contraseñas no coinciden');
      return;
    }

    setError('');
    setLoading(true);

    try {
      setLoadingStep('Configurando tu espacio...');

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
          setError('Ya existe una cuenta desde este dispositivo. Elige un plan para continuar.');
        } else {
          setError(data.message || data.error || 'Error al completar el registro');
        }
        setLoading(false);
        return;
      }

      localStorage.setItem('token', data.token);
      localStorage.setItem('brandToken', data.token);

      setLoadingStep('¡Configuración lista! Entrando...');
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Error de conexión. Intenta de nuevo.');
      setLoading(false);
    }
  };

  if (trialActive === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#050505]">
        <Loader2 className="w-8 h-8 text-[#FF5C3A] animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-[#050505] selection:bg-[#FF5C3A]/30">
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

        {isPaidFlow && (
          <div className="mb-8">
            <StepProgress currentStep={4} maxNavigableStep={4} lockedAfterPayment />
          </div>
        )}

        <div className="relative overflow-hidden rounded-3xl border border-[#FF5C3A]/12 bg-[#0a0a0a] p-8 shadow-2xl md:p-10">
          <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-[#FF5C3A]/50 to-transparent" />
          
          <div className="mb-10 text-center">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest mb-4 bg-[#FF5C3A]/10 text-[#FF5C3A] border border-[#FF5C3A]/20">
              {isPaidFlow ? 'Paso Final: Activación' : 'Inicia tu prueba'}
            </div>
            <h1 className="text-3xl font-jakarta font-bold text-white tracking-tight mb-2">
              {isPaidFlow ? 'Activa tu acceso' : 'Crea tu cuenta'}
            </h1>
            <p className="text-sm text-[#999] max-w-xs mx-auto leading-relaxed">
              {isPaidFlow 
                ? 'Tu pago fue confirmado. Define tu contraseña y entra a tu probador.'
                : `Prueba Lookitry por ${trialDays} días y transforma tu tienda.`}
            </p>
            <p className="mt-3 text-[11px] uppercase tracking-[0.18em] text-[#666]">
              {isPaidFlow ? 'Solo falta activar tu acceso' : 'Te tomara menos de 2 minutos'}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Brand Name */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-[#999] uppercase tracking-wider flex items-center gap-1.5 ml-1 leading-none">
                  <Store className="w-3 h-3 text-[#FF5C3A]" /> Marca
                </label>
                <input
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  required
                  placeholder="Ej: Velvet Studio"
                  className="w-full rounded-xl border border-[rgba(255,255,255,0.08)] bg-[#050505] px-4 py-3 text-sm text-white placeholder-[#666] outline-none transition-all shadow-inner focus:border-[#FF5C3A]"
                />
              </div>

              {/* Contact Name */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-[#999] uppercase tracking-wider flex items-center gap-1.5 ml-1 leading-none">
                  <UserIcon className="w-3 h-3 text-[#FF5C3A]" /> Responsable
                </label>
                <input
                  name="contact_name"
                  value={form.contact_name}
                  onChange={handleChange}
                  required
                  placeholder="Tu nombre completo"
                  className="w-full rounded-xl border border-[rgba(255,255,255,0.08)] bg-[#050505] px-4 py-3 text-sm text-white placeholder-[#666] outline-none transition-all shadow-inner focus:border-[#FF5C3A]"
                />
              </div>
            </div>

            {/* Slug UI */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-[#999] uppercase tracking-wider flex items-center gap-1.5 ml-1 leading-none">
                <Globe className="w-3 h-3 text-[#FF5C3A]" /> URL del probador
              </label>
              <div className="flex items-center overflow-hidden rounded-xl border border-[rgba(255,255,255,0.08)] bg-[#050505] px-1 shadow-inner transition-all focus-within:border-[#FF5C3A]">
                <span className="select-none py-3 pl-3 text-xs font-medium text-[#666]">lookitry.com/sitio/</span>
                <input
                  name="slug"
                  value={form.slug}
                  onChange={(e) => setForm({ ...form, slug: slugify(e.target.value) })}
                  className="flex-1 bg-transparent px-1 py-3 text-sm text-white placeholder-[#666] focus:outline-none"
                />
                <button
                  type="button"
                  onClick={suggestAlternativeSlug}
                  className="mr-1 h-8 px-2.5 text-[9px] font-black text-[#FF5C3A] hover:text-[#ff7a5f] uppercase tracking-tighter transition-colors"
                >
                  Sugerir
                </button>
              </div>
              <p className="ml-1 text-[11px] leading-relaxed text-[#999]">
                Esta URL identificara tu probador. Puedes ajustarla ahora para que quede simple y facil de compartir.
              </p>
            </div>

            {/* Email */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-[#999] uppercase tracking-wider flex items-center gap-1.5 ml-1 leading-none">
                <Mail className="w-3 h-3 text-[#FF5C3A]" /> Email corporativo
              </label>
              <input
                name="email"
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                required
                readOnly={isPaidFlow && prefilledFields.email}
                className={`w-full rounded-xl border border-[rgba(255,255,255,0.08)] bg-[#050505] px-4 py-3 text-sm text-white outline-none transition-all shadow-inner focus:border-[#FF5C3A] ${isPaidFlow && prefilledFields.email ? 'opacity-50 grayscale' : ''}`}
              />
              <p className="ml-1 text-[11px] leading-relaxed text-[#999]">
                {isPaidFlow
                  ? 'Usaremos este correo para recuperar acceso y enviarte avisos importantes de tu cuenta.'
                  : 'Sera tu correo de acceso y donde recibiras la confirmacion para entrar al dashboard.'}
              </p>
            </div>

            {/* Password Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-[#999] uppercase tracking-wider flex items-center gap-1.5 ml-1 leading-none">
                  <ShieldCheck className="w-3 h-3 text-[#FF5C3A]" /> Contraseña
                </label>
                <div className="relative">
                  <input
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    value={form.password}
                    onChange={handleChange}
                    required
                    placeholder="8+ caracteres, mayúscula, minúscula, número y símbolo"
                    className={`w-full rounded-xl border ${form.password && !isPasswordValid ? 'border-red-500/40' : 'border-[rgba(255,255,255,0.08)]'} bg-[#050505] px-4 py-3 pr-10 text-sm text-white outline-none transition-all shadow-inner focus:border-[#FF5C3A]`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(v => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#666] transition-colors hover:text-white"
                    aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                    title={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <p className="ml-1 text-[11px] leading-relaxed text-[#999]">
                  Usa una contrasena de al menos 8 caracteres. Sera la clave con la que administraras tu espacio en Lookitry.
                </p>
              </div>
              
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-[#999] uppercase tracking-wider flex items-center gap-1.5 ml-1 leading-none">
                   Confirmar
                </label>
                <input
                  name="confirmPassword"
                  type={showPassword ? 'text' : 'password'}
                  value={form.confirmPassword}
                  onChange={handleChange}
                  required
                  placeholder="Repite tu contrasena"
                  className={`w-full rounded-xl border ${form.confirmPassword && !passwordsMatch ? 'border-red-500/40' : 'border-[rgba(255,255,255,0.08)]'} bg-[#050505] px-4 py-3 text-sm text-white outline-none transition-all shadow-inner focus:border-[#FF5C3A]`}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 rounded-2xl border border-[rgba(255,255,255,0.08)] bg-[#050505] px-4 py-3">
              <div className="flex items-center gap-2 text-[11px] text-[#bbb]">
                <span className={`inline-block h-2 w-2 rounded-full ${passwordComplexity.isValid ? 'bg-[#FF5C3A]' : 'bg-[#333]'}`} />
                Minimo 8 caracteres
              </div>
              <div className="flex items-center gap-2 text-[11px] text-[#bbb]">
                <span className={`inline-block h-2 w-2 rounded-full ${/[A-Z]/.test(form.password) ? 'bg-[#FF5C3A]' : 'bg-[#333]'}`} />
                Una letra mayuscula
              </div>
              <div className="flex items-center gap-2 text-[11px] text-[#bbb]">
                <span className={`inline-block h-2 w-2 rounded-full ${/[a-z]/.test(form.password) ? 'bg-[#FF5C3A]' : 'bg-[#333]'}`} />
                Una letra minuscula
              </div>
              <div className="flex items-center gap-2 text-[11px] text-[#bbb]">
                <span className={`inline-block h-2 w-2 rounded-full ${/[0-9]/.test(form.password) ? 'bg-[#FF5C3A]' : 'bg-[#333]'}`} />
                Un numero
              </div>
              <div className="flex items-center gap-2 text-[11px] text-[#bbb]">
                <span className={`inline-block h-2 w-2 rounded-full ${/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(form.password) ? 'bg-[#FF5C3A]' : 'bg-[#333]'}`} />
                Un caracter especial
              </div>
              <div className="flex items-center gap-2 text-[11px] text-[#bbb]">
                <span className={`inline-block h-2 w-2 rounded-full ${form.confirmPassword && passwordsMatch ? 'bg-[#FF5C3A]' : 'bg-[#333]'}`} />
                Confirmacion igual a la contrasena
              </div>
            </div>

            {error && (
              <div className="bg-red-500/5 border border-red-500/20 text-red-400 p-4 rounded-xl flex items-start gap-3 animate-in shake duration-300">
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
                    <span className="text-xs uppercase tracking-widest">{loadingStep || 'Activando...'}</span>
                  </>
                ) : (
                  <>
                    <Rocket className="w-5 h-5 text-white group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                    <span className="text-[13px] uppercase tracking-[0.2em] font-black">
                      {isPaidFlow ? 'Activar Mi Acceso' : 'Empezar ahora'}
                    </span>
                  </>
                )}
              </div>
            </button>
          </form>

          <p className="text-center text-xs text-[#999] mt-8">
            ¿Ya tienes cuenta?{' '}
            <Link href="/login" className="text-[#FF5C3A] hover:text-[#ff7a5f] font-bold tracking-tight border-b border-transparent hover:border-[#FF5C3A] transition-all ml-1">
              Inicia sesión
            </Link>
          </p>
        </div>

        <div className="mt-8 flex justify-center items-center gap-6 opacity-40 grayscale hover:grayscale-0 transition-all duration-700">
           <Image src="/logo.svg" alt="SSL" width={20} height={20} className="invert brightness-0" />
           <p className="text-[10px] font-black text-[#999] uppercase tracking-widest">Acceso Encriptado de Punto a Punto</p>
        </div>
      </div>
    </div>
  );
}
