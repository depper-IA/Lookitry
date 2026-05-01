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
      `Generate a compelling product description for a FOOTWEAR product.`,
      `Product name: ${name}`,
      `Category: ${category}`,
      categoryContext,
      rules.replace,
      rules.keep,
      `The response MUST be valid JSON matching this schema:`,
      JSON.stringify({
        product_type: 'FOOTWEAR',
        short_description: 'string (max 80 characters)',
        features: 'array of 2-5 distinctive features',
        style_notes: 'optional string describing style',
        comfort_features: 'array of 1-3 comfort features',
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