'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { Product } from '@/types';
import { X, GripVertical, Star } from 'lucide-react';
import { getProxiedUrl } from '@/utils/imageProxy';

interface WidgetPlaylistProps {
  products: Product[];
  onRemove: (productId: string) => void;
  onReorder: (productIds: string[]) => void;
  maxProducts: number;
  isLoading?: boolean;
}

interface SortableItemProps {
  product: Product;
  index: number;
  onRemove: (productId: string) => void;
}

function SortableItem({ product, index, onRemove }: SortableItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: product.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <motion.div
      ref={setNodeRef}
      style={style}
      layout
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20, scale: 0.96 }}
      transition={{ duration: 0.2 }}
      className={`group flex items-center gap-3 p-3 rounded-xl border transition-all duration-300 ${
        isDragging
          ? 'border-[#FF5C3A] bg-[#FF5C3A]/10 shadow-lg shadow-[#FF5C3A]/20 scale-[1.02]'
          : 'border-[var(--card-border)] bg-[var(--bg-card-elevated)] hover:border-[#FF5C3A]/40'
      }`}
    >
      {/* Grip Handle */}
      <button
        {...attributes}
        {...listeners}
        className="touch-none p-1.5 rounded-lg hover:bg-[var(--btn-bg)] transition-colors cursor-grab active:cursor-grabbing"
        aria-label="Reordenar producto"
      >
        <GripVertical size={16} className="text-[var(--text-muted)] group-hover:text-[#FF5C3A] transition-colors" />
      </button>

      {/* Position Number */}
      <div className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black"
        style={{ background: 'var(--accent)', color: 'white' }}>
        {index + 1}
      </div>

      {/* Thumbnail */}
      <div className="w-12 h-12 rounded-lg overflow-hidden flex-shrink-0 border border-[var(--card-border)]">
        <img
          src={getProxiedUrl(product.imageUrl)}
          alt={product.name}
          className="w-full h-full object-cover"
        />
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="text-xs font-bold uppercase truncate" style={{ color: 'var(--text-primary)' }}>
          {product.name}
        </p>
        <p className="text-[10px] capitalize" style={{ color: 'var(--text-muted)' }}>
          {product.category}
        </p>
      </div>

      {/* Remove Button */}
      <button
        onClick={() => onRemove(product.id)}
        className="p-2 rounded-lg hover:bg-rose-500/10 text-[var(--text-muted)] hover:text-rose-500 transition-all opacity-0 group-hover:opacity-100"
        aria-label="Quitar del widget"
      >
        <X size={14} />
      </button>
    </motion.div>
  );
}

export function WidgetPlaylist({
  products,
  onRemove,
  onReorder,
  maxProducts,
  isLoading,
}: WidgetPlaylistProps) {
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = products.findIndex((p) => p.id === active.id);
      const newIndex = products.findIndex((p) => p.id === over.id);
      const reordered = arrayMove(products, oldIndex, newIndex);
      onReorder(reordered.map((p) => p.id));
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-16 rounded-xl animate-pulse bg-[var(--skeleton-bg)]" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-2">
        <Star size={16} className="text-[#FF5C3A]" />
        <h3 className="text-sm font-bold uppercase tracking-wider" style={{ color: 'var(--text-primary)' }}>
          Mi Widget
        </h3>
        <span className="ml-auto text-[10px] font-semibold px-2 py-1 rounded-full"
          style={{
            background: products.length >= maxProducts ? 'rgba(239,68,68,0.15)' : 'var(--accent-subtle)',
            color: products.length >= maxProducts ? '#EF4444' : '#FF5C3A',
          }}>
          {products.length}/{maxProducts}
        </span>
      </div>

      {products.length === 0 ? (
        /* Empty State */
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="py-12 px-6 text-center rounded-2xl border-2 border-dashed border-[var(--border-color)]"
        >
          <div className="w-12 h-12 mx-auto mb-4 rounded-xl flex items-center justify-center"
            style={{ background: 'var(--accent-subtle)' }}>
            <Star size={24} className="text-[#FF5C3A]" />
          </div>
          <p className="text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: 'var(--text-muted)' }}>
            Widget vacío
          </p>
          <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
            Agrega productos desde el catálogo
          </p>
        </motion.div>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext items={products.map((p) => p.id)} strategy={verticalListSortingStrategy}>
            <AnimatePresence mode="popLayout">
              {products.map((product, index) => (
                <SortableItem
                  key={product.id}
                  product={product}
                  index={index}
                  onRemove={onRemove}
                />
              ))}
            </AnimatePresence>
          </SortableContext>
        </DndContext>
      )}
    </div>
  );
}