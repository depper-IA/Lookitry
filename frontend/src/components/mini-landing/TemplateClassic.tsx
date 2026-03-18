'use client';

import { useState, useEffect } from 'react';
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
  InstagramIcon,
  FacebookIcon,
  TikTokIcon,
  SparklesIcon,
  MapPinIcon,
  TruckIcon,
  StarIcon,
  PhoneIcon,
} from './shared';

interface TemplateClassicProps {
  brand: BrandData;
  products: ProductData[];
  brandSlug: string;
  footerUrl?: string;
}

export function TemplateClassic({ brand, products, brandSlug, footerUrl }: TemplateClassicProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const primary = brand.primary_color || '#DB2777';

  const handleProductClick = (id: string) => {
    setSelectedId(id);
    const el = document.getElementById('classic-tryon');
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  const handleScrollDown = () => {
    const el = document.getElementById('classic-products');
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-[#FDF2F8]" style={{ fontFamily: "'Inter', sans-serif" }}>
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Playfair+Display:wght@400;500;600;700&display=swap');
      `}</style>
      <ClassicHeader brand={brand} primaryColor={primary} />

      <ClassicHero brand={brand} onScrollDown={handleScrollDown} primaryColor={primary} />
      <ClassicSteps primaryColor={primary} />
      <ClassicProducts
        products={products}
        primaryColor={primary}
        ctaText={brand.cta_button_text}
        onProductClick={handleProductClick}
        selectedId={selectedId}
      />
      <ClassicTryOn brandSlug={brandSlug} primaryColor={primary} />
      <ClassicAbout brand={brand} primaryColor={primary} />
      <ClassicContact brand={brand} primaryColor={primary} />
      <LandingFooter primaryColor={primary} footerUrl={footerUrl} />
      {brand.whatsapp_contact && <WhatsAppFAB phone={brand.whatsapp_contact} message={brand.whatsapp_message} />}
    </div>
  );
}

// ----------------------------------------------------------------------------
// Componentes del Template Classic (Liquid Glass + Playfair Display)
// ----------------------------------------------------------------------------

function ClassicHeader({ brand, primaryColor }: { brand: BrandData; primaryColor: string }) {
  const socialLinks = brand.social_links || {};
  const entries = Object.entries(socialLinks).filter(([, url]) => !!url);
  const icons: Record<string, React.ReactNode> = {
    instagram: <InstagramIcon className="w-4 h-4" />,
    facebook: <FacebookIcon className="w-4 h-4" />,
    tiktok: <TikTokIcon className="w-4 h-4" />,
  };

  return (
    <header className="sticky top-0 z-50 backdrop-blur-xl bg-white/80 border-b border-pink-100 shadow-sm transition-all duration-300">
      <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {brand.logo && (
            <BrandLogo
              src={brand.logo_dark || brand.logo}
              alt={brand.name}
              className="h-10 w-auto max-w-[160px] object-contain transition-transform duration-300 hover:scale-105"
            />
          )}
          {brand.show_brand_name !== false && (
            <span 
              className="text-xl font-bold text-[#831843] transition-colors duration-200" 
              style={{ fontFamily: "'Playfair Display', serif" }}
            >
              {brand.name}
            </span>
          )}
        </div>
        {entries.length > 0 && (
          <div className="flex gap-2">
            {entries.map(([platform, url]) => (
              <a
                key={platform}
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="w-9 h-9 rounded-full border border-pink-200 flex items-center justify-center text-pink-600 hover:text-white hover:bg-pink-600 hover:border-pink-600 transition-all duration-200 cursor-pointer"
              >
                {icons[platform.toLowerCase()] ?? null}
              </a>
            ))}
          </div>
        )}
      </div>
    </header>
  );
}


function ClassicHero({ brand, onScrollDown, primaryColor }: { brand: BrandData; onScrollDown: () => void; primaryColor: string }) {
  const hasCover = !!brand.cover_image_url;
  const overlayOpacity = brand.cover_overlay_opacity ?? 0.4;

  return (
    <section className="relative py-32 px-6 text-center overflow-hidden">
      {/* Fondo con gradiente suave */}
      <div className="absolute inset-0 bg-gradient-to-br from-pink-50 via-rose-50 to-pink-100" />
      
      {hasCover && (
        <>
          <CoverImage
            src={brand.cover_image_url}
            alt={brand.name}
            className="absolute inset-0 w-full h-full object-cover"
          />
          {overlayOpacity > 0 && (
            <div className="absolute inset-0 bg-gradient-to-b from-pink-900/40 to-rose-900/60" style={{ opacity: overlayOpacity }} />
          )}
        </>
      )}
      
      {/* Efectos decorativos (anillos) */}
      {!hasCover && (
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center opacity-20">
          {[500, 350, 200].map((size, i) => (
            <div 
              key={i} 
              className="absolute rounded-full border-2 animate-pulse" 
              style={{ 
                width: size, 
                height: size, 
                borderColor: primaryColor,
                animationDelay: `${i * 0.3}s`,
                animationDuration: '3s'
              }} 
            />
          ))}
        </div>
      )}
      
      <div className="relative z-10 max-w-4xl mx-auto">
        <h1 
          className="text-6xl md:text-7xl font-bold leading-tight mb-6 text-[#831843] tracking-tight" 
          style={{ fontFamily: "'Playfair Display', serif" }}
        >
          {brand.slogan || 'Pruébate la ropa antes de comprar'}
        </h1>
        {brand.brand_description && (
          <p className="text-lg md:text-xl text-rose-900/80 mb-10 max-w-2xl mx-auto leading-relaxed font-light">
            {brand.brand_description}
          </p>
        )}
        <button
          onClick={onScrollDown}
          className="group inline-flex items-center gap-3 px-10 py-5 rounded-full text-white font-semibold text-lg transition-all duration-300 hover:scale-105 hover:shadow-2xl cursor-pointer"
          style={{ backgroundColor: primaryColor }}
        >
          <SparklesIcon className="w-6 h-6 group-hover:rotate-12 transition-transform duration-300" />
          Probar ahora
        </button>
        <p className="text-sm text-rose-700/60 mt-6 font-light">Sin registro • Resultado instantáneo • 100% gratis</p>
      </div>
    </section>
  );
}

function ClassicSteps({ primaryColor }: { primaryColor: string }) {
  const steps = [
    { num: '1', title: 'Elige tu prenda', desc: 'Selecciona el producto que quieres probarte', icon: '👗' },
    { num: '2', title: 'Sube tu foto', desc: 'Toma o sube una selfie de cuerpo completo', icon: '📸' },
    { num: '3', title: 'Mira el resultado', desc: 'La IA genera tu prueba virtual en segundos', icon: '✨' },
  ];

  return (
    <section className="py-20 px-6 bg-white">
      <div className="max-w-6xl mx-auto">
        <h2 
          className="text-4xl md:text-5xl font-bold text-center mb-16 text-[#831843] tracking-tight" 
          style={{ fontFamily: "'Playfair Display', serif" }}
        >
          ¿Cómo funciona?
        </h2>
        <div className="grid md:grid-cols-3 gap-10">
          {steps.map((step, idx) => (
            <div 
              key={step.num} 
              className="text-center group cursor-pointer transition-transform duration-300 hover:-translate-y-2"
            >
              <div 
                className="w-20 h-20 rounded-2xl text-white flex items-center justify-center text-3xl font-bold mx-auto mb-6 shadow-lg transition-all duration-300 group-hover:shadow-2xl group-hover:scale-110"
                style={{ 
                  backgroundColor: primaryColor,
                  transform: `rotate(${idx * 2 - 2}deg)`
                }}
              >
                {step.num}
              </div>
              <h3 className="text-2xl font-semibold mb-3 text-[#831843]" style={{ fontFamily: "'Playfair Display', serif" }}>
                {step.title}
              </h3>
              <p className="text-rose-900/70 leading-relaxed">{step.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}


function ClassicProducts({
  products,
  primaryColor,
  ctaText,
  onProductClick,
  selectedId,
}: {
  products: ProductData[];
  primaryColor: string;
  ctaText?: string | null;
  onProductClick: (id: string) => void;
  selectedId: string | null;
}) {
  if (!products.length) return null;

  return (
    <section id="classic-products" className="py-20 px-6 bg-gradient-to-b from-pink-50 to-white">
      <div className="max-w-7xl mx-auto">
        <h2 
          className="text-4xl md:text-5xl font-bold text-center mb-4 text-[#831843] tracking-tight" 
          style={{ fontFamily: "'Playfair Display', serif" }}
        >
          Nuestra Colección
        </h2>
        <p className="text-center text-rose-900/70 mb-16 text-lg">Selecciona una prenda para probártela</p>
        
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
          {products.map((p) => (
            <button
              key={p.id}
              onClick={() => onProductClick(p.id)}
              className="group text-left rounded-2xl overflow-hidden border-2 transition-all duration-300 hover:shadow-2xl hover:-translate-y-2 bg-white cursor-pointer"
              style={{
                borderColor: selectedId === p.id ? primaryColor : '#fce7f3',
              }}
            >
              <div className="relative aspect-square overflow-hidden bg-pink-50">
                <ProductImage
                  src={p.image_url}
                  alt={p.name}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                />
                {p.badge && (
                  <span className="absolute top-3 left-3 z-10">
                    <ProductBadge badge={p.badge} />
                  </span>
                )}
                {selectedId === p.id && (
                  <div 
                    className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end justify-center pb-4"
                  >
                    <span
                      className="flex items-center gap-2 text-white text-sm font-bold px-4 py-2 rounded-full backdrop-blur-sm"
                      style={{ backgroundColor: `${primaryColor}dd` }}
                    >
                      <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      Seleccionado
                    </span>
                  </div>
                )}
              </div>
              <div className="p-4">
                <p className="text-sm font-semibold text-[#831843] mb-2 truncate" style={{ fontFamily: "'Playfair Display', serif" }}>
                  {p.name}
                </p>
                <div className="flex items-center justify-between">
                  {p.price != null && (
                    <p className="text-lg font-bold" style={{ color: primaryColor }}>
                      ${p.price.toLocaleString('es-CO')}
                    </p>
                  )}
                  <span 
                    className="text-xs font-medium px-3 py-1 rounded-full transition-colors duration-200"
                    style={{ 
                      backgroundColor: `${primaryColor}15`,
                      color: primaryColor
                    }}
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

function ClassicTryOn({ brandSlug, primaryColor }: { brandSlug: string; primaryColor: string }) {
  return (
    <section id="classic-tryon" className="py-20 px-6 bg-white">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h2 
            className="text-4xl md:text-5xl font-bold mb-4 text-[#831843] tracking-tight" 
            style={{ fontFamily: "'Playfair Display', serif" }}
          >
            Pruébatelo ahora
          </h2>
          <p className="text-rose-900/70 text-lg">
            Sube tu foto y la IA genera el resultado en segundos
          </p>
        </div>
        <div className="rounded-3xl overflow-hidden shadow-2xl border-2 border-pink-100 backdrop-blur-sm bg-white/90">
          <TryOnWidget brandSlug={brandSlug} />
        </div>
      </div>
    </section>
  );
}


function ClassicAbout({ brand, primaryColor }: { brand: BrandData; primaryColor: string }) {
  const DAYS_ORDER = ['lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado', 'domingo'];
  const DAYS: Record<string, string> = {
    lunes: 'Lunes',
    martes: 'Martes',
    miercoles: 'Miércoles',
    jueves: 'Jueves',
    viernes: 'Viernes',
    sabado: 'Sábado',
    domingo: 'Domingo',
  };

  const scheduleEntries = brand.schedule
    ? DAYS_ORDER.filter((d) => d in brand.schedule!).map((d) => [d, brand.schedule![d]] as [string, string])
    : [];

  if (!brand.brand_description && !scheduleEntries.length && !brand.city_display && !brand.whatsapp_contact) {
    return null;
  }

  return (
    <section className="py-20 px-6 bg-gradient-to-b from-white to-pink-50">
      <div className="max-w-3xl mx-auto text-center">
        {brand.logo && (
          <div className="flex justify-center mb-8">
            <BrandLogo
              src={brand.logo_dark || brand.logo}
              alt={brand.name}
              className="h-20 w-auto max-w-[200px] object-contain transition-transform duration-300 hover:scale-105"
            />
          </div>
        )}
        {brand.show_brand_name !== false && (
          <h2 
            className="text-4xl font-bold mb-6 text-[#831843]" 
            style={{ fontFamily: "'Playfair Display', serif" }}
          >
            {brand.name}
          </h2>
        )}
        {brand.brand_description && (
          <p className="text-rose-900/80 leading-relaxed mb-12 text-lg">{brand.brand_description}</p>
        )}

        {/* Detalles */}
        {(brand.city_display || brand.national_shipping || brand.whatsapp_contact) && (
          <div className="rounded-2xl border-2 border-pink-100 overflow-hidden mb-8 text-left bg-white shadow-lg">
            {brand.whatsapp_contact && (
              <div className="flex items-center gap-4 px-6 py-5 border-b border-pink-100 hover:bg-pink-50/50 transition-colors duration-200">
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm"
                  style={{ backgroundColor: `${primaryColor}15` }}
                >
                  <PhoneIcon className="w-6 h-6" style={{ color: primaryColor }} />
                </div>
                <span className="text-[#831843] font-medium">{brand.whatsapp_contact}</span>
              </div>
            )}
            {brand.city_display && (
              <div className="flex items-center gap-4 px-6 py-5 border-b last:border-b-0 border-pink-100 hover:bg-pink-50/50 transition-colors duration-200">
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm"
                  style={{ backgroundColor: `${primaryColor}15` }}
                >
                  <MapPinIcon className="w-6 h-6" style={{ color: primaryColor }} />
                </div>
                <span className="text-[#831843] font-medium">
                  {brand.city_display}
                  {brand.national_shipping ? ' · Envíos nacionales' : ''}
                </span>
              </div>
            )}
            {!brand.city_display && brand.national_shipping && (
              <div className="flex items-center gap-4 px-6 py-5 hover:bg-pink-50/50 transition-colors duration-200">
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm"
                  style={{ backgroundColor: `${primaryColor}15` }}
                >
                  <TruckIcon className="w-6 h-6" style={{ color: primaryColor }} />
                </div>
                <span className="text-[#831843] font-medium">Envíos a todo el país</span>
              </div>
            )}
          </div>
        )}

        {/* Horarios */}
        {scheduleEntries.length > 0 && (
          <div className="rounded-2xl border-2 border-pink-100 overflow-hidden text-left bg-white shadow-lg">
            <div className="px-6 py-4 border-b border-pink-100 bg-pink-50/50">
              <span className="text-sm font-semibold uppercase tracking-wider text-rose-700">
                Horario de atención
              </span>
            </div>
            {scheduleEntries.map(([day, hours]) => (
              <div
                key={day}
                className="flex items-center justify-between px-6 py-4 border-b last:border-b-0 border-pink-100 hover:bg-pink-50/30 transition-colors duration-200"
              >
                <span className="text-rose-700">{DAYS[day] ?? day}</span>
                <span
                  className="font-semibold"
                  style={{ color: hours === 'Cerrado' ? '#9ca3af' : '#831843' }}
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

function ClassicContact({ brand, primaryColor }: { brand: BrandData; primaryColor: string }) {
  if (!brand.whatsapp_contact) return null;

  const clean = brand.whatsapp_contact.replace(/\D/g, '');
  const msg = brand.whatsapp_message ? `?text=${encodeURIComponent(brand.whatsapp_message)}` : '';

  return (
    <section className="py-16 px-6 text-center bg-white border-t-2 border-pink-100">
      <div className="max-w-lg mx-auto">
        <div
          className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg"
          style={{ backgroundColor: '#25D36618', border: '2px solid #25D36640' }}
        >
          <WhatsAppIcon className="w-8 h-8" style={{ color: '#25D366' }} />
        </div>
        <h2 
          className="text-3xl font-bold mb-3 text-[#831843]" 
          style={{ fontFamily: "'Playfair Display', serif" }}
        >
          ¿Tienes preguntas?
        </h2>
        <p className="text-rose-900/70 mb-8 text-lg">Escríbenos y te respondemos al instante</p>
        <a
          href={`https://wa.me/${clean}${msg}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-3 px-10 py-4 rounded-full text-white font-semibold transition-all duration-300 hover:scale-105 hover:shadow-2xl cursor-pointer"
          style={{ backgroundColor: '#25D366' }}
        >
          <WhatsAppIcon className="w-6 h-6" />
          Escribir por WhatsApp
        </a>
        <p className="text-sm text-rose-700/60 mt-4">Respuesta en minutos</p>
      </div>
    </section>
  );
}
=======
import Image from 'next/image';
import { TryOnWidget } from '@/components/tryon/TryOnWidget';
import { BrandData, ProductData, WhatsAppIcon } from './shared';

// Iconos internos del template
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
  );
}

function ChevronDownIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
    </svg>
  );
}

function SparklesIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
    </svg>
  );
}

export function TemplateClassic({ brandSlug, brand, products, footerUrl }: { brandSlug: string; brand: BrandData; products: ProductData[]; footerUrl?: string }) {
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

  const socialLinks = brand.social_links || {};

  return (
    <div className="min-h-screen bg-[#f5f2ee] font-sans text-[#1a1a1a]">
      {/* Header */}
      <header 
        className="sticky top-0 z-40 w-full bg-white/80 backdrop-blur-md border-b border-[#e0dcd7] transition-all duration-300"
        style={{ borderTop: `4px solid ${primaryColor}` }}
      >
        <div className="max-w-6xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-4">
            {brand.logo ? (
              <div className="relative w-12 h-12 rounded-xl overflow-hidden bg-white border border-[#e0dcd7] shadow-sm">
                <Image src={brand.logo} alt={brand.name} fill className="object-contain p-1" />
              </div>
            ) : (
              <div className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-lg" style={{ backgroundColor: primaryColor }}>
                {brand.name.charAt(0)}
              </div>
            )}
            <div className="flex flex-col">
              <h1 className="text-xl font-bold tracking-tight text-[#0a0a0a]">{brand.name}</h1>
              {brand.city_display && (
                <span className="text-[11px] font-medium text-[#888] flex items-center gap-1 uppercase tracking-wider">
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                  {brand.city_display}
                </span>
              )}
            </div>
          </div>

          <div className="hidden md:flex items-center gap-8">
            <nav className="flex items-center gap-6">
              <a href="#productos" className="text-sm font-semibold text-[#555] hover:text-[#0a0a0a] transition-colors uppercase tracking-widest">Catálogo</a>
              <a href="#contacto" className="text-sm font-semibold text-[#555] hover:text-[#0a0a0a] transition-colors uppercase tracking-widest">Contacto</a>
            </nav>
            <a 
              href={`https://wa.me/${brand.whatsapp_contact?.replace(/\+/g, '').replace(/\s/g, '')}?text=${encodeURIComponent(brand.whatsapp_message || 'Hola! Vi tu página y me interesa un producto.')}`}
              target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-2 px-5 py-2.5 rounded-full text-white text-sm font-bold shadow-md hover:scale-105 transition-all active:scale-95"
              style={{ backgroundColor: primaryColor }}
            >
              <WhatsAppIcon className="w-4 h-4" />
              WhatsApp
            </a>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative w-full py-20 px-6 overflow-hidden bg-white border-b border-[#e0dcd7]">
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div className="relative z-10 text-center lg:text-left">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-black/5 border border-black/10 text-[#0a0a0a] text-[11px] font-bold uppercase tracking-[0.2em] mb-8 animate-in fade-in slide-in-from-top-4 duration-700">
              <SparklesIcon className="w-4 h-4" style={{ color: primaryColor }} />
              Probador Virtual IA
            </div>
            <h2 className="text-5xl lg:text-7xl font-extrabold tracking-tighter text-[#0a0a0a] leading-[0.9] mb-8">
              {brand.slogan || `Pruébatelo antes de comprar.`}
            </h2>
            <p className="text-lg text-[#666] max-w-lg mx-auto lg:mx-0 mb-10 leading-relaxed font-light">
              {brand.brand_description || `Selecciona cualquier prenda de nuestro catálogo y mira cómo te queda en segundos con nuestra tecnología de inteligencia artificial.`}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
              <a href="#productos" className="px-10 py-5 rounded-full bg-[#0a0a0a] text-white font-bold text-base shadow-xl hover:bg-[#1a1a1a] transition-all hover:scale-105 active:scale-95">Ver Catálogo</a>
              <div className="flex items-center justify-center lg:justify-start gap-4 px-6 py-4">
                <div className="flex -space-x-2">
                  {[1, 2, 3].map(i => <div key={i} className="w-8 h-8 rounded-full border-2 border-white bg-gray-200" />)}
                </div>
                <div className="text-left">
                  <div className="text-xs font-bold text-[#0a0a0a]">+{brand.total_reviews || '2.5k'} reviews</div>
                  <div className="flex gap-0.5 mt-0.5">
                    {[1, 2, 3, 4, 5].map(i => <svg key={i} className="w-2.5 h-2.5 fill-[#FFB800]" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>)}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="relative group perspective-1000 hidden lg:block">
            <div className="relative w-full aspect-[4/5] rounded-[40px] overflow-hidden shadow-2xl transition-transform duration-700 group-hover:rotate-y-6">
              {brand.cover_image_url ? (
                <Image src={brand.cover_image_url} alt={brand.name} fill className="object-cover" />
              ) : (
                <div className="w-full h-full" style={{ backgroundColor: `${primaryColor}15` }} />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            </div>
          </div>
        </div>
      </section>

      {/* Products Grid */}
      <section id="productos" className="py-24 px-6 max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-16">
          <div>
            <span className="text-[11px] font-bold text-[#FF5C3A] uppercase tracking-widest mb-3 block">Catálogo Oficial</span>
            <h3 className="text-4xl md:text-5xl font-black tracking-tighter italic text-[#0a0a0a]">COLECCIÓN 2026</h3>
          </div>
          <p className="text-[#666] max-w-sm text-sm leading-relaxed font-medium">Haz click en "Probador IA" para ver cómo te queda cualquier prenda antes de comprar.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {products.map((p) => (
            <div key={p.id} className="group bg-white rounded-3xl overflow-hidden border border-[#e0dcd7] hover:border-[#FF5C3A]/30 transition-all hover:shadow-2xl">
              <div className="relative aspect-[3/4] overflow-hidden bg-[#f9f7f5]">
                <Image src={p.image_url} alt={p.name} fill className="object-cover transition-transform duration-700 group-hover:scale-110" />
                {p.badge && (
                  <div className="absolute top-4 left-4 px-3 py-1 bg-white text-[10px] font-bold text-[#0a0a0a] uppercase tracking-widest rounded-full shadow-sm">
                    {p.badge}
                  </div>
                )}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                  <button 
                    onClick={() => handleOpenWidget(p)}
                    className="px-6 py-3 bg-[#FF5C3A] text-white rounded-full font-bold text-xs uppercase tracking-widest shadow-xl hover:scale-105 transition-transform flex items-center gap-2"
                  >
                    <SparklesIcon className="w-4 h-4" />
                    Probador IA
                  </button>
                </div>
              </div>
              <div className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-bold text-[#FF5C3A] uppercase tracking-widest">{p.category}</span>
                  {p.price && <span className="text-sm font-bold text-[#0a0a0a]">${p.price.toLocaleString('es-CO')}</span>}
                </div>
                <h4 className="text-lg font-bold text-[#0a0a0a] group-hover:text-[#FF5C3A] transition-colors">{p.name}</h4>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Footer / Contact */}
      <footer id="contacto" className="bg-[#1a1a1a] text-white py-24 px-6">
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-16 items-start">
          <div>
            <div className="flex items-center gap-3 mb-8">
              {brand.logo ? (
                <div className="relative w-10 h-10 rounded-lg overflow-hidden bg-white/10 p-1">
                  <Image src={brand.logo} alt={brand.name} fill className="object-contain" />
                </div>
              ) : null}
              <h4 className="text-2xl font-bold tracking-tighter italic uppercase">{brand.name}</h4>
            </div>
            <p className="text-gray-400 max-w-xs mb-10 leading-relaxed italic">{brand.brand_description || 'Probador virtual impulsado por Lookitry.'}</p>
            <div className="flex gap-4">
              {socialLinks.instagram && <a href={socialLinks.instagram} target="_blank" rel="noopener noreferrer" className="p-3 bg-white/5 rounded-2xl hover:bg-[#FF5C3A] hover:text-white transition-all"><InstagramIcon className="w-5 h-5" /></a>}
              {socialLinks.facebook && <a href={socialLinks.facebook} target="_blank" rel="noopener noreferrer" className="p-3 bg-white/5 rounded-2xl hover:bg-[#FF5C3A] hover:text-white transition-all"><FacebookIcon className="w-5 h-5" /></a>}
              {socialLinks.tiktok && <a href={socialLinks.tiktok} target="_blank" rel="noopener noreferrer" className="p-3 bg-white/5 rounded-2xl hover:bg-[#FF5C3A] hover:text-white transition-all"><TikTokIcon className="w-5 h-5" /></a>}
            </div>
          </div>

          <div className="bg-white/5 p-10 rounded-3xl border border-white/10">
            <h4 className="text-xl font-bold mb-6 italic uppercase tracking-widest">¿Tienes dudas?</h4>
            <p className="text-gray-400 text-sm mb-8">Escríbenos directamente a nuestro WhatsApp oficial para asesoría personalizada.</p>
            <a 
              href={`https://wa.me/${brand.whatsapp_contact?.replace(/\+/g, '').replace(/\s/g, '')}?text=${encodeURIComponent(brand.whatsapp_message || 'Hola!')}`}
              target="_blank" rel="noopener noreferrer"
              className="flex items-center justify-center gap-3 w-full py-5 rounded-full bg-white text-black font-extrabold hover:scale-[1.02] transition-all shadow-xl"
            >
              <WhatsAppIcon className="w-5 h-5" />
              Chatear con nosotros
            </a>
          </div>
        </div>
        <div className="max-w-6xl mx-auto mt-24 pt-8 border-t border-white/10 flex flex-col md:flex-row items-center justify-between gap-6 text-[11px] font-bold text-gray-500 tracking-widest uppercase">
          <p>© 2026 {brand.name}. Todos los derechos reservados.</p>
          <div className="flex items-center gap-4">
            <a href={footerUrl || 'https://pruebalo.wilkiedevs.com'} target="_blank" rel="noopener noreferrer" className="hover:text-[#FF5C3A] transition-colors">Lookitry IA</a>
            <span className="text-gray-800">|</span>
            <span>Probador Virtual</span>
          </div>
        </div>
      </footer>

      {/* Widget Modal */}
      {showWidget && activeProduct && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-0 md:p-6 bg-black/90 backdrop-blur-md animate-in fade-in duration-300">
          <button onClick={handleCloseWidget} className="absolute top-6 right-6 z-[70] p-3 text-white hover:bg-white/10 rounded-full transition-all">
            <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
          <div className="w-full h-full max-w-5xl bg-black md:rounded-[40px] overflow-hidden shadow-2xl relative border border-white/10">
            <TryOnWidget brandSlug={brandSlug} initialProduct={activeProduct} isEmbed={true} />
          </div>
        </div>
      )}
    </div>
  );
}
>>>>>>> e173c4b (refactor: restaurar division de mini-landing en templates independientes (Classic, Editorial, Moderno))
