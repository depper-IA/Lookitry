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
      { href: '/admin/dashboard', label: 'Dashboard', icon: DashboardIcon },
      { href: '/admin/brands',    label: 'Marcas',    icon: BrandsIcon },
      { href: '/admin/subscriptions', label: 'Suscripciones', icon: SubsIcon },
    ],
  },
  {
    label: 'Finanzas',
    items: [
      { href: '/admin/revenue',          label: 'Ingresos',          icon: RevenueIcon },
      { href: '/admin/payments',         label: 'Historial de Pagos', icon: PaymentsIcon },
      { href: '/admin/payment-settings', label: 'Medios de Pago',    icon: PaySettingsIcon },
    ],
  },
  {
    label: 'Contenido',
    items: [
      { href: '/admin/mini-landings', label: 'Mini-Landings', icon: MiniLandingIcon },
    ],
  },
  {
    label: 'Sistema',
    items: [
      { href: '/admin/notifications',  label: 'Notificaciones',  icon: BellIcon },
      { href: '/admin/feedback',       label: 'Feedback IA',     icon: FeedbackIcon },
      { href: '/admin/configuracion', label: 'Configuración',   icon: TrialIcon },
      { href: '/admin/admins',         label: 'Administradores', icon: AdminsIcon },
    ],
  },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [adminUser, setAdminUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [feedbackCount, setFeedbackCount] = useState(0);

  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    const user = localStorage.getItem('adminUser');
    if (!token && pathname !== '/admin/login') {
      router.push('/admin/login');
      return;
    }
    if (user) setAdminUser(JSON.parse(user));
    setLoading(false);

    // Cargar conteo de feedbacks sin resolver
    if (token) {
      const apiBase = process.env.NEXT_PUBLIC_API_URL || 'https://api.pruebalo.wilkiedevs.com';
      fetch(`${apiBase}/api/admin/feedback/count-unresolved`, {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then(r => r.ok ? r.json() : null)
        .then(d => { if (d?.count) setFeedbackCount(d.count); })
        .catch(() => {});
    }
  }, [pathname, router]);

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminUser');
    router.push('/admin/login');
  };

  if (pathname === '/admin/login') return <>{children}</>;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--bg-base)' }}>
        <div className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: '#FF5C3A', borderTopColor: 'transparent' }} />
      </div>
    );
  }

  const sidebarContent = (
    <div className="flex flex-col h-full" style={{ backgroundColor: 'var(--bg-sidebar)' }}>
      {/* Logo */}
      <div className="flex items-center justify-between h-14 px-5 border-b" style={{ borderColor: '#1f1f1f' }}>
        <Link href="/admin/dashboard" className="flex items-center gap-2">
          <Image src="/logo.svg" alt="Lookitry" width={28} height={28} className="object-contain h-7 w-auto" priority />
          <span style={{ fontFamily: 'Syne, sans-serif' }} className="hidden sm:inline font-extrabold text-base leading-none text-white tracking-tight">
            Look<span style={{ color: '#FF5C3A' }}>itry</span>
          </span>
          <span className="hidden sm:inline font-syne font-semibold text-xs" style={{ color: '#FF5C3A' }}>Admin</span>
        </Link>
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
      <nav className="flex-1 px-3 py-4 space-y-4 overflow-y-auto">
        {adminNav.map((group, gi) => (
          <div key={gi}>
            {group.label && (
              <p className="px-3 mb-1 text-[10px] font-semibold uppercase tracking-widest" style={{ color: '#4a4a4a' }}>
                {group.label}
              </p>
            )}
            <div className="space-y-0.5">
              {group.items.map(item => {
                const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
                const isFeedback = item.href === '/admin/feedback';
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setSidebarOpen(false)}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors"
                    style={{
                      backgroundColor: isActive ? '#FF5C3A' : 'transparent',
                      color: isActive ? '#ffffff' : 'var(--text-sidebar)',
                    }}
                    onMouseEnter={e => { if (!isActive) (e.currentTarget as HTMLElement).style.backgroundColor = 'var(--bg-sidebar-hover)'; }}
                    onMouseLeave={e => { if (!isActive) (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent'; }}
                  >
                    <item.icon className="w-4 h-4 flex-shrink-0" />
                    <span className="flex-1">{item.label}</span>
                    {isFeedback && feedbackCount > 0 && (
                      <span
                        className="text-[10px] font-bold px-1.5 py-0.5 rounded-full text-white flex-shrink-0"
                        style={{ backgroundColor: isActive ? 'rgba(255,255,255,0.3)' : '#ef4444' }}
                      >
                        {feedbackCount > 99 ? '99+' : feedbackCount}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* User */}
      <div className="p-4 border-t" style={{ borderColor: '#1f1f1f' }}>
        <div className="flex items-center gap-3">
          <Link
            href="/admin/profile"
            onClick={() => setSidebarOpen(false)}
            className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0 transition-opacity hover:opacity-80"
            style={{ backgroundColor: '#FF5C3A' }}
            title="Mi perfil"
          >
            {adminUser?.name?.charAt(0)?.toUpperCase() ?? 'A'}
          </Link>
          <div className="flex-1 min-w-0">
            <Link
              href="/admin/profile"
              onClick={() => setSidebarOpen(false)}
              className="block text-sm font-medium text-white truncate hover:opacity-80 transition-opacity"
            >
              {adminUser?.name || 'Admin'}
            </Link>
            <p className="text-xs truncate" style={{ color: 'var(--text-sidebar)' }}>{adminUser?.email || ''}</p>
          </div>
          <button
            onClick={handleLogout}
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
        <div className="fixed inset-0 z-30 bg-black/60 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar desktop */}
      <div className="hidden lg:flex lg:flex-col lg:fixed lg:inset-y-0 lg:left-0 lg:w-60 lg:z-20">
        {sidebarContent}
      </div>

      {/* Sidebar móvil */}
      <div className={`fixed inset-y-0 left-0 w-64 z-40 transform transition-transform duration-200 ease-in-out lg:hidden ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        {sidebarContent}
      </div>

      {/* Main */}
      <div className="lg:pl-60 flex flex-col min-h-screen">
        <header
          className="sticky top-0 z-10 flex items-center justify-between px-4 sm:px-6 h-14 border-b"
          style={{ backgroundColor: 'var(--bg-header)', borderColor: 'var(--border-color)', boxShadow: 'var(--shadow-header)' }}
        >
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
          <h2 className="hidden lg:block font-syne font-semibold text-base" style={{ color: 'var(--text-primary)' }}>
            Panel de Administración
          </h2>
          <div className="flex items-center gap-2 ml-auto">
            <AdminNotifications />
            <ThemeToggle />
          </div>
        </header>
        <main className="flex-1 p-4 sm:p-6">{children}</main>
      </div>
    </div>
  );
}

/* ── Iconos ─────────────────────────────────────────────────────────────────── */
function DashboardIcon({ className }: { className?: string }) {
  return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}><path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>;
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
function HealthIcon({ className }: { className?: string }) {
  return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}><path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>;
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
function FeedbackIcon({ className }: { className?: string }) {
  return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" /></svg>;
}
