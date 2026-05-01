// ai-descriptor/ai-descriptor.service.ts
// DescriptorService — Phase 3: Service layer with Vertex wiring and error handling

import { vertexService } from '../vertex.service';
import { BaseFormatter, ProductType } from './formatters/base.formatter';
import { ClothingFormatter } from './formatters/clothing.formatter';
import { AccessoryFormatter } from './formatters/accessory.formatter';
import { FootwearFormatter } from './formatters/footwear.formatter';
import {
  DescribeProductInput,
  ProductDescriptionSchema,
  ProductDescription,
} from './schemas';

// ——————————————————————————————————————————————————————————————
// Error Types
// ——————————————————————————————————————————————————————————————

export class ValidationError extends Error {
  statusCode = 502 as const;
  constructor(message: string, public rawResponse?: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

export class VertexError extends Error {
  statusCode = 500 as const;
  constructor(message: string) {
    super(message);
    this.name = 'VertexError';
  }
}

// ——————————————————————————————————————————————————————————————
// Formatter Map
// ——————————————————————————————————————————————————————————————

const CLOTHING_CATEGORIES = new Set([
  'VESTIDO', 'DRESS',
  'CAMISA', 'SHIRT', 'TOP', 'BLUSA', 'BLOUSE',
  'PANTALON', 'PANTS', 'JEANS',
  'FALDA', 'SKIRT',
  'CHAQUETA', 'JACKET', 'ABRIGO', 'COAT',
  'CONJUNTO', 'SET', 'OUTFIT',
]);

const ACCESSORY_CATEGORIES = new Set([
  'ACCESORIO', 'ACCESORIOS', 'ACCESSORY', 'ACCESSORIES',
  'BOLSA', 'BAG', 'HANDBAG',
  'JOYA', 'JEWELRY', 'JEWELS',
  'BUFANDA', 'SCARF',
  'GORRA', 'HAT', 'CAP',
  'RELOJ', 'WATCH',
  'GAFAS', 'GLASSES',
  'HELMET', 'CASCO'
]);

const FOOTWEAR_CATEGORIES = new Set([
  'ZAPATOS', 'SHOES',
  'CALZADO', 'FOOTWEAR',
  'SANDALIAS', 'SANDALS',
]);

// ——————————————————————————————————————————————————————————————
// DescriptorService
// ——————————————————————————————————————————————————————————————

export class DescriptorService {
  private formatters = {
    CLOTHING: new ClothingFormatter(),
    ACCESSORY: new AccessoryFormatter(),
    FOOTWEAR: new FootwearFormatter(),
  };

  /**
   * Route category string to the appropriate formatter.
   * Unknown categories default to ClothingFormatter with a warning.
   */
  getFormatter(category: string): BaseFormatter {
    const normalized = category.toUpperCase().trim();

    if (CLOTHING_CATEGORIES.has(normalized)) {
      return this.formatters.CLOTHING;
    }
    if (ACCESSORY_CATEGORIES.has(normalized)) {
      return this.formatters.ACCESSORY;
    }
    if (FOOTWEAR_CATEGORIES.has(normalized)) {
      return this.formatters.FOOTWEAR;
    }

    console.warn(
      `[DescriptorService] Unknown category "${category}" — defaulting to ClothingFormatter`
    );
    return this.formatters.CLOTHING;
  }

  /**
   * Generate a product description via Vertex AI.
   * 1. Route to formatter by category
   * 2. Build prompt and call vertexService
   * 3. Parse raw JSON response
   * 4. Validate against Zod schema
   * 5. Return validated description or throw
   */
  async describeProduct(input: DescribeProductInput): Promise<ProductDescription> {
    const formatter = this.getFormatter(input.category);
    const prompt = formatter.buildPrompt(
      input.name,
      input.category,
      input.brand_description
    );

    // Call Vertex AI
    const result = await vertexService.generateContent({
      model: 'gemini-2.5-flash',
      contents: [{
        role: 'user',
        parts: [{ text: prompt }],
      }],
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 1024,
      },
    });

    // Handle Vertex service errors
    if (result.error) {
      throw new VertexError(`Vertex AI error: ${result.error}`);
    }

    // Handle empty candidates
    if (!result.candidates || result.candidates.length === 0) {
      throw new VertexError('Vertex AI returned no candidates');
    }

    // Extract response text
    const text = result.candidates[0]?.content?.parts?.[0]?.text;
    if (!text) {
      throw new VertexError('Vertex AI returned empty response');
    }

    // Parse JSON (before Zod validation)
    let parsed: unknown;
    try {
      parsed = JSON.parse(text);
    } catch {
      console.error('[DescriptorService] Failed to parse JSON from Vertex:', text.slice(0, 200));
      throw new VertexError('AI response was not valid JSON');
    }

    // Validate against Zod schema — throws ValidationError on failure
    try {
      const validated = ProductDescriptionSchema.parse(parsed);
      return validated as ProductDescription;
    } catch (err) {
      if (err instanceof Error && err.name === 'ZodError') {
        console.error('[DescriptorService] Zod validation failed for AI response:', text.slice(0, 200));
        throw new ValidationError('AI response validation failed', text);
      }
      throw err;
    }
  }
}

// Export singleton
export const descriptorService = new DescriptorService();

export default descriptorService;