// ai-descriptor/formatters/accessory.formatter.test.ts
// Tests for AccessoryFormatter — updated for Spanish-specific schema

import { AccessoryFormatter } from '../../formatters/accessory.formatter';

describe('AccessoryFormatter', () => {
  let formatter: AccessoryFormatter;

  beforeEach(() => {
    formatter = new AccessoryFormatter();
  });

  describe('getProductType', () => {
    it('returns ACCESSORY', () => {
      expect(formatter.getProductType()).toBe('ACCESSORY');
    });
  });

  describe('buildPrompt', () => {
    it('includes Spanish instruction at start of prompt', () => {
      const prompt = formatter.buildPrompt('Bolso de Cuero', 'BOLSA');
      expect(prompt).toContain('Responde ÚNICAMENTE en ESPAÑOL');
    });

    it('includes product name in prompt', () => {
      const prompt = formatter.buildPrompt('Bolso de Cuero', 'BOLSA');
      expect(prompt).toContain('Bolso de Cuero');
    });

    it('includes category in prompt', () => {
      const prompt = formatter.buildPrompt('Bolso de Cuero', 'BOLSA');
      expect(prompt).toContain('BOLSA');
    });

    it('includes brand_description when provided', () => {
      const prompt = formatter.buildPrompt('Bolso', 'BOLSA', 'Marca de lujo');
      expect(prompt).toContain('Marca de lujo');
    });

    it('builds prompt without brand_description', () => {
      const prompt = formatter.buildPrompt('Bolso', 'BOLSA');
      expect(prompt).toContain('Bolso');
    });

    it('maps ACCESORIO category correctly', () => {
      const prompt = formatter.buildPrompt('Accesorio', 'ACCESORIO');
      expect(prompt).toContain('ACCESSORY');
    });

    it('maps BOLSA category correctly', () => {
      const prompt = formatter.buildPrompt('Bolso', 'BOLSA');
      expect(prompt).toContain('BAG');
    });

    it('maps JOYA category correctly', () => {
      const prompt = formatter.buildPrompt('Joyas', 'JOYA');
      expect(prompt).toContain('JEWELRY');
    });

    it('maps BUFANDA category correctly', () => {
      const prompt = formatter.buildPrompt('Bufanda', 'BUFANDA');
      expect(prompt).toContain('SCARF');
    });

    it('maps GORRA category correctly', () => {
      const prompt = formatter.buildPrompt('Gorra', 'GORRA');
      expect(prompt).toContain('HAT');
    });

    it('includes new Spanish field schema in prompt', () => {
      const prompt = formatter.buildPrompt('Bolso', 'BOLSA');
      expect(prompt).toContain('accessory_type');
      expect(prompt).toContain('placement');
      expect(prompt).toContain('material');
      expect(prompt).toContain('primary_color');
      expect(prompt).toContain('secondary_colors');
      expect(prompt).toContain('patterns');
      // Old fields should NOT be present
      expect(prompt).not.toContain('short_description');
      expect(prompt).not.toContain('features');
      expect(prompt).not.toContain('material_notes');
    });
  });

  describe('parseResponse', () => {
    it('parses valid JSON with new Spanish fields and returns typed object', () => {
      const rawResponse = JSON.stringify({
        product_type: 'ACCESSORY',
        accessory_type: 'Bolso',
        placement: 'Hombro',
        material: 'Cuero',
        primary_color: 'Negro',
        secondary_colors: ['Marrón'],
        patterns: ['Liso'],
      });
      const result = formatter.parseResponse(rawResponse);
      expect(result).toBeDefined();
      expect((result as any).product_type).toBe('ACCESSORY');
      expect((result as any).accessory_type).toBe('Bolso');
      expect((result as any).material).toBe('Cuero');
    });

    it('throws error for invalid JSON', () => {
      const invalidJson = 'not valid json {';
      expect(() => formatter.parseResponse(invalidJson)).toThrow();
    });
  });
});