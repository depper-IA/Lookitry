'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usageService } from '@/services/usage.service';
import { useSubscription } from '@/hooks/useSubscription';
import type { UsageStats } from '@/types';

function getSessionKey(type: 'usage_80' | 'usage_100' | 'subscription_expiring'): string {
  const now = new Date();
  const monthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  return `notif_${type}_${monthKey}`;
}

function isDismissed(key: string): boolean {
  if (typeof window === 'undefined') return false;
  return sessionStorage.getItem(key) === 'dismissed';
}

function dismiss(key: string): void {
  if (typeof window === 'undefined') return;
  sessionStorage.setItem(key, 'dismissed');
}

function IconAlert({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
    </svg>
  );
}

function IconX({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
  );
}

type NotificationConfig = {
  key: 'subscription_expiring' | 'usage_100';
  title: string;
  description: string;
  href: string;
  cta: string;
};

export function DashboardNotifications() {
  const { subscriptionInfo, getDaysRemaining, isInTrial, isLoading: subLoading } = useSubscription();
  const [usageStats, setUsageStats] = useState<UsageStats | null>(null);
  const [loadingUsage, setLoadingUsage] = useState(true);
  const [showUsage100, setShowUsage100] = useState(false);
  const [showSubscriptionExpiring, setShowSubscriptionExpiring] = useState(false);

  useEffect(() => {
    usageService.getUsageStats()
      .then((stats) => {
        setUsageStats(stats);
        if (stats?.percentageUsed >= 100 && !isDismissed(getSessionKey('usage_100'))) {
          setShowUsage100(true);
        }
      })
      .catch(() => {})
      .finally(() => setLoadingUsage(false));
  }, []);

  useEffect(() => {
    if (subLoading || !subscriptionInfo) return;
    if (isInTrial()) return;
    if (!subscriptionInfo.status) return;

    const days = getDaysRemaining();
    if (days !== null && days < 7 && !isDismissed(getSessionKey('subscription_expiring'))) {
      setShowSubscriptionExpiring(true);
    }
  }, [getDaysRemaining, isInTrial, subLoading, subscriptionInfo]);

  if (subLoading || loadingUsage) return null;

  const daysRemaining = getDaysRemaining();
  const primaryNotification: NotificationConfig | null = showSubscriptionExpiring
    ? {
        key: 'subscription_expiring',
        title: `Tu suscripción ${daysRemaining !== null && daysRemaining <= 0 ? 'ha vencido' : 'vence pronto'}`,
        description:
          daysRemaining !== null && daysRemaining > 0
            ? `Quedan ${daysRemaining} ${daysRemaining === 1 ? 'día' : 'días'} de acceso. Renueva ahora para evitar interrupciones.`
            : 'Tu acceso está restringido. Renueva el plan para recuperar continuidad operativa.',
        href: '/dashboard/subscription',
        cta: 'Renovar plan',
      }
    : showUsage100
      ? {
          key: 'usage_100',
          title: 'Límite de generaciones alcanzado',
          description: `Has usado el 100% de tu capacidad mensual (${usageStats?.currentMonth?.generationsUsed ?? 0}/${usageStats?.currentMonth?.generationsLimit ?? 0}). Amplía tu capacidad para no frenar nuevas pruebas.`,
          href: '/dashboard/subscription',
          cta: 'Aumentar capacidad',
        }
      : null;

  if (!primaryNotification) return null;

  return (
    <div className="mb-6 animate-in fade-in slide-in-from-top-2 duration-300">
      <div className="flex items-center justify-between gap-4 rounded-2xl border border-[#ef4444]/20 px-5 py-4 shadow-sm" style={{ backgroundColor: 'var(--bg-card)' }}>
        <div className="flex min-w-0 items-start gap-3">
          <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#ef4444]/10">
            <IconAlert className="h-4 w-4 text-[#ef4444]" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-bold text-[#ef4444]">{primaryNotification.title}</p>
            <p className="mt-0.5 text-xs text-[var(--text-secondary)]">{primaryNotification.description}</p>
            <Link href={primaryNotification.href} className="mt-2 inline-block text-xs font-bold underline hover:opacity-80" style={{ color: '#FF5C3A' }}>
              {primaryNotification.cta}
            </Link>
          </div>
        </div>
        <button
          onClick={() => {
            dismiss(getSessionKey(primaryNotification.key));
            if (primaryNotification.key === 'subscription_expiring') {
              setShowSubscriptionExpiring(false);
            } else {
              setShowUsage100(false);
            }
          }}
          className="shrink-0 rounded-xl p-2 text-gray-400 transition-all hover:bg-[#ef4444]/10 hover:text-[#ef4444]"
        >
          <IconX className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
