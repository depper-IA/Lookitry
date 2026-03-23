'use client';

import React, { useState, useEffect } from 'react';
import type { Brand, UpdateBrandConfigDto, WidgetTemplate } from '@/types';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { Card, CardHeader, CardBody } from '../ui/Card';
import { UpgradeModal } from './UpgradeModal';
import { uploadService } from '@/services/upload.service';
import { EmbedSection } from './EmbedSection';

interface SettingsFormProps {
  brand: Brand;
  onSubmit: (data: UpdateBrandConfigDto) => Promise<void>;
}

const TEMPLATES: Array<{
  id: WidgetTemplate;
  name: string;
  description: string;
  layout: 'top-bar' | 'sidebar' | 'centered' | 'bare';
  defaultPrimary: string;
  defaultSecondary: string;
  proOnly?: boolean;
}> = [
  {
    id: 'bare',
    name: 'Bare',
    description: 'Sin header ni sidebar — widget limpio, ideal para embed',
    layout: 'bare',
    defaultPrimary: '#000000',
    defaultSecondary: '#FFFFFF',
  },
  {
    id: 'minimal',
    name: 'Minimal',
    description: 'Header superior fijo, productos en fila horizontal — solo Pro',
    layout: 'top-bar',
    defaultPrimary: '#111827',
    defaultSecondary: '#F9FAFB',
    proOnly: true,
  },
  {
    id: 'modern',
    name: 'Modern',
    description: 'Panel lateral con productos, área principal a la derecha — solo Pro',
    layout: 'sidebar',
    defaultPrimary: '#6366F1',
    defaultSecondary: '#EEF2FF',
    proOnly: true,
  },
  {
    id: 'bold',
    name: 'Bold',
    description: 'Hero centrado grande, productos en grid inferior — solo Pro',
    layout: 'centered',
    defaultPrimary: '#F59E0B',
    defaultSecondary: '#111827',
    proOnly: true,
  },
];

const COLOR_PRESETS = [
  '#6366F1', '#8B5CF6', '#EC4899', '#EF4444',
  '#F59E0B', '#10B981', '#3B82F6', '#111827',
];

const BG_PRESETS = [
  '#FFFFFF', '#F9FAFB', '#EEF2FF', '#FFF7ED',
  '#F0FDF4', '#111827', '#1E1B4B', '#0F172A',
];

// Mini-preview visual de cada layout
function LayoutMiniPreview({ layout, primary, secondary }: {
  layout: 'top-bar' | 'sidebar' | 'centered' | 'bare';
  primary: string;
  secondary: string;
}) {
  if (layout === 'bare') {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center gap-1.5 p-2" style={{ backgroundColor: secondary }}>
        {/* Upload area */}
        <div className="w-full flex-1 rounded-lg border border-dashed flex items-center justify-center" style={{ borderColor: primary + '60' }}>
          <div className="w-5 h-5 rounded" style={{ backgroundColor: primary, opacity: 0.3 }} />
        </div>
        {/* Botón */}
        <div className="h-2.5 rounded-full w-3/4" style={{ backgroundColor: primary }} />
      </div>
    );
  }
  if (layout === 'top-bar') {
    return (
      <div className="w-full h-full flex flex-col" style={{ backgroundColor: secondary }}>
        {/* Header bar */}
        <div className="h-4 w-full flex items-center px-2 gap-1" style={{ backgroundColor: primary }}>
          <div className="w-2 h-2 rounded-full bg-white opacity-80" />
          <div className="h-1 w-8 rounded bg-white opacity-60" />
        </div>
        {/* Productos en fila */}
        <div className="flex gap-1 px-2 pt-1.5">
          {[1,2,3].map(i => (
            <div key={i} className="flex-1 h-5 rounded" style={{ backgroundColor: primary, opacity: 0.15 + i * 0.1 }} />
          ))}
        </div>
        {/* Selfie centrada */}
        <div className="flex-1 flex items-center justify-center p-1">
          <div className="w-8 h-8 rounded-full border-2" style={{ borderColor: primary, backgroundColor: secondary }} />
        </div>
        {/* Botón */}
        <div className="px-2 pb-1.5">
          <div className="h-2.5 rounded-full w-full" style={{ backgroundColor: primary }} />
        </div>
      </div>
    );
  }

  if (layout === 'sidebar') {
    return (
      <div className="w-full h-full flex" style={{ backgroundColor: secondary }}>
        {/* Sidebar */}
        <div className="w-7 h-full flex flex-col gap-1 p-1" style={{ backgroundColor: primary }}>
          <div className="w-full h-1.5 rounded bg-white opacity-40" />
          {[1,2,3].map(i => (
            <div key={i} className="w-full h-4 rounded" style={{ backgroundColor: secondary, opacity: 0.3 + i * 0.15 }} />
          ))}
        </div>
        {/* Área principal */}
        <div className="flex-1 flex flex-col items-center justify-center gap-1 p-1">
          <div className="w-8 h-8 rounded-full border-2" style={{ borderColor: primary, backgroundColor: secondary }} />
          <div className="h-2 w-10 rounded" style={{ backgroundColor: primary, opacity: 0.7 }} />
        </div>
      </div>
    );
  }

  // centered
  return (
    <div className="w-full h-full flex flex-col items-center justify-center gap-1 p-1" style={{ backgroundColor: secondary }}>
      {/* Hero grande */}
      <div className="w-10 h-10 rounded-xl border-2 flex items-center justify-center" style={{ borderColor: primary }}>
        <div className="w-6 h-6 rounded-full" style={{ backgroundColor: primary, opacity: 0.5 }} />
      </div>
      {/* Grid de productos */}
      <div className="flex gap-1">
        {[1,2,3,4].map(i => (
          <div key={i} className="w-3 h-3 rounded" style={{ backgroundColor: primary, opacity: 0.2 + i * 0.15 }} />
        ))}
      </div>
      {/* Botón */}
      <div className="h-2 w-12 rounded-full" style={{ backgroundColor: primary }} />
    </div>
  );
}

// Preview completo del widget según template
function WidgetPreview({ formData, brandName }: { formData: UpdateBrandConfigDto; brandName: string }) {
  const tpl = TEMPLATES.find(t => t.id === formData.widgetTemplate) || TEMPLATES[0];
  const primary = formData.primaryColor || tpl.defaultPrimary;
  const secondary = formData.secondaryColor || tpl.defaultSecondary;
  const btnText = formData.buttonText || 'Probarme esto';
  const welcome = formData.welcomeMessage || '¡Pruébate nuestros productos!';

  if (tpl.layout === 'bare') {
    return (
      <div className="rounded-xl overflow-hidden border border-gray-200 shadow-sm flex flex-col" style={{ backgroundColor: secondary, minHeight: 260 }}>
        <div className="flex-1 flex flex-col items-center justify-center gap-3 p-5">
          <div className="w-20 h-20 rounded-2xl border-2 border-dashed flex items-center justify-center" style={{ borderColor: primary + '80' }}>
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} style={{ color: primary }}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3 21h18M3.75 3h16.5A.75.75 0 0121 3.75v16.5a.75.75 0 01-.75.75H3.75A.75.75 0 013 20.25V3.75A.75.75 0 013.75 3z" />
            </svg>
          </div>
          <p className="text-xs font-semibold" style={{ color: primary }}>Arrastra tu foto aquí</p>
          <div className="flex gap-2 w-full">
            {['Camiseta', 'Hoodie', 'Polo'].map((p, i) => (
              <div key={p} className="flex-1 rounded-lg border p-1.5 text-center" style={{ borderColor: i === 0 ? primary : '#e5e7eb' }}>
                <div className="w-full h-6 rounded bg-gray-100 mb-1" />
                <p className="text-xs truncate" style={{ color: primary }}>{p}</p>
              </div>
            ))}
          </div>
          <button className="px-5 py-1.5 rounded-full text-white text-xs font-semibold w-full" style={{ backgroundColor: primary }}>{btnText}</button>
        </div>
      </div>
    );
  }

  if (tpl.layout === 'top-bar') {
    return (
      <div className="rounded-xl overflow-hidden border border-gray-200 shadow-sm" style={{ backgroundColor: secondary, minHeight: 260 }}>
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-2.5" style={{ backgroundColor: primary }}>
          {formData.logo
            ? <img src={formData.logo} alt="logo" className="h-6 object-contain" onError={e => { e.currentTarget.style.display = 'none'; }} />
            : <span className="text-white font-bold text-sm">{brandName}</span>}
          <span className="text-xs text-white opacity-70">Probador Virtual</span>
        </div>
        {/* Mensaje bienvenida */}
        <p className="text-center text-xs px-4 pt-3 pb-1 font-medium" style={{ color: primary }}>{welcome}</p>
        {/* Productos en fila */}
        <div className="flex gap-2 px-4 py-2 overflow-x-auto">
          {['Camiseta', 'Hoodie', 'Polo'].map((p, i) => (
            <div key={p} className={`flex-shrink-0 rounded-lg border-2 p-2 text-center cursor-pointer transition-all ${i === 0 ? 'shadow-md' : ''}`}
              style={{ borderColor: i === 0 ? primary : '#e5e7eb', backgroundColor: i === 0 ? primary + '15' : 'white', minWidth: 64 }}>
              <div className="w-10 h-10 rounded-md bg-gray-100 mx-auto mb-1" />
              <p className="text-xs font-medium" style={{ color: primary }}>{p}</p>
            </div>
          ))}
        </div>
        {/* Selfie upload centrado */}
        <div className="flex flex-col items-center py-3 px-4 gap-2">
          <div className="w-16 h-16 rounded-full border-2 border-dashed flex items-center justify-center" style={{ borderColor: primary }}>
            <svg className="w-7 h-7 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" /><path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0zM18.75 10.5h.008v.008h-.008V10.5z" />
            </svg>
          </div>
          <p className="text-xs text-gray-500">Sube tu selfie</p>
          <button className="px-5 py-1.5 rounded-full text-white text-xs font-semibold" style={{ backgroundColor: primary }}>{btnText}</button>
        </div>
      </div>
    );
  }

  if (tpl.layout === 'sidebar') {
    return (
      <div className="rounded-xl overflow-hidden border border-gray-200 shadow-sm flex" style={{ backgroundColor: secondary, minHeight: 260 }}>
        {/* Sidebar de productos */}
        <div className="w-24 flex flex-col gap-1 p-2" style={{ backgroundColor: primary }}>
          <p className="text-white text-xs font-bold mb-1 opacity-90">Productos</p>
          {['Camiseta', 'Hoodie', 'Polo'].map((p, i) => (
            <div key={p} className={`rounded-lg p-1.5 cursor-pointer transition-all ${i === 0 ? 'bg-white bg-opacity-20' : 'bg-white bg-opacity-10 hover:bg-opacity-15'}`}>
              <div className="w-full h-8 rounded bg-white opacity-20 mb-1" />
              <p className="text-white text-xs text-center truncate">{p}</p>
            </div>
          ))}
        </div>
        {/* Área principal */}
        <div className="flex-1 flex flex-col items-center justify-center gap-2 p-3">
          {formData.logo
            ? <img src={formData.logo} alt="logo" className="h-5 object-contain mb-1" onError={e => { e.currentTarget.style.display = 'none'; }} />
            : <span className="font-bold text-sm mb-1" style={{ color: primary }}>{brandName}</span>}
          <p className="text-xs text-center text-gray-500 px-2">{welcome}</p>
          <div className="w-14 h-14 rounded-full border-2 border-dashed flex items-center justify-center" style={{ borderColor: primary }}>
            <svg className="w-6 h-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" /><path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0zM18.75 10.5h.008v.008h-.008V10.5z" />
            </svg>
          </div>
          <button className="px-4 py-1.5 rounded-full text-white text-xs font-semibold mt-1" style={{ backgroundColor: primary }}>{btnText}</button>
        </div>
      </div>
    );
  }

  // centered / bold
  return (
    <div className="rounded-xl overflow-hidden border border-gray-200 shadow-sm flex flex-col items-center" style={{ backgroundColor: secondary, minHeight: 260 }}>
      {/* Hero grande */}
      <div className="w-full py-4 px-4 flex flex-col items-center gap-2" style={{ backgroundColor: primary }}>
        {formData.logo
          ? <img src={formData.logo} alt="logo" className="h-7 object-contain" onError={e => { e.currentTarget.style.display = 'none'; }} />
          : <span className="text-white font-bold text-base">{brandName}</span>}
        <p className="text-white text-xs opacity-80 text-center">{welcome}</p>
        <div className="w-16 h-16 rounded-full border-2 border-white border-opacity-50 flex items-center justify-center bg-white bg-opacity-10">
          <svg className="w-7 h-7 text-white opacity-70" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" /><path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0zM18.75 10.5h.008v.008h-.008V10.5z" />
          </svg>
        </div>
      </div>
      {/* Grid de productos */}
      <div className="grid grid-cols-4 gap-1.5 p-3 w-full">
        {['Camiseta', 'Hoodie', 'Polo', 'Jacket'].map((p, i) => (
          <div key={p} className={`rounded-lg border p-1 text-center ${i === 0 ? 'ring-2' : ''}`}
            style={{ borderColor: i === 0 ? primary : '#e5e7eb' }}>
            <div className="w-full h-7 rounded bg-gray-100 mb-0.5" />
            <p className="text-xs truncate" style={{ color: primary }}>{p}</p>
          </div>
        ))}
      </div>
      <button className="mb-3 px-6 py-1.5 rounded-full text-xs font-semibold" style={{ backgroundColor: primary, color: secondary }}>{btnText}</button>
    </div>
  );
}

export function SettingsForm({ brand, onSubmit }: SettingsFormProps) {
  const isPro = brand.plan === 'PRO';

  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [logoUploading, setLogoUploading] = useState(false);
  const [logoError, setLogoError] = useState('');

  const [formData, setFormData] = useState<UpdateBrandConfigDto>({
    name: brand.name,
    slug: brand.slug,
    logo: brand.logo || '',
    primaryColor: brand.primaryColor,
    secondaryColor: brand.secondaryColor,
    widgetTemplate: brand.widgetTemplate || 'bare',
    buttonText: brand.buttonText || 'Probarme esto',
    welcomeMessage: brand.welcomeMessage || '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [activeTab, setActiveTab] = useState<'general' | 'appearance' | 'pro' | 'embed'>('general');

  useEffect(() => {
    setFormData({
      name: brand.name,
      slug: brand.slug,
      logo: brand.logo || '',
      primaryColor: brand.primaryColor,
      secondaryColor: brand.secondaryColor,
      widgetTemplate: brand.widgetTemplate || 'bare',
      buttonText: brand.buttonText || 'Probarme esto',
      welcomeMessage: brand.welcomeMessage || '',
    });
  }, [brand]);

  const isValidHex = (c: string) => /^#[0-9A-F]{6}$/i.test(c);

  const validate = () => {
    const e: Record<string, string> = {};
    if (!formData.name?.trim()) e.name = 'El nombre es requerido';
    if (formData.primaryColor && !isValidHex(formData.primaryColor)) e.primaryColor = 'Color hexadecimal inválido';
    if (formData.secondaryColor && !isValidHex(formData.secondaryColor)) e.secondaryColor = 'Color hexadecimal inválido';
    if (formData.slug !== undefined) {
      if (!formData.slug?.trim()) e.slug = 'El slug no puede estar vacío';
      else if (!/^[a-z0-9-]+$/.test(formData.slug)) e.slug = 'Solo letras minúsculas, números y guiones';
      else if (formData.slug.length < 3) e.slug = 'Mínimo 3 caracteres';
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setLogoError('Solo se permiten imágenes (PNG, JPG, SVG, WebP)');
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setLogoError('El archivo no puede superar 2 MB');
      return;
    }
    setLogoError('');
    setLogoUploading(true);
    try {
      const reader = new FileReader();
      reader.onload = async () => {
        try {
          const base64 = (reader.result as string).split(',')[1];
          const url = await uploadService.uploadImage(base64, `logo-${Date.now()}.${file.name.split('.').pop()}`, false);
          setFormData(p => ({ ...p, logo: url }));
        } catch (err: any) {
          setLogoError(err.message || 'Error al subir el logo');
        } finally {
          setLogoUploading(false);
        }
      };
      reader.onerror = () => {
        setLogoError('Error al leer el archivo');
        setLogoUploading(false);
      };
      reader.readAsDataURL(file);
    } catch {
      setLogoError('Error de conexión al subir el logo');
      setLogoUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setIsSubmitting(true);
    try { 
      const payload = { ...formData };
      if (!isPro) {
        delete payload.slug;
        delete payload.buttonText;
        delete payload.welcomeMessage;
      }
      await onSubmit(payload); 
    } finally { setIsSubmitting(false); }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(p => ({ ...p, [name]: value }));
    if (errors[name]) setErrors(p => ({ ...p, [name]: '' }));
  };

  const applyTemplate = (tpl: typeof TEMPLATES[0]) => {
    if (tpl.proOnly && !isPro) return;
    setFormData(p => ({
      ...p,
      widgetTemplate: tpl.id,
      primaryColor: tpl.defaultPrimary,
      secondaryColor: tpl.defaultSecondary,
    }));
  };

  const tabs = [
    { id: 'general', label: 'General' },
    { id: 'appearance', label: 'Apariencia' },
    { id: 'embed', label: 'Código Embed' },
    { id: 'pro', label: isPro ? 'Pro' : 'Pro' },
  ] as const;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      {showUpgradeModal && <UpgradeModal onClose={() => setShowUpgradeModal(false)} />}

      {/* --- Navegacion Delineada Premium --- */}
      <div className="lg:col-span-3 border-r border-gray-100 pr-0 lg:pr-6 pb-6 lg:pb-0 overflow-x-auto lg:overflow-visible">
        <nav className="flex lg:flex-col gap-2 min-w-max lg:min-w-0">
          {tabs.map(t => {
            const isProLocked = t.id === 'pro' && !isPro;
            const active = activeTab === t.id;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => {
                  if (isProLocked) { setShowUpgradeModal(true); return; }
                  setActiveTab(t.id);
                }}
                className={`w-full text-left px-5 py-4 rounded-3xl flex items-center gap-3 transition-all duration-300 outline-none ${active ? 'bg-[var(--bg-card)] shadow-[0_4px_24px_rgba(0,0,0,0.04)] border border-[#FF5C3A]/20 scale-[1.02]' : 'hover:bg-[var(--bg-hover)]' }`}
              >
                <span className={`block text-xs font-black uppercase tracking-widest italic ${active ? 'text-[#FF5C3A]' : 'text-[var(--text-secondary)]'}`}>
                  {isProLocked ? (
                    <span className="flex items-center gap-1.5"><svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/></svg> Pro</span>
                  ) : t.label}
                </span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Contenido — dinámico según tab */}
      {activeTab !== 'embed' ? (
        <>
          <div className="lg:col-span-5">
            <section className="p-6 md:p-8 rounded-[2.5rem] bg-[var(--bg-card)] border border-[var(--border-color)] shadow-sm">
                <form onSubmit={handleSubmit} className="space-y-5">

                  {/* TAB: General */}
              {activeTab === 'general' && (
                <div className="space-y-8">
                  <div className="flex items-center gap-3 border-b border-[var(--border-color)] pb-5">
                    <div className="w-10 h-10 rounded-2xl bg-[#FF5C3A]/10 flex items-center justify-center"><svg className="w-5 h-5 text-[#FF5C3A]" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/></svg></div>
                    <div><h3 className="text-base font-bold text-[var(--text-primary)] italic uppercase tracking-tight">General</h3><p className="text-[10px] text-[var(--text-secondary)] uppercase font-medium tracking-widest">Datos Básicos</p></div>
                  </div>
                  <Input label="Nombre de Marca" name="name" value={formData.name || ''} onChange={handleChange} error={errors.name} placeholder="Mi Marca" required />
                  <div>
                    <label style={{ color: 'var(--text-secondary)' }} className="block text-sm font-medium mb-1">Logo</label>
                    <div className="flex gap-3 items-start">
                      {/* Preview */}
                      <div style={{ borderColor: 'var(--border-color)', background: 'var(--bg-hover)' }}
                        className="w-16 h-16 rounded-xl border-2 border-dashed flex items-center justify-center overflow-hidden flex-shrink-0">
                        {formData.logo ? (
                          <img src={formData.logo} alt="Logo" className="w-full h-full object-contain"
                            onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                        ) : (
                          <svg className="w-6 h-6" style={{ color: 'var(--text-muted)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3 21h18M3.75 3h16.5A.75.75 0 0121 3.75v16.5a.75.75 0 01-.75.75H3.75A.75.75 0 013 20.25V3.75A.75.75 0 013.75 3z" />
                          </svg>
                        )}
                      </div>
                      {/* Controles */}
                      <div className="flex-1 space-y-2">
                        <label
                          style={{ borderColor: 'var(--border-color)', background: 'var(--bg-hover)', color: 'var(--text-secondary)' }}
                          className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-[13px] cursor-pointer hover:opacity-80 transition-opacity ${logoUploading ? 'opacity-50 pointer-events-none' : ''}`}
                        >
                          {logoUploading ? (
                            <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                            </svg>
                          ) : (
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                            </svg>
                          )}
                          {logoUploading ? 'Subiendo...' : 'Subir imagen'}
                          <input type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} disabled={logoUploading} />
                        </label>
                        {formData.logo && (
                          <button type="button" onClick={() => setFormData(p => ({ ...p, logo: '' }))}
                            style={{ color: 'var(--text-muted)' }}
                            className="text-[12px] hover:text-red-400 transition-colors flex items-center gap-1">
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                            Quitar logo
                          </button>
                        )}
                        {logoError && <p className="text-xs text-red-400">{logoError}</p>}
                        <p style={{ color: 'var(--text-muted)' }} className="text-xs">PNG, JPG, SVG o WebP — máx. 2 MB</p>
                      </div>
                    </div>
                  </div>
                  <div style={{ borderColor: 'var(--border-color)' }} className="pt-2 border-t">
                    <Button type="submit" disabled={isSubmitting} className="w-full">
                      {isSubmitting ? 'Guardando...' : 'Guardar Cambios'}
                    </Button>
                  </div>
                </div>
              )}

              {/* TAB: Apariencia */}
              {activeTab === 'appearance' && (
                <div className="space-y-8">
                  <div className="flex items-center gap-3 border-b border-[var(--border-color)] pb-5">
                    <div className="w-10 h-10 rounded-2xl bg-[#FF5C3A]/10 flex items-center justify-center"><svg className="w-5 h-5 text-[#FF5C3A]" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01"/></svg></div>
                    <div><h3 className="text-base font-bold text-[var(--text-primary)] italic uppercase tracking-tight">Paleta Visual</h3><p className="text-[10px] text-[var(--text-secondary)] uppercase font-medium tracking-widest">Esquema unificado</p></div>
                  </div>
                  {/* Selector de template */}
                  <div>
                    <label style={{ color: 'var(--text-secondary)' }} className="block text-sm font-medium mb-1">Layout del Widget</label>
                    <p style={{ color: 'var(--text-muted)' }} className="text-xs mb-3">Cada template cambia la disposición de los elementos, no solo los colores</p>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {TEMPLATES.map(tpl => {
                        const locked = tpl.proOnly && !isPro;
                        const selected = formData.widgetTemplate === tpl.id;
                        return (
                          <button key={tpl.id} type="button" onClick={() => applyTemplate(tpl)}
                            style={!selected ? { borderColor: 'var(--border-color)' } : {}}
                            className={`relative rounded-xl border-2 p-2 text-left transition-all ${selected ? 'border-[#FF5C3A] shadow-md' : 'hover:opacity-80'} ${locked ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}`}>
                            <div className="rounded-lg h-20 mb-2 overflow-hidden" style={{ backgroundColor: tpl.defaultSecondary }}>
                              <LayoutMiniPreview layout={tpl.layout} primary={tpl.defaultPrimary} secondary={tpl.defaultSecondary} />
                            </div>
                            <p style={{ color: 'var(--text-primary)' }} className="text-xs font-semibold">{tpl.name}</p>
                            <p style={{ color: 'var(--text-muted)' }} className="text-xs leading-tight mt-0.5">{tpl.description}</p>
                            {locked && (
                              <span className="absolute top-2 right-2 text-[10px] bg-[#ef4444] text-white px-2 py-0.5 rounded-full font-bold shadow-sm">
                                PRO
                              </span>
                            )}
                            {selected && !locked && (
                              <div className="absolute top-2 right-2 w-4 h-4 bg-[#FF5C3A] rounded-full flex items-center justify-center">
                                <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                              </div>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Colores */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label style={{ color: 'var(--text-secondary)' }} className="block text-sm font-medium mb-1">Color Principal</label>
                      <div className="flex gap-2 mb-2">
                        <input type="color" name="primaryColor" value={formData.primaryColor || '#000000'} onChange={handleChange}
                          style={{ borderColor: 'var(--border-color)' }}
                          className="h-9 w-12 rounded-lg border cursor-pointer p-0.5" />
                        <Input name="primaryColor" value={formData.primaryColor || ''} onChange={handleChange} error={errors.primaryColor} placeholder="#000000" className="flex-1 font-mono text-sm" />
                      </div>
                      <div className="flex gap-1.5 flex-wrap">
                        {COLOR_PRESETS.map(c => (
                          <button key={c} type="button" onClick={() => setFormData(p => ({ ...p, primaryColor: c }))}
                            className={`w-6 h-6 rounded-full border-2 transition-transform hover:scale-110 ${formData.primaryColor === c ? 'border-[#FF5C3A] scale-110' : 'border-transparent'}`}
                            style={{ backgroundColor: c }} />
                        ))}
                      </div>
                    </div>
                    <div>
                      <label style={{ color: 'var(--text-secondary)' }} className="block text-sm font-medium mb-1">Color de Fondo</label>
                      <div className="flex gap-2 mb-2">
                        <input type="color" name="secondaryColor" value={formData.secondaryColor || '#ffffff'} onChange={handleChange}
                          style={{ borderColor: 'var(--border-color)' }}
                          className="h-9 w-12 rounded-lg border cursor-pointer p-0.5" />
                        <Input name="secondaryColor" value={formData.secondaryColor || ''} onChange={handleChange} error={errors.secondaryColor} placeholder="#FFFFFF" className="flex-1 font-mono text-sm" />
                      </div>
                      <div className="flex gap-1.5 flex-wrap">
                        {BG_PRESETS.map(c => (
                          <button key={c} type="button" onClick={() => setFormData(p => ({ ...p, secondaryColor: c }))}
                            className={`w-6 h-6 rounded-full border-2 transition-transform hover:scale-110 ${formData.secondaryColor === c ? 'scale-110 ring-2 ring-offset-1 ring-[#FF5C3A]' : 'border-transparent'}`}
                            style={{ backgroundColor: c }} />
                        ))}
                      </div>
                    </div>
                  </div>

                  <div style={{ borderColor: 'var(--border-color)' }} className="pt-2 border-t">
                    <Button type="submit" disabled={isSubmitting} className="w-full">
                      {isSubmitting ? 'Guardando...' : 'Guardar Cambios'}
                    </Button>
                  </div>
                </div>
              )}

              {/* TAB: Pro */}
              {activeTab === 'pro' && (
                <div className="space-y-8">
                  <div className="flex items-center gap-3 border-b border-[var(--border-color)] pb-5">
                    <div className="w-10 h-10 rounded-2xl bg-[#FF5C3A]/10 flex items-center justify-center"><svg className="w-5 h-5 text-[#FF5C3A]" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/></svg></div>
                    <div><h3 className="text-base font-bold text-[var(--text-primary)] italic uppercase tracking-tight">Opciones Pro</h3><p className="text-[10px] text-[var(--text-secondary)] uppercase font-medium tracking-widest">Exclusivo Widget</p></div>
                  </div>
                  {!isPro ? (
                    <div style={{ borderColor: 'var(--border-color)' }} className="rounded-2xl overflow-hidden border">
                      <div className="bg-gradient-to-r from-[#FF5C3A] to-[#e04e30] px-5 py-4">
                        <p className="font-bold text-white text-base">Plan Pro — Personalización Avanzada</p>
                        <p className="text-white/70 text-xs mt-1">Desbloquea control total sobre tu widget</p>
                      </div>
                      <div style={{ background: 'rgba(255,92,58,0.06)' }} className="px-5 py-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {[
                          'Hasta 15 productos activos',
                          '1.200 generaciones/mes',
                          'Templates Minimal, Modern y Bold',
                          'Texto del botón personalizado',
                          'Mensaje de bienvenida en widget',
                          'URL del widget personalizable',
                          'Soporte prioritario',
                        ].map(f => (
                          <div key={f} className="flex items-center gap-2 text-xs text-[#FF5C3A]">
                            <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                            <span style={{ color: 'var(--text-secondary)' }}>{f}</span>
                          </div>
                        ))}
                      </div>
                      <div style={{ background: 'var(--bg-card)', borderColor: 'var(--border-color)' }} className="px-5 py-3 border-t">
                        <button
                          type="button"
                          onClick={() => setShowUpgradeModal(true)}
                          className="w-full py-2.5 rounded-xl bg-[#FF5C3A] text-white text-sm font-semibold hover:bg-[#e04e30] transition-colors"
                        >
                          Activar plan
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div style={{ background: 'rgba(255,92,58,0.06)', borderColor: 'rgba(255,92,58,0.2)' }} className="flex items-center gap-2 border rounded-xl px-4 py-3">
                      <svg className="w-4 h-4 text-[#FF5C3A]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                      </svg>
                      <p style={{ color: 'var(--text-primary)' }} className="text-sm font-medium">Tienes acceso completo al Plan Pro</p>
                    </div>
                  )}

                  <div className={!isPro ? 'opacity-40 pointer-events-none select-none' : ''}>
                    <div className="space-y-4">
                      <div>
                        <label style={{ color: 'var(--text-secondary)' }} className="block text-sm font-medium mb-1">URL del widget (slug)</label>
                        <div style={{ borderColor: 'var(--border-color)' }} className="flex items-center gap-0 rounded-lg border overflow-hidden focus-within:ring-2 focus-within:ring-[#FF5C3A]">
                          <span style={{ background: 'var(--bg-hover)', color: 'var(--text-muted)', borderColor: 'var(--border-color)' }} className="px-3 py-2 text-sm border-r whitespace-nowrap select-none">/marca/</span>
                          <input
                            name="slug"
                            value={formData.slug || ''}
                            onChange={handleChange}
                            placeholder="mi-marca"
                            style={{ background: 'var(--bg-input)', color: 'var(--text-primary)' }}
                            className="flex-1 px-3 py-2 text-sm font-mono focus:outline-none"
                          />
                        </div>
                        {errors.slug
                          ? <p className="text-xs text-red-500 mt-1">{errors.slug}</p>
                          : <p style={{ color: 'var(--text-muted)' }} className="text-xs mt-1">Solo letras minúsculas, números y guiones. Cambiar esto actualiza la URL pública del probador.</p>
                        }
                      </div>
                      <div>
                        <label style={{ color: 'var(--text-secondary)' }} className="block text-sm font-medium mb-1">Texto del botón principal</label>
                        <Input name="buttonText" value={formData.buttonText || ''} onChange={handleChange} placeholder="Probarme esto" />
                        <p style={{ color: 'var(--text-muted)' }} className="text-xs mt-1">Texto que aparece en el botón de generar</p>
                      </div>
                      <div>
                        <label style={{ color: 'var(--text-secondary)' }} className="block text-sm font-medium mb-1">Mensaje de bienvenida</label>
                        <textarea name="welcomeMessage" value={formData.welcomeMessage || ''} onChange={handleChange}
                          placeholder="¡Bienvenido! Pruébate nuestros productos virtualmente..."
                          rows={3}
                          style={{ background: 'var(--bg-input)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
                          className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#FF5C3A] resize-none" />
                        <p style={{ color: 'var(--text-muted)' }} className="text-xs mt-1">Aparece en la pantalla inicial del widget</p>
                      </div>
                      {isPro && (
                        <div style={{ background: 'rgba(255,92,58,0.06)', borderColor: 'rgba(255,92,58,0.2)' }} className="mt-2 p-3 rounded-xl border">
                          <p className="text-xs font-semibold text-[#FF5C3A] mb-1">Templates Pro desbloqueados</p>
                          <p style={{ color: 'var(--text-secondary)' }} className="text-xs">Ve a la pestaña Apariencia para seleccionar entre los layouts Minimal, Modern y Bold.</p>
                        </div>
                      )}
                    </div>
                  </div>

                  <div style={{ borderColor: 'var(--border-color)' }} className="pt-2 border-t">
                    <Button type="submit" disabled={isSubmitting || !isPro} className="w-full">
                      {isSubmitting ? 'Guardando...' : isPro ? 'Guardar Cambios Pro' : 'Requiere Plan Pro'}
                    </Button>
                  </div>
                </div>
              )}

            </form>
        </section>
      </div>

      {/* Preview — 4 cols */}
      <div className="lg:col-span-4 space-y-5">
        <section className="p-6 rounded-[2.5rem] bg-[var(--bg-card)] border border-[var(--border-color)] shadow-sm">
          <div className="border-b border-[var(--border-color)] pb-4 mb-4">
            <h3 style={{ color: 'var(--text-primary)' }} className="text-sm font-medium">Vista Previa del Widget</h3>
            <p style={{ color: 'var(--text-muted)' }} className="text-xs mt-0.5">
              Layout: <span className="font-medium capitalize">{TEMPLATES.find(t => t.id === formData.widgetTemplate)?.name || 'Minimal'}</span>
            </p>
          </div>
            <WidgetPreview formData={formData} brandName={formData.name || brand.name} />
          
        </section>
        <div style={{ background: 'var(--bg-hover)', borderColor: 'var(--border-color)' }} className="rounded-xl p-4 border">
          <p style={{ color: 'var(--text-secondary)' }} className="text-xs font-semibold mb-2">URL de tu widget</p>
          <code style={{ background: 'var(--bg-card)', borderColor: 'var(--border-color)', color: 'var(--text-muted)' }} className="text-xs break-all rounded p-2 block border">
            {`/marca/${formData.slug || brand.slug}`}
          </code>
          <p style={{ color: 'var(--text-muted)' }} className="text-xs mt-2">Los cambios se reflejan en tiempo real en el widget embebido</p>
        </div>
      </div>
        </>
      ) : (
        <div className="lg:col-span-9">
          <EmbedSection />
        </div>
      )}
    </div>
  );
}
