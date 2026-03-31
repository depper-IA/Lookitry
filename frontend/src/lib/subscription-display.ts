import type { Brand, BrandPlan } from '@/types';

type SubscriptionTone = 'emerald' | 'amber' | 'rose' | 'slate';

export interface SubscriptionDisplayState {
  displayPlan: BrandPlan;
  isTrial: boolean;
  isTrialExpired: boolean;
  daysUntilTrialEnd: number | null;
  renewalLabel: string;
  renewalDate: string | null;
  statusLabel: string;
  statusTone: SubscriptionTone;
}

const PAID_STATUSES = new Set(['active', 'expiring_soon']);

function hasTrialSignal(brand?: Partial<Brand> | null): boolean {
  return brand?.plan === 'TRIAL' || brand?.trialPaymentStatus === 'active';
}

function getDaysDifference(date: string | null | undefined): number | null {
  if (!date) return null;

  const target = new Date(date);
  if (Number.isNaN(target.getTime())) return null;

  return Math.ceil((target.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
}

export function hasActivePaidSubscription(brand?: Partial<Brand> | null): boolean {
  if (isTrialBrand(brand)) {
    return false;
  }

  return PAID_STATUSES.has(brand?.subscriptionStatus ?? '');
}

export function isTrialBrand(brand?: Partial<Brand> | null): boolean {
  if (!hasTrialSignal(brand) || !brand?.trialEndDate || brand?.subscriptionStatus === 'suspended') {
    return false;
  }

  const trialEnd = new Date(brand.trialEndDate);
  if (Number.isNaN(trialEnd.getTime())) {
    return false;
  }

  return trialEnd > new Date();
}

export function getSubscriptionDisplayState(brand?: Partial<Brand> | null): SubscriptionDisplayState {
  const fallbackPlan = (brand?.plan ?? 'BASIC') as BrandPlan;
  const daysUntilTrialEnd = getDaysDifference(brand?.trialEndDate);
  const trial = isTrialBrand(brand);
  const trialExpired = hasTrialSignal(brand) && !trial && !hasActivePaidSubscription(brand) && daysUntilTrialEnd !== null && daysUntilTrialEnd < 0;

  if (trial || trialExpired) {
    return {
      displayPlan: 'TRIAL',
      isTrial: trial,
      isTrialExpired: trialExpired,
      daysUntilTrialEnd,
      renewalLabel: 'Fin del trial',
      renewalDate: brand?.trialEndDate ?? null,
      statusLabel: trialExpired
        ? 'Trial vencido'
        : (daysUntilTrialEnd ?? 99) <= 3
          ? 'Trial por vencer'
          : 'Trial activo',
      statusTone: trialExpired ? 'rose' : 'amber',
    };
  }

  const status = brand?.subscriptionStatus ?? null;

  return {
    displayPlan: fallbackPlan,
    isTrial: false,
    isTrialExpired: false,
    daysUntilTrialEnd: null,
    renewalLabel: 'Próxima renovación',
    renewalDate: brand?.subscriptionEndDate ?? null,
    statusLabel:
      status === 'active'
        ? 'Activo'
        : status === 'expiring_soon'
          ? 'Por vencer'
          : status === 'expired'
            ? 'Vencido'
            : status === 'suspended'
              ? 'Suspendido'
              : 'Pendiente activación',
    statusTone:
      status === 'active'
        ? 'emerald'
        : status === 'expiring_soon'
          ? 'amber'
          : status === 'expired' || status === 'suspended'
            ? 'rose'
            : 'slate',
  };
}
