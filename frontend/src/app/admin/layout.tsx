'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { AdminNotifications } from '@/components/admin/AdminNotifications';
import { ThemeToggle } from '@/components/ui/ThemeToggle';

const adminNav = [
  {
    label: null,
    items: [
      { href: '/admin/dashboard',     label: 'Dashboard',     icon: DashboardIcon },
      { href: '/admin/brands',        label: 'Marcas',        icon: BrandsIcon },
      { href: '/admin/subscriptions', label: 'Suscripciones', icon: SubsIcon },
    ],
  },
  {
    label: 'Finanzas',
    items: [
      { href: '/admin/revenue',          label: 'Ingresos',           icon: RevenueIcon },
      { href: '/admin/payments',         label: 'Historial de Pagos', icon: PaymentsIcon },
      { href: '/admin/payment-settings', label: 'Medios de Pago',     icon: PaySettingsIcon },
      { href: '/admin/pricing',          label: 'Precios',            icon: PricingIcon },
    ],
  },
  {
    label: 'Analítica',
    items: [
      { href: '/admin/analytics',  label: 'Analytics',  icon: AnalyticsIcon },
      { href: '/admin/conversion', label: 'Conversión', icon: ConversionIcon },
    ],
  },
  {
    label: 'Contenido',
    items: [
      { href: '/admin/mini-landings', label: 'Mini-Landings', icon: MiniLandingIcon },
    ],
  },
  {
    label: 'Marketing',
    items: [
      { href: '/admin/marketing/promotions', label: 'Promociones', icon: MegaphoneIcon },
    ],
  },
  {
    label: 'Sistema',
    items: [
      { href: '/admin/notifications', label: 'Notificaciones',  icon: BellIcon },
      { href: '/admin/configuracion', label: 'Configuración',   icon: TrialIcon },
      { href: '/admin/admins',        label: 'Administradores', icon: AdminsIcon },
    ],
  },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router   = useRouter();
  const pathname = usePathname();
  const [adminUser, setAdminUser]         = useState<any>(null);
  const [loading, setLoading]             = useState(true);
  const [sidebarOpen, setSidebarOpen]     = useState(false);
  const [feedbackCount, setFeedbackCount] = useState(0);
  const [notifCount, setNotifCount]       = useState(0);

  useEffect(() => {
    const user = localStorage.getItem('adminUser');

    if (!user && pathname !== '/admin/login') {
      router.push('/admin/login');
      return;
    }

    if (pathname !== '/admin/login') {
      const apiBase = process.env.NEXT_PUBLIC_API_URL || 'https://api.pruebalo.wilkiedevs.com';

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
            if (user) setAdminUser(JSON.parse(user));
            setLoading(false);
            return;
          }
          if (user) setAdminUser(JSON.parse(user));
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
          if (user) setAdminUser(JSON.parse(user));
          setLoading(false);
        });
    } else {
      if (user) setAdminUser(JSON.parse(user));
      setLoading(false);
    }
  }, [pathname, router]);

  const handleLogout = async () => {
    try {
      const apiBase = process.env.NEXT_PUBLIC_API_URL || 'https://api.pruebalo.wilkiedevs.com';
      await fetch(`${apiBase}/api/admin/auth/logout`, { method: 'POST', credentials: 'include' });
    } catch (e) { console.error('Error logging out:', e); }
    localStorage.removeItem('adminUser');
    router.push('/admin/login');
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
          <p className="text-xs font-medium tracking-widest uppercase" style={{ color: '#555' }}>Cargando</p>
        </div>
      </div>
    );
  }

  const sidebarContent = (
    <div className="flex flex-col h-full" style={{ backgroundColor: '#0a0a0a', borderRight: '1px solid #1a1a1a' }}>
      {/* Logo */}
      <div className="flex items-center justify-between px-5 h-[60px] flex-shrink-0" style={{ borderBottom: '1px solid #1a1a1a' }}>
        <Link href="/admin/dashboard" className="flex items-center gap-2.5">
          <Image src="/logo.svg" alt="Lookitry" width={26} height={26} className="object-contain flex-shrink-0" priority />
          <div className="flex items-baseline gap-1.5">
            <span className="font-jakarta font-extrabold text-[15px] leading-none text-white tracking-tight">
              Look<span style={{ color: '#FF5C3A' }}>itry</span>
            </span>
            <span
              className="text-[9px] font-semibold uppercase tracking-widest px-1.5 py-0.5 rounded"
              style={{ backgroundColor: 'rgba(255,92,58,0.1)', color: '#FF5C3A', border: '1px solid rgba(255,92,58,0.2)' }}
            >
              Admin
            </span>
          </div>
        </Link>
        <button
          className="lg:hidden p-1.5 rounded-lg transition-colors cursor-pointer"
          style={{ color: '#555' }}
          onClick={() => setSidebarOpen(false)}
          aria-label="Cerrar menú"
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = '#fff'; }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = '#555'; }}
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-5 overflow-y-auto">
        {adminNav.map((group, gi) => (
          <div key={gi}>
            {group.label && (
              <p className="px-3 mb-1.5 text-[9px] font-bold uppercase tracking-[0.15em]" style={{ color: '#3a3a3a' }}>
                {group.label}
              </p>
            )}
            <div className="space-y-0.5">
              {group.items.map(item => {
                const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
                const isNotifications = item.href === '/admin/notifications';
                const badge = isNotifications ? (feedbackCount + notifCount) : 0;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setSidebarOpen(false)}
                    className="flex items-center gap-3 px-3 py-2 rounded-lg text-[13px] font-medium transition-all duration-150 cursor-pointer"
                    style={{
                      backgroundColor: isActive ? '#FF5C3A' : 'transparent',
                      color: isActive ? '#ffffff' : '#666',
                    }}
                    onMouseEnter={e => {
                      if (!isActive) {
                        (e.currentTarget as HTMLElement).style.backgroundColor = '#161616';
                        (e.currentTarget as HTMLElement).style.color = '#ccc';
                      }
                    }}
                    onMouseLeave={e => {
                      if (!isActive) {
                        (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent';
                        (e.currentTarget as HTMLElement).style.color = '#666';
                      }
                    }}
                  >
                    <item.icon className="w-[15px] h-[15px] flex-shrink-0" />
                    <span className="flex-1 leading-none">{item.label}</span>
                    {badge > 0 && (
                      <span
                        className="text-[9px] font-bold px-1.5 py-0.5 rounded-full text-white flex-shrink-0 leading-none"
                        style={{ backgroundColor: isActive ? 'rgba(255,255,255,0.25)' : '#ef4444' }}
                      >
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
      <div className="px-3 py-3 flex-shrink-0" style={{ borderTop: '1px solid #1a1a1a' }}>
        <div className="flex items-center gap-2.5 px-2 py-2 rounded-lg" style={{ backgroundColor: '#111' }}>
          <Link
            href="/admin/profile"
            onClick={() => setSidebarOpen(false)}
            className="w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold text-white flex-shrink-0 cursor-pointer transition-opacity hover:opacity-80"
            style={{ backgroundColor: '#FF5C3A' }}
            title="Mi perfil"
          >
            {adminUser?.name?.charAt(0)?.toUpperCase() ?? 'A'}
          </Link>
          <div className="flex-1 min-w-0">
            <Link
              href="/admin/profile"
              onClick={() => setSidebarOpen(false)}
              className="block text-[12px] font-semibold text-white truncate hover:opacity-80 transition-opacity cursor-pointer leading-tight"
            >
              {adminUser?.name || 'Admin'}
            </Link>
            <p className="text-[10px] truncate leading-tight mt-0.5" style={{ color: '#444' }}>
              {adminUser?.email || ''}
            </p>
          </div>
          <button
            onClick={handleLogout}
            className="p-1.5 rounded-md transition-colors flex-shrink-0 cursor-pointer"
            style={{ color: '#444' }}
            title="Cerrar sesión"
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = '#ef4444'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = '#444'; }}
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--bg-base)' }}>
      {sidebarOpen && (
        <div className="fixed inset-0 z-30 bg-black/70 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      <div className="hidden lg:flex lg:flex-col lg:fixed lg:inset-y-0 lg:left-0 lg:w-[220px] lg:z-20">
        {sidebarContent}
      </div>

      <div className={`fixed inset-y-0 left-0 w-[220px] z-40 transform transition-transform duration-200 ease-in-out lg:hidden ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        {sidebarContent}
      </div>

      <div className="lg:pl-[220px] flex flex-col min-h-screen">
        <header
          className="sticky top-0 z-10 flex items-center justify-between px-5 sm:px-7 h-[60px]"
          style={{
            backgroundColor: 'var(--bg-header)',
            borderBottom: '1px solid var(--border-color)',
          }}
        >
          <div className="flex items-center gap-3">
            <button
              className="lg:hidden p-2 rounded-lg -ml-1 cursor-pointer transition-colors"
              style={{ color: 'var(--text-secondary)' }}
              onClick={() => setSidebarOpen(true)}
              aria-label="Abrir menú"
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = 'var(--text-primary)'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = 'var(--text-secondary)'; }}
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
    </div>
  );
}

function PageTitle({ pathname }: { pathname: string }) {
  const map: Record<string, string> = {
    '/admin/dashboard':            'Dashboard',
    '/admin/brands':               'Marcas',
    '/admin/subscriptions':        'Suscripciones',
    '/admin/revenue':              'Ingresos',
    '/admin/payments':             'Historial de Pagos',
    '/admin/payment-settings':     'Medios de Pago',
    '/admin/pricing':              'Precios',
    '/admin/analytics':            'Analytics',
    '/admin/conversion':           'Conversión',
    '/admin/mini-landings':        'Mini-Landings',
    '/admin/marketing/promotions': 'Promociones',
    '/admin/notifications':        'Notificaciones',
    '/admin/configuracion':        'Configuración',
    '/admin/admins':               'Administradores',
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
