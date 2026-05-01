// ai-descriptor/formatters/accessory.formatter.test.ts
// Tests for AccessoryFormatter

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
  });

  describe('parseResponse', () => {
    it('parses valid JSON and returns typed object', () => {
      const rawResponse = JSON.stringify({
        product_type: 'ACCESSORY',
        short_description: 'Elegante bolso de cuero',
        features: ['Cuero genuino', 'Diseño elegante'],
        material_notes: '100% cuero vacuno',
      });
      const result = formatter.parseResponse(rawResponse);
      expect(result).toBeDefined();
      expect((result as any).product_type).toBe('ACCESSORY');
      expect((result as any).material_notes).toBe('100% cuero vacuno');
    });

    it('parses without optional material_notes', () => {
      const rawResponse = JSON.stringify({
        product_type: 'ACCESSORY',
        short_description: 'Elegante bolso',
        features: ['Cuero', 'Elegante'],
      });
      const result = formatter.parseResponse(rawResponse);
      expect(result).toBeDefined();
      expect((result as any).product_type).toBe('ACCESSORY');
    });

    it('throws error for invalid JSON', () => {
      const invalidJson = 'not valid json {';
      expect(() => formatter.parseResponse(invalidJson)).toThrow();
    });
  });
});