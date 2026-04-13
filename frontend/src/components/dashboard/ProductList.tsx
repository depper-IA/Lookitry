'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Product } from '@/types';
import { 
  Edit3, 
  Trash2, 
  Package,
  Sparkles,
  Gauge,
  Shield,
  Zap,
  Star
} from 'lucide-react';

import { getProxiedUrl } from '@/utils/imageProxy';

export type ViewMode = 'grid' | 'thumbnails' | 'list';

interface ProductListProps {
  products: Product[];
  viewMode?: ViewMode;
  onEdit: (product: Product) => void;
  onDelete: (productId: string) => void;
}

// ── Configuración de unidades por categoría ────────────────────────────────
const CATEGORY_UNITS: Record<string, string> = {
  rines: 'set de 4 unidades',
  camisas: 'por unidad',
  default: '',
};

// ── Brand Colors CSS Variables ─────────────────────────────────────────────
const BRAND_COLORS = {
  primary: 'var(--accent, #FF5C3A)',
  dark: 'var(--color-dark, #0a0a0a)',
  warm: 'var(--color-warm, #f5f2ee)',
};

// ── Category Badge ─────────────────────────────────────────────────────────

function CategoryBadge({ category }: { category: string }) {
  const configs: Record<string, { gradient: string; textColor: string; icon: React.ReactNode }> = {
    rines: { gradient: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)', textColor: 'text-slate-100', icon: <Gauge className="w-2.5 h-2.5" /> },
    camisas: { gradient: 'linear-gradient(135deg, #78350f 0%, #451a03 100%)', textColor: 'text-amber-100', icon: <Star className="w-2.5 h-2.5" /> },
    default: { gradient: 'linear-gradient(135deg, #27272a 0%, #18181b 100%)', textColor: 'text-zinc-100', icon: <Sparkles className="w-2.5 h-2.5" /> },
  };
  
  const c = configs[category.toLowerCase()] || configs.default;
  
  return (
    <div 
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg ${c.textColor} text-[10px] font-bold uppercase tracking-wider`}
      style={{ background: c.gradient, boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.1), 0 2px 8px rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.08)' }}
    >
      {c.icon}
      <span>{category}</span>
    </div>
  );
}

// ── Product Badge ──────────────────────────────────────────────────────────

function ProductBadge({ badge }: { badge: string }) {
  const configs: Record<string, { gradient: string; textColor: string; shadowColor: string; borderColor: string; icon: React.ReactNode }> = {
    nuevo:  { gradient: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', textColor: 'text-white', shadowColor: 'rgba(16, 185, 129, 0.4)', borderColor: 'rgba(52, 211, 153, 0.3)', icon: <Sparkles className="w-2.5 h-2.5" /> },
    top:    { gradient: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)', textColor: 'text-white', shadowColor: 'rgba(245, 158, 11, 0.4)', borderColor: 'rgba(251, 191, 36, 0.3)', icon: <Zap className="w-2.5 h-2.5" /> },
    oferta: { gradient: 'linear-gradient(135deg, #f43f5e 0%, #e11d48 100%)', textColor: 'text-white', shadowColor: 'rgba(244, 63, 94, 0.4)', borderColor: 'rgba(251, 113, 133, 0.3)', icon: <Shield className="w-2.5 h-2.5" /> },
  };
  
  const c = configs[badge.toLowerCase()] || configs.nuevo;
  
  return (
    <div 
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg ${c.textColor} text-[10px] font-bold uppercase tracking-wider`}
      style={{ background: c.gradient, boxShadow: `inset 0 1px 0 rgba(255,255,255,0.2), 0 2px 12px ${c.shadowColor}`, border: `1px solid ${c.borderColor}` }}
    >
      {c.icon}
      <span>{badge}</span>
    </div>
  );
}

// ── Empty State ───────────────────────────────────────────────────────────

function EmptyState() {
  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      className="relative p-16 md:p-20 text-center overflow-hidden"
      style={{ background: 'var(--bg-card)', borderRadius: '2rem', border: '1px solid var(--border-color)', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)' }}
    >
      <div className="absolute inset-0 pointer-events-none" style={{ background: `radial-gradient(ellipse at center, ${BRAND_COLORS.primary}08 0%, transparent 70%)` }} />
      
      <div className="relative">
        <div 
          className="w-20 h-20 md:w-24 md:h-24 mx-auto mb-6 md:mb-8 rounded-2xl flex items-center justify-center border"
          style={{ background: 'var(--bg-input)', borderColor: 'var(--border-color)', boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.1), 0 8px 32px rgba(0,0,0,0.15)' }}
        >
          <Package className="w-10 h-10 md:w-12 md:h-12" style={{ color: 'var(--text-muted)' }} />
        </div>
        
        <h3 className="text-xl md:text-2xl font-black uppercase tracking-tight mb-3" style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-jakarta)' }}>
          Catálogo Vacío
        </h3>
        <p className="text-sm md:text-base max-w-sm mx-auto leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
          Tu inventario está esperando las próximas tendencias. Agrega tu primer producto para comenzar.
        </p>
        
        <div className="flex items-center justify-center gap-4 mt-8">
          <div className="h-px w-12 md:w-16" style={{ background: `linear-gradient(to right, transparent, var(--border-color))` }} />
          <div className="w-2 h-2 rounded-full" style={{ background: BRAND_COLORS.primary }} />
          <div className="h-px w-12 md:w-16" style={{ background: `linear-gradient(to left, transparent, var(--border-color))` }} />
        </div>
      </div>
    </motion.div>
  );
}

// ── Attribute Pills ────────────────────────────────────────────────────────

function AttributePills({ attributes }: { attributes: Record<string, any> }) {
  if (!attributes || Object.keys(attributes).length === 0) return null;
  
  const pills: { value: string }[] = [];
  if (attributes.finish) pills.push({ value: attributes.finish });
  if (attributes.medida_pulgadas) pills.push({ value: attributes.medida_pulgadas + '"' });
  if (attributes.material) pills.push({ value: attributes.material });
  if (attributes.tipo_tela) pills.push({ value: attributes.tipo_tela });
  if (attributes.marca) pills.push({ value: attributes.marca });
  if (attributes.color) pills.push({ value: attributes.color });
  if (attributes.peso) pills.push({ value: attributes.peso + ' kg' });
  if (attributes.manga) pills.push({ value: attributes.manga });
  if (attributes.tallas && Array.isArray(attributes.tallas) && attributes.tallas.length > 0) {
    pills.push({ value: attributes.tallas.slice(0, 4).join(', ') + (attributes.tallas.length > 4 ? '...' : '') });
  }
  
  if (pills.length === 0) return null;
  
  return (
    <div className="flex flex-wrap gap-1.5">
      {pills.map((pill, idx) => (
        <span 
          key={idx}
          className="inline-flex items-center px-2 py-0.5 rounded text-[9px] font-semibold"
          style={{ background: 'rgba(51, 51, 51, 0.8)', color: 'rgb(226, 232, 240)', border: '1px solid rgba(100, 116, 139, 0.3)' }}
        >
          {pill.value}
        </span>
      ))}
    </div>
  );
}

// ── Technical Subtitle ─────────────────────────────────────────────────────

function TechnicalSubtitle({ attributes }: { attributes: Record<string, any> }) {
  if (!attributes || Object.keys(attributes).length === 0) return null;
  
  const parts: string[] = [];
  if (attributes.material) parts.push(attributes.material);
  if (attributes.medida_pulgadas) parts.push(attributes.medida_pulgadas + '"');
  if (attributes.color) parts.push(attributes.color);
  if (attributes.tipo_tela) parts.push(attributes.tipo_tela);
  if (attributes.marca) parts.push(attributes.marca);
  
  if (parts.length === 0) return null;
  
  return (
    <p className="text-[10px] md:text-[11px] font-medium tracking-wide truncate" style={{ color: 'var(--text-muted)' }}>
      {parts.join(' · ')}
    </p>
  );
}

// ── Price Display ──────────────────────────────────────────────────────────

function PriceDisplay({ price, category }: { price: number; category: string }) {
  const unit = CATEGORY_UNITS[category.toLowerCase()] || CATEGORY_UNITS.default;
  
  return (
    <div className="text-right">
      {unit && (
        <p className="text-[8px] md:text-[9px] font-medium tracking-wide mb-0.5 opacity-70" style={{ color: 'var(--text-muted)' }}>
          {unit}
        </p>
      )}
      <p className="text-lg md:text-xl font-black italic" style={{ color: BRAND_COLORS.primary, fontFamily: 'var(--font-jakarta)' }}>
        ${price.toLocaleString('es-CO')}
      </p>
    </div>
  );
}

// ── Status Indicator ───────────────────────────────────────────────────────

function StatusIndicator() {
  return (
    <div className="flex items-center gap-1.5">
      <div className="w-2 h-2 rounded-full" style={{ background: '#34d399', boxShadow: '0 0 8px rgba(52, 211, 153, 0.6)' }} />
      <span className="text-[9px] md:text-[10px] font-bold uppercase tracking-wider" style={{ color: '#34d399' }}>Activo</span>
    </div>
  );
}

// ── Card Action Buttons ─────────────────────────────────────────────────────

function CardActions({ onEdit, onDelete, compact = false }: { onEdit: () => void; onDelete: () => void; compact?: boolean }) {
  return (
    <div className="flex justify-center gap-2">
      <motion.button 
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={onEdit}
        className="flex items-center gap-1.5 px-3 md:px-4 py-2 md:py-2.5 rounded-xl font-bold uppercase tracking-wider text-[10px] md:text-xs transition-all"
        style={{ background: 'rgba(255, 255, 255, 0.95)', color: '#000', boxShadow: '0 4px 12px rgba(0,0,0,0.15)', border: '1px solid rgba(255,255,255,0.2)' }}
        onMouseEnter={(e) => { e.currentTarget.style.background = '#000'; e.currentTarget.style.color = '#fff'; }}
        onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255, 255, 255, 0.95)'; e.currentTarget.style.color = '#000'; }}
      >
        <Edit3 size={compact ? 12 : 13} />
        <span className="hidden sm:inline">{compact ? 'Edit' : 'Editar'}</span>
      </motion.button>
      <motion.button 
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={onDelete}
        className="flex items-center gap-1.5 px-3 md:px-4 py-2 md:py-2.5 rounded-xl font-bold uppercase tracking-wider text-[10px] md:text-xs transition-all"
        style={{ background: 'rgba(244, 63, 94, 0.9)', color: '#fff', boxShadow: '0 4px 12px rgba(244, 63, 94, 0.3)', border: '1px solid rgba(244, 63, 94, 0.4)' }}
        onMouseEnter={(e) => { e.currentTarget.style.background = '#e11d48'; }}
        onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(244, 63, 94, 0.9)'; }}
      >
        <Trash2 size={compact ? 12 : 13} />
        <span className="hidden sm:inline">{compact ? 'Del' : 'Eliminar'}</span>
      </motion.button>
    </div>
  );
}

// ── Product Card (Base Component) ───────────────────────────────────────────

function ProductCard({ 
  product, 
  variant = 'grid',
  onEdit, 
  onDelete 
}: { 
  product: Product; 
  variant?: 'grid' | 'thumbnails' | 'list';
  onEdit: () => void; 
  onDelete: () => void; 
}) {
  const isGrid = variant === 'grid';
  const isThumbnails = variant === 'thumbnails';
  const isList = variant === 'list';
  
  const cardBaseStyle = {
    background: 'var(--bg-card)',
    borderRadius: '1.25rem',
    border: '1px solid var(--border-color)',
    boxShadow: isGrid 
      ? '0 20px 40px -10px rgba(0, 0, 0, 0.2), 0 0 0 1px rgba(0,0,0,0.05)'
      : '0 12px 24px -8px rgba(0, 0, 0, 0.15)',
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
      className="group relative"
    >
      {/* Outer Glow */}
      <div 
        className="absolute -inset-1 rounded-3xl pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-500"
        style={{ background: `radial-gradient(ellipse at center, ${BRAND_COLORS.primary}15 0%, transparent 70%)` }}
      />

      {/* Main Card */}
      <div 
        className="relative flex flex-col overflow-hidden"
        style={{ 
          ...cardBaseStyle,
          minHeight: isGrid ? '480px' : isThumbnails ? '350px' : 'auto',
        }}
      >
        {/* Image Container */}
        <div className="relative overflow-hidden flex-shrink-0" style={{ aspectRatio: isList ? 'auto' : '4/5' }}>
          <img 
            src={getProxiedUrl(product.imageUrl)} 
            alt={product.name} 
            className={`w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-${isThumbnails ? '110' : '105'}`}
          />
          
          {/* Gradient Overlay */}
          <div className="absolute inset-0 pointer-events-none" style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0.2) 40%, transparent 100%)' }} />
          
          {/* Brand Accent */}
          <div className="absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-500" style={{ background: `linear-gradient(135deg, ${BRAND_COLORS.primary}15 0%, transparent 50%)` }} />

          {/* Badges - Top Left */}
          <div className="absolute top-3 left-3 flex flex-col gap-2">
            <ProductBadge badge={product.badge || 'Nuevo'} />
            {!isList && <CategoryBadge category={product.category} />}
          </div>

          {/* Status Dot - Top Right */}
          <div className="absolute top-3 right-3">
            <div className="w-7 h-7 rounded-xl flex items-center justify-center" style={{ background: 'rgba(16, 185, 129, 0.9)', boxShadow: '0 4px 12px rgba(16, 185, 129, 0.4)', border: '1px solid rgba(52, 211, 153, 0.4)' }}>
              <div className="w-1.5 h-1.5 rounded-full bg-white" style={{ animation: 'pulse-dot 2s ease-in-out infinite' }} />
            </div>
          </div>

          {/* Action Buttons - Bottom Overlay */}
          <div className="absolute bottom-0 left-0 right-0 p-4 lg:translate-y-full lg:group-hover:translate-y-0 transition-transform duration-500" style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.6) 60%, transparent 100%)' }}>
            <CardActions onEdit={onEdit} onDelete={onDelete} compact={isThumbnails} />
          </div>
        </div>

        {/* Content Section */}
        <div className={`flex flex-col justify-between ${isList ? 'p-4' : 'p-4 md:p-5'} space-y-3 flex-1`}>
          {/* Product Name */}
          <div className="space-y-2">
            <h3 
              className="text-sm md:text-base font-black uppercase tracking-tight leading-tight line-clamp-2 transition-colors duration-300"
              style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-jakarta)' }}
              onMouseEnter={(e) => e.currentTarget.style.color = BRAND_COLORS.primary}
              onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-primary)'}
            >
              {product.name}
            </h3>
            
            {product.shortDescription && !isThumbnails && (
              <p className="text-[11px] md:text-xs leading-relaxed line-clamp-2" style={{ color: 'var(--text-secondary)' }}>
                {product.shortDescription}
              </p>
            )}
            
            {isList && <TechnicalSubtitle attributes={product.attributes || {}} />}
            {!isList && <TechnicalSubtitle attributes={product.attributes || {}} />}
          </div>
          
          {/* List view category + badges */}
          {isList && (
            <div className="flex flex-col gap-1.5">
              <CategoryBadge category={product.category} />
              {product.badge && <ProductBadge badge={product.badge} />}
            </div>
          )}
          
          {/* Attributes */}
          {!isList && <AttributePills attributes={product.attributes || {}} />}
          {isList && <AttributePills attributes={product.attributes || {}} />}
          
          {/* Footer */}
          <div className="flex items-end justify-between pt-3 mt-auto" style={{ borderTop: '1px solid var(--border-color)' }}>
            <StatusIndicator />
            {product.price != null && <PriceDisplay price={product.price} category={product.category} />}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// ── Grid View ───────────────────────────────────────────────────────────────

function GridView({ products, onEdit, onDelete }: Omit<ProductListProps, 'viewMode'>) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 md:gap-6">
      <AnimatePresence mode="popLayout">
        {products.map((product, idx) => (
          <motion.div
            key={product.id}
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ delay: idx * 0.06, duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
          >
            <ProductCard product={product} variant="grid" onEdit={() => onEdit(product)} onDelete={() => onDelete(product.id)} />
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

// ── Thumbnails View ─────────────────────────────────────────────────────────

function ThumbnailsView({ products, onEdit, onDelete }: Omit<ProductListProps, 'viewMode'>) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 md:gap-5">
      <AnimatePresence mode="popLayout">
        {products.map((product, idx) => (
          <motion.div
            key={product.id}
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ delay: idx * 0.04, duration: 0.4 }}
          >
            <ProductCard product={product} variant="thumbnails" onEdit={() => onEdit(product)} onDelete={() => onDelete(product.id)} />
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

// ── List View ───────────────────────────────────────────────────────────────

function ListView({ products, onEdit, onDelete }: Omit<ProductListProps, 'viewMode'>) {
  return (
    <div 
      className="overflow-hidden"
      style={{ background: 'var(--bg-card)', borderRadius: '1.25rem', border: '1px solid var(--border-color)', boxShadow: '0 20px 40px -10px rgba(0, 0, 0, 0.2)' }}
    >
      {/* Top Gradient Accent */}
      <div className="h-1" style={{ background: `linear-gradient(to right, ${BRAND_COLORS.primary}, ${BRAND_COLORS.primary}50, transparent)` }} />
      
      {/* Ambient Glow */}
      <div className="absolute inset-0 pointer-events-none" style={{ background: `radial-gradient(ellipse at top, ${BRAND_COLORS.primary}05 0%, transparent 60%)` }} />
      
      {/* Desktop Table */}
      <div className="hidden lg:block relative">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr style={{ background: 'rgba(0, 0, 0, 0.05)', borderBottom: '1px solid var(--border-color)' }}>
              <th className="px-5 py-4 text-[10px] font-bold uppercase tracking-[0.2em] italic" style={{ color: 'var(--text-muted)' }}>Producto</th>
              <th className="px-5 py-4 text-[10px] font-bold uppercase tracking-[0.2em] italic" style={{ color: 'var(--text-muted)' }}>Categoría</th>
              <th className="px-5 py-4 text-[10px] font-bold uppercase tracking-[0.2em] italic" style={{ color: 'var(--text-muted)' }}>Especificaciones</th>
              <th className="px-5 py-4 text-[10px] font-bold uppercase tracking-[0.2em] italic text-right" style={{ color: 'var(--text-muted)' }}>Precio</th>
              <th className="px-5 py-4 text-[10px] font-bold uppercase tracking-[0.2em] italic text-right" style={{ color: 'var(--text-muted)' }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            <AnimatePresence mode="popLayout">
              {products.map((product, idx) => (
                <motion.tr
                  key={product.id}
                  layout
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ delay: idx * 0.04 }}
                  className="group hover:bg-black/5 transition-colors"
                  style={{ borderBottom: '1px solid var(--border-color)' }}
                >
                  {/* Product Column */}
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-4">
                      <div className="relative flex-shrink-0">
                        <div className="absolute -inset-1 rounded-xl pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity" style={{ background: `radial-gradient(ellipse at center, ${BRAND_COLORS.primary}20 0%, transparent 70%)` }} />
                        <div className="relative w-14 h-14 rounded-xl overflow-hidden" style={{ border: '1px solid var(--border-color)', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
                          <img src={getProxiedUrl(product.imageUrl)} alt={product.name} className="w-full h-full object-cover" />
                        </div>
                      </div>
                      <div className="min-w-0 flex-1">
                        <h4 
                          className="text-sm font-bold uppercase tracking-tight leading-tight line-clamp-1 transition-colors"
                          style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-jakarta)' }}
                          onMouseEnter={(e) => e.currentTarget.style.color = BRAND_COLORS.primary}
                          onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-primary)'}
                        >
                          {product.name}
                        </h4>
                        {product.shortDescription && (
                          <p className="text-[10px] mt-1 line-clamp-1 max-w-xs leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                            {product.shortDescription}
                          </p>
                        )}
                        <div className="flex items-center gap-2 mt-2">
                          <div className="w-1.5 h-1.5 rounded-full" style={{ background: '#34d399', boxShadow: '0 0 6px rgba(52, 211, 153, 0.5)' }} />
                          <span className="text-[9px] font-bold uppercase tracking-wider" style={{ color: '#34d399' }}>Activo</span>
                        </div>
                      </div>
                    </div>
                  </td>
                  
                  {/* Category Column */}
                  <td className="px-5 py-4">
                    <div className="flex flex-col gap-1.5">
                      <CategoryBadge category={product.category} />
                      {product.badge && <ProductBadge badge={product.badge} />}
                    </div>
                  </td>
                  
                  {/* Specifications Column */}
                  <td className="px-5 py-4">
                    <div className="space-y-2">
                      <TechnicalSubtitle attributes={product.attributes || {}} />
                      <AttributePills attributes={product.attributes || {}} />
                    </div>
                  </td>
                  
                  {/* Price Column */}
                  <td className="px-5 py-4 text-right">
                    <PriceDisplay price={product.price ?? 0} category={product.category} />
                  </td>
                  
                  {/* Actions Column */}
                  <td className="px-5 py-4 text-right">
                    <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-x-4 group-hover:translate-x-0">
                      <motion.button 
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => onEdit(product)} 
                        className="p-3 rounded-xl transition-all"
                        style={{ background: 'rgba(255, 255, 255, 0.95)', color: '#000', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', border: '1px solid rgba(255,255,255,0.2)' }}
                        onMouseEnter={(e) => { e.currentTarget.style.background = '#000'; e.currentTarget.style.color = '#fff'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255, 255, 255, 0.95)'; e.currentTarget.style.color = '#000'; }}
                      >
                        <Edit3 size={14} />
                      </motion.button>
                      <motion.button 
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => onDelete(product.id)} 
                        className="p-3 rounded-xl transition-all"
                        style={{ background: 'rgba(244, 63, 94, 0.9)', color: '#fff', boxShadow: '0 4px 12px rgba(244, 63, 94, 0.2)', border: '1px solid rgba(244, 63, 94, 0.4)' }}
                        onMouseEnter={(e) => { e.currentTarget.style.background = '#e11d48'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(244, 63, 94, 0.9)'; }}
                      >
                        <Trash2 size={14} />
                      </motion.button>
                    </div>
                  </td>
                </motion.tr>
              ))}
            </AnimatePresence>
          </tbody>
        </table>
      </div>

      {/* Mobile Stack Layout */}
      <div className="lg:hidden relative space-y-3 p-3">
        <AnimatePresence mode="popLayout">
          {products.map((product) => (
            <motion.div
              key={product.id}
              layout
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="group relative"
            >
              <div 
                className="flex items-center gap-3 p-4 overflow-hidden"
                style={{ background: 'var(--bg-card)', borderRadius: '1.25rem', border: '1px solid var(--border-color)', boxShadow: '0 8px 24px -6px rgba(0,0,0,0.15)' }}
              >
                {/* Accent Line */}
                <div className="absolute top-0 left-0 right-0 h-0.5" style={{ background: `linear-gradient(to right, ${BRAND_COLORS.primary}, transparent)` }} />
                
                {/* Image */}
                <div className="relative flex-shrink-0">
                  <div className="absolute -inset-1 rounded-xl pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity" style={{ background: `radial-gradient(ellipse at center, ${BRAND_COLORS.primary}20 0%, transparent 70%)` }} />
                  <div className="relative w-20 h-20 rounded-xl overflow-hidden" style={{ border: '1px solid var(--border-color)', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
                    <img src={getProxiedUrl(product.imageUrl)} alt={product.name} className="w-full h-full object-cover" />
                    
                    {/* Badges on image */}
                    <div className="absolute top-1.5 left-1.5">
                      <ProductBadge badge={product.badge || 'Nuevo'} />
                    </div>
                  </div>
                </div>
                
                {/* Content */}
                <div className="flex-1 min-w-0 flex flex-col justify-between py-1">
                  <div className="space-y-1.5">
                    <h4 
                      className="text-xs font-bold uppercase tracking-tight leading-tight line-clamp-1 transition-colors"
                      style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-jakarta)' }}
                      onMouseEnter={(e) => e.currentTarget.style.color = BRAND_COLORS.primary}
                      onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-primary)'}
                    >
                      {product.name}
                    </h4>
                    <div className="flex items-center gap-2 flex-wrap">
                      <div className="flex items-center gap-1">
                        <div className="w-1.5 h-1.5 rounded-full" style={{ background: '#34d399', boxShadow: '0 0 6px rgba(52, 211, 153, 0.5)' }} />
                        <span className="text-[9px] font-bold uppercase tracking-wider" style={{ color: '#34d399' }}>Activo</span>
                      </div>
                      <CategoryBadge category={product.category} />
                    </div>
                    <TechnicalSubtitle attributes={product.attributes || {}} />
                  </div>
                  
                  <div className="flex items-center justify-between mt-2">
                    <PriceDisplay price={product.price ?? 0} category={product.category} />
                    <div className="flex gap-1.5">
                      <motion.button 
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => onEdit(product)} 
                        className="w-8 h-8 rounded-lg flex items-center justify-center transition-all"
                        style={{ background: 'rgba(255, 255, 255, 0.95)', color: '#000', boxShadow: '0 2px 8px rgba(0,0,0,0.1)', border: '1px solid rgba(255,255,255,0.2)' }}
                        onMouseEnter={(e) => { e.currentTarget.style.background = '#000'; e.currentTarget.style.color = '#fff'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255, 255, 255, 0.95)'; e.currentTarget.style.color = '#000'; }}
                      >
                        <Edit3 size={12} />
                      </motion.button>
                      <motion.button 
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => onDelete(product.id)} 
                        className="w-8 h-8 rounded-lg flex items-center justify-center transition-all"
                        style={{ background: 'rgba(244, 63, 94, 0.9)', color: '#fff', boxShadow: '0 2px 8px rgba(244, 63, 94, 0.2)', border: '1px solid rgba(244, 63, 94, 0.4)' }}
                        onMouseEnter={(e) => { e.currentTarget.style.background = '#e11d48'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(244, 63, 94, 0.9)'; }}
                      >
                        <Trash2 size={12} />
                      </motion.button>
                    </div>
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

// ── Main Export ─────────────────────────────────────────────────────────────

export function ProductList({ products, viewMode = 'grid', onEdit, onDelete }: ProductListProps) {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { staggerChildren: 0.05 }
    }
  };

  return (
    <motion.div 
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className="pb-20"
    >
      {products.length === 0 ? (
        <EmptyState />
      ) : viewMode === 'list' ? (
        <ListView products={products} onEdit={onEdit} onDelete={onDelete} />
      ) : viewMode === 'thumbnails' ? (
        <ThumbnailsView products={products} onEdit={onEdit} onDelete={onDelete} />
      ) : (
        <GridView products={products} onEdit={onEdit} onDelete={onDelete} />
      )}
    </motion.div>
  );
}
