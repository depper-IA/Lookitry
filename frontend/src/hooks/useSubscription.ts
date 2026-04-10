import { useState, useEffect } from 'react';
import { subscriptionService, type SubscriptionInfo } from '@/services/subscription.service';

export function useSubscription() {
  const [subscriptionInfo, setSubscriptionInfo] = useState<SubscriptionInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadSubscriptionInfo();
  }, []);

  const loadSubscriptionInfo = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await subscriptionService.getSubscriptionInfo();
      setSubscriptionInfo(data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al cargar información de suscripción');
      console.error('Error loading subscription info:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const getDaysRemaining = (): number => {
    return subscriptionInfo?.daysRemaining ?? 0;
  };

  const getStatus = () => {
    return subscriptionInfo?.status ?? null;
  };

  const isInTrial = (): boolean => {
    return subscriptionInfo?.isInTrial ?? false;
  };

  const getTrialDaysRemaining = (): number | null => {
    return subscriptionInfo?.trialDaysRemaining ?? null;
  };

  const getBadgeColor = (): 'green' | 'yellow' | 'red' => {
    if (subscriptionInfo?.isInTrial) {
      const trialDays = subscriptionInfo.trialDaysRemaining ?? 0;
      if (trialDays > 3) return 'green';
      if (trialDays >= 1) return 'yellow';
      return 'red';
    }
    const days = getDaysRemaining();
    if (days > 7) return 'green';
    if (days >= 3) return 'yellow';
    return 'red';
  };

  return {
    subscriptionInfo,
    isLoading,
    error,
    getDaysRemaining,
    getStatus,
    isInTrial,
    getTrialDaysRemaining,
    getBadgeColor,
    refresh: loadSubscriptionInfo,
  };
}
