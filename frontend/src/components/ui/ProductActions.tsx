'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Edit3, Trash2, Plus, Check } from 'lucide-react';

interface ProductActionsProps {
  onEdit: () => void;
  onDelete: () => void;
  onAddToWidget?: () => void;
  isInWidget?: boolean;
  canAddToWidget?: boolean;
  variant?: 'overlay' | 'inline';
}

/**
 * Edit/Delete/Widget action buttons with hover reveal animation.
 * Supports two variants: overlay (for grid/list views) and inline (for mobile list).
 */
export function ProductActions({
  onEdit,
  onDelete,
  onAddToWidget,
  isInWidget = false,
  canAddToWidget = true,
  variant = 'overlay',
}: ProductActionsProps) {
  if (variant === 'inline') {
    return (
      <div className="flex items-center gap-2">
        {onAddToWidget && (
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={onAddToWidget}
            disabled={isInWidget || !canAddToWidget}
            className={`flex-1 flex items-center justify-center gap-1 py-2 rounded-lg text-[10px] font-bold uppercase transition-all ${
              isInWidget
                ? 'bg-emerald-500/15 text-emerald-400'
                : canAddToWidget === false
                ? 'bg-gray-500/10 text-gray-400'
                : 'bg-[#FF5C3A]/15 text-[#FF5C3A]'
            }`}
          >
            {isInWidget ? <Check size={12} /> : <Plus size={12} />}
            {isInWidget ? 'En Widget' : 'Agregar'}
          </motion.button>
        )}
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={onEdit}
          className="px-3 py-2 rounded-lg"
          style={{ background: 'var(--btn-bg)', border: '1px solid var(--card-border)' }}
        >
          <Edit3 size={14} style={{ color: 'var(--text-primary)' }} />
        </motion.button>
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={onDelete}
          className="px-3 py-2 rounded-lg"
          style={{ background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.2)' }}
        >
          <Trash2 size={14} style={{ color: '#EF4444' }} />
        </motion.button>
      </div>
    );
  }

  // Overlay variant (grid/list with hover)
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="absolute bottom-0 left-0 right-0 p-4"
      style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.9) 0%, transparent 100%)' }}
    >
      <div className="flex justify-center gap-2">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={(e) => { e.stopPropagation(); onEdit(); }}
          className="flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-[10px] uppercase tracking-wider text-white backdrop-blur-md transition-all"
          style={{ background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.2)' }}
        >
          <Edit3 size={12} /> Editar
        </motion.button>
        <motion.button
          whileHover={{ scale: 1.1, color: '#FF3A5C' }}
          whileTap={{ scale: 0.9 }}
          onClick={(e) => {
            e.stopPropagation();
            e.currentTarget.animate([
              { transform: 'translateX(0)' },
              { transform: 'translateX(-5px)' },
              { transform: 'translateX(5px)' },
              { transform: 'translateX(0)' },
            ], { duration: 300 });
            onDelete();
          }}
          className="flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-[10px] uppercase tracking-wider text-white backdrop-blur-md transition-all"
          style={{ background: 'rgba(239, 68, 68, 0.8)', border: '1px solid rgba(239, 68, 68, 0.4)' }}
        >
          <Trash2 size={12} /> Eliminar
        </motion.button>
        {onAddToWidget && (
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={(e) => { e.stopPropagation(); onAddToWidget(); }}
            disabled={isInWidget || !canAddToWidget}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-[10px] uppercase tracking-wider backdrop-blur-md transition-all ${
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
      </div>
    </motion.div>
  );
}