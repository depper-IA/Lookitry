'use client';

import React, { useState } from 'react';
import { useSubscription } from '@/hooks/useSubscription';
import { SubscriptionModal } from './SubscriptionModal';
import { getSubscriptionDisplayState } from '@/lib/subscription-display';

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
    wrapper: 'border-[#FF5C3A]/30 bg-[#FF5C3A]/10 text-[#FF5C3A] hover:bg-[#FF5C3A]/20 hover:border-[#FF5C3A]/50',
    dot: 'bg-[#FF5C3A]',
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

  const displayState = getSubscriptionDisplayState(subscriptionInfo.brand);
  const inTrial = isInTrial();
  const trialDays = getTrialDaysRemaining();
  const daysRemaining = getDaysRemaining();
  const badgeColor = getBadgeColor();
  const showTrialState = inTrial || displayState.isTrial || displayState.displayPlan === 'TRIAL';

  const trialExpired =
    displayState.displayPlan === 'TRIAL' &&
    !displayState.isTrial &&
    displayState.isTrialExpired;

  const noSubscription =
    !showTrialState &&
    !trialExpired &&
    subscriptionInfo.status === null &&
    subscriptionInfo.trialEndDate === null;

  if (noSubscription) return null;

  if (trialExpired) {
    const s = BADGE_STYLES.expired;
    return (
      <div
        className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium whitespace-nowrap backdrop-blur-sm ${s.wrapper}`}
      >
        <span className={`h-1.5 w-1.5 rounded-full flex-shrink-0 ${s.dot}`} />
        <span className="hidden sm:inline">Trial vencido · Activa tu plan</span>
        <span className="sm:hidden">Vencido</span>
      </div>
    );
  }

  if (showTrialState) {
    const trialTime = formatTimeRemaining(trialDays ?? displayState.daysUntilTrialEnd);
    const s = BADGE_STYLES.trial;

    return (
      <>
        <button
          onClick={() => setIsModalOpen(true)}
          className={`inline-flex cursor-pointer items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium whitespace-nowrap backdrop-blur-sm transition-all duration-200 ${s.wrapper}`}
          title="Ver detalles del período de prueba"
        >
          <span className={`h-1.5 w-1.5 rounded-full flex-shrink-0 ${s.dot}`} />
          <span className="hidden sm:inline">Trial activo · {trialTime.full}</span>
          <span className="sm:hidden">{trialTime.short}</span>
        </button>
        <SubscriptionModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} subscriptionInfo={subscriptionInfo} />
      </>
    );
  }

  const time = formatTimeRemaining(daysRemaining);
  const s = BADGE_STYLES[badgeColor];
  const displayPlan = displayState.displayPlan;
  const planLabel = displayPlan === 'PRO' ? 'Plan Pro' : 'Plan Básico';

  return (
    <>
      <button
        onClick={() => setIsModalOpen(true)}
        className={`inline-flex cursor-pointer items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium whitespace-nowrap backdrop-blur-sm transition-all duration-200 ${s.wrapper}`}
        title="Ver detalles de suscripción"
      >
        <span className={`h-1.5 w-1.5 rounded-full flex-shrink-0 ${s.dot}`} />
        <span className="hidden sm:inline">{planLabel} activo · {time.full}</span>
        <span className="sm:hidden">{time.short}</span>
      </button>
      <SubscriptionModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} subscriptionInfo={subscriptionInfo} />
    </>
  );
}
