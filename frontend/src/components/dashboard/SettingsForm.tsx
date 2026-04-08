'use client';

import { useEffect, useState } from 'react';
import type { Brand, UpdateBrandConfigDto, WidgetTemplate, Product } from '@/types';
import { Code2, Upload } from 'lucide-react';
import { uploadService } from '@/services/upload.service';
import { productsService } from '@/services/products.service';
import { EmbedSection } from './EmbedSection';
import { TemplatePreviewCard } from './TemplatePreviewCard';
import { WidgetRealPreview } from './WidgetRealPreview';

interface SettingsFormProps {
  brand: Brand;
  onSubmit: (data: UpdateBrandConfigDto) => Promise<void>;
}

type SettingsTab = 'design' | 'embed';

const TEMPLATES: Array<{
  id: WidgetTemplate;
  label: string;
  description: string;
  proOnly?: boolean;
}> = [
  {
    id: 'bare',
    label: 'Bare',
    description: 'Template básico con flujo directo',
  },
  {
    id: 'modern',
    label: 'Modern',
    description: 'Navegación lateral con barra de progreso',
    proOnly: true,
  },
  {
    id: 'bold',
    label: 'Bold',
    description: 'Experiencia premium con diseño oscuro',
    proOnly: true,
  },
  {
    id: 'showcase',
    label: 'Showcase',
    description: 'Optimizado para bios con scroll horizontal',
    proOnly: true,
  },
];

export function SettingsForm({ brand, onSubmit }: SettingsFormProps) {
  const isPro = brand.plan === 'PRO';
  const [activeTab, setActiveTab] = useState<SettingsTab>('design');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [proPrice, setProPrice] = useState<number | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
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
    // 1. Cargar configuración de precios PRO
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
        }
      })
      .catch(() => {});

    // 2. Cargar productos REALES para el visualizador
    productsService.getProducts()
      .then(res => setProducts(res.products))
      .catch(err => console.error('Error cargando productos para preview:', err));
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
      const dataToSubmit = isPro ? formData : { ...formData, slug: undefined };
      await onSubmit(dataToSubmit);
    } finally {
      setIsSubmitting(false);
    }
  };

  const tabs: Array<{ id: SettingsTab; label: string; icon: JSX.Element }> = [
    { id: 'design', label: 'Diseño', icon: <span className="text-sm">✦</span> },
    { id: 'embed', label: 'Integración', icon: <Code2 size={16} /> },
  ];

  const cardClass = 'rounded-3xl border border-[var(--border-color)] bg-[var(--bg-card)] p-6 md:p-8';
  const inputClass = 'w-full rounded-2xl border border-[var(--border-color)] bg-[var(--bg-input)] px-4 py-3 text-sm text-[var(--text-primary)] outline-none focus:border-[#FF5C3A]';

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-4 items-start">
      {/* Sidebar - Visualizador Real */}
      <div className="lg:col-span-1 lg:sticky lg:top-6 space-y-6">
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

        <div className="hidden lg:block">
          <label className="mb-3 block text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--text-muted)] text-center">
            Vista Previa Real
          </label>
          <div className="flex justify-center p-4 rounded-[2.5rem] bg-[var(--bg-card)] border border-[var(--border-color)] shadow-inner">
            <div 
              className="relative rounded-[2.2rem] overflow-hidden shadow-2xl border-4 border-black ring-1 ring-white/10"
              style={{ 
                width: '100%',
                maxWidth: '260px', 
                height: '520px',
                backgroundColor: formData.secondaryColor || '#ffffff'
              }}
            >
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-28 h-5 bg-black rounded-b-2xl z-50 flex items-center justify-center">
                <div className="w-10 h-1 bg-white/10 rounded-full" />
              </div>
              
              <div className="w-full h-full">
                <WidgetRealPreview
                  template={(formData.widgetTemplate || 'bare') as WidgetTemplate}
                  primaryColor={formData.primaryColor || '#FF5C3A'}
                  secondaryColor={formData.secondaryColor || '#FFFFFF'}
                  buttonText={formData.buttonText || 'Probarme esto'}
                  welcomeMessage={formData.welcomeMessage || ''}
                  brandName={formData.name || ''}
                  brandLogo={formData.logo || undefined}
                  isPro={isPro}
                  products={products}
                />
              </div>

              <div className="absolute bottom-1.5 left-1/2 -translate-x-1/2 w-16 h-1 bg-black/20 rounded-full z-50" />
            </div>
          </div>
        </div>
      </div>

      <div className="lg:col-span-3">
        {activeTab === 'design' && (
          <section className={cardClass}>
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-2xl font-bold text-[var(--text-primary)]">Diseño del Widget</h3>
              <div className="lg:hidden text-[10px] font-bold uppercase tracking-widest px-3 py-1 bg-[#FF5C3A]/10 text-[#FF5C3A] rounded-full">
                Vista previa real activa
              </div>
            </div>
            
            <div className="mb-8">
              <label className="mb-3 block text-xs font-bold uppercase tracking-[0.18em] text-[var(--text-muted)]">Logo de la marca</label>
              <div className="flex items-center gap-6 rounded-3xl border border-[var(--border-color)] bg-[var(--bg-base)] p-5">
                <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-2xl border border-[var(--border-color)] bg-white shadow-sm">
                  {formData.logo ? <img src={formData.logo} alt="Logo" className="h-full w-full object-contain" /> : <Upload size={20} className="text-[var(--text-muted)]" />}
                </div>
                <div className="space-y-2">
                  <label className="inline-block rounded-2xl bg-[var(--text-primary)] px-6 py-3 text-xs font-black uppercase tracking-[0.18em] text-[var(--bg-card)] cursor-pointer hover:opacity-90 transition-opacity">
                    Subir logo
                    <input type="file" className="hidden" accept="image/*" onChange={handleLogoUpload} />
                  </label>
                  <p className="text-[10px] text-[var(--text-muted)] px-1">Se recomienda fondo transparente (.png)</p>
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <div>
                <label className="mb-2 block text-xs font-bold uppercase tracking-[0.18em] text-[var(--text-muted)]">Nombre de la marca</label>
                <input name="name" value={formData.name || ''} onChange={handleChange} className={inputClass} />
              </div>
              <div>
                <label className="mb-2 block text-xs font-bold uppercase tracking-[0.18em] text-[var(--text-muted)]">Slug</label>
                <input 
                  name="slug" 
                  value={formData.slug || ''} 
                  onChange={handleChange} 
                  className={inputClass} 
                  disabled={!isPro}
                  placeholder={!isPro ? "Disponible en Plan Pro" : undefined}
                />
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <div>
                <label className="mb-2 block text-xs font-bold uppercase tracking-[0.18em] text-[var(--text-muted)]">Color principal (Acción)</label>
                <div className="flex items-center gap-3">
                  <div className="relative group">
                    <input type="color" name="primaryColor" value={formData.primaryColor || '#FF5C3A'} onChange={handleChange} className="h-14 w-14 rounded-2xl cursor-pointer border-2 border-[var(--border-color)] p-1.5 transition-all group-hover:scale-105" />
                  </div>
                  <input name="primaryColor" value={formData.primaryColor || '#FF5C3A'} onChange={handleChange} className="flex-1 rounded-2xl border border-[var(--border-color)] bg-[var(--bg-input)] px-4 py-3 text-sm font-mono uppercase focus:border-[#FF5C3A] outline-none" />
                </div>
              </div>
              <div>
                <label className="mb-2 block text-xs font-bold uppercase tracking-[0.18em] text-[var(--text-muted)]">Color de fondo</label>
                <div className="flex items-center gap-3">
                  <div className="relative group">
                    <input type="color" name="secondaryColor" value={formData.secondaryColor || '#FFFFFF'} onChange={handleChange} className="h-14 w-14 rounded-2xl cursor-pointer border-2 border-[var(--border-color)] p-1.5 transition-all group-hover:scale-105" />
                  </div>
                  <input name="secondaryColor" value={formData.secondaryColor || '#FFFFFF'} onChange={handleChange} className="flex-1 rounded-2xl border border-[var(--border-color)] bg-[var(--bg-input)] px-4 py-3 text-sm font-mono uppercase focus:border-[#FF5C3A] outline-none" />
                </div>
              </div>
            </div>
            
            <div className="mb-8">
              <label className="mb-4 block text-xs font-bold uppercase tracking-[0.18em] text-[var(--text-muted)]">Seleccionar Plantilla</label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {TEMPLATES.filter((tpl) => isPro || !tpl.proOnly).map((tpl) => (
                  <TemplatePreviewCard
                    key={tpl.id}
                    id={tpl.id}
                    label={tpl.label}
                    description={tpl.description}
                    isSelected={formData.widgetTemplate === tpl.id}
                    isDisabled={Boolean(tpl.proOnly) && !isPro}
                    isPro={isPro}
                    primaryColor={formData.primaryColor || '#FF5C3A'}
                    secondaryColor={formData.secondaryColor || '#FFFFFF'}
                    onSelect={(id) => setFormData((prev) => ({ ...prev, widgetTemplate: id }))}
                  />
                ))}
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
              <div>
                <label className="mb-2 block text-xs font-bold uppercase tracking-[0.18em] text-[var(--text-muted)]">Texto del botón central</label>
                <input name="buttonText" value={formData.buttonText || ''} onChange={handleChange} className={inputClass} placeholder="Probarme esto" />
              </div>
              <div>
                <label className="mb-2 block text-xs font-bold uppercase tracking-[0.18em] text-[var(--text-muted)]">Mensaje de bienvenida</label>
                <input name="welcomeMessage" value={formData.welcomeMessage || ''} onChange={handleChange} className={inputClass} placeholder="¡Pruébate virtualmente!" />
              </div>
            </div>
            
            <div className="flex items-center gap-4 pt-6 border-t border-[var(--border-color)]">
              {!isPro ? (
                <p className="hidden md:block text-[11px] text-[var(--text-muted)] italic font-medium">Los templates PRO y slugs personalizados están bloqueados</p>
              ) : (
                <div />
              )}
              
              <div className="flex items-center gap-3">
                <a 
                  href={`/marca/${brand.slug}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)] px-6 py-4 text-xs font-black uppercase tracking-[0.18em] text-[var(--text-primary)] transition-all hover:bg-[var(--bg-hover)] active:scale-[0.98]"
                >
                  <span className="mb-0.5">Ver Mostrador</span>
                  <Code2 size={16} className="text-[#FF5C3A]" />
                </a>

                <button 
                  type="button" 
                  onClick={handleSubmit} 
                  disabled={isSubmitting}
                  className="rounded-2xl bg-[#FF5C3A] hover:bg-[#ff451f] disabled:opacity-50 px-10 py-4 text-xs font-black uppercase tracking-[0.18em] text-white shadow-lg shadow-[#FF5C3A]/20 transition-all active:scale-[0.98]"
                >
                  {isSubmitting ? 'Guardando cambios...' : 'Guardar configuración'}
                </button>
              </div>
            </div>
          </section>
        )}

        {activeTab === 'embed' && <EmbedSection />}
      </div>
    </div>
  );
}
