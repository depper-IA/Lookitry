// ai-descriptor/schemas.ts
// Zod schemas for AI Product Descriptor — discriminated union for CLOTHING, ACCESSORY, FOOTWEAR

import { z } from 'zod';

// ——————————————————————————————————————————————————————————————
// Input Schema
// ——————————————————————————————————————————————————————————————

export const DescribeProductInputSchema = z.object({
  name: z
    .string()
    .transform((v) => v.trim())
    .refine((v) => v.length > 0, { message: 'name cannot be empty' }),
  category: z
    .string()
    .transform((v) => v.trim())
    .refine((v) => v.length > 0, { message: 'category cannot be empty' }),
  brand_description: z.string().max(500).optional(),
});

export type DescribeProductInput = z.infer<typeof DescribeProductInputSchema>;

// ——————————————————————————————————————————————————————————————
// Base Description
// ——————————————————————————————————————————————————————————————

interface BaseDescription {
  short_description: string;
  product_type: 'CLOTHING' | 'ACCESSORY' | 'FOOTWEAR';
}

// ——————————————————————————————————————————————————————————————
// CLOTHING Schema
// ——————————————————————————————————————————————————————————————

export const ClothingSchema = z.object({
  product_type: z.literal('CLOTHING'),
  short_description: z.string().max(80),
  features: z.array(z.string()).min(3).max(6),
  suggested_use_cases: z.array(z.string()).min(2).max(4),
});

export type ClothingDescription = BaseDescription &
  (z.infer<typeof ClothingSchema> & { product_type: 'CLOTHING' });

// ——————————————————————————————————————————————————————————————
// ACCESSORY Schema
// ——————————————————————————————————————————————————————————————

export const AccessorySchema = z.object({
  product_type: z.literal('ACCESSORY'),
  short_description: z.string().max(80),
  features: z.array(z.string()).min(2).max(5),
  material_notes: z.string().optional(),
});

export type AccessoryDescription = BaseDescription &
  (z.infer<typeof AccessorySchema> & { product_type: 'ACCESSORY' });

// ——————————————————————————————————————————————————————————————
// FOOTWEAR Schema
// ——————————————————————————————————————————————————————————————

export const FootwearSchema = z.object({
  product_type: z.literal('FOOTWEAR'),
  short_description: z.string().max(80),
  features: z.array(z.string()).min(2).max(5),
  style_notes: z.string().optional(),
  comfort_features: z.array(z.string()).min(1).max(3),
});

export type FootwearDescription = BaseDescription &
  (z.infer<typeof FootwearSchema> & { product_type: 'FOOTWEAR' });

// ——————————————————————————————————————————————————————————————
// Discriminated Union
// ——————————————————————————————————————————————————————————————

export const ProductDescriptionSchema = z.discriminatedUnion('product_type', [
  ClothingSchema,
  AccessorySchema,
  FootwearSchema,
]);

export type ProductDescription = z.infer<typeof ProductDescriptionSchema>;