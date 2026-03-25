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

/**
 * Proxy regular para evitar bloqueos de CORS o Hotlinking.
 */
export function getProxiedUrl(url: string): string {
  if (!url) return '';
  if (url.includes('minio.wilkiedevs.com')) return url;
  if (!url.startsWith('http')) return url;
  return `/api/img-proxy?url=${encodeURIComponent(url)}`;
}
