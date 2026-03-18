'use client';

import { useState, useEffect } from 'react';
import { TryOnWidget } from '@/components/tryon/TryOnWidget';

interface BrandData {
  id: string;
  name: string;
  slug: string;
  logo?: string;
  primary_color: string;
  secondary_color: string;
  brand_description?: string | null;
  slogan?: string | null;
  whatsapp_contact?: string | null;
  whatsapp_message?: string | null;
  cta_button_text?: string | null;
  cover_image_url?: string | null;
  social_links?: Record<string, string>;
  has_landing_page?: boolean;
  modal_title?: string | null;
  modal_description?: string | null;
  modal_features?: string[] | null;
  city_display?: string | null;
  national_shipping?: boolean;
  rating?: number | null;
  total_reviews?: number | null;
  landing_template?: 'classic' | 'editorial' | 'moderno';
  schedule?: Record<string, string> | null;
  logo_light?: string | null;
  logo_dark?: string | null;
  cover_bg_color?: string | null;
  cover_overlay_opacity?: number | null;
  show_brand_name?: boolean | null;
}

interface ProductData {
  id: string;
  name: string;
  image_url: string;
  category: string;
  description?: string;
  price?: number | null;
  badge?: 'nuevo' | 'top' | 'oferta' | null;
}

interface MiniLandingProps {
  brandSlug: string;
  initialData: { brand: BrandData; products: ProductData[] } | null;
  footerUrl?: string;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.pruebalo.wilkiedevs.com';

// -- Iconos --------------------------------------------------------------------
function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  );
}

function InstagramIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
    </svg>
  );
}

function FacebookIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
    </svg>
  );
}

function TikTokIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z" />
    </svg>
  );
}

function ChevronDownIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
    </svg>
  );
}

function SparklesIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456z" />
    </svg>
  );
}

function MapPinIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  );
}

function TruckIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10l2 1h8zM13 8h4l3 5v3h-7V8z" />
    </svg>
  );
}

function StarIcon({ className, filled }: { className?: string; filled?: boolean }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill={filled ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
    </svg>
  );
}

function PhoneIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 7V5z" />
    </svg>
  );
}

// -- Shared: Preview Banner (top header durante modo preview) -----------------
const PREVIEW_DURATION = 3 * 60; // 3 minutos en segundos

function PreviewBanner({
  primaryColor,
  onExpired,
}: {
  primaryColor: string;
  onExpired: () => void;
}) {
  const [seconds, setSeconds] = useState(PREVIEW_DURATION);

  useEffect(() => {
    const t = setInterval(() => {
      setSeconds(s => {
        if (s <= 1) { clearInterval(t); onExpired(); return 0; }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(t);
  }, [onExpired]);

  const mm = String(Math.floor(seconds / 60)).padStart(2, '0');
  const ss = String(seconds % 60).padStart(2, '0');

  // Color de fondo llamativo: usamos el primaryColor con alta saturación
  return (
    <div
      className="fixed top-0 left-0 right-0 z-[9998] flex items-center justify-between px-4 py-2.5 text-white text-xs font-semibold shadow-lg"
      style={{ backgroundColor: primaryColor, boxShadow: `0 2px 12px ${primaryColor}80` }}
    >
      <div className="flex items-center gap-2">
        {/* Icono ojo */}
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
          <circle cx="12" cy="12" r="3" />
        </svg>
        <span>Vista previa — activa tu pagina para que tus clientes la vean</span>
      </div>
      <div className="flex items-center gap-3 flex-shrink-0">
        <span className="tabular-nums font-black text-sm opacity-90">{mm}:{ss}</span>
        <a
          href="/checkout?plan=LANDING"
          className="px-3 py-1 rounded-lg text-xs font-bold transition-all hover:opacity-90"
          style={{ backgroundColor: 'rgba(0,0,0,0.25)', border: '1px solid rgba(255,255,255,0.3)' }}
        >
          Activar ahora
        </a>
      </div>
    </div>
  );
}

// -- Shared: Modal de activacion (bloqueante) ----------------------------------
interface ActivationModalProps {
  primaryColor: string;
  brandName?: string;
  modalTitle?: string | null;
  modalDescription?: string | null;
  modalFeatures?: string[] | null;
  onPreview?: () => void;
}

function ActivationModal({
  primaryColor,
  brandName,
  modalTitle,
  modalDescription,
  modalFeatures,
  onPreview,
}: ActivationModalProps) {
  const CHECKOUT_URL = '/checkout?plan=LANDING';
  const title = modalTitle || (brandName ? `Activa la pagina de ${brandName}` : 'Activa tu pagina');
  const description = modalDescription || 'Esta pagina aun no esta activa. Activala para que tus clientes puedan verla.';

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.55)' }}
    >
      <div
        className="w-full max-w-xs rounded-2xl overflow-hidden shadow-xl"
        style={{ backgroundColor: 'var(--bg-card, #fff)', border: '1px solid var(--border-color, #e5e7eb)' }}
      >
        {/* Franja de color de marca */}
        <div className="h-1 w-full" style={{ backgroundColor: primaryColor }} />

        <div className="px-5 py-5">
          <h2 className="text-base font-bold mb-1" style={{ color: 'var(--text-primary, #111827)', fontFamily: 'Syne, sans-serif' }}>
            {title}
          </h2>
          <p className="text-xs mb-4 leading-relaxed" style={{ color: 'var(--text-secondary, #6b7280)' }}>
            {description}
          </p>

          <a
            href={CHECKOUT_URL}
            className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl text-white text-sm font-semibold transition-opacity hover:opacity-90 mb-2"
            style={{ backgroundColor: primaryColor }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
            Ver planes y activar
          </a>

          {onPreview && (
            <button
              onClick={onPreview}
              className="w-full py-2 rounded-xl text-xs font-medium transition-opacity hover:opacity-70"
              style={{ color: 'var(--text-secondary, #6b7280)', backgroundColor: 'var(--bg-base, #f9fafb)', border: '1px solid var(--border-color, #e5e7eb)' }}
            >
              Ver como queda primero (3 min)
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// -- Shared: Boton flotante WhatsApp ------------------------------------------
function WhatsAppFAB({ phone, message }: { phone: string; message?: string | null }) {
  const clean = phone.replace(/\D/g, '');
  const url = message
    ? `https://wa.me/${clean}?text=${encodeURIComponent(message)}`
    : `https://wa.me/${clean}`;
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Contactar por WhatsApp"
      className="fixed bottom-6 right-6 z-50 group"
    >
      <div className="relative">
        {/* Tooltip */}
        <span className="absolute bottom-full right-0 mb-2 px-3 py-1.5 rounded-lg text-white text-xs font-medium whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" style={{ backgroundColor: '#0a0a0a' }}>
          Tienes dudas? Escribenos
        </span>
        {/* Badge */}
        <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center text-white text-[9px] font-bold border-2 border-white" style={{ backgroundColor: '#FF5C3A' }}>1</span>
        <div className="w-14 h-14 rounded-full flex items-center justify-center text-white shadow-xl hover:scale-105 active:scale-95 transition-transform" style={{ backgroundColor: '#25D366', boxShadow: '0 4px 16px rgba(37,211,102,.4)' }}>
          <WhatsAppIcon className="w-7 h-7" />
        </div>
      </div>
    </a>
  );
}

// -- Shared: Footer ------------------------------------------------------------
function LandingFooter({ primaryColor, footerUrl }: { primaryColor: string; footerUrl?: string }) {
  const url = footerUrl || 'https://pruebalo.wilkiedevs.com';
  const displayUrl = url.replace(/^https?:\/\//, '');
  return (
    <footer className="py-6 px-4 border-t border-gray-100 text-center">
      <p className="text-xs text-gray-400">
        Probador virtual impulsado por{' '}
        <a href={url.startsWith('http') ? url : `https://${url}`} target="_blank" rel="noopener noreferrer" className="font-medium hover:underline" style={{ color: primaryColor }}>
          {displayUrl}
        </a>
      </p>
    </footer>
  );
}

// -- Shared: Badge de producto -------------------------------------------------
function ProductBadge({ badge }: { badge: string }) {
  const styles: Record<string, { bg: string; color: string }> = {
    nuevo:  { bg: 'rgba(34,197,94,0.12)',  color: '#16a34a' },
    top:    { bg: 'rgba(234,179,8,0.12)',  color: '#ca8a04' },
    oferta: { bg: 'rgba(239,68,68,0.12)',  color: '#dc2626' },
  };
  const s = styles[badge] || { bg: 'rgba(0,0,0,0.06)', color: '#555' };
  return (
    <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold capitalize" style={{ backgroundColor: s.bg, color: s.color }}>
      {badge}
    </span>
  );
}

// -- Componente de imagen de producto con fallback ----------------------------
function ProductImage({ src, alt, className }: { src?: string | null; alt: string; className?: string }) {
  const [error, setError] = useState(false);

  // Resetear error cuando cambia el src
  useEffect(() => {
    setError(false);
  }, [src]);

  if (!src || error) {
    return (
      <div className={`w-full h-full flex items-center justify-center bg-gray-100 ${className || ''}`}>
        <svg className="w-8 h-8 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
        </svg>
      </div>
    );
  }
  return (
    <img
      src={src}
      alt={alt}
      className={className}
      onError={() => setError(true)}
      referrerPolicy="no-referrer"
    />
  );
}

// -- Componente de imagen de portada (cover) con fallback ---------------------
function CoverImage({ src, alt, className }: { src?: string | null; alt: string; className?: string }) {
  const [error, setError] = useState(false);

  useEffect(() => {
    setError(false);
  }, [src]);

  if (!src || error) return null;

  return (
    <img
      src={src}
      alt={alt}
      className={className}
      onError={() => setError(true)}
      referrerPolicy="no-referrer"
    />
  );
}

// -- Componente de logo de marca con fallback ---------------------------------
function BrandLogo({
  src,
  alt,
  className,
  fallbackInitials,
  fallbackBg,
  fallbackTextColor,
}: {
  src?: string | null;
  alt: string;
  className?: string;
  fallbackInitials?: string;
  fallbackBg?: string;
  fallbackTextColor?: string;
}) {
  const [error, setError] = useState(false);

  useEffect(() => {
    setError(false);
  }, [src]);

  if (!src || error) {
    if (fallbackInitials) {
      return (
        <div
          className="flex items-center justify-center font-bold"
          style={{ backgroundColor: fallbackBg || '#0a0a0a', color: fallbackTextColor || '#fff' }}
        >
          {fallbackInitials}
        </div>
      );
    }
    return null;
  }

  return (
    <img
      src={src}
      alt={alt}
      className={className}
      onError={() => setError(true)}
      referrerPolicy="no-referrer"
    />
  );
}

// ----------------------------------------------------------------------------
// TEMPLATE CLASSIC
// ----------------------------------------------------------------------------

function ClassicHero({ brand, onScrollDown }: { brand: BrandData; onScrollDown: () => void }) {
  const primary = brand.primary_color || '#FF5C3A';
  const hasCover = !!brand.cover_image_url;
  const overlayOpacity = brand.cover_overlay_opacity ?? 0.55;
  return (
    <section
      className="relative w-full min-h-[420px] md:min-h-[520px] flex flex-col items-center justify-center text-center px-6 py-20 overflow-hidden"
      style={{ background: brand.cover_bg_color || `linear-gradient(135deg, ${primary}ee 0%, ${primary}99 100%)` }}
    >
      {hasCover && (
        <CoverImage src={brand.cover_image_url} alt={brand.name} className="absolute inset-0 w-full h-full object-cover" />
      )}
      {(hasCover && overlayOpacity > 0) && (
        <div className="absolute inset-0" style={{ backgroundColor: `rgba(0,0,0,${overlayOpacity})` }} />
      )}
      <div className="relative z-10 flex flex-col items-center gap-5 max-w-2xl">
        {brand.logo && <BrandLogo src={brand.logo_light || brand.logo} alt={brand.name} className="h-16 md:h-20 object-contain drop-shadow-lg" />}
        {brand.show_brand_name !== false && (
          <h1 className="text-4xl md:text-5xl font-extrabold text-white drop-shadow-md leading-tight">{brand.name}</h1>
        )}
        {brand.slogan && <p className="text-white/80 text-sm font-medium tracking-wide uppercase">{brand.slogan}</p>}
        {brand.brand_description && (
          <p className="text-white/90 text-base md:text-lg max-w-xl leading-relaxed">{brand.brand_description}</p>
        )}
        <button
          onClick={onScrollDown}
          className="mt-2 inline-flex items-center gap-2 px-8 py-4 rounded-2xl text-white font-bold text-base shadow-xl hover:opacity-90 active:scale-95 transition-all border-2 border-white/30"
          style={{ backgroundColor: primary }}
        >
          <SparklesIcon className="w-5 h-5" />
          {brand.cta_button_text || 'Probarme un producto'}
        </button>
      </div>
      <button onClick={onScrollDown} className="absolute bottom-6 left-1/2 -translate-x-1/2 text-white/60 hover:text-white/90 transition-colors animate-bounce" aria-label="Ver mas">
        <ChevronDownIcon className="w-7 h-7" />
      </button>
    </section>
  );
}

function ClassicHowItWorks({ primaryColor }: { primaryColor: string }) {
  const steps = [
    { num: '1', title: 'Elige un producto', desc: 'Navega por el catalogo y selecciona la prenda que quieras probar.' },
    { num: '2', title: 'Sube tu foto', desc: 'Toma o sube una foto tuya. Funciona mejor con buena iluminacion.' },
    { num: '3', title: 'Ve el resultado', desc: 'Nuestra IA genera en segundos como te veria con ese producto.' },
  ];
  return (
    <section className="w-full bg-gray-50 py-16 px-4">
      <div className="max-w-4xl mx-auto">
        <h2 className="text-2xl md:text-3xl font-bold text-gray-900 text-center mb-2">Como funciona?</h2>
        <p className="text-gray-500 text-center text-sm mb-10">Tres pasos y listo</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {steps.map(s => (
            <div key={s.num} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 text-center">
              <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-lg mx-auto mb-4" style={{ backgroundColor: primaryColor }}>{s.num}</div>
              <h3 className="font-semibold text-gray-900 mb-2">{s.title}</h3>
              <p className="text-gray-500 text-sm leading-relaxed">{s.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function ClassicProducts({ products, primaryColor, ctaText, onProductClick }: { products: ProductData[]; primaryColor: string; ctaText?: string | null; onProductClick: (id: string) => void }) {
  if (!products.length) return null;
  return (
    <section className="w-full max-w-5xl mx-auto px-4 py-14">
      <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2 text-center">Catalogo</h2>
      <p className="text-gray-500 text-center mb-10 text-sm">Selecciona un producto para probartelo virtualmente</p>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
        {products.map(p => (
          <button key={p.id} onClick={() => onProductClick(p.id)} className="group rounded-2xl overflow-hidden border border-gray-200 bg-white hover:shadow-xl hover:-translate-y-1 transition-all duration-200 text-left">
            <div className="relative aspect-square overflow-hidden bg-gray-50">
              <ProductImage src={p.image_url} alt={p.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200" style={{ backgroundColor: primaryColor + 'cc' }}>
                <span className="text-white text-xs font-semibold px-3 py-1.5 rounded-full border-2 border-white">{ctaText || 'Probarme esto'}</span>
              </div>
              {p.badge && <span className="absolute top-2 left-2"><ProductBadge badge={p.badge} /></span>}
            </div>
            <div className="p-3">
              <p className="font-semibold text-sm text-gray-900 leading-tight truncate">{p.name}</p>
              <div className="flex items-center justify-between mt-1 gap-1 flex-wrap">
                {p.category && <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-500 rounded-full capitalize">{p.category}</span>}
                {p.price != null && <span className="text-xs font-semibold" style={{ color: primaryColor }}>${p.price.toLocaleString('es-CO')}</span>}
              </div>
              {p.description && <p className="mt-1.5 text-xs text-gray-400 leading-snug line-clamp-2">{p.description}</p>}
            </div>
          </button>
        ))}
      </div>
    </section>
  );
}

function ClassicTryOn({ brandSlug, primaryColor }: { brandSlug: string; primaryColor: string }) {
  return (
    <section id="tryon-section" className="w-full py-14 px-4" style={{ backgroundColor: primaryColor + '0d' }}>
      <div className="max-w-2xl mx-auto">
        <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2 text-center">Probador virtual</h2>
        <p className="text-gray-500 text-center mb-8 text-sm">Sube una foto tuya y ve como te queda el producto con IA</p>
        <div className="rounded-3xl overflow-hidden shadow-2xl border border-gray-100">
          <TryOnWidget brandSlug={brandSlug} />
        </div>
      </div>
    </section>
  );
}

function ClassicSocial({ brand }: { brand: BrandData }) {
  const entries = Object.entries(brand.social_links || {}).filter(([, url]) => !!url);
  if (!entries.length) return null;
  const icons: Record<string, React.ReactNode> = {
    instagram: <InstagramIcon className="w-5 h-5" />,
    facebook:  <FacebookIcon  className="w-5 h-5" />,
    tiktok:    <TikTokIcon    className="w-5 h-5" />,
  };
  return (
    <section className="w-full max-w-2xl mx-auto px-4 py-10 text-center">
      <h2 className="text-xl font-bold text-gray-900 mb-6">Siguenos</h2>
      <div className="flex flex-wrap items-center justify-center gap-3">
        {entries.map(([platform, url]) => (
          <a key={platform} href={url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl border border-gray-200 text-gray-700 font-medium text-sm hover:bg-gray-50 transition-colors capitalize">
            {icons[platform.toLowerCase()] ?? null}
            {platform}
          </a>
        ))}
      </div>
    </section>
  );
}

function ClassicInfo({ brand, primaryColor }: { brand: BrandData; primaryColor: string }) {
  const DAYS_ORDER = ['lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado', 'domingo'];
  const DAYS: Record<string, string> = { lunes: 'Lunes', martes: 'Martes', miercoles: 'Miercoles', jueves: 'Jueves', viernes: 'Viernes', sabado: 'Sabado', domingo: 'Domingo' };
  const scheduleEntries = brand.schedule
    ? DAYS_ORDER.filter(d => d in brand.schedule!).map(d => [d, brand.schedule![d]] as [string, string])
    : [];
  const hasRating = brand.rating != null;
  const hasLocation = !!(brand.city_display || brand.national_shipping);
  const hasSchedule = scheduleEntries.length > 0;
  if (!hasRating && !hasLocation && !hasSchedule) return null;

  return (
    <section className="w-full max-w-2xl mx-auto px-4 py-10">
      <div className="bg-white border border-gray-200 rounded-2xl p-6 space-y-5">
        {/* Rating */}
        {hasRating && (
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1">
              {[1,2,3,4,5].map(i => (
                <StarIcon key={i} className="w-4 h-4 text-yellow-400" filled={i <= Math.round(brand.rating!)} />
              ))}
            </div>
            <span className="font-bold text-gray-900">{brand.rating!.toFixed(1)}</span>
            {brand.total_reviews != null && brand.total_reviews > 0 && (
              <span className="text-sm text-gray-500">({brand.total_reviews.toLocaleString('es-CO')} reseñas)</span>
            )}
          </div>
        )}
        {/* Dirección / envíos */}
        {hasLocation && (
          <div className="flex flex-wrap items-center gap-4">
            {brand.city_display && (
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <MapPinIcon className="w-4 h-4 text-gray-400 flex-shrink-0" />
                <span>{brand.city_display}</span>
              </div>
            )}
            {brand.national_shipping && (
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <TruckIcon className="w-4 h-4 text-gray-400 flex-shrink-0" />
                <span>Envíos nacionales</span>
              </div>
            )}
          </div>
        )}
        {/* Horario */}
        {hasSchedule && (
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-2">Horario de atención</p>
            <div className="space-y-1">
              {scheduleEntries.map(([day, hours]) => (
                <div key={day} className="flex justify-between text-sm">
                  <span className="text-gray-500">{DAYS[day] ?? day}</span>
                  <span className={hours === 'Cerrado' ? 'text-gray-300' : 'text-gray-800 font-medium'}>{hours}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

function ClassicContact({ brand, primaryColor }: { brand: BrandData; primaryColor: string }) {
  if (!brand.whatsapp_contact) return null;
  const clean = brand.whatsapp_contact.replace(/\D/g, '');
  const msg = brand.whatsapp_message ? `?text=${encodeURIComponent(brand.whatsapp_message)}` : '';
  return (
    <section className="w-full py-14 px-4 bg-gray-50">
      <div className="max-w-xl mx-auto text-center">
        <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">Tienes preguntas?</h2>
        <p className="text-gray-500 text-sm mb-8">Escribenos directamente y te respondemos al instante</p>
        <a href={`https://wa.me/${clean}${msg}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-3 px-8 py-4 rounded-2xl text-white font-bold text-base shadow-lg hover:opacity-90 active:scale-95 transition-all" style={{ backgroundColor: '#25D366' }}>
          <WhatsAppIcon className="w-6 h-6" />
          Escribir por WhatsApp
        </a>
      </div>
    </section>
  );
}

function TemplateClassic({ brandSlug, brand, products, footerUrl }: { brandSlug: string; brand: BrandData; products: ProductData[]; footerUrl?: string }) {
  const primary = brand.primary_color || '#FF5C3A';
  const scrollToTryOn = () => document.getElementById('tryon-section')?.scrollIntoView({ behavior: 'smooth' });
  const [previewMode, setPreviewMode] = useState(false);
  const showModal = !brand.has_landing_page && !previewMode;

  // Rebloqueo al llegar al final del scroll
  useEffect(() => {
    if (!previewMode) return;
    let timer: ReturnType<typeof setTimeout> | null = null;
    const handleScroll = () => {
      const scrolled = window.scrollY + window.innerHeight;
      const total = document.documentElement.scrollHeight;
      if (scrolled >= total - 40) {
        if (!timer) timer = setTimeout(() => setPreviewMode(false), 30000);
      } else {
        if (timer) { clearTimeout(timer); timer = null; }
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => { window.removeEventListener('scroll', handleScroll); if (timer) clearTimeout(timer); };
  }, [previewMode]);

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {showModal && (
        <ActivationModal
          primaryColor={primary}
          brandName={brand.name}
          modalTitle={brand.modal_title}
          modalDescription={brand.modal_description}
          modalFeatures={brand.modal_features}
          onPreview={() => setPreviewMode(true)}
        />
      )}
      {previewMode && (
        <PreviewBanner primaryColor={primary} onExpired={() => setPreviewMode(false)} />
      )}
      <div style={previewMode ? { paddingTop: '40px' } : {}}>
        <ClassicHero brand={brand} onScrollDown={scrollToTryOn} />
        <ClassicHowItWorks primaryColor={primary} />
        <ClassicProducts products={products} primaryColor={primary} ctaText={brand.cta_button_text} onProductClick={scrollToTryOn} />
        <ClassicTryOn brandSlug={brandSlug} primaryColor={primary} />
        <ClassicInfo brand={brand} primaryColor={primary} />
        <ClassicSocial brand={brand} />
        <ClassicContact brand={brand} primaryColor={primary} />
        <LandingFooter primaryColor={primary} footerUrl={footerUrl} />
      </div>
      {brand.whatsapp_contact && <WhatsAppFAB phone={brand.whatsapp_contact} message={brand.whatsapp_message} />}
    </div>
  );
}

// ----------------------------------------------------------------------------
// TEMPLATE EDITORIAL
// ----------------------------------------------------------------------------

function EditorialHeader({ brand }: { brand: BrandData }) {
  const socialLinks = brand.social_links || {};
  const entries = Object.entries(socialLinks).filter(([, url]) => !!url);
  const icons: Record<string, React.ReactNode> = {
    instagram: <InstagramIcon className="w-3.5 h-3.5" />,
    facebook:  <FacebookIcon  className="w-3.5 h-3.5" />,
    tiktok:    <TikTokIcon    className="w-3.5 h-3.5" />,
  };
  return (
    <header className="bg-white border-b border-gray-100 px-5 h-16 flex items-center justify-between sticky top-0 z-50">
      <div className="flex items-center gap-2.5">
        {brand.logo ? (
          <BrandLogo
            src={brand.logo_dark || brand.logo}
            alt={brand.name}
            className="h-9 w-auto max-w-[120px] rounded-lg object-contain"
            fallbackInitials={brand.name.slice(0, 2).toUpperCase()}
            fallbackBg="#111827"
            fallbackTextColor="#fff"
          />
        ) : (
          <div className="h-9 w-9 rounded-lg bg-gray-900 flex items-center justify-center text-white font-bold text-sm">
            {brand.name.slice(0, 2).toUpperCase()}
          </div>
        )}
        {brand.show_brand_name !== false && (
          <span className="font-bold text-base text-gray-900">{brand.name}</span>
        )}
      </div>
      {entries.length > 0 && (
        <div className="flex items-center gap-1.5">
          {entries.map(([platform, url]) => (
            <a key={platform} href={url} target="_blank" rel="noopener noreferrer" title={platform}
              className="w-8 h-8 rounded-lg bg-gray-50 border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-100 transition-colors">
              {icons[platform.toLowerCase()] ?? null}
            </a>
          ))}
        </div>
      )}
    </header>
  );
}

function EditorialCover({ brand }: { brand: BrandData }) {
  const primary = brand.primary_color || '#FF5C3A';
  const fallbackBg = brand.cover_bg_color || `linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)`;
  const overlayOpacity = brand.cover_overlay_opacity ?? 0.6;
  return (
    <div className="relative h-48 md:h-56 overflow-hidden flex items-end" style={{ background: fallbackBg }}>
      {brand.cover_image_url && (
        <CoverImage src={brand.cover_image_url} alt={brand.name} className="absolute inset-0 w-full h-full object-cover" />
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" style={{ opacity: overlayOpacity > 0 ? 1 : 0 }} />
      <div className="relative z-10 px-6 pb-5 w-full">
        {brand.slogan && <p className="text-white/70 text-xs mb-1 tracking-widest uppercase">{brand.slogan}</p>}
        <h1 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight">{brand.name}</h1>
      </div>
    </div>
  );
}

function EditorialStatsBar({ products, brand }: { products: ProductData[]; brand: BrandData }) {
  const primary = brand.primary_color || '#FF5C3A';
  const rating = brand.rating;
  const reviews = brand.total_reviews;
  return (
    <div className="bg-white border-b border-gray-100 px-5 flex gap-6 overflow-x-auto">
      <div className="py-3 flex items-center gap-1.5 whitespace-nowrap border-b-2 flex-shrink-0" style={{ borderColor: primary }}>
        <span className="font-bold text-base text-gray-900">{products.length}</span>
        <span className="text-xs text-gray-400">productos</span>
      </div>
      {rating != null && (
        <div className="py-3 flex items-center gap-1.5 whitespace-nowrap border-b-2 border-transparent flex-shrink-0">
          <StarIcon className="w-4 h-4 text-yellow-400" filled />
          <span className="font-bold text-base text-gray-900">{rating.toFixed(1)}</span>
          {reviews != null && <span className="text-xs text-gray-400">({reviews} resenas)</span>}
        </div>
      )}
      <div className="py-3 flex items-center gap-1.5 whitespace-nowrap border-b-2 border-transparent flex-shrink-0">
        <SparklesIcon className="w-4 h-4 text-gray-400" />
        <span className="font-bold text-base text-gray-900">IA</span>
        <span className="text-xs text-gray-400">probador virtual</span>
      </div>
    </div>
  );
}

function EditorialProductCard({ product, selected, primaryColor, ctaText, onClick }: { product: ProductData; selected: boolean; primaryColor: string; ctaText?: string | null; onClick: () => void }) {
  return (
    <button onClick={onClick} className="text-left w-full rounded-xl overflow-hidden border bg-white transition-all duration-200" style={{ borderColor: selected ? primaryColor : '#e8e4df', borderWidth: selected ? 1.5 : 0.5 }}>
      <div className="relative aspect-square bg-gray-50">
        <ProductImage src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
        {product.badge && <span className="absolute top-2 left-2"><ProductBadge badge={product.badge} /></span>}
        {selected && (
          <span className="absolute bottom-2 left-2 flex items-center gap-1 text-white text-[9px] font-bold uppercase tracking-wider px-2 py-1 rounded-full" style={{ backgroundColor: primaryColor }}>
            <svg className="w-2.5 h-2.5" viewBox="0 0 10 10" fill="none"><path d="M2 5l2 2.5L8 2.5" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" /></svg>
            Seleccionado
          </span>
        )}
      </div>
      <div className="p-2.5">
        <p className="text-xs font-semibold text-gray-900 leading-tight truncate">{product.name}</p>
        <p className="text-[10px] text-gray-400 uppercase tracking-wider mt-0.5">{product.category}</p>
        {product.price != null && <p className="text-xs font-semibold mt-1" style={{ color: primaryColor }}>${product.price.toLocaleString('es-CO')}</p>}
      </div>
    </button>
  );
}

function EditorialInfoCard({ brand }: { brand: BrandData }) {
  const DAYS_ORDER = ['lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado', 'domingo'];
  const DAYS: Record<string, string> = { lunes: 'Lunes', martes: 'Martes', miercoles: 'Miercoles', jueves: 'Jueves', viernes: 'Viernes', sabado: 'Sabado', domingo: 'Domingo' };
  const scheduleEntries = brand.schedule
    ? DAYS_ORDER.filter(d => d in brand.schedule!).map(d => [d, brand.schedule![d]] as [string, string])
    : [];
  return (
    <div className="bg-white border border-gray-100 rounded-xl p-4 mt-4 space-y-4">
      {brand.brand_description && (
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 mb-1.5">Sobre la marca</p>
          <p className="text-sm text-gray-600 leading-relaxed">{brand.brand_description}</p>
        </div>
      )}
      {scheduleEntries.length > 0 && (
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 mb-2">Horario de atencion</p>
          <div className="space-y-1">
            {scheduleEntries.map(([day, hours]) => (
              <div key={day} className="flex justify-between text-xs">
                <span className="text-gray-500">{DAYS[day] ?? day}</span>
                <span className={hours === 'Cerrado' ? 'text-gray-300' : 'text-gray-800 font-medium'}>{hours}</span>
              </div>
            ))}
          </div>
        </div>
      )}
      {(brand.city_display || brand.national_shipping || brand.whatsapp_contact) && (
        <div className="space-y-2 pt-1 border-t border-gray-50">
          {brand.whatsapp_contact && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <div className="w-6 h-6 rounded-md bg-gray-50 border border-gray-100 flex items-center justify-center flex-shrink-0">
                <PhoneIcon className="w-3.5 h-3.5 text-gray-500" />
              </div>
              <span>{brand.whatsapp_contact}</span>
            </div>
          )}
          {brand.city_display && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <div className="w-6 h-6 rounded-md bg-gray-50 border border-gray-100 flex items-center justify-center flex-shrink-0">
                <MapPinIcon className="w-3.5 h-3.5 text-gray-500" />
              </div>
              <span>{brand.city_display}{brand.national_shipping ? ' · Envíos nacionales' : ''}</span>
            </div>
          )}
          {!brand.city_display && brand.national_shipping && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <div className="w-6 h-6 rounded-md bg-gray-50 border border-gray-100 flex items-center justify-center flex-shrink-0">
                <TruckIcon className="w-3.5 h-3.5 text-gray-500" />
              </div>
              <span>Envíos a todo el país</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function TemplateEditorial({ brandSlug, brand, products, footerUrl }: { brandSlug: string; brand: BrandData; products: ProductData[]; footerUrl?: string }) {
  const primary = brand.primary_color || '#FF5C3A';
  const [selectedId, setSelectedId] = useState<string | null>(products[0]?.id ?? null);

  const handleProductClick = (id: string) => {
    setSelectedId(id);
    document.getElementById('editorial-tryon')?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  };

  const [previewMode, setPreviewMode] = useState(false);
  const showModal = !brand.has_landing_page && !previewMode;

  useEffect(() => {
    if (!previewMode) return;
    let timer: ReturnType<typeof setTimeout> | null = null;
    const handleScroll = () => {
      const scrolled = window.scrollY + window.innerHeight;
      const total = document.documentElement.scrollHeight;
      if (scrolled >= total - 40) {
        if (!timer) timer = setTimeout(() => setPreviewMode(false), 30000);
      } else {
        if (timer) { clearTimeout(timer); timer = null; }
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => { window.removeEventListener('scroll', handleScroll); if (timer) clearTimeout(timer); };
  }, [previewMode]);

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#f7f5f2', color: '#0a0a0a' }}>
      {showModal && (
        <ActivationModal
          primaryColor={primary}
          brandName={brand.name}
          modalTitle={brand.modal_title}
          modalDescription={brand.modal_description}
          modalFeatures={brand.modal_features}
          onPreview={() => setPreviewMode(true)}
        />
      )}
      {previewMode && (
        <PreviewBanner primaryColor={primary} onExpired={() => setPreviewMode(false)} />
      )}
      <div style={previewMode ? { paddingTop: '40px' } : {}}>
      <EditorialHeader brand={brand} />
      <EditorialCover brand={brand} />
      <EditorialStatsBar products={products} brand={brand} />

      {/* Layout principal */}
      <div className="max-w-5xl mx-auto w-full px-4 py-7 grid grid-cols-1 md:grid-cols-[1fr_320px] gap-6 items-start">

        {/* Columna izquierda: catlogo + info */}
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 mb-3">Nuestros productos</p>
          {products.length > 0 ? (
            <div className="grid grid-cols-3 gap-2.5">
              {products.map(p => (
                <EditorialProductCard
                  key={p.id}
                  product={p}
                  selected={selectedId === p.id}
                  primaryColor={primary}
                  ctaText={brand.cta_button_text}
                  onClick={() => handleProductClick(p.id)}
                />
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-400 py-8 text-center">No hay productos disponibles</p>
          )}
          <EditorialInfoCard brand={brand} />
        </div>

        {/* Columna derecha: panel probador sticky */}
        <div id="editorial-tryon" className="md:sticky md:top-20">
          <div className="rounded-xl overflow-hidden border border-gray-200 shadow-lg bg-white">
            <div className="px-4 py-3 flex items-center justify-between" style={{ backgroundColor: '#0a0a0a' }}>
              <span className="text-white font-bold text-sm flex items-center gap-1.5">
                <SparklesIcon className="w-4 h-4 text-orange-400" />
                Probador Virtual
              </span>
              <span className="text-[10px] text-gray-500 bg-gray-800 px-2.5 py-1 rounded-full">IA</span>
            </div>
            <TryOnWidget brandSlug={brandSlug} />
          </div>
          <div className="mt-3 flex items-center justify-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: primary }} />
            <span className="text-[10px] text-gray-400">Impulsado por Lookitry AI</span>
          </div>
        </div>
      </div>

      <LandingFooter primaryColor={primary} footerUrl={footerUrl} />
      </div>
      {brand.whatsapp_contact && <WhatsAppFAB phone={brand.whatsapp_contact} message={brand.whatsapp_message} />}
    </div>
  );
}

// ----------------------------------------------------------------------------
// TEMPLATE PROBADOR (Single Col)
// ----------------------------------------------------------------------------

function ProbadorNav({ brand }: { brand: BrandData }) {
  const entries = Object.entries(brand.social_links || {}).filter(([, url]) => !!url);
  const icons: Record<string, React.ReactNode> = {
    instagram: <InstagramIcon className="w-3 h-3" />,
    facebook:  <FacebookIcon  className="w-3 h-3" />,
    tiktok:    <TikTokIcon    className="w-3 h-3" />,
  };
  const primary = brand.primary_color || '#FF5C3A';
  // Usar cover_bg_color si está definido, si no usar un tono oscuro derivado del primary
  const navBg = brand.cover_bg_color || '#0f0f0f';
  return (
    <nav className="sticky top-0 z-50 h-14 flex items-center justify-between px-6 border-b" style={{ backgroundColor: navBg, borderColor: 'rgba(255,255,255,0.08)' }}>
      <div className="flex items-center gap-2.5">
        {brand.logo && (
          <BrandLogo
            src={brand.logo_light || brand.logo}
            alt={brand.name}
            className="h-8 w-auto max-w-[140px] object-contain"
          />
        )}
        {brand.show_brand_name !== false && (
          <span className="font-bold text-base text-white" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>{brand.name}</span>
        )}
      </div>
      {entries.length > 0 && (
        <div className="flex gap-1.5">
          {entries.map(([platform, url]) => (
            <a key={platform} href={url} target="_blank" rel="noopener noreferrer"
              className="w-7 h-7 rounded-full border flex items-center justify-center transition-colors hover:border-current"
              style={{ borderColor: 'rgba(255,255,255,0.2)', color: 'rgba(255,255,255,0.6)' }}>
              {icons[platform.toLowerCase()] ?? null}
            </a>
          ))}
        </div>
      )}
    </nav>
  );
}

function ProbadorHero({ brand, onScrollDown }: { brand: BrandData; onScrollDown: () => void }) {
  const primary = brand.primary_color || '#FF5C3A';
  const hasCover = !!brand.cover_image_url;
  const heroBg = brand.cover_bg_color || '#0f0f0f';
  const overlayOpacity = brand.cover_overlay_opacity ?? 0.6;
  return (
    <section
      className="relative py-20 px-6 text-center overflow-hidden"
      style={{ backgroundColor: heroBg }}
    >
      {/* Imagen de portada */}
      {hasCover && (
        <CoverImage src={brand.cover_image_url} alt={brand.name} className="absolute inset-0 w-full h-full object-cover" />
      )}
      {(hasCover && overlayOpacity > 0) && (
        <div className="absolute inset-0" style={{ backgroundColor: `rgba(0,0,0,${overlayOpacity})` }} />
      )}
      {/* Anillos decorativos (solo sin imagen) */}
      {!hasCover && (
      <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
        {[600, 400, 200].map((size, i) => (
          <div key={i} className="absolute rounded-full border" style={{ width: size, height: size, borderColor: primary, opacity: 0.04 + i * 0.02 }} />
        ))}
      </div>
      )}
      <div className="relative z-10 max-w-2xl mx-auto">
        {/* Badge animado */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border mb-7" style={{ backgroundColor: primary + '18', borderColor: primary + '40' }}>
          <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ backgroundColor: primary }} />
          <span className="text-[11px] font-semibold uppercase tracking-widest" style={{ color: primary }}>Probador virtual activo</span>
        </div>
        <h1 className="text-5xl md:text-6xl font-black leading-none tracking-tight mb-5 text-white" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>
          {brand.slogan ? (
            <>{brand.name},<br /><em className="italic" style={{ color: primary }}>{brand.slogan}</em></>
          ) : (
            <>Tu ropa, tu cuerpo,<br /><em className="italic" style={{ color: primary }}>antes de comprar</em></>
          )}
        </h1>
        {brand.brand_description && (
          <p className="text-base font-light leading-relaxed mb-8 max-w-lg mx-auto" style={{ color: 'rgba(255,255,255,0.55)' }}>{brand.brand_description}</p>
        )}
        <div className="flex items-center justify-center gap-3 flex-wrap">
          <button onClick={onScrollDown} className="inline-flex items-center gap-2 px-7 py-3.5 rounded-full text-sm font-semibold transition-all hover:opacity-85 hover:-translate-y-0.5" style={{ backgroundColor: primary, color: '#fff' }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
            Probarme algo ahora
          </button>
          <button onClick={onScrollDown} className="inline-flex items-center gap-1.5 px-4 py-3.5 text-sm font-light transition-colors" style={{ color: 'rgba(255,255,255,0.45)' }}>
            Ver productos
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
          </button>
        </div>
        <p className="text-xs mt-5" style={{ color: 'rgba(255,255,255,0.25)' }}>Sin registro  Resultado en ~12 segundos  100% gratis</p>
      </div>
    </section>
  );
}

function ProbadorTrustBar({ brand }: { brand: BrandData }) {
  const primary = brand.primary_color || '#FF5C3A';
  const rating = brand.rating ?? 4.9;
  const reviews = brand.total_reviews ?? 0;
  const items = [
    { value: rating.toFixed(1), label: 'valoracion' },
    { value: reviews > 0 ? `+${reviews}` : '~12s', label: reviews > 0 ? 'pruebas' : 'por resultado' },
    { value: '~12s', label: 'por resultado' },
    { value: '96%', label: 'satisfaccion' },
  ].filter((_, i) => i < 4);
  return (
    <div className="flex border-b" style={{ backgroundColor: 'var(--p-surface, #fff)', borderColor: 'var(--p-border, #e5e5e5)' }}>
      {items.map((item, i) => (
        <div key={i} className="flex-1 flex flex-col items-center justify-center py-5 text-center border-r last:border-r-0" style={{ borderColor: 'var(--p-border, #e5e5e5)' }}>
          <span className="text-xl font-bold" style={{ fontFamily: "'Playfair Display', Georgia, serif", color: 'var(--p-text, #0f0f0f)' }}>{item.value}</span>
          <span className="text-[11px] mt-0.5" style={{ color: 'var(--p-text-muted, #888)' }}>{item.label}</span>
        </div>
      ))}
    </div>
  );
}

function ProbadorSocialProof({ brand }: { brand: BrandData }) {
  const primary = brand.primary_color || '#FF5C3A';
  const rating = brand.rating ?? 4.9;
  const reviews = brand.total_reviews ?? 847;
  const initials = ['L', 'M', 'C', 'A'];
  return (
    <div className="flex items-center justify-center gap-4 flex-wrap py-4 px-6 border-b" style={{ backgroundColor: 'var(--p-bg, #fafafa)', borderColor: 'var(--p-border, #e5e5e5)' }}>
      <div className="flex items-center gap-2">
        <div className="flex">
          {initials.map((l, i) => (
            <div key={i} className="w-6 h-6 rounded-full border-2 border-white flex items-center justify-center text-[10px] font-bold -ml-2 first:ml-0" style={{ backgroundColor: primary + '22', color: primary }}>
              {l}
            </div>
          ))}
        </div>
        <span className="text-xs" style={{ color: 'var(--p-text-muted, #888)' }}>
          <strong style={{ color: 'var(--p-text-secondary, #555)' }}>Laura, Maria y {reviews > 4 ? reviews - 2 : 843} mas</strong> ya lo usaron
        </span>
      </div>
      <div className="w-px h-5 bg-gray-200" />
      <div className="flex items-center gap-1">
        {[1,2,3,4,5].map(i => (
          <svg key={i} width="11" height="11" viewBox="0 0 24 24" fill={primary}><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
        ))}
        <span className="text-xs ml-1" style={{ color: 'var(--p-text-muted, #888)' }}>{rating.toFixed(1)}  {reviews} resenas</span>
      </div>
    </div>
  );
}

function ProbadorProducts({ products, primaryColor, ctaText, onProductClick, selectedId }: { products: ProductData[]; primaryColor: string; ctaText?: string | null; onProductClick: (id: string) => void; selectedId: string | null }) {
  if (!products.length) return null;
  return (
    <section id="probador-products" className="py-16 px-6" style={{ backgroundColor: 'var(--p-bg, #fafafa)' }}>
      <div className="max-w-4xl mx-auto">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-center mb-2" style={{ color: primaryColor }}>Coleccion</p>
        <h2 className="text-3xl md:text-4xl font-black text-center mb-2 tracking-tight" style={{ fontFamily: "'Playfair Display', Georgia, serif", color: 'var(--p-text, #0f0f0f)' }}>Nuestros productos</h2>
        <p className="text-sm font-light text-center mb-12" style={{ color: 'var(--p-text-muted, #888)' }}>Selecciona una prenda para probartela con IA</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {products.map(p => (
            <button key={p.id} onClick={() => onProductClick(p.id)}
              className="text-left rounded-2xl overflow-hidden border transition-all duration-200 hover:-translate-y-1"
              style={{ backgroundColor: 'var(--p-surface, #fff)', borderColor: selectedId === p.id ? primaryColor : 'var(--p-border, #e5e5e5)', borderWidth: selectedId === p.id ? 1.5 : 1 }}>
              <div className="relative aspect-square overflow-hidden" style={{ backgroundColor: 'var(--p-img-bg, #f0f0f0)' }}>
                <ProductImage src={p.image_url} alt={p.name} className="w-full h-full object-cover transition-transform duration-300 hover:scale-105" />
                {p.badge && <span className="absolute top-2 left-2"><ProductBadge badge={p.badge} /></span>}
                {selectedId === p.id && (
                  <span className="absolute bottom-2 left-2 flex items-center gap-1 text-white text-[9px] font-bold uppercase tracking-wider px-2 py-1 rounded-full" style={{ backgroundColor: primaryColor }}>
                    <svg className="w-2.5 h-2.5" viewBox="0 0 10 10" fill="none"><path d="M2 5l2 2.5L8 2.5" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" /></svg>
                    Seleccionado
                  </span>
                )}
              </div>
              <div className="p-3">
                <p className="text-xs font-medium leading-tight truncate" style={{ color: 'var(--p-text-secondary, #333)' }}>{p.name}</p>
                <div className="flex items-center justify-between mt-1.5 gap-1">
                  {p.price != null && <span className="text-sm font-bold" style={{ fontFamily: "'Playfair Display', Georgia, serif", color: primaryColor }}>${p.price.toLocaleString('es-CO')}</span>}
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full transition-colors" style={{ backgroundColor: primaryColor + '18', color: primaryColor }}>
                    {ctaText || 'Probar'}
                  </span>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}

function ProbadorUploadZone({ brandSlug, primaryColor }: { brandSlug: string; primaryColor: string }) {
  return (
    <section id="probador-tryon" className="border-t border-b py-16 px-6" style={{ backgroundColor: 'var(--p-surface, #fff)', borderColor: 'var(--p-border, #e5e5e5)' }}>
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <p className="text-[10px] font-semibold uppercase tracking-widest mb-2" style={{ color: primaryColor }}>Probador IA</p>
          <h2 className="text-3xl font-black mb-2 tracking-tight" style={{ fontFamily: "'Playfair Display', Georgia, serif", color: 'var(--p-text, #0f0f0f)' }}>Pruebatelo ahora</h2>
          <p className="text-sm font-light" style={{ color: 'var(--p-text-muted, #888)' }}>Sube tu foto y la IA genera el resultado en segundos</p>
        </div>
        <div className="rounded-3xl overflow-hidden shadow-xl border" style={{ borderColor: 'var(--p-border, #e5e5e5)' }}>
          <TryOnWidget brandSlug={brandSlug} />
        </div>
      </div>
    </section>
  );
}

function ProbadorAbout({ brand }: { brand: BrandData }) {
  const primary = brand.primary_color || '#FF5C3A';
  const DAYS_ORDER = ['lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado', 'domingo'];
  const DAYS: Record<string, string> = { lunes: 'Lunes', martes: 'Martes', miercoles: 'Miercoles', jueves: 'Jueves', viernes: 'Viernes', sabado: 'Sabado', domingo: 'Domingo' };
  const scheduleEntries = brand.schedule
    ? DAYS_ORDER.filter(d => d in brand.schedule!).map(d => [d, brand.schedule![d]] as [string, string])
    : [];
  if (!brand.brand_description && !scheduleEntries.length && !brand.city_display && !brand.whatsapp_contact) return null;
  return (
    <section className="py-16 px-6 text-center" style={{ backgroundColor: 'var(--p-bg, #fafafa)' }}>
      <div className="max-w-lg mx-auto">
        {brand.logo && (
          <div className="flex justify-center mb-6">
            <BrandLogo
              src={brand.logo_dark || brand.logo}
              alt={brand.name}
              className="h-14 w-auto max-w-[160px] object-contain"
            />
          </div>
        )}
        {brand.show_brand_name !== false && (
          <h2 className="text-3xl font-black mb-4 tracking-tight" style={{ fontFamily: "'Playfair Display', Georgia, serif", color: 'var(--p-text, #0f0f0f)' }}>{brand.name}</h2>
        )}
        {brand.brand_description && (
          <p className="text-sm font-light leading-relaxed mb-8" style={{ color: 'var(--p-text-muted, #888)' }}>{brand.brand_description}</p>
        )}
        {/* Detalles */}
        {(brand.city_display || brand.national_shipping || brand.whatsapp_contact) && (
          <div className="rounded-2xl border overflow-hidden mb-6 text-left" style={{ backgroundColor: 'var(--p-surface, #fff)', borderColor: 'var(--p-border, #e5e5e5)' }}>
            {brand.whatsapp_contact && (
              <div className="flex items-center gap-3 px-5 py-4 border-b" style={{ borderColor: 'var(--p-border, #e5e5e5)' }}>
                <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: primary + '18' }}>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke={primary} strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 7V5z" /></svg>
                </div>
                <span className="text-sm" style={{ color: 'var(--p-text-secondary, #333)' }}>{brand.whatsapp_contact}</span>
              </div>
            )}
            {brand.city_display && (
              <div className="flex items-center gap-3 px-5 py-4 border-b last:border-b-0" style={{ borderColor: 'var(--p-border, #e5e5e5)' }}>
                <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: primary + '18' }}>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke={primary} strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                </div>
                <span className="text-sm" style={{ color: 'var(--p-text-secondary, #333)' }}>{brand.city_display}{brand.national_shipping ? ' · Envíos nacionales' : ''}</span>
              </div>
            )}
            {!brand.city_display && brand.national_shipping && (
              <div className="flex items-center gap-3 px-5 py-4" style={{ borderColor: 'var(--p-border, #e5e5e5)' }}>
                <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: primary + '18' }}>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke={primary} strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10l2 1h8zM13 8h4l3 5v3h-7V8z" /></svg>
                </div>
                <span className="text-sm" style={{ color: 'var(--p-text-secondary, #333)' }}>Envíos a todo el país</span>
              </div>
            )}
          </div>
        )}
        {/* Horarios */}
        {scheduleEntries.length > 0 && (
          <div className="rounded-2xl border overflow-hidden text-left" style={{ backgroundColor: 'var(--p-surface, #fff)', borderColor: 'var(--p-border, #e5e5e5)' }}>
            <div className="flex items-center gap-2 px-5 py-3 border-b" style={{ borderColor: 'var(--p-border, #e5e5e5)' }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" style={{ color: 'var(--p-text-muted, #888)' }}><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
              <span className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: 'var(--p-text-muted, #888)' }}>Horario de atencion</span>
            </div>
            {scheduleEntries.map(([day, hours]) => (
              <div key={day} className="flex items-center justify-between px-5 py-3 border-b last:border-b-0 text-sm" style={{ borderColor: 'var(--p-border, #e5e5e5)' }}>
                <span style={{ color: 'var(--p-text-muted, #888)' }}>{DAYS[day] ?? day}</span>
                <span style={{ color: hours === 'Cerrado' ? 'var(--p-text-muted, #888)' : 'var(--p-text-secondary, #333)', fontWeight: hours !== 'Cerrado' ? 500 : 400 }}>{hours}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

function ProbadorContact({ brand }: { brand: BrandData }) {
  const primary = brand.primary_color || '#FF5C3A';
  if (!brand.whatsapp_contact) return null;
  const clean = brand.whatsapp_contact.replace(/\D/g, '');
  const msg = brand.whatsapp_message ? `?text=${encodeURIComponent(brand.whatsapp_message)}` : '';
  return (
    <section className="py-10 px-6 text-center border-t border-b" style={{ backgroundColor: primary + '0d', borderColor: primary + '22' }}>
      <div className="max-w-md mx-auto">
        <div className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4" style={{ backgroundColor: '#25D36618', border: '1px solid #25D36640' }}>
          <svg className="w-6 h-6" viewBox="0 0 24 24" fill="#25D366"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" /></svg>
        </div>
        <h2 className="text-2xl font-black mb-2 tracking-tight" style={{ fontFamily: "'Playfair Display', Georgia, serif", color: 'var(--p-text, #0f0f0f)' }}>Tienes preguntas?</h2>
        <p className="text-sm font-light mb-6" style={{ color: 'var(--p-text-muted, #888)' }}>Escribenos y te respondemos al instante</p>
        <a href={`https://wa.me/${clean}${msg}`} target="_blank" rel="noopener noreferrer"
          className="inline-flex items-center gap-2.5 px-7 py-3.5 rounded-full text-white text-sm font-semibold transition-opacity hover:opacity-90"
          style={{ backgroundColor: '#25D366' }}>
          <WhatsAppIcon className="w-5 h-5" />
          Escribir por WhatsApp
        </a>
        <p className="text-xs mt-3" style={{ color: 'var(--p-text-muted, #888)' }}>Respuesta en minutos</p>
      </div>
    </section>
  );
}

function TemplateModerno({ brandSlug, brand, products, footerUrl }: { brandSlug: string; brand: BrandData; products: ProductData[]; footerUrl?: string }) {
  const primary = brand.primary_color || '#FF5C3A';
  const [selectedId, setSelectedId] = useState<string | null>(products[0]?.id ?? null);
  const [previewMode, setPreviewMode] = useState(false);
  const showModal = !brand.has_landing_page && !previewMode;

  const scrollToTryOn = () => document.getElementById('probador-tryon')?.scrollIntoView({ behavior: 'smooth' });
  const handleProductClick = (id: string) => {
    setSelectedId(id);
    scrollToTryOn();
  };

  useEffect(() => {
    if (!previewMode) return;
    let timer: ReturnType<typeof setTimeout> | null = null;
    const handleScroll = () => {
      const scrolled = window.scrollY + window.innerHeight;
      const total = document.documentElement.scrollHeight;
      if (scrolled >= total - 40) {
        if (!timer) timer = setTimeout(() => setPreviewMode(false), 30000);
      } else {
        if (timer) { clearTimeout(timer); timer = null; }
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => { window.removeEventListener('scroll', handleScroll); if (timer) clearTimeout(timer); };
  }, [previewMode]);

  return (
    <div className="min-h-screen flex flex-col" style={{ fontFamily: "'Inter', sans-serif" }}>
      <style>{`
        :root { --p-bg:#fafafa; --p-surface:#fff; --p-border:#e5e5e5; --p-text:#0f0f0f; --p-text-secondary:#333; --p-text-muted:#888; --p-img-bg:#f0f0f0; --p-hero-bg:#0f0f0f; }
      `}</style>
      {showModal && (
        <ActivationModal
          primaryColor={primary}
          brandName={brand.name}
          modalTitle={brand.modal_title}
          modalDescription={brand.modal_description}
          modalFeatures={brand.modal_features}
          onPreview={() => setPreviewMode(true)}
        />
      )}
      {previewMode && (
        <PreviewBanner primaryColor={primary} onExpired={() => setPreviewMode(false)} />
      )}
      <div style={previewMode ? { paddingTop: '40px' } : {}}>
        <ProbadorNav brand={brand} />
        <ProbadorHero brand={brand} onScrollDown={() => document.getElementById('probador-products')?.scrollIntoView({ behavior: 'smooth' })} />
        <ProbadorTrustBar brand={brand} />
        <ProbadorSocialProof brand={brand} />
        <ProbadorProducts products={products} primaryColor={primary} ctaText={brand.cta_button_text} onProductClick={handleProductClick} selectedId={selectedId} />
        <ProbadorUploadZone brandSlug={brandSlug} primaryColor={primary} />
        <ProbadorAbout brand={brand} />
        <ProbadorContact brand={brand} />
        <LandingFooter primaryColor={primary} footerUrl={footerUrl} />
      </div>
      {brand.whatsapp_contact && <WhatsAppFAB phone={brand.whatsapp_contact} message={brand.whatsapp_message} />}
    </div>
  );
}

// ----------------------------------------------------------------------------
// COMPONENTE PRINCIPAL
// ----------------------------------------------------------------------------

export function MiniLanding({ brandSlug, initialData, footerUrl }: MiniLandingProps) {
  const [data, setData] = useState(initialData);
  const [loading, setLoading] = useState(!initialData);

  useEffect(() => {
    if (initialData) return;
    fetch(`${API_URL}/api/pruebalo/${brandSlug}`)
      .then(r => r.ok ? r.json() : null)
      .then(d => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, [brandSlug]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="w-10 h-10 border-4 border-gray-200 rounded-full animate-spin" style={{ borderTopColor: '#FF5C3A' }} />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center p-8">
          <p className="text-xl font-bold text-gray-800">Pgina no encontrada</p>
          <p className="text-gray-500 mt-2 text-sm">Verifica el enlace e intenta de nuevo</p>
        </div>
      </div>
    );
  }

  const { brand, products } = data;
  const template = brand.landing_template || 'classic';

  if (template === 'editorial') {
    return <TemplateEditorial brandSlug={brandSlug} brand={brand} products={products || []} footerUrl={footerUrl} />;
  }

  if (template === 'moderno' || (template as string) === 'probador') {
    return <TemplateModerno brandSlug={brandSlug} brand={brand} products={products || []} footerUrl={footerUrl} />;
  }

  return <TemplateClassic brandSlug={brandSlug} brand={brand} products={products || []} footerUrl={footerUrl} />;
}
