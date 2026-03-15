'use client';

import React, { useState } from 'react';
import { useSubscription } from '@/hooks/useSubscription';
import { SubscriptionModal } from './SubscriptionModal';

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

  if (isLoading || !subscriptionInfo) {
    return null;
  }

  const inTrial = isInTrial();
  const trialDays = getTrialDaysRemaining();
  const daysRemaining = getDaysRemaining();
  const badgeColor = getBadgeColor();

  const colorClasses = {
    green: 'bg-green-100 text-green-800 border-green-300',
    yellow: 'bg-yellow-100 text-yellow-800 border-yellow-300',
    red: 'bg-red-100 text-red-800 border-red-300',
  };

  // Trial vencido sin suscripción activa
  const trialExpired =
    subscriptionInfo.trialEndDate !== null &&
    trialDays === 0 &&
    subscriptionInfo.status !== 'active' &&
    subscriptionInfo.status !== 'expiring_soon';

  if (trialExpired) {
    return (
      <div className="inline-flex items-center px-3 py-1.5 border border-red-300 rounded-full text-sm font-medium bg-red-100 text-red-800">
        <AlertIcon className="mr-1.5 h-4 w-4" />
        Prueba vencida — Contacta a soporte
      </div>
    );
  }

  if (inTrial) {
    const trialColor = trialDays !== null && trialDays > 3 ? 'green' : trialDays !== null && trialDays >= 1 ? 'yellow' : 'red';
    const trialColorClass = colorClasses[trialColor];

    return (
      <>
        <button
          onClick={() => setIsModalOpen(true)}
          className={`inline-flex items-center px-3 py-1.5 border rounded-full text-sm font-medium transition-all hover:shadow-md ${trialColorClass}`}
          title="Ver detalles del período de prueba"
        >
          <BeakerIcon className="mr-1.5 h-4 w-4" />
          Prueba gratuita — {trialDays} {trialDays === 1 ? 'día' : 'días'}
        </button>

        <SubscriptionModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          subscriptionInfo={subscriptionInfo}
        />
      </>
    );
  }

  const colorClass = colorClasses[badgeColor];

  return (
    <>
      <button
        onClick={() => setIsModalOpen(true)}
        className={`inline-flex items-center px-3 py-1.5 border rounded-full text-sm font-medium transition-all hover:shadow-md ${colorClass}`}
        title="Ver detalles de suscripción"
      >
        <ClockIcon className="mr-1.5 h-4 w-4" />
        {daysRemaining} {daysRemaining === 1 ? 'día' : 'días'} restantes
      </button>

      <SubscriptionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        subscriptionInfo={subscriptionInfo}
      />
    </>
  );
}

function ClockIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    </svg>
  );
}

function BeakerIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M9 3v10.5a3 3 0 006 0V3M6 3h12M5 21h14a1 1 0 000-2H5a1 1 0 000 2z"
      />
    </svg>
  );
}

function AlertIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
      />
    </svg>
  );
}
