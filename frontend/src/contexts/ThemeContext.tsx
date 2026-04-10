'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

type Theme = 'dark' | 'light';

interface ThemeContextValue {
  theme: Theme;
  isDark: boolean;
  toggle: () => void;
  toggleTheme: () => void; // Aliased for compatibility
  setTheme: (theme: Theme) => void;
  colors: {
    bg: string;
    card: string;
    textPrimary: string;
    textSecondary: string;
    accent: string;
  };
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

const THEME_STORAGE_KEY = 'theme';

const themes = {
  dark: {
    bg: '#0a0a0a',
    card: '#141414',
    textPrimary: '#ffffff',
    textSecondary: '#999999',
    accent: '#FF5C3A',
  },
  light: {
    bg: '#fafafa',
    card: '#ffffff',
    textPrimary: '#0a0a0a',
    textSecondary: '#666666',
    accent: '#FF5C3A',
  },
};

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>('dark');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const stored = localStorage.getItem(THEME_STORAGE_KEY) as Theme | null;
    if (stored === 'light' || stored === 'dark') {
      setThemeState(stored);
    } else if (typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: light)').matches) {
       // Only default to light if explicitly preferred, otherwise keep dark as default for Lookitry
       // However, many users might prefer system. For now, let's keep dark as primary.
    }
  }, []);

  useEffect(() => {
    if (mounted) {
      document.documentElement.classList.remove('light', 'dark');
      document.documentElement.classList.add(theme);
      // document.body.style.backgroundColor = themes[theme].bg; // This can cause issues with other layouts, maybe use CSS variables
    }
  }, [theme, mounted]);

  const toggle = useCallback(() => {
    setThemeState(prev => {
      const next = prev === 'dark' ? 'light' : 'dark';
      localStorage.setItem(THEME_STORAGE_KEY, next);
      return next;
    });
  }, []);

  const setTheme = useCallback((newTheme: Theme) => {
    setThemeState(newTheme);
    localStorage.setItem(THEME_STORAGE_KEY, newTheme);
  }, []);

  const value: ThemeContextValue = {
    theme,
    isDark: theme === 'dark',
    toggle,
    toggleTheme: toggle,
    setTheme,
    colors: themes[theme],
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}

export default ThemeProvider;
