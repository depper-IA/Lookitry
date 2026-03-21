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

function MapPinIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  );
}

function TruckIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0" />
    </svg>
  );
}

// ── Sub-componentes ──────────────────────────────────────────────────────────

function ClassicHero({ brand, onScrollDown }: { brand: BrandData; onScrollDown: () => void }) {
  const primary = brand.primary_color || '#FF5C3A';
  const hasCover = !!brand.cover_image_url;
  const overlayOpacity = brand.cover_overlay_opacity ?? 0.55;
  return (
    <section
      className="relative w-full min-h-[420px] md:min-h-[520px] flex flex-col px-0 overflow-hidden"
      style={{ background: brand.cover_bg_color || `#FAFAF9` }}
    >
      {/* Header Clásico con Glassmorphism Premium */}
      <header 
        className="sticky top-0 z-50 w-full px-6 py-4 flex items-center justify-between backdrop-blur-xl transition-all duration-300"
        style={{ 
          backgroundColor: brand.header_color ? `${brand.header_color}99` : 'rgba(255,255,255,0.4)',
          borderBottom: '1px solid rgba(255,255,255,0.1)',
          boxShadow: '0 4px 30px rgba(0, 0, 0, 0.05)',
        }}
      >
        <div className="flex items-center gap-3">
          {brand.logo ? (
            <BrandLogo src={brand.logo_dark || brand.logo} alt={brand.name} className="h-8 object-contain" />
          ) : (
             <span className="font-bold text-lg" style={{ color: brand.primary_color }}>{brand.name}</span>
          )}
        </div>
        <button onClick={onScrollDown} className="text-xs font-bold uppercase tracking-widest px-5 py-2.5 rounded-full border transition-all hover:bg-black/5" style={{ borderColor: 'rgba(0,0,0,0.1)' }}>
          Explorar
        </button>
      </header>

      <div className="flex-1 relative flex flex-col items-center justify-center text-center px-6 py-12">
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
    </div>
    <button onClick={onScrollDown} className="absolute bottom-6 left-1/2 -translate-x-1/2 text-white/60 hover:text-white/90 transition-colors animate-bounce" aria-label="Ver mas">
        <ChevronDownIcon className="w-7 h-7" />
      </button>
    </section>
  );
}

function ClassicHowItWorks({ primaryColor }: { primaryColor: string }) {
  const steps = [
    { num: '1', title: 'Elige un producto', desc: 'Navega por el catálogo y selecciona la prenda que quieras probar.' },
    { num: '2', title: 'Sube tu foto', desc: 'Toma o sube una foto tuya. Funciona mejor con buena iluminación.' },
    { num: '3', title: 'Ve el resultado', desc: 'Nuestra IA genera en segundos como te verías con ese producto.' },
  ];
  return (
    <section className="w-full bg-gray-50 py-16 px-4">
      <div className="max-w-4xl mx-auto">
        <h2 className="text-2xl md:text-3xl font-bold text-gray-900 text-center mb-2">¿Cómo funciona?</h2>
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
    <section id="productos" className="w-full max-w-5xl mx-auto px-4 py-14">
      <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2 text-center">Catálogo</h2>
      <p className="text-gray-500 text-center mb-10 text-sm">Selecciona un producto para probártelo virtualmente</p>
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

function ClassicTryOn({ brandSlug, primaryColor, selectedProductId }: { brandSlug: string; primaryColor: string; selectedProductId: string | null }) {
  return (
    <section id="tryon-section" className="w-full py-14 px-4" style={{ backgroundColor: primaryColor + '0d' }}>
      <div className="max-w-2xl mx-auto">
        <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2 text-center">Probador virtual</h2>
        <p className="text-gray-500 text-center mb-8 text-sm">Sube una foto tuya y ve como te queda el producto con IA</p>
        <div className="rounded-3xl overflow-hidden shadow-2xl border border-gray-100 bg-white">
          <TryOnWidget brandSlug={brandSlug} isEmbed={true} initialProductId={selectedProductId} />
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
    <section id="contacto" className="w-full max-w-2xl mx-auto px-4 py-10 text-center">
      <h2 className="text-xl font-bold text-gray-900 mb-6">Síguenos</h2>
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
  const DAYS_ORDER = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
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
            <div className="flex items-center gap-1 text-yellow-400">
              {[1,2,3,4,5].map(i => (
                <StarIcon key={i} className="w-4 h-4" filled={i <= Math.round(brand.rating!)} />
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
            <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-3">Horario de atención</p>
            <div className="space-y-2">
              {scheduleEntries.map(([day, hours]) => (
                <div key={day} className="flex justify-between text-sm border-b border-gray-50 pb-1 last:border-0">
                  <span className="text-gray-500">{day}</span>
                  <span className={hours === 'Cerrado' ? 'text-gray-300 italic' : 'text-gray-800 font-medium'}>{hours}</span>
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
        <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">¿Tienes preguntas?</h2>
        <p className="text-gray-500 text-sm mb-8">Escríbenos directamente y te respondemos al instante</p>
        <a href={`https://wa.me/${clean}${msg}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-3 px-8 py-4 rounded-2xl text-white font-bold text-base shadow-lg hover:opacity-90 active:scale-95 transition-all" style={{ backgroundColor: '#25D366' }}>
          <WhatsAppIcon className="w-6 h-6" />
          Escribir por WhatsApp
        </a>
      </div>
    </section>
  );
}

export function TemplateClassic({ brandSlug, brand, products, footerUrl }: { brandSlug: string; brand: BrandData; products: ProductData[]; footerUrl?: string }) {
  const primary = brand.primary_color || '#FF5C3A';
  const [selectedProductId, setSelectedProductId] = useState<string | null>(products[0]?.id || null);
  
  const scrollToTryOn = (productId?: string) => {
    if (productId) setSelectedProductId(productId);
    document.getElementById('tryon-section')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-white flex flex-col font-sans">
      <ClassicHero brand={brand} onScrollDown={() => document.getElementById('productos')?.scrollIntoView({ behavior: 'smooth' })} />
      <ClassicHowItWorks primaryColor={primary} />
      <ClassicProducts products={products} primaryColor={primary} ctaText={brand.cta_button_text} onProductClick={scrollToTryOn} />
      <ClassicTryOn brandSlug={brandSlug} primaryColor={primary} selectedProductId={selectedProductId} />
      <ClassicInfo brand={brand} primaryColor={primary} />
      <ClassicSocial brand={brand} />
      <ClassicContact brand={brand} primaryColor={primary} />
      
      <footer className="py-12 px-6 text-center border-t border-gray-100 bg-white">
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400">
          Probador virtual impulsado por <a href={footerUrl || 'https://pruebalo.wilkiedevs.com'} target="_blank" rel="noopener noreferrer" className="hover:opacity-70 transition-opacity">Look<span className="text-[#FF5C3A]">itry</span> IA</a>
        </p>
      </footer>

      {brand.whatsapp_contact && <WhatsAppFAB phone={brand.whatsapp_contact} message={brand.whatsapp_message} />}
    </div>
  );
}
