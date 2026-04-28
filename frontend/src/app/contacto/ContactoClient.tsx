'use client';

import { useState, useCallback, useRef } from 'react';
import { Loader2, CheckCircle2, AlertCircle, Send, MessageCircle } from 'lucide-react';

// Types
interface FormState {
  nombre: string;
  email: string;
  telefono: string;
  nombre_negocio: string;
  tipo_negocio: string;
  mensaje: string;
}

interface FormErrors {
  nombre?: string;
  email?: string;
  telefono?: string;
  nombre_negocio?: string;
  tipo_negocio?: string;
  mensaje?: string;
}

type SubmitStatus = 'idle' | 'submitting' | 'success' | 'error';

// Validation helpers
function validateField(field: keyof FormErrors, value: string): string | undefined {
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
      if (value && !/^(\+?\d{10,15})$/.test(value.replace(/[\s\-\(\)]/g, ''))) {
        return 'Formato inválido';
      }
      return undefined;
    case 'nombre_negocio':
      if (!value.trim()) return 'El nombre del negocio es requerido';
      if (value.trim().length < 3) return 'Mínimo 3 caracteres';
      return undefined;
    case 'tipo_negocio':
      if (!value) return 'Selecciona un tipo de negocio';
      return undefined;
    case 'mensaje':
      if (value && value.length > 500) return 'Máximo 500 caracteres';
      return undefined;
    default:
      return undefined;
  }
}

// Double-Bezel Card Component
function DoubleBezelCard({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={`relative overflow-hidden rounded-[2rem] bg-black/5 ring-1 ring-white/10 p-1.5 ${className}`}
    >
      <div
        className="relative h-full rounded-[calc(2rem-0.375rem)] bg-[#141414] p-6 sm:p-8"
        style={{ borderRadius: 'calc(2rem - 0.375rem)' }}
      >
        {children}
      </div>
    </div>
  );
}

// Input Component with validation states
function FormInput({
  label,
  name,
  type = 'text',
  value,
  onChange,
  onBlur,
  error,
  placeholder,
  required = false,
  disabled = false,
}: {
  label: string;
  name: keyof FormErrors;
  type?: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
  onBlur: (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
  error?: string;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
}) {
  const [isFocused, setIsFocused] = useState(false);

  return (
    <div className="group">
      <label
        htmlFor={name}
        className="mb-2 block text-[11px] font-semibold uppercase tracking-widest text-white/60"
      >
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
        {error && (
          <p id={`${name}-error`} className="mt-1.5 text-[10px] text-red-400" role="alert">
            {error}
          </p>
        )}
      </div>
    </div>
  );
}

// Textarea Component
function FormTextarea({
  label,
  name,
  value,
  onChange,
  onBlur,
  error,
  placeholder,
  required = false,
  disabled = false,
  maxLength = 500,
}: {
  label: string;
  name: keyof FormErrors;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  onBlur: (e: React.FocusEvent<HTMLTextAreaElement>) => void;
  error?: string;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  maxLength?: number;
}) {
  const [isFocused, setIsFocused] = useState(false);

  return (
    <div className="group">
      <label
        htmlFor={name}
        className="mb-2 block text-[11px] font-semibold uppercase tracking-widest text-white/60"
      >
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
            <p id={`${name}-error`} className="text-[10px] text-red-400" role="alert">
              {error}
            </p>
          )}
          <p className="ml-auto text-[10px] text-white/30">
            {value.length}/{maxLength}
          </p>
        </div>
      </div>
    </div>
  );
}

// Select Component
function FormSelect({
  label,
  name,
  value,
  onChange,
  onBlur,
  error,
  required = false,
  disabled = false,
  options,
}: {
  label: string;
  name: keyof FormErrors;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  onBlur: (e: React.FocusEvent<HTMLSelectElement>) => void;
  error?: string;
  required?: boolean;
  disabled?: boolean;
  options: { value: string; label: string }[];
}) {
  const [isFocused, setIsFocused] = useState(false);

  return (
    <div className="group">
      <label
        htmlFor={name}
        className="mb-2 block text-[11px] font-semibold uppercase tracking-widest text-white/60"
      >
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
            <option key={opt.value} value={opt.value} className="bg-[#141414]">
              {opt.label}
            </option>
          ))}
        </select>
        <div className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2">
          <svg className="h-4 w-4 text-white/40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
        {error && (
          <p id={`${name}-error`} className="mt-1.5 text-[10px] text-red-400" role="alert">
            {error}
          </p>
        )}
      </div>
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

// WhatsApp fallback URL
const WHATSAPP_URL = 'https://wa.me/573105436281';

export default function ContactoClient() {
  const [formData, setFormData] = useState<FormState>({
    nombre: '',
    email: '',
    telefono: '',
    nombre_negocio: '',
    tipo_negocio: '',
    mensaje: '',
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState<Set<keyof FormState>>(new Set());
  const [status, setStatus] = useState<SubmitStatus>('idle');
  const [submitError, setSubmitError] = useState<string | null>(null);
  const formRef = useRef<HTMLFormElement>(null);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
      const { name, value } = e.target;
      setFormData((prev) => ({ ...prev, [name]: value }));

      // Clear error on change if field was touched
      if (touched.has(name as keyof FormState) && errors[name as keyof FormErrors]) {
        setErrors((prev) => ({ ...prev, [name]: undefined }));
      }
    },
    [touched, errors]
  );

  const handleBlur = useCallback(
    (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
      const { name, value } = e.target;
      setTouched((prev) => new Set(prev).add(name as keyof FormState));

      const fieldError = validateField(name as keyof FormErrors, value);
      setErrors((prev) => ({ ...prev, [name]: fieldError }));
    },
    []
  );

  const validateForm = useCallback((): boolean => {
    const newErrors: FormErrors = {};
    const requiredFields: (keyof FormErrors)[] = ['nombre', 'email', 'nombre_negocio', 'tipo_negocio'];

    requiredFields.forEach((field) => {
      const error = validateField(field, formData[field as keyof FormState] || '');
      if (error) newErrors[field] = error;
    });

    // Also validate optional fields that have values
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

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setSubmitError(null);

      // Mark all fields as touched and validate
      setTouched(new Set(['nombre', 'email', 'telefono', 'nombre_negocio', 'tipo_negocio', 'mensaje']));

      if (!validateForm()) {
        // Focus first error field
        const firstErrorField = Object.keys(errors)[0];
        if (firstErrorField && formRef.current) {
          const element = formRef.current.querySelector(`[name="${firstErrorField}"]`) as HTMLElement;
          element?.focus();
        }
        return;
      }

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

        if (!res.ok || !data.success) {
          throw new Error(data.error || 'Error al enviar el formulario');
        }

        setStatus('success');
      } catch (err: any) {
        console.error('[ContactoForm] Submit error:', err);
        setStatus('error');
        setSubmitError(err.message || 'Algo salió mal. Intenta de nuevo.');
      }
    },
    [formData, validateForm, errors]
  );

  // Success State
  if (status === 'success') {
    return (
      <DoubleBezelCard>
        <div className="flex flex-col items-center py-8 text-center">
          <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-green-500/10">
            <CheckCircle2 className="h-8 w-8 text-green-400" />
          </div>
          <h3 className="mb-2 font-jakarta text-xl font-bold text-white">
            ¡Mensaje enviado!
          </h3>
          <p className="mb-6 max-w-sm text-sm text-white/60">
            Te contactaremos en menos de 24 horas hábiles. También puedes escribirnos directamente por WhatsApp.
          </p>
          <a
            href={WHATSAPP_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 rounded-xl bg-[#25D366] px-6 py-3 text-sm font-bold text-white transition-all hover:scale-[1.02] hover:bg-[#20bd5a]"
          >
            <MessageCircle className="h-4 w-4" />
            Escribir por WhatsApp
          </a>
        </div>
      </DoubleBezelCard>
    );
  }

  return (
    <DoubleBezelCard>
      <form ref={formRef} onSubmit={handleSubmit} noValidate className="space-y-6">
        {/* Header */}
        <div className="mb-8 text-center">
          <h2 className="font-jakarta text-2xl font-bold text-white sm:text-3xl">
            Hablemos de tu negocio
          </h2>
          <p className="mt-2 text-sm text-white/50">
            Completa el formulario y nuestro equipo se pondrá en contacto contigo.
          </p>
        </div>

        {/* Form Grid */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <FormInput
            label="Nombre completo"
            name="nombre"
            value={formData.nombre}
            onChange={handleChange}
            onBlur={handleBlur}
            error={touched.has('nombre') ? errors.nombre : undefined}
            placeholder="Tu nombre"
            required
            disabled={status === 'submitting'}
          />

          <FormInput
            label="Email"
            name="email"
            type="email"
            value={formData.email}
            onChange={handleChange}
            onBlur={handleBlur}
            error={touched.has('email') ? errors.email : undefined}
            placeholder="tu@email.com"
            required
            disabled={status === 'submitting'}
          />

          <FormInput
            label="Teléfono"
            name="telefono"
            type="tel"
            value={formData.telefono}
            onChange={handleChange}
            onBlur={handleBlur}
            error={touched.has('telefono') ? errors.telefono : undefined}
            placeholder="+57 300 123 4567"
            disabled={status === 'submitting'}
          />

          <FormSelect
            label="Tipo de negocio"
            name="tipo_negocio"
            value={formData.tipo_negocio}
            onChange={handleChange}
            onBlur={handleBlur}
            error={touched.has('tipo_negocio') ? errors.tipo_negocio : undefined}
            required
            disabled={status === 'submitting'}
            options={BUSINESS_TYPE_OPTIONS}
          />

          <div className="sm:col-span-2">
            <FormInput
              label="Nombre del negocio"
              name="nombre_negocio"
              value={formData.nombre_negocio}
              onChange={handleChange}
              onBlur={handleBlur}
              error={touched.has('nombre_negocio') ? errors.nombre_negocio : undefined}
              placeholder="El nombre de tu marca o tienda"
              required
              disabled={status === 'submitting'}
            />
          </div>

          <div className="sm:col-span-2">
            <FormTextarea
              label="Mensaje"
              name="mensaje"
              value={formData.mensaje}
              onChange={handleChange}
              onBlur={handleBlur}
              error={touched.has('mensaje') ? errors.mensaje : undefined}
              placeholder="Cuéntanos sobre tu proyecto o有任何问题..."
              disabled={status === 'submitting'}
              maxLength={500}
            />
          </div>
        </div>

        {/* Error Toast */}
        {status === 'error' && submitError && (
          <div className="flex items-center gap-3 rounded-xl border border-red-500/30 bg-red-500/10 p-4">
            <AlertCircle className="h-5 w-5 flex-shrink-0 text-red-400" />
            <p className="flex-1 text-sm text-red-300">{submitError}</p>
          </div>
        )}

        {/* Submit Button */}
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

          {/* WhatsApp fallback */}
          <a
            href={WHATSAPP_URL}
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
  );
}