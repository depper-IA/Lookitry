/**
 * logSanitizer — Utilidad para sanitizar logs y evitar fugas de información sensible (VULN-004).
 */

const SENSITIVE_KEYS = [
  'key',
  'token',
  'secret',
  'password',
  'apikey',
  'credit_card',
  'cvv',
  'card',
  'authorization',
  'cookie',
  'set-cookie'
];

/**
 * Sanitiza cabeceras de HTTP ocultando valores sensibles.
 */
export function sanitizeHeaders(headers: Record<string, any> | undefined): Record<string, any> {
  if (!headers) return {};
  const sanitized: Record<string, any> = {};
  for (const [key, value] of Object.entries(headers)) {
    const keyLower = key.toLowerCase();
    const isSensitive = SENSITIVE_KEYS.some(sk => 
      keyLower === sk || keyLower.includes(sk)
    );
    if (isSensitive) {
      sanitized[key] = '[REDACTED]';
    } else {
      sanitized[key] = value;
    }
  }
  return sanitized;
}

/**
 * Sanitiza objetos de forma recursiva ocultando valores sensibles.
 * Útil para query, body y params.
 */
export function sanitizeObject(obj: any): any {
  if (obj === null || obj === undefined) return obj;
  if (typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) {
    return obj.map(item => sanitizeObject(item));
  }

  const sanitized: Record<string, any> = {};
  for (const [key, value] of Object.entries(obj)) {
    const keyLower = key.toLowerCase();
    const isSensitive = SENSITIVE_KEYS.some(sk => 
      keyLower === sk || keyLower.includes(sk)
    );

    if (isSensitive) {
      sanitized[key] = '[REDACTED]';
    } else if (value && typeof value === 'object') {
      sanitized[key] = sanitizeObject(value);
    } else {
      sanitized[key] = value;
    }
  }
  return sanitized;
}

/**
 * Sanitiza URLs ocultando valores de parámetros query sensibles (por ejemplo ?key=sk_...).
 */
export function sanitizeUrl(url: string | undefined): string {
  if (!url) return '';
  try {
    const hasProtocol = url.includes('://');
    const dummyBase = 'http://localhost';
    const parsedUrl = new URL(url, hasProtocol ? undefined : dummyBase);
    let changed = false;
    
    parsedUrl.searchParams.forEach((value, key) => {
      const keyLower = key.toLowerCase();
      const isSensitive = SENSITIVE_KEYS.some(sk => 
        keyLower === sk || keyLower.includes(sk)
      );
      if (isSensitive) {
        parsedUrl.searchParams.set(key, '[REDACTED]');
        changed = true;
      }
    });
    
    if (changed) {
      if (hasProtocol) {
        return parsedUrl.toString();
      } else {
        return parsedUrl.pathname + parsedUrl.search + parsedUrl.hash;
      }
    }
  } catch (e) {
    // Fallback de regex robusto si la URL no puede parsearse normalmente
    let sanitized = url;
    for (const key of SENSITIVE_KEYS) {
      const regex = new RegExp(`([?&]${key}=)[^&]*`, 'gi');
      sanitized = sanitized.replace(regex, `$1[REDACTED]`);
    }
    return sanitized;
  }
  return url;
}
