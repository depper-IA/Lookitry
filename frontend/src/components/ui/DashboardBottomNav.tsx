'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Package, Sparkles, BarChart3, User } from 'lucide-react';

export function DashboardBottomNav() {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === '/dashboard') return pathname === '/dashboard';
    return pathname.startsWith(href);
  };

  if (!pathname.startsWith('/dashboard')) return null;

  return (
    <nav
      role="navigation"
      aria-label="Navegación del dashboard"
      className="fixed bottom-0 left-0 right-0 z-50 md:hidden"
    >
      <div className="mx-auto max-w-sm px-3 pb-2 pt-1">
        <div className="flex items-center justify-center gap-0.5 rounded-2xl bg-[#0a0a0a]/90 backdrop-blur-xl border border-white/10 shadow-2xl shadow-black/40 px-1.5 py-1.5 pb-safe">
          <Link
            href="/dashboard"
            aria-current={isActive('/dashboard') ? 'page' : undefined}
            className={`flex flex-col items-center justify-center gap-0.5 flex-1 py-2 px-2 rounded-xl transition-all duration-200 ${
              isActive('/dashboard')
                ? 'bg-[#FF5C3A]/15 text-[#FF5C3A]'
                : 'text-white/40 hover:text-white/70 active:text-white/60'
            }`}
          >
            <Home size={20} />
            <span className="text-[9px] font-semibold uppercase tracking-wider">Inicio</span>
          </Link>
          
          <Link
            href="/dashboard/products"
            aria-current={isActive('/dashboard/products') ? 'page' : undefined}
            className={`flex flex-col items-center justify-center gap-0.5 flex-1 py-2 px-2 rounded-xl transition-all duration-200 ${
              isActive('/dashboard/products')
                ? 'bg-[#FF5C3A]/15 text-[#FF5C3A]'
                : 'text-white/40 hover:text-white/70 active:text-white/60'
            }`}
          >
            <Package size={20} />
            <span className="text-[9px] font-semibold uppercase tracking-wider">Productos</span>
          </Link>
          
          <Link
            href="/dashboard/generations"
            aria-current={isActive('/dashboard/generations') ? 'page' : undefined}
            className={`flex flex-col items-center justify-center gap-0.5 flex-1 py-2 px-2 rounded-xl transition-all duration-200 ${
              isActive('/dashboard/generations')
                ? 'bg-[#FF5C3A]/15 text-[#FF5C3A]'
                : 'text-white/40 hover:text-white/70 active:text-white/60'
            }`}
          >
            <Sparkles size={20} />
            <span className="text-[9px] font-semibold uppercase tracking-wider">Pruebas IA</span>
          </Link>
          
          <Link
            href="/dashboard/analytics"
            aria-current={isActive('/dashboard/analytics') ? 'page' : undefined}
            className={`flex flex-col items-center justify-center gap-0.5 flex-1 py-2 px-2 rounded-xl transition-all duration-200 ${
              isActive('/dashboard/analytics')
                ? 'bg-[#FF5C3A]/15 text-[#FF5C3A]'
                : 'text-white/40 hover:text-white/70 active:text-white/60'
            }`}
          >
            <BarChart3 size={20} />
            <span className="text-[9px] font-semibold uppercase tracking-wider">Resultados</span>
          </Link>
          
          <Link
            href="/dashboard/profile"
            aria-current={isActive('/dashboard/profile') ? 'page' : undefined}
            className={`flex flex-col items-center justify-center gap-0.5 flex-1 py-2 px-2 rounded-xl transition-all duration-200 ${
              isActive('/dashboard/profile')
                ? 'bg-[#FF5C3A]/15 text-[#FF5C3A]'
                : 'text-white/40 hover:text-white/70 active:text-white/60'
            }`}
          >
            <User size={20} />
            <span className="text-[9px] font-semibold uppercase tracking-wider">Perfil</span>
          </Link>
        </div>
      </div>
    </nav>
  );
}