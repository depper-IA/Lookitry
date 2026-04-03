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
      className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-[#0a0a0a]/95 backdrop-blur-lg border-t border-white/10"
    >
      <div className="flex items-center justify-around h-16 max-w-md mx-auto pb-safe">
        {navItems.map((item) => {
          const active = isActive(item.href);
          
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? 'page' : undefined}
              className={`flex flex-col items-center justify-center gap-1 flex-1 h-full transition-all duration-200 active:scale-95 ${
                active ? 'text-[#FF5C3A]' : 'text-white/50 hover:text-white/80'
              }`}
            >
              <div className="relative">
                {active && (
                  <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-[#FF5C3A]" />
                )}
                {item.icon}
              </div>
              <span className="text-[10px] font-medium uppercase tracking-wider">
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
