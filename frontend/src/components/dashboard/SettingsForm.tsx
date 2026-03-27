'use client';

import { useEffect, useState } from 'react';
import type { Brand, UpdateBrandConfigDto, WidgetTemplate } from '@/types';
import { Sparkles, Settings, Palette, Code2, Upload, Check } from 'lucide-react';
import { uploadService } from '@/services/upload.service';
import { EmbedSection } from './EmbedSection';

interface SettingsFormProps {
  brand: Brand;
  onSubmit: (data: UpdateBrandConfigDto) => Promise<void>;
}

type SettingsTab = 'general' | 'appearance' | 'embed' | 'pro';

const TEMPLATES: Array<{ id: WidgetTemplate; label: string; proOnly?: boolean }> = [
  { id: 'bare', label: 'Bare' },
  { id: 'minimal', label: 'Minimal', proOnly: true },
  { id: 'modern', label: 'Modern', proOnly: true },
  { id: 'bold', label: 'Bold', proOnly: true },
];

export function SettingsForm({ brand, onSubmit }: SettingsFormProps) {
  const isPro = brand.plan === 'PRO';
  const [activeTab, setActiveTab] = useState<SettingsTab>(isPro ? 'general' : 'pro');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [proPrice, setProPrice] = useState<number | null>(null);
  const [proGenerations, setProGenerations] = useState<number | null>(null);
  const [formData, setFormData] = useState<UpdateBrandConfigDto>({
    name: brand.name,
    slug: brand.slug,
    logo: brand.logo || '',
    primaryColor: brand.primaryColor || '#FF5C3A',
    secondaryColor: brand.secondaryColor || '#FFFFFF',
    widgetTemplate: isPro ? (brand.widgetTemplate || 'bare') : 'bare',
    buttonText: brand.buttonText || 'Probarme esto',
    welcomeMessage: brand.welcomeMessage || '',
  });

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/pricing_config?id=eq.pro&select=data`, {
      headers: {
        apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        Authorization: `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!}`,
      },
    })
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data) && data[0]?.data) {
          if (data[0].data.precio_mensual_cop) setProPrice(data[0].data.precio_mensual_cop);
          if (data[0].data.generaciones_mensuales || data[0].data.generaciones_mes) {
            setProGenerations(data[0].data.generaciones_mensuales || data[0].data.generaciones_mes);
          }
        }
      })
      .catch(() => {});
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async () => {
      const base64 = (reader.result as string).split(',')[1];
      const url = await uploadService.uploadImage(base64, `logo-${Date.now()}.${file.name.split('.').pop()}`, false);
      setFormData((prev) => ({ ...prev, logo: url }));
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    setIsSubmitting(true);
    try {
      await onSubmit(formData);
    } finally {
      setIsSubmitting(false);
    }
  };

  const tabs: Array<{ id: SettingsTab; label: string; icon: JSX.Element }> = [
    { id: 'pro', label: 'Lookitry Pro', icon: <Sparkles size={16} /> },
    { id: 'general', label: 'Identidad', icon: <Settings size={16} /> },
    { id: 'appearance', label: 'Apariencia', icon: <Palette size={16} /> },
    { id: 'embed', label: 'Integración', icon: <Code2 size={16} /> },
  ];

  const cardClass = 'rounded-3xl border border-[var(--border-color)] bg-[var(--bg-card)] p-6 md:p-8';
  const inputClass = 'w-full rounded-2xl border border-[var(--border-color)] bg-[var(--bg-input)] px-4 py-3 text-sm text-[var(--text-primary)] outline-none focus:border-[#FF5C3A]';

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
      <div className="lg:col-span-1">
        <div className="flex gap-2 overflow-x-auto rounded-3xl border border-[var(--border-color)] bg-[var(--bg-card)] p-2 lg:flex-col">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-3 rounded-2xl px-4 py-3 text-left text-sm font-bold transition-all ${
                activeTab === tab.id
                  ? 'bg-[#FF5C3A] text-white'
                  : 'text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]'
              }`}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="lg:col-span-3">
        {activeTab === 'pro' && (
          <section className={cardClass}>
            {!isPro ? (
              <div className="space-y-6">
                <div>
                  <h3 className="text-2xl font-bold text-[var(--text-primary)]">Lookitry Pro</h3>
                  <p className="mt-2 text-sm text-[var(--text-secondary)]">
                    Desbloquea personalización avanzada, plugin WooCommerce y más capacidad operativa.
                  </p>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  {[
                    'Slug y mensaje de bienvenida',
                    'CTA dinámicos',
                    'Plantillas avanzadas',
                    'Plugin WooCommerce',
                    `${proGenerations ? proGenerations.toLocaleString('es-CO') : '1.000'} generaciones mensuales`,
                    'Hasta 15 productos activos',
                  ].map((feature) => (
                    <div key={feature} className="flex items-center gap-3 rounded-2xl border border-[var(--border-color)] bg-[var(--bg-base)] px-4 py-3 text-sm text-[var(--text-secondary)]">
                      <Check size={14} className="text-[#FF5C3A]" />
                      {feature}
                    </div>
                  ))}
                </div>
                <div className="flex items-end justify-between rounded-3xl border border-[var(--border-color)] bg-[var(--bg-base)] p-5">
                  <div>
                    <p className="text-xs uppercase tracking-[0.2em] text-[var(--text-muted)]">Inversión mensual</p>
                    <p className="mt-2 text-3xl font-black text-[var(--text-primary)]">
                      {proPrice ? `$ ${proPrice.toLocaleString('es-CO')}` : '$ 350.000'}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => { window.location.href = '/dashboard/subscription'; }}
                    className="rounded-2xl bg-[#FF5C3A] px-6 py-3 text-xs font-black uppercase tracking-[0.18em] text-white"
                  >
                    Suscribirme
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                <div>
                  <h3 className="text-2xl font-bold text-[var(--text-primary)]">Plan Pro activado</h3>
                  <p className="mt-2 text-sm text-[var(--text-secondary)]">
                    Ajusta tu CTA y el mensaje de bienvenida exclusivo del widget.
                  </p>
                </div>
                <div className="grid gap-5 md:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-xs font-bold uppercase tracking-[0.18em] text-[var(--text-muted)]">Texto del botón</label>
                    <input name="buttonText" value={formData.buttonText || ''} onChange={handleChange} className={inputClass} />
                  </div>
                  <div>
                    <label className="mb-2 block text-xs font-bold uppercase tracking-[0.18em] text-[var(--text-muted)]">Mensaje de bienvenida</label>
                    <input name="welcomeMessage" value={formData.welcomeMessage || ''} onChange={handleChange} className={inputClass} />
                  </div>
                </div>
                <button type="button" onClick={handleSubmit} className="rounded-2xl bg-[#FF5C3A] px-8 py-3 text-xs font-black uppercase tracking-[0.18em] text-white">
                  {isSubmitting ? 'Guardando...' : 'Guardar'}
                </button>
              </div>
            )}
          </section>
        )}

        {activeTab === 'general' && (
          <section className={cardClass}>
            <div className="grid gap-5 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-xs font-bold uppercase tracking-[0.18em] text-[var(--text-muted)]">Nombre de la marca</label>
                <input name="name" value={formData.name || ''} onChange={handleChange} className={inputClass} />
              </div>
              <div>
                <label className="mb-2 block text-xs font-bold uppercase tracking-[0.18em] text-[var(--text-muted)]">Slug</label>
                <input name="slug" value={formData.slug || ''} onChange={handleChange} className={inputClass} disabled={!isPro} />
              </div>
            </div>
            <div className="mt-6">
              <label className="mb-2 block text-xs font-bold uppercase tracking-[0.18em] text-[var(--text-muted)]">Logo</label>
              <div className="flex items-center gap-4 rounded-3xl border border-[var(--border-color)] bg-[var(--bg-base)] p-4">
                <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-2xl border border-[var(--border-color)] bg-white">
                  {formData.logo ? <img src={formData.logo} alt="Logo" className="h-full w-full object-contain" /> : <Upload size={20} className="text-[var(--text-muted)]" />}
                </div>
                <label className="rounded-2xl bg-[var(--text-primary)] px-5 py-3 text-xs font-black uppercase tracking-[0.18em] text-[var(--bg-card)] cursor-pointer">
                  Subir logo
                  <input type="file" className="hidden" accept="image/*" onChange={handleLogoUpload} />
                </label>
              </div>
            </div>
            <div className="mt-6">
              <button type="button" onClick={handleSubmit} className="rounded-2xl bg-[#FF5C3A] px-8 py-3 text-xs font-black uppercase tracking-[0.18em] text-white">
                {isSubmitting ? 'Guardando...' : 'Guardar identidad'}
              </button>
            </div>
          </section>
        )}

        {activeTab === 'appearance' && (
          <section className={cardClass}>
            <div className="grid gap-5 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-xs font-bold uppercase tracking-[0.18em] text-[var(--text-muted)]">Color principal</label>
                <input type="color" name="primaryColor" value={formData.primaryColor || '#FF5C3A'} onChange={handleChange} className="h-12 w-full rounded-2xl border border-[var(--border-color)] bg-[var(--bg-input)] p-2" />
              </div>
              <div>
                <label className="mb-2 block text-xs font-bold uppercase tracking-[0.18em] text-[var(--text-muted)]">Color de fondo</label>
                <input type="color" name="secondaryColor" value={formData.secondaryColor || '#FFFFFF'} onChange={handleChange} className="h-12 w-full rounded-2xl border border-[var(--border-color)] bg-[var(--bg-input)] p-2" />
              </div>
            </div>
            <div className="mt-6">
              <label className="mb-2 block text-xs font-bold uppercase tracking-[0.18em] text-[var(--text-muted)]">Plantilla</label>
              <select
                name="widgetTemplate"
                value={formData.widgetTemplate || 'bare'}
                onChange={handleChange}
                className={inputClass}
              >
                {TEMPLATES.filter((tpl) => isPro || !tpl.proOnly).map((tpl) => (
                  <option key={tpl.id} value={tpl.id}>{tpl.label}</option>
                ))}
              </select>
            </div>
            <div className="mt-6">
              <button type="button" onClick={handleSubmit} className="rounded-2xl bg-[#FF5C3A] px-8 py-3 text-xs font-black uppercase tracking-[0.18em] text-white">
                {isSubmitting ? 'Guardando...' : 'Guardar apariencia'}
              </button>
            </div>
          </section>
        )}

        {activeTab === 'embed' && <EmbedSection />}
      </div>
    </div>
  );
}
