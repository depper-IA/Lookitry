// ai-descriptor/ai-descriptor.service.test.ts
// Tests for DescriptorService — Phase 3

import { ClothingFormatter } from '../formatters/clothing.formatter';
import { AccessoryFormatter } from '../formatters/accessory.formatter';
import { FootwearFormatter } from '../formatters/footwear.formatter';

// Mock vertexService before importing service
const mockGenerateContent = jest.fn();
jest.mock('../../../services/vertex.service', () => ({
  vertexService: {
    generateContent: mockGenerateContent,
  },
}));

// Import after mock
import { DescriptorService } from '../ai-descriptor.service';
import { ZodError } from 'zod';

describe('DescriptorService', () => {
  let service: DescriptorService;

  beforeEach(() => {
    service = new DescriptorService();
    mockGenerateContent.mockReset();
  });

  describe('category-to-formatter routing', () => {
    it('routes VESTIDO to ClothingFormatter', () => {
      const formatter = service['getFormatter']('VESTIDO');
      expect(formatter).toBeInstanceOf(ClothingFormatter);
    });

    it('routes CAMISA to ClothingFormatter', () => {
      const formatter = service['getFormatter']('CAMISA');
      expect(formatter).toBeInstanceOf(ClothingFormatter);
    });

    it('routes PANTALON to ClothingFormatter', () => {
      const formatter = service['getFormatter']('PANTALON');
      expect(formatter).toBeInstanceOf(ClothingFormatter);
    });

    it('routes FALDA to ClothingFormatter', () => {
      const formatter = service['getFormatter']('FALDA');
      expect(formatter).toBeInstanceOf(ClothingFormatter);
    });

    it('routes CHAQUETA to ClothingFormatter', () => {
      const formatter = service['getFormatter']('CHAQUETA');
      expect(formatter).toBeInstanceOf(ClothingFormatter);
    });

    it('routes CONJUNTO to ClothingFormatter', () => {
      const formatter = service['getFormatter']('CONJUNTO');
      expect(formatter).toBeInstanceOf(ClothingFormatter);
    });

    it('routes TOP to ClothingFormatter', () => {
      const formatter = service['getFormatter']('TOP');
      expect(formatter).toBeInstanceOf(ClothingFormatter);
    });

    it('routes ACCESORIO to AccessoryFormatter', () => {
      const formatter = service['getFormatter']('ACCESORIO');
      expect(formatter).toBeInstanceOf(AccessoryFormatter);
    });

    it('routes BOLSA to AccessoryFormatter', () => {
      const formatter = service['getFormatter']('BOLSA');
      expect(formatter).toBeInstanceOf(AccessoryFormatter);
    });

    it('routes JOYA to AccessoryFormatter', () => {
      const formatter = service['getFormatter']('JOYA');
      expect(formatter).toBeInstanceOf(AccessoryFormatter);
    });

    it('routes BUFANDA to AccessoryFormatter', () => {
      const formatter = service['getFormatter']('BUFANDA');
      expect(formatter).toBeInstanceOf(AccessoryFormatter);
    });

    it('routes GORRA to AccessoryFormatter', () => {
      const formatter = service['getFormatter']('GORRA');
      expect(formatter).toBeInstanceOf(AccessoryFormatter);
    });

    it('routes ZAPATOS to FootwearFormatter', () => {
      const formatter = service['getFormatter']('ZAPATOS');
      expect(formatter).toBeInstanceOf(FootwearFormatter);
    });

    it('routes SHOES to FootwearFormatter', () => {
      const formatter = service['getFormatter']('SHOES');
      expect(formatter).toBeInstanceOf(FootwearFormatter);
    });

    it('routes CALZADO to FootwearFormatter', () => {
      const formatter = service['getFormatter']('CALZADO');
      expect(formatter).toBeInstanceOf(FootwearFormatter);
    });

    it('routes SANDALIAS to FootwearFormatter', () => {
      const formatter = service['getFormatter']('SANDALIAS');
      expect(formatter).toBeInstanceOf(FootwearFormatter);
    });
  });

  describe('unknown category fallback', () => {
    it('defaults UNKNOWN_CATEGORY to ClothingFormatter with warning', () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
      const formatter = service['getFormatter']('UNKNOWN_CATEGORY');
      expect(formatter).toBeInstanceOf(ClothingFormatter);
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('UNKNOWN_CATEGORY')
      );
      consoleSpy.mockRestore();
    });
  });

  describe('describeProduct happy path', () => {
    it('calls vertexService.generateContent with formatted prompt', async () => {
      mockGenerateContent.mockResolvedValue({
        candidates: [{
          content: {
            role: 'model',
            parts: [{ text: JSON.stringify({
              product_type: 'CLOTHING',
              short_description: 'A beautiful red dress',
              features: ['Elegant', 'Flowing', 'Comfortable'],
              suggested_use_cases: ['Party', 'Date night'],
            }) }],
          },
          finishReason: 'STOP',
        }],
      });

      const result = await service.describeProduct({
        name: 'Vestido Rojo',
        category: 'VESTIDO',
      });

      expect(mockGenerateContent).toHaveBeenCalledWith(
        expect.objectContaining({
          contents: expect.arrayContaining([
            expect.objectContaining({
              parts: expect.arrayContaining([
                expect.objectContaining({
                  text: expect.stringContaining('Vestido Rojo'),
                }),
              ]),
            }),
          ]),
        })
      );
      expect(result.product_type).toBe('CLOTHING');
      expect(result.short_description).toBe('A beautiful red dress');
    });

    it('returns AccessoryDescription for BOLSA category', async () => {
      mockGenerateContent.mockResolvedValue({
        candidates: [{
          content: {
            role: 'model',
            parts: [{ text: JSON.stringify({
              product_type: 'ACCESSORY',
              short_description: 'Leather handbag',
              features: ['Genuine leather', 'Spacious'],
              material_notes: 'Full grain leather',
            }) }],
          },
          finishReason: 'STOP',
        }],
      });

      const result = await service.describeProduct({
        name: 'Bolso de Mano',
        category: 'BOLSA',
      });

      expect(result.product_type).toBe('ACCESSORY');
      expect(result.short_description).toBe('Leather handbag');
      expect((result as any).material_notes).toBe('Full grain leather');
    });

    it('returns FootwearDescription for ZAPATOS category', async () => {
      mockGenerateContent.mockResolvedValue({
        candidates: [{
          content: {
            role: 'model',
            parts: [{ text: JSON.stringify({
              product_type: 'FOOTWEAR',
              short_description: 'Formal black shoes',
              features: ['Leather upper', 'Cushioned sole'],
              style_notes: 'Classic design',
              comfort_features: ['Arch support', 'Breathable'],
            }) }],
          },
          finishReason: 'STOP',
        }],
      });

      const result = await service.describeProduct({
        name: 'Zapatos Formales',
        category: 'ZAPATOS',
      });

      expect(result.product_type).toBe('FOOTWEAR');
      expect(result.short_description).toBe('Formal black shoes');
      expect((result as any).comfort_features).toHaveLength(2);
    });
  });

  describe('error handling', () => {
    it('throws ValidationError (502) on Zod validation failure', async () => {
      mockGenerateContent.mockResolvedValue({
        candidates: [{
          content: {
            role: 'model',
            parts: [{ text: JSON.stringify({
              product_type: 'CLOTHING',
              short_description: 'A dress',
              features: ['Only one feature'], // violates min(3)
              suggested_use_cases: ['Party'],
            }) }],
          },
          finishReason: 'STOP',
        }],
      });

      await expect(service.describeProduct({
        name: 'Vestido',
        category: 'VESTIDO',
      })).rejects.toMatchObject({
        message: expect.stringContaining('validation'),
        statusCode: 502,
      });
    });

    it('throws VertexError (500) on non-JSON response', async () => {
      mockGenerateContent.mockResolvedValue({
        candidates: [{
          content: {
            role: 'model',
            parts: [{ text: 'NOT JSON AT ALL' }],
          },
          finishReason: 'STOP',
        }],
      });

      await expect(service.describeProduct({
        name: 'Vestido',
        category: 'VESTIDO',
      })).rejects.toMatchObject({
        message: expect.stringContaining('JSON'),
        statusCode: 500,
      });
    });

    it('throws VertexError (500) on Vertex service error', async () => {
      mockGenerateContent.mockResolvedValue({
        error: 'Model capacity exceeded',
      });

      await expect(service.describeProduct({
        name: 'Vestido',
        category: 'VESTIDO',
      })).rejects.toMatchObject({
        message: expect.stringContaining('Vertex'),
        statusCode: 500,
      });
    });

    it('throws VertexError (500) on empty candidates', async () => {
      mockGenerateContent.mockResolvedValue({
        candidates: [],
      });

      await expect(service.describeProduct({
        name: 'Vestido',
        category: 'VESTIDO',
      })).rejects.toMatchObject({
        statusCode: 500,
      });
    });
  });
});