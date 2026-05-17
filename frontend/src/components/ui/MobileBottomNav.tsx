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
      className={`relative flex flex-1 flex-col items-center justify-center gap-1 rounded-2xl px-2 py-2.5 transition-all duration-150 active:scale-95 ${
        active
          ? 'bg-accent text-white shadow-[0_4px_12px_rgba(255,92,58,0.35)]'
          : 'text-black/40 dark:text-white/35 hover:text-black/70 dark:hover:text-white/60'
      }`}
    >
      <span className="flex items-center justify-center">{icon}</span>
      <span className={`text-[10px] font-semibold leading-none ${active ? 'text-white' : ''}`}>
        {label}
      </span>
    </Link>
  );

  return (
    <nav
      role="navigation"
      aria-label="Navegación principal"
      className="fixed bottom-0 left-0 right-0 z-40 md:hidden"
      style={{ paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom))' }}
    >
      <div className="mx-auto max-w-md px-3 pt-2">
        <div className="flex items-center gap-1 rounded-3xl border border-black/[0.07] dark:border-white/[0.09] bg-white/90 dark:bg-[#111]/90 backdrop-blur-2xl px-2 py-1.5 shadow-[0_8px_40px_rgba(0,0,0,0.14)] dark:shadow-[0_8px_40px_rgba(0,0,0,0.5)]">
          <Item href="/" icon={<Home size={21} />} label="Inicio" active={isActive('/')} />
          <Item href="/#hero" icon={<Sparkles size={21} />} label="Probar" active={false} />
          <Item href="/contacto" icon={<Mail size={21} />} label="Contacto" active={isActive('/contacto')} />
          <Item
            href={isLoggedIn ? '/dashboard' : '/login'}
            icon={isLoggedIn ? <User size={21} /> : <LogIn size={21} />}
            label={isLoggedIn ? 'Mi Panel' : 'Ingresar'}
            active={isActive(isLoggedIn ? '/dashboard' : '/login')}
          />
        </div>
      </div>
    </nav>
  );
}
