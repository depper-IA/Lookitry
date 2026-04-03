'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Building2, TrendingUp, Bell, Settings2 } from 'lucide-react';

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
}

export function AdminBottomNav() {
  const pathname = usePathname();

  const navItems: NavItem[] = [
    { label: 'Mission', href: '/admin/dashboard', icon: <LayoutDashboard size={20} /> },
    { label: 'Marcas', href: '/admin/brands', icon: <Building2 size={20} /> },
    { label: 'Ingresos', href: '/admin/revenue', icon: <TrendingUp size={20} /> },
    { label: 'Actividad', href: '/admin/notifications', icon: <Bell size={20} /> },
    { label: 'Config', href: '/admin/configuracion', icon: <Settings2 size={20} /> },
  ];

  const isActive = (href: string) => {
    if (href === '/admin/dashboard') return pathname === '/admin/dashboard';
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
        <div className="flex items-center justify-center gap-0.5 rounded-2xl bg-[#0a0a0a]/90 backdrop-blur-xl border border-white/10 shadow-2xl shadow-black/40 px-1.5 py-1.5 pb-safe">
          {navItems.map((item) => {
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? 'page' : undefined}
                className={`flex flex-col items-center justify-center gap-0.5 flex-1 py-2 px-2 rounded-xl transition-all duration-200 ${
                  active
                    ? 'bg-[#FF5C3A]/15 text-[#FF5C3A]'
                    : 'text-white/40 hover:text-white/70 active:text-white/60'
                }`}
              >
                <div className="relative">
                  {item.icon}
                </div>
                <span className="text-[9px] font-semibold uppercase tracking-wider truncate w-full text-center">
                  {item.label}
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
