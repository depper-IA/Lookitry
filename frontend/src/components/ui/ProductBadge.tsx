'use client';

import React from 'react';
import {
  Gauge,
  Layers,
  Star,
  Sparkles,
} from 'lucide-react';

// Category styling map
const CATEGORY_STYLES: Record<string, { bg: string; text: string; icon: React.ReactNode }> = {
  Rines: { bg: 'rgba(30, 41, 59, 0.9)', text: '#94A3B8', icon: <Gauge className="w-3 h-3" /> },
  Tops: { bg: 'rgba(63, 63, 70, 0.9)', text: '#A1A1AA', icon: <Layers className="w-3 h-3" /> },
  Camisa: { bg: 'rgba(120, 53, 15, 0.9)', text: '#FCD34D', icon: <Star className="w-3 h-3" /> },
  Vestido: { bg: 'rgba(76, 29, 149, 0.9)', text: '#C4B5FD', icon: <Sparkles className="w-3 h-3" /> },
  Zapatos: { bg: 'rgba(22, 101, 52, 0.9)', text: '#86EFAC', icon: <Star className="w-3 h-3" /> },
  Hoodie: { bg: 'rgba(63, 63, 70, 0.9)', text: '#A1A1AA', icon: <Layers className="w-3 h-3" /> },
  Chaqueta: { bg: 'rgba(63, 63, 70, 0.9)', text: '#A1A1AA', icon: <Layers className="w-3 h-3" /> },
  Pantalones: { bg: 'rgba(63, 63, 70, 0.9)', text: '#A1A1AA', icon: <Layers className="w-3 h-3" /> },
  Accesorios: { bg: 'rgba(63, 63, 70, 0.9)', text: '#A1A1AA', icon: <Star className="w-3 h-3" /> },
  default: { bg: 'rgba(63, 63, 70, 0.9)', text: '#A1A1AA', icon: <Sparkles className="w-3 h-3" /> },
};

// Promo badge styling map
const BADGE_STYLES: Record<string, { bg: string; text: string; dot: string; shadow: string }> = {
  nuevo: { bg: 'rgba(16, 185, 129, 0.15)', text: '#10B981', dot: '#34D399', shadow: 'rgba(16, 185, 129, 0.3)' },
  top: { bg: 'rgba(245, 158, 11, 0.15)', text: '#F59E0B', dot: '#FCD34D', shadow: 'rgba(245, 158, 11, 0.3)' },
  oferta: { bg: 'rgba(239, 68, 68, 0.15)', text: '#EF4444', dot: '#FCA5A5', shadow: 'rgba(239, 68, 68, 0.3)' },
};

interface CategoryBadgeProps {
  category: string;
}

interface ProductBadgeProps {
  type: string;
}

/**
 * Category badge with icon and styled background.
 * Renders a colored pill based on product category.
 */
export function CategoryBadge({ category }: CategoryBadgeProps) {
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

/**
 * Promo/status badge with dot indicator.
 * Renders a colored pill with glowing dot for novo/top/oferta.
 */
export function ProductBadge({ type }: ProductBadgeProps) {
  const style = BADGE_STYLES[type.toLowerCase()] || BADGE_STYLES.nuevo;
  return (
    <span
      className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[9px] font-semibold uppercase tracking-wide backdrop-blur-sm"
      style={{
        background: style.bg,
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