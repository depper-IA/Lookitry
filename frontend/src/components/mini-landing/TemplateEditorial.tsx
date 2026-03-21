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

function EditorialHeader({ brand }: { brand: BrandData }) {
  const primary = brand.primary_color || '#FF5C3A';
  const socialLinks = brand.social_links || {};
  const entries = Object.entries(socialLinks).filter(([, url]) => !!url);
  const socialIcons: Record<string, React.ReactNode> = {
    instagram: <InstagramIcon className="w-3.5 h-3.5" />,
    facebook:  <FacebookIcon  className="w-3.5 h-3.5" />,
    tiktok:    <TikTokIcon    className="w-3.5 h-3.5" />,
    youtube:   <YouTubeIcon   className="w-3.5 h-3.5" />,
    x:         <XIcon         className="w-3.5 h-3.5" />,
  };
  return (
    <header className="px-5 h-16 md:h-20 flex items-center justify-between sticky top-0 z-50 backdrop-blur-2xl bg-white/30 border-b border-gray-100 shadow-sm">
      <div className="flex items-center gap-2.5">
        {brand.logo ? (
          <BrandLogo src={brand.logo_dark || brand.logo} alt={brand.name} className="h-8 md:h-9 w-auto max-w-[120px] rounded-lg object-contain" />
        ) : (
          <div className="h-8 w-8 md:h-9 md:w-9 rounded-lg flex items-center justify-center text-white font-bold text-xs md:text-sm" style={{ backgroundColor: primary }}>{brand.name.slice(0, 2).toUpperCase()}</div>
        )}
        {brand.show_brand_name !== false && <span className="font-bold text-sm md:text-base text-gray-900 italic uppercase tracking-tight truncate max-w-[120px] md:max-w-none">{brand.name}</span>}
      </div>
      {entries.length > 0 && (
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar max-w-[100px] md:max-w-none">
          {entries.map(([platform, url]) => (
            <a key={platform} href={url} target="_blank" rel="noopener noreferrer" className="w-7 h-7 md:w-8 md:h-8 rounded-lg flex items-center justify-center transition-all hover:scale-110 shrink-0" style={{ backgroundColor: primary + '15', color: primary }}>
              {socialIcons[platform.toLowerCase()] ?? null}
            </a>
          ))}
        </div>
      )}
    </header>
  );
}

function EditorialCover({ brand }: { brand: BrandData }) {
  const fallbackBg = brand.cover_bg_color || '#1a1a1a';
  const overlayOpacity = brand.cover_overlay_opacity ?? 0.6;
  return (
    <div className="relative h-40 md:h-56 overflow-hidden flex items-end" style={{ background: fallbackBg }}>
      {brand.cover_image_url && <CoverImage src={brand.cover_image_url} alt={brand.name} className="absolute inset-0 w-full h-full object-cover" />}
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" style={{ opacity: overlayOpacity > 0 ? 1 : 0 }} />
      <div className="relative z-10 px-6 pb-5 w-full text-white">
        {brand.slogan && <p className="text-white/70 text-[9px] md:text-[10px] mb-1 tracking-widest uppercase font-bold">{brand.slogan}</p>}
        <h1 className="text-2xl md:text-4xl font-black italic uppercase tracking-tighter leading-none">{brand.name}</h1>
      </div>
    </div>
  );
}

function EditorialProductCard({ product, selected, primaryColor, onClick }: { product: ProductData; selected: boolean; primaryColor: string; onClick: () => void }) {
  return (
    <button onClick={onClick} className="text-left w-full rounded-xl overflow-hidden border bg-white transition-all duration-200" style={{ borderColor: selected ? primaryColor : '#e5e5e5', borderWidth: selected ? 2 : 1 }}>
      <div className="relative aspect-square bg-gray-50">
        <ProductImage src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
        {product.badge && <span className="absolute top-2 left-2 scale-90 origin-top-left"><ProductBadge badge={product.badge} /></span>}
      </div>
      <div className="p-2.5">
        <p className="text-[10px] md:text-[11px] font-bold text-gray-900 leading-tight truncate uppercase italic">{product.name}</p>
        <p className="text-[8px] md:text-[9px] text-gray-400 uppercase tracking-wider mt-0.5">{product.category}</p>
        {product.price != null && <p className="text-[10px] md:text-[11px] font-black mt-1" style={{ color: primaryColor }}>${product.price.toLocaleString('es-CO')}</p>}
      </div>
    </button>
  );
}

function EditorialInfo({ brand, primaryColor }: { brand: BrandData; primaryColor: string }) {
  const DAYS_ORDER = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
  const scheduleEntries = brand.schedule
    ? DAYS_ORDER.filter(d => d in brand.schedule!).map(d => [d, brand.schedule![d]] as [string, string])
    : [];
  const hasRating = brand.rating != null;
  const hasLocation = !!(brand.city_display || brand.national_shipping);
  const hasSchedule = scheduleEntries.length > 0;
  if (!hasRating && !hasLocation && !hasSchedule) return null;

  return (
    <div className="mt-6 md:mt-8 bg-white rounded-2xl border border-gray-100 p-4 md:p-5 space-y-4 shadow-sm">
      {hasRating && (
        <div className="flex items-center gap-2 pb-3 border-b border-gray-50">
          <div className="flex items-center gap-0.5 text-yellow-400">
            {[1,2,3,4,5].map(i => <StarIcon key={i} className="w-3 h-3" filled={i <= Math.round(brand.rating!)} />)}
          </div>
          <span className="text-xs font-black text-gray-900">{brand.rating!.toFixed(1)}</span>
          {brand.total_reviews != null && <span className="text-[10px] text-gray-400 font-bold uppercase">({brand.total_reviews} reviews)</span>}
        </div>
      )}
      {hasLocation && (
        <div className="space-y-2">
          {brand.city_display && <div className="flex items-center gap-2 text-[10px] text-gray-500 font-bold uppercase tracking-tight"><MapPinIcon className="w-3.5 h-3.5 text-gray-300" /> {brand.city_display}</div>}
          {brand.national_shipping && <div className="flex items-center gap-2 text-[10px] text-gray-500 font-bold uppercase tracking-tight"><TruckIcon className="w-3.5 h-3.5 text-gray-300" /> Envíos Nacionales</div>}
        </div>
      )}
      {hasSchedule && (
        <div className="pt-2 border-t border-gray-50">
          <p className="text-[9px] font-black uppercase text-gray-300 tracking-[0.2em] mb-3">Horario</p>
          <div className="space-y-1.5">
            {scheduleEntries.map(([day, hours]) => (
              <div key={day} className="flex justify-between items-center text-[10px]">
                <span className="text-gray-400 font-medium uppercase">{day}</span>
                <span className={`text-gray-900 font-black ${hours.toLowerCase().includes('cerrado') ? 'text-red-400 italic' : ''}`}>{hours}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export function TemplateEditorial({ brandSlug, brand, products, footerUrl }: { brandSlug: string; brand: BrandData; products: ProductData[]; footerUrl?: string }) {
  const primary = brand.primary_color || '#FF5C3A';
  const [selectedId, setSelectedId] = useState<string | null>(products?.[0]?.id ?? null);

  const handleProductClick = (id: string) => {
    setSelectedId(id);
    const el = document.getElementById('editorial-tryon');
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  return (
    <div className={`min-h-screen flex flex-col bg-[#f7f5f2] ${brand.landing_font || 'font-jakarta'} overflow-x-hidden`}>
      <EditorialHeader brand={brand} />
      <EditorialCover brand={brand} />
      
      <main className="max-w-5xl mx-auto w-full px-4 py-6 md:py-8 grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6 md:gap-8 items-start">
        <div className="order-2 lg:order-1">
          <div className="flex items-center justify-between mb-6 border-b border-gray-200 pb-2">
            <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 italic">Colección Editorial</p>
            <span className="text-[10px] font-bold text-gray-900 uppercase">{products?.length || 0} Items</span>
          </div>
          {products && products.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 md:gap-4">
              {products.map(p => (
                <EditorialProductCard key={p.id} product={p} selected={selectedId === p.id} primaryColor={primary} onClick={() => handleProductClick(p.id)} />
              ))}
            </div>
          ) : (
            <div className="py-12 text-center bg-white rounded-2xl border border-dashed border-gray-300">
              <p className="text-xs text-gray-400 uppercase font-bold tracking-widest">No hay productos disponibles</p>
            </div>
          )}
        </div>

        <div id="editorial-tryon" className="order-1 lg:order-2 lg:sticky lg:top-24">
          <div className="rounded-2xl overflow-hidden border border-gray-200 shadow-xl bg-white">
            <div className="px-4 py-3 flex items-center justify-between bg-black text-white">
              <span className="font-black text-[10px] md:text-xs flex items-center gap-2 italic uppercase">
                <SparklesIcon className="w-4 h-4 text-[#FF5C3A]" />
                Probador Virtual
              </span>
              <span className="text-[9px] text-gray-500 bg-gray-800 px-2 py-0.5 rounded-full font-bold">IA</span>
            </div>
            <TryOnWidget brandSlug={brandSlug} isEmbed={true} initialProductId={selectedId} />
          </div>
          
          <EditorialInfo brand={brand} primaryColor={primary} />

          <div className="mt-6 flex flex-col items-center gap-2">
            <p className="text-[9px] text-gray-400 uppercase font-bold tracking-widest text-center">Impulsado por Look<span className="text-[#FF5C3A]">itry</span> AI</p>
          </div>
        </div>
      </main>

      <footer className="py-12 px-6 text-center border-t border-gray-100 bg-white mt-auto">
        <p className="text-[9px] md:text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400">
          Probador virtual impulsado por <a href={footerUrl || 'https://pruebalo.wilkiedevs.com'} target="_blank" rel="noopener noreferrer" className="hover:opacity-70 transition-opacity">Look<span className="text-[#FF5C3A]">itry</span> IA</a>
        </p>
      </footer>

      {brand.whatsapp_contact && <WhatsAppFAB phone={brand.whatsapp_contact} message={brand.whatsapp_message} />}
    </div>
  );
}
