import { Response } from 'express';

const mockRegisterPostPayment = jest.fn();
const mockGetBrandById = jest.fn();
const mockSendEmail = jest.fn();
const mockRenewSubscription = jest.fn();
const mockSendWelcomeEmail = jest.fn();

const pendingMaybeSingle = jest.fn();
const brandSingle = jest.fn();
const insertOrUpdate = jest.fn().mockReturnThis();
const eq = jest.fn().mockReturnThis();
const select = jest.fn().mockReturnThis();
const maybeSingle = jest.fn();
const single = jest.fn();

jest.mock('../../services/auth.service', () => ({
  AuthService: jest.fn().mockImplementation(() => ({
    registerPostPayment: mockRegisterPostPayment,
    getBrandById: mockGetBrandById,
  })),
}));

jest.mock('../../services/email.service', () => ({
  EmailService: jest.fn().mockImplementation(() => ({
    sendEmail: mockSendEmail,
  })),
}));

jest.mock('../../services/subscription.service', () => ({
  SubscriptionService: jest.fn().mockImplementation(() => ({
    renewSubscription: mockRenewSubscription,
  })),
}));

jest.mock('../../templates/email-templates', () => ({
  verifyEmailTemplate: jest.fn().mockReturnValue('<html>verify</html>'),
}));

jest.mock('../../services/wompi.service', () => ({
  wompiService: {
    getTransactionByReference: jest.fn(),
    getTransactionById: jest.fn(),
  },
}));

jest.mock('../../services/paypal.service', () => ({
  paypalService: {
    getTrackedOrder: jest.fn(),
    getOrder: jest.fn(),
    captureOrder: jest.fn(),
    extractReference: jest.fn(),
    extractAmountUsd: jest.fn(),
  },
}));

jest.mock('../../services/notification.service', () => ({
  notificationService: {
    sendWelcomeEmail: mockSendWelcomeEmail,
    sendLandingActivatedEmail: jest.fn(),
  },
}));

jest.mock('../../utils/brandLifecycle', () => ({
  isTrialLandingBlocked: jest.fn().mockReturnValue(false),
}));

jest.mock('../../utils/sanitizeError', () => ({
  sanitizeError: jest.fn((error: Error, fallback: string) => error?.message || fallback),
}));

jest.mock('../../config/supabase', () => ({
  supabaseAdmin: {
    from: jest.fn((table: string) => {
      if (table === 'pending_registrations') {
        return {
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              maybeSingle: pendingMaybeSingle,
            }),
          }),
        };
      }

      if (table === 'brands') {
        return {
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              single: brandSingle,
            }),
          }),
          update: jest.fn().mockReturnValue({
            eq: jest.fn().mockResolvedValue({ error: null }),
          }),
        };
      }

      return {
        update: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({ error: null }),
        }),
      };
    }),
  },
}));

import { registerPostPayment } from '../auth-post-payment.controller';

function buildRes() {
  return {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
    cookie: jest.fn().mockReturnThis(),
  } as unknown as Response;
}

describe('registerPostPayment', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    pendingMaybeSingle.mockResolvedValue({
      data: {
        email: 'nuevo@lookitry.com',
        plan: 'BASIC',
        months: 1,
        includes_landing: false,
        status: 'paid',
        payment_id: 'PAY-1',
      },
      error: null,
    });
    mockRegisterPostPayment.mockResolvedValue({
      token: 'nuevo-token',
      brand: {
        id: 'brand-new',
        email: 'nuevo@lookitry.com',
        name: 'Marca Nueva',
        slug: 'marca-nueva',
        plan: 'BASIC',
      },
      verificationToken: 'verify-123',
    });
    brandSingle.mockResolvedValue({
      data: {
        id: 'brand-new',
        email: 'nuevo@lookitry.com',
        name: 'Marca Nueva',
        slug: 'marca-nueva',
        plan: 'BASIC',
        has_landing_page: false,
      },
      error: null,
    });
    mockSendEmail.mockResolvedValue(undefined);
    mockSendWelcomeEmail.mockResolvedValue(undefined);
    mockRenewSubscription.mockResolvedValue(undefined);
  });

  it('ignora una sesión activa ajena para referencias de registro visitante y crea la cuenta nueva', async () => {
    const req = {
      body: {
        name: 'Marca Nueva',
        slug: 'marca-nueva',
        password: 'Password1!',
        reference: 'PAYPAL-visitor_123-M1-PBASIC-1710000000000',
      },
      brand: {
        id: 'brand-stale',
        email: 'otra-marca@lookitry.com',
        slug: 'otra-marca',
        plan: 'PRO',
      },
      headers: {},
      cookies: {},
    } as any;
    const res = buildRes();

    await registerPostPayment(req, res);

    expect(mockRegisterPostPayment).toHaveBeenCalledWith(
      expect.objectContaining({
        email: 'nuevo@lookitry.com',
        ref: 'PAYPAL-visitor_123-M1-PBASIC-1710000000000',
        slug: 'marca-nueva',
      })
    );
    expect(mockRenewSubscription).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(201);
  });
});
