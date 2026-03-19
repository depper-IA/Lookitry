// Feature: virtual-tryon-saas, Integration Tests: Flujo de pagos Wompi
// Requirements: 11 (Opción A)

import crypto from 'crypto';
import { WompiService } from '../services/wompi.service';
import { Request, Response } from 'express';

// ─── Mocks ────────────────────────────────────────────────────────────────────
//
// jest.mock se eleva antes de cualquier declaración de variable (hoisting).
// Por eso usamos jest.fn() directamente en los factories y recuperamos
// las referencias DESPUÉS de los imports.

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
      extractMetaFromReference: jest.fn(), // Añadido
      getWidgetConfig: jest.fn(),
      generateIntegritySignature: jest.fn(),
      enabled: true,
    },
  };
});

jest.mock('../config/supabase', () => ({
  supabase: {},
  supabaseAdmin: {
    from: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    single: jest.fn().mockResolvedValue({ data: {}, error: null }),
    maybeSingle: jest.fn().mockResolvedValue({ data: null, error: null }),
  },
}));

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

// Importar DESPUÉS de los mocks
import { WompiController } from '../controllers/wompi.controller';
import { wompiService } from '../services/wompi.service';
import { SubscriptionService } from '../services/subscription.service';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const EVENTS_SECRET = 'test-events-secret';
const INTEGRITY_SECRET = 'test-integrity-secret';
const BRAND_ID = '550e8400-e29b-41d4-a716-446655440000';

function buildChecksum(payload: string, secret: string): string {
  return crypto.createHash('sha256').update(payload + secret).digest('hex');
}

function buildTransactionEvent(
  status: string,
  reference: string,
  amountInCents = 15000000
) {
  return {
    event: 'transaction.updated',
    data: {
      transaction: { id: 'txn-test', status, reference, amount_in_cents: amountInCents },
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

// ─── WompiService (instancia real, sin mocks de módulo) ──────────────────────

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
    it('extrae brandId de referencia válida', () => {
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
    it('genera referencia con formato TRYON-{brandId}-{timestamp}', () => {
      const ref = service.generateReference(BRAND_ID);
      expect(ref).toMatch(/^TRYON-.+-\d+$/);
      expect(ref).toContain(BRAND_ID);
    });
  });
});

// ─── WompiController.handleWebhook ───────────────────────────────────────────
//
// El controlador ejecuta `const subscriptionService = new SubscriptionService()`
// a nivel de módulo (una sola vez al importar). El mock de SubscriptionService
// ya estaba activo en ese momento, así que mock.results[0].value es la instancia
// que usa el controlador. Obtenemos renewSubscription de ahí directamente.

describe('WompiController.handleWebhook', () => {
  const mockedWompi = wompiService as jest.Mocked<typeof wompiService>;
  const MockedSS = SubscriptionService as jest.MockedClass<typeof SubscriptionService>;

  // La instancia creada al importar el módulo del controlador
  // (índice 0 porque es la primera llamada al constructor mockeado)
  let renewMock: jest.Mock;

  beforeAll(() => {
    // Obtener la referencia a renewSubscription de la instancia del módulo.
    // Esto se hace en beforeAll porque la instancia ya existe desde el import.
    const instance = MockedSS.mock.results[0]?.value;
    renewMock = instance?.renewSubscription as jest.Mock;
  });

  beforeEach(() => {
    mockedWompi.verifyWebhookSignature.mockReset();
    mockedWompi.extractBrandIdFromReference.mockReset();
    mockedWompi.extractMetaFromReference.mockReset(); // Añadido
    renewMock?.mockReset();

    // Defaults: firma válida, brandId correcto, renovación exitosa
    mockedWompi.verifyWebhookSignature.mockResolvedValue(true);
    mockedWompi.extractBrandIdFromReference.mockReturnValue(BRAND_ID);
    mockedWompi.extractMetaFromReference.mockReturnValue({ months: 1, plan: 'BASIC' }); // Añadido
    renewMock?.mockResolvedValue({ id: BRAND_ID });
  });

  describe('Pago exitoso (APPROVED)', () => {
    it('renueva la suscripción y responde 200', async () => {
      const controller = new WompiController();
      const reference = `TRYON-${BRAND_ID}-${Date.now()}`;
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
        })
      );
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ received: true });
    });

    it('convierte amount_in_cents a COP (150000 COP = 15000000 centavos)', async () => {
      const controller = new WompiController();
      const event = buildTransactionEvent('APPROVED', `TRYON-${BRAND_ID}-1`, 15000000);
      const { req, res } = buildReqRes(event, { 'x-event-checksum': 'valid' });

      await controller.handleWebhook(req, res);

      expect(renewMock).toHaveBeenCalledWith(
        BRAND_ID,
        expect.objectContaining({ amount: 150000 })
      );
    });

    it('convierte amount_in_cents a COP (250000 COP = 25000000 centavos)', async () => {
      const controller = new WompiController();
      const event = buildTransactionEvent('APPROVED', `TRYON-${BRAND_ID}-2`, 25000000);
      const { req, res } = buildReqRes(event, { 'x-event-checksum': 'valid' });

      await controller.handleWebhook(req, res);

      expect(renewMock).toHaveBeenCalledWith(
        BRAND_ID,
        expect.objectContaining({ amount: 250000 })
      );
    });

    it('procesa body como Buffer (raw) correctamente', async () => {
      const controller = new WompiController();
      const event = buildTransactionEvent('APPROVED', `TRYON-${BRAND_ID}-3`);
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
      const reference = `TRYON-${BRAND_ID}-123456`;
      const event = buildTransactionEvent('APPROVED', reference);
      const { req, res } = buildReqRes(event, { 'x-event-checksum': 'valid' });

      await controller.handleWebhook(req, res);

      expect(renewMock).toHaveBeenCalledWith(
        BRAND_ID,
        expect.objectContaining({ notes: expect.stringContaining(reference) })
      );
    });
  });

  describe('Pago fallido / rechazado', () => {
    it('no renueva suscripción cuando status es DECLINED', async () => {
      const controller = new WompiController();
      const event = buildTransactionEvent('DECLINED', `TRYON-${BRAND_ID}-4`);
      const { req, res } = buildReqRes(event, { 'x-event-checksum': 'valid' });

      await controller.handleWebhook(req, res);

      expect(renewMock).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ received: true });
    });

    it('no renueva suscripción cuando status es VOIDED', async () => {
      const controller = new WompiController();
      const event = buildTransactionEvent('VOIDED', `TRYON-${BRAND_ID}-5`);
      const { req, res } = buildReqRes(event, { 'x-event-checksum': 'valid' });

      await controller.handleWebhook(req, res);

      expect(renewMock).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('no renueva suscripción cuando status es ERROR', async () => {
      const controller = new WompiController();
      const event = buildTransactionEvent('ERROR', `TRYON-${BRAND_ID}-6`);
      const { req, res } = buildReqRes(event, { 'x-event-checksum': 'valid' });

      await controller.handleWebhook(req, res);

      expect(renewMock).not.toHaveBeenCalled();
    });

    it('responde 200 aunque renewSubscription lance error (evita reintentos de Wompi)', async () => {
      renewMock.mockRejectedValue(new Error('DB error'));
      const controller = new WompiController();
      const event = buildTransactionEvent('APPROVED', `TRYON-${BRAND_ID}-7`);
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
      const event = buildTransactionEvent('APPROVED', `TRYON-${BRAND_ID}-8`);
      const { req, res } = buildReqRes(event, {});

      await controller.handleWebhook(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(renewMock).not.toHaveBeenCalled();
    });

    it('rechaza webhook con firma incorrecta (401)', async () => {
      mockedWompi.verifyWebhookSignature.mockResolvedValue(false);
      const controller = new WompiController();
      const event = buildTransactionEvent('APPROVED', `TRYON-${BRAND_ID}-9`);
      const { req, res } = buildReqRes(event, { 'x-event-checksum': 'firma-falsa' });

      await controller.handleWebhook(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(renewMock).not.toHaveBeenCalled();
    });

    it('no procesa el pago si la firma falla aunque el evento sea APPROVED', async () => {
      mockedWompi.verifyWebhookSignature.mockResolvedValue(false);
      const controller = new WompiController();
      const event = buildTransactionEvent('APPROVED', `TRYON-${BRAND_ID}-10`, 15000000);
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
});
