'use client';

import React from 'react';
import {
  Gauge,
  Layers,
  Star,
  Sparkles,
  Tag,
  Percent,
  CheckCircle,
  XCircle
} from 'lucide-react';

// ═══════════════════════════════════════════════════════════════════════════════
// BRAND DESIGN TOKENS
// ═══════════════════════════════════════════════════════════════════════════════
const ACCENT = '#FF5C3A';
const SUCCESS = '#10B981';
const WARNING = '#F59E0B';
const DANGER = '#EF4444';

// ═══════════════════════════════════════════════════════════════════════════════
// CATEGORY STYLES — Color-coded by category type
// ═══════════════════════════════════════════════════════════════════════════════
const CATEGORY_STYLES: Record<string, { bg: string; text: string; icon: React.ReactNode }> = {
  Rines: { bg: '#18181B', text: '#FFFFFF', icon: <Gauge className="w-3 h-3" /> },
  Tops: { bg: '#18181B', text: '#FFFFFF', icon: <Layers className="w-3 h-3" /> },
  Camisa: { bg: '#18181B', text: '#FFFFFF', icon: <Layers className="w-3 h-3" /> },
  Vestido: { bg: '#18181B', text: '#FFFFFF', icon: <Sparkles className="w-3 h-3" /> },
  Zapatos: { bg: '#18181B', text: '#FFFFFF', icon: <Star className="w-3 h-3" /> },
  Hoodie: { bg: '#18181B', text: '#FFFFFF', icon: <Layers className="w-3 h-3" /> },
  Chaqueta: { bg: '#18181B', text: '#FFFFFF', icon: <Layers className="w-3 h-3" /> },
  Pantalones: { bg: '#18181B', text: '#FFFFFF', icon: <Layers className="w-3 h-3" /> },
  Accesorios: { bg: '#18181B', text: '#FFFFFF', icon: <Star className="w-3 h-3" /> },
  default: { bg: '#18181B', text: '#FFFFFF', icon: <Sparkles className="w-3 h-3" /> },
};

// ═══════════════════════════════════════════════════════════════════════════════
// PROMO/SALE BADGE STYLES
// ═══════════════════════════════════════════════════════════════════════════════
const PROMO_STYLES: Record<string, { bg: string; text: string; dot: string; shadow: string }> = {
  nuevo: { bg: '#FF5C3A', text: '#FFFFFF', dot: '#FFFFFF', shadow: '0 2px 8px rgba(255, 92, 58, 0.3)' },
  top: { bg: '#FF5C3A', text: '#FFFFFF', dot: '#FFFFFF', shadow: '0 2px 8px rgba(255, 92, 58, 0.3)' },
  oferta: { bg: '#FF5C3A', text: '#FFFFFF', dot: '#FFFFFF', shadow: '0 2px 8px rgba(255, 92, 58, 0.3)' },
};

// ═══════════════════════════════════════════════════════════════════════════════
// STATUS BADGE STYLES
// ═══════════════════════════════════════════════════════════════════════════════
const STATUS_STYLES: Record<string, { bg: string; text: string; icon: React.ReactNode }> = {
  active: { bg: 'rgba(24, 24, 27, 0.15)', text: '#71717A', icon: <CheckCircle className="w-3 h-3" /> },
  inactive: { bg: 'rgba(239, 68, 68, 0.15)', text: '#EF4444', icon: <XCircle className="w-3 h-3" /> },
};

// ═══════════════════════════════════════════════════════════════════════════════
// COMPONENT PROPS
// ═══════════════════════════════════════════════════════════════════════════════
interface CategoryBadgeProps {
  category: string;
}

interface PromoBadgeProps {
  type: 'nuevo' | 'top' | 'oferta';
}

interface StatusBadgeProps {
  status: 'active' | 'inactive';
}

interface ProductBadgeProps {
  variant: 'category' | 'promo' | 'status';
  category?: string;
  type?: 'nuevo' | 'top' | 'oferta';
  status?: 'active' | 'inactive';
  text?: string;
}

// ═══════════════════════════════════════════════════════════════════════════════
// SUB-COMPONENTS
// ═══════════════════════════════════════════════════════════════════════════════

export function CategoryBadge({ category }: CategoryBadgeProps) {
  const style = CATEGORY_STYLES[category?.toLowerCase()] || CATEGORY_STYLES.default;
  
  return (
    <span
      className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[9px] font-medium uppercase tracking-wide backdrop-blur-sm"
      style={{
        background: style.bg,
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

export function PromoBadge({ type }: PromoBadgeProps) {
  const style = PROMO_STYLES[type?.toLowerCase()] || PROMO_STYLES.nuevo;
  
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
      {type === 'oferta' ? 'Oferta' : type === 'top' ? 'Top' : 'Nuevo'}
    </span>
  );
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const style = STATUS_STYLES[status] || STATUS_STYLES.active;
  
  return (
    <span
      className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[9px] font-semibold uppercase tracking-wide backdrop-blur-sm"
      style={{
        background: style.bg,
        color: style.text,
        border: `1px solid ${style.text}25`,
        backdropFilter: 'blur(8px)',
      }}
    >
      {style.icon}
      {status === 'active' ? 'Activo' : 'Inactivo'}
    </span>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// UNIFIED PRODUCTBADGE
// ═══════════════════════════════════════════════════════════════════════════════

export function ProductBadge({ variant, category, type, status, text }: ProductBadgeProps) {
  if (variant === 'category' && category) {
    return <CategoryBadge category={category} />;
  }
  
  if (variant === 'promo' && type) {
    return <PromoBadge type={type} />;
  }
  
  if (variant === 'status' && status) {
    return <StatusBadge status={status} />;
  }
  
  // Fallback: custom text badge
  if (text) {
    return (
      <span
        className="inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-semibold uppercase tracking-wide backdrop-blur-sm"
        style={{
          background: 'rgba(255, 92, 58, 0.15)',
          color: ACCENT,
          border: `1px solid ${ACCENT}25`,
          backdropFilter: 'blur(8px)',
        }}
      >
        <Tag className="w-3 h-3 mr-1" />
        {text}
      </span>
    );
  }
  
  return null;
}
