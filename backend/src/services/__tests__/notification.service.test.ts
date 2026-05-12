import { NotificationService } from '../notification.service';

import { emailService } from '../email.service';

import { SubscriptionService } from '../subscription.service';

import { Brand } from '../../types';



// Mock de EmailService

jest.mock('../email.service', () => ({

  emailService: {

    sendEmail: jest.fn(),

  },

}));



// Mock de supabaseAdmin

jest.mock('../../config/supabase', () => ({

  supabaseAdmin: {

    from: jest.fn().mockImplementation(() => ({

      select: jest.fn().mockReturnThis(),

      eq: jest.fn().mockReturnThis(),

      single: jest.fn().mockResolvedValue({ 

        data: { data: { precio_mensual_cop: 150000 } }, 

        error: null 

      }),

    })),

  },

}));



jest.mock('../paymentSettings.service', () => ({

  PaymentSettingsService: jest.fn().mockImplementation(() => ({

    getSettings: jest.fn().mockResolvedValue({ landing_price: 650000 }),

  })),

}));



// Mock de SubscriptionService

jest.mock('../subscription.service');



// Mock de NotificationPreferencesService

jest.mock('../notificationPreferences.service', () => ({

  notificationPreferencesService: {

    isNotificationEnabled: jest.fn().mockResolvedValue(true),

  },

}));



describe('NotificationService', () => {

  let notificationService: NotificationService;

  let mockBrand: Brand;



  beforeEach(() => {

    notificationService = new NotificationService();

    

    // Mock brand data

    mockBrand = {

      id: 'test-brand-id',

      email: 'test@example.com',

      name: 'Test Brand',

      slug: 'test-brand',

      plan: 'BASIC',

      password: 'hashed-password',

      logo: null,

      api_key: null,

      primary_color: '#000000',

      secondary_color: '#ffffff',

      header_color: null,

      custom_domain: null,

      widget_template: null,

      button_text: null,

      welcome_message: null,

      trial_end_date: null,

      trial_generations_limit: 10,

      created_at: new Date().toISOString(),

      updated_at: new Date().toISOString(),

      subscription_status: 'active',

      subscription_start_date: new Date().toISOString(),

      subscription_end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),

      last_payment_date: new Date().toISOString(),

      next_payment_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),

    };



    // Clear all mocks

    jest.clearAllMocks();



    // Mock getDaysRemaining

    (SubscriptionService.prototype.getDaysRemaining as jest.Mock) = jest.fn().mockResolvedValue(30);

    (SubscriptionService.prototype.getSubscriptionInfo as jest.Mock) = jest.fn().mockResolvedValue({

      status: 'active',

      startDate: new Date().toISOString(),

      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),

      lastPaymentDate: new Date().toISOString(),

      nextPaymentDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),

      daysRemaining: 30,

    });

  });



  describe('sendWelcomeEmail', () => {

    it('should send welcome email with correct data', async () => {

      await notificationService.sendWelcomeEmail(mockBrand);



      expect(emailService.sendEmail).toHaveBeenCalledTimes(1);

      expect(emailService.sendEmail).toHaveBeenCalledWith(

        expect.objectContaining({

          to: mockBrand.email,

          subject: '¡Bienvenido a Lookitry!',

          html: expect.stringContaining(mockBrand.name),

        })

      );

    });



    it('should format BASIC plan amount correctly', async () => {

      await notificationService.sendWelcomeEmail(mockBrand);



      const callArgs = (emailService.sendEmail as jest.Mock).mock.calls[0][0];

      expect(callArgs.html).toContain('$150.000 COP');

    });



    it('should format PRO plan amount correctly', async () => {

      mockBrand.plan = 'PRO';

      await notificationService.sendWelcomeEmail(mockBrand);



      const callArgs = (emailService.sendEmail as jest.Mock).mock.calls[0][0];

      expect(callArgs.html).toContain('$250.000 COP');

    });

  });



  describe('sendCompleteRegistrationEmail', () => {

    it('should send resume email with onboarding-post-pago link for paid pending registration', async () => {

      await notificationService.sendCompleteRegistrationEmail({

        email: mockBrand.email,

        reference: 'PAYPAL-visitor_123-M1-PBASIC-123',

        plan: 'BASIC',

        amount: 180000,

      });



      expect(emailService.sendEmail).toHaveBeenCalledWith(

        expect.objectContaining({

          to: mockBrand.email,

          subject: 'Completa tu registro en Lookitry',

          html: expect.stringContaining('/onboarding-post-pago?ref=PAYPAL-visitor_123-M1-PBASIC-123'),

        })

      );

    });



    it('should not send resume email for trial pending registration', async () => {

      await notificationService.sendCompleteRegistrationEmail({

        email: mockBrand.email,

        reference: 'GUEST-TRIAL-visitor_123',

        plan: 'TRIAL',

      });



      expect(emailService.sendEmail).not.toHaveBeenCalled();

    });



    it('should send delayed reminder email with reminder subject', async () => {

      await notificationService.sendCompleteRegistrationReminderEmail({

        email: mockBrand.email,

        reference: 'PAYPAL-visitor_123-M1-PPRO-123',

        plan: 'PRO',

        amount: 250000,

      });



      expect(emailService.sendEmail).toHaveBeenCalledWith(

        expect.objectContaining({

          to: mockBrand.email,

          subject: 'Recordatorio: completa tu registro en Lookitry',

          html: expect.stringContaining('Recordatorio: termina tu registro'),

        })

      );

    });

  });



  describe('sendExpirationReminder', () => {

    it('should send 7-day reminder with correct subject', async () => {

      await notificationService.sendExpirationReminder(mockBrand, 7);



      expect(emailService.sendEmail).toHaveBeenCalledWith(

        expect.objectContaining({

          to: mockBrand.email,

          subject: 'Recordatorio: Tu suscripción vence en 7 días',

        })

      );

    });



    it('should send 3-day reminder with urgent subject', async () => {

      await notificationService.sendExpirationReminder(mockBrand, 3);



      expect(emailService.sendEmail).toHaveBeenCalledWith(

        expect.objectContaining({

          to: mockBrand.email,

          subject: 'â ï¸ Urgente: Tu suscripción vence en 3 días',

        })

      );

    });



    it('should send expiration today notice', async () => {

      await notificationService.sendExpirationReminder(mockBrand, 0);



      expect(emailService.sendEmail).toHaveBeenCalledWith(

        expect.objectContaining({

          to: mockBrand.email,

          subject: 'ð¨ Tu suscripción vence hoy',

        })

      );

    });



    it('should handle custom days remaining', async () => {

      await notificationService.sendExpirationReminder(mockBrand, 5);



      expect(emailService.sendEmail).toHaveBeenCalledWith(

        expect.objectContaining({

          to: mockBrand.email,

          subject: 'Recordatorio: Tu suscripción vence en 5 días',

        })

      );

    });

  });



  describe('sendSuspensionNotice', () => {

    it('should send suspension notice', async () => {

      await notificationService.sendSuspensionNotice(mockBrand);



      expect(emailService.sendEmail).toHaveBeenCalledWith(

        expect.objectContaining({

          to: mockBrand.email,

          subject: 'Cuenta Suspendida - Acción Requerida',

          html: expect.stringContaining(mockBrand.name),

        })

      );

    });

  });



  describe('sendRenewalConfirmation', () => {

    it('should send renewal confirmation', async () => {

      await notificationService.sendRenewalConfirmation(mockBrand);



      expect(emailService.sendEmail).toHaveBeenCalledWith(

        expect.objectContaining({

          to: mockBrand.email,

          subject: 'â Renovación Exitosa - Lookitry',

          html: expect.stringContaining(mockBrand.name),

        })

      );

    });

  });



  describe('sendUsageAlert', () => {

    it('should send 80% usage alert', async () => {

      await notificationService.sendUsageAlert(mockBrand, 80, 320, 400);



      expect(emailService.sendEmail).toHaveBeenCalledWith(

        expect.objectContaining({

          to: mockBrand.email,

          subject: 'â ï¸ Alerta: Has usado el 80% de tus generaciones',

        })

      );

    });



    it('should send 100% usage alert', async () => {

      await notificationService.sendUsageAlert(mockBrand, 100, 400, 400);



      expect(emailService.sendEmail).toHaveBeenCalledWith(

        expect.objectContaining({

          to: mockBrand.email,

          subject: 'ð« Límite de Generaciones Alcanzado',

        })

      );

    });



    it('should handle custom percentage', async () => {

      await notificationService.sendUsageAlert(mockBrand, 90, 360, 400);



      expect(emailService.sendEmail).toHaveBeenCalledWith(

        expect.objectContaining({

          to: mockBrand.email,

          subject: 'â ï¸ Alerta: Has usado el 90% de tus generaciones',

        })

      );

    });

  });



  describe('error handling', () => {

    it('should NOT throw if email service fails (email nunca debe bloquear el flujo)', async () => {

      (emailService.sendEmail as jest.Mock).mockRejectedValueOnce(new Error('Email service error'));



      await expect(notificationService.sendWelcomeEmail(mockBrand)).resolves.toBeUndefined();

    });



    it('should log error when sending welcome email fails', async () => {

      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

      (emailService.sendEmail as jest.Mock).mockRejectedValueOnce(new Error('Test error'));



      // Notese que sendWelcomeEmail en realidad no relanza el error, solo lo loguea

      // segun la implementacion actual, o tal vez el test espera que si.

      // Re-revisando NotificationService.ts...

      await notificationService.sendWelcomeEmail(mockBrand);

      

      expect(consoleErrorSpy).toHaveBeenCalled();

      consoleErrorSpy.mockRestore();

    });

  });

});

