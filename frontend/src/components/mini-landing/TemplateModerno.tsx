'use client';

import { useState } from 'react';
import Image from 'next/image';
import { TryOnWidget } from '@/components/tryon/TryOnWidget';
import { BrandData, ProductData, WhatsAppIcon } from './shared';

function SparklesIcon({ className, color, style }: { className?: string; color?: string; style?: React.CSSProperties }) {
  return (
    <svg className={className} style={style} fill="none" viewBox="0 0 24 24" stroke={color || "currentColor"} strokeWidth={1.8}>
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
    <div className="min-h-screen font-sans" style={{ backgroundColor: brand.cover_bg_color || '#f9f7f5', color: '#1a1a1a' }}>
      <header 
        className="sticky top-0 z-50 backdrop-blur-xl border-b border-black/5 h-20 px-6 flex items-center justify-between transition-all duration-300"
        style={{ backgroundColor: brand.header_color ? `${brand.header_color}cc` : 'rgba(255,255,255,0.7)' }}
      >
        <div className="flex items-center gap-3">
          {brand.logo_dark ? (
            <img src={brand.logo_dark} alt="" className="h-7 object-contain" />
          ) : brand.logo ? (
            <img src={brand.logo} alt="" className="h-7 object-contain" />
          ) : null}
          {brand.show_brand_name !== false && (
            <h1 className="text-xl font-black tracking-tight">{brand.name}</h1>
          )}
        </div>
        <a 
          href={`https://wa.me/${brand.whatsapp_contact?.replace(/\+/g, '').replace(/\s/g, '')}?text=${encodeURIComponent(brand.whatsapp_message || 'Hola!')}`}
          target="_blank" rel="noopener noreferrer"
          className="p-3 bg-black text-white rounded-2xl hover:scale-110 transition-transform"
          style={{ backgroundColor: primaryColor }}
        >
          <WhatsAppIcon className="w-5 h-5" />
        </a>
      </header>

      <main className="max-w-xl mx-auto py-12 px-6">
        {brand.cover_image_url && (
          <div className="relative aspect-[16/9] mb-12 rounded-[2.5rem] overflow-hidden shadow-2xl">
            <Image src={brand.cover_image_url} alt={brand.name} fill className="object-cover" />
            <div className="absolute inset-0" style={{ backgroundColor: `rgba(0,0,0,${brand.cover_overlay_opacity ?? 0})` }} />
          </div>
        )}

        <div className="mb-12 text-center">
          {brand.logo && (
            <div className="relative w-20 h-20 mx-auto mb-6 rounded-[2rem] overflow-hidden shadow-xl border-4 border-white bg-white">
              <Image src={brand.logo} alt={brand.name} fill className="object-contain p-2" />
            </div>
          )}
          <h2 className="text-3xl font-black tracking-tighter italic uppercase mb-2">{brand.name}</h2>
          <p className="text-gray-500 text-sm font-medium mb-4">{brand.slogan || 'Elige tu prenda y pruébatela ahora.'}</p>
          
          {/* Stats y Reviews */}
          {(brand.total_reviews || brand.city_display) && (
            <div className="flex flex-wrap justify-center gap-4 mb-6 opacity-60 text-[10px] font-bold uppercase tracking-widest">
              {brand.city_display && (
                <div className="flex items-center gap-1.5">
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                  {brand.city_display}
                </div>
              )}
              {brand.total_reviews && (
                <div className="flex items-center gap-1.5">
                  <div className="flex gap-0.5">
                    {[1, 2, 3, 4, 5].map(i => <svg key={i} className="w-2 h-2 fill-black" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>)}
                  </div>
                  {brand.total_reviews} reviews
                </div>
              )}
            </div>
          )}

          {brand.brand_description && (
            <p className="text-gray-400 text-xs leading-relaxed max-w-sm mx-auto">{brand.brand_description}</p>
          )}
        </div>

        <div className="space-y-6">
          {products.map((p) => (
            <div key={p.id} className="bg-white rounded-[2.5rem] p-4 shadow-sm border border-black/5 hover:shadow-xl transition-all group">
              <div className="relative aspect-square rounded-[2rem] overflow-hidden mb-6 bg-[#f0ece8]">
                <Image src={p.image_url} alt={p.name} fill className="object-cover transition-transform duration-700 group-hover:scale-105" />
                <button 
                  onClick={() => handleOpenWidget(p)}
                  className="absolute bottom-6 left-6 right-6 py-4 bg-black text-white rounded-2xl font-bold text-sm shadow-2xl flex items-center justify-center gap-3 hover:opacity-90 transition-opacity"
                  style={{ backgroundColor: primaryColor }}
                >
                  <SparklesIcon className="w-5 h-5" />
                  {brand.cta_button_text || 'Probador IA'}
                </button>
              </div>
              <div className="px-4 pb-2">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: primaryColor }}>{p.category}</span>
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
            <TryOnWidget brandSlug={brandSlug} isEmbed={true} />
          </div>
        </div>
      )}
    </div>
  );
}
