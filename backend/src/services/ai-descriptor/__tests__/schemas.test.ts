// ai-descriptor/schemas.test.ts
// Tests for Zod schemas: DescribeProductInputSchema and ProductDescriptionSchema
// Updated to match new Spanish-specific field schemas

import { z } from 'zod';
import {
  DescribeProductInputSchema,
  ClothingSchema,
  AccessorySchema,
  FootwearSchema,
  ProductDescriptionSchema,
} from '../schemas';

describe('DescribeProductInputSchema', () => {
  describe('name field', () => {
    it('rejects missing name', () => {
      const result = DescribeProductInputSchema.safeParse({ category: 'VESTIDO' });
      expect(result.success).toBe(false);
      expect(result.error?.issues[0].path).toContain('name');
    });

    it('rejects empty string name', () => {
      const result = DescribeProductInputSchema.safeParse({ name: '', category: 'VESTIDO' });
      expect(result.success).toBe(false);
      expect(result.error?.issues[0].message).toBe('name cannot be empty');
    });

    it('accepts valid name', () => {
      const result = DescribeProductInputSchema.safeParse({ name: 'Vestido Rojo', category: 'VESTIDO' });
      expect(result.success).toBe(true);
    });
  });

  describe('category field', () => {
    it('rejects missing category', () => {
      const result = DescribeProductInputSchema.safeParse({ name: 'Vestido Rojo' });
      expect(result.success).toBe(false);
      expect(result.error?.issues[0].path).toContain('category');
    });

    it('rejects empty string category', () => {
      const result = DescribeProductInputSchema.safeParse({ name: 'Vestido Rojo', category: '' });
      expect(result.success).toBe(false);
      expect(result.error?.issues[0].message).toBe('category cannot be empty');
    });
  });

  describe('brand_description field', () => {
    it('accepts missing brand_description (optional)', () => {
      const result = DescribeProductInputSchema.safeParse({ name: 'Vestido Rojo', category: 'VESTIDO' });
      expect(result.success).toBe(true);
    });

    it('accepts provided brand_description', () => {
      const result = DescribeProductInputSchema.safeParse({
        name: 'Vestido Rojo',
        category: 'VESTIDO',
        brand_description: 'Elegante marca de moda colombiana',
      });
      expect(result.success).toBe(true);
    });

    it('rejects brand_description exceeding 500 chars', () => {
      const longDesc = 'a'.repeat(501);
      const result = DescribeProductInputSchema.safeParse({
        name: 'Vestido Rojo',
        category: 'VESTIDO',
        brand_description: longDesc,
      });
      expect(result.success).toBe(false);
      expect(result.error?.issues[0].path).toContain('brand_description');
    });
  });
});

describe('ClothingSchema', () => {
  it('accepts valid clothing description with all Spanish fields', () => {
    const validClothing = {
      product_type: 'CLOTHING',
      garment_type: 'Vestido',
      silhouette: 'Ajustado',
      primary_color: 'Rojo',
      secondary_colors: ['Negro', 'Dorado'],
      patterns: ['Liso', 'Con brillo'],
      materials: ['Seda', 'Algodón'],
      fit: 'Ajustado',
    };
    const result = ClothingSchema.safeParse(validClothing);
    expect(result.success).toBe(true);
  });

  it('accepts minimal clothing description (no optional fields in new schema)', () => {
    const minimalClothing = {
      product_type: 'CLOTHING',
      garment_type: 'Camisa',
      silhouette: 'Regular',
      primary_color: 'Azul',
      secondary_colors: [],
      patterns: [],
      materials: ['Algodón'],
      fit: 'Regular',
    };
    const result = ClothingSchema.safeParse(minimalClothing);
    expect(result.success).toBe(true);
  });

  it('rejects wrong product_type discriminant', () => {
    const invalid = {
      product_type: 'ACCESSORY',
      garment_type: 'Bolso',
      silhouette: 'Regular',
      primary_color: 'Negro',
      secondary_colors: [],
      patterns: [],
      materials: ['Cuero'],
      fit: 'Regular',
    };
    const result = ClothingSchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });

  it('rejects missing required fields', () => {
    const incomplete = {
      product_type: 'CLOTHING',
      garment_type: 'Vestido',
      // missing silhouette, primary_color, etc.
    };
    const result = ClothingSchema.safeParse(incomplete);
    expect(result.success).toBe(false);
  });

  it('rejects non-string garment_type', () => {
    const invalid = {
      product_type: 'CLOTHING',
      garment_type: 123,
      silhouette: 'Ajustado',
      primary_color: 'Rojo',
      secondary_colors: [],
      patterns: [],
      materials: ['Seda'],
      fit: 'Ajustado',
    };
    const result = ClothingSchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });
});

describe('AccessorySchema', () => {
  it('accepts valid accessory description with all Spanish fields', () => {
    const validAccessory = {
      product_type: 'ACCESSORY',
      accessory_type: 'Bolso',
      placement: 'Hombro',
      material: 'Cuero',
      primary_color: 'Negro',
      secondary_colors: ['Marrón'],
      patterns: ['Liso'],
    };
    const result = AccessorySchema.safeParse(validAccessory);
    expect(result.success).toBe(true);
  });

  it('accepts accessory without secondary_colors or patterns', () => {
    const valid = {
      product_type: 'ACCESSORY',
      accessory_type: 'Joya',
      placement: 'Cuello',
      material: 'Oro',
      primary_color: 'Dorado',
      secondary_colors: [],
      patterns: [],
    };
    const result = AccessorySchema.safeParse(valid);
    expect(result.success).toBe(true);
  });

  it('rejects wrong product_type discriminant', () => {
    const invalid = {
      product_type: 'CLOTHING',
      accessory_type: 'Vestido',
      placement: 'Cuerpo',
      material: 'Tela',
      primary_color: 'Azul',
      secondary_colors: [],
      patterns: [],
    };
    const result = AccessorySchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });
});

describe('FootwearSchema', () => {
  it('accepts valid footwear description with all Spanish fields', () => {
    const validFootwear = {
      product_type: 'FOOTWEAR',
      footwear_type: 'Zapatos',
      heel_height: 'Tacón alto',
      material: 'Cuero',
      primary_color: 'Negro',
      secondary_colors: ['Marrón'],
      patterns: ['Liso'],
    };
    const result = FootwearSchema.safeParse(validFootwear);
    expect(result.success).toBe(true);
  });

  it('accepts footwear without secondary_colors or patterns', () => {
    const valid = {
      product_type: 'FOOTWEAR',
      footwear_type: 'Sandalias',
      heel_height: 'Plano',
      material: 'Cuero',
      primary_color: 'Negro',
      secondary_colors: [],
      patterns: [],
    };
    const result = FootwearSchema.safeParse(valid);
    expect(result.success).toBe(true);
  });

  it('rejects wrong product_type discriminant', () => {
    const invalid = {
      product_type: 'CLOTHING',
      footwear_type: 'Vestido',
      heel_height: 'N/A',
      material: 'Tela',
      primary_color: 'Azul',
      secondary_colors: [],
      patterns: [],
    };
    const result = FootwearSchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });
});

describe('ProductDescriptionSchema (discriminated union)', () => {
  it('correctly narrows to ClothingDescription', () => {
    const clothing = {
      product_type: 'CLOTHING',
      garment_type: 'Vestido',
      silhouette: 'Ajustado',
      primary_color: 'Rojo',
      secondary_colors: [],
      patterns: [],
      materials: ['Seda'],
      fit: 'Ajustado',
    };
    const result = ProductDescriptionSchema.safeParse(clothing);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.product_type).toBe('CLOTHING');
    }
  });

  it('correctly narrows to AccessoryDescription', () => {
    const accessory = {
      product_type: 'ACCESSORY',
      accessory_type: 'Bolso',
      placement: 'Hombro',
      material: 'Cuero',
      primary_color: 'Negro',
      secondary_colors: [],
      patterns: [],
    };
    const result = ProductDescriptionSchema.safeParse(accessory);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.product_type).toBe('ACCESSORY');
    }
  });

  it('correctly narrows to FootwearDescription', () => {
    const footwear = {
      product_type: 'FOOTWEAR',
      footwear_type: 'Zapatos',
      heel_height: 'Tacón medio',
      material: 'Cuero',
      primary_color: 'Negro',
      secondary_colors: [],
      patterns: [],
    };
    const result = ProductDescriptionSchema.safeParse(footwear);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.product_type).toBe('FOOTWEAR');
    }
  });

  it('rejects object without product_type', () => {
    const noType = {
      garment_type: 'Vestido',
      silhouette: 'Ajustado',
      primary_color: 'Rojo',
      secondary_colors: [],
      patterns: [],
      materials: ['Seda'],
      fit: 'Ajustado',
    };
    const result = ProductDescriptionSchema.safeParse(noType);
    expect(result.success).toBe(false);
  });

  it('rejects invalid product_type value', () => {
    const invalid = {
      product_type: 'INVALID_TYPE',
      garment_type: 'Vestido',
      silhouette: 'Ajustado',
      primary_color: 'Rojo',
      secondary_colors: [],
      patterns: [],
      materials: ['Seda'],
      fit: 'Ajustado',
    };
    const result = ProductDescriptionSchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });
});