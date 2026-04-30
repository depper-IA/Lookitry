import { Request, Response } from 'express';

const mockCaptureOrder = jest.fn();
const mockGetOrder = jest.fn();
const mockGetTrackedOrder = jest.fn();
const mockMarkOrderStatus = jest.fn();
const mockExtractReference = jest.fn();
const mockExtractAmountUsd = jest.fn();
const mockRecordOrder = jest.fn();
const mockCreateOrder = jest.fn();

const mockMaybeSingle = jest.fn();
const mockLimit = jest.fn().mockReturnThis();
const mockEq = jest.fn().mockReturnThis();
const mockUpdate = jest.fn().mockReturnThis();
const mockSelect = jest.fn().mockReturnThis();
const mockInsert = jest.fn().mockResolvedValue({ error: null });
const mockFrom = jest.fn((table: string) => {
  if (table === 'subscription_payments') {
    return {
      insert: mockInsert,
      select: mockSelect,
      eq: mockEq,
      limit: mockLimit,
      maybeSingle: mockMaybeSingle,
    };
  }

  if (table === 'pending_registrations') {
    return {
      insert: mockInsert,
      select: mockSelect,
      eq: mockEq,
      maybeSingle: mockMaybeSingle,
      update: mockUpdate,
    };
  }

  return {
    update: mockUpdate,
    eq: mockEq,
    select: mockSelect,
  };
});

const renewSubscription = jest.fn();
const mockCalculateTotal = jest.fn();
const mockCalculateExternalCheckoutTotal = jest.fn();
const mockGetEffectiveTrm = jest.fn();

jest.mock('../services/paypal.service', () => ({
  paypalService: {
    captureOrder: mockCaptureOrder,
    createOrder: mockCreateOrder,
    getOrder: mockGetOrder,
    getTrackedOrder: mockGetTrackedOrder,
    markOrderStatus: mockMarkOrderStatus,
    extractReference: mockExtractReference,
    extractAmountUsd: mockExtractAmountUsd,
    recordOrder: mockRecordOrder,
  },
}));

jest.mock('../services/subscription.service', () => ({
  SubscriptionService: jest.fn().mockImplementation(() => ({
    renewSubscription,
  })),
}));

jest.mock('../config/supabase', () => ({
  supabaseAdmin: {
    from: mockFrom,
  },
}));

jest.mock('../services/pricing.service', () => ({
  pricingService: {
    calculateTotal: mockCalculateTotal,
    calculateExternalCheckoutTotal: mockCalculateExternalCheckoutTotal,
    getEffectiveTrm: mockGetEffectiveTrm,
  },
}));

import { PaypalController } from '../controllers/paypal.controller';

function buildReq(body: Record<string, unknown>) {
  return { body } as Request;
}

function buildRes() {
  return {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
  } as unknown as Response;
}

async function flushPromises() {
  await new Promise((resolve) => setImmediate(resolve));
}

describe('PaypalController.capturePayment', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockMaybeSingle.mockResolvedValue({ data: null, error: null });
    mockInsert.mockResolvedValue({ error: null });
    mockGetTrackedOrder.mockResolvedValue({
      reference: 'PAYPAL-brand-M1-PBASIC-123',
      order_id: 'ORDER-1',
      amount_usd_expected: 42,
    });
    mockGetOrder.mockResolvedValue({ status: 'APPROVED' });
    mockCaptureOrder.mockResolvedValue({ status: 'COMPLETED' });
    mockExtractReference.mockReturnValue('PAYPAL-brand-M1-PBASIC-123');
    mockExtractAmountUsd.mockReturnValue(42);
    mockMarkOrderStatus.mockResolvedValue(undefined);
    mockCreateOrder.mockResolvedValue({
      checkoutUrl: 'https://paypal.test/checkout',
      orderId: 'ORDER-NEW',
      amountUSD: 42,
    });
    renewSubscription.mockResolvedValue({ id: 'brand-1' });
    mockCalculateTotal.mockResolvedValue(150000);
    mockCalculateExternalCheckoutTotal.mockResolvedValue(150000);
    mockGetEffectiveTrm.mockResolvedValue({ trm: 4000, source: 'test' });
    mockUpdate.mockReturnThis();
    mockEq.mockReturnThis();
    mockSelect.mockReturnThis();
  });

  it('rechaza si la referencia enviada no coincide con la orden real de PayPal', async () => {
    const controller = new PaypalController();
    const req = buildReq({ orderId: 'ORDER-1', reference: 'PAYPAL-otra-ref' });
    const res = buildRes();
    const next = jest.fn();

    controller.capturePayment(req, res, next);
    await flushPromises();

    expect(res.status).toHaveBeenCalledWith(409);
    expect(mockCaptureOrder).not.toHaveBeenCalled();
    expect(renewSubscription).not.toHaveBeenCalled();
    expect(next).not.toHaveBeenCalled();
  });

  it('rechaza si el monto de la orden no coincide con paypal_orders', async () => {
    const controller = new PaypalController();
    const req = buildReq({ orderId: 'ORDER-1', reference: 'PAYPAL-brand-M1-PBASIC-123' });
    const res = buildRes();
    const next = jest.fn();
    mockGetTrackedOrder.mockResolvedValue({
      reference: 'PAYPAL-brand-M1-PBASIC-123',
      order_id: 'ORDER-1',
      amount_usd_expected: 60,
    });

    controller.capturePayment(req, res, next);
    await flushPromises();

    expect(mockCaptureOrder).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalled();
    expect(String(next.mock.calls[0][0]?.message || '')).toContain('monto capturado no coincide');
  });
});

describe('PaypalController.getCheckoutUrl', () => {
  it('usa onboarding-post-pago para checkout publico igual que Wompi', async () => {
    const controller = new PaypalController();
    const req = {
      query: {
        months: '1',
        plan: 'BASIC',
        email: 'nueva@marca.com',
      },
    } as unknown as Request;
    const res = buildRes();
    const next = jest.fn();

    controller.getCheckoutUrl(req, res, next);
    await flushPromises();

    expect(mockInsert).toHaveBeenCalledWith(expect.objectContaining({
      email: 'nueva@marca.com',
      plan: 'BASIC',
      months: 1,
      status: 'pending',
    }));
    expect(mockCreateOrder).toHaveBeenCalledWith(
      150000,
      4000,
      expect.stringMatching(/^PAYPAL-visitor_/),
      expect.stringContaining('/onboarding-post-pago?ref='),
      'https://lookitry.com/checkout',
      'BASIC'
    );
    expect(res.status).toHaveBeenCalledWith(200);
    expect(next).not.toHaveBeenCalled();
  });
});
