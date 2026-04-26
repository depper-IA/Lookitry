const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutos

const CLEANUP_INTERVAL_MS = 10 * 60 * 1000; // 10 minutos



interface CacheEntry {

  data: any;

  expiresAt: number;

}



const cache = new Map<string, CacheEntry>();



export function getCachedBrandConfig(slug: string): any | null {

  const entry = cache.get(slug);

  if (!entry) return null;

  if (Date.now() > entry.expiresAt) {

    cache.delete(slug);

    return null;

  }

  return entry.data;

}



export function setCachedBrandConfig(slug: string, data: any): void {

  cache.set(slug, {

    data,

    expiresAt: Date.now() + CACHE_TTL_MS,

  });

}



export function invalidateBrandConfigCache(slug: string): void {

  cache.delete(slug);

}



export function clearAllBrandConfigCache(): void {

  cache.clear();

}



// Limpieza periódica de entradas expiradas

setInterval(() => {

  const now = Date.now();

  for (const [key, entry] of cache.entries()) {

    if (now > entry.expiresAt) {

      cache.delete(key);

    }

  }

}, CLEANUP_INTERVAL_MS);

