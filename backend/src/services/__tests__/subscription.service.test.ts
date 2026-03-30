import { SubscriptionService } from '../subscription.service';
import { supabase, supabaseAdmin } from '../../config/supabase';

jest.mock('../paymentSettings.service', () => ({
  PaymentSettingsService: jest.fn().mockImplementation(() => ({
    getSettings: jest.fn().mockResolvedValue({ landing_price: 650000 }),
  })),
}));

// Mock de Supabase
jest.mock('../../config/supabase', () => ({
  supabase: {
    from: jest.fn(),
  },
  supabaseAdmin: {
    from: jest.fn(),
  },
}));

const mockSupabaseChain = (returnValue: any) => ({
  select: jest.fn().mockReturnThis(),
  eq: jest.fn().mockReturnThis(),
  update: jest.fn().mockReturnThis(),
  insert: jest.fn().mockReturnThis(),
  in: jest.fn().mockReturnThis(),
  gte: jest.fn().mockReturnThis(),
  lte: jest.fn().mockReturnThis(),
  gt: jest.fn().mockReturnThis(),
  order: jest.fn().mockReturnThis(),
  limit: jest.fn().mockReturnThis(),
  single: jest.fn().mockResolvedValue(returnValue),
  maybeSingle: jest.fn().mockResolvedValue(returnValue),
  neq: jest.fn().mockReturnThis(),
});

const mockSupabaseChainList = (returnValue: any) => ({
  select: jest.fn().mockReturnThis(),
  eq: jest.fn().mockReturnThis(),
  update: jest.fn().mockReturnThis(),
  insert: jest.fn().mockReturnThis(),
  in: jest.fn().mockReturnThis(),
  gte: jest.fn().mockReturnThis(),
  lte: jest.fn().mockReturnThis(),
  gt: jest.fn().mockReturnThis(),
  order: jest.fn().mockResolvedValue(returnValue),
});

describe('SubscriptionService', () => {
  let service: SubscriptionService;

  beforeEach(() => {
    service = new SubscriptionService();
    jest.clearAllMocks();
  });

  // ─── calculateExpirationDate ───────────────────────────────────────────────

  describe('calculateExpirationDate', () => {
    it('debe retornar exactamente +30 días desde la fecha de inicio', () => {
      const start = new Date('2025-01-01T00:00:00.000Z');
      const result = service.calculateExpirationDate(start);
      const expected = new Date('2025-01-31T00:00:00.000Z');
      expect(result.getTime()).toBe(expected.getTime());
    });

    it('debe manejar correctamente meses con 28 días (febrero)', () => {
      const start = new Date('2025-02-01T00:00:00.000Z');
      const result = service.calculateExpirationDate(start);
      const expected = new Date('2025-03-03T00:00:00.000Z');
      expect(result.getTime()).toBe(expected.getTime());
    });

    it('debe manejar correctamente meses con 31 días', () => {
      const start = new Date('2025-03-01T00:00:00.000Z');
      const result = service.calculateExpirationDate(start);
      const expected = new Date('2025-03-31T00:00:00.000Z');
      expect(result.getTime()).toBe(expected.getTime());
    });

    it('no debe mutar la fecha de inicio', () => {
      const start = new Date('2025-06-15T00:00:00.000Z');
      const originalTime = start.getTime();
      service.calculateExpirationDate(start);
      expect(start.getTime()).toBe(originalTime);
    });

    it('la fecha de vencimiento siempre debe ser posterior a la fecha de inicio', () => {
      const dates = [
        new Date('2025-01-01'),
        new Date('2025-06-15'),
        new Date('2025-12-31'),
        new Date('2026-02-28'),
      ];
      dates.forEach((start) => {
        const result = service.calculateExpirationDate(start);
        expect(result.getTime()).toBeGreaterThan(start.getTime());
      });
    });
  });

  // ─── checkSubscriptionStatus ──────────────────────────────────────────────

  describe('checkSubscriptionStatus', () => {
    it('debe retornar true si subscription_status es "active"', async () => {
      (supabaseAdmin.from as jest.Mock).mockReturnValue(
        mockSupabaseChain({ data: { subscription_status: 'active', trial_end_date: null }, error: null })
      );
      const result = await service.checkSubscriptionStatus('brand-1');
      expect(result).toBe(true);
    });

    it('debe retornar true si subscription_status es "expiring_soon"', async () => {
      (supabaseAdmin.from as jest.Mock).mockReturnValue(
        mockSupabaseChain({ data: { subscription_status: 'expiring_soon', trial_end_date: null }, error: null })
      );
      const result = await service.checkSubscriptionStatus('brand-1');
      expect(result).toBe(true);
    });

    it('debe retornar false si subscription_status es "suspended"', async () => {
      (supabaseAdmin.from as jest.Mock).mockReturnValue(
        mockSupabaseChain({ data: { subscription_status: 'suspended', trial_end_date: null }, error: null })
      );
      const result = await service.checkSubscriptionStatus('brand-1');
      expect(result).toBe(false);
    });

    it('debe retornar true si está en período de prueba activo', async () => {
      const futureDate = new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString();
      (supabaseAdmin.from as jest.Mock).mockReturnValue(
        mockSupabaseChain({ data: { subscription_status: 'suspended', trial_end_date: futureDate }, error: null })
      );
      const result = await service.checkSubscriptionStatus('brand-1');
      expect(result).toBe(true);
    });

    it('debe retornar false si el trial ya venció', async () => {
      const pastDate = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      (supabaseAdmin.from as jest.Mock).mockReturnValue(
        mockSupabaseChain({ data: { subscription_status: 'suspended', trial_end_date: pastDate }, error: null })
      );
      const result = await service.checkSubscriptionStatus('brand-1');
      expect(result).toBe(false);
    });

    it('debe retornar false si hay error de base de datos', async () => {
      (supabaseAdmin.from as jest.Mock).mockReturnValue(
        mockSupabaseChain({ data: null, error: new Error('DB error') })
      );
      const result = await service.checkSubscriptionStatus('brand-1');
      expect(result).toBe(false);
    });
  });

  describe('isInTrial', () => {
    it('debe retornar true si trial_end_date sigue vigente aunque el status sea active', async () => {
      const futureDate = new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString();
      (supabaseAdmin.from as jest.Mock).mockReturnValue(
        mockSupabaseChain({ data: { subscription_status: 'active', trial_end_date: futureDate }, error: null })
      );

      const result = await service.isInTrial('brand-1');
      expect(result).toBe(true);
    });

    it('debe retornar false si la marca esta suspendida aunque conserve trial_end_date', async () => {
      const futureDate = new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString();
      (supabaseAdmin.from as jest.Mock).mockReturnValue(
        mockSupabaseChain({ data: { subscription_status: 'suspended', trial_end_date: futureDate }, error: null })
      );

      const result = await service.isInTrial('brand-1');
      expect(result).toBe(false);
    });
  });

  // ─── suspendSubscription ──────────────────────────────────────────────────

  describe('suspendSubscription', () => {
    it('debe cambiar el estado a "suspended"', async () => {
      const suspendedBrand = { id: 'brand-1', subscription_status: 'suspended' };
      (supabaseAdmin.from as jest.Mock).mockReturnValue(
        mockSupabaseChain({ data: suspendedBrand, error: null })
      );
      const result = await service.suspendSubscription('brand-1');
      expect(result.subscription_status).toBe('suspended');
    });

    it('debe lanzar error si falla la actualización', async () => {
      (supabaseAdmin.from as jest.Mock).mockReturnValue(
        mockSupabaseChain({ data: null, error: { message: 'DB error' } })
      );
      await expect(service.suspendSubscription('brand-1')).rejects.toThrow(
        'Error al suspender la suscripción'
      );
    });
  });

  // ─── getDaysRemaining ─────────────────────────────────────────────────────

  describe('getDaysRemaining', () => {
    it('debe retornar días positivos si la suscripción no ha vencido', async () => {
      const futureDate = new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString();
      (supabaseAdmin.from as jest.Mock).mockReturnValue(
        mockSupabaseChain({ data: { subscription_end_date: futureDate }, error: null })
      );
      const result = await service.getDaysRemaining('brand-1');
      expect(result).toBeGreaterThan(0);
    });

    it('debe retornar null si no hay fecha de vencimiento', async () => {
      (supabaseAdmin.from as jest.Mock).mockReturnValue(
        mockSupabaseChain({ data: { subscription_end_date: null }, error: null })
      );
      const result = await service.getDaysRemaining('brand-1');
      expect(result).toBeNull();
    });

    it('debe retornar valor negativo o cero si la suscripción ya venció', async () => {
      const pastDate = new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString();
      (supabaseAdmin.from as jest.Mock).mockReturnValue(
        mockSupabaseChain({ data: { subscription_end_date: pastDate }, error: null })
      );
      const result = await service.getDaysRemaining('brand-1');
      expect(result).toBeLessThanOrEqual(0);
    });
  });

  // ─── calculateUpgradeProration ────────────────────────────────────────────

  describe('calculateUpgradeProration', () => {
    it('no debe dar crédito si la marca sigue en trial operativo', async () => {
      const now = new Date();
      const end = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString();

      (supabaseAdmin.from as jest.Mock).mockReturnValueOnce(
        mockSupabaseChain({
          data: {
            subscription_start_date: now.toISOString(),
            subscription_end_date: end,
            subscription_status: 'active',
            trial_end_date: end,
            plan: 'BASIC',
          },
          error: null,
        })
      );

      const result = await service.calculateUpgradeProration('brand-1', 'PRO', 1, 250000, 150000);

      expect(result.creditAmount).toBe(0);
      expect(result.amountToPay).toBe(250000);
      expect(result.isFree).toBe(false);
    });

    it('no debe dar crédito si no existe pago elegible previo', async () => {
      const now = new Date();
      const end = new Date(now.getTime() + 15 * 24 * 60 * 60 * 1000).toISOString();

      (supabaseAdmin.from as jest.Mock)
        .mockReturnValueOnce(
          mockSupabaseChain({
            data: {
              subscription_start_date: now.toISOString(),
              subscription_end_date: end,
              subscription_status: 'active',
              trial_end_date: null,
              plan: 'BASIC',
            },
            error: null,
          })
        )
        .mockReturnValueOnce(
          mockSupabaseChain({ data: null, error: null })
        );

      const result = await service.calculateUpgradeProration('brand-1', 'PRO', 1, 250000, 150000);

      expect(result.creditAmount).toBe(0);
      expect(result.amountToPay).toBe(250000);
      expect(result.isFree).toBe(false);
    });

    it('debe aplicar crédito de pro a basic usando días remanentes', async () => {
      const now = new Date();
      const start = new Date(now.getTime() - 15 * 24 * 60 * 60 * 1000).toISOString();
      const end = new Date(now.getTime() + 15 * 24 * 60 * 60 * 1000).toISOString();

      (supabaseAdmin.from as jest.Mock)
        .mockReturnValueOnce(
          mockSupabaseChain({
            data: { subscription_start_date: start, subscription_end_date: end, plan: 'PRO' },
            error: null,
          })
        )
        .mockReturnValueOnce(
          mockSupabaseChain({ data: { amount: 250000, months_paid: 1 }, error: null })
        );

      const result = await service.calculateUpgradeProration('brand-1', 'BASIC', 1, 150000, 150000);

      expect(result.daysRemaining).toBeGreaterThanOrEqual(14);
      expect(result.creditAmount).toBeGreaterThan(0);
      expect(result.newPlanTotal).toBe(150000);
      expect(result.amountToPay).toBe(25000);
      expect(result.remainingCredit).toBe(0);
      expect(result.isFree).toBe(false);
    });

    it('debe dar prorrateo libre y crédito restante si monto de pro > basic', async () => {
      const now = new Date();
      const start = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString();
      const end = new Date(now.getTime() + 28 * 24 * 60 * 60 * 1000).toISOString();

      (supabaseAdmin.from as jest.Mock)
        .mockReturnValueOnce(
          mockSupabaseChain({
            data: { subscription_start_date: start, subscription_end_date: end, plan: 'PRO' },
            error: null,
          })
        )
        .mockReturnValueOnce(
          mockSupabaseChain({ data: { amount: 250000, months_paid: 1 }, error: null })
        );

      const result = await service.calculateUpgradeProration('brand-1', 'BASIC', 1, 150000, 150000);

      expect(result.creditAmount).toBeGreaterThan(150000);
      expect(result.amountToPay).toBe(0);
      expect(result.remainingCredit).toBeGreaterThan(0);
      expect(result.isFree).toBe(true);
    });

    it('debe convertir BASIC de 3m a PRO correctamente con pago parcial', async () => {
      const now = new Date();
      const start = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();
      const end = new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000).toISOString();

      (supabaseAdmin.from as jest.Mock)
        .mockReturnValueOnce(
          mockSupabaseChain({
            data: { subscription_start_date: start, subscription_end_date: end, plan: 'BASIC' },
            error: null,
          })
        )
        .mockReturnValueOnce(
          mockSupabaseChain({ data: { amount: 450000, months_paid: 3 }, error: null })
        );

      const result = await service.calculateUpgradeProration('brand-1', 'PRO', 1, 250000, 450000);

      expect(result.daysRemaining).toBeGreaterThanOrEqual(59);
      expect(result.creditAmount).toBeGreaterThan(0);
      expect(result.newPlanTotal).toBe(250000);
      expect(result.amountToPay).toBe(0);
      expect(result.remainingCredit).toBeGreaterThan(0);
      expect(result.isFree).toBe(true);
    });

    it('debe conservar upgrade gratuito cuando el crédito cubre el monto calculado', async () => {
      const now = new Date();
      const start = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();
      const end = new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000).toISOString();

      (supabaseAdmin.from as jest.Mock)
        .mockReturnValueOnce(
          mockSupabaseChain({
            data: { subscription_start_date: start, subscription_end_date: end, plan: 'BASIC' },
            error: null,
          })
        )
        .mockReturnValueOnce(
          mockSupabaseChain({ data: { amount: 450000, months_paid: 3 }, error: null })
        );

      const result = await service.calculateUpgradeProration('brand-1', 'PRO', 3, 250000, 450000);

      expect(result.newPlanTotal).toBe(250000);
      expect(result.creditAmount).toBeGreaterThan(0);
      expect(result.amountToPay).toBe(0);
      expect(result.remainingCredit).toBeGreaterThanOrEqual(0);
      expect(result.isFree).toBe(true);
    });
  });

  // ─── renewSubscription ────────────────────────────────────────────────────

  describe('renewSubscription', () => {
    const paymentData = {
      brand_id: 'brand-1',
      amount: 150000,
      currency: 'COP',
      payment_method: 'transferencia',
      status: 'completed' as const,
    };

    it('debe renovar la suscripción y retornar la marca actualizada', async () => {
      const existingBrand = {
        id: 'brand-1',
        subscription_end_date: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
        subscription_status: 'expiring_soon',
      };
      const updatedBrand = {
        id: 'brand-1',
        subscription_status: 'active',
        subscription_end_date: new Date(Date.now() + 35 * 24 * 60 * 60 * 1000).toISOString(),
      };
      const paymentRecord = { id: 'pay-1', ...paymentData };

      (supabaseAdmin.from as jest.Mock)
        .mockReturnValueOnce(mockSupabaseChain({ data: existingBrand, error: null })) // getBrand
        .mockReturnValueOnce(mockSupabaseChain({ data: updatedBrand, error: null })) // update brand
        .mockReturnValueOnce(mockSupabaseChain({ data: paymentRecord, error: null })); // insert payment

      const result = await service.renewSubscription('brand-1', paymentData);
      expect(result.subscription_status).toBe('active');
    });

    it('debe lanzar error si la marca no existe', async () => {
      (supabaseAdmin.from as jest.Mock).mockReturnValue(
        mockSupabaseChain({ data: null, error: { message: 'Not found' } })
      );
      await expect(service.renewSubscription('brand-x', paymentData)).rejects.toThrow(
        'Marca no encontrada'
      );
    });
  });

  describe('applyFreeUpgrade', () => {
    it('debe respetar forcedEndDate y limpiar el estado trial', async () => {
      const forcedEndDate = '2026-05-01T00:00:00.000Z';
      const updatedBrand = {
        id: 'brand-1',
        plan: 'PRO',
        subscription_status: 'active',
        subscription_end_date: forcedEndDate,
      };

      (supabaseAdmin.from as jest.Mock)
        .mockReturnValueOnce(mockSupabaseChain({ data: updatedBrand, error: null }))
        .mockReturnValueOnce(mockSupabaseChain({ data: { id: 'pay-1' }, error: null }));

      const result = await service.applyFreeUpgrade(
        'brand-1',
        'PRO',
        1,
        150000,
        250000,
        'FREE-UPGRADE-REF',
        forcedEndDate
      );

      expect(result.subscription_end_date).toBe(forcedEndDate);
      expect((supabaseAdmin.from as jest.Mock).mock.calls[0][0]).toBe('brands');
    });
  });

  // ─── reactivateSubscription ───────────────────────────────────────────────

  describe('reactivateSubscription', () => {
    it('debe cambiar el estado a "active"', async () => {
      const futureDate = new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString();
      (supabaseAdmin.from as jest.Mock)
        .mockReturnValueOnce(
          mockSupabaseChain({
            data: {
              id: 'brand-1',
              landing_suspended_at: null,
              has_landing_page: false,
              trial_end_date: null,
              subscription_end_date: futureDate,
            },
            error: null,
          })
        )
        .mockReturnValueOnce(
          mockSupabaseChain({ data: { id: 'brand-1', subscription_status: 'active' }, error: null })
        );
      const result = await service.reactivateSubscription('brand-1');
      expect(result.subscription_status).toBe('active');
    });

    it('debe lanzar error si falla la consulta inicial', async () => {
      (supabaseAdmin.from as jest.Mock).mockReturnValue(
        mockSupabaseChain({ data: null, error: { message: 'DB error' } })
      );
      await expect(service.reactivateSubscription('brand-1')).rejects.toThrow(
        'Marca no encontrada'
      );
    });
  });

  // ─── getExpiringSubscriptions ─────────────────────────────────────────────

  describe('getExpiringSubscriptions', () => {
    it('debe retornar lista de marcas que vencen en los próximos N días', async () => {
      const brands = [
        { id: 'brand-1', subscription_end_date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString() },
        { id: 'brand-2', subscription_end_date: new Date(Date.now() + 6 * 24 * 60 * 60 * 1000).toISOString() },
      ];
      (supabaseAdmin.from as jest.Mock).mockReturnValue(
        mockSupabaseChainList({ data: brands, error: null })
      );
      const result = await service.getExpiringSubscriptions(7);
      expect(result).toHaveLength(2);
    });

    it('debe retornar lista vacía si no hay suscripciones por vencer', async () => {
      (supabaseAdmin.from as jest.Mock).mockReturnValue(
        mockSupabaseChainList({ data: [], error: null })
      );
      const result = await service.getExpiringSubscriptions(7);
      expect(result).toHaveLength(0);
    });

    it('debe lanzar error si falla la consulta', async () => {
      (supabaseAdmin.from as jest.Mock).mockReturnValue(
        mockSupabaseChainList({ data: null, error: { message: 'DB error' } })
      );
      await expect(service.getExpiringSubscriptions(7)).rejects.toThrow(
        'Error al obtener suscripciones por vencer'
      );
    });
  });
});
