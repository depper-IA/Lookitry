'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/hooks/useAuth';
import { brandsService } from '@/services/brands.service';
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
import { LandingPreview } from './components/LandingPreview';
import { Spinner } from '@/components/ui/Spinner';
import { DesignTab } from './components/DesignTab';
import { DomainTab } from './components/DomainTab';

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
  const [brand, setBrand] = useState<any>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'design' | 'domain'>('design');

  const [landingTemplate, setLandingTemplate] = useState<'classic' | 'editorial' | 'moderno'>('classic');
  const [landingFont, setLandingFont] = useState('font-jakarta');
  const [slogan, setSlogan] = useState('');
  const [description, setDescription] = useState('');
  const [primaryColor, setPrimaryColor] = useState('#FF5C3A');
  const [secondaryColor, setSecondaryColor] = useState('#FF5C3A');
  const [widgetBgColor, setWidgetBgColor] = useState('#0a0a0a');
  const [headerColor, setHeaderColor] = useState('');
  const [coverBgColor, setCoverBgColor] = useState('');
  const [coverOverlayOpacity, setCoverOverlayOpacity] = useState(0.55);
  const [logoUrl, setLogoUrl] = useState('');
  const [logoLightUrl, setLogoLightUrl] = useState('');
  const [logoDarkUrl, setLogoDarkUrl] = useState('');
  const [coverImageUrl, setCoverImageUrl] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [whatsappMessage, setWhatsappMessage] = useState('');
  const [ctaButtonText, setCtaButtonText] = useState('Probarme esto');
  const [instagram, setInstagram] = useState('');
  const [facebook, setFacebook] = useState('');
  const [tiktok, setTiktok] = useState('');
  const [youtube, setYoutube] = useState('');
  const [x, setX] = useState('');
  const [cityDisplay, setCityDisplay] = useState('');
  const [nationalShipping, setNationalShipping] = useState(false);
  const [showBrandName, setShowBrandName] = useState(true);
  const [rating, setRating] = useState('');
  const [totalReviews, setTotalReviews] = useState('');
  const [schedule, setSchedule] = useState<any>({});
  const [customDomain, setCustomDomain] = useState('');
  const [landingSteps, setLandingSteps] = useState<{
    select_label?: string;
    select_desc?: string;
    photo_label?: string;
    photo_desc?: string;
    result_label?: string;
    result_desc?: string;
  } | null>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [brandData, productsData] = await Promise.all([
          brandsService.getCurrentBrand(),
          api.get('/products').then(r => (Array.isArray(r.data) ? r.data : [])).catch(() => [])
        ]);
        
        setBrand(brandData);
        setProducts(productsData);
        
        const b = brandData as any;
        setLandingTemplate(['classic', 'editorial', 'moderno'].includes(b.landing_template) ? b.landing_template : 'classic');
        setLandingFont(b.landing_font || 'font-jakarta');
        setSlogan(b.slogan || '');
        setDescription(b.brand_description || '');
        setPrimaryColor(b.primary_color || '#FF5C3A');
        setSecondaryColor(b.secondary_color || '#FF5C3A');
        setWidgetBgColor(b.widget_bg_color || '#0a0a0a');
        setHeaderColor(b.header_color || '');
        setCoverBgColor(b.cover_bg_color || '');
        setCoverOverlayOpacity(b.cover_overlay_opacity ?? 0.55);
        setLogoUrl(b.logo || '');
        setLogoLightUrl(b.logo_light || '');
        setLogoDarkUrl(b.logo_dark || '');
        setCoverImageUrl(b.cover_image_url || '');
        setWhatsapp(b.whatsapp_contact || '');
        setWhatsappMessage(b.whatsapp_message || '');
        setCtaButtonText(b.cta_button_text || 'Probarme esto');
        setInstagram(b.social_links?.instagram || '');
        setFacebook(b.social_links?.facebook || '');
        setTiktok(b.social_links?.tiktok || '');
        setYoutube(b.social_links?.youtube || '');
        setX(b.social_links?.x || '');
        setCityDisplay(b.city_display || '');
        setNationalShipping(b.national_shipping || false);
        setShowBrandName(b.show_brand_name ?? true);
        setRating(b.rating?.toString() || '');
        setTotalReviews(b.total_reviews?.toString() || '');
        setSchedule(b.schedule || {});
        setLandingSteps(b.landing_steps || null);
        setCustomDomain(b.custom_domain || '');
      } catch (err) {
        setError('No se pudo cargar la información');
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setError('');
    try {
      const social_links = {
        instagram: instagram.trim(),
        facebook: facebook.trim(),
        tiktok: tiktok.trim(),
        youtube: youtube.trim(),
        x: x.trim(),
        _landing_secondary: secondaryColor,
        _landing_primary: primaryColor,
      };

      const payload: any = {
        name: brand?.name,
        slogan: slogan.trim(),
        brand_description: description.trim(),
        whatsapp_contact: whatsapp.trim(),
        whatsapp_message: whatsappMessage.trim(),
        cta_button_text: ctaButtonText.trim(),
        logo: logoUrl || null,
        logo_light: logoLightUrl || null,
        logo_dark: logoDarkUrl || null,
        cover_bg_color: coverBgColor || null,
        cover_image_url: coverImageUrl || null,
        cover_overlay_opacity: coverOverlayOpacity,
        social_links,
        city_display: cityDisplay || null,
        national_shipping: nationalShipping,
        show_brand_name: showBrandName,
        landing_template: landingTemplate,
        landing_font: landingFont,
        widget_bg_color: widgetBgColor,
        rating: rating ? parseFloat(rating) : null,
        total_reviews: totalReviews ? parseInt(totalReviews, 10) : null,
        header_color: headerColor || null,
        landing_steps: landingSteps,
        schedule: Object.fromEntries(Object.entries(schedule).filter(([, v]) => (v as string).trim())),
      };

      if (brand?.plan === 'PRO') {
        payload.custom_domain = customDomain || null;
      }

      await api.patch('/brands/me', payload);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError('Error al guardar los cambios');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="flex items-center justify-center min-h-[60vh]"><Spinner size="lg" /></div>;

  const brandSlug = brand?.slug || authBrand?.slug || '';
  const pageUrl = `${FRONTEND_URL}/sitio/${brandSlug}`;
  
  const tempBrand = {
    ...brand,
    name: brand?.name || authBrand?.name,
    slug: brandSlug,
    landing_template: landingTemplate,
    landing_font: landingFont,
    widget_bg_color: widgetBgColor,
    slogan,
    brand_description: description,
    header_color: headerColor,
    cover_bg_color: coverBgColor,
    cover_overlay_opacity: coverOverlayOpacity,
    logo: logoUrl,
    logo_light: logoLightUrl,
    logo_dark: logoDarkUrl,
    cover_image_url: coverImageUrl,
    whatsapp_contact: whatsapp,
    whatsapp_message: whatsappMessage,
    cta_button_text: ctaButtonText,
    social_links: {
      instagram,
      facebook,
      tiktok,
      youtube,
      x,
      _landing_primary: primaryColor,
      _landing_secondary: secondaryColor,
    },
    city_display: cityDisplay,
    national_shipping: nationalShipping,
    show_brand_name: showBrandName,
    rating: rating ? parseFloat(rating) : null,
    total_reviews: totalReviews ? parseInt(totalReviews, 10) : null,
    schedule,
    primary_color: primaryColor,
    secondary_color: secondaryColor,
    landing_steps: landingSteps,
  };

  const previewProps = {
    brand: tempBrand,
    products
  };

  return (
    <motion.div 
      initial="hidden" animate="visible" variants={containerVariants}
      className="max-w-[1600px] mx-auto px-4 sm:px-6 xl:px-8 py-6 xl:py-8 pb-24"
    >
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 xl:gap-8 items-start">
        
        {/* PANEL DE EDICIÓN */}
        <div className="lg:col-span-8 xl:col-span-7 space-y-6 xl:space-y-8 min-w-0">
          <motion.header variants={itemVariants} className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
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

          {/* ══ BONUS MARKETING ══ */}
          <motion.div variants={itemVariants} className="p-5 xl:p-6 rounded-3xl bg-[var(--bg-card)] border border-[var(--border-color)] shadow-xl shadow-black/5 relative overflow-hidden group/bonus">
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
            {!brand?.has_landing_page && (
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

          <motion.div variants={itemVariants} className="flex flex-wrap gap-2 p-1.5 bg-[var(--bg-card)] rounded-[1.75rem] border border-[var(--border-color)] w-full md:w-fit shadow-xl">
            {( [
              { id: 'design', label: 'Diseño y estilo', icon: <Layout size={18} /> },
              { id: 'domain', label: 'Dominio y enlace', icon: <Globe size={18} /> },
            ] as const).map(tab => (
              <button 
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)} 
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
                <section className="bg-[var(--bg-card)] rounded-3xl border border-[var(--border-color)] p-5 md:p-6 shadow-xl shadow-black/5 relative overflow-hidden group/templates">
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
                        onClick={() => setLandingTemplate(t.id as any)}
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

                {/* 2. CONFIGURACIÓN DETALLADA (DesignTab) */}
                <div className="relative">
                  <DesignTab
                    {...{
                      description, setDescription, slogan, setSlogan,
                      whatsapp, setWhatsapp, whatsappMessage, setWhatsappMessage,
                      ctaButtonText, setCtaButtonText, coverImageUrl, setCoverImageUrl,
                      logoUrl, setLogoUrl, logoLightUrl, setLogoLightUrl,
                      logoDarkUrl, setLogoDarkUrl, coverBgColor, setCoverBgColor,
                      coverOverlayOpacity, setCoverOverlayOpacity, headerColor, setHeaderColor,
                      instagram, setInstagram, facebook, setFacebook, tiktok, setTiktok,
                      youtube, setYoutube, x, setX,
                      cityDisplay, setCityDisplay, nationalShipping, setNationalShipping,
                      showBrandName, setShowBrandName,
                      primaryColor, setPrimaryColor, secondaryColor, setSecondaryColor, widgetBgColor, setWidgetBgColor, landingFont, setLandingFont,
                      rating, setRating, totalReviews, setTotalReviews,
                      schedule, setSchedule,
                      landingSteps, setLandingSteps,
                    }}
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

        {/* PREVIEW STICKY (Visualización Full-Width v2) */}
        <div className="hidden lg:flex lg:col-span-4 xl:col-span-5 sticky top-8 z-40 h-[640px] items-start justify-center">
           <div className="h-full w-full bg-white rounded-3xl border border-[var(--border-color)] overflow-hidden shadow-2xl shadow-black/5 flex flex-col group/preview relative">
              
              {/* Browser Bar (Full Width) */}
              <div className="h-16 border-b border-[var(--border-color)] bg-[var(--bg-card)] flex items-center px-8 gap-6">
                 <div className="flex gap-2">
                    <div className="w-3 h-3 rounded-full bg-[#ff5f57] border border-black/5" />
                    <div className="w-3 h-3 rounded-full bg-[#febc2e] border border-black/5" />
                    <div className="w-3 h-3 rounded-full bg-[#28c840] border border-black/5" />
                 </div>
                 <div className="flex-1 bg-[var(--bg-input)] h-10 rounded-2xl border border-[var(--border-color)] flex items-center px-6 overflow-hidden">
                    <Globe size={14} className="text-[var(--text-muted)] mr-3 shrink-0" />
                    <span className="text-[11px] text-[var(--text-muted)] truncate font-mono tracking-tight">{brandSlug}.lookitry.com</span>
                 </div>
              </div>

               {/* Main Preview Area - Cubriendo todo de izquierda a derecha */}
               <div className="flex-1 bg-white overflow-y-auto custom-scrollbar relative">
                  <LandingPreview {...previewProps} brandSlug={brandSlug} isPreview={true} />
               </div>

               {/* Status Bar */}
               <div className="p-6 bg-[var(--bg-card)] border-t border-[var(--border-color)] flex items-center justify-center">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest leading-none">Vista previa en vivo</span>
                  </div>
               </div>
            </div>
         </div>
        </div>
      </motion.div>
  );
}


