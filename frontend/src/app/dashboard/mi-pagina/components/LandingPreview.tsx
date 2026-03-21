import React from 'react';
import { TemplateClassic } from '@/components/mini-landing/TemplateClassic';
import { TemplateEditorial } from '@/components/mini-landing/TemplateEditorial';
import { TemplateModerno } from '@/components/mini-landing/TemplateModerno';

interface LandingPreviewProps {
  brandSlug: string;
  brand: any;
  products: any[];
}

export function LandingPreview({ brandSlug, brand, products }: LandingPreviewProps) {
  const template = brand.landing_template || 'classic';

  return (
    <div className="w-full bg-white min-h-full">
      {/* Contenedor con escala para simular mobile perfectamente en el preview */}
      <div className="origin-top transition-all duration-500">
        {template === 'classic' && (
          <TemplateClassic 
            brandSlug={brandSlug} 
            brand={brand} 
            products={products} 
          />
        )}
        {template === 'editorial' && (
          <TemplateEditorial 
            brandSlug={brandSlug} 
            brand={brand} 
            products={products} 
          />
        )}
        {template === 'moderno' && (
          <TemplateModerno 
            brandSlug={brandSlug} 
            brand={brand} 
            products={products} 
          />
        )}
      </div>
    </div>
  );
}
