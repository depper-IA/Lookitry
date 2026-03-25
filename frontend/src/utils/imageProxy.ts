/**
 * Genera la URL para el renderizado dinámico de imágenes con marca de agua.
 * Se usa principalmente en el widget público y mini-landings.
 */
export function getProxiedImageUrl(src: string, plan?: string, download?: boolean): string {
  if (!src) return '';
  
  // Si no hay plan o es PRO, devolvemos la URL original (sin proxy de marca de agua)
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
 * Proxy universal para evitar bloqueos de CORS o Hotlinking de proveedores externos (WooCommerce, Shopify, etc.).
 * Whitlista únicamente la infraestructura propia para carga directa.
 */
export function getProxiedUrl(url: string): string {
  if (!url) return '';
  
  // Whitelist: Solo nuestra infraestructura de almacenamiento (MinIO) carga directamente
  // para aprovechar el ancho de banda del cliente y caché de navegador sin pasar por nuestro servidor.
  const isInternalStorage = url.includes('minio.wilkiedevs.com') || url.includes('minio.lookitry.com');

  if (isInternalStorage) {
    return url;
  }

  // Manejo de URLs relativas (rutas internas de MinIO guardadas sin dominio)
  if (!url.startsWith('http')) {
    // Intentamos construir la URL completa apuntando a nuestro almacenamiento
    const minioBase = process.env.NEXT_PUBLIC_MINIO_URL || 'https://minio.wilkiedevs.com';
    const cleanPath = url.startsWith('/') ? url.slice(1) : url;
    // Si la ruta no incluye el bucket, lo añadimos (default 'images')
    const finalPath = cleanPath.startsWith('images/') ? cleanPath : `images/${cleanPath}`;
    return `${minioBase}/${finalPath}`;
  }

  // Para CUALQUIER otro dominio externo (el WooCommerce del cliente), usamos nuestro proxy
  // Esto garantiza que funcione en cualquier dominio nuevo sin tocar el código.
  return `/api/img-proxy?url=${encodeURIComponent(url)}`;
}
