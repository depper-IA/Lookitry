'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { TryOnWidget } from '@/components/tryon/TryOnWidget';
import { BrandData, ProductData, WhatsAppIcon, WhatsAppFAB, LandingFooter, BrandLogo, ProductImage, ProductBadge, CoverImage, YouTubeIcon, XIcon } from './shared';

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

// ── Sub-componentes ──────────────────────────────────────────────────────────

function ProbadorNav({ brand }: { brand: BrandData }) {
  const entries = Object.entries(brand.social_links || {}).filter(([, url]) => !!url);
  const icons: Record<string, React.ReactNode> = {
    instagram: <InstagramIcon className="w-3 h-3" />,
    facebook:  <FacebookIcon  className="w-3 h-3" />,
    tiktok:    <TikTokIcon    className="w-3 h-3" />,
    youtube:   <YouTubeIcon   className="w-3 h-3" />,
    x:         <XIcon         className="w-3 h-3" />,
  };
  const primary = brand.primary_color || '#FF5C3A';
  return (
    <nav className="sticky top-0 z-50 h-20 flex items-center justify-between px-6 backdrop-blur-3xl transition-colors duration-500" 
      style={{ 
        backgroundColor: brand.header_color ? `${brand.header_color}66` : 'rgba(15,15,15,0.2)', 
        borderBottom: '1px solid rgba(255,255,255,0.05)',
        boxShadow: '0 4px 30px rgba(0, 0, 0, 0.1)'
      }}>
      <div className="flex items-center gap-2.5">
        {brand.logo && (
          <BrandLogo
            src={brand.logo_light || brand.logo}
            alt={brand.name}
            className="h-8 w-auto max-w-[140px] object-contain"
          />
        )}
        {brand.show_brand_name !== false && (
          <span className="font-bold text-base text-white">{brand.name}</span>
        )}
      </div>
      {entries.length > 0 && (
        <div className="flex gap-1.5 overflow-x-auto custom-scrollbar pb-1">
          {entries.map(([platform, url]) => (
            <a key={platform} href={url} target="_blank" rel="noopener noreferrer"
              className="w-7 h-7 rounded-full border flex items-center justify-center transition-colors hover:border-current shrink-0"
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
    <section className="relative py-20 px-6 text-center overflow-hidden" style={{ backgroundColor: heroBg }}>
      {hasCover && (
        <CoverImage src={brand.cover_image_url} alt={brand.name} className="absolute inset-0 w-full h-full object-cover" />
      )}
      {(hasCover && overlayOpacity > 0) && (
        <div className="absolute inset-0" style={{ backgroundColor: `rgba(0,0,0,${overlayOpacity})` }} />
      )}
      <div className="relative z-10 max-w-2xl mx-auto text-white">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border mb-7" style={{ backgroundColor: primary + '18', borderColor: primary + '40' }}>
          <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ backgroundColor: primary }} />
          <span className="text-[11px] font-semibold uppercase tracking-widest" style={{ color: primary }}>Probador virtual activo</span>
        </div>
        <h1 className="text-5xl md:text-6xl font-black leading-none tracking-tight mb-5 italic">
          {brand.name},<br />
          <em className="not-italic" style={{ color: primary }}>{brand.slogan || 'antes de comprar'}</em>
        </h1>
        {brand.brand_description && (
          <p className="text-base font-light leading-relaxed mb-8 max-w-lg mx-auto opacity-70">{brand.brand_description}</p>
        )}
        <div className="flex items-center justify-center gap-3">
          <button onClick={onScrollDown} className="inline-flex items-center gap-2 px-7 py-3.5 rounded-full text-sm font-semibold transition-all hover:opacity-85 hover:-translate-y-0.5" style={{ backgroundColor: primary, color: '#fff' }}>
            Probarme algo ahora
          </button>
        </div>
      </div>
    </section>
  );
}

function ProbadorTrustBar({ brand }: { brand: BrandData }) {
  const rating = brand.rating ?? 4.9;
  const reviews = brand.total_reviews ?? 0;
  const items = [
    { value: rating.toFixed(1), label: 'valoración' },
    { value: reviews > 0 ? `+${reviews}` : '96%', label: reviews > 0 ? 'pruebas' : 'satisfacción' },
    { value: '~12s', label: 'por resultado' },
    { value: 'IA', label: 'tecnología' },
  ];
  return (
    <div className="flex border-b bg-white border-gray-100">
      {items.map((item, i) => (
        <div key={i} className="flex-1 flex flex-col items-center justify-center py-5 text-center border-r last:border-r-0 border-gray-100">
          <span className="text-xl font-bold text-gray-900">{item.value}</span>
          <span className="text-[11px] mt-0.5 text-gray-400 uppercase tracking-widest">{item.label}</span>
        </div>
      ))}
    </div>
  );
}

function ProbadorProducts({ products, primaryColor, ctaText, onProductClick, selectedId }: { products: ProductData[]; primaryColor: string; ctaText?: string | null; onProductClick: (id: string) => void; selectedId: string | null }) {
  if (!products || !products.length) return null;
  return (
    <section id="probador-products" className="py-16 px-6 bg-gray-50">
      <div className="max-w-4xl mx-auto">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-center mb-2" style={{ color: primaryColor }}>Colección</p>
        <h2 className="text-3xl md:text-4xl font-black text-center mb-12 tracking-tight text-gray-900 italic uppercase">Nuestros productos</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {products.map(p => (
            <button key={p.id} onClick={() => onProductClick(p.id)}
              className="text-left rounded-2xl overflow-hidden border bg-white transition-all duration-200 hover:-translate-y-1"
              style={{ borderColor: selectedId === p.id ? primaryColor : '#e5e5e5', borderWidth: selectedId === p.id ? 1.5 : 1 }}>
              <div className="relative aspect-square overflow-hidden bg-gray-50">
                <ProductImage src={p.image_url} alt={p.name} className="w-full h-full object-cover transition-transform duration-300 hover:scale-105" />
                {p.badge && <span className="absolute top-2 left-2"><ProductBadge badge={p.badge} /></span>}
                {selectedId === p.id && (
                  <span className="absolute bottom-2 left-2 flex items-center gap-1 text-white text-[9px] font-bold uppercase tracking-wider px-2 py-1 rounded-full" style={{ backgroundColor: primaryColor }}>
                    Seleccionado
                  </span>
                )}
              </div>
              <div className="p-3">
                <p className="text-xs font-medium leading-tight truncate text-gray-700">{p.name}</p>
                <div className="flex items-center justify-between mt-1.5">
                  {p.price != null && <span className="text-sm font-bold text-gray-900">${p.price.toLocaleString('es-CO')}</span>}
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full" style={{ backgroundColor: primaryColor + '18', color: primaryColor }}>
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

function ProbadorInfo({ brand }: { brand: BrandData }) {
  const DAYS_ORDER = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
  const scheduleEntries = brand.schedule
    ? DAYS_ORDER.filter(d => d in brand.schedule!).map(d => [d, brand.schedule![d]] as [string, string])
    : [];
  if (scheduleEntries.length === 0 && !brand.city_display) return null;

  return (
    <section className="py-12 px-6 bg-gray-50 border-t border-gray-100">
      <div className="max-w-2xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-10">
        {brand.city_display && (
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 mb-4">Ubicación</p>
            <p className="text-sm text-gray-700 font-bold italic uppercase">{brand.city_display}</p>
            {brand.national_shipping && <p className="text-[10px] text-emerald-500 font-black mt-2 uppercase">✓ Envíos nacionales activos</p>}
          </div>
        )}
        {scheduleEntries.length > 0 && (
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 mb-4">Horarios</p>
            <div className="space-y-1.5">
              {scheduleEntries.map(([day, hours]) => (
                <div key={day} className="flex justify-between items-center text-[10px] border-b border-gray-200 pb-1 last:border-0">
                  <span className="text-gray-500 font-medium uppercase">{day}</span>
                  <span className="text-gray-900 font-black">{hours}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

export function TemplateModerno({ brandSlug, brand, products, footerUrl }: { brandSlug: string; brand: BrandData; products: ProductData[]; footerUrl?: string }) {
  const primary = brand.primary_color || '#FF5C3A';
  const [selectedId, setSelectedId] = useState<string | null>(products?.[0]?.id ?? null);

  const scrollToTryOn = () => {
    const el = document.getElementById('probador-tryon');
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  const handleProductClick = (id: string) => {
    setSelectedId(id);
    scrollToTryOn();
  };

  return (
    <div className={`min-h-screen flex flex-col bg-white ${brand.landing_font || 'font-jakarta'}`}>
      <ProbadorNav brand={brand} />
      <ProbadorHero brand={brand} onScrollDown={() => document.getElementById('probador-products')?.scrollIntoView({ behavior: 'smooth' })} />
      <ProbadorTrustBar brand={brand} />
      <ProbadorProducts products={products} primaryColor={primary} ctaText={brand.cta_button_text} onProductClick={handleProductClick} selectedId={selectedId} />
      
      <section id="probador-tryon" className="py-16 px-6 border-t border-gray-100 bg-white">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-8">
            <p className="text-[10px] font-semibold uppercase tracking-widest mb-2" style={{ color: primary }}>Probador IA</p>
            <h2 className="text-3xl font-black mb-2 tracking-tight text-gray-900 italic uppercase">Pruébatelo ahora</h2>
            <p className="text-sm font-light text-gray-500">Sube tu foto y la IA genera el resultado en segundos</p>
          </div>
          <div className="rounded-3xl overflow-hidden shadow-2xl border border-gray-100">
            <TryOnWidget brandSlug={brandSlug} isEmbed={true} initialProductId={selectedId} />
          </div>
        </div>
      </section>

      <ProbadorInfo brand={brand} />

      <footer className="py-12 px-6 text-center border-t border-gray-100 bg-white">
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400">
          Probador virtual impulsado por <a href={footerUrl || 'https://pruebalo.wilkiedevs.com'} target="_blank" rel="noopener noreferrer" className="hover:opacity-70 transition-opacity">Look<span className="text-[#FF5C3A]">itry</span> IA</a>
        </p>
      </footer>

      {brand.whatsapp_contact && <WhatsAppFAB phone={brand.whatsapp_contact} message={brand.whatsapp_message} />}
    </div>
  );
}
