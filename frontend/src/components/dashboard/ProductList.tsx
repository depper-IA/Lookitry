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
  X,
  Eye,
  MoreHorizontal
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
  accentGlow: 'rgba(255, 92, 58, 0.15)',
  accentSubtle: 'rgba(255, 92, 58, 0.08)',

  // Status
  success: '#10B981',
  successGlow: 'rgba(16, 185, 129, 0.2)',
  danger: '#EF4444',

  // Surfaces
  surface1: 'rgba(255, 255, 255, 0.03)',
  surface2: 'rgba(255, 255, 255, 0.06)',

  // Effects
  shadowCard: '0 4px 24px rgba(0, 0, 0, 0.2)',
  shadowHover: '0 12px 40px rgba(0, 0, 0, 0.3), 0 0 0 1px rgba(255, 92, 58, 0.15)',
  shadowGlow: '0 0 30px rgba(255, 92, 58, 0.2)',

  // Timing
  fast: '150ms',
  normal: '250ms',
};

const CATEGORY_STYLES: Record<string, { bg: string; text: string; icon: React.ReactNode }> = {
  rines: { bg: 'rgba(30, 41, 59, 0.9)', text: '#94A3B8', icon: <Gauge className="w-3 h-3" /> },
  tshirt: { bg: 'rgba(63, 63, 70, 0.9)', text: '#A1A1AA', icon: <Layers className="w-3 h-3" /> },
  camisa: { bg: 'rgba(120, 53, 15, 0.9)', text: '#FCD34D', icon: <Star className="w-3 h-3" /> },
  vestido: { bg: 'rgba(76, 29, 149, 0.9)', text: '#C4B5FD', icon: <Sparkles className="w-3 h-3" /> },
  zapatos: { bg: 'rgba(22, 101, 52, 0.9)', text: '#86EFAC', icon: <Star className="w-3 h-3" /> },
  default: { bg: 'rgba(63, 63, 70, 0.9)', text: '#A1A1AA', icon: <Sparkles className="w-3 h-3" /> },
};

const BADGE_STYLES: Record<string, { bg: string; text: string; dot: string; shadow: string }> = {
  nuevo: { bg: 'rgba(16, 185, 129, 0.15)', text: '#10B981', dot: '#34D399', shadow: 'rgba(16, 185, 129, 0.3)' },
  top: { bg: 'rgba(245, 158, 11, 0.15)', text: '#F59E0B', dot: '#FCD34D', shadow: 'rgba(245, 158, 11, 0.3)' },
  oferta: { bg: 'rgba(239, 68, 68, 0.15)', text: '#EF4444', dot: '#FCA5A5', shadow: 'rgba(239, 68, 68, 0.3)' },
};

const CATEGORY_UNITS: Record<string, string> = {
  rines: 'set de 4',
  camisas: 'por unidad',
  default: '',
};

// ═══════════════════════════════════════════════════════════════════════════════
// SUB-COMPONENTS
// ═══════════════════════════════════════════════════════════════════════════════

function CategoryBadge({ category }: { category: string }) {
  const style = CATEGORY_STYLES[category.toLowerCase()] || CATEGORY_STYLES.default;
  return (
    <span
      className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[9px] font-medium uppercase tracking-wide backdrop-blur-sm"
      style={{ 
        background: `${style.bg.replace('0.9', '0.6')}`,
        color: style.text, 
        border: '1px solid rgba(255,255,255,0.06)',
        backdropFilter: 'blur(8px)',
      }}
    >
      {style.icon}
      {category}
    </span>
  );
}

function ProductBadge({ type }: { type: string }) {
  const style = BADGE_STYLES[type.toLowerCase()] || BADGE_STYLES.nuevo;
  return (
    <span
      className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[9px] font-semibold uppercase tracking-wide backdrop-blur-sm"
      style={{ 
        background: `${style.bg}`,
        color: style.text, 
        border: `1px solid ${style.dot}25`,
        backdropFilter: 'blur(8px)',
        boxShadow: `0 2px 8px ${style.shadow}20`,
      }}
    >
      <span 
        className="w-1.5 h-1.5 rounded-full" 
        style={{ 
          background: style.dot, 
          boxShadow: `0 0 4px ${style.dot}`,
          opacity: 0.9,
        }} 
      />
      {type}
    </span>
  );
}

function ActiveIndicator() {
  return (
    <div className="flex items-center gap-1.5">
      <span className="relative flex h-2 w-2">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75" style={{ background: DESIGN.success }} />
        <span className="relative inline-flex rounded-full h-2 w-2" style={{ background: DESIGN.success }} />
      </span>
      <span className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: DESIGN.success }}>Activo</span>
    </div>
  );
}

function PriceDisplay({ price, category }: { price: number; category: string }) {
  const unit = CATEGORY_UNITS[category.toLowerCase()] || CATEGORY_UNITS.default;
  return (
    <div className="text-right shrink-0 min-w-0">
      {unit && <p className="text-[9px] mb-0.5 font-medium opacity-60" style={{ color: 'var(--text-secondary)' }}>{unit}</p>}
      <p className="text-xl font-extrabold tracking-tight" style={{ color: DESIGN.accent }}>
        ${price.toLocaleString('es-CO')}
      </p>
    </div>
  );
}

function TechSpecs({ attributes }: { attributes: Record<string, any> }) {
  if (!attributes || Object.keys(attributes).length === 0) return null;
  const parts: string[] = [];
  if (attributes.material) parts.push(attributes.material);
  if (attributes.medida_pulgadas) parts.push(attributes.medida_pulgadas + '"');
  if (attributes.marca) parts.push(attributes.marca);
  if (parts.length === 0) return null;
  return (
    <p className="text-[10px] font-medium opacity-70 truncate" style={{ color: 'var(--text-secondary)' }}>
      {parts.join(' · ')}
    </p>
  );
}

function AttributePills({ attributes }: { attributes: Record<string, any> }) {
  if (!attributes || Object.keys(attributes).length === 0) return null;
  const pills: { label: string; color: string }[] = [];
  if (attributes.finish) pills.push({ label: attributes.finish, color: '#8B5CF6' });
  if (attributes.peso) pills.push({ label: attributes.peso + 'kg', color: '#06B6D4' });
  if (attributes.tallas && Array.isArray(attributes.tallas)) pills.push({ label: attributes.tallas.slice(0, 3).join(', '), color: '#F59E0B' });
  if (attributes.color && !attributes.material) pills.push({ label: attributes.color, color: '#EC4899' });
  if (pills.length === 0) return null;
  return (
    <div className="flex flex-wrap gap-1.5">
      {pills.map((pill, i) => (
        <span
          key={i}
          className="px-2 py-0.5 rounded text-[8px] font-semibold uppercase tracking-wide"
          style={{ background: `${pill.color}15`, color: pill.color, border: `1px solid ${pill.color}30` }}
        >
          {pill.label}
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
  const [showActions, setShowActions] = useState(false);

  const isGrid = variant === 'grid';
  const isThumb = variant === 'thumbnails';
  const isList = variant === 'list';

  const cardMinHeight = isGrid ? 'min-h-[520px]' : isThumb ? 'min-h-[440px]' : '';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.35, delay: index * 0.04, ease: [0.25, 0.46, 0.45, 0.94] }}
      className="group relative"
      onMouseEnter={() => { setIsHovered(true); setShowActions(true); }}
      onMouseLeave={() => { setIsHovered(false); setShowActions(false); }}
      style={{ minHeight: cardMinHeight, display: 'flex', flexDirection: 'column' }}
    >
      {/* Card Container */}
      <div
        className="relative flex flex-col rounded-2xl overflow-hidden flex-1 transition-all duration-300"
        style={{
          background: 'var(--card-bg)',
          border: '1px solid var(--card-border)',
          boxShadow: isHovered ? DESIGN.shadowHover : DESIGN.shadowCard,
          transform: isHovered ? 'translateY(-4px)' : 'translateY(0)',
        }}
      >
        {/* Image Container */}
        <div
          className={`relative overflow-hidden flex-shrink-0 ${isList ? 'aspect-square h-24 w-24' : isThumb ? 'aspect-[4/5]' : 'aspect-square'}`}
        >
          {/* Skeleton */}
          {!imageLoaded && (
            <div className="absolute inset-0 animate-pulse" style={{ background: 'var(--skeleton-bg)' }} />
          )}

          {/* Product Image */}
          <img
            src={getProxiedUrl(product.imageUrl)}
            alt={product.name}
            className="w-full h-full object-cover transition-all duration-500"
            style={{
              transform: isHovered && !isList ? 'scale(1.05)' : 'scale(1)',
              opacity: imageLoaded ? 1 : 0,
            }}
            onLoad={() => setImageLoaded(true)}
          />

          {/* Gradient Overlay */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background: 'linear-gradient(to top, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0.2) 40%, transparent 70%)',
              opacity: isHovered ? 0.8 : 0.5,
            }}
          />

          {/* Top Badges Row */}
          <div className="absolute top-3 left-3 right-3 flex items-start justify-between">
            <div className="flex flex-col gap-1.5">
              {product.badge && <ProductBadge type={product.badge} />}
              {!isList && <CategoryBadge category={product.category} />}
            </div>

            {/* Active Status Badge */}
            <div
              className="w-7 h-7 rounded-full flex items-center justify-center backdrop-blur-md transition-transform duration-200"
              style={{
                background: 'rgba(16, 185, 129, 0.9)',
                boxShadow: `0 4px 12px ${DESIGN.successGlow}`,
                transform: isHovered ? 'scale(1.1)' : 'scale(1)',
              }}
            >
              <Check className="w-3.5 h-3.5 text-white" strokeWidth={3} />
            </div>
          </div>

          {/* Actions Overlay - Grid & List */}
          {!isThumb && showActions && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="absolute bottom-0 left-0 right-0 p-4"
              style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.9) 0%, transparent 100%)' }}
            >
              <div className="flex justify-center gap-2">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={(e) => { e.stopPropagation(); onEdit(); }}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-[10px] uppercase tracking-wider text-white backdrop-blur-md transition-all"
                  style={{ background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.2)' }}
                >
                  <Edit3 size={12} /> Editar
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={(e) => { e.stopPropagation(); onDelete(); }}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-[10px] uppercase tracking-wider text-white backdrop-blur-md transition-all"
                  style={{ background: 'rgba(239, 68, 68, 0.8)', border: '1px solid rgba(239, 68, 68, 0.4)' }}
                >
                  <Trash2 size={12} /> Eliminar
                </motion.button>
                {onAddToWidget && (
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={(e) => { e.stopPropagation(); onAddToWidget(); }}
                    disabled={isInWidget || !canAddToWidget}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-[10px] uppercase tracking-wider backdrop-blur-md transition-all ${
                      isInWidget
                        ? 'bg-emerald-500/30 text-emerald-300 cursor-default'
                        : canAddToWidget === false
                        ? 'bg-gray-500/20 text-gray-400 cursor-not-allowed'
                        : 'bg-[#FF5C3A]/80 text-white hover:bg-[#FF5C3A]'
                    }`}
                    style={{ border: isInWidget ? '1px solid rgba(16,185,129,0.3)' : '1px solid rgba(255,92,58,0.3)' }}
                  >
                    {isInWidget ? <Check size={12} /> : <Plus size={12} />}
                    {isInWidget ? 'En Widget' : 'Agregar'}
                  </motion.button>
                )}
              </div>
            </motion.div>
          )}

          {/* Thumbnail Add Button */}
          {isThumb && onAddToWidget && (
            <div
              className="absolute bottom-0 left-0 right-0 p-3 transition-opacity duration-300"
              style={{
                background: 'linear-gradient(to top, rgba(0,0,0,0.8) 0%, transparent 100%)',
                opacity: isHovered ? 1 : 0.7,
              }}
            >
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={(e) => { e.stopPropagation(); onAddToWidget(); }}
                disabled={isInWidget || !canAddToWidget}
                className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-xl font-bold text-[10px] uppercase tracking-wider transition-all ${
                  isInWidget
                    ? 'bg-emerald-500/25 text-emerald-300 cursor-default'
                    : canAddToWidget === false
                    ? 'bg-gray-500/15 text-gray-400 cursor-not-allowed'
                    : 'bg-[#FF5C3A] text-white hover:bg-[#FF5C3A]/90'
                }`}
              >
                {isInWidget ? <Check size={12} /> : <Plus size={12} />}
                {isInWidget ? 'En Widget' : 'Agregar al Widget'}
              </motion.button>
            </div>
          )}
        </div>

        {/* Content Area */}
        <div className={`flex flex-col flex-1 ${isList ? 'p-4 justify-center' : 'p-4 lg:p-5 justify-end'}`}>
          {/* Product Name - Prominent */}
          <h3
            className="font-bold uppercase tracking-tight leading-tight line-clamp-2"
            style={{
              color: 'var(--text-primary)',
              fontSize: isThumb ? '12px' : '14px',
            }}
          >
            {product.name}
          </h3>

          {/* Product Description - Subtle & Elegant */}
          {(product.shortDescription || product.description) && (
            <p
              className="mt-1.5 line-clamp-2 leading-relaxed"
              style={{
                color: 'var(--text-muted)',
                fontSize: '10px',
                fontWeight: 400,
              }}
            >
              {product.shortDescription || product.description}
            </p>
          )}

          {/* Category - List only */}
          {isList && (
            <div className="mt-2">
              <CategoryBadge category={product.category} />
            </div>
          )}

          {/* Tech Specs */}
          <TechSpecs attributes={product.attributes || {}} />

          {/* Attribute Pills */}
          <div className="mt-2">
            <AttributePills attributes={product.attributes || {}} />
          </div>

          {/* Price & Status Row */}
          {product.price != null && (
            <div className="mt-auto pt-3 flex items-end justify-between">
              <PriceDisplay price={product.price} category={product.category} />
              <ActiveIndicator />
            </div>
          )}

          {/* Mobile Actions - List view */}
          {isList && (
            <div className="flex items-center gap-2 mt-3 lg:hidden">
              {onAddToWidget && (
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={() => onAddToWidget()}
                  disabled={isInWidget || !canAddToWidget}
                  className={`flex-1 flex items-center justify-center gap-1 py-2 rounded-lg text-[10px] font-bold uppercase transition-all ${
                    isInWidget
                      ? 'bg-emerald-500/15 text-emerald-400'
                      : canAddToWidget === false
                      ? 'bg-gray-500/10 text-gray-400'
                      : 'bg-[#FF5C3A]/15 text-[#FF5C3A]'
                  }`}
                >
                  {isInWidget ? <Check size={12} /> : <Plus size={12} />}
                  {isInWidget ? 'En Widget' : 'Agregar'}
                </motion.button>
              )}
              <motion.button whileTap={{ scale: 0.95 }} onClick={onEdit}
                className="px-3 py-2 rounded-lg" style={{ background: 'var(--btn-bg)', border: '1px solid var(--card-border)' }}>
                <Edit3 size={14} style={{ color: 'var(--text-primary)' }} />
              </motion.button>
              <motion.button whileTap={{ scale: 0.95 }} onClick={onDelete}
                className="px-3 py-2 rounded-lg" style={{ background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.2)' }}>
                <Trash2 size={14} style={{ color: DESIGN.danger }} />
              </motion.button>
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
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      <AnimatePresence mode="popLayout">
        {products.map((product, idx) => (
          <ProductCard
            key={product.id}
            product={product}
            variant="grid"
            onEdit={() => onEdit(product)}
            onDelete={() => onDelete(product.id)}
            index={idx}
            isInWidget={widgetProductIds?.includes(product.id)}
            onAddToWidget={onAddToWidget ? () => onAddToWidget(product.id) : undefined}
            canAddToWidget={canAddToWidget}
          />
        ))}
      </AnimatePresence>
    </div>
  );
}

function ThumbnailsView({ products, onEdit, onDelete, widgetProductIds, onAddToWidget, canAddToWidget }: Omit<ProductListProps, 'viewMode'>) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-5">
      <AnimatePresence mode="popLayout">
        {products.map((product, idx) => (
          <ProductCard
            key={product.id}
            product={product}
            variant="thumbnails"
            onEdit={() => onEdit(product)}
            onDelete={() => onDelete(product.id)}
            index={idx}
            isInWidget={widgetProductIds?.includes(product.id)}
            onAddToWidget={onAddToWidget ? () => onAddToWidget(product.id) : undefined}
            canAddToWidget={canAddToWidget}
          />
        ))}
      </AnimatePresence>
    </div>
  );
}

function ListView({ products, onEdit, onDelete, widgetProductIds, onAddToWidget, canAddToWidget }: Omit<ProductListProps, 'viewMode'>) {
  return (
    <div className="rounded-2xl overflow-hidden" style={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)', boxShadow: DESIGN.shadowCard }}>
      {/* Header accent line */}
      <div className="h-1" style={{ background: `linear-gradient(to right, ${DESIGN.accent}, transparent)` }} />

      {/* Desktop Table */}
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
                <motion.tr
                  key={product.id}
                  layout
                  initial={{ opacity: 0, x: -16 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ delay: idx * 0.03 }}
                  className="group"
                  style={{ borderBottom: '1px solid var(--card-border)' }}
                >
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 rounded-xl overflow-hidden flex-shrink-0" style={{ border: '1px solid var(--card-border)' }}>
                        <img src={getProxiedUrl(product.imageUrl)} alt={product.name} className="w-full h-full object-cover" />
                      </div>
                      <div className="min-w-0">
                        <h4 className="font-bold uppercase tracking-tight text-sm" style={{ color: 'var(--text-primary)' }}>{product.name}</h4>
                        {(product.shortDescription || product.description) && (
                          <p 
                            className="text-[10px] mt-0.5 line-clamp-1" 
                            style={{ color: 'var(--text-muted)' }}
                          >
                            {product.shortDescription || product.description}
                          </p>
                        )}
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
                    <TechSpecs attributes={product.attributes || {}} />
                    <div className="mt-1.5">
                      <AttributePills attributes={product.attributes || {}} />
                    </div>
                  </td>
                  <td className="px-6 py-5 text-right">
                    <PriceDisplay price={product.price ?? 0} category={product.category} />
                  </td>
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
                              : 'hover:bg-[#FF5C3A]/15'
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
                      <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => onEdit(product)}
                        className="p-2.5 rounded-lg" style={{ background: 'var(--btn-bg)', border: '1px solid var(--card-border)' }}>
                        <Edit3 size={16} style={{ color: 'var(--text-primary)' }} />
                      </motion.button>
                      <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => onDelete(product.id)}
                        className="p-2.5 rounded-lg" style={{ background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.25)' }}>
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

      {/* Mobile Cards */}
      <div className="lg:hidden p-4 space-y-4">
        <AnimatePresence mode="popLayout">
          {products.map((product) => (
            <motion.div
              key={product.id}
              layout
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="flex gap-4 p-4 rounded-xl"
              style={{ background: 'var(--card-bg-elevated)', border: '1px solid var(--card-border)' }}
            >
              <div className="w-20 h-20 rounded-lg overflow-hidden flex-shrink-0" style={{ border: '1px solid var(--card-border)' }}>
                <img src={getProxiedUrl(product.imageUrl)} alt={product.name} className="w-full h-full object-cover" />
              </div>
              <div className="flex-1 min-w-0 flex flex-col justify-between">
                <div>
                  <h4 className="font-bold uppercase text-xs" style={{ color: 'var(--text-primary)' }}>{product.name}</h4>
                  {(product.shortDescription || product.description) && (
                    <p 
                      className="text-[9px] mt-0.5 line-clamp-1" 
                      style={{ color: 'var(--text-muted)' }}
                    >
                      {product.shortDescription || product.description}
                    </p>
                  )}
                  <div className="flex items-center gap-2 mt-1">
                    <span className="w-1.5 h-1.5 rounded-full" style={{ background: DESIGN.success }} />
                    <CategoryBadge category={product.category} />
                  </div>
                  <TechSpecs attributes={product.attributes || {}} />
                  <div className="mt-1.5">
                    <AttributePills attributes={product.attributes || {}} />
                  </div>
                </div>
                <div className="flex items-center justify-between mt-2">
                  <PriceDisplay price={product.price ?? 0} category={product.category} />
                  <div className="flex gap-2">
                    <motion.button whileTap={{ scale: 0.95 }} onClick={() => onEdit(product)}
                      className="px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase" style={{ background: 'var(--btn-bg)' }}>
                      <Edit3 size={12} className="inline mr-1" />Editar
                    </motion.button>
                    <motion.button whileTap={{ scale: 0.95 }} onClick={() => onDelete(product.id)}
                      className="px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase" style={{ background: 'rgba(239,68,68,0.15)', color: DESIGN.danger }}>
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
// MAIN EXPORT
// ═══════════════════════════════════════════════════════════════════════════════

export function ProductList({ products, viewMode = 'grid', onEdit, onDelete, widgetProductIds, onAddToWidget, canAddToWidget }: ProductListProps) {
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
