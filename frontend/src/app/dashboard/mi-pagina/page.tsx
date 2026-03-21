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

function CopyableUrl({ url }: { url: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = async () => {
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <div
      className="flex items-center gap-2 px-4 py-3 rounded-xl border text-sm font-mono transition-colors"
      style={{ backgroundColor: 'var(--bg-base)', borderColor: 'var(--border-color)', color: 'var(--text-secondary)' }}
    >
      <span className="flex-1 truncate text-xs">{url}</span>
      <button
        onClick={handleCopy}
        className="flex-shrink-0 p-1.5 rounded-lg transition-colors hover:bg-white/5 cursor-pointer"
        style={{ color: copied ? '#10b981' : 'var(--text-secondary)' }}
        title="Copiar URL"
      >
        {copied ? <CheckIcon className="w-4 h-4" /> : <CopyIcon className="w-4 h-4" />}
      </button>
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="flex-shrink-0 p-1.5 rounded-lg transition-colors hover:bg-white/5 cursor-pointer"
        style={{ color: 'var(--text-secondary)' }}
        title="Abrir en nueva pestaña"
      >
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
  const [_landingPrice, setLandingPrice] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<'design' | 'domain'>('design');

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

      const payload = {
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
      };

      console.log('📤 Guardando landing_template:', landingTemplate);
      console.log('📦 Payload completo:', payload);

      await api.patch('/brands/me', payload);

      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      console.error('❌ Error al guardar:', err);
      setError('Error al guardar los cambios');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center py-24">
      <Spinner size="lg" />
    </div>
  );

  const slug = brand?.slug || authBrand?.slug || '';
  const pageUrl = `${FRONTEND_URL}/sitio/${slug}`;
  const hasLandingPage = (brand as any)?.has_landing_page ?? false;
  const brandLogo = logoUrl || (brand as any)?.logo || null;
  const brandId = (brand as any)?.id;

  const previewProps = {
    landingTemplate, setLandingTemplate, primaryColor, headerColor,
    brandLogo, coverImageUrl, coverOverlayOpacity, pageUrl, coverBgColor,
  };

  return (
    <div className="flex flex-col h-full">
      {hasLandingPage && brandId && <LandingTutorial brandId={brandId} />}

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_360px] gap-6 flex-1 min-h-0" style={{ alignItems: 'start' }}>

        {/* ── Columna izquierda: formulario con scroll ── */}
        <div className="overflow-y-auto pr-1 custom-scrollbar pb-8 space-y-6">

          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-2">
            <div>
              <h1 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>Mi página</h1>
              <p className="text-sm mt-0.5" style={{ color: 'var(--text-secondary)' }}>
                Personaliza tu mini-landing pública
              </p>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <a
                href={pageUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl border text-sm font-medium transition-all hover:bg-white/5 cursor-pointer"
                style={{ borderColor: 'var(--border-color)', color: 'var(--text-secondary)' }}
              >
                <ExternalLinkIcon className="w-3.5 h-3.5" />
                Ver página
              </a>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-1.5 px-5 py-2 rounded-xl text-white text-sm font-semibold transition-all hover:brightness-110 active:scale-[0.98] disabled:opacity-50 cursor-pointer"
                style={{ backgroundColor: '#FF5C3A' }}
              >
                {saving ? <Spinner size="sm" /> : 'Guardar'}
              </button>
            </div>
          </div>

          {/* URL */}
          <div className="p-4 rounded-2xl border space-y-2" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
            <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>URL de tu página</p>
            <CopyableUrl url={pageUrl} />
          </div>

          {/* Banner activación */}
          {!hasLandingPage && (
            <div
              className="p-5 rounded-2xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
              style={{ background: 'linear-gradient(135deg, rgba(255,92,58,0.08) 0%, rgba(255,92,58,0.02) 100%)', borderColor: 'rgba(255,92,58,0.2)' }}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: 'rgba(255,92,58,0.12)' }}>
                  <Globe className="w-5 h-5 text-[#FF5C3A]" />
                </div>
                <div>
                  <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Tu mini-landing aún no está activa</p>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>
                    Publica tu marca con URL personalizada, probador virtual y catálogo.
                  </p>
                </div>
              </div>
              <Link
                href="/dashboard/checkout-landing"
                className="flex-shrink-0 px-5 py-2 rounded-xl text-white text-sm font-semibold transition-all hover:brightness-110 active:scale-95 cursor-pointer"
                style={{ backgroundColor: '#FF5C3A' }}
              >
                Activar ahora
              </Link>
            </div>
          )}

          {/* Tabs */}
          <div className="flex items-center gap-0 border-b" style={{ borderColor: 'var(--border-color)' }}>
            {(['design', 'domain'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className="px-5 py-2.5 text-sm font-medium transition-all border-b-2 cursor-pointer"
                style={{
                  borderColor: activeTab === tab ? '#FF5C3A' : 'transparent',
                  color: activeTab === tab ? '#FF5C3A' : 'var(--text-secondary)',
                }}
              >
                {tab === 'design' ? 'Diseño y contenido' : 'Identidad y dominio'}
              </button>
            ))}
          </div>

          {/* Selector de plantilla — solo mobile */}
          {activeTab === 'design' && (
            <div className="xl:hidden rounded-2xl border overflow-hidden" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
              <div className="px-5 py-3.5 border-b" style={{ borderColor: 'var(--border-color)' }}>
                <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Plantilla</p>
              </div>
              <div className="p-4 overflow-x-auto">
                <div className="flex gap-3 min-w-max">
                  {([
                    { id: 'classic' as const, name: 'Clásico', desc: 'Hero · Pasos · Catálogo' },
                    { id: 'editorial' as const, name: 'Editorial', desc: 'Header sticky · 2 col' },
                    { id: 'moderno' as const, name: 'Moderno', desc: 'Dark hero · Trust bar' },
                  ]).map(t => (
                    <button
                      key={t.id}
                      onClick={() => setLandingTemplate(t.id)}
                      className="flex flex-col items-center gap-1 px-5 py-3 rounded-xl border text-center transition-all cursor-pointer flex-shrink-0"
                      style={{
                        borderColor: landingTemplate === t.id ? '#FF5C3A' : 'var(--border-color)',
                        backgroundColor: landingTemplate === t.id ? 'rgba(255,92,58,0.06)' : 'var(--bg-base)',
                        minWidth: 110,
                      }}
                    >
                      <span className="text-xs font-semibold" style={{ color: landingTemplate === t.id ? '#FF5C3A' : 'var(--text-primary)' }}>
                        {t.name}
                      </span>
                      <span className="text-[10px]" style={{ color: 'var(--text-secondary)' }}>{t.desc}</span>
                    </button>
                  ))}
                </div>
              </div>
              {/* Preview mobile */}
              <div className="px-4 pb-4">
                <LandingPreview {...previewProps} mobileOnly />
              </div>
            </div>
          )}

          {/* Contenido del tab */}
          {activeTab === 'design' ? (
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
          ) : (
            <DomainTab {...{ customDomain, setCustomDomain, brand, saving, handleSave, FRONTEND_URL }} />
          )}

          {/* Botón guardar al final */}
          <div className="pt-2 pb-6 space-y-3">
            {(success || error) && (
              <div
                className="px-4 py-3 rounded-xl border text-sm"
                style={{
                  backgroundColor: success ? 'rgba(16,185,129,0.08)' : 'rgba(239,68,68,0.08)',
                  borderColor: success ? 'rgba(16,185,129,0.2)' : 'rgba(239,68,68,0.2)',
                  color: success ? '#10b981' : '#ef4444',
                }}
              >
                {success ? 'Cambios guardados correctamente' : error}
              </div>
            )}
            <div className="flex items-center gap-2">
              <a
                href={pageUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border text-sm font-medium transition-all hover:bg-white/5 cursor-pointer"
                style={{ borderColor: 'var(--border-color)', color: 'var(--text-secondary)' }}
              >
                <ExternalLinkIcon className="w-3.5 h-3.5" />
                Ver página
              </a>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex-1 flex items-center justify-center gap-1.5 px-5 py-2.5 rounded-xl text-white text-sm font-semibold transition-all hover:brightness-110 active:scale-[0.98] disabled:opacity-50 cursor-pointer"
                style={{ backgroundColor: '#FF5C3A' }}
              >
                {saving ? <Spinner size="sm" /> : 'Guardar cambios'}
              </button>
            </div>
          </div>
        </div>

        {/* ── Columna derecha: preview sticky con scroll propio ── */}
        {/* El header del dashboard mide h-14 (56px). Usamos top-[72px] para dejar un margen de 16px. */}
        <div
          className="hidden xl:block sticky top-[72px] z-0"
          style={{ maxHeight: 'calc(100vh - 100px)' }}
        >
          <div className="custom-scrollbar h-full overflow-y-auto py-1 pr-1">
            <LandingPreview {...previewProps} />
          </div>
        </div>

      </div>
    </div>
  );
}
