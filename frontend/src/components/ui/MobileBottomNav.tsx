'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Sparkles, Mail, User, LogIn } from 'lucide-react';

export function MobileBottomNav() {
  const pathname = usePathname();
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token') || localStorage.getItem('brandToken');
    setIsLoggedIn(!!token);
  }, [pathname]);

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/';
    return pathname.startsWith(href);
  };

  if (pathname.startsWith('/admin') || pathname.startsWith('/dashboard')) return null;

  const getIcon = () => {
    if (isLoggedIn) return <User size={20} />;
    return <LogIn size={20} />;
  };

  const getLabel = () => isLoggedIn ? 'Mi Panel' : 'Ingresar';
  const getHref = () => isLoggedIn ? '/dashboard' : '/login';

  return (
    <nav
      role="navigation"
      aria-label="Navegación principal"
      className="fixed bottom-0 left-0 right-0 z-50 md:hidden"
    >
      <div className="mx-auto max-w-sm px-3 pb-2 pt-1">
        <div className="flex items-center justify-center gap-0.5 rounded-2xl bg-[#0a0a0a]/90 backdrop-blur-xl border border-white/10 shadow-2xl shadow-black/40 px-1.5 py-1.5 pb-safe">
          <Link
            href="/"
            aria-current={isActive('/') ? 'page' : undefined}
            className={`flex flex-col items-center justify-center gap-0.5 flex-1 py-2 px-2 rounded-xl transition-all duration-200 ${
              isActive('/')
                ? 'bg-[#FF5C3A]/15 text-[#FF5C3A]'
                : 'text-white/40 hover:text-white/70 active:text-white/60'
            }`}
          >
            <Home size={20} />
            <span className="text-[9px] font-semibold uppercase tracking-wider">Inicio</span>
          </Link>
          
          <Link
            href="/probador-virtual"
            aria-current={isActive('/probador-virtual') ? 'page' : undefined}
            className={`flex flex-col items-center justify-center gap-0.5 flex-1 py-2 px-2 rounded-xl transition-all duration-200 ${
              isActive('/probador-virtual')
                ? 'bg-[#FF5C3A]/15 text-[#FF5C3A]'
                : 'text-white/40 hover:text-white/70 active:text-white/60'
            }`}
          >
            <Sparkles size={20} />
            <span className="text-[9px] font-semibold uppercase tracking-wider">Probar</span>
          </Link>
          
          <Link
            href="/contacto"
            aria-current={isActive('/contacto') ? 'page' : undefined}
            className={`flex flex-col items-center justify-center gap-0.5 flex-1 py-2 px-2 rounded-xl transition-all duration-200 ${
              isActive('/contacto')
                ? 'bg-[#FF5C3A]/15 text-[#FF5C3A]'
                : 'text-white/40 hover:text-white/70 active:text-white/60'
            }`}
          >
            <Mail size={20} />
            <span className="text-[9px] font-semibold uppercase tracking-wider">Contacto</span>
          </Link>
          
          <Link
            href={getHref()}
            className={`flex flex-col items-center justify-center gap-0.5 flex-1 py-2 px-2 rounded-xl transition-all duration-200 text-white/40 hover:text-white/70 active:text-white/60`}
          >
            {getIcon()}
            <span className="text-[9px] font-semibold uppercase tracking-wider">{getLabel()}</span>
          </Link>
        </div>
      </div>
    </nav>
  );
}