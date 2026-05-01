// ai-descriptor/formatters/base.formatter.ts
// Abstract base formatter interface — Strategy Pattern base

export type ProductType = 'CLOTHING' | 'ACCESSORY' | 'FOOTWEAR';

/**
 * Base formatter interface for the Strategy Pattern.
 * Each product category maps to a formatter that knows how to build
 * the prompt and parse the response for that product type.
 */
export abstract class BaseFormatter {
  /**
   * Returns the product type discriminant for Zod discriminated union.
   */
  abstract getProductType(): ProductType;

  /**
   * Builds the prompt for Vertex AI, including RULES_BY_CATEGORY context.
   */
  abstract buildPrompt(
    name: string,
    category: string,
    brandDescription?: string,
  ): string;

  /**
   * Parses the raw text response from Vertex AI and returns a typed object.
   * Throws if response is not valid JSON.
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  abstract parseResponse(rawText: string): any;
}