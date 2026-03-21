'use client';

import { TemplateClassic } from './TemplateClassic';
import { TemplateEditorial } from './TemplateEditorial';
import { TemplateModerno } from './TemplateModerno';
import type { BrandData, ProductData } from './shared';

interface MiniLandingProps {
  brandSlug: string;
  initialData: { brand: BrandData; products: ProductData[] } | null;
  footerUrl?: string;
}

export function MiniLanding({ brandSlug, initialData, footerUrl }: MiniLandingProps) {
  if (!initialData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-gray-600">Cargando...</p>
      </div>
    );
  }

  const { brand, products } = initialData;
  const template = brand.landing_template || 'classic';

  // Renderizar el template correspondiente
  switch (template) {
    case 'editorial':
      return <TemplateEditorial brand={brand} products={products} brandSlug={brandSlug} footerUrl={footerUrl} />;
    
    case 'moderno':
      return <TemplateModerno brand={brand} products={products} brandSlug={brandSlug} footerUrl={footerUrl} />;
    
    case 'classic':
    default:
      return <TemplateClassic brand={brand} products={products} brandSlug={brandSlug} footerUrl={footerUrl} />;
  }
}
