// ai-descriptor/schemas.test.ts
// Tests for Zod schemas: DescribeProductInputSchema and ProductDescriptionSchema

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
  it('accepts valid clothing description', () => {
    const validClothing = {
      product_type: 'CLOTHING',
      short_description: 'Elegante vestido rojo para ocasiones especiales',
      features: ['Tela suave', 'Corte clasico', 'Color vibrante'],
      suggested_use_cases: ['Citas', 'Eventos formales'],
    };
    const result = ClothingSchema.safeParse(validClothing);
    expect(result.success).toBe(true);
  });

  it('rejects short_description exceeding 80 chars', () => {
    const invalid = {
      product_type: 'CLOTHING',
      short_description: 'a'.repeat(81),
      features: ['Feature 1'],
      suggested_use_cases: ['Use case 1'],
    };
    const result = ClothingSchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });

  it('rejects features array with fewer than 3 items', () => {
    const invalid = {
      product_type: 'CLOTHING',
      short_description: 'Short desc',
      features: ['Only one'],
      suggested_use_cases: ['Use case 1'],
    };
    const result = ClothingSchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });

  it('rejects features array with more than 6 items', () => {
    const invalid = {
      product_type: 'CLOTHING',
      short_description: 'Short desc',
      features: ['F1', 'F2', 'F3', 'F4', 'F5', 'F6', 'F7'],
      suggested_use_cases: ['Use case 1'],
    };
    const result = ClothingSchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });

  it('rejects suggested_use_cases with fewer than 2 items', () => {
    const invalid = {
      product_type: 'CLOTHING',
      short_description: 'Short desc',
      features: ['F1', 'F2', 'F3'],
      suggested_use_cases: ['Only one'],
    };
    const result = ClothingSchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });

  it('rejects suggested_use_cases with more than 4 items', () => {
    const invalid = {
      product_type: 'CLOTHING',
      short_description: 'Short desc',
      features: ['F1', 'F2', 'F3'],
      suggested_use_cases: ['U1', 'U2', 'U3', 'U4', 'U5'],
    };
    const result = ClothingSchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });

  it('rejects wrong product_type discriminant', () => {
    const invalid = {
      product_type: 'ACCESSORY',
      short_description: 'Short desc',
      features: ['F1', 'F2', 'F3'],
      suggested_use_cases: ['U1', 'U2'],
    };
    const result = ClothingSchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });
});

describe('AccessorySchema', () => {
  it('accepts valid accessory description', () => {
    const validAccessory = {
      product_type: 'ACCESSORY',
      short_description: 'Bolso de cuero elegante',
      features: ['Cuero genuino', 'Costuras reforzadas'],
      material_notes: '100% cuero vacuno',
    };
    const result = AccessorySchema.safeParse(validAccessory);
    expect(result.success).toBe(true);
  });

  it('accepts accessory without optional material_notes', () => {
    const valid = {
      product_type: 'ACCESSORY',
      short_description: 'Bolso elegante',
      features: ['Cuero', 'Elegante'],
    };
    const result = AccessorySchema.safeParse(valid);
    expect(result.success).toBe(true);
  });

  it('rejects features array with fewer than 2 items', () => {
    const invalid = {
      product_type: 'ACCESSORY',
      short_description: 'Short desc',
      features: ['Only one'],
    };
    const result = AccessorySchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });

  it('rejects features array with more than 5 items', () => {
    const invalid = {
      product_type: 'ACCESSORY',
      short_description: 'Short desc',
      features: ['F1', 'F2', 'F3', 'F4', 'F5', 'F6'],
    };
    const result = AccessorySchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });
});

describe('FootwearSchema', () => {
  it('accepts valid footwear description', () => {
    const validFootwear = {
      product_type: 'FOOTWEAR',
      short_description: 'Zapatos formales negros',
      features: ['Cuero legitimo', 'Suela de goma'],
      style_notes: 'Diseño clásico',
      comfort_features: ['Plantilla acolchada', 'Soporte de arco'],
    };
    const result = FootwearSchema.safeParse(validFootwear);
    expect(result.success).toBe(true);
  });

  it('accepts footwear without optional style_notes', () => {
    const valid = {
      product_type: 'FOOTWEAR',
      short_description: 'Zapatos formales',
      features: ['Cuero', 'Elegante'],
      comfort_features: ['Plantilla suave'],
    };
    const result = FootwearSchema.safeParse(valid);
    expect(result.success).toBe(true);
  });

  it('rejects comfort_features with fewer than 1 item', () => {
    const invalid = {
      product_type: 'FOOTWEAR',
      short_description: 'Short desc',
      features: ['F1', 'F2'],
      comfort_features: [],
    };
    const result = FootwearSchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });

  it('rejects comfort_features with more than 3 items', () => {
    const invalid = {
      product_type: 'FOOTWEAR',
      short_description: 'Short desc',
      features: ['F1', 'F2'],
      comfort_features: ['C1', 'C2', 'C3', 'C4'],
    };
    const result = FootwearSchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });
});

describe('ProductDescriptionSchema (discriminated union)', () => {
  it('correctly narrows to ClothingDescription', () => {
    const clothing = {
      product_type: 'CLOTHING',
      short_description: 'Vestido elegante',
      features: ['F1', 'F2', 'F3'],
      suggested_use_cases: ['U1', 'U2'],
    };
    const result = ProductDescriptionSchema.safeParse(clothing);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.product_type).toBe('CLOTHING');
      expect((result.data as any).suggested_use_cases).toBeDefined();
    }
  });

  it('correctly narrows to AccessoryDescription', () => {
    const accessory = {
      product_type: 'ACCESSORY',
      short_description: 'Bolso elegante',
      features: ['F1', 'F2'],
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
      short_description: 'Zapatos formales',
      features: ['F1', 'F2'],
      comfort_features: ['C1'],
    };
    const result = ProductDescriptionSchema.safeParse(footwear);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.product_type).toBe('FOOTWEAR');
      expect((result.data as any).comfort_features).toBeDefined();
    }
  });

  it('rejects object without product_type', () => {
    const noType = {
      short_description: 'Some description',
      features: ['F1', 'F2', 'F3'],
    };
    const result = ProductDescriptionSchema.safeParse(noType);
    expect(result.success).toBe(false);
  });

  it('rejects invalid product_type value', () => {
    const invalid = {
      product_type: 'INVALID_TYPE',
      short_description: 'Some description',
      features: ['F1', 'F2', 'F3'],
    };
    const result = ProductDescriptionSchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });
});