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
  Eye,
} from 'lucide-react';

import { ImageWithFallback } from './ImageWithFallback';
import type { SortOption } from '@/hooks/useProductSearch';
import { ArrowUpDown, ChevronDown } from 'lucide-react';

// ═══════════════════════════════════════════════════════════════════════════════
// SORT COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: 'name_asc', label: 'Nombre A-Z' },
  { value: 'name_desc', label: 'Nombre Z-A' },
  { value: 'created_desc', label: 'Más Recientes' },
];

function SortDropdown({ sortBy, onSortChange }: { sortBy: SortOption; onSortChange: (s: SortOption) => void }) {
  const [isOpen, setIsOpen] = useState(false);
  const current = SORT_OPTIONS.find(o => o.value === sortBy)?.label || 'Nombre A-Z';

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[var(--card-bg)] border border-[var(--card-border)] text-[11px] font-bold uppercase tracking-wider text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-accent/30 transition-all"
      >
        <ArrowUpDown size={12} />
        <span>Ordenar</span>
        <span className="text-accent">{current}</span>
        <ChevronDown size={12} className={`transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      {isOpen && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)} />
          <div className="absolute right-0 mt-2 z-20 bg-[var(--card-bg)] border border-[var(--card-border)] rounded-xl shadow-xl overflow-hidden min-w-[160px]">
            {SORT_OPTIONS.map((option) => (
              <button
                key={option.value}
                onClick={() => { onSortChange(option.value); setIsOpen(false); }}
                className={`w-full text-left px-4 py-2.5 text-[10px] font-semibold uppercase tracking-wider transition-all ${
                  sortBy === option.value
                    ? 'bg-accent/10 text-accent'
                    : 'text-[var(--text-secondary)] hover:bg-[var(--card-bg-elevated)] hover:text-[var(--text-primary)]'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// BADGE COMPONENTS
// ═══════════════════════════════════════════════════════════════════════════════

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  Falda: <Sparkles className="w-3 h-3" />,
  Vestido: <Sparkles className="w-3 h-3" />,
  Tops: <Layers className="w-3 h-3" />,
  Camisa: <Layers className="w-3 h-3" />,
  Accesorios: <Gauge className="w-3 h-3" />,
  Rines: <Gauge className="w-3 h-3" />,
  Zapatos: <Star className="w-3 h-3" />,
  Bolsos: <Star className="w-3 h-3" />,
  Conjunto: <Layers className="w-3 h-3" />,
  Pantalones: <Layers className="w-3 h-3" />,
  Chaqueta: <Layers className="w-3 h-3" />,
  Hoodie: <Layers className="w-3 h-3" />,
  Cascos: <Star className="w-3 h-3" />,
  Lentes: <Star className="w-3 h-3" />,
  default: <Sparkles className="w-3 h-3" />,
};

const BADGE_STYLES: Record<string, { bg: string; text: string; dot: string; shadow: string }> = {
  nuevo: { bg: 'bg-accent', text: 'text-white', dot: 'bg-white', shadow: 'shadow-[0_2px_8px_rgba(255,92,58,0.3)]' },
  top: { bg: 'bg-accent', text: 'text-white', dot: 'bg-white', shadow: 'shadow-[0_2px_8px_rgba(255,92,58,0.3)]' },
  oferta: { bg: 'bg-accent', text: 'text-white', dot: 'bg-white', shadow: 'shadow-[0_2px_8px_rgba(255,92,58,0.3)]' },
};

const CATEGORY_UNITS: Record<string, string> = {
  rines: 'set de 4',
  camisas: 'por unidad',
  default: '',
};

export function CategoryBadge({ category }: { category: string }) {
  const icon = CATEGORY_ICONS[category.toLowerCase()] || CATEGORY_ICONS.default;
  return (
    <span
      className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[9px] font-medium uppercase tracking-wide backdrop-blur-sm bg-zinc-900/60 text-white border border-white/5"
    >
      {icon}
      {category}
    </span>
  );
}

export function ProductBadge({ type }: { type: string }) {
  const style = BADGE_STYLES[type.toLowerCase()] || BADGE_STYLES.nuevo;
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[9px] font-semibold uppercase tracking-wide backdrop-blur-sm ${style.bg} ${style.text} ${style.shadow} border border-white/25`}
    >
      <span
        className={`w-1.5 h-1.5 rounded-full shadow-[0_0_4px_white] opacity-90 ${style.dot}`}
      />
      {type}
    </span>
  );
}

export function ActiveIndicator() {
  return (
    <div className="flex items-center gap-1.5">
      <span className="relative flex h-2 w-2">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 bg-zinc-900" />
        <span className="relative inline-flex rounded-full h-2 w-2 bg-zinc-900" />
      </span>
      <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-900">Activo</span>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// HELPER COMPONENTS
// ═══════════════════════════════════════════════════════════════════════════════


// ═══════════════════════════════════════════════════════════════════════════════
// PRODUCT CARD
// ═══════════════════════════════════════════════════════════════════════════════

const productVariants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.4 } },
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.06 } },
};

interface ProductCardProps {
  product: Product;
  variant: 'grid' | 'thumbnails' | 'list';
  onEdit: () => void;
  onDelete: () => void;
  isInWidget?: boolean;
  onAddToWidget?: () => void;
  canAddToWidget?: boolean;
}

export const ProductCard = React.forwardRef<HTMLDivElement, ProductCardProps>(({ product, variant, onEdit, onDelete, isInWidget, onAddToWidget, canAddToWidget }, ref) => {
  const [isHovered, setIsHovered] = useState(false);
  const [showActions, setShowActions] = useState(false);

  const isGrid = variant === 'grid';
  const isThumb = variant === 'thumbnails';
  const isList = variant === 'list';

  const cardMinHeight = isGrid ? 'min-h-[560px] lg:min-h-[620px]' : isThumb ? 'min-h-[440px] lg:min-h-[480px]' : '';

  return (
    <motion.div
      ref={ref}
      layout
      variants={productVariants}
      initial="hidden"
      animate="visible"
      exit="hidden"
      whileHover={{ scale: 1.02, y: -5, boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.4)', borderColor: 'rgba(255, 92, 58, 0.4)' }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      className="group relative cursor-pointer"
      onMouseEnter={() => { setIsHovered(true); setShowActions(true); }}
      onMouseLeave={() => { setIsHovered(false); setShowActions(false); }}
      style={{ minHeight: cardMinHeight, display: 'flex', flexDirection: 'column' }}
    >
      <div
        className="relative flex flex-col rounded-2xl overflow-hidden flex-1 transition-all duration-300"
        style={{
          background: 'var(--card-bg)',
          border: '1px solid var(--card-border)',
          boxShadow: isHovered ? '0 12px 40px rgba(0, 0, 0, 0.3), 0 0 0 1px rgba(255, 92, 58, 0.15)' : '0 4px 24px rgba(0, 0, 0, 0.2)',
          transform: isHovered ? 'translateY(-4px)' : 'translateY(0)',
        }}
      >
        {/* Image Container */}
        <div
          className={`relative overflow-hidden flex-shrink-0 ${isList ? 'aspect-square h-24 w-24' : isThumb ? 'aspect-[4/5]' : 'aspect-square'}`}
        >
          {/* Product Image with fallback */}
          <ImageWithFallback
            src={product.imageUrl}
            alt={product.name}
            className="w-full h-full"
            onLoad={() => {}}
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
            <div
              className="w-7 h-7 rounded-full flex items-center justify-center backdrop-blur-md transition-transform duration-200"
              style={{
                background: 'rgba(24, 24, 27, 0.9)',
                boxShadow: '0 4px 12px rgba(24, 24, 27, 0.2)',
                transform: isHovered ? 'scale(1.1)' : 'scale(1)',
                border: '1px solid rgba(255,255,255,0.1)'
              }}
            >
              <Check className="w-3.5 h-3.5 text-white" strokeWidth={3} />
            </div>
          </div>

          {/* Actions Overlay */}
          {!isThumb && showActions && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="absolute bottom-0 left-0 right-0 p-4"
              style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.9) 0%, transparent 100%)' }}
            >
              <div className="flex justify-center gap-2">
                <ActionButton icon={<Edit3 size={12} />} label="Editar" onClick={(e) => { e.stopPropagation(); onEdit(); }} />
                <ActionButton icon={<Trash2 size={12} />} label="Eliminar" onClick={(e) => { e.stopPropagation(); onDelete(); }} variant="danger" />
                {onAddToWidget && (
                  <ActionButton
                    icon={isInWidget ? <Check size={12} /> : <Plus size={12} />}
                    label={isInWidget ? 'En Widget' : 'Agregar'}
                    onClick={(e) => { e.stopPropagation(); onAddToWidget(); }}
                    disabled={isInWidget || !canAddToWidget}
                    variant={isInWidget ? 'success' : 'accent'}
                  />
                )}
              </div>
            </motion.div>
          )}

          {/* Thumbnail Add Button */}
          {isThumb && onAddToWidget && (
            <div
              className="absolute bottom-0 left-0 right-0 p-3 transition-opacity duration-300"
              style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.8) 0%, transparent 100%)', opacity: isHovered ? 1 : 0.7 }}
            >
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={(e) => { e.stopPropagation(); onAddToWidget(); }}
                disabled={isInWidget || !canAddToWidget}
                className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-xl font-bold text-[10px] uppercase tracking-wider transition-all ${
                  isInWidget ? 'bg-emerald-500/25 text-emerald-300 cursor-default' : canAddToWidget === false ? 'bg-gray-500/15 text-gray-400 cursor-not-allowed' : 'bg-accent text-white hover:bg-accent/90'
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
          <h3 className="font-bold uppercase tracking-tight leading-tight line-clamp-2" style={{ color: 'var(--text-primary)', fontSize: isThumb ? '12px' : '14px' }}>
            {product.name}
          </h3>
          {(product.shortDescription || product.description) && (
            <p className="mt-1.5 line-clamp-2 leading-relaxed" style={{ color: 'var(--text-muted)', fontSize: '10px', fontWeight: 400 }}>
              {product.shortDescription || product.description}
            </p>
          )}
          {isList && <div className="mt-2"><CategoryBadge category={product.category} /></div>}
          <TechSpecs attributes={product.attributes || {}} />
          <div className="mt-2"><AttributePills attributes={product.attributes || {}} /></div>
          {product.price != null && (
            <div className="mt-auto pt-3 flex items-end justify-between">
              <PriceDisplay price={product.price} category={product.category} />
              <ActiveIndicator />
            </div>
          )}
          {isList && <MobileActions isInWidget={isInWidget} canAddToWidget={canAddToWidget} onAddToWidget={onAddToWidget} onEdit={onEdit} onDelete={onDelete} />}
        </div>
      </div>
    </motion.div>
  );
});

// ═══════════════════════════════════════════════════════════════════════════════
// HELPER COMPONENTS
// ═══════════════════════════════════════════════════════════════════════════════

interface ActionButtonProps {
  icon: React.ReactNode;
  label: string;
  onClick: (e: React.MouseEvent) => void;
  variant?: 'default' | 'danger' | 'accent' | 'success';
  disabled?: boolean;
}

function ActionButton({ icon, label, onClick, variant = 'default', disabled }: ActionButtonProps) {
  const styles = {
    default: { bg: 'rgba(255,255,255,0.15)', border: 'rgba(255,255,255,0.2)' },
    danger: { bg: 'rgba(239, 68, 68, 0.8)', border: 'rgba(239, 68, 68, 0.4)' },
    accent: { bg: 'rgba(255,255,255,0.15)', border: 'rgba(255,92,58,0.3)' },
    success: { bg: 'rgba(16, 185, 129, 0.3)', border: 'rgba(16, 185, 129, 0.3)' },
  }[variant];

  return (
    <motion.button
      whileHover={{ scale: variant === 'danger' ? 1.1 : 1.05, color: variant === 'danger' ? 'rgb(239, 68, 68)' : undefined }}
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      disabled={disabled}
      className="flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-[10px] uppercase tracking-wider text-white backdrop-blur-md transition-all disabled:opacity-50"
      style={{ background: styles.bg, border: `1px solid ${styles.border}` }}
    >
      {icon} {label}
    </motion.button>
  );
}

function PriceDisplay({ price, category }: { price: number; category: string }) {
  const unit = CATEGORY_UNITS[category.toLowerCase()] || CATEGORY_UNITS.default;
  return (
    <div className="text-right shrink-0 min-w-0">
      {unit && <p className="text-[9px] mb-0.5 font-medium opacity-60" style={{ color: 'var(--text-secondary)' }}>{unit}</p>}
      <p className="text-xl font-extrabold tracking-tight text-accent">
        ${price.toLocaleString('es-CO')}
      </p>
    </div>
  );
}

function TechSpecs({ attributes }: { attributes: Record<string, any> }) {
  if (!attributes || Object.keys(attributes).length === 0) return null;
  const parts: string[] = [];
  
  // Spec keys that are good for the subtitle line
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
  return <p className="text-[10px] font-medium opacity-70 truncate" style={{ color: 'var(--text-secondary)' }}>{parts.join(' · ')}</p>;
}

const PILL_COLOR_MAP: Record<string, string> = {
  violet: 'bg-violet-500/15 text-violet-500 border-violet-500/30',
  cyan: 'bg-cyan-500/15 text-cyan-500 border-cyan-500/30',
  amber: 'bg-amber-500/15 text-amber-500 border-amber-500/30',
  pink: 'bg-pink-500/15 text-pink-500 border-pink-500/30',
  emerald: 'bg-emerald-500/15 text-emerald-500 border-emerald-500/30',
};

function AttributePills({ attributes }: { attributes: Record<string, any> }) {
  if (!attributes || Object.keys(attributes).length === 0) return null;
  const pills: { label: string; color: string }[] = [];
  
  // Hardcoded colorful pills
  if (attributes.finish) pills.push({ label: attributes.finish, color: 'violet' });
  if (attributes.peso) pills.push({ label: attributes.peso + 'kg', color: 'cyan' });
  
  // Handle different variations of "talla" (tallas array or talla string/array)
  let tallaVal = attributes.tallas || attributes.talla;
  if (tallaVal) {
    if (Array.isArray(tallaVal)) {
      pills.push({ label: tallaVal.slice(0, 3).join(', '), color: 'amber' });
    } else if (typeof tallaVal === 'string') {
      pills.push({ label: tallaVal, color: 'amber' });
    }
  }

  if (attributes.color) pills.push({ label: attributes.color, color: 'pink' });
  if (attributes.proteccion_uv) pills.push({ label: attributes.proteccion_uv, color: 'emerald' });

  if (pills.length === 0) return null;
  return (
    <div className="flex flex-wrap gap-1.5">
      {pills.map((pill, i) => (
        <span key={i} className={`px-2 py-0.5 rounded text-[8px] font-semibold uppercase tracking-wide border ${PILL_COLOR_MAP[pill.color] || ''}`}>
          {pill.label}
        </span>
      ))}
    </div>
  );
}

interface MobileActionsProps {
  isInWidget?: boolean;
  canAddToWidget?: boolean;
  onAddToWidget?: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

function MobileActions({ isInWidget, canAddToWidget, onAddToWidget, onEdit, onDelete }: MobileActionsProps) {
  return (
    <div className="flex items-center gap-2 mt-3 lg:hidden">
      {onAddToWidget && (
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={() => onAddToWidget()}
          disabled={isInWidget || !canAddToWidget}
          className={`flex-1 flex items-center justify-center gap-1 py-2 rounded-lg text-[10px] font-bold uppercase transition-all ${
            isInWidget ? 'bg-emerald-500/15 text-emerald-400' : canAddToWidget === false ? 'bg-gray-500/10 text-gray-400' : 'bg-accent/15 text-accent'
          }`}
        >
          {isInWidget ? <Check size={12} /> : <Plus size={12} />}
          {isInWidget ? 'En Widget' : 'Agregar'}
        </motion.button>
      )}
      <motion.button whileTap={{ scale: 0.95 }} onClick={onEdit} className="px-3 py-2 rounded-lg" style={{ background: 'var(--btn-bg)', border: '1px solid var(--card-border)' }}>
        <Edit3 size={14} style={{ color: 'var(--text-primary)' }} />
      </motion.button>
      <motion.button whileTap={{ scale: 0.95 }} onClick={onDelete} className="px-3 py-2 rounded-lg bg-red-500/15 border border-red-500/20">
        <Trash2 size={14} className="text-red-500" />
      </motion.button>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// LIST VIEW
// ═══════════════════════════════════════════════════════════════════════════════

interface ListViewProps {
  products: Product[];
  onEdit: (product: Product) => void;
  onDelete: (productId: string) => void;
  widgetProductIds?: string[];
  onAddToWidget?: (productId: string) => void;
  canAddToWidget?: boolean;
}

export const ListView = React.forwardRef<HTMLDivElement, ListViewProps>(({ products, onEdit, onDelete, widgetProductIds, onAddToWidget, canAddToWidget }, ref) => {
  return (
    <div ref={ref} className="rounded-2xl overflow-hidden shadow-[0_4px_24px_rgba(0,0,0,0.2)]" style={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)' }}>
      <div className="h-1 bg-gradient-to-r from-accent to-transparent" />
      <div className="hidden xl:block overflow-x-auto no-scrollbar">
        <table className="w-full min-w-[750px]">
          <thead>
            <tr style={{ background: 'var(--table-header-bg)' }}>
              <th className="pl-8 pr-6 py-5 text-left text-[10px] font-bold uppercase tracking-[0.15em]" style={{ color: 'var(--text-muted)' }}>Producto</th>
              <th className="px-6 py-5 text-left text-[10px] font-bold uppercase tracking-[0.15em]" style={{ color: 'var(--text-muted)' }}>Categoría</th>
              <th className="px-6 py-5 text-left text-[10px] font-bold uppercase tracking-[0.15em]" style={{ color: 'var(--text-muted)' }}>Specs</th>
              <th className="px-6 py-5 text-right text-[10px] font-bold uppercase tracking-[0.15em]" style={{ color: 'var(--text-muted)' }}>Precio</th>
              <th className="pr-8 pl-6 py-5 text-right text-[10px] font-bold uppercase tracking-[0.15em]" style={{ color: 'var(--text-muted)' }}>Acciones</th>
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
                  className="group cursor-pointer"
                  style={{ borderBottom: '1px solid var(--card-border)' }}
                >
                  <td className="pl-8 pr-6 py-6">
                    <div className="flex items-center gap-5">
                      <div className="w-16 h-16 rounded-xl overflow-hidden flex-shrink-0" style={{ border: '1px solid var(--card-border)' }}>
                        <ImageWithFallback src={product.imageUrl} alt={product.name} className="w-full h-full" />
                      </div>
                      <div className="min-w-0">
                        <h4 className="font-bold uppercase tracking-tight text-base" style={{ color: 'var(--text-primary)' }}>{product.name}</h4>
                        {(product.shortDescription || product.description) && (
                          <p className="text-[11px] mt-1 line-clamp-1" style={{ color: 'var(--text-muted)' }}>{product.shortDescription || product.description}</p>
                        )}
                        <div className="flex items-center gap-2 mt-2">
                          <div className="w-1.5 h-1.5 rounded-full bg-zinc-500 shadow-[0_0_6px_rgba(113,113,122,0.4)]" />
                          <span className="text-[9px] font-semibold uppercase text-zinc-500">Activo</span>
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-6">
                    <div className="flex flex-col gap-2">
                      <CategoryBadge category={product.category} />
                      {product.badge && <ProductBadge type={product.badge} />}
                    </div>
                  </td>
                  <td className="px-6 py-6">
                    <TechSpecs attributes={product.attributes || {}} />
                    <div className="mt-2"><AttributePills attributes={product.attributes || {}} /></div>
                  </td>
                  <td className="px-6 py-6 text-right"><PriceDisplay price={product.price ?? 0} category={product.category} /></td>
                  <td className="pr-8 pl-6 py-6 text-right">
                    <div className="flex justify-end gap-3">
                      {onAddToWidget && (
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => onAddToWidget(product.id)}
                          disabled={widgetProductIds?.includes(product.id) || !canAddToWidget}
                          className="p-3 rounded-xl transition-all"
                          style={{
                            background: widgetProductIds?.includes(product.id) ? 'var(--btn-bg)' : 'var(--btn-bg)',
                            border: widgetProductIds?.includes(product.id) ? '1px solid rgba(255, 255, 255, 0.2)' : '1px solid var(--card-border)',
                          }}
                        >
                          {widgetProductIds?.includes(product.id) ? <Check size={18} className="text-accent" /> : <Plus size={18} className={canAddToWidget === false ? 'text-gray-500' : 'text-accent'} />}
                        </motion.button>
                      )}
                      <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => onEdit(product)} className="p-3 rounded-xl" style={{ background: 'var(--btn-bg)', border: '1px solid var(--card-border)' }}>
                        <Edit3 size={18} style={{ color: 'var(--text-primary)' }} />
                      </motion.button>
                      <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => onDelete(product.id)} className="p-3 rounded-xl bg-red-500/15 border border-red-500/25">
                        <Trash2 size={18} className="text-red-500" />
                      </motion.button>
                    </div>
                  </td>
                </motion.tr>
              ))}
            </AnimatePresence>
          </tbody>
        </table>
      </div>
      <div className="hidden lg:block xl:hidden overflow-x-auto no-scrollbar">
        <table className="w-full min-w-[650px]">
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
                        <ImageWithFallback src={product.imageUrl} alt={product.name} className="w-full h-full" />
                      </div>
                      <div className="min-w-0">
                        <h4 className="font-bold uppercase tracking-tight text-sm" style={{ color: 'var(--text-primary)' }}>{product.name}</h4>
                        {(product.shortDescription || product.description) && (
                          <p className="text-[10px] mt-0.5 line-clamp-1" style={{ color: 'var(--text-muted)' }}>{product.shortDescription || product.description}</p>
                        )}
                        <div className="flex items-center gap-2 mt-1.5">
                          <div className="w-1.5 h-1.5 rounded-full bg-zinc-900 shadow-[0_0_6px_rgba(24,24,27,1)]" />
                          <span className="text-[9px] font-semibold uppercase text-zinc-900">Activo</span>
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
                    <div className="mt-1.5"><AttributePills attributes={product.attributes || {}} /></div>
                  </td>
                  <td className="px-6 py-5 text-right"><PriceDisplay price={product.price ?? 0} category={product.category} /></td>
                  <td className="px-6 py-5 text-right">
                    <div className="flex justify-end gap-2">
                      {onAddToWidget && (
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => onAddToWidget(product.id)}
                          disabled={widgetProductIds?.includes(product.id) || !canAddToWidget}
                          className="p-2.5 rounded-lg transition-all"
                          style={{
                            background: widgetProductIds?.includes(product.id) ? 'rgba(16,185,129,0.15)' : 'var(--btn-bg)',
                            border: widgetProductIds?.includes(product.id) ? '1px solid rgba(16,185,129,0.25)' : '1px solid var(--card-border)',
                          }}
                        >
                          {widgetProductIds?.includes(product.id) ? <Check size={16} className="text-emerald-500" /> : <Plus size={16} className={canAddToWidget === false ? 'text-gray-500' : 'text-accent'} />}
                        </motion.button>
                      )}
                      <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => onEdit(product)} className="p-2.5 rounded-lg" style={{ background: 'var(--btn-bg)', border: '1px solid var(--card-border)' }}>
                        <Edit3 size={16} style={{ color: 'var(--text-primary)' }} />
                      </motion.button>
                      <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => onDelete(product.id)} className="p-2.5 rounded-lg bg-red-500/15 border border-red-500/25">
                        <Trash2 size={16} className="text-red-500" />
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
                <ImageWithFallback src={product.imageUrl} alt={product.name} className="w-full h-full" />
              </div>
              <div className="flex-1 min-w-0 flex flex-col justify-between">
                <div>
                  <h4 className="font-bold uppercase text-xs" style={{ color: 'var(--text-primary)' }}>{product.name}</h4>
                  {(product.shortDescription || product.description) && (
                    <p className="text-[9px] mt-0.5 line-clamp-1" style={{ color: 'var(--text-muted)' }}>{product.shortDescription || product.description}</p>
                  )}
                  <div className="flex items-center gap-2 mt-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-zinc-900" />
                    <CategoryBadge category={product.category} />
                  </div>
                  <TechSpecs attributes={product.attributes || {}} />
                  <div className="mt-1.5"><AttributePills attributes={product.attributes || {}} /></div>
                </div>
                <div className="flex items-center justify-between mt-2">
                  <PriceDisplay price={product.price ?? 0} category={product.category} />
                  <div className="flex gap-2">
                    <motion.button whileTap={{ scale: 0.95 }} onClick={() => onEdit(product)} className="px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase" style={{ background: 'var(--btn-bg)' }}>
                      <Edit3 size={12} className="inline mr-1" />Editar
                    </motion.button>
                    <motion.button whileTap={{ scale: 0.95 }} onClick={() => onDelete(product.id)} className="px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase bg-red-500/15 text-red-500">
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
});

ProductCard.displayName = 'ProductCard';
ListView.displayName = 'ListView';

export type ViewMode = 'grid' | 'thumbnails' | 'list';

interface ProductListProps {
  products: Product[];
  viewMode?: ViewMode;
  onEdit: (product: Product) => void;
  onDelete: (productId: string) => void;
  widgetProductIds?: string[];
  onAddToWidget?: (productId: string) => void;
  canAddToWidget?: boolean;
  sortBy?: SortOption;
  onSortChange?: (sort: SortOption) => void;
}

interface GridViewProps extends Omit<ProductListProps, 'viewMode'> {
  variant: 'grid' | 'thumbnails';
}

const GridView = React.forwardRef<HTMLDivElement, GridViewProps>(({ products, onEdit, onDelete, widgetProductIds, onAddToWidget, canAddToWidget, variant }, ref) => {
  const isThumbnails = variant === 'thumbnails';

  // Grid columns: fewer on laptops for better density, more on huge screens
  // Thumbnails: more but smaller cards | Grid: fewer but larger cards
  const gridClass = isThumbnails
    ? 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4'
    : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6';

  return (
    <motion.div
      ref={ref}
      variants={staggerContainer}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: '-50px' }}
      className={`grid ${gridClass}`}
      style={{
        // Wide laptop: expand to edges, tighter columns in center
        gridTemplateColumns: isThumbnails
          ? 'repeat(auto-fill, minmax(180px, 1fr))'
          : 'repeat(auto-fill, minmax(280px, 1fr))',
      }}
    >
      <AnimatePresence mode="popLayout">
        {products.map((product, idx) => (
          <ProductCard
            key={product.id}
            product={product}
            variant={variant}
            onEdit={() => onEdit(product)}
            onDelete={() => onDelete(product.id)}
            isInWidget={widgetProductIds?.includes(product.id)}
            onAddToWidget={onAddToWidget ? () => onAddToWidget(product.id) : undefined}
            canAddToWidget={canAddToWidget}
          />
        ))}
      </AnimatePresence>
    </motion.div>
  );
});

GridView.displayName = 'GridView';

export function ProductList({ products, viewMode = 'grid', onEdit, onDelete, widgetProductIds, onAddToWidget, canAddToWidget, sortBy, onSortChange }: ProductListProps) {
  return (
    <div className="pb-20">
      {/* Product count and Sort control - Visible in all views */}
      {onSortChange && (
        <div className="flex items-center justify-between mb-6 px-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
            {products.length} producto{products.length !== 1 ? 's' : ''}
          </span>
          <SortDropdown sortBy={sortBy || 'name_asc'} onSortChange={onSortChange} />
        </div>
      )}
      <AnimatePresence mode="popLayout">
        {viewMode === 'list' && <ListView key="list" products={products} onEdit={onEdit} onDelete={onDelete} widgetProductIds={widgetProductIds} onAddToWidget={onAddToWidget} canAddToWidget={canAddToWidget} />}
        {viewMode === 'thumbnails' && <GridView key="thumbnails" products={products} onEdit={onEdit} onDelete={onDelete} widgetProductIds={widgetProductIds} onAddToWidget={onAddToWidget} canAddToWidget={canAddToWidget} variant="thumbnails" />}
        {viewMode === 'grid' && <GridView key="grid" products={products} onEdit={onEdit} onDelete={onDelete} widgetProductIds={widgetProductIds} onAddToWidget={onAddToWidget} canAddToWidget={canAddToWidget} variant="grid" />}
      </AnimatePresence>
    </div>
  );
}