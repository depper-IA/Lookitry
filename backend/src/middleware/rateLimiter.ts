import rateLimit from 'express-rate-limit';
import { Request, Response, NextFunction } from 'express';

/**
 * Rate limiter para endpoints públicos
 * 100 requests por 15 minutos por IP
 */
export const publicRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // Límite de 100 requests por ventana
  message: {
    error: 'RATE_LIMIT_EXCEEDED',
    message: 'Demasiadas solicitudes desde esta IP, por favor intenta de nuevo más tarde.',
    retryAfter: '15 minutos',
  },
  standardHeaders: true, // Retornar info de rate limit en headers `RateLimit-*`
  legacyHeaders: false, // Deshabilitar headers `X-RateLimit-*`
  // Handler personalizado cuando se excede el límite
  handler: (req: Request, res: Response) => {
    console.warn(`⚠️  Rate limit excedido para IP: ${req.ip}`);
    res.status(429).json({
      error: 'RATE_LIMIT_EXCEEDED',
      message: 'Demasiadas solicitudes desde esta IP, por favor intenta de nuevo más tarde.',
      retryAfter: '15 minutos',
      timestamp: new Date().toISOString(),
    });
  },
  // Omitir rate limiting para ciertas condiciones
  skip: (req: Request) => {
    // En desarrollo, podemos omitir rate limiting para localhost
    if (process.env.NODE_ENV === 'development' && req.ip === '::1') {
      return true;
    }
    return false;
  },
});

/**
 * Rate limiter más estricto para endpoints de generación de imágenes
 * 20 requests por 15 minutos por IP
 */
export const generationRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 20, // Límite de 20 generaciones por ventana
  message: {
    error: 'GENERATION_RATE_LIMIT_EXCEEDED',
    message: 'Has excedido el límite de generaciones por IP. Por favor intenta de nuevo más tarde.',
    retryAfter: '15 minutos',
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req: Request, res: Response) => {
    console.warn(`⚠️  Rate limit de generación excedido para IP: ${req.ip}`);
    res.status(429).json({
      error: 'GENERATION_RATE_LIMIT_EXCEEDED',
      message: 'Has excedido el límite de generaciones por IP. Por favor intenta de nuevo más tarde.',
      retryAfter: '15 minutos',
      timestamp: new Date().toISOString(),
    });
  },
  skip: (req: Request) => {
    if (process.env.NODE_ENV === 'development' && req.ip === '::1') {
      return true;
    }
    return false;
  },
});

/**
 * Rate limiter para endpoints de autenticación
 * 10 intentos por 15 minutos por IP
 */
export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 10, // Máximo 10 intentos de login por ventana
  message: {
    error: 'AUTH_RATE_LIMIT_EXCEEDED',
    message: 'Demasiados intentos de autenticación. Por favor intenta de nuevo más tarde.',
    retryAfter: '15 minutos',
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req: Request, res: Response) => {
    console.warn(`⚠️  Rate limit de auth excedido para IP: ${req.ip}`);
    res.status(429).json({
      error: 'AUTH_RATE_LIMIT_EXCEEDED',
      message: 'Demasiados intentos de autenticación. Por favor intenta de nuevo más tarde.',
      retryAfter: '15 minutos',
      timestamp: new Date().toISOString(),
    });
  },
  skip: (req: Request) => {
    if (process.env.NODE_ENV === 'development' && req.ip === '::1') {
      return true;
    }
    return false;
  },
});

// Store en memoria para rate limiting por brandSlug
const slugStore = new Map<string, { count: number; resetAt: number }>();

// Limpiar entradas expiradas cada 10 minutos
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of slugStore.entries()) {
    if (now >= entry.resetAt) {
      slugStore.delete(key);
    }
  }
}, 10 * 60 * 1000);

/**
 * Crea un rate limiter por brandSlug (no por IP)
 * Máximo 10 generaciones por hora por brandSlug
 */
function createSlugRateLimiter() {
  const WINDOW_MS = 60 * 60 * 1000; // 1 hora
  const MAX_REQUESTS = 10;

  return (req: Request, res: Response, next: NextFunction): void => {
    const { brandSlug } = req.params;

    if (!brandSlug) {
      next();
      return;
    }

    const now = Date.now();
    const entry = slugStore.get(brandSlug);

    if (!entry || now >= entry.resetAt) {
      // Primera request o ventana expirada: iniciar nueva ventana
      slugStore.set(brandSlug, { count: 1, resetAt: now + WINDOW_MS });
      next();
      return;
    }

    if (entry.count >= MAX_REQUESTS) {
      const secondsRemaining = Math.ceil((entry.resetAt - now) / 1000);
      const minutesRemaining = Math.ceil(secondsRemaining / 60);

      res.setHeader('Retry-After', String(secondsRemaining));
      res.status(429).json({
        error: 'SLUG_RATE_LIMIT_EXCEEDED',
        message: 'Se ha alcanzado el límite de generaciones para esta marca. Por favor intenta de nuevo más tarde.',
        retryAfter: `${minutesRemaining} minutos`,
      });
      return;
    }

    entry.count += 1;
    next();
  };
}

export const slugGenerationRateLimiter = createSlugRateLimiter();

/**
 * Rate limiter global para toda la API
 * 1000 requests por 15 minutos por IP
 */
export const globalRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 1000, // Límite de 1000 requests por ventana
  message: {
    error: 'GLOBAL_RATE_LIMIT_EXCEEDED',
    message: 'Demasiadas solicitudes. Por favor intenta de nuevo más tarde.',
    retryAfter: '15 minutos',
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req: Request, res: Response) => {
    console.warn(`⚠️  Rate limit global excedido para IP: ${req.ip}`);
    res.status(429).json({
      error: 'GLOBAL_RATE_LIMIT_EXCEEDED',
      message: 'Demasiadas solicitudes. Por favor intenta de nuevo más tarde.',
      retryAfter: '15 minutos',
      timestamp: new Date().toISOString(),
    });
  },
  skip: (req: Request) => {
    // Omitir health check del rate limiting global
    if (req.path === '/health') {
      return true;
    }
    if (process.env.NODE_ENV === 'development' && req.ip === '::1') {
      return true;
    }
    return false;
  },
});
