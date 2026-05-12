'use client';

import { useState, useCallback } from 'react';
import type { ViewMode } from '@/components/dashboard/ProductList';

const STORAGE_KEY = 'products-view-mode';

const VALID_MODES: ViewMode[] = ['grid', 'thumbnails', 'list'];

function isValidViewMode(value: string | null): value is ViewMode {
  return VALID_MODES.includes(value as ViewMode);
}

/**
 * Manages the view mode state for the products dashboard with localStorage persistence.
 * @returns [viewMode, setViewMode] tuple
 */
export function useViewMode(): [ViewMode, (mode: ViewMode) => void] {
  const [viewMode, setViewMode] = useState<ViewMode>(() => {
    if (typeof window === 'undefined') return 'grid';
    const stored = localStorage.getItem(STORAGE_KEY);
    return isValidViewMode(stored) ? stored : 'grid';
  });

  const handleSetViewMode = useCallback((mode: ViewMode) => {
    setViewMode(mode);
    localStorage.setItem(STORAGE_KEY, mode);
  }, []);

  return [viewMode, handleSetViewMode];
}

export type { ViewMode };