/**
 * Reglas base de prompt por categoría de prenda.
 * Se inyectan ANTES del RAG para corregir errores comunes de generación.
 *
 * Problema principal: el modelo elimina ropa que no debería (ej: zapatos al poner vestido)
 * o conserva ropa que debería reemplazar (ej: pantalón bajo un vestido).
 */

export type ProductCategory =
  | 'VESTIDO'
  | 'DRESS'
  | 'CAMISA'
  | 'SHIRT'
  | 'TOP'
  | 'BLUSA'
  | 'BLOUSE'
  | 'PANTALON'
  | 'PANTS'
  | 'JEANS'
  | 'FALDA'
  | 'SKIRT'
  | 'ZAPATOS'
  | 'SHOES'
  | 'CALZADO'
  | 'FOOTWEAR'
  | 'CONJUNTO'
  | 'SET'
  | 'OUTFIT'
  | 'CHAQUETA'
  | 'JACKET'
  | 'ABRIGO'
  | 'COAT'
  | 'ACCESORIO'
  | 'ACCESSORY'
  | string;

export interface PromptRule {
  /** Instrucción de reemplazo de prendas */
  replacement: string;
  /** Qué partes del cuerpo/ropa conservar explícitamente */
  keep: string;
  /** Qué partes del cuerpo/ropa reemplazar explícitamente */
  replace: string;
}

/**
 * Mapa de reglas por categoría normalizada.
 * La clave es la categoría en MAYÚSCULAS.
 */
const RULES_BY_CATEGORY: Record<string, PromptRule> = {
  // ── VESTIDOS / DRESSES ────────────────────────────────────────────────────
  // Un vestido cubre de hombros a rodillas/tobillos → reemplaza TODO lo que hay debajo
  VESTIDO: {
    replacement:
      'The product is a DRESS that covers the entire body from shoulders to knees or ankles. A dress is a ONE-PIECE garment — it replaces EVERYTHING the person is wearing.',
    replace:
      'CRITICAL — FULL OUTFIT REMOVAL REQUIRED: (1) Remove the jacket, blazer, cardigan, or any outer layer. (2) Remove the top, shirt, blouse, or t-shirt underneath. (3) Remove the pants, jeans, leggings, or skirt. (4) Remove the shoes and footwear. The dress is the ONLY garment visible on the body. Do NOT leave any original clothing item visible under or over the dress.',
    keep:
      'KEEP the person\'s face, hair, skin tone, body proportions, pose, and background IDENTICAL to the original photo. Do NOT change anything about the person except their clothing.',
  },
  DRESS: {
    replacement:
      'The product is a DRESS that covers the entire body from shoulders to knees or ankles. A dress is a ONE-PIECE garment — it replaces EVERYTHING the person is wearing.',
    replace:
      'CRITICAL — FULL OUTFIT REMOVAL REQUIRED: (1) Remove the jacket, blazer, cardigan, or any outer layer. (2) Remove the top, shirt, blouse, or t-shirt underneath. (3) Remove the pants, jeans, leggings, or skirt. (4) Remove the shoes and footwear. The dress is the ONLY garment visible on the body. Do NOT leave any original clothing item visible under or over the dress.',
    keep:
      'KEEP the person\'s face, hair, skin tone, body proportions, pose, and background IDENTICAL to the original photo. Do NOT change anything about the person except their clothing.',
  },

  // ── CAMISAS / TOPS / BLUSAS ───────────────────────────────────────────────
  // Solo reemplaza la parte superior
  CAMISA: {
    replacement: 'The product is a SHIRT/TOP that covers only the upper body.',
    replace: 'REPLACE ONLY the upper body garment (shirt, blouse, top).',
    keep:
      'KEEP the pants, jeans, leggings, skirt, and shoes/footwear EXACTLY as they appear in the original photo. Do NOT modify the lower body.',
  },
  SHIRT: {
    replacement: 'The product is a SHIRT/TOP that covers only the upper body.',
    replace: 'REPLACE ONLY the upper body garment (shirt, blouse, top).',
    keep:
      'KEEP the pants, jeans, leggings, skirt, and shoes/footwear EXACTLY as they appear in the original photo. Do NOT modify the lower body.',
  },
  TOP: {
    replacement: 'The product is a TOP that covers only the upper body.',
    replace: 'REPLACE ONLY the upper body garment.',
    keep:
      'KEEP the pants, jeans, leggings, skirt, and shoes/footwear EXACTLY as they appear in the original photo. Do NOT modify the lower body.',
  },
  BLUSA: {
    replacement: 'The product is a BLOUSE that covers only the upper body.',
    replace: 'REPLACE ONLY the upper body garment (blouse, top).',
    keep:
      'KEEP the pants, jeans, leggings, skirt, and shoes/footwear EXACTLY as they appear in the original photo. Do NOT modify the lower body.',
  },
  BLOUSE: {
    replacement: 'The product is a BLOUSE that covers only the upper body.',
    replace: 'REPLACE ONLY the upper body garment (blouse, top).',
    keep:
      'KEEP the pants, jeans, leggings, skirt, and shoes/footwear EXACTLY as they appear in the original photo. Do NOT modify the lower body.',
  },

  // ── PANTALONES / JEANS ────────────────────────────────────────────────────
  // Solo reemplaza la parte inferior
  PANTALON: {
    replacement: 'The product is PANTS/JEANS that cover only the lower body.',
    replace: 'REPLACE ONLY the lower body garment (pants, jeans, leggings).',
    keep:
      'KEEP the shirt, top, blouse, and shoes/footwear EXACTLY as they appear in the original photo. Do NOT modify the upper body or footwear.',
  },
  PANTS: {
    replacement: 'The product is PANTS/JEANS that cover only the lower body.',
    replace: 'REPLACE ONLY the lower body garment (pants, jeans, leggings).',
    keep:
      'KEEP the shirt, top, blouse, and shoes/footwear EXACTLY as they appear in the original photo. Do NOT modify the upper body or footwear.',
  },
  JEANS: {
    replacement: 'The product is JEANS that cover only the lower body.',
    replace: 'REPLACE ONLY the lower body garment (jeans, pants).',
    keep:
      'KEEP the shirt, top, blouse, and shoes/footwear EXACTLY as they appear in the original photo. Do NOT modify the upper body or footwear.',
  },

  // ── FALDAS ────────────────────────────────────────────────────────────────
  FALDA: {
    replacement: 'The product is a SKIRT that covers only the lower body from waist to knees/ankles.',
    replace: 'REPLACE ONLY the lower body garment (pants, jeans) with this skirt.',
    keep:
      'KEEP the shirt, top, blouse, and shoes/footwear EXACTLY as they appear in the original photo. Do NOT modify the upper body or footwear.',
  },
  SKIRT: {
    replacement: 'The product is a SKIRT that covers only the lower body from waist to knees/ankles.',
    replace: 'REPLACE ONLY the lower body garment (pants, jeans) with this skirt.',
    keep:
      'KEEP the shirt, top, blouse, and shoes/footwear EXACTLY as they appear in the original photo. Do NOT modify the upper body or footwear.',
  },

  // ── ZAPATOS / CALZADO ─────────────────────────────────────────────────────
  // SOLO reemplaza el calzado — NO tocar ninguna prenda
  ZAPATOS: {
    replacement: 'The product is FOOTWEAR (shoes, boots, sneakers, sandals) that covers ONLY the feet.',
    replace: 'REPLACE ONLY the footwear/shoes visible in the original photo.',
    keep:
      'KEEP ALL clothing items (top, shirt, pants, jeans, dress, skirt) EXACTLY as they appear in the original photo. Do NOT modify any clothing. Only change the shoes/footwear.',
  },
  SHOES: {
    replacement: 'The product is FOOTWEAR (shoes, boots, sneakers, sandals) that covers ONLY the feet.',
    replace: 'REPLACE ONLY the footwear/shoes visible in the original photo.',
    keep:
      'KEEP ALL clothing items (top, shirt, pants, jeans, dress, skirt) EXACTLY as they appear in the original photo. Do NOT modify any clothing. Only change the shoes/footwear.',
  },
  CALZADO: {
    replacement: 'The product is FOOTWEAR (shoes, boots, sneakers, sandals) that covers ONLY the feet.',
    replace: 'REPLACE ONLY the footwear/shoes visible in the original photo.',
    keep:
      'KEEP ALL clothing items (top, shirt, pants, jeans, dress, skirt) EXACTLY as they appear in the original photo. Do NOT modify any clothing. Only change the shoes/footwear.',
  },
  FOOTWEAR: {
    replacement: 'The product is FOOTWEAR (shoes, boots, sneakers, sandals) that covers ONLY the feet.',
    replace: 'REPLACE ONLY the footwear/shoes visible in the original photo.',
    keep:
      'KEEP ALL clothing items (top, shirt, pants, jeans, dress, skirt) EXACTLY as they appear in the original photo. Do NOT modify any clothing. Only change the shoes/footwear.',
  },

  // ── CONJUNTOS / SETS ──────────────────────────────────────────────────────
  CONJUNTO: {
    replacement: 'The product is a COMPLETE OUTFIT SET (top + bottom, or full suit).',
    replace: 'REPLACE the complete outfit: top, bottom (pants/skirt), and shoes/footwear.',
    keep:
      'KEEP the person\'s face, hair, skin tone, body proportions, pose, and background IDENTICAL to the original photo.',
  },
  SET: {
    replacement: 'The product is a COMPLETE OUTFIT SET (top + bottom, or full suit).',
    replace: 'REPLACE the complete outfit: top, bottom (pants/skirt), and shoes/footwear.',
    keep:
      'KEEP the person\'s face, hair, skin tone, body proportions, pose, and background IDENTICAL to the original photo.',
  },
  OUTFIT: {
    replacement: 'The product is a COMPLETE OUTFIT (top + bottom, or full suit).',
    replace: 'REPLACE the complete outfit: top, bottom (pants/skirt), and shoes/footwear.',
    keep:
      'KEEP the person\'s face, hair, skin tone, body proportions, pose, and background IDENTICAL to the original photo.',
  },

  // ── CHAQUETAS / ABRIGOS ───────────────────────────────────────────────────
  CHAQUETA: {
    replacement: 'The product is a JACKET/COAT worn over the upper body.',
    replace: 'REPLACE ONLY the outer layer (jacket, coat, blazer) on the upper body.',
    keep:
      'KEEP the inner shirt/top, pants, jeans, and shoes/footwear EXACTLY as they appear in the original photo.',
  },
  JACKET: {
    replacement: 'The product is a JACKET/COAT worn over the upper body.',
    replace: 'REPLACE ONLY the outer layer (jacket, coat, blazer) on the upper body.',
    keep:
      'KEEP the inner shirt/top, pants, jeans, and shoes/footwear EXACTLY as they appear in the original photo.',
  },
  ABRIGO: {
    replacement: 'The product is a COAT/OVERCOAT worn over the entire upper body.',
    replace: 'REPLACE ONLY the outer coat/overcoat layer.',
    keep:
      'KEEP the inner clothing, pants, jeans, and shoes/footwear EXACTLY as they appear in the original photo.',
  },
  COAT: {
    replacement: 'The product is a COAT/OVERCOAT worn over the entire upper body.',
    replace: 'REPLACE ONLY the outer coat/overcoat layer.',
    keep:
      'KEEP the inner clothing, pants, jeans, and shoes/footwear EXACTLY as they appear in the original photo.',
  },

  // ── ACCESORIOS ────────────────────────────────────────────────────────────
  ACCESORIO: {
    replacement: 'The product is an ACCESSORY (bag, belt, hat, jewelry, sunglasses, scarf, etc.).',
    replace: 'ADD or REPLACE ONLY the specific accessory shown in the product image.',
    keep:
      'KEEP ALL clothing items (top, pants, shoes) and ALL other accessories EXACTLY as they appear in the original photo. Only add/change the specific accessory.',
  },
  ACCESSORY: {
    replacement: 'The product is an ACCESSORY (bag, belt, hat, jewelry, sunglasses, scarf, etc.).',
    replace: 'ADD or REPLACE ONLY the specific accessory shown in the product image.',
    keep:
      'KEEP ALL clothing items (top, pants, shoes) and ALL other accessories EXACTLY as they appear in the original photo. Only add/change the specific accessory.',
  },
};

/**
 * Obtiene las reglas de prompt para una categoría dada.
 * Normaliza la categoría a mayúsculas y busca coincidencia exacta o parcial.
 * Si no hay coincidencia, retorna reglas genéricas seguras.
 */
export function getPromptRules(category?: string | null): PromptRule {
  if (!category) return getDefaultRules();

  const normalized = category.toUpperCase().trim();

  // Coincidencia exacta
  if (RULES_BY_CATEGORY[normalized]) {
    return RULES_BY_CATEGORY[normalized];
  }

  // Coincidencia parcial (ej: "Vestido Largo" → VESTIDO)
  for (const key of Object.keys(RULES_BY_CATEGORY)) {
    if (normalized.includes(key) || key.includes(normalized)) {
      return RULES_BY_CATEGORY[key];
    }
  }

  return getDefaultRules();
}

/**
 * Reglas genéricas cuando no se puede determinar la categoría.
 * Conservadoras: solo reemplaza lo que el producto claramente muestra.
 */
function getDefaultRules(): PromptRule {
  return {
    replacement: 'The product is a clothing item or accessory.',
    replace:
      'REPLACE ONLY the specific garment or accessory shown in the product reference image. Do not remove or modify any other clothing items.',
    keep:
      'KEEP all other clothing items and accessories EXACTLY as they appear in the original photo. Only change what the product directly replaces.',
  };
}

/**
 * Construye el bloque de reglas para insertar en el prompt.
 */
export function buildCategoryRulesBlock(category?: string | null): string {
  const rules = getPromptRules(category);
  return [
    `[CLOTHING REPLACEMENT RULES — CRITICAL]`,
    rules.replacement,
    rules.replace,
    rules.keep,
  ].join(' ');
}
