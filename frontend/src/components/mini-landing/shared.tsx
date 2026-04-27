'use client';

import { useState, useEffect, useMemo, createContext, useContext, useRef } from 'react';
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
  landing_font?: string | null;
  widget_bg_color?: string | null;
  schedule?: Record<string, string> | null;
  logo_light?: string | null;
  logo_dark?: string | null;
  cover_bg_color?: string | null;
  cover_overlay_opacity?: number | null;
  show_brand_name?: boolean | null;
  header_color?: string | null;
  landing_steps?: {
    select_label?: string | null;
    select_desc?: string | null;
    photo_label?: string | null;
    photo_desc?: string | null;
    result_label?: string | null;
    result_desc?: string | null;
  } | null;
  // Metadata extendida del servidor
  is_preview_expired?: boolean;
  preview_timer_seconds?: number;
}

export interface ProductData {
  id: string;
  name: string;
  image_url: string;
  category: string;
  description?: string; // IA description - interno
  short_description?: string; // Visible para clientes - nuevo
  price?: number | null;
  badge?: 'nuevo' | 'top' | 'oferta' | null;
  attributes?: Record<string, any>; // Atributos dinámicos - nuevo
}

export interface MiniLandingProps {
  brandSlug: string;
  initialData: { brand: BrandData; products: ProductData[] } | null;
  footerUrl?: string;
}

export function getCoverPresentation(brand: Pick<BrandData, 'cover_bg_color' | 'cover_overlay_opacity'>, fallbackColor: string) {
  const backgroundColor = brand.cover_bg_color || fallbackColor;
  const rawOpacity = typeof brand.cover_overlay_opacity === 'number' ? brand.cover_overlay_opacity : 0.55;
  const imageOpacity = Math.max(0, Math.min(1, rawOpacity));

  return {
    backgroundColor,
    imageOpacity,
  };
}

export function isDarkColor(color?: string | null): boolean {
  if (!color) return false;
  const hex = color.replace('#', '').trim();
  if (!/^[0-9a-fA-F]{6}$/.test(hex)) return false;

  const r = parseInt(hex.slice(0, 2), 16);
  const g = parseInt(hex.slice(2, 4), 16);
  const b = parseInt(hex.slice(4, 6), 16);
  const luminance = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;

  return luminance < 0.5;
}

export function getLuminance(color?: string | null): number {
  if (!color) return 1;
  const hex = color.replace('#', '').trim();
  if (!/^[0-9a-fA-F]{6}$/.test(hex)) return 1;
  
  const r = parseInt(hex.slice(0, 2), 16);
  const g = parseInt(hex.slice(2, 4), 16);
  const b = parseInt(hex.slice(4, 6), 16);
  return (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
}

export function getContrastColor(color?: string | null, darkColor = '#111111', lightColor = '#ffffff'): string {
  return isDarkColor(color) ? lightColor : darkColor;
}

export function getSmartMutedColor(color?: string | null): string {
  if (!color) return '#6b7280';
  return isDarkColor(color) ? 'rgba(255,255,255,0.72)' : '#6b7280';
}

export function getSmartBorderColor(color?: string | null): string {
  if (!color) return '#f3f4f6';
  return isDarkColor(color) ? 'rgba(255,255,255,0.08)' : '#f3f4f6';
}

export function getSmartOverlayColor(color?: string | null): string {
  if (!color) return 'rgba(255,255,255,0.02)';
  return isDarkColor(color) ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.02)';
}

// ── Sistema de contraste inteligente (Theme Context) ────────────────────────
export interface ContrastTheme {
  bg: string;
  isDark: boolean;
  text: string;
  muted: string;
  border: string;
  surface: string;       // for cards, elevated surfaces
  surfaceHover: string; // for hover states
  ctaBg: string;        // CTA button background (brand primary)
  ctaText: string;      // CTA button text (auto contrast)
  overlay: string;
}

export function getContrastTheme(bg: string, primaryColor?: string): ContrastTheme {
  const isDark = isDarkColor(bg);
  const text = isDark ? '#ffffff' : '#111111';
  const muted = isDark ? 'rgba(255,255,255,0.72)' : '#6b7280';
  const border = isDark ? 'rgba(255,255,255,0.08)' : '#f3f4f6';
  const surface = isDark ? 'rgba(255,255,255,0.05)' : '#ffffff';
  const surfaceHover = isDark ? 'rgba(255,255,255,0.10)' : '#f9fafb';
  const ctaBg = primaryColor || '#FF5C3A';
  const ctaText = isDarkColor(ctaBg) ? '#ffffff' : '#ffffff';
  const overlay = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.02)';
  return { bg, isDark, text, muted, border, surface, surfaceHover, ctaBg, ctaText, overlay };
}

// ── useContrastTheme Hook ───────────────────────────────────────────────────
// Usage: const theme = useContrastTheme(brand.cover_bg_color, brand.primary_color);
// Then use: theme.text, theme.muted, theme.border, theme.surface, etc.
export function useContrastTheme(bgColor?: string | null, primaryColor?: string | null) {
  return useMemo(() => {
    return getContrastTheme(bgColor || '#ffffff', primaryColor || undefined);
  }, [bgColor, primaryColor]);
}

// ── Landing Theme Hook ─────────────────────────────────────────────────────
// Sistema de colores inteligente para mini-landings con fallbacks por sección
export interface LandingTheme {
  // Fondos de sección
  heroBg: string;
  productsBg: string;
  footerBg: string;
  cardBg: string;
  infoBg: string;
  aboutBg: string;
  // Textos
  text: string;
  muted: string;
  mutedLight: string;
  // Bordes
  border: string;
  borderLight: string;
  // Estados
  surface: string;
  surfaceHover: string;
  overlay: string;
  // CTA
  ctaBg: string;
  ctaText: string;
  // Utilidades
  isDark: boolean;
  isDarkHero: boolean;
  isDarkProducts: boolean;
  isDarkFooter: boolean;
}

export function getLandingTheme(brand: BrandData): LandingTheme {
  const primary = brand.social_links?._landing_primary || brand.primary_color || '#FF5C3A';

  // Fondos con fallbacks
  const heroBg = brand.cover_bg_color || '#f9f8f6';
  const productsBg = '#f9f8f6';
  const footerBg = '#ffffff';
  const cardBg = '#ffffff';
  const infoBg = '#ffffff';
  const aboutBg = brand.widget_bg_color || '#0a0a0a';

  // Detectar si el fondo es oscuro
  const isDarkHero = isDarkColor(heroBg);
  const isDarkProducts = isDarkColor(productsBg);
  const isDarkFooter = isDarkColor(footerBg);

  // Textos basados en luminosidad
  const heroText = isDarkHero ? '#ffffff' : '#111111';
  const productsText = isDarkProducts ? '#ffffff' : '#111111';
  const footerText = isDarkFooter ? '#ffffff' : '#111111';
  const cardText = isDarkColor(cardBg) ? '#ffffff' : '#111111';

  // Textos secundarios
  const heroMuted = isDarkHero ? 'rgba(255,255,255,0.72)' : '#6b7280';
  const productsMuted = isDarkProducts ? 'rgba(255,255,255,0.72)' : '#6b7280';
  const footerMuted = isDarkFooter ? 'rgba(255,255,255,0.72)' : '#6b7280';

  // Textos terciarios
  const heroMutedLight = isDarkHero ? 'rgba(255,255,255,0.4)' : '#9ca3af';
  const productsMutedLight = isDarkProducts ? 'rgba(255,255,255,0.4)' : '#9ca3af';
  const footerMutedLight = isDarkFooter ? 'rgba(255,255,255,0.4)' : '#9ca3af';

  // Bordes
  const heroBorder = isDarkHero ? 'rgba(255,255,255,0.08)' : '#f3f4f6';
  const productsBorder = isDarkProducts ? 'rgba(255,255,255,0.08)' : '#f3f4f6';
  const footerBorder = isDarkFooter ? 'rgba(255,255,255,0.08)' : '#f3f4f6';

  // CTA
  const ctaBg = primary;
  const ctaText = isDarkColor(ctaBg) ? '#ffffff' : '#ffffff';

  return {
    heroBg,
    productsBg,
    footerBg,
    cardBg,
    infoBg,
    aboutBg,
    text: heroText,
    muted: heroMuted,
    mutedLight: heroMutedLight,
    border: heroBorder,
    borderLight: isDarkHero ? 'rgba(255,255,255,0.04)' : '#f9fafb',
    surface: isDarkColor(productsBg) ? 'rgba(255,255,255,0.05)' : '#ffffff',
    surfaceHover: isDarkColor(productsBg) ? 'rgba(255,255,255,0.10)' : '#f9fafb',
    overlay: isDarkHero ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.02)',
    ctaBg,
    ctaText,
    isDark: isDarkHero,
    isDarkHero,
    isDarkProducts,
    isDarkFooter,
  };
}

export function useLandingTheme(brand: BrandData): LandingTheme {
  return useMemo(() => getLandingTheme(brand), [
    brand.primary_color,
    brand.secondary_color,
    brand.cover_bg_color,
    brand.widget_bg_color,
    brand.header_color,
    brand.social_links?._landing_primary,
    brand.social_links?._landing_secondary,
  ]);
}

// ── Brand context for real-time preview updates ───────────────────────────────
export interface BrandContextValue {
  brand: BrandData;
  products: ProductData[];
  updateBrand: (patch: Partial<BrandData>) => void;
  updateProduct: (id: string, patch: Partial<ProductData>) => void;
  children?: React.ReactNode;
}
const BrandContext = createContext<BrandContextValue | null>(null);
export function BrandProvider({ brand, products, children, updateBrand, updateProduct }: BrandContextValue) {
  return (
    <BrandContext.Provider value={{ brand, products, updateBrand, updateProduct }}>
      {children}
    </BrandContext.Provider>
  );
}
export function useBrandContext() {
  return useContext(BrandContext);
}

export function getVisibleSocialEntries(socialLinks?: Record<string, string>) {
  if (!socialLinks) return [];

  const allowed = new Set(['instagram', 'facebook', 'tiktok', 'youtube', 'x']);
  return Object.entries(socialLinks).filter(([key, url]) => allowed.has(key.toLowerCase()) && !!String(url || '').trim());
}

// ── Scroll Reveal Hook ────────────────────────────────────────────────────────
export function useScrollReveal() {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setIsVisible(true); },
      { threshold: 0.1 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);
  return { ref, isVisible };
}

// ── Product Skeleton ─────────────────────────────────────────────────────────
export function ProductSkeleton({ primaryColor = '#FF5C3A' }: { primaryColor?: string }) {
  return (
    <div className="rounded-3xl overflow-hidden border border-gray-100 dark:border-white/5 p-3 animate-pulse">
      <div className="aspect-[3/4] rounded-2xl bg-gray-200 dark:bg-white/10" />
      <div className="mt-3 space-y-2">
        <div className="h-3 bg-gray-200 dark:bg-white/10 rounded w-3/4" />
        <div className="h-2 bg-gray-100 dark:bg-white/5 rounded w-1/3" />
      </div>
    </div>
  );
}

/**
 * Inyecta los estilos de fuente dinámicos para que Tailwind reconozca las variables de Google Fonts.
 * Mapea las clases font-jakarta, font-playfair, etc. a las variables CSS de Next.js.
 */
export function DynamicFontStyles() {
  return null; // Ahora manejado centralmente en globals.css
}

/**
 * Componente oficial del nombre de marca Lookitry con tipografía Jakarta forzada.
 */
export function LookitryLogoText({ className = "" }: { className?: string }) {
  return (
    <span className={`font-jakarta font-extrabold tracking-tighter ${className}`}>
      Look<span style={{ color: 'var(--secondary, #FF5C3A)' }}>itry</span>
    </span>
  );
}

// ── Componentes Auxiliares Compartidos ────────────────────────────────────────

export function BrandLogo({ src, alt, className, priority = false }: { src?: string | null; alt: string; className?: string; priority?: boolean }) {
  const [hasError, setHasError] = useState(false);

  if (!src || hasError) return null;

  const blurDataURL = 'data:image/svg+xml;base64,' + Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><rect fill="#e5e7eb" width="100" height="100"/></svg>').toString('base64');

  return (
    <div className={`relative ${className || ''}`} style={{ minWidth: 24, minHeight: 24 }}>
      <Image
        src={src}
        alt={alt}
        fill
        className="object-contain"
        sizes="(max-width: 640px) 100px, 160px"
        loading={priority ? 'eager' : 'lazy'}
        placeholder="blur"
        blurDataURL={blurDataURL}
        priority={priority}
        onError={() => setHasError(true)}
      />
    </div>
  );
}

export function CoverImage({ src, alt, className, style }: { src?: string | null; alt: string; className?: string; style?: React.CSSProperties }) {
  if (!src) return null;
  return (
    <div 
      className={`transition-opacity duration-1000 ${className}`} 
      style={{ 
        ...style, 
        backgroundImage: `url("${src}")`, 
        backgroundSize: 'cover', 
        backgroundPosition: 'center' 
      }} 
    />
  );
}

export function ProductImage({ src, alt, className, sizes, primaryColor = '#FF5C3A' }: { src: string; alt: string; className?: string; sizes?: string; primaryColor?: string }) {
  const [hasError, setHasError] = useState(false);

  if (hasError) {
    return (
      <div
        className={`flex items-center justify-center ${className || ''}`}
        style={{ backgroundColor: `${primaryColor}15`, minHeight: 200 }}
      >
        <svg className="w-12 h-12 opacity-30" fill="none" viewBox="0 0 24 24" stroke={primaryColor} strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
        </svg>
      </div>
    );
  }

  return (
    <div className={`relative overflow-hidden ${className || ''}`}>
      <Image
        src={src}
        alt={alt}
        fill
        className="object-cover"
        sizes={sizes || '(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw'}
        onError={() => setHasError(true)}
      />
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
      aria-label="Contactar por WhatsApp"
      className="fixed bottom-6 left-6 z-50 w-14 h-14 bg-[#25D366] text-white rounded-2xl flex items-center justify-center shadow-2xl hover:scale-110 transition-transform active:scale-95"
    >
      <WhatsAppIcon className="w-7 h-7" />
    </a>
  );
}

// ── Iconos sociales reales ───────────────────────────────────────────────────

export function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.582 2.128 2.182-.573c.978.58 1.911.928 3.145.929 3.178 0 5.767-2.587 5.768-5.766 0-3.187-2.59-5.771-5.764-5.771zm3.392 8.244c-.144.405-.837.774-1.17.824-.299.045-.677.063-1.092-.069-.252-.08-.575-.187-.988-.365-1.739-.751-2.874-2.502-2.961-2.617-.087-.116-.708-.94-.708-1.793s.448-1.273.607-1.446c.159-.173.346-.217.462-.217s.231.006.332.013c.105.007.246-.04.384.297.144.346.491 1.2.534 1.287.043.087.072.188.014.304-.058.116-.087.188-.173.289l-.26.304c-.087.086-.177.18-.076.331.101.151.448.741.96 1.201.662.592 1.22.774 1.394.86s.289.058.39-.058c.101-.116.433-.506.548-.68.116-.174.231-.145.39-.087s1.011.477 1.184.564.289.13.332.202c.045.072.045.419-.1.824z" />
    </svg>
  );
}

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

export function YouTubeIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.016 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.86-.42-5.58zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
    </svg>
  );
}

export function XIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M18.901 1.153h3.68l-8.04 9.19L24 22.846h-7.406l-5.8-7.584-6.638 7.584H.474l8.6-9.83L0 1.154h7.594l5.243 6.932 6.064-6.932zm-1.292 19.494h2.039L6.486 3.24H4.298l13.311 17.403z" />       
    </svg>
  );
}

export function SparklesIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
    </svg>
  );
}

export function StarIcon({ className, filled }: { className?: string; filled?: boolean }) {
  return (
    <svg className={className} fill={filled ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.54 1.118l-3.976-2.888a1 1 0 00-1.175 0l-3.976 2.888c-.784.57-1.838-.197-1.539-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
    </svg>
  );
}

export function MapPinIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  );
}

export function TruckIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10l2 1h8zM13 8h4l3 5v3h-7V8z" />
    </svg>
  );
}
