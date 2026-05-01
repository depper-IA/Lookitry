// controllers/__tests__/products.controller.test.ts
// Tests for describeProductWithAI — migration from n8n to descriptorService

import { Request, Response } from 'express';

// Mock descriptorService
const mockDescribeProduct = jest.fn();

// Mock error classes
class MockValidationError extends Error {
  statusCode = 502 as const;
  constructor(message: string, public rawResponse?: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

class MockVertexError extends Error {
  statusCode = 500 as const;
  constructor(message: string) {
    super(message);
    this.name = 'VertexError';
  }
}

jest.mock('../../services/ai-descriptor/ai-descriptor.service', () => ({
  descriptorService: {
    describeProduct: mockDescribeProduct,
  },
  ValidationError: MockValidationError,
  VertexError: MockVertexError,
}));

jest.mock('../../middleware/auth', () => ({
  authenticateBrand: (req: any, _res: any, next: any) => {
    req.brand = { id: 'brand-1', slug: 'test-brand' };
    next();
  },
}));

jest.mock('../../utils/brandConfigCache', () => ({
  invalidateBrandConfigCache: jest.fn(),
}));

import { ProductsController } from '../products.controller';

function buildReq(body: Record<string, unknown>) {
  return {
    body,
    brand: { id: 'brand-1', slug: 'test-brand' },
  } as unknown as Request;
}

function buildRes() {
  const res = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
  } as unknown as Response;
  return res;
}

describe('ProductsController — describeProductWithAI', () => {
  let controller: ProductsController;

  beforeEach(() => {
    jest.clearAllMocks();
    controller = new ProductsController();
  });

  // ——————————————————————————————————————————————————————————————
  // RED 1: Service is called with correct input
  // ——————————————————————————————————————————————————————————————

  describe('calls descriptorService.describeProduct with correct input', () => {
    it('maps body.product_name to name field', async () => {
      mockDescribeProduct.mockResolvedValue({
        product_type: 'CLOTHING',
        short_description: 'A beautiful red dress',
        features: ['Elegant', 'Flowing', 'Comfortable'],
        suggested_use_cases: ['Party', 'Date night'],
      });

      const req = buildReq({ product_name: 'Vestido Rojo', category: 'VESTIDO' });
      const res = buildRes();

      await controller.describeProductWithAI(req, res);

      expect(mockDescribeProduct).toHaveBeenCalledWith({
        name: 'Vestido Rojo',
        category: 'VESTIDO',
        brand_description: undefined,
      });
    });

    it('passes brand_description when provided', async () => {
      mockDescribeProduct.mockResolvedValue({
        product_type: 'ACCESSORY',
        short_description: 'Leather handbag',
        features: ['Genuine leather'],
        material_notes: 'Full grain leather',
      });

      const req = buildReq({
        product_name: 'Bolso de Mano',
        category: 'BOLSA',
        brand_description: 'Premium brand known for elegance',
      });
      const res = buildRes();

      await controller.describeProductWithAI(req, res);

      expect(mockDescribeProduct).toHaveBeenCalledWith({
        name: 'Bolso de Mano',
        category: 'BOLSA',
        brand_description: 'Premium brand known for elegance',
      });
    });

    it('does NOT pass image_url to descriptorService', async () => {
      mockDescribeProduct.mockResolvedValue({
        product_type: 'CLOTHING',
        short_description: 'A dress',
        features: ['Feature 1', 'Feature 2', 'Feature 3'],
        suggested_use_cases: ['Casual', 'Formal'],
      });

      const req = buildReq({
        product_name: 'Vestido',
        category: 'VESTIDO',
        image_url: 'https://example.com/image.jpg',
      });
      const res = buildRes();

      await controller.describeProductWithAI(req, res);

      // image_url should NOT be passed to descriptorService
      expect(mockDescribeProduct).toHaveBeenCalledWith({
        name: 'Vestido',
        category: 'VESTIDO',
        brand_description: undefined,
      });
      expect(mockDescribeProduct).not.toHaveBeenCalledWith(
        expect.objectContaining({ image_url: expect.any(String) })
      );
    });
  });

  // ——————————————————————————————————————————————————————————————
  // RED 2: Returns correct response shape for CLOTHING
  // ——————————————————————————————————————————————————————————————

  describe('returns 200 with CLOTHING response shape', () => {
    it('returns product_type, short_description, features, suggested_use_cases', async () => {
      mockDescribeProduct.mockResolvedValue({
        product_type: 'CLOTHING',
        short_description: 'A beautiful red dress',
        features: ['Elegant', 'Flowing', 'Comfortable'],
        suggested_use_cases: ['Party', 'Date night'],
      });

      const req = buildReq({ product_name: 'Vestido Rojo', category: 'VESTIDO' });
      const res = buildRes();

      await controller.describeProductWithAI(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        product_type: 'CLOTHING',
        short_description: 'A beautiful red dress',
        features: ['Elegant', 'Flowing', 'Comfortable'],
        suggested_use_cases: ['Party', 'Date night'],
      });
    });
  });

  // ——————————————————————————————————————————————————————————————
  // RED 3: Returns correct response shape for ACCESSORY
  // ——————————————————————————————————————————————————————————————

  describe('returns 200 with ACCESSORY response shape', () => {
    it('returns product_type, short_description, features, material_notes', async () => {
      mockDescribeProduct.mockResolvedValue({
        product_type: 'ACCESSORY',
        short_description: 'Leather handbag',
        features: ['Genuine leather', 'Spacious'],
        material_notes: 'Full grain leather',
      });

      const req = buildReq({ product_name: 'Bolso de Mano', category: 'BOLSA' });
      const res = buildRes();

      await controller.describeProductWithAI(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        product_type: 'ACCESSORY',
        short_description: 'Leather handbag',
        features: ['Genuine leather', 'Spacious'],
        material_notes: 'Full grain leather',
      });
    });
  });

  // ——————————————————————————————————————————————————————————————
  // RED 4: Returns correct response shape for FOOTWEAR
  // ——————————————————————————————————————————————————————————————

  describe('returns 200 with FOOTWEAR response shape', () => {
    it('returns product_type, short_description, features, style_notes, comfort_features', async () => {
      mockDescribeProduct.mockResolvedValue({
        product_type: 'FOOTWEAR',
        short_description: 'Formal black shoes',
        features: ['Leather upper', 'Cushioned sole'],
        style_notes: 'Classic design',
        comfort_features: ['Arch support', 'Breathable'],
      });

      const req = buildReq({ product_name: 'Zapatos Formales', category: 'ZAPATOS' });
      const res = buildRes();

      await controller.describeProductWithAI(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        product_type: 'FOOTWEAR',
        short_description: 'Formal black shoes',
        features: ['Leather upper', 'Cushioned sole'],
        style_notes: 'Classic design',
        comfort_features: ['Arch support', 'Breathable'],
      });
    });
  });

  // ——————————————————————————————————————————————————————————————
  // RED 5: Validation error when product_name missing
  // ——————————————————————————————————————————————————————————————

  describe('returns 400 when product_name is missing', () => {
    it('returns VALIDATION_ERROR', async () => {
      const req = buildReq({ category: 'VESTIDO' });
      const res = buildRes();

      await controller.describeProductWithAI(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ error: 'VALIDATION_ERROR' })
      );
    });
  });

  // ——————————————————————————————————————————————————————————————
  // RED 6: Validation error when category missing
  // ——————————————————————————————————————————————————————————————

  describe('returns 400 when category is missing', () => {
    it('returns VALIDATION_ERROR', async () => {
      const req = buildReq({ product_name: 'Vestido Rojo' });
      const res = buildRes();

      await controller.describeProductWithAI(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ error: 'VALIDATION_ERROR' })
      );
    });
  });

  // ——————————————————————————————————————————————————————————————
  // RED 7: Handles ValidationError from descriptorService (502)
  // ——————————————————————————————————————————————————————————————

  describe('returns 502 on ValidationError from descriptorService', () => {
    it('returns WEBHOOK_NOT_FOUND error code', async () => {
      mockDescribeProduct.mockRejectedValue(
        new MockValidationError('AI response validation failed')
      );

      const req = buildReq({ product_name: 'Vestido', category: 'VESTIDO' });
      const res = buildRes();

      await controller.describeProductWithAI(req, res);

      expect(res.status).toHaveBeenCalledWith(502);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ error: 'WEBHOOK_NOT_FOUND' })
      );
    });
  });

  // ——————————————————————————————————————————————————————————————
  // RED 8: Handles VertexError from descriptorService (500)
  // ——————————————————————————————————————————————————————————————

  describe('returns 500 on VertexError from descriptorService', () => {
    it('returns VERTEX_ERROR error code', async () => {
      mockDescribeProduct.mockRejectedValue(
        new MockVertexError('Vertex AI error: Model capacity exceeded')
      );

      const req = buildReq({ product_name: 'Vestido', category: 'VESTIDO' });
      const res = buildRes();

      await controller.describeProductWithAI(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ error: 'VERTEX_ERROR' })
      );
    });
  });

  // ——————————————————————————————————————————————————————————————
  // RED 9: Handles generic errors (500)
  // ——————————————————————————————————————————————————————————————

  describe('returns 500 on generic errors', () => {
    it('returns INTERNAL_ERROR', async () => {
      mockDescribeProduct.mockRejectedValue(new Error('Unexpected error'));

      const req = buildReq({ product_name: 'Vestido', category: 'VESTIDO' });
      const res = buildRes();

      await controller.describeProductWithAI(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ error: 'INTERNAL_ERROR' })
      );
    });
  });

  // ——————————————————————————————————————————————————————————————
  // RED 10: Unauthorized when no brand
  // ——————————————————————————————————————————————————————————————

  describe('returns 401 when no brand', () => {
    it('returns UNAUTHORIZED', async () => {
      const req = {
        body: { product_name: 'Vestido', category: 'VESTIDO' },
      } as Request;
      const res = buildRes();

      await controller.describeProductWithAI(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ error: 'UNAUTHORIZED' })
      );
    });
  });
});