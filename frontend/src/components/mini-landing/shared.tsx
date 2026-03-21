'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';

// ── Tipos compartidos ─────────────────────────────────────────────────────────
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
  landing_template?: 'classic' | 'editorial' | 'moderno' | 'probador';
  schedule?: Record<string, string> | null;
  logo_light?: string | null;
  logo_dark?: string | null;
  cover_bg_color?: string | null;
  cover_overlay_opacity?: number | null;
  show_brand_name?: boolean | null;
  header_color?: string | null;
  // Metadata extendida del servidor
  is_preview_expired?: boolean;
  preview_timer_seconds?: number;
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

export interface MiniLandingProps {
  brandSlug: string;
  initialData: { brand: BrandData; products: ProductData[] } | null;
  footerUrl?: string;
}

// ── Componentes Auxiliares Compartidos ────────────────────────────────────────

export function BrandLogo({ src, alt, className }: { src?: string | null; alt: string; className?: string }) {
  if (!src) return null;
  return <img src={src} alt={alt} className={className} />;
}

export function CoverImage({ src, alt, className, style }: { src?: string | null; alt: string; className?: string; style?: React.CSSProperties }) {
  if (!src) return null;
  return <div className={className} style={{ ...style, backgroundImage: `url(${src})`, backgroundSize: 'cover', backgroundPosition: 'center' }} />;
}

export function ProductImage({ src, alt, className }: { src: string; alt: string; className?: string }) {
  return (
    <div className={`relative ${className}`}>
      <Image src={src} alt={alt} fill className="object-cover" sizes="(max-width: 768px) 100vw, 33vw" />
    </div>
  );
}

export function ProductBadge({ badge }: { badge: string }) {
  return (
    <span className="px-2 py-0.5 rounded-full bg-white/90 backdrop-blur-sm text-[9px] font-black uppercase tracking-widest text-black shadow-sm border border-black/5">
      {badge}
    </span>
  );
}

export function WhatsAppFAB({ phone, message }: { phone: string; message?: string | null }) {
  const clean = phone.replace(/\D/g, '');
  const msg = message ? `?text=${encodeURIComponent(message)}` : '';
  return (
    <a 
      href={`https://wa.me/${clean}${msg}`}
      target="_blank" rel="noopener noreferrer"
      className="fixed bottom-6 left-6 z-50 w-14 h-14 bg-[#25D366] text-white rounded-2xl flex items-center justify-center shadow-2xl hover:scale-110 transition-transform active:scale-95"
    >
      <WhatsAppIcon className="w-7 h-7" />
    </a>
  );
}

export function LandingFooter({ primaryColor, footerUrl }: { primaryColor: string; footerUrl?: string }) {
  return (
    <footer className="py-12 px-6 text-center border-t border-gray-100 bg-white">
      <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400">
        Probador virtual impulsado por <a href={footerUrl || 'https://pruebalo.wilkiedevs.com'} target="_blank" rel="noopener noreferrer" className="hover:opacity-70 transition-opacity">Look<span className="text-[#FF5C3A]">itry</span> IA</a>
      </p>
    </footer>
  );
}

// ── Iconos compartidos ────────────────────────────────────────────────────────
export function YouTubeIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.016 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
    </svg>
  );
}

export function XIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M18.901 1.153h3.68l-8.04 9.19L24 22.846h-7.406l-5.8-7.584-6.638 7.584H.474l8.6-9.83L0 1.154h7.594l5.243 6.932 6.064-6.932zm-1.292 19.494h2.039L6.486 3.24H4.298l13.311 17.407z" />
    </svg>
  );
}
