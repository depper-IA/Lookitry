'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

import { adminApi } from '@/services/adminApi';

// ─── Types ────────────────────────────────────────────────────────────────────
interface FormData {
  // Cliente
  name: string;
  email: string;
  password: string;
  slug: string;
  contact_name: string;
  phone: string;
  // Contrato
  monthly_amount: string;
  setup_amount: string;
  source_plan: 'NONE' | 'TRIAL' | 'BASIC' | 'PRO';
  months_paid: string;
  payment_method: string;
  notes: string;
  // Límites
  generations_limit: string;
  products_limit: string;
}

const INITIAL_FORM: FormData = {
  name: '',
  email: '',
  password: '',
  slug: '',
  contact_name: '',
  phone: '',
  monthly_amount: '',
  setup_amount: '0',
  source_plan: 'NONE',
  months_paid: '1',
  payment_method: 'transfer',
  notes: '',
  generations_limit: '2000',
  products_limit: '50',
};

const MONTHS_OPTIONS = [
  { value: '1', label: '1 mes' },
  { value: '3', label: '3 meses (5% dto.)' },
  { value: '6', label: '6 meses (10% dto.)' },
  { value: '12', label: '12 meses (15% dto.)' },
];

const PAYMENT_METHODS = [
  { value: 'transfer', label: 'Transferencia bancaria' },
  { value: 'efectivo', label: 'Efectivo' },
  { value: 'wompi', label: 'Wompi' },
  { value: 'otro', label: 'Otro' },
];

function formatCOP(value: string): string {
  const num = Number(value.replace(/\D/g, ''));
  if (isNaN(num) || num === 0) return '';
  return num.toLocaleString('es-CO');
}

// ─── Component ────────────────────────────────────────────────────────────────
export default function CreateEnterpriseClientPage() {
  const router = useRouter();
  const [form, setForm] = useState<FormData>(INITIAL_FORM);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<{
    brand: any;
    contract: any;
  } | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  // ── Derivados del formulario ─────────────────────────────────────────────
  const monthlyAmount = Number(form.monthly_amount.replace(/\D/g, '')) || 0;
  const setupAmount = Number(form.setup_amount.replace(/\D/g, '')) || 0;
  const contractMonths = Number(form.months_paid) || 1;
  const totalContract = monthlyAmount * contractMonths + setupAmount;

  const endDate = (() => {
    const d = new Date();
    d.setMonth(d.getMonth() + contractMonths);
    return d.toLocaleDateString('es-CO', { year: 'numeric', month: 'long', day: 'numeric' });
  })();

  // ── Handlers ─────────────────────────────────────────────────────────────
  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
      const { name, value } = e.target;
      setForm((prev) => ({ ...prev, [name]: value }));
      setError(null);
    },
    []
  );

  const handleNameChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const autoSlug = value
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9\s-]/g, '')
      .trim()
      .replace(/\s+/g, '-');
    setForm((prev) => ({ ...prev, name: value, slug: autoSlug }));
    setError(null);
  }, []);

  const handleCOPInput = useCallback(
    (field: keyof FormData) => (e: React.ChangeEvent<HTMLInputElement>) => {
      const raw = e.target.value.replace(/\D/g, '');
      setForm((prev) => ({ ...prev, [field]: raw }));
      setError(null);
    },
    []
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const data = await adminApi.post('/admin/enterprise/create-client', {
        name: form.name.trim(),
        email: form.email.trim().toLowerCase(),
        password: form.password,
        slug: form.slug.trim(),
        contact_name: form.contact_name.trim() || undefined,
        phone: form.phone.trim() || undefined,
        monthly_amount: monthlyAmount,
        setup_amount: setupAmount,
        source_plan: form.source_plan,
        months_paid: contractMonths,
        payment_method: form.payment_method,
        notes: form.notes.trim() || undefined,
        generations_limit: Number(form.generations_limit),
        products_limit: Number(form.products_limit),
      });

      setSuccess(data);
    } catch (err: any) {
      setError(err.message || 'Error inesperado');
    } finally {
      setLoading(false);
    }
  };

  // ── Success screen ────────────────────────────────────────────────────────
  if (success) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center p-6">
        <div className="max-w-lg w-full">
          {/* Check animado */}
          <div className="flex justify-center mb-8">
            <div className="w-24 h-24 rounded-full bg-emerald-500/10 border-2 border-emerald-500/30 flex items-center justify-center animate-in zoom-in duration-500">
              <svg className="w-12 h-12 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
          </div>

          <div className="bg-[#13131a] border border-emerald-500/20 rounded-2xl p-8 text-center">
            <h1 className="text-2xl font-bold text-white mb-2">Cliente Enterprise activado</h1>
            <p className="text-slate-400 mb-8">El acceso está listo. Comparte las credenciales de forma segura.</p>

            {/* Datos de acceso */}
            <div className="bg-[#0a0a0f] rounded-xl p-5 text-left mb-6 space-y-3">
              <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Credenciales de acceso</h3>
              <div className="flex justify-between items-center">
                <span className="text-slate-400 text-sm">Email</span>
                <span className="text-white font-mono text-sm">{success.brand.email}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400 text-sm">Dashboard</span>
                <a
                  href="https://lookitry.com/login"
                  target="_blank"
                  className="text-indigo-400 text-sm hover:text-indigo-300"
                >
                  lookitry.com/login ↗
                </a>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400 text-sm">Widget</span>
                <a
                  href={`https://lookitry.com/marca/${success.brand.slug}`}
                  target="_blank"
                  className="text-indigo-400 text-sm hover:text-indigo-300"
                >
                  /{success.brand.slug} ↗
                </a>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400 text-sm">Plan activo hasta</span>
                <span className="text-emerald-400 text-sm font-medium">
                  {new Date(success.brand.subscription_end_date).toLocaleDateString('es-CO', {
                    year: 'numeric', month: 'long', day: 'numeric',
                  })}
                </span>
              </div>
            </div>

            {/* Resumen financiero */}
            <div className="bg-[#0a0a0f] rounded-xl p-5 text-left mb-8 space-y-3">
              <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Resumen financiero</h3>
              <div className="flex justify-between items-center">
                <span className="text-slate-400 text-sm">Mensualidad</span>
                <span className="text-white text-sm">${success.contract.monthly_amount.toLocaleString('es-CO')} COP</span>
              </div>
              {success.contract.setup_amount > 0 && (
                <div className="flex justify-between items-center">
                  <span className="text-slate-400 text-sm">Setup (único)</span>
                  <span className="text-white text-sm">${success.contract.setup_amount.toLocaleString('es-CO')} COP</span>
                </div>
              )}
              <div className="border-t border-slate-800 pt-3 flex justify-between items-center">
                <span className="text-slate-300 text-sm font-semibold">Total cobrado</span>
                <span className="text-emerald-400 text-lg font-bold">${success.contract.total_paid.toLocaleString('es-CO')} COP</span>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => { setSuccess(null); setForm(INITIAL_FORM); }}
                className="flex-1 px-4 py-3 rounded-xl border border-slate-700 text-slate-300 hover:bg-slate-800 transition-colors text-sm font-medium"
              >
                Crear otro
              </button>
              <Link
                href="/admin/brands"
                className="flex-1 px-4 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium text-center transition-colors"
              >
                Ver en Marcas
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── Main Form ─────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#0a0a0f] py-8 px-4">
      <div className="max-w-4xl mx-auto">

        {/* Header */}
        <div className="mb-8">
          <Link
            href="/admin/enterprise"
            className="inline-flex items-center gap-2 text-slate-400 hover:text-white text-sm mb-6 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
            Volver a Enterprise
          </Link>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shrink-0">
              <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-2 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Alta de cliente Enterprise</h1>
              <p className="text-slate-400 text-sm mt-1">Crea y activa la cuenta completa con suscripción y registro de pago</p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* ── Sección 1: Datos del cliente ─────────────────────────────── */}
          <section className="bg-[#13131a] border border-white/5 rounded-2xl p-6">
            <h2 className="text-white font-semibold mb-1 flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-indigo-600/30 text-indigo-400 text-xs flex items-center justify-center font-bold">1</span>
              Datos del cliente
            </h2>
            <p className="text-slate-500 text-sm mb-6 ml-8">Información de acceso y contacto</p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm text-slate-400 mb-1.5">Nombre de la marca *</label>
                <input
                  type="text"
                  name="name"
                  value={form.name}
                  onChange={handleNameChange}
                  placeholder="Ej: Boutique Élite"
                  required
                  className="w-full bg-[#0a0a0f] border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 transition-colors text-sm"
                />
              </div>

              <div>
                <label className="block text-sm text-slate-400 mb-1.5">Slug (URL del widget) *</label>
                <div className="flex items-center">
                  <span className="bg-[#0a0a0f] border border-r-0 border-white/10 rounded-l-xl px-3 py-2.5 text-slate-500 text-sm">
                    /marca/
                  </span>
                  <input
                    type="text"
                    name="slug"
                    value={form.slug}
                    onChange={handleChange}
                    placeholder="boutique-elite"
                    required
                    className="flex-1 bg-[#0a0a0f] border border-white/10 rounded-r-xl px-4 py-2.5 text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 transition-colors text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm text-slate-400 mb-1.5">Email de acceso *</label>
                <input
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder="cliente@empresa.com"
                  required
                  className="w-full bg-[#0a0a0f] border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 transition-colors text-sm"
                />
              </div>

              <div>
                <label className="block text-sm text-slate-400 mb-1.5">Contraseña inicial *</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    value={form.password}
                    onChange={handleChange}
                    placeholder="Mínimo 8 caracteres"
                    required
                    minLength={8}
                    className="w-full bg-[#0a0a0f] border border-white/10 rounded-xl px-4 py-2.5 pr-10 text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 transition-colors text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(v => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                    tabIndex={-1}
                  >
                    {showPassword ? (
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                      </svg>
                    ) : (
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm text-slate-400 mb-1.5">Nombre del contacto</label>
                <input
                  type="text"
                  name="contact_name"
                  value={form.contact_name}
                  onChange={handleChange}
                  placeholder="María García"
                  className="w-full bg-[#0a0a0f] border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 transition-colors text-sm"
                />
              </div>

              <div>
                <label className="block text-sm text-slate-400 mb-1.5">Teléfono</label>
                <input
                  type="tel"
                  name="phone"
                  value={form.phone}
                  onChange={handleChange}
                  placeholder="+57 300 000 0000"
                  className="w-full bg-[#0a0a0f] border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 transition-colors text-sm"
                />
              </div>
            </div>
          </section>

          {/* ── Sección 2: Contrato ───────────────────────────────────────── */}
          <section className="bg-[#13131a] border border-white/5 rounded-2xl p-6">
            <h2 className="text-white font-semibold mb-1 flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-indigo-600/30 text-indigo-400 text-xs flex items-center justify-center font-bold">2</span>
              Contrato y facturación
            </h2>
            <p className="text-slate-500 text-sm mb-6 ml-8">Define los términos económicos del acuerdo</p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm text-slate-400 mb-1.5">Mensualidad pactada (COP) *</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm">$</span>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={form.monthly_amount ? Number(form.monthly_amount).toLocaleString('es-CO') : ''}
                    onChange={handleCOPInput('monthly_amount')}
                    placeholder="800.000"
                    required
                    className="w-full bg-[#0a0a0f] border border-white/10 rounded-xl pl-7 pr-4 py-2.5 text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 transition-colors text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm text-slate-400 mb-1.5">Setup / incorporación (COP)</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm">$</span>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={form.setup_amount ? Number(form.setup_amount).toLocaleString('es-CO') : ''}
                    onChange={handleCOPInput('setup_amount')}
                    placeholder="0"
                    className="w-full bg-[#0a0a0f] border border-white/10 rounded-xl pl-7 pr-4 py-2.5 text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 transition-colors text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm text-slate-400 mb-1.5">Duración del contrato *</label>
                <select
                  name="months_paid"
                  value={form.months_paid}
                  onChange={handleChange}
                  className="w-full bg-[#0a0a0f] border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-indigo-500 transition-colors text-sm appearance-none"
                >
                  {MONTHS_OPTIONS.map(({ value, label }) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm text-slate-400 mb-1.5">Plan previo del cliente</label>
                <select
                  name="source_plan"
                  value={form.source_plan}
                  onChange={handleChange}
                  className="w-full bg-[#0a0a0f] border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-indigo-500 transition-colors text-sm appearance-none"
                >
                  <option value="NONE">Cuenta nueva sin plan previo</option>
                  <option value="TRIAL">Venia de TRIAL</option>
                  <option value="BASIC">Venia de BASIC</option>
                  <option value="PRO">Venia de PRO</option>
                </select>
                <p className="mt-2 text-xs text-slate-500">
                  Si venia de TRIAL, esta alta contara como conversion TRIAL -&gt; ENTERPRISE en el panel.
                </p>
              </div>

              <div>
                <label className="block text-sm text-slate-400 mb-1.5">Método de pago</label>
                <select
                  name="payment_method"
                  value={form.payment_method}
                  onChange={handleChange}
                  className="w-full bg-[#0a0a0f] border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-indigo-500 transition-colors text-sm appearance-none"
                >
                  {PAYMENT_METHODS.map(({ value, label }) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm text-slate-400 mb-1.5">Notas internas</label>
                <textarea
                  name="notes"
                  value={form.notes}
                  onChange={handleChange}
                  placeholder="Términos especiales, descuentos adicionales, observaciones del acuerdo..."
                  rows={3}
                  className="w-full bg-[#0a0a0f] border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 transition-colors text-sm resize-none"
                />
              </div>
            </div>
          </section>

          {/* ── Sección 3: Límites de plan ───────────────────────────────── */}
          <section className="bg-[#13131a] border border-white/5 rounded-2xl p-6">
            <h2 className="text-white font-semibold mb-1 flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-indigo-600/30 text-indigo-400 text-xs flex items-center justify-center font-bold">3</span>
              Límites del plan
            </h2>
            <p className="text-slate-500 text-sm mb-6 ml-8">Personaliza los límites de uso según lo acordado</p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm text-slate-400 mb-1.5">Generaciones / mes</label>
                <input
                  type="number"
                  name="generations_limit"
                  value={form.generations_limit}
                  onChange={handleChange}
                  min="100"
                  max="50000"
                  step="100"
                  className="w-full bg-[#0a0a0f] border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-indigo-500 transition-colors text-sm"
                />
              </div>

              <div>
                <label className="block text-sm text-slate-400 mb-1.5">Productos activos máx.</label>
                <input
                  type="number"
                  name="products_limit"
                  value={form.products_limit}
                  onChange={handleChange}
                  min="5"
                  max="1000"
                  className="w-full bg-[#0a0a0f] border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-indigo-500 transition-colors text-sm"
                />
              </div>
            </div>
          </section>

          {/* ── Resumen financiero en tiempo real ────────────────────────── */}
          {monthlyAmount > 0 && (
            <section className="bg-gradient-to-br from-indigo-900/20 to-purple-900/20 border border-indigo-500/20 rounded-2xl p-6">
              <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
                <svg className="w-4 h-4 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 11h.01M12 11h.01M15 11h.01M12 7h.01M3 5a2 2 0 012-2h14a2 2 0 012 2v14a2 2 0 01-2 2H5a2 2 0 01-2-2V5z" />
                </svg>
                Resumen del contrato
              </h3>
              <div className="space-y-2.5 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-400">Mensualidad</span>
                  <span className="text-white">${monthlyAmount.toLocaleString('es-CO')} COP</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">× {contractMonths} mes{contractMonths > 1 ? 'es' : ''}</span>
                  <span className="text-white">${(monthlyAmount * contractMonths).toLocaleString('es-CO')} COP</span>
                </div>
                {setupAmount > 0 && (
                  <div className="flex justify-between">
                    <span className="text-slate-400">Setup (único)</span>
                    <span className="text-white">+ ${setupAmount.toLocaleString('es-CO')} COP</span>
                  </div>
                )}
                <div className="border-t border-indigo-500/20 pt-2.5 flex justify-between">
                  <span className="text-white font-semibold">Total a registrar hoy</span>
                  <span className="text-indigo-400 font-bold text-base">${totalContract.toLocaleString('es-CO')} COP</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 text-xs">Suscripción activa hasta</span>
                  <span className="text-slate-400 text-xs">{endDate}</span>
                </div>
              </div>
            </section>
          )}

          {/* Error */}
          {error && (
            <div className="bg-red-900/20 border border-red-500/30 rounded-xl px-4 py-3 flex items-center gap-3">
              <svg className="w-5 h-5 text-red-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-red-300 text-sm">{error}</p>
            </div>
          )}

          {/* Botón submit */}
          <div className="flex gap-4">
            <Link
              href="/admin/enterprise"
              className="px-6 py-3 rounded-xl border border-slate-700 text-slate-300 hover:bg-slate-800 transition-colors text-sm font-medium"
            >
              Cancelar
            </Link>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-6 py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-semibold text-sm transition-all disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/20"
            >
              {loading ? (
                <>
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Activando cliente...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                  Crear y activar cliente Enterprise
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
