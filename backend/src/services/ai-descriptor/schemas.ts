// ai-descriptor/schemas.ts
// Zod schemas for AI Product Descriptor — discriminated union for CLOTHING, ACCESSORY, FOOTWEAR
// All field descriptions are in Spanish to guide Gemini's JSON output

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
  image_url: z.string().url().optional(),
});

export type DescribeProductInput = z.infer<typeof DescribeProductInputSchema>;

// ——————————————————————————————————————————————————————————————
// CLOTHING Schema — Specific fashion attributes in Spanish
// ——————————————————————————————————————————————————————————————

export const ClothingSchema = z.object({
  product_type: z.literal('CLOTHING').describe('Tipo de producto: CLOTHING'),
  garment_type: z.string().describe('Tipo de prenda en español (ej: Vestido, Camisa, Pantalón)'),
  silhouette: z.string().describe('Silueta o corte en español (ej: Ajustado, Holgado, Recto)'),
  primary_color: z.string().describe('Color primario en español (ej: Rojo, Azul, Negro)'),
  secondary_colors: z.array(z.string()).describe('Colores secundarios en español'),
  patterns: z.array(z.string()).describe('Patrones o estampados en español'),
  materials: z.array(z.string()).describe('Materiales principales en español'),
  fit: z.string().describe('Tipo de ajuste en español (ej: Ajustado, Regular, Holgado)'),
  extra_attributes: z.record(z.string(), z.string()).optional().describe('Cualquier otro atributo específico de esta prenda en español (ej: "Estilo de cuello", "Tipo de manga")'),
});

export type ClothingDescription = z.infer<typeof ClothingSchema>;

// ——————————————————————————————————————————————————————————————
// ACCESSORY Schema — Specific fashion attributes in Spanish
// ——————————————————————————————————————————————————————————————

export const AccessorySchema = z.object({
  product_type: z.literal('ACCESSORY').describe('Tipo de producto: ACCESSORY'),
  accessory_type: z.string().describe('Tipo de accesorio en español (ej: Bolso, Joya, Bufanda, Casco, Lentes)'),
  placement: z.string().describe('Lugar del cuerpo donde se usa en español (ej: Muñeca, Cuello, Cabeza, Ojos)'),
  material: z.string().describe('Material principal en español'),
  primary_color: z.string().describe('Color primario en español'),
  secondary_colors: z.array(z.string()).describe('Colores secundarios en español'),
  patterns: z.array(z.string()).describe('Patrones o estampados en español'),
  extra_attributes: z.record(z.string(), z.string()).optional().describe('Cualquier otro atributo específico de este accesorio en español (ej: "Protección UV" para lentes, "Certificación" para cascos)'),
});

export type AccessoryDescription = z.infer<typeof AccessorySchema>;

// ——————————————————————————————————————————————————————————————
// FOOTWEAR Schema — Specific fashion attributes in Spanish
// ——————————————————————————————————————————————————————————————

export const FootwearSchema = z.object({
  product_type: z.literal('FOOTWEAR').describe('Tipo de producto: FOOTWEAR'),
  footwear_type: z.string().describe('Tipo de calzado en español (ej: Zapatos, Botas, Sandalias)'),
  heel_height: z.string().describe('Altura del tacón en español (ej: Tacón alto, Plano, Plataforma)'),
  material: z.string().describe('Material principal en español'),
  primary_color: z.string().describe('Color primario en español'),
  secondary_colors: z.array(z.string()).describe('Colores secundarios en español'),
  patterns: z.array(z.string()).describe('Patrones o estampados en español'),
  extra_attributes: z.record(z.string(), z.string()).optional().describe('Cualquier otro atributo específico de este calzado en español (ej: "Tipo de suela", "Tipo de cierre")'),
});

export type FootwearDescription = z.infer<typeof FootwearSchema>;

// ——————————————————————————————————————————————————————————————
// Discriminated Union
// ——————————————————————————————————————————————————————————————

export const ProductDescriptionSchema = z.discriminatedUnion('product_type', [
  ClothingSchema,
  AccessorySchema,
  FootwearSchema,
]);

export type ProductDescription = z.infer<typeof ProductDescriptionSchema>;