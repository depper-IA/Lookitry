'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Brand, UpdateBrandConfigDto, WidgetTemplate } from '@/types';
import { 
  Settings, 
  Palette, 
  Code2, 
  Zap, 
  ChevronRight, 
  Image as ImageIcon, 
  Type, 
  Globe, 
  Lock,
  Sparkles,
  Info,
  ExternalLink,
  Smartphone,
  Check,
  X,
  Plus,
  Layout
} from 'lucide-react';
import { uploadService } from '@/services/upload.service';
import { EmbedSection } from './EmbedSection';

const Tooltip = ({ text }: { text: string }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative inline-block ml-1.5">
      <button 
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        onBlur={() => setTimeout(() => setIsOpen(false), 200)}
        className={`w-4 h-4 rounded-full border flex items-center justify-center transition-all shadow-sm ${
          isOpen 
            ? 'bg-[#FF5C3A] border-[#FF5C3A] text-white scale-110 shadow-[#FF5C3A]/20' 
            : 'bg-[var(--bg-input)] border-[var(--border-color)] text-[var(--text-muted)] hover:text-[#FF5C3A] cursor-help'
        }`}
      >
        {isOpen ? <X className="w-2.5 h-2.5" strokeWidth={4} /> : <Info className="w-2.5 h-2.5" />}
      </button>
      
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0, y: 10, x: '-50%', scale: 0.95 }}
            animate={{ opacity: 1, y: 0, x: '-50%', scale: 1 }}
            exit={{ opacity: 0, y: 10, x: '-50%', scale: 0.95 }}
            className="absolute bottom-full left-1/2 mb-3 w-64 p-4 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl shadow-2xl z-50 pointer-events-none border-b-4 border-b-[#FF5C3A]"
          >
            <p className="text-[10px] leading-relaxed text-[var(--text-primary)] font-bold uppercase tracking-wider">{text}</p>
            <div className="absolute top-full left-1/2 -translate-x-1/2 border-8 border-transparent border-t-[#FF5C3A]"></div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

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
    name: 'Minimal Canvas',
    description: 'Sin distractores, ideal para integrar como capa directa',
    layout: 'bare',
    defaultPrimary: '#000000',
    defaultSecondary: '#FFFFFF',
  },
  {
    id: 'minimal',
    name: 'Top Stream',
    description: 'Navegación fluida por la parte superior',
    layout: 'top-bar',
    defaultPrimary: '#111827',
    defaultSecondary: '#F9FAFB',
    proOnly: true,
  },
  {
    id: 'modern',
    name: 'Side Panel',
    description: 'Layout vertical para marcas con catálogos dinámicos',
    layout: 'sidebar',
    defaultPrimary: '#6366F1',
    defaultSecondary: '#EEF2FF',
    proOnly: true,
  },
  {
    id: 'bold',
    name: 'Hero Impact',
    description: 'Focus total en el producto principal y la experiencia',
    layout: 'centered',
    defaultPrimary: '#F59E0B',
    defaultSecondary: '#111827',
    proOnly: true,
  },
];

const COLOR_PRESETS = [
  '#FF5C3A', '#6366F1', '#10B981', '#F59E0B',
  '#EC4899', '#3B82F6', '#111827', '#8B5CF6',
];

const BG_PRESETS = [
  '#FFFFFF', '#F8FAFC', '#EEF2FF', '#FFF7ED',
  '#000000', '#0F172A', '#1E1B4B', '#111111',
];

// Layout Preview Components
function LayoutPreview({ layout, primary, secondary }: { layout: string; primary: string; secondary: string }) {
  const dot = <div className="w-1.5 h-1.5 rounded-full" style={{ background: primary }} />;
  return (
    <div className="w-full h-full rounded-xl border border-black/5 overflow-hidden flex shadow-inner" style={{ background: secondary }}>
      {layout === 'bare' && (
        <div className="flex-1 flex flex-col items-center justify-center p-3 gap-2">
          <div className="w-10 h-10 rounded-full border-2 border-dashed border-black/10 flex items-center justify-center">{dot}</div>
          <div className="h-1.5 w-12 rounded-full" style={{ background: primary }} />
        </div>
      )}
      {layout === 'top-bar' && (
        <div className="flex-1 flex flex-col">
          <div className="h-3 w-full flex items-center px-1.5 gap-1 border-b border-black/5" style={{ background: primary }}><div className="w-1.5 h-1.5 rounded bg-white/40" /></div>
          <div className="flex-1 flex flex-col items-center justify-center p-2 gap-1.5"><div className="w-8 h-8 rounded-full border border-black/5 bg-white shadow-sm" /><div className="h-1 w-10 rounded bg-black/10" /></div>
        </div>
      )}
      {layout === 'sidebar' && (
        <div className="flex-1 flex">
          <div className="w-6 h-full border-r border-black/5 p-1 flex flex-col gap-1" style={{ background: primary }}><div className="w-full h-4 bg-white/10 rounded" /></div>
          <div className="flex-1 flex flex-col items-center justify-center p-2 gap-2"><div className="w-8 h-8 rounded-full border border-black/5 bg-white shadow-sm" /><div className="h-2 w-full rounded" style={{ background: primary }} /></div>
        </div>
      )}
      {layout === 'centered' && (
        <div className="flex-1 flex flex-col items-center justify-center p-3 gap-3">
          <div className="h-2 w-16" style={{ background: primary }} /><div className="w-12 h-12 rounded-2xl border border-black/5 bg-white shadow-sm flex items-center justify-center">{dot}</div>
        </div>
      )}
    </div>
  );
}

// Main dynamic preview component based on selected template
function LiveWidgetPreview({ template, primary, secondary, logo, welcome, buttonText, brandName }: { 
  template: WidgetTemplate; 
  primary: string; 
  secondary: string;
  logo?: string;
  welcome?: string;
  buttonText: string;
  brandName: string;
}) {
  const dot = <div className="w-2 h-2 rounded-full" style={{ background: primary }} />;
  
  return (
    <div className="w-full h-full flex flex-col relative overflow-hidden" style={{ background: secondary }}>
      {/* Bare / Minimal Canvas */}
      {(template === 'bare' || !template) && (
        <div className="flex-1 flex flex-col items-center justify-center p-6 gap-6">
          <div className="space-y-3 text-center">
            {logo ? <img src={logo} className="h-8 mx-auto object-contain" alt="Logo" /> : <div className="font-bold text-lg" style={{ color: primary }}>{brandName}</div>}
            <p className="text-[10px] font-medium opacity-60 uppercase tracking-widest" style={{ color: primary }}>{welcome || 'Pruébalo ahora'}</p>
          </div>
          <div className="w-24 h-24 rounded-full border-2 border-dashed flex items-center justify-center" style={{ borderColor: `${primary}40` }}>
            <Sparkles size={32} style={{ color: primary, opacity: 0.3 }} />
          </div>
          <button className="w-full max-w-[180px] py-3 rounded-xl text-white text-[10px] font-bold uppercase tracking-widest shadow-lg" style={{ background: primary }}>{buttonText}</button>
        </div>
      )}

      {/* Minimal / Top Stream */}
      {template === 'minimal' && (
        <div className="flex-1 flex flex-col">
          <div className="h-12 w-full flex items-center justify-between px-4 border-b border-black/5" style={{ background: primary }}>
            {logo ? <img src={logo} className="h-5 brightness-0 invert object-contain" alt="Logo" /> : <div className="text-white font-bold text-xs">{brandName}</div>}
            <div className="w-6 h-6 rounded-full bg-white/20" />
          </div>
          <div className="flex-1 flex flex-col items-center justify-center p-6 gap-4">
            <div className="w-32 h-40 bg-white/50 rounded-2xl border border-black/5 shadow-sm flex items-center justify-center">{dot}</div>
            <button className="w-full py-3 rounded-xl text-white text-[10px] font-bold uppercase" style={{ background: primary }}>{buttonText}</button>
          </div>
        </div>
      )}

      {/* Modern / Side Panel */}
      {template === 'modern' && (
        <div className="flex-1 flex">
          <div className="w-16 h-full flex flex-col items-center py-6 gap-4 border-r border-black/5" style={{ background: primary }}>
            <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center"><Layout size={14} className="text-white" /></div>
            <div className="flex-1 flex flex-col gap-2">
              {[1,2,3].map(i => <div key={i} className="w-8 h-8 rounded-lg bg-white/10" />)}
            </div>
          </div>
          <div className="flex-1 flex flex-col items-center justify-center p-6 gap-6">
            {logo && <img src={logo} className="h-6 object-contain" alt="Logo" />}
            <div className="w-28 h-28 rounded-full border-4 border-white shadow-2xl flex items-center justify-center bg-white">{dot}</div>
            <button className="w-full py-3 rounded-xl text-white text-[10px] font-bold uppercase" style={{ background: primary }}>{buttonText}</button>
          </div>
        </div>
      )}

      {/* Bold / Hero Impact */}
      {template === 'bold' && (
        <div className="flex-1 flex flex-col items-center justify-center p-8 gap-8">
          <div className="absolute top-6 left-6">
            {logo ? <img src={logo} className="h-6 object-contain" alt="Logo" /> : <div className="font-bold text-xs" style={{ color: primary }}>{brandName}</div>}
          </div>
          <div className="w-full aspect-square bg-white rounded-[2.5rem] shadow-2xl flex items-center justify-center border-8 border-black/5 relative overflow-hidden">
             <div className="absolute inset-0 opacity-10" style={{ background: `radial-gradient(circle, ${primary} 0%, transparent 70%)` }} />
             <Sparkles size={48} style={{ color: primary, opacity: 0.4 }} />
          </div>
          <button className="w-full py-4 rounded-2xl text-white text-[11px] font-bold uppercase tracking-[0.2em] shadow-2xl hover:scale-[1.02] transition-transform" style={{ background: primary }}>{buttonText}</button>
        </div>
      )}
    </div>
  );
}

function useProConfig() {
  const [proPrice, setProPrice] = useState<number | null>(null);
  const [proGenerations, setProGenerations] = useState<number | null>(null);
  
  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/pricing_config?id=eq.pro&select=data`, {
      headers: { apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, Authorization: `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!}` },
    })
      .then(res => res.json())
      .then(data => {
        if (data && data.length > 0) {
          if (data[0].data?.precio_mensual_cop) setProPrice(data[0].data.precio_mensual_cop);
          if (data[0].data?.generaciones_mes) setProGenerations(data[0].data.generaciones_mes);
        }
      })
      .catch(() => {});
  }, []);

  return { proPrice, proGenerations };
}

export function SettingsForm({ brand, onSubmit }: SettingsFormProps) {
  const { proPrice, proGenerations } = useProConfig();
  const isPro = brand.plan === 'PRO';
  const [activeTab, setActiveTab] = useState<'general' | 'appearance' | 'embed' | 'pro'>(isPro ? 'general' : 'pro');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [logoUploading, setLogoUploading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  
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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(p => ({ ...p, [name]: value }));
    if (errors[name]) setErrors(p => ({ ...p, [name]: '' }));
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLogoUploading(true);
    try {
      const reader = new FileReader();
      reader.onload = async () => {
        const base64 = (reader.result as string).split(',')[1];
        const url = await uploadService.uploadImage(base64, `logo-${Date.now()}.${file.name.split('.').pop()}`, false);
        setFormData(p => ({ ...p, logo: url }));
        setLogoUploading(false);
      };
      reader.readAsDataURL(file);
    } catch {
      setLogoUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await onSubmit(formData);
    } finally {
      setIsSubmitting(false);
    }
  };

  const tab_items = [
    { id: 'pro', icon: <Sparkles size={18} />, label: 'Lookitry Pro', pro: true },
    { id: 'general', icon: <Settings size={18} />, label: 'Identidad' },
    { id: 'appearance', icon: <Palette size={18} />, label: 'Apariencia' },
    { id: 'embed', icon: <Code2 size={18} />, label: 'Integración' },
  ];

  const sectionStyle = "bg-[var(--bg-card)] rounded-3xl border border-[var(--border-color)] p-5 md:p-8 space-y-6 md:space-y-8 shadow-xl shadow-black/5 relative overflow-hidden group";
  const labelStyle = "text-xs font-bold tracking-tight text-[var(--text-secondary)] mb-2 block opacity-80";
  const inputStyle = "w-full px-4 py-3 rounded-xl border border-[var(--border-color)] bg-[var(--bg-input)] text-sm font-semibold text-[var(--text-primary)] focus:border-[#FF5C3A] focus:ring-2 focus:ring-[#FF5C3A]/10 outline-none transition-all placeholder:text-[var(--text-muted)] shadow-sm";

  return (
    <div className="flex flex-col lg:grid lg:grid-cols-4 gap-6 md:gap-8">
      
      {/* ── SIDEBAR NAVIGATION (LEFT) ── */}
      <div className="lg:col-span-1 space-y-6">
        <div className="bg-[var(--bg-card)] rounded-3xl border border-[var(--border-color)] p-2 shadow-xl shadow-black/5 overflow-x-auto flex lg:flex-col no-scrollbar">
          {tab_items.map((tab) => {
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex-shrink-0 flex items-center gap-3 px-5 py-3 rounded-2xl transition-all duration-300 group/tab relative ${active ? 'bg-[#FF5C3A] text-white shadow-lg shadow-[#FF5C3A]/20' : 'text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]'}`}
              >
                <div className={`transition-transform duration-300 ${active ? 'scale-110' : 'opacity-50'}`}>
                  {tab.icon}
                </div>
                <div className="text-left leading-none">
                  <span className="text-[11px] font-bold tracking-tight block mb-0.5">{tab.label}</span>
                  {tab.id === 'pro' && !isPro && <span className="text-[8px] font-black uppercase text-[#FF5C3A] bg-white px-1.5 py-0.5 rounded">Bloqueado</span>}
                </div>
                {active && (
                   <motion.div layoutId="tab-active" className="hidden lg:block absolute right-4" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}>
                    <ChevronRight size={14} className="opacity-40" />
                  </motion.div>
                )}
              </button>
            );
          })}
        </div>

        <AnimatePresence>
          {activeTab !== 'embed' && (
            <motion.div 
               initial={{ opacity: 0, y: 30 }}
               animate={{ opacity: 1, y: 0 }}
               exit={{ opacity: 0, y: 30 }}
               className="hidden lg:block space-y-6"
            >
               <div className="bg-[var(--bg-card)] rounded-3xl border border-[var(--border-color)] shadow-2xl overflow-hidden group/preview">
                  {/* Browser Header */}
                  <div className="h-10 bg-zinc-100 border-b border-[var(--border-color)] flex items-center px-4 justify-between">
                    <div className="flex gap-1.5">
                      <div className="w-2.5 h-2.5 rounded-full bg-[#FF5C3A]/30" />
                      <div className="w-2.5 h-2.5 rounded-full bg-zinc-300" />
                      <div className="w-2.5 h-2.5 rounded-full bg-zinc-300" />
                    </div>
                    <div className="flex-1 max-w-[120px] h-5 bg-white rounded-md border border-black/5 mx-auto" />
                  </div>
                  
                  {/* Live Preview Container */}
                  <div className="aspect-[4/5] relative">
                    <LiveWidgetPreview 
                      template={formData.widgetTemplate as WidgetTemplate}
                      primary={formData.primaryColor || '#FF5C3A'}
                      secondary={formData.secondaryColor || '#FFFFFF'}
                      logo={formData.logo}
                      welcome={formData.welcomeMessage}
                      buttonText={formData.buttonText || 'Probar'}
                      brandName={brand.name}
                    />
                    
                    {/* Live Badge Overlay */}
                    <div className="absolute top-4 right-4 z-20 pointer-events-none">
                      <div className="px-3 py-1 bg-white/80 backdrop-blur-md rounded-full border border-black/5 shadow-sm flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-[#FF5C3A] animate-pulse" />
                        <span className="text-[8px] font-bold uppercase tracking-wider text-zinc-500">Vista previa</span>
                      </div>
                    </div>
                  </div>
               </div>

               <div className="p-4 rounded-2xl bg-[var(--bg-base)] border border-[var(--border-color)] space-y-2 shadow-inner">
                  <p className="text-[8px] font-bold uppercase text-[var(--text-muted)] tracking-widest leading-none opacity-60">Enlace de tu marca</p>
                  <div className="flex items-center justify-between gap-2 overflow-hidden">
                    <p className="text-[10px] font-bold font-mono text-[var(--text-primary)] truncate opacity-50">lookitry.com/marca/{formData.slug || brand.slug}</p>
                    <a href={`/marca/${formData.slug || brand.slug}`} target="_blank" className="p-2 rounded-lg bg-[var(--bg-card)] border border-[var(--border-color)] text-[var(--text-primary)] hover:text-[#FF5C3A] hover:border-[#FF5C3A]/30 transition-all shrink-0 shadow-sm"><ExternalLink size={12} /></a>
                  </div>
               </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="lg:col-span-3">
         <AnimatePresence mode="wait">
           {activeTab === 'general' && (
             <motion.section key="general" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className={sectionStyle}>
               <div className="absolute top-0 right-0 p-8 opacity-[0.03] pointer-events-none"><Settings size={180} /></div>
               <div className="flex items-center gap-4 relative z-10 border-b border-[var(--border-color)] pb-6">
                 <div className="w-10 h-10 md:w-12 md:h-12 rounded-2xl bg-[#FF5C3A]/10 flex items-center justify-center"><Settings className="w-5 h-5 md:w-6 md:h-6 text-[#FF5C3A]" /></div>
                 <div>
                   <h3 className="text-lg md:text-xl font-bold text-[var(--text-primary)] tracking-tight">Identidad de marca</h3>
                   <p className="text-[10px] text-[var(--text-secondary)] font-bold tracking-[0.1em] opacity-60">Nombre, slug y logotipo</p>
                 </div>
               </div>

               <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 pt-4 relative z-10">
                 <div className="space-y-6">
                   <div>
                     <label className={labelStyle}>Nombre de la marca</label>
                     <input type="text" name="name" value={formData.name || ''} onChange={handleChange} className={inputStyle} placeholder="Ej: Lookitry Fashion" />
                   </div>
                   <div>
                      <div className="flex items-center mb-1">
                        <label className={labelStyle}>Identificador único (slug)</label>
                        <Tooltip text="Esta será la URL de tu probador público. Solo disponible en planes PRO." />
                      </div>
                      <div className={`relative ${!isPro ? 'group/locked' : ''}`}>
                         <Globe className={`absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 ${!isPro ? 'text-[var(--text-muted)]' : 'text-[#FF5C3A]'}`} />
                         <input 
                           type="text" 
                           name="slug" 
                           value={formData.slug || ''} 
                           onChange={handleChange} 
                           disabled={!isPro}
                           className={`${inputStyle} pl-12 font-mono lowercase tracking-tight ${!isPro ? 'bg-zinc-100/50 cursor-not-allowed opacity-60' : ''}`} 
                           placeholder="mi-marca-oficial" 
                         />
                         {!isPro && (
                           <div className="absolute inset-0 flex items-center justify-end pr-4 pointer-events-none opacity-0 group-hover/locked:opacity-100 transition-opacity">
                             <span className="bg-zinc-900 text-white text-[8px] font-black uppercase px-2 py-1 rounded shadow-xl">Solo Pro</span>
                           </div>
                         )}
                      </div>
                   </div>
                 </div>

                 <div className="space-y-4">
                    <label className={labelStyle}>Emblema de marca (logo)</label>
                    <div className="flex items-center gap-5 p-4 md:p-5 bg-[var(--bg-input)] rounded-2xl border border-[var(--border-color)] shadow-inner">
                       <div className="w-16 h-16 md:w-20 md:h-20 rounded-xl bg-white flex items-center justify-center p-2 md:p-3 border border-black/5 shadow-lg relative overflow-hidden shrink-0">
                         {formData.logo ? (
                           <img src={formData.logo} alt="Logo" className="w-full h-full object-contain" />
                         ) : (
                           <ImageIcon className="w-6 h-6 opacity-10" />
                         )}
                         {logoUploading && <div className="absolute inset-0 bg-black/40 flex items-center justify-center"><Zap className="w-5 h-5 text-white animate-spin" /></div>}
                       </div>
                       <div className="flex-1 space-y-2">
                         <label className="flex items-center justify-center gap-2 px-4 py-2 bg-[var(--text-primary)] text-[var(--bg-card)] rounded-xl text-[10px] font-bold tracking-tight cursor-pointer hover:brightness-110 active:scale-95 transition-all">
                            <Plus size={12} /> Cambiar logo
                            <input type="file" className="hidden" onChange={handleLogoUpload} accept="image/*" />
                         </label>
                         {formData.logo && (
                           <button onClick={() => setFormData(p => ({ ...p, logo: '' }))} className="w-full py-1.5 text-[9px] font-bold text-rose-500 tracking-tight hover:bg-rose-500/5 transition-colors rounded-lg">Eliminar</button>
                         )}
                       </div>
                    </div>
                 </div>
               </div>

               <div className="pt-6 md:pt-8 flex justify-end relative z-10 border-t border-[var(--border-color)]">
                 <button 
                   onClick={handleSubmit} disabled={isSubmitting}
                   className="w-full md:w-auto px-10 py-3.5 bg-[#FF5C3A] text-white rounded-2xl font-bold uppercase tracking-widest shadow-lg shadow-[#FF5C3A]/20 hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-3"
                 >
                   {isSubmitting ? <Zap className="w-5 h-5 animate-pulse" /> : <Check className="w-5 h-5" strokeWidth={3} />}
                   Guardar identidad
                 </button>
               </div>
             </motion.section>
           )}

           {activeTab === 'appearance' && (
             <motion.section key="appearance" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className={sectionStyle}>
               <div className="absolute top-0 right-0 p-8 opacity-[0.03] pointer-events-none"><Palette size={180} /></div>
               <div className="flex items-center gap-4 relative z-10 border-b border-[var(--border-color)] pb-6">
                 <div className="w-10 h-10 md:w-12 md:h-12 rounded-2xl bg-[#FF5C3A]/10 flex items-center justify-center"><Palette className="w-5 h-5 md:w-6 md:h-6 text-[#FF5C3A]" /></div>
                 <div>
                   <h3 className="text-lg md:text-xl font-bold text-[var(--text-primary)] tracking-tight">Personalización de diseño</h3>
                   <p className="text-[10px] text-[var(--text-secondary)] font-bold tracking-[0.1em] opacity-60">Plantilla, colores y apariencia</p>
                 </div>
               </div>

               <div className="space-y-8 md:space-y-10 pt-4 relative z-10">
                 <div className="space-y-4">
                    <label className={labelStyle}>Plantilla de interfaz</label>
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
                       {TEMPLATES.map((tpl) => {
                         const locked = tpl.proOnly && !isPro;
                         const active = formData.widgetTemplate === tpl.id;
                         return (
                           <button 
                             key={tpl.id}
                             onClick={() => !locked && setFormData(p => ({ ...p, widgetTemplate: tpl.id }))}
                             className={`p-2 md:p-3 rounded-2xl border transition-all relative group/tpl ${active ? 'border-[#FF5C3A] bg-[#FF5C3A]/5 shadow-lg scale-105 z-10' : 'border-[var(--border-color)] bg-[var(--bg-input)] hover:border-[#FF5C3A]/30'} ${locked ? 'opacity-50 cursor-not-allowed' : ''}`}
                           >
                             <div className="aspect-[4/3] mb-3"><LayoutPreview layout={tpl.layout} primary={tpl.defaultPrimary} secondary={tpl.defaultSecondary} /></div>
                             <div className="text-left px-1">
                                <p className={`text-[10px] font-bold tracking-tight truncate ${active ? 'text-[#FF5C3A]' : 'text-[var(--text-primary)]'}`}>{tpl.name}</p>
                                <p className="text-[8px] font-bold tracking-wide text-[var(--text-muted)] opacity-50 mt-0.5 truncate">{tpl.layout}</p>
                             </div>
                             {locked && <div className="absolute top-2 right-2 bg-zinc-900/90 backdrop-blur text-white p-1 rounded-lg"><Lock size={10} /></div>}
                             {active && !locked && <div className="absolute top-2 right-2 bg-[#FF5C3A] text-white p-1 rounded-lg shadow-lg border border-white/20"><Check size={10} strokeWidth={4} /></div>}
                           </button>
                         );
                       })}
                    </div>
                 </div>

                 <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-10 pt-8 border-t border-[var(--border-color)]">
                    <div className="space-y-5">
                       <label className={labelStyle}>Color principal (acento)</label>
                       <div className="flex gap-2.5 flex-wrap">
                          {COLOR_PRESETS.map(c => (
                            <button key={c} onClick={() => setFormData(p => ({ ...p, primaryColor: c }))} className={`w-8 h-8 md:w-10 md:h-10 rounded-xl border-2 transition-all hover:scale-110 active:scale-95 ${formData.primaryColor === c ? 'border-white ring-4 ring-[#FF5C3A]/20 scale-110 z-10 shadow-lg' : 'border-transparent opacity-70'}`} style={{ background: c }} />
                          ))}
                          <div className="relative w-8 h-8 md:w-10 md:h-10 rounded-xl border-2 border-dashed border-[var(--border-color)] overflow-hidden group/cust flex items-center justify-center hover:border-[#FF5C3A] transition-colors">
                             <input type="color" value={formData.primaryColor || '#FF5C3A'} onChange={e => setFormData(p => ({ ...p, primaryColor: e.target.value }))} className="absolute inset-0 opacity-0 cursor-pointer z-10" />
                             <Palette className="text-[var(--text-muted)] group-hover/cust:text-[#FF5C3A] transition-colors" size={14} />
                          </div>
                       </div>
                       <div className="flex items-center gap-2 mt-2">
                          <span className="text-[9px] font-mono font-bold text-[var(--text-muted)] bg-[var(--bg-input)] px-2.5 py-1 rounded-lg border border-[var(--border-color)]">{formData.primaryColor}</span>
                       </div>
                    </div>
                    <div className="space-y-5">
                       <label className={labelStyle}>Color de fondo (canvas)</label>
                       <div className="flex gap-2.5 flex-wrap">
                          {BG_PRESETS.map(c => (
                            <button key={c} onClick={() => setFormData(p => ({ ...p, secondaryColor: c }))} className={`w-8 h-8 md:w-10 md:h-10 rounded-xl border-2 transition-all hover:scale-110 active:scale-95 ${formData.secondaryColor === c ? 'border-[#FF5C3A] ring-4 ring-[#FF5C3A]/20 scale-110 z-10 shadow-md' : 'border-[var(--border-color)]'}`} style={{ background: c }} />
                          ))}
                       </div>
                       <div className="flex items-center gap-2 mt-2">
                          <span className="text-[9px] font-mono font-bold text-[var(--text-muted)] bg-[var(--bg-input)] px-2.5 py-1 rounded-lg border border-[var(--border-color)]">{formData.secondaryColor}</span>
                       </div>
                    </div>
                 </div>
               </div>

               <div className="pt-8 flex justify-end relative z-10 border-t border-[var(--border-color)]">
                 <button onClick={handleSubmit} className="w-full md:w-auto px-10 py-3.5 bg-[#FF5C3A] text-white rounded-2xl font-bold uppercase tracking-widest shadow-lg shadow-[#FF5C3A]/20 hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-3">
                   {isSubmitting ? <Zap className="w-5 h-5 animate-pulse" /> : <Sparkles className="w-5 h-5" />}
                   Guardar diseño
                 </button>
               </div>
             </motion.section>
           )}

           {activeTab === 'pro' && (
             <motion.section key="pro" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className={sectionStyle}>
               <div className="absolute top-0 right-0 p-8 opacity-[0.03] pointer-events-none"><Sparkles size={180} /></div>
               <div className="flex items-center gap-4 relative z-10 border-b border-[var(--border-color)] pb-6">
                 <div className="w-12 h-12 rounded-2xl bg-[var(--bg-base)] flex items-center justify-center border border-[var(--border-color)] shadow-inner"><Sparkles className="w-6 h-6 text-[#FF5C3A]" /></div>
                 <div>
                   <h3 className="text-xl font-bold uppercase text-[var(--text-primary)] tracking-tight">Lookitry Pro</h3>
                   <p className="text-[10px] text-[var(--text-secondary)] font-bold tracking-[0.2em] opacity-60">Control total y personalización</p>
                 </div>
               </div>

               {!isPro ? (
                 <div className="pt-6 space-y-8 relative z-10">
                    <div className="relative overflow-hidden rounded-[2.5rem] border border-zinc-100 bg-white shadow-2xl group">
                        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-gradient-to-bl from-[#FF5C3A]/10 via-transparent to-transparent rounded-full -mr-32 -mt-32 blur-3xl" />
                        
                        <div className="relative z-10 p-8 xl:p-10 flex flex-col lg:flex-row gap-10 xl:gap-12 items-center">
                           <div className="flex-1 space-y-8">
                              <div className="space-y-4">
                                 <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#FF5C3A]/10 rounded-full border border-[#FF5C3A]/20">
                                    <Sparkles className="w-3 h-3 text-[#FF5C3A]" />
                                    <span className="text-[9px] font-black uppercase tracking-wider text-[#FF5C3A]">Membresía Exclusive</span>
                                 </div>
                                 <h4 className="text-5xl font-[1000] text-zinc-900 uppercase tracking-tighter leading-[0.9]">
                                    Lookitry <br />
                                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FF5C3A] to-[#FF8C70]">Pro Experience</span>
                                 </h4>
                              </div>

                              <ul className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
                                 {[
                                   'Slug y Mensaje de Bienvenida',
                                   'CTA 100% dinámicos',
                                   'Todas las plantillas incl. Bold',
                                   'Control total de branding',
                                   `${proGenerations ? proGenerations.toLocaleString('es-CO') : '1.200'} generaciones mensuales`,
                                   'Hasta 15 productos activos'
                                 ].map((f, i) => (
                                   <li key={i} className="flex items-center gap-3 text-[10px] font-bold uppercase tracking-wide text-zinc-500">
                                      <div className="w-5 h-5 rounded-lg bg-zinc-50 flex items-center justify-center border border-zinc-100 text-[#FF5C3A]">
                                         <Check className="w-2.5 h-2.5" strokeWidth={4} />
                                      </div>
                                      {f}
                                   </li>
                                 ))}
                              </ul>
                           </div>

                           <div className="w-full lg:w-[280px] shrink-0 space-y-6">
                              <div className="p-6 rounded-3xl bg-zinc-50 border border-zinc-100 space-y-4 shadow-inner">
                                 <div className="space-y-1">
                                    <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest text-center">Inversión mensual</p>
                                    <div className="flex items-end justify-center gap-1.5">
                                       <span className="text-3xl font-[1000] text-zinc-900">$250k</span>
                                       <span className="text-[9px] font-bold text-zinc-400 uppercase mb-1.5">COP / Mes</span>
                                    </div>
                                 </div>
                                 <button onClick={() => window.location.href='/dashboard/subscription'} className="w-full py-5 bg-zinc-900 text-white rounded-2xl font-bold uppercase tracking-widest text-[10px] shadow-xl hover:bg-[#FF5C3A] transition-all active:scale-95 group/btn flex items-center justify-center gap-3">
                                    Suscribirme
                                    <ChevronRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
                                 </button>
                              </div>
                           </div>
                        </div>
                    </div>
                 </div>
               ) : (
                 <div className="pt-8 space-y-8 relative z-10">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="space-y-2.5">
                         <label className={labelStyle}>Texto del botón (CTA)</label>
                         <div className="relative">
                            <Smartphone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
                            <input type="text" name="buttonText" value={formData.buttonText || ''} onChange={handleChange} className={`${inputStyle} pl-12 font-bold uppercase tracking-widest`} placeholder="Probarme esto" />
                         </div>
                      </div>
                      <div className="space-y-2.5">
                         <label className={labelStyle}>Mensaje de entrada (welcome)</label>
                         <input type="text" name="welcomeMessage" value={formData.welcomeMessage || ''} onChange={handleChange} className={inputStyle} placeholder="¡Bienvenido a nuestro probador!" />
                      </div>
                    </div>
                    
                    <div className="p-6 rounded-3xl bg-[#FF5C3A]/5 border border-[#FF5C3A]/10 flex items-center justify-between shadow-sm">
                       <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-xl bg-[#FF5C3A] text-white flex items-center justify-center shadow-lg shadow-[#FF5C3A]/20"><Check size={18} strokeWidth={4} /></div>
                          <div>
                            <p className="text-[11px] font-bold uppercase tracking-widest text-[var(--text-primary)] leading-none">Plan pro activado</p>
                            <p className="text-[9px] font-semibold text-[var(--text-muted)] uppercase mt-1 opacity-60 tracking-tight">Disfrutas de todas las ventajas exclusivas</p>
                          </div>
                       </div>
                       <button onClick={handleSubmit} className="px-8 py-3 bg-[var(--text-primary)] text-[var(--bg-card)] rounded-xl text-[10px] font-bold uppercase tracking-widest hover:brightness-110 active:scale-95 transition-all shadow-md">Guardar</button>
                    </div>
                 </div>
               )}
             </motion.section>
           )}

           {activeTab === 'embed' && (
             <motion.div key="embed" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.98 }}>
               <EmbedSection />
             </motion.div>
           )}
         </AnimatePresence>
      </div>
    </div>
  );
}
