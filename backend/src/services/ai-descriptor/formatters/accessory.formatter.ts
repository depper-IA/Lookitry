// ai-descriptor/formatters/accessory.formatter.ts
// AccessoryFormatter — maps ACCESORIO, BOLSA, JOYA, BUFANDA, GORRA

import { BaseFormatter, ProductType } from './base.formatter';
import { AccessoryDescription } from '../schemas';
import { getPromptRules } from '../../../config/prompt-rules';

export class AccessoryFormatter extends BaseFormatter {
  getProductType(): ProductType {
    return 'ACCESSORY';
  }

  buildPrompt(name: string, category: string, brandDescription?: string): string {
    const rules = getPromptRules(category);
    const normalizedCategory = category.toUpperCase().trim();

    let categoryContext = '';
    if (normalizedCategory.includes('BOLSA') || normalizedCategory.includes('BAG')) {
      categoryContext = 'The product is a BAG/HANDBAG made of leather, fabric, or other material.';
    } else if (normalizedCategory.includes('JOYA') || normalizedCategory.includes('JEWELRY')) {
      categoryContext = 'The product is JEWELRY such as necklaces, earrings, bracelets, or rings.';
    } else if (normalizedCategory.includes('BUFANDA') || normalizedCategory.includes('SCARF')) {
      categoryContext = 'The product is a SCARF or neck wrap for warmth or style.';
    } else if (normalizedCategory.includes('GORRA') || normalizedCategory.includes('HAT') || normalizedCategory.includes('CAP')) {
      categoryContext = 'The product is a HAT or CAP worn on the head.';
    } else if (
      normalizedCategory.includes('ACCESORIO') ||
      normalizedCategory.includes('ACCESSORY')
    ) {
      categoryContext = 'The product is an ACCESSORY (bag, belt, hat, jewelry, sunglasses, scarf, etc.).';
    } else {
      categoryContext = rules.replacement;
    }

    const parts: string[] = [
      `Responde ÚNICAMENTE en ESPAÑOL. Todos los valores (colores, materiales, accesorios) deben estar en español.`,
      `Genera una descripción de producto de moda para ACCESORIOS.`,
      `Nombre del producto: ${name}`,
      `Categoría: ${category}`,
      categoryContext,
      rules.replace,
      rules.keep,
      `La respuesta DEBE ser JSON válido con este esquema exacto:`,
      JSON.stringify({
        product_type: 'ACCESSORY',
        accessory_type: 'tipo de accesorio en español (ej: Bolso, Joya, Bufanda)',
        placement: 'lugar del cuerpo donde se usa en español (ej: Muñeca, Cuello, Cabeza)',
        material: 'material principal en español',
        primary_color: 'color primario en español',
        secondary_colors: ['colores secundarios en español'],
        patterns: ['patrones o estampados en español'],
      }),
    ];

    if (brandDescription) {
      parts.push(`Brand context: ${brandDescription}`);
    }

    return parts.join('\n');
  }

  parseResponse(rawText: string): AccessoryDescription {
    const parsed = JSON.parse(rawText);
    return parsed as AccessoryDescription;
  }
}