'use client';

import { useState } from 'react';
import Image from 'next/image';
import { TryOnWidget } from '@/components/tryon/TryOnWidget';
import { BrandData, ProductData, WhatsAppIcon } from './shared';

// Iconos internos
function SparklesIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
    </svg>
  );
}

export function TemplateEditorial({ brandSlug, brand, products, footerUrl }: { brandSlug: string; brand: BrandData; products: ProductData[]; footerUrl?: string }) {
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
    <div className="min-h-screen bg-[#0a0a0a] text-white font-serif selection:bg-[#FF5C3A] selection:text-white">
      {/* Header Minimalista */}
      <header 
        className="fixed top-0 z-50 w-full px-8 py-6 flex justify-between items-center transition-all duration-300"
        style={{ backgroundColor: brand.header_color ? `${brand.header_color}cc` : 'rgba(0,0,0,0.4)' }}
      >
        <div className="flex items-center gap-4">
          {brand.logo_light && (
            <img src={brand.logo_light} alt="" className="h-8 object-contain" />
          )}
          {brand.show_brand_name !== false && (
            <h1 className="text-2xl font-black italic tracking-tighter uppercase">{brand.name}</h1>
          )}
        </div>
        <div className="flex items-center gap-8">
          <nav className="hidden md:flex gap-8 text-[10px] font-bold tracking-[0.3em] uppercase opacity-70">
            <a href="#catalogo" className="hover:opacity-100 transition-opacity">Editorial</a>
            <a href="#contacto" className="hover:opacity-100 transition-opacity">Info</a>
          </nav>
          <a 
            href={`https://wa.me/${brand.whatsapp_contact?.replace(/\+/g, '').replace(/\s/g, '')}?text=${encodeURIComponent(brand.whatsapp_message || 'Hola!')}`}
            target="_blank" rel="noopener noreferrer"
            className="w-10 h-10 rounded-full border border-white/20 flex items-center justify-center hover:bg-white hover:text-black transition-all"
          >
            <WhatsAppIcon className="w-4 h-4" />
          </a>
        </div>
      </header>

      {/* Hero Section - Estilo Revista */}
      <section 
        className="relative h-screen flex flex-col justify-center items-center px-6 pt-20"
        style={{ backgroundColor: brand.cover_bg_color || '#0a0a0a' }}
      >
        <div className="absolute inset-0 z-0">
          {brand.cover_image_url ? (
            <>
              <Image 
                src={brand.cover_image_url} 
                alt={brand.name} 
                fill 
                className="object-cover"
                style={{ opacity: 1 - (brand.cover_overlay_opacity ?? 0.4) }}
                priority
              />
            </>
          ) : null}
          <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-transparent to-black/40" />
        </div>

        <div className="relative z-10 text-center max-w-4xl">
          <span className="text-[11px] font-bold tracking-[0.5em] uppercase mb-8 block opacity-80" style={{ color: primaryColor }}>
            Lookitry Experimental
          </span>
          <h2 className="text-6xl md:text-9xl font-black leading-[0.85] tracking-tighter italic uppercase mb-12">
            {brand.slogan || 'The New Era of Fashion.'}
          </h2>
          <div className="flex flex-col md:flex-row items-center justify-center gap-8">
            <a 
              href="#catalogo" 
              className="px-12 py-5 bg-white text-black font-black text-xs uppercase tracking-[0.2em] hover:bg-[#FF5C3A] hover:text-white transition-all shadow-2xl"
            >
              Explore Collection
            </a>
          </div>
        </div>

        <div className="absolute bottom-12 left-1/2 -translate-x-1/2 animate-bounce">
          <svg className="w-6 h-6 text-white/30" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7-7-7" /></svg>
        </div>
      </section>

      {/* Catálogo Estilo Editorial */}
      <section id="catalogo" className="py-32 px-6 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-1 px-4">
          {products.map((p, i) => (
            <div 
              key={p.id} 
              className={`relative aspect-[3/4] overflow-hidden group cursor-pointer ${i % 3 === 1 ? 'md:translate-y-12' : ''}`}
              onClick={() => handleOpenWidget(p)}
            >
              <Image 
                src={p.image_url} 
                alt={p.name} 
                fill 
                className="object-cover transition-transform duration-1000 group-hover:scale-110 grayscale group-hover:grayscale-0 opacity-80 group-hover:opacity-100" 
              />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-8">
                <span className="text-[10px] font-bold tracking-widest uppercase mb-2" style={{ color: primaryColor }}>{p.category}</span>
                <h4 className="text-2xl font-black italic tracking-tighter uppercase mb-6">{p.name}</h4>
                <div className="flex items-center gap-4">
                  <span className="px-6 py-3 border border-white text-[10px] font-bold uppercase tracking-widest hover:bg-white hover:text-black transition-all">Probador IA</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Footer Editorial */}
      <footer id="contacto" className="py-40 px-6 text-center border-t border-white/5">
        <div className="max-w-2xl mx-auto">
          <h4 className="text-4xl md:text-6xl font-black italic tracking-tighter uppercase mb-12">Connect With Us</h4>
          <p className="text-gray-500 text-sm leading-relaxed mb-16 px-10 italic">
            {brand.brand_description || 'Virtual Try-On Experience for modern brands.'}
          </p>
          <div className="flex flex-col md:flex-row items-center justify-center gap-8">
            <a 
              href={`https://wa.me/${brand.whatsapp_contact?.replace(/\+/g, '').replace(/\s/g, '')}`}
              className="text-[11px] font-black uppercase tracking-[0.4em] border-b-2 border-transparent hover:border-[#FF5C3A] transition-all pb-2"
            >
              WhatsApp Office
            </a>
            {brand.social_links?.instagram && (
              <a 
                href={brand.social_links.instagram}
                className="text-[11px] font-black uppercase tracking-[0.4em] border-b-2 border-transparent hover:border-[#FF5C3A] transition-all pb-2"
              >
                Instagram
              </a>
            )}
          </div>
        </div>
        <div className="mt-40 text-[9px] font-bold tracking-[0.5em] uppercase text-gray-700">
          Powered by <a href={footerUrl || '#'} className="hover:text-white transition-colors">Lookitry IA</a>
        </div>
      </footer>

      {/* Widget Modal */}
      {showWidget && activeProduct && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-0 md:p-12 bg-black/95 animate-in zoom-in duration-500">
          <button onClick={handleCloseWidget} className="absolute top-8 right-8 z-[70] p-4 text-white hover:opacity-50 transition-all uppercase text-[10px] font-black tracking-widest">Close</button>
          <div className="w-full h-full bg-[#111] overflow-hidden relative shadow-2xl">
            <TryOnWidget brandSlug={brandSlug} isEmbed={true} />
          </div>
        </div>
      )}
    </div>
  );
}
