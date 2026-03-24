/**
 * Genera la URL para el renderizado dinámico de imágenes con marca de agua.
 */
export function getProxiedImageUrl(src: string, plan?: string, download?: boolean): string {
  if (!src) return '';
  
  if (!plan || plan === 'PRO') return src;

  const apiBase = process.env.NEXT_PUBLIC_API_URL || 'https://api.lookitry.com';
  const encodedSrc = encodeURIComponent(src);
  const encodedPlan = encodeURIComponent(plan);
  
  let url = `${apiBase}/api/images/look?src=${encodedSrc}&plan=${encodedPlan}`;
  if (download) {
    url += '&download=true';
  }
  return url;
}
