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
  Grid
} from 'lucide-react';

import { getProxiedUrl } from '@/utils/imageProxy';

export type ViewMode = 'grid' | 'thumbnails' | 'list';

interface ProductListProps {
  products: Product[];
  viewMode?: ViewMode;
  onEdit: (product: Product) => void;
  onDelete: (productId: string) => void;
}

// ── Shared Components ──────────────────────────────────────────────────────

function CategoryBadge({ category }: { category: string }) {
  return (
    <span className="inline-flex items-center px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest bg-white text-black border border-black/10 shadow-xl italic backdrop-blur-md">
      {category}
    </span>
  );
}

function ProductBadge({ badge }: { badge: string }) {
  const styles: Record<string, string> = {
    nuevo:  'bg-emerald-500 text-white border-emerald-400',
    top:    'bg-amber-500 text-white border-amber-400',
    oferta: 'bg-rose-500 text-white border-rose-400',
  };
  const s = styles[badge] ?? 'bg-[#6366f1] text-white border-[#6366f1]';
  return (
    <span className={`inline-flex items-center px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border italic shadow-xl ${s}`}>
      {badge}
    </span>
  );
}

function EmptyState() {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-20 text-center bg-[var(--bg-card)] rounded-[3rem] border border-[var(--border-color)] border-dashed"
    >
      <div className="w-20 h-20 rounded-[2rem] bg-[var(--bg-input)] flex items-center justify-center mx-auto mb-6 text-[var(--text-muted)] border border-[var(--border-color)]">
        <Package className="w-10 h-10 opacity-30" />
      </div>
      <h3 className="text-xl font-black italic uppercase text-[var(--text-primary)] tracking-tighter mb-2">Catálogo Vacío</h3>
      <p className="text-sm text-[var(--text-secondary)] font-medium max-w-xs mx-auto mb-8">
        Tu inventario está esperando las próximas tendencias. Agrega tu primer producto para comenzar.
      </p>
    </motion.div>
  );
}

// ── GRID VIEW ─────────────────────────────────────────────────────────────

// ── GRID VIEW ─────────────────────────────────────────────────────────────

function GridView({ products, onEdit, onDelete }: Omit<ProductListProps, 'viewMode'>) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
      <AnimatePresence mode='popLayout'>
        {products.map((product, idx) => (
          <motion.div
            key={product.id}
            layout
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
            transition={{ delay: idx * 0.05 }}
            className="group relative bg-[var(--bg-card)] rounded-[2rem] md:rounded-[2.5rem] border border-[var(--border-color)] overflow-hidden hover:border-[#FF5C3A]/40 transition-all duration-500 shadow-xl shadow-black/5"
          >
            {/* Image Section */}
            <div className="aspect-[4/5] overflow-hidden relative">
              <img src={getProxiedUrl(product.imageUrl)} alt={product.name} className="w-full h-full object-cover transition-transform duration-1000 lg:group-hover:scale-110" />
              
              {/* Overlay Gradient - Persistent on mobile, hover on desktop */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent lg:opacity-0 lg:group-hover:opacity-100 transition-opacity duration-500" />
              
              {/* Floating Badges */}
              <div className="absolute top-4 left-4 md:top-6 md:left-6 flex flex-col gap-2 scale-90 md:scale-100 origin-top-left">
                <ProductBadge badge={product.badge || 'Nuevo'} />
                <CategoryBadge category={product.category} />
              </div>

              {/* Action Buttons Overlay - Persistent on mobile < lg */}
              <div className="absolute bottom-6 md:bottom-8 left-0 right-0 px-4 md:px-8 flex justify-center gap-3 lg:translate-y-10 lg:opacity-0 lg:group-hover:translate-y-0 lg:group-hover:opacity-100 transition-all duration-500 delay-100">
                <button 
                  onClick={() => onEdit(product)}
                  className="p-3.5 md:p-4 rounded-xl md:rounded-2xl bg-white text-black hover:bg-black hover:text-white transition-all shadow-2xl active:scale-95 flex items-center gap-2"
                >
                  <Edit3 size={16} /><span className="text-[10px] font-black uppercase md:hidden">Editar</span>
                </button>
                <button 
                  onClick={() => onDelete(product.id)}
                  className="p-3.5 md:p-4 rounded-xl md:rounded-2xl bg-rose-500 text-white hover:bg-rose-600 transition-all shadow-2xl active:scale-95 flex items-center gap-2"
                >
                  <Trash2 size={16} /><span className="text-[10px] font-black uppercase md:hidden">Eliminar</span>
                </button>
              </div>
            </div>

            {/* Content Section */}
            <div className="p-5 md:p-8 space-y-4">
              <div className="flex justify-between items-start gap-4">
                <div className="min-w-0 flex-1">
                   <h3 className="text-sm md:text-base font-[950] italic uppercase tracking-tighter text-[var(--text-primary)] leading-[1.1] transition-all">{product.name}</h3>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-[9px] md:text-[10px] font-black uppercase text-[var(--text-muted)] tracking-widest leading-none">{product.category}</span>
                    <span className="w-1 h-1 rounded-full bg-[var(--border-color)]" />
                    <span className="text-[9px] md:text-[10px] font-black uppercase text-[#FF5C3A] tracking-widest leading-none">Activo</span>
                  </div>
                </div>
                {product.price != null && (
                  <div className="text-right shrink-0">
                    <p className="text-[9px] md:text-xs font-black uppercase text-[var(--text-muted)] tracking-widest mb-0.5">Precio</p>
                    <p className="text-lg md:text-xl font-black italic text-[#FF5C3A]">${product.price.toLocaleString('es-CO')}</p>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

// ── THUMBNAILS VIEW ────────────────────────────────────────────────────────

function ThumbnailsView({ products, onEdit, onDelete }: Omit<ProductListProps, 'viewMode'>) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4 md:gap-6">
      <AnimatePresence mode='popLayout'>
        {products.map((product, idx) => (
          <motion.div
            key={product.id}
            layout
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ delay: idx * 0.03 }}
            className="group relative bg-[var(--bg-card)] rounded-2xl md:rounded-3xl border border-[var(--border-color)] overflow-hidden shadow-lg hover:border-[#FF5C3A]/40 transition-all"
          >
            <div className="aspect-square relative overflow-hidden">
               <img src={getProxiedUrl(product.imageUrl)} alt={product.name} className="w-full h-full object-cover transition-all duration-700" />
               
               {/* Overlay - Persistent on mobile */}
               <div className="absolute inset-0 bg-black/40 lg:bg-[#FF5C3A]/10 lg:opacity-0 lg:group-hover:opacity-100 transition-all" />
               
               {/* Quick Actions Overlay - Persistent on mobile < lg */}
               <div className="absolute inset-0 flex items-center justify-center gap-2 lg:opacity-0 lg:group-hover:opacity-100 transition-all lg:translate-y-4 lg:group-hover:translate-y-0">
                  <button onClick={() => onEdit(product)} className="w-9 h-9 md:w-10 md:h-10 rounded-lg md:rounded-xl bg-white text-black flex items-center justify-center shadow-2xl hover:bg-black hover:text-white transition-colors">
                    <Edit3 size={14} />
                  </button>
                  <button onClick={() => onDelete(product.id)} className="w-9 h-9 md:w-10 md:h-10 rounded-lg md:rounded-xl bg-rose-500 text-white flex items-center justify-center shadow-2xl hover:bg-rose-600 transition-colors">
                    <Trash2 size={14} />
                  </button>
               </div>
            </div>
            <div className="p-3 md:p-4 text-center">
               <p className="text-[9px] md:text-[10px] font-black uppercase tracking-tighter text-[var(--text-primary)] leading-tight line-clamp-1">{product.name}</p>
               {product.price && <p className="text-[9px] font-black text-[#FF5C3A] italic mt-1">${product.price.toLocaleString('es-CO')}</p>}
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

// ── LIST VIEW ─────────────────────────────────────────────────────────────

function ListView({ products, onEdit, onDelete }: Omit<ProductListProps, 'viewMode'>) {
  return (
    <div className="bg-[var(--bg-card)] lg:rounded-[2.5rem] lg:border border-[var(--border-color)] overflow-hidden lg:shadow-2xl">
      {/* Desktop Table */}
      <div className="hidden lg:block overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-[var(--bg-base)] border-b border-[var(--border-color)]">
              <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.25em] text-[var(--text-muted)] italic">Prenda</th>
              <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.25em] text-[var(--text-muted)] italic">Categoría</th>
              <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.25em] text-[var(--text-muted)] italic">Precio</th>
              <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.25em] text-[var(--text-muted)] italic text-right">Acciones</th>
            </tr>
          </thead>
          <tbody>
            <AnimatePresence mode='popLayout'>
              {products.map((product, idx) => (
                <motion.tr
                  key={product.id}
                  layout
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  transition={{ delay: idx * 0.03 }}
                  className="group hover:bg-[var(--bg-base)]/50 transition-colors border-b border-[var(--border-color)] last:border-0"
                >
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-6">
                       <div className="w-16 h-16 rounded-2xl overflow-hidden border border-[var(--border-color)] shrink-0 shadow-lg">
                         <img src={getProxiedUrl(product.imageUrl)} alt={product.name} className="w-full h-full object-cover" />
                       </div>
                       <div className="min-w-0 flex-1">
                         <h4 className="text-sm font-black italic uppercase italic tracking-tighter text-[var(--text-primary)] leading-tight">{product.name}</h4>
                         <p className="text-[10px] text-[var(--text-muted)] font-black uppercase tracking-widest mt-1 leading-none">{product.category}</p>
                       </div>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex gap-2">
                       <CategoryBadge category={product.category} />
                       {product.badge && <ProductBadge badge={product.badge} />}
                    </div>
                  </td>
                  <td className="px-8 py-6">
                     <span className="text-sm font-black italic text-[#FF5C3A]">
                       {product.price ? `$${product.price.toLocaleString('es-CO')}` : 'N/A'}
                     </span>
                  </td>
                  <td className="px-8 py-6 text-right">
                     <div className="flex justify-end gap-3 translate-x-4 opacity-0 group-hover:translate-x-0 group-hover:opacity-100 transition-all duration-300">
                        <button onClick={() => onEdit(product)} className="p-3 rounded-xl bg-[var(--bg-input)] text-[var(--text-primary)] hover:bg-black hover:text-white transition-all shadow-sm">
                          <Edit3 size={14} />
                        </button>
                        <button onClick={() => onDelete(product.id)} className="p-3 rounded-xl bg-rose-500/10 text-rose-500 hover:bg-rose-500 hover:text-white transition-all shadow-sm">
                          <Trash2 size={14} />
                        </button>
                     </div>
                  </td>
                </motion.tr>
              ))}
            </AnimatePresence>
          </tbody>
        </table>
      </div>

      {/* Mobile Stack Layout */}
      <div className="lg:hidden space-y-4 p-4">
        <AnimatePresence mode='popLayout'>
          {products.map((product) => (
            <motion.div
              key={product.id}
              layout
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[var(--bg-card)] rounded-3xl border border-[var(--border-color)] p-4 flex items-center gap-4 shadow-lg shadow-black/5"
            >
              <div className="w-20 h-24 rounded-2xl overflow-hidden border border-[var(--border-color)] shrink-0 shadow-md">
                <img src={getProxiedUrl(product.imageUrl)} alt={product.name} className="w-full h-full object-cover" />
              </div>
              <div className="flex-1 min-w-0 flex flex-col justify-between h-24 py-1">
                <div>
                  <h4 className="text-[13px] font-black italic uppercase tracking-tighter text-[var(--text-primary)] leading-none line-clamp-1 mb-1">{product.name}</h4>
                  <p className="text-[9px] text-[var(--text-muted)] font-black uppercase tracking-widest leading-none">{product.category}</p>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-base font-black italic text-[#FF5C3A]">
                    {product.price ? `$${product.price.toLocaleString('es-CO')}` : 'N/A'}
                  </span>
                  <div className="flex gap-2">
                    <button onClick={() => onEdit(product)} className="w-9 h-9 rounded-xl bg-[var(--bg-input)] text-[var(--text-primary)] flex items-center justify-center">
                      <Edit3 size={14} />
                    </button>
                    <button onClick={() => onDelete(product.id)} className="w-9 h-9 rounded-xl bg-rose-500 text-white flex items-center justify-center shadow-lg shadow-rose-500/20">
                      <Trash2 size={14} />
                    </button>
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
    visible: { opacity: 1 }
  };

  return (
    <motion.div 
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className="pb-20"
    >
      {viewMode === 'list' ? (
        <ListView products={products} onEdit={onEdit} onDelete={onDelete} />
      ) : viewMode === 'thumbnails' ? (
        <ThumbnailsView products={products} onEdit={onEdit} onDelete={onDelete} />
      ) : (
        <GridView products={products} onEdit={onEdit} onDelete={onDelete} />
      )}
    </motion.div>
  );
}
