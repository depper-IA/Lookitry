'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { AdminNotifications } from '@/components/admin/AdminNotifications';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { ConfirmProvider } from '@/components/admin/ConfirmDialog';
import { AdminBottomNav } from '@/components/ui/AdminBottomNav';
import { adminApi } from '@/services/adminApi';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, LogOut, Shield, BookOpen, Gift, DollarSign, Zap, Brain, Settings } from 'lucide-react';

// ── Icon Components ──────────────────────────────────────────────────────────

function BotIcon({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return <svg className={className} style={style} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}><path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" /></svg>;
}
function DashboardIcon({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return <svg className={className} style={style} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}><rect x="3" y="3" width="7" height="7" rx="1.5" /><rect x="14" y="3" width="7" height="7" rx="1.5" /><rect x="3" y="14" width="7" height="7" rx="1.5" /><rect x="14" y="14" width="7" height="7" rx="1.5" /></svg>;
}
function BrandsIcon({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return <svg className={className} style={style} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}><path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>;
}
function SubsIcon({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return <svg className={className} style={style} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}><path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg>;
}
function RevenueIcon({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return <svg className={className} style={style} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}><path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>;
}
function PaymentsIcon({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return <svg className={className} style={style} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>;
}
function AdminsIcon({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return <svg className={className} style={style} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}><path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>;
}
function BellIcon({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return <svg className={className} style={style} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}><path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>;
}
function PricingIcon({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return <svg className={className} style={style} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}><path strokeLinecap="round" strokeLinejoin="round" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" /></svg>;
}
function MegaphoneIcon({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return <svg className={className} style={style} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}><path strokeLinecap="round" strokeLinejoin="round" d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" /></svg>;
}
function AnalyticsIcon({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return <svg className={className} style={style} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}><path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>;
}
function ConversionIcon({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return <svg className={className} style={style} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}><path strokeLinecap="round" strokeLinejoin="round" d="M9 11l3 3L22 4M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" /></svg>;
}
function EnterpriseIcon({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return <svg className={className} style={style} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}><path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>;
}
function UsersIcon({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return <svg className={className} style={style} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}><path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>;
}
function TargetIcon({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return <svg className={className} style={style} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}><path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" /></svg>;
}
function MailIcon({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return <svg className={className} style={style} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}><path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>;
}
function GlobeIcon({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return <svg className={className} style={style} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}><path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0 3-4.03 3-9s1.343-9 3-9m-9 9a9 9 0 019-9" /></svg>;
}
function ShoppingIcon({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return <svg className={className} style={style} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}><path strokeLinecap="round" strokeLinejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" /></svg>;
}
function FileIcon({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return <svg className={className} style={style} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>;
}
function ImageIcon({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return <svg className={className} style={style} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}><path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>;
}
function TicketIcon({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return <svg className={className} style={style} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}><path strokeLinecap="round" strokeLinejoin="round" d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" /></svg>;
}
function StarIcon({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return <svg className={className} style={style} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}><path strokeLinecap="round" strokeLinejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" /></svg>;
}
function PlaybookIcon({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return <svg className={className} style={style} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}><path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>;
}
function RiskIcon({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return <svg className={className} style={style} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>;
}
function FunnelIcon({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return <svg className={className} style={style} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}><path strokeLinecap="round" strokeLinejoin="round" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" /></svg>;
}
function SettingsIcon({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return <svg className={className} style={style} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}><path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>;
}

// ── Navigation Structure ─────────────────────────────────────────────────────

const adminNav = [
  {
    label: 'COMANDO',
    items: [
      { href: '/admin/dashboard', label: 'Mission Control', icon: DashboardIcon },
      { href: '/admin/funnel', label: 'Funnel', icon: FunnelIcon },
    ],
  },
  {
    label: 'CLIENTES',
    items: [
      { href: '/admin/brands', label: 'Marcas', icon: BrandsIcon },
      { href: '/admin/subscriptions', label: 'Suscripciones', icon: SubsIcon },
      { href: '/admin/payments', label: 'Pagos', icon: PaymentsIcon },
    ],
  },
  {
    label: 'CRM',
    items: [
      { href: '/admin/leads', label: 'Leads', icon: UsersIcon },
      { href: '/admin/lead-searches', label: 'Lead Searches', icon: GlobeIcon },
    ],
  },
  {
    label: 'MARKETING',
    items: [
      { href: '/admin/email-campaigns', label: 'Email Campaigns', icon: MailIcon },
      { href: '/admin/marketing/promotions', label: 'Promociones', icon: MegaphoneIcon },
      { href: '/admin/trial-campaigns', label: 'Trial', icon: TargetIcon },
    ],
  },
  {
    label: 'CONTENIDO',
    items: [
      { href: '/admin/reviews', label: 'Reviews', icon: StarIcon },
      { href: '/admin/blog', label: 'Blog', icon: BookOpen },
      { href: '/admin/feedback', label: 'Feedback', icon: BellIcon },
    ],
  },
  {
    label: 'ANALYTICS',
    items: [
      { href: '/admin/analytics', label: 'Estadisticas', icon: AnalyticsIcon },
      { href: '/admin/revenue', label: 'Revenue', icon: RevenueIcon },
      { href: '/admin/conversion', label: 'Conversión', icon: ConversionIcon },
      { href: '/admin/risk', label: 'Riesgo', icon: RiskIcon },
    ],
  },
  {
    label: 'CONFIGURACION',
    items: [
      { href: '/admin/payment-settings', label: 'Pagos', icon: PaymentsIcon },
      { href: '/admin/pricing', label: 'Precios', icon: PricingIcon },
      { href: '/admin/widget-ip-whitelist', label: 'Widget IPs', icon: Shield },
      { href: '/admin/social-api-config', label: 'Social APIs', icon: GlobeIcon },
      { href: '/admin/enterprise', label: 'Enterprise', icon: EnterpriseIcon },
    ],
  },
  {
    label: 'SISTEMA',
    items: [
      { href: '/admin/health', label: 'Health', icon: BotIcon },
      { href: '/admin/ia-costs', label: 'IA Costs', icon: Brain },
      { href: '/admin/security', label: 'Seguridad', icon: Shield },
      { href: '/admin/audit-log', label: 'Auditoría', icon: FileIcon },
    ],
  },
  {
    label: 'OPERATIVO',
    items: [
      { href: '/admin/playbooks', label: 'Playbooks', icon: PlaybookIcon },
      { href: '/admin/referrals', label: 'Referidos', icon: Gift },
      { href: '/admin/mini-landings', label: 'Mini-Landings', icon: GlobeIcon },
      { href: '/admin/woocommerce', label: 'WooCommerce', icon: ShoppingIcon },
      { href: '/admin/generations', label: 'Generaciones', icon: ImageIcon },
    ],
  },
  {
    label: 'EQUIPO',
    items: [
      { href: '/admin/admins', label: 'Admins', icon: AdminsIcon },
      { href: '/admin/tickets', label: 'Tickets', icon: TicketIcon },
    ],
  },
];

// ── Page Title Map ────────────────────────────────────────────────────────────

const pageTitleMap: Record<string, string> = {
  '/admin/dashboard': 'Mission Control',
  '/admin/brands': 'Marcas',
  '/admin/subscriptions': 'Suscripciones',
  '/admin/referrals': 'Programa de Referidos',
  '/admin/revenue': 'Ingresos',
  '/admin/payments': 'Historial de Pagos',
  '/admin/payment-settings': 'Medios de Pago',
  '/admin/pricing': 'Precios',
  '/admin/unit-economics': 'Economía Unitaria',
  '/admin/funnel': 'Funnel SaaS',
  '/admin/analytics': 'Analytics',
  '/admin/conversion': 'Conversión',
  '/admin/risk': 'Riesgo y Retención',
  '/admin/health': 'Salud del Sistema',
  '/admin/ia-costs': 'Costos e IA',
  '/admin/security': 'Seguridad',
  '/admin/mini-landings': 'Mini-Landings',
  '/admin/reviews': 'Moderación de Reviews',
  '/admin/blog': 'Blog',
  '/admin/marketing/promotions': 'Promociones',
  '/admin/email-campaigns': 'Email Campaigns',
  '/admin/leads': 'Leads',
  '/admin/lead-searches': 'Lead Searches',
  '/admin/social-api-config': 'Social APIs',
  '/admin/notifications': 'Notificaciones',
  '/admin/woocommerce': 'WooCommerce',
  '/admin/audit-log': 'Auditoría',
  '/admin/playbooks': 'Playbooks Operativos',
  '/admin/admins': 'Administradores',
  '/admin/enterprise': 'Enterprise Sync',
  '/admin/profile': 'Mi Perfil',
  '/admin/feedback': 'Feedback',
  '/admin/generations': 'Generaciones',
  '/admin/tickets': 'Tickets',
  '/admin/config/trial': 'Trial Campaigns',
  '/admin/config/contact': 'Contacto y Precios',
  '/admin/config/launch': 'Launch',
  '/admin/config/health': 'Salud del Sistema',
  '/admin/widget-ip-whitelist': 'Widget IP Whitelist',
};

// ── Main Layout ───────────────────────────────────────────────────────────────

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [adminUser, setAdminUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [feedbackCount, setFeedbackCount] = useState(0);
  const [notifCount, setNotifCount] = useState(0);

  useEffect(() => {
    // Solo verificar localStorage - NO llamar a /admin/verify aquí para evitar refresh loop
    const userStr = localStorage.getItem('adminUser');
    let userParsed = null;

    if (userStr) {
      try {
        userParsed = JSON.parse(userStr);
      } catch (e) {
        localStorage.removeItem('adminUser');
      }
    }

    if (!userParsed && pathname !== '/admin/login') {
      router.push('/admin/login');
      return;
    }

    if (userParsed) {
      setAdminUser(userParsed);
    }

    setLoading(false);
  }, [pathname, router]);

  const handleLogout = async () => {
    try {
      await adminApi.post('/admin/auth/logout');
    } catch (e) { console.error('Error logging out:', e); }
    localStorage.removeItem('adminUser');
    router.push('/');
  };

  if (pathname === '/admin/login') return <>{children}</>;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--bg-base)' }}>
        <div className="flex flex-col items-center gap-4">
          <div
            className="w-9 h-9 rounded-full border-2 animate-spin"
            style={{ borderColor: 'var(--accent)', borderTopColor: 'transparent' }}
          />
          <p className="text-xs font-medium tracking-[0.12em]" style={{ color: 'var(--text-muted)' }}>Cargando</p>
        </div>
      </div>
    );
  }

  const sidebarContent = (
    <div className="flex flex-col h-full transition-all duration-300" style={{ backgroundColor: 'var(--bg-sidebar)' }}>
      {/* Logo Area */}
      <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'justify-between'} px-6 h-[80px] flex-shrink-0`}>
        <Link href="/admin/dashboard" className="flex items-center gap-3 group">
          <div className="relative h-11 w-11 shrink-0">
            <Image src="/Lookitry-logo-dark.svg" alt="Lookitry" fill className="object-contain dark:hidden" priority />
            <Image src="/logo.svg" alt="Lookitry" fill className="hidden object-contain dark:block" priority />
          </div>
          {!isCollapsed && (
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-baseline gap-1.5"
            >
              <span className="font-jakarta font-extrabold text-lg leading-none tracking-tight" style={{ color: 'var(--text-primary)' }}>
                Look<span style={{ color: 'var(--accent)' }}>itry</span>
              </span>
              <span className="text-[9px] font-black uppercase tracking-[0.18em] px-2 py-0.5 rounded" style={{ backgroundColor: 'color-mix(in srgb, var(--accent) 10%, transparent)', color: 'var(--accent)', border: '1px solid color-mix(in srgb, var(--accent) 20%, transparent)' }}>
                Admin
              </span>
            </motion.div>
          )}
        </Link>

        {!isCollapsed && (
          <button
            onClick={() => setIsCollapsed(true)}
            className="hidden lg:flex p-1.5 rounded-lg transition-all"
            style={{ color: 'var(--text-muted)' }}
            title="Colapsar menú"
          >
            <ChevronLeft size={18} />
          </button>
        )}

        <button
          className="lg:hidden p-2 rounded-xl transition-all"
          style={{ color: 'var(--text-secondary)' }}
          onClick={() => setSidebarOpen(false)}
          aria-label="Cerrar menú"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Nav */}
      <nav className={`flex-1 ${isCollapsed ? 'px-3' : 'px-4'} py-6 space-y-6 overflow-y-auto no-scrollbar`}>
        {adminNav.map((group, gi) => (
          <div key={gi} className="space-y-1.5">
            {!isCollapsed && group.label && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="px-4 text-[9px] font-black uppercase tracking-[0.25em] pb-1.5"
                style={{ color: 'var(--text-muted)' }}
              >
                {group.label}
              </motion.p>
            )}
            <div className="space-y-1">
              {group.items.map(item => {
                const isActive = pathname === item.href ||
                  (item.href !== '/admin' && pathname.startsWith(item.href + '/') && pathname.split('/')[3] === undefined);
                const isNotifications = item.href === '/admin/notifications';
                const badge = isNotifications ? (feedbackCount + notifCount) : 0;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setSidebarOpen(false)}
                    title={isCollapsed ? item.label : ''}
                    className={`flex items-center ${isCollapsed ? 'justify-center py-3.5' : 'gap-3 px-4 py-3'} rounded-xl text-[12px] font-semibold tracking-[0.01em] transition-all duration-200 group
                      ${isActive
                        ? 'text-white shadow-lg'
                        : 'hover:text-white'
                      }`}
                    style={isActive
                      ? { backgroundColor: 'var(--accent)', boxShadow: '0 4px 20px color-mix(in srgb, var(--accent) 30%, transparent)' }
                      : { color: 'var(--text-sidebar)' }
                    }
                  >
                    <item.icon className={`w-5 h-5 flex-shrink-0 transition-transform duration-200 ${isActive ? 'text-white' : ''}`}
                      style={isActive ? {} : { color: 'var(--text-sidebar)' }}
                    />
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
                      <span
                        className="text-[9px] font-black px-1.5 py-0.5 rounded-full flex-shrink-0 leading-none"
                        style={isActive
                          ? { backgroundColor: 'rgba(255,255,255,0.2)', color: 'white' }
                          : { backgroundColor: '#ef4444', color: 'white' }
                        }
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
      <div className={`p-4 flex-shrink-0 transition-all duration-300`}>
        <div
          className={`flex items-center ${isCollapsed ? 'justify-center' : 'gap-3 p-3'} rounded-2xl transition-all duration-300`}
          style={{ backgroundColor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' }}
        >
          <Link
            href="/admin/profile"
            onClick={() => setSidebarOpen(false)}
            className="w-11 h-11 rounded-2xl overflow-hidden flex items-center justify-center text-[13px] font-black text-white flex-shrink-0 transition-transform duration-500"
            style={{ backgroundColor: 'var(--accent)' }}
            title="Mi perfil"
          >
            {adminUser?.name?.charAt(0)?.toUpperCase() ?? 'A'}
          </Link>
          {!isCollapsed && (
            <>
              <div className="flex-1 min-w-0">
                <Link
                  href="/admin/profile"
                  onClick={() => setSidebarOpen(false)}
                  className="block text-[12px] font-semibold truncate leading-tight tracking-tight hover:text-[var(--accent)] transition-colors"
                  style={{ color: 'var(--text-primary)' }}
                >
                  {adminUser?.name || 'Admin'}
                </Link>
                <p className="text-[10px] truncate leading-none mt-0.5" style={{ color: 'var(--text-muted)' }}>
                  {adminUser?.email || ''}
                </p>
              </div>
              <button
                onClick={handleLogout}
                className="w-10 h-10 rounded-2xl transition-all flex items-center justify-center hover:bg-white/10 shrink-0"
                style={{ color: 'var(--text-secondary)' }}
                title="Cerrar sesión"
              >
                <LogOut size={18} />
              </button>
            </>
          )}
        </div>

        {isCollapsed && (
          <button
            onClick={() => setIsCollapsed(false)}
            className="w-11 h-11 mt-3 rounded-2xl flex items-center justify-center transition-all mx-auto"
            style={{ backgroundColor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)', color: 'var(--text-muted)' }}
            title="Expandir menú"
          >
            <ChevronRight size={20} />
          </button>
        )}
      </div>
    </div>
  );

  const getPageTitle = () => {
    const title = Object.entries(pageTitleMap).find(([k]) =>
      pathname === k || pathname.startsWith(k + '/')
    )?.[1];
    return title || 'Admin';
  };

  return (
    <ConfirmProvider>
      <div className="min-h-screen" style={{ backgroundColor: 'var(--bg-base)' }}>
        {sidebarOpen && (
          <div
            className="fixed inset-0 z-30 lg:hidden"
            style={{ backgroundColor: 'rgba(0,0,0,0.7)' }}
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Desktop Sidebar */}
        <div
          className={`hidden lg:flex lg:flex-col lg:fixed lg:inset-y-0 lg:left-0 z-20 transition-all duration-300 ${isCollapsed ? 'lg:w-[80px]' : 'lg:w-[260px]'}`}
          style={{ backgroundColor: 'var(--bg-sidebar)' }}
        >
          {sidebarContent}
        </div>

        {/* Mobile Sidebar */}
        <div
          className={`fixed inset-y-0 left-0 z-40 w-[280px] transform transition-transform duration-300 ease-in-out lg:hidden ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}
          style={{ backgroundColor: 'var(--bg-sidebar)' }}
        >
          {sidebarContent}
        </div>

        {/* Main Content */}
        <div className={`transition-all duration-300 ${isCollapsed ? 'lg:pl-[80px]' : 'lg:pl-[260px]'} flex flex-col min-h-screen`}>
          <header
            className="sticky top-0 z-10 flex items-center justify-between px-5 sm:px-7 h-[60px]"
            style={{
              backgroundColor: 'var(--bg-header)',
              borderBottom: '1px solid var(--border-color)',
            }}
          >
            <div className="flex items-center gap-3">
              <button
                className="lg:hidden p-2 -ml-1 transition-all hover:text-white"
                style={{ color: 'var(--text-secondary)' }}
                onClick={() => setSidebarOpen(true)}
                aria-label="Abrir menú"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
              <h1 className="font-jakarta font-bold text-[15px] leading-none" style={{ color: 'var(--text-primary)' }}>
                {getPageTitle()}
              </h1>
            </div>
            <div className="flex items-center gap-1.5">
              <AdminNotifications />
              <ThemeToggle />
            </div>
          </header>

          <main className="flex-1 p-5 sm:p-7 pb-24 sm:pb-24">{children}</main>
        </div>

        <AdminBottomNav />
      </div>
    </ConfirmProvider>
  );
}
