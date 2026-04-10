'use client';

import React from 'react';
import { ThemeToggle } from './ThemeToggle';
export { useTheme } from '@/contexts/ThemeContext';

export function BlogThemeWrapper({ children }: { children: React.ReactNode }) {
  // We no longer need to provide a new ThemeProvider here as it's in the root layout.
  // This component now just serves as a logical wrapper for blog specific layout needs if any.
  return (
    <>
      {children}
    </>
  );
}

export function BlogHeader({ showToggle = true }: { showToggle?: boolean }) {
  return (
    <div className="flex items-center justify-end py-4 pr-6">
      {showToggle && <ThemeToggle />}
    </div>
  );
}

export { ThemeToggle };
