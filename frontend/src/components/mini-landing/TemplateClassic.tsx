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
  YouTubeIcon,
  XIcon,
  InstagramIcon,
  FacebookIcon,
  TikTokIcon,
} from './shared';

// ── Iconos reutilizables ───────────────────────────────────────────────────────

function SparklesIcon({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <svg className={className} style={style} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
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

// ── TrustBar Component ────────────────────────────────────────────────────────

function ClassicTrustBar({ brand, primaryColor }: { brand: BrandData; primaryColor: string }) {
  const rating = brand.rating ?? 0;
  const reviews = brand.total_reviews ?? 0;
  const hasRating = rating > 0;
  const hasReviews = reviews > 0;

  // Solo mostrar stats que vengas de DB (no fake data)
  const items = [
    ...(hasRating ? [{ value: rating.toFixed(1), label: 'Rating', icon: 'star' as const }] : []),
    ...(hasReviews ? [{ value: `+${reviews}`, label: 'Reviews', icon: 'users' as const }] : []),
  ];

  // Si no hay datos reales, no mostrar TrustBar
  if (items.length === 0) return null;

  return (
    <div className="flex border-b overflow-x-auto no-scrollbar" style={{ backgroundColor: '#ffffff', borderColor: '#f3f4f6' }}>
      {items.map((item, i) => (
        <div
          key={i}
          className="flex-1 min-w-[100px] flex flex-col items-center justify-center py-5 px-4 text-center border-r last:border-r-0"
          style={{ borderColor: '#f3f4f6' }}
        >
          <div className="flex items-center gap-1.5 mb-1">
            <span className="text-base md:text-xl font-black" style={{ color: '#111111' }}>{item.value}</span>
            {item.icon === 'star' && <StarIcon className="w-4 h-4 text-yellow-400" filled />}
          </div>
          <span className="text-[10px] md:text-xs font-bold uppercase tracking-wide" style={{ color: '#6b7280' }}>{item.label}</span>
        </div>
      ))}
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
  const socialIcons: Record<string, React.ReactNode> = {
    instagram: <InstagramIcon className="w-4 h-4" />,
    facebook: <FacebookIcon className="w-4 h-4" />,
    tiktok: <TikTokIcon className="w-4 h-4" />,
    youtube: <YouTubeIcon className="w-4 h-4" />,
    x: <XIcon className="w-4 h-4" />,
  };

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
            <BrandLogo src={logoSrc} alt={brand.name} className="h-10 md:h-12 w-auto max-w-[140px] object-contain shrink-0" />
          ) : (
            brand.show_brand_name !== false ? (
              <span className="font-black text-lg md:text-xl uppercase tracking-tighter truncate" style={{ color: headerIsDark ? '#ffffff' : primaryColor }}>
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
        {entries.length > 0 && (
          <div className="hidden lg:flex items-center gap-2">
            {entries.slice(0, 4).map(([platform, url]) => (
              <a 
                key={platform} 
                href={url} 
                target="_blank" 
                rel="noopener noreferrer" 
                aria-label={`Síguenos en ${platform}`}
                className="w-9 h-9 rounded-xl flex items-center justify-center transition-all hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF5C3A] focus-visible:ring-offset-2"
                style={{ backgroundColor: headerIsDark ? 'rgba(255,255,255,0.1)' : `${primaryColor}10`, color: headerIsDark ? '#ffffff' : primaryColor }}
              >
                {socialIcons[platform.toLowerCase()] ?? platform.slice(0, 1)}
              </a>
            ))}
          </div>
        )}

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
              <div className="flex gap-3 pt-4 border-t" style={{ borderColor: headerIsDark ? 'rgba(255,255,255,0.08)' : '#f9fafb' }}>
                {entries.map(([platform, url]) => (
                  <a 
                    key={platform} 
                    href={url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="w-10 h-10 rounded-xl flex items-center justify-center"
                    style={{ backgroundColor: headerIsDark ? 'rgba(255,255,255,0.1)' : `${primaryColor}15`, color: headerIsDark ? '#ffffff' : primaryColor }}
                  >
                    {socialIcons[platform.toLowerCase()] ?? platform.slice(0, 1)}
                  </a>
                ))}
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
          
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black leading-[1.05] tracking-tighter uppercase italic animate-in fade-in slide-in-from-bottom-4 duration-700 delay-150" style={{ color: textColor }}>
            {brand.name}<br />
            <span style={{ color: primaryColor }}>{brand.slogan || 'Colección 2026'}</span>
          </h1>
          
          {brand.brand_description && (
            <p className="text-sm md:text-base max-w-xl mx-auto lg:mx-0 leading-relaxed font-medium animate-in fade-in slide-in-from-bottom-2 duration-700 delay-300" style={{ color: mutedColor }}>
              {brand.brand_description}
            </p>
          )}
          
          <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-5 animate-in fade-in slide-in-from-bottom-2 duration-700 delay-500">
            <button onClick={onScrollDown} className="w-full sm:w-auto px-10 py-4 rounded-xl text-white font-black text-xs uppercase tracking-[0.2em] shadow-xl hover:brightness-110 active:scale-95 transition-all" style={{ backgroundColor: primaryColor }}>Ver Productos</button>
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
              ) : (
                <div className="flex -space-x-3">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="w-10 h-10 rounded-full border-2 border-white bg-gray-200 overflow-hidden shadow-md" />
                  ))}
                  <div className="w-10 h-10 rounded-full border-2 border-white flex items-center justify-center text-xs font-bold shadow-md" style={{ backgroundColor: isBgDark ? 'rgba(255,255,255,0.15)' : '#f0edea', color: mutedColor }}>
                    +500
                  </div>
                </div>
              )}
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
  const theme = useContrastTheme(brand.cover_bg_color);

  return (
    <section className="py-16 px-6 border-b" style={{ backgroundColor: theme.bg, borderColor: theme.border }}>
      <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-10 md:gap-12">
        {steps.map((s, i) => (
          <div key={s.n} className="flex flex-col items-center md:items-start text-center md:text-left space-y-4 group">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center font-black text-2xl transition-transform group-hover:scale-110" style={{ backgroundColor: `${primaryColor}15`, color: primaryColor }}>
              {s.n}
            </div>
            <h3 className="text-xl font-black uppercase tracking-tight italic" style={{ color: theme.text }}>{s.t}</h3>
            <p className="text-sm leading-relaxed font-medium" style={{ color: theme.muted }}>{s.d}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

// ── Products Component ───────────────────────────────────────────────────────

function ClassicProducts({ products, brand, primaryColor, secondaryColor, ctaText, onProductClick, selectedId }: { products: ProductData[]; brand: BrandData; primaryColor: string; secondaryColor: string; ctaText?: string | null; onProductClick: (id: string) => void; selectedId: string | null }) {
  const [isLoading, setIsLoading] = useState(true);
  const { ref: sectionRef, isVisible } = useScrollReveal();
  const theme = useLandingTheme(brand);

  useEffect(() => {
    // products es undefined durante la carga inicial
    // products.length === 0 puede ser array vacío real o datos no cargados aún
    if (products && products.length > 0) {
      setIsLoading(false);
    }
  }, [products]);

  // Si no hay productos cargados (undefined o array vacío), no renderizar nada
  // Esto evita both: el skeleton que nunca aparece y el estado vacío sin datos
  if (!products || products.length === 0) {
    // Opcional: podrías retornar un estado vacío con mensaje aquí
    // Pero por ahora retornamos null para no mostrar nada hasta que carguen
    return null;
  }

  return (
    <section ref={sectionRef} id="productos" className={`py-20 px-6 transition-all duration-700 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`} style={{ backgroundColor: theme.productsBg }}>
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-14 space-y-3">
          <span className="text-xs font-bold uppercase tracking-[0.3em]" style={{ color: secondaryColor || primaryColor }}>Colección de Temporada</span>
          <h2 className="text-3xl md:text-4xl font-black tracking-tighter uppercase italic leading-none" style={{ color: theme.text }}>Nuestros Productos</h2>
          <p className="text-sm font-medium" style={{ color: theme.muted }}>{products.length} prendas disponibles para probar</p>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
          {isLoading ? (
            <>
              {[0,1,2,3,4,5].map(i => <ProductSkeleton key={i} primaryColor={primaryColor} />)}
            </>
          ) : (
            products.map(p => {
              const isSelected = selectedId === p.id;
              return (
                <div 
                  key={p.id} 
                  className={`group relative bg-white rounded-[2rem] overflow-hidden transition-all duration-500 hover:shadow-2xl ${isSelected ? 'ring-2 ring-offset-2' : 'border border-gray-100'}`}
                  style={{ 
                    ...(isSelected ? { ringColor: primaryColor } : {}),
                    boxShadow: isSelected ? `0 25px 50px -12px ${primaryColor}25` : undefined
                  }}
                >
                  {isSelected && (
                    <div className="absolute top-4 right-4 z-10 px-3 py-1.5 rounded-full bg-white shadow-lg flex items-center gap-1.5">
                      <SparklesIcon className="w-3.5 h-3.5" style={{ color: primaryColor }} />
                      <span className="text-[10px] font-black uppercase tracking-wider" style={{ color: primaryColor }}>Seleccionado</span>
                    </div>
                  )}
                  
                  <div className="relative aspect-[4/5] overflow-hidden bg-gray-50">
                    <ProductImage 
                      src={p.image_url} 
                      alt={p.name} 
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" 
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw" 
                    />
                    {p.badge && (
                      <div className="absolute top-4 left-4">
                        <ProductBadge badge={p.badge} />
                      </div>
                    )}
                    
                    {/* CTA Button - Siempre visible en móvil, hover en desktop */}
                    <div className="absolute bottom-5 left-4 right-4 opacity-0 lg:opacity-0 group-hover:opacity-100 lg:group-hover:opacity-100 transition-all duration-300 translate-y-2 lg:translate-y-0">
                      <button 
                        onClick={() => onProductClick(p.id)} 
                        aria-label={`Probar ${p.name} con IA`}
                        className="w-full py-3.5 bg-white text-black rounded-xl font-black text-xs uppercase tracking-widest shadow-xl hover:bg-gray-900 hover:text-white active:scale-95 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF5C3A] focus-visible:ring-offset-2"
                      >
                        {ctaText || 'Probar con IA'}
                      </button>
                    </div>
                    
                    {/* Quick Try Button - Mobile */}
                    <button 
                      onClick={() => onProductClick(p.id)} 
                      className="lg:hidden absolute bottom-5 left-4 right-4 py-3.5 bg-white text-black rounded-xl font-black text-xs uppercase tracking-widest shadow-xl active:scale-95 transition-all"
                    >
                      {ctaText || 'Probar con IA'}
                    </button>
                  </div>
                  
                  <div className="p-6 text-left">
                    <div className="flex justify-between items-start mb-2">
                      <p className="text-xs font-bold uppercase tracking-widest" style={{ color: secondaryColor || primaryColor }}>{p.category}</p>
                      {p.price && <p className="text-base font-black" style={{ color: theme.text }}>${p.price.toLocaleString('es-CO')}</p>}
                    </div>
                    <h3 className="text-base font-bold uppercase tracking-tight line-clamp-1" style={{ color: theme.text }}>{p.name}</h3>
                    {p.short_description && (
                      <p className="text-sm mt-2 line-clamp-2 leading-relaxed font-medium" style={{ color: theme.muted }}>{p.short_description}</p>
                    )}
                    {p.attributes && Object.keys(p.attributes).length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {Object.entries(p.attributes).slice(0, 4).map(([key, value]) => {
                          if (!value || (Array.isArray(value) && value.length === 0)) return null;
                          const displayValue = Array.isArray(value) ? value.slice(0, 3).join(', ') : String(value);
                          return (
                            <span key={key} className="text-xs px-2.5 py-1 rounded-full font-bold" style={{ backgroundColor: `${primaryColor}15`, color: primaryColor }}>
                              {displayValue}
                            </span>
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
      </div>
    </section>
  );
}

// ── Info Section Component ────────────────────────────────────────────────────

function ClassicInfo({ brand, primaryColor, secondaryColor }: { brand: BrandData; primaryColor: string; secondaryColor: string }) {
  const DAYS_ORDER = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
  let scheduleEntries: [string, string][] = [];
  try {
    const raw = brand.schedule ?? {};
    if (raw && typeof raw === 'object') {
      scheduleEntries = DAYS_ORDER.filter(d => raw[d] || raw[d.toLowerCase()]).map(d => [d, (raw[d] || raw[d.toLowerCase()]) as string]);
    }
  } catch (e) {}

  const hasLocationBlock = !!brand.city_display || !!brand.national_shipping;
  const hasRatings = typeof brand.rating === 'number' || typeof brand.total_reviews === 'number';

  if (!hasLocationBlock && scheduleEntries.length === 0 && !hasRatings) return null;

  return (
    <section className="py-16 px-6 border-b" style={{ backgroundColor: '#ffffff', borderColor: '#f3f4f6' }}>
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 lg:gap-16">
          {/* Ubicación */}
          {hasLocationBlock && (
            <div className="space-y-6">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center" style={{ backgroundColor: `${primaryColor}15` }}>
                  <MapPinIcon className="w-7 h-7" style={{ color: primaryColor }} />
                </div>
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-widest" style={{ color: secondaryColor || primaryColor }}>Encuéntranos</h4>
                  <p className="text-lg font-black italic" style={{ color: '#111111' }}>{brand.city_display}</p>
                </div>
              </div>
              {brand.national_shipping && (
                <div className="flex items-center gap-2 px-4 py-2 rounded-xl w-fit" style={{ backgroundColor: '#ecfdf5' }}>
                  <span className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: '#10b981' }} />
                  <span className="text-xs font-bold uppercase tracking-widest" style={{ color: '#059669' }}>Envíos Nacionales</span>
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
                  <div key={d} className="flex justify-between items-center py-2 border-b text-sm" style={{ borderColor: '#f3f4f6' }}>
                    <span className="font-bold uppercase" style={{ color: '#6b7280' }}>{d}</span>
                    <span className={`font-black ${h.toLowerCase().includes('cerrado') ? 'italic text-red-500' : ''}`} style={{ color: h.toLowerCase().includes('cerrado') ? undefined : '#111111' }}>{h}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Ratings */}
          {hasRatings && (
            <div className="space-y-6">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center" style={{ backgroundColor: '#fef3c7' }}>
                  <StarIcon className="w-7 h-7 text-yellow-400" filled />
                </div>
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-widest" style={{ color: secondaryColor || primaryColor }}>Valoraciones</h4>
                  <p className="text-3xl font-black" style={{ color: '#111111' }}>{brand.rating?.toFixed(1) || '4.9'}</p>
                </div>
              </div>
              <div className="flex gap-1 text-yellow-400">
                {[1, 2, 3, 4, 5].map(i => <StarIcon key={i} className="w-5 h-5" filled={i <= Math.round(brand.rating || 0)} />)}
              </div>
              <p className="text-sm font-bold" style={{ color: '#6b7280' }}>{(brand.total_reviews || 0).toLocaleString()} reseñas de clientes</p>
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
  const socialIcons: Record<string, React.ReactNode> = {
    instagram: <InstagramIcon className="w-5 h-5" />,
    facebook: <FacebookIcon className="w-5 h-5" />,
    tiktok: <TikTokIcon className="w-5 h-5" />,
    youtube: <YouTubeIcon className="w-5 h-5" />,
    x: <XIcon className="w-5 h-5" />,
  };
  const entries = getVisibleSocialEntries(brand.social_links);
  const theme = useContrastTheme('#ffffff');

  return (
    <footer id="contacto" className="pt-24 pb-12 px-6 border-t" style={{ backgroundColor: '#ffffff', borderColor: '#f3f4f6' }}>
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-20 mb-20">
          {/* Brand Column */}
          <div className="lg:col-span-5 space-y-8">
            <div className="flex items-center gap-4">
              {brand.logo ? (
                <BrandLogo src={brand.logo_dark || brand.logo} alt={brand.name} className="h-10 object-contain" />
              ) : (
                <span className="font-black text-2xl uppercase italic" style={{ color: primaryColor }}>{brand.name}</span>
              )}
            </div>
            
            {brand.brand_description && (
              <p className="text-base leading-relaxed font-medium italic max-w-sm" style={{ color: '#6b7280' }}>
                &quot;{brand.brand_description}&quot;
              </p>
            )}

            {/* Social Icons */}
            {entries.length > 0 && (
              <div className="flex gap-3">
                {entries.map(([platform, url]) => (
                  <a 
                    key={platform} 
                    href={url} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    aria-label={`Síguenos en ${platform}`}
                    className="w-12 h-12 rounded-xl flex items-center justify-center transition-all hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF5C3A] focus-visible:ring-offset-2"
                    style={{ backgroundColor: '#f9fafb', border: '1px solid #e5e7eb', color: '#6b7280' }}
                  >
                    {socialIcons[platform.toLowerCase()] || platform.slice(0, 1)}
                  </a>
                ))}
              </div>
            )}

            {/* Location */}
            {(brand.city_display || brand.national_shipping) && (
              <div className="space-y-2">
                {brand.city_display && (
                  <p className="text-sm font-bold uppercase tracking-widest" style={{ color: secondaryColor || primaryColor }}>{brand.city_display}</p>
                )}
                {brand.national_shipping && (
                  <p className="text-sm font-bold uppercase tracking-widest text-emerald-600">Envíos nacionales activos</p>
                )}
              </div>
            )}
          </div>

          {/* Quick Links / Contact */}
          <div className="lg:col-span-4 space-y-8">
            <h4 className="text-xs font-bold uppercase tracking-[0.3em]" style={{ color: secondaryColor || primaryColor }}>Contacto Rápido</h4>
            <div className="space-y-4">
              <button 
                onClick={() => document.getElementById('productos')?.scrollIntoView({ behavior: 'smooth' })}
                className="block text-sm font-medium hover:opacity-70 transition-opacity text-left" style={{ color: '#374151' }}
              >
                Ver Catálogo
              </button>
              <button 
                onClick={() => document.getElementById('probador')?.scrollIntoView({ behavior: 'smooth' })}
                className="block text-sm font-medium hover:opacity-70 transition-opacity text-left" style={{ color: '#374151' }}
              >
                Probador Virtual IA
              </button>
              <button 
                onClick={() => document.getElementById('contacto')?.scrollIntoView({ behavior: 'smooth' })}
                className="block text-sm font-medium hover:opacity-70 transition-opacity text-left" style={{ color: '#374151' }}
              >
                Horarios y Ubicación
              </button>
            </div>
          </div>

          {/* Rating Column */}
          {(typeof brand.rating === 'number' || typeof brand.total_reviews === 'number') && (
            <div className="lg:col-span-3 space-y-6">
              <h4 className="text-xs font-bold uppercase tracking-[0.3em]" style={{ color: '#9ca3af' }}>Valoraciones</h4>
              <div className="space-y-3">
                <div className="flex gap-1 text-yellow-400">
                  {[1, 2, 3, 4, 5].map(i => <StarIcon key={i} className="w-5 h-5" filled={i <= Math.round(brand.rating || 0)} />)}
                </div>
                {typeof brand.rating === 'number' && (
                  <p className="text-4xl font-black tracking-tight" style={{ color: '#111111' }}>{brand.rating.toFixed(1)}</p>
                )}
                {typeof brand.total_reviews === 'number' && (
                  <p className="text-xs font-bold uppercase" style={{ color: '#9ca3af' }}>
                    {brand.total_reviews.toLocaleString()} Reseñas
                  </p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t flex flex-col md:flex-row items-center justify-between gap-4" style={{ borderColor: '#f3f4f6' }}>
          <p className="text-xs font-bold uppercase tracking-widest text-center md:text-left" style={{ color: '#9ca3af' }}>
            © 2026 {brand.name}
          </p>
          <p className="text-xs font-bold uppercase tracking-widest text-center md:text-right" style={{ color: '#9ca3af' }}>
            Powered by <a href={footerUrl || 'https://lookitry.com'} target="_blank" rel="noopener noreferrer" className="font-bold hover:opacity-80 transition-opacity" style={{ color: '#111111' }}>Look<span style={{ color: '#FF5C3A' }}>itry</span> IA</a>
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
            <h2 className="text-3xl md:text-4xl font-black text-white tracking-tighter uppercase italic leading-none">Experiencia Inteligente</h2>
            <p className="text-sm text-white/60 font-medium">Selecciona un producto y pruébatelo virtualmente con nuestra IA</p>
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
