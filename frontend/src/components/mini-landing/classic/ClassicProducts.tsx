'use client';

import React, { useState, useMemo } from 'react';
import { BrandData, ProductData } from '../shared';
import { useLandingTheme, useContrastTheme, getSmartBorderColor } from '../shared';
import { SparklesIcon } from './Icons';

interface ClassicProductsProps {
  brand: BrandData;
  primaryColor: string;
  secondaryColor: string;
  products: ProductData[];
  onGenerate?: (productId: string) => void;
}

export function ClassicProducts({ brand, primaryColor, secondaryColor, products, onGenerate }: ClassicProductsProps) {
  const theme = useLandingTheme(brand);
  const localTheme = useContrastTheme(theme.productsBg, primaryColor);
  const [activeFilter, setActiveFilter] = useState<string>('all');

  const filters = useMemo(() => {
    const cats = Array.from(new Set(products.map(p => p.category).filter(Boolean)));
    return ['all', ...cats];
  }, [products]);

  const filtered = useMemo(() => {
    const list = activeFilter === 'all' ? products : products.filter(p => p.category === activeFilter);
    return [...list].sort((a, b) => a.name.localeCompare(b.name));
  }, [products, activeFilter]);

  if (products.length === 0) {
    return (
      <section id="productos" className="py-20 px-6 border-b" style={{ backgroundColor: theme.productsBg, borderColor: getSmartBorderColor(theme.productsBg) }}>
        <div className="max-w-6xl mx-auto text-center py-16">
          <p className="text-sm font-bold uppercase tracking-widest" style={{ color: localTheme.muted }}>No hay productos disponibles</p>
        </div>
      </section>
    );
  }

  return (
    <section id="productos" className="py-20 px-6 border-b" style={{ backgroundColor: theme.productsBg, borderColor: getSmartBorderColor(theme.productsBg) }}>
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div className="space-y-3">
            <span className="text-xs font-bold uppercase tracking-[0.3em]" style={{ color: secondaryColor || primaryColor }}>Catálogo</span>
            <h2 className="text-3xl md:text-5xl font-black tracking-tighter uppercase italic leading-none" style={{ color: localTheme.text }}>
              Nuestros<br className="md:hidden" /> Productos
            </h2>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3 mb-10">
          {filters.map(f => (
            <button
              key={f}
              onClick={() => setActiveFilter(f)}
              className="px-5 py-2 rounded-full text-xs font-bold uppercase tracking-wider transition-all duration-300"
              style={{
                backgroundColor: activeFilter === f ? primaryColor : 'transparent',
                color: activeFilter === f ? '#fff' : localTheme.text,
                border: `1px solid ${activeFilter === f ? primaryColor : getSmartBorderColor(theme.productsBg)}`,
              }}
            >
              {f === 'all' ? 'Todos' : f}
            </button>
          ))}
        </div>

        {/* Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
          {filtered.map(product => (
            <article key={product.id} className="group relative rounded-2xl overflow-hidden transition-all duration-500 hover:shadow-2xl hover:scale-[1.03]" style={{ backgroundColor: `${primaryColor}05`, border: `1px solid ${getSmartBorderColor(theme.productsBg)}` }}>
              {/* Image */}
              <div className="aspect-[3/4] overflow-hidden bg-center bg-cover" style={{ backgroundImage: product.image_url ? `url(${product.image_url})` : undefined, backgroundColor: `${primaryColor}10` }}>
                {!product.image_url && (
                  <div className="w-full h-full flex items-center justify-center">
                    <span className="text-4xl" style={{ color: `${primaryColor}30` }}>👗</span>
                  </div>
                )}
                {/* Overlay on hover */}
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center" style={{ backgroundColor: `${primaryColor}90` }}>
                  <button
                    onClick={() => onGenerate?.(product.id)}
                    className="flex items-center gap-2 px-5 py-3 rounded-full text-sm font-bold uppercase tracking-wider text-white hover:scale-105 transition-transform"
                    style={{ backgroundColor: '#fff', color: primaryColor }}
                  >
                    <SparklesIcon className="w-4 h-4" />
                    Probar IA
                  </button>
                </div>
              </div>
              {/* Info */}
              <div className="p-4 space-y-1">
                <p className="text-xs font-bold uppercase tracking-widest truncate" style={{ color: localTheme.muted }}>{product.category}</p>
                <h3 className="font-black italic text-sm md:text-base leading-tight truncate" style={{ color: localTheme.text }}>{product.name}</h3>
              </div>
            </article>
          ))}
        </div>

        {/* Count */}
        <p className="text-center text-sm font-bold mt-8 uppercase tracking-widest" style={{ color: localTheme.muted }}>
          Mostrando {filtered.length} de {products.length} productos
        </p>
      </div>
    </section>
  );
}
