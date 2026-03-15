import { SubscriptionService } from '../subscription.service';
import { supabase, supabaseAdmin } from '../../config/supabase';

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
  single: jest.fn().mockResolvedValue(returnValue),
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
      (supabase.from as jest.Mock).mockReturnValue(
        mockSupabaseChain({ data: { subscription_status: 'active', trial_end_date: null }, error: null })
      );
      const result = await service.checkSubscriptionStatus('brand-1');
      expect(result).toBe(true);
    });

    it('debe retornar true si subscription_status es "expiring_soon"', async () => {
      (supabase.from as jest.Mock).mockReturnValue(
        mockSupabaseChain({ data: { subscription_status: 'expiring_soon', trial_end_date: null }, error: null })
      );
      const result = await service.checkSubscriptionStatus('brand-1');
      expect(result).toBe(true);
    });

    it('debe retornar false si subscription_status es "suspended"', async () => {
      (supabase.from as jest.Mock).mockReturnValue(
        mockSupabaseChain({ data: { subscription_status: 'suspended', trial_end_date: null }, error: null })
      );
      const result = await service.checkSubscriptionStatus('brand-1');
      expect(result).toBe(false);
    });

    it('debe retornar true si está en período de prueba activo', async () => {
      const futureDate = new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString();
      (supabase.from as jest.Mock).mockReturnValue(
        mockSupabaseChain({ data: { subscription_status: 'suspended', trial_end_date: futureDate }, error: null })
      );
      const result = await service.checkSubscriptionStatus('brand-1');
      expect(result).toBe(true);
    });

    it('debe retornar false si el trial ya venció', async () => {
      const pastDate = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      (supabase.from as jest.Mock).mockReturnValue(
        mockSupabaseChain({ data: { subscription_status: 'suspended', trial_end_date: pastDate }, error: null })
      );
      const result = await service.checkSubscriptionStatus('brand-1');
      expect(result).toBe(false);
    });

    it('debe retornar false si hay error de base de datos', async () => {
      (supabase.from as jest.Mock).mockReturnValue(
        mockSupabaseChain({ data: null, error: new Error('DB error') })
      );
      const result = await service.checkSubscriptionStatus('brand-1');
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
      (supabase.from as jest.Mock).mockReturnValue(
        mockSupabaseChain({ data: { subscription_end_date: futureDate }, error: null })
      );
      const result = await service.getDaysRemaining('brand-1');
      expect(result).toBeGreaterThan(0);
    });

    it('debe retornar null si no hay fecha de vencimiento', async () => {
      (supabase.from as jest.Mock).mockReturnValue(
        mockSupabaseChain({ data: { subscription_end_date: null }, error: null })
      );
      const result = await service.getDaysRemaining('brand-1');
      expect(result).toBeNull();
    });

    it('debe retornar valor negativo o cero si la suscripción ya venció', async () => {
      const pastDate = new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString();
      (supabase.from as jest.Mock).mockReturnValue(
        mockSupabaseChain({ data: { subscription_end_date: pastDate }, error: null })
      );
      const result = await service.getDaysRemaining('brand-1');
      expect(result).toBeLessThanOrEqual(0);
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

  // ─── reactivateSubscription ───────────────────────────────────────────────

  describe('reactivateSubscription', () => {
    it('debe cambiar el estado a "active"', async () => {
      const reactivatedBrand = { id: 'brand-1', subscription_status: 'active' };
      (supabaseAdmin.from as jest.Mock).mockReturnValue(
        mockSupabaseChain({ data: reactivatedBrand, error: null })
      );
      const result = await service.reactivateSubscription('brand-1');
      expect(result.subscription_status).toBe('active');
    });

    it('debe lanzar error si falla la actualización', async () => {
      (supabaseAdmin.from as jest.Mock).mockReturnValue(
        mockSupabaseChain({ data: null, error: { message: 'DB error' } })
      );
      await expect(service.reactivateSubscription('brand-1')).rejects.toThrow(
        'Error al reactivar la suscripción'
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
