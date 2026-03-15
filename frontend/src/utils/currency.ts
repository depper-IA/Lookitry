/**
 * Utilidades para formateo de moneda en pesos colombianos (COP)
 */

/**
 * Formatea un número como moneda en pesos colombianos
 * @param amount - Monto a formatear
 * @returns String formateado como $XXX.XXX COP
 * @example
 * formatCurrency(150000) // "$150.000 COP"
 * formatCurrency(250000) // "$250.000 COP"
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Obtiene el precio mensual de un plan
 * @param plan - Tipo de plan ('BASIC' o 'PRO')
 * @returns Precio mensual en COP
 */
export function getPlanPrice(plan: 'BASIC' | 'PRO'): number {
  return plan === 'PRO' ? 250000 : 150000;
}

/**
 * Formatea el precio de un plan con el formato estándar
 * @param plan - Tipo de plan ('BASIC' o 'PRO')
 * @returns String formateado como $XXX.XXX COP
 */
export function formatPlanPrice(plan: 'BASIC' | 'PRO'): string {
  return formatCurrency(getPlanPrice(plan));
}
