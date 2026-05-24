'use client';

import React from 'react';
import Link from 'next/link';
import { ShieldCheck, Sun, Moon } from 'lucide-react';
import DynamicLoveAnimation from '../DynamicLoveAnimation';

interface FooterBottomBarProps {
  currentYear: number;
  isDark: boolean;
  toggleTheme: () => void;
  mounted: boolean;
}

export function FooterBottomBar({
  currentYear,
  isDark,
  toggleTheme,
  mounted,
}: FooterBottomBarProps) {
  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8 md:px-12 md:py-10">
      <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
        {/* Copyright */}
        <div className="font-dm-sans text-xs font-medium text-black/80 sm:text-sm flex items-center flex-wrap justify-center sm:justify-start">
          <span>© {currentYear} Lookitry · Hecho con</span>
          <DynamicLoveAnimation />
          <span>por</span>
          <Link
            href="https://wilkiedevs.com"
            target="_blank"
            rel="noopener noreferrer"
            className="font-semibold transition-colors duration-300 hover:text-white ml-1.5"
          >
            Wilkie Devs
          </Link>
        </div>

        {/* Trust badges & Theme toggle */}
        <div className="flex items-center gap-6 sm:gap-8">
          {/* Trust badge */}
          <div className="flex items-center gap-2 font-dm-sans text-xs font-medium text-black/80 transition-all duration-300 hover:text-black sm:text-sm">
            <ShieldCheck
              size={16}
              aria-hidden="true"
              className="transition-transform duration-300 hover:scale-110"
            />
            <span className="relative">
              Pagos seguros
              <span className="absolute -bottom-0.5 left-0 h-[1px] w-0 bg-current transition-all duration-300 group-hover:w-full" />
            </span>
          </div>

          {/* Theme toggle */}
          <button
            onClick={toggleTheme}
            aria-label={isDark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
            className="group flex items-center gap-2 rounded-full border border-black/20 px-4 py-2 text-xs font-medium text-black/90 transition-all duration-300 hover:border-text-primary/40 hover:bg-text-primary/10 hover:text-text-primary sm:text-sm"
          >
            {mounted ? (
              isDark ? (
                <>
                  <Sun
                    size={14}
                    aria-hidden="true"
                    className="transition-transform duration-300 group-hover:rotate-45"
                  />
                  <span className="relative z-10">Modo claro</span>
                </>
              ) : (
                <>
                  <Moon
                    size={14}
                    aria-hidden="true"
                    className="transition-transform duration-300 group-hover:rotate-12"
                  />
                  <span className="relative z-10">Modo oscuro</span>
                </>
              )
            ) : (
              <>
                <Moon size={14} aria-hidden="true" />
                <span className="relative z-10">Modo oscuro</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
