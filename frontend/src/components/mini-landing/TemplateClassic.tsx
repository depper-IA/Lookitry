'use client';

import { useState, useEffect } from 'react';
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
