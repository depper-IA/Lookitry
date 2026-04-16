'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Product } from '@/types';
import { 
  Edit3, 
  Trash2, 
  Package,
  Sparkles,
  Gauge,
  Check,
  Layers,
  Star,
  Plus,
  X
} from 'lucide-react';

import { getProxiedUrl } from '@/utils/imageProxy';

export type ViewMode = 'grid' | 'thumbnails' | 'list';

interface ProductListProps {
  products: Product[];
  viewMode?: ViewMode;
  onEdit: (product: Product) => void;
  onDelete: (productId: string) => void;
  widgetProductIds?: string[];
  onAddToWidget?: (productId: string) => void;
  onRemoveFromWidget?: (productId: string) => void;
  canAddToWidget?: boolean;
}

// ═══════════════════════════════════════════════════════════════════════════════
// BRAND DESIGN TOKENS - Lookitry Premium (Dark/Light Mode)
// ═══════════════════════════════════════════════════════════════════════════════
const DESIGN = {
  accent: '#FF5C3A',
  accentGlow: 'rgba(255, 92, 58, 0.25)',
  accentSubtle: 'rgba(255, 92, 58, 0.1)',
  
  // Status
  success: '#10B981',
  successGlow: 'rgba(16, 185, 129, 0.3)',
  danger: '#EF4444',
  
  // Effects
  shadowCard: '0 8px 32px rgba(0, 0, 0, 0.3), 0 2px 8px rgba(0, 0, 0, 0.15)',
  shadowHover: '0 20px 60px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(255, 92, 58, 0.2)',
  
  // Timing
  fast: '150ms',
  normal: '300ms',
};

const CATEGORY_STYLES: Record<string, { bg: string; icon: React.ReactNode }> = {
  rines: { bg: 'linear-gradient(135deg, #1E293B 0%, #0F172A 100%)', icon: <Gauge className="w-3 h-3" /> },
  tshirt: { bg: 'linear-gradient(135deg, #3F3F46 0%, #27272A 100%)', icon: <Layers className="w-3 h-3" /> },
  camisa: { bg: 'linear-gradient(135deg, #78350F 0%, #451A03 100%)', icon: <Star className="w-3 h-3" /> },
  vestido: { bg: 'linear-gradient(135deg, #4C1D95 0%, #2E1065 100%)', icon: <Sparkles className="w-3 h-3" /> },
  zapatos: { bg: 'linear-gradient(135deg, #166534 0%, #14532D 100%)', icon: <Star className="w-3 h-3" /> },
  default: { bg: 'linear-gradient(135deg, #3F3F46 0%, #27272A 100%)', icon: <Sparkles className="w-3 h-3" /> },
};

const BADGE_STYLES: Record<string, { bg: string; shadow: string; dot: string }> = {
  nuevo: { bg: 'linear-gradient(135deg, #10B981 0%, #059669 100%)', shadow: DESIGN.successGlow, dot: '#34D399' },
  top: { bg: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)', shadow: 'rgba(245, 158, 11, 0.3)', dot: '#FCD34D' },
  oferta: { bg: 'linear-gradient(135deg, #EF4444 0%, #DC2626 100%)', shadow: 'rgba(239, 68, 68, 0.3)', dot: '#FCA5A5' },
};

const CATEGORY_UNITS: Record<string, string> = {
  rines: 'set de 4',
  camisas: 'por unidad',
  default: '',
};

// ═══════════════════════════════════════════════════════════════════════════════
// SUB-COMPONENTS (Using CSS Variables for Dark/Light)
// ═══════════════════════════════════════════════════════════════════════════════

function CategoryBadge({ category }: { category: string }) {
  const style = CATEGORY_STYLES[category.toLowerCase()] || CATEGORY_STYLES.default;
  return (
    <div 
      className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-white/90 text-[9px] font-semibold uppercase tracking-wider"
      style={{ background: style.bg, boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.1), 0 2px 8px rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.08)' }}
    >
      {style.icon}
      {category}
    </div>
  );
}

function ProductBadge({ type }: { type: string }) {
  const style = BADGE_STYLES[type.toLowerCase()] || BADGE_STYLES.nuevo;
  return (
    <div 
      className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-white text-[9px] font-bold uppercase tracking-wider"
      style={{ background: style.bg, boxShadow: `inset 0 1px 0 rgba(255,255,255,0.2), 0 2px 12px ${style.shadow}`, border: '1px solid rgba(255,255,255,0.1)' }}
    >
      <div className="w-1.5 h-1.5 rounded-full" style={{ background: style.dot, boxShadow: `0 0 6px ${style.dot}` }} />
      {type}
    </div>
  );
}

function ActiveStatus() {
  return (
    <div className="flex items-center gap-1.5">
      <div className="w-2 h-2 rounded-full animate-pulse" style={{ background: DESIGN.success, boxShadow: `0 0 8px ${DESIGN.success}, 0 0 16px ${DESIGN.successGlow}` }} />
      <span className="text-[9px] font-semibold uppercase tracking-wider" style={{ color: DESIGN.success }}>Activo</span>
    </div>
  );
}

function PriceTag({ price, category }: { price: number; category: string }) {
  const unit = CATEGORY_UNITS[category.toLowerCase()] || CATEGORY_UNITS.default;
  return (
    <div className="text-right shrink-0 min-w-0">
      {unit && <p className="text-[9px] mb-0.5 font-medium truncate" style={{ color: 'var(--text-muted)' }}>{unit}</p>}
      <p className="text-lg md:text-xl font-black tracking-tight truncate" style={{ color: DESIGN.accent, textShadow: `0 0 20px ${DESIGN.accentGlow}` }}>
        ${price.toLocaleString('es-CO')}
      </p>
    </div>
  );
}

// Technical Line - Core specs in one line (no duplicates)
function TechLine({ attributes }: { attributes: Record<string, any> }) {
  if (!attributes || Object.keys(attributes).length === 0) return null;
  const parts: string[] = [];
  if (attributes.material) parts.push(attributes.material);
  if (attributes.medida_pulgadas) parts.push(attributes.medida_pulgadas + '"');
  if (attributes.marca) parts.push(attributes.marca);
  if (parts.length === 0) return null;
  return <p className="text-[10px] font-medium tracking-wide truncate" style={{ color: 'var(--text-muted)' }}>{parts.join(' · ')}</p>;
}

// Attribute Pills - ONLY pills, NO duplicates with TechLine
function AttrPills({ attributes }: { attributes: Record<string, any> }) {
  if (!attributes || Object.keys(attributes).length === 0) return null;
  const pills: string[] = [];
  // These are pills ONLY (not shown in TechLine)
  if (attributes.finish) pills.push(attributes.finish);
  if (attributes.peso) pills.push(attributes.peso + 'kg');
  if (attributes.tallas && Array.isArray(attributes.tallas)) pills.push(attributes.tallas.slice(0, 4).join(', '));
  if (attributes.color && !attributes.material) pills.push(attributes.color); // Only if no material
  if (pills.length === 0) return null;
  return (
    <div className="flex flex-wrap gap-1.5">
      {pills.map((pill, i) => (
        <span key={i} className="px-2 py-0.5 rounded text-[8px] font-semibold uppercase tracking-wide"
          style={{ background: 'var(--pill-bg)', color: 'var(--pill-text)', border: '1px solid var(--pill-border)' }}>
          {pill}
        </span>
      ))}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// PRODUCT CARD
// ═══════════════════════════════════════════════════════════════════════════════

interface ProductCardProps {
  product: Product;
  variant: 'grid' | 'thumbnails' | 'list';
  onEdit: () => void;
  onDelete: () => void;
  index: number;
  isInWidget?: boolean;
  onAddToWidget?: () => void;
  canAddToWidget?: boolean;
}

function ProductCard({ product, variant, onEdit, onDelete, index, isInWidget, onAddToWidget, canAddToWidget }: ProductCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  
  const isGrid = variant === 'grid';
  const isThumb = variant === 'thumbnails';
  const isList = variant === 'list';
  const cardHeight = isGrid ? 'min-h-[480px]' : isThumb ? 'min-h-[400px] md:min-h-[480px]' : '';
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.96 }}
      transition={{ duration: 0.4, delay: index * 0.05, ease: [0.25, 0.46, 0.45, 0.94] }}
      className="group relative"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{ height: cardHeight, display: 'flex', flexDirection: 'column' }}
    >
      {/* Ambient Glow */}
      <div className="absolute -inset-1 rounded-3xl pointer-events-none transition-opacity duration-500" style={{ opacity: isHovered ? 1 : 0, background: `radial-gradient(ellipse at 50% 0%, ${DESIGN.accentGlow} 0%, transparent 60%)` }} />

      {/* Card Container */}
      <div className="relative flex flex-col rounded-2xl overflow-hidden flex-1"
        style={{
          background: 'var(--card-bg)',
          border: '1px solid var(--card-border)',
          boxShadow: isHovered ? DESIGN.shadowHover : DESIGN.shadowCard,
          transition: `all ${DESIGN.normal} ease`
        }}
      >
        {/* Image */}
        <div className={`relative overflow-hidden ${isList ? 'aspect-[1/1] h-20' : isThumb ? 'aspect-[4/5]' : 'aspect-square'} flex-shrink-0`}>
          {!imageLoaded && <div className="absolute inset-0 animate-pulse" style={{ background: 'var(--skeleton-bg)' }} />}
          <img src={getProxiedUrl(product.imageUrl)} alt={product.name} className="w-full h-full object-cover transition-transform duration-700 ease-out"
            style={{ transform: isHovered ? 'scale(1.08)' : 'scale(1)', opacity: imageLoaded ? 1 : 0 }}
            onLoad={() => setImageLoaded(true)} />
          <div className="absolute inset-0 pointer-events-none" style={{ background: 'linear-gradient(to top, var(--overlay-dark) 0%, transparent 60%)' }} />
          <div className="absolute inset-0 pointer-events-none transition-opacity duration-500" style={{ opacity: isHovered ? 0.6 : 0, background: `radial-gradient(ellipse at 30% 70%, ${DESIGN.accentGlow} 0%, transparent 50%)` }} />

          {/* Badges */}
          <div className="absolute top-3 left-3 flex flex-col gap-1.5">
            {product.badge && <ProductBadge type={product.badge} />}
            {!isList && <CategoryBadge category={product.category} />}
          </div>

          {/* Status */}
          <div className="absolute top-3 right-3" style={{ transform: isHovered ? 'scale(1.1)' : 'scale(1)', transition: `transform ${DESIGN.fast} ease` }}>
            <div className="w-8 h-8 rounded-full flex items-center justify-center backdrop-blur-md" style={{ background: 'rgba(16, 185, 129, 0.9)', boxShadow: `0 4px 12px ${DESIGN.successGlow}` }}>
              <Check className="w-4 h-4 text-white" strokeWidth={3} />
            </div>
          </div>

          {/* Actions - only show on hover for grid/list, thumbnails use button overlay */}
          {!isThumb && (
            <div className="absolute bottom-0 left-0 right-0 p-4" style={{ transform: isHovered ? 'translateY(0)' : 'translateY(100%)', transition: `transform ${DESIGN.normal} ease`, background: 'linear-gradient(to top, var(--overlay-dark) 0%, transparent 100%)' }}>
              <div className="flex justify-center gap-2">
                <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={onEdit}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider text-white"
                  style={{ background: 'rgba(255, 255, 255, 0.1)', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.15)' }}>
                  <Edit3 size={14} /> Editar
                </motion.button>
                <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={onDelete}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider text-white"
                  style={{ background: 'rgba(239, 68, 68, 0.8)', border: '1px solid rgba(239, 68, 68, 0.4)' }}>
                  <Trash2 size={14} /> Eliminar
                </motion.button>
                {onAddToWidget && (
                  <motion.button
                    whileHover={{ scale: isInWidget ? 1 : 1.02 }}
                    whileTap={{ scale: isInWidget ? 1 : 0.98 }}
                    onClick={(e) => { e.stopPropagation(); onAddToWidget(); }}
                    disabled={isInWidget || !canAddToWidget}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all ${
                      isInWidget
                        ? 'bg-emerald-500/20 text-emerald-400 cursor-default'
                        : canAddToWidget === false
                        ? 'bg-gray-500/10 text-gray-500 cursor-not-allowed'
                        : 'bg-[#FF5C3A]/80 text-white hover:bg-[#FF5C3A]'
                    }`}
                    style={{ border: isInWidget ? '1px solid rgba(16,185,129,0.3)' : '1px solid rgba(255,92,58,0.4)' }}
                  >
                    {isInWidget ? <Check size={14} /> : <Plus size={14} />}
                    {isInWidget ? 'En Widget' : 'Agregar'}
                  </motion.button>
                )}
              </div>
            </div>
          )}

          {/* Thumbnail view: Add to widget button at bottom */}
          {isThumb && onAddToWidget && (
            <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/60 to-transparent">
              <motion.button
                whileHover={{ scale: isInWidget ? 1 : 1.02 }}
                whileTap={{ scale: isInWidget ? 1 : 0.98 }}
                onClick={(e) => { e.stopPropagation(); onAddToWidget(); }}
                disabled={isInWidget || !canAddToWidget}
                className={`w-full flex items-center justify-center gap-2 py-2 rounded-lg font-bold text-xs uppercase tracking-wider transition-all ${
                  isInWidget
                    ? 'bg-emerald-500/20 text-emerald-400 cursor-default'
                    : canAddToWidget === false
                    ? 'bg-gray-500/10 text-gray-500 cursor-not-allowed'
                    : 'bg-[#FF5C3A]/80 text-white hover:bg-[#FF5C3A]'
                }`}
              >
                {isInWidget ? <Check size={12} /> : <Plus size={12} />}
                {isInWidget ? 'En Widget' : 'Agregar'}
              </motion.button>
            </div>
          )}
        </div>

        {/* Content - compact for thumbnails */}
        <div className="flex flex-col flex-1 justify-end p-3 lg:p-4">
          {/* Product name */}
          <h3 className="font-bold uppercase tracking-tight leading-tight line-clamp-2 mb-1" style={{ color: 'var(--text-primary)', fontSize: isThumb ? '11px' : '13px' }}>
            {product.name}
          </h3>

          {/* Category badge */}
          {!isList && (
            <div className="mb-2">
              <span className="text-[9px] font-semibold uppercase tracking-wider opacity-70" style={{ color: 'var(--text-muted)' }}>
                {product.category}
              </span>
            </div>
          )}

          {/* Price - always visible */}
          {product.price != null && (
            <div className="mt-auto pt-2 flex items-center justify-between">
              <span className="text-sm lg:text-lg font-black tracking-tight" style={{ color: DESIGN.accent, textShadow: `0 0 20px ${DESIGN.accentGlow}` }}>
                ${Number(product.price).toLocaleString('es-CO')}
              </span>
              <ActiveStatus />
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// VIEWS
// ═══════════════════════════════════════════════════════════════════════════════

function GridView({ products, onEdit, onDelete, widgetProductIds, onAddToWidget, canAddToWidget }: Omit<ProductListProps, 'viewMode'>) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6 lg:gap-8">
      <AnimatePresence mode="popLayout">
        {products.map((product, idx) => (
          <ProductCard key={product.id} product={product} variant="grid" onEdit={() => onEdit(product)} onDelete={() => onDelete(product.id)} index={idx}
            isInWidget={widgetProductIds?.includes(product.id)}
            onAddToWidget={onAddToWidget ? () => onAddToWidget(product.id) : undefined}
            canAddToWidget={canAddToWidget} />
        ))}
      </AnimatePresence>
    </div>
  );
}

function ThumbnailsView({ products, onEdit, onDelete, widgetProductIds, onAddToWidget, canAddToWidget }: Omit<ProductListProps, 'viewMode'>) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-5 lg:gap-6">
      <AnimatePresence mode="popLayout">
        {products.map((product, idx) => (
          <ProductCard key={product.id} product={product} variant="thumbnails" onEdit={() => onEdit(product)} onDelete={() => onDelete(product.id)} index={idx}
            isInWidget={widgetProductIds?.includes(product.id)}
            onAddToWidget={onAddToWidget ? () => onAddToWidget(product.id) : undefined}
            canAddToWidget={canAddToWidget} />
        ))}
      </AnimatePresence>
    </div>
  );
}

function ListView({ products, onEdit, onDelete, widgetProductIds, onAddToWidget, canAddToWidget }: Omit<ProductListProps, 'viewMode'>) {
  return (
    <div className="rounded-2xl overflow-hidden" style={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)', boxShadow: DESIGN.shadowCard }}>
      <div className="h-1" style={{ background: `linear-gradient(to right, ${DESIGN.accent}, transparent)` }} />
      <div className="hidden lg:block">
        <table className="w-full">
          <thead>
            <tr style={{ background: 'var(--table-header-bg)' }}>
              <th className="px-6 py-4 text-left text-[10px] font-bold uppercase tracking-[0.15em]" style={{ color: 'var(--text-muted)' }}>Producto</th>
              <th className="px-6 py-4 text-left text-[10px] font-bold uppercase tracking-[0.15em]" style={{ color: 'var(--text-muted)' }}>Categoría</th>
              <th className="px-6 py-4 text-left text-[10px] font-bold uppercase tracking-[0.15em]" style={{ color: 'var(--text-muted)' }}>Specs</th>
              <th className="px-6 py-4 text-right text-[10px] font-bold uppercase tracking-[0.15em]" style={{ color: 'var(--text-muted)' }}>Precio</th>
              <th className="px-6 py-4 text-right text-[10px] font-bold uppercase tracking-[0.15em]" style={{ color: 'var(--text-muted)' }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            <AnimatePresence mode="popLayout">
              {products.map((product, idx) => (
                <motion.tr key={product.id} layout initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }} transition={{ delay: idx * 0.03 }}
                  className="group" style={{ borderBottom: '1px solid var(--card-border)' }}>
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 rounded-xl overflow-hidden flex-shrink-0" style={{ border: '1px solid var(--card-border)' }}>
                        <img src={getProxiedUrl(product.imageUrl)} alt={product.name} className="w-full h-full object-cover" />
                      </div>
                      <div>
                        <h4 className="font-bold uppercase tracking-tight text-sm" style={{ color: 'var(--text-primary)' }}>{product.name}</h4>
                        <div className="flex items-center gap-2 mt-1.5">
                          <div className="w-1.5 h-1.5 rounded-full" style={{ background: DESIGN.success, boxShadow: `0 0 6px ${DESIGN.success}` }} />
                          <span className="text-[9px] font-semibold uppercase" style={{ color: DESIGN.success }}>Activo</span>
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex flex-col gap-1.5">
                      <CategoryBadge category={product.category} />
                      {product.badge && <ProductBadge type={product.badge} />}
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <TechLine attributes={product.attributes || {}} />
                    <AttrPills attributes={product.attributes || {}} />
                  </td>
                  <td className="px-6 py-5 text-right"><PriceTag price={product.price ?? 0} category={product.category} /></td>
                  <td className="px-6 py-5 text-right">
                    <div className="flex justify-end gap-2">
                      {onAddToWidget && (
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => onAddToWidget(product.id)}
                          disabled={widgetProductIds?.includes(product.id) || !canAddToWidget}
                          className={`p-2.5 rounded-lg transition-all ${
                            widgetProductIds?.includes(product.id)
                              ? 'bg-emerald-500/15 cursor-default'
                              : canAddToWidget === false
                              ? 'bg-gray-500/10 cursor-not-allowed'
                              : 'bg-[#FF5C3A]/15 hover:bg-[#FF5C3A]/25'
                          }`}
                          style={{
                            border: widgetProductIds?.includes(product.id)
                              ? '1px solid rgba(16,185,129,0.25)'
                              : canAddToWidget === false
                              ? '1px solid var(--card-border)'
                              : '1px solid rgba(255,92,58,0.25)',
                          }}
                        >
                          {widgetProductIds?.includes(product.id) ? (
                            <Check size={16} className="text-emerald-500" />
                          ) : (
                            <Plus size={16} className={canAddToWidget === false ? 'text-gray-500' : 'text-[#FF5C3A]'} />
                          )}
                        </motion.button>
                      )}
                      <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => onEdit(product)} className="p-2.5 rounded-lg" style={{ background: 'var(--btn-bg)', border: '1px solid var(--card-border)' }}>
                        <Edit3 size={16} style={{ color: 'var(--text-primary)' }} />
                      </motion.button>
                      <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => onDelete(product.id)} className="p-2.5 rounded-lg" style={{ background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.25)' }}>
                        <Trash2 size={16} style={{ color: DESIGN.danger }} />
                      </motion.button>
                    </div>
                  </td>
                </motion.tr>
              ))}
            </AnimatePresence>
          </tbody>
        </table>
      </div>
      <div className="lg:hidden p-4 space-y-4">
        <AnimatePresence mode="popLayout">
          {products.map((product) => (
            <motion.div key={product.id} layout initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="flex gap-4 p-4 rounded-xl" style={{ background: 'var(--card-bg-elevated)', border: '1px solid var(--card-border)' }}>
              <div className="w-20 h-20 rounded-lg overflow-hidden flex-shrink-0" style={{ border: '1px solid var(--card-border)' }}>
                <img src={getProxiedUrl(product.imageUrl)} alt={product.name} className="w-full h-full object-cover" />
              </div>
              <div className="flex-1 min-w-0 flex flex-col justify-between">
                <div>
                  <h4 className="font-bold uppercase text-xs" style={{ color: 'var(--text-primary)' }}>{product.name}</h4>
                  <div className="flex items-center gap-2 mt-1">
                    <div className="w-1.5 h-1.5 rounded-full" style={{ background: DESIGN.success }} />
                    <CategoryBadge category={product.category} />
                  </div>
                  <TechLine attributes={product.attributes || {}} />
                </div>
                <div className="flex items-center justify-between mt-2">
                  <PriceTag price={product.price ?? 0} category={product.category} />
                  <div className="flex gap-2">
                    <motion.button whileTap={{ scale: 0.95 }} onClick={() => onEdit(product)} className="px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase" style={{ background: 'var(--btn-bg)' }}>
                      <Edit3 size={12} className="inline mr-1" />Editar
                    </motion.button>
                    <motion.button whileTap={{ scale: 0.95 }} onClick={() => onDelete(product.id)} className="px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase" style={{ background: 'rgba(239,68,68,0.15)', color: DESIGN.danger }}>
                      <Trash2 size={12} className="inline mr-1" />Eliminar
                    </motion.button>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// EMPTY STATE
// ═══════════════════════════════════════════════════════════════════════════════

function EmptyState() {
  return (
    <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }}
      className="text-center p-16 rounded-3xl" style={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)' }}>
      <div className="w-20 h-20 mx-auto mb-6 rounded-2xl flex items-center justify-center" style={{ background: DESIGN.accentSubtle, border: `1px solid ${DESIGN.accentGlow}` }}>
        <Package className="w-10 h-10" style={{ color: DESIGN.accent }} />
      </div>
      <h3 className="text-xl font-bold uppercase tracking-tight mb-2" style={{ color: 'var(--text-primary)' }}>Sin Productos</h3>
      <p className="text-sm max-w-xs mx-auto" style={{ color: 'var(--text-secondary)' }}>Agrega tu primer producto para comenzar.</p>
    </motion.div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN EXPORT
// ═══════════════════════════════════════════════════════════════════════════════

export function ProductList({ products, viewMode = 'grid', onEdit, onDelete, widgetProductIds, onAddToWidget, canAddToWidget }: ProductListProps) {
  if (products.length === 0) return <EmptyState />;
  return (
    <div className="pb-20">
      <AnimatePresence mode="popLayout">
        {viewMode === 'list' && <ListView products={products} onEdit={onEdit} onDelete={onDelete} widgetProductIds={widgetProductIds} onAddToWidget={onAddToWidget} canAddToWidget={canAddToWidget} />}
        {viewMode === 'thumbnails' && <ThumbnailsView products={products} onEdit={onEdit} onDelete={onDelete} widgetProductIds={widgetProductIds} onAddToWidget={onAddToWidget} canAddToWidget={canAddToWidget} />}
        {viewMode === 'grid' && <GridView products={products} onEdit={onEdit} onDelete={onDelete} widgetProductIds={widgetProductIds} onAddToWidget={onAddToWidget} canAddToWidget={canAddToWidget} />}
      </AnimatePresence>
    </div>
  );
}
