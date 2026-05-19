'use client';

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

  const Item = ({
    href,
    icon,
    label,
  }: {
    href: string;
    icon: React.ReactNode;
    label: string;
  }) => {
    const active = isActive(href);
    return (
      <Link
        href={href}
        aria-current={active ? 'page' : undefined}
        className="relative flex flex-1 flex-col items-center justify-center gap-[5px] py-2 transition-all duration-150 active:opacity-60"
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
  };

  return (
    <nav
      role="navigation"
      aria-label="Navegación del dashboard"
      className="fixed bottom-0 left-0 right-0 z-50 md:hidden"
    >
      <div className="relative flex items-stretch border-t border-black/[0.06] dark:border-white/[0.06] bg-white/95 dark:bg-[#0a0a0a]/95 backdrop-blur-xl pb-[env(safe-area-inset-bottom)]">
        <Item href="/dashboard" icon={<Home size={22} />} label="Inicio" />
        <Item href="/dashboard/products" icon={<Package size={22} />} label="Productos" />
        <Item href="/dashboard/generations" icon={<Sparkles size={22} />} label="Pruebas" />
        <Item href="/dashboard/analytics" icon={<BarChart3 size={22} />} label="Resultados" />
        <Item href="/dashboard/profile" icon={<User size={22} />} label="Perfil" />
      </div>
    </nav>
  );
}
