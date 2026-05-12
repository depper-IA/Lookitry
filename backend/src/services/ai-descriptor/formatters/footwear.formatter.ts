// ai-descriptor/formatters/footwear.formatter.ts
// FootwearFormatter — maps ZAPATOS, SHOES, CALZADO, SANDALIAS

import { BaseFormatter, ProductType } from './base.formatter';
import { FootwearDescription } from '../schemas';
import { getPromptRules } from '../../../config/prompt-rules';

export class FootwearFormatter extends BaseFormatter {
  getProductType(): ProductType {
    return 'FOOTWEAR';
  }

  buildPrompt(name: string, category: string, brandDescription?: string): string {
    const rules = getPromptRules(category);
    const normalizedCategory = category.toUpperCase().trim();

    let categoryContext = '';
    if (normalizedCategory.includes('ZAPATOS') || normalizedCategory.includes('SHOES')) {
      categoryContext = 'The product is FOOTWEAR (shoes, boots, sneakers) that covers ONLY the feet.';
    } else if (normalizedCategory.includes('CALZADO') || normalizedCategory.includes('FOOTWEAR')) {
      categoryContext = 'The product is FOOTWEAR (shoes, boots, sneakers, sandals) that covers ONLY the feet.';
    } else if (normalizedCategory.includes('SANDALIAS') || normalizedCategory.includes('SANDALS')) {
      categoryContext = 'The product is SANDALS that cover the feet with open design.';
    } else {
      categoryContext = rules.replacement;
    }

    const parts: string[] = [
      `Responde ÚNICAMENTE en ESPAÑOL. Todos los valores (colores, materiales, calzado) deben estar en español.`,
      `Genera una descripción de producto de moda para CALZADO.`,
      `Nombre del producto: ${name}`,
      `Categoría: ${category}`,
      categoryContext,
      rules.replace,
      rules.keep,
      `La respuesta DEBE ser JSON válido con este esquema exacto:`,
      JSON.stringify({
        product_type: 'FOOTWEAR',
        footwear_type: 'tipo de calzado en español (ej: Zapatos, Botas, Sandalias)',
        heel_height: 'altura del tacón en español (ej: Tacón alto, Plano, Plataforma)',
        material: 'material principal en español',
        primary_color: 'color primario en español',
        secondary_colors: ['colores secundarios en español'],
        patterns: ['patrones o estampados en español'],
        extra_attributes: {
          "Atributo Dinámico 1": "Valor (ej: Tipo de suela, Tipo de cierre)",
          "Atributo Dinámico 2": "Valor"
        }
      }),
    ];

    if (brandDescription) {
      parts.push(`Brand context: ${brandDescription}`);
    }

    return parts.join('\n');
  }

  parseResponse(rawText: string): FootwearDescription {
    const parsed = JSON.parse(rawText);
    return parsed as FootwearDescription;
  }
}