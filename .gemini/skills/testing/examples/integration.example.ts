// examples/integration.example.ts
// Ejemplo: Test de integración de un Controller (Express)
// Prueba el flujo completo controller → service con BD mockeada.

import { Request, Response } from 'express';

// ─── Mocks (SIEMPRE antes de imports del módulo bajo prueba) ───────────────────

jest.mock('../config/supabase', () => ({
  supabase: {},
  supabaseAdmin: {
    from: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    delete: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    neq: jest.fn().mockReturnThis(),
    single: jest.fn().mockResolvedValue({ data: { id: 'brand-1', plan: 'BASIC' }, error: null }),
    maybeSingle: jest.fn().mockResolvedValue({ data: null, error: null }),
  },
}));

jest.mock('../services/subscription.service', () => ({
  SubscriptionService: jest.fn().mockImplementation(() => ({
    checkSubscriptionStatus: jest.fn().mockResolvedValue('active'),
    isInTrial: jest.fn().mockResolvedValue(false),
  })),
}));

// ─── Importar módulo bajo prueba DESPUÉS de los mocks ─────────────────────────

// import { BrandsController } from '../controllers/brands.controller';

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Construye objetos Request y Response de Express mockeados.
 * Usar en cada test para evitar estado compartido.
 */
function buildReqRes(
  body: unknown = {},
  params: Record<string, string> = {},
  headers: Record<string, string> = {},
  user?: { id: string; email: string }
) {
  const req = {
    body,
    params,
    headers,
    query: {},
    user, // adjuntado por el middleware de auth
  } as unknown as Request;

  const res = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
    send: jest.fn().mockReturnThis(),
  } as unknown as Response;

  return { req, res };
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('BrandsController', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /brands/me', () => {
    it('debe retornar el perfil de la marca autenticada (200)', async () => {
      // const controller = new BrandsController();
      // const { req, res } = buildReqRes({}, {}, {}, { id: 'brand-1', email: 'test@example.com' });

      // await controller.getMe(req, res);

      // expect(res.status).toHaveBeenCalledWith(200);
      // expect(res.json).toHaveBeenCalledWith(
      //   expect.objectContaining({ id: 'brand-1' })
      // );
    });

    it('debe responder 401 si no hay usuario autenticado', async () => {
      // const controller = new BrandsController();
      // const { req, res } = buildReqRes(); // sin user

      // await controller.getMe(req, res);

      // expect(res.status).toHaveBeenCalledWith(401);
    });
  });

  describe('PUT /brands/me', () => {
    it('debe actualizar el perfil y retornar 200', async () => {
      // const controller = new BrandsController();
      // const { req, res } = buildReqRes(
      //   { name: 'Nuevo nombre', primary_color: '#FF5C3A' },
      //   {},
      //   {},
      //   { id: 'brand-1', email: 'test@example.com' }
      // );

      // await controller.updateMe(req, res);

      // expect(res.status).toHaveBeenCalledWith(200);
    });
  });
});
