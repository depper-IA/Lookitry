'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, LogOut, Menu, Gift } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';
import { SubscriptionBadge } from './SubscriptionBadge';
import { LiveTryOnButton } from './LiveTryOnButton';
import { DashboardNotifications } from './DashboardNotifications';
import { TrialBanner } from './TrialBanner';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { DashboardBottomNav } from '@/components/ui/DashboardBottomNav';
import { LookitryLogoText } from '@/components/mini-landing/shared';
import { getProxiedUrl } from '@/utils/imageProxy';
import type { Brand } from '@/types';

interface DashboardLayoutProps {
  children: React.ReactNode;
  brandOverride?: Brand | null;
}

const navigation = [
  { name: 'Inicio', href: '/dashboard', icon: HomeIcon },
  { name: 'Productos', href: '/dashboard/products', icon: ProductsIcon },
  { name: 'Pruebas IA', href: '/dashboard/generations', icon: GenerationsIcon },
  { name: 'Mi página', href: '/dashboard/mi-pagina', icon: LandingIcon },
  { name: 'Mi opinión', href: '/dashboard/review', icon: ReviewIcon },
  { name: 'Probador y diseño', href: '/dashboard/settings', icon: SettingsIcon },
  { name: 'Conectar tienda', href: '/dashboard/integrations', icon: EmbedIcon },
  { name: 'Consumo', href: '/dashboard/usage', icon: UsageIcon },
  { name: 'Tu plan', href: '/dashboard/subscription', icon: SubscriptionIcon },
  { name: 'Resultados', href: '/dashboard/analytics', icon: AnalyticsIcon },
  { name: 'Recomienda y gana', href: '/dashboard/referral', icon: GiftIcon },
  { name: 'Soporte', href: '/dashboard/support', icon: SupportIcon },
  { name: 'Perfil', href: '/dashboard/profile', icon: ProfileIcon },
];

export function DashboardLayout({ children, brandOverride = null }: DashboardLayoutProps) {
  const { brand, logout } = useAuth();
  const router = useRouter();
  const currentBrand = brandOverride ?? brand;
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [verificationBannerDismissed, setVerificationBannerDismissed] = useState(false);
  const [resendSending, setResendSending] = useState(false);
  const [resendSent, setResendSent] = useState(false);
  const isDashboardHome = pathname === '/dashboard';

  const isPro = currentBrand?.plan === 'PRO';
  const visibleNavigation = navigation.filter((item) => {
    if (item.href === '/dashboard/integrations' && !isPro) return false;
    return true;
  });


  React.useEffect(() => {
    document.body.style.overflow = sidebarOpen ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [sidebarOpen]);

  const showVerificationBanner = !verificationBannerDismissed && currentBrand && !(currentBrand as any).emailVerified;

  const handleResendVerification = async () => {
    if (!currentBrand?.email) return;
    setResendSending(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'https://api.lookitry.com'}/api/auth/resend-verification`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: currentBrand.email }),
      });
      if (!res.ok) throw new Error('Request failed');
      setResendSent(true);
      toast.success('Email de verificación reenviado');
    } catch (err) {
      console.error('Error reenviando verificación:', err);
      toast.error('No se pudo reenviar el email. Intenta de nuevo.');
    } finally {
      setResendSending(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    router.push('/');
  };

  const sidebarContent = (
    <div className="flex h-full flex-col bg-[var(--bg-sidebar)] transition-all duration-300">
      <div className={`flex h-[80px] flex-shrink-0 items-center bg-[var(--bg-sidebar)] px-6 ${isCollapsed ? 'justify-center' : 'justify-between'}`}>
        <Link href="/dashboard" className="group flex items-center gap-3">
          <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-white/5 shadow-lg transition-all duration-500 group-hover:border-[#FF5C3A]/50">
                <Image src="/logo.svg" alt="Lookitry" width={24} height={24} className="object-contain transition-transform duration-500 group-hover:rotate-12" style={{ width: 'auto', height: 'auto' }} priority />
          </div>
          {!isCollapsed && (
            <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="block shrink-0 text-lg leading-none lg:hidden xl:block">
              <LookitryLogoText className="text-white" />
            </motion.div>
          )}
        </Link>

        {!isCollapsed && (
          <button
            onClick={() => setIsCollapsed(true)}
            className="hidden rounded-lg p-1.5 text-gray-500 transition-all hover:bg-white/5 hover:text-white xl:flex"
            title="Colapsar menú"
          >
            <ChevronLeft size={18} />
          </button>
        )}

        <button
          className="rounded-xl p-2 text-gray-400 transition-all hover:bg-white/5 hover:text-white lg:hidden"
          onClick={() => setSidebarOpen(false)}
          aria-label="Cerrar menú"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <nav className={`no-scrollbar flex-1 space-y-1.5 overflow-y-auto py-6 ${isCollapsed ? 'px-3' : 'px-4'}`}>
        {visibleNavigation.map((item) => {
          const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));
          return (
            <div
              key={item.name}
              className="group/nav relative"
            >
              {isActive && (
                <div
                  className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-[#FF5C3A] rounded-r-full"
                />
              )}
              <Link
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                title={isCollapsed ? item.name : ''}
                className={`flex items-center rounded-2xl py-3.5 text-[12px] font-bold uppercase tracking-wider transition-all duration-300 ${
                  isCollapsed ? 'justify-center' : 'gap-3 px-5'
                } ${isActive ? 'text-white' : 'text-gray-400 hover:bg-white/5 hover:text-white'}`}
              >
                <item.icon className={`h-5 w-5 shrink-0 transition-transform duration-300 group-hover/nav:scale-110 ${isActive ? 'text-white' : 'text-gray-400 group-hover/nav:text-[#FF5C3A]'}`} />
                {!isCollapsed && (
                  <span className="block leading-none lg:hidden xl:block">
                    {item.name}
                  </span>
                )}
              </Link>
            </div>
          );
        })}
      </nav>

      <div className="flex-shrink-0 p-4 transition-all duration-300">
        <div className={`group/profile flex items-center shadow-inner transition-all duration-300 ${isCollapsed ? 'justify-center' : 'gap-3 rounded-[2.5rem] border border-white/5 bg-white/5 p-3'}`}>
          <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-white/10 bg-[#FF5C3A] text-[13px] font-black text-white shadow-lg transition-all duration-500 group-hover/profile:scale-105">
            {currentBrand?.logo ? (
              <img
                src={getProxiedUrl(currentBrand.logo)}
                alt={currentBrand.name}
                className="h-full w-full object-contain bg-white/5 p-1"
                onError={(event) => {
                  const target = event.target as HTMLImageElement;
                  target.style.display = 'none';
                  const parent = target.parentElement;
                  if (parent) {
                    parent.textContent = currentBrand?.name?.charAt(0)?.toUpperCase() ?? 'M';
                  }
                }}
              />
            ) : (
              currentBrand?.name?.charAt(0)?.toUpperCase() ?? 'M'
            )}
          </div>
              {!isCollapsed && (
            <>
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="block min-w-0 flex-1 lg:hidden xl:block">
                <p className="truncate text-[12px] font-semibold leading-tight tracking-tight text-white">{currentBrand?.name}</p>
                <div className="mt-1 flex items-center gap-1.5">
                  <div className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />
                  <p className="truncate text-[10px] font-bold uppercase leading-none tracking-tighter text-gray-500">
                    Plan {currentBrand?.plan}
                  </p>
                </div>
              </motion.div>
              <button
                onClick={handleLogout}
                className="group/logout flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl text-gray-600 transition-all hover:bg-white/10 hover:text-white"
                title="Cerrar sesión"
              >
                <LogOut size={18} className="transition-transform group-hover/logout:translate-x-0.5" />
              </button>
            </>
          )}
        </div>

        {isCollapsed && (
          <button
            onClick={() => setIsCollapsed(false)}
            className="mx-auto mt-3 flex h-11 w-11 items-center justify-center rounded-2xl border border-white/5 bg-white/5 text-gray-500 transition-all hover:bg-[#FF5C3A]/20 hover:text-white"
            title="Expandir menú"
          >
            <ChevronRight size={20} />
          </button>
        )}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--bg-base)' }}>
      {sidebarOpen && <div className="fixed inset-0 z-30 bg-black/60 lg:hidden" onClick={() => setSidebarOpen(false)} />}

      <div className={`hidden lg:fixed lg:inset-y-0 lg:left-0 lg:z-20 lg:flex lg:flex-col ${isCollapsed ? 'lg:w-[88px] xl:w-[96px]' : 'lg:w-[96px] xl:w-[240px] 2xl:w-[280px]'}`}>
        {sidebarContent}
      </div>

      <div className={`fixed inset-y-0 left-0 z-40 w-[280px] transform transition-transform duration-300 ease-in-out lg:hidden ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex h-full flex-col bg-[#0a0a0a]">
          <div className="flex h-[80px] flex-shrink-0 items-center justify-between px-6 bg-[#0a0a0a]">
            <Link href="/dashboard" className="group flex items-center gap-3">
              <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-white/5 shadow-lg transition-all duration-500 group-hover:border-[#FF5C3A]/50">
            <Image src="/logo.svg" alt="Lookitry" width={24} height={24} className="object-contain transition-transform duration-500 group-hover:rotate-12" style={{ width: 'auto', height: 'auto' }} priority />
              </div>
              <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="block shrink-0 text-lg leading-none">
                <LookitryLogoText className="text-white" />
              </motion.div>
            </Link>
            <button
              className="rounded-xl p-2 text-gray-400 transition-all hover:bg-white/5 hover:text-white"
              onClick={() => setSidebarOpen(false)}
              aria-label="Cerrar menú"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <nav className="no-scrollbar flex-1 space-y-1.5 overflow-y-auto px-4 py-6 pb-24">
            {visibleNavigation.map((item) => {
              const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));
              return (
                <div
                  key={item.name}
                  className="group/nav-mobile relative"
                >
                  {isActive && (
                    <div
                      className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-[#FF5C3A] rounded-r-full"
                    />
                  )}
                  <Link
                    href={item.href}
                    onClick={() => setSidebarOpen(false)}
                    className={`flex items-center gap-3 rounded-2xl px-5 py-3.5 text-[12px] font-bold uppercase tracking-wider transition-all duration-300 ${
                      isActive ? 'bg-[#FF5C3A] text-white shadow-xl shadow-[#FF5C3A]/20' : 'text-gray-400 hover:bg-white/5 hover:text-white'
                    }`}
                  >
                    <item.icon className={`h-5 w-5 shrink-0 transition-transform duration-300 group-hover/nav-mobile:scale-110 ${isActive ? 'text-white' : 'text-gray-400 group-hover/nav-mobile:text-[#FF5C3A]'}`} />
                    <span className="block leading-none">{item.name}</span>
                  </Link>
                </div>
              );
            })}
          </nav>
          <div className="mb-[calc(5rem+env(safe-area-inset-bottom,0px))] flex-shrink-0 p-4">
            <div className="group/profile flex items-center gap-3 rounded-[2.5rem] border border-white/5 bg-white/5 p-3 shadow-inner transition-all duration-300">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-white/10 bg-[#FF5C3A] text-[13px] font-black text-white shadow-lg transition-all duration-500 group-hover/profile:scale-105">
                {currentBrand?.logo ? (
                  <img
                    src={getProxiedUrl(currentBrand.logo)}
                    alt={currentBrand.name}
                    className="h-full w-full object-contain bg-white/5 p-1"
                    onError={(event) => {
                      const target = event.target as HTMLImageElement;
                      target.style.display = 'none';
                      const parent = target.parentElement;
                      if (parent) {
                        parent.textContent = currentBrand?.name?.charAt(0)?.toUpperCase() ?? 'M';
                      }
                    }}
                  />
                ) : (
                  currentBrand?.name?.charAt(0)?.toUpperCase() ?? 'M'
                )}
              </div>
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="block min-w-0 flex-1">
                <p className="truncate text-[12px] font-semibold leading-tight tracking-tight text-white">{currentBrand?.name}</p>
                <div className="mt-1 flex items-center gap-1.5">
                  <div className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />
                  <p className="truncate text-[10px] font-bold uppercase leading-none tracking-tighter text-gray-500">
                    Plan {currentBrand?.plan}
                  </p>
                </div>
              </motion.div>
              <button
                onClick={handleLogout}
                className="group/logout flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl text-gray-600 transition-all hover:bg-white/10 hover:text-white"
                title="Cerrar sesión"
              >
                <LogOut size={18} className="transition-transform group-hover/logout:translate-x-0.5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className={`flex h-screen flex-col overflow-hidden transition-all duration-300 ${sidebarOpen ? 'opacity-50 pointer-events-none' : ''} ${isCollapsed ? 'lg:pl-[88px] xl:pl-[96px]' : 'lg:pl-[96px] xl:pl-[240px] 2xl:pl-[280px]'}`}>
        {showVerificationBanner && (
          <div className="fixed left-0 right-0 top-16 z-50 flex w-full flex-shrink-0 items-center justify-between gap-4 border-b px-4 py-3 animate-in fade-in slide-in-from-top duration-500 md:static md:top-auto md:z-auto md:border-b md:px-6 lg:static lg:z-auto"
            style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
            <div className="min-w-0 flex items-center gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#FF5C3A]/10">
                <svg className="h-4 w-4 text-[#FF5C3A]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <p className="text-[13px] text-gray-300">
                <span className="font-semibold text-white">Verifica tu cuenta:</span> Hemos enviado un correo a <span className="font-medium text-[#FF5C3A]">{currentBrand?.email}</span>{' '}
                {resendSent ? (
                  <span className="ml-1 inline-flex items-center gap-1 font-medium text-emerald-400">
                    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                    Reenviado con éxito
                  </span>
                ) : (
                  <button
                    onClick={handleResendVerification}
                    disabled={resendSending}
                    className="ml-1 cursor-pointer border-0 bg-transparent p-0 text-[13px] text-gray-400 underline decoration-[#FF5C3A]/30 transition-all hover:text-white hover:decoration-[#FF5C3A] disabled:opacity-50"
                  >
                    {resendSending ? 'Enviando...' : '¿No lo recibiste? Reenviar ahora'}
                  </button>
                )}
              </p>
            </div>
            <button
              onClick={() => setVerificationBannerDismissed(true)}
              className="rounded-lg p-1.5 text-gray-500 transition-colors hover:bg-white/5 hover:text-white"
              aria-label="Cerrar aviso"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}

        <header
          className="fixed left-0 right-0 top-0 z-40 flex h-16 flex-shrink-0 items-center justify-between border-b px-4 md:sticky md:h-20 md:px-6 xl:px-8"
          style={{
            backgroundColor: 'var(--bg-header)',
            borderColor: 'var(--border-color)',
            boxShadow: 'var(--shadow-header)',
          }}
        >
          <div className="flex items-center gap-3 lg:hidden">
            <button
              className="p-2 text-[var(--text-secondary)] transition-all hover:text-[var(--text-primary)] active:scale-95"
              onClick={() => setSidebarOpen(true)}
              aria-label="Abrir menú"
            >
              <Menu size={22} />
            </button>
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/5 dark:bg-black/5">
              <Image src="/Lookitry-logo-dark.svg" alt="L" width={18} height={18} className="object-contain dark:hidden" priority />
              <Image src="/logo.svg" alt="L" width={18} height={18} className="object-contain hidden dark:block" style={{ width: 'auto', height: 'auto' }} priority />
            </div>
          </div>

          <h2 className="hidden flex-shrink-0 font-jakarta text-lg font-bold tracking-tight opacity-80 lg:block" style={{ color: 'var(--text-primary)' }}>
            {visibleNavigation.find((item) => item.href === pathname)?.name || 'Dashboard'}
          </h2>

          <div className="ml-auto flex items-center gap-2 md:gap-4">
            <div className="hidden md:block">
              <LiveTryOnButton brandOverride={currentBrand} />
            </div>
            <SubscriptionBadge />
            <ThemeToggle />
          </div>
        </header>

        <main className="flex-1 overflow-x-hidden overflow-y-auto p-3 pt-16 sm:p-4 sm:pt-20 md:p-6 md:pt-6 md:pb-24 xl:p-8 xl:pt-10 pb-28 sm:pb-28 md:pb-24">
          {!isDashboardHome && <DashboardNotifications />}
          {!isDashboardHome && <TrialBanner />}
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">{children}</div>
        </main>
      </div>

      <DashboardBottomNav />
    </div>
  );
}

function HomeIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
    </svg>
  );
}

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

function ReviewIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M7 8h10M7 12h7m-7 4h4m10-9a2 2 0 00-2-2H5a2 2 0 00-2 2v11l4-3h12a2 2 0 002-2V7z" />
    </svg>
  );
}

function GiftIcon({ className }: { className?: string }) {
  return (
    <Gift className={className} strokeWidth={1.75} />
  );
}

function SupportIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" />
    </svg>
  );
}
