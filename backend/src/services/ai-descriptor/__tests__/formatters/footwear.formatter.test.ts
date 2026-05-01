// ai-descriptor/formatters/footwear.formatter.test.ts
// Tests for FootwearFormatter

import { FootwearFormatter } from '../../formatters/footwear.formatter';

describe('FootwearFormatter', () => {
  let formatter: FootwearFormatter;

  beforeEach(() => {
    formatter = new FootwearFormatter();
  });

  describe('getProductType', () => {
    it('returns FOOTWEAR', () => {
      expect(formatter.getProductType()).toBe('FOOTWEAR');
    });
  });

  describe('buildPrompt', () => {
    it('includes product name in prompt', () => {
      const prompt = formatter.buildPrompt('Zapatos Formales', 'ZAPATOS');
      expect(prompt).toContain('Zapatos Formales');
    });

    it('includes category in prompt', () => {
      const prompt = formatter.buildPrompt('Zapatos Formales', 'ZAPATOS');
      expect(prompt).toContain('ZAPATOS');
    });

    it('includes brand_description when provided', () => {
      const prompt = formatter.buildPrompt('Zapatos', 'ZAPATOS', 'Marca italiana');
      expect(prompt).toContain('Marca italiana');
    });

    it('builds prompt without brand_description', () => {
      const prompt = formatter.buildPrompt('Zapatos', 'ZAPATOS');
      expect(prompt).toContain('Zapatos');
    });

    it('maps ZAPATOS category correctly', () => {
      const prompt = formatter.buildPrompt('Zapatos', 'ZAPATOS');
      expect(prompt).toContain('FOOTWEAR');
    });

    it('maps SHOES category correctly', () => {
      const prompt = formatter.buildPrompt('Shoes', 'SHOES');
      expect(prompt).toContain('SHOES');
    });

    it('maps CALZADO category correctly', () => {
      const prompt = formatter.buildPrompt('Calzado', 'CALZADO');
      expect(prompt).toContain('FOOTWEAR');
    });

    it('maps SANDALIAS category correctly', () => {
      const prompt = formatter.buildPrompt('Sandalias', 'SANDALIAS');
      expect(prompt).toContain('SANDALS');
    });
  });

  describe('parseResponse', () => {
    it('parses valid JSON and returns typed object', () => {
      const rawResponse = JSON.stringify({
        product_type: 'FOOTWEAR',
        short_description: 'Elegantes zapatos formales',
        features: ['Cuero legitimo', 'Suela de goma'],
        style_notes: 'Diseño clásico',
        comfort_features: ['Plantilla acolchada', 'Soporte de arco'],
      });
      const result = formatter.parseResponse(rawResponse);
      expect(result).toBeDefined();
      expect((result as any).product_type).toBe('FOOTWEAR');
      expect((result as any).comfort_features).toContain('Plantilla acolchada');
    });

    it('parses without optional style_notes', () => {
      const rawResponse = JSON.stringify({
        product_type: 'FOOTWEAR',
        short_description: 'Zapatos cómodos',
        features: ['Cuero', 'Suave'],
        comfort_features: ['Plantilla suave'],
      });
      const result = formatter.parseResponse(rawResponse);
      expect(result).toBeDefined();
      expect((result as any).product_type).toBe('FOOTWEAR');
    });

    it('throws error for invalid JSON', () => {
      const invalidJson = 'not valid json {';
      expect(() => formatter.parseResponse(invalidJson)).toThrow();
    });
  });
});