'use client';

import { motion } from 'framer-motion';
import type { Product } from '../types';

interface ProductGridEditorialProps {
  products: Product[];
  selected: Product | null;
  onSelect: (p: Product) => void;
  primaryColor: string;
  generatedProducts: Map<string, string>;
  cardBg: string;
  bgLuminance: boolean;
  textPrimary: string;
  textMuted: string;
  isSmall: boolean;
}

export function ProductGridEditorial({
  products,
  selected,
  onSelect,
  primaryColor,
  generatedProducts,
  cardBg,
  bgLuminance,
  textPrimary,
  textMuted,
  isSmall,
}: ProductGridEditorialProps) {
  if (products.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center py-16 space-y-4"
      >
        <motion.div
          className="w-16 h-16 mx-auto rounded-2xl bg-white/5 flex items-center justify-center"
          animate={{ y: [0, -8, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        >
          <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} style={{ color: textMuted }}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
          </svg>
        </motion.div>
        <p className="text-sm font-medium" style={{ color: textMuted }}>No hay productos disponibles</p>
        <p className="text-xs opacity-60" style={{ color: textMuted }}>Pronto añadiremos nuevas piezas a la colección</p>
      </motion.div>
    );
  }

  const gridClasses = isSmall
    ? "grid-cols-2 gap-3"
    : "grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4 lg:gap-6";

  return (
    <div className={`w-full grid ${gridClasses} pb-32`}>
      {products.map((p, index) => {
        const sel = selected?.id === p.id;
        const alreadyGenerated = generatedProducts.has(p.id);

        return (
          <motion.button
            key={p.id}
            onClick={() => onSelect(p)}
            className={`
              group relative w-full rounded-2xl overflow-hidden text-left transition-all duration-300
              ${sel ? 'ring-2' : 'hover:ring-1'}
            `}
            style={{
              animationDelay: `${index * 50}ms`,
              '--ring-color': primaryColor,
            } as React.CSSProperties}
            layout
            whileTap={{ scale: 0.97 }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
          >
            {/* Background glow cuando seleccionado */}
            {sel && (
              <div
                className="absolute inset-0 opacity-30"
                style={{ background: `radial-gradient(circle at center, ${primaryColor}40, transparent 70%)` }}
              />
            )}

            {/* Card */}
            <div
              className="relative rounded-2xl overflow-hidden"
              style={{
                backgroundColor: cardBg,
                boxShadow: sel
                  ? `0 8px 32px ${primaryColor}30, 0 0 0 2px ${primaryColor}`
                  : '0 4px 16px rgba(0,0,0,0.1)',
              }}
            >
              {/* Imagen */}
              <div className="relative aspect-square overflow-hidden">
                <img
                  src={p.imageUrl}
                  alt={p.name}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                />

                {/* Overlay gradient */}
                <div
                  className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 md:opacity-0"
                  style={{ background: `linear-gradient(to top, ${primaryColor}30, transparent 50%)` }}
                />

                {/* Badges */}
                <div className="absolute top-2 left-2 flex flex-col gap-1">
                  {p.badge && (
                    <span className="px-2 py-0.5 rounded text-[7px] font-black uppercase tracking-widest text-white shadow-lg"
                      style={{ background: p.badge === 'nuevo' ? '#10B981' : p.badge === 'top' ? '#F59E0B' : '#EF4444' }}>
                      {p.badge}
                    </span>
                  )}
                  {alreadyGenerated && !sel && (
                    <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full flex items-center justify-center shadow-md" style={{ backgroundColor: primaryColor }}>
                      <svg className="w-2.5 sm:w-3 h-2.5 sm:h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  )}
                  {sel && (
                    <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full flex items-center justify-center shadow-md" style={{ backgroundColor: primaryColor }}>
                      <svg className="w-2.5 sm:w-3 h-2.5 sm:h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  )}
                </div>

                {/* Precio */}
                {p.price != null && (
                  <div className="absolute top-2 right-2">
                    <span className="px-2 py-1 rounded-lg text-[10px] font-black text-white shadow-lg"
                      style={{ backgroundColor: 'rgba(0,0,0,0.85)' }}>
                      ${p.price.toLocaleString('es-CO')}
                    </span>
                  </div>
                )}

                {/* Nombre en overlay - solo visible en hover para tablet+ */}
                <div
                  className="hidden md:block absolute bottom-0 left-0 right-0 p-2 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-1 group-hover:translate-y-0"
                  style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.7), transparent)' }}
                >
                  <p className="text-[10px] font-black uppercase italic tracking-tight text-white truncate">
                    {p.name}
                  </p>
                </div>
              </div>

              {/* Footer */}
              <div className="p-2 sm:p-3 md:p-4" style={{ backgroundColor: cardBg }}>
                <p
                  className={`text-[10px] sm:text-[11px] font-black uppercase italic tracking-tight truncate leading-tight transition-colors ${sel ? '' : 'group-hover:text-opacity-70'
                    }`}
                  style={{ color: sel ? primaryColor : textPrimary }}
                >
                  {p.name}
                </p>

                <div className="flex items-center justify-between gap-1 mt-1">
                  {p.category && (
                    <span className="px-1.5 py-0.5 rounded text-[8px] font-semibold uppercase tracking-wider bg-black/10" style={{ color: textMuted }}>
                      {p.category}
                    </span>
                  )}
                  {p.shortDescription && (
                    <span className="text-[8px] truncate max-w-[60%]" style={{ color: textMuted }}>{p.shortDescription}</span>
                  )}
                </div>

                {p.attributes && Object.keys(p.attributes).length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {p.attributes.material && (
                      <span className="text-[8px] px-1.5 py-0.5 rounded" style={{ color: textMuted, backgroundColor: 'rgba(0,0,0,0.05)' }}>{p.attributes.material}</span>
                    )}
                    {p.attributes.medida_pulgadas && (
                      <span className="text-[8px] px-1.5 py-0.5 rounded" style={{ color: textMuted, backgroundColor: 'rgba(0,0,0,0.05)' }}>{p.attributes.medida_pulgadas}&quot;</span>
                    )}
                    {p.attributes.marca && (
                      <span className="text-[8px] px-1.5 py-0.5 rounded" style={{ color: textMuted, backgroundColor: 'rgba(0,0,0,0.05)' }}>{p.attributes.marca}</span>
                    )}
                    {p.attributes.tallas && Array.isArray(p.attributes.tallas) && (
                      <span className="text-[8px] px-1.5 py-0.5 rounded" style={{ color: textMuted, backgroundColor: 'rgba(0,0,0,0.05)' }}>{p.attributes.tallas.slice(0, 3).join(', ')}</span>
                    )}
                  </div>
                )}
              </div>
            </div>
          </motion.button>
        );
      })}
    </div>
  );
}
