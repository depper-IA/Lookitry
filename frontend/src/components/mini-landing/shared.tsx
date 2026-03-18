'use client';

<<<<<<< HEAD
import { useState, useEffect } from 'react';

// ── Tipos compartidos ─────────────────────────────────────────────────────────
=======
>>>>>>> e173c4b (refactor: restaurar division de mini-landing en templates independientes (Classic, Editorial, Moderno))
export interface BrandData {
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
<<<<<<< HEAD
  landing_template?: 'classic' | 'editorial' | 'moderno';
=======
  landing_template?: 'classic' | 'editorial' | 'moderno' | 'probador';
>>>>>>> e173c4b (refactor: restaurar division de mini-landing en templates independientes (Classic, Editorial, Moderno))
  schedule?: Record<string, string> | null;
  logo_light?: string | null;
  logo_dark?: string | null;
  cover_bg_color?: string | null;
  cover_overlay_opacity?: number | null;
  show_brand_name?: boolean | null;
  header_color?: string | null;
}

export interface ProductData {
  id: string;
  name: string;
  image_url: string;
  category: string;
  description?: string;
  price?: number | null;
  badge?: 'nuevo' | 'top' | 'oferta' | null;
}

<<<<<<< HEAD
// ── Iconos compartidos ────────────────────────────────────────────────────────
=======
export interface MiniLandingProps {
  brandSlug: string;
  initialData: { brand: BrandData; products: ProductData[] } | null;
  footerUrl?: string;
}

// Iconos compartidos
>>>>>>> e173c4b (refactor: restaurar division de mini-landing en templates independientes (Classic, Editorial, Moderno))
export function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  );
}
<<<<<<< HEAD

export function InstagramIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
    </svg>
  );
}

export function FacebookIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
    </svg>
  );
}

export function TikTokIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z" />
    </svg>
  );
}

export function ChevronDownIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
    </svg>
  );
}

export function SparklesIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456z" />
    </svg>
  );
}

export function MapPinIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  );
}

export function TruckIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10l2 1h8zM13 8h4l3 5v3h-7V8z" />
    </svg>
  );
}

export function StarIcon({ className, filled }: { className?: string; filled?: boolean }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill={filled ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
    </svg>
  );
}

export function PhoneIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 7V5z" />
    </svg>
  );
}

// ── Componentes compartidos ───────────────────────────────────────────────────

const PREVIEW_DURATION = 3 * 60; // 3 minutos

export function PreviewBanner({
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

  return (
    <div
      className="fixed top-0 left-0 right-0 z-[9998] flex items-center justify-between px-4 py-2.5 text-white text-xs font-semibold shadow-lg"
      style={{ backgroundColor: primaryColor, boxShadow: `0 2px 12px ${primaryColor}80` }}
    >
      <div className="flex items-center gap-2">
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

interface ActivationModalProps {
  primaryColor: string;
  brandName?: string;
  modalTitle?: string | null;
  modalDescription?: string | null;
  modalFeatures?: string[] | null;
  onPreview?: () => void;
}

export function ActivationModal({
  primaryColor,
  brandName,
  modalTitle,
  modalDescription,
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

export function WhatsAppFAB({ phone, message }: { phone: string; message?: string | null }) {
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
      className="hidden sm:block fixed bottom-6 right-6 z-50 group"
    >
      <div className="relative">
        <span className="absolute bottom-full right-0 mb-2 px-3 py-1.5 rounded-lg text-white text-xs font-medium whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" style={{ backgroundColor: '#0a0a0a' }}>
          Tienes dudas? Escribenos
        </span>
        <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center text-white text-[9px] font-bold border-2 border-white" style={{ backgroundColor: '#FF5C3A' }}>1</span>
        <div className="w-14 h-14 rounded-full flex items-center justify-center text-white shadow-xl hover:scale-105 active:scale-95 transition-transform" style={{ backgroundColor: '#25D366', boxShadow: '0 4px 16px rgba(37,211,102,.4)' }}>
          <WhatsAppIcon className="w-7 h-7" />
        </div>
      </div>
    </a>
  );
}

export function LandingFooter({ primaryColor, footerUrl }: { primaryColor: string; footerUrl?: string }) {
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

export function ProductBadge({ badge }: { badge: string }) {
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

export function ProductImage({ src, alt, className }: { src?: string | null; alt: string; className?: string }) {
  const [error, setError] = useState(false);

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

export function CoverImage({ src, alt, className }: { src?: string | null; alt: string; className?: string }) {
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

export function BrandLogo({
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
=======
>>>>>>> e173c4b (refactor: restaurar division de mini-landing en templates independientes (Classic, Editorial, Moderno))
