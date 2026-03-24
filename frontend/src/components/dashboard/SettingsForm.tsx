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

const Tooltip = ({ text }: { text: string }) => (
  <div className="group relative inline-block ml-1.5">
    <div className="w-4 h-4 rounded-full bg-[var(--bg-input)] border border-[var(--border-color)] flex items-center justify-center text-[var(--text-muted)] hover:text-[#FF5C3A] cursor-help transition-all shadow-sm">
      <Info className="w-2.5 h-2.5" />
    </div>
    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 w-64 p-4 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-500 shadow-2xl z-50 pointer-events-none border-b-4 border-b-[#FF5C3A]">
      <p className="text-[10px] leading-relaxed text-[var(--text-primary)] font-black uppercase tracking-wider italic">{text}</p>
      <div className="absolute top-full left-1/2 -translate-x-1/2 border-8 border-transparent border-t-[#FF5C3A]"></div>
    </div>
  </div>
);

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

export function SettingsForm({ brand, onSubmit }: SettingsFormProps) {
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
    widgetTemplate: brand.widgetTemplate || 'bare',
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
    { id: 'general', icon: <Settings size={18} />, label: 'Esencia' },
    { id: 'appearance', icon: <Palette size={18} />, label: 'Estética' },
    { id: 'embed', icon: <Code2 size={18} />, label: 'Integración' },
  ];

  const sectionStyle = "bg-[var(--bg-card)] rounded-[3rem] border border-[var(--border-color)] p-10 space-y-8 shadow-xl shadow-black/5 relative overflow-hidden group";
  const labelStyle = "text-[10px] font-black uppercase tracking-[0.25em] text-[var(--text-secondary)] mb-3 block italic opacity-70";
  const inputStyle = "w-full px-6 py-4 rounded-2xl border border-[var(--border-color)] bg-[var(--bg-input)] text-sm font-bold text-[var(--text-primary)] focus:border-[#FF5C3A] outline-none transition-all placeholder:text-[var(--text-muted)] placeholder:font-medium shadow-inner";

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-10">
      
      {/* ── SIDEBAR NAVIGATION (LEFT) ── */}
      <div className="lg:col-span-1 space-y-8">
        <div className="bg-[var(--bg-card)] rounded-[2.5rem] border border-[var(--border-color)] p-3 shadow-xl shadow-black/5">
          {tab_items.map((tab) => {
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`w-full flex items-center gap-4 px-6 py-4 rounded-[1.8rem] transition-all duration-300 group/tab relative ${active ? 'bg-[#FF5C3A] text-white shadow-lg shadow-[#FF5C3A]/20' : 'text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]'}`}
              >
                <div className={`transition-transform duration-300 ${active ? 'scale-110' : 'opacity-40'}`}>
                  {tab.icon}
                </div>
                <div className="text-left leading-none">
                  <span className="text-[10px] uppercase font-black tracking-widest block mb-0.5">{tab.label}</span>
                  {tab.id === 'pro' && !isPro && <span className="text-[8px] font-black uppercase text-[#FF5C3A] bg-white px-1.5 py-0.5 rounded italic">Bloqueado</span>}
                </div>
                {active && (
                   <motion.div layoutId="tab-active" className="absolute right-4" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}>
                    <ChevronRight size={14} className="opacity-40" />
                  </motion.div>
                )}
              </button>
            );
          })}
        </div>

        {/* ── PREVIEW COMPONENT (BELOW TABS) ── */}
        <AnimatePresence>
          {activeTab !== 'embed' && (
            <motion.div 
               initial={{ opacity: 0, y: 30 }}
               animate={{ opacity: 1, y: 0 }}
               exit={{ opacity: 0, y: 30 }}
               className="bg-[var(--bg-card)] p-8 rounded-[3rem] border border-[var(--border-color)] shadow-2xl space-y-8 relative overflow-hidden group/preview"
            >
               <div className="flex justify-between items-center relative z-10">
                  <h4 className="text-[10px] font-black uppercase tracking-widest text-[var(--text-secondary)] italic">Vista Previa Pro</h4>
                  <div className="flex gap-2">
                    <div className="w-2 h-2 rounded-full bg-[#FF5C3A]/40 animate-pulse" />
                    <div className="w-2 h-2 rounded-full bg-indigo-500/40" />
                  </div>
               </div>
               
               <div className="aspect-[4/5] rounded-[2.5rem] border border-[var(--border-color)] overflow-hidden shadow-4xl relative" style={{ background: formData.secondaryColor }}>
                  <div className="p-8 h-full flex flex-col justify-between">
                     <div className="space-y-3">
                        {formData.logo ? (
                          <img src={formData.logo} className="mx-auto h-8 object-contain" />
                        ) : (
                          <div className="text-xs font-black uppercase italic tracking-tighter text-center" style={{ color: formData.primaryColor }}>{brand.name}</div>
                        )}
                        <p className="text-[9px] font-black text-center opacity-40 leading-tight uppercase tracking-widest" style={{ color: formData.primaryColor }}>{formData.welcomeMessage || '¡Bienvenido!'}</p>
                     </div>
                     
                     <div className="w-24 h-24 rounded-full border-2 border-dashed mx-auto flex items-center justify-center transition-all group-hover/preview:scale-110" style={{ borderColor: formData.primaryColor }}>
                        <Sparkles size={28} style={{ color: formData.primaryColor, opacity: 0.3 }} />
                     </div>

                     <div className="space-y-4">
                        <div className="grid grid-cols-4 gap-2">
                          {[1,2,3,4].map(i => <div key={i} className="aspect-square bg-[var(--bg-input)] rounded-lg shadow-inner group-hover/preview:scale-[1.05] transition-all" />)}
                        </div>
                        <button className="w-full py-4 rounded-2xl text-white text-[10px] font-black uppercase tracking-widest shadow-2xl transition-all hover:brightness-110 active:scale-95" style={{ background: formData.primaryColor }}>{formData.buttonText}</button>
                     </div>
                  </div>
                  
                  {/* Simulation Overlay */}
                  <div className="absolute inset-0 pointer-events-none bg-gradient-to-tr from-white/5 to-transparent flex items-center justify-center opacity-0 group-hover/preview:opacity-100 transition-all duration-700">
                     <div className="px-5 py-2 bg-[var(--bg-card)]/60 backdrop-blur-xl rounded-full text-[8px] text-white font-black uppercase tracking-[0.2em] border border-white/10 shadow-4xl">Modo En Vivo</div>
                  </div>
               </div>

               <div className="p-5 rounded-[2rem] bg-[var(--bg-base)] border border-[var(--border-color)] space-y-3 shadow-inner">
                  <p className="text-[8px] font-black uppercase text-[var(--text-muted)] tracking-widest leading-none">Acceso Directo</p>
                  <div className="flex items-center justify-between gap-3 overflow-hidden">
                    <p className="text-[10px] font-black font-mono text-[var(--text-primary)] truncate opacity-50">lookitry.com/pruebalo/{formData.slug || brand.slug}</p>
                    <a href={`/pruebalo/${formData.slug || brand.slug}`} target="_blank" className="p-3 rounded-xl bg-[var(--bg-card)] border border-[var(--border-color)] text-[var(--text-primary)] hover:text-[#FF5C3A] hover:border-[#FF5C3A]/30 transition-all shrink-0 shadow-lg"><ExternalLink size={14} /></a>
                  </div>
               </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── CONTENT AREA (RIGHT) ── */}
      <div className="lg:col-span-3">
         <AnimatePresence mode="wait">
           {activeTab === 'general' && (
             <motion.section key="general" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} className={sectionStyle}>
               <div className="absolute top-0 right-0 p-8 opacity-5"><Settings size={120} /></div>
               <div className="flex items-center gap-4 relative z-10 border-b border-[var(--border-color)] pb-6">
                 <div className="w-12 h-12 rounded-2xl bg-[#FF5C3A]/10 flex items-center justify-center"><Settings className="w-6 h-6 text-[#FF5C3A]" /></div>
                 <div>
                   <h3 className="text-xl font-black italic uppercase text-[var(--text-primary)] tracking-tighter">Identidad de Marca</h3>
                   <p className="text-[10px] text-[var(--text-secondary)] uppercase font-black tracking-[0.2em] opacity-60">Nombre, slug y logotipo</p>
                 </div>
               </div>

               <div className="grid grid-cols-1 md:grid-cols-2 gap-10 pt-6 relative z-10">
                 <div className="space-y-6">
                   <div>
                     <label className={labelStyle}>Nombre de la Marca</label>
                     <input type="text" name="name" value={formData.name || ''} onChange={handleChange} className={inputStyle} placeholder="Ej: Lookitry Fashion" />
                   </div>
                   <div>
                      <div className="flex items-center mb-3">
                        <label className={labelStyle}>Identificador único (Slug)</label>
                        <Tooltip text="Esta será la URL de tu probador público. Solo disponible en planes PRO." />
                      </div>
                      <div className={`relative ${!isPro ? 'opacity-40 cursor-not-allowed' : ''}`}>
                         <Globe className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
                         <input 
                           type="text" 
                           name="slug" 
                           value={formData.slug || ''} 
                           onChange={handleChange} 
                           disabled={!isPro}
                           className={`${inputStyle} pl-14 font-mono lowercase tracking-tight`} 
                           placeholder="mi-marca-oficial" 
                         />
                      </div>
                   </div>
                 </div>

                 <div className="space-y-6">
                    <label className={labelStyle}>Emblema (Logo)</label>
                    <div className="flex items-center gap-6 p-6 bg-[var(--bg-input)] rounded-[2.5rem] border border-[var(--border-color)] shadow-inner group/logo">
                       <div className="w-24 h-24 rounded-3xl bg-white flex items-center justify-center p-3 border border-black/5 shadow-2xl relative overflow-hidden shrink-0">
                         {formData.logo ? (
                           <img src={formData.logo} alt="Logo" className="w-full h-full object-contain" />
                         ) : (
                           <ImageIcon className="w-8 h-8 opacity-10" />
                         )}
                         {logoUploading && <div className="absolute inset-0 bg-black/40 flex items-center justify-center"><Zap className="w-6 h-6 text-white animate-spin" /></div>}
                       </div>
                       <div className="flex-1 space-y-3">
                         <label className="flex items-center justify-center gap-2 px-6 py-3 bg-[var(--text-primary)] text-[var(--bg-card)] rounded-2xl text-[10px] font-black uppercase tracking-widest cursor-pointer hover:scale-105 active:scale-95 transition-all">
                            <Plus size={14} /> Subir Nuevo
                            <input type="file" className="hidden" onChange={handleLogoUpload} accept="image/*" />
                         </label>
                         {formData.logo && (
                           <button onClick={() => setFormData(p => ({ ...p, logo: '' }))} className="w-full py-2 text-[8px] font-black uppercase text-rose-500 tracking-widest hover:bg-rose-500/5 transition-colors rounded-xl">Eliminar Emblema</button>
                         )}
                       </div>
                    </div>
                 </div>
               </div>

               <div className="pt-10 flex justify-end relative z-10 border-t border-[var(--border-color)]">
                 <button 
                   onClick={handleSubmit} disabled={isSubmitting}
                   className="px-12 py-5 bg-[#FF5C3A] text-white rounded-[2rem] font-[950] italic uppercase tracking-widest shadow-4xl shadow-[#FF5C3A]/30 hover:scale-105 active:scale-95 transition-all flex items-center gap-3"
                 >
                   {isSubmitting ? <Zap className="w-5 h-5 animate-pulse" /> : <Check className="w-5 h-5" strokeWidth={4} />}
                   Guardar Cambios
                 </button>
               </div>
             </motion.section>
           )}

           {activeTab === 'appearance' && (
             <motion.section key="appearance" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} className={sectionStyle}>
               <div className="absolute top-0 right-0 p-8 opacity-5"><Palette size={120} /></div>
               <div className="flex items-center gap-4 relative z-10 border-b border-[var(--border-color)] pb-6">
                 <div className="w-12 h-12 rounded-2xl bg-[#FF5C3A]/10 flex items-center justify-center"><Palette className="w-6 h-6 text-[#FF5C3A]" /></div>
                 <div>
                   <h3 className="text-xl font-black italic uppercase text-[var(--text-primary)] tracking-tighter">Atmósfera Visual</h3>
                   <p className="text-[10px] text-[var(--text-secondary)] uppercase font-black tracking-[0.2em] opacity-60">Plantilla, colores y apariencia</p>
                 </div>
               </div>

               <div className="space-y-12 pt-6 relative z-10">
                 <div className="space-y-6">
                    <label className={labelStyle}>Plantilla de Interfaz</label>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                       {TEMPLATES.map((tpl) => {
                         const locked = tpl.proOnly && !isPro;
                         const active = formData.widgetTemplate === tpl.id;
                         return (
                           <button 
                             key={tpl.id}
                             onClick={() => !locked && setFormData(p => ({ ...p, widgetTemplate: tpl.id }))}
                             className={`p-4 rounded-[2.5rem] border transition-all relative group/tpl ${active ? 'border-[#FF5C3A] bg-[#FF5C3A]/5 shadow-4xl scale-105' : 'border-[var(--border-color)] bg-[var(--bg-input)] hover:border-[#FF5C3A]/30'} ${locked ? 'opacity-40 cursor-not-allowed' : ''}`}
                           >
                             <div className="aspect-[4/3] mb-4"><LayoutPreview layout={tpl.layout} primary={tpl.defaultPrimary} secondary={tpl.defaultSecondary} /></div>
                             <div className="text-left px-2">
                                <p className={`text-[10px] font-black uppercase tracking-tighter truncate ${active ? 'text-[#FF5C3A]' : 'text-[var(--text-primary)]'}`}>{tpl.name}</p>
                                <p className="text-[8px] font-black uppercase tracking-widest text-[var(--text-muted)] opacity-50 mt-1 truncate">{tpl.layout}</p>
                             </div>
                             {locked && <div className="absolute top-5 right-5 bg-black/80 backdrop-blur text-white p-2 rounded-xl"><Lock size={12} /></div>}
                             {active && !locked && <div className="absolute top-5 right-5 bg-[#FF5C3A] text-white p-2 rounded-xl shadow-lg border border-white/20"><Check size={12} strokeWidth={4} /></div>}
                           </button>
                         );
                       })}
                    </div>
                 </div>

                 <div className="grid grid-cols-1 md:grid-cols-2 gap-12 pt-10 border-t border-[var(--border-color)]">
                    <div className="space-y-6">
                       <label className={labelStyle}>Vibración Primaria (Accent)</label>
                       <div className="flex gap-4 flex-wrap">
                          {COLOR_PRESETS.map(c => (
                            <button key={c} onClick={() => setFormData(p => ({ ...p, primaryColor: c }))} className={`w-12 h-12 rounded-2xl border-4 transition-all hover:scale-110 active:scale-95 ${formData.primaryColor === c ? 'border-white ring-8 ring-[#FF5C3A]/20 scale-110 z-10 shadow-4xl' : 'border-transparent opacity-60'}`} style={{ background: c }} />
                          ))}
                          <div className="relative w-12 h-12 rounded-2xl border-2 border-dashed border-[var(--border-color)] overflow-hidden group/cust flex items-center justify-center">
                             <input type="color" value={formData.primaryColor || '#FF5C3A'} onChange={e => setFormData(p => ({ ...p, primaryColor: e.target.value }))} className="absolute inset-0 opacity-0 cursor-pointer z-10" />
                             <Plus className="text-[var(--text-muted)] group-hover/cust:text-[#FF5C3A] transition-colors" size={20} />
                          </div>
                       </div>
                    </div>
                    <div className="space-y-6">
                       <label className={labelStyle}>Atmósfera de Fondo (Canvas)</label>
                       <div className="flex gap-4 flex-wrap">
                          {BG_PRESETS.map(c => (
                            <button key={c} onClick={() => setFormData(p => ({ ...p, secondaryColor: c }))} className={`w-12 h-12 rounded-2xl border-2 transition-all hover:scale-110 active:scale-95 ${formData.secondaryColor === c ? 'border-[#FF5C3A] ring-4 ring-[#FF5C3A]/20 scale-110 z-10 shadow-2xl' : 'border-[var(--border-color)]'}`} style={{ background: c }} />
                          ))}
                       </div>
                    </div>
                 </div>
               </div>

               <div className="pt-10 flex justify-end relative z-10 border-t border-[var(--border-color)]">
                 <button onClick={handleSubmit} className="px-12 py-5 bg-[#FF5C3A] text-white rounded-[2rem] font-[950] italic uppercase tracking-widest shadow-4xl shadow-[#FF5C3A]/30 hover:scale-105 active:scale-95 transition-all flex items-center gap-3">
                   {isSubmitting ? <Zap className="w-5 h-5 animate-pulse" /> : <Sparkles className="w-5 h-5" />}
                   Sellar Estética
                 </button>
               </div>
             </motion.section>
           )}

           {activeTab === 'pro' && (
             <motion.section key="pro" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} className={sectionStyle}>
               <div className="absolute top-0 right-0 p-8 opacity-5"><Sparkles size={120} /></div>
               <div className="flex items-center gap-4 relative z-10 border-b border-[var(--border-color)] pb-6">
                 <div className="w-12 h-12 rounded-2xl bg-[var(--bg-base)] flex items-center justify-center border border-[var(--border-color)] shadow-inner"><Sparkles className="w-6 h-6 text-[#FF5C3A]" /></div>
                 <div>
                   <h3 className="text-xl font-black italic uppercase text-[var(--text-primary)] tracking-tighter">Lookitry Pro</h3>
                   <p className="text-[10px] text-[var(--text-secondary)] uppercase font-black tracking-[0.2em] opacity-60">Control Total y Personalización</p>
                 </div>
               </div>

               {!isPro ? (
                 <div className="pt-8 space-y-10 relative z-10">
                    <div className="p-12 rounded-[4rem] bg-gradient-to-br from-zinc-900 to-black text-white relative overflow-hidden shadow-4xl border border-white/5 group">
                       <div className="absolute top-0 right-0 p-12 opacity-10 group-hover:scale-110 transition-transform duration-1000"><Zap size={250} strokeWidth={4} className="text-[#FF5C3A]" /></div>
                       <div className="relative z-10 space-y-10">
                          <div className="space-y-4">
                            <h4 className="text-4xl font-[950] italic uppercase tracking-tighter leading-none">Domina cada <br /><span className="text-[#FF5C3A]">Píxel de tu Marca.</span></h4>
                            <p className="text-[10px] font-black uppercase tracking-[0.3em] opacity-40">Evolución genética para marcas de alto impacto</p>
                          </div>
                          <ul className="space-y-5">
                             {[
                               'Slug de URL personalizado (/marca/tu-nombre)',
                               'Mensajes de bienvenida editoriales custom',
                               'Llamadas a la acción (CTA) 100% dinámicos',
                               'Templates Side Panel y Bold Impact desbloqueados',
                               'Prioridad máxima en el motor de IA (Zero Wait)',
                               'Hasta 15 productos activos en catálogo'
                             ].map((f, i) => (
                               <li key={i} className="flex items-center gap-4 text-[10px] font-black uppercase tracking-tight opacity-80 leading-relaxed">
                                  <div className="w-6 h-6 rounded-full bg-[#FF5C3A]/20 flex items-center justify-center shrink-0 border border-[#FF5C3A]/30">
                                     <Check className="w-3 h-3 text-[#FF5C3A]" strokeWidth={5} />
                                  </div>
                                  {f}
                               </li>
                             ))}
                          </ul>
                          <button onClick={() => window.location.href='/dashboard/subscription'} className="w-full py-7 bg-[#FF5C3A] text-white rounded-[2.5rem] font-[950] uppercase tracking-[0.2em] text-[11px] shadow-[0_25px_50px_rgba(255,92,58,0.4)] hover:scale-[1.02] transition-all active:scale-95 border-t border-white/20">Activar Potencial Pro</button>
                       </div>
                    </div>
                 </div>
               ) : (
                 <div className="pt-10 space-y-10 relative z-10">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                      <div className="space-y-3">
                         <label className={labelStyle}>Texto del Botón (CTA)</label>
                         <div className="relative">
                            <Smartphone className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
                            <input type="text" name="buttonText" value={formData.buttonText || ''} onChange={handleChange} className={`${inputStyle} pl-14 font-black italic uppercase tracking-widest`} placeholder="Probarme esto" />
                         </div>
                      </div>
                      <div className="space-y-3">
                         <label className={labelStyle}>Mensaje de Entrada (Welcome)</label>
                         <input type="text" name="welcomeMessage" value={formData.welcomeMessage || ''} onChange={handleChange} className={inputStyle} placeholder="¡Bienvenido a nuestro probador!" />
                      </div>
                    </div>
                    
                    <div className="p-8 rounded-[3rem] bg-[#FF5C3A]/5 border border-[#FF5C3A]/10 flex items-center justify-between shadow-xl">
                       <div className="flex items-center gap-5">
                          <div className="w-12 h-12 rounded-2xl bg-[#FF5C3A] flex items-center justify-center text-white shadow-lg"><Check size={20} strokeWidth={4} /></div>
                          <div>
                            <p className="text-[11px] font-black uppercase tracking-widest text-[var(--text-primary)] leading-none italic">Sincronización Pro Activa</p>
                            <p className="text-[8px] font-bold text-[var(--text-muted)] uppercase mt-1 opacity-50 tracking-tighter">Tu marca está operando a máxima potencia</p>
                          </div>
                       </div>
                       <button onClick={handleSubmit} className="px-8 py-4 bg-[var(--text-primary)] text-[var(--bg-card)] rounded-2xl text-[10px] font-950 uppercase tracking-[0.2em] hover:scale-105 active:scale-95 transition-all shadow-xl">Guardar</button>
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
