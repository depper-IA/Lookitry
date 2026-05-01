// ai-descriptor/formatters/footwear.formatter.test.ts
// Tests for FootwearFormatter — updated for Spanish-specific schema

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
    it('includes Spanish instruction at start of prompt', () => {
      const prompt = formatter.buildPrompt('Zapatos Formales', 'ZAPATOS');
      expect(prompt).toContain('Responde ÚNICAMENTE en ESPAÑOL');
    });

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

    it('includes new Spanish field schema in prompt', () => {
      const prompt = formatter.buildPrompt('Zapatos', 'ZAPATOS');
      expect(prompt).toContain('footwear_type');
      expect(prompt).toContain('heel_height');
      expect(prompt).toContain('material');
      expect(prompt).toContain('primary_color');
      expect(prompt).toContain('secondary_colors');
      expect(prompt).toContain('patterns');
      // Old fields should NOT be present
      expect(prompt).not.toContain('short_description');
      expect(prompt).not.toContain('features');
      expect(prompt).not.toContain('style_notes');
      expect(prompt).not.toContain('comfort_features');
    });
  });

  describe('parseResponse', () => {
    it('parses valid JSON with new Spanish fields and returns typed object', () => {
      const rawResponse = JSON.stringify({
        product_type: 'FOOTWEAR',
        footwear_type: 'Zapatos',
        heel_height: 'Tacón alto',
        material: 'Cuero',
        primary_color: 'Negro',
        secondary_colors: ['Marrón'],
        patterns: ['Liso'],
      });
      const result = formatter.parseResponse(rawResponse);
      expect(result).toBeDefined();
      expect((result as any).product_type).toBe('FOOTWEAR');
      expect((result as any).footwear_type).toBe('Zapatos');
      expect((result as any).heel_height).toBe('Tacón alto');
    });

    it('throws error for invalid JSON', () => {
      const invalidJson = 'not valid json {';
      expect(() => formatter.parseResponse(invalidJson)).toThrow();
    });
  });
});