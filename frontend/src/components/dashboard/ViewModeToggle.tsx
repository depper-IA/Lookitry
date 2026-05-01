'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { LayoutGrid, List, Image } from 'lucide-react';

// ═══════════════════════════════════════════════════════════════════════════════
// BRAND DESIGN TOKENS
// ═══════════════════════════════════════════════════════════════════════════════
const ACCENT = '#FF5C3A';
const ACCENT_GLOW = 'rgba(255, 92, 58, 0.15)';
const ACCENT_SUBTLE = 'rgba(255, 92, 58, 0.08)';

// ═══════════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════════
export type ViewMode = 'grid' | 'list' | 'thumbnail';

interface ViewModeToggleProps {
  mode: ViewMode;
  onChange: (mode: ViewMode) => void;
}

// ═══════════════════════════════════════════════════════════════════════════════
// VIEW MODE CONFIG
// ═══════════════════════════════════════════════════════════════════════════════
const VIEW_MODES: { key: ViewMode; icon: React.ReactNode; label: string }[] = [
  { key: 'grid', icon: <LayoutGrid size={16} />, label: 'Grid' },
  { key: 'list', icon: <List size={16} />, label: 'Lista' },
  { key: 'thumbnail', icon: <Image size={16} />, label: 'Miniatura' },
];

// ═══════════════════════════════════════════════════════════════════════════════
// VIEW MODE TOGGLE COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

export function ViewModeToggle({ mode, onChange }: ViewModeToggleProps) {
  return (
    <div
      className="inline-flex items-center p-1 rounded-xl gap-1"
      style={{
        background: 'var(--card-bg)',
        border: '1px solid var(--card-border)',
        boxShadow: '0 4px 24px rgba(0, 0, 0, 0.2)',
      }}
    >
      {VIEW_MODES.map(({ key, icon, label }) => {
        const isActive = mode === key;
        
        return (
          <motion.button
            key={key}
            onClick={() => onChange(key)}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="relative flex items-center gap-2 px-3 py-2 rounded-lg font-bold text-[10px] uppercase tracking-wider transition-all duration-200"
            style={{
              background: isActive ? ACCENT : 'transparent',
              color: isActive ? 'white' : 'var(--text-muted)',
              boxShadow: isActive
                ? `0 4px 12px ${ACCENT_GLOW}, 0 0 0 1px ${ACCENT}30`
                : 'none',
            }}
            aria-label={`Cambiar a vista ${label}`}
            aria-pressed={isActive}
          >
            <span className="transition-transform duration-200" style={{ transform: isActive ? 'scale(1.1)' : 'scale(1)' }}>
              {icon}
            </span>
            <span className="hidden sm:inline">{label}</span>
            
            {/* Active indicator dot */}
            {isActive && (
              <motion.span
                layoutId="activeDot"
                className="absolute -bottom-1 left-1/2 w-1 h-1 rounded-full"
                style={{
                  background: 'white',
                  boxShadow: `0 0 6px ${ACCENT}`,
                  transform: 'translateX(-50%)',
                }}
                transition={{ type: 'spring', stiffness: 500, damping: 30 }}
              />
            )}
          </motion.button>
        );
      })}
    </div>
  );
}
