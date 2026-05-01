// ai-descriptor/__tests__/e2e/integration.test.ts
// E2E tests for AI Product Descriptor — mocks Vertex AI at transport layer
// Tests the full request/response cycle: HTTP → Service → Vertex AI → Zod validation

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
    it('returns 200 with valid CLOTHING discriminated union', async () => {
      mockGenerateContent.mockResolvedValue({
        candidates: [{
          content: {
            role: 'model',
            parts: [{ text: JSON.stringify({
              product_type: 'CLOTHING',
              short_description: 'Elegante vestido rojo para ocasiones especiales',
              features: ['Tela suave de seda', 'Corte clasico con estampado', 'Color vibrante rojo'],
              suggested_use_cases: ['Citas romanticas', 'Eventos formales', 'Cenas de gala'],
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
      expect(res.body.short_description).toBe('Elegante vestido rojo para ocasiones especiales');
      expect(res.body.features).toHaveLength(3);
      expect(res.body.suggested_use_cases).toHaveLength(3);
    });

    it('returns 200 for CAMISA (shirt) category mapping to CLOTHING', async () => {
      mockGenerateContent.mockResolvedValue({
        candidates: [{
          content: {
            role: 'model',
            parts: [{ text: JSON.stringify({
              product_type: 'CLOTHING',
              short_description: 'Camisa blanca de algodon puro',
              features: ['Algodon 100%', 'Cuello italiano', 'Mangas largas'],
              suggested_use_cases: ['Oficina', 'Reuniones de negocios'],
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
      expect((res.body as any).suggested_use_cases).toHaveLength(2);
    });

    it('returns 200 for PANTALON category', async () => {
      mockGenerateContent.mockResolvedValue({
        candidates: [{
          content: {
            role: 'model',
            parts: [{ text: JSON.stringify({
              product_type: 'CLOTHING',
              short_description: 'Pantalon de mezclilla azul oscuro',
              features: ['Mezclilla estirable', 'Corte recto', 'Bolsillos profundos'],
              suggested_use_cases: ['Uso diario', 'Actividades al aire libre'],
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
    it('returns 200 with valid ACCESSORY discriminated union', async () => {
      mockGenerateContent.mockResolvedValue({
        candidates: [{
          content: {
            role: 'model',
            parts: [{ text: JSON.stringify({
              product_type: 'ACCESSORY',
              short_description: 'Bolso de cuero genuino para mujer',
              features: ['Cuero vacuno 100%', 'Compartimento para laptop', 'Diseño minimalista'],
              material_notes: 'Hecho de cuero vacuno de primera calidad',
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
      expect(res.body.short_description).toBe('Bolso de cuero genuino para mujer');
      expect(res.body.features).toHaveLength(3);
      expect((res.body as any).material_notes).toBe('Hecho de cuero vacuno de primera calidad');
    });

    it('returns 200 for JOYA (jewelry) category', async () => {
      mockGenerateContent.mockResolvedValue({
        candidates: [{
          content: {
            role: 'model',
            parts: [{ text: JSON.stringify({
              product_type: 'ACCESSORY',
              short_description: 'Collar de oro 18k con pendiente',
              features: ['Oro 18 kilates', 'Diseño elegante', 'Piedras preciosas'],
              material_notes: '100% oro puro de 18 quilates',
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
      expect((res.body as any).material_notes).toContain('oro');
    });

    it('returns 200 for GORRA (hat) category', async () => {
      mockGenerateContent.mockResolvedValue({
        candidates: [{
          content: {
            role: 'model',
            parts: [{ text: JSON.stringify({
              product_type: 'ACCESSORY',
              short_description: 'Gorra de beisbol algodon',
              features: ['Algodon 100%', 'Ajustable', 'Logo bordado'],
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
              short_description: 'Bufanda de lana merino',
              features: ['Lana merino 100%', 'Suave al tacto', 'Diseño reversible'],
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
    it('returns 200 with valid FOOTWEAR discriminated union', async () => {
      mockGenerateContent.mockResolvedValue({
        candidates: [{
          content: {
            role: 'model',
            parts: [{ text: JSON.stringify({
              product_type: 'FOOTWEAR',
              short_description: 'Zapatos formales de cuero negro',
              features: ['Cuero legitimo', 'Suela de goma antideslizante', 'Diseño clasico'],
              style_notes: 'Estilo Oxford con acabado brillante',
              comfort_features: ['Plantilla acolchada memory foam', 'Soporte de arco plantar', 'Respiracion optimizada'],
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
      expect(res.body.short_description).toBe('Zapatos formales de cuero negro');
      expect(res.body.features).toHaveLength(3);
      expect((res.body as any).style_notes).toBe('Estilo Oxford con acabado brillante');
      expect((res.body as any).comfort_features).toHaveLength(3);
    });

    it('returns 200 for SANDALIAS (sandals) category', async () => {
      mockGenerateContent.mockResolvedValue({
        candidates: [{
          content: {
            role: 'model',
            parts: [{ text: JSON.stringify({
              product_type: 'FOOTWEAR',
              short_description: 'Sandalias de cuero para verano',
              features: ['Cuero genuino', 'Suela de corcho', 'Diseño ventilado'],
              style_notes: 'Estilo mediterraneo fresco',
              comfort_features: ['Plantilla de memory foam', 'Suela antideslizante'],
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
              short_description: 'Running shoes with mesh upper',
              features: ['Mesh transpirable', 'Suela de EVA', 'Amortiguacion avanzada'],
              comfort_features: ['Tecnologia de absorcion de impactos', 'Support for flat feet'],
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
              short_description: 'Vestido elegante',
              features: ['Tela premium', 'Corte moderno', 'Color unico'],
              suggested_use_cases: ['Fiesta', 'Cena'],
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

    it('returns 502 when AI response fails Zod validation', async () => {
      // Response has features array with only 1 item (violates min 3)
      mockGenerateContent.mockResolvedValue({
        candidates: [{
          content: {
            role: 'model',
            parts: [{ text: JSON.stringify({
              product_type: 'CLOTHING',
              short_description: 'Vestido corto',
              features: ['Solo una'],  // Violates min(3)
              suggested_use_cases: [' playa'],
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
              short_description: 'Producto desconocido',
              features: ['Generic feature 1', 'Generic feature 2', 'Generic feature 3'],
              suggested_use_cases: ['casual', 'formal'],
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