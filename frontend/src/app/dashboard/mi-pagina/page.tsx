'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/hooks/useAuth';
import { api } from '@/services/api';
import {
  Globe,
  ExternalLink,
  Check,
  Save,
  Monitor,
  Layout,
  ShieldCheck,
  Zap,
} from 'lucide-react';
import { Spinner } from '@/components/ui/Spinner';
import { DesignTab } from './components/DesignTab';
import { DomainTab } from './components/DomainTab';
import { useLandingEditor } from './hooks/useLandingEditor';
import type { Brand } from '@/types';

const FRONTEND_URL = typeof window !== 'undefined' ? window.location.origin : (process.env.NEXT_PUBLIC_APP_URL || '');

function TemplateWireframe({ type, active }: { type: string; active: boolean }) {
  const accent = active ? '#FF5C3A' : '#444';

  return (
    <div className="w-full h-full p-6 flex flex-col gap-3 relative overflow-hidden group">
      {type === 'classic' && (
        <>
          <div className="w-1/3 h-1.5 rounded-full mx-auto" style={{ background: accent, opacity: 0.3 }} />
          <div className="w-full h-24 rounded-2xl bg-white/5 border border-white/10 flex flex-col items-center justify-center gap-3">
            <div className="w-1/2 h-2 rounded-full bg-white/10" />
            <div className="w-1/4 h-2 rounded-full bg-white/5" />
          </div>
          <div className="grid grid-cols-2 gap-3 flex-1 pb-2">
            <div className="rounded-xl bg-white/5 border border-white/10 h-full" />
            <div className="rounded-xl bg-white/5 border border-white/10 h-full" />
          </div>
        </>
      )}
      {type === 'editorial' && (
        <div className="flex gap-4 h-full">
          <div className="flex-1 flex flex-col gap-3 py-2">
            <div className="w-full h-3 rounded-md bg-white/10" />
            <div className="w-full h-3 rounded-md bg-white/10" />
            <div className="w-2/3 h-3 rounded-md bg-white/5" />
            <div className="mt-auto w-full h-10 rounded-2xl" style={{ background: accent, opacity: 0.2 }} />
          </div>
          <div className="w-1/2 h-full rounded-2xl bg-white/5 border border-white/10 relative overflow-hidden">
             <div className="absolute top-4 -left-2 w-full h-1/2 rounded-xl bg-white/10 border border-white/20 shadow-2xl" />
          </div>
        </div>
      )}
      {type === 'moderno' && (
        <div className="h-full flex flex-col justify-between py-2">
          <div className="w-full h-2/5 rounded-[2rem] bg-gradient-to-br from-white/10 to-transparent border border-white/10 flex items-center justify-center">
            <div className="w-12 h-12 rounded-full border-4 border-white/20" />
          </div>
          <div className="space-y-3 px-1">
            <div className="w-full h-4 rounded-full" style={{ background: accent, opacity: 0.15 }} />
            <div className="w-3/4 h-2 rounded-full bg-white/10" />
          </div>
          <div className="w-full h-12 rounded-2xl mt-4 flex items-center justify-center" style={{ background: accent }}>
             <div className="w-1/3 h-1 rounded-full bg-white/30" />
          </div>
        </div>
      )}
    </div>
  );
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { duration: 0.5, staggerChildren: 0.08 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: "spring" as const, stiffness: 100 }
  }
};

const landingTemplates = [
  {
    id: 'classic',
    name: 'Classic',
    description: 'Hero claro, lectura rapida y estructura comercial.',
    tone: 'Balanceado',
  },
  {
    id: 'editorial',
    name: 'Editorial',
    description: 'Composicion mas visual para marcas con imagen fuerte.',
    tone: 'Narrativo',
  },
  {
    id: 'moderno',
    name: 'Moderno',
    description: 'Presentacion sobria con acentos oscuros y tecnologia.',
    tone: 'Minimal',
  },
] as const;

export default function MiPaginaPage() {
  const { brand: authBrand } = useAuth();
  const [brand, setBrand] = useState<Brand | null>(null);
  const [products, setProducts] = useState<unknown[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'design' | 'domain'>('design');
  const [landingTemplate, setLandingTemplate] = useState<'classic' | 'editorial' | 'moderno'>('classic');
  const [customDomain, setCustomDomain] = useState('');

  // ─── Landing Editor Hook ──────────────────────────────────────────────────
  const editor = useLandingEditor();
  const [editorState, editorActions] = editor;

  const brandSlug = (brand?.slug as string) || (authBrand?.slug as string) || '';
  const brandName = (brand?.name as string) || (authBrand?.name as string) || '';
  const pageUrl = `${FRONTEND_URL}/sitio/${brandSlug}`;

  // Load brand data and populate the editor state
  useEffect(() => {
    async function loadBrand() {
      if (!authBrand?.id) return;
      setLoading(true);
      try {
        const [brandRes, productsRes] = await Promise.all([
          api.get<Record<string, unknown>>(`/brands/me`),
          api.get<unknown[]>('/products'),
        ]);
        // Cast API response to Brand type (API uses snake_case, frontend uses camelCase)
        setBrand(brandRes.data as unknown as Brand);
        // Ensure products is always an array
        const rawProducts = productsRes.data;
        setProducts(Array.isArray(rawProducts) ? rawProducts : []);

        // Populate editor state from brand data
        const b = brandRes.data;
        const sl = (b.social_links as Record<string, unknown>) || {};

        editorActions.updateField('logoUrl', (b.logo as string) || '');
        editorActions.updateField('logoLightUrl', (b.logo_light as string) || '');
        editorActions.updateField('logoDarkUrl', (b.logo_dark as string) || '');
        editorActions.updateField('landingFont', (b.landing_font as string) || 'font-jakarta');
        editorActions.updateField('showBrandName', (b.show_brand_name as boolean) ?? true);
        editorActions.updateField('primaryColor', (b.primary_color as string) || '#FF5C3A');
        editorActions.updateField('secondaryColor', (b.secondary_color as string) || '#FF5C3A');
        editorActions.updateField('widgetBgColor', (b.widget_bg_color as string) || '#0a0a0a');
        editorActions.updateField('coverBgColor', (b.cover_bg_color as string) || '');
        editorActions.updateField('coverOverlayOpacity', (b.cover_overlay_opacity as number) ?? 0.55);
        editorActions.updateField('headerColor', (b.header_color as string) || '');
        editorActions.updateField('coverImageUrl', (b.cover_image_url as string) || '');
        editorActions.updateField('description', (b.brand_description as string) || '');
        editorActions.updateField('slogan', (b.slogan as string) || '');
        editorActions.updateField('ctaButtonText', (b.cta_button_text as string) || 'Pruébalo ahora');
        editorActions.updateField('whatsapp', (b.whatsapp_contact as string) || '');
        editorActions.updateField('whatsappMessage', (b.whatsapp_message as string) || '');
        editorActions.updateField('instagram', (sl.instagram as string) || '');
        editorActions.updateField('facebook', (sl.facebook as string) || '');
        editorActions.updateField('tiktok', (sl.tiktok as string) || '');
        editorActions.updateField('youtube', (sl.youtube as string) || '');
        editorActions.updateField('x', (sl.x as string) || '');
        editorActions.updateField('cityDisplay', (b.city_display as string) || '');
        editorActions.updateField('nationalShipping', (b.national_shipping as boolean) ?? false);
        editorActions.updateField('rating', String(b.rating ?? ''));
        editorActions.updateField('totalReviews', String(b.total_reviews ?? ''));
        editorActions.updateSchedule((b.schedule as Record<string, string>) || {});
        setLandingTemplate((b.landing_template as 'classic' | 'editorial' | 'moderno') || 'classic');
        setCustomDomain((b.custom_domain as string) || '');
      } catch {
        setError('Error al cargar los datos');
      } finally {
        setLoading(false);
      }
    }
    loadBrand();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authBrand?.id]);

  const handleSave = async () => {
    setSaving(true);
    setError('');
    try {
      const sl = {
        instagram: (editorState.instagram || '').trim(),
        facebook: (editorState.facebook || '').trim(),
        tiktok: (editorState.tiktok || '').trim(),
        youtube: (editorState.youtube || '').trim(),
        x: (editorState.x || '').trim(),
        _landing_secondary: editorState.secondaryColor,
        _landing_primary: editorState.primaryColor,
      };

      const payload = {
        name: brand?.name,
        slogan: editorState.slogan.trim(),
        brand_description: editorState.description.trim(),
        whatsapp_contact: editorState.whatsapp.trim(),
        whatsapp_message: editorState.whatsappMessage.trim(),
        cta_button_text: editorState.ctaButtonText.trim(),
        logo: editorState.logoUrl || null,
        logo_light: editorState.logoLightUrl || null,
        logo_dark: editorState.logoDarkUrl || null,
        cover_bg_color: editorState.coverBgColor || null,
        cover_image_url: editorState.coverImageUrl || null,
        cover_overlay_opacity: editorState.coverOverlayOpacity,
        social_links: sl,
        city_display: editorState.cityDisplay || null,
        national_shipping: editorState.nationalShipping,
        show_brand_name: editorState.showBrandName,
        landing_template: landingTemplate,
        landing_font: editorState.landingFont,
        widget_bg_color: editorState.widgetBgColor,
        rating: editorState.rating ? parseFloat(editorState.rating) : null,
        total_reviews: editorState.totalReviews ? parseInt(editorState.totalReviews, 10) : null,
        header_color: editorState.headerColor || null,
        schedule: Object.fromEntries(
          Object.entries(editorState.schedule).filter(([, v]) => (v as string).trim())
        ),
      };

      if (brand?.plan === 'PRO') {
        // eslint-disable-next-line
        (payload as any).custom_domain = customDomain || null;
      }

      await api.patch('/brands/me', payload);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch {
      setError('Error al guardar los cambios');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <motion.div
      initial="hidden" animate="visible" variants={containerVariants}
      className="max-w-[1600px] mx-auto px-4 sm:px-6 xl:px-8 py-6 xl:py-8 pb-24"
    >
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 xl:gap-8 items-start min-h-[800px]">

        {/* PANEL DE EDICIÓN */}
        <div className="space-y-6 xl:space-y-8 min-w-0">
          <motion.header variants={itemVariants} className="glass-panel-dark p-6 xl:p-8 rounded-3xl flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
            <div className="space-y-2">
              <h1 className="text-4xl font-bold text-[var(--text-primary)] tracking-tight font-jakarta">Editor de página</h1>
              <p className="text-sm text-[var(--text-secondary)] font-bold tracking-wider opacity-60 uppercase">Personaliza tu mini-landing premium</p>
            </div>

            <div className="flex items-center gap-4">
               <a href={pageUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 px-6 py-3 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl text-xs font-bold uppercase tracking-widest text-[var(--text-primary)] hover:border-[#FF5C3A] hover:text-[#FF5C3A] transition-all shadow-xl group/link">
                 Ver mi sitio <ExternalLink size={14} className="group-hover:rotate-12 transition-transform" />
               </a>
            </div>
          </motion.header>

          {/* BONUS MARKETING */}
          <motion.div variants={itemVariants} className="p-5 xl:p-6 rounded-3xl glass-panel-dark relative overflow-hidden group/bonus">
             <div className="absolute top-0 right-0 p-6 opacity-[0.04] group-hover:scale-110 transition-transform duration-1000">
                <ShieldCheck size={82} />
             </div>
             <div className="flex flex-col md:flex-row md:items-center justify-between gap-5 relative z-10">
                <div className="space-y-2 text-left">
                   <h3 className="text-2xl font-bold text-[var(--text-primary)] tracking-tight font-jakarta">¿Buscas algo más potente?</h3>
                   <p className="text-sm text-[var(--text-secondary)] max-w-xl leading-6">
                      Escala tu negocio a una <span className="text-[#FF5C3A] font-bold">tienda profesional</span> con WooCommerce y domina el mercado.
                   </p>
                </div>

                <Link
                  href="/dashboard/tienda-profesional"
                  className="px-5 py-3 bg-white text-black rounded-2xl font-bold uppercase tracking-widest text-[10px] shadow-xl hover:scale-105 active:scale-95 transition-all whitespace-nowrap"
                >
                  Ver opciones
                </Link>
             </div>
          </motion.div>

          <AnimatePresence>
            {!(brand?.has_landing_page) && (
              <motion.div
                variants={itemVariants}
                className="p-8 rounded-3xl border-2 border-dashed border-[#FF5C3A]/20 bg-[#FF5C3A]/5 flex flex-col lg:flex-row items-center justify-between gap-8 relative overflow-hidden group/unlock"
              >
                <div className="flex items-center gap-6 relative z-10 text-center md:text-left">
                  <div className="w-16 h-16 rounded-2xl bg-[#FF5C3A] text-white flex items-center justify-center shadow-lg shadow-[#FF5C3A]/20 transform group-hover/unlock:rotate-12 transition-transform duration-500">
                    <Zap className="w-8 h-8 fill-current" />
                  </div>
                  <div>
                    <p className="text-lg font-bold text-[var(--text-primary)] leading-none">Módulo de sitio desactivado</p>
                    <p className="text-[11px] text-[var(--text-secondary)] font-bold uppercase tracking-widest mt-2 opacity-60">Adquiere tu mini-landing hoy mismo</p>
                  </div>
                </div>
                <Link href="/dashboard/checkout-landing" className="px-10 py-5 bg-[#FF5C3A] text-white text-xs font-bold uppercase tracking-[0.2em] rounded-2xl hover:scale-105 active:scale-95 transition-all shadow-xl shadow-[#FF5C3A]/20 relative z-10">
                  Desbloquear ahora
                </Link>
                <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none group-hover/unlock:scale-150 transition-transform duration-1000">
                  <ShieldCheck size={120} />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Tab Switcher */}
          <motion.div variants={itemVariants} className="flex flex-wrap gap-2 p-1.5 glass-panel-dark rounded-[1.75rem] w-full md:w-fit shadow-xl">
            {([
              { id: 'design', label: 'Diseño y estilo', icon: <Layout size={18} /> },
              { id: 'domain', label: 'Dominio y enlace', icon: <Globe size={18} /> },
            ] as const).map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as 'design' | 'domain')}
                className={`flex flex-1 md:flex-none items-center justify-center gap-3 px-5 xl:px-6 py-3 text-[11px] font-bold uppercase tracking-widest transition-all rounded-[1.3rem] relative overflow-hidden group/tab ${activeTab === tab.id ? 'bg-[#FF5C3A] text-white shadow-xl shadow-[#FF5C3A]/10' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)]'}`}
              >
                <span className="relative z-10 flex items-center gap-3">
                   {tab.icon}
                   {tab.label}
                </span>
                {activeTab === tab.id && (
                   <motion.div layoutId="tabGlow" className="absolute inset-0 bg-white/10 blur-xl" />
                )}
              </button>
            ))}
          </motion.div>

          <div className={activeTab === 'design' ? 'block' : 'hidden'}>
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-8 xl:space-y-10">

                {/* 1. SELECCIÓN DE PLANTILLA */}
                <section className="glass-panel-dark p-5 md:p-6 rounded-3xl relative overflow-hidden group/templates">
                  <div className="flex flex-col gap-5 border-b border-[var(--border-color)] pb-5 mb-5 xl:flex-row xl:items-end xl:justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-black flex items-center justify-center">
                       <Monitor className="text-white" size={20} />
                      </div>
                      <div>
                       <h3 className="text-xl font-bold text-[var(--text-primary)] tracking-tight font-jakarta">Plantillas disponibles</h3>
                       <p className="text-[10px] text-[var(--text-secondary)] font-bold uppercase tracking-widest mt-1 opacity-60">Selecciona el estilo de tu página</p>
                      </div>
                    </div>
                    <div className="inline-flex items-center rounded-full border border-[var(--border-color)] bg-[var(--bg-input)] px-4 py-2 text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--text-muted)]">
                      3 estilos listos
                    </div>
                  </div>

                  <div className="grid grid-cols-1 xl:grid-cols-3 gap-3 xl:gap-4">
                    {landingTemplates.map(t => (
                      <button
                        key={t.id}
                        onClick={() => setLandingTemplate(t.id as 'classic' | 'editorial' | 'moderno')}
                        className={`relative rounded-[1.75rem] border text-left transition-all group/card active:scale-[0.98] ${landingTemplate === t.id ? 'border-[#FF5C3A] bg-[#FF5C3A]/5 shadow-lg shadow-[#FF5C3A]/10' : 'border-[var(--border-color)] bg-[var(--bg-input)] hover:border-[#FF5C3A]/30 hover:bg-white'}`}
                      >
                         <div className="flex h-full flex-col gap-4 p-4">
                            <div className="aspect-[16/11] rounded-[1.35rem] overflow-hidden border border-[var(--border-color)] bg-black shadow-inner">
                               <TemplateWireframe type={t.id} active={landingTemplate === t.id} />
                            </div>
                            <div className="space-y-3">
                              <div className="flex items-center justify-between gap-3">
                                <div>
                                  <h4 className={`text-sm font-bold font-jakarta ${landingTemplate === t.id ? 'text-[#FF5C3A]' : 'text-[var(--text-primary)]'}`}>{t.name}</h4>
                                  <p className="mt-1 text-xs font-semibold text-[var(--text-muted)]">{t.tone}</p>
                                </div>
                                {landingTemplate === t.id && (
                                  <span className="inline-flex items-center rounded-full bg-[#FF5C3A] px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-white">
                                    Activa
                                  </span>
                                )}
                              </div>
                              <p className="min-h-[2.75rem] text-sm leading-5 text-[var(--text-secondary)]">
                                {t.description}
                              </p>
                            </div>
                         </div>
                      </button>
                    ))}
                  </div>
                </section>

                {/* 2. CONFIGURACIÓN DETALLADA */}
                <div className="relative">
                  <DesignTab
                    editor={editor}
                    brandSlug={brandSlug}
                    brandName={brandName}
                    products={products}
                  />
                </div>
            </motion.div>
          </div>

          <div className={activeTab === 'domain' ? 'block' : 'hidden'}>
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-8 xl:space-y-10">
              <DomainTab {...{ customDomain, setCustomDomain, brand, saving, handleSave, FRONTEND_URL }} />
            </motion.div>
          </div>

          <footer className="pt-16 pb-20 border-t-2 border-[var(--border-color)] border-dashed">
            <button
               onClick={handleSave} disabled={saving}
               className="w-full md:w-auto px-10 py-4 bg-[#FF5C3A] text-white rounded-2xl text-sm font-bold uppercase tracking-[0.2em] shadow-xl shadow-[#FF5C3A]/20 hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-50 group/save mx-auto flex items-center justify-center gap-4"
            >
               {saving ? <Spinner size="sm" /> : <Save size={20} className="group-hover:scale-125 transition-transform" />}
               {saving ? 'Guardando...' : 'Guardar cambios'}
            </button>
            <AnimatePresence>
               {success && (
                 <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="bg-emerald-500/10 border border-emerald-500/20 p-4 rounded-xl mt-6 flex items-center justify-center gap-3">
                    <Check className="text-emerald-500 font-bold" size={16} />
                    <span className="text-emerald-500 text-[10px] font-bold uppercase tracking-widest leading-none">Cambios guardados correctamente</span>
                 </motion.div>
               )}
            </AnimatePresence>
          </footer>
        </div>
      </div>
    </motion.div>
  );
}
