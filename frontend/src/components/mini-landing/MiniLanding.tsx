'use client';

import { useState, useEffect } from 'react';
import { TemplateClassic } from './TemplateClassic';
import { TemplateEditorial } from './TemplateEditorial';
import { TemplateModerno } from './TemplateModerno';
import type { BrandData, ProductData, MiniLandingProps } from './shared';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.pruebalo.wilkiedevs.com';

export function MiniLanding({ brandSlug, initialData, footerUrl }: MiniLandingProps) {
  const [data, setData] = useState<{ brand: BrandData; products: ProductData[] } | null>(initialData);
  const [loading, setLoading] = useState(!initialData);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!initialData) {
      const fetchData = async () => {
        try {
          const res = await fetch(`${API_URL}/api/pruebalo/${brandSlug}`);
          if (!res.ok) throw new Error('No se pudo cargar la información de la marca');
          const result = await res.json();
          setData(result);
        } catch (err: any) {
          console.error('[MiniLanding] Error fetching data:', err);
          setError(err.message);
        } finally {
          setLoading(false);
        }
      };
      fetchData();
    }
  }, [brandSlug, initialData]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex flex-col items-center justify-center gap-4">
        <div className="w-12 h-12 border-4 border-[#FF5C3A] border-t-transparent rounded-full animate-spin" />
        <p className="text-[#FF5C3A] font-bold tracking-widest uppercase text-xs animate-pulse">Cargando experiencia...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex flex-col items-center justify-center p-6 text-center">
        <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mb-6">
          <svg className="w-10 h-10 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
        </div>
        <h2 className="text-2xl font-black text-white mb-2 italic uppercase">Oops! Página no encontrada</h2>
        <p className="text-gray-500 max-w-xs mx-auto mb-8">La marca "{brandSlug}" no existe o no tiene una página activa actualmente.</p>
        <a href="https://pruebalo.wilkiedevs.com" className="px-8 py-3 bg-[#FF5C3A] text-white rounded-full font-bold uppercase tracking-widest text-xs">Volver al inicio</a>
      </div>
    );
  }

  const { brand, products } = data;
  const template = brand.landing_template || 'classic';

  // Renderizar el template correspondiente
  switch (template) {
    case 'editorial':
      return <TemplateEditorial brand={brand} products={products} brandSlug={brandSlug} footerUrl={footerUrl} />;
    
    case 'moderno':
    case 'probador':
      return <TemplateModerno brand={brand} products={products} brandSlug={brandSlug} footerUrl={footerUrl} />;
    
    case 'classic':
    default:
      return <TemplateClassic brand={brand} products={products} brandSlug={brandSlug} footerUrl={footerUrl} />;
  }
}

