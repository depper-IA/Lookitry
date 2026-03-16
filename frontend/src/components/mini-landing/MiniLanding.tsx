'use client';

import { useState, useEffect, useRef } from 'react';
import { TryOnWidget } from '@/components/tryon/TryOnWidget';

interface BrandData {
  id: string;
  name: string;
  slug: string;
  logo?: string;
  primary_color: string;
  secondary_color: string;
  brand_description?: string | null;
  whatsapp_contact?: string | null;
  cover_image_url?: string | null;
  social_links?: Record<string, string>;
  has_landing_page?: boolean;
}

interface ProductData {
  id: string;
  name: string;
  image_url: string;
  category: string;
  description?: string;
}

interface MiniLandingProps {
  brandSlug: string;
  initialData: { brand: BrandData; products: ProductData[] } | null;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.pruebalo.wilkiedevs.com';

// ── Iconos ────────────────────────────────────────────────────────────────────
function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  );
}

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
      <path strokeLinecap="round" strokeLinejoin="round" d="M18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456z" />
    </svg>
  );
}

// ── Banner de activación ──────────────────────────────────────────────────────
function ActivationBanner({ primaryColor }: { primaryColor: string }) {
  return (
    <div className="w-full py-2.5 px-4 text-center text-sm font-medium text-white" style={{ backgroundColor: primaryColor }}>
      Activa tu página personalizada por $500.000 COP — contacta a soporte
    </div>
  );
}

// ── Botón flotante WhatsApp ───────────────────────────────────────────────────
function WhatsAppFAB({ phone }: { phone: string }) {
  const clean = phone.replace(/\D/g, '');
  const url = `https://wa.me/${clean}`;
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Contactar por WhatsApp"
      className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 pl-4 pr-5 py-3.5 rounded-full text-white text-sm font-semibold shadow-2xl hover:scale-105 active:scale-95 transition-transform"
      style={{ backgroundColor: '#25D366' }}
    >
      <WhatsAppIcon className="w-5 h-5 flex-shrink-0" />
      <span>WhatsApp</span>
    </a>
  );
}

// ── Hero ──────────────────────────────────────────────────────────────────────
function HeroSection({ brand, onScrollDown }: { brand: BrandData; onScrollDown: () => void }) {
  const primary = brand.primary_color || '#FF5C3A';
  const hasCover = !!brand.cover_image_url;

  return (
    <section
      className="relative w-full min-h-[420px] md:min-h-[520px] flex flex-col items-center justify-center text-center px-6 py-20 overflow-hidden"
      style={hasCover ? {} : { background: `linear-gradient(135deg, ${primary}ee 0%, ${primary}99 100%)` }}
    >
      {hasCover && (
        <>
          <img src={brand.cover_image_url!} alt={brand.name} className="absolute inset-0 w-full h-full object-cover" />
          <div className="absolute inset-0 bg-black/55" />
        </>
      )}

      <div className="relative z-10 flex flex-col items-center gap-5 max-w-2xl">
        {brand.logo && (
          <img src={brand.logo} alt={brand.name} className="h-16 md:h-20 object-contain drop-shadow-lg" />
        )}
        <h1 className="text-4xl md:text-5xl font-extrabold text-white drop-shadow-md leading-tight">
          {brand.name}
        </h1>
        {brand.brand_description && (
          <p className="text-white/90 text-base md:text-lg max-w-xl leading-relaxed">
            {brand.brand_description}
          </p>
        )}
        <button
          onClick={onScrollDown}
          className="mt-2 inline-flex items-center gap-2 px-8 py-4 rounded-2xl text-white font-bold text-base shadow-xl hover:opacity-90 active:scale-95 transition-all border-2 border-white/30"
          style={{ backgroundColor: primary }}
        >
          <SparklesIcon className="w-5 h-5" />
          Probarme un producto
        </button>
      </div>

      {/* Indicador scroll */}
      <button
        onClick={onScrollDown}
        className="absolute bottom-6 left-1/2 -translate-x-1/2 text-white/60 hover:text-white/90 transition-colors animate-bounce"
        aria-label="Ver más"
      >
        <ChevronDownIcon className="w-7 h-7" />
      </button>
    </section>
  );
}

// ── Sección "Cómo funciona" ───────────────────────────────────────────────────
function HowItWorksSection({ primaryColor }: { primaryColor: string }) {
  const steps = [
    {
      num: '1',
      title: 'Elige un producto',
      desc: 'Navega por el catálogo y selecciona la prenda o accesorio que quieras probar.',
    },
    {
      num: '2',
      title: 'Sube tu foto',
      desc: 'Toma o sube una foto tuya. Funciona mejor con buena iluminación y fondo claro.',
    },
    {
      num: '3',
      title: 'Ve el resultado',
      desc: 'Nuestra IA genera en segundos cómo te vería con ese producto puesto.',
    },
  ];

  return (
    <section className="w-full bg-gray-50 py-16 px-4">
      <div className="max-w-4xl mx-auto">
        <h2 className="text-2xl md:text-3xl font-bold text-gray-900 text-center mb-2">¿Cómo funciona?</h2>
        <p className="text-gray-500 text-center text-sm mb-10">Tres pasos y listo</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {steps.map(s => (
            <div key={s.num} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 text-center">
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-lg mx-auto mb-4"
                style={{ backgroundColor: primaryColor }}
              >
                {s.num}
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">{s.title}</h3>
              <p className="text-gray-500 text-sm leading-relaxed">{s.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── Galería de productos ──────────────────────────────────────────────────────
function ProductsGallery({
  products,
  primaryColor,
  onProductClick,
}: {
  products: ProductData[];
  primaryColor: string;
  onProductClick: (id: string) => void;
}) {
  if (products.length === 0) return null;

  return (
    <section className="w-full max-w-5xl mx-auto px-4 py-14">
      <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2 text-center">Catálogo</h2>
      <p className="text-gray-500 text-center mb-10 text-sm">
        Selecciona un producto para probártelo virtualmente
      </p>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
        {products.map(p => (
          <button
            key={p.id}
            onClick={() => onProductClick(p.id)}
            className="group rounded-2xl overflow-hidden border border-gray-200 bg-white hover:shadow-xl hover:-translate-y-1 transition-all duration-200 text-left"
          >
            <div className="relative aspect-square overflow-hidden bg-gray-50">
              <img
                src={p.image_url}
                alt={p.name}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
              <div
                className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                style={{ backgroundColor: primaryColor + 'cc' }}
              >
                <span className="text-white text-xs font-semibold px-3 py-1.5 rounded-full border-2 border-white">
                  Probarme esto
                </span>
              </div>
            </div>
            <div className="p-3">
              <p className="font-semibold text-sm text-gray-900 leading-tight truncate">{p.name}</p>
              {p.category && (
                <span className="inline-block mt-1 text-xs px-2 py-0.5 bg-gray-100 text-gray-500 rounded-full capitalize">
                  {p.category}
                </span>
              )}
              {p.description && (
                <p className="mt-1.5 text-xs text-gray-400 leading-snug line-clamp-2">{p.description}</p>
              )}
            </div>
          </button>
        ))}
      </div>
    </section>
  );
}

// ── Probador virtual ──────────────────────────────────────────────────────────
function TryOnSection({ brandSlug, primaryColor }: { brandSlug: string; primaryColor: string }) {
  return (
    <section
      id="tryon-section"
      className="w-full py-14 px-4"
      style={{ backgroundColor: primaryColor + '0d' }}
    >
      <div className="max-w-2xl mx-auto">
        <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2 text-center">Probador virtual</h2>
        <p className="text-gray-500 text-center mb-8 text-sm">
          Sube una foto tuya y ve cómo te queda el producto con IA
        </p>
        <div className="rounded-3xl overflow-hidden shadow-2xl border border-gray-100">
          <TryOnWidget brandSlug={brandSlug} />
        </div>
      </div>
    </section>
  );
}

// ── Redes sociales ────────────────────────────────────────────────────────────
function SocialSection({ brand }: { brand: BrandData }) {
  const socialLinks = brand.social_links || {};
  const entries = Object.entries(socialLinks).filter(([, url]) => !!url);
  if (entries.length === 0) return null;

  const icons: Record<string, React.ReactNode> = {
    instagram: <InstagramIcon className="w-5 h-5" />,
    facebook:  <FacebookIcon  className="w-5 h-5" />,
    tiktok:    <TikTokIcon    className="w-5 h-5" />,
  };

  return (
    <section className="w-full max-w-2xl mx-auto px-4 py-10 text-center">
      <h2 className="text-xl font-bold text-gray-900 mb-6">Síguenos</h2>
      <div className="flex flex-wrap items-center justify-center gap-3">
        {entries.map(([platform, url]) => (
          <a
            key={platform}
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl border border-gray-200 text-gray-700 font-medium text-sm hover:bg-gray-50 transition-colors capitalize"
          >
            {icons[platform.toLowerCase()] ?? null}
            {platform}
          </a>
        ))}
      </div>
    </section>
  );
}

// ── Contacto ──────────────────────────────────────────────────────────────────
function ContactSection({ brand, primaryColor }: { brand: BrandData; primaryColor: string }) {
  if (!brand.whatsapp_contact) return null;
  const url = `https://wa.me/${brand.whatsapp_contact.replace(/\D/g, '')}`;

  return (
    <section className="w-full py-14 px-4 bg-gray-50">
      <div className="max-w-xl mx-auto text-center">
        <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">¿Tienes preguntas?</h2>
        <p className="text-gray-500 text-sm mb-8">Escríbenos directamente y te respondemos al instante</p>
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-3 px-8 py-4 rounded-2xl text-white font-bold text-base shadow-lg hover:opacity-90 active:scale-95 transition-all"
          style={{ backgroundColor: '#25D366' }}
        >
          <WhatsAppIcon className="w-6 h-6" />
          Escribir por WhatsApp
        </a>
      </div>
    </section>
  );
}

// ── Componente principal ──────────────────────────────────────────────────────
export function MiniLanding({ brandSlug, initialData }: MiniLandingProps) {
  const [data, setData] = useState(initialData);
  const [loading, setLoading] = useState(!initialData);

  useEffect(() => {
    if (initialData) return;
    fetch(`${API_URL}/api/pruebalo/${brandSlug}`)
      .then(r => r.ok ? r.json() : null)
      .then(d => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, [brandSlug]);

  const scrollToTryOn = () => {
    document.getElementById('tryon-section')?.scrollIntoView({ behavior: 'smooth' });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="w-10 h-10 border-4 border-gray-200 rounded-full animate-spin" style={{ borderTopColor: '#FF5C3A' }} />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center p-8">
          <p className="text-xl font-bold text-gray-800">Página no encontrada</p>
          <p className="text-gray-500 mt-2 text-sm">Verifica el enlace e intenta de nuevo</p>
        </div>
      </div>
    );
  }

  const brand = data.brand;
  const products = data.products || [];
  const primaryColor = brand.primary_color || '#FF5C3A';
  const hasLandingPage = brand.has_landing_page ?? false;

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {!hasLandingPage && <ActivationBanner primaryColor={primaryColor} />}

      <HeroSection brand={brand} onScrollDown={scrollToTryOn} />
      <HowItWorksSection primaryColor={primaryColor} />
      <ProductsGallery products={products} primaryColor={primaryColor} onProductClick={scrollToTryOn} />
      <TryOnSection brandSlug={brandSlug} primaryColor={primaryColor} />
      <SocialSection brand={brand} />
      <ContactSection brand={brand} primaryColor={primaryColor} />

      <footer className="mt-auto py-6 px-4 border-t border-gray-100 text-center">
        <p className="text-xs text-gray-400">
          Probador virtual impulsado por{' '}
          <a
            href="https://pruebalo.wilkiedevs.com"
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium hover:underline"
            style={{ color: primaryColor }}
          >
            Pruébalo
          </a>
        </p>
      </footer>

      {/* Botón flotante WhatsApp */}
      {brand.whatsapp_contact && <WhatsAppFAB phone={brand.whatsapp_contact} />}
    </div>
  );
}
