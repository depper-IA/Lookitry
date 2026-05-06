/**
 * Genera la URL para el renderizado dinámico de imágenes con marca de agua.
 * Se usa principalmente en el widget público y mini-landings.
 */
export function getProxiedImageUrl(src: string, plan?: string, download?: boolean): string {
  if (!src) return '';
  
  // Si no hay plan, devolvemos la URL original
  if (!plan) return src;

  // Si el plan es PRO, solo usamos el proxy si el usuario quiere descargar la imagen.
  // De lo contrario, usamos la URL directa de MinIO para mayor rendimiento.
  if (plan === 'PRO' && !download) return src;

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
 * Proxy universal para evitar bloqueos de CORS o Hotlinking de proveedores externos (WooCommerce, Shopify, etc.).
 * Whitlista únicamente la infraestructura propia para carga directa.
 */
export function getProxiedUrl(url: string): string {
  if (!url) return '';
  
  // GCS URLs are already public and fast, no need to proxy
  if (url.includes('storage.googleapis.com')) {
    return url;
  }

  // Manejo de URLs relativas (rutas internas de MinIO guardadas sin dominio)
  if (!url.startsWith('http')) {
    // Intentamos construir la URL completa apuntando a nuestro almacenamiento
    const minioBase = process.env.NEXT_PUBLIC_MINIO_URL || 'https://minio.wilkiedevs.com';
    const cleanPath = url.startsWith('/') ? url.slice(1) : url;
    // Si la ruta no incluye el bucket, lo añadimos (default 'images')
    const finalPath = cleanPath.startsWith('images/') ? cleanPath : `images/${cleanPath}`;
    const fullUrl = `${minioBase}/${finalPath}`;
    return `/api/img-proxy?url=${encodeURIComponent(fullUrl)}`;
  }

  // Para CUALQUIER otro dominio externo (incluyendo nuestro MinIO para evitar CORS), usamos nuestro proxy
  return `/api/img-proxy?url=${encodeURIComponent(url)}`;
}
