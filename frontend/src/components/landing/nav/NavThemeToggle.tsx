'use client';

import React from 'react';
import { Sun, Moon } from 'lucide-react';

interface NavThemeToggleProps {
  toggleTheme: () => void;
  isDark: boolean;
  mounted: boolean;
  isHeroMode: boolean;
}

export function NavThemeToggle({
  toggleTheme,
  isDark,
  mounted,
  isHeroMode,
}: NavThemeToggleProps) {
  return (
    <button
      onClick={toggleTheme}
      className={`nav-theme-btn flex h-8 w-8 items-center justify-center rounded-full border transition-all duration-300 hover:scale-110 hover:border-accent/40 hover:text-accent ${
        isHeroMode
          ? 'border-white/10 bg-white/5 text-white/60 hover:text-white'
          : 'border-black/10 bg-black/5 text-black/60 dark:border-white/10 dark:bg-white/5 dark:text-white/60 dark:hover:text-accent'
      }`}
      aria-label={
        mounted && isDark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'
      }
      title={mounted && isDark ? 'Modo claro' : 'Modo oscuro'}
    >
      {mounted && isDark ? <Sun size={14} /> : <Moon size={14} />}
    </button>
  );
}
