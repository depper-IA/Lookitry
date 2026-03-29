import { describe, expect, it, vi } from 'vitest';
import { getSubscriptionDisplayState, hasActivePaidSubscription, isTrialBrand } from '@/lib/subscription-display';

describe('subscription-display', () => {
  it('marca como trial una cuenta con trial vigente y sin suscripcion paga', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-03-29T12:00:00.000Z'));

    const state = getSubscriptionDisplayState({
      plan: 'BASIC',
      trialEndDate: '2026-04-01T12:00:00.000Z',
      subscriptionStatus: 'expired',
    });

    expect(isTrialBrand({
      plan: 'BASIC',
      trialEndDate: '2026-04-01T12:00:00.000Z',
      subscriptionStatus: 'expired',
    })).toBe(true);
    expect(state.displayPlan).toBe('TRIAL');
    expect(state.statusLabel).toBe('Trial por vencer');
    expect(state.renewalLabel).toBe('Fin del trial');

    vi.useRealTimers();
  });

  it('no trata como trial una cuenta con suscripcion paga activa aunque conserve trial_end_date', () => {
    const state = getSubscriptionDisplayState({
      plan: 'PRO',
      trialEndDate: '2026-04-02T12:00:00.000Z',
      subscriptionStatus: 'active',
      subscriptionEndDate: '2026-05-02T12:00:00.000Z',
    });

    expect(hasActivePaidSubscription({ subscriptionStatus: 'active' })).toBe(true);
    expect(isTrialBrand({
      plan: 'PRO',
      trialEndDate: '2026-04-02T12:00:00.000Z',
      subscriptionStatus: 'active',
    })).toBe(false);
    expect(state.displayPlan).toBe('PRO');
    expect(state.statusLabel).toBe('Activo');
    expect(state.renewalLabel).toBe('Próxima renovación');
  });

  it('marca trial vencido cuando la prueba ya expiró y no hay plan pago activo', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-03-29T12:00:00.000Z'));

    const state = getSubscriptionDisplayState({
      plan: 'BASIC',
      trialEndDate: '2026-03-20T12:00:00.000Z',
      subscriptionStatus: 'expired',
    });

    expect(state.displayPlan).toBe('TRIAL');
    expect(state.isTrialExpired).toBe(true);
    expect(state.statusLabel).toBe('Trial vencido');

    vi.useRealTimers();
  });
});
