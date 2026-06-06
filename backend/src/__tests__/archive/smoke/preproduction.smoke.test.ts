import http from 'http';

import express from 'express';

import cookieParser from 'cookie-parser';



const mockRegister = jest.fn();

const mockLogin = jest.fn();

const mockGetCheckoutUrl = jest.fn();

const mockGenerateReference = jest.fn();

const mockCreateCheckoutForBrand = jest.fn();

const mockVerifyConnection = jest.fn();

const mockHead = jest.fn();

const mockGet = jest.fn();

const mockSupabaseAdminFrom = jest.fn();

const mockSupabaseFrom = jest.fn();



process.env.JWT_SECRET = 'smoke-jwt-secret-32-characters-minimum';



jest.mock('../../middleware/rateLimiter', () => {
  const passthrough = (_req: any, _res: any, next: any) => next();
  return {
    authRateLimiter: passthrough,
    globalRateLimiter: passthrough,
    publicRateLimiter: passthrough,
    generationRateLimiter: passthrough,
    slugGenerationRateLimiter: passthrough,
    registerRateLimiter: passthrough,
    loginRateLimiter: passthrough,
  };
});



jest.mock('../../middleware/auth', () => ({

  authMiddleware: (req: any, res: any, next: any) => {

    if (req.headers.authorization === 'Bearer smoke-token') {

      req.brand = { id: 'brand-smoke', email: 'smoke@lookitry.com', slug: 'smoke-brand', plan: 'BASIC' };

      return next();

    }

    return res.status(401).json({ error: 'UNAUTHORIZED', message: 'Token de autenticación requerido' });

  },

  optionalAuth: (req: any, _res: any, next: any) => {

    if (req.headers.authorization === 'Bearer smoke-token') {

      req.brand = { id: 'brand-smoke', email: 'smoke@lookitry.com', slug: 'smoke-brand', plan: 'BASIC' };

    }

    next();

  },

}));



jest.mock('../../services/auth.service', () => ({

  AuthService: jest.fn().mockImplementation(() => ({

    register: (...args: unknown[]) => mockRegister(...args),

    login: (...args: unknown[]) => mockLogin(...args),

    getBrandById: jest.fn().mockResolvedValue({

      id: 'brand-smoke',

      email: 'smoke@lookitry.com',

      slug: 'smoke-brand',

      plan: 'BASIC',

    }),

    requestPasswordResetGetToken: jest.fn().mockResolvedValue({ brand: null, token: null }),

    resetPassword: jest.fn(),

    resendVerificationEmail: jest.fn().mockResolvedValue({ brand: null, token: null }),

    verifyEmail: jest.fn(),

    changePassword: jest.fn(),

  })),

}));



jest.mock('../../services/email.service', () => ({

  EmailService: jest.fn().mockImplementation(() => ({

    sendEmail: jest.fn().mockResolvedValue(undefined),

  })),

  emailService: {

    verifyConnection: (...args: unknown[]) => mockVerifyConnection(...args),

  },

}));



jest.mock('../../templates/email-templates', () => ({

  verifyEmailTemplate: jest.fn().mockReturnValue('<html>verify</html>'),

  passwordResetTemplate: jest.fn().mockReturnValue('<html>reset</html>'),

}));



jest.mock('../../utils/jwt', () => ({

  verifyToken: jest.fn().mockReturnValue({ brandId: 'brand-smoke' }),

  generateToken: jest.fn().mockReturnValue('smoke-jwt'),

}));



jest.mock('../../services/wompi.service', () => ({

  wompiService: {

    getCheckoutUrl: (...args: unknown[]) => mockGetCheckoutUrl(...args),

    generateReference: (...args: unknown[]) => mockGenerateReference(...args),

    verifyWebhookSignature: jest.fn().mockResolvedValue(true),

    extractBrandIdFromReference: jest.fn().mockReturnValue('brand-smoke'),

    extractMetaFromReference: jest.fn().mockReturnValue({ months: 1, plan: 'BASIC', includesLanding: false }),

    getWidgetConfig: jest.fn(),

    generateIntegritySignature: jest.fn(),

    getTransactionById: jest.fn(),

  },

  WompiService: jest.fn(),

}));



jest.mock('../../services/pricing.service', () => ({

  pricingService: {

    calculateTotal: jest.fn().mockResolvedValue(150000),

    calculateExternalCheckoutTotal: jest.fn().mockResolvedValue(150000),

    getPricingConfig: jest.fn().mockResolvedValue([]),

    getEffectiveTrm: jest.fn().mockResolvedValue({ trm: 4000, source: 'meta_auto' }),

  },

}));



jest.mock('../../services/addonCredits.service', () => ({

  addonCreditsService: {

    ensureDefaultPackages: jest.fn().mockResolvedValue(undefined),

    createCheckoutForBrand: (...args: unknown[]) => mockCreateCheckoutForBrand(...args),

    isAddonReference: jest.fn().mockReturnValue(false),

    applyPurchasedCredits: jest.fn(),

  },

}));



jest.mock('../../services/notification.service', () => ({

  NotificationService: jest.fn().mockImplementation(() => ({

    sendRenewalConfirmation: jest.fn().mockResolvedValue(undefined),

    sendWelcomeEmail: jest.fn().mockResolvedValue(undefined),

    sendCompleteRegistrationEmail: jest.fn().mockResolvedValue(undefined),

  })),

  notificationService: {

    sendWelcomeEmail: jest.fn().mockResolvedValue(undefined),

  },

}));



jest.mock('../../services/n8n.client', () => ({

  N8nClient: jest.fn().mockImplementation(() => ({

    isConfigured: jest.fn().mockReturnValue(true),

  })),

}));



jest.mock('../../services/upload.service', () => ({

  UploadService: jest.fn().mockImplementation(() => ({})),

}));



jest.mock('../../utils/adminNotifications', () => ({

  createAdminNotification: jest.fn().mockResolvedValue(undefined),

}));



jest.mock('../../services/system.service', () => ({

  systemService: {

    checkRamThreshold: jest.fn().mockResolvedValue(undefined),

  },

}));



jest.mock('../../config/supabase', () => ({

  supabaseAdmin: {

    from: (...args: unknown[]) => mockSupabaseAdminFrom(...args),

  },

  supabase: {

    from: (...args: unknown[]) => mockSupabaseFrom(...args),

  },

}));



jest.mock('axios', () => ({

  __esModule: true,

  default: {

    head: (...args: unknown[]) => mockHead(...args),

    get: (...args: unknown[]) => mockGet(...args),

  },

}));



import authRoutes from '../../routes/auth.routes';

import wompiRoutes from '../../routes/wompi.routes';

import paymentsRoutes from '../../routes/payments.routes';

import { getHealthDeep } from '../../controllers/health.controller';

  app.get('/health/deep', getHealthDeep);

...

  it('responde salud general 200 con dependencias en estado ok', async () => {

    const response = await fetch(`${baseUrl}/health/deep`);

    const body = await response.json() as any;



    expect(response.status).toBe(200);

    expect(body.status).toBe('ok');

    expect(body.services.supabase.status).toBe('ok');

    expect(body.services.email.status).toBe('ok');

  });



  it('rechaza registro inválido por HTTP con 400', async () => {

    const response = await fetch(`${baseUrl}/api/auth/register`, {

      method: 'POST',

      headers: { 'Content-Type': 'application/json' },

      body: JSON.stringify({ email: 'qa@lookitry.com' }),

    });

    const body = await response.json() as any;



    expect(response.status).toBe(400);

    expect(body.error).toBe('VALIDATION_ERROR');

  });



  it('rechaza login con credenciales erróneas por HTTP con 401', async () => {

    const response = await fetch(`${baseUrl}/api/auth/login`, {

      method: 'POST',

      headers: { 'Content-Type': 'application/json' },

      body: JSON.stringify({ email: 'qa@lookitry.com', password: 'incorrecta' }),

    });

    const body = await response.json() as any;



    expect(response.status).toBe(401);

    expect(body.error).toBe('INVALID_CREDENTIALS');

  });



  it('genera checkout guest de Wompi para registro pendiente', async () => {

    const response = await fetch(

      `${baseUrl}/api/payments/wompi/checkout-url?plan=BASIC&months=1&email=smoke@lookitry.com`

    );

    const body = await response.json() as any;



    expect(response.status).toBe(200);

    expect(body.checkoutUrl).toContain('checkout.wompi.co');

    expect(mockSupabaseAdminFrom).toHaveBeenCalledWith('pending_registrations');

  });



  it('permite checkout autenticado de add-ons', async () => {

    const response = await fetch(`${baseUrl}/api/payments/checkout-addon`, {

      method: 'POST',

      headers: {

        'Content-Type': 'application/json',

        Authorization: 'Bearer smoke-token',

      },

      body: JSON.stringify({ gateway: 'wompi', packageId: 'credits_500' }),

    });

    const body = await response.json() as any;



    expect(response.status).toBe(200);

    expect(body.reference).toBe('ADDON-smoke-123');

    expect(mockCreateCheckoutForBrand).toHaveBeenCalledWith('brand-smoke', 'wompi', 'credits_500');

  });

});

