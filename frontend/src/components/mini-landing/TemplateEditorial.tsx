'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { TryOnWidget } from '@/components/tryon/TryOnWidget';
import { BrandData, ProductData, WhatsAppIcon, WhatsAppFAB, LandingFooter, BrandLogo, ProductImage, ProductBadge, CoverImage } from './shared';

// ── Iconos internos del template ─────────────────────────────────────────────
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

function StarIcon({ className, filled }: { className?: string; filled?: boolean }) {
  return (
    <svg className={className} fill={filled ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.54 1.118l-3.976-2.888a1 1 0 00-1.175 0l-3.976 2.888c-.784.57-1.838-.197-1.539-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
    </svg>
  );
}

function SparklesIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
    </svg>
  );
}

function PhoneIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 7V5z" /></svg>
  );
}

function MapPinIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
  );
}

function TruckIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10l2 1h8zM13 8h4l3 5v3h-7V8z" /></svg>
  );
}

// ── Sub-componentes ──────────────────────────────────────────────────────────

function EditorialHeader({ brand }: { brand: BrandData }) {
  const primary = brand.primary_color || '#FF5C3A';
  const socialLinks = brand.social_links || {};
  const entries = Object.entries(socialLinks).filter(([, url]) => !!url);
  const icons: Record<string, React.ReactNode> = {
    instagram: <InstagramIcon className="w-3.5 h-3.5" />,
    facebook:  <FacebookIcon  className="w-3.5 h-3.5" />,
    tiktok:    <TikTokIcon    className="w-3.5 h-3.5" />,
  };
  return (
    <header className="px-5 h-20 flex items-center justify-between sticky top-0 z-50 backdrop-blur-2xl bg-white/30 border-b border-gray-100 shadow-sm">
      <div className="flex items-center gap-2.5">
        {brand.logo ? (
          <BrandLogo src={brand.logo_dark || brand.logo} alt={brand.name} className="h-9 w-auto max-w-[120px] rounded-lg object-contain" />
        ) : (
          <div className="h-9 w-9 rounded-lg flex items-center justify-center text-white font-bold text-sm" style={{ backgroundColor: primary }}>{brand.name.slice(0, 2).toUpperCase()}</div>
        )}
        {brand.show_brand_name !== false && <span className="font-bold text-base text-gray-900 italic uppercase tracking-tight">{brand.name}</span>}
      </div>
      {entries.length > 0 && (
        <div className="flex items-center gap-1.5">
          {entries.map(([platform, url]) => (
            <a key={platform} href={url} target="_blank" rel="noopener noreferrer" className="w-8 h-8 rounded-lg flex items-center justify-center transition-all hover:scale-110" style={{ backgroundColor: primary + '15', color: primary }}>
              {icons[platform.toLowerCase()] ?? null}
            </a>
          ))}
        </div>
      )}
    </header>
  );
}

function EditorialCover({ brand }: { brand: BrandData }) {
  const fallbackBg = brand.cover_bg_color || '#1a1a1a';
  const overlayOpacity = brand.cover_overlay_opacity ?? 0.6;
  return (
    <div className="relative h-48 md:h-56 overflow-hidden flex items-end" style={{ background: fallbackBg }}>
      {brand.cover_image_url && <CoverImage src={brand.cover_image_url} alt={brand.name} className="absolute inset-0 w-full h-full object-cover" />}
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" style={{ opacity: overlayOpacity > 0 ? 1 : 0 }} />
      <div className="relative z-10 px-6 pb-5 w-full text-white">
        {brand.slogan && <p className="text-white/70 text-[10px] mb-1 tracking-widest uppercase font-bold">{brand.slogan}</p>}
        <h1 className="text-3xl md:text-4xl font-black italic uppercase tracking-tighter leading-none">{brand.name}</h1>
      </div>
    </div>
  );
}

function EditorialProductCard({ product, selected, primaryColor, onClick }: { product: ProductData; selected: boolean; primaryColor: string; onClick: () => void }) {
  return (
    <button onClick={onClick} className="text-left w-full rounded-xl overflow-hidden border bg-white transition-all duration-200" style={{ borderColor: selected ? primaryColor : '#e5e5e5', borderWidth: selected ? 2 : 1 }}>
      <div className="relative aspect-square bg-gray-50">
        <ProductImage src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
        {product.badge && <span className="absolute top-2 left-2"><ProductBadge badge={product.badge} /></span>}
      </div>
      <div className="p-2.5">
        <p className="text-[11px] font-bold text-gray-900 leading-tight truncate uppercase italic">{product.name}</p>
        <p className="text-[9px] text-gray-400 uppercase tracking-wider mt-0.5">{product.category}</p>
        {product.price != null && <p className="text-[11px] font-black mt-1" style={{ color: primaryColor }}>${product.price.toLocaleString('es-CO')}</p>}
      </div>
    </button>
  );
}

export function TemplateEditorial({ brandSlug, brand, products, footerUrl }: { brandSlug: string; brand: BrandData; products: ProductData[]; footerUrl?: string }) {
  const primary = brand.primary_color || '#FF5C3A';
  const [selectedId, setSelectedId] = useState<string | null>(products?.[0]?.id ?? null);

  const handleProductClick = (id: string) => {
    setSelectedId(id);
    document.getElementById('editorial-tryon')?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#f7f5f2]">
      <EditorialHeader brand={brand} />
      <EditorialCover brand={brand} />
      
      <main className="max-w-5xl mx-auto w-full px-4 py-8 grid grid-cols-1 md:grid-cols-[1fr_320px] gap-8 items-start">
        <div>
          <div className="flex items-center justify-between mb-6 border-b border-gray-200 pb-2">
            <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 italic">Colección Editorial</p>
            <span className="text-[10px] font-bold text-gray-900 uppercase">{products?.length || 0} Items</span>
          </div>
          {products && products.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {products.map(p => (
                <EditorialProductCard key={p.id} product={p} selected={selectedId === p.id} primaryColor={primary} onClick={() => handleProductClick(p.id)} />
              ))}
            </div>
          ) : (
            <div className="py-12 text-center bg-white rounded-2xl border border-dashed border-gray-300">
              <p className="text-xs text-gray-400 uppercase font-bold tracking-widest">No hay productos disponibles</p>
            </div>
          )}
        </div>

        <div id="editorial-tryon" className="md:sticky md:top-24">
          <div className="rounded-2xl overflow-hidden border border-gray-200 shadow-xl bg-white">
            <div className="px-4 py-3 flex items-center justify-between bg-black">
              <span className="text-white font-black text-xs flex items-center gap-2 italic uppercase">
                <SparklesIcon className="w-4 h-4 text-[#FF5C3A]" />
                Probador Virtual
              </span>
              <span className="text-[9px] text-gray-500 bg-gray-800 px-2.5 py-1 rounded-full font-bold">IA</span>
            </div>
            <TryOnWidget brandSlug={brandSlug} isEmbed={true} initialProductId={selectedId} />
          </div>
          <div className="mt-4 flex flex-col items-center gap-2">
            <p className="text-[9px] text-gray-400 uppercase font-bold tracking-widest">Impulsado por Look<span className="text-[#FF5C3A]">itry</span> AI</p>
          </div>
        </div>
      </main>

      <footer className="py-12 px-6 text-center border-t border-gray-100 bg-white mt-auto">
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400">
          Probador virtual impulsado por <a href={footerUrl || 'https://pruebalo.wilkiedevs.com'} target="_blank" rel="noopener noreferrer" className="hover:opacity-70 transition-opacity">Look<span className="text-[#FF5C3A]">itry</span> IA</a>
        </p>
      </footer>

      {brand.whatsapp_contact && <WhatsAppFAB phone={brand.whatsapp_contact} message={brand.whatsapp_message} />}
    </div>
  );
}
