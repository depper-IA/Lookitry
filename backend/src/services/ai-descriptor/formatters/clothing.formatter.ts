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
      `Generate a compelling product description for a CLOTHING product.`,
      `Product name: ${name}`,
      `Category: ${category}`,
      categoryContext,
      rules.replace,
      rules.keep,
      `The response MUST be valid JSON matching this schema:`,
      JSON.stringify({
        product_type: 'CLOTHING',
        short_description: 'string (max 80 characters)',
        features: 'array of 3-6 distinctive features',
        suggested_use_cases: 'array of 2-4 use cases',
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