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
  useScrollReveal,
  isDarkColor,
  getContrastColor,
  getSmartMutedColor,
  useContrastTheme,
  useLandingTheme,
  SocialLinks,
  FiveStars,
  getCssColor,
} from './shared';

import { SparklesIcon, StarIcon, MapPinIcon, TruckIcon, ChevronDownIcon } from './classic/Icons';
import { ClassicTrustBar } from './classic/ClassicTrustBar';
import { ClassicHeader } from './classic/ClassicHeader';
import { ClassicHero } from './classic/ClassicHero';
import { ClassicSteps } from './classic/ClassicSteps';
import { ClassicProducts } from './classic/ClassicProducts';
import { ClassicInfo } from './classic/ClassicInfo';
import { ClassicAbout } from './classic/ClassicAbout';
import { ClassicFooter } from './classic/ClassicFooter';
import { ClassicTryOnSection } from './classic/ClassicTryOnSection';

// ── Main Template Component ───────────────────────────────────────────────────

interface TemplateClassicProps {
  brand: BrandData;
  products: ProductData[];
  brandSlug: string;
  footerUrl?: string;
  isPreview?: boolean;
}

export function TemplateClassic({ brand, products, brandSlug, footerUrl, isPreview = false }: TemplateClassicProps) {
  const theme = useLandingTheme(brand);
  const primary = theme.primary;
  const secondary = theme.secondary;
  const tryOnTheme = useContrastTheme(brand.widget_bg_color || '#0a0a0a', primary);
  const [selectedId, setSelectedId] = useState<string | null>(products?.[0]?.id || null);

  const handleProductClick = (id: string) => {
    setSelectedId(id);
    document.getElementById('probador')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div
      className={`min-h-screen bg-white flex flex-col
      ${brand.landing_font || 'font-jakarta'} overflow-x-hidden transition-colors duration-500 ${isPreview ? 'p-0 h-auto' : ''}`}
      style={{
        '--primary': primary,
        '--secondary': secondary,
        '--secondary-10': secondary + '1a',
        '--secondary-20': secondary + '33',
        '--secondary-05': secondary + '0d'
      } as React.CSSProperties}
    >
      <ClassicHeader brand={brand} primaryColor={primary} secondaryColor={secondary} onScrollDown={() => document.getElementById('productos')?.scrollIntoView({ behavior: 'smooth' })} />
      <ClassicHero brand={brand} primaryColor={primary} secondaryColor={secondary} onScrollDown={() => document.getElementById('productos')?.scrollIntoView({ behavior: 'smooth' })} isPreview={isPreview} />
      <ClassicTrustBar brand={brand} primaryColor={primary} />
      <ClassicSteps brand={brand} primaryColor={primary} secondaryColor={secondary} />
      <ClassicProducts products={products} brand={brand} primaryColor={primary} secondaryColor={secondary} onGenerate={handleProductClick} />
      <ClassicInfo brand={brand} primaryColor={primary} secondaryColor={secondary} />
      <ClassicAbout brand={brand} primaryColor={primary} />

      {/* Try-On Section */}
      <section id="probador" className="py-20 px-4 md:px-6" style={{ backgroundColor: brand.widget_bg_color || '#0a0a0a' }}>
        <div className="max-w-4xl mx-auto space-y-12 text-center">
          <div className="space-y-4">
            <span className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.4em]" style={{ color: secondary }}>
              <span className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: primary }} />
              Probador Virtual Premium
            </span>
            <h2 className="text-3xl md:text-4xl font-black tracking-tighter uppercase italic leading-none" style={{ color: tryOnTheme.text }}>Experiencia Inteligente</h2>
            <p className="text-sm font-medium" style={{ color: tryOnTheme.muted }}>Selecciona un producto y pruébatelo virtualmente con nuestra IA</p>
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
