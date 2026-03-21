'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { TryOnWidget } from '@/components/tryon/TryOnWidget';
import { BrandData, ProductData, WhatsAppIcon, WhatsAppFAB, LandingFooter, BrandLogo, ProductImage, ProductBadge, CoverImage, YouTubeIcon, XIcon } from './shared';

// ── Iconos internos del template (UI/UX Pro Max Style) ───────────────────────
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
      className="relative w-full min-h-[500px] md:min-h-[600px] flex flex-col px-0 overflow-hidden"
      style={{ background: brand.cover_bg_color || `#FAFAF9` }}
    >
      {/* Header Premium Glassmorphism */}
      <header 
        className="sticky top-0 z-50 w-full px-6 md:px-12 py-5 flex items-center justify-between backdrop-blur-2xl transition-all duration-300"
        style={{ 
          backgroundColor: brand.header_color ? `${brand.header_color}99` : 'rgba(255,255,255,0.6)',
          borderBottom: '1px solid rgba(0,0,0,0.05)',
        }}
      >
        <div className="flex items-center gap-4">
          {brand.logo ? (
            <BrandLogo src={brand.logo_dark || brand.logo} alt={brand.name} className="h-10 w-auto object-contain transition-transform hover:scale-105" />
          ) : (
             <span className="font-black text-xl tracking-tighter uppercase italic" style={{ color: primary }}>{brand.name}</span>
          )}
        </div>
        <div className="flex items-center gap-6">
          <nav className="hidden md:flex items-center gap-8">
            <button onClick={onScrollDown} className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-900/60 hover:text-gray-900 transition-colors">Catálogo</button>
            <a href="#contacto" className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-900/60 hover:text-gray-900 transition-colors">Ubicación</a>
          </nav>
          <button 
            onClick={onScrollDown}
            className="px-6 py-2.5 rounded-full text-white text-[10px] font-black uppercase tracking-widest shadow-lg shadow-black/10 hover:scale-105 active:scale-95 transition-all"
            style={{ backgroundColor: primary }}
          >
            Pruébatelo
          </button>
        </div>
      </header>

      <div className="flex-1 relative flex flex-col items-center justify-center text-center px-6 py-20">
        {hasCover && (
          <CoverImage src={brand.cover_image_url} alt={brand.name} className="absolute inset-0 w-full h-full object-cover" />
        )}
        {(hasCover && overlayOpacity > 0) && (
          <div className="absolute inset-0 bg-black/40 backdrop-grayscale-[0.2]" style={{ backgroundColor: `rgba(0,0,0,${overlayOpacity})` }} />
        )}
        <div className="relative z-10 flex flex-col items-center gap-6 max-w-3xl">
          <div className="inline-flex items-center gap-2 px-4 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white text-[9px] font-black uppercase tracking-[0.3em] mb-4">
            <SparklesIcon className="w-3.5 h-3.5 text-yellow-400" />
            Experiencia AI Premium
          </div>
          <h1 className="text-5xl md:text-8xl font-black text-white drop-shadow-2xl leading-[0.9] tracking-tighter uppercase italic">
            {brand.name}
          </h1>
          {brand.slogan && (
            <p className="text-white/90 text-sm md:text-base font-bold tracking-[0.15em] uppercase border-y border-white/20 py-2">
              {brand.slogan}
            </p>
          )}
          {brand.brand_description && (
            <p className="text-white/80 text-base md:text-lg max-w-xl leading-relaxed font-medium drop-shadow-md">
              {brand.brand_description}
            </p>
          )}
          <button
            onClick={onScrollDown}
            className="mt-8 group relative inline-flex items-center gap-3 px-10 py-5 rounded-2xl text-white font-black text-sm uppercase tracking-[0.2em] shadow-2xl transition-all hover:scale-105 active:scale-95"
            style={{ backgroundColor: primary }}
          >
            <SparklesIcon className="w-5 h-5 animate-pulse" />
            {brand.cta_button_text || 'Iniciar Probador IA'}
            <div className="absolute inset-0 rounded-2xl bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity" />
          </button>
        </div>
      </div>
      <button onClick={onScrollDown} className="absolute bottom-8 left-1/2 -translate-x-1/2 text-white/40 hover:text-white transition-colors animate-bounce" aria-label="Ver mas">
        <ChevronDownIcon className="w-8 h-8" />
      </button>
    </section>
  );
}

function ClassicHowItWorks({ primaryColor }: { primaryColor: string }) {
  const steps = [
    { num: '01', title: 'Elige tu Prenda', desc: 'Explora nuestra colección curada y selecciona lo que más te guste.' },
    { num: '02', title: 'Tu Fotografía', desc: 'Sube una foto frontal con buena luz para un resultado perfecto.' },
    { num: '03', title: 'Mira la Magia', desc: 'Nuestra IA integra la prenda a tu cuerpo en menos de 15 segundos.' },
  ];
  return (
    <section className="w-full bg-white py-24 px-6 border-b border-gray-100">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-6">
          <div className="space-y-4">
            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-400">Proceso Inteligente</span>
            <h2 className="text-4xl md:text-5xl font-black text-gray-900 tracking-tighter uppercase italic leading-none">¿Cómo funciona?</h2>
          </div>
          <p className="text-gray-500 max-w-xs text-sm font-medium leading-relaxed">Tecnología de vanguardia para que compres con total seguridad desde tu casa.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {steps.map(s => (
            <div key={s.num} className="group relative bg-gray-50 rounded-[2.5rem] p-10 transition-all hover:bg-white hover:shadow-2xl hover:shadow-black/5 border border-transparent hover:border-gray-100">
              <span className="block text-6xl font-black text-gray-200 group-hover:text-[#FF5C3A]/10 transition-colors mb-6">{s.num}</span>
              <h3 className="text-lg font-black text-gray-900 uppercase tracking-tight mb-4">{s.title}</h3>
              <p className="text-gray-500 text-sm leading-relaxed font-medium">{s.desc}</p>
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
    <section id="productos" className="w-full max-w-6xl mx-auto px-6 py-24">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-16 gap-8">
        <div className="space-y-4">
          <span className="text-[10px] font-black uppercase tracking-[0.3em]" style={{ color: primaryColor }}>Colección Oficial</span>
          <h2 className="text-4xl md:text-6xl font-black text-gray-900 tracking-tighter uppercase italic leading-none">Catálogo</h2>
        </div>
        <div className="flex items-center gap-4 bg-gray-50 p-4 rounded-3xl border border-gray-100">
          <div className="w-10 h-10 rounded-2xl bg-white flex items-center justify-center shadow-sm">
            <SparklesIcon className="w-5 h-5 text-yellow-500" />
          </div>
          <p className="text-[11px] font-bold text-gray-500 uppercase tracking-widest leading-snug">Selecciona para<br />probar con IA</p>
        </div>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
        {products.map(p => (
          <button key={p.id} onClick={() => onProductClick(p.id)} className="group relative rounded-[2rem] overflow-hidden bg-white transition-all duration-500 hover:shadow-[0_30px_60px_-15px_rgba(0,0,0,0.1)]">
            <div className="relative aspect-[3/4] overflow-hidden bg-gray-50">
              <ProductImage src={p.image_url} alt={p.name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-all duration-500 flex items-center justify-center backdrop-blur-[2px]">
                <div className="transform translate-y-4 group-hover:translate-y-0 transition-transform duration-500 bg-white text-black px-6 py-3 rounded-xl font-black text-[10px] uppercase tracking-[0.2em] shadow-2xl">
                  {ctaText || 'Probar Prenda'}
                </div>
              </div>
              {p.badge && <span className="absolute top-4 left-4"><ProductBadge badge={p.badge} /></span>}
            </div>
            <div className="p-6 text-left">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[9px] font-black uppercase tracking-[0.2em] text-gray-400">{p.category}</span>
                {p.price != null && <span className="text-sm font-black text-gray-900">${p.price.toLocaleString('es-CO')}</span>}
              </div>
              <h3 className="font-bold text-base text-gray-900 leading-tight group-hover:text-[#FF5C3A] transition-colors line-clamp-1 uppercase tracking-tight">{p.name}</h3>
            </div>
          </button>
        ))}
      </div>
    </section>
  );
}

function ClassicTryOn({ brandSlug, primaryColor, selectedProductId }: { brandSlug: string; primaryColor: string; selectedProductId: string | null }) {
  return (
    <section id="tryon-section" className="w-full py-24 px-6 bg-[#0a0a0a]">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-16 space-y-4">
          <span className="text-[10px] font-black uppercase tracking-[0.4em] text-[#FF5C3A]">Motor de Inteligencia Artificial</span>
          <h2 className="text-4xl md:text-6xl font-black text-white tracking-tighter uppercase italic leading-none">Probador Virtual</h2>
          <p className="text-gray-500 text-sm md:text-base font-medium max-w-lg mx-auto">Sube tu foto y nuestra red neuronal procesará la prenda sobre tu cuerpo en tiempo real.</p>
        </div>
        <div className="rounded-[3rem] overflow-hidden shadow-[0_50px_100px_-20px_rgba(0,0,0,0.5)] border border-white/5 bg-[#141414]">
          <TryOnWidget brandSlug={brandSlug} isEmbed={true} initialProductId={selectedProductId} />
        </div>
      </div>
    </section>
  );
}

function ClassicInfo({ brand, primaryColor }: { brand: BrandData; primaryColor: string }) {
  // Fix: Los horarios en brands vienen como JSONB, aseguramos procesamiento robusto
  const DAYS_ORDER = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
  
  // Procesar schedule independientemente de si viene como objeto o string (resiliencia total)
  let scheduleEntries: [string, string][] = [];
  try {
    const rawSchedule = brand.schedule;
    if (rawSchedule && typeof rawSchedule === 'object') {
      scheduleEntries = DAYS_ORDER
        .filter(day => rawSchedule[day] || rawSchedule[day.toLowerCase()])
        .map(day => [day, (rawSchedule[day] || rawSchedule[day.toLowerCase()]) as string]);
    }
  } catch (e) {
    console.error('[ClassicInfo] Error parsing schedule:', e);
  }

  const hasRating = brand.rating != null;
  const hasLocation = !!(brand.city_display || brand.national_shipping);
  const hasSchedule = scheduleEntries.length > 0;
  
  if (!hasRating && !hasLocation && !hasSchedule) return null;

  return (
    <section id="contacto" className="w-full max-w-6xl mx-auto px-6 py-24 border-t border-gray-100">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
        <div className="space-y-12">
          <div className="space-y-4">
            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-400">Información Oficial</span>
            <h2 className="text-4xl md:text-5xl font-black text-gray-900 tracking-tighter uppercase italic leading-none">Ubicación y Status</h2>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
            {hasRating && (
              <div className="p-8 bg-gray-50 rounded-[2rem] border border-gray-100 space-y-4">
                <div className="flex items-center gap-1 text-yellow-400">
                  {[1,2,3,4,5].map(i => <StarIcon key={i} className="w-4 h-4" filled={i <= Math.round(brand.rating!)} />)}
                </div>
                <div>
                  <p className="text-3xl font-black text-gray-900 tracking-tighter">{brand.rating!.toFixed(1)}</p>
                  <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mt-1">{brand.total_reviews?.toLocaleString('es-CO') || 0} Valoraciones Reales</p>
                </div>
              </div>
            )}
            {brand.city_display && (
              <div className="p-8 bg-gray-50 rounded-[2rem] border border-gray-100 space-y-4">
                <div className="w-10 h-10 rounded-2xl bg-white flex items-center justify-center shadow-sm">
                  <MapPinIcon className="w-5 h-5 text-gray-900" />
                </div>
                <div>
                  <p className="text-lg font-black text-gray-900 tracking-tight uppercase italic">{brand.city_display}</p>
                  <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mt-1">Sede Principal</p>
                </div>
              </div>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-4">
            {brand.social_links && Object.entries(brand.social_links).filter(([,url])=>!!url).map(([platform, url]) => {
              const icons: any = { instagram: <InstagramIcon />, facebook: <FacebookIcon />, tiktok: <TikTokIcon />, youtube: <YouTubeIcon />, x: <XIcon /> };
              return (
                <a key={platform} href={url} target="_blank" rel="noopener noreferrer" className="w-14 h-14 rounded-2xl bg-gray-900 text-white flex items-center justify-center transition-all hover:scale-110 hover:-rotate-3 active:scale-95 shadow-xl shadow-black/10">
                  <div className="w-6 h-6">{icons[platform.toLowerCase()] || platform.slice(0,1)}</div>
                </a>
              );
            })}
          </div>
        </div>

        {hasSchedule && (
          <div className="bg-white rounded-[2.5rem] border-2 border-gray-100 p-10 md:p-12 shadow-2xl shadow-black/[0.02]">
            <div className="flex items-center gap-4 mb-10">
              <div className="w-12 h-12 rounded-2xl bg-gray-900 flex items-center justify-center text-white">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-12 0 9 9 0 0112 0z" /></svg>
              </div>
              <div>
                <h3 className="text-xl font-black text-gray-900 uppercase italic tracking-tight">Horarios de Atención</h3>
                <p className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest mt-0.5">Tienda verificada</p>
              </div>
            </div>
            <div className="space-y-4">
              {scheduleEntries.map(([day, hours]) => (
                <div key={day} className="flex justify-between items-center py-3 border-b border-gray-50 last:border-0">
                  <span className="text-xs font-black text-gray-400 uppercase tracking-widest">{day}</span>
                  <span className={`text-sm font-bold tracking-tight ${hours.toLowerCase() === 'cerrado' ? 'text-red-400 italic' : 'text-gray-900'}`}>{hours}</span>
                </div>
              ))}
            </div>
          </div>
        )}
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
    <div className={`min-h-screen bg-white flex flex-col ${brand.landing_font || 'font-jakarta'} transition-colors duration-500`}>
      <ClassicHero brand={brand} onScrollDown={() => document.getElementById('productos')?.scrollIntoView({ behavior: 'smooth' })} />
      <ClassicHowItWorks primaryColor={primary} />
      <ClassicProducts products={products} primaryColor={primary} ctaText={brand.cta_button_text} onProductClick={scrollToTryOn} />
      <ClassicTryOn brandSlug={brandSlug} primaryColor={primary} selectedProductId={selectedProductId} />
      <ClassicInfo brand={brand} primaryColor={primary} />
      
      <footer className="py-20 px-6 text-center border-t border-gray-100 bg-white">
        <div className="max-w-6xl mx-auto flex flex-col items-center gap-8">
          {brand.logo && <BrandLogo src={brand.logo_dark || brand.logo} alt={brand.name} className="h-8 opacity-30 grayscale" />}
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-300">
            Tecnología Probador Virtual impulsada por <a href={footerUrl || 'https://pruebalo.wilkiedevs.com'} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-[#FF5C3A] transition-colors">Look<span className="text-[#FF5C3A]">itry</span> IA</a>
          </p>
        </div>
      </footer>

      {brand.whatsapp_contact && <WhatsAppFAB phone={brand.whatsapp_contact} message={brand.whatsapp_message} />}
    </div>
  );
}
