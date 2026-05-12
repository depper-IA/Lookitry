// ai-descriptor/__tests__/e2e/integration.test.ts
// E2E tests for AI Product Descriptor — mocks Vertex AI at transport layer
// Updated to match new Spanish-specific field schemas

import request from 'supertest';
import express from 'express';

// Mock vertexService at the transport layer (NOT at the service level)
// This allows the full DescriptorService logic to execute
const mockGenerateContent = jest.fn();
jest.mock('../../../../services/vertex.service', () => ({
  vertexService: {
    generateContent: mockGenerateContent,
  },
}));

// Import after mock is set up
// Path correction: go up 4 levels from e2e/ to src/, then down to routes/
import aiRoutes from '../../../../routes/ai.routes';

describe('AI Product Descriptor E2E', () => {
  let app: express.Application;

  beforeAll(() => {
    app = express();
    app.use(express.json());
    app.use('/api/ai', aiRoutes);
  });

  beforeEach(() => {
    mockGenerateContent.mockReset();
  });

  // ——————————————————————————————————————————————————————————————
  // CLOTHING Product Type
  // ——————————————————————————————————————————————————————————————

  describe('POST /api/ai/describe-product — CLOTHING', () => {
    it('returns 200 with valid CLOTHING discriminated union (Spanish fields)', async () => {
      mockGenerateContent.mockResolvedValue({
        candidates: [{
          content: {
            role: 'model',
            parts: [{ text: JSON.stringify({
              product_type: 'CLOTHING',
              garment_type: 'Vestido',
              silhouette: 'Ajustado',
              primary_color: 'Rojo',
              secondary_colors: ['Negro', 'Dorado'],
              patterns: ['Liso', 'Con brillo'],
              materials: ['Seda', 'Algodón'],
              fit: 'Ajustado',
            }) }],
          },
          finishReason: 'STOP',
        }],
      });

      const res = await request(app)
        .post('/api/ai/describe-product')
        .send({ name: 'Vestido Rojo', category: 'VESTIDO' });

      expect(res.status).toBe(200);
      expect(res.body.product_type).toBe('CLOTHING');
      expect(res.body.garment_type).toBe('Vestido');
      expect(res.body.primary_color).toBe('Rojo');
      expect(res.body.silhouette).toBe('Ajustado');
      expect(res.body.secondary_colors).toHaveLength(2);
      expect(res.body.materials).toHaveLength(2);
      expect(res.body.fit).toBe('Ajustado');
    });

    it('returns 200 for CAMISA (shirt) category mapping to CLOTHING', async () => {
      mockGenerateContent.mockResolvedValue({
        candidates: [{
          content: {
            role: 'model',
            parts: [{ text: JSON.stringify({
              product_type: 'CLOTHING',
              garment_type: 'Camisa',
              silhouette: 'Regular',
              primary_color: 'Blanco',
              secondary_colors: ['Azul'],
              patterns: ['Liso'],
              materials: ['Algodón'],
              fit: 'Regular',
            }) }],
          },
          finishReason: 'STOP',
        }],
      });

      const res = await request(app)
        .post('/api/ai/describe-product')
        .send({ name: 'Camisa Blanca', category: 'CAMISA' });

      expect(res.status).toBe(200);
      expect(res.body.product_type).toBe('CLOTHING');
      expect(res.body.garment_type).toBe('Camisa');
    });

    it('returns 200 for PANTALON category', async () => {
      mockGenerateContent.mockResolvedValue({
        candidates: [{
          content: {
            role: 'model',
            parts: [{ text: JSON.stringify({
              product_type: 'CLOTHING',
              garment_type: 'Pantalón',
              silhouette: 'Recto',
              primary_color: 'Azul oscuro',
              secondary_colors: [],
              patterns: ['Mezclilla'],
              materials: ['Mezclilla'],
              fit: 'Regular',
            }) }],
          },
          finishReason: 'STOP',
        }],
      });

      const res = await request(app)
        .post('/api/ai/describe-product')
        .send({ name: 'Pantalon Azul', category: 'PANTALON' });

      expect(res.status).toBe(200);
      expect(res.body.product_type).toBe('CLOTHING');
    });
  });

  // ——————————————————————————————————————————————————————————————
  // ACCESSORY Product Type
  // ——————————————————————————————————————————————————————————————

  describe('POST /api/ai/describe-product — ACCESSORY', () => {
    it('returns 200 with valid ACCESSORY discriminated union (Spanish fields)', async () => {
      mockGenerateContent.mockResolvedValue({
        candidates: [{
          content: {
            role: 'model',
            parts: [{ text: JSON.stringify({
              product_type: 'ACCESSORY',
              accessory_type: 'Bolso',
              placement: 'Hombro',
              material: 'Cuero',
              primary_color: 'Negro',
              secondary_colors: ['Marrón'],
              patterns: ['Liso'],
            }) }],
          },
          finishReason: 'STOP',
        }],
      });

      const res = await request(app)
        .post('/api/ai/describe-product')
        .send({ name: 'Bolso de Mano', category: 'BOLSA' });

      expect(res.status).toBe(200);
      expect(res.body.product_type).toBe('ACCESSORY');
      expect(res.body.accessory_type).toBe('Bolso');
      expect(res.body.placement).toBe('Hombro');
      expect(res.body.material).toBe('Cuero');
      expect(res.body.primary_color).toBe('Negro');
    });

    it('returns 200 for JOYA (jewelry) category', async () => {
      mockGenerateContent.mockResolvedValue({
        candidates: [{
          content: {
            role: 'model',
            parts: [{ text: JSON.stringify({
              product_type: 'ACCESSORY',
              accessory_type: 'Collar',
              placement: 'Cuello',
              material: 'Oro',
              primary_color: 'Dorado',
              secondary_colors: [],
              patterns: ['Con piedras'],
            }) }],
          },
          finishReason: 'STOP',
        }],
      });

      const res = await request(app)
        .post('/api/ai/describe-product')
        .send({ name: 'Collar de Oro', category: 'JOYA' });

      expect(res.status).toBe(200);
      expect(res.body.product_type).toBe('ACCESSORY');
      expect(res.body.accessory_type).toBe('Collar');
    });

    it('returns 200 for GORRA (hat) category', async () => {
      mockGenerateContent.mockResolvedValue({
        candidates: [{
          content: {
            role: 'model',
            parts: [{ text: JSON.stringify({
              product_type: 'ACCESSORY',
              accessory_type: 'Gorra',
              placement: 'Cabeza',
              material: 'Algodón',
              primary_color: 'Negro',
              secondary_colors: [],
              patterns: ['Liso'],
            }) }],
          },
          finishReason: 'STOP',
        }],
      });

      const res = await request(app)
        .post('/api/ai/describe-product')
        .send({ name: 'Gorra de Algodon', category: 'GORRA' });

      expect(res.status).toBe(200);
      expect(res.body.product_type).toBe('ACCESSORY');
    });

    it('returns 200 for ACCESORIO category', async () => {
      mockGenerateContent.mockResolvedValue({
        candidates: [{
          content: {
            role: 'model',
            parts: [{ text: JSON.stringify({
              product_type: 'ACCESSORY',
              accessory_type: 'Bufanda',
              placement: 'Cuello',
              material: 'Lana',
              primary_color: 'Gris',
              secondary_colors: [],
              patterns: ['Rayas'],
            }) }],
          },
          finishReason: 'STOP',
        }],
      });

      const res = await request(app)
        .post('/api/ai/describe-product')
        .send({ name: 'Bufanda de Lana', category: 'ACCESORIO' });

      expect(res.status).toBe(200);
      expect(res.body.product_type).toBe('ACCESSORY');
    });
  });

  // ——————————————————————————————————————————————————————————————
  // FOOTWEAR Product Type
  // ——————————————————————————————————————————————————————————————

  describe('POST /api/ai/describe-product — FOOTWEAR', () => {
    it('returns 200 with valid FOOTWEAR discriminated union (Spanish fields)', async () => {
      mockGenerateContent.mockResolvedValue({
        candidates: [{
          content: {
            role: 'model',
            parts: [{ text: JSON.stringify({
              product_type: 'FOOTWEAR',
              footwear_type: 'Zapatos',
              heel_height: 'Tacón alto',
              material: 'Cuero',
              primary_color: 'Negro',
              secondary_colors: ['Marrón'],
              patterns: ['Liso'],
            }) }],
          },
          finishReason: 'STOP',
        }],
      });

      const res = await request(app)
        .post('/api/ai/describe-product')
        .send({ name: 'Zapatos Formales', category: 'ZAPATOS' });

      expect(res.status).toBe(200);
      expect(res.body.product_type).toBe('FOOTWEAR');
      expect(res.body.footwear_type).toBe('Zapatos');
      expect(res.body.heel_height).toBe('Tacón alto');
      expect(res.body.material).toBe('Cuero');
      expect(res.body.primary_color).toBe('Negro');
    });

    it('returns 200 for SANDALIAS (sandals) category', async () => {
      mockGenerateContent.mockResolvedValue({
        candidates: [{
          content: {
            role: 'model',
            parts: [{ text: JSON.stringify({
              product_type: 'FOOTWEAR',
              footwear_type: 'Sandalias',
              heel_height: 'Plano',
              material: 'Cuero',
              primary_color: 'Marrón',
              secondary_colors: [],
              patterns: ['Liso'],
            }) }],
          },
          finishReason: 'STOP',
        }],
      });

      const res = await request(app)
        .post('/api/ai/describe-product')
        .send({ name: 'Sandalias de Cuero', category: 'SANDALIAS' });

      expect(res.status).toBe(200);
      expect(res.body.product_type).toBe('FOOTWEAR');
    });

    it('returns 200 for SHOES category (English)', async () => {
      mockGenerateContent.mockResolvedValue({
        candidates: [{
          content: {
            role: 'model',
            parts: [{ text: JSON.stringify({
              product_type: 'FOOTWEAR',
              footwear_type: 'Zapatillas',
              heel_height: 'Plano',
              material: 'Malla',
              primary_color: 'Blanco',
              secondary_colors: ['Negro'],
              patterns: ['Liso'],
            }) }],
          },
          finishReason: 'STOP',
        }],
      });

      const res = await request(app)
        .post('/api/ai/describe-product')
        .send({ name: 'Running Shoes', category: 'SHOES' });

      expect(res.status).toBe(200);
      expect(res.body.product_type).toBe('FOOTWEAR');
    });
  });

  // ——————————————————————————————————————————————————————————————
  // Input Validation (HTTP-level)
  // ——————————————————————————————————————————————————————————————

  describe('Input Validation (E2E)', () => {
    it('returns 400 when name is missing', async () => {
      const res = await request(app)
        .post('/api/ai/describe-product')
        .send({ category: 'VESTIDO' });

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('VALIDATION_ERROR');
      expect(res.body.message).toContain('name');
    });

    it('returns 400 when name is empty string', async () => {
      const res = await request(app)
        .post('/api/ai/describe-product')
        .send({ name: '   ', category: 'VESTIDO' });

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('VALIDATION_ERROR');
      expect(res.body.message).toContain('name');
    });

    it('returns 400 when category is missing', async () => {
      const res = await request(app)
        .post('/api/ai/describe-product')
        .send({ name: 'Vestido' });

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('VALIDATION_ERROR');
      expect(res.body.message).toContain('category');
    });

    it('accepts optional brand_description field', async () => {
      mockGenerateContent.mockResolvedValue({
        candidates: [{
          content: {
            role: 'model',
            parts: [{ text: JSON.stringify({
              product_type: 'CLOTHING',
              garment_type: 'Vestido',
              silhouette: 'Ajustado',
              primary_color: 'Rojo',
              secondary_colors: [],
              patterns: ['Liso'],
              materials: ['Seda'],
              fit: 'Ajustado',
            }) }],
          },
          finishReason: 'STOP',
        }],
      });

      const res = await request(app)
        .post('/api/ai/describe-product')
        .send({
          name: 'Vestido',
          category: 'VESTIDO',
          brand_description: 'Marca de moda de lujo colombiana',
        });

      expect(res.status).toBe(200);
      expect(res.body.product_type).toBe('CLOTHING');
    });
  });

  // ——————————————————————————————————————————————————————————————
  // Error Handling (E2E with mocked Vertex)
  // ——————————————————————————————————————————————————————————————

  describe('Error Handling (E2E)', () => {
    it('returns 500 when Vertex AI returns error object', async () => {
      mockGenerateContent.mockResolvedValue({
        error: 'Model capacity exceeded. Please try again later.',
      });

      const res = await request(app)
        .post('/api/ai/describe-product')
        .send({ name: 'Vestido', category: 'VESTIDO' });

      expect(res.status).toBe(500);
      expect(res.body.error).toBe('VERTEX_ERROR');
    });

    it('returns 500 when Vertex AI returns empty candidates', async () => {
      mockGenerateContent.mockResolvedValue({
        candidates: [],
      });

      const res = await request(app)
        .post('/api/ai/describe-product')
        .send({ name: 'Vestido', category: 'VESTIDO' });

      expect(res.status).toBe(500);
      expect(res.body.error).toBe('VERTEX_ERROR');
    });

    it('returns 500 when Vertex AI returns non-JSON response', async () => {
      mockGenerateContent.mockResolvedValue({
        candidates: [{
          content: {
            role: 'model',
            parts: [{ text: 'Lo siento, no puedo generar una descripcion en este momento.' }],
          },
          finishReason: 'STOP',
        }],
      });

      const res = await request(app)
        .post('/api/ai/describe-product')
        .send({ name: 'Vestido', category: 'VESTIDO' });

      expect(res.status).toBe(500);
      expect(res.body.error).toBe('VERTEX_ERROR');
    });

    it('returns 502 when AI response fails Zod validation (missing required fields)', async () => {
      // Response is missing required fields like silhouette, materials, fit
      mockGenerateContent.mockResolvedValue({
        candidates: [{
          content: {
            role: 'model',
            parts: [{ text: JSON.stringify({
              product_type: 'CLOTHING',
              garment_type: 'Vestido',
              // missing: silhouette, primary_color, secondary_colors, patterns, materials, fit
            }) }],
          },
          finishReason: 'STOP',
        }],
      });

      const res = await request(app)
        .post('/api/ai/describe-product')
        .send({ name: 'Vestido', category: 'VESTIDO' });

      expect(res.status).toBe(502);
      expect(res.body.error).toBe('VALIDATION_ERROR');
    });
  });

  // ——————————————————————————————————————————————————————————————
  // Unknown Category Fallback (E2E)
  // ——————————————————————————————————————————————————————————————

  describe('Unknown Category Fallback (E2E)', () => {
    it('defaults unknown category to CLOTHING with warning logged', async () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});

      mockGenerateContent.mockResolvedValue({
        candidates: [{
          content: {
            role: 'model',
            parts: [{ text: JSON.stringify({
              product_type: 'CLOTHING',
              garment_type: 'Prenda',
              silhouette: 'Regular',
              primary_color: 'Negro',
              secondary_colors: [],
              patterns: ['Liso'],
              materials: ['Algodón'],
              fit: 'Regular',
            }) }],
          },
          finishReason: 'STOP',
        }],
      });

      const res = await request(app)
        .post('/api/ai/describe-product')
        .send({ name: 'Producto Extraño', category: 'UNKNOWN_CATEGORY' });

      expect(res.status).toBe(200);
      expect(res.body.product_type).toBe('CLOTHING');
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('UNKNOWN_CATEGORY')
      );
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('ClothingFormatter')
      );

      consoleSpy.mockRestore();
    });
  });
});