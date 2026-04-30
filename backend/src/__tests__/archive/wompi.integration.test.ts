// Feature: virtual-tryon-saas, Integration Tests: Flujo de pagos Wompi

// Requirements: 11 (Opción A)



import crypto from 'crypto';

import { WompiService } from '../services/wompi.service';

import { Request, Response } from 'express';



// âââ Mocks ââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââ

//

// jest.mock se eleva antes de cualquier declaración de variable (hoisting).

// Por eso usamos jest.fn() directamente en los factories y recuperamos

// las referencias DESPUÑS de los imports.



jest.mock('../services/subscription.service', () => ({

  SubscriptionService: jest.fn().mockImplementation(() => ({

    renewSubscription: jest.fn().mockResolvedValue({ id: 'brand-id' }),

  })),

}));



jest.mock('../services/wompi.service', () => {

  const actual = jest.requireActual('../services/wompi.service');

  return {

    WompiService: actual.WompiService,

    wompiService: {

      verifyWebhookSignature: jest.fn(),

      extractBrandIdFromReference: jest.fn(),

      extractMetaFromReference: jest.fn(),

      getWidgetConfig: jest.fn(),

      generateIntegritySignature: jest.fn(),

      checkIdempotency: jest.fn().mockResolvedValue({ alreadyProcessed: false }),

      enabled: true,

    },

  };

});



jest.mock('../config/supabase', () => {
  const mockInsert = jest.fn().mockResolvedValue({ error: null });
  const mockSelect = jest.fn().mockReturnThis();
  const mockEq = jest.fn().mockReturnThis();
  const mockUpdate = jest.fn().mockReturnThis();
  const mockSingle = jest.fn().mockResolvedValue({ data: { plan: 'BASIC' }, error: null });
  const mockMaybeSingle = jest.fn().mockResolvedValue({ data: null, error: null });

  const mockFrom = jest.fn().mockImplementation((table: string) => {
    if (table === 'payment_logs') {
      return { insert: mockInsert };
    }
    return {
      insert: mockInsert,
      select: mockSelect,
      eq: mockEq,
      update: mockUpdate,
      single: mockSingle,
      maybeSingle: mockMaybeSingle,
    };
  });

  return {
    supabase: {},
    supabaseAdmin: {
      from: mockFrom,
      _mocks: { mockInsert, mockSelect, mockEq, mockUpdate, mockSingle, mockMaybeSingle },
    },
  };
});

// Re-assign module-level mocks to point to the ones inside the factory
const { supabaseAdmin } = jest.requireMock('../config/supabase');
const mockFrom = supabaseAdmin.from;
const { mockSelect, mockEq, mockUpdate, mockSingle } = supabaseAdmin._mocks;



jest.mock('../services/paymentSettings.service', () => ({

  PaymentSettingsService: jest.fn().mockImplementation(() => ({

    getSettings: jest.fn().mockImplementation(() =>

      Promise.resolve({

        wompi_test_mode: true,

        wompi_public_key: process.env.WOMPI_PUBLIC_KEY || 'pub_test_key',

        wompi_private_key: 'prv_test_key',

        wompi_events_secret: process.env.WOMPI_EVENTS_SECRET || '',

        wompi_integrity_secret: process.env.WOMPI_INTEGRITY_SECRET || '',

        wompi_prod_public_key: '',

        wompi_prod_private_key: '',

        wompi_prod_events_secret: '',

        wompi_prod_integrity_secret: '',

      })

    ),

  })),

}));



jest.mock('../services/notification.service', () => ({

  NotificationService: jest.fn().mockImplementation(() => ({

    sendRenewalConfirmation: jest.fn().mockResolvedValue(undefined),

  })),

}));



jest.mock('../services/email.service', () => ({

  EmailService: jest.fn().mockImplementation(() => ({

    sendEmail: jest.fn().mockResolvedValue(undefined),

  })),

}));



jest.mock('../templates/email-templates', () => ({

  verifyEmailTemplate: jest.fn().mockReturnValue('<html>email</html>'),

}));



// Importar DESPUÑS de los mocks

import { WompiController } from '../controllers/wompi.controller';

import { wompiService } from '../services/wompi.service';

import { SubscriptionService } from '../services/subscription.service';



// âââ Helpers ââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââ



const EVENTS_SECRET = 'test-events-secret';

const INTEGRITY_SECRET = 'test-integrity-secret';

const BRAND_ID = '550e8400-e29b-41d4-a716-446655440000';



function buildChecksum(payload: string, secret: string): string {

  return crypto.createHash('sha256').update(payload + secret).digest('hex');

}



/**

 * Construye una referencia en el nuevo formato:

 * TRYON-{brandId}-M{months}-P{plan}-{timestamp}

 */

function buildReference(brandId: string, months = 1, plan = 'BASIC'): string {

  return `TRYON-${brandId}-M${months}-P${plan}-${Date.now()}`;

}



function buildTransactionEvent(

  status: string,

  reference: string,

  amountInCents = 15000000

) {

  return {

    event: 'transaction.updated',

    data: {

      transaction: { id: 'txn-test', status, reference, amount_in_cents: amountInCents, currency: 'COP' },

    },

  };

}



function buildReqRes(body: unknown, headers: Record<string, string> = {}) {

  const req = { body, headers, query: {} } as unknown as Request;

  const res = {

    status: jest.fn().mockReturnThis(),

    json: jest.fn().mockReturnThis(),

  } as unknown as Response;

  return { req, res };

}



// âââ WompiService (instancia real, sin mocks de módulo) ââââââââââââââââââââââ



describe('WompiService', () => {

  let service: WompiService;



  beforeEach(() => {

    process.env.WOMPI_EVENTS_SECRET = EVENTS_SECRET;

    process.env.WOMPI_INTEGRITY_SECRET = INTEGRITY_SECRET;

    process.env.WOMPI_PUBLIC_KEY = 'pub_test_key';

    process.env.WOMPI_ENABLED = 'true';

    service = new WompiService();

  });



  describe('verifyWebhookSignature', () => {

    it('acepta firma válida', async () => {

      const payload = JSON.stringify({ event: 'transaction.updated' });

      const checksum = buildChecksum(payload, EVENTS_SECRET);

      expect(await service.verifyWebhookSignature(payload, checksum)).toBe(true);

    });



    it('rechaza firma inválida', async () => {

      const payload = JSON.stringify({ event: 'transaction.updated' });

      expect(await service.verifyWebhookSignature(payload, 'firma-incorrecta')).toBe(false);

    });



    it('rechaza cuando no hay events secret configurado', async () => {

      process.env.WOMPI_EVENTS_SECRET = '';

      const svc = new WompiService();

      const checksum = buildChecksum('{}', EVENTS_SECRET);

      expect(await svc.verifyWebhookSignature('{}', checksum)).toBe(false);

    });



    it('rechaza payload alterado aunque el checksum sea de otro payload', async () => {

      const original = JSON.stringify({ amount: 100 });

      const checksum = buildChecksum(original, EVENTS_SECRET);

      expect(await service.verifyWebhookSignature(JSON.stringify({ amount: 999 }), checksum)).toBe(false);

    });

  });



  describe('extractBrandIdFromReference', () => {

    it('extrae brandId de referencia en formato nuevo', () => {

      const reference = buildReference(BRAND_ID, 1, 'BASIC');

      expect(service.extractBrandIdFromReference(reference)).toBe(BRAND_ID);

    });



    it('extrae brandId de referencia en formato legacy', () => {

      const reference = `TRYON-${BRAND_ID}-${Date.now()}`;

      expect(service.extractBrandIdFromReference(reference)).toBe(BRAND_ID);

    });



    it('retorna null para referencia sin prefijo TRYON', () => {

      expect(service.extractBrandIdFromReference('OTRO-uuid-123')).toBeNull();

    });



    it('retorna null para referencia vacía', () => {

      expect(service.extractBrandIdFromReference('')).toBeNull();

    });



    it('retorna null para referencia con solo dos partes', () => {

      expect(service.extractBrandIdFromReference('TRYON-sinTimestamp')).toBeNull();

    });

  });



  describe('extractMetaFromReference', () => {

    it('extrae months y plan del formato nuevo', () => {

      const reference = buildReference(BRAND_ID, 3, 'PRO');

      const meta = service.extractMetaFromReference(reference);

      expect(meta.months).toBe(3);

      expect(meta.plan).toBe('PRO');

    });



    it('retorna defaults para formato legacy', () => {

      const reference = `TRYON-${BRAND_ID}-${Date.now()}`;

      const meta = service.extractMetaFromReference(reference);

      expect(meta.months).toBe(1);

      expect(meta.plan).toBe('BASIC');

    });

  });



  describe('generateIntegritySignature', () => {

    it('genera firma SHA256 determinista', async () => {

      const sig1 = await service.generateIntegritySignature('REF-001', 15000000, 'COP');

      const sig2 = await service.generateIntegritySignature('REF-001', 15000000, 'COP');

      expect(sig1).toBe(sig2);

      expect(sig1).toHaveLength(64);

    });



    it('produce firmas distintas para referencias distintas', async () => {

      const sig1 = await service.generateIntegritySignature('REF-001', 15000000, 'COP');

      const sig2 = await service.generateIntegritySignature('REF-002', 15000000, 'COP');

      expect(sig1).not.toBe(sig2);

    });



    it('produce firmas distintas para montos distintos', async () => {

      const sig1 = await service.generateIntegritySignature('REF-001', 15000000, 'COP');

      const sig2 = await service.generateIntegritySignature('REF-001', 25000000, 'COP');

      expect(sig1).not.toBe(sig2);

    });

  });



  describe('generateReference', () => {

    it('genera referencia con formato TRYON-{brandId}-M{n}-P{plan}-{timestamp}', () => {

      const ref = service.generateReference(BRAND_ID, 1, 'BASIC');

      expect(ref).toMatch(/^TRYON-.+-M\d+-P[A-Z]+-\d+$/);

      expect(ref).toContain(BRAND_ID);

    });

  });

});



// âââ WompiController.handleWebhook âââââââââââââââââââââââââââââââââââââââââââ



describe('WompiController.handleWebhook', () => {

  const mockedWompi = wompiService as jest.Mocked<typeof wompiService>;

  const MockedSS = SubscriptionService as jest.MockedClass<typeof SubscriptionService>;



  let renewMock: jest.Mock;



  beforeAll(() => {

    const instance = MockedSS.mock.results[0]?.value;

    renewMock = instance?.renewSubscription as jest.Mock;

  });



  beforeEach(() => {

    mockedWompi.verifyWebhookSignature.mockReset();

    mockedWompi.extractBrandIdFromReference.mockReset();

    mockedWompi.extractMetaFromReference.mockReset();

    renewMock?.mockReset();



    // Defaults: firma válida, brandId correcto, meta correcta, renovación exitosa

    mockedWompi.verifyWebhookSignature.mockResolvedValue(true);

    mockedWompi.extractBrandIdFromReference.mockReturnValue(BRAND_ID);

    mockedWompi.extractMetaFromReference.mockReturnValue({ months: 1, plan: 'BASIC', includesLanding: false });

    renewMock?.mockResolvedValue({ id: BRAND_ID });



    // Resetear el mock de supabaseAdmin para la query de brands.plan

    mockFrom.mockReturnThis();

    mockSelect.mockReturnThis();

    mockUpdate.mockReturnThis();

    mockEq.mockReturnThis();

    // El controller query brands para detectar upgrade: devolver plan BASIC (no upgrade)

    mockSingle.mockResolvedValue({ data: { plan: 'BASIC', email: 'test@example.com', name: 'Test Brand', subscription_end_date: null }, error: null });

  });



  describe('Pago exitoso (APPROVED)', () => {

    it('renueva la suscripción y responde 200', async () => {

      const controller = new WompiController();

      const reference = buildReference(BRAND_ID);

      const event = buildTransactionEvent('APPROVED', reference);

      const { req, res } = buildReqRes(event, { 'x-event-checksum': 'valid' });



      await controller.handleWebhook(req, res);



      expect(renewMock).toHaveBeenCalledWith(

        BRAND_ID,

        expect.objectContaining({

          brand_id: BRAND_ID,

          currency: 'COP',

          payment_method: 'wompi',

          status: 'completed',

          reference,

        }),

        expect.any(Number),

        expect.any(String),

        expect.any(Boolean)

      );

      expect(res.status).toHaveBeenCalledWith(200);

      expect(res.json).toHaveBeenCalledWith({ received: true });

    });



    it('convierte amount_in_cents a COP (150000 COP = 15000000 centavos)', async () => {

      const controller = new WompiController();

      const event = buildTransactionEvent('APPROVED', buildReference(BRAND_ID), 15000000);

      const { req, res } = buildReqRes(event, { 'x-event-checksum': 'valid' });



      await controller.handleWebhook(req, res);



      expect(renewMock).toHaveBeenCalledWith(

        BRAND_ID,

        expect.objectContaining({ amount: 150000 }),

        expect.any(Number),

        expect.any(String),

        expect.any(Boolean)

      );

    });



    it('convierte amount_in_cents a COP (250000 COP = 25000000 centavos)', async () => {

      const controller = new WompiController();

      const event = buildTransactionEvent('APPROVED', buildReference(BRAND_ID), 25000000);

      const { req, res } = buildReqRes(event, { 'x-event-checksum': 'valid' });



      await controller.handleWebhook(req, res);



      expect(renewMock).toHaveBeenCalledWith(

        BRAND_ID,

        expect.objectContaining({ amount: 250000 }),

        expect.any(Number),

        expect.any(String),

        expect.any(Boolean)

      );

    });



    it('procesa body como Buffer (raw) correctamente', async () => {

      const controller = new WompiController();

      const event = buildTransactionEvent('APPROVED', buildReference(BRAND_ID));

      const { req, res } = buildReqRes(

        Buffer.from(JSON.stringify(event)),

        { 'x-event-checksum': 'valid' }

      );



      await controller.handleWebhook(req, res);



      expect(renewMock).toHaveBeenCalledTimes(1);

      expect(res.status).toHaveBeenCalledWith(200);

    });



    it('incluye la referencia en las notas del pago', async () => {

      const controller = new WompiController();

      const reference = buildReference(BRAND_ID);

      const event = buildTransactionEvent('APPROVED', reference);

      const { req, res } = buildReqRes(event, { 'x-event-checksum': 'valid' });



      await controller.handleWebhook(req, res);



      expect(renewMock).toHaveBeenCalledWith(

        BRAND_ID,

        expect.objectContaining({ notes: expect.stringContaining(reference) }),

        expect.any(Number),

        expect.any(String),

        expect.any(Boolean)

      );

    });

  });



  describe('Pago fallido / rechazado', () => {

    it('no renueva suscripción cuando status es DECLINED', async () => {

      const controller = new WompiController();

      const event = buildTransactionEvent('DECLINED', buildReference(BRAND_ID));

      const { req, res } = buildReqRes(event, { 'x-event-checksum': 'valid' });



      await controller.handleWebhook(req, res);



      expect(renewMock).not.toHaveBeenCalled();

      expect(res.status).toHaveBeenCalledWith(200);

      expect(res.json).toHaveBeenCalledWith({ received: true });

    });



    it('no renueva suscripción cuando status es VOIDED', async () => {

      const controller = new WompiController();

      const event = buildTransactionEvent('VOIDED', buildReference(BRAND_ID));

      const { req, res } = buildReqRes(event, { 'x-event-checksum': 'valid' });



      await controller.handleWebhook(req, res);



      expect(renewMock).not.toHaveBeenCalled();

      expect(res.status).toHaveBeenCalledWith(200);

    });



    it('no renueva suscripción cuando status es ERROR', async () => {

      const controller = new WompiController();

      const event = buildTransactionEvent('ERROR', buildReference(BRAND_ID));

      const { req, res } = buildReqRes(event, { 'x-event-checksum': 'valid' });



      await controller.handleWebhook(req, res);



      expect(renewMock).not.toHaveBeenCalled();

    });



    it('responde 200 aunque renewSubscription lance error (evita reintentos de Wompi)', async () => {

      renewMock.mockRejectedValue(new Error('DB error'));

      const controller = new WompiController();

      const event = buildTransactionEvent('APPROVED', buildReference(BRAND_ID));

      const { req, res } = buildReqRes(event, { 'x-event-checksum': 'valid' });



      await controller.handleWebhook(req, res);



      expect(res.status).toHaveBeenCalledWith(200);

      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ received: true }));

    });

  });



  describe('Seguridad - verificación de firma', () => {

    it('rechaza webhook sin header x-event-checksum (401)', async () => {

      mockedWompi.verifyWebhookSignature.mockResolvedValue(false);

      const controller = new WompiController();

      const event = buildTransactionEvent('APPROVED', buildReference(BRAND_ID));

      const { req, res } = buildReqRes(event, {});



      await controller.handleWebhook(req, res);



      expect(res.status).toHaveBeenCalledWith(401);

      expect(renewMock).not.toHaveBeenCalled();

    });



    it('rechaza webhook con firma incorrecta (401)', async () => {

      mockedWompi.verifyWebhookSignature.mockResolvedValue(false);

      const controller = new WompiController();

      const event = buildTransactionEvent('APPROVED', buildReference(BRAND_ID));

      const { req, res } = buildReqRes(event, { 'x-event-checksum': 'firma-falsa' });



      await controller.handleWebhook(req, res);



      expect(res.status).toHaveBeenCalledWith(401);

      expect(renewMock).not.toHaveBeenCalled();

    });



    it('no procesa el pago si la firma falla aunque el evento sea APPROVED', async () => {

      mockedWompi.verifyWebhookSignature.mockResolvedValue(false);

      const controller = new WompiController();

      const event = buildTransactionEvent('APPROVED', buildReference(BRAND_ID), 15000000);

      const { req, res } = buildReqRes(event, { 'x-event-checksum': 'invalido' });



      await controller.handleWebhook(req, res);



      expect(renewMock).not.toHaveBeenCalled();

      expect(res.status).toHaveBeenCalledWith(401);

    });

  });



  describe('Eventos no relevantes', () => {

    it('ignora eventos que no son transaction.updated', async () => {

      const controller = new WompiController();

      const event = { event: 'payment_link.paid', data: {} };

      const { req, res } = buildReqRes(event, { 'x-event-checksum': 'valid' });



      await controller.handleWebhook(req, res);



      expect(renewMock).not.toHaveBeenCalled();

      expect(res.status).toHaveBeenCalledWith(200);

    });



    it('ignora referencia con formato inválido sin lanzar error', async () => {

      mockedWompi.extractBrandIdFromReference.mockReturnValue(null);

      const controller = new WompiController();

      const event = buildTransactionEvent('APPROVED', 'REFERENCIA-INVALIDA');

      const { req, res } = buildReqRes(event, { 'x-event-checksum': 'valid' });



      await controller.handleWebhook(req, res);



      expect(renewMock).not.toHaveBeenCalled();

      expect(res.status).toHaveBeenCalledWith(200);

    });

  });



  describe('Idempotencia de webhook', () => {

    it('NO llama renewSubscription si checkIdempotency indica ya procesado (subscription_payments)', async () => {

      mockedWompi.checkIdempotency.mockResolvedValueOnce({

        alreadyProcessed: true,

        existingPaymentId: 'pay-123',

        reason: 'subscription_payments: pago completado (id=pay-123)',

      });

      const controller = new WompiController();

      const event = buildTransactionEvent('APPROVED', buildReference(BRAND_ID));

      const { req, res } = buildReqRes(event, { 'x-event-checksum': 'valid' });



      await controller.handleWebhook(req, res);



      expect(mockedWompi.checkIdempotency).toHaveBeenCalledWith(

        expect.any(String),

        BRAND_ID

      );

      expect(renewMock).not.toHaveBeenCalled();

      expect(res.status).toHaveBeenCalledWith(200);

      expect(res.json).toHaveBeenCalledWith({ received: true });

    });



    it('SÑ llama renewSubscription cuando checkIdempotency indica no procesado', async () => {

      mockedWompi.checkIdempotency.mockResolvedValueOnce({ alreadyProcessed: false });

      const controller = new WompiController();

      const event = buildTransactionEvent('APPROVED', buildReference(BRAND_ID));

      const { req, res } = buildReqRes(event, { 'x-event-checksum': 'valid' });



      await controller.handleWebhook(req, res);



      expect(mockedWompi.checkIdempotency).toHaveBeenCalledWith(

        expect.any(String),

        BRAND_ID

      );

      expect(renewMock).toHaveBeenCalledTimes(1);

      expect(res.status).toHaveBeenCalledWith(200);

    });



    it('registra evento idempotency_detected cuando ya fue procesado', async () => {

      mockedWompi.checkIdempotency.mockResolvedValueOnce({

        alreadyProcessed: true,

        existingPaymentId: 'pay-duplicate-456',

        reason: 'subscription_payments: pago completado (id=pay-duplicate-456)',

      });

      const controller = new WompiController();

      const reference = buildReference(BRAND_ID);

      const event = buildTransactionEvent('APPROVED', reference);

      const { req, res } = buildReqRes(event, { 'x-event-checksum': 'valid' });



      await controller.handleWebhook(req, res);



      expect(res.status).toHaveBeenCalledWith(200);

      // idempotency check pasó â early return â renewSubscription NO llamado

      expect(renewMock).not.toHaveBeenCalled();

    });



    it('NO procesa doble webhook si TRIAL ya está activo (trial_payment_status check)', async () => {

      mockedWompi.checkIdempotency.mockResolvedValueOnce({

        alreadyProcessed: true,

        reason: "TRIAL: trial_payment_status ya es 'active' para brand=existing-brand",

      });

      const controller = new WompiController();

      const trialRef = `TRIAL-existing-brand-${Date.now()}`;

      const event = buildTransactionEvent('APPROVED', trialRef);

      const { req, res } = buildReqRes(event, { 'x-event-checksum': 'valid' });



      await controller.handleWebhook(req, res);



      // No se intentó hacer update de brands porque el trial ya estaba activo

      expect(renewMock).not.toHaveBeenCalled();

      expect(res.status).toHaveBeenCalledWith(200);

    });

  });

});

