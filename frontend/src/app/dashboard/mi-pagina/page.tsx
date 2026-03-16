'use client';

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { brandsService } from '@/services/brands.service';
import { authService } from '@/services/auth.service';
import { api } from '@/services/api';
import { Spinner } from '@/components/ui/Spinner';
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
      const formData = new FormData();
      formData.append('image', file);
      const token = authService.getToken();
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'https://api.pruebalo.wilkiedevs.com'}/api/upload`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      if (!res.ok) throw new Error('Error al subir imagen');
      const data = await res.json();
      onUpload(data.url);
    } catch {
      setError('Error al subir la imagen');
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
  const [landingTemplate, setLandingTemplate] = useState<'classic' | 'editorial'>('classic');
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
        const links = raw.social_links || {};
        setInstagram(links.instagram || '');
        setFacebook(links.facebook || '');
        setTiktok(links.tiktok || '');
        setCityDisplay(raw.city_display || '');
        setNationalShipping(raw.national_shipping ?? false);
        setLandingTemplate(raw.landing_template || 'classic');
      })
      .catch(() => setError('Error al cargar los datos'))
      .finally(() => setLoading(false));
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
        social_links,
        city_display: cityDisplay || null,
        national_shipping: nationalShipping,
        landing_template: landingTemplate,
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
  const primaryColor = (brand as any)?.primary_color || brand?.primaryColor || '#FF5C3A';
  const hasLandingPage = (brand as any)?.has_landing_page ?? false;

  return (
    <div className="space-y-6 max-w-2xl">
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
            Tu página ya es visible pero muestra un banner de activación. Para removerlo, activa tu página por $500.000 COP contactando a soporte.
          </p>
        )}
      </div>

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
            <label className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>Ciudad</label>
            <input
              type="text"
              value={cityDisplay}
              onChange={e => setCityDisplay(e.target.value)}
              placeholder="Ej: Bogotá, Colombia"
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
          <div className="grid grid-cols-2 gap-3">
            {([
              { value: 'classic', label: 'Clásico', desc: 'Hero + pasos + catálogo + probador' },
              { value: 'editorial', label: 'Editorial', desc: 'Header sticky + layout 2 columnas' },
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
    </div>
  );
}
