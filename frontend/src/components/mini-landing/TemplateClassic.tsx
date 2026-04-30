'use client';

import { useState, useEffect } from 'react';
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
  useScrollReveal,
  isDarkColor,
  getContrastColor,
  getSmartMutedColor,
  getSmartBorderColor,
  getVisibleSocialEntries,
  useContrastTheme,
  useLandingTheme,
  SocialLinks,
  FiveStars,
  getCssColor,
} from './shared';

// ── Iconos reutilizables ───────────────────────────────────────────────────────

function SparklesIcon({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <svg className={className} style={style} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
    </svg>
  );
}

function StarIcon({ className, style, filled }: { className?: string; style?: React.CSSProperties; filled?: boolean }) {
  return (
    <svg className={className} style={style} fill={filled ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.54 1.118l-3.976-2.888a1 1 0 00-1.175 0l-3.976 2.888c-.784.57-1.838-.197-1.539-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
    </svg>
  );
}

function MenuIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16m-7 6h7" />
    </svg>
  );
}

function XMarkIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
  );
}

function MapPinIcon({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <svg className={className} style={style} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  );
}

function TruckIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10l2 1h8z" />
    </svg>
  );
}

function ChevronDownIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
    </svg>
  );
}


// ── TrustBar Component ────────────────────────────────────────────────────────

function ClassicTrustBar({ brand, primaryColor }: { brand: BrandData; primaryColor: string }) {
  const theme = useLandingTheme(brand);
  const localTheme = useContrastTheme(theme.surface, primaryColor);
  const rating = brand.rating ?? 0;
  const reviews = brand.total_reviews ?? 0;
  const hasRating = rating > 0;
  const hasReviews = reviews > 0;

  // Solo mostrar stats que vengas de DB (no fake data)
  const items = [
    ...(hasRating ? [{ value: rating.toFixed(1), label: 'Valoración Global', icon: 'star' as const }] : []),
    ...(hasReviews ? [{ value: `+${reviews}`, label: 'Clientes Satisfechos', icon: 'users' as const }] : []),
  ];

  // Si no hay datos reales, no mostrar TrustBar
  if (items.length === 0) return null;

  return (
    <div className="relative z-20 -mt-10 md:-mt-14 px-6 max-w-4xl mx-auto w-full group animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-500">
      <div className="backdrop-blur-xl border shadow-[0_20px_40px_-15px_rgba(0,0,0,0.1)] rounded-[2rem] p-2 transition-all duration-500 hover:shadow-[0_30px_60px_-15px_rgba(0,0,0,0.15)]" style={{ backgroundColor: theme.surface, borderColor: theme.border }}>
        <div className="flex flex-col sm:flex-row items-stretch rounded-[1.5rem] overflow-hidden">
          {items.map((item, i) => (
            <div
              key={i}
              className={`flex-1 flex items-center justify-center gap-5 sm:gap-6 py-6 px-4 text-center sm:text-left ${i !== items.length - 1 ? 'border-b sm:border-b-0 sm:border-r' : ''}`}
              style={{ borderColor: theme.borderLight }}
            >
              <div className="shrink-0 w-14 h-14 sm:w-16 sm:h-16 rounded-2xl flex items-center justify-center shadow-inner transition-transform duration-500 group-hover:scale-110 group-hover:rotate-3" style={{ backgroundColor: `${primaryColor}15` }}>
                {item.icon === 'star' ? (
                  <StarIcon className="w-7 h-7 sm:w-8 sm:h-8" style={{ color: primaryColor }} filled />
                ) : (
                  <svg className="w-7 h-7 sm:w-8 sm:h-8" style={{ color: primaryColor }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                )}
              </div>
              <div className="flex flex-col items-center sm:items-start">
                <div className="flex items-baseline gap-1.5">
                  <span className="text-3xl sm:text-4xl font-black tracking-tighter" style={{ color: localTheme.text }}>{item.value}</span>
                  {item.icon === 'star' && <span className="text-sm font-bold" style={{ color: localTheme.muted }}>/ 5.0</span>}
                </div>
                <span className="text-[10px] sm:text-xs font-bold uppercase tracking-[0.2em] mt-1" style={{ color: localTheme.muted }}>{item.label}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Header Component ───────────────────────────────────────────────────────────

function ClassicHeader({ brand, primaryColor, secondaryColor, onScrollDown }: { brand: BrandData; primaryColor: string; secondaryColor: string; onScrollDown: () => void }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const headerBg = brand.header_color || '#ffffff';
  const headerIsDark = isDarkColor(headerBg);
  const headerTextColor = headerIsDark ? '#ffffff' : '#111111';
  const headerMutedColor = headerIsDark ? 'rgba(255,255,255,0.72)' : '#6b7280';
  const logoSrc = headerIsDark ? (brand.logo_light || brand.logo) : (brand.logo_dark || brand.logo);

  const socialLinks = brand.social_links || {};
  const entries = getVisibleSocialEntries(socialLinks);

  return (
    <header
      className="sticky top-0 z-50 w-full md:h-20 backdrop-blur-md border-b transition-all"
      style={{
        backgroundColor: `${headerBg}ee`,
        borderColor: headerIsDark ? 'rgba(255,255,255,0.08)' : '#f3f4f6',
      }}
    >
      <div className="max-w-6xl mx-auto h-full px-4 md:px-8 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          {brand.logo ? (
            <BrandLogo src={logoSrc} alt={brand.name} className="h-8 md:h-10 w-auto max-w-[160px] object-contain shrink-0" />
          ) : (
            brand.show_brand_name !== false ? (
              <span className="font-black text-xl md:text-2xl uppercase tracking-tighter truncate" style={{ color: headerIsDark ? '#ffffff' : primaryColor }}>
                {brand.name}
              </span>
            ) : null
          )}
          {brand.logo && brand.show_brand_name !== false && (
            <span className="font-black text-lg md:text-xl uppercase tracking-tighter truncate hidden sm:block" style={{ color: headerTextColor }}>
              {brand.name}
            </span>
          )}
        </div>

        <nav className="hidden lg:flex items-center gap-8">
          <button onClick={onScrollDown} aria-label="Ir a productos" className="text-xs font-bold uppercase tracking-widest transition-colors hover:opacity-80" style={{ color: headerMutedColor }}>Catálogo</button>
          <button onClick={() => document.getElementById('probador')?.scrollIntoView({ behavior: 'smooth' })} aria-label="Ir a probador IA" className="text-xs font-bold uppercase tracking-widest transition-colors hover:opacity-80" style={{ color: headerMutedColor }}>Probador IA</button>
          <button onClick={() => document.getElementById('contacto')?.scrollIntoView({ behavior: 'smooth' })} aria-label="Ir a horarios y contacto" className="text-xs font-bold uppercase tracking-widest transition-colors hover:opacity-80" style={{ color: headerMutedColor }}>Horarios</button>
        </nav>

        {/* Social Icons - Desktop */}
        <SocialLinks
          entries={entries}
          limit={4}
          className="hidden lg:flex items-center gap-2"
          linkClassName="w-9 h-9 rounded-xl hover:scale-110"
          iconClassName="w-4 h-4"
          linkStyle={{ backgroundColor: headerIsDark ? 'rgba(255,255,255,0.1)' : `${primaryColor}10`, color: headerIsDark ? '#ffffff' : primaryColor }}
        />

        <div className="flex items-center gap-3">
          <button
            onClick={() => document.getElementById('probador')?.scrollIntoView({ behavior: 'smooth' })}
            className="px-6 py-2.5 rounded-full text-white text-xs font-black uppercase tracking-widest shadow-xl transition-all hover:brightness-110 active:scale-95"
            style={{ backgroundColor: primaryColor }}
          >
            Probar Ahora
          </button>
          <button
            onClick={() => setMobileMenuOpen(v => !v)}
            className="lg:hidden p-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF5C3A] focus-visible:ring-offset-2 rounded-lg"
            style={{ color: headerMutedColor }}
            aria-label={mobileMenuOpen ? "Cerrar menú" : "Abrir menú"}
            aria-expanded={mobileMenuOpen}
          >
            {mobileMenuOpen ? <XMarkIcon className="w-6 h-6" /> : <MenuIcon className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {mobileMenuOpen && (
        <div
          className="lg:hidden absolute top-full left-0 w-full shadow-2xl animate-in slide-in-from-top duration-300"
          style={{
            backgroundColor: headerBg,
            borderBottom: `1px solid ${headerIsDark ? 'rgba(255,255,255,0.08)' : '#f3f4f6'}`,
          }}
        >
          <nav className="flex flex-col p-6 gap-4">
            <button onClick={() => { onScrollDown(); setMobileMenuOpen(false); }} aria-label="Ir a productos" className="text-sm font-bold uppercase tracking-widest text-left py-3 border-b" style={{ color: headerTextColor, borderColor: headerIsDark ? 'rgba(255,255,255,0.08)' : '#f9fafb' }}>Catálogo</button>
            <button onClick={() => { document.getElementById('probador')?.scrollIntoView({ behavior: 'smooth' }); setMobileMenuOpen(false); }} aria-label="Ir a probador IA" className="text-sm font-bold uppercase tracking-widest text-left py-3 border-b" style={{ color: headerTextColor, borderColor: headerIsDark ? 'rgba(255,255,255,0.08)' : '#f9fafb' }}>Probador IA</button>
            <button onClick={() => { document.getElementById('contacto')?.scrollIntoView({ behavior: 'smooth' }); setMobileMenuOpen(false); }} aria-label="Ir a horarios y contacto" className="text-sm font-bold uppercase tracking-widest text-left py-3" style={{ color: headerTextColor }}>Horarios y Contacto</button>
            {entries.length > 0 && (
              <div className="pt-4 border-t" style={{ borderColor: headerIsDark ? 'rgba(255,255,255,0.08)' : '#f9fafb' }}>
                <SocialLinks
                  entries={entries}
                  className="gap-3"
                  linkClassName="w-10 h-10 rounded-xl"
                  iconClassName="w-4 h-4"
                  linkStyle={{ backgroundColor: headerIsDark ? 'rgba(255,255,255,0.1)' : `${primaryColor}15`, color: headerIsDark ? '#ffffff' : primaryColor }}
                />
              </div>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}

// ── Hero Component ────────────────────────────────────────────────────────────

function ClassicHero({ brand, primaryColor, secondaryColor, onScrollDown, isPreview = false }: { brand: BrandData; primaryColor: string; secondaryColor: string; onScrollDown: () => void; isPreview?: boolean }) {
  const theme = useLandingTheme(brand);
  const hasCover = !!brand.cover_image_url;
  const { backgroundColor: coverBaseColor, imageOpacity } = getCoverPresentation(brand, primaryColor + '10');
  const bgColor = brand.cover_bg_color || '#f9f8f6';
  const isBgDark = isDarkColor(bgColor);
  const textColor = isBgDark ? '#ffffff' : '#111111';
  const mutedColor = bgColor && isDarkColor(bgColor)
    ? 'rgba(255,255,255,0.85)' // más opaco para fondos oscuros
    : '#6b7280'; // gray-500 para fondos claros

  return (
    <section
      className={`relative w-full ${isPreview ? 'py-8 md:py-12' : 'py-12 md:py-20'} px-6 overflow-hidden`}
      style={{ backgroundColor: bgColor }}
    >
      {/* Decorative Elements */}
      <div className="absolute top-0 right-0 w-64 h-64 opacity-5" style={{
        background: `radial-gradient(circle, ${primaryColor} 0%, transparent 70%)`,
        transform: 'translate(30%, -30%)'
      }} />
      <div className="absolute bottom-0 left-0 w-48 h-48 opacity-5" style={{
        background: `radial-gradient(circle, ${secondaryColor} 0%, transparent 70%)`,
        transform: 'translate(-30%, 30%)'
      }} />

      <div className="max-w-6xl mx-auto flex flex-col lg:flex-row items-center gap-10 md:gap-16 z-10">
        <div className="flex-1 text-center lg:text-left space-y-6 md:space-y-8">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border text-xs font-bold uppercase tracking-wider animate-in fade-in slide-in-from-bottom-2 duration-700"
            style={{
              backgroundColor: isBgDark ? 'rgba(255,255,255,0.1)' : `${primaryColor}15`,
              borderColor: isBgDark ? 'rgba(255,255,255,0.2)' : `${primaryColor}30`,
              color: isBgDark ? '#ffffff' : primaryColor
            }}
          >
            <SparklesIcon className="w-4 h-4" />
            Nueva tecnología de probador IA
          </div>

          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black leading-[1.05] tracking-tighter uppercase italic animate-in fade-in slide-in-from-bottom-4 duration-700 delay-150" style={{ color: secondaryColor || textColor }}>
            {brand.name}<br />
            <span style={{ color: primaryColor }}>{brand.slogan || 'Colección 2026'}</span>
          </h1>

          {brand.brand_description && (
            <p className="text-sm md:text-base max-w-xl mx-auto lg:mx-0 leading-relaxed font-medium animate-in fade-in slide-in-from-bottom-2 duration-700 delay-300" style={{ color: mutedColor }}>
              {brand.brand_description}
            </p>
          )}

          <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-5 animate-in fade-in slide-in-from-bottom-2 duration-700 delay-500">
            <button onClick={onScrollDown} className="w-full sm:w-auto px-10 py-4 rounded-xl font-black text-xs uppercase tracking-[0.2em] shadow-xl hover:brightness-110 active:scale-95 transition-all" style={{ backgroundColor: primaryColor, color: getContrastColor(primaryColor) }}>Ver Productos</button>
            <div className="flex items-center gap-1.5">
              {brand.total_reviews ? (
                <>
                  <div className="flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-br from-orange-500 to-rose-500 shadow-lg">
                    <StarIcon className="w-5 h-5 text-white" />
                  </div>
                  <span className="text-sm font-black" style={{ color: textColor }}>
                    +{(brand.total_reviews as number).toLocaleString()}
                  </span>
                </>
              ) : null}
            </div>
          </div>
        </div>

        <div className="flex-1 w-full relative aspect-square lg:aspect-[4/5] rounded-[2rem] md:rounded-[2.5rem] overflow-hidden shadow-2xl transition-transform duration-700 hover:scale-[1.02] animate-in fade-in zoom-in duration-1000 delay-200">
          {hasCover ? (
            <>
              <div className="absolute inset-0" style={{ backgroundColor: coverBaseColor }} />
              <CoverImage src={brand.cover_image_url} alt={brand.name} className="absolute inset-0 w-full h-full object-cover" style={{ opacity: imageOpacity }} />
            </>
          ) : (
            <div className="w-full h-full flex items-center justify-center" style={{ backgroundColor: coverBaseColor }}>
              <div className="text-center">
                <SparklesIcon className="w-20 h-20 mx-auto opacity-20" style={{ color: primaryColor }} />
                <p className="mt-4 text-sm font-bold uppercase tracking-widest opacity-40">Cover Image</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

// ── Steps Component ────────────────────────────────────────────────────────────

function ClassicSteps({ brand, primaryColor, secondaryColor }: { brand: BrandData; primaryColor: string; secondaryColor: string }) {
  const theme = useLandingTheme(brand);
  const localTheme = useContrastTheme(theme.productsBg, primaryColor);
  const stepsDef = brand.landing_steps;
  const steps = [
    {
      n: '01',
      t: stepsDef?.select_label || 'Selecciona',
      d: stepsDef?.select_desc || 'Elige cualquier prenda de nuestro catálogo curado para comenzar.',
    },
    {
      n: '02',
      t: stepsDef?.photo_label || 'Fotografía',
      d: stepsDef?.photo_desc || 'Captura una selfie frontal. La iluminación es clave para el realismo.',
    },
    {
      n: '03',
      t: stepsDef?.result_label || 'Estrena',
      d: stepsDef?.result_desc || 'Nuestra IA renderiza la prenda sobre ti. Descarga y comparte.',
    },
  ];

  return (
    <section className="pt-24 pb-16 px-6 border-b" style={{ backgroundColor: theme.productsBg, borderColor: getSmartBorderColor(theme.productsBg) }}>
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16 space-y-3">
          <span className="text-xs font-bold uppercase tracking-[0.3em]" style={{ color: secondaryColor || primaryColor }}>¿Cómo funciona?</span>
          <h2 className="text-3xl md:text-4xl font-black tracking-tighter uppercase italic leading-none" style={{ color: localTheme.text }}>En tres simples pasos</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-10">
          {steps.map((s, i) => (
            <div key={s.n} className="flex flex-col items-center md:items-start text-center md:text-left p-8 rounded-[2rem] border transition-all duration-500 group hover:shadow-xl hover:scale-[1.02]" style={{ backgroundColor: `${primaryColor}05`, borderColor: getSmartBorderColor(theme.productsBg) }}>
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center font-black text-2xl shadow-inner mb-6 transition-transform duration-500 group-hover:-translate-y-2" style={{ backgroundColor: `${primaryColor}15`, color: primaryColor }}>
                {s.n}
              </div>
              <h3 className="text-xl font-black uppercase tracking-tight italic mb-3" style={{ color: localTheme.text }}>{s.t}</h3>
              <p className="text-sm leading-relaxed font-medium" style={{ color: localTheme.muted }}>{s.d}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── Products Component ───────────────────────────────────────────────────────

function ClassicProducts({ products, brand, primaryColor, secondaryColor, ctaText, onProductClick, selectedId }: { products: ProductData[]; brand: BrandData; primaryColor: string; secondaryColor: string; ctaText?: string | null; onProductClick: (id: string) => void; selectedId: string | null }) {
  const [isLoading, setIsLoading] = useState(true);
  const { ref: sectionRef, isVisible } = useScrollReveal();
  const theme = useLandingTheme(brand);
  const localTheme = useContrastTheme(theme.productsBg, primaryColor);
  
  const [filterCat, setFilterCat] = useState<string>('all');
  const [sortOption, setSortOption] = useState<string>('featured');

  useEffect(() => {
    if (products && products.length > 0) {
      setIsLoading(false);
    }
  }, [products]);

  if (!products || products.length === 0) {
    return null;
  }

  const categories = Array.from(new Set(products.map(p => p.category).filter(Boolean))) as string[];

  const filteredProducts = products.filter(p => filterCat === 'all' || p.category === filterCat);
  const sortedProducts = [...filteredProducts].sort((a, b) => {
    if (sortOption === 'price_asc') return (a.price || 0) - (b.price || 0);
    if (sortOption === 'price_desc') return (b.price || 0) - (a.price || 0);
    if (sortOption === 'name_asc') return a.name.localeCompare(b.name);
    return 0; // featured/newest
  });

  const gridClass = sortedProducts.length === 1
    ? "grid grid-cols-2 max-w-lg mx-auto gap-4"
    : sortedProducts.length === 2
    ? "grid grid-cols-2 md:grid-cols-3 max-w-4xl mx-auto gap-4"
    : sortedProducts.length === 3
    ? "grid grid-cols-2 md:grid-cols-4 max-w-6xl mx-auto gap-3 sm:gap-6"
    : "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 max-w-[100rem] mx-auto gap-3 sm:gap-4 md:gap-5";

  return (
    <section ref={sectionRef} id="productos" className={`py-20 px-4 md:px-6 transition-all duration-700 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`} style={{ backgroundColor: theme.productsBg }}>
      <div className="max-w-[90rem] mx-auto">
        <div className="text-center mb-10 space-y-3">
          <span className="text-[10px] md:text-xs font-bold uppercase tracking-[0.3em]" style={{ color: secondaryColor || primaryColor }}>Colección de Temporada</span>
          <h2 className="text-3xl md:text-5xl font-black tracking-tighter uppercase italic leading-none" style={{ color: localTheme.text }}>Catálogo Premium</h2>
          <p className="text-xs md:text-sm font-medium max-w-xl mx-auto" style={{ color: localTheme.muted }}>Explora nuestra colección seleccionada con tecnología de probador IA. Filtra y encuentra tu estilo ideal.</p>
        </div>

        {/* Filters & Sorting */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10 pb-6 border-b" style={{ borderColor: getSmartBorderColor(theme.productsBg) }}>
          <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-2 md:pb-0 hide-scrollbar">
            <button
              onClick={() => setFilterCat('all')}
              className={`whitespace-nowrap px-4 py-2 rounded-full text-[10px] md:text-xs font-black uppercase tracking-widest transition-all ${filterCat === 'all' ? 'shadow-lg scale-105' : 'opacity-80 hover:opacity-100'}`}
              style={filterCat === 'all' ? { backgroundColor: secondaryColor || primaryColor, color: getContrastColor(secondaryColor || primaryColor) } : { backgroundColor: `${primaryColor}15`, color: localTheme.text }}
            >
              Todos
            </button>
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setFilterCat(cat)}
                className={`whitespace-nowrap px-4 py-2 rounded-full text-[10px] md:text-xs font-black uppercase tracking-widest transition-all ${filterCat === cat ? 'shadow-lg scale-105' : 'opacity-80 hover:opacity-100'}`}
                style={filterCat === cat ? { backgroundColor: secondaryColor || primaryColor, color: getContrastColor(secondaryColor || primaryColor) } : { backgroundColor: `${primaryColor}15`, color: localTheme.text }}
              >
                {cat}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2 mt-4 md:mt-0 w-full md:w-auto">
            <span className="text-[10px] md:text-xs font-bold uppercase tracking-widest hidden md:block" style={{ color: localTheme.muted }}>Ordenar por:</span>
            <div className="relative w-full md:w-auto">
              <select
                value={sortOption}
                onChange={(e) => setSortOption(e.target.value)}
                className="w-full md:w-auto appearance-none pl-4 pr-10 py-2.5 rounded-xl text-[10px] md:text-xs font-bold uppercase tracking-widest outline-none transition-all cursor-pointer border"
                style={{ backgroundColor: theme.productsBg, color: localTheme.text, borderColor: getSmartBorderColor(theme.productsBg), focusRingColor: primaryColor } as React.CSSProperties}
              >
                <option value="featured">Destacados</option>
                <option value="price_asc">Menor Precio</option>
                <option value="price_desc">Mayor Precio</option>
                <option value="name_asc">A - Z</option>
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3" style={{ color: localTheme.muted }}>
                <ChevronDownIcon className="w-4 h-4" />
              </div>
            </div>
          </div>
        </div>

        <div className={gridClass}>
          {isLoading ? (
            <>
              {[0, 1, 2, 3, 4, 5, 6, 7].map(i => <ProductSkeleton key={i} primaryColor={primaryColor} />)}
            </>
          ) : (
            sortedProducts.map(p => {
              const isSelected = selectedId === p.id;
              const prodDesc = p.short_description || p.description;

              return (
                <div
                  key={p.id}
                  className={`group relative rounded-2xl md:rounded-[2rem] overflow-hidden transition-all duration-500 hover:shadow-2xl flex flex-col ${isSelected ? 'ring-2 ring-offset-2' : 'border'}`}
                  style={{
                    backgroundColor: theme.cardBg,
                    borderColor: isSelected ? undefined : theme.borderLight,
                    ...(isSelected ? { ringColor: primaryColor } as React.CSSProperties : {}),
                    boxShadow: isSelected ? `0 25px 50px -12px ${primaryColor}25` : undefined
                  }}
                >
                  {isSelected && (
                    <div className="absolute top-3 right-3 md:top-4 md:right-4 z-10 px-2.5 py-1 md:px-3 md:py-1.5 rounded-full shadow-lg flex items-center gap-1.5" style={{ backgroundColor: theme.surface }}>
                      <SparklesIcon className="w-3 h-3 md:w-3.5 md:h-3.5" style={{ color: primaryColor }} />
                      <span className="text-[9px] md:text-[10px] font-black uppercase tracking-wider" style={{ color: primaryColor }}>Select</span>
                    </div>
                  )}

                  <div className="relative aspect-[3/4] overflow-hidden shrink-0" style={{ backgroundColor: theme.surface }}>
                    <ProductImage
                      src={p.image_url}
                      alt={p.name}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                      sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                    />
                    {p.badge && (
                      <div className="absolute top-3 left-3 md:top-4 md:left-4 z-10 scale-90 md:scale-100 origin-top-left">
                        <ProductBadge badge={p.badge} />
                      </div>
                    )}

                    {/* CTA Button */}
                    <div className="absolute inset-x-3 bottom-3 md:inset-x-4 md:bottom-4 opacity-100 lg:opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-0 lg:translate-y-2 lg:group-hover:translate-y-0 z-20">
                      <button
                        onClick={() => onProductClick(p.id)}
                        aria-label={`Probar ${p.name} con IA`}
                        className="w-full py-2.5 md:py-3.5 rounded-xl font-black text-[10px] md:text-xs uppercase tracking-widest shadow-xl hover:brightness-110 active:scale-95 transition-all"
                        style={{ backgroundColor: theme.ctaBg, color: theme.ctaText }}
                      >
                        {ctaText || 'Probar IA'}
                      </button>
                    </div>
                  </div>

                  <div className="p-4 md:p-6 text-left flex flex-col flex-1">
                    <div className="flex justify-between items-start mb-1.5 md:mb-2 gap-2">
                      <p className="text-[9px] md:text-[10px] font-bold uppercase tracking-widest truncate" style={{ color: secondaryColor || primaryColor }}>{p.category}</p>
                      {p.price && <p className="text-sm md:text-base font-black shrink-0" style={{ color: theme.cardText }}>${p.price.toLocaleString('es-CO')}</p>}
                    </div>
                    <h3 className="text-sm md:text-base font-black uppercase tracking-tight line-clamp-2 mb-2 leading-snug" style={{ color: theme.cardText }}>{p.name}</h3>
                    
                    {prodDesc && (
                      <p className="hidden md:block text-[10px] md:text-xs line-clamp-2 leading-relaxed font-medium mb-3 flex-1" style={{ color: theme.cardMuted }}>{prodDesc}</p>
                    )}
                    
                    {p.attributes && Object.keys(p.attributes).length > 0 && (
                      <div className="mt-auto pt-3 md:pt-4 border-t border-gray-100 flex flex-wrap gap-1.5 md:gap-2">
                        {Object.entries(p.attributes).map(([key, value]) => {
                          if (!value || (Array.isArray(value) && value.length === 0)) return null;
                          const isColor = key.toLowerCase() === 'color' || key.toLowerCase() === 'colores';
                          const displayValue = Array.isArray(value) ? value.join(', ') : String(value);
                          
                          if (isColor && typeof value === 'string') {
                             const cssColor = getCssColor(value);
                             if (cssColor) {
                               return (
                                 <div key={key} className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md border" style={{ borderColor: theme.borderLight, backgroundColor: theme.surface }} title={displayValue}>
                                   <div className="w-3 h-3 md:w-4 md:h-4 rounded-full border border-black/10 shadow-sm" style={{ backgroundColor: cssColor }} />
                                   <span className="text-[9px] md:text-[10px] font-bold capitalize" style={{ color: theme.cardMuted }}>{displayValue}</span>
                                 </div>
                               );
                             }
                          }
                          
                          return (
                            <div key={key} className="inline-flex items-center text-[9px] md:text-[10px] px-2 py-1 rounded-md font-bold border transition-colors" style={{ backgroundColor: `${primaryColor}08`, color: theme.cardText, borderColor: theme.borderLight }}>
                              <span className="opacity-70 mr-1 capitalize">{key}:</span>
                              <span className="truncate max-w-[50px] md:max-w-[80px]">{displayValue}</span>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
        
        {sortedProducts.length === 0 && !isLoading && (
          <div className="text-center py-20">
            <p className="text-gray-500 font-medium">No se encontraron productos en esta categoría.</p>
            <button onClick={() => setFilterCat('all')} className="mt-4 text-xs font-bold uppercase tracking-widest underline" style={{ color: primaryColor }}>Ver todos</button>
          </div>
        )}
      </div>
    </section>
  );
}

// ── Info Section Component ────────────────────────────────────────────────────

function ClassicInfo({ brand, primaryColor, secondaryColor }: { brand: BrandData; primaryColor: string; secondaryColor: string }) {
  const theme = useLandingTheme(brand);
  const localTheme = useContrastTheme(theme.productsBg, primaryColor);
  const DAYS_ORDER = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
  let scheduleEntries: [string, string][] = [];
  try {
    const raw = brand.schedule ?? {};
    if (raw && typeof raw === 'object') {
      scheduleEntries = DAYS_ORDER.filter(d => raw[d] || raw[d.toLowerCase()]).map(d => [d, (raw[d] || raw[d.toLowerCase()]) as string]);
    }
  } catch (e) { }

  const hasLocationBlock = !!brand.city_display || !!brand.national_shipping;
  const hasRatings = typeof brand.rating === 'number' || typeof brand.total_reviews === 'number';

  if (!hasLocationBlock && scheduleEntries.length === 0 && !hasRatings) return null;

  return (
    <section className="py-16 px-6 border-b" style={{ backgroundColor: theme.productsBg, borderColor: getSmartBorderColor(theme.productsBg) }}>
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10 lg:gap-16">
          {/* Ubicación */}
          {hasLocationBlock && (
            <div className="space-y-6">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center" style={{ backgroundColor: `${primaryColor}15` }}>
                  <MapPinIcon className="w-7 h-7" style={{ color: primaryColor }} />
                </div>
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-widest" style={{ color: secondaryColor || primaryColor }}>Encuéntranos</h4>
                  <p className="text-lg font-black italic" style={{ color: localTheme.text }}>{brand.city_display}</p>
                </div>
              </div>
              {brand.national_shipping && (
                <div className="flex items-center gap-2 px-4 py-2 rounded-xl w-fit" style={{ backgroundColor: `${primaryColor}15` }}>
                  <span className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: primaryColor }} />
                  <span className="text-xs font-bold uppercase tracking-widest" style={{ color: localTheme.text }}>Envíos Nacionales</span>
                </div>
              )}
            </div>
          )}

          {/* Horarios */}
          {scheduleEntries.length > 0 && (
            <div className="space-y-6">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center" style={{ backgroundColor: `${primaryColor}15` }}>
                  <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke={primaryColor} strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-12 0 9 9 0 0112 0z" />
                  </svg>
                </div>
                <h4 className="text-xs font-bold uppercase tracking-widest" style={{ color: secondaryColor || primaryColor }}>Horarios de Atención</h4>
              </div>
              <div className="space-y-3">
                {scheduleEntries.slice(0, 5).map(([d, h]) => (
                  <div key={d} className="flex justify-between items-center py-2 border-b text-sm" style={{ borderColor: getSmartBorderColor(theme.productsBg) }}>
                    <span className="font-bold uppercase" style={{ color: localTheme.muted }}>{d}</span>
                    <span className={`font-black ${h.toLowerCase().includes('cerrado') ? 'italic' : ''}`} style={{ color: h.toLowerCase().includes('cerrado') ? '#ef4444' : localTheme.text }}>{h}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Ratings */}
          {hasRatings && (
            <div className="space-y-6">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center" style={{ backgroundColor: `${primaryColor}15` }}>
                  <StarIcon className="w-7 h-7" style={{ color: primaryColor }} filled />
                </div>
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-widest" style={{ color: secondaryColor || primaryColor }}>Valoraciones</h4>
                  <p className="text-3xl font-black" style={{ color: localTheme.text }}>{brand.rating?.toFixed(1) ?? '—'}</p>
                </div>
              </div>
              <FiveStars rating={brand.rating} />
              <p className="text-sm font-bold" style={{ color: localTheme.muted }}>{(brand.total_reviews || 0).toLocaleString()} reseñas de clientes</p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

// ── About Section Component ────────────────────────────────────────────────────

function ClassicAbout({ brand, primaryColor }: { brand: BrandData; primaryColor: string }) {
  const bgColor = brand.widget_bg_color || '#0a0a0a';
  const theme = useContrastTheme(bgColor);

  if (!brand.brand_description) return null;

  return (
    <section className="py-12 md:py-20 px-6">
      <div className="max-w-4xl mx-auto p-8 md:p-16 rounded-[2.5rem] md:rounded-[3.5rem] relative overflow-hidden shadow-2xl" style={{ backgroundColor: bgColor }}>
        <div className="relative z-10 space-y-6 text-center md:text-left">
          <span className="text-xs font-bold uppercase tracking-[0.5em]" style={{ color: theme.muted }}>Nuestra Historia</span>
          <p className="text-xl md:text-3xl leading-tight font-black italic uppercase tracking-tighter max-w-3xl" style={{ color: theme.text }}>
            &quot;{brand.brand_description}&quot;
          </p>
        </div>
      </div>
    </section>
  );
}

// ── Footer Component ────────────────────────────────────────────────────────────

function ClassicFooter({ brand, primaryColor, secondaryColor, footerUrl }: { brand: BrandData; primaryColor: string; secondaryColor: string; footerUrl?: string }) {

  const entries = getVisibleSocialEntries(brand.social_links);
  const theme = useLandingTheme(brand);
  const localTheme = useContrastTheme(theme.productsBg, primaryColor);

  return (
    <footer id="contacto" className="pt-24 pb-12 px-6 border-t" style={{ backgroundColor: theme.productsBg, borderColor: getSmartBorderColor(theme.productsBg) }}>
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 lg:gap-20 mb-20">
          {/* Brand Column */}
          <div className="space-y-8">
            <div className="flex items-center gap-4">
              {brand.logo ? (
                <BrandLogo src={brand.logo_dark || brand.logo} alt={brand.name} className="h-14 md:h-16 object-contain" />
              ) : (
                <span className="font-black text-2xl md:text-3xl uppercase italic" style={{ color: primaryColor }}>{brand.name}</span>
              )}
            </div>

            {/* Social Icons */}
            <SocialLinks
              entries={entries}
              className="gap-3"
              linkClassName="w-12 h-12 rounded-xl hover:scale-110"
              iconClassName="w-5 h-5"
              linkStyle={{ backgroundColor: `${primaryColor}10`, border: `1px solid ${getSmartBorderColor(theme.productsBg)}`, color: localTheme.text }}
            />

          </div>

          {/* Quick Links / Contact */}
          <div className="space-y-8">
            <h4 className="text-xs font-bold uppercase tracking-[0.3em]" style={{ color: secondaryColor || primaryColor }}>Contacto Rápido</h4>
            
            {/* Contact Info */}
            {(brand.whatsapp_number || brand.support_email) && (
              <div className="space-y-3 mb-6">
                {brand.whatsapp_number && (
                  <p className="text-sm font-medium" style={{ color: localTheme.text }}>WhatsApp: {brand.whatsapp_number}</p>
                )}
                {brand.support_email && (
                  <p className="text-sm font-medium" style={{ color: localTheme.text }}>Email: {brand.support_email}</p>
                )}
              </div>
            )}
            <div className="space-y-4">
              <button
                onClick={() => document.getElementById('productos')?.scrollIntoView({ behavior: 'smooth' })}
                className="block text-sm font-medium hover:opacity-70 transition-opacity text-left" style={{ color: localTheme.text }}
              >
                Ver Catálogo
              </button>
              <button
                onClick={() => document.getElementById('probador')?.scrollIntoView({ behavior: 'smooth' })}
                className="block text-sm font-medium hover:opacity-70 transition-opacity text-left" style={{ color: localTheme.text }}
              >
                Probador Virtual IA
              </button>
              <button
                onClick={() => document.getElementById('contacto')?.scrollIntoView({ behavior: 'smooth' })}
                className="block text-sm font-medium hover:opacity-70 transition-opacity text-left" style={{ color: localTheme.text }}
              >
                Horarios y Ubicación
              </button>
            </div>
          </div>


        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t flex flex-col md:flex-row items-center justify-between gap-4" style={{ borderColor: getSmartBorderColor(theme.productsBg) }}>
          <p className="text-xs font-bold uppercase tracking-widest text-center md:text-left" style={{ color: localTheme.muted }}>
            © {new Date().getFullYear()} {brand.name}
          </p>
          <p className="text-xs font-bold uppercase tracking-widest text-center md:text-right" style={{ color: localTheme.muted }}>
            Powered by <a href={footerUrl || 'https://lookitry.com'} target="_blank" rel="noopener noreferrer" className="font-bold hover:opacity-80 transition-opacity" style={{ color: localTheme.text }}>Look<span style={{ color: '#FF5C3A' }}>itry</span> IA</a>
          </p>
        </div>
      </div>
    </footer>
  );
}

// ── Main Template Export ────────────────────────────────────────────────────────

export function TemplateClassic({ brandSlug, brand, products, footerUrl, isPreview = false }: { brandSlug: string; brand: BrandData; products: ProductData[]; footerUrl?: string; isPreview?: boolean }) {
  const theme = useLandingTheme(brand);
  const primary = theme.primary;
  const secondary = theme.secondary;
  const tryOnTheme = useContrastTheme(brand.widget_bg_color || '#0a0a0a', primary);
  const [selectedId, setSelectedId] = useState<string | null>(products?.[0]?.id || null);

  const handleProductClick = (id: string) => {
    setSelectedId(id);
    document.getElementById('probador')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div
      className={`min-h-screen bg-white flex flex-col // TODO: landing_font from brand config - pending API support
      ${brand.landing_font || 'font-jakarta'} overflow-x-hidden transition-colors duration-500 ${isPreview ? 'p-0 h-auto' : ''}`}
      style={{
        '--primary': primary,
        '--secondary': secondary,
        '--secondary-10': secondary + '1a',
        '--secondary-20': secondary + '33',
        '--secondary-05': secondary + '0d'
      } as React.CSSProperties}
    >
      <ClassicHeader brand={brand} primaryColor={primary} secondaryColor={secondary} onScrollDown={() => document.getElementById('productos')?.scrollIntoView({ behavior: 'smooth' })} />
      <ClassicHero brand={brand} primaryColor={primary} secondaryColor={secondary} onScrollDown={() => document.getElementById('productos')?.scrollIntoView({ behavior: 'smooth' })} isPreview={isPreview} />
      <ClassicTrustBar brand={brand} primaryColor={primary} />
      <ClassicSteps brand={brand} primaryColor={primary} secondaryColor={secondary} />
      <ClassicProducts products={products} brand={brand} primaryColor={primary} secondaryColor={secondary} ctaText={brand.cta_button_text} onProductClick={handleProductClick} selectedId={selectedId} />
      <ClassicInfo brand={brand} primaryColor={primary} secondaryColor={secondary} />
      <ClassicAbout brand={brand} primaryColor={primary} />

      {/* Try-On Section */}
      <section id="probador" className="py-20 px-4 md:px-6" style={{ backgroundColor: brand.widget_bg_color || '#0a0a0a' }}>
        <div className="max-w-4xl mx-auto space-y-12 text-center">
          <div className="space-y-4">
            <span className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.4em]" style={{ color: secondary }}>
              <span className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: primary }} />
              Probador Virtual Premium
            </span>
            <h2 className="text-3xl md:text-4xl font-black tracking-tighter uppercase italic leading-none" style={{ color: tryOnTheme.text }}>Experiencia Inteligente</h2>
            <p className="text-sm font-medium" style={{ color: tryOnTheme.muted }}>Selecciona un producto y pruébatelo virtualmente con nuestra IA</p>
          </div>
          <div className={isPreview ? 'overflow-hidden' : 'rounded-[2.5rem] md:rounded-[3.5rem] overflow-hidden shadow-[0_50px_100px_-20px_rgba(0,0,0,0.5)] border border-white/5'}>
            <TryOnWidget
              brandSlug={brandSlug}
              isEmbed={true}
              initialProductId={selectedId}
              forceLayout="bare"
              lockProductSelection={true}
            />
          </div>
        </div>
      </section>

      <ClassicFooter brand={brand} primaryColor={primary} secondaryColor={secondary} footerUrl={footerUrl} />
      {brand.whatsapp_contact && !isPreview && <WhatsAppFAB phone={brand.whatsapp_contact} message={brand.whatsapp_message} />}
    </div>
  );
}
