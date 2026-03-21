'use client';

import { useState, useEffect } from 'react';
import { TryOnWidget } from '@/components/tryon/TryOnWidget';
import {
  BrandData,
  ProductData,
  WhatsAppIcon,
  InstagramIcon,
  FacebookIcon,
  TikTokIcon,
  SparklesIcon,
  MapPinIcon,
  TruckIcon,
  StarIcon,
  PhoneIcon,
  PreviewBanner,
  ActivationModal,
  WhatsAppFAB,
  LandingFooter,
  ProductBadge,
  ProductImage,
  CoverImage,
  BrandLogo,
} from './shared';

function EditorialHeader({ brand }: { brand: BrandData }) {
  const primary = brand.primary_color || '#FF5C3A';
  const socialLinks = brand.social_links || {};
  const entries = Object.entries(socialLinks).filter(([, url]) => !!url);
  const icons: Record<string, React.ReactNode> = {
    instagram: <InstagramIcon className="w-3.5 h-3.5" />,
    facebook:  <FacebookIcon  className="w-3.5 h-3.5" />,
    tiktok:    <TikTokIcon    className="w-3.5 h-3.5" />,
  };
  return (
    <header 
      className="px-5 h-20 flex items-center justify-between sticky top-0 z-50 backdrop-blur-2xl transition-all" 
      style={{ 
        backgroundColor: brand.header_color ? `${brand.header_color}80` : 'rgba(255,255,255,0.3)',
        borderBottom: '1px solid rgba(255,255,255,0.1)',
        boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.07)'
      }}
    >
      <div className="flex items-center gap-2.5">
        {brand.logo ? (
          <BrandLogo
            src={brand.logo_dark || brand.logo}
            alt={brand.name}
            className="h-9 w-auto max-w-[120px] rounded-lg object-contain"
            fallbackInitials={brand.name.slice(0, 2).toUpperCase()}
            fallbackBg="#111827"
            fallbackTextColor="#fff"
          />
        ) : (
          <div 
            className="h-9 w-9 rounded-lg flex items-center justify-center text-white font-bold text-sm"
            style={{ backgroundColor: primary }}
          >
            {brand.name.slice(0, 2).toUpperCase()}
          </div>
        )}
        {brand.show_brand_name !== false && (
          <span className="font-bold text-base text-gray-900">{brand.name}</span>
        )}
      </div>
      {entries.length > 0 && (
        <div className="flex items-center gap-1.5">
          {entries.map(([platform, url]) => (
            <a key={platform} href={url} target="_blank" rel="noopener noreferrer" title={platform}
              className="w-8 h-8 rounded-lg flex items-center justify-center transition-all hover:scale-110"
              style={{ backgroundColor: primary + '15', color: primary, border: `1px solid ${primary}33` }}>
              {icons[platform.toLowerCase()] ?? null}
            </a>
          ))}
        </div>
      )}
    </header>
  );
}

function EditorialCover({ brand }: { brand: BrandData }) {
  const primary = brand.primary_color || '#FF5C3A';
  const fallbackBg = brand.cover_bg_color || `linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)`;
  const overlayOpacity = brand.cover_overlay_opacity ?? 0.6;
  return (
    <div className="relative h-48 md:h-56 overflow-hidden flex items-end" style={{ background: fallbackBg }}>
      {brand.cover_image_url && (
        <CoverImage src={brand.cover_image_url} alt={brand.name} className="absolute inset-0 w-full h-full object-cover" />
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" style={{ opacity: overlayOpacity > 0 ? 1 : 0 }} />
      <div className="relative z-10 px-6 pb-5 w-full">
        {brand.slogan && <p className="text-white/70 text-xs mb-1 tracking-widest uppercase">{brand.slogan}</p>}
        <h1 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight">{brand.name}</h1>
      </div>
    </div>
  );
}

function EditorialStatsBar({ products, brand }: { products: ProductData[]; brand: BrandData }) {
  const primary = brand.primary_color || '#FF5C3A';
  const rating = brand.rating;
  const reviews = brand.total_reviews;
  return (
    <div className="bg-white border-b border-gray-100 px-5 flex gap-6 overflow-x-auto">
      <div className="py-3 flex items-center gap-1.5 whitespace-nowrap border-b-2 flex-shrink-0" style={{ borderColor: primary }}>
        <span className="font-bold text-base text-gray-900">{products.length}</span>
        <span className="text-xs text-gray-400">productos</span>
      </div>
      {rating != null && (
        <div className="py-3 flex items-center gap-1.5 whitespace-nowrap border-b-2 border-transparent flex-shrink-0">
          <StarIcon className="w-4 h-4 text-yellow-400" filled />
          <span className="font-bold text-base text-gray-900">{rating.toFixed(1)}</span>
          {reviews != null && <span className="text-xs text-gray-400">({reviews} resenas)</span>}
        </div>
      )}
      <div className="py-3 flex items-center gap-1.5 whitespace-nowrap border-b-2 border-transparent flex-shrink-0">
        <SparklesIcon className="w-4 h-4 text-gray-400" />
        <span className="font-bold text-base text-gray-900">IA</span>
        <span className="text-xs text-gray-400">probador virtual</span>
      </div>
    </div>
  );
}

function EditorialProductCard({ product, selected, primaryColor, ctaText, onClick }: { product: ProductData; selected: boolean; primaryColor: string; ctaText?: string | null; onClick: () => void }) {
  return (
    <button onClick={onClick} className="text-left w-full rounded-xl overflow-hidden border bg-white transition-all duration-200" style={{ borderColor: selected ? primaryColor : '#e8e4df', borderWidth: selected ? 1.5 : 0.5 }}>
      <div className="relative aspect-square bg-gray-50">
        <ProductImage src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
        {product.badge && <span className="absolute top-2 left-2"><ProductBadge badge={product.badge} /></span>}
        {selected && (
          <span className="absolute bottom-2 left-2 flex items-center gap-1 text-white text-[9px] font-bold uppercase tracking-wider px-2 py-1 rounded-full" style={{ backgroundColor: primaryColor }}>
            <svg className="w-2.5 h-2.5" viewBox="0 0 10 10" fill="none"><path d="M2 5l2 2.5L8 2.5" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" /></svg>
            Seleccionado
          </span>
        )}
      </div>
      <div className="p-2.5">
        <p className="text-xs font-semibold text-gray-900 leading-tight truncate">{product.name}</p>
        <p className="text-[10px] text-gray-400 uppercase tracking-wider mt-0.5">{product.category}</p>
        {product.price != null && <p className="text-xs font-semibold mt-1" style={{ color: primaryColor }}>${product.price.toLocaleString('es-CO')}</p>}
      </div>
    </button>
  );
}

function EditorialInfoCard({ brand }: { brand: BrandData }) {
  const DAYS_ORDER = ['lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado', 'domingo'];
  const DAYS: Record<string, string> = { lunes: 'Lunes', martes: 'Martes', miercoles: 'Miercoles', jueves: 'Jueves', viernes: 'Viernes', sabado: 'Sabado', domingo: 'Domingo' };
  const scheduleEntries = brand.schedule
    ? DAYS_ORDER.filter(d => d in brand.schedule!).map(d => [d, brand.schedule![d]] as [string, string])
    : [];
  return (
    <div className="bg-white border border-gray-100 rounded-xl p-4 mt-4 space-y-4">
      {brand.brand_description && (
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 mb-1.5">Sobre la marca</p>
          <p className="text-sm text-gray-600 leading-relaxed">{brand.brand_description}</p>
        </div>
      )}
      {scheduleEntries.length > 0 && (
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 mb-2">Horario de atencion</p>
          <div className="space-y-1">
            {scheduleEntries.map(([day, hours]) => (
              <div key={day} className="flex justify-between text-xs">
                <span className="text-gray-500">{DAYS[day] ?? day}</span>
                <span className={hours === 'Cerrado' ? 'text-gray-300' : 'text-gray-800 font-medium'}>{hours}</span>
              </div>
            ))}
          </div>
        </div>
      )}
      {(brand.city_display || brand.national_shipping || brand.whatsapp_contact) && (
        <div className="space-y-2 pt-1 border-t border-gray-50">
          {brand.whatsapp_contact && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <div className="w-6 h-6 rounded-md bg-gray-50 border border-gray-100 flex items-center justify-center flex-shrink-0">
                <PhoneIcon className="w-3.5 h-3.5 text-gray-500" />
              </div>
              <span>{brand.whatsapp_contact}</span>
            </div>
          )}
          {brand.city_display && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <div className="w-6 h-6 rounded-md bg-gray-50 border border-gray-100 flex items-center justify-center flex-shrink-0">
                <MapPinIcon className="w-3.5 h-3.5 text-gray-500" />
              </div>
              <span>{brand.city_display}{brand.national_shipping ? ' · Envíos nacionales' : ''}</span>
            </div>
          )}
          {!brand.city_display && brand.national_shipping && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <div className="w-6 h-6 rounded-md bg-gray-50 border border-gray-100 flex items-center justify-center flex-shrink-0">
                <TruckIcon className="w-3.5 h-3.5 text-gray-500" />
              </div>
              <span>Envíos a todo el país</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function TemplateEditorial({ brandSlug, brand, products, footerUrl }: { brandSlug: string; brand: BrandData; products: ProductData[]; footerUrl?: string }) {
  const primary = brand.primary_color || '#FF5C3A';
  const [selectedId, setSelectedId] = useState<string | null>(products[0]?.id ?? null);

  const handleProductClick = (id: string) => {
    setSelectedId(id);
    document.getElementById('editorial-tryon')?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  };

  const [previewMode, setPreviewMode] = useState(false);
  const [previewExpired, setPreviewExpired] = useState(false);

  useEffect(() => {
    if (localStorage.getItem(`preview_expired_${brandSlug}`)) {
      setPreviewExpired(true);
    }
  }, [brandSlug]);

  const showModal = !brand.has_landing_page && !previewMode;

  const handlePreviewExpired = () => {
    setPreviewMode(false);
    setPreviewExpired(true);
    localStorage.setItem(`preview_expired_${brandSlug}`, 'true');
    window.location.href = '/checkout?plan=LANDING';
  };

  const startPreview = () => {
    if (previewExpired) {
      window.location.href = '/checkout?plan=LANDING';
      return;
    }
    setPreviewMode(true);
  };

  useEffect(() => {
    if (!previewMode) return;
    let timer: ReturnType<typeof setTimeout> | null = null;
    const handleScroll = () => {
      const scrolled = window.scrollY + window.innerHeight;
      const total = document.documentElement.scrollHeight;
      if (scrolled >= total - 40) {
        if (!timer) timer = setTimeout(() => setPreviewMode(false), 30000);
      } else {
        if (timer) { clearTimeout(timer); timer = null; }
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => { window.removeEventListener('scroll', handleScroll); if (timer) clearTimeout(timer); };
  }, [previewMode]);

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#f7f5f2', color: '#0a0a0a' }}>
      {showModal && (
        <ActivationModal
          primaryColor={primary}
          brandName={brand.name}
          modalTitle={brand.modal_title}
          modalDescription={brand.modal_description}
          modalFeatures={brand.modal_features}
          onPreview={previewExpired ? undefined : startPreview}
        />
      )}
      {previewMode && (
        <PreviewBanner primaryColor={primary} onExpired={handlePreviewExpired} />
      )}
      <div style={previewMode ? { paddingTop: '40px' } : {}}>
      <EditorialHeader brand={brand} />
      <EditorialCover brand={brand} />
      <EditorialStatsBar products={products} brand={brand} />

      {/* Layout principal */}
      <div className="max-w-5xl mx-auto w-full px-4 py-7 grid grid-cols-1 md:grid-cols-[1fr_320px] gap-6 items-start">

        {/* Columna izquierda: catálogo + info */}
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 mb-3">Nuestros productos</p>
          {products.length > 0 ? (
            <div className="grid grid-cols-3 gap-2.5">
              {products.map(p => (
                <EditorialProductCard
                  key={p.id}
                  product={p}
                  selected={selectedId === p.id}
                  primaryColor={primary}
                  ctaText={brand.cta_button_text}
                  onClick={() => handleProductClick(p.id)}
                />
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-400 py-8 text-center">No hay productos disponibles</p>
          )}
          <EditorialInfoCard brand={brand} />
        </div>

        {/* Columna derecha: panel probador sticky */}
        <div id="editorial-tryon" className="md:sticky md:top-20">
          <div className="rounded-xl overflow-hidden border border-gray-200 shadow-lg bg-white">
            <div className="px-4 py-3 flex items-center justify-between" style={{ backgroundColor: '#0a0a0a' }}>
              <span className="text-white font-bold text-sm flex items-center gap-1.5">
                <SparklesIcon className="w-4 h-4 text-orange-400" />
                Probador Virtual
              </span>
              <span className="text-[10px] text-gray-500 bg-gray-800 px-2.5 py-1 rounded-full">IA</span>
            </div>
            <TryOnWidget brandSlug={brandSlug} />
          </div>
          <div className="mt-3 flex items-center justify-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: primary }} />
            <span className="text-[10px] text-gray-400">Impulsado por Lookitry AI</span>
          </div>
        </div>
      </div>

      <LandingFooter primaryColor={primary} footerUrl={footerUrl} />
      </div>
      {brand.whatsapp_contact && <WhatsAppFAB phone={brand.whatsapp_contact} message={brand.whatsapp_message} />}
    </div>
  );
}
