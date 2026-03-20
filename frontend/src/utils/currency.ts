/**
 * Utilidades para formateo de moneda en pesos colombianos (COP) y dólares (USD)
 */

/**
 * Formatea un número como moneda
 * @param amount - Monto a formatear
 * @param currency - Moneda ('COP' o 'USD')
 * @returns String formateado
 */
export function formatCurrency(amount: number, currency: 'COP' | 'USD' = 'COP'): string {
  if (currency === 'USD') {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  }

  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Convierte y formatea un monto basado en el método de pago y la TRM
 * @param amountInCOP - Monto original en pesos colombianos
 * @param paymentMethodOrCurrency - 'wompi', 'paypal' o moneda directa 'COP' | 'USD'
 * @param trm - Tasa de cambio actual (COP -> 1 USD)
 * @returns String formateado con redondeo en dólares
 */
export function formatPrice(
  amountInCOP: number, 
  paymentMethodOrCurrency: 'wompi' | 'paypal' | 'COP' | 'USD', 
  trm: number
): string {
  const isUSD = paymentMethodOrCurrency === 'paypal' || paymentMethodOrCurrency === 'USD';
  
  if (isUSD) {
    const amountInUSD = Math.ceil(amountInCOP / trm); // Redondeo hacia arriba solicitado
    return formatCurrency(amountInUSD, 'USD');
  }
  
  return formatCurrency(amountInCOP, 'COP');
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
