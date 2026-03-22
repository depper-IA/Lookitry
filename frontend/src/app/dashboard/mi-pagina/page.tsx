'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { brandsService } from '@/services/brands.service';
import { api } from '@/services/api';
import { 
  Globe, 
  Image as ImageIcon, 
  Palette, 
  MessageSquare, 
  ChevronRight, 
  Smartphone, 
  Layout,
  ExternalLink,
  Check,
  Save,
  AlertCircle
} from 'lucide-react';
import { LandingPreview } from './components/LandingPreview';
import { Spinner } from '@/components/ui/Spinner';
import { DesignTab } from './components/DesignTab';
import { DomainTab } from './components/DomainTab';

const FRONTEND_URL = typeof window !== 'undefined' ? window.location.origin : (process.env.NEXT_PUBLIC_FRONTEND_URL || 'https://pruebalo.wilkiedevs.com');

export default function MiPaginaPage() {
  const { brand: authBrand } = useAuth();
  const [brand, setBrand] = useState<any>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'design' | 'domain'>('design');

  // Estados locales para edición
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

  useEffect(() => {
    const loadData = async () => {
      try {
        const [brandData, productsData] = await Promise.all([
          brandsService.getCurrentBrand(),
          api.get('/products').then(r => (r.data || []) as any[]).catch(() => [] as any[])
        ]);
        
        setBrand(brandData);
        setProducts(productsData);
        
        const b = brandData as any;
        // Cargar estados locales
        setLandingTemplate(b.landing_template || 'classic');
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
        setCustomDomain(b.custom_domain || '');
      } catch (err) {
        console.error('Error al cargar datos:', err);
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

  if (loading) return <div className="flex items-center justify-center py-24"><Spinner size="lg" /></div>;

  const brandSlug = brand?.slug || authBrand?.slug || '';
  const pageUrl = `${FRONTEND_URL}/sitio/${brandSlug}`;
  
  // OBJETO DE MARCA TEMPORAL PARA PREVIEW REAL
  const tempBrand = {
    ...brand,
    landing_template: landingTemplate,
    landing_font: landingFont,
    widget_bg_color: widgetBgColor,
    slogan,
    brand_description: description,
    // primary_color removed from landing payload
    // secondary_color removed from landing payload
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
    social_links: { instagram, facebook, tiktok, youtube, x },
    city_display: cityDisplay,
    national_shipping: nationalShipping,
    show_brand_name: showBrandName,
    rating: rating ? parseFloat(rating) : null,
    total_reviews: totalReviews ? parseInt(totalReviews, 10) : null,
    schedule
  };

  const previewProps = {
    brand: tempBrand,
    products,
    brandSlug
  };

  return (
    <div className="max-w-[1600px] mx-auto px-4 sm:px-8 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* PANEL DE EDICIÓN (Columna Izquierda) */}
        <div className="lg:col-span-7 xl:col-span-7 space-y-6">
          <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-[var(--text-primary)] italic uppercase">Mi Página Pública</h1>
              <p className="text-sm text-[var(--text-secondary)] mt-1 flex items-center gap-2 font-medium">
                Configura tu vitrina digital personalizada
                <a href={pageUrl} target="_blank" rel="noopener noreferrer" className="text-[#FF5C3A] hover:underline flex items-center gap-1 font-bold">
                  Ver sitio real <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </p>
            </div>
          </header>

          {/* Banner de estado (Trial) */}
          {!brand?.has_landing_page && (
            <div className="p-5 rounded-[2rem] border border-[#FF5C3A]/20 bg-[#FF5C3A]/5 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-[#FF5C3A]/10 flex items-center justify-center shrink-0">
                  <Globe className="w-6 h-6 text-[#FF5C3A]" />
                </div>
                <div>
                  <p className="text-sm font-black text-[var(--text-primary)] uppercase tracking-tight italic">Modo Previsualización</p>
                  <p className="text-xs text-[var(--text-secondary)] mt-0.5 font-medium leading-relaxed max-w-md">Tu página no es pública aún. Los cambios que realices aquí se verán reflejados una vez actives tu mini-landing.</p>
                </div>
              </div>
              <Link href="/dashboard/checkout-landing" className="px-6 py-2.5 bg-[#FF5C3A] text-white text-[10px] font-black uppercase rounded-xl hover:brightness-110 transition-all shadow-lg whitespace-nowrap">Activar ahora</Link>
            </div>
          )}

          {/* Tabs Navegación */}
          <div className="flex gap-4 p-1.5 bg-[var(--bg-card)] rounded-2xl border border-[var(--border-color)] w-fit">
            <button 
              onClick={() => setActiveTab('design')} 
              className={`px-6 py-2.5 text-xs font-black uppercase tracking-widest transition-all rounded-xl ${activeTab === 'design' ? 'bg-[#FF5C3A] text-white shadow-lg' : 'text-gray-500 hover:text-gray-300'}`}
            >
              Diseño Visual
            </button>
            <button 
              onClick={() => setActiveTab('domain')} 
              className={`px-6 py-2.5 text-xs font-black uppercase tracking-widest transition-all rounded-xl ${activeTab === 'domain' ? 'bg-[#FF5C3A] text-white shadow-lg' : 'text-gray-500 hover:text-gray-300'}`}
            >
              Identidad Digital
            </button>
          </div>

          <div className="space-y-8">
            {activeTab === 'design' ? (
              <div className="space-y-8 animate-in fade-in slide-in-from-left-4 duration-500">
                {/* Selector de Plantilla */}
                <section className="p-8 bg-[var(--bg-card)] rounded-[2.5rem] border border-[var(--border-color)] space-y-6">
                  <div className="flex items-center gap-3 border-b border-[var(--border-color)] pb-5">
                    <div className="w-10 h-10 rounded-2xl bg-[#FF5C3A]/10 flex items-center justify-center">
                      <Layout className="w-5 h-5 text-[#FF5C3A]" />
                    </div>
                    <h3 className="text-base font-bold text-[var(--text-primary)] italic uppercase tracking-tight">Selecciona tu Plantilla</h3>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                    {[
                      { 
                        id: 'classic', 
                        name: 'Clásico', 
                        desc: 'Institucional',
                        visual: (active: boolean) => (
                          <div className={`w-full aspect-[16/10] rounded-xl border-2 mb-3 overflow-hidden flex flex-col transition-all ${active ? 'border-[#FF5C3A] bg-[#FF5C3A]/5' : 'border-[var(--border-color)] bg-[var(--bg-base)]'}`}>
                            {/* Header */}
                            <div className="h-2 border-b border-[var(--border-color)] bg-[var(--bg-card)] flex items-center px-2 justify-between">
                              <div className="w-3 h-0.5 rounded-full bg-[var(--text-muted)] opacity-30" />
                              <div className="w-4 h-1 rounded-full bg-[#FF5C3A]/20" />
                            </div>
                            {/* Hero Side-by-Side */}
                            <div className="flex-1 flex p-2 gap-2 bg-[var(--bg-base)]">
                              <div className="flex-1 flex flex-col justify-center gap-1">
                                <div className="w-8 h-1 bg-[var(--text-muted)] opacity-20 rounded-full" />
                                <div className="w-10 h-2 bg-[#FF5C3A]/30 rounded-sm" />
                              </div>
                              <div className="w-1/3 rounded-lg bg-[var(--bg-card)] border border-[var(--border-color)]" />
                            </div>
                            {/* Steps representation */}
                            <div className="h-4 flex gap-1 px-2 items-center bg-[var(--bg-card)] border-t border-[var(--border-color)]">
                              {[1,2,3].map(i => <div key={i} className="flex-1 h-1.5 rounded-full bg-[var(--text-muted)] opacity-10" />)}
                            </div>
                          </div>
                        )
                      },
                      { 
                        id: 'editorial', 
                        name: 'Editorial', 
                        desc: '2 Columnas',
                        visual: (active: boolean) => (
                          <div className={`w-full aspect-[16/10] rounded-xl border-2 mb-3 overflow-hidden flex flex-col transition-all ${active ? 'border-[#FF5C3A] bg-[#FF5C3A]/5' : 'border-[var(--border-color)] bg-[var(--bg-base)]'}`}>
                            <div className="h-6 bg-gradient-to-br from-gray-800 to-black relative flex items-end p-1.5">
                              <div className="w-8 h-1 bg-white/30 rounded-full" />
                            </div>
                            <div className="flex-1 flex p-1.5 gap-1.5">
                              <div className="flex-1 space-y-1">
                                <div className="grid grid-cols-2 gap-1">
                                  {[1,2,3,4].map(i => <div key={i} className="aspect-square bg-[var(--bg-card)] border border-[var(--border-color)] rounded-sm" />)}
                                </div>
                              </div>
                              <div className="w-1/3 rounded-lg border border-[#FF5C3A]/20 bg-[var(--bg-card)] p-1 flex flex-col gap-1">
                                <div className="w-full h-2 bg-black rounded-sm" />
                                <div className="flex-1 bg-[var(--bg-base)] rounded-sm border border-[var(--border-color)]" />
                              </div>
                            </div>
                          </div>
                        )
                      },
                      { 
                        id: 'moderno', 
                        name: 'Moderno', 
                        desc: 'Probador Single',
                        visual: (active: boolean) => (
                          <div className={`w-full aspect-[16/10] rounded-xl border-2 mb-3 overflow-hidden flex flex-col transition-all ${active ? 'border-[#FF5C3A] bg-[#FF5C3A]/5' : 'border-[var(--border-color)] bg-[var(--bg-base)]'}`}>
                            <div className="h-10 bg-black relative flex flex-col items-center justify-center gap-1.5">
                              <div className="w-10 h-1 bg-white/20 rounded-full" />
                              <div className="w-8 h-2.5 bg-[#FF5C3A] rounded-sm" />
                            </div>
                            <div className="flex-1 p-2 grid grid-cols-4 gap-1">
                                {[1,2,3,4].map(i => <div key={i} className="aspect-square bg-[var(--bg-card)] border border-[var(--border-color)] rounded-sm" />)}
                            </div>
                          </div>
                        )
                      },
                    ].map(t => (
                      <button
                        key={t.id}
                        onClick={() => setLandingTemplate(t.id as any)}
                        className={`p-4 rounded-[2rem] border-2 text-center transition-all group ${landingTemplate === t.id ? 'border-[#FF5C3A] bg-[#FF5C3A]/5 shadow-xl scale-[1.02]' : 'border-[var(--border-color)] bg-[var(--bg-card)] hover:border-[var(--text-muted)]'}`}
                      >
                        {t.visual(landingTemplate === t.id)}
                        <p className={`text-xs font-black uppercase tracking-widest ${landingTemplate === t.id ? 'text-[#FF5C3A]' : 'text-[var(--text-secondary)] group-hover:text-[var(--text-primary)]'}`}>{t.name}</p>
                        <p className="text-[9px] font-bold text-gray-500 mt-1 uppercase tracking-tighter opacity-60">{t.desc}</p>
                      </button>
                    ))}
                  </div>
                </section>

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
                  }}
                />
              </div>
            ) : (
              <div className="animate-in fade-in slide-in-from-left-4 duration-500">
                <DomainTab {...{ customDomain, setCustomDomain, brand, saving, handleSave, FRONTEND_URL }} />
              </div>
            )}
          </div>

          {success && (
            <div className="p-5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-xs font-bold uppercase tracking-widest rounded-2xl flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
              <Check className="w-5 h-5" /> ¡Configuración guardada correctamente!
            </div>
          )}
          {error && (
            <div className="p-5 bg-red-500/10 border border-red-500/20 text-red-500 text-xs font-bold uppercase tracking-widest rounded-2xl flex items-center gap-3 animate-in shake duration-500">
              <AlertCircle className="w-5 h-5" /> {error}
            </div>
          )}

          <div className="pt-6 border-t border-[var(--border-color)]">
            <button
              onClick={handleSave}
              disabled={saving}
              className="w-full flex items-center justify-center gap-2 px-8 py-4 bg-[#FF5C3A] text-white rounded-2xl font-black uppercase tracking-widest text-sm transition-all hover:scale-[1.01] active:scale-95 disabled:opacity-50 shadow-xl shadow-[#FF5C3A]/20"
            >
              {saving ? <Spinner size="sm" /> : <Save className="w-5 h-5" />}
              {saving ? 'Guardando...' : 'Guardar Cambios'}
            </button>
          </div>
        </div>

        {/* PREVIEW STICKY (Columna Derecha) */}
        <div className="hidden lg:block lg:col-span-5 xl:col-span-5 sticky top-[80px] z-0">
          <div className="text-[10px] font-black uppercase tracking-[0.3em] text-[var(--text-muted)] mb-4 px-2 flex items-center gap-3">
            <Globe className="w-4 h-4" /> Previsualización en Vivo
          </div>
          
          <div className="bg-[var(--bg-card)] rounded-[2.5rem] border border-[var(--border-color)] overflow-hidden shadow-2xl flex flex-col transition-all duration-500 h-[calc(100vh-160px)] max-h-[850px] w-full">
            {/* Barra del preview - Browser Look */}
            <div className="h-10 border-b border-[var(--border-color)] bg-[var(--bg-card)] flex items-center px-5 gap-4 shrink-0">
              <div className="flex gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500/20" />
                <div className="w-3 h-3 rounded-full bg-amber-500/20" />
                <div className="w-3 h-3 rounded-full bg-emerald-500/20" />
              </div>
              <div className="flex-1 bg-[var(--bg-base)] h-6 rounded-lg border border-[var(--border-color)] flex items-center px-3 gap-2">
                <div className="w-2 h-2 rounded-full bg-[#FF5C3A]/20 flex items-center justify-center">
                  <div className="w-1 h-1 rounded-full bg-[#FF5C3A]" />
                </div>
                <span className="text-[10px] text-[var(--text-muted)] font-mono truncate opacity-60 italic">lookitry.com/sitio/{brandSlug}</span>
              </div>
            </div>

            {/* AREA DE CONTENIDO REAL */}
            <div className="flex-1 overflow-y-auto custom-scrollbar bg-white overflow-x-hidden">
              <div className="w-full h-full">
                <LandingPreview {...previewProps} />
              </div>
            </div>

            <div className="h-8 border-t border-[var(--border-color)] bg-[var(--bg-card)] flex items-center justify-center px-4 shrink-0">
              <span className="text-[9px] font-black text-[var(--text-muted)] uppercase tracking-widest opacity-30">Renderizado de Componentes Reales</span>
            </div>
          </div>
          <p className="text-[10px] text-center mt-6 font-bold uppercase tracking-widest text-[var(--text-muted)] max-w-sm mx-auto leading-relaxed opacity-60">
            Los cambios se reflejan automáticamente.<br />Usa el botón &quot;Guardar&quot; para hacerlos públicos.
          </p>
        </div>

      </div>
    </div>
  );
}
