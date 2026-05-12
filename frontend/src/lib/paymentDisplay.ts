export function priceInUsd(amountCop: number, trm: number): number {
  const safeTrm = trm > 0 ? trm : 3900;
  const MINIMUM_MARGIN_COP = 10000;
  return Math.ceil((amountCop + MINIMUM_MARGIN_COP) / safeTrm);
}

export function formatCop(amount: number): string {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatUsd(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}
