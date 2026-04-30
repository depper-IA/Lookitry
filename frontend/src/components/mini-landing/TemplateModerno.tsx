'use client';

import { useState, useEffect, useMemo } from 'react';
import { TryOnWidget } from '@/components/tryon/TryOnWidget';
import {
  BrandData,
  ProductData,
  WhatsAppFAB,
  BrandLogo,
  ProductImage,
  ProductBadge,
  CoverImage,
  ProductSkeleton,
  getCoverPresentation,
  getVisibleSocialEntries,
  useScrollReveal,
  isDarkColor,
  getSmartMutedColor,
  getSmartBorderColor,
  useContrastTheme,
  useLandingTheme,
  LandingTheme,
  getCssColor,
  YouTubeIcon,
  XIcon,
  InstagramIcon,
  FacebookIcon,
  TikTokIcon,
  SparklesIcon
} from './shared';

// ── Sub-componentes ──────────────────────────────────────────────────────────


function ProbadorHero({ brand, onScrollDown, isPreview = false }: { brand: BrandData; onScrollDown: () => void; isPreview?: boolean }) {
  const primary = brand.social_links?._landing_primary || brand.primary_color || '#111111';
  const hasCover = !!brand.cover_image_url;
  const { backgroundColor: heroBg, imageOpacity } = getCoverPresentation(brand, '#0a0a0a');
  return (
    <section
      className={`relative ${isPreview ? 'py-10' : 'py-20 md:py-32'} px-6 text-center overflow-hidden`}
      style={{ backgroundColor: heroBg }}
    >
      {/* Cover image con gradient fade */}
      {hasCover && (
        <>
          <CoverImage
            src={brand.cover_image_url}
            alt={brand.name}
            className="absolute inset-0 w-full h-full object-cover"
            style={{ opacity: 1 }}
          />
          <div
            className="absolute inset-0 pointer-events-none"
            style={{ background: `linear-gradient(to bottom, transparent 0%, ${heroBg} 100%)` }}
          />
        </>
      )}

      {/* Ambient glow */}
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] rounded-full blur-[120px] opacity-15 pointer-events-none"
        style={{ backgroundColor: primary }}
      />

      <div className="relative z-10 max-w-2xl mx-auto flex flex-col items-center">
        {/* Logo card con glow — Bold style */}
        <div className="relative group mb-8 md:mb-10">
          <div
            className="absolute inset-0 rounded-3xl opacity-20 group-hover:opacity-30 transition-opacity duration-700 blur-xl"
            style={{ backgroundColor: primary }}
          />
          <div className="relative z-10 p-5 md:p-6 rounded-3xl bg-white/5 border border-white/10 shadow-2xl transition-transform duration-700 group-hover:scale-[1.02]">
            {brand.logo ? (
              <BrandLogo
                src={brand.logo_light || brand.logo}
                alt={brand.name}
                className={`${isPreview ? 'h-14' : 'h-16 md:h-24'} w-auto object-contain max-w-[200px]`}
              />
            ) : (
              <span
                className={`font-black italic ${isPreview ? 'text-4xl' : 'text-5xl md:text-6xl'}`}
                style={{ color: primary }}
              >
                {brand.name.charAt(0)}
              </span>
            )}
          </div>
        </div>

        {/* Nombre + barra de acento */}
        <div className="space-y-4 flex flex-col items-center">
          <h1
            className={`font-black tracking-tighter uppercase italic leading-none text-white ${isPreview ? 'text-2xl' : 'text-4xl md:text-6xl lg:text-7xl'}`}
          >
            {brand.name}
          </h1>
          <div className="flex flex-col items-center gap-3">
            <div className={`${isPreview ? 'w-10 h-1' : 'w-16 h-1.5'} rounded-full`} style={{ backgroundColor: primary }} />
            <h2
              className={`font-bold tracking-[0.3em] uppercase italic text-white/70 ${isPreview ? 'text-xs' : 'text-sm md:text-base'}`}
            >
              {brand.slogan || brand.brand_description?.slice(0, 60) || brand.name}
            </h2>
          </div>
        </div>

        {/* Live badge */}
        <div className="mt-6 md:mt-8 inline-flex items-center gap-2 px-3 py-1 rounded-full border border-white/15 bg-white/5 backdrop-blur-md">
          <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ backgroundColor: primary }} />
          <span className="text-[9px] font-black uppercase tracking-[0.2em] text-white/80">IA Probador Activo</span>
        </div>

        {/* CTA */}
        <button
          onClick={onScrollDown}
          className="mt-8 md:mt-10 inline-flex items-center gap-3 px-8 py-4 rounded-2xl text-xs md:text-sm font-black uppercase tracking-widest transition-all hover:scale-105 active:scale-95"
          style={{ backgroundColor: primary, color: '#fff', boxShadow: `0 15px 40px ${primary}50` }}
        >
          Ver Colección
          <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
          </svg>
        </button>
      </div>
    </section>
  );
}

function ProbadorTrustBar({ brand }: { brand: BrandData }) {
  const theme = useContrastTheme('#f9fafb');
  const rating = brand.rating ?? 0;
  const reviews = brand.total_reviews ?? 0;
  const hasRating = rating > 0;
  const hasReviews = reviews > 0;

  const items = [
    ...(hasRating ? [{ value: rating.toFixed(1), label: 'rating' }] : []),
    ...(hasReviews ? [{ value: `+${reviews}`, label: 'pruebas' }] : []),
  ];

  if (items.length === 0) return null;

  return (
    <div className="flex border-b overflow-x-auto no-scrollbar" style={{ backgroundColor: theme.bg, borderColor: theme.border }}>
      {items.map((item, i) => (
        <div key={i} className="flex-1 min-w-[80px] flex flex-col items-center justify-center py-4 md:py-6 text-center border-r last:border-r-0" style={{ borderColor: theme.border }}>
          <span className="text-sm md:text-xl font-black" style={{ color: theme.text }}>{item.value}</span>
          <span className="text-[8px] md:text-[10px] mt-0.5 font-bold uppercase tracking-widest" style={{ color: theme.muted }}>{item.label}</span>
        </div>
      ))}
    </div>
  );
}

function ProbadorProducts({
  products, primaryColor, secondaryColor, ctaText, onProductClick, selectedId
}: {
  products: ProductData[];
  primaryColor: string;
  secondaryColor?: string;
  ctaText?: string | null;
  onProductClick: (id: string) => void;
  selectedId: string | null;
}) {
  const theme = useContrastTheme('#f9fafb');
  const [isLoading, setIsLoading] = useState(true);
  const [filterCat, setFilterCat] = useState<string>('all');
  const [sortOption, setSortOption] = useState<string>('featured');
  const { ref: sectionRef, isVisible } = useScrollReveal();

  useEffect(() => {
    if (products && products.length > 0) setIsLoading(false);
  }, [products]);

  const categories = useMemo(() => {
    const cats = products.map(p => p.category).filter(Boolean);
    return Array.from(new Set(cats)) as string[];
  }, [products]);

  const sortedProducts = useMemo(() => {
    let list = filterCat === 'all' ? products : products.filter(p => p.category === filterCat);
    if (sortOption === 'price_asc') list = [...list].sort((a, b) => (a.price ?? 0) - (b.price ?? 0));
    else if (sortOption === 'price_desc') list = [...list].sort((a, b) => (b.price ?? 0) - (a.price ?? 0));
    else if (sortOption === 'name_asc') list = [...list].sort((a, b) => a.name.localeCompare(b.name));
    return list;
  }, [products, filterCat, sortOption]);

  if (!products || !products.length) return null;

  return (
    <section
      ref={sectionRef}
      id="probador-products"
      className={`py-16 px-4 md:px-6 transition-all duration-700 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}
      style={{ backgroundColor: theme.bg }}
    >
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="text-center mb-10">
          <p className="text-[9px] font-black uppercase tracking-[0.3em] mb-2" style={{ color: primaryColor }}>
            Catálogo Curado
          </p>
          <h2
            className="text-2xl md:text-4xl font-black tracking-tighter italic uppercase leading-none"
            style={{ color: theme.text }}
          >
            Nuestros productos
          </h2>
        </div>

        {/* Filtros + Sort */}
        <div className="flex flex-col gap-2 mb-8">
          {/* Categorías */}
          <div className="flex items-center gap-5 overflow-x-auto hide-scrollbar py-1">
            {(['all', ...categories] as string[]).map(cat => {
              const active = filterCat === cat;
              return (
                <button
                  key={cat}
                  onClick={() => setFilterCat(cat)}
                  className="whitespace-nowrap text-[10px] uppercase tracking-[0.2em] transition-all duration-200 flex flex-col items-center gap-1 pb-0.5"
                  style={{
                    color: active ? primaryColor : theme.text,
                    fontWeight: active ? 700 : 400,
                    opacity: active ? 1 : 0.5,
                  }}
                >
                  {cat === 'all' ? 'Todo' : cat}
                  <span
                    className="block w-1 h-1 rounded-full transition-all duration-200"
                    style={{ backgroundColor: active ? primaryColor : 'transparent' }}
                  />
                </button>
              );
            })}
          </div>

          {/* Sort */}
          <div className="flex items-center justify-end gap-3">
            {([['featured', 'Destacados'], ['price_asc', '$ ↑'], ['price_desc', '$ ↓'], ['name_asc', 'A–Z']] as [string, string][]).map(([val, label]) => (
              <button
                key={val}
                onClick={() => setSortOption(val)}
                className="text-[8px] uppercase tracking-[0.15em] transition-all duration-200 whitespace-nowrap"
                style={{
                  color: sortOption === val ? primaryColor : theme.text,
                  fontWeight: sortOption === val ? 700 : 400,
                  opacity: sortOption === val ? 1 : 0.45,
                }}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Grid de productos */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          {isLoading ? (
            <>{[0, 1, 2, 3, 4, 5].map(i => <ProductSkeleton key={i} primaryColor={primaryColor} />)}</>
          ) : (
            sortedProducts.map(p => (
              <button key={p.id} onClick={() => onProductClick(p.id)} aria-label={`Seleccionar ${p.name}`}
                className="text-left group relative rounded-3xl overflow-hidden border transition-all duration-300 hover:shadow-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF5C3A] focus-visible:ring-offset-2"
                style={{ backgroundColor: '#ffffff', borderColor: selectedId === p.id ? primaryColor : '#e5e7eb', borderWidth: selectedId === p.id ? 2 : 1 }}>
                <div className="relative aspect-square overflow-hidden" style={{ backgroundColor: theme.surface }}>
                  <ProductImage src={p.image_url} alt={p.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw" primaryColor={primaryColor} />
                  {p.badge && <div className="absolute top-3 left-3 scale-90 origin-top-left"><ProductBadge badge={p.badge} primaryColor={primaryColor} /></div>}
                  <div className={`absolute inset-0 flex items-center justify-center transition-opacity ${selectedId === p.id ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`} style={{ backgroundColor: 'rgba(0,0,0,0.2)' }}>
                    <div className="px-4 py-2 rounded-xl font-black text-[10px] uppercase tracking-widest shadow-xl" style={{ backgroundColor: '#ffffff', color: '#000000' }}>
                      {selectedId === p.id ? 'Seleccionado' : (ctaText || 'Probar')}
                    </div>
                  </div>
                </div>
                <div className="p-5">
                  <p className="text-[9px] font-bold uppercase tracking-widest mb-1" style={{ color: theme.muted }}>{p.category}</p>
                  <h3 className="text-sm font-black uppercase tracking-tight line-clamp-1 transition-colors" style={{ color: theme.text }}>{p.name}</h3>
                  {p.short_description && <p className="text-[10px] mt-1 line-clamp-2 leading-relaxed" style={{ color: theme.muted }}>{p.short_description}</p>}
                  {p.attributes && Object.keys(p.attributes).length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {Object.entries(p.attributes).slice(0, 2).map(([key, value]) => {
                        if (!value || (Array.isArray(value) && value.length === 0)) return null;
                        const displayValue = Array.isArray(value) ? value.slice(0, 2).join(', ') : String(value);
                        return (
                          <span key={key} className="text-[8px] px-1.5 py-0.5 rounded-full font-bold" style={{ backgroundColor: `${primaryColor}15`, color: primaryColor }}>
                            {displayValue}
                          </span>
                        );
                      })}
                    </div>
                  )}
                  {p.price != null && <p className="text-base font-black mt-2" style={{ color: theme.text }}>${p.price.toLocaleString('es-CO')}</p>}
                </div>
              </button>
            ))
          )}
        </div>

        {sortedProducts.length === 0 && !isLoading && (
          <div className="text-center py-20">
            <p className="text-sm font-medium" style={{ color: theme.muted }}>No se encontraron productos.</p>
            <button onClick={() => setFilterCat('all')} className="mt-4 text-xs font-bold uppercase tracking-widest underline" style={{ color: primaryColor }}>Ver todos</button>
          </div>
        )}
      </div>
    </section>
  );
}

function ProbadorInfo({ brand, secondaryColor }: { brand: BrandData; secondaryColor?: string }) {
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

  const theme = useContrastTheme('#ffffff');
  const accentColor = secondaryColor || '#FF5C3A';
  if (scheduleEntries.length === 0 && !brand.city_display) return null;

  return (
    <section className="py-16 px-6 border-t" style={{ backgroundColor: theme.bg, borderColor: theme.border }}>
      <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-12 md:gap-20">
        {brand.city_display && (
          <div className="space-y-4">
            <span className="text-[9px] font-black uppercase tracking-[0.3em]" style={{ color: accentColor }}>Encuéntranos</span>
            <h3 className="text-2xl font-black uppercase italic tracking-tight" style={{ color: theme.text }}>{brand.city_display}</h3>
            {brand.national_shipping && (
              <div className="flex items-center gap-2 px-4 py-2 rounded-xl w-fit" style={{ backgroundColor: '#ecfdf5', color: '#059669' }}>
                <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ backgroundColor: '#10b981' }} />
                <span className="text-[10px] font-black uppercase tracking-widest">Envíos Nacionales Activos</span>
              </div>
            )}
          </div>
        )}
        {scheduleEntries.length > 0 && (
          <div className="space-y-6">
            <span className="text-[9px] font-black uppercase tracking-[0.3em]" style={{ color: accentColor }}>Horarios</span>
            <div className="grid grid-cols-1 gap-2">
              {scheduleEntries.map(([day, hours]) => (
                <div key={day} className="flex justify-between items-center py-2 border-b last:border-0" style={{ borderColor: theme.border }}>
                  <span className="text-[10px] font-bold uppercase" style={{ color: theme.muted }}>{day}</span>
                  <span className={`text-[11px] font-black tracking-tight ${hours.toLowerCase().includes('cerrado') ? 'italic' : ''}`} style={{ color: hours.toLowerCase().includes('cerrado') ? '#f87171' : theme.text }}>{hours}</span>
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
  const theme = useLandingTheme(brand);
  const primary = theme.primary;
  const secondary = theme.secondary;
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
    <div className={`min-h-screen flex flex-col // TODO: landing_font from brand config - pending API support
      ${brand.landing_font || 'font-jakarta'} overflow-x-hidden ${isPreview ? 'p-0 h-auto' : ''}`} style={{ backgroundColor: theme.cardBg, '--primary': primary, '--secondary': secondary, '--secondary-10': secondary + "1a", '--secondary-20': secondary + "33", '--secondary-05': secondary + "0d" } as React.CSSProperties}>
      <ProbadorHero brand={brand} onScrollDown={() => document.getElementById('probador-products')?.scrollIntoView({ behavior: 'smooth' })} isPreview={isPreview} />
      <ProbadorTrustBar brand={brand} />
      <ProbadorProducts products={products} primaryColor={primary} secondaryColor={secondary} ctaText={brand.cta_button_text} onProductClick={handleProductClick} selectedId={selectedId} />

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

      <ProbadorInfo brand={brand} secondaryColor={secondary} />

      <footer className="py-16 px-6 text-center border-t border-gray-50 bg-white mt-auto">
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="flex items-center justify-center gap-6">
            {getVisibleSocialEntries(brand.social_links || {}).length > 0 && (
              <div className="flex items-center justify-center gap-3">
                {getVisibleSocialEntries(brand.social_links || {}).slice(0, 4).map(([platform, url]) => {
                  const icons: Record<string, React.ReactNode> = {
                    instagram: <InstagramIcon className="w-4 h-4" />,
                    facebook: <FacebookIcon className="w-4 h-4" />,
                    tiktok: <TikTokIcon className="w-4 h-4" />,
                    youtube: <YouTubeIcon className="w-4 h-4" />,
                    x: <XIcon className="w-4 h-4" />,
                  };
                  return (
                    <a key={platform} href={url} target="_blank" rel="noopener noreferrer" aria-label={`Síguenos en ${platform}`}
                      className="w-9 h-9 rounded-xl flex items-center justify-center transition-all hover:scale-110 border" style={{ borderColor: '#e5e7eb', color: '#6b7280' }}>
                      {icons[platform.toLowerCase()] ?? null}
                    </a>
                  );
                })}
              </div>
            )}
          </div>
          <div className="pt-6 border-t border-gray-100 flex flex-col md:flex-row items-center justify-center gap-4 md:gap-8">
            <p className="text-[9px] md:text-[10px] font-black uppercase tracking-[0.3em] text-gray-400">
              © {new Date().getFullYear()} {brand.name}
            </p>
            <p className="text-[9px] md:text-[10px] font-black uppercase tracking-[0.3em] text-gray-300">
              Powered by <a href={footerUrl || 'https://lookitry.com'} target="_blank" rel="noopener noreferrer" className="font-bold hover:opacity-80 transition-all text-gray-900">Look<span className="text-[#FF5C3A]">itry</span> IA</a>
            </p>
          </div>
        </div>
      </footer>

      {brand.whatsapp_contact && !isPreview && <WhatsAppFAB phone={brand.whatsapp_contact} message={brand.whatsapp_message} />}
    </div>
  );
}
