'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Building2, TrendingUp, Bell, Settings2, Shield, Users } from 'lucide-react';

export function AdminBottomNav() {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === '/admin/dashboard') return pathname === '/admin/dashboard';
    if (href === '/admin/risk') return pathname.startsWith('/admin/risk');
    if (href === '/admin/config') return pathname.startsWith('/admin/config');
    return pathname.startsWith(href);
  };

  if (!pathname.startsWith('/admin')) return null;

  return (
    <nav
      role="navigation"
      aria-label="Navegación del admin"
      className="fixed bottom-0 left-0 right-0 z-50 md:hidden"
    >
      <div className="mx-auto max-w-sm px-3 pb-2 pt-1">
        <div className="flex items-center justify-center gap-0.5 rounded-2xl bg-white dark:bg-[#0a0a0a] border border-black/10 dark:border-white/10 shadow-2xl shadow-black/20 dark:shadow-black/40 px-1.5 py-1.5 pb-safe">
          <Link
            href="/admin/dashboard"
            aria-current={isActive('/admin/dashboard') ? 'page' : undefined}
            className={`flex flex-col items-center justify-center gap-0.5 flex-1 py-2 px-2 rounded-xl transition-all duration-200 ${
              isActive('/admin/dashboard')
                ? 'bg-[#FF5C3A]/15 text-[#FF5C3A]'
                : 'text-black/40 dark:text-white/40 hover:text-black/70 dark:hover:text-white/70 active:text-black/60 dark:active:text-white/60'
            }`}
          >
            <LayoutDashboard size={20} />
            <span className="text-[9px] font-semibold uppercase tracking-wider">Mission</span>
          </Link>
          
          <Link
            href="/admin/brands"
            aria-current={isActive('/admin/brands') ? 'page' : undefined}
            className={`flex flex-col items-center justify-center gap-0.5 flex-1 py-2 px-2 rounded-xl transition-all duration-200 ${
              isActive('/admin/brands')
                ? 'bg-[#FF5C3A]/15 text-[#FF5C3A]'
                : 'text-black/40 dark:text-white/40 hover:text-black/70 dark:hover:text-white/70 active:text-black/60 dark:active:text-white/60'
            }`}
          >
            <Building2 size={20} />
            <span className="text-[9px] font-semibold uppercase tracking-wider">Marcas</span>
          </Link>

          <Link
            href="/admin/leads"
            aria-current={isActive('/admin/leads') ? 'page' : undefined}
            className={`flex flex-col items-center justify-center gap-0.5 flex-1 py-2 px-2 rounded-xl transition-all duration-200 ${
              isActive('/admin/leads')
                ? 'bg-[#FF5C3A]/15 text-[#FF5C3A]'
                : 'text-black/40 dark:text-white/40 hover:text-black/70 dark:hover:text-white/70 active:text-black/60 dark:active:text-white/60'
            }`}
          >
            <Users size={20} />
            <span className="text-[9px] font-semibold uppercase tracking-wider">Leads</span>
          </Link>
          
          <Link
            href="/admin/notifications"
            aria-current={isActive('/admin/notifications') ? 'page' : undefined}
            className={`flex flex-col items-center justify-center gap-0.5 flex-1 py-2 px-2 rounded-xl transition-all duration-200 ${
              isActive('/admin/notifications')
                ? 'bg-[#FF5C3A]/15 text-[#FF5C3A]'
                : 'text-black/40 dark:text-white/40 hover:text-black/70 dark:hover:text-white/70 active:text-black/60 dark:active:text-white/60'
            }`}
          >
            <Bell size={20} />
            <span className="text-[9px] font-semibold uppercase tracking-wider">Actividad</span>
          </Link>
          
          <Link
            href="/admin/config/trial"
            aria-current={isActive('/admin/config') ? 'page' : undefined}
            className={`flex flex-col items-center justify-center gap-0.5 flex-1 py-2 px-2 rounded-xl transition-all duration-200 ${
              isActive('/admin/config')
                ? 'bg-[#FF5C3A]/15 text-[#FF5C3A]'
                : 'text-black/40 dark:text-white/40 hover:text-black/70 dark:hover:text-white/70 active:text-black/60 dark:active:text-white/60'
            }`}
          >
            <Settings2 size={20} />
            <span className="text-[9px] font-semibold uppercase tracking-wider">Config</span>
          </Link>
        </div>
      </div>
    </nav>
  );
}