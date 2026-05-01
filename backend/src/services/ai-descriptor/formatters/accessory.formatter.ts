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
      `Generate a compelling product description for an ACCESSORY product.`,
      `Product name: ${name}`,
      `Category: ${category}`,
      categoryContext,
      rules.replace,
      rules.keep,
      `The response MUST be valid JSON matching this schema:`,
      JSON.stringify({
        product_type: 'ACCESSORY',
        short_description: 'string (max 80 characters)',
        features: 'array of 2-5 distinctive features',
        material_notes: 'optional string describing materials',
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