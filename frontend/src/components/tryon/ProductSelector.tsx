'use client';

import React, { useState, useEffect, useRef } from 'react';

interface Product {
  id: string;
  name: string;
  imageUrl: string;
  category: string;
}

interface ProductSelectorProps {
  products: Product[];
  selectedProduct: Product | null;
  onSelect: (product: Product) => void;
  primaryColor: string;
}

function ProductImage({ src, alt }: { src: string; alt: string }) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInView, setIsInView] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ref.current) return;
    const observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) { setIsInView(true); observer.disconnect(); }
    }, { rootMargin: '50px' });
    observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={ref} className="aspect-square bg-gray-100 relative overflow-hidden">
      {!isLoaded && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-6 h-6 border-2 border-gray-200 border-t-gray-400 rounded-full animate-spin" />
        </div>
      )}
      {isInView && (
        <img src={src} alt={alt} className={`w-full h-full object-cover transition-opacity duration-300 ${isLoaded ? 'opacity-100' : 'opacity-0'}`}
          onLoad={() => setIsLoaded(true)} loading="lazy" />
      )}
    </div>
  );
}

export function ProductSelector({ products, selectedProduct, onSelect, primaryColor }: ProductSelectorProps) {
  if (products.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="w-14 h-14 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-3">
          <svg className="w-7 h-7 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
          </svg>
        </div>
        <p className="text-gray-500">No hay productos disponibles</p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-4">
        <h2 className="text-lg font-bold text-gray-900">Elige un producto</h2>
        <p className="text-sm text-gray-500 mt-0.5">{products.length} producto{products.length !== 1 ? 's' : ''} disponible{products.length !== 1 ? 's' : ''}</p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {products.map((product) => {
          const isSelected = selectedProduct?.id === product.id;
          return (
            <div
              key={product.id}
              onClick={() => onSelect(product)}
              className={`cursor-pointer rounded-2xl overflow-hidden transition-all duration-200 bg-white border-2 ${
                isSelected ? 'shadow-lg scale-[1.02]' : 'border-gray-100 hover:border-gray-200 hover:shadow-md'
              }`}
              style={isSelected ? { borderColor: primaryColor, boxShadow: `0 4px 20px ${primaryColor}30` } : {}}
            >
              <div className="relative">
                <ProductImage src={product.imageUrl} alt={product.name} />
                {isSelected && (
                  <div className="absolute top-2 right-2 w-6 h-6 rounded-full flex items-center justify-center text-white shadow-md" style={{ backgroundColor: primaryColor }}>
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                  </div>
                )}
              </div>
              <div className="p-2.5">
                <h3 className="font-semibold text-sm text-gray-900 truncate">{product.name}</h3>
                {product.category && (
                  <span className="inline-block mt-1 text-xs px-2 py-0.5 bg-gray-100 text-gray-500 rounded-full capitalize">{product.category}</span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
