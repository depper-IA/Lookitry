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

  const handleLogout = async () => {
    await authService.logout();
    router.push('/login');
  };

  if (!pathname.startsWith('/dashboard')) return null;

  return (
    <nav
      role="navigation"
      aria-label="Navegación del dashboard"
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
