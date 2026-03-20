'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { brandsService } from '@/services/brands.service';
import { api } from '@/services/api';
import { Spinner } from '@/components/ui/Spinner';
import { LandingTutorial } from '@/components/dashboard/LandingTutorial';
import { ExternalLinkIcon, CheckIcon, CopyIcon } from './components/Icons';
import { Globe } from 'lucide-react';
import { LandingPreview } from './components/LandingPreview';
import { DesignTab } from './components/DesignTab';
import { DomainTab } from './components/DomainTab';
import type { Brand } from '@/types';

const FRONTEND_URL = process.env.NEXT_PUBLIC_FRONTEND_URL || 'https://pruebalo.wilkiedevs.com';
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.pruebalo.wilkiedevs.com';

// ── Componente URL copiable ───────────────────────────────────────────────────
function CopyableUrl({ url }: { url: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = async () => {
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <div className="flex items-center gap-2 px-4 py-3 rounded-xl border text-sm font-mono" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)', color: 'var(--text-secondary)' }}>
      <span className="flex-1 truncate">{url}</span>
      <button onClick={handleCopy} className="flex-shrink-0 p-1.5 rounded-lg" style={{ color: copied ? '#22c55e' : 'var(--text-secondary)' }}>
        {copied ? <CheckIcon className="w-4 h-4" /> : <CopyIcon className="w-4 h-4" />}
      </button>
      <a href={url} target="_blank" rel="noopener noreferrer" className="flex-shrink-0 p-1.5 rounded-lg" style={{ color: 'var(--text-secondary)' }}>
        <ExternalLinkIcon className="w-4 h-4" />
      </a>
    </div>
  );
}

export default function MiPaginaPage() {
  const { brand: authBrand } = useAuth();
  const [brand, setBrand] = useState<Brand | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [landingPrice, setLandingPrice] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<'design' | 'domain'>('design');

  // Estados del formulario
  const [description, setDescription] = useState('');
  const [slogan, setSlogan] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [whatsappMessage, setWhatsappMessage] = useState('');
  const [ctaButtonText, setCtaButtonText] = useState('');
  const [coverImageUrl, setCoverImageUrl] = useState('');
  const [instagram, setInstagram] = useState('');
  const [facebook, setFacebook] = useState('');
  const [tiktok, setTiktok] = useState('');
  const [cityDisplay, setCityDisplay] = useState('');
  const [nationalShipping, setNationalShipping] = useState(false);
  const [showBrandName, setShowBrandName] = useState(true);
  const [landingTemplate, setLandingTemplate] = useState<'classic' | 'editorial' | 'moderno'>('classic');
  const [primaryColor, setPrimaryColor] = useState('#FF5C3A');
  const [rating, setRating] = useState('');
  const [totalReviews, setTotalReviews] = useState('');
  const [schedule, setSchedule] = useState<Record<string, string>>({
    lunes: '', martes: '', miercoles: '', jueves: '', viernes: '', sabado: '', domingo: '',
  });
  const [logoUrl, setLogoUrl] = useState('');
  const [logoLightUrl, setLogoLightUrl] = useState('');
  const [logoDarkUrl, setLogoDarkUrl] = useState('');
  const [coverBgColor, setCoverBgColor] = useState('');
  const [coverOverlayOpacity, setCoverOverlayOpacity] = useState(0.55);
  const [headerColor, setHeaderColor] = useState('');
  const [customDomain, setCustomDomain] = useState('');

  useEffect(() => {
    brandsService.getCurrentBrand()
      .then(b => {
        setBrand(b);
        const raw = b as any;
        setDescription(raw.brand_description || '');
        setSlogan(raw.slogan || '');
        setWhatsapp(raw.whatsapp_contact || '');
        setWhatsappMessage(raw.whatsapp_message || '');
        setCtaButtonText(raw.cta_button_text || '');
        setCoverImageUrl(raw.cover_image_url || '');
        setLogoUrl(raw.logo || '');
        setLogoLightUrl(raw.logo_light || '');
        setLogoDarkUrl(raw.logo_dark || '');
        setCoverBgColor(raw.cover_bg_color || '');
        setCoverOverlayOpacity(raw.cover_overlay_opacity != null ? raw.cover_overlay_opacity : 0.55);
        setHeaderColor(raw.header_color || '');
        const links = raw.social_links || {};
        setInstagram(links.instagram || '');
        setFacebook(links.facebook || '');
        setTiktok(links.tiktok || '');
        setCityDisplay(raw.city_display || '');
        setNationalShipping(raw.national_shipping ?? false);
        setShowBrandName(raw.show_brand_name ?? true);
        setLandingTemplate((raw.landing_template === 'probador' ? 'moderno' : raw.landing_template) || 'classic');
        setPrimaryColor(raw.primary_color || '#FF5C3A');
        setRating(raw.rating != null ? String(raw.rating) : '');
        setTotalReviews(raw.total_reviews != null ? String(raw.total_reviews) : '');
        if (raw.schedule && typeof raw.schedule === 'object') setSchedule(prev => ({ ...prev, ...raw.schedule }));
        setCustomDomain(raw.custom_domain || '');
      })
      .catch(() => setError('Error al cargar los datos'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetch(`${API_URL}/api/payment-settings/public`)
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d?.landingPrice) setLandingPrice(d.landingPrice); })
      .catch(() => {});
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      const social_links: Record<string, string> = {};
      if (instagram) social_links.instagram = instagram;
      if (facebook) social_links.facebook = facebook;
      if (tiktok) social_links.tiktok = tiktok;

      await api.patch('/brands/me', {
        brand_description: description || null,
        slogan: slogan || null,
        whatsapp_contact: whatsapp || null,
        whatsapp_message: whatsappMessage || null,
        cta_button_text: ctaButtonText || null,
        cover_image_url: coverImageUrl || null,
        logo: logoUrl || null,
        logo_light: logoLightUrl || null,
        logo_dark: logoDarkUrl || null,
        cover_bg_color: coverBgColor || null,
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
        schedule: Object.fromEntries(Object.entries(schedule).filter(([, v]) => v.trim())),
        custom_domain: customDomain || null,
      });

      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch {
      setError('Error al guardar los cambios');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="flex items-center justify-center py-16"><Spinner size="lg" /></div>;

  const slug = brand?.slug || authBrand?.slug || '';
  const pageUrl = `${FRONTEND_URL}/sitio/${slug}`;
  const hasLandingPage = (brand as any)?.has_landing_page ?? false;
  const brandLogo = logoUrl || (brand as any)?.logo || null;
  const brandId = (brand as any)?.id;

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {hasLandingPage && brandId && <LandingTutorial brandId={brandId} />}
      
      <div className="grid grid-cols-1 xl:grid-cols-[1fr_380px] gap-6 flex-1 min-h-0 overflow-hidden">
        {/* ── Columna izquierda: formulario con scroll propio ── */}
        <div className="overflow-y-auto pr-2 custom-scrollbar space-y-8 pb-32">
          <div className="flex flex-col gap-1">
            <h1 className="font-syne font-bold text-2xl" style={{ color: 'var(--text-primary)' }}>Mi página</h1>
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Personaliza tu mini-landing pública</p>
          </div>

          <div className="p-5 rounded-2xl border space-y-3" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
              <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>URL de tu página</p>
              <CopyableUrl url={pageUrl} />
          </div>

          {!hasLandingPage && (
             <div className="p-6 rounded-2xl border flex flex-col md:flex-row items-center justify-between gap-6" style={{ background: 'linear-gradient(135deg, rgba(255,92,58,0.1) 0%, rgba(255,92,58,0.02) 100%)', borderColor: '#FF5C3A33' }}>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: '#FF5C3A15' }}>
                    <Globe className="w-6 h-6 text-[#FF5C3A]" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-[#FF5C3A]">¡Tu mini-landing aún no está activa!</h3>
                    <p className="text-sm text-gray-500 max-w-md">Publica tu marca con una URL personalizada, probador virtual integrado y catálogo de productos.</p>
                  </div>
                </div>
                <Link 
                  href="/dashboard/checkout?addon=landing" 
                  className="w-full md:w-auto px-8 py-3 rounded-xl text-white font-bold transition-all hover:scale-[1.05] active:scale-95 text-center whitespace-nowrap" 
                  style={{ backgroundColor: '#FF5C3A', boxShadow: '0 10px 20px -5px rgba(255,92,58,0.4)' }}
                >
                  ACTIVAR AHORA
                </Link>
             </div>
          )}

          {/* Navegación por Pestañas */}
          <div className="flex items-center gap-1 border-b" style={{ borderColor: 'var(--border-color)' }}>
            {(['design', 'domain'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-6 py-3 text-sm font-semibold transition-all border-b-2 ${
                  activeTab === tab ? 'border-[#FF5C3A] text-[#FF5C3A]' : 'border-transparent text-gray-400'
                }`}
              >
                {tab === 'design' ? 'Diseño y Contenido' : 'Identidad y Dominio'}
              </button>
            ))}
          </div>

          {activeTab === 'design' ? (
            <DesignTab 
              {...{ description, setDescription, slogan, setSlogan, whatsapp, setWhatsapp, whatsappMessage, setWhatsappMessage, ctaButtonText, setCtaButtonText, coverImageUrl, setCoverImageUrl, logoUrl, setLogoUrl, logoLightUrl, setLogoLightUrl, logoDarkUrl, setLogoDarkUrl, coverBgColor, setCoverBgColor, coverOverlayOpacity, setCoverOverlayOpacity, headerColor, setHeaderColor, instagram, setInstagram, facebook, setFacebook, tiktok, setTiktok, cityDisplay, setCityDisplay, nationalShipping, setNationalShipping, showBrandName, setShowBrandName, landingTemplate, setLandingTemplate, primaryColor, setPrimaryColor, rating, setRating, totalReviews, setTotalReviews, schedule, setSchedule, handleSave, saving, error, success, pageUrl }} 
            />
          ) : (
            <DomainTab {...{ customDomain, setCustomDomain, brand, saving, handleSave, FRONTEND_URL }} />
          )}

          {/* Botones de Acción al final - Más sutiles */}
          <div className="flex flex-col sm:flex-row items-center gap-3 pt-8 pb-4 border-t mt-8" style={{ borderColor: 'var(--border-color)' }}>
              <a 
                href={pageUrl} 
                target="_blank" 
                rel="noopener noreferrer"
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl border text-sm font-bold transition-all hover:bg-black/5"
                style={{ borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
              >
                <ExternalLinkIcon className="w-4 h-4" />
                <span>Previsualizar</span>
              </a>
              <button
                onClick={handleSave}
                disabled={saving}
                className="w-full sm:flex-1 flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl text-white font-bold text-sm transition-all hover:brightness-110 active:scale-[0.98] disabled:opacity-50"
                style={{ backgroundColor: '#FF5C3A' }}
              >
                {saving ? <Spinner size="sm" /> : 'Guardar Cambios'}
              </button>
          </div>
        </div>

        {/* ── Columna derecha: preview con scroll propio ── */}
        <div className="hidden xl:block overflow-y-auto pr-2 custom-scrollbar pb-32">
           <LandingPreview {...{ landingTemplate, setLandingTemplate, primaryColor, headerColor, brandLogo, coverImageUrl, coverOverlayOpacity, pageUrl, coverBgColor }} />
        </div>
      </div>
    </div>
  );
}
