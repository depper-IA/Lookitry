'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { SubscriptionBadge } from './SubscriptionBadge';
import { OnboardingWizard } from './OnboardingWizard';
import { LiveTryOnButton } from './LiveTryOnButton';
import { DashboardNotifications } from './DashboardNotifications';
import { TrialBanner } from './TrialBanner';
import { ThemeToggle } from '@/components/ui/ThemeToggle';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

const navigation = [
  { name: 'Productos',      href: '/dashboard/products',     icon: ProductsIcon },
  { name: 'Generaciones',   href: '/dashboard/generations',  icon: GenerationsIcon },
  { name: 'Mi página',      href: '/dashboard/mi-pagina',    icon: LandingIcon },
  { name: 'Configuración',  href: '/dashboard/settings',     icon: SettingsIcon },
  { name: 'Uso',            href: '/dashboard/usage',        icon: UsageIcon },
  { name: 'Suscripción',    href: '/dashboard/subscription', icon: SubscriptionIcon },
  { name: 'Analytics',      href: '/dashboard/analytics',    icon: AnalyticsIcon },
  { name: 'Código Embed',   href: '/dashboard/embed',        icon: EmbedIcon },
  { name: 'Perfil',         href: '/dashboard/profile',      icon: ProfileIcon },
];

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const { brand, logout } = useAuth();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const sidebarContent = (
    <div className="flex flex-col h-full" style={{ backgroundColor: 'var(--bg-sidebar)' }}>
      {/* Logo */}
      <div className="flex items-center justify-between h-16 px-5 border-b" style={{ borderColor: '#1f1f1f' }}>
        <span className="font-syne font-bold text-lg text-white tracking-tight">Mostrador</span>
        {/* Botón cerrar en móvil */}
        <button
          className="lg:hidden p-1 rounded text-gray-400 hover:text-white"
          onClick={() => setSidebarOpen(false)}
          aria-label="Cerrar menú"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-5 space-y-0.5 overflow-y-auto">
        {navigation.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
          return (
            <Link
              key={item.name}
              href={item.href}
              onClick={() => setSidebarOpen(false)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? 'text-white'
                  : 'hover:text-white'
              }`}
              style={{
                backgroundColor: isActive ? '#FF5C3A' : 'transparent',
                color: isActive ? '#ffffff' : 'var(--text-sidebar)',
              }}
              onMouseEnter={e => { if (!isActive) (e.currentTarget as HTMLElement).style.backgroundColor = 'var(--bg-sidebar-hover)'; }}
              onMouseLeave={e => { if (!isActive) (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent'; }}
            >
              <item.icon className="w-4 h-4 flex-shrink-0" />
              {item.name}
            </Link>
          );
        })}
      </nav>

      {/* Brand info + logout */}
      <div className="p-4 border-t" style={{ borderColor: '#1f1f1f' }}>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
            style={{ backgroundColor: '#FF5C3A' }}>
            {brand?.name?.charAt(0)?.toUpperCase() ?? 'M'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white truncate">{brand?.name}</p>
            <p className="text-xs truncate" style={{ color: 'var(--text-sidebar)' }}>
              Plan {brand?.plan}
            </p>
          </div>
          <button
            onClick={logout}
            className="p-1.5 rounded-lg transition-colors flex-shrink-0"
            style={{ color: 'var(--text-sidebar)' }}
            title="Cerrar sesión"
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = '#ffffff'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = 'var(--text-sidebar)'; }}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round"
                d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--bg-base)' }}>
      {/* Overlay móvil */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/60 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar desktop (fijo) */}
      <div className="hidden lg:flex lg:flex-col lg:fixed lg:inset-y-0 lg:left-0 lg:w-60 lg:z-20">
        {sidebarContent}
      </div>

      {/* Sidebar móvil (drawer) */}
      <div
        className={`fixed inset-y-0 left-0 w-64 z-40 transform transition-transform duration-200 ease-in-out lg:hidden ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {sidebarContent}
      </div>

      {/* Contenido principal */}
      <div className="lg:pl-60 flex flex-col min-h-screen">
        {/* Header */}
        <header
          className="sticky top-0 z-10 flex items-center justify-between px-4 sm:px-6 h-14 border-b"
          style={{
            backgroundColor: 'var(--bg-header)',
            borderColor: 'var(--border-color)',
            boxShadow: 'var(--shadow-header)',
          }}
        >
          {/* Hamburger móvil */}
          <button
            className="lg:hidden p-2 rounded-lg -ml-1"
            style={{ color: 'var(--text-secondary)' }}
            onClick={() => setSidebarOpen(true)}
            aria-label="Abrir menú"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>

          <h2
            className="hidden lg:block font-syne font-semibold text-base"
            style={{ color: 'var(--text-primary)' }}
          >
            Dashboard
          </h2>

          <div className="flex items-center gap-2 ml-auto">
            <LiveTryOnButton />
            <SubscriptionBadge />
            <ThemeToggle />
          </div>
        </header>

        {/* Contenido de página */}
        <main className="flex-1 p-4 sm:p-6">
          <OnboardingWizard />
          <DashboardNotifications />
          <TrialBanner />
          {children}
        </main>
      </div>
    </div>
  );
}

/* ── Iconos ─────────────────────────────────────────────────────────────────── */
function ProductsIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
    </svg>
  );
}
function SettingsIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  );
}
function UsageIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
    </svg>
  );
}
function SubscriptionIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
    </svg>
  );
}
function AnalyticsIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" />
    </svg>
  );
}
function EmbedIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
    </svg>
  );
}
function ProfileIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
  );
}
function GenerationsIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5M21 6.75V18a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 18V6.75m18 0A2.25 2.25 0 0018.75 4.5H5.25A2.25 2.25 0 003 6.75m18 0H3" />
    </svg>
  );
}

function LandingIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 013 12c0-1.605.42-3.113 1.157-4.418" />
    </svg>
  );
}
