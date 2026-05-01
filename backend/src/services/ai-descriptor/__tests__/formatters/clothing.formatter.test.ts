// ai-descriptor/formatters/clothing.formatter.test.ts
// Tests for ClothingFormatter

import { ClothingFormatter } from '../../formatters/clothing.formatter';

describe('ClothingFormatter', () => {
  let formatter: ClothingFormatter;

  beforeEach(() => {
    formatter = new ClothingFormatter();
  });

  describe('getProductType', () => {
    it('returns CLOTHING', () => {
      expect(formatter.getProductType()).toBe('CLOTHING');
    });
  });

  describe('buildPrompt', () => {
    it('includes product name in prompt', () => {
      const prompt = formatter.buildPrompt('Vestido Rojo', 'VESTIDO');
      expect(prompt).toContain('Vestido Rojo');
    });

    it('includes category in prompt', () => {
      const prompt = formatter.buildPrompt('Vestido Rojo', 'VESTIDO');
      expect(prompt).toContain('VESTIDO');
    });

    it('includes RULES_BY_CATEGORY context for VESTIDO', () => {
      const prompt = formatter.buildPrompt('Vestido Rojo', 'VESTIDO');
      expect(prompt).toContain('DRESS');
      expect(prompt).toContain('FULL OUTFIT REMOVAL');
    });

    it('includes RULES_BY_CATEGORY context for CAMISA', () => {
      const prompt = formatter.buildPrompt('Camisa Blanca', 'CAMISA');
      expect(prompt).toContain('SHIRT');
      expect(prompt).toContain('upper body');
    });

    it('includes brand_description when provided', () => {
      const prompt = formatter.buildPrompt('Vestido Rojo', 'VESTIDO', 'Marca elegante de Colombia');
      expect(prompt).toContain('Marca elegante de Colombia');
    });

    it('builds prompt without brand_description', () => {
      const prompt = formatter.buildPrompt('Vestido Rojo', 'VESTIDO');
      expect(prompt).toContain('Vestido Rojo');
      expect(prompt).toContain('VESTIDO');
    });

    it('maps VESTIDO category correctly', () => {
      const prompt = formatter.buildPrompt('Vestido', 'VESTIDO');
      expect(prompt).toContain('DRESS');
    });

    it('maps CAMISA category correctly', () => {
      const prompt = formatter.buildPrompt('Camisa', 'CAMISA');
      expect(prompt).toContain('SHIRT');
    });

    it('maps PANTALON category correctly', () => {
      const prompt = formatter.buildPrompt('Pantalon', 'PANTALON');
      expect(prompt).toContain('PANTS');
    });

    it('maps FALDA category correctly', () => {
      const prompt = formatter.buildPrompt('Falda', 'FALDA');
      expect(prompt).toContain('SKIRT');
    });

    it('maps CHAQUETA category correctly', () => {
      const prompt = formatter.buildPrompt('Chaqueta', 'CHAQUETA');
      expect(prompt).toContain('JACKET');
    });

    it('maps CONJUNTO category correctly', () => {
      const prompt = formatter.buildPrompt('Conjunto', 'CONJUNTO');
      expect(prompt).toContain('OUTFIT');
    });

    it('maps TOP category correctly', () => {
      const prompt = formatter.buildPrompt('Top', 'TOP');
      expect(prompt).toContain('TOP');
    });
  });

  describe('parseResponse', () => {
    it('parses valid JSON and returns typed object', () => {
      const rawResponse = JSON.stringify({
        product_type: 'CLOTHING',
        short_description: 'Elegante vestido rojo',
        features: ['Feature 1', 'Feature 2', 'Feature 3'],
        suggested_use_cases: ['Citas', 'Eventos'],
      });
      const result = formatter.parseResponse(rawResponse);
      expect(result).toBeDefined();
      expect((result as any).product_type).toBe('CLOTHING');
      expect((result as any).short_description).toBe('Elegante vestido rojo');
    });

    it('throws error for invalid JSON', () => {
      const invalidJson = 'not valid json {';
      expect(() => formatter.parseResponse(invalidJson)).toThrow();
    });

    it('throws error for empty string', () => {
      expect(() => formatter.parseResponse('')).toThrow();
    });
  });
});