'use client';

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { brandsService } from '@/services/brands.service';
import { authService } from '@/services/auth.service';
import { api } from '@/services/api';
import { Spinner } from '@/components/ui/Spinner';
import { LandingTutorial } from '@/components/dashboard/LandingTutorial';
import type { Brand } from '@/types';

const FRONTEND_URL = process.env.NEXT_PUBLIC_FRONTEND_URL || 'https://pruebalo.wilkiedevs.com';
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.pruebalo.wilkiedevs.com';

// ── Icono copiar ──────────────────────────────────────────────────────────────
function CopyIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
    </svg>
  );
}

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
  );
}

function ExternalLinkIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
    </svg>
  );
}

function UploadIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
    </svg>
  );
}

// ── Componente URL copiable ───────────────────────────────────────────────────
function CopyableUrl({ url }: { url: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      className="flex items-center gap-2 px-4 py-3 rounded-xl border text-sm font-mono"
      style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)', color: 'var(--text-secondary)' }}
    >
      <span className="flex-1 truncate">{url}</span>
      <button
        onClick={handleCopy}
        className="flex-shrink-0 p-1.5 rounded-lg transition-colors"
        style={{ color: copied ? '#22c55e' : 'var(--text-secondary)' }}
        title="Copiar URL"
      >
        {copied ? <CheckIcon className="w-4 h-4" /> : <CopyIcon className="w-4 h-4" />}
      </button>
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="flex-shrink-0 p-1.5 rounded-lg transition-colors"
        style={{ color: 'var(--text-secondary)' }}
        title="Abrir en nueva pestaña"
      >
        <ExternalLinkIcon className="w-4 h-4" />
      </a>
    </div>
  );
}

// ── Upload de logo ────────────────────────────────────────────────────────────
function LogoUpload({
  currentUrl,
  onUpload,
}: {
  currentUrl?: string | null;
  onUpload: (url: string) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFile = async (file: File) => {
    if (!file.type.startsWith('image/')) { setError('Solo se permiten imágenes'); return; }
    if (file.size > 2 * 1024 * 1024) { setError('El logo no debe superar 2MB'); return; }
    setError(null);
    setUploading(true);
    try {
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve((reader.result as string).split(',')[1]);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
      const token = authService.getToken();
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'https://api.pruebalo.wilkiedevs.com'}/api/upload`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ image_base64: base64, filename: file.name }),
      });
      if (!res.ok) { const d = await res.json().catch(() => ({})); throw new Error(d.message || 'Error al subir logo'); }
      const data = await res.json();
      onUpload(data.url);
    } catch (err: any) {
      setError(err.message || 'Error al subir el logo');
    } finally { setUploading(false); }
  };

  return (
    <div className="space-y-2">
      <div
        className="relative w-24 h-24 rounded-2xl border-2 border-dashed overflow-hidden flex items-center justify-center cursor-pointer transition-colors"
        style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-card)' }}
        onClick={() => inputRef.current?.click()}
      >
        {currentUrl ? (
          <>
            <img src={currentUrl} alt="Logo" className="absolute inset-0 w-full h-full object-contain p-2" />
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
              <UploadIcon className="w-5 h-5 text-white" />
            </div>
          </>
        ) : (
          uploading ? <Spinner size="sm" /> : <UploadIcon className="w-6 h-6 text-gray-400" />
        )}
      </div>
      {error && <p className="text-xs text-red-500">{error}</p>}
      <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>PNG o WEBP con fondo transparente recomendado — máx. 2MB</p>
      <input ref={inputRef} type="file" accept="image/*" className="hidden"
        onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />
    </div>
  );
}

// ── Upload de imagen de portada ───────────────────────────────────────────────
function CoverImageUpload({
  currentUrl,
  onUpload,
  primaryColor,
}: {
  currentUrl?: string | null;
  onUpload: (url: string) => void;
  primaryColor: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFile = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      setError('Solo se permiten imágenes');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError('La imagen no debe superar 5MB');
      return;
    }
    setError(null);
    setUploading(true);
    try {
      // Convertir a base64 (el backend espera image_base64 + filename en JSON)
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          const result = reader.result as string;
          // Quitar el prefijo "data:image/...;base64,"
          resolve(result.split(',')[1]);
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      const token = authService.getToken();
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'https://api.pruebalo.wilkiedevs.com'}/api/upload`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ image_base64: base64, filename: file.name }),
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || 'Error al subir imagen');
      }
      const data = await res.json();
      onUpload(data.url);
    } catch (err: any) {
      setError(err.message || 'Error al subir la imagen');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-2">
      <div
        className="relative w-full h-40 rounded-2xl border-2 border-dashed overflow-hidden flex items-center justify-center cursor-pointer transition-colors"
        style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-card)' }}
        onClick={() => inputRef.current?.click()}
      >
        {currentUrl ? (
          <>
            <img src={currentUrl} alt="Portada" className="absolute inset-0 w-full h-full object-cover" />
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
              <span className="text-white text-sm font-medium flex items-center gap-2">
                <UploadIcon className="w-4 h-4" />
                Cambiar imagen
              </span>
            </div>
          </>
        ) : (
          <div className="text-center">
            {uploading ? (
              <Spinner size="sm" />
            ) : (
              <>
                <UploadIcon className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                <p className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
                  Subir imagen de portada
                </p>
                <p className="text-xs mt-1" style={{ color: 'var(--text-muted, #9ca3af)' }}>
                  JPG, PNG o WEBP — máx. 5MB
                </p>
              </>
            )}
          </div>
        )}
      </div>
      {error && <p className="text-xs text-red-500">{error}</p>}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
      />
    </div>
  );
}

// ── Página principal ──────────────────────────────────────────────────────────
export default function MiPaginaPage() {
  const { brand: authBrand } = useAuth();
  const [brand, setBrand] = useState<Brand | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [landingPrice, setLandingPrice] = useState<number | null>(null);

  // Campos del formulario
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
        if (raw.schedule && typeof raw.schedule === 'object') {
          setSchedule(prev => ({ ...prev, ...raw.schedule }));
        }
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

      // Validar que el color sea un hex completo (#RRGGBB) antes de enviar
      const hexRegex = /^#[0-9A-Fa-f]{6}$/;
      const safeColor = hexRegex.test(primaryColor) ? primaryColor : '#FF5C3A';

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
        primary_color: safeColor,
        rating: rating ? parseFloat(rating) : null,
        total_reviews: totalReviews ? parseInt(totalReviews, 10) : null,
        schedule: Object.fromEntries(Object.entries(schedule).filter(([, v]) => v.trim())),
      });

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
      <div className="flex items-center justify-center py-16">
        <Spinner size="lg" />
      </div>
    );
  }

  const slug = brand?.slug || authBrand?.slug || '';
  const pageUrl = `${FRONTEND_URL}/sitio/${slug}`;
  const hasLandingPage = (brand as any)?.has_landing_page ?? false;
  const brandLogo = logoUrl || (brand as any)?.logo || null;

  // Calcular días restantes antes de eliminación definitiva
  const landingSuspendedAt: string | null = (brand as any)?.landing_suspended_at ?? null;
  const diasParaEliminacion: number | null = (() => {
    if (!landingSuspendedAt) return null;
    const suspendidaHace = Date.now() - new Date(landingSuspendedAt).getTime();
    const diasTranscurridos = Math.floor(suspendidaHace / (1000 * 60 * 60 * 24));
    const restantes = 90 - diasTranscurridos;
    return restantes > 0 ? restantes : 0;
  })();

  const brandId = (brand as any)?.id;

  return (
    <>
      {hasLandingPage && brandId && (
        <LandingTutorial brandId={brandId} />
      )}
    <div className="grid grid-cols-1 xl:grid-cols-[1fr_380px] gap-6 items-start w-full">
      {/* ── Columna izquierda: formulario ── */}
      <div className="space-y-6 min-w-0">
      {/* Encabezado */}
      <div>
        <h1 className="font-syne font-bold text-2xl" style={{ color: 'var(--text-primary)' }}>
          Mi página
        </h1>
        <p className="text-sm mt-0.5" style={{ color: 'var(--text-secondary)' }}>
          Personaliza tu mini-landing pública con información de tu marca
        </p>
      </div>

      {/* URL de la página */}
      <div
        className="p-5 rounded-2xl border space-y-3"
        style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}
      >
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
            URL de tu página
          </p>
          {hasLandingPage ? (
            <span className="text-xs px-2.5 py-1 rounded-full font-medium text-white" style={{ backgroundColor: '#22c55e' }}>
              Activa
            </span>
          ) : (
            <span className="text-xs px-2.5 py-1 rounded-full font-medium" style={{ backgroundColor: 'var(--bg-base)', color: 'var(--text-secondary)', border: '1px solid var(--border-color)' }}>
              Sin activar
            </span>
          )}
        </div>
        <CopyableUrl url={pageUrl} />
        {!hasLandingPage && (
          <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
            Tu página ya es visible pero muestra un banner de activación. Para removerlo, activa tu página
            {landingPrice !== null
              ? <> por <strong style={{ color: 'var(--text-primary)' }}>${landingPrice.toLocaleString('es-CO')} COP</strong></>
              : null
            }{' '}contactando a soporte.
          </p>
        )}
      </div>

      {/* Banner de suspensión de mini-landing */}
      {landingSuspendedAt && (
        <div
          className="flex items-start gap-3 px-4 py-4 rounded-xl border"
          style={{ backgroundColor: '#1a0a00', borderColor: '#FF5C3A44' }}
        >
          {/* Icono advertencia */}
          <svg
            className="w-5 h-5 flex-shrink-0 mt-0.5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="#FF5C3A"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
          </svg>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold" style={{ color: '#FF5C3A' }}>
              Tu mini-landing está suspendida
            </p>
            <p className="text-xs mt-1" style={{ color: '#aaa' }}>
              Tu página no es visible públicamente por falta de pago.
              {diasParaEliminacion !== null && diasParaEliminacion > 0 ? (
                <>
                  {' '}Será eliminada definitivamente en{' '}
                  <strong style={{ color: '#f5f2ee' }}>{diasParaEliminacion} días</strong>.
                  Renueva tu suscripción para reactivarla.
                </>
              ) : (
                <> El plazo de recuperación ha vencido.</>
              )}
            </p>
            <a
              href="/dashboard/checkout"
              className="inline-flex items-center gap-1.5 mt-2 text-xs font-semibold px-3 py-1.5 rounded-lg transition-opacity hover:opacity-80"
              style={{ backgroundColor: '#FF5C3A', color: '#fff' }}
            >
              {/* Icono renovar */}
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                <path d="M3 3v5h5" />
                <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16" />
                <path d="M16 16h5v5" />
              </svg>
              Renovar suscripción
            </a>
          </div>
        </div>
      )}

      {/* Alertas */}
      {error && (
        <div className="flex items-start gap-2 px-4 py-3 rounded-xl border border-red-200 bg-red-50 text-red-700 text-sm">
          <svg className="w-4 h-4 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
          </svg>
          {error}
        </div>
      )}
      {success && (
        <div className="flex items-start gap-2 px-4 py-3 rounded-xl border border-emerald-200 bg-emerald-50 text-emerald-700 text-sm">
          <CheckIcon className="w-4 h-4 flex-shrink-0 mt-0.5" />
          Cambios guardados correctamente
        </div>
      )}

      {/* Formulario */}
      <div
        className="p-5 rounded-2xl border space-y-5"
        style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}
      >
        <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
          Contenido de la página
        </p>

        {/* Logo de la marca */}
        <div className="space-y-1.5">
          <label className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
            Logo de la marca
          </label>
          <div className="flex items-start gap-4">
            <LogoUpload
              currentUrl={logoUrl || null}
              onUpload={url => setLogoUrl(url)}
            />
            {logoUrl && (
              <button
                onClick={() => setLogoUrl('')}
                className="text-xs text-red-500 hover:text-red-600 transition-colors mt-1"
              >
                Eliminar logo
              </button>
            )}
          </div>
        </div>

        {/* Logos light / dark */}
        <div className="space-y-3">
          <label className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
            Versiones del logo por fondo
          </label>
          <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
            Sube versiones alternativas para que el logo no se pierda según el color de fondo de cada template.
          </p>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <p className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>Para fondos oscuros</p>
              <div className="flex items-start gap-3">
                <LogoUpload
                  currentUrl={logoLightUrl || null}
                  onUpload={url => setLogoLightUrl(url)}
                />
                {logoLightUrl && (
                  <button onClick={() => setLogoLightUrl('')} className="text-xs text-red-500 hover:text-red-600 transition-colors mt-1">
                    Eliminar
                  </button>
                )}
              </div>
            </div>
            <div className="space-y-1.5">
              <p className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>Para fondos claros</p>
              <div className="flex items-start gap-3">
                <LogoUpload
                  currentUrl={logoDarkUrl || null}
                  onUpload={url => setLogoDarkUrl(url)}
                />
                {logoDarkUrl && (
                  <button onClick={() => setLogoDarkUrl('')} className="text-xs text-red-500 hover:text-red-600 transition-colors mt-1">
                    Eliminar
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Imagen de portada */}
        <div className="space-y-1.5">
          <label className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
            Imagen de portada
          </label>
          <CoverImageUpload
            currentUrl={coverImageUrl || null}
            onUpload={url => setCoverImageUrl(url)}
            primaryColor={primaryColor}
          />
          {coverImageUrl && (
            <button
              onClick={() => setCoverImageUrl('')}
              className="text-xs text-red-500 hover:text-red-600 transition-colors"
            >
              Eliminar imagen
            </button>
          )}
        </div>

        {/* Color de fondo del hero */}
        <div className="space-y-1.5">
          <label className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
            Color de fondo del hero
          </label>
          <div className="flex items-center gap-3">
            <div className="relative w-10 h-10 rounded-xl overflow-hidden border flex-shrink-0 cursor-pointer" style={{ borderColor: 'var(--border-color)' }}>
              <input
                type="color"
                value={coverBgColor || '#1a1a1a'}
                onChange={e => setCoverBgColor(e.target.value)}
                className="absolute inset-0 w-full h-full cursor-pointer opacity-0"
              />
              <div className="w-full h-full rounded-xl" style={{ backgroundColor: coverBgColor || '#1a1a1a' }} />
            </div>
            <input
              type="text"
              value={coverBgColor}
              onChange={e => { if (/^#[0-9A-Fa-f]{0,6}$/.test(e.target.value)) setCoverBgColor(e.target.value); }}
              maxLength={7}
              placeholder="#1a1a1a (opcional)"
              className="flex-1 px-4 py-2.5 rounded-xl border text-sm font-mono outline-none"
              style={{ backgroundColor: 'var(--bg-base)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
            />
            {coverBgColor && (
              <button
                onClick={() => setCoverBgColor('')}
                className="text-xs text-red-500 hover:text-red-600 transition-colors"
              >
                Limpiar
              </button>
            )}
          </div>
          <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
            Se usa como fondo cuando no hay imagen de portada, o como color base detrás de la imagen.
          </p>
        </div>

        {/* Opacidad del overlay sobre la imagen */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
              Oscuridad del overlay sobre la imagen
            </label>
            <span className="text-sm font-mono tabular-nums" style={{ color: 'var(--text-secondary)' }}>
              {Math.round(coverOverlayOpacity * 100)}%
            </span>
          </div>
          <input
            type="range"
            min={0}
            max={1}
            step={0.05}
            value={coverOverlayOpacity}
            onChange={e => setCoverOverlayOpacity(parseFloat(e.target.value))}
            className="w-full h-2 rounded-full appearance-none cursor-pointer"
            style={{
              accentColor: '#FF5C3A',
              background: `linear-gradient(to right, #FF5C3A ${coverOverlayOpacity * 100}%, var(--border-color) ${coverOverlayOpacity * 100}%)`,
            }}
          />
          <div className="flex justify-between text-xs" style={{ color: 'var(--text-muted)' }}>
            <span>Sin oscurecer (imagen pura)</span>
            <span>Muy oscuro</span>
          </div>
          <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
            Controla cuánto se oscurece la imagen de portada. 0% muestra la imagen sin filtro.
          </p>
        </div>

        {/* Slogan */}
        <div className="space-y-1.5">
          <label className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
            Slogan
          </label>
          <input
            type="text"
            value={slogan}
            onChange={e => setSlogan(e.target.value)}
            maxLength={80}
            placeholder="Ej: Ropa hermosa a tu alcance"
            className="w-full px-4 py-3 rounded-xl border text-sm outline-none transition-colors"
            style={{ backgroundColor: 'var(--bg-base)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
          />
        </div>

        {/* Descripción */}
        <div className="space-y-1.5">
          <label className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
            Descripción de la marca
          </label>
          <textarea
            value={description}
            onChange={e => setDescription(e.target.value)}
            rows={3}
            maxLength={300}
            placeholder="Cuéntale a tus clientes qué hace especial a tu marca..."
            className="w-full px-4 py-3 rounded-xl border text-sm resize-none outline-none transition-colors"
            style={{
              backgroundColor: 'var(--bg-base)',
              borderColor: 'var(--border-color)',
              color: 'var(--text-primary)',
            }}
          />
          <p className="text-xs text-right" style={{ color: 'var(--text-secondary)' }}>
            {description.length}/300
          </p>
        </div>

        {/* WhatsApp */}
        <div className="space-y-1.5">
          <label className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
            WhatsApp de contacto
          </label>
          <div className="flex items-center gap-2">
            <span className="text-sm px-3 py-3 rounded-xl border" style={{ backgroundColor: 'var(--bg-base)', borderColor: 'var(--border-color)', color: 'var(--text-secondary)' }}>
              +
            </span>
            <input
              type="tel"
              value={whatsapp}
              onChange={e => setWhatsapp(e.target.value)}
              placeholder="573001234567"
              className="flex-1 px-4 py-3 rounded-xl border text-sm outline-none transition-colors"
              style={{
                backgroundColor: 'var(--bg-base)',
                borderColor: 'var(--border-color)',
                color: 'var(--text-primary)',
              }}
            />
          </div>
          <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
            Número completo con código de país, sin espacios ni guiones
          </p>
        </div>

        {/* Redes sociales */}
        <div className="space-y-3">
          <label className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
            Redes sociales
          </label>
          {[
            { key: 'instagram', label: 'Instagram', value: instagram, setter: setInstagram, placeholder: 'https://instagram.com/tumarca' },
            { key: 'facebook',  label: 'Facebook',  value: facebook,  setter: setFacebook,  placeholder: 'https://facebook.com/tumarca' },
            { key: 'tiktok',    label: 'TikTok',    value: tiktok,    setter: setTiktok,    placeholder: 'https://tiktok.com/@tumarca' },
          ].map(({ key, label, value, setter, placeholder }) => (
            <div key={key} className="flex items-center gap-3">
              <span
                className="w-24 text-xs font-medium flex-shrink-0"
                style={{ color: 'var(--text-secondary)' }}
              >
                {label}
              </span>
              <input
                type="url"
                value={value}
                onChange={e => setter(e.target.value)}
                placeholder={placeholder}
                className="flex-1 px-4 py-2.5 rounded-xl border text-sm outline-none transition-colors"
                style={{
                  backgroundColor: 'var(--bg-base)',
                  borderColor: 'var(--border-color)',
                  color: 'var(--text-primary)',
                }}
              />
            </div>
          ))}
        </div>

        {/* Ciudad y envíos */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>Dirección completa</label>
            <input
              type="text"
              value={cityDisplay}
              onChange={e => setCityDisplay(e.target.value)}
              placeholder="Ej: Calle 80 #15-20, Bogotá, Colombia"
              className="w-full px-4 py-3 rounded-xl border text-sm outline-none"
              style={{ backgroundColor: 'var(--bg-base)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>Envíos nacionales</label>
            <div className="flex items-center gap-3 px-4 py-3 rounded-xl border" style={{ backgroundColor: 'var(--bg-base)', borderColor: 'var(--border-color)' }}>
              <input
                type="checkbox"
                id="national_shipping"
                checked={nationalShipping}
                onChange={e => setNationalShipping(e.target.checked)}
                className="w-4 h-4 rounded"
              />
              <label htmlFor="national_shipping" className="text-sm" style={{ color: 'var(--text-primary)' }}>
                Sí, envío a todo el país
              </label>
            </div>
          </div>
        </div>

        {/* Mostrar nombre de marca en navbar */}
        <div className="space-y-1.5">
          <label className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>Nombre en el navbar</label>
          <div className="flex items-center gap-3 px-4 py-3 rounded-xl border" style={{ backgroundColor: 'var(--bg-base)', borderColor: 'var(--border-color)' }}>
            <input
              type="checkbox"
              id="show_brand_name"
              checked={showBrandName}
              onChange={e => setShowBrandName(e.target.checked)}
              className="w-4 h-4 rounded"
            />
            <label htmlFor="show_brand_name" className="text-sm" style={{ color: 'var(--text-primary)' }}>
              Mostrar nombre de la marca en el encabezado
            </label>
          </div>
          <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
            Desactívalo si prefieres mostrar solo el logo sin texto
          </p>
        </div>

        {/* Mensaje WhatsApp y CTA */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>Mensaje WhatsApp</label>
            <input
              type="text"
              value={whatsappMessage}
              onChange={e => setWhatsappMessage(e.target.value)}
              placeholder="Ej: Hola, vi tu catálogo..."
              className="w-full px-4 py-3 rounded-xl border text-sm outline-none"
              style={{ backgroundColor: 'var(--bg-base)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>Texto botón CTA</label>
            <input
              type="text"
              value={ctaButtonText}
              onChange={e => setCtaButtonText(e.target.value)}
              placeholder="Ej: Probarme esto"
              className="w-full px-4 py-3 rounded-xl border text-sm outline-none"
              style={{ backgroundColor: 'var(--bg-base)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
            />
          </div>
        </div>

        {/* Template de landing */}
        <div className="space-y-2">
          <label className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
            Diseño de la página
          </label>
          <div className="grid grid-cols-3 gap-3">
            {([
              { value: 'classic',   label: 'Clásico',   desc: 'Hero + pasos + catálogo + probador' },
              { value: 'editorial', label: 'Editorial',  desc: 'Header sticky + layout 2 columnas' },
              { value: 'moderno',   label: 'Moderno',    desc: 'Single col · Playfair · Trust bar' },
            ] as const).map(t => (
              <button
                key={t.value}
                type="button"
                onClick={() => setLandingTemplate(t.value)}
                className="text-left p-4 rounded-xl border-2 transition-all"
                style={{
                  borderColor: landingTemplate === t.value ? primaryColor : 'var(--border-color)',
                  backgroundColor: landingTemplate === t.value ? primaryColor + '10' : 'var(--bg-base)',
                }}
              >
                <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{t.label}</p>
                <p className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>{t.desc}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Color principal */}
        <div className="space-y-1.5">
          <label className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
            Color principal de la marca
          </label>
          <div className="flex items-center gap-3">
            <div className="relative w-12 h-12 rounded-xl overflow-hidden border flex-shrink-0 cursor-pointer" style={{ borderColor: 'var(--border-color)' }}>
              <input
                type="color"
                value={primaryColor}
                onChange={e => setPrimaryColor(e.target.value)}
                className="absolute inset-0 w-full h-full cursor-pointer opacity-0"
                title="Seleccionar color"
              />
              <div className="w-full h-full rounded-xl" style={{ backgroundColor: primaryColor }} />
            </div>
            <input
              type="text"
              value={primaryColor}
              onChange={e => { if (/^#[0-9A-Fa-f]{0,6}$/.test(e.target.value)) setPrimaryColor(e.target.value); }}
              maxLength={7}
              placeholder="#FF5C3A"
              className="flex-1 px-4 py-3 rounded-xl border text-sm font-mono outline-none"
              style={{ backgroundColor: 'var(--bg-base)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
            />
            <div className="flex gap-1.5 flex-wrap">
              {['#FF5C3A','#6366f1','#0ea5e9','#10b981','#f59e0b','#ec4899','#0f0f0f'].map(c => (
                <button key={c} type="button" onClick={() => setPrimaryColor(c)}
                  className="w-7 h-7 rounded-lg border-2 transition-all hover:scale-110"
                  style={{ backgroundColor: c, borderColor: primaryColor === c ? 'var(--text-primary)' : 'transparent' }}
                  title={c}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Rating y reseñas */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>Valoración (ej: 4.9)</label>
            <input
              type="number"
              value={rating}
              onChange={e => setRating(e.target.value)}
              min={0} max={5} step={0.1}
              placeholder="4.9"
              className="w-full px-4 py-3 rounded-xl border text-sm outline-none"
              style={{ backgroundColor: 'var(--bg-base)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>Total de reseñas</label>
            <input
              type="number"
              value={totalReviews}
              onChange={e => setTotalReviews(e.target.value)}
              min={0}
              placeholder="847"
              className="w-full px-4 py-3 rounded-xl border text-sm outline-none"
              style={{ backgroundColor: 'var(--bg-base)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
            />
          </div>
        </div>

        {/* Horarios */}
        <div className="space-y-2">
          <label className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
            Horario de atención
          </label>
          <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>Deja en blanco los días que no apliquen. Escribe "Cerrado" para indicar cierre.</p>
          <div className="space-y-2">
            {([
              { key: 'lunes',     label: 'Lunes' },
              { key: 'martes',    label: 'Martes' },
              { key: 'miercoles', label: 'Miércoles' },
              { key: 'jueves',    label: 'Jueves' },
              { key: 'viernes',   label: 'Viernes' },
              { key: 'sabado',    label: 'Sábado' },
              { key: 'domingo',   label: 'Domingo' },
            ] as const).map(({ key, label }) => (
              <div key={key} className="flex items-center gap-3">
                <span className="w-24 text-xs font-medium flex-shrink-0" style={{ color: 'var(--text-secondary)' }}>{label}</span>
                <input
                  type="text"
                  value={schedule[key] || ''}
                  onChange={e => setSchedule(prev => ({ ...prev, [key]: e.target.value }))}
                  placeholder="Ej: 9:00 AM – 6:00 PM"
                  className="flex-1 px-4 py-2.5 rounded-xl border text-sm outline-none"
                  style={{ backgroundColor: 'var(--bg-base)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
                />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Botón guardar */}
      <div className="flex items-center gap-3">
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-6 py-3 rounded-xl text-white text-sm font-semibold transition-opacity disabled:opacity-60 flex items-center gap-2"
          style={{ backgroundColor: primaryColor }}
        >
          {saving && <Spinner size="sm" />}
          {saving ? 'Guardando...' : 'Guardar cambios'}
        </button>
        <a
          href={pageUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="px-6 py-3 rounded-xl text-sm font-semibold border transition-colors flex items-center gap-2"
          style={{
            borderColor: 'var(--border-color)',
            color: 'var(--text-primary)',
            backgroundColor: 'var(--bg-card)',
          }}
        >
          <ExternalLinkIcon className="w-4 h-4" />
          Ver mi página
        </a>
      </div>
    </div> {/* fin columna izquierda */}

    {/* ── Columna derecha: preview sticky ── */}
    <div className="hidden xl:block">
      <div className="sticky top-20 space-y-4">
        <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: 'var(--text-secondary)' }}>
          Vista previa del diseño
        </p>

        {/* Preview Classic */}
        <button
          type="button"
          onClick={() => setLandingTemplate('classic')}
          className="w-full text-left rounded-2xl overflow-hidden border-2 transition-all"
          style={{
            borderColor: landingTemplate === 'classic' ? primaryColor : 'var(--border-color)',
            boxShadow: landingTemplate === 'classic' ? `0 0 0 3px ${primaryColor}22` : 'none',
          }}
        >
          {/* Miniatura Classic */}
          <div className="relative bg-white overflow-hidden" style={{ height: 200 }}>
            {/* Hero */}
            <div className="h-20 flex flex-col items-center justify-center gap-1" style={{ background: `linear-gradient(135deg, ${primaryColor}dd, ${primaryColor}88)` }}>
              {brandLogo
                ? <img src={brandLogo} alt="" className="h-6 object-contain" />
                : <div className="w-16 h-3 rounded-full bg-white/60" />}
              <div className="w-24 h-2 rounded-full bg-white/80 mt-1" />
              <div className="w-16 h-1.5 rounded-full bg-white/50" />
            </div>
            {/* Pasos */}
            <div className="flex gap-1.5 px-3 py-2 bg-gray-50">
              {[1,2,3].map(n => (
                <div key={n} className="flex-1 bg-white rounded-md p-1.5 border border-gray-100 flex flex-col items-center gap-0.5">
                  <div className="w-3 h-3 rounded-full text-white text-[6px] flex items-center justify-center font-bold" style={{ backgroundColor: primaryColor }}>{n}</div>
                  <div className="w-8 h-1 rounded-full bg-gray-200" />
                </div>
              ))}
            </div>
            {/* Catálogo */}
            <div className="grid grid-cols-4 gap-1 px-3 pb-2">
              {[0,1,2,3].map(i => (
                <div key={i} className="aspect-square rounded-md bg-gray-100 border border-gray-200" />
              ))}
            </div>
            {/* Overlay seleccionado */}
            {landingTemplate === 'classic' && (
              <div className="absolute inset-0 flex items-end justify-end p-2 pointer-events-none">
                <span className="text-white text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ backgroundColor: primaryColor }}>Activo</span>
              </div>
            )}
          </div>
          <div className="px-3 py-2.5" style={{ backgroundColor: 'var(--bg-card)' }}>
            <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Clásico</p>
            <p className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>Hero · Pasos · Catálogo · Probador</p>
          </div>
        </button>

        {/* Preview Editorial */}
        <button
          type="button"
          onClick={() => setLandingTemplate('editorial')}
          className="w-full text-left rounded-2xl overflow-hidden border-2 transition-all"
          style={{
            borderColor: landingTemplate === 'editorial' ? primaryColor : 'var(--border-color)',
            boxShadow: landingTemplate === 'editorial' ? `0 0 0 3px ${primaryColor}22` : 'none',
          }}
        >
          {/* Miniatura Editorial */}
          <div className="relative bg-[#f7f5f2] overflow-hidden" style={{ height: 200 }}>
            {/* Header sticky */}
            <div className="h-7 bg-white border-b border-gray-100 flex items-center px-2 gap-1.5">
              {brandLogo
                ? <img src={brandLogo} alt="" className="h-4 w-4 rounded object-cover" />
                : <div className="w-4 h-4 rounded bg-gray-900" />}
              <div className="w-12 h-1.5 rounded-full bg-gray-800" />
              <div className="ml-auto flex gap-1">
                <div className="w-4 h-4 rounded bg-gray-100 border border-gray-200" />
                <div className="w-4 h-4 rounded bg-gray-100 border border-gray-200" />
              </div>
            </div>
            {/* Cover */}
            <div className="h-14 flex items-end px-2 pb-1.5" style={{ background: 'linear-gradient(135deg,#1a1a2e,#0f3460)' }}>
              <div className="space-y-0.5">
                <div className="w-8 h-1 rounded-full bg-white/40" />
                <div className="w-16 h-2 rounded-full bg-white/90" />
              </div>
            </div>
            {/* Stats bar */}
            <div className="h-6 bg-white border-b border-gray-100 flex items-center gap-3 px-2">
              {['3 prod.','4.8 ★','IA'].map(s => (
                <span key={s} className="text-[7px] text-gray-500 font-medium">{s}</span>
              ))}
            </div>
            {/* Layout 2 cols */}
            <div className="grid grid-cols-[1fr_80px] gap-1.5 px-2 pt-2">
              <div className="grid grid-cols-3 gap-1">
                {[0,1,2].map(i => (
                  <div key={i} className={`aspect-square rounded bg-gray-200 border ${i===0 ? 'border-[#FF5C3A]' : 'border-gray-200'}`} />
                ))}
              </div>
              <div className="bg-white rounded border border-gray-200 flex flex-col">
                <div className="h-4 rounded-t" style={{ backgroundColor: '#0a0a0a' }} />
                <div className="flex-1 p-1 space-y-1">
                  <div className="w-full h-1 rounded-full bg-gray-100" />
                  <div className="w-3/4 h-1 rounded-full bg-gray-100" />
                </div>
              </div>
            </div>
            {/* Overlay seleccionado */}
            {landingTemplate === 'editorial' && (
              <div className="absolute inset-0 flex items-end justify-end p-2 pointer-events-none">
                <span className="text-white text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ backgroundColor: primaryColor }}>Activo</span>
              </div>
            )}
          </div>
          <div className="px-3 py-2.5" style={{ backgroundColor: 'var(--bg-card)' }}>
            <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Editorial</p>
            <p className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>Header sticky · 2 columnas · Panel probador</p>
          </div>
        </button>

        {/* Preview Moderno */}
        <button
          type="button"
          onClick={() => setLandingTemplate('moderno')}
          className="w-full text-left rounded-2xl overflow-hidden border-2 transition-all"
          style={{
            borderColor: landingTemplate === 'moderno' ? primaryColor : 'var(--border-color)',
            boxShadow: landingTemplate === 'moderno' ? `0 0 0 3px ${primaryColor}22` : 'none',
          }}
        >
          {/* Miniatura Moderno */}
          <div className="relative overflow-hidden" style={{ height: 200, backgroundColor: '#0f0f0f' }}>
            {/* Nav */}
            <div className="h-7 flex items-center px-2 gap-1.5 border-b border-white/10">
              <div className="w-4 h-4 rounded flex items-center justify-center flex-shrink-0" style={{ backgroundColor: primaryColor }}>
                <div className="w-2 h-2 rounded-sm bg-white/80" />
              </div>
              <div className="w-14 h-1.5 rounded-full bg-white/60" />
              <div className="ml-auto flex gap-1">
                <div className="w-4 h-4 rounded-full border border-white/20" />
                <div className="w-4 h-4 rounded-full border border-white/20" />
              </div>
            </div>
            {/* Hero dark */}
            <div className="flex flex-col items-center justify-center gap-1.5 py-4 px-3">
              <div className="flex items-center gap-1 px-2 py-0.5 rounded-full border" style={{ borderColor: primaryColor + '60', backgroundColor: primaryColor + '18' }}>
                <div className="w-1 h-1 rounded-full" style={{ backgroundColor: primaryColor }} />
                <div className="w-10 h-1 rounded-full" style={{ backgroundColor: primaryColor + '80' }} />
              </div>
              <div className="w-28 h-2.5 rounded-full bg-white/80 mt-0.5" />
              <div className="w-20 h-2 rounded-full mt-0.5" style={{ backgroundColor: primaryColor + 'cc' }} />
              <div className="w-16 h-1 rounded-full bg-white/30 mt-0.5" />
            </div>
            {/* Trust bar */}
            <div className="grid grid-cols-4 border-t border-b border-white/10" style={{ backgroundColor: '#1a1a1a' }}>
              {['4.9','847','12s','96%'].map(v => (
                <div key={v} className="flex flex-col items-center py-1.5 border-r border-white/10 last:border-r-0">
                  <span className="text-[8px] font-bold text-white/80">{v}</span>
                  <span className="text-[6px] text-white/30 mt-0.5">stat</span>
                </div>
              ))}
            </div>
            {/* Products grid */}
            <div className="grid grid-cols-4 gap-1 px-2 pt-2">
              {[0,1,2,3].map(i => (
                <div key={i} className="aspect-square rounded-lg border" style={{ backgroundColor: '#2a2a2a', borderColor: i === 0 ? primaryColor : '#333' }} />
              ))}
            </div>
            {/* Overlay seleccionado */}
            {landingTemplate === 'moderno' && (
              <div className="absolute inset-0 flex items-end justify-end p-2 pointer-events-none">
                <span className="text-white text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ backgroundColor: primaryColor }}>Activo</span>
              </div>
            )}
          </div>
          <div className="px-3 py-2.5" style={{ backgroundColor: 'var(--bg-card)' }}>
            <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Moderno</p>
            <p className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>Dark hero · Trust bar · Single col</p>
          </div>
        </button>

        {/* Botón ver página */}
        <a
          href={pageUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 w-full px-4 py-3 rounded-xl text-sm font-semibold border transition-colors"
          style={{ borderColor: 'var(--border-color)', color: 'var(--text-primary)', backgroundColor: 'var(--bg-card)' }}
        >
          <ExternalLinkIcon className="w-4 h-4" />
          Ver mi página en vivo
        </a>
      </div>
    </div>
  </div>
    </>
  );
}

