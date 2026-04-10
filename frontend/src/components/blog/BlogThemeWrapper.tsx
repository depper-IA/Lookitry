'use client';

import React from 'react';
import ThemeProvider from '@/context/ThemeContext';
import { ThemeToggle } from './ThemeToggle';

export function BlogThemeWrapper({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      {children}
    </ThemeProvider>
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
export { useTheme } from '@/context/ThemeContext';
