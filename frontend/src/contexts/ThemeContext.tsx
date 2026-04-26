'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

type Theme = 'dark' | 'light';

interface ThemeContextValue {
  theme: Theme;
  isDark: boolean;
  toggle: () => void;
  toggleTheme: () => void;
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

function getInitialTheme(): Theme {
  if (typeof window === 'undefined') return 'dark';
  try {
    const stored = localStorage.getItem(THEME_STORAGE_KEY) as Theme | null;
    // ONLY respect explicit user choice — dark is the ONLY default
    if (stored === 'light' || stored === 'dark') return stored;
  } catch {}
  // ALWAYS default to dark — site is designed for dark mode
  // Light mode is only for accessibility, never automatic
  return 'dark';
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(getInitialTheme);

  useEffect(() => {
    document.documentElement.classList.remove('light', 'dark');
    document.documentElement.classList.add(theme);
  }, [theme]);

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
