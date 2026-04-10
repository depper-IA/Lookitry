/**
 * Tests para el script de verificación diaria de suscripciones
 */

// Mocks deben declararse ANTES de cualquier import del módulo bajo test
const mockUpdateSubscriptionStatuses = jest.fn();
const mockGetExpiringSubscriptions = jest.fn().mockResolvedValue([]);
const mockSendExpirationReminder = jest.fn().mockResolvedValue(undefined);
const mockSendSuspensionNotice = jest.fn().mockResolvedValue(undefined);

jest.mock('../../services/subscription.service', () => ({
  SubscriptionService: jest.fn().mockImplementation(() => ({
    updateSubscriptionStatuses: mockUpdateSubscriptionStatuses,
    getExpiringSubscriptions: mockGetExpiringSubscriptions,
  })),
}));

jest.mock('../../services/notification.service', () => ({
  notificationService: {
    sendExpirationReminder: mockSendExpirationReminder,
    sendSuspensionNotice: mockSendSuspensionNotice,
  },
}));

jest.mock('../../config/supabase', () => ({
  supabase: { from: jest.fn() },
  supabaseAdmin: {
    from: jest.fn().mockReturnValue({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockResolvedValue({ data: [], error: null }),
    }),
  },
}));

// Importar DESPUÉS de los mocks
import { runDailySubscriptionCheck } from '../daily-subscription-check';

describe('daily-subscription-check', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Restablecer defaults después de clearAllMocks
    mockGetExpiringSubscriptions.mockResolvedValue([]);
    mockSendExpirationReminder.mockResolvedValue(undefined);
    mockSendSuspensionNotice.mockResolvedValue(undefined);
  });

  describe('runDailySubscriptionCheck', () => {
    it('debe actualizar estados y retornar resumen con notificaciones', async () => {
      mockUpdateSubscriptionStatuses.mockResolvedValue({
        expired: 2,
        expiringSoon: 3,
        suspended: 1,
      });

      const result = await runDailySubscriptionCheck();

      expect(mockUpdateSubscriptionStatuses).toHaveBeenCalledTimes(1);
      expect(result.expired).toBe(2);
      expect(result.expiringSoon).toBe(3);
      expect(result.suspended).toBe(1);
      expect(result.notifications).toBeDefined();
    });

    it('debe consultar suscripciones que vencen en 7, 3 y 0 días', async () => {
      mockUpdateSubscriptionStatuses.mockResolvedValue({
        expired: 0,
        expiringSoon: 0,
        suspended: 0,
      });

      await runDailySubscriptionCheck();

      expect(mockGetExpiringSubscriptions).toHaveBeenCalledWith(7);
      expect(mockGetExpiringSubscriptions).toHaveBeenCalledWith(3);
      expect(mockGetExpiringSubscriptions).toHaveBeenCalledWith(0);
    });

    it('debe retornar 0 notificaciones cuando no hay marcas que notificar', async () => {
      mockUpdateSubscriptionStatuses.mockResolvedValue({
        expired: 0,
        expiringSoon: 0,
        suspended: 0,
      });
      mockGetExpiringSubscriptions.mockResolvedValue([]);

      const result = await runDailySubscriptionCheck();

      expect(result.notifications.total).toBe(0);
      expect(result.notifications.reminder7Days).toBe(0);
      expect(result.notifications.reminder3Days).toBe(0);
      expect(result.notifications.expirationToday).toBe(0);
      expect(result.notifications.suspension).toBe(0);
    });

    it('debe propagar errores críticos del SubscriptionService', async () => {
      mockUpdateSubscriptionStatuses.mockRejectedValue(
        new Error('Error crítico en base de datos')
      );

      await expect(runDailySubscriptionCheck()).rejects.toThrow('Error crítico en base de datos');
    });

    it('debe continuar aunque falle el envío de notificaciones individuales', async () => {
      mockUpdateSubscriptionStatuses.mockResolvedValue({
        expired: 0,
        expiringSoon: 1,
        suspended: 0,
      });

      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 7);

      mockGetExpiringSubscriptions.mockResolvedValue([
        {
          id: 'brand-1',
          email: 'brand@test.com',
          name: 'Test Brand',
          subscription_end_date: futureDate.toISOString(),
        },
      ]);

      mockSendExpirationReminder.mockRejectedValue(new Error('Error de email'));

      // No debe lanzar error — el proceso continúa aunque falle la notificación
      const result = await runDailySubscriptionCheck();
      expect(result.notifications).toBeDefined();
    });
  });
});
