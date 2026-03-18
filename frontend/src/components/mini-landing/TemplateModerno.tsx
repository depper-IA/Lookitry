'use client';

import { useState } from 'react';
<<<<<<< HEAD
import { TryOnWidget } from '@/components/tryon/TryOnWidget';
import {
  BrandData,
  ProductData,
  BrandLogo,
  CoverImage,
  ProductImage,
  ProductBadge,
  WhatsAppFAB,
  LandingFooter,
  WhatsAppIcon,
  SparklesIcon,
} from './shared';

interface TemplateModernoProps {
  brand: BrandData;
  products: ProductData[];
  brandSlug: string;
  footerUrl?: string;
}

export function TemplateModerno({ brand, products, brandSlug, footerUrl }: TemplateModernoProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const primary = brand.primary_color || '#FF5C3A';

  const handleProductClick = (id: string) => {
    setSelectedId(id);
    const el = document.getElementById('probador-tryon');
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  const handleScrollDown = () => {
    const el = document.getElementById('probador-products');
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#0f0f0f' }}>
      <ProbadorNav brand={brand} />
      <ProbadorHero brand={brand} onScrollDown={handleScrollDown} />
      <ProbadorTrustBar brand={brand} />
      <ProbadorSocialProof brand={brand} />
      <ProbadorProducts
        products={products}
        primaryColor={primary}
        ctaText={brand.cta_button_text}
        onProductClick={handleProductClick}
        selectedId={selectedId}
      />
      <ProbadorUploadZone brandSlug={brandSlug} primaryColor={primary} />
      <ProbadorAbout brand={brand} />
      <ProbadorContact brand={brand} />
      <LandingFooter primaryColor={primary} footerUrl={footerUrl} />
      {brand.whatsapp_contact && <WhatsAppFAB phone={brand.whatsapp_contact} message={brand.whatsapp_message} />}
    </div>
  );
}

// ----------------------------------------------------------------------------
// Componentes del Template Moderno
// ----------------------------------------------------------------------------

function ProbadorNav({ brand }: { brand: BrandData }) {
  const entries = Object.entries(brand.social_links || {}).filter(([, url]) => !!url);
  const icons: Record<string, React.ReactNode> = {
    instagram: <InstagramIcon className="w-3 h-3" />,
    facebook:  <FacebookIcon  className="w-3 h-3" />,
    tiktok:    <TikTokIcon    className="w-3 h-3" />,
  };
  const primary = brand.primary_color || '#FF5C3A';
  const navBg = brand.cover_bg_color || '#0f0f0f';
  
  return (
    <nav 
      className="sticky top-0 z-50 h-20 flex items-center justify-between px-6 backdrop-blur-3xl transition-colors duration-500" 
      style={{ 
        backgroundColor: brand.header_color ? `${brand.header_color}66` : 'rgba(15,15,15,0.2)', 
        borderBottom: '1px solid rgba(255,255,255,0.05)',
        boxShadow: '0 4px 30px rgba(0, 0, 0, 0.1)'
      }}
    >
      <div className="flex items-center gap-2.5">
        {brand.logo && (
          <BrandLogo
            src={brand.logo_light || brand.logo}
            alt={brand.name}
            className="h-8 w-auto max-w-[140px] object-contain"
          />
        )}
        {brand.show_brand_name !== false && (
          <span className="font-bold text-base text-white" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>
            {brand.name}
          </span>
        )}
      </div>
      {entries.length > 0 && (
        <div className="flex gap-1.5">
          {entries.map(([platform, url]) => (
            <a 
              key={platform} 
              href={url} 
              target="_blank" 
              rel="noopener noreferrer"
              className="w-7 h-7 rounded-full border flex items-center justify-center transition-colors hover:border-current"
              style={{ borderColor: 'rgba(255,255,255,0.2)', color: 'rgba(255,255,255,0.6)' }}
            >
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
    <section
      className="relative py-20 px-6 text-center overflow-hidden"
      style={{ backgroundColor: heroBg }}
    >
      {/* Imagen de portada */}
      {hasCover && (
        <CoverImage 
          src={brand.cover_image_url} 
          alt={brand.name} 
          className="absolute inset-0 w-full h-full object-cover" 
        />
      )}
      {(hasCover && overlayOpacity > 0) && (
        <div className="absolute inset-0" style={{ backgroundColor: `rgba(0,0,0,${overlayOpacity})` }} />
      )}
      {/* Anillos decorativos (solo sin imagen) */}
      {!hasCover && (
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
          {[600, 400, 200].map((size, i) => (
            <div 
              key={i} 
              className="absolute rounded-full border" 
              style={{ 
                width: size, 
                height: size, 
                borderColor: primary, 
                opacity: 0.04 + i * 0.02 
              }} 
            />
          ))}
        </div>
      )}
      
      <div className="relative z-10 max-w-2xl mx-auto">
        {/* Badge animado */}
        <div 
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border mb-7" 
          style={{ backgroundColor: primary + '18', borderColor: primary + '40' }}
        >
          <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ backgroundColor: primary }} />
          <span 
            className="text-[11px] font-semibold uppercase tracking-widest" 
            style={{ color: primary }}
          >
            Probador virtual activo
          </span>
        </div>
        
        <h1 
          className="text-5xl md:text-6xl font-black leading-none tracking-tight mb-5 text-white" 
          style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
        >
          {brand.slogan ? (
            <>
              {brand.name},<br />
              <em className="italic" style={{ color: primary }}>{brand.slogan}</em>
            </>
          ) : (
            <>
              Tu ropa, tu cuerpo,<br />
              <em className="italic" style={{ color: primary }}>antes de comprar</em>
            </>
          )}
        </h1>
        
        {brand.brand_description && (
          <p 
            className="text-base font-light leading-relaxed mb-8 max-w-lg mx-auto" 
            style={{ color: 'rgba(255,255,255,0.55)' }}
          >
            {brand.brand_description}
          </p>
        )}
        
        <div className="flex items-center justify-center gap-3 flex-wrap">
          <button 
            onClick={onScrollDown} 
            className="inline-flex items-center gap-2 px-7 py-3.5 rounded-full text-sm font-semibold transition-all hover:opacity-85 hover:-translate-y-0.5" 
            style={{ backgroundColor: primary, color: '#fff' }}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
            </svg>
            Probarme algo ahora
          </button>
          <button 
            onClick={onScrollDown} 
            className="inline-flex items-center gap-1.5 px-4 py-3.5 text-sm font-light transition-colors" 
            style={{ color: 'rgba(255,255,255,0.45)' }}
          >
            Ver productos
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M5 12h14M12 5l7 7-7 7"/>
            </svg>
          </button>
        </div>
        
        <p className="text-xs mt-5" style={{ color: 'rgba(255,255,255,0.25)' }}>
          Sin registro • Resultado en ~12 segundos • 100% gratis
        </p>
      </div>
    </section>
  );
}

function ProbadorTrustBar({ brand }: { brand: BrandData }) {
  const primary = brand.primary_color || '#FF5C3A';
  const rating = brand.rating ?? 4.9;
  const reviews = brand.total_reviews ?? 0;
  
  const items = [
    { value: rating.toFixed(1), label: 'valoracion' },
    { value: reviews > 0 ? `+${reviews}` : '~12s', label: reviews > 0 ? 'pruebas' : 'por resultado' },
    { value: '~12s', label: 'por resultado' },
    { value: '96%', label: 'satisfaccion' },
  ].filter((_, i) => i < 4);
  
  return (
    <div 
      className="flex border-b" 
      style={{ backgroundColor: 'var(--p-surface, #fff)', borderColor: 'var(--p-border, #e5e5e5)' }}
    >
      {items.map((item, i) => (
        <div 
          key={i} 
          className="flex-1 flex flex-col items-center justify-center py-5 text-center border-r last:border-r-0" 
          style={{ borderColor: 'var(--p-border, #e5e5e5)' }}
        >
          <span 
            className="text-xl font-bold" 
            style={{ fontFamily: "'Playfair Display', Georgia, serif", color: 'var(--p-text, #0f0f0f)' }}
          >
            {item.value}
          </span>
          <span className="text-[11px] mt-0.5" style={{ color: 'var(--p-text-muted, #888)' }}>
            {item.label}
          </span>
        </div>
      ))}
    </div>
  );
}

function ProbadorSocialProof({ brand }: { brand: BrandData }) {
  const primary = brand.primary_color || '#FF5C3A';
  const rating = brand.rating ?? 4.9;
  const reviews = brand.total_reviews ?? 847;
  const initials = ['L', 'M', 'C', 'A'];
  
  return (
    <div 
      className="flex items-center justify-center gap-4 flex-wrap py-4 px-6 border-b" 
      style={{ backgroundColor: 'var(--p-bg, #fafafa)', borderColor: 'var(--p-border, #e5e5e5)' }}
    >
      <div className="flex items-center gap-2">
        <div className="flex">
          {initials.map((l, i) => (
            <div 
              key={i} 
              className="w-6 h-6 rounded-full border-2 border-white flex items-center justify-center text-[10px] font-bold -ml-2 first:ml-0" 
              style={{ backgroundColor: primary + '22', color: primary }}
            >
              {l}
            </div>
          ))}
        </div>
        <span className="text-xs" style={{ color: 'var(--p-text-muted, #888)' }}>
          <strong style={{ color: 'var(--p-text-secondary, #555)' }}>
            Laura, Maria y {reviews > 4 ? reviews - 2 : 843} mas
          </strong> ya lo usaron
        </span>
      </div>
      <div className="w-px h-5 bg-gray-200" />
      <div className="flex items-center gap-1">
        {[1,2,3,4,5].map(i => (
          <svg key={i} width="11" height="11" viewBox="0 0 24 24" fill={primary}>
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
          </svg>
        ))}
        <span className="text-xs ml-1" style={{ color: 'var(--p-text-muted, #888)' }}>
          {rating.toFixed(1)} • {reviews} resenas
        </span>
      </div>
    </div>
  );
}

function ProbadorProducts({ 
  products, 
  primaryColor, 
  ctaText, 
  onProductClick, 
  selectedId 
}: { 
  products: ProductData[]; 
  primaryColor: string; 
  ctaText?: string | null; 
  onProductClick: (id: string) => void; 
  selectedId: string | null 
}) {
  if (!products.length) return null;
  
  return (
    <section id="probador-products" className="py-16 px-6" style={{ backgroundColor: 'var(--p-bg, #fafafa)' }}>
      <div className="max-w-4xl mx-auto">
        <p 
          className="text-[10px] font-semibold uppercase tracking-widest text-center mb-2" 
          style={{ color: primaryColor }}
        >
          Coleccion
        </p>
        <h2 
          className="text-3xl md:text-4xl font-black text-center mb-2 tracking-tight" 
          style={{ fontFamily: "'Playfair Display', Georgia, serif", color: 'var(--p-text, #0f0f0f)' }}
        >
          Nuestros productos
        </h2>
        <p className="text-sm font-light text-center mb-12" style={{ color: 'var(--p-text-muted, #888)' }}>
          Selecciona una prenda para probartela con IA
        </p>
        
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {products.map(p => (
            <button 
              key={p.id} 
              onClick={() => onProductClick(p.id)}
              className="text-left rounded-2xl overflow-hidden border transition-all duration-200 hover:-translate-y-1"
              style={{ 
                backgroundColor: 'var(--p-surface, #fff)', 
                borderColor: selectedId === p.id ? primaryColor : 'var(--p-border, #e5e5e5)', 
                borderWidth: selectedId === p.id ? 1.5 : 1 
              }}
            >
              <div 
                className="relative aspect-square overflow-hidden" 
                style={{ backgroundColor: 'var(--p-img-bg, #f0f0f0)' }}
              >
                <ProductImage 
                  src={p.image_url} 
                  alt={p.name} 
                  className="w-full h-full object-cover transition-transform duration-300 hover:scale-105" 
                />
                {p.badge && (
                  <span className="absolute top-2 left-2">
                    <ProductBadge badge={p.badge} />
                  </span>
                )}
                {selectedId === p.id && (
                  <span 
                    className="absolute bottom-2 left-2 flex items-center gap-1 text-white text-[9px] font-bold uppercase tracking-wider px-2 py-1 rounded-full" 
                    style={{ backgroundColor: primaryColor }}
                  >
                    <svg className="w-2.5 h-2.5" viewBox="0 0 10 10" fill="none">
                      <path d="M2 5l2 2.5L8 2.5" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" />
                    </svg>
                    Seleccionado
                  </span>
                )}
              </div>
              <div className="p-3">
                <p 
                  className="text-xs font-medium leading-tight truncate" 
                  style={{ color: 'var(--p-text-secondary, #333)' }}
                >
                  {p.name}
                </p>
                <div className="flex items-center justify-between mt-1.5 gap-1">
                  {p.price != null && (
                    <span 
                      className="text-sm font-bold" 
                      style={{ fontFamily: "'Playfair Display', Georgia, serif", color: primaryColor }}
                    >
                      ${p.price.toLocaleString('es-CO')}
                    </span>
                  )}
                  <span 
                    className="text-[10px] font-semibold px-2 py-0.5 rounded-full transition-colors" 
                    style={{ backgroundColor: primaryColor + '18', color: primaryColor }}
                  >
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

function ProbadorUploadZone({ brandSlug, primaryColor }: { brandSlug: string; primaryColor: string }) {
  return (
    <section 
      id="probador-tryon" 
      className="border-t border-b py-16 px-6" 
      style={{ backgroundColor: 'var(--p-surface, #fff)', borderColor: 'var(--p-border, #e5e5e5)' }}
    >
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <p 
            className="text-[10px] font-semibold uppercase tracking-widest mb-2" 
            style={{ color: primaryColor }}
          >
            Probador IA
          </p>
          <h2 
            className="text-3xl font-black mb-2 tracking-tight" 
            style={{ fontFamily: "'Playfair Display', Georgia, serif", color: 'var(--p-text, #0f0f0f)' }}
          >
            Pruebatelo ahora
          </h2>
          <p className="text-sm font-light" style={{ color: 'var(--p-text-muted, #888)' }}>
            Sube tu foto y la IA genera el resultado en segundos
          </p>
        </div>
        <div 
          className="rounded-3xl overflow-hidden shadow-xl border" 
          style={{ borderColor: 'var(--p-border, #e5e5e5)' }}
        >
          <TryOnWidget brandSlug={brandSlug} />
        </div>
      </div>
    </section>
  );
}

function ProbadorAbout({ brand }: { brand: BrandData }) {
  const primary = brand.primary_color || '#FF5C3A';
  const DAYS_ORDER = ['lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado', 'domingo'];
  const DAYS: Record<string, string> = { 
    lunes: 'Lunes', 
    martes: 'Martes', 
    miercoles: 'Miercoles', 
    jueves: 'Jueves', 
    viernes: 'Viernes', 
    sabado: 'Sabado', 
    domingo: 'Domingo' 
  };
  
  const scheduleEntries = brand.schedule
    ? DAYS_ORDER.filter(d => d in brand.schedule!).map(d => [d, brand.schedule![d]] as [string, string])
    : [];
  
  if (!brand.brand_description && !scheduleEntries.length && !brand.city_display && !brand.whatsapp_contact) {
    return null;
  }
  
  return (
    <section className="py-16 px-6 text-center" style={{ backgroundColor: 'var(--p-bg, #fafafa)' }}>
      <div className="max-w-lg mx-auto">
        {brand.logo && (
          <div className="flex justify-center mb-6">
            <BrandLogo
              src={brand.logo_dark || brand.logo}
              alt={brand.name}
              className="h-14 w-auto max-w-[160px] object-contain"
            />
          </div>
        )}
        {brand.show_brand_name !== false && (
          <h2 
            className="text-3xl font-black mb-4 tracking-tight" 
            style={{ fontFamily: "'Playfair Display', Georgia, serif", color: 'var(--p-text, #0f0f0f)' }}
          >
            {brand.name}
          </h2>
        )}
        {brand.brand_description && (
          <p 
            className="text-sm font-light leading-relaxed mb-8" 
            style={{ color: 'var(--p-text-muted, #888)' }}
          >
            {brand.brand_description}
          </p>
        )}
        
        {/* Detalles */}
        {(brand.city_display || brand.national_shipping || brand.whatsapp_contact) && (
          <div 
            className="rounded-2xl border overflow-hidden mb-6 text-left" 
            style={{ backgroundColor: 'var(--p-surface, #fff)', borderColor: 'var(--p-border, #e5e5e5)' }}
          >
            {brand.whatsapp_contact && (
              <div 
                className="flex items-center gap-3 px-5 py-4 border-b" 
                style={{ borderColor: 'var(--p-border, #e5e5e5)' }}
              >
                <div 
                  className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" 
                  style={{ backgroundColor: primary + '18' }}
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke={primary} strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 7V5z" />
                  </svg>
                </div>
                <span className="text-sm" style={{ color: 'var(--p-text-secondary, #333)' }}>
                  {brand.whatsapp_contact}
                </span>
              </div>
            )}
            {brand.city_display && (
              <div 
                className="flex items-center gap-3 px-5 py-4 border-b last:border-b-0" 
                style={{ borderColor: 'var(--p-border, #e5e5e5)' }}
              >
                <div 
                  className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" 
                  style={{ backgroundColor: primary + '18' }}
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke={primary} strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <span className="text-sm" style={{ color: 'var(--p-text-secondary, #333)' }}>
                  {brand.city_display}{brand.national_shipping ? ' · Envíos nacionales' : ''}
                </span>
              </div>
            )}
            {!brand.city_display && brand.national_shipping && (
              <div 
                className="flex items-center gap-3 px-5 py-4" 
                style={{ borderColor: 'var(--p-border, #e5e5e5)' }}
              >
                <div 
                  className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" 
                  style={{ backgroundColor: primary + '18' }}
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke={primary} strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10l2 1h8zM13 8h4l3 5v3h-7V8z" />
                  </svg>
                </div>
                <span className="text-sm" style={{ color: 'var(--p-text-secondary, #333)' }}>
                  Envíos a todo el país
                </span>
              </div>
            )}
          </div>
        )}
        
        {/* Horarios */}
        {scheduleEntries.length > 0 && (
          <div 
            className="rounded-2xl border overflow-hidden text-left" 
            style={{ backgroundColor: 'var(--p-surface, #fff)', borderColor: 'var(--p-border, #e5e5e5)' }}
          >
            <div 
              className="flex items-center gap-2 px-5 py-3 border-b" 
              style={{ borderColor: 'var(--p-border, #e5e5e5)' }}
            >
              <svg 
                width="14" 
                height="14" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="2" 
                strokeLinecap="round" 
                style={{ color: 'var(--p-text-muted, #888)' }}
              >
                <circle cx="12" cy="12" r="10"/>
                <path d="M12 6v6l4 2"/>
              </svg>
              <span 
                className="text-[10px] font-semibold uppercase tracking-widest" 
                style={{ color: 'var(--p-text-muted, #888)' }}
              >
                Horario de atencion
              </span>
            </div>
            {scheduleEntries.map(([day, hours]) => (
              <div 
                key={day} 
                className="flex items-center justify-between px-5 py-3 border-b last:border-b-0 text-sm" 
                style={{ borderColor: 'var(--p-border, #e5e5e5)' }}
              >
                <span style={{ color: 'var(--p-text-muted, #888)' }}>
                  {DAYS[day] ?? day}
                </span>
                <span 
                  style={{ 
                    color: hours === 'Cerrado' ? 'var(--p-text-muted, #888)' : 'var(--p-text-secondary, #333)', 
                    fontWeight: hours !== 'Cerrado' ? 500 : 400 
                  }}
                >
                  {hours}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

function ProbadorContact({ brand }: { brand: BrandData }) {
  const primary = brand.primary_color || '#FF5C3A';
  
  if (!brand.whatsapp_contact) return null;
  
  const clean = brand.whatsapp_contact.replace(/\D/g, '');
  const msg = brand.whatsapp_message ? `?text=${encodeURIComponent(brand.whatsapp_message)}` : '';
  
  return (
    <section 
      className="py-10 px-6 text-center border-t border-b" 
      style={{ backgroundColor: primary + '0d', borderColor: primary + '22' }}
    >
      <div className="max-w-md mx-auto">
        <div 
          className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4" 
          style={{ backgroundColor: '#25D36618', border: '1px solid #25D36640' }}
        >
          <svg className="w-6 h-6" viewBox="0 0 24 24" fill="#25D366">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
          </svg>
        </div>
        <h2 
          className="text-2xl font-black mb-2 tracking-tight" 
          style={{ fontFamily: "'Playfair Display', Georgia, serif", color: 'var(--p-text, #0f0f0f)' }}
        >
          Tienes preguntas?
        </h2>
        <p className="text-sm font-light mb-6" style={{ color: 'var(--p-text-muted, #888)' }}>
          Escribenos y te respondemos al instante
        </p>
        <a 
          href={`https://wa.me/${clean}${msg}`} 
          target="_blank" 
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2.5 px-7 py-3.5 rounded-full text-white text-sm font-semibold transition-opacity hover:opacity-90"
          style={{ backgroundColor: '#25D366' }}
        >
          <WhatsAppIcon className="w-5 h-5" />
          Escribir por WhatsApp
        </a>
        <p className="text-xs mt-3" style={{ color: 'var(--p-text-muted, #888)' }}>
          Respuesta en minutos
        </p>
      </div>
    </section>
  );
}

// Iconos adicionales necesarios
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
=======
import Image from 'next/image';
import { TryOnWidget } from '@/components/tryon/TryOnWidget';
import { BrandData, ProductData, WhatsAppIcon } from './shared';

function SparklesIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
    </svg>
  );
}

export function TemplateModerno({ brandSlug, brand, products, footerUrl }: { brandSlug: string; brand: BrandData; products: ProductData[]; footerUrl?: string }) {
  const [activeProduct, setActiveProduct] = useState<ProductData | null>(null);
  const [showWidget, setShowWidget] = useState(false);
  const primaryColor = brand.primary_color || '#FF5C3A';

  const handleOpenWidget = (product: ProductData) => {
    setActiveProduct(product);
    setShowWidget(true);
    document.body.style.overflow = 'hidden';
  };

  const handleCloseWidget = () => {
    setShowWidget(false);
    setActiveProduct(null);
    document.body.style.overflow = 'auto';
  };

  return (
    <div className="min-h-screen bg-[#f9f7f5] text-[#1a1a1a] font-sans">
      <header className="sticky top-0 z-50 bg-white/70 backdrop-blur-xl border-b border-black/5 h-20 px-6 flex items-center justify-between">
        <h1 className="text-xl font-black tracking-tight">{brand.name}</h1>
        <a 
          href={`https://wa.me/${brand.whatsapp_contact?.replace(/\+/g, '').replace(/\s/g, '')}`}
          target="_blank" rel="noopener noreferrer"
          className="p-3 bg-black text-white rounded-2xl hover:scale-110 transition-transform"
        >
          <WhatsAppIcon className="w-5 h-5" />
        </a>
      </header>

      <main className="max-w-xl mx-auto py-12 px-6">
        <div className="mb-12 text-center">
          {brand.logo && (
            <div className="relative w-20 h-20 mx-auto mb-6 rounded-[2rem] overflow-hidden shadow-xl border-4 border-white">
              <Image src={brand.logo} alt={brand.name} fill className="object-contain p-2" />
            </div>
          )}
          <h2 className="text-3xl font-black tracking-tighter italic uppercase mb-2">{brand.name}</h2>
          <p className="text-gray-500 text-sm font-medium">{brand.slogan || 'Elige tu prenda y pruébatela ahora.'}</p>
        </div>

        <div className="space-y-6">
          {products.map((p) => (
            <div key={p.id} className="bg-white rounded-[2.5rem] p-4 shadow-sm border border-black/5 hover:shadow-xl transition-all group">
              <div className="relative aspect-square rounded-[2rem] overflow-hidden mb-6 bg-[#f0ece8]">
                <Image src={p.image_url} alt={p.name} fill className="object-cover transition-transform duration-700 group-hover:scale-105" />
                <button 
                  onClick={() => handleOpenWidget(p)}
                  className="absolute bottom-6 left-6 right-6 py-4 bg-black text-white rounded-2xl font-bold text-sm shadow-2xl flex items-center justify-center gap-3 hover:bg-[#FF5C3A] transition-colors"
                >
                  <SparklesIcon className="w-5 h-5" />
                  Probador IA
                </button>
              </div>
              <div className="px-4 pb-2">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-[10px] font-bold text-[#FF5C3A] uppercase tracking-widest">{p.category}</span>
                  {p.price && <span className="font-bold text-lg">${p.price.toLocaleString('es-CO')}</span>}
                </div>
                <h4 className="font-bold text-xl tracking-tight">{p.name}</h4>
              </div>
            </div>
          ))}
        </div>
      </main>

      <footer className="py-20 text-center px-6">
        <p className="text-gray-400 text-xs font-bold tracking-widest uppercase mb-4">Powered by</p>
        <a href={footerUrl || '#'} className="inline-block px-6 py-2 bg-black text-white rounded-full text-[10px] font-black tracking-widest uppercase italic">Lookitry IA</a>
      </footer>

      {showWidget && activeProduct && (
        <div className="fixed inset-0 z-[60] bg-black md:p-6 animate-in slide-in-from-bottom duration-500">
          <button onClick={handleCloseWidget} className="absolute top-6 right-6 z-[70] p-4 bg-white/10 text-white rounded-full backdrop-blur-md">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
          <div className="w-full h-full md:rounded-[3rem] overflow-hidden">
            <TryOnWidget brandSlug={brandSlug} initialProduct={activeProduct} isEmbed={true} />
          </div>
        </div>
      )}
    </div>
>>>>>>> e173c4b (refactor: restaurar division de mini-landing en templates independientes (Classic, Editorial, Moderno))
  );
}
