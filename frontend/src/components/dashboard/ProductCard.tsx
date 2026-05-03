'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Check } from 'lucide-react';
import type { Product } from '@/types';

import { ImageWithFallback } from './ImageWithFallback';
import { ProductBadge } from './ProductBadge';
import { ProductActions } from './ProductActions';

const CATEGORY_UNITS: Record<string, string> = {
  rines: 'set de 4',
  camisas: 'por unidad',
  default: '',
};

// ═══════════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════════
export type CardVariant = 'grid' | 'list' | 'thumbnail';

interface ProductCardProps {
  product: Product;
  viewMode: CardVariant;
  onEdit: (product: Product) => void;
  onDelete: (productId: string) => void;
  onAddToWidget?: (productId: string) => void;
  onRemoveFromWidget?: (productId: string) => void;
  isInWidget?: boolean;
  canAddToWidget?: boolean;
}

// ═══════════════════════════════════════════════════════════════════════════════
// CARD VARIANT CONFIG
// ═══════════════════════════════════════════════════════════════════════════════
const CARD_CONFIG = {
  grid: {
    aspect: 'aspect-square',
    minHeight: 'min-h-[520px]',
    imageSizes: 'h-80',
    contentPadding: 'p-4 lg:p-5',
  },
  list: {
    aspect: 'h-24 w-24',
    minHeight: '',
    imageSizes: 'h-24 w-24',
    contentPadding: 'p-4 justify-center',
  },
  thumbnail: {
    aspect: 'aspect-[4/5]',
    minHeight: 'min-h-[440px]',
    imageSizes: 'h-72',
    contentPadding: 'p-4 lg:p-5',
  },
};

// ═══════════════════════════════════════════════════════════════════════════════
// HELPER SUB-COMPONENTS
// ═══════════════════════════════════════════════════════════════════════════════

function ActiveIndicator() {
  return (
    <div className="flex items-center gap-1.5">
      <span className="relative flex h-2 w-2">
        <span
          className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 bg-zinc-500"
        />
        <span
          className="relative inline-flex rounded-full h-2 w-2 bg-zinc-500"
        />
      </span>
      <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
        Activo
      </span>
    </div>
  );
}

function PriceDisplay({ price, category }: { price: number; category: string }) {
  const unit = CATEGORY_UNITS[category?.toLowerCase()] || CATEGORY_UNITS.default;
  
  return (
    <div className="text-right shrink-0 min-w-0">
      {unit && (
        <p
          className="text-[9px] mb-0.5 font-medium opacity-60"
          style={{ color: 'var(--text-secondary)' }}
        >
          {unit}
        </p>
      )}
      <p
        className="text-xl font-extrabold tracking-tight"
        style={{ color: '#FF5C3A' }}
      >
        ${price.toLocaleString('es-CO')}
      </p>
    </div>
  );
}

function TechSpecs({ attributes }: { attributes: Record<string, any> }) {
  if (!attributes || Object.keys(attributes).length === 0) return null;
  
  const parts: string[] = [];
  const specKeys = ['material', 'material_marco', 'marca', 'certificacion', 'medida_pulgadas', 'tipo_visor', 'forma_marco'];
  
  for (const key of specKeys) {
    if (attributes[key]) {
      parts.push(key === 'medida_pulgadas' ? attributes[key] + '"' : attributes[key]);
    }
  }

  // Fallback: if no recognized spec keys, show up to 2 other string values
  if (parts.length === 0) {
    const otherValues = Object.entries(attributes)
      .filter(([k, v]) => typeof v === 'string' && !['color', 'talla', 'tallas'].includes(k))
      .map(([_, v]) => v);
    parts.push(...otherValues.slice(0, 2));
  }

  if (parts.length === 0) return null;
  
  return (
    <p
      className="text-[10px] font-medium opacity-70 truncate"
      style={{ color: 'var(--text-secondary)' }}
    >
      {parts.join(' · ')}
    </p>
  );
}

function AttributePills({ attributes }: { attributes: Record<string, any> }) {
  if (!attributes || Object.keys(attributes).length === 0) return null;
  const pills: { label: string; color: string }[] = [];
  
  if (attributes.finish) pills.push({ label: attributes.finish, color: '#8B5CF6' });
  if (attributes.peso) pills.push({ label: attributes.peso + 'kg', color: '#06B6D4' });
  
  let tallaVal = attributes.tallas || attributes.talla;
  if (tallaVal) {
    if (Array.isArray(tallaVal)) {
      pills.push({ label: tallaVal.slice(0, 3).join(', '), color: '#F59E0B' });
    } else if (typeof tallaVal === 'string') {
      pills.push({ label: tallaVal, color: '#F59E0B' });
    }
  }

  if (attributes.color) pills.push({ label: attributes.color, color: '#EC4899' });
  if (attributes.proteccion_uv) pills.push({ label: attributes.proteccion_uv, color: '#10B981' });

  if (pills.length === 0) return null;
  return (
    <div className="flex flex-wrap gap-1.5 mt-2">
      {pills.map((pill, i) => (
        <span key={i} className="px-2 py-0.5 rounded text-[8px] font-semibold uppercase tracking-wide" style={{ background: `${pill.color}15`, color: pill.color, border: `1px solid ${pill.color}30` }}>
          {pill.label}
        </span>
      ))}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

export function ProductCard({
  product,
  viewMode,
  onEdit,
  onDelete,
  onAddToWidget,
  onRemoveFromWidget,
  isInWidget = false,
  canAddToWidget = true,
}: ProductCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [showActions, setShowActions] = useState(false);

  const config = CARD_CONFIG[viewMode];
  const isList = viewMode === 'list';
  const isGrid = viewMode === 'grid';
  const isThumb = viewMode === 'thumbnail';

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{
        scale: isList ? 1.02 : 1.02,
        y: isList ? 0 : -5,
        boxShadow: isList ? '0 4px 24px rgba(0, 0, 0, 0.2)' : '0 12px 40px rgba(0, 0, 0, 0.3), 0 0 0 1px rgba(255, 92, 58, 0.15)',
        borderColor: isList ? 'var(--card-border)' : 'rgba(255, 92, 58, 0.4)',
      }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      className="group relative cursor-pointer"
      onMouseEnter={() => { setIsHovered(true); setShowActions(true); }}
      onMouseLeave={() => { setIsHovered(false); setShowActions(false); }}
      style={{ display: 'flex', flexDirection: 'column' }}
    >
      {/* Card Container */}
      <div
        className={`relative flex flex-col rounded-2xl overflow-hidden flex-1 transition-all duration-300 ${config.minHeight}`}
        style={{
          background: 'var(--card-bg)',
          border: '1px solid var(--card-border)',
          boxShadow: isHovered && !isList ? '0 12px 40px rgba(0, 0, 0, 0.3), 0 0 0 1px rgba(255, 92, 58, 0.15)' : '0 4px 24px rgba(0, 0, 0, 0.2)',
          transform: isHovered && !isList ? 'translateY(-4px)' : 'translateY(0)',
        }}
      >
        {/* Image Container */}
        <div className={`relative overflow-hidden flex-shrink-0 ${isList ? config.aspect : config.aspect}`}>
          {/* Product Image with Fallback */}
          <ImageWithFallback
            src={product.imageUrl}
            alt={product.name}
            className="w-full h-full"
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
              {product.badge && <ProductBadge variant="promo" type={product.badge} />}
              {!isList && <ProductBadge variant="category" category={product.category} />}
            </div>

            {/* Active Status Badge */}
            <div
              className="w-7 h-7 rounded-full flex items-center justify-center backdrop-blur-md transition-transform duration-200"
              style={{
                background: 'rgba(16, 185, 129, 0.9)',
                boxShadow: '0 4px 12px rgba(24, 24, 27, 0.2)',
                transform: isHovered ? 'scale(1.1)' : 'scale(1)',
              }}
            >
              <Check className="w-3.5 h-3.5 text-white" strokeWidth={3} />
            </div>
          </div>

          {/* Actions Overlay — Grid & Thumbnail */}
          {!isList && showActions && (
            <ProductActions
              product={product}
              onEdit={onEdit}
              onDelete={onDelete}
              onAddToWidget={onAddToWidget}
              onRemoveFromWidget={onRemoveFromWidget}
              isInWidget={isInWidget}
              canAddToWidget={canAddToWidget}
              variant="overlay"
            />
          )}
        </div>

        {/* Content Area */}
        <div className={`flex flex-col flex-1 ${isList ? config.contentPadding : config.contentPadding} justify-end`}>
          {/* Product Name */}
          <h3
            className="font-bold uppercase tracking-tight leading-tight line-clamp-2"
            style={{
              color: 'var(--text-primary)',
              fontSize: isThumb ? '12px' : '14px',
            }}
          >
            {product.name}
          </h3>

          {/* Product Description */}
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

          {/* Category — List only */}
          {isList && (
            <div className="mt-2">
              <ProductBadge variant="category" category={product.category} />
            </div>
          )}

          {/* Tech Specs */}
          <TechSpecs attributes={product.attributes || {}} />
          <AttributePills attributes={product.attributes || {}} />

          {/* Price & Status Row */}
          {product.price != null && (
            <div className="mt-auto pt-3 flex items-end justify-between">
              <PriceDisplay price={product.price} category={product.category} />
              <ActiveIndicator />
            </div>
          )}

          {/* Mobile Actions — List view */}
          {isList && (
            <div className="mt-3">
              <ProductActions
                product={product}
                onEdit={onEdit}
                onDelete={onDelete}
                onAddToWidget={onAddToWidget}
                onRemoveFromWidget={onRemoveFromWidget}
                isInWidget={isInWidget}
                canAddToWidget={canAddToWidget}
                variant="inline"
              />
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
