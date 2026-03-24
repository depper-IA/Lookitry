/**
 * Genera la URL para el renderizado dinámico de imágenes con marca de agua.
 */
export function getProxiedImageUrl(src: string, plan?: string): string {
  if (!src) return '';
  
  // Si no hay plan o es PRO, devolvemos la URL original (o podemos pasarla por el proxy para optimización futura)
  if (!plan || plan === 'PRO') return src;

  const apiBase = process.env.NEXT_PUBLIC_API_URL || 'https://api.lookitry.com';
  const encodedSrc = encodeURIComponent(src);
  const encodedPlan = encodeURIComponent(plan);
  
  return `${apiBase}/api/images/render?src=${encodedSrc}&plan=${encodedPlan}`;
}
