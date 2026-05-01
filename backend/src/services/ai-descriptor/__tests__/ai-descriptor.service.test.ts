// ai-descriptor/ai-descriptor.service.test.ts
// Tests for DescriptorService — Phase 3
// Updated to match new Spanish-specific field schemas

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
    it('calls vertexService.generateContent with formatted prompt and returns CLOTHING', async () => {
      mockGenerateContent.mockResolvedValue({
        candidates: [{
          content: {
            role: 'model',
            parts: [{ text: JSON.stringify({
              product_type: 'CLOTHING',
              garment_type: 'Vestido',
              silhouette: 'Ajustado',
              primary_color: 'Rojo',
              secondary_colors: ['Negro'],
              patterns: ['Liso'],
              materials: ['Seda'],
              fit: 'Ajustado',
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
      expect((result as any).garment_type).toBe('Vestido');
      expect((result as any).primary_color).toBe('Rojo');
    });

    it('returns AccessoryDescription for BOLSA category', async () => {
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

      const result = await service.describeProduct({
        name: 'Bolso de Mano',
        category: 'BOLSA',
      });

      expect(result.product_type).toBe('ACCESSORY');
      expect((result as any).accessory_type).toBe('Bolso');
      expect((result as any).material).toBe('Cuero');
    });

    it('returns FootwearDescription for ZAPATOS category', async () => {
      mockGenerateContent.mockResolvedValue({
        candidates: [{
          content: {
            role: 'model',
            parts: [{ text: JSON.stringify({
              product_type: 'FOOTWEAR',
              footwear_type: 'Zapatos',
              heel_height: 'Tacón medio',
              material: 'Cuero',
              primary_color: 'Negro',
              secondary_colors: [],
              patterns: ['Liso'],
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
      expect((result as any).footwear_type).toBe('Zapatos');
      expect((result as any).heel_height).toBe('Tacón medio');
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
              garment_type: 'Vestido',
              // missing required fields - will fail Zod validation
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