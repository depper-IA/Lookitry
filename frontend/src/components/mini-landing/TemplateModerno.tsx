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

// ── Sub-componentes ──────────────────────────────────────────────────────────

function ProbadorNav({ brand }: { brand: BrandData }) {
  const entries = Object.entries(brand.social_links || {}).filter(([, url]) => !!url);
  const icons: Record<string, React.ReactNode> = {
    instagram: <InstagramIcon className="w-3.5 h-3.5" />,
    facebook:  <FacebookIcon  className="w-3.5 h-3.5" />,
    tiktok:    <TikTokIcon    className="w-3.5 h-3.5" />,
    youtube:   <YouTubeIcon   className="w-3.5 h-3.5" />,
    x:         <XIcon         className="w-3.5 h-3.5" />,
  };
  const primary = brand.primary_color || '#FF5C3A';
  return (
    <nav className="sticky top-0 z-50 h-16 md:h-20 flex items-center justify-between px-4 md:px-8 backdrop-blur-3xl" 
      style={{ 
        backgroundColor: brand.header_color ? `${brand.header_color}66` : 'rgba(15,15,15,0.4)', 
        borderBottom: '1px solid rgba(255,255,255,0.05)'
      }}>
      <div className="flex items-center gap-2">
        {brand.logo && (
          <BrandLogo
            src={brand.logo_light || brand.logo}
            alt={brand.name}
            className="h-6 md:h-8 w-auto object-contain"
          />
        )}
        {brand.show_brand_name !== false && (
          <span className="font-bold text-sm md:text-base text-white tracking-tight uppercase italic">{brand.name}</span>
        )}
      </div>
      {entries.length > 0 && (
        <div className="flex gap-1.5 overflow-x-auto no-scrollbar">
          {entries.map(([platform, url]) => (
            <a key={platform} href={url} target="_blank" rel="noopener noreferrer"
              className="w-7 h-7 rounded-lg border flex items-center justify-center transition-all hover:scale-110 shrink-0"
              style={{ borderColor: 'rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.7)' }}>
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
    <section className="relative py-16 md:py-24 px-6 text-center overflow-hidden" style={{ backgroundColor: heroBg }}>
      {hasCover && (
        <CoverImage src={brand.cover_image_url} alt={brand.name} className="absolute inset-0 w-full h-full object-cover" />
      )}
      <div className="absolute inset-0 bg-black/50" style={{ opacity: overlayOpacity }} />
      <div className="relative z-10 max-w-2xl mx-auto text-white">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-white/20 bg-white/5 backdrop-blur-md mb-6 md:mb-8">
          <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ backgroundColor: primary }} />
          <span className="text-[9px] md:text-[10px] font-black uppercase tracking-[0.2em]">IA Probador Activo</span>
        </div>
        <h1 className="text-4xl md:text-7xl font-black leading-[0.9] tracking-tighter mb-6 italic uppercase">
          {brand.name},<br />
          <em className="not-italic" style={{ color: primary }}>{brand.slogan || 'Moda Inteligente'}</em>
        </h1>
        {brand.brand_description && (
          <p className="text-sm md:text-base font-medium leading-relaxed mb-8 md:mb-10 max-w-lg mx-auto opacity-80">{brand.brand_description}</p>
        )}
        <button onClick={onScrollDown} className="inline-flex items-center gap-3 px-8 py-4 rounded-2xl text-xs md:text-sm font-black uppercase tracking-widest transition-all hover:scale-105 active:scale-95 shadow-2xl" style={{ backgroundColor: primary, color: '#fff' }}>
          Ver Colección
        </button>
      </div>
    </section>
  );
}

function ProbadorTrustBar({ brand }: { brand: BrandData }) {
  const rating = brand.rating ?? 4.9;
  const reviews = brand.total_reviews ?? 0;
  const items = [
    { value: rating.toFixed(1), label: 'rating' },
    { value: reviews > 0 ? `+${reviews}` : '96%', label: 'pruebas' },
    { value: '~12s', label: 'tiempo' },
    { value: 'IA', label: 'tech' },
  ];
  return (
    <div className="flex border-b bg-white border-gray-100 overflow-x-auto no-scrollbar">
      {items.map((item, i) => (
        <div key={i} className="flex-1 min-w-[80px] flex flex-col items-center justify-center py-4 md:py-6 text-center border-r last:border-r-0 border-gray-50">
          <span className="text-sm md:text-xl font-black text-gray-900">{item.value}</span>
          <span className="text-[8px] md:text-[10px] mt-0.5 text-gray-400 font-bold uppercase tracking-widest">{item.label}</span>
        </div>
      ))}
    </div>
  );
}

function ProbadorProducts({ products, primaryColor, ctaText, onProductClick, selectedId }: { products: ProductData[]; primaryColor: string; ctaText?: string | null; onProductClick: (id: string) => void; selectedId: string | null }) {
  if (!products || !products.length) return null;
  return (
    <section id="probador-products" className="py-16 px-4 md:px-6 bg-gray-50">
      <div className="max-w-5xl mx-auto text-center">
        <p className="text-[9px] font-black uppercase tracking-[0.3em] mb-3" style={{ color: primaryColor }}>Catálogo Curado</p>
        <h2 className="text-3xl md:text-5xl font-black mb-12 tracking-tighter text-gray-900 italic uppercase leading-none">Nuestros productos</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          {products.map(p => (
            <button key={p.id} onClick={() => onProductClick(p.id)}
              className="text-left group relative bg-white rounded-3xl overflow-hidden border transition-all duration-300 hover:shadow-2xl"
              style={{ borderColor: selectedId === p.id ? primaryColor : '#efefef', borderWidth: selectedId === p.id ? 2 : 1 }}>
              <div className="relative aspect-square overflow-hidden bg-gray-100">
                <ProductImage src={p.image_url} alt={p.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                {p.badge && <div className="absolute top-3 left-3 scale-90 origin-top-left"><ProductBadge badge={p.badge} /></div>}
                <div className={`absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity ${selectedId === p.id ? 'opacity-100' : ''}`}>
                   <div className="bg-white text-black px-4 py-2 rounded-xl font-black text-[10px] uppercase tracking-widest shadow-xl">
                     {selectedId === p.id ? 'Seleccionado' : (ctaText || 'Probar')}
                   </div>
                </div>
              </div>
              <div className="p-5">
                <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-1">{p.category}</p>
                <h3 className="text-sm font-black text-gray-900 uppercase tracking-tight line-clamp-1 group-hover:text-[#FF5C3A] transition-colors">{p.name}</h3>
                {p.price != null && <p className="text-base font-black mt-2 text-gray-900">${p.price.toLocaleString('es-CO')}</p>}
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
  let scheduleEntries: [string, string][] = [];
  try {
    const rawSchedule = brand.schedule;
    if (rawSchedule && typeof rawSchedule === 'object') {
      scheduleEntries = DAYS_ORDER
        .filter(day => rawSchedule[day] || rawSchedule[day.toLowerCase()])
        .map(day => [day, (rawSchedule[day] || rawSchedule[day.toLowerCase()]) as string]);
    }
  } catch (e) { console.error(e); }

  if (scheduleEntries.length === 0 && !brand.city_display) return null;

  return (
    <section className="py-16 px-6 bg-white border-t border-gray-50">
      <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-12 md:gap-20">
        {brand.city_display && (
          <div className="space-y-4">
            <span className="text-[9px] font-black uppercase tracking-[0.3em] text-gray-400">Encuéntranos</span>
            <h3 className="text-2xl font-black text-gray-900 uppercase italic tracking-tight">{brand.city_display}</h3>
            {brand.national_shipping && (
              <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-50 text-emerald-600 w-fit">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[10px] font-black uppercase tracking-widest">Envíos Nacionales Activos</span>
              </div>
            )}
          </div>
        )}
        {scheduleEntries.length > 0 && (
          <div className="space-y-6">
            <span className="text-[9px] font-black uppercase tracking-[0.3em] text-gray-400">Horarios</span>
            <div className="grid grid-cols-1 gap-2">
              {scheduleEntries.map(([day, hours]) => (
                <div key={day} className="flex justify-between items-center py-2 border-b border-gray-50 last:border-0">
                  <span className="text-[10px] text-gray-500 font-bold uppercase">{day}</span>
                  <span className={`text-[11px] font-black tracking-tight ${hours.toLowerCase().includes('cerrado') ? 'text-red-400 italic' : 'text-gray-900'}`}>{hours}</span>
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
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  const handleProductClick = (id: string) => {
    setSelectedId(id);
    scrollToTryOn();
  };

  return (
    <div className={`min-h-screen flex flex-col bg-white ${brand.landing_font || 'font-jakarta'} overflow-x-hidden`}>
      <ProbadorNav brand={brand} />
      <ProbadorHero brand={brand} onScrollDown={() => document.getElementById('probador-products')?.scrollIntoView({ behavior: 'smooth' })} />
      <ProbadorTrustBar brand={brand} />
      <ProbadorProducts products={products} primaryColor={primary} ctaText={brand.cta_button_text} onProductClick={handleProductClick} selectedId={selectedId} />
      
      <section id="probador-tryon" className="py-16 px-4 md:px-6 bg-[#0a0a0a]">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-10 space-y-3">
            <span className="text-[9px] font-black uppercase tracking-[0.4em] text-[#FF5C3A]">Motor IA</span>
            <h2 className="text-3xl md:text-5xl font-black text-white tracking-tighter uppercase italic leading-none">Probador Virtual</h2>
            <p className="text-gray-500 text-xs md:text-sm font-medium">Sube tu foto y procesa el producto seleccionado con IA</p>
          </div>
          <div className="rounded-[2.5rem] overflow-hidden shadow-2xl shadow-black/50 border border-white/5">
            <TryOnWidget brandSlug={brandSlug} isEmbed={true} initialProductId={selectedId} />
          </div>
        </div>
      </section>

      <ProbadorInfo brand={brand} />

      <footer className="py-16 px-6 text-center border-t border-gray-50 bg-white mt-auto">
        <p className="text-[9px] md:text-[10px] font-black uppercase tracking-[0.3em] text-gray-300">
          Powered by <a href={footerUrl || 'https://pruebalo.wilkiedevs.com'} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-[#FF5C3A] transition-all">Look<span className="text-[#FF5C3A]">itry</span> AI</a>
        </p>
      </footer>

      {brand.whatsapp_contact && <WhatsAppFAB phone={brand.whatsapp_contact} message={brand.whatsapp_message} />}
    </div>
  );
}
