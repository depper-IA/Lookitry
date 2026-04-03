'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Home, Package, Sparkles, BarChart3, User } from 'lucide-react';
import { authService } from '@/services/auth.service';

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
}

export function DashboardBottomNav() {
  const pathname = usePathname();
  const router = useRouter();
  const [brandName, setBrandName] = useState('');

  useEffect(() => {
    const brand = JSON.parse(localStorage.getItem('brand') || 'null');
    if (brand?.name) setBrandName(brand.name);
  }, []);

  const navItems: NavItem[] = [
    { label: 'Inicio', href: '/dashboard', icon: <Home size={20} /> },
    { label: 'Productos', href: '/dashboard/products', icon: <Package size={20} /> },
    { label: 'Pruebas IA', href: '/dashboard/generations', icon: <Sparkles size={20} /> },
    { label: 'Resultados', href: '/dashboard/analytics', icon: <BarChart3 size={20} /> },
    { label: 'Perfil', href: '/dashboard/profile', icon: <User size={20} /> },
  ];

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
      <div className="mx-auto max-w-sm px-4 pb-2 pt-1">
        <div className="flex items-center justify-center gap-1 rounded-2xl bg-[#0a0a0a]/90 backdrop-blur-xl border border-white/10 shadow-2xl shadow-black/40 px-2 py-2 pb-safe">
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
