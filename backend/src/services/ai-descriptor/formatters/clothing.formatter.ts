// ai-descriptor/formatters/clothing.formatter.ts
// ClothingFormatter — maps VESTIDO, CAMISA, PANTALON, FALDA, CHAQUETA, CONJUNTO, TOP

import { BaseFormatter, ProductType } from './base.formatter';
import { ClothingDescription } from '../schemas';
import { getPromptRules } from '../../../config/prompt-rules';

const CLOTHING_CATEGORIES = new Set([
  'VESTIDO', 'DRESS',
  'CAMISA', 'SHIRT', 'TOP', 'BLUSA', 'BLOUSE',
  'PANTALON', 'PANTS', 'JEANS',
  'FALDA', 'SKIRT',
  'CHAQUETA', 'JACKET', 'ABRIGO', 'COAT',
  'CONJUNTO', 'SET', 'OUTFIT',
]);

export class ClothingFormatter extends BaseFormatter {
  getProductType(): ProductType {
    return 'CLOTHING';
  }

  buildPrompt(name: string, category: string, brandDescription?: string): string {
    const rules = getPromptRules(category);
    const normalizedCategory = category.toUpperCase().trim();

    let categoryContext = '';
    if (normalizedCategory.includes('VESTIDO') || normalizedCategory.includes('DRESS')) {
      categoryContext = 'The product is a DRESS that covers the entire body from shoulders to knees or ankles.';
    } else if (
      normalizedCategory.includes('CAMISA') ||
      normalizedCategory.includes('SHIRT') ||
      normalizedCategory.includes('TOP') ||
      normalizedCategory.includes('BLUSA') ||
      normalizedCategory.includes('BLOUSE')
    ) {
      categoryContext = 'The product is a SHIRT/TOP that covers only the upper body.';
    } else if (
      normalizedCategory.includes('PANTALON') ||
      normalizedCategory.includes('PANTS') ||
      normalizedCategory.includes('JEANS')
    ) {
      categoryContext = 'The product is PANTS/JEANS that cover only the lower body.';
    } else if (normalizedCategory.includes('FALDA') || normalizedCategory.includes('SKIRT')) {
      categoryContext = 'The product is a SKIRT that covers only the lower body from waist to knees/ankles.';
    } else if (
      normalizedCategory.includes('CHAQUETA') ||
      normalizedCategory.includes('JACKET') ||
      normalizedCategory.includes('ABRIGO') ||
      normalizedCategory.includes('COAT')
    ) {
      categoryContext = 'The product is a JACKET/COAT worn over the upper body.';
    } else if (
      normalizedCategory.includes('CONJUNTO') ||
      normalizedCategory.includes('SET') ||
      normalizedCategory.includes('OUTFIT')
    ) {
      categoryContext = 'The product is a COMPLETE OUTFIT SET (top + bottom, or full suit).';
    } else {
      categoryContext = rules.replacement;
    }

    const parts: string[] = [
      `Responde ÚNICAMENTE en ESPAÑOL. Todos los valores (colores, materiales, prendas) deben estar en español.`,
      `Genera una descripción de producto de moda para PRENDAS DE VESTIR.`,
      `Nombre del producto: ${name}`,
      `Categoría: ${category}`,
      categoryContext,
      rules.replace,
      rules.keep,
      `La respuesta DEBE ser JSON válido con este esquema exacto:`,
      JSON.stringify({
        product_type: 'CLOTHING',
        garment_type: 'tipo de prenda en español (ej: Vestido, Camisa, Pantalón)',
        silhouette: 'silueta o corte en español (ej: Ajustado, Holgado, Recto)',
        primary_color: 'color primario en español (ej: Rojo, Azul, Negro)',
        secondary_colors: ['colores secundarios en español'],
        patterns: ['patrones o estampados en español'],
        materials: ['materiales principales en español'],
        fit: 'tipo de ajuste en español (ej: Ajustado, Regular, Holgado)',
        extra_attributes: {
          "Atributo Dinámico 1": "Valor (ej: Estilo de cuello, Tipo de manga)",
          "Atributo Dinámico 2": "Valor"
        }
      }),
    ];

    if (brandDescription) {
      parts.push(`Brand context: ${brandDescription}`);
    }

    return parts.join('\n');
  }

  parseResponse(rawText: string): ClothingDescription {
    const parsed = JSON.parse(rawText);
    return parsed as ClothingDescription;
  }
}