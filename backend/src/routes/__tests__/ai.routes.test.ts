// routes/ai.routes.test.ts
// Tests for POST /api/ai/describe-product — Phase 4

import request from 'supertest';

// Mock the descriptor service
const mockDescribeProduct = jest.fn();

// Mock error classes as well since route uses instanceof checks
class MockValidationError extends Error {
  statusCode = 502 as const;
  constructor(message: string) {
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

// Mock auth middleware
jest.mock('../../middleware/auth', () => ({
  authenticateAdmin: (req: any, res: any, next: any) => {
    req.admin = { id: 'admin-1' };
    next();
  },
}));

import express from 'express';
import aiRoutes from '../ai.routes';

describe('ai.routes', () => {
  let app: express.Application;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use('/ai', aiRoutes);
    mockDescribeProduct.mockReset();
  });

  describe('POST /ai/describe-product', () => {
    it('returns 200 with valid CLOTHING response', async () => {
      mockDescribeProduct.mockResolvedValue({
        product_type: 'CLOTHING',
        short_description: 'A beautiful red dress',
        features: ['Elegant', 'Flowing', 'Comfortable'],
        suggested_use_cases: ['Party', 'Date night'],
      });

      const res = await request(app)
        .post('/ai/describe-product')
        .send({ name: 'Vestido Rojo', category: 'VESTIDO' });

      expect(res.status).toBe(200);
      expect(res.body.product_type).toBe('CLOTHING');
      expect(res.body.short_description).toBe('A beautiful red dress');
      expect(mockDescribeProduct).toHaveBeenCalledWith({
        name: 'Vestido Rojo',
        category: 'VESTIDO',
        brand_description: undefined,
      });
    });

    it('returns 200 with optional brand_description', async () => {
      mockDescribeProduct.mockResolvedValue({
        product_type: 'CLOTHING',
        short_description: 'A dress',
        features: ['Feature 1', 'Feature 2', 'Feature 3'],
        suggested_use_cases: ['Casual', 'Formal'],
      });

      const res = await request(app)
        .post('/ai/describe-product')
        .send({
          name: 'Vestido',
          category: 'VESTIDO',
          brand_description: 'Premium brand known for elegance',
        });

      expect(res.status).toBe(200);
      expect(mockDescribeProduct).toHaveBeenCalledWith({
        name: 'Vestido',
        category: 'VESTIDO',
        brand_description: 'Premium brand known for elegance',
      });
    });

    it('returns 200 for ACCESSORY product', async () => {
      mockDescribeProduct.mockResolvedValue({
        product_type: 'ACCESSORY',
        short_description: 'Leather handbag',
        features: ['Genuine leather', 'Spacious'],
        material_notes: 'Full grain leather',
      });

      const res = await request(app)
        .post('/ai/describe-product')
        .send({ name: 'Bolso de Mano', category: 'BOLSA' });

      expect(res.status).toBe(200);
      expect(res.body.product_type).toBe('ACCESSORY');
      expect((res.body as any).material_notes).toBe('Full grain leather');
    });

    it('returns 200 for FOOTWEAR product', async () => {
      mockDescribeProduct.mockResolvedValue({
        product_type: 'FOOTWEAR',
        short_description: 'Formal black shoes',
        features: ['Leather upper', 'Cushioned sole'],
        style_notes: 'Classic design',
        comfort_features: ['Arch support', 'Breathable'],
      });

      const res = await request(app)
        .post('/ai/describe-product')
        .send({ name: 'Zapatos Formales', category: 'ZAPATOS' });

      expect(res.status).toBe(200);
      expect(res.body.product_type).toBe('FOOTWEAR');
      expect((res.body as any).comfort_features).toHaveLength(2);
    });

    it('returns 400 when name is missing', async () => {
      const res = await request(app)
        .post('/ai/describe-product')
        .send({ category: 'VESTIDO' });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('name');
    });

    it('returns 400 when name is empty string', async () => {
      const res = await request(app)
        .post('/ai/describe-product')
        .send({ name: '', category: 'VESTIDO' });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('name');
    });

    it('returns 400 when category is missing', async () => {
      const res = await request(app)
        .post('/ai/describe-product')
        .send({ name: 'Vestido' });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('category');
    });

    it('returns 502 on ValidationError from service', async () => {
      const error = new MockValidationError('AI response validation failed');
      mockDescribeProduct.mockRejectedValue(error);

      const res = await request(app)
        .post('/ai/describe-product')
        .send({ name: 'Vestido', category: 'VESTIDO' });

      expect(res.status).toBe(502);
      expect(res.body.error).toBe('VALIDATION_ERROR');
    });

    it('returns 500 on VertexError from service', async () => {
      const error = new MockVertexError('Vertex AI error: Model capacity exceeded');
      mockDescribeProduct.mockRejectedValue(error);

      const res = await request(app)
        .post('/ai/describe-product')
        .send({ name: 'Vestido', category: 'VESTIDO' });

      expect(res.status).toBe(500);
      expect(res.body.error).toBe('VERTEX_ERROR');
    });

    it('returns 500 on generic errors from service', async () => {
      mockDescribeProduct.mockRejectedValue(new Error('Unexpected error'));

      const res = await request(app)
        .post('/ai/describe-product')
        .send({ name: 'Vestido', category: 'VESTIDO' });

      expect(res.status).toBe(500);
      expect(res.body.error).toBe('INTERNAL_ERROR');
    });
  });
});