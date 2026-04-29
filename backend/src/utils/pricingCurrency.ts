/**
 * Utilidad centralizada para conversión COP → USD con margen mínimo de 10,000 COP.
 *
 * IMPORTANTE: Esta función DEBE ser usada en TODOS los lugares donde se calcule precio USD
 * para asegurar que el precio en COP equivalente sea SIEMPRE mayor que el precio COP original.
 *
 * Reglas de negocio:
 * 1. Precio USD debe ser siempre más caro en COP equivalente que el precio COP original
 * 2. Margen mínimo: La diferencia entre (precio COP) y (precio USD × TRM) debe ser mínimo 10,000 COP
 * 3. Fórmula: precioUSD = Math.ceil((precioCOP + 10000) / trm)
 */

const MINIMUM_MARGIN_COP = 10000;
const FALLBACK_TRM = 4000;

/**
 * Calcula el precio USD asegurando un margen mínimo de 10,000 COP.
 *
 * @param amountCOP - Monto en COP
 * @param trm - Tasa de cambio COP→USD (opcional, usa fallback de 4000 si es inválida)
 * @returns Precio en USD redondeado hacia arriba (Math.ceil)
 *
 * @example
 * calculatePriceUSD(180000, 4000) => 48 USD (equivale a 192,000 COP, tiene 12,000 de margen)
 * calculatePriceUSD(350000, 4000) => 90 USD (equivale a 360,000 COP, tiene 10,000 de margen)
 */
export function calculatePriceUSD(amountCOP: number, trm?: number | null): number {
  const safeTrm = trm && trm > 0 ? trm : FALLBACK_TRM;
  // Asegurar que el precio USD siempre resulte en un COP equivalente mayor que el original
  return Math.ceil((amountCOP + MINIMUM_MARGIN_COP) / safeTrm);
}

/**
 * Calcula la TRM mínima necesaria para que un precio USD given sea consistente
 * (es decir, que al multiplicar por la TRM resulte en al menos COP + 10,000).
 *
 * @param amountCOP - Monto original en COP
 * @param priceUSD - Precio USD propuesto
 * @returns TRM mínima necesaria
 *
 * @example
 * getMinimumTrmForConsistency(180000, 48) => 3958.33...
 * Si la TRM real es menor a este valor, el precio USD no cumple el margen mínimo
 */
export function getMinimumTrmForConsistency(amountCOP: number, priceUSD: number): number {
  return (amountCOP + MINIMUM_MARGIN_COP) / priceUSD;
}
