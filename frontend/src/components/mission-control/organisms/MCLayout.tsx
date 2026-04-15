// Lookitry Mission Control - Layout Shell
// v1.0 | Abril 2026

'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  Grid,
  Cpu,
  Zap,
  TrendingUp,
  Shield,
  Megaphone,
  Activity,
  Bot,
  Server,
  Bell,
  ChevronRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { LiveClock, StatusDot } from '../atoms';
import { NAV_ITEMS } from '@/lib/mission-control/constants';

// ============================================================================
// MCHeader - Header global completo
// ============================================================================

interface MCHeaderProps {
  globalStatus?: 'healthy' | 'warning' | 'critical';
  notificationCount?: number;
}

export function MCHeader({ globalStatus = 'healthy', notificationCount = 0 }: MCHeaderProps) {
  const statusLabels = {
    healthy: { text: 'HEALTHY', color: 'text-[#00E5A0]' },
    warning: { text: 'WARNING', color: 'text-[#FFB547]' },
    critical: { text: 'CRITICAL', color: 'text-[#FF3A5C]' },
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 flex h-16 items-center justify-between border-b border-[#1e1e1e] bg-[#0a0a0a]/85 px-6 backdrop-blur-xl">
      {/* Logo + Title */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#FF5C3A]">
            <span className="font-mono text-sm font-bold text-white">L</span>
          </div>
          <div>
            <span className="font-display text-sm font-bold tracking-wider text-[#F0F0F0]">
              LOOKITRY
            </span>
            <span className="ml-2 font-mono text-xs uppercase tracking-widest text-[#555555]">
              MISSION CONTROL
            </span>
          </div>
        </div>

        {/* Status Pill */}
        <button className="ml-4 flex items-center gap-2 rounded-full border border-[#1e1e1e] bg-[#111111] px-3 py-1.5 transition-all hover:border-[#2a2a2a]">
          <StatusDot status={globalStatus === 'healthy' ? 'up' : globalStatus === 'warning' ? 'degraded' : 'down'} size="sm" />
          <span className={cn('text-xs font-medium uppercase tracking-wider', statusLabels[globalStatus].color)}>
            {statusLabels[globalStatus].text}
          </span>
        </button>
      </div>

      {/* Right side: Clock + Notifications */}
      <div className="flex items-center gap-6">
        <LiveClock />
        
        <button className="relative flex items-center justify-center rounded-lg p-2 text-[#888888] transition-colors hover:bg-[#1a1a1a] hover:text-[#F0F0F0]">
          <Bell className="h-5 w-5" />
          {notificationCount > 0 && (
            <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-[#FF5C3A] text-[10px] font-bold text-white">
              {notificationCount > 9 ? '9+' : notificationCount}
            </span>
          )}
        </button>
      </div>
    </header>
  );
}

// ============================================================================
// MCSidebar - Sidebar de navegación
// ============================================================================

interface MCSidebarProps {
  agentStatuses?: Record<string, string>;
}

export function MCSidebar({ agentStatuses = {} }: MCSidebarProps) {
  const pathname = usePathname();
  const currentSection = pathname.split('/').pop() || 'overview';

  const getIcon = (iconName: string) => {
    const icons: Record<string, React.ReactNode> = {
      Grid: <Grid className="h-5 w-5" />,
      Cpu: <Cpu className="h-5 w-5" />,
      Zap: <Zap className="h-5 w-5" />,
      TrendingUp: <TrendingUp className="h-5 w-5" />,
      Shield: <Shield className="h-5 w-5" />,
      Megaphone: <Megaphone className="h-5 w-5" />,
      Activity: <Activity className="h-5 w-5" />,
      Bot: <Bot className="h-5 w-5" />,
      Server: <Server className="h-5 w-5" />,
    };
    return icons[iconName] || <Grid className="h-5 w-5" />;
  };

  return (
    <aside className="fixed left-0 top-16 bottom-0 w-60 border-r border-[#1e1e1e] bg-[#0a0a0a] p-4">
      <nav className="flex flex-col gap-1">
        {NAV_ITEMS.map((item) => {
          const isActive = currentSection === item.id;
          
          return (
            <Link
              key={item.id}
              href={`/mission-control${item.id === 'overview' ? '' : `/${item.id}`}`}
              className={cn(
                'group relative flex items-center gap-3 rounded-lg px-3 py-2.5 transition-all duration-200',
                isActive
                  ? 'bg-[#FF5C3A]/10 text-[#FF5C3A]'
                  : 'text-[#888888] hover:bg-[#1a1a1a] hover:text-[#F0F0F0]'
              )}
            >
              {isActive && (
                <motion.div
                  layoutId="sidebar-indicator"
                  className="absolute left-0 top-1/2 -translate-y-1/2 h-6 w-1 rounded-r-full bg-[#FF5C3A]"
                  transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                />
              )}
              
              <span className={cn(isActive ? 'text-[#FF5C3A]' : 'text-[#555555]')}>
                {getIcon(item.icon)}
              </span>
              
              <span className="font-medium">{item.label}</span>
              
              {item.badge && (
                <span className={cn(
                  'ml-auto rounded-full px-2 py-0.5 text-xs font-medium',
                  item.badge === 'BETA'
                    ? 'bg-[#FF5C3A]/10 text-[#FF5C3A]'
                    : 'bg-[#1e1e1e] text-[#888888]'
                )}>
                  {item.badge}
                </span>
              )}
              
              <ChevronRight className={cn(
                'ml-auto h-4 w-4 opacity-0 transition-opacity group-hover:opacity-100',
                isActive && 'opacity-100'
              )} />
            </Link>
          );
        })}
      </nav>

      {/* Agent Mini Status (bottom) */}
      <div className="absolute bottom-4 left-4 right-4">
        <div className="rounded-lg border border-[#1e1e1e] bg-[#111111] p-3">
          <h4 className="mb-2 text-xs font-medium uppercase tracking-wider text-[#555555]">
            Agentes Activos
          </h4>
          <div className="grid grid-cols-2 gap-2">
            {Object.entries(agentStatuses).slice(0, 6).map(([id, status]) => (
              <div key={id} className="flex items-center gap-2">
                <StatusDot status={status as 'online' | 'busy' | 'offline'} size="sm" />
                <span className="text-xs capitalize text-[#888888]">{id.slice(0, 6)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </aside>
  );
}

// ============================================================================
// MCLayout - Shell global (header + sidebar + main)
// ============================================================================

interface MCLayoutProps {
  children: React.ReactNode;
  globalStatus?: 'healthy' | 'warning' | 'critical';
  notificationCount?: number;
  agentStatuses?: Record<string, string>;
}

export function MCLayout({
  children,
  globalStatus = 'healthy',
  notificationCount = 0,
  agentStatuses = {},
}: MCLayoutProps) {
  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      <MCHeader globalStatus={globalStatus} notificationCount={notificationCount} />
      <MCSidebar agentStatuses={agentStatuses} />
      
      <main className="ml-60 pt-16">
        <div className="p-6">
          {children}
        </div>
      </main>
    </div>
  );
}

// ============================================================================
// Section - Wrapper de sección con title + actions slot
// ============================================================================

interface SectionProps {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

export function Section({ title, subtitle, actions, children, className }: SectionProps) {
  return (
    <section className={cn('mb-8', className)}>
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="font-display text-xl font-semibold text-[#F0F0F0]">{title}</h2>
          {subtitle && <p className="mt-1 text-sm text-[#888888]">{subtitle}</p>}
        </div>
        {actions && <div className="flex items-center gap-2">{actions}</div>}
      </div>
      {children}
    </section>
  );
}

// ============================================================================
// GridArea - Grid responsive
// ============================================================================

interface GridAreaProps {
  children: React.ReactNode;
  cols?: 1 | 2 | 3 | 4 | 6;
  gap?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function GridArea({ children, cols = 4, gap = 'md', className }: GridAreaProps) {
  const colClasses = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 md:grid-cols-2',
    3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4',
    6: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6',
  };

  const gapClasses = {
    sm: 'gap-3',
    md: 'gap-4',
    lg: 'gap-6',
  };

  return (
    <div className={cn('grid', colClasses[cols], gapClasses[gap], className)}>
      {children}
    </div>
  );
}