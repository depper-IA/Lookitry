'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Edit3, Trash2, Plus, Check, X } from 'lucide-react';
import type { Product } from '@/types';

// ═══════════════════════════════════════════════════════════════════════════════
// BRAND DESIGN TOKENS
// ═══════════════════════════════════════════════════════════════════════════════
const ACCENT = '#FF5C3A';
const DANGER = '#EF4444';
const SUCCESS = '#10B981';

// ═══════════════════════════════════════════════════════════════════════════════
// COMPONENT PROPS
// ═══════════════════════════════════════════════════════════════════════════════
interface ProductActionsProps {
  product: Product;
  onEdit: (product: Product) => void;
  onDelete: (productId: string) => void;
  onAddToWidget?: (productId: string) => void;
  onRemoveFromWidget?: (productId: string) => void;
  isInWidget?: boolean;
  canAddToWidget?: boolean;
  variant?: 'overlay' | 'inline';
}

// ═══════════════════════════════════════════════════════════════════════════════
// ACTION BUTTON STYLES (reusable)
// ═══════════════════════════════════════════════════════════════════════════════
const buttonBase = 'flex items-center justify-center gap-2 px-4 py-2 rounded-xl font-bold text-[10px] uppercase tracking-wider backdrop-blur-md transition-all';

// ═══════════════════════════════════════════════════════════════════════════════
// PRODUCT ACTIONS COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

export function ProductActions({
  product,
  onEdit,
  onDelete,
  onAddToWidget,
  onRemoveFromWidget,
  isInWidget = false,
  canAddToWidget = true,
  variant = 'overlay',
}: ProductActionsProps) {
  
  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    // Shake animation before delete
    e.currentTarget.animate([
      { transform: 'translateX(0)' },
      { transform: 'translateX(-5px)' },
      { transform: 'translateX(5px)' },
      { transform: 'translateX(0)' }
    ], { duration: 300 });
    onDelete(product.id);
  };

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    onEdit(product);
  };

  const handleWidgetAction = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isInWidget) {
      onRemoveFromWidget?.(product.id);
    } else {
      onAddToWidget?.(product.id);
    }
  };

  // Inline variant for mobile list view
  if (variant === 'inline') {
    return (
      <div className="flex items-center gap-2">
        {onAddToWidget && (
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={handleWidgetAction}
            disabled={isInWidget || !canAddToWidget}
            className={`flex-1 flex items-center justify-center gap-1 py-2 rounded-lg text-[10px] font-bold uppercase transition-all ${
              isInWidget
                ? 'bg-emerald-500/15 text-emerald-400 cursor-default'
                : canAddToWidget === false
                ? 'bg-gray-500/10 text-gray-400 cursor-not-allowed'
                : 'bg-[#FF5C3A]/15 text-[#FF5C3A]'
            }`}
          >
            {isInWidget ? <Check size={12} /> : <Plus size={12} />}
            {isInWidget ? 'En Widget' : 'Agregar'}
          </motion.button>
        )}
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={handleEdit}
          className="px-3 py-2 rounded-lg"
          style={{ background: 'var(--btn-bg)', border: '1px solid var(--card-border)' }}
        >
          <Edit3 size={14} style={{ color: 'var(--text-primary)' }} />
        </motion.button>
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={handleDelete}
          className="px-3 py-2 rounded-lg"
          style={{ background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.2)' }}
        >
          <Trash2 size={14} style={{ color: DANGER }} />
        </motion.button>
      </div>
    );
  }

  // Default overlay variant for hover reveal
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="absolute bottom-0 left-0 right-0 p-4"
      style={{
        background: 'linear-gradient(to top, rgba(0,0,0,0.9) 0%, transparent 100%)',
      }}
    >
      <div className="flex justify-center gap-2">
        {/* Edit Button */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleEdit}
          className={buttonBase}
          style={{
            background: 'rgba(255,255,255,0.15)',
            border: '1px solid rgba(255,255,255,0.2)',
            color: 'white',
          }}
        >
          <Edit3 size={12} /> Editar
        </motion.button>

        {/* Delete Button */}
        <motion.button
          whileHover={{ scale: 1.1, color: DANGER }}
          whileTap={{ scale: 0.9 }}
          onClick={handleDelete}
          className={buttonBase}
          style={{
            background: 'rgba(239, 68, 68, 0.8)',
            border: '1px solid rgba(239, 68, 68, 0.4)',
            color: 'white',
          }}
        >
          <Trash2 size={12} /> Eliminar
        </motion.button>

        {/* Widget Add/Remove Button */}
        {onAddToWidget && (
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleWidgetAction}
            disabled={isInWidget || !canAddToWidget}
            className={`${buttonBase} ${
              isInWidget
                ? 'bg-emerald-500/30 text-emerald-300 cursor-default'
                : canAddToWidget === false
                ? 'bg-gray-500/20 text-gray-400 cursor-not-allowed'
                : 'bg-[#FF5C3A]/80 text-white hover:bg-[#FF5C3A]'
            }`}
            style={{
              border: isInWidget
                ? '1px solid rgba(16,185,129,0.3)'
                : '1px solid rgba(255,92,58,0.3)',
            }}
          >
            {isInWidget ? <Check size={12} /> : <Plus size={12} />}
            {isInWidget ? 'En Widget' : 'Agregar'}
          </motion.button>
        )}

        {/* Widget Remove Button (shown when in widget) */}
        {onRemoveFromWidget && isInWidget && (
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleWidgetAction}
            className={buttonBase}
            style={{
              background: 'rgba(239, 68, 68, 0.8)',
              border: '1px solid rgba(239, 68, 68, 0.4)',
              color: 'white',
            }}
          >
            <X size={12} /> Quitar
          </motion.button>
        )}
      </div>
    </motion.div>
  );
}
