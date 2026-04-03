'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Home, Sparkles, Mail, User, LogIn } from 'lucide-react';
import { authService } from '@/services/auth.service';

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
  requiresAuth?: boolean;
}

export function MobileBottomNav() {
  const pathname = usePathname();
  const router = useRouter();
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token') || localStorage.getItem('brandToken');
    setIsLoggedIn(!!token);
  }, [pathname]);

  const navItems: NavItem[] = [
    {
      label: 'Inicio',
      href: '/',
      icon: <Home size={20} />,
    },
    {
      label: 'Probar',
      href: '/probador-virtual',
      icon: <Sparkles size={20} />,
    },
    {
      label: 'Contacto',
      href: '/contacto',
      icon: <Mail size={20} />,
    },
    {
      label: isLoggedIn ? 'Mi Panel' : 'Ingresar',
      href: isLoggedIn ? '/dashboard' : '/login',
      icon: isLoggedIn ? <User size={20} /> : <LogIn size={20} />,
    },
  ];

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/';
    return pathname.startsWith(href);
  };

  const handleAuthClick = (item: NavItem) => {
    if (item.requiresAuth && !isLoggedIn) {
      router.push('/login');
    }
  };

  if (pathname.startsWith('/admin') || pathname.startsWith('/dashboard')) {
    return null;
  }

  return (
    <nav
      role="navigation"
      aria-label="Navegación principal"
      className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-[#0a0a0a]/95 backdrop-blur-lg border-t border-white/10"
    >
      <div className="flex items-center justify-around h-16 max-w-md mx-auto pb-safe">
        {navItems.map((item) => {
          const active = isActive(item.href);
          
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={(e) => item.requiresAuth && !isLoggedIn && handleAuthClick(item)}
              aria-current={active ? 'page' : undefined}
              className={`flex flex-col items-center justify-center gap-1 flex-1 h-full transition-all duration-200 active:scale-95 ${
                active 
                  ? 'text-[#FF5C3A]' 
                  : 'text-white/50 hover:text-white/80'
              }`}
            >
              <div className={`relative ${active ? 'text-[#FF5C3A]' : ''}`}>
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
