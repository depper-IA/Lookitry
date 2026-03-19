'use client';

import React, { useState, useEffect } from 'react';
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

// Icono de alerta oficial Lookitry
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
        if (stats.percentageUsed >= 100 && !isDismissed(getSessionKey('usage_100'))) {
          setShowUsage100(true);
        }
      })
      .catch(() => {})
      .finally(() => setLoadingUsage(false));
  }, []);

  useEffect(() => {
    if (subLoading || !subscriptionInfo) return;

    const inTrial = isInTrial();
    if (inTrial) return; // No mostrar estos avisos en trial (tienen su propio banner)
    if (!subscriptionInfo.status) return;

    const days = getDaysRemaining();
    // Mostramos aviso si vence en menos de 7 días
    if (days !== null && days < 7 && !isDismissed(getSessionKey('subscription_expiring'))) {
      setShowSubscriptionExpiring(true);
    }
  }, [subscriptionInfo, subLoading]);

  if (subLoading || loadingUsage) return null;
  if (!showUsage100 && !showSubscriptionExpiring) return null;

  const daysRemaining = getDaysRemaining();

  return (
    <div className="space-y-3 mb-6 animate-in fade-in slide-in-from-top-2 duration-300">
      
      {/* Aviso de Suscripción Vencida o por Vencer (ROJO) */}
      {showSubscriptionExpiring && (
        <div className="flex items-center justify-between gap-4 px-5 py-4 rounded-2xl border bg-[#ef4444]05 border-[#ef4444]20 shadow-sm" style={{ backgroundColor: 'var(--bg-card)' }}>
          <div className="flex items-start gap-3 min-w-0">
            <div className="mt-0.5 w-8 h-8 rounded-full bg-[#ef4444]10 flex items-center justify-center shrink-0">
              <IconAlert className="h-4 w-4 text-[#ef4444]" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-bold" style={{ color: '#ef4444' }}>
                Tu suscripción {daysRemaining !== null && daysRemaining <= 0 ? 'ha vencido' : 'vence pronto'}
              </p>
              <p className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>
                {daysRemaining !== null && daysRemaining > 0 
                  ? `Quedan ${daysRemaining} ${daysRemaining === 1 ? 'día' : 'días'} de acceso. ` 
                  : 'Tu acceso está restringido. '
                }
                Renueva ahora para evitar interrupciones en tus servicios.
              </p>
              <Link href="/dashboard/checkout" className="inline-block mt-2 text-xs font-bold underline hover:opacity-80" style={{ color: '#FF5C3A' }}>
                Renovar plan ahora
              </Link>
            </div>
          </div>
          <button 
            onClick={() => { dismiss(getSessionKey('subscription_expiring')); setShowSubscriptionExpiring(false); }}
            className="p-2 rounded-xl hover:bg-[#ef4444]10 text-gray-400 hover:text-[#ef4444] transition-all shrink-0"
          >
            <IconX className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Aviso de Límite de Generaciones (ROJO) */}
      {showUsage100 && (
        <div className="flex items-center justify-between gap-4 px-5 py-4 rounded-2xl border bg-[#ef4444]05 border-[#ef4444]20 shadow-sm" style={{ backgroundColor: 'var(--bg-card)' }}>
          <div className="flex items-start gap-3 min-w-0">
            <div className="mt-0.5 w-8 h-8 rounded-full bg-[#ef4444]10 flex items-center justify-center shrink-0">
              <IconAlert className="h-4 w-4 text-[#ef4444]" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-bold" style={{ color: '#ef4444' }}>
                Límite de generaciones alcanzado
              </p>
              <p className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>
                Has usado el 100% de tu capacidad mensual ({usageStats?.currentMonth.generationsUsed}/{usageStats?.currentMonth.generationsLimit}). 
                Tu cupo se reiniciará el {usageStats?.resetDate ? new Date(usageStats.resetDate).toLocaleDateString('es-CO', { day: 'numeric', month: 'long' }) : 'próximo mes'}.
              </p>
              <Link href="/dashboard/checkout" className="inline-block mt-2 text-xs font-bold underline hover:opacity-80" style={{ color: '#FF5C3A' }}>
                Aumentar capacidad (Plan Pro)
              </Link>
            </div>
          </div>
          <button 
            onClick={() => { dismiss(getSessionKey('usage_100')); setShowUsage100(false); }}
            className="p-2 rounded-xl hover:bg-[#ef4444]10 text-gray-400 hover:text-[#ef4444] transition-all shrink-0"
          >
            <IconX className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  );
}
