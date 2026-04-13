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

function ClassicHeader({ brand, primaryColor, onScrollDown }: { brand: BrandData; primaryColor: string; onScrollDown: () => void }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const headerBg = brand.header_color || '#ffffff';
  const headerIsDark = isDarkColor(headerBg);
  const headerTextColor = headerIsDark ? '#ffffff' : '#111111';
  const headerMutedColor = headerIsDark ? 'rgba(255,255,255,0.72)' : '#6b7280';
  const logoSrc = headerIsDark ? (brand.logo_light || brand.logo) : (brand.logo_dark || brand.logo);

  return (
    <header
      className="sticky top-0 z-50 w-full h-16 md:h-20 backdrop-blur-md border-b transition-all"
      style={{
        backgroundColor: `${headerBg}${headerIsDark ? 'f2' : 'e6'}`,
        borderColor: headerIsDark ? 'rgba(255,255,255,0.08)' : '#f3f4f6',
      }}
    >
      <div className="max-w-6xl mx-auto h-full px-4 md:px-8 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          {brand.logo ? (
            <BrandLogo src={logoSrc} alt={brand.name} className="h-7 md:h-9 w-auto object-contain shrink-0" />
          ) : (
            brand.show_brand_name !== false ? (
              <span className="font-black text-base md:text-lg uppercase tracking-tighter truncate" style={{ color: headerIsDark ? '#ffffff' : primaryColor }}>
                {brand.name}
              </span>
            ) : null
          )}
          {brand.logo && brand.show_brand_name !== false && (
            <span className="font-black text-base md:text-lg uppercase tracking-tighter truncate" style={{ color: headerTextColor }}>
              {brand.name}
            </span>
          )}
        </div>

        <nav className="hidden md:flex items-center gap-8">
          <button onClick={onScrollDown} aria-label="Ir a productos" className="text-[10px] font-bold uppercase tracking-widest transition-colors" style={{ color: headerMutedColor }}>Catalogo</button>
          <button onClick={() => document.getElementById('probador')?.scrollIntoView({ behavior: 'smooth' })} aria-label="Ir a probador IA" className="text-[10px] font-bold uppercase tracking-widest transition-colors" style={{ color: headerMutedColor }}>Probador IA</button>
          <button onClick={() => document.getElementById('contacto')?.scrollIntoView({ behavior: 'smooth' })} aria-label="Ir a horarios y contacto" className="text-[10px] font-bold uppercase tracking-widest transition-colors" style={{ color: headerMutedColor }}>Horarios</button>
        </nav>

        <div className="flex items-center gap-3 md:gap-0">
          <button
            onClick={() => document.getElementById('probador')?.scrollIntoView({ behavior: 'smooth' })}
            className="px-5 md:px-8 py-2 md:py-3 rounded-full text-white text-[10px] font-black uppercase tracking-widest shadow-xl transition-all hover:brightness-110 active:scale-95"
            style={{ backgroundColor: primaryColor }}
          >
            Probar Ahora
          </button>
          <button 
            onClick={() => setMobileMenuOpen(v => !v)} 
            className="md:hidden p-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF5C3A] focus-visible:ring-offset-2 rounded-lg"
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
          className="md:hidden absolute top-16 left-0 w-full shadow-2xl animate-in slide-in-from-top duration-300"
          style={{
            backgroundColor: headerBg,
            borderBottom: `1px solid ${headerIsDark ? 'rgba(255,255,255,0.08)' : '#f3f4f6'}`,
          }}
        >
          <nav className="flex flex-col p-6 gap-4">
            <button onClick={() => { onScrollDown(); setMobileMenuOpen(false); }} aria-label="Ir a productos" className="text-xs font-black uppercase tracking-widest text-left py-2 border-b" style={{ color: headerTextColor, borderColor: headerIsDark ? 'rgba(255,255,255,0.08)' : '#f9fafb' }}>Catalogo</button>
            <button onClick={() => { document.getElementById('probador')?.scrollIntoView({ behavior: 'smooth' }); setMobileMenuOpen(false); }} aria-label="Ir a probador IA" className="text-xs font-black uppercase tracking-widest text-left py-2 border-b" style={{ color: headerTextColor, borderColor: headerIsDark ? 'rgba(255,255,255,0.08)' : '#f9fafb' }}>Probador IA</button>
            <button onClick={() => { document.getElementById('contacto')?.scrollIntoView({ behavior: 'smooth' }); setMobileMenuOpen(false); }} aria-label="Ir a horarios y contacto" className="text-xs font-black uppercase tracking-widest text-left py-2" style={{ color: headerTextColor }}>Horarios y Contacto</button>
          </nav>
        </div>
      )}
    </header>
  );
}

function ClassicHero({ brand, primaryColor, onScrollDown, isPreview = false }: { brand: BrandData; primaryColor: string; onScrollDown: () => void; isPreview?: boolean }) {
  const hasCover = !!brand.cover_image_url;
  const { backgroundColor: coverBaseColor, imageOpacity: coverOpacity } = getCoverPresentation(brand, primaryColor + '10');
  const bgColor = brand.cover_bg_color || '#f9f8f6';
  const isBgDark = isDarkColor(bgColor);
  const textColor = isBgDark ? '#ffffff' : '#111111';
  const mutedColor = getSmartMutedColor(bgColor);

  return (
    <section 
      className={`relative w-full ${isPreview ? 'py-6 md:py-10' : 'py-10 md:py-20'} px-6 overflow-hidden`}
      style={{ backgroundColor: bgColor }}
    >
      <div className="max-w-6xl mx-auto flex flex-col lg:flex-row items-center gap-10 md:gap-16">
        <div className="flex-1 text-center lg:text-left space-y-5 md:space-y-6 z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border text-[9px] font-bold uppercase tracking-[0.2em]"
            style={{ 
              backgroundColor: isBgDark ? 'rgba(255,255,255,0.1)' : `${primaryColor}15`,
              borderColor: isBgDark ? 'rgba(255,255,255,0.2)' : `${primaryColor}30`,
              color: isBgDark ? '#ffffff' : primaryColor 
            }}
          >
            <SparklesIcon className="w-3.5 h-3.5" />
            Nueva tecnologia de probador
          </div>
          <h1 className="text-2xl sm:text-4xl md:text-5xl font-black leading-[1.1] tracking-tighter uppercase italic" style={{ color: textColor }}>
            {brand.name}<br />
            <span style={{ color: primaryColor }}>{brand.slogan || 'Coleccion 2026'}</span>
          </h1>
          {brand.brand_description && (
            <p className="text-[11px] md:text-sm max-w-lg mx-auto lg:mx-0 leading-relaxed font-medium" style={{ color: mutedColor }}>
              {brand.brand_description}
            </p>
          )}
          <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
            <button onClick={onScrollDown} className="w-full sm:w-auto px-8 py-3.5 rounded-xl text-white font-black text-[10px] uppercase tracking-[0.2em] shadow-xl hover:brightness-110 active:scale-95 transition-all" style={{ backgroundColor: primaryColor }}>Ver Productos</button>
            <div className="flex -space-x-2.5">
              {[1, 2, 3].map(i => <div key={i} className="w-8 h-8 rounded-full border-2 border-white bg-gray-200 overflow-hidden shadow-sm" />)}
              <div className="w-8 h-8 rounded-full border-2 border-white flex items-center justify-center text-[9px] font-bold" style={{ backgroundColor: isBgDark ? 'rgba(255,255,255,0.1)' : '#f0edea', color: mutedColor }}>+500</div>
            </div>
          </div>
        </div>

        <div className="flex-1 w-full relative aspect-square lg:aspect-[4/5] rounded-[2.5rem] overflow-hidden shadow-xl transition-transform duration-700 hover:scale-[1.01]">
          {hasCover ? (
            <>
              <div className="absolute inset-0" style={{ backgroundColor: coverBaseColor }} />
              <CoverImage src={brand.cover_image_url} alt={brand.name} className="absolute inset-0 w-full h-full object-cover" style={{ opacity: coverOpacity }} />
            </>
          ) : (
            <div className="w-full h-full flex items-center justify-center" style={{ backgroundColor: coverBaseColor }}>
              <span style={{ color: isBgDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.1)' }}>
                <SparklesIcon className="w-16 h-16 opacity-10" />
              </span>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

function ClassicSteps({ brand, primaryColor, secondaryColor }: { brand: BrandData; primaryColor: string; secondaryColor?: string }) {
  const stepsDef = brand.landing_steps;
  const steps = [
    {
      n: '01',
      t: stepsDef?.select_label || 'Selecciona',
      d: stepsDef?.select_desc || 'Elige cualquier prenda de nuestro catalogo curado para comenzar.',
    },
    {
      n: '02',
      t: stepsDef?.photo_label || 'Fotografia',
      d: stepsDef?.photo_desc || 'Captura una selfie frontal. La iluminacion es clave para el realismo.',
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
        {steps.map(s => (
          <div key={s.n} className="flex flex-col items-center md:items-start text-center md:text-left space-y-3">
            <span className="text-4xl font-black italic opacity-10" style={{ color: primaryColor }}>{s.n}</span>
            <h3 className="text-lg font-black uppercase tracking-tight italic" style={{ color: theme.text }}>{s.t}</h3>
            <p className="text-xs leading-relaxed font-medium" style={{ color: theme.muted }}>{s.d}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function ClassicProducts({ products, brand, primaryColor, secondaryColor, ctaText, onProductClick }: { products: ProductData[]; brand: BrandData; primaryColor: string; secondaryColor?: string; ctaText?: string | null; onProductClick: (id: string) => void }) {
  const [isLoading, setIsLoading] = useState(true);
  const { ref: sectionRef, isVisible } = useScrollReveal();
  const theme = useLandingTheme(brand);

  useEffect(() => {
    if (products && products.length > 0) {
      setIsLoading(false);
    }
  }, [products]);

  if (!products.length) return null;

  return (
    <section ref={sectionRef} id="productos" className={`py-20 px-6 transition-all duration-700 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`} style={{ backgroundColor: theme.productsBg }}>
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12 space-y-3">
          <span className="text-[9px] font-black uppercase tracking-[0.3em]" style={{ color: secondaryColor || primaryColor }}>Coleccion de Temporada</span>
          <h2 className="text-2xl md:text-4xl font-black tracking-tighter uppercase italic leading-none" style={{ color: theme.text }}>Nuestros Productos</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
          {isLoading ? (
            <>
              {[0,1,2].map(i => <ProductSkeleton key={i} primaryColor={primaryColor} />)}
            </>
          ) : (
            products.map(p => (
              <div key={p.id} className="group bg-white rounded-[2rem] border border-gray-100 overflow-hidden transition-all duration-500 hover:shadow-xl">
              <div className="relative aspect-[4/5] overflow-hidden bg-gray-50">
                <ProductImage src={p.image_url} alt={p.name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw" />
                {p.badge && <div className="absolute top-4 left-4"><ProductBadge badge={p.badge} /></div>}
                <button onClick={() => onProductClick(p.id)} aria-label={`Probar ${p.name} con IA`} className="absolute bottom-5 left-1/2 -translate-x-1/2 w-[85%] py-3 bg-white text-black rounded-lg font-black text-[9px] uppercase tracking-widest shadow-xl opacity-0 translate-y-3 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-500 hover:bg-gray-900 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF5C3A] focus-visible:ring-offset-2">
                  {ctaText || 'Probar con IA'}
                </button>
              </div>
              <div className="p-6 text-left">
                <div className="flex justify-between items-start mb-1">
                  <p className="text-[9px] font-black uppercase tracking-widest" style={{ color: secondaryColor || primaryColor }}>{p.category}</p>
                  {p.price && <p className="text-xs font-black" style={{ color: theme.text }}>${p.price.toLocaleString('es-CO')}</p>}
                </div>
                <h3 className="text-base font-bold uppercase tracking-tight line-clamp-1" style={{ color: theme.text }}>{p.name}</h3>
                {p.description && <p className="text-[10px] mt-1.5 line-clamp-2 leading-relaxed" style={{ color: theme.muted }}>{p.description}</p>}
              </div>
            </div>
          )))}
        </div>
      </div>
    </section>
  );
}

function ClassicFooter({ brand, primaryColor, secondaryColor, footerUrl }: { brand: BrandData; primaryColor: string; secondaryColor?: string; footerUrl?: string }) {
  const DAYS_ORDER = ['Lunes', 'Martes', 'Miercoles', 'Jueves', 'Viernes', 'Sabado', 'Domingo'];
  let scheduleEntries: [string, string][] = [];
  try {
    const raw = brand.schedule ?? {};
    if (raw && typeof raw === 'object') {
      scheduleEntries = DAYS_ORDER.filter(d => raw[d] || raw[d.toLowerCase()]).map(d => [d, (raw[d] || raw[d.toLowerCase()]) as string]);
    }
  } catch (e) {}

  const socialIcons: Record<string, any> = {
    instagram: <InstagramIcon className="w-5 h-5" />,
    facebook: <FacebookIcon className="w-5 h-5" />,
    tiktok: <TikTokIcon className="w-5 h-5" />,
    youtube: <YouTubeIcon className="w-5 h-5" />,
    x: <XIcon className="w-5 h-5" />
  };
  const hasLocationBlock = !!brand.city_display || !!brand.national_shipping;
  const hasRatings = typeof brand.rating === 'number' || typeof brand.total_reviews === 'number';
  const theme = useLandingTheme(brand);

  return (
    <footer id="contacto" className="pt-24 pb-12 px-6 border-t" style={{ backgroundColor: theme.footerBg, borderColor: theme.border }}>
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 md:gap-20 mb-20">
          <div className="lg:col-span-5 space-y-8">
            <div className="flex items-center gap-3">
              {brand.logo ? <BrandLogo src={brand.logo_dark || brand.logo} alt={brand.name} className="h-8 object-contain" /> : <span className="font-black text-2xl uppercase italic" style={{ color: primaryColor }}>{brand.name}</span>}
            </div>
            <p className="text-sm leading-relaxed font-medium italic max-w-sm text-left" style={{ color: theme.muted }}>&quot;{brand.brand_description || 'Moda y tecnologia unidas para ofrecerte la mejor experiencia de compra virtual.'}&quot;</p>
            <div className="flex gap-3 justify-start">
              {getVisibleSocialEntries(brand.social_links).map(([p, url]) => (
                <a key={p} href={url} target="_blank" rel="noopener noreferrer" aria-label={`Síguenos en ${p}`} className="w-12 h-12 rounded-xl flex items-center justify-center transition-all hover:bg-[#111111] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF5C3A] focus-visible:ring-offset-2" style={{ backgroundColor: theme.surface, border: `1px solid ${theme.border}`, color: theme.muted }}>
                  {socialIcons[p.toLowerCase()] || p.slice(0, 1)}
                </a>
              ))}
            </div>
            {hasLocationBlock && (
              <div className="space-y-2">
                {brand.city_display && <p className="text-[10px] font-black uppercase tracking-[0.3em]" style={{ color: secondaryColor || primaryColor }}>{brand.city_display}</p>}
                {brand.national_shipping && <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-600">Envios nacionales activos</p>}
              </div>
            )}
          </div>

          <div className="lg:col-span-4 space-y-8 text-left">
            <h4 className="text-[10px] font-black uppercase tracking-[0.3em]" style={{ color: secondaryColor || primaryColor }}>Horarios de Atencion</h4>
            {scheduleEntries.length > 0 ? (
              <div className="space-y-3">
                {scheduleEntries.map(([d, h]) => (
                  <div key={d} className="flex justify-between items-center text-xs font-bold border-b pb-2" style={{ borderColor: theme.borderLight }}>
                    <span className="uppercase" style={{ color: theme.muted }}>{d}</span>
                    <span style={{ color: theme.text }}>{h}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs italic font-medium" style={{ color: theme.muted }}>No hay horarios registrados.</p>
            )}
          </div>

          {hasRatings && (
            <div className="lg:col-span-3 space-y-8 text-left">
              <h4 className="text-[10px] font-black uppercase tracking-[0.3em]" style={{ color: theme.muted }}>Valoraciones</h4>
              <div className="space-y-2">
                <div className="flex gap-1 text-yellow-400">
                  {[1, 2, 3, 4, 5].map(i => <StarIcon key={i} className="w-4 h-4" filled={i <= Math.round(brand.rating || 0)} />)}
                </div>
                {typeof brand.rating === 'number' && <p className="text-2xl font-black tracking-tight" style={{ color: theme.text }}>{brand.rating.toFixed(1)}</p>}
                {typeof brand.total_reviews === 'number' && <p className="text-[10px] font-bold uppercase" style={{ color: theme.muted }}>{brand.total_reviews.toLocaleString()} Resenas de clientes</p>}
              </div>
            </div>
          )}
        </div>

        <div className="pt-8 border-t flex flex-col md:flex-row items-center justify-between gap-6" style={{ borderColor: theme.borderLight }}>
          <p className="text-[9px] font-black uppercase tracking-widest text-center md:text-left" style={{ color: theme.mutedLight }}>© 2026 {brand.name}</p>
          <p className="text-[9px] font-black uppercase tracking-widest text-center md:text-right" style={{ color: theme.mutedLight }}>
            Powered by <a href={footerUrl || 'https://lookitry.com'} target="_blank" rel="noopener noreferrer" className="font-bold hover:opacity-80 transition-colors" style={{ color: theme.text }}>Look<span className="text-[#FF5C3A]">itry</span> IA</a>
          </p>
        </div>
      </div>
    </footer>
  );
}

export function TemplateClassic({ brandSlug, brand, products, footerUrl, isPreview = false }: { brandSlug: string; brand: BrandData; products: ProductData[]; footerUrl?: string; isPreview?: boolean }) {
  const primary = brand.social_links?._landing_primary || brand.primary_color || '#111111';
  const secondary = brand.social_links?._landing_secondary || primary;
  const theme = useLandingTheme(brand);
  const [selectedId, setSelectedId] = useState<string | null>(products?.[0]?.id || null);

  const handleProductClick = (id: string) => {
    setSelectedId(id);
    document.getElementById('probador')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className={`min-h-screen bg-white flex flex-col ${brand.landing_font || 'font-jakarta'} overflow-x-hidden transition-colors duration-500 ${isPreview ? 'p-0 h-auto' : ''}`} style={{ '--primary': primary, '--secondary': secondary, '--secondary-10': secondary + '1a', '--secondary-20': secondary + '33', '--secondary-05': secondary + '0d' } as React.CSSProperties}>
      <ClassicHeader brand={brand} primaryColor={primary} onScrollDown={() => document.getElementById('productos')?.scrollIntoView({ behavior: 'smooth' })} />
      <ClassicHero brand={brand} primaryColor={primary} onScrollDown={() => document.getElementById('productos')?.scrollIntoView({ behavior: 'smooth' })} isPreview={isPreview} />
      <ClassicSteps brand={brand} primaryColor={primary} secondaryColor={secondary} />
      <ClassicProducts products={products} brand={brand} primaryColor={primary} secondaryColor={secondary} ctaText={brand.cta_button_text} onProductClick={handleProductClick} />

      <section id="probador" className="py-20 px-4 md:px-6" style={{ backgroundColor: brand.widget_bg_color || '#0a0a0a' }}>
        <div className="max-w-4xl mx-auto space-y-12 text-center">
          <div className="space-y-4">
            <span className="text-[10px] font-black uppercase tracking-[0.4em]" style={{ color: secondary }}>Probador Virtual Premium</span>
            <h2 className="text-2xl md:text-4xl font-black text-white tracking-tighter uppercase italic">Experiencia Inteligente</h2>
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
