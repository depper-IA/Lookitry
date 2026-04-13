'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Product } from '@/types';
import { 
  Edit3, 
  Trash2, 
  Tag, 
  ShoppingBag, 
  MoreVertical, 
  Eye, 
  Plus,
  ArrowUpRight,
  Package,
  Layers,
  LayoutGrid,
  LayoutList,
  Grid,
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

// ── Premium Glass Effects ────────────────────────────────────────────────────

function CategoryBadge({ category }: { category: string }) {
  const categoryConfig: Record<string, { bg: string; text: string; icon: React.ReactNode }> = {
    rines: { bg: 'bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900', text: 'text-white', icon: <Gauge className="w-2 h-2" /> },
    camisas: { bg: 'bg-gradient-to-r from-amber-900 via-amber-800 to-amber-900', text: 'text-white', icon: <Star className="w-2 h-2" /> },
    default: { bg: 'bg-gradient-to-r from-zinc-900 via-zinc-800 to-zinc-900', text: 'text-white', icon: <Sparkles className="w-2 h-2" /> },
  };
  
  const config = categoryConfig[category.toLowerCase()] || categoryConfig.default;
  
  return (
    <div className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[8px] font-black uppercase tracking-[0.15em] ${config.bg} ${config.text} shadow-xl backdrop-blur-xl border border-white/10`}>
      {config.icon}
      <span className="relative">{category}</span>
    </div>
  );
}

function ProductBadge({ badge }: { badge: string }) {
  const badgeConfig: Record<string, { gradient: string; border: string; shadow: string; icon: React.ReactNode }> = {
    nuevo:  { gradient: 'bg-gradient-to-r from-emerald-500 via-emerald-400 to-emerald-500', border: 'border-emerald-400/50', shadow: 'shadow-emerald-500/30', icon: <Sparkles className="w-2 h-2" /> },
    top:    { gradient: 'bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500', border: 'border-amber-400/50', shadow: 'shadow-amber-500/30', icon: <Zap className="w-2 h-2" /> },
    oferta: { gradient: 'bg-gradient-to-r from-rose-500 via-rose-400 to-rose-500', border: 'border-rose-400/50', shadow: 'shadow-rose-500/30', icon: <Shield className="w-2 h-2" /> },
  };
  
  const config = badgeConfig[badge.toLowerCase()] || badgeConfig.nuevo;
  
  return (
    <div className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[8px] font-black uppercase tracking-[0.15em] ${config.gradient} text-white shadow-xl ${config.shadow} backdrop-blur-xl border ${config.border}`}>
      {config.icon}
      <span className="relative">{badge}</span>
    </div>
  );
}

function EmptyState() {
  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      className="relative p-20 text-center bg-gradient-to-br from-[var(--bg-card)] via-[var(--bg-card)] to-[var(--bg-input)] rounded-[3rem] border border-white/10 overflow-hidden"
    >
      {/* Ambient Glow */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#FF5C3A]/5 via-transparent to-transparent" />
      
      {/* Glass Effect Container */}
      <div className="relative">
        <div className="w-24 h-24 mx-auto mb-8 rounded-[2rem] bg-gradient-to-br from-[var(--bg-input)] to-[var(--bg-base)] flex items-center justify-center border border-white/10 shadow-2xl backdrop-blur-xl">
          <Package className="w-12 h-12 text-[var(--text-muted)]" />
        </div>
        
        <h3 className="text-2xl font-black italic uppercase text-[var(--text-primary)] tracking-tighter mb-3">Catálogo Vacío</h3>
        <p className="text-sm text-[var(--text-secondary)] font-medium max-w-sm mx-auto leading-relaxed">
          Tu inventario está esperando las próximas tendencias. Agrega tu primer producto para comenzar.
        </p>
        
        {/* Decorative Lines */}
        <div className="flex items-center justify-center gap-4 mt-8">
          <div className="h-px w-16 bg-gradient-to-r from-transparent to-white/20" />
          <div className="w-2 h-2 rounded-full bg-[#FF5C3A]" />
          <div className="h-px w-16 bg-gradient-to-l from-transparent to-white/20" />
        </div>
      </div>
    </motion.div>
  );
}

// ── Labels de Atributos ───────────────────────────────────────────────────────

const ATTRIBUTE_LABELS: Record<string, string> = {
  finish: 'Finish',
  medida_pulgadas: 'Medida',
  material: 'Material',
  tipo_tela: 'Tela',
  marca: 'Marca',
  color: 'Color',
  peso: 'Peso',
  manga: 'Manga',
};

function AttributePills({ attributes, category }: { attributes: Record<string, any>; category: string }) {
  if (!attributes || Object.keys(attributes).length === 0) return null;
  
  const pills: { value: string; color: string }[] = [];
  
  // Build pills array
  if (attributes.finish) pills.push({ value: attributes.finish, color: 'bg-slate-800/80 border-slate-600/40 text-slate-200' });
  if (attributes.medida_pulgadas) pills.push({ value: attributes.medida_pulgadas + '"', color: 'bg-slate-800/80 border-slate-600/40 text-slate-200' });
  if (attributes.material) pills.push({ value: attributes.material, color: 'bg-slate-800/80 border-slate-600/40 text-slate-200' });
  if (attributes.tipo_tela) pills.push({ value: attributes.tipo_tela, color: 'bg-slate-800/80 border-slate-600/40 text-slate-200' });
  if (attributes.marca) pills.push({ value: attributes.marca, color: 'bg-slate-800/80 border-slate-600/40 text-slate-200' });
  if (attributes.color) pills.push({ value: attributes.color, color: 'bg-slate-800/80 border-slate-600/40 text-slate-200' });
  if (attributes.peso) pills.push({ value: attributes.peso + ' kg', color: 'bg-slate-800/80 border-slate-600/40 text-slate-200' });
  if (attributes.manga) pills.push({ value: attributes.manga, color: 'bg-slate-800/80 border-slate-600/40 text-slate-200' });
  if (attributes.tallas && Array.isArray(attributes.tallas) && attributes.tallas.length > 0) {
    pills.push({ value: attributes.tallas.slice(0, 5).join(', ') + (attributes.tallas.length > 5 ? '...' : ''), color: 'bg-slate-800/80 border-slate-600/40 text-slate-200' });
  }
  
  if (pills.length === 0) return null;
  
  return (
    <div className="flex flex-wrap gap-1.5">
      {pills.map((pill, idx) => (
        <span 
          key={idx}
          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-semibold border backdrop-blur-sm ${pill.color}`}
        >
          {pill.value}
        </span>
      ))}
    </div>
  );
}

// ── Línea Técnica Compacta ──────────────────────────────────────────────────

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
    <p className="text-[10px] text-[var(--text-muted)] font-medium tracking-wide truncate">
      {parts.join(' · ')}
    </p>
  );
}

// ── Precio con Contexto ──────────────────────────────────────────────────────

function PriceDisplay({ price, category }: { price: number; category: string }) {
  const unit = CATEGORY_UNITS[category.toLowerCase()] || CATEGORY_UNITS.default;
  
  return (
    <div className="text-right">
      {unit && (
        <p className="text-[8px] font-medium text-[var(--text-muted)] tracking-wide mb-0.5 opacity-80">
          {unit}
        </p>
      )}
      <p className="text-xl font-black italic text-transparent bg-clip-text bg-gradient-to-r from-[#FF5C3A] to-[#FF5C3A]/70">
        ${price.toLocaleString('es-CO')}
      </p>
    </div>
  );
}

// ── Status Indicator ────────────────────────────────────────────────────────

function StatusIndicator() {
  return (
    <div className="flex items-center gap-1.5">
      <div className="w-2 h-2 rounded-full bg-emerald-400 shadow-lg shadow-emerald-500/50 animate-pulse" />
      <span className="text-[9px] font-black uppercase text-emerald-400 tracking-widest">Activo</span>
    </div>
  );
}

// ── PREMIUM GRID VIEW ────────────────────────────────────────────────────────

function GridView({ products, onEdit, onDelete }: Omit<ProductListProps, 'viewMode'>) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
      <AnimatePresence mode='popLayout'>
        {products.map((product, idx) => (
          <motion.div
            key={product.id}
            layout
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
            transition={{ delay: idx * 0.06, duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="group relative flex flex-col"
          >
            {/* Outer Glow Effect */}
            <div className="absolute -inset-1 bg-gradient-to-br from-[#FF5C3A]/20 via-transparent to-transparent rounded-[22px] blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
            
            {/* Main Card - 20px border-radius, fixed min-height */}
            <div className="relative flex flex-col bg-gradient-to-b from-[var(--bg-card)] via-[var(--bg-card)] to-[var(--bg-base)] rounded-[20px] border border-white/10 overflow-hidden shadow-2xl shadow-black/20 min-h-[420px]">
              
              {/* Image Container */}
              <div className="relative aspect-[4/5] overflow-hidden flex-shrink-0">
                <img 
                  src={getProxiedUrl(product.imageUrl)} 
                  alt={product.name} 
                  className="w-full h-full object-cover transition-transform duration-1000 ease-out lg:group-hover:scale-110" 
                />
                
                {/* Gradient Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-black/10" />
                <div className="absolute inset-0 bg-gradient-to-r from-[#FF5C3A]/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                
                {/* Floating Badges - Top Left with Glassmorphism */}
                <div className="absolute top-3 left-3 flex flex-col gap-1.5">
                  <motion.div
                    initial={{ x: -20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    className="backdrop-blur-xl"
                  >
                    <ProductBadge badge={product.badge || 'Nuevo'} />
                  </motion.div>
                  <motion.div
                    initial={{ x: -20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: 0.3 }}
                    className="backdrop-blur-xl"
                  >
                    <CategoryBadge category={product.category} />
                  </motion.div>
                </div>

                {/* Status Dot - Top Right */}
                <div className="absolute top-3 right-3">
                  <div className="w-7 h-7 rounded-xl bg-emerald-500/90 backdrop-blur-xl border border-emerald-400/50 shadow-lg shadow-emerald-500/30 flex items-center justify-center">
                    <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                  </div>
                </div>

                {/* Action Buttons - Bottom Overlay */}
                <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/90 via-black/60 to-transparent lg:translate-y-full lg:group-hover:translate-y-0 transition-transform duration-500 delay-100">
                  <div className="flex justify-center gap-2">
                    <motion.button 
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => onEdit(product)}
                      className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-white/95 backdrop-blur-xl text-black hover:bg-black hover:text-white transition-all shadow-lg shadow-black/30 border border-white/20 text-[10px] font-black uppercase tracking-wider"
                    >
                      <Edit3 size={13} />
                      <span>Editar</span>
                    </motion.button>
                    <motion.button 
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => onDelete(product.id)}
                      className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-rose-500/90 backdrop-blur-xl text-white hover:bg-rose-600 transition-all shadow-lg shadow-rose-500/20 border border-rose-400/30 text-[10px] font-black uppercase tracking-wider"
                    >
                      <Trash2 size={13} />
                      <span>Eliminar</span>
                    </motion.button>
                  </div>
                </div>
              </div>

              {/* Content Section */}
              <div className="flex-1 flex flex-col justify-between p-4 space-y-3">
                {/* Product Name */}
                <div className="space-y-1.5">
                  <h3 className="text-sm font-black italic uppercase tracking-tight text-[var(--text-primary)] leading-[1.2] group-hover:text-[#FF5C3A] transition-colors duration-300 line-clamp-2">
                    {product.name}
                  </h3>
                  
                  {/* Short Description */}
                  {product.shortDescription && (
                    <p className="text-[10px] text-[var(--text-secondary)] leading-relaxed line-clamp-2">
                      {product.shortDescription}
                    </p>
                  )}
                  
                  {/* Subtítulo Técnico Compacto - UNA SOLA LÍNEA */}
                  <TechnicalSubtitle attributes={product.attributes || {}} />
                </div>
                
                {/* Atributos como Pills */}
                <AttributePills attributes={product.attributes || {}} category={product.category} />
                
                {/* Footer - Price with Status */}
                <div className="flex items-end justify-between pt-2 border-t border-white/5">
                  <StatusIndicator />
                  
                  {/* Price */}
                  {product.price != null && (
                    <PriceDisplay price={product.price ?? 0} category={product.category} />
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

// ── PREMIUM THUMBNAILS VIEW ─────────────────────────────────────────────────

function ThumbnailsView({ products, onEdit, onDelete }: Omit<ProductListProps, 'viewMode'>) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
      <AnimatePresence mode='popLayout'>
        {products.map((product, idx) => (
          <motion.div
            key={product.id}
            layout
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ delay: idx * 0.04, duration: 0.4 }}
            className="group relative flex flex-col"
          >
            {/* Glow Effect */}
            <div className="absolute -inset-0.5 bg-gradient-to-br from-[#FF5C3A]/30 to-transparent rounded-[22px] blur-lg opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            
            <div className="relative flex flex-col bg-gradient-to-b from-[var(--bg-card)] to-[var(--bg-base)] rounded-[20px] border border-white/10 overflow-hidden shadow-xl shadow-black/15 min-h-[280px]">
              
              {/* Top Accent */}
              <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-[#FF5C3A] via-[#FF5C3A]/50 to-transparent" />
              
              <div className="relative aspect-square overflow-hidden flex-shrink-0">
                <img 
                  src={getProxiedUrl(product.imageUrl)} 
                  alt={product.name} 
                  className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-110" 
                />
                
                {/* Gradient Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
                
                {/* Badges - Top Left */}
                <div className="absolute top-2 left-2 flex flex-col gap-1">
                  <div className="backdrop-blur-xl">
                    <ProductBadge badge={product.badge || 'Nuevo'} />
                  </div>
                </div>
                
                {/* Status Dot */}
                <div className="absolute top-2 right-2">
                  <div className="w-5 h-5 rounded-lg bg-emerald-500/90 backdrop-blur-xl border border-emerald-400/50 shadow-lg shadow-emerald-500/20 flex items-center justify-center">
                    <div className="w-1 h-1 rounded-full bg-white" />
                  </div>
                </div>
                
                {/* Action Buttons - Bottom Overlay */}
                <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/90 via-black/60 to-transparent lg:translate-y-full lg:group-hover:translate-y-0 transition-transform duration-400">
                  <div className="flex justify-center gap-2">
                    <motion.button 
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => onEdit(product)} 
                      className="w-9 h-9 rounded-lg bg-white/95 backdrop-blur-xl text-black flex items-center justify-center shadow-lg shadow-black/30 hover:bg-black hover:text-white transition-colors border border-white/20"
                    >
                      <Edit3 size={13} />
                    </motion.button>
                    <motion.button 
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => onDelete(product.id)} 
                      className="w-9 h-9 rounded-lg bg-rose-500/90 backdrop-blur-xl text-white flex items-center justify-center shadow-lg shadow-rose-500/20 hover:bg-rose-600 transition-colors border border-rose-400/30"
                    >
                      <Trash2 size={13} />
                    </motion.button>
                  </div>
                </div>
              </div>
              
              <div className="flex-1 flex flex-col justify-between p-3 text-center space-y-2">
                <div>
                  <h4 className="text-[10px] font-black uppercase tracking-tight text-[var(--text-primary)] leading-tight line-clamp-1 group-hover:text-[#FF5C3A] transition-colors">
                    {product.name}
                  </h4>
                  
                  {product.shortDescription && (
                    <p className="text-[8px] text-[var(--text-muted)] line-clamp-1 hidden sm:block mt-0.5">
                      {product.shortDescription}
                    </p>
                  )}
                </div>
                
                <div className="space-y-1">
                  <CategoryBadge category={product.category} />
                  
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-sm shadow-emerald-500/50" />
                    <span className="text-[9px] font-bold text-emerald-400 uppercase tracking-wider">Activo</span>
                  </div>
                  
                  <span className="text-xs font-black italic text-transparent bg-clip-text bg-gradient-to-r from-[#FF5C3A] to-[#FF5C3A]/70]">
                    {product.price ? `$${product.price.toLocaleString('es-CO')}` : 'N/A'}
                  </span>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

// ── PREMIUM LIST VIEW ────────────────────────────────────────────────────────

function ListView({ products, onEdit, onDelete }: Omit<ProductListProps, 'viewMode'>) {
  return (
    <div className="relative bg-gradient-to-br from-[var(--bg-card)] via-[var(--bg-card)] to-[var(--bg-base)] lg:rounded-[22px] border border-white/10 overflow-hidden shadow-2xl shadow-black/20">
      
      {/* Top Gradient Accent */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#FF5C3A] via-[#FF5C3A]/50 to-transparent" />
      
      {/* Ambient Glow */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#FF5C3A]/3 via-transparent to-transparent pointer-events-none" />
      
      {/* Desktop Table */}
      <div className="hidden lg:block relative">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-black/20 backdrop-blur-xl border-b border-white/5">
              <th className="px-6 py-5 text-[10px] font-black uppercase tracking-[0.25em] text-[var(--text-muted)] italic">Producto</th>
              <th className="px-6 py-5 text-[10px] font-black uppercase tracking-[0.25em] text-[var(--text-muted)] italic">Categoría</th>
              <th className="px-6 py-5 text-[10px] font-black uppercase tracking-[0.25em] text-[var(--text-muted)] italic">Especificaciones</th>
              <th className="px-6 py-5 text-[10px] font-black uppercase tracking-[0.25em] text-[var(--text-muted)] italic text-right">Precio</th>
              <th className="px-6 py-5 text-[10px] font-black uppercase tracking-[0.25em] text-[var(--text-muted)] italic text-right">Acciones</th>
            </tr>
          </thead>
          <tbody>
            <AnimatePresence mode='popLayout'>
              {products.map((product, idx) => (
                <motion.tr
                  key={product.id}
                  layout
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ delay: idx * 0.04 }}
                  className="group hover:bg-[#FF5C3A]/5 transition-colors border-b border-white/5 last:border-0"
                >
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-4">
                      <div className="relative flex-shrink-0">
                        <div className="absolute -inset-1 bg-gradient-to-br from-[#FF5C3A]/20 to-transparent rounded-2xl blur-md opacity-0 group-hover:opacity-100 transition-opacity" />
                        <div className="relative w-14 h-14 rounded-xl overflow-hidden border border-white/10 shadow-xl shadow-black/20">
                          <img src={getProxiedUrl(product.imageUrl)} alt={product.name} className="w-full h-full object-cover" />
                        </div>
                      </div>
                      <div className="min-w-0 flex-1">
                        <h4 className="text-sm font-black italic uppercase tracking-tight text-[var(--text-primary)] leading-tight group-hover:text-[#FF5C3A] transition-colors line-clamp-1">
                          {product.name}
                        </h4>
                        {product.shortDescription && (
                          <p className="text-[10px] text-[var(--text-secondary)] mt-1 line-clamp-1 max-w-xs leading-relaxed">
                            {product.shortDescription}
                          </p>
                        )}
                        <div className="flex items-center gap-2 mt-2">
                          <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-sm shadow-emerald-500/50" />
                          <span className="text-[9px] font-bold text-emerald-400 uppercase tracking-wider">Activo</span>
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex flex-col gap-1.5">
                      <CategoryBadge category={product.category} />
                      {product.badge && <ProductBadge badge={product.badge} />}
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <div className="space-y-2">
                      <TechnicalSubtitle attributes={product.attributes || {}} />
                      <AttributePills attributes={product.attributes || {}} category={product.category} />
                    </div>
                  </td>
                  <td className="px-6 py-5 text-right">
                    <PriceDisplay price={product.price ?? 0} category={product.category} />
                  </td>
                  <td className="px-6 py-5 text-right">
                    <div className="flex justify-end gap-2 translate-x-4 opacity-0 group-hover:translate-x-0 group-hover:opacity-100 transition-all duration-300">
                      <motion.button 
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => onEdit(product)} 
                        className="p-3 rounded-xl bg-white/95 backdrop-blur-xl text-black hover:bg-black hover:text-white transition-all shadow-xl shadow-black/20 border border-white/20"
                      >
                        <Edit3 size={14} />
                      </motion.button>
                      <motion.button 
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => onDelete(product.id)} 
                        className="p-3 rounded-xl bg-rose-500/95 backdrop-blur-xl text-white hover:bg-rose-600 transition-all shadow-xl shadow-rose-500/30 border border-rose-400/30"
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
        <AnimatePresence mode='popLayout'>
          {products.map((product) => (
            <motion.div
              key={product.id}
              layout
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative bg-gradient-to-br from-[var(--bg-card)] to-[var(--bg-base)] rounded-[20px] border border-white/10 p-4 shadow-xl shadow-black/15 overflow-hidden"
            >
              {/* Accent Line */}
              <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-[#FF5C3A] to-transparent" />
              
              <div className="flex items-center gap-3">
                <div className="relative flex-shrink-0">
                  <div className="absolute -inset-1 bg-gradient-to-br from-[#FF5C3A]/20 to-transparent rounded-xl blur-md opacity-0 group-hover:opacity-100 transition-opacity" />
                  <div className="relative w-18 h-20 rounded-xl overflow-hidden border border-white/10 shadow-xl shadow-black/20">
                    <img src={getProxiedUrl(product.imageUrl)} alt={product.name} className="w-full h-full object-cover" />
                    
                    {/* Badges on image */}
                    <div className="absolute top-1.5 left-1.5 flex flex-col gap-1">
                      <div className="backdrop-blur-xl">
                        <ProductBadge badge={product.badge || 'Nuevo'} />
                      </div>
                    </div>
                    
                    {/* Action Buttons Overlay */}
                    <div className="absolute bottom-0 left-0 right-0 p-1.5 bg-gradient-to-t from-black/90 to-transparent lg:translate-y-full lg:group-hover:translate-y-0 transition-transform duration-300">
                      <div className="flex justify-center gap-1.5">
                        <button 
                          onClick={() => onEdit(product)} 
                          className="w-8 h-8 rounded-lg bg-white/95 backdrop-blur-xl text-black flex items-center justify-center shadow-lg border border-white/20"
                        >
                          <Edit3 size={12} />
                        </button>
                        <button 
                          onClick={() => onDelete(product.id)} 
                          className="w-8 h-8 rounded-lg bg-rose-500/90 backdrop-blur-xl text-white flex items-center justify-center shadow-lg border border-rose-400/30"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="flex-1 min-w-0 flex flex-col justify-between py-1">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h4 className="text-[12px] font-black italic uppercase tracking-tight text-[var(--text-primary)] leading-tight line-clamp-1">
                        {product.name}
                      </h4>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-sm shadow-emerald-500/50" />
                      <span className="text-[9px] font-bold text-emerald-400 uppercase tracking-wider">Activo</span>
                      <CategoryBadge category={product.category} />
                    </div>
                    <TechnicalSubtitle attributes={product.attributes || {}} />
                  </div>
                  
                  <div className="flex items-center justify-between mt-2">
                    <PriceDisplay price={product.price ?? 0} category={product.category} />
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

// ── MAIN EXPORT ─────────────────────────────────────────────────────────────

export function ProductList({ products, viewMode = 'grid', onEdit, onDelete }: ProductListProps) {
  if (products.length === 0) return null;

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
