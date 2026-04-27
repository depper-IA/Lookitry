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
  getVisibleSocialEntries,
  useScrollReveal,
  isDarkColor,
  getSmartMutedColor,
  getSmartBorderColor,
  getContrastColor,
  useContrastTheme,
  useLandingTheme,
  YouTubeIcon, 
  XIcon, 
  InstagramIcon, 
  FacebookIcon, 
  TikTokIcon,
  SparklesIcon,
  StarIcon,
  MapPinIcon,
  TruckIcon
} from './shared';

// ── Sub-componentes ──────────────────────────────────────────────────────────

function EditorialHeader({ brand, entries, socialIcons }: { brand: BrandData; entries: [string, string][]; socialIcons: Record<string, React.ReactNode> }) {
  const primary = brand.social_links?._landing_primary || brand.primary_color || '#111111';
  const secondary = brand.social_links?._landing_secondary || primary;
  return (
    <header className="px-4 md:px-8 h-16 md:h-24 flex items-center justify-between sticky top-0 z-[100] bg-white border-b border-gray-100 gap-4 shadow-sm">
      <div className="flex items-center gap-3 min-w-0 flex-1">
        <div className="shrink-0">
          {brand.logo ? (
            <BrandLogo src={brand.logo_dark || brand.logo} alt={brand.name} className="h-7 md:h-10 w-auto max-w-[100px] md:max-w-[160px] object-contain" />
          ) : (
            <div className="h-8 w-8 md:h-10 md:w-10 rounded-xl flex items-center justify-center text-white font-black text-sm shadow-lg shadow-[var(--secondary-20)]" style={{ backgroundColor: primary }}>{brand.name.slice(0, 2).toUpperCase()}</div>
          )}
        </div>
        {brand.show_brand_name !== false && (
          <span className="font-black text-xs md:text-lg text-gray-900 italic uppercase tracking-tighter truncate max-w-[120px] sm:max-w-none">
            {brand.name}
          </span>
        )}
      </div>
      {entries.length > 0 && (
        <div className="flex items-center gap-1 md:gap-2 shrink-0">
          {entries.slice(0, 4).map(([platform, url]) => (
            <a key={platform} href={url} target="_blank" rel="noopener noreferrer" aria-label={`Síguenos en ${platform}`} className="w-8 h-8 md:w-10 md:h-10 rounded-xl flex items-center justify-center transition-all hover:scale-110 active:scale-95 shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF5C3A] focus-visible:ring-offset-2" style={{ backgroundColor: primary + '10', color: primary }}>
              {socialIcons[platform.toLowerCase()] ?? null}
            </a>
          ))}
        </div>
      )}
    </header>
  );
}

function EditorialHero({ brand }: { brand: BrandData }) {
  const { backgroundColor: coverBaseColor, imageOpacity } = getCoverPresentation(brand, '#111111');
  const isBgDark = isDarkColor(coverBaseColor);
  const textColor = isBgDark ? '#ffffff' : '#111111';
  const mutedColor = getSmartMutedColor(coverBaseColor);
  
  return (
    <section className="relative w-full h-[35vh] md:h-[50vh] flex items-center justify-center overflow-hidden"
      style={{
        backgroundColor: coverBaseColor,
        // Si no hay imagen, agregar gradient decorativo para dar profundidad
        ...(!brand.cover_image_url && {
          background: `
            radial-gradient(ellipse at 30% 0%, ${coverBaseColor}ee 0%, transparent 50%),
            radial-gradient(ellipse at 70% 100%, ${coverBaseColor}44 0%, transparent 50%),
            ${coverBaseColor}
          `
        })
      }}
    >
      {brand.cover_image_url && (
        <CoverImage src={brand.cover_image_url} alt={brand.name} className="absolute inset-0 w-full h-full object-cover scale-105" style={{ opacity: imageOpacity }} />
      )}
      <div className="relative z-10 text-center px-6 max-w-4xl">
        <h1 className="text-4xl md:text-7xl font-black italic uppercase tracking-tighter drop-shadow-2xl animate-in fade-in slide-in-from-bottom-4 duration-1000" style={{ color: textColor }}>
          {brand.name}
        </h1>
        {brand.slogan && (
          <p className="text-[10px] md:text-sm font-black uppercase tracking-[0.4em] mt-4 animate-in fade-in slide-in-from-bottom-2 duration-1000 delay-300" style={{ color: mutedColor }}>
            {brand.slogan}
          </p>
        )}
      </div>
    </section>
  );
}

function EditorialProductCard({ product, selected, primaryColor, onClick }: { product: ProductData; selected: boolean; primaryColor: string; onClick: () => void }) {
  return (
    <button onClick={onClick} aria-label={`Seleccionar ${product.name}`} className="group text-left w-full space-y-3 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF5C3A] focus-visible:ring-offset-2">
      <div className={`relative aspect-[3/4] rounded-[1.5rem] md:rounded-[2rem] overflow-hidden bg-gray-50 border-2 transition-all duration-500 ${selected ? 'shadow-2xl shadow-[var(--secondary-20)] scale-[1.02]' : 'hover:shadow-xl'}`} style={{ borderColor: selected ? primaryColor : 'transparent' }}>
        <ProductImage src={product.image_url} alt={product.name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw" />
        {product.badge && <div className="absolute top-2 left-2 md:top-3 md:left-3 scale-90 origin-top-left"><ProductBadge badge={product.badge} /></div>}
        {selected && (
          <div className="absolute inset-0 bg-[var(--secondary-10)] flex items-center justify-center backdrop-blur-[1px]">
            <div className="bg-white p-2 md:p-3 rounded-xl md:rounded-2xl shadow-2xl">
              <SparklesIcon className="w-4 h-4 md:w-5 md:h-5 text-[var(--secondary)]" />
            </div>
          </div>
        )}
      </div>
      <div className="px-1 md:px-2 space-y-0.5 md:space-y-1">
        <div className="flex justify-between items-start gap-2">
          <h3 className="text-[10px] md:text-sm font-black text-gray-900 uppercase tracking-tight truncate flex-1">{product.name}</h3>
          {product.price != null && <p className="text-[10px] md:text-sm font-black text-[var(--secondary)]">${product.price.toLocaleString('es-CO')}</p>}
        </div>
        <p className="text-[8px] md:text-[10px] text-gray-400 font-bold uppercase tracking-widest">{product.category}</p>
        {product.short_description && <p className="text-[8px] md:text-[9px] text-gray-500 line-clamp-1 mt-1">{product.short_description}</p>}
        {product.attributes && Object.keys(product.attributes).length > 0 && (
          <div className="flex flex-wrap gap-1 mt-1">
            {Object.entries(product.attributes).slice(0, 2).map(([key, value]) => {
              if (!value || (Array.isArray(value) && value.length === 0)) return null;
              const displayValue = Array.isArray(value) ? value.slice(0, 2).join(', ') : String(value);
              return (
                <span key={key} className="text-[7px] md:text-[8px] px-1.5 py-0.5 rounded-full font-bold" style={{ backgroundColor: `${primaryColor}15`, color: primaryColor }}>
                  {displayValue}
                </span>
              );
            })}
          </div>
        )}
      </div>
    </button>
  );
}

function EditorialInfo({ brand, secondaryColor }: { brand: BrandData; secondaryColor?: string }) {
  const DAYS_ORDER = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
  let scheduleEntries: [string, string][] = [];
  try {
    const raw = brand.schedule ?? {};
    if (raw && typeof raw === 'object') {
      scheduleEntries = DAYS_ORDER.filter(d => raw[d] || raw[d.toLowerCase()]).map(d => [d, (raw[d] || raw[d.toLowerCase()]) as string]);
    }
  } catch(e) {}

  const theme = useContrastTheme('#ffffff');
  const accentColor = secondaryColor || brand.secondary_color || '#FF5C3A';

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8 w-full">
      {/* IZQUIERDA: Información */}
      <div className="p-6 md:p-10 rounded-[2rem] md:rounded-[3.5rem] border shadow-sm space-y-6 md:space-y-8" style={{ backgroundColor: theme.bg, borderColor: theme.border }}>
        <div className="flex items-center gap-4 border-b pb-6" style={{ borderColor: theme.border }}>
          <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl md:rounded-2xl flex items-center justify-center text-white shadow-xl" style={{ backgroundColor: brand.widget_bg_color || '#0a0a0a' }}>
            <MapPinIcon className="w-5 h-5 md:w-6 md:h-6" />
          </div>
          <div>
            <h4 className="text-[9px] md:text-xs font-black uppercase tracking-[0.3em]" style={{ color: accentColor }}>Ubicación</h4>
            <p className="text-xs md:text-sm font-black uppercase italic" style={{ color: theme.text }}>Presencia Física</p>
          </div>
        </div>
        <div className="space-y-6">
          {brand.city_display && (
            <p className="text-lg md:text-2xl font-black uppercase italic tracking-tighter leading-none" style={{ color: theme.text }}>{brand.city_display}</p>
          )}
          {brand.rating && (
            <div className="flex flex-col gap-2">
              <div className="flex gap-0.5 text-yellow-400">
                {[1,2,3,4,5].map(i => <StarIcon key={i} className="w-3.5 h-3.5 md:w-4 md:h-4" filled={i <= Math.round(brand.rating!)} />)}
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl md:text-3xl font-black tracking-tighter" style={{ color: theme.text }}>{brand.rating.toFixed(1)}</span>
                <span className="text-[9px] md:text-[10px] font-black uppercase tracking-widest" style={{ color: theme.muted }}>/ {brand.total_reviews} reviews</span>
              </div>
            </div>
          )}
          {brand.national_shipping && (
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-[9px] md:text-[10px] font-black uppercase tracking-widest border" style={{ backgroundColor: theme.surface, color: theme.text, borderColor: theme.border }}>
              <span style={{ color: accentColor }}><TruckIcon className="w-3.5 h-3.5 md:w-4 md:h-4" /></span> Envíos Nacionales
            </div>
          )}
        </div>
      </div>

      {/* DERECHA: Horarios */}
      <div className="p-6 md:p-10 rounded-[2rem] md:rounded-[3.5rem] border shadow-sm space-y-6 md:space-y-8" style={{ backgroundColor: theme.bg, borderColor: theme.border }}>
        <div className="flex items-center gap-4 border-b pb-6" style={{ borderColor: theme.border }}>
          <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl md:rounded-2xl flex items-center justify-center text-white shadow-xl" style={{ backgroundColor: brand.widget_bg_color || '#0a0a0a' }}>
            <svg className="w-5 h-5 md:w-6 md:h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-12 0 9 9 0 0112 0z" /></svg>
          </div>
          <div>
            <h4 className="text-[9px] md:text-xs font-black uppercase tracking-[0.3em]" style={{ color: accentColor }}>Disponibilidad</h4>
            <p className="text-xs md:text-sm font-black uppercase italic" style={{ color: theme.text }}>Nuestros Horarios</p>
          </div>
        </div>
        <div className="space-y-2 md:space-y-3">
          {scheduleEntries.length > 0 ? (
            scheduleEntries.map(([d, h]) => (
              <div key={d} className="flex justify-between items-center text-[10px] md:text-xs border-b pb-2 last:border-0 last:pb-0" style={{ borderColor: theme.border }}>
                <span className="font-black uppercase tracking-widest" style={{ color: theme.muted }}>{d}</span>
                <span className={`font-black uppercase ${h.toLowerCase().includes('cerrado') ? 'text-red-500 italic' : ''}`} style={{ color: h.toLowerCase().includes('cerrado') ? undefined : theme.text }}>{h}</span>
              </div>
            ))
          ) : (
            <p className="text-[10px] md:text-xs italic font-medium uppercase tracking-widest" style={{ color: theme.muted }}>No hay horarios registrados.</p>
          )}
        </div>
      </div>
    </div>
  );
}

function EditorialAbout({ brand, primaryColor }: { brand: BrandData; primaryColor: string }) {
  const bgColor = brand.widget_bg_color || '#0a0a0a';
  const theme = useContrastTheme(bgColor);
  if (!brand.brand_description) return null;
  return (
    <section className="py-6 md:py-16">
      <div className="p-8 md:p-16 rounded-[2.5rem] md:rounded-[4rem] relative overflow-hidden shadow-2xl" style={{ backgroundColor: bgColor }}>
        <div className="absolute top-0 right-0 p-12 opacity-10">
          <SparklesIcon className="w-32 h-32 md:w-48 md:h-48" />
        </div>
        <div className="relative z-10 space-y-4 md:space-y-6 text-center md:text-left">
          <span className="text-[9px] md:text-[10px] font-black uppercase tracking-[0.5em]" style={{ color: theme.muted }}>Nuestra Historia</span>
          <p className="text-base md:text-3xl leading-tight font-black italic uppercase tracking-tighter max-w-4xl" style={{ color: theme.text }}>
            &quot;{brand.brand_description}&quot;
          </p>
        </div>
      </div>
    </section>
  );
}

export function TemplateEditorial({ brandSlug, brand, products, footerUrl, isPreview = false }: { brandSlug: string; brand: BrandData; products: ProductData[]; footerUrl?: string; isPreview?: boolean }) {
  const [isLoading, setIsLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const { ref: productsRef, isVisible } = useScrollReveal();
  const theme = useLandingTheme(brand);

  useEffect(() => {
    if (products && products.length > 0) {
      setSelectedId(products[0].id);
      setIsLoading(false);
    }
  }, [products]);

  const primary = brand.social_links?._landing_primary || brand.primary_color || '#111111';
  const secondary = brand.social_links?._landing_secondary || primary;

  const socialLinks = brand.social_links || {};
  const entries = getVisibleSocialEntries(socialLinks);
  const socialIcons: Record<string, React.ReactNode> = {
    instagram: <InstagramIcon className="w-3.5 h-3.5" />,
    facebook:  <FacebookIcon  className="w-3.5 h-3.5" />,
    tiktok:    <TikTokIcon    className="w-3.5 h-3.5" />,
    youtube:   <YouTubeIcon   className="w-3.5 h-3.5" />,
    x:         <XIcon         className="w-3.5 h-3.5" />,
  };

  const handleProductClick = (id: string) => {
    setSelectedId(id);
    const el = document.getElementById('editorial-tryon');
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  return (
    <div className={`min-h-screen flex flex-col // TODO: landing_font from brand config - pending API support
        ${brand.landing_font || 'font-jakarta'} overflow-x-hidden ${isPreview ? 'p-0 h-auto' : ''}`} style={{ backgroundColor: theme.cardBg, '--primary': primary, '--secondary': secondary, '--secondary-10': secondary + "1a", '--secondary-20': secondary + "33", '--secondary-05': secondary + "0d" } as React.CSSProperties}>
      <EditorialHeader brand={brand} entries={entries} socialIcons={socialIcons} />
      <EditorialHero brand={brand} />
      
      <main className="max-w-6xl mx-auto w-full px-4 md:px-6 py-12 md:py-20">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-12 items-start mb-16">
          {/* Catálogo Prioritario */}
          <div className="order-2 lg:order-1">
            <div className="flex items-center justify-between border-b-2 border-black pb-4 mb-10">
              <h2 className="text-3xl font-black uppercase italic tracking-tighter">Colección</h2>
              <span className="text-[10px] font-black bg-black text-white px-3 py-1 uppercase">{products?.length || 0} Items</span>
            </div>
            
            <div ref={productsRef} className={`grid grid-cols-2 xl:grid-cols-3 gap-6 md:gap-8 transition-all duration-700 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}>
              {isLoading ? (
                <>
                  {[0,1,2,3,4,5].map(i => <ProductSkeleton key={i} primaryColor={primary} />)}
                </>
              ) : (
                products && Array.isArray(products) && products.map(p => (
                  <EditorialProductCard key={p.id} product={p} selected={selectedId === p.id} primaryColor={primary} onClick={() => handleProductClick(p.id)} />
                ))
              )}
            </div>
          </div>

          {/* Probador Prioritario (Sidebar Sticky) */}
          <aside className="order-1 lg:order-2">
            <div id="editorial-tryon" className="lg:sticky lg:top-28">
              <div className={isPreview ? "overflow-hidden bg-white" : "rounded-[3rem] overflow-hidden shadow-[0_40px_80px_-15px_rgba(0,0,0,0.15)] bg-white border border-gray-100"}>
                <div className="px-6 py-4 text-white flex justify-between items-center" style={{ backgroundColor: primary }}>
                  <span className="font-black text-[10px] uppercase tracking-widest flex items-center gap-2">
                    <SparklesIcon className="w-4 h-4" /> Probador IA
                  </span>
                  <span className="text-[8px] font-black opacity-60">AI POWERED</span>
                </div>
                <div className="bg-white">
                  <TryOnWidget brandSlug={brandSlug} isEmbed={true} initialProductId={selectedId} forceLayout="bare" lockProductSelection={true} />
                </div>
              </div>
              <p className="text-center mt-6 text-[9px] font-black uppercase tracking-[0.3em] text-gray-300">Desarrollado por Lookitry AI</p>
            </div>
          </aside>
        </div>

        {/* Información y Horarios */}
        <EditorialInfo brand={brand} secondaryColor={secondary} />

        {/* Descripción de marca */}
        <EditorialAbout brand={brand} primaryColor={primary} />
      </main>

      <footer 
        className="mt-20 py-20 px-6 text-center transition-colors duration-500" 
        style={{ backgroundColor: brand.widget_bg_color || '#0a0a0a', color: '#ffffff' }}
      >
        <div className="max-w-6xl mx-auto space-y-12">
          {/* Logo / Nombre en Footer */}
          <div className="flex flex-col items-center gap-4">
            {brand.logo ? (
              <img src={brand.logo_light || brand.logo} alt={brand.name} className="h-12 w-auto object-contain opacity-90 mb-2 grayscale brightness-200" />
            ) : (
              <div className="h-12 w-12 rounded-2xl flex items-center justify-center text-white font-black text-xl mb-2" style={{ backgroundColor: primary }}>
                {brand.name?.slice(0, 2).toUpperCase()}
              </div>
            )}
            <div className="w-12 h-1 bg-[var(--secondary)] rounded-full opacity-50" />
          </div>

          {/* Social Links en Footer */}
          {entries && entries.length > 0 && (
            <div className="flex flex-wrap items-center justify-center gap-4">
              {entries.map(([platform, url]) => (
                <a key={platform} href={url} target="_blank" rel="noopener noreferrer" aria-label={`Síguenos en ${platform}`} className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center transition-all hover:bg-white hover:text-black hover:scale-110 active:scale-95 shadow-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF5C3A] focus-visible:ring-offset-2">
                  {socialIcons[platform.toLowerCase()] ?? null}
                </a>
              ))}
            </div>
          )}

          {/* Copyright y Branding Lookitry */}
          <div className="pt-12 border-t border-white/5 space-y-6">
            <p className="text-[10px] font-black uppercase tracking-[0.4em] text-white/30">
              Transformando la experiencia de compra online
            </p>
            <div className="flex flex-col md:flex-row items-center justify-center gap-4 md:gap-8 text-[9px] font-black text-white/20 uppercase tracking-widest">
              <span>© 2026 {brand.name} </span>
              <span className="hidden md:block">|</span>
              <p>
                Powered by <a href={footerUrl || 'https://lookitry.com'} target="_blank" rel="noopener noreferrer" className="font-bold hover:opacity-80 transition-opacity text-white">Look<span className="text-[#FF5C3A]">itry</span> IA</a>
              </p>
            </div>
          </div>
        </div>
      </footer>

      {brand.whatsapp_contact && !isPreview && <WhatsAppFAB phone={brand.whatsapp_contact} message={brand.whatsapp_message} />}
    </div>
  );
}
