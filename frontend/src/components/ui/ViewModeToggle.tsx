'use client';

import React from 'react';
import { LayoutGrid, Grid3X3, LayoutList } from 'lucide-react';
import type { ViewMode } from '@/components/dashboard/ProductList';

interface ViewModeToggleProps {
  viewMode: ViewMode;
  onChange: (mode: ViewMode) => void;
}

/**
 * Grid/List/Thumbnail view mode toggle with Lucide icons.
 * Renders segmented control with active state highlighting.
 */
export function ViewModeToggle({ viewMode, onChange }: ViewModeToggleProps) {
  const modes: Array<{ id: ViewMode; icon: React.ReactNode; label: string }> = [
    { id: 'grid', icon: <LayoutGrid size={16} />, label: 'Grid' },
    { id: 'thumbnails', icon: <Grid3X3 size={16} />, label: 'Miniaturas' },
    { id: 'list', icon: <LayoutList size={16} />, label: 'Lista' },
  ];

  return (
    <div className="flex items-center justify-center bg-[var(--bg-card)] border border-[var(--border-color)] rounded-[2rem] md:rounded-[2.5rem] p-1 shadow-xl md:shadow-2xl">
      {modes.map(({ id, icon }) => (
        <button
          key={id}
          onClick={() => onChange(id)}
          className={`p-2.5 md:p-3 rounded-full transition-all duration-500 ${
            viewMode === id
              ? 'bg-accent text-white shadow-2xl shadow-accent/30 scale-[1.1]'
              : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
          }`}
          aria-label={`Ver en modo ${id}`}
          aria-pressed={viewMode === id}
        >
          {icon}
        </button>
      ))}
    </div>
  );
}