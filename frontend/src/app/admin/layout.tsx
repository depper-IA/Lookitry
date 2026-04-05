'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { AdminNotifications } from '@/components/admin/AdminNotifications';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { ConfirmProvider } from '@/components/admin/ConfirmDialog';
import { AdminBottomNav } from '@/components/ui/AdminBottomNav';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, LogOut, LayoutDashboard, Building2, CreditCard, TrendingUp, History, Settings2, Tag, PieChart, MousePointer2, Layout, Megaphone, Bell, Clock, ShieldCheck, User, Shield, DollarSign, Activity, Zap, Brain, BookOpen, GitBranch, Gift } from 'lucide-react';

const adminNav = [
  {
    label: 'Comando',
    items: [
      { href: '/admin/dashboard',     label: 'Mission Control', icon: DashboardIcon },
      { href: '/admin/risk',          label: 'Riesgo',          icon: Shield },
      { href: '/admin/playbooks',     label: 'Playbooks',       icon: BookOpen },
    ],
  },
  {
    label: 'Clientes y Revenue',
    items: [
      { href: '/admin/brands',        label: 'Marcas',           icon: BrandsIcon },
      { href: '/admin/subscriptions', label: 'Suscripciones',    icon: SubsIcon },
      { href: '/admin/referrals',     label: 'Referidos',        icon: Gift },
      { href: '/admin/revenue',       label: 'Ingresos',         icon: RevenueIcon },
      { href: '/admin/payments',      label: 'Historial Pagos',  icon: PaymentsIcon },
      { href: '/admin/unit-economics',label: 'Economía',         icon: DollarSign },
      { href: '/admin/funnel',        label: 'Funnel SaaS',      icon: GitBranch },
    ],
  },
  {
    label: 'Producto',
    items: [
      { href: '/admin/analytics',          label: 'Analytics',    icon: AnalyticsIcon },
      { href: '/admin/conversion',         label: 'Conversión',   icon: ConversionIcon },
      { href: '/admin/mini-landings',      label: 'Mini-Landings',icon: MiniLandingIcon },
      { href: '/admin/reviews',            label: 'Reviews',      icon: ReviewsIcon },
      { href: '/admin/woocommerce',        label: 'WooCommerce',  icon: WooIcon },
      { href: '/admin/pricing',            label: 'Precios',      icon: PricingIcon },
      { href: '/admin/payment-settings',   label: 'Medios Pago',  icon: PaySettingsIcon },
      { href: '/admin/marketing/promotions',label: 'Promociones', icon: MegaphoneIcon },
      { href: '/admin/email-campaigns', label: 'Email Campaigns', icon: EmailCampaignIcon },
    ],
  },
  {
    label: 'Leads & CRM',
    items: [
      { href: '/admin/leads', label: 'Leads', icon: UsersIcon },
      { href: '/admin/lead-searches', label: 'Lead Searches', icon: TargetIcon },
      { href: '/admin/social-api-config', label: 'Social APIs', icon: SettingsIcon },
    ],
  },
  {
    label: 'Infraestructura',
    items: [
      { href: '/admin/health',   label: 'Confiabilidad', icon: Zap },
      { href: '/admin/ia-costs', label: 'Costos e IA',   icon: Brain },
      { href: '/admin/security', label: 'Seguridad',     icon: ShieldCheck },
    ],
  },
  {
    label: 'Gobierno',
    items: [
      { href: '/admin/audit-log',     label: 'Auditoría',       icon: Activity },
      { href: '/admin/admins',        label: 'Administradores', icon: AdminsIcon },
      { href: '/admin/notifications', label: 'Actividad',       icon: BellIcon },
      { href: '/admin/soporte',       label: 'Soporte',         icon: BellIcon },
      { href: '/admin/enterprise',    label: 'Enterprise Sync', icon: EnterpriseIcon },
      { href: '/admin/configuracion?tab=launch', label: '🚀 Launch', icon: TrialIcon },
      { href: '/admin/configuracion', label: 'Configuración',   icon: TrialIcon },
    ],
  },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router   = useRouter();
  const pathname = usePathname();
  const [adminUser, setAdminUser]         = useState<any>(null);
  const [loading, setLoading]             = useState(true);
  const [sidebarOpen, setSidebarOpen]     = useState(false);
  const [isCollapsed, setIsCollapsed]     = useState(false);
  const [feedbackCount, setFeedbackCount] = useState(0);
  const [notifCount, setNotifCount]       = useState(0);

  useEffect(() => {
    const userStr = localStorage.getItem('adminUser');
    let userParsed = null;

    if (userStr) {
      try {
        userParsed = JSON.parse(userStr);
      } catch (e) {
        console.error('Error parseando adminUser:', e);
        localStorage.removeItem('adminUser');
      }
    }

    if (!userParsed && pathname !== '/admin/login') {
      router.push('/admin/login');
      return;
    }

    if (pathname !== '/admin/login') {
      const apiBase = process.env.NEXT_PUBLIC_API_URL || 'https://api.lookitry.com';

      fetch(`${apiBase}/api/admin/verify`, { credentials: 'include' })
        .then(r => {
          if (r.status === 401) {
            localStorage.removeItem('adminUser');
            router.push('/admin/login');
            return null;
          }
          return r.ok ? r.json() : null;
        })
        .then(profileData => {
          if (!profileData) {
            if (userParsed) setAdminUser(userParsed);
            setLoading(false);
            return;
          }
          // Actualizar con datos frescos del servidor
          setAdminUser(profileData.admin || userParsed);
          setLoading(false);

          Promise.all([
            fetch(`${apiBase}/api/admin/feedback/count-unresolved`, { credentials: 'include' }).then(r => r.ok ? r.json() : null),
            fetch(`${apiBase}/api/admin/notifications`, { credentials: 'include' }).then(r => r.ok ? r.json() : null),
          ]).then(([fbData, notifData]) => {
            if (fbData?.count) setFeedbackCount(fbData.count);
            if (notifData?.notifications) {
              try {
                const readRaw = localStorage.getItem('admin_notifications_read');
                const readIds: Set<string> = readRaw ? new Set(JSON.parse(readRaw)) : new Set();
                const unread = (notifData.notifications as any[]).filter((n: any) => !readIds.has(n.id)).length;
                setNotifCount(unread);
              } catch { setNotifCount(notifData.notifications.length); }
            }
          }).catch(() => {});
        })
        .catch(() => {
          if (userParsed) setAdminUser(userParsed);
          setLoading(false);
        });
    } else {
      if (userParsed) setAdminUser(userParsed);
      setLoading(false);
    }
  }, [pathname, router]);

  const handleLogout = async () => {
    try {
      const apiBase = process.env.NEXT_PUBLIC_API_URL || 'https://api.lookitry.com';
      await fetch(`${apiBase}/api/admin/auth/logout`, { method: 'POST', credentials: 'include' });
    } catch (e) { console.error('Error logging out:', e); }
    localStorage.removeItem('adminUser');
    router.push('/');
  };

  if (pathname === '/admin/login') return <>{children}</>;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#0a0a0a' }}>
        <div className="flex flex-col items-center gap-4">
          <div
            className="w-9 h-9 rounded-full border-2 animate-spin"
            style={{ borderColor: '#FF5C3A', borderTopColor: 'transparent' }}
          />
          <p className="text-xs font-medium tracking-[0.12em]" style={{ color: '#555' }}>Cargando</p>
        </div>
      </div>
    );
  }

  const sidebarContent = (
    <div className="flex flex-col h-full bg-[#0a0a0a] transition-all duration-300">
      {/* Logo Area */}
      <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'justify-between'} px-6 h-[80px] flex-shrink-0 bg-[#0a0a0a]`}>
        <Link href="/admin/dashboard" className="flex items-center gap-3 group">
          <div className="relative h-11 w-11 flex items-center justify-center bg-white/5 rounded-2xl border border-white/10 group-hover:border-[#FF5C3A]/50 transition-all duration-500 shadow-lg shrink-0 overflow-hidden">
            <Image
              src="/logo.svg"
              alt="Lookitry"
              width={28}
              height={28}
              className="object-contain"
              priority
            />
          </div>
          {!isCollapsed && (
            <motion.div 
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-baseline gap-1.5"
            >
              <span className="font-jakarta font-extrabold text-lg leading-none text-white tracking-tight">
                Look<span style={{ color: '#FF5C3A' }}>itry</span>
              </span>
              <span className="text-[9px] font-black uppercase tracking-[0.18em] px-2 py-0.5 rounded bg-[#FF5C3A]/10 text-[#FF5C3A] border border-[#FF5C3A]/20">
                Admin
              </span>
            </motion.div>
          )}
        </Link>
        
        {/* Toggle Collapse Desktop */}
        {!isCollapsed && (
          <button
            onClick={() => setIsCollapsed(true)}
            className="hidden lg:flex p-1.5 rounded-lg text-gray-600 hover:text-white hover:bg-white/5 transition-all"
            title="Colapsar menú"
          >
            <ChevronLeft size={18} />
          </button>
        )}
        
        {/* Botón cerrar en móvil */}
        <button
          className="lg:hidden p-2 rounded-xl text-gray-500 hover:text-white hover:bg-white/5 transition-all"
          onClick={() => setSidebarOpen(false)}
          aria-label="Cerrar menú"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Nav */}
      <nav className={`flex-1 ${isCollapsed ? 'px-3' : 'px-4'} py-6 space-y-7 overflow-y-auto no-scrollbar`}>
        {adminNav.map((group, gi) => (
          <div key={gi} className="space-y-2">
            {!isCollapsed && group.label && (
              <motion.p 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="px-4 text-[9px] font-black uppercase tracking-[0.25em] text-zinc-600"
              >
                {group.label}
              </motion.p>
            )}
            <div className="space-y-1.5">
              {group.items.map(item => {
                const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
                const isNotifications = item.href === '/admin/notifications';
                const badge = isNotifications ? (feedbackCount + notifCount) : 0;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setSidebarOpen(false)}
                    title={isCollapsed ? item.label : ''}
                    className={`flex items-center ${isCollapsed ? 'justify-center py-4' : 'gap-3 px-5 py-3.5'} rounded-2xl text-[12px] font-semibold tracking-[0.01em] transition-all duration-300 group
                      ${isActive 
                        ? 'bg-[#FF5C3A] text-white shadow-xl shadow-[#FF5C3A]/20' 
                        : 'text-gray-500 hover:text-white hover:bg-white/5'
                      }`}
                  >
                    <item.icon className={`w-5 h-5 flex-shrink-0 transition-transform duration-300 group-hover:scale-110 ${isActive ? 'text-white' : 'text-gray-700 group-hover:text-[#FF5C3A]'}`} />
                    {!isCollapsed && (
                      <motion.span 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="flex-1 leading-none"
                      >
                        {item.label}
                      </motion.span>
                    )}
                    {badge > 0 && (
                      <span className={`text-[9px] font-black px-2 py-0.5 rounded-full flex-shrink-0 leading-none ${isActive ? 'bg-white/20 text-white' : 'bg-red-500 text-white shadow-lg shadow-red-500/20'}`}>
                        {badge > 99 ? '99+' : badge}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* User footer */}
      <div className={`p-4 flex-shrink-0 transition-all duration-300`}>
        <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'gap-3 p-3 rounded-[2.5rem] bg-white/5 border border-white/5'} shadow-inner group/profile transition-all duration-300`}>
          <Link
            href="/admin/profile"
            onClick={() => setSidebarOpen(false)}
            className="w-11 h-11 rounded-2xl overflow-hidden flex items-center justify-center text-[13px] font-black text-white flex-shrink-0 bg-[#FF5C3A] shadow-lg group-hover/profile:scale-105 transition-transform duration-500"
            title="Mi perfil"
          >
            {adminUser?.name?.charAt(0)?.toUpperCase() ?? 'A'}
          </Link>
          {!isCollapsed && (
            <>
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex-1 min-w-0"
              >
                <Link
                  href="/admin/profile"
                  onClick={() => setSidebarOpen(false)}
                  className="block text-[12px] font-semibold text-white truncate leading-tight tracking-tight hover:text-[#FF5C3A] transition-colors"
                >
                  {adminUser?.name || 'Admin'}
                </Link>
                <p className="text-[10px] truncate leading-none text-zinc-600 font-medium tracking-tight mt-1">
                  {adminUser?.email || ''}
                </p>
              </motion.div>
              <button
                onClick={handleLogout}
                className="w-10 h-10 rounded-2xl transition-all flex items-center justify-center text-gray-700 hover:text-white hover:bg-white/10 group/logout shrink-0"
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
    <ConfirmProvider>
    <div className="min-h-screen" style={{ backgroundColor: 'var(--bg-base)' }}>
      {sidebarOpen && (
        <div className="fixed inset-0 z-30 bg-black/70 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      <div className={`hidden lg:flex lg:flex-col lg:fixed lg:inset-y-0 lg:left-0 z-20 transition-all duration-300 ${isCollapsed ? 'lg:w-[90px]' : 'lg:w-[280px]'}`}>
        {sidebarContent}
      </div>

      <div className={`fixed inset-y-0 left-0 w-[280px] z-40 transform transition-transform duration-300 ease-in-out lg:hidden ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        {sidebarContent}
      </div>

      <div className={`transition-all duration-300 ${isCollapsed ? 'lg:pl-[90px]' : 'lg:pl-[280px]'} flex flex-col min-h-screen`}>
        <header
          className="sticky top-0 z-10 flex items-center justify-between px-5 sm:px-7 h-[60px]"
          style={{
            backgroundColor: 'var(--bg-header)',
            borderBottom: '1px solid var(--border-color)',
          }}
        >
          <div className="flex items-center gap-3">
            <button
              className="lg:hidden p-2 -ml-1 text-gray-500 transition-all hover:text-white"
              onClick={() => setSidebarOpen(true)}
              aria-label="Abrir menú"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <PageTitle pathname={pathname} />
          </div>
          <div className="flex items-center gap-1.5">
            <AdminNotifications />
            <ThemeToggle />
          </div>
        </header>

        <main className="flex-1 p-5 sm:p-7">{children}</main>
      </div>

      <AdminBottomNav />
    </div>
    </ConfirmProvider>
  );
}

function PageTitle({ pathname }: { pathname: string }) {
  const map: Record<string, string> = {
    '/admin/dashboard':            'Mission Control',
    '/admin/brands':               'Marcas',
    '/admin/subscriptions':        'Suscripciones',
    '/admin/referrals':            'Programa de Referidos',
    '/admin/revenue':              'Ingresos',
    '/admin/payments':             'Historial de Pagos',
    '/admin/payment-settings':     'Medios de Pago',
    '/admin/pricing':              'Precios',
    '/admin/unit-economics':       'Economía Unitaria',
    '/admin/funnel':               'Funnel SaaS',
    '/admin/analytics':            'Analytics',
    '/admin/conversion':           'Conversión',
    '/admin/risk':                 'Riesgo y Retención',
    '/admin/health':               'Confiabilidad',
    '/admin/ia-costs':             'Costos e IA',
    '/admin/security':             'Seguridad',
    '/admin/mini-landings':        'Mini-Landings',
    '/admin/reviews':              'Moderación de Reviews',
    '/admin/blog':                 'Blog',
    '/admin/marketing/promotions': 'Promociones',
    '/admin/email-campaigns': 'Email Campaigns',
    '/admin/leads': 'Leads',
    '/admin/lead-searches': 'Lead Searches',
    '/admin/social-api-config': 'Social APIs',
    '/admin/notifications':        'Notificaciones',
    '/admin/woocommerce':          'WooCommerce',
    '/admin/audit-log':            'Auditoría',
    '/admin/playbooks':            'Playbooks Operativos',
    '/admin/configuracion':        'Configuración',
    '/admin/admins':               'Administradores',
    '/admin/enterprise':          'Enterprise Sync',
    '/admin/profile':              'Mi Perfil',
  };
  const title = Object.entries(map).find(([k]) => pathname === k || pathname.startsWith(k + '/'))?.[1] ?? 'Admin';
  return (
    <h1 className="font-jakarta font-bold text-[15px] leading-none" style={{ color: 'var(--text-primary)' }}>
      {title}
    </h1>
  );
}

function DashboardIcon({ className }: { className?: string }) {
  return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}><rect x="3" y="3" width="7" height="7" rx="1.5" /><rect x="14" y="3" width="7" height="7" rx="1.5" /><rect x="3" y="14" width="7" height="7" rx="1.5" /><rect x="14" y="14" width="7" height="7" rx="1.5" /></svg>;
}
function BrandsIcon({ className }: { className?: string }) {
  return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}><path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>;
}
function SubsIcon({ className }: { className?: string }) {
  return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}><path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg>;
}
function RevenueIcon({ className }: { className?: string }) {
  return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}><path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>;
}
function PaymentsIcon({ className }: { className?: string }) {
  return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>;
}
function PaySettingsIcon({ className }: { className?: string }) {
  return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}><path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>;
}
function TrialIcon({ className }: { className?: string }) {
  return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
}
function AdminsIcon({ className }: { className?: string }) {
  return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}><path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>;
}
function MiniLandingIcon({ className }: { className?: string }) {
  return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}><path strokeLinecap="round" strokeLinejoin="round" d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" /><polyline strokeLinecap="round" strokeLinejoin="round" points="9 22 9 12 15 12 15 22" /></svg>;
}
function BellIcon({ className }: { className?: string }) {
  return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}><path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>;
}
function PricingIcon({ className }: { className?: string }) {
  return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}><path strokeLinecap="round" strokeLinejoin="round" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" /></svg>;
}
function MegaphoneIcon({ className }: { className?: string }) {
  return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}><path strokeLinecap="round" strokeLinejoin="round" d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" /></svg>;
}
function AnalyticsIcon({ className }: { className?: string }) {
  return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}><path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>;
}
function ConversionIcon({ className }: { className?: string }) {
  return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}><path strokeLinecap="round" strokeLinejoin="round" d="M9 11l3 3L22 4M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" /></svg>;
}
function EnterpriseIcon({ className }: { className?: string }) {
  return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}><path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>;
}
function WooIcon({ className }: { className?: string }) {
  return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}><path strokeLinecap="round" strokeLinejoin="round" d="M6 5h12l-1 5H7L6 5z" /><path strokeLinecap="round" strokeLinejoin="round" d="M8 10v7a2 2 0 002 2h4a2 2 0 002-2v-7" /><circle cx="10" cy="19" r="1.5" /><circle cx="14" cy="19" r="1.5" /></svg>;
}
function BlogIcon({ className }: { className?: string }) {
  return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}><path strokeLinecap="round" strokeLinejoin="round" d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10l4 4v10a2 2 0 01-2 2z" /><path strokeLinecap="round" strokeLinejoin="round" d="M14 3v5h5" /><path strokeLinecap="round" strokeLinejoin="round" d="M16 13H8" /><path strokeLinecap="round" strokeLinejoin="round" d="M16 17H8" /><path strokeLinecap="round" strokeLinejoin="round" d="M10 9H8" /></svg>;
}
function ReviewsIcon({ className }: { className?: string }) {
  return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}><path strokeLinecap="round" strokeLinejoin="round" d="M7 8h10M7 12h7m-7 4h4m10-9a2 2 0 00-2-2H5a2 2 0 00-2 2v11l4-3h12a2 2 0 002-2V7z" /><path strokeLinecap="round" strokeLinejoin="round" d="M17 4l1 2 2 .5-1.5 1.5.3 2-1.8-.9-1.8.9.3-2L14 6.5l2-.5 1-2z" /></svg>;
}
function EmailCampaignIcon({ className }: { className?: string }) {
  return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}><path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>;
}
function UsersIcon({ className }: { className?: string }) {
  return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}><path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>;
}
function TargetIcon({ className }: { className?: string }) {
  return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}><path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" /></svg>;
}
function SettingsIcon({ className }: { className?: string }) {
  return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}><path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>;
}
