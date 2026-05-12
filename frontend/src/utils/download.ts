/**
 * Helper para detectar In-App Browsers (Instagram, Facebook, TikTok)
 */
const isIAB = () => {
  if (typeof window === 'undefined') return false;
  const ua = navigator.userAgent || navigator.vendor || (window as any).opera;
  return /Instagram|FBAN|FBAV|TikTok/i.test(ua);
};


/**
 * Descarga una imagen forzando el guardado local.
 * Usa el proxy /api/download para evitar bloqueos CORS con imágenes externas.
 */
export async function downloadImage(imageUrl: string, filename: string): Promise<void> {
  const proxyUrl = `/api/download?url=${encodeURIComponent(imageUrl)}&filename=${encodeURIComponent(filename)}`;

  // En Instagram/Facebook, evitamos el truco del blob
  if (isIAB()) {
    window.open(proxyUrl, '_blank');
    return;
  }

  const res = await fetch(proxyUrl);
  if (!res.ok) throw new Error('Error al descargar');

  const blob = await res.blob();
  const blobUrl = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = blobUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(blobUrl), 1000);
}

