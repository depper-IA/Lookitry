import { SubscriptionService } from '../subscription.service';
import { supabaseAdmin } from '../../config/supabase';
import { attachLedgerSnapshotToNotes } from '../../utils/paymentLedger';

jest.mock('../../config/supabase', () => ({
  supabase: { from: jest.fn() },
  supabaseAdmin: { from: jest.fn() },
}));

jest.mock('../paymentSettings.service', () => ({
  PaymentSettingsService: jest.fn().mockImplementation(() => ({
    getSettings: jest.fn().mockResolvedValue({ landing_price: 650000 }),
  })),
}));

jest.mock('../pricing.service', () => ({
  pricingService: {
    calculateTotal: jest.fn().mockResolvedValue(810000),
  },
}));

function buildChain(resolvedValue: any) {
  return {
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnThis(),
    in: jest.fn().mockReturnThis(),
    gte: jest.fn().mockReturnThis(),
    lte: jest.fn().mockReturnThis(),
    gt: jest.fn().mockReturnThis(),
    not: jest.fn().mockReturnThis(),
    is: jest.fn().mockReturnThis(),
    or: jest.fn().mockReturnThis(),
    neq: jest.fn().mockReturnThis(),
    order: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    single: jest.fn().mockResolvedValue(resolvedValue),
    maybeSingle: jest.fn().mockResolvedValue(resolvedValue),
  };
}

function buildSelectTerminalChain(resolvedValue: any) {
  const chain = buildChain(resolvedValue);
  chain.select = jest.fn().mockResolvedValue(resolvedValue);
  return chain;
}

describe('SubscriptionService', () => {
  let service: SubscriptionService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new SubscriptionService();
  });

  describe('calculateExpirationDate', () => {
    it('usa ciclos de 30 días', () => {
      const start = new Date('2025-02-01T00:00:00.000Z');
      const result = service.calculateExpirationDate(start, 1);
      expect(result.toISOString()).toBe('2025-03-03T00:00:00.000Z');
    });
  });

  describe('calculateUpgradeProration', () => {
    it('no da crédito a marcas en trial operativo', async () => {
      const now = new Date();
      const trialEnd = new Date(now.getTime() + 7 * 86400000).toISOString();

      (supabaseAdmin.from as jest.Mock).mockReturnValueOnce(
        buildChain({
          data: {
            subscription_status: 'active',
            subscription_start_date: now.toISOString(),
            subscription_end_date: trialEnd,
            trial_end_date: trialEnd,
            plan: 'TRIAL',
          },
          error: null,
        })
      );

      const result = await service.calculateUpgradeProration('brand-1', 'PRO', 1, 250000, 0);
      expect(result.creditAmount).toBe(0);
      expect(result.amountToPay).toBe(250000);
    });

    it('aplica crédito usando el total pagado del último ciclo', async () => {
      const now = new Date();
      const start = new Date(now.getTime() - 30 * 86400000).toISOString();
      const end = new Date(now.getTime() + 60 * 86400000).toISOString();

      (supabaseAdmin.from as jest.Mock)
        .mockReturnValueOnce(
          buildChain({
            data: {
              subscription_status: 'active',
              subscription_start_date: start,
              subscription_end_date: end,
              trial_end_date: null,
              plan: 'BASIC',
            },
            error: null,
          })
        )
        .mockReturnValueOnce(
          buildChain({ data: { amount: 810000, months_paid: 6, notes: null }, error: null })
        );

      const result = await service.calculateUpgradeProration('brand-1', 'PRO', 1, 250000, 0);
      expect(result.daysRemaining).toBeGreaterThanOrEqual(59);
      expect(result.creditAmount).toBeGreaterThan(0);
      expect(result.amountToPay).toBe(0);
      expect(result.isFree).toBe(true);
    });

    it('usa el total fallback/configurado cuando no hay último pago elegible', async () => {
      const now = new Date();
      const start = new Date(now.getTime() - 90 * 86400000).toISOString();
      const end = new Date(now.getTime() + 90 * 86400000).toISOString();

      (supabaseAdmin.from as jest.Mock)
        .mockReturnValueOnce(
          buildChain({
            data: {
              subscription_status: 'active',
              subscription_start_date: start,
              subscription_end_date: end,
              trial_end_date: null,
              plan: 'BASIC',
            },
            error: null,
          })
        )
        .mockReturnValueOnce(buildChain({ data: null, error: null }));

      const result = await service.calculateUpgradeProration('brand-1', 'PRO', 1, 250000, 810000);
      expect(result.creditAmount).toBeGreaterThan(0);
      expect(result.amountToPay).toBe(0);
    });

    it('descuenta landing usando ledger_snapshot en lugar de depender solo del texto', async () => {
      const now = new Date();
      const start = new Date(now.getTime() - 15 * 86400000).toISOString();
      const end = new Date(now.getTime() + 15 * 86400000).toISOString();
      const notes = attachLedgerSnapshotToNotes('Pago mixto', {
        version: 1,
        brandId: 'brand-1',
        brandName: 'Brand',
        brandEmail: 'brand@test.com',
        brandSlug: 'brand',
        planPurchased: 'BASIC',
        billingType: 'subscription',
        includesLanding: true,
        brandPlanBefore: 'BASIC',
        brandPlanAfter: 'BASIC',
      });

      (supabaseAdmin.from as jest.Mock)
        .mockReturnValueOnce(
          buildChain({
            data: {
              subscription_status: 'active',
              subscription_start_date: start,
              subscription_end_date: end,
              trial_end_date: null,
              plan: 'BASIC',
            },
            error: null,
          })
        )
        .mockReturnValueOnce(
          buildChain({ data: { amount: 1000000, months_paid: 1, notes }, error: null })
        );

      const result = await service.calculateUpgradeProration('brand-1', 'PRO', 1, 500000, 0);
      expect(result.creditAmount).toBeLessThan(1000000);
      expect(result.amountToPay).toBeGreaterThan(0);
    });
  });

  describe('renewSubscription', () => {
    it('propaga reference al registro del pago y activa la marca', async () => {
      const currentBrand = {
        id: 'brand-1',
        name: 'Brand',
        email: 'brand@test.com',
        slug: 'brand',
        plan: 'BASIC',
        subscription_end_date: null,
        trial_end_date: null,
        landing_suspended_at: null,
      };
      const updatedBrand = {
        ...currentBrand,
        subscription_status: 'active',
        subscription_start_date: new Date().toISOString(),
        subscription_end_date: new Date(Date.now() + 30 * 86400000).toISOString(),
      };
      const insertedPayment = { id: 'pay-1' };
      let brandCalls = 0;

      (supabaseAdmin.from as jest.Mock).mockImplementation((table: string) => {
        if (table === 'subscription_payments') {
          const chain = buildChain({ data: insertedPayment, error: null });
          chain.maybeSingle = jest.fn().mockResolvedValue({ data: null, error: null });
          chain.single = jest.fn().mockResolvedValue({ data: insertedPayment, error: null });
          return chain;
        }
        if (table === 'brands') {
          brandCalls += 1;
          return brandCalls === 1
            ? buildChain({ data: currentBrand, error: null })
            : buildChain({ data: updatedBrand, error: null });
        }
        return buildChain({ data: null, error: null });
      });

      const result = await service.renewSubscription('brand-1', {
        brand_id: 'brand-1',
        amount: 150000,
        currency: 'COP',
        payment_method: 'wompi',
        status: 'completed',
        reference: 'TRYON-brand-1-M1-PBASIC-123',
      });

      expect(result.subscription_status).toBe('active');
      expect((supabaseAdmin.from as jest.Mock).mock.calls.some((call) => call[0] === 'subscription_payments')).toBe(true);
    });
  });

  describe('reactivateSubscription', () => {
    it('reactiva si todavía hay período pago activo', async () => {
      const futureDate = new Date(Date.now() + 5 * 86400000).toISOString();
      let brandCalls = 0;

      (supabaseAdmin.from as jest.Mock).mockImplementation(() => {
        brandCalls += 1;
        return brandCalls === 1
          ? buildChain({
              data: {
                id: 'brand-1',
                landing_suspended_at: null,
                has_landing_page: false,
                trial_end_date: null,
                subscription_end_date: futureDate,
              },
              error: null,
            })
          : buildChain({ data: { id: 'brand-1', subscription_status: 'active' }, error: null });
      });

      const result = await service.reactivateSubscription('brand-1');
      expect(result.subscription_status).toBe('active');
    });
  });

  describe('updateSubscriptionStatuses', () => {
    it('protege trials activos y expira trials vencidos sin subscription_end_date', async () => {
      const expiredTrials = buildSelectTerminalChain({ data: [{ id: 'trial-expired' }], error: null });
      const expiredSubs = buildSelectTerminalChain({ data: [], error: null });
      const expiringSoon = buildSelectTerminalChain({ data: [], error: null });
      const suspended = buildSelectTerminalChain({ data: [{ id: 'trial-expired' }], error: null });

      (supabaseAdmin.from as jest.Mock)
        .mockReturnValueOnce(expiredTrials)
        .mockReturnValueOnce(expiredSubs)
        .mockReturnValueOnce(expiringSoon)
        .mockReturnValueOnce(suspended);

      const result = await service.updateSubscriptionStatuses();
      expect(result.trialExpired).toBe(1);
      expect(result.expired).toBe(1);
    });
  });
});
