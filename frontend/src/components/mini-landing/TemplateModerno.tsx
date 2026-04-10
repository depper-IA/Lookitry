'use client';

import { useState } from 'react';
import { TryOnWidget } from '@/components/tryon/TryOnWidget';
import { 
  BrandData, 
  ProductData, 
  WhatsAppFAB, 
  BrandLogo, 
  ProductImage, 
  ProductBadge, 
  CoverImage, 
  getCoverPresentation,
  getVisibleSocialEntries,
  YouTubeIcon, 
  XIcon, 
  InstagramIcon, 
  FacebookIcon, 
  TikTokIcon,
  SparklesIcon
} from './shared';

// ── Sub-componentes ──────────────────────────────────────────────────────────

function ProbadorNav({ brand }: { brand: BrandData }) {
  const entries = getVisibleSocialEntries(brand.social_links || {});
  const socialIcons: Record<string, React.ReactNode> = {
    instagram: <InstagramIcon className="w-3.5 h-3.5" />,
    facebook:  <FacebookIcon  className="w-3.5 h-3.5" />,
    tiktok:    <TikTokIcon    className="w-3.5 h-3.5" />,
    youtube:   <YouTubeIcon   className="w-3.5 h-3.5" />,
    x:         <XIcon         className="w-3.5 h-3.5" />,
  };
  const primary = brand.social_links?._landing_primary || brand.primary_color || '#111111';
  const secondary = brand.social_links?._landing_secondary || primary;
  return (
    <nav className="sticky top-0 z-50 h-16 md:h-20 flex items-center justify-between px-4 md:px-8 gap-4 shadow-xl" 
      style={{ 
        backgroundColor: brand.header_color || '#000000', 
        borderBottom: '1px solid rgba(255,255,255,0.05)'
      }}>
      <div className="flex items-center gap-2 min-w-0 flex-1">
        <div className="shrink-0">
          {brand.logo && (
            <BrandLogo
              src={brand.logo_light || brand.logo}
              alt={brand.name}
              className="h-6 md:h-8 w-auto object-contain"
            />
          )}
        </div>
        {brand.show_brand_name !== false && (
          <span className="font-bold text-sm md:text-base text-white tracking-tight uppercase italic truncate">
            {brand.name}
          </span>
        )}
      </div>
      {entries.length > 0 && (
        <div className="flex gap-1.5 overflow-x-auto no-scrollbar py-1 shrink-0 max-w-[140px] sm:max-w-none justify-end">
          {entries.map(([platform, url]) => (
            <a key={platform} href={url} target="_blank" rel="noopener noreferrer" aria-label={`Síguenos en ${platform}`}
              className="w-7 h-7 rounded-lg border flex items-center justify-center transition-all hover:scale-110 shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF5C3A] focus-visible:ring-offset-2"
              style={{ borderColor: 'rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.7)' }}>
              {socialIcons[platform.toLowerCase()] ?? null}
            </a>
          ))}
        </div>
      )}
    </nav>
  );
}

function ProbadorHero({ brand, onScrollDown, isPreview = false }: { brand: BrandData; onScrollDown: () => void; isPreview?: boolean }) {
  const primary = brand.social_links?._landing_primary || brand.primary_color || '#111111';
  const secondary = brand.social_links?._landing_secondary || primary;
  const hasCover = !!brand.cover_image_url;
  const { backgroundColor: heroBg, imageOpacity } = getCoverPresentation(brand, '#0f0f0f');
  return (
    <section className={`relative ${isPreview ? 'py-8 md:py-12' : 'py-16 md:py-24'} px-6 text-center overflow-hidden`} style={{ backgroundColor: heroBg }}>
      {hasCover && (
        <CoverImage src={brand.cover_image_url} alt={brand.name} className="absolute inset-0 w-full h-full object-cover" style={{ opacity: imageOpacity }} />
      )}
      <div className="relative z-10 max-w-2xl mx-auto text-white">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-white/20 bg-white/5 backdrop-blur-md mb-6 md:mb-8">
          <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ backgroundColor: primary }} />
          <span className="text-[9px] md:text-[10px] font-black uppercase tracking-[0.2em]">IA Probador Activo</span>
        </div>
        <h1 className="text-3xl md:text-7xl font-black leading-[0.9] tracking-tighter mb-6 italic uppercase">
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
        <p className="text-[9px] font-black uppercase tracking-[0.3em] text-[var(--secondary)] mb-3">Catálogo Curado</p>
        <h2 className="text-2xl md:text-5xl font-black mb-12 tracking-tighter text-gray-900 italic uppercase leading-none">Nuestros productos</h2>
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
                <h3 className="text-sm font-black text-gray-900 uppercase tracking-tight line-clamp-1 group-hover:text-[var(--secondary)] transition-colors">{p.name}</h3>
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
    const rawSchedule = brand.schedule ?? {};
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
            <span className="text-[9px] font-black uppercase tracking-[0.3em] text-[var(--secondary)]">Encuéntranos</span>
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
            <span className="text-[9px] font-black uppercase tracking-[0.3em] text-[var(--secondary)]">Horarios</span>
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

export function TemplateModerno({ brandSlug, brand, products, footerUrl, isPreview = false }: { brandSlug: string; brand: BrandData; products: ProductData[]; footerUrl?: string; isPreview?: boolean }) {
  const primary = brand.social_links?._landing_primary || brand.primary_color || '#111111';
  const secondary = brand.social_links?._landing_secondary || primary;
  const [selectedId, setSelectedId] = useState<string | null>(products && products.length > 0 ? products[0].id : null);

  const scrollToTryOn = () => {
    const el = document.getElementById('probador-tryon');
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  const handleProductClick = (id: string) => {
    setSelectedId(id);
    scrollToTryOn();
  };

  return (
    <div className={`min-h-screen flex flex-col bg-white ${brand.landing_font || 'font-jakarta'} overflow-x-hidden ${isPreview ? 'p-0 h-auto' : ''}`} style={{ "--primary": primary, "--secondary": secondary, "--secondary-10": secondary + "1a", "--secondary-20": secondary + "33", "--secondary-05": secondary + "0d" } as React.CSSProperties}>
      <ProbadorNav brand={brand} />
      <ProbadorHero brand={brand} onScrollDown={() => document.getElementById('probador-products')?.scrollIntoView({ behavior: 'smooth' })} isPreview={isPreview} />
      <ProbadorTrustBar brand={brand} />
      <ProbadorProducts products={products} primaryColor={primary} ctaText={brand.cta_button_text} onProductClick={handleProductClick} selectedId={selectedId} />
      
      <section id="probador-tryon" className="py-16 px-4 md:px-6" style={{ backgroundColor: brand.widget_bg_color || '#0a0a0a' }}>
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-10 space-y-3">
            <span className="text-[9px] font-black uppercase tracking-[0.4em] text-[var(--secondary)]">Motor IA</span>
            <h2 className="text-3xl md:text-5xl font-black text-white tracking-tighter uppercase italic leading-none">Probador Virtual</h2>
            <p className="text-gray-500 text-xs md:text-sm font-medium">Sube tu foto y procesa el producto seleccionado con IA</p>
          </div>
          <div className={isPreview ? "overflow-hidden" : "rounded-[2.5rem] overflow-hidden shadow-2xl shadow-black/50 border border-white/5"}>
            <TryOnWidget brandSlug={brandSlug} isEmbed={true} initialProductId={selectedId} forceLayout="bare" lockProductSelection={true} />
          </div>
        </div>
      </section>

      <ProbadorInfo brand={brand} />

      <footer className="py-16 px-6 text-center border-t border-gray-50 bg-white mt-auto">
        <p className="text-[9px] md:text-[10px] font-black uppercase tracking-[0.3em] text-gray-300">
          Powered by <a href={footerUrl || 'https://lookitry.com'} target="_blank" rel="noopener noreferrer" className="font-bold hover:opacity-80 transition-all text-gray-900">Look<span className="text-[#FF5C3A]">itry</span> IA</a>
        </p>
      </footer>

      {brand.whatsapp_contact && !isPreview && <WhatsAppFAB phone={brand.whatsapp_contact} message={brand.whatsapp_message} />}
    </div>
  );
}
