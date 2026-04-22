'use client';

import { motion } from 'framer-motion';
import type { TryOnTemplateProps, Product } from '../types';

interface MobileProductGridProps {
  products: Product[];
  selectedProduct: Product | null;
  generatedProducts: Map<string, string>;
  onProductSelect: (p: Product) => void;
  onProceedToUpload?: () => void;
  onReset: () => void;
  selfiePreview: string | null;
  primaryColor: string;
  primaryGlow: string;
  primarySubtle: string;
  mainTextPrimary: string;
  mainTextMuted: string;
  mainCardBg: string;
  buttonText?: string;
}

export function MobileProductGrid({
  products,
  selectedProduct,
  generatedProducts,
  onProductSelect,
  onProceedToUpload,
  onReset,
  selfiePreview,
  primaryColor,
  primaryGlow,
  primarySubtle,
  mainTextPrimary,
  mainTextMuted,
  mainCardBg,
  buttonText,
}: MobileProductGridProps) {
  return (
    <div className="space-y-3">
      {/* Selfie Preview Card */}
      {selfiePreview && (
        <div 
          className="relative p-3 rounded-xl shadow-md"
          style={{ 
            background: `linear-gradient(135deg, ${primarySubtle} 0%, ${mainCardBg} 100%)`,
            border: `1px solid ${primaryColor}30`
          }}
        >
          <div className="flex items-center gap-2.5">
            <img 
              src={selfiePreview} 
              alt="Tu foto" 
              className="w-11 h-11 rounded-lg object-cover shadow ring-2 ring-white/20" 
            />
            <div className="flex-1">
              <p className="text-[10px] font-black uppercase italic" style={{ color: primaryColor }}>Foto lista</p>
              <p className="text-[9px] font-medium mt-0.5" style={{ color: mainTextMuted }}>Selecciona un producto</p>
            </div>
            <button
              onClick={onReset}
              className="text-[8px] font-bold uppercase tracking-wider px-2 py-1 rounded-lg"
              style={{ 
                color: mainTextMuted,
                backgroundColor: 'rgba(0,0,0,0.05)'
              }}
            >
              Cambiar
            </button>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between gap-2 mr-2">
        <div className="flex items-center gap-2">
          <div className="w-1 h-5 rounded-full" style={{ backgroundColor: primaryColor }} />
          <p className="text-xs font-black uppercase tracking-widest" style={{ color: mainTextPrimary }}>
            Catálogo
          </p>
        </div>
        <p className="text-[10px] font-medium" style={{ color: mainTextMuted }}>
          {products.length} {products.length === 1 ? 'producto' : 'productos'}
        </p>
      </div>

      {/* Products Grid */}
      <div className="grid grid-cols-2 gap-2">
        {products.length > 0 ? (
          products.map((p, idx) => {
            const isSelected = selectedProduct?.id === p.id;
            const wasGenerated = generatedProducts.has(p.id);
            
            return (
              <motion.button
                key={p.id}
                onClick={() => onProductSelect(p)}
                whileTap={{ scale: 0.97 }}
                whileHover={{ scale: 1.02 }}
                transition={{ type: "spring", stiffness: 400, damping: 25 }}
                className={`relative rounded-2xl overflow-hidden transition-all duration-300 ${
                  isSelected ? 'ring-2 shadow-xl' : ''
                }`}
                style={{
                  animationDelay: `${idx * 40}ms`,
                  '--ring-color': primaryColor,
                  scale: isSelected ? 1.03 : 1,
                } as React.CSSProperties}
              >
                {/* Glow effect when selected */}
                {isSelected && (
                  <motion.div 
                    className="absolute inset-0 -z-10"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    style={{ 
                      background: `radial-gradient(circle at center, ${primaryGlow}, transparent 70%)`,
                      filter: 'blur(15px)'
                    }}
                  />
                )}
                
                <div 
                  className="rounded-2xl overflow-hidden"
                  style={{ 
                    backgroundColor: mainCardBg,
                    boxShadow: isSelected 
                      ? `0 8px 30px ${primaryGlow}, 0 0 0 2px ${primaryColor}` 
                      : '0 4px 15px rgba(0,0,0,0.1)',
                  }}
                >
                  <div className="relative aspect-square overflow-hidden">
                    <img 
                      src={p.imageUrl} 
                      alt={p.name} 
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" 
                    />
                    
                    {/* Badges */}
                    <div className="absolute top-2 left-2 flex flex-col gap-1">
                      {wasGenerated && !isSelected && (
                        <div className="w-5 h-5 rounded-full flex items-center justify-center shadow-md" style={{ backgroundColor: primaryColor }}>
                          <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                      )}
                    </div>
                    
                    {isSelected && (
                      <div className="absolute inset-0 flex items-center justify-center" style={{ backgroundColor: `${primaryColor}20` }}>
                        <div className="w-10 h-10 rounded-full flex items-center justify-center shadow-lg" style={{ backgroundColor: primaryColor }}>
                          <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <div className="p-2">
                    <div className="flex items-center justify-between gap-1">
                      <p 
                        className="text-[11px] font-black uppercase italic truncate tracking-tight flex-1"
                        style={{ color: isSelected ? primaryColor : mainTextPrimary }}
                      >
                        {p.name}
                      </p>
                      {p.price != null && (
                        <span className="text-[10px] font-black" style={{ color: primaryColor }}>$</span>
                      )}
                    </div>
                    {p.category && (
                      <p className="text-[9px] font-bold uppercase tracking-wider opacity-60 mt-0.5" style={{ color: mainTextMuted }}>
                        {p.category}
                      </p>
                    )}
                    {p.price != null && (
                      <p className="text-[10px] font-black" style={{ color: mainTextMuted }}>
                        ${p.price.toLocaleString('es-CO')}
                      </p>
                    )}
                    {p.shortDescription && (
                      <p className="text-[8px] truncate mt-0.5" style={{ color: mainTextMuted }}>{p.shortDescription}</p>
                    )}
                    {p.badge && (
                      <span className="inline-block mt-1 px-1.5 py-0.5 rounded text-[7px] font-black uppercase tracking-widest text-white"
                        style={{ background: p.badge === 'nuevo' ? '#10B981' : p.badge === 'top' ? '#F59E0B' : '#EF4444' }}>
                        {p.badge}
                      </span>
                    )}
                    {p.attributes && Object.keys(p.attributes).length > 0 && (
                      <div className="mt-1.5 flex flex-wrap gap-1">
                        {p.attributes.material && (
                          <span className="text-[8px] px-1.5 py-0.5 rounded" style={{ color: mainTextMuted, backgroundColor: 'rgba(0,0,0,0.05)' }}>{p.attributes.material}</span>
                        )}
                        {p.attributes.medida_pulgadas && (
                          <span className="text-[8px] px-1.5 py-0.5 rounded" style={{ color: mainTextMuted, backgroundColor: 'rgba(0,0,0,0.05)' }}>{p.attributes.medida_pulgadas}&quot;</span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </motion.button>
            );
          })
        ) : (
          <div className="col-span-2 text-center py-12">
            <div className="w-16 h-16 mx-auto rounded-2xl flex items-center justify-center mb-4" style={{ backgroundColor: mainCardBg }}>
              <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} style={{ color: mainTextMuted }}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            </div>
            <p className="text-sm font-medium" style={{ color: mainTextMuted }}>No hay productos cargados</p>
          </div>
        )}
      </div>

      {/* Floating "Siguiente" Button for Mobile */}
      {selectedProduct && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, type: "spring", stiffness: 300, damping: 25 }}
          className="sticky bottom-4 left-0 right-0 z-50 flex justify-center px-4 mt-4"
          style={{
            paddingLeft: 'calc(1rem + env(safe-area-inset-left))',
            paddingRight: 'calc(1rem + env(safe-area-inset-right))',
          }}
        >
          <motion.button
            onClick={onProceedToUpload}
            whileTap={{ scale: 0.97 }}
            whileHover={{ scale: 1.02 }}
            transition={{ type: "spring", stiffness: 400, damping: 25 }}
            className="w-full flex items-center justify-between px-6 py-4 rounded-2xl font-black uppercase italic tracking-wider text-sm text-white shadow-2xl transition-all duration-200 relative overflow-hidden group"
            style={{ 
              backgroundColor: primaryColor,
              boxShadow: `0 10px 40px ${primaryGlow}`,
            }}
          >
            <motion.div 
              className="absolute inset-0 bg-white/20"
              initial={{ y: "100%" }}
              whileHover={{ y: "0%" }}
              transition={{ duration: 0.3 }}
            />
            <div className="flex flex-col items-start leading-tight min-w-0 relative z-10">
              <span className="text-[10px] opacity-70 not-italic">Siguiente paso</span>
              <span className="truncate max-w-[140px] font-bold">{buttonText || 'Continuar'}</span>
            </div>
            <motion.div 
              className="flex items-center gap-2 flex-shrink-0 relative z-10"
              whileHover={{ x: 4 }}
              transition={{ type: "spring", stiffness: 400 }}
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7-7 7" />
              </svg>
            </motion.div>
          </motion.button>
        </motion.div>
      )}
    </div>
  );
}
