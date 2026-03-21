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
  const [slogan, setSlogan] = useState('');
  const [description, setDescription] = useState('');
  const [primaryColor, setPrimaryColor] = useState('#FF5C3A');
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
          api.get('/products').then(r => r.data).catch(() => [])
        ]);
        
        setBrand(brandData);
        setProducts(productsData);
        
        // Cargar estados locales
        setLandingTemplate(brandData.landing_template || 'classic');
        setSlogan(brandData.slogan || '');
        setDescription(brandData.brand_description || '');
        setPrimaryColor(brandData.primary_color || '#FF5C3A');
        setHeaderColor(brandData.header_color || '');
        setCoverBgColor(brandData.cover_bg_color || '');
        setCoverOverlayOpacity(brandData.cover_overlay_opacity ?? 0.55);
        setLogoUrl(brandData.logo || '');
        setLogoLightUrl(brandData.logo_light || '');
        setLogoDarkUrl(brandData.logo_dark || '');
        setCoverImageUrl(brandData.cover_image_url || '');
        setWhatsapp(brandData.whatsapp_contact || '');
        setWhatsappMessage(brandData.whatsapp_message || '');
        setCtaButtonText(brandData.cta_button_text || 'Probarme esto');
        setInstagram(brandData.social_links?.instagram || '');
        setFacebook(brandData.social_links?.facebook || '');
        setTiktok(brandData.social_links?.tiktok || '');
        setYoutube(brandData.social_links?.youtube || '');
        setX(brandData.social_links?.x || '');
        setCityDisplay(brandData.city_display || '');
        setNationalShipping(brandData.national_shipping || false);
        setShowBrandName(brandData.show_brand_name ?? true);
        setRating(brandData.rating?.toString() || '');
        setTotalReviews(brandData.total_reviews?.toString() || '');
        setSchedule(brandData.schedule || {});
        setCustomDomain(brandData.custom_domain || '');
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
      };

      const payload = {
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
        primary_color: primaryColor,
        rating: rating ? parseFloat(rating) : null,
        total_reviews: totalReviews ? parseInt(totalReviews, 10) : null,
        header_color: headerColor || null,
        schedule: Object.fromEntries(Object.entries(schedule).filter(([, v]) => (v as string).trim())),
        custom_domain: customDomain || null,
      };

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
    slogan,
    brand_description: description,
    primary_color: primaryColor,
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
    <div className="max-w-[1440px] mx-auto px-4 sm:px-6 py-6">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* PANEL DE EDICIÓN (Columna Izquierda) */}
        <div className="lg:col-span-8 xl:col-span-8 space-y-5">
          <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-[var(--text-primary)] italic uppercase leading-none">Mi Página Pública</h1>
              <p className="text-xs text-[var(--text-secondary)] mt-1.5 flex items-center gap-2">
                Personaliza la experiencia de tus clientes
                <a href={pageUrl} target="_blank" rel="noopener noreferrer" className="text-[#FF5C3A] hover:underline flex items-center gap-1 font-bold">
                  Ver mi sitio <ExternalLink className="w-3 h-3" />
                </a>
              </p>
            </div>
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center justify-center gap-2 px-6 py-2.5 bg-[#FF5C3A] text-white rounded-xl font-black uppercase tracking-widest text-[10px] transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-50 shadow-lg shadow-[#FF5C3A]/20"
            >
              {saving ? <Spinner size="sm" /> : <Save className="w-3.5 h-3.5" />}
              {saving ? 'Guardando...' : 'Guardar cambios'}
            </button>
          </header>

          {/* Banner de estado (Trial) */}
          {!brand?.has_landing_page && (
            <div className="p-4 rounded-3xl border border-[#FF5C3A]/20 bg-[#FF5C3A]/5 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#FF5C3A]/10 flex items-center justify-center shrink-0">
                  <Globe className="w-5 h-5 text-[#FF5C3A]" />
                </div>
                <div>
                  <p className="text-xs font-black text-[var(--text-primary)] uppercase tracking-tight italic">Modo Previsualización</p>
                  <p className="text-[10px] text-[var(--text-secondary)] mt-0.5 font-medium leading-tight">Tu página no es pública aún. Actívala para que tus clientes puedan ver tu catálogo IA.</p>
                </div>
              </div>
              <Link href="/dashboard/checkout-landing" className="px-5 py-2 bg-[#FF5C3A] text-white text-[9px] font-black uppercase rounded-lg hover:brightness-110 transition-all shadow-lg whitespace-nowrap">Activar ahora</Link>
            </div>
          )}

          {/* Tabs Navegación */}
          <div className="flex gap-3 p-1 bg-[var(--bg-card)] rounded-xl border border-[var(--border-color)] w-fit">
            <button 
              onClick={() => setActiveTab('design')} 
              className={`px-5 py-2 text-[10px] font-black uppercase tracking-widest transition-all rounded-lg ${activeTab === 'design' ? 'bg-[#FF5C3A] text-white shadow-lg' : 'text-gray-500 hover:text-gray-300'}`}
            >
              Diseño Visual
            </button>
            <button 
              onClick={() => setActiveTab('domain')} 
              className={`px-5 py-2 text-[10px] font-black uppercase tracking-widest transition-all rounded-lg ${activeTab === 'domain' ? 'bg-[#FF5C3A] text-white shadow-lg' : 'text-gray-500 hover:text-gray-300'}`}
            >
              Identidad Digital
            </button>
          </div>

          <div className="space-y-6">
            {activeTab === 'design' ? (
              <div className="space-y-6 animate-in fade-in slide-in-from-left-4 duration-500">
                {/* Selector de Plantilla */}
                <section className="p-6 bg-[var(--bg-card)] rounded-[2rem] border border-[var(--border-color)] space-y-5">
                  <div className="flex items-center gap-3 border-b border-[var(--border-color)] pb-4">
                    <div className="w-8 h-8 rounded-xl bg-[#FF5C3A]/10 flex items-center justify-center">
                      <Layout className="w-4 h-4 text-[#FF5C3A]" />
                    </div>
                    <h3 className="text-sm font-bold text-[var(--text-primary)] italic uppercase tracking-tight">Selecciona tu Plantilla</h3>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {[
                      { 
                        id: 'classic', 
                        name: 'Clásico', 
                        desc: 'Institucional',
                        visual: (active: boolean) => (
                          <div className={`w-full aspect-[16/10] rounded-lg border mb-2 overflow-hidden flex flex-col transition-all ${active ? 'border-[#FF5C3A] bg-[#FF5C3A]/5' : 'border-[var(--border-color)] bg-[var(--bg-base)]'}`}>
                            <div className="h-2 border-b border-[var(--border-color)] bg-[var(--bg-card)] flex items-center px-1 justify-between">
                              <div className="w-3 h-0.5 rounded-full bg-[var(--text-muted)] opacity-30" />
                              <div className="flex gap-0.5"><div className="w-1 h-0.5 rounded-full bg-[var(--text-muted)] opacity-20" /></div>
                            </div>
                            <div className="flex-1 flex flex-col items-center justify-center p-1 gap-1 bg-[var(--bg-base)]">
                              <div className="w-8 h-1 bg-[var(--text-muted)] opacity-20 rounded-full" />
                              <div className="w-10 h-2 bg-[#FF5C3A]/30 rounded-sm" />
                            </div>
                            <div className="h-4 flex gap-0.5 px-1 items-center border-t border-[var(--border-color)] bg-[var(--bg-card)]">
                              {[1,2,3].map(i => <div key={i} className="flex-1 h-2 rounded bg-[var(--bg-base)] border border-[var(--border-color)]" />)}
                            </div>
                          </div>
                        )
                      },
                      { 
                        id: 'editorial', 
                        name: 'Editorial', 
                        desc: '2 Columnas',
                        visual: (active: boolean) => (
                          <div className={`w-full aspect-[16/10] rounded-lg border mb-2 overflow-hidden flex flex-col transition-all ${active ? 'border-[#FF5C3A] bg-[#FF5C3A]/5' : 'border-[var(--border-color)] bg-[var(--bg-base)]'}`}>
                            <div className="h-5 bg-gradient-to-br from-gray-800 to-black relative flex items-end p-1">
                              <div className="w-6 h-0.5 bg-white/30 rounded-full" />
                            </div>
                            <div className="flex-1 flex p-1 gap-1">
                              <div className="flex-1 space-y-0.5">
                                <div className="grid grid-cols-2 gap-0.5">
                                  {[1,2,3,4].map(i => <div key={i} className="aspect-square bg-[var(--bg-card)] border border-[var(--border-color)] rounded-sm" />)}
                                </div>
                              </div>
                              <div className="w-1/3 rounded-sm border border-[#FF5C3A]/20 bg-[var(--bg-card)] p-0.5 flex flex-col gap-0.5">
                                <div className="w-full h-1 bg-black rounded-sm" />
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
                          <div className={`w-full aspect-[16/10] rounded-lg border mb-2 overflow-hidden flex flex-col transition-all ${active ? 'border-[#FF5C3A] bg-[#FF5C3A]/5' : 'border-[var(--border-color)] bg-[var(--bg-base)]'}`}>
                            <div className="h-8 bg-black relative flex flex-col items-center justify-center gap-1">
                              <div className="w-8 h-0.5 bg-white/20 rounded-full" />
                              <div className="w-6 h-2 bg-[#FF5C3A] rounded-sm" />
                            </div>
                            <div className="flex-1 p-1 grid grid-cols-4 gap-0.5">
                                {[1,2,3,4].map(i => <div key={i} className="aspect-square bg-[var(--bg-card)] border border-[var(--border-color)] rounded-sm" />)}
                            </div>
                          </div>
                        )
                      },
                    ].map(t => (
                      <button
                        key={t.id}
                        onClick={() => setLandingTemplate(t.id as any)}
                        className={`p-3 rounded-3xl border-2 text-center transition-all group ${landingTemplate === t.id ? 'border-[#FF5C3A] bg-[#FF5C3A]/5 shadow-lg scale-[1.02]' : 'border-[var(--border-color)] bg-[var(--bg-card)] hover:border-[var(--text-muted)]'}`}
                      >
                        {t.visual(landingTemplate === t.id)}
                        <p className={`text-[10px] font-black uppercase tracking-widest ${landingTemplate === t.id ? 'text-[#FF5C3A]' : 'text-[var(--text-secondary)] group-hover:text-[var(--text-primary)]'}`}>{t.name}</p>
                        <p className="text-[8px] font-bold text-gray-500 mt-0.5 uppercase tracking-tighter opacity-60">{t.desc}</p>
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
                    cityDisplay, setCityDisplay, nationalShipping, setNationalShipping,
                    showBrandName, setShowBrandName,
                    primaryColor, setPrimaryColor, rating, setRating, totalReviews, setTotalReviews,
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
            <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-[10px] font-bold uppercase tracking-widest rounded-xl flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
              <Check className="w-4 h-4" /> ¡Configuración guardada correctamente!
            </div>
          )}
          {error && (
            <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-500 text-[10px] font-bold uppercase tracking-widest rounded-xl flex items-center gap-3 animate-in shake duration-500">
              <AlertCircle className="w-4 h-4" /> {error}
            </div>
          )}
        </div>

        {/* PREVIEW STICKY (Columna Derecha) */}
        <div className="hidden lg:block lg:col-span-4 xl:col-span-4 sticky top-[80px] z-0">
          <div className="text-[9px] font-black uppercase tracking-[0.3em] text-[var(--text-muted)] mb-3 px-2 flex items-center gap-2">
            <Globe className="w-3.5 h-3.5" /> Previsualización en vivo
          </div>
          
          <div className="bg-[var(--bg-card)] rounded-[2rem] border border-[var(--border-color)] overflow-hidden shadow-2xl flex flex-col transition-all duration-500 h-[calc(100vh-160px)] max-h-[800px]">
            {/* Barra del preview */}
            <div className="h-9 border-b border-[var(--border-color)] bg-[var(--bg-card)] flex items-center px-4 gap-3 shrink-0">
              <div className="flex gap-1.5">
                <div className="w-2 h-2 rounded-full bg-red-500/20" />
                <div className="w-2 h-2 rounded-full bg-amber-500/20" />
                <div className="w-2 h-2 rounded-full bg-emerald-500/20" />
              </div>
              <div className="flex-1 bg-[var(--bg-base)] h-5 rounded-md border border-[var(--border-color)] flex items-center px-2.5 gap-2">
                <div className="w-2 h-2 rounded-full bg-[#FF5C3A]/20 flex items-center justify-center">
                  <div className="w-0.5 h-0.5 rounded-full bg-[#FF5C3A]" />
                </div>
                <span className="text-[9px] text-[var(--text-muted)] font-mono truncate opacity-50">lookitry.com/sitio/{brandSlug}</span>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar bg-[var(--bg-base)]">
              <div className="w-full h-full">
                <LandingPreview {...previewProps} />
              </div>
            </div>

            <div className="h-7 border-t border-[var(--border-color)] bg-[var(--bg-card)] flex items-center justify-center px-4 shrink-0">
              <span className="text-[8px] font-bold text-[var(--text-muted)] uppercase tracking-tighter opacity-30">Vista Móvil Optimizada</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}