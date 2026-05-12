'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Package, Sparkles, BarChart3, User } from 'lucide-react';

export function DashboardBottomNav() {
  const pathname = usePathname();
  const itemClass =
    'flex flex-1 flex-col items-center justify-center gap-1 rounded-xl px-1.5 py-2 text-center transition-all duration-200 min-w-0';
  const labelClass =
    'text-[8px] leading-[1.05] font-semibold uppercase tracking-[0.08em] text-center break-words';

  const isActive = (href: string) => {
    if (href === '/dashboard') return pathname === '/dashboard';
    return pathname.startsWith(href);
  };

  if (!pathname.startsWith('/dashboard')) return null;

  return (
    <nav
      role="navigation"
      aria-label="Navegación del dashboard"
      className="fixed bottom-0 left-0 right-0 z-50 md:hidden pb-safe"
      style={{ paddingBottom: 'max(0.5rem, env(safe-area-inset-bottom))' }}
    >
      <div className="mx-auto max-w-sm px-3 pt-1">
        <div className="flex items-center justify-center gap-0.5 rounded-2xl bg-white dark:bg-dark border border-black/10 dark:border-white/10 shadow-2xl shadow-black/20 dark:shadow-black/40 px-1.5 py-1.5 pb-safe">
          <Link
            href="/dashboard"
            aria-current={isActive('/dashboard') ? 'page' : undefined}
            className={`${itemClass} ${
              isActive('/dashboard')
                ? 'bg-accent/15 text-accent'
                : 'text-black/40 dark:text-white/40 hover:text-black/70 dark:hover:text-white/70 active:text-black/60 dark:active:text-white/60'
            }`}
          >
            <Home size={20} />
            <span className={labelClass}>Inicio</span>
          </Link>
          
          <Link
            href="/dashboard/products"
            aria-current={isActive('/dashboard/products') ? 'page' : undefined}
            className={`${itemClass} ${
              isActive('/dashboard/products')
                ? 'bg-accent/15 text-accent'
                : 'text-black/40 dark:text-white/40 hover:text-black/70 dark:hover:text-white/70 active:text-black/60 dark:active:text-white/60'
            }`}
          >
            <Package size={20} />
            <span className={labelClass}>Productos</span>
          </Link>
          
          <Link
            href="/dashboard/generations"
            aria-current={isActive('/dashboard/generations') ? 'page' : undefined}
            className={`${itemClass} ${
              isActive('/dashboard/generations')
                ? 'bg-accent/15 text-accent'
                : 'text-black/40 dark:text-white/40 hover:text-black/70 dark:hover:text-white/70 active:text-black/60 dark:active:text-white/60'
            }`}
          >
            <Sparkles size={20} />
            <span className={labelClass}>Pruebas IA</span>
          </Link>
          
          <Link
            href="/dashboard/analytics"
            aria-current={isActive('/dashboard/analytics') ? 'page' : undefined}
            className={`${itemClass} ${
              isActive('/dashboard/analytics')
                ? 'bg-accent/15 text-accent'
                : 'text-black/40 dark:text-white/40 hover:text-black/70 dark:hover:text-white/70 active:text-black/60 dark:active:text-white/60'
            }`}
          >
            <BarChart3 size={20} />
            <span className={labelClass}>Resultados</span>
          </Link>
          
          <Link
            href="/dashboard/profile"
            aria-current={isActive('/dashboard/profile') ? 'page' : undefined}
            className={`${itemClass} ${
              isActive('/dashboard/profile')
                ? 'bg-accent/15 text-accent'
                : 'text-black/40 dark:text-white/40 hover:text-black/70 dark:hover:text-white/70 active:text-black/60 dark:active:text-white/60'
            }`}
          >
            <User size={20} />
            <span className={labelClass}>Perfil</span>
          </Link>
        </div>
      </div>
    </nav>
  );
}
