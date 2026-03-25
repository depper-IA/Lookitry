'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { SubscriptionBadge } from './SubscriptionBadge';
import { OnboardingWizard } from './OnboardingWizard';
import { LiveTryOnButton } from './LiveTryOnButton';
import { DashboardNotifications } from './DashboardNotifications';
import { TrialBanner } from './TrialBanner';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { LookitryLogoText } from '@/components/mini-landing/shared';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, ChevronLeft, ChevronRight, LogOut, Building2 } from 'lucide-react';
import { getProxiedUrl } from '@/utils/imageProxy';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

const navigation = [
  { name: 'Inicio',         href: '/dashboard',              icon: HomeIcon },
  { name: 'Productos',      href: '/dashboard/products',     icon: ProductsIcon },
  { name: 'Generaciones',   href: '/dashboard/generations',  icon: GenerationsIcon },
  { name: 'Mi página',      href: '/dashboard/mi-pagina',    icon: LandingIcon },
  { name: 'Widget Probador',  href: '/dashboard/settings',     icon: SettingsIcon },
  { name: 'Integraciones',  href: '/dashboard/integrations',     icon: EmbedIcon },
  { name: 'Uso',            href: '/dashboard/usage',        icon: UsageIcon },
  { name: 'Suscripción',    href: '/dashboard/subscription', icon: SubscriptionIcon },
  { name: 'Analytics',      href: '/dashboard/analytics',    icon: AnalyticsIcon },
  { name: 'Perfil',         href: '/dashboard/profile',      icon: ProfileIcon },
];

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const { brand, logout } = useAuth();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [verificationBannerDismissed, setVerificationBannerDismissed] = useState(false);
  const [resendSending, setResendSending] = useState(false);
  const [resendSent, setResendSent] = useState(false);

  // Bloquear scroll del body cuando el drawer móvil está abierto
  React.useEffect(() => {
    if (sidebarOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [sidebarOpen]);

  const showVerificationBanner = !verificationBannerDismissed && brand && !(brand as any).emailVerified;

  const handleResendVerification = async () => {
    if (!brand?.email) return;
    setResendSending(true);
    try {
      await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'https://api.lookitry.com'}/api/auth/resend-verification`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: brand.email }),
        }
      );
      setResendSent(true);
    } catch {
      // silencioso
    } finally {
      setResendSending(false);
    }
  };

  const sidebarContent = (
    <div className="flex flex-col h-full bg-[var(--bg-sidebar)] transition-all duration-300">
      {/* Logo Area */}
      <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'justify-between'} h-[80px] px-6 flex-shrink-0 bg-[var(--bg-sidebar)]`}>
        <Link href="/dashboard" className="flex items-center gap-3 group">
          <div className="relative w-10 h-10 flex items-center justify-center bg-white/5 rounded-2xl border border-white/10 group-hover:border-[#FF5C3A]/50 transition-all duration-500 shadow-lg shrink-0">
            <Image src="/logo.svg" alt="Lookitry" width={24} height={24} className="object-contain group-hover:rotate-12 transition-transform duration-500" priority />
          </div>
          {!isCollapsed && (
            <motion.div 
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="text-lg leading-none shrink-0"
            >
              <LookitryLogoText className="text-white" />
            </motion.div>
          )}
        </Link>
        
        {/* Toggle Collapse Desktop */}
        {!isCollapsed && (
          <button
            onClick={() => setIsCollapsed(true)}
            className="hidden lg:flex p-1.5 rounded-lg text-gray-500 hover:text-white hover:bg-white/5 transition-all"
            title="Colapsar menú"
          >
            <ChevronLeft size={18} />
          </button>
        )}
        
        {/* Botón cerrar en móvil */}
        <button
          className="lg:hidden p-2 rounded-xl text-gray-400 hover:text-white hover:bg-white/5 transition-all"
          onClick={() => setSidebarOpen(false)}
          aria-label="Cerrar menú"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Nav */}
      <nav className={`flex-1 ${isCollapsed ? 'px-3' : 'px-4'} py-6 space-y-1.5 overflow-y-auto no-scrollbar`}>
        {navigation.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              onClick={() => setSidebarOpen(false)}
              title={isCollapsed ? item.name : ''}
              className={`flex items-center ${isCollapsed ? 'justify-center' : 'gap-3 px-5'} py-3.5 rounded-2xl text-[12px] font-bold uppercase tracking-wider transition-all duration-300 group
                ${isActive 
                   ? 'bg-[#FF5C3A] text-white shadow-xl shadow-[#FF5C3A]/20' 
                   : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
            >
              <item.icon className={`w-5 h-5 flex-shrink-0 transition-transform duration-300 group-hover:scale-110 ${isActive ? 'text-white' : 'text-gray-600 group-hover:text-[#FF5C3A]'}`} />
              {!isCollapsed && (
                <motion.span 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="leading-none"
                >
                  {item.name}
                </motion.span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Brand info + logout section */}
      <div className={`p-4 flex-shrink-0 transition-all duration-300`}>
        <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'gap-3 p-3 rounded-[2.5rem] bg-white/5 border border-white/5'} shadow-inner group/profile transition-all duration-300`}>
          <div className="w-11 h-11 rounded-2xl overflow-hidden flex items-center justify-center text-[13px] font-black text-white flex-shrink-0 bg-[#FF5C3A] shadow-lg group-hover/profile:scale-105 transition-all duration-500 border border-white/10">
            {brand?.logo ? (
              <img 
                src={getProxiedUrl(brand.logo)} 
                alt={brand.name} 
                className="w-full h-full object-contain bg-white/5 p-1"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                  (e.target as HTMLImageElement).parentElement!.innerHTML = brand?.name?.charAt(0)?.toUpperCase() ?? 'M';
                }}
              />
            ) : (
              brand?.name?.charAt(0)?.toUpperCase() ?? 'M'
            )}
          </div>
          {!isCollapsed && (
            <>
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex-1 min-w-0"
              >
                <p className="text-[12px] font-black text-white truncate leading-tight uppercase tracking-tight italic">{brand?.name}</p>
                <div className="flex items-center gap-1.5 mt-1">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <p className="text-[10px] truncate leading-none text-gray-500 font-bold uppercase tracking-tighter">
                    Plan {brand?.plan}
                  </p>
                </div>
              </motion.div>
              <button
                onClick={logout}
                className="w-10 h-10 rounded-2xl transition-all flex items-center justify-center text-gray-600 hover:text-white hover:bg-white/10 group/logout shrink-0"
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
             className="w-11 h-11 mt-3 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-center text-gray-500 hover:text-white hover:bg-[#FF5C3A]/20 transition-all mx-auto"
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
      {/* Overlay móvil */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/60 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar desktop (fijo) */}
      <div className={`hidden lg:flex lg:flex-col lg:fixed lg:inset-y-0 lg:left-0 z-20 transition-all duration-300 ${isCollapsed ? 'lg:w-[90px]' : 'lg:w-[280px]'}`}>
        {sidebarContent}
      </div>

      {/* Sidebar móvil (drawer) */}
      <div
        className={`fixed inset-y-0 left-0 w-[280px] z-40 transform transition-transform duration-300 ease-in-out lg:hidden ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {sidebarContent}
      </div>

      {/* Contenido principal */}
      <div className={`flex flex-col h-screen overflow-hidden transition-all duration-300 ${sidebarOpen ? 'blur-[2px]' : ''} ${isCollapsed ? 'lg:pl-[90px]' : 'lg:pl-[280px]'}`}>
        {/* Banner de verificación de email — elegante y minimalista */}
        {showVerificationBanner && (
          <div className="w-full border-b px-6 py-3 flex items-center justify-between gap-4 flex-shrink-0 animate-in fade-in slide-in-from-top duration-500" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-8 h-8 rounded-full bg-[#FF5C3A]/10 flex items-center justify-center shrink-0">
                <svg className="w-4 h-4 text-[#FF5C3A]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <p className="text-[13px] text-gray-300">
                <span className="font-semibold text-white">Verifica tu cuenta:</span> Hemos enviado un correo a <span className="text-[#FF5C3A] font-medium">{brand?.email}</span>.{' '}
                {resendSent ? (
                  <span className="text-emerald-400 font-medium ml-1 inline-flex items-center gap-1">
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                    Reenviado con éxito
                  </span>
                ) : (
                  <button
                    onClick={handleResendVerification}
                    disabled={resendSending}
                    className="underline decoration-[#FF5C3A]/30 hover:decoration-[#FF5C3A] hover:text-white transition-all disabled:opacity-50 bg-transparent border-0 p-0 cursor-pointer text-gray-400 text-[13px] ml-1"
                  >
                    {resendSending ? 'Enviando...' : '¿No lo recibiste? Reenviar ahora'}
                  </button>
                )}
              </p>
            </div>
            <button
              onClick={() => setVerificationBannerDismissed(true)}
              className="p-1.5 rounded-lg text-gray-500 hover:text-white hover:bg-white/5 transition-colors"
              aria-label="Cerrar aviso"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}
        {/* Header */}
        <header
          className="flex-shrink-0 flex items-center justify-between px-4 md:px-8 h-16 md:h-20 border-b relative z-10"
          style={{
            backgroundColor: 'var(--bg-header)',
            borderColor: 'var(--border-color)',
            boxShadow: 'var(--shadow-header)',
          }}
        >
          {/* Hamburger móvil + Logo (Solo visible en mobile) */}
          <div className="flex lg:hidden items-center gap-3">
            <button
              className="p-2 rounded-xl bg-white/5 border border-white/5 text-[var(--text-secondary)] active:scale-95 transition-all"
              onClick={() => setSidebarOpen(true)}
              aria-label="Abrir menú"
            >
              <Menu size={20} />
            </button>
            <div className="w-8 h-8 flex items-center justify-center bg-white/5 rounded-xl border border-white/10 shrink-0">
               <Image src="/logo.svg" alt="L" width={18} height={18} priority />
            </div>
          </div>

          <h2
            className="hidden lg:block font-jakarta font-[950] text-lg flex-shrink-0 tracking-tight uppercase italic opacity-80"
            style={{ color: 'var(--text-primary)' }}
          >
            {navigation.find(n => n.href === pathname)?.name || 'Dashboard'}
          </h2>

          <div className="flex items-center gap-2 md:gap-4 ml-auto">
            <div className="hidden sm:block">
              <LiveTryOnButton />
            </div>
            <SubscriptionBadge />
            <ThemeToggle />
          </div>
        </header>

        {/* Contenido de página */}
        <main className="flex-1 overflow-y-auto overflow-x-hidden p-3 md:p-8 md:pt-10 scroll-smooth">
          <OnboardingWizard />
          <DashboardNotifications />
          <TrialBanner />
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}

/* ── Iconos ─────────────────────────────────────────────────────────────────── */
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

function AgencyIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.59 14.37a6 6 0 01-5.84 7.38v-4.8m5.84-2.58a14.98 14.98 0 006.16-12.12A14.98 14.98 0 009.63 8.41m5.96 5.96a14.96 14.96 0 01-5.96 5.96m5.96-5.96L9.63 8.41m0 0a14.98 14.98 0 00-6.16 12.12A14.98 14.98 0 0015.59 14.37m-5.96-5.96a14.96 14.96 0 015.96-5.96" />
    </svg>
  );
}
