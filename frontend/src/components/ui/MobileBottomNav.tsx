'use client';

import Link from 'next/link';
import { Home, Sparkles, Mail, User, LogIn } from 'lucide-react';
import { usePublicSession } from '@/hooks/usePublicSession';

export function MobileBottomNav({ pathname }: { pathname: string }) {
  const { isLoggedIn } = usePublicSession();

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/';
    return pathname.startsWith(href);
  };

  const Item = ({
    href,
    icon,
    label,
    active,
  }: {
    href: string;
    icon: React.ReactNode;
    label: string;
    active: boolean;
  }) => (
    <Link
      href={href}
      aria-current={active ? 'page' : undefined}
      className="flex flex-1 flex-col items-center justify-center gap-[5px] py-2 transition-all duration-150 active:opacity-60"
    >
      <span className={`transition-colors duration-150 ${active ? 'text-[#FF5C3A]' : 'text-black/30 dark:text-white/25'}`}>
        {icon}
      </span>
      <span className={`text-[9.5px] font-semibold leading-none tracking-wide transition-colors duration-150 ${
        active ? 'text-[#FF5C3A]' : 'text-black/30 dark:text-white/25'
      }`}>
        {label}
      </span>
      {active && (
        <span className="absolute bottom-0 left-1/2 -translate-x-1/2 h-[2px] w-5 rounded-full bg-[#FF5C3A]" />
      )}
    </Link>
  );

  return (
    <nav
      role="navigation"
      aria-label="Navegación principal"
      className="fixed bottom-0 left-0 right-0 z-40 md:hidden"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <div className="relative flex items-stretch border-t border-black/[0.06] dark:border-white/[0.06] bg-white/95 dark:bg-[#0a0a0a]/95 backdrop-blur-xl pb-[env(safe-area-inset-bottom)]">
        <Item href="/" icon={<Home size={22} />} label="Inicio" active={isActive('/')} />
        <Item href="/#hero" icon={<Sparkles size={22} />} label="Probar" active={false} />
        <Item href="/contacto" icon={<Mail size={22} />} label="Contacto" active={isActive('/contacto')} />
        <Item
          href={isLoggedIn ? '/dashboard' : '/login'}
          icon={isLoggedIn ? <User size={22} /> : <LogIn size={22} />}
          label={isLoggedIn ? 'Mi Panel' : 'Ingresar'}
          active={isActive(isLoggedIn ? '/dashboard' : '/login')}
        />
      </div>
    </nav>
  );
}
