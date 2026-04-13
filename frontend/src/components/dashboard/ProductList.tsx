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
  Star,
  Eye,
  Layers
} from 'lucide-react';

import { getProxiedUrl } from '@/utils/imageProxy';

export type ViewMode = 'grid' | 'thumbnails' | 'list';

interface ProductListProps {
  products: Product[];
  viewMode?: ViewMode;
  onEdit: (product: Product) => void;
  onDelete: (productId: string) => void;
}

// ── Brand Configuration ──────────────────────────────────────────────────────
const BRAND = {
  accent: '#FF5C3A',
  accentLight: 'rgba(255, 92, 58, 0.15)',
  accentGlow: 'rgba(255, 92, 58, 0.4)',
  dark: '#0a0a0a',
  warm: '#f5f2ee',
  success: '#10B981',
  successGlow: 'rgba(16, 185, 129, 0.4)',
  danger: '#EF4444',
  cardBg: 'rgba(255, 255, 255, 0.03)',
  border: 'rgba(255, 255, 255, 0.08)',
};

// ── Category Units ─────────────────────────────────────────────────────────
const CATEGORY_UNITS: Record<string, string> = {
  rines: 'set de 4 unidades',
  camisas: 'por unidad',
  default: '',
};

// ── Category Config ─────────────────────────────────────────────────────────
const CATEGORY_CONFIG: Record<string, { bg: string; text: string; icon: React.ReactNode }> = {
  rines: { bg: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)', text: 'text-slate-100', icon: <Gauge className="w-2.5 h-2.5" /> },
  tshirt: { bg: 'linear-gradient(135deg, #3f3f46 0%, #27272a 100%)', text: 'text-zinc-100', icon: <Layers className="w-2.5 h-2.5" /> },
  camisa: { bg: 'linear-gradient(135deg, #78350f 0%, #451a03 100%)', text: 'text-amber-100', icon: <Star className="w-2.5 h-2.5" /> },
  default: { bg: 'linear-gradient(135deg, #27272a 0%, #18181b 100%)', text: 'text-zinc-100', icon: <Sparkles className="w-2.5 h-2.5" /> },
};

// ── Badge Config ───────────────────────────────────────────────────────────
const BADGE_CONFIG: Record<string, { bg: string; shadow: string; icon: React.ReactNode }> = {
  nuevo: { bg: 'linear-gradient(135deg, #10B981 0%, #059669 100%)', shadow: BRAND.successGlow, icon: <Sparkles className="w-2.5 h-2.5" /> },
  top: { bg: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)', shadow: 'rgba(245, 158, 11, 0.4)', icon: <Star className="w-2.5 h-2.5" /> },
  oferta: { bg: 'linear-gradient(135deg, #EF4444 0%, #DC2626 100%)', shadow: 'rgba(239, 68, 68, 0.4)', icon: <Sparkles className="w-2.5 h-2.5" /> },
};

// ── Components ───────────────────────────────────────────────────────────────

function CategoryBadge({ category }: { category: string }) {
  const config = CATEGORY_CONFIG[category.toLowerCase()] || CATEGORY_CONFIG.default;
  return (
    <span 
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg ${config.text} text-[10px] font-bold uppercase tracking-wider`}
      style={{ 
        background: config.bg,
        boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.1), 0 2px 8px rgba(0,0,0,0.3)',
        border: '1px solid rgba(255,255,255,0.06)'
      }}
    >
      {config.icon}
      {category}
    </span>
  );
}

function Badge({ type }: { type: string }) {
  const config = BADGE_CONFIG[type.toLowerCase()] || BADGE_CONFIG.nuevo;
  return (
    <span 
      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-white text-[10px] font-bold uppercase tracking-wider"
      style={{ 
        background: config.bg,
        boxShadow: `inset 0 1px 0 rgba(255,255,255,0.2), 0 2px 12px ${config.shadow}`,
        border: '1px solid rgba(255,255,255,0.1)'
      }}
    >
      {config.icon}
      {type}
    </span>
  );
}

function StatusDot() {
  return (
    <div className="flex items-center gap-1.5">
      <div 
        className="w-2 h-2 rounded-full"
        style={{ 
          background: BRAND.success,
          boxShadow: `0 0 8px ${BRAND.successGlow}`
        }}
      />
      <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: BRAND.success }}>
        Activo
      </span>
    </div>
  );
}

function PriceDisplay({ price, category }: { price: number; category: string }) {
  const unit = CATEGORY_UNITS[category.toLowerCase()] || CATEGORY_UNITS.default;
  
  return (
    <div className="text-right">
      {unit && (
        <p className="text-[9px] text-gray-400 mb-0.5 font-medium">{unit}</p>
      )}
      <p className="text-xl font-black" style={{ color: BRAND.accent, fontFamily: 'system-ui, sans-serif' }}>
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
  if (attributes.finish) parts.push(attributes.finish);
  if (attributes.color) parts.push(attributes.color);
  if (attributes.marca) parts.push(attributes.marca);
  
  if (parts.length === 0) return null;
  
  return (
    <p className="text-[11px] text-gray-500 font-medium tracking-wide truncate">
      {parts.join(' · ')}
    </p>
  );
}

function AttributePills({ attributes }: { attributes: Record<string, any> }) {
  if (!attributes || Object.keys(attributes).length === 0) return null;
  
  const pills: string[] = [];
  if (attributes.finish) pills.push(attributes.finish);
  if (attributes.material) pills.push(attributes.material);
  if (attributes.medida_pulgadas) pills.push(attributes.medida_pulgadas + '"');
  if (attributes.peso) pills.push(attributes.peso + ' kg');
  if (attributes.tallas && Array.isArray(attributes.tallas)) {
    pills.push(...attributes.tallas.slice(0, 3));
  }
  
  if (pills.length === 0) return null;
  
  return (
    <div className="flex flex-wrap gap-1.5">
      {pills.map((pill, i) => (
        <span 
          key={i}
          className="px-2 py-0.5 rounded text-[9px] font-semibold"
          style={{ 
            background: 'rgba(255, 255, 255, 0.06)',
            color: '#94a3b8',
            border: '1px solid rgba(255, 255, 255, 0.08)'
          }}
        >
          {pill}
        </span>
      ))}
    </div>
  );
}

// ── Product Card ────────────────────────────────────────────────────────────

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
  const [isHovered, setIsHovered] = useState(false);
  const isGrid = variant === 'grid';
  const isThumb = variant === 'thumbnails';
  const isList = variant === 'list';
  
  const cardHeight = isGrid ? 'min-h-[520px]' : isThumb ? 'min-h-[360px]' : '';
  
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
      className="group relative"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        height: cardHeight,
        display: 'flex',
        flexDirection: 'column'
      }}
    >
      {/* Outer Glow Effect */}
      <div 
        className="absolute -inset-0.5 rounded-2xl pointer-events-none transition-opacity duration-500"
        style={{ 
          opacity: isHovered ? 1 : 0,
          background: `radial-gradient(ellipse at center, ${BRAND.accentLight} 0%, transparent 70%)`
        }}
      />

      {/* Main Card */}
      <div 
        className="relative flex flex-col rounded-2xl overflow-hidden flex-1"
        style={{ 
          background: 'var(--bg-card, #111111)',
          border: '1px solid var(--border-color, rgba(255,255,255,0.06))',
          boxShadow: isHovered 
            ? '0 25px 50px -12px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(255,92,58,0.1)' 
            : '0 10px 25px -5px rgba(0, 0, 0, 0.2)',
          transition: 'all 0.4s ease'
        }}
      >
        {/* Image Container */}
        <div 
          className="relative overflow-hidden flex-shrink-0"
          style={{ 
            aspectRatio: isList ? 'auto' : '1/1',
            height: isList ? '80px' : 'auto'
          }}
        >
          <img 
            src={getProxiedUrl(product.imageUrl)} 
            alt={product.name} 
            className="w-full h-full object-cover transition-transform duration-700 ease-out"
            style={{ transform: isHovered ? 'scale(1.05)' : 'scale(1)' }}
          />
          
          {/* Gradient Overlay */}
          <div 
            className="absolute inset-0 pointer-events-none transition-opacity duration-300"
            style={{ 
              background: 'linear-gradient(to top, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0.1) 50%, transparent 100%)',
              opacity: isHovered ? 1 : 0.7
            }}
          />

          {/* Accent Glow on Hover */}
          <div 
            className="absolute inset-0 pointer-events-none transition-opacity duration-500"
            style={{ 
              background: `radial-gradient(ellipse at 30% 30%, ${BRAND.accentLight} 0%, transparent 60%)`,
              opacity: isHovered ? 1 : 0
            }}
          />

          {/* Top Badges */}
          <div className="absolute top-3 left-3 flex flex-col gap-2">
            <Badge type={product.badge || 'nuevo'} />
            {!isList && <CategoryBadge category={product.category} />}
          </div>

          {/* Status Indicator */}
          <div 
            className="absolute top-3 right-3 w-7 h-7 rounded-full flex items-center justify-center transition-all duration-300"
            style={{ 
              background: 'rgba(16, 185, 129, 0.9)',
              boxShadow: `0 4px 12px ${BRAND.successGlow}`,
              transform: isHovered ? 'scale(1.1)' : 'scale(1)'
            }}
          >
            <div className="w-1.5 h-1.5 rounded-full bg-white" />
          </div>

          {/* Action Buttons - Bottom Overlay */}
          <div 
            className="absolute bottom-0 left-0 right-0 p-4 transition-all duration-500"
            style={{ 
              transform: isHovered ? 'translateY(0)' : 'translateY(100%)',
              background: 'linear-gradient(to top, rgba(0,0,0,0.9) 0%, transparent 100%)'
            }}
          >
            <div className="flex justify-center gap-3">
              <motion.button 
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={onEdit}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold uppercase tracking-wider text-xs"
                style={{ 
                  background: 'rgba(255, 255, 255, 0.95)',
                  color: '#000',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.3)'
                }}
              >
                <Edit3 size={14} />
                Editar
              </motion.button>
              <motion.button 
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={onDelete}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold uppercase tracking-wider text-xs"
                style={{ 
                  background: BRAND.danger,
                  color: '#fff',
                  boxShadow: '0 4px 12px rgba(239, 68, 68, 0.3)'
                }}
              >
                <Trash2 size={14} />
                Eliminar
              </motion.button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex flex-col justify-between flex-1 p-4 space-y-3">
          {/* Product Name */}
          <div className="space-y-2">
            <h3 
              className="font-bold uppercase tracking-tight leading-tight line-clamp-2 transition-colors duration-300"
              style={{ 
                color: 'var(--text-primary, #fff)',
                fontSize: isThumb ? '11px' : '13px'
              }}
            >
              {product.name}
            </h3>
            
            {product.shortDescription && !isThumb && (
              <p 
                className="text-xs leading-relaxed line-clamp-2" 
                style={{ color: 'var(--text-secondary, #888)' }}
              >
                {product.shortDescription}
              </p>
            )}
            
            {!isList && <TechSpecs attributes={product.attributes || {}} />}
            {!isThumb && <AttributePills attributes={product.attributes || {}} />}
          </div>
          
          {/* Footer */}
          <div 
            className="flex items-center justify-between pt-3 mt-auto"
            style={{ borderTop: '1px solid var(--border-color, rgba(255,255,255,0.06))' }}
          >
            <StatusDot />
            {product.price != null && <PriceDisplay price={product.price} category={product.category} />}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// ── Views ───────────────────────────────────────────────────────────────────

function GridView({ products, onEdit, onDelete }: Omit<ProductListProps, 'viewMode'>) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      <AnimatePresence mode="popLayout">
        {products.map((product, idx) => (
          <motion.div
            key={product.id}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ delay: idx * 0.05, duration: 0.4 }}
          >
            <ProductCard product={product} variant="grid" onEdit={() => onEdit(product)} onDelete={() => onDelete(product.id)} />
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

function ThumbnailsView({ products, onEdit, onDelete }: Omit<ProductListProps, 'viewMode'>) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
      <AnimatePresence mode="popLayout">
        {products.map((product, idx) => (
          <motion.div
            key={product.id}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ delay: idx * 0.03, duration: 0.3 }}
          >
            <ProductCard product={product} variant="thumbnails" onEdit={() => onEdit(product)} onDelete={() => onDelete(product.id)} />
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

function ListView({ products, onEdit, onDelete }: Omit<ProductListProps, 'viewMode'>) {
  return (
    <div 
      className="rounded-2xl overflow-hidden"
      style={{ 
        background: 'var(--bg-card, #111)',
        border: '1px solid var(--border-color, rgba(255,255,255,0.06))',
        boxShadow: '0 20px 40px -10px rgba(0,0,0,0.3)'
      }}
    >
      {/* Accent Line */}
      <div className="h-1" style={{ background: `linear-gradient(to right, ${BRAND.accent}, transparent)` }} />
      
      {/* Desktop Table */}
      <div className="hidden lg:block">
        <table className="w-full">
          <thead>
            <tr style={{ background: 'rgba(0,0,0,0.3)', borderBottom: '1px solid var(--border-color, rgba(255,255,255,0.06))' }}>
              <th className="px-5 py-4 text-left text-[10px] font-bold uppercase tracking-[0.15em]" style={{ color: '#666' }}>Producto</th>
              <th className="px-5 py-4 text-left text-[10px] font-bold uppercase tracking-[0.15em]" style={{ color: '#666' }}>Categoría</th>
              <th className="px-5 py-4 text-left text-[10px] font-bold uppercase tracking-[0.15em]" style={{ color: '#666' }}>Specs</th>
              <th className="px-5 py-4 text-right text-[10px] font-bold uppercase tracking-[0.15em]" style={{ color: '#666' }}>Precio</th>
              <th className="px-5 py-4 text-right text-[10px] font-bold uppercase tracking-[0.15em]" style={{ color: '#666' }}>Acciones</th>
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
                  exit={{ opacity: 0 }}
                  transition={{ delay: idx * 0.03 }}
                  className="group"
                  style={{ borderBottom: '1px solid var(--border-color, rgba(255,255,255,0.04))' }}
                >
                  {/* Product */}
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 rounded-xl overflow-hidden flex-shrink-0" style={{ border: '1px solid var(--border-color)' }}>
                        <img src={getProxiedUrl(product.imageUrl)} alt={product.name} className="w-full h-full object-cover" />
                      </div>
                      <div>
                        <h4 className="font-bold uppercase tracking-tight text-sm" style={{ color: 'var(--text-primary)' }}>
                          {product.name}
                        </h4>
                        <div className="flex items-center gap-2 mt-1">
                          <div className="w-1.5 h-1.5 rounded-full" style={{ background: BRAND.success, boxShadow: `0 0 6px ${BRAND.successGlow}` }} />
                          <span className="text-[9px] font-bold uppercase" style={{ color: BRAND.success }}>Activo</span>
                        </div>
                      </div>
                    </div>
                  </td>
                  
                  {/* Category */}
                  <td className="px-5 py-4">
                    <div className="flex flex-col gap-1.5">
                      <CategoryBadge category={product.category} />
                      {product.badge && <Badge type={product.badge} />}
                    </div>
                  </td>
                  
                  {/* Specs */}
                  <td className="px-5 py-4">
                    <TechSpecs attributes={product.attributes || {}} />
                    <AttributePills attributes={product.attributes || {}} />
                  </td>
                  
                  {/* Price */}
                  <td className="px-5 py-4 text-right">
                    <PriceDisplay price={product.price ?? 0} category={product.category} />
                  </td>
                  
                  {/* Actions */}
                  <td className="px-5 py-4 text-right">
                    <div className="flex justify-end gap-2">
                      <motion.button 
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => onEdit(product)} 
                        className="p-2.5 rounded-lg"
                        style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)' }}
                      >
                        <Edit3 size={14} style={{ color: '#fff' }} />
                      </motion.button>
                      <motion.button 
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => onDelete(product.id)} 
                        className="p-2.5 rounded-lg"
                        style={{ background: 'rgba(239,68,68,0.2)', border: '1px solid rgba(239,68,68,0.3)' }}
                      >
                        <Trash2 size={14} style={{ color: BRAND.danger }} />
                      </motion.button>
                    </div>
                  </td>
                </motion.tr>
              ))}
            </AnimatePresence>
          </tbody>
        </table>
      </div>

      {/* Mobile List */}
      <div className="lg:hidden p-4 space-y-4">
        <AnimatePresence mode="popLayout">
          {products.map((product) => (
            <motion.div
              key={product.id}
              layout
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="flex gap-4 p-4 rounded-xl"
              style={{ 
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.06)'
              }}
            >
              <div className="w-20 h-20 rounded-lg overflow-hidden flex-shrink-0">
                <img src={getProxiedUrl(product.imageUrl)} alt={product.name} className="w-full h-full object-cover" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h4 className="font-bold uppercase text-xs" style={{ color: 'var(--text-primary)' }}>
                      {product.name}
                    </h4>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="w-1.5 h-1.5 rounded-full" style={{ background: BRAND.success }} />
                      <CategoryBadge category={product.category} />
                    </div>
                  </div>
                  <PriceDisplay price={product.price ?? 0} category={product.category} />
                </div>
                <TechSpecs attributes={product.attributes || {}} />
                <div className="flex gap-2 mt-2">
                  <motion.button 
                    whileTap={{ scale: 0.95 }}
                    onClick={() => onEdit(product)} 
                    className="px-3 py-1.5 rounded-lg text-xs font-bold uppercase"
                    style={{ background: 'rgba(255,255,255,0.1)' }}
                  >
                    <Edit3 size={12} className="inline mr-1" />
                    Editar
                  </motion.button>
                  <motion.button 
                    whileTap={{ scale: 0.95 }}
                    onClick={() => onDelete(product.id)} 
                    className="px-3 py-1.5 rounded-lg text-xs font-bold uppercase"
                    style={{ background: 'rgba(239,68,68,0.2)', color: BRAND.danger }}
                  >
                    <Trash2 size={12} className="inline mr-1" />
                    Eliminar
                  </motion.button>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}

// ── Empty State ─────────────────────────────────────────────────────────────

function EmptyState() {
  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="text-center p-16 rounded-3xl"
      style={{ 
        background: 'var(--bg-card)',
        border: '1px solid var(--border-color)'
      }}
    >
      <div 
        className="w-20 h-20 mx-auto mb-6 rounded-2xl flex items-center justify-center"
        style={{ background: 'rgba(255,92,58,0.1)', border: '1px solid rgba(255,92,58,0.2)' }}
      >
        <Package className="w-10 h-10" style={{ color: BRAND.accent }} />
      </div>
      <h3 className="text-xl font-bold uppercase tracking-tight mb-2" style={{ color: 'var(--text-primary)' }}>
        Catálogo Vacío
      </h3>
      <p className="text-sm max-w-sm mx-auto" style={{ color: 'var(--text-secondary)' }}>
        Agrega tu primer producto para comenzar a construir tu catálogo.
      </p>
    </motion.div>
  );
}

// ── Main Component ──────────────────────────────────────────────────────────

export function ProductList({ products, viewMode = 'grid', onEdit, onDelete }: ProductListProps) {
  if (products.length === 0) {
    return <EmptyState />;
  }

  return (
    <div className="pb-20">
      {viewMode === 'list' && (
        <ListView products={products} onEdit={onEdit} onDelete={onDelete} />
      )}
      {viewMode === 'thumbnails' && (
        <ThumbnailsView products={products} onEdit={onEdit} onDelete={onDelete} />
      )}
      {viewMode === 'grid' && (
        <GridView products={products} onEdit={onEdit} onDelete={onDelete} />
      )}
    </div>
  );
}
