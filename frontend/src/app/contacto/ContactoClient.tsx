'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, useInView } from 'framer-motion';
import { Loader2, CheckCircle2, AlertCircle, Send, MessageCircle, Mail, Calendar, Shield, Zap, Headphones } from 'lucide-react';
import { fetchPublicPaymentSettings, toWhatsAppUrl } from '@/services/public-config.service';

// Count-Up Animation Component
function CountUp({ end, duration = 2000, suffix = '' }: { end: number; duration?: number; suffix?: string }) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true });

  useEffect(() => {
    if (!isInView) return;
    let startTime: number;
    const animate = (currentTime: number) => {
      if (!startTime) startTime = currentTime;
      const progress = Math.min((currentTime - startTime) / duration, 1);
      setCount(Math.floor(progress * end));
      if (progress < 1) requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
  }, [isInView, end, duration]);

  return <span ref={ref}>{count}{suffix}</span>;
}

// Stats data
const STATS = [
  { value: 500, suffix: '+', label: 'Marcas activas' },
  { value: 10000, suffix: '+', label: 'Generaciones' },
  { value: 24, suffix: 'h', label: 'Respuesta máxima' },
];

// Trust Bar Component
function TrustBar() {
  const trustItems = [
    { icon: Shield, text: 'Datos seguros' },
    { icon: Zap, text: 'Respuesta rápida' },
    { icon: Headphones, text: 'Soporte dedicado' },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4, duration: 0.6 }}
      className="flex flex-wrap items-center justify-center gap-8 py-6 border-y border-[#1a1a1a]"
    >
      {trustItems.map((item, i) => (
        <div key={i} className="flex items-center gap-2 text-white/50">
          <item.icon className="h-4 w-4 text-[#FF5C3A]" />
          <span className="text-xs font-medium">{item.text}</span>
        </div>
      ))}
    </motion.div>
  );
}

// Stats Section
function StatsSection() {
  return (
    <div className="grid grid-cols-3 gap-4 mb-8">
      {STATS.map((stat, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 + i * 0.1, duration: 0.5 }}
          className="text-center"
        >
          <p className="font-jakarta text-2xl md:text-3xl font-bold text-white">
            <CountUp end={stat.value} suffix={stat.suffix} />
          </p>
          <p className="text-xs text-white/50 mt-1">{stat.label}</p>
        </motion.div>
      ))}
    </div>
  );
}

// Double-Bezel Card Component
function DoubleBezelCard({ children, className = '', isSubmitting = false }: { children: React.ReactNode; className?: string; isSubmitting?: boolean }) {
  return (
    <div className={`relative overflow-hidden rounded-[2rem] bg-black/5 ring-1 ring-white/10 p-1.5 ${className}`}>
      {/* Shimmer effect when submitting */}
      {isSubmitting && (
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent"
          animate={{ x: ['-100%', '200%'] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
          style={{ width: '50%' }}
        />
      )}
      <div
        className="relative h-full rounded-[calc(2rem-0.375rem)] bg-[#141414] p-6 sm:p-8"
        style={{ borderRadius: 'calc(2rem - 0.375rem)' }}
      >
        {children}
      </div>
    </div>
  );
}

// Form Input with focus glow
function FormInput({
  label, name, type = 'text', value, onChange, onBlur, error, placeholder, required = false, disabled = false,
}: {
  label: string; name: string; type?: string; value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
  onBlur: (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
  error?: string; placeholder?: string; required?: boolean; disabled?: boolean;
}) {
  const [isFocused, setIsFocused] = useState(false);

  return (
    <div className="group">
      <label htmlFor={name} className="mb-2 block text-[11px] font-semibold uppercase tracking-widest text-white/60">
        {label}
        {required && <span className="ml-1 text-[#FF5C3A]">*</span>}
      </label>
      <div className="relative">
        <input
          id={name}
          name={name}
          type={type}
          value={value}
          onChange={onChange}
          onBlur={(e) => { setIsFocused(false); onBlur(e); }}
          onFocus={() => setIsFocused(true)}
          placeholder={placeholder}
          disabled={disabled}
          className={`
            w-full rounded-xl border bg-white/5 px-4 py-3.5
            text-sm text-white placeholder:text-white/20
            transition-all duration-200
            disabled:opacity-50 disabled:cursor-not-allowed
            focus:outline-none
            ${error
              ? 'border-red-500/50 bg-red-500/5'
              : isFocused
                ? 'border-[#FF5C3A]/50 bg-[#FF5C3A]/5 ring-2 ring-[#FF5C3A]/20'
                : 'border-white/10 hover:border-white/20'
            }
          `}
          aria-invalid={!!error}
          aria-describedby={error ? `${name}-error` : undefined}
        />
      </div>
      {error && (
        <p id={`${name}-error`} className="mt-1.5 text-[10px] text-red-400" role="alert">{error}</p>
      )}
    </div>
  );
}

// Form Select with focus glow
function FormSelect({
  label, name, value, onChange, onBlur, error, required = false, disabled = false, options,
}: {
  label: string; name: string; value: string;
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  onBlur: (e: React.FocusEvent<HTMLSelectElement>) => void;
  error?: string; required?: boolean; disabled?: boolean;
  options: { value: string; label: string }[];
}) {
  const [isFocused, setIsFocused] = useState(false);

  return (
    <div className="group">
      <label htmlFor={name} className="mb-2 block text-[11px] font-semibold uppercase tracking-widest text-white/60">
        {label}
        {required && <span className="ml-1 text-[#FF5C3A]">*</span>}
      </label>
      <div className="relative">
        <select
          id={name}
          name={name}
          value={value}
          onChange={onChange}
          onBlur={(e) => { setIsFocused(false); onBlur(e); }}
          onFocus={() => setIsFocused(true)}
          disabled={disabled}
          className={`
            w-full appearance-none rounded-xl border bg-white/5 px-4 py-3.5
            text-sm text-white
            transition-all duration-200
            disabled:opacity-50 disabled:cursor-not-allowed
            focus:outline-none
            ${error
              ? 'border-red-500/50 bg-red-500/5'
              : isFocused
                ? 'border-[#FF5C3A]/50 bg-[#FF5C3A]/5 ring-2 ring-[#FF5C3A]/20'
                : 'border-white/10 hover:border-white/20'
            }
          `}
          aria-invalid={!!error}
          aria-describedby={error ? `${name}-error` : undefined}
        >
          {options.map((opt) => (
            <option key={opt.value} value={opt.value} className="bg-[#141414]">{opt.label}</option>
          ))}
        </select>
        <div className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2">
          <svg className="h-4 w-4 text-white/40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>
      {error && (
        <p id={`${name}-error`} className="mt-1.5 text-[10px] text-red-400" role="alert">{error}</p>
      )}
    </div>
  );
}

// Form Textarea with focus glow
function FormTextarea({
  label, name, value, onChange, onBlur, error, placeholder, required = false, disabled = false, maxLength = 500,
}: {
  label: string; name: string; value: string;
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  onBlur: (e: React.FocusEvent<HTMLTextAreaElement>) => void;
  error?: string; placeholder?: string; required?: boolean; disabled?: boolean; maxLength?: number;
}) {
  const [isFocused, setIsFocused] = useState(false);

  return (
    <div className="group">
      <label htmlFor={name} className="mb-2 block text-[11px] font-semibold uppercase tracking-widest text-white/60">
        {label}
        {required && <span className="ml-1 text-[#FF5C3A]">*</span>}
      </label>
      <div className="relative">
        <textarea
          id={name}
          name={name}
          value={value}
          onChange={onChange}
          onBlur={(e) => { setIsFocused(false); onBlur(e); }}
          onFocus={() => setIsFocused(true)}
          placeholder={placeholder}
          disabled={disabled}
          rows={4}
          maxLength={maxLength}
          className={`
            w-full resize-none rounded-xl border bg-white/5 px-4 py-3.5
            text-sm text-white placeholder:text-white/20
            transition-all duration-200
            disabled:opacity-50 disabled:cursor-not-allowed
            focus:outline-none
            ${error
              ? 'border-red-500/50 bg-red-500/5'
              : isFocused
                ? 'border-[#FF5C3A]/50 bg-[#FF5C3A]/5 ring-2 ring-[#FF5C3A]/20'
                : 'border-white/10 hover:border-white/20'
            }
          `}
          aria-invalid={!!error}
          aria-describedby={error ? `${name}-error` : undefined}
        />
        <div className="mt-1.5 flex justify-between">
          {error && (
            <p id={`${name}-error`} className="text-[10px] text-red-400" role="alert">{error}</p>
          )}
          <p className="ml-auto text-[10px] text-white/30">{value.length}/{maxLength}</p>
        </div>
      </div>
    </div>
  );
}

// WhatsApp CTA Card
function WhatsAppCTA({ whatsappUrl, whatsappDisplay }: { whatsappUrl: string; whatsappDisplay: string }) {
  return (
    <motion.a
      href={whatsappUrl}
      target="_blank"
      rel="noopener noreferrer"
      whileHover={{ y: -8, transition: { duration: 0.3 } }}
      className="flex flex-col items-center justify-center rounded-3xl border border-[#25D366]/30 bg-[#25D366]/10 p-8 text-center"
    >
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[#25D366]/20">
        <MessageCircle className="h-8 w-8 text-[#25D366]" />
      </div>
      <h3 className="font-jakarta text-xl font-bold text-white mb-2">
        ¿Prefieres chat directo?
      </h3>
      <p className="text-white/60 text-sm mb-4">Escríbenos y te respondemos en minutos</p>
      <p className="text-[#25D366] font-medium">{whatsappDisplay}</p>
    </motion.a>
  );
}

// Contact Channel Cards
function ContactChannelCards() {
  const channels = [
    { icon: Mail, label: 'Email', title: 'Correo corporativo', value: 'info@lookitry.com', hint: 'Respuesta típica: menos de 24h hábiles' },
    { icon: MessageCircle, label: 'WhatsApp', title: 'Soporte rápido', value: '+57 310 543 6281', hint: 'Ideal para onboarding e integración' },
    { icon: Calendar, label: 'Llamada', title: 'Agendar reunión', value: 'Schedule a call', hint: 'Demo personalizada de 30 min' },
  ];

  return (
    <div className="space-y-4">
      {channels.map((channel, i) => (
        <motion.a
          key={i}
          href={channel.label === 'Email' ? `mailto:${channel.value}` : channel.label === 'WhatsApp' ? 'https://wa.me/573105436281' : '#'}
          target={channel.label === 'WhatsApp' ? '_blank' : undefined}
          rel="noopener noreferrer"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 + i * 0.1 }}
          whileHover={{ y: -4, transition: { duration: 0.2 } }}
          className="flex items-center gap-4 rounded-2xl border border-[#2a2a2a] bg-[#111] p-5 hover:border-[#FF5C3A]/40 transition-all"
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/5">
            <channel.icon className="h-5 w-5 text-[#FF5C3A]" />
          </div>
          <div className="flex-1">
            <p className="text-[10px] uppercase tracking-[0.1em] text-[#FF5C3A] font-semibold">{channel.label}</p>
            <p className="text-white font-semibold mt-0.5">{channel.title}</p>
            <p className="text-[#bbb] text-sm mt-0.5">{channel.value}</p>
          </div>
          <p className="text-[#666] text-xs text-right hidden sm:block">{channel.hint}</p>
        </motion.a>
      ))}
    </div>
  );
}

// Business type options
const BUSINESS_TYPE_OPTIONS = [
  { value: '', label: 'Selecciona un tipo...' },
  { value: 'boutique', label: 'Boutique' },
  { value: 'tienda_online', label: 'Tienda Online' },
  { value: 'showroom', label: 'Showroom' },
  { value: 'galeria', label: 'Galería' },
  { value: 'distribuidor', label: 'Distribuidor' },
  { value: 'otro', label: 'Otro' },
];

// Subject options (NEW)
const SUBJECT_OPTIONS = [
  { value: '', label: 'Selecciona un asunto...' },
  { value: 'integracion', label: 'Integración' },
  { value: 'demo', label: 'Demo' },
  { value: 'soporte', label: 'Soporte' },
  { value: 'partnership', label: 'Partnership' },
  { value: 'otro', label: 'Otro' },
];

// Default WhatsApp
const DEFAULT_WHATSAPP_URL = 'https://wa.me/573105436281';
const DEFAULT_WHATSAPP_DISPLAY = '+57 310 543 6281';

// Validation helpers
function validateField(field: string, value: string): string | undefined {
  switch (field) {
    case 'nombre':
      if (!value.trim()) return 'El nombre es requerido';
      if (value.trim().length < 3) return 'Mínimo 3 caracteres';
      return undefined;
    case 'email':
      if (!value.trim()) return 'El email es requerido';
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return 'Email inválido';
      return undefined;
    case 'telefono':
      if (value && !/^(\+?\d{10,15})$/.test(value.replace(/[\s\-\(\)]/g, ''))) return 'Formato inválido';
      return undefined;
    case 'nombre_negocio':
      if (!value.trim()) return 'El nombre del negocio es requerido';
      if (value.trim().length < 3) return 'Mínimo 3 caracteres';
      return undefined;
    case 'tipo_negocio':
      if (!value) return 'Selecciona un tipo de negocio';
      return undefined;
    case 'asunto':
      if (!value) return 'Selecciona un asunto';
      return undefined;
    case 'mensaje':
      if (value && value.length > 500) return 'Máximo 500 caracteres';
      return undefined;
    default:
      return undefined;
  }
}

interface FormState {
  nombre: string;
  email: string;
  telefono: string;
  nombre_negocio: string;
  tipo_negocio: string;
  asunto: string;
  mensaje: string;
}

type SubmitStatus = 'idle' | 'submitting' | 'success' | 'error';

export default function ContactoClient() {
  const [whatsappUrl, setWhatsappUrl] = useState(DEFAULT_WHATSAPP_URL);
  const [whatsappDisplay, setWhatsappDisplay] = useState(DEFAULT_WHATSAPP_DISPLAY);

  useEffect(() => {
    fetchPublicPaymentSettings().then(settings => {
      if (settings?.manualWhatsapp) {
        const url = toWhatsAppUrl(settings.manualWhatsapp);
        if (url) setWhatsappUrl(url);
      }
      if (settings?.manualWhatsapp) {
        const formatted = settings.manualWhatsapp.replace(/[^\d+]/g, '').replace(/^57/, '+57 ');
        if (formatted.length >= 10) {
          setWhatsappDisplay(`+57 ${formatted.slice(2, 4)} ${formatted.slice(4, 7)} ${formatted.slice(7)}`);
        }
      }
    });
  }, []);

  const [formData, setFormData] = useState<FormState>({
    nombre: '', email: '', telefono: '', nombre_negocio: '', tipo_negocio: '', asunto: '', mensaje: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Set<string>>(new Set());
  const [status, setStatus] = useState<SubmitStatus>('idle');
  const [submitError, setSubmitError] = useState<string | null>(null);
  const formRef = useRef<HTMLFormElement>(null);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
if (touched.has(name) && errors[name]) {
        setErrors((prev) => {
          const newErrors = { ...prev };
          delete newErrors[name];
          return newErrors;
        });
      }
  }, [touched, errors]);

  const handleBlur = useCallback((e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setTouched((prev) => new Set(prev).add(name));
    const fieldError = validateField(name, value);
    setErrors((prev) => {
      const newErrors = { ...prev };
      if (fieldError) {
        newErrors[name] = fieldError;
      } else {
        delete newErrors[name];
      }
      return newErrors;
    });
  }, []);

  const validateForm = useCallback((): boolean => {
    const newErrors: Record<string, string> = {};
    const requiredFields = ['nombre', 'email', 'nombre_negocio', 'tipo_negocio', 'asunto'];
    requiredFields.forEach((field) => {
      const error = validateField(field, formData[field as keyof FormState] || '');
      if (error) newErrors[field] = error;
    });
    if (formData.telefono) {
      const telError = validateField('telefono', formData.telefono);
      if (telError) newErrors.telefono = telError;
    }
    if (formData.mensaje) {
      const msgError = validateField('mensaje', formData.mensaje);
      if (msgError) newErrors.mensaje = msgError;
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData]);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);
    setTouched(new Set(['nombre', 'email', 'telefono', 'nombre_negocio', 'tipo_negocio', 'asunto', 'mensaje']));

    if (!validateForm()) return;

    setStatus('submitting');

    try {
      const res = await fetch('/api/leads/public', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nombre: formData.nombre,
          email: formData.email,
          telefono: formData.telefono || undefined,
          nombre_negocio: formData.nombre_negocio,
          tipo_negocio: formData.tipo_negocio,
          mensaje: formData.mensaje || undefined,
          source: 'organic_contact',
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'Error al enviar el formulario');
      setStatus('success');
    } catch (err: any) {
      console.error('[ContactoForm] Submit error:', err);
      setStatus('error');
      setSubmitError(err.message || 'Algo salió mal. Intenta de nuevo.');
    }
  }, [formData, validateForm]);

  // Success State
  if (status === 'success') {
    return (
      <DoubleBezelCard>
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="flex flex-col items-center py-12 text-center"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 200, damping: 15 }}
            className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-green-500/10"
          >
            <CheckCircle2 className="h-10 w-10 text-green-400" />
          </motion.div>
          <h3 className="font-jakarta text-2xl font-bold text-white mb-3">¡Mensaje enviado!</h3>
          <p className="max-w-sm text-sm text-white/60 mb-8">
            Te contactaremos en menos de 24 horas hábiles. También puedes escribirnos directamente por WhatsApp.
          </p>
          <motion.a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            whileHover={{ scale: 1.02 }}
            className="flex items-center gap-2 rounded-xl bg-[#25D366] px-8 py-4 text-sm font-bold text-white transition-all hover:bg-[#20bd5a]"
          >
            <MessageCircle className="h-5 w-5" />
            Escribir por WhatsApp
          </motion.a>
        </motion.div>
      </DoubleBezelCard>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
      {/* Left Column - Form (60%) */}
      <div className="lg:col-span-3">
        <DoubleBezelCard isSubmitting={status === 'submitting'}>
          <form ref={formRef} onSubmit={handleSubmit} noValidate className="space-y-6">
            <div className="mb-8 text-center">
              <h2 className="font-jakarta text-2xl font-bold text-white sm:text-3xl">
                Hablemos de tu negocio
              </h2>
              <p className="mt-2 text-sm text-white/50">
                Completa el formulario y nuestro equipo se pondrá en contacto contigo.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <FormInput
                label="Nombre completo" name="nombre" value={formData.nombre}
                onChange={handleChange} onBlur={handleBlur}
                error={touched.has('nombre') ? errors.nombre : undefined}
                placeholder="Tu nombre completo" required disabled={status === 'submitting'}
              />

              <FormInput
                label="Email" name="email" type="email" value={formData.email}
                onChange={handleChange} onBlur={handleBlur}
                error={touched.has('email') ? errors.email : undefined}
                placeholder="tu@email.com" required disabled={status === 'submitting'}
              />

              <FormInput
                label="Teléfono" name="telefono" type="tel" value={formData.telefono}
                onChange={handleChange} onBlur={handleBlur}
                error={touched.has('telefono') ? errors.telefono : undefined}
                placeholder="+57 300 123 4567" disabled={status === 'submitting'}
              />

              <FormSelect
                label="Tipo de negocio" name="tipo_negocio" value={formData.tipo_negocio}
                onChange={handleChange} onBlur={handleBlur}
                error={touched.has('tipo_negocio') ? errors.tipo_negocio : undefined}
                required disabled={status === 'submitting'} options={BUSINESS_TYPE_OPTIONS}
              />

              <FormSelect
                label="Asunto" name="asunto" value={formData.asunto}
                onChange={handleChange} onBlur={handleBlur}
                error={touched.has('asunto') ? errors.asunto : undefined}
                required disabled={status === 'submitting'} options={SUBJECT_OPTIONS}
              />

              <FormInput
                label="Nombre del negocio" name="nombre_negocio" value={formData.nombre_negocio}
                onChange={handleChange} onBlur={handleBlur}
                error={touched.has('nombre_negocio') ? errors.nombre_negocio : undefined}
                placeholder="El nombre de tu marca o tienda" required disabled={status === 'submitting'}
              />

              <div className="sm:col-span-2">
                <FormTextarea
                  label="Mensaje" name="mensaje" value={formData.mensaje}
                  onChange={handleChange} onBlur={handleBlur}
                  error={touched.has('mensaje') ? errors.mensaje : undefined}
                  placeholder="Cuéntanos cómo podemos ayudarte..." disabled={status === 'submitting'}
                  maxLength={500}
                />
              </div>
            </div>

            {status === 'error' && submitError && (
              <div className="flex items-center gap-3 rounded-xl border border-red-500/30 bg-red-500/10 p-4">
                <AlertCircle className="h-5 w-5 flex-shrink-0 text-red-400" />
                <p className="flex-1 text-sm text-red-300">{submitError}</p>
              </div>
            )}

            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <button
                type="submit"
                disabled={status === 'submitting'}
                className="flex items-center justify-center gap-2 rounded-xl bg-[#FF5C3A] px-8 py-4 text-sm font-bold uppercase tracking-wider text-white transition-all hover:bg-[#ff7b5e] disabled:cursor-not-allowed disabled:opacity-50 sm:flex-1"
              >
                {status === 'submitting' ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Enviando...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4" />
                    Enviar mensaje
                  </>
                )}
              </button>

              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-6 py-4 text-sm font-medium text-white/70 transition-all hover:border-white/20 hover:bg-white/10 hover:text-white sm:flex-none"
              >
                <MessageCircle className="h-4 w-4" />
                O escribir WhatsApp
              </a>
            </div>
          </form>
        </DoubleBezelCard>
      </div>

      {/* Right Column - WhatsApp CTA + Info Cards (40%) */}
      <div className="lg:col-span-2 space-y-6">
        <WhatsAppCTA whatsappUrl={whatsappUrl} whatsappDisplay={whatsappDisplay} />
        <ContactChannelCards />
      </div>
    </div>
  );
}