'use client';

import type { TryOnTemplateProps, Product } from '../types';

interface SidebarProductListProps {
  products: Product[];
  selectedProduct: Product | null;
  generatedProducts: Map<string, string>;
  onProductSelect: (p: Product) => void;
  primaryColor: string;
  sidebarLuminance: boolean;
  sidebarText: string;
  sidebarSubtle: string;
  sidebarMuted: string;
  primaryGlow: string;
  secondaryColor: string;
}

export function SidebarProductList({
  products,
  selectedProduct,
  generatedProducts,
  onProductSelect,
  primaryColor,
  sidebarLuminance,
  sidebarText,
  sidebarSubtle,
  sidebarMuted,
  primaryGlow,
  secondaryColor,
}: SidebarProductListProps) {
  return (
    <div className="flex-1 overflow-y-auto px-3 pb-8 space-y-2 relative scrollbar-thin scrollbar-thumb-white/10 hover:scrollbar-thumb-white/20">
      <div className="sticky top-0 z-20 py-2 px-2 mb-1.5" style={{ backgroundColor: secondaryColor }}>
        <p className="text-[9px] font-bold uppercase tracking-[0.15em] flex items-center gap-1" style={{ color: sidebarMuted }}>
          <svg className="w-3 h-3" style={{ color: primaryColor }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 14l-7 7m0 0l-7-7m7 7V3" />
          </svg>
          Elige una prenda
        </p>
      </div>
      {products.map((p, idx) => {
        const isSelected = selectedProduct?.id === p.id;
        const wasGenerated = generatedProducts.has(p.id);
        
        return (
          <button
            key={p.id}
            onClick={() => onProductSelect(p)}
            className={`w-full flex items-center gap-3 p-3 rounded-2xl text-left cursor-pointer transition-all duration-300 group active:scale-95 ${
              isSelected ? 'shadow-xl ring-2' : 'hover:shadow-md'
            }`}
            style={{
              backgroundColor: isSelected 
                ? `${primaryColor}25` 
                : (sidebarLuminance ? 'rgba(0,0,0,0.03)' : 'rgba(255,255,255,0.05)'),
              animationDelay: `${idx * 30}ms`,
              transform: isSelected ? 'translateX(4px)' : 'none',
              borderColor: isSelected ? primaryColor : (sidebarLuminance ? 'rgba(0,0,0,0.05)' : 'rgba(255,255,255,0.05)'),
            }}
          >
            <div className="relative">
              <img 
                src={p.imageUrl} 
                alt={p.name} 
                className="w-12 h-12 rounded-xl object-cover shadow-md transition-all"
                style={{ 
                  boxShadow: isSelected ? `0 4px 12px ${primaryGlow}, 0 0 0 2px ${primaryColor}` : '0 2px 8px rgba(0,0,0,0.2)'
                }} 
              />
              {wasGenerated && !isSelected && (
                <div 
                  className="absolute -top-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center shadow-md"
                  style={{ backgroundColor: primaryColor }}
                >
                  <svg className="w-2 h-2 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              )}
            </div>
            
            <div className="flex-1 min-w-0">
              <p className="text-[11px] font-black uppercase italic truncate tracking-tight" style={{ color: sidebarText }}>{p.name}</p>
              <div className="flex items-center gap-1 mt-0.5">
                {p.category && (
                  <span className="text-[9px] truncate tracking-wider uppercase opacity-70" style={{ color: sidebarSubtle }}>{p.category}</span>
                )}
                {p.price != null && (
                  <span className="text-[9px] font-black" style={{ color: primaryColor }}>${p.price.toLocaleString('es-CO')}</span>
                )}
              </div>
              {p.shortDescription && (
                <p className="text-[8px] truncate mt-0.5" style={{ color: sidebarMuted }}>{p.shortDescription}</p>
              )}
              {p.badge && (
                <span className="inline-block mt-1 px-1.5 py-0.5 rounded text-[7px] font-black uppercase tracking-widest text-white"
                  style={{ background: p.badge === 'nuevo' ? '#10B981' : p.badge === 'top' ? '#F59E0B' : '#EF4444' }}>
                  {p.badge}
                </span>
              )}
            </div>
            
            {isSelected && (
              <div 
                className="w-6 h-6 rounded-full flex items-center justify-center shadow-md animate-pulse"
                style={{ backgroundColor: primaryColor }}
              >
                <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
            )}
          </button>
        );
      })}
    </div>
  );
}
