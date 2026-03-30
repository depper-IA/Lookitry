'use client';

import React, { useState } from 'react';
import { useSubscription } from '@/hooks/useSubscription';
import { SubscriptionModal } from './SubscriptionModal';

// Convierte días a texto compacto: >30d → "3M 2D", ≤30d → "15D"
function formatTimeRemaining(days: number | null): { full: string; short: string } {
  if (days === null || days <= 0) return { full: '0D', short: '0D' };

  if (days > 30) {
    const months = Math.floor(days / 30);
    const rem = days % 30;
    const full = rem > 0 ? `${months}M ${rem}D` : `${months}M`;
    return { full, short: `${months}M` };
  }

  return { full: `${days}D`, short: `${days}D` };
}

// Paleta de estilos por estado — alineada con brand Lookitry (dark mode first)
const BADGE_STYLES = {
  green: {
    wrapper: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 hover:border-emerald-500/50',
    dot: 'bg-emerald-400',
  },
  yellow: {
    wrapper: 'border-amber-500/30 bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 hover:border-amber-500/50',
    dot: 'bg-amber-400',
  },
  red: {
    wrapper: 'border-red-500/30 bg-red-500/10 text-red-400 hover:bg-red-500/20 hover:border-red-500/50',
    dot: 'bg-red-500 animate-pulse',
  },
  trial: {
    wrapper: 'border-violet-500/30 bg-violet-500/10 text-violet-400 hover:bg-violet-500/20 hover:border-violet-500/50',
    dot: 'bg-violet-400',
  },
  expired: {
    wrapper: 'border-red-500/40 bg-red-500/10 text-red-400',
    dot: 'bg-red-500 animate-pulse',
  },
} as const;

export function SubscriptionBadge() {
  const {
    subscriptionInfo,
    isLoading,
    getDaysRemaining,
    getBadgeColor,
    isInTrial,
    getTrialDaysRemaining,
  } = useSubscription();
  const [isModalOpen, setIsModalOpen] = useState(false);

  if (isLoading || !subscriptionInfo) return null;

  const inTrial = isInTrial();
  const trialDays = getTrialDaysRemaining();
  const daysRemaining = getDaysRemaining();
  const badgeColor = getBadgeColor();

  const trialExpired =
    subscriptionInfo.plan === 'TRIAL' &&
    subscriptionInfo.trialEndDate !== null &&
    (trialDays === 0 || trialDays === null) &&
    subscriptionInfo.status !== 'active' &&
    subscriptionInfo.status !== 'expiring_soon';

  const noSubscription =
    !inTrial &&
    !trialExpired &&
    subscriptionInfo.status === null &&
    subscriptionInfo.trialEndDate === null;

  if (noSubscription) return null;

  // --- Trial vencido ---
  if (trialExpired) {
    const s = BADGE_STYLES.expired;
    return (
      <div
        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-medium whitespace-nowrap backdrop-blur-sm ${s.wrapper}`}
      >
        <span className={`h-1.5 w-1.5 rounded-full flex-shrink-0 ${s.dot}`} />
        <span className="hidden sm:inline">Prueba vencida · Activa tu plan</span>
        <span className="sm:hidden">Vencida</span>
      </div>
    );
  }

  // --- Trial activo ---
  if (inTrial) {
    const trialTime = formatTimeRemaining(trialDays);
    const s = BADGE_STYLES.trial;

    return (
      <>
        <button
          onClick={() => setIsModalOpen(true)}
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-medium whitespace-nowrap backdrop-blur-sm transition-all duration-200 cursor-pointer ${s.wrapper}`}
          title="Ver detalles del período de prueba"
        >
          <span className={`h-1.5 w-1.5 rounded-full flex-shrink-0 ${s.dot}`} />
          <span className="hidden sm:inline">Prueba · {trialTime.full}</span>
          <span className="sm:hidden">{trialTime.short}</span>
        </button>
        <SubscriptionModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} subscriptionInfo={subscriptionInfo} />
      </>
    );
  }

  // --- Suscripción activa ---
  const time = formatTimeRemaining(daysRemaining);
  const s = BADGE_STYLES[badgeColor];
  const planLabel = subscriptionInfo.plan === 'PRO' ? 'Plan Pro' : 'Plan Básico';

  return (
    <>
      <button
        onClick={() => setIsModalOpen(true)}
        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-medium whitespace-nowrap backdrop-blur-sm transition-all duration-200 cursor-pointer ${s.wrapper}`}
        title="Ver detalles de suscripción"
      >
        <span className={`h-1.5 w-1.5 rounded-full flex-shrink-0 ${s.dot}`} />
        {/* Desktop: plan + días */}
        <span className="hidden sm:inline">{planLabel} activo · {time.full}</span>
        {/* Mobile: solo el número corto */}
        <span className="sm:hidden">{time.short}</span>
      </button>
      <SubscriptionModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} subscriptionInfo={subscriptionInfo} />
    </>
  );
}
