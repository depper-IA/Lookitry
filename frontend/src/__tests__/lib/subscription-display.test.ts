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

  it('mantiene como trial una cuenta legacy con trial_end_date vigente aunque el status siga en active', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-03-29T12:00:00.000Z'));

    const state = getSubscriptionDisplayState({
      plan: 'BASIC',
      trialEndDate: '2026-04-02T12:00:00.000Z',
      subscriptionStatus: 'active',
      subscriptionEndDate: '2026-05-02T12:00:00.000Z',
    });

    expect(hasActivePaidSubscription({ subscriptionStatus: 'active' })).toBe(true);
    expect(isTrialBrand({
      plan: 'BASIC',
      trialEndDate: '2026-04-02T12:00:00.000Z',
      subscriptionStatus: 'active',
    })).toBe(true);
    expect(state.displayPlan).toBe('TRIAL');
    expect(state.isTrial).toBe(true);
    expect(state.renewalLabel).toBe('Fin del trial');

    vi.useRealTimers();
  });

  it('marca trial vencido cuando la prueba ya expiro y no hay plan pago activo', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-03-29T12:00:00.000Z'));

    const state = getSubscriptionDisplayState({
      plan: 'BASIC',
      trialEndDate: '2026-03-20T12:00:00.000Z',
      subscriptionStatus: 'expired',
    });

    expect(state.displayPlan).toBe('TRIAL');
    expect(state.isTrial).toBe(false);
    expect(state.isTrialExpired).toBe(true);
    expect(state.statusLabel).toBe('Trial vencido');

    vi.useRealTimers();
  });
});
