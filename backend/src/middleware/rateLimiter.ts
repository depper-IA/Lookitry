import rateLimit from 'express-rate-limit';
import { Request, Response, NextFunction } from 'express';

// IPs en whitelist (no se aplica rate limiting)
const WHITELIST_IPS = [
  '161.18.87.45', // Travis - desarrollo
];

const isWhitelisted = (ip: string): boolean => {
  return WHITELIST_IPS.includes(ip);
};

/**
 * Rate limiter para endpoints públicos
 * 500 requests por 15 minutos por IP (Aumentado de 100)
 */
export const publicRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 500, // Límite aumentado para evitar falsos positivos por hooks de sesión
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
    const ip = req.ip || '';
    // Skip si está en whitelist
    if (isWhitelisted(ip)) return true;
    // Omitir rate limiting para localhost en desarrollo (::1, 127.0.0.1, ::ffff:127.0.0.1)
    if (process.env.NODE_ENV === 'development') {
      if (ip === '::1' || ip === '127.0.0.1' || ip.startsWith('::ffff:127.') || ip === 'localhost') {
        return true;
      }
    }
    return false;
  },
});

/**
 * Rate limiter más estricto para endpoints de generación de imágenes
 * 50 requests por 15 minutos por IP (Aumentado de 20)
 */
export const generationRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 50, // Límite aumentado
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
    const ip = req.ip || '';
    if (isWhitelisted(ip)) return true;
    if (process.env.NODE_ENV === 'development' && ip === '::1') {
      return true;
    }
    return false;
  },
});

/**
 * Rate limiter para endpoints de autenticación
 * 50 intentos por 15 minutos por IP (Aumentado de 10)
 */
export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 50, // Límite aumentado para permitir flujos de Google Auth y check-email
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
    const ip = req.ip || '';
    if (isWhitelisted(ip)) return true;
    if (process.env.NODE_ENV === 'development' && ip === '::1') {
      return true;
    }
    return false;
  },
});

/**
 * Rate limiter MUY estricto para /login
 * 5 intentos por 15 minutos por IP — protección contra fuerza bruta
 */
export const loginRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: {
    error: 'LOGIN_RATE_LIMIT_EXCEEDED',
    message: 'Demasiados intentos de inicio de sesión. Por favor espera 15 minutos.',
    retryAfter: '15 minutos',
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req: Request, res: Response) => {
    console.warn(`⚠️  Login rate limit excedido para IP: ${req.ip}`);
    res.status(429).json({
      error: 'LOGIN_RATE_LIMIT_EXCEEDED',
      message: 'Demasiados intentos de inicio de sesión. Por favor espera 15 minutos.',
      retryAfter: '15 minutos',
      timestamp: new Date().toISOString(),
    });
  },
  skip: (req: Request) => {
    const ip = req.ip || '';
    if (isWhitelisted(ip)) return true;
    if (process.env.NODE_ENV === 'development' && ip === '::1') {
      return true;
    }
    return false;
  },
});

/**
 * Rate limiter para registro
 * 3 registros por hora por IP — prevenir spam de cuentas
 */
export const registerRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 3,
  message: {
    error: 'REGISTER_RATE_LIMIT_EXCEEDED',
    message: 'Demasiados intentos de registro. Por favor intenta de nuevo en una hora.',
    retryAfter: '1 hora',
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req: Request, res: Response) => {
    console.warn(`⚠️  Register rate limit excedido para IP: ${req.ip}`);
    res.status(429).json({
      error: 'REGISTER_RATE_LIMIT_EXCEEDED',
      message: 'Demasiados intentos de registro. Por favor intenta de nuevo en una hora.',
      retryAfter: '1 hora',
      timestamp: new Date().toISOString(),
    });
  },
  skip: (req: Request) => {
    const ip = req.ip || '';
    if (isWhitelisted(ip)) return true;
    if (process.env.NODE_ENV === 'development' && ip === '::1') {
      return true;
    }
    return false;
  },
});

/**
 * Rate limiter para login de admin
 * 5 intentos por 15 minutos por IP — protección contra fuerza bruta para panel admin
 */
export const adminLoginRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: {
    error: 'ADMIN_LOGIN_RATE_LIMIT_EXCEEDED',
    message: 'Demasiados intentos de inicio de sesión. Por favor espera 15 minutos.',
    retryAfter: '15 minutos',
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req: Request, res: Response) => {
    console.warn(`⚠️  Admin login rate limit excedido para IP: ${req.ip}`);
    res.status(429).json({
      error: 'ADMIN_LOGIN_RATE_LIMIT_EXCEEDED',
      message: 'Demasiados intentos de inicio de sesión. Por favor espera 15 minutos.',
      retryAfter: '15 minutos',
      timestamp: new Date().toISOString(),
    });
  },
  skip: (req: Request) => {
    const ip = req.ip || '';
    if (isWhitelisted(ip)) return true;
    if (process.env.NODE_ENV === 'development' && ip === '::1') {
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
 * Máximo 20 generaciones por hora por brandSlug (Aumentado de 10)
 */
function createSlugRateLimiter() {
  const WINDOW_MS = 60 * 60 * 1000; // 1 hora
  const MAX_REQUESTS = 20;

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
 * 2000 requests por 15 minutos por IP (Aumentado de 1000)
 */
export const globalRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 2000, // Límite aumentado
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
    const ip = req.ip || '';
    // Skip si está en whitelist
    if (isWhitelisted(ip)) return true;
    // Omitir health check del rate limiting global
    if (req.path === '/health') {
      return true;
    }
    if (process.env.NODE_ENV === 'development' && ip === '::1') {
      return true;
    }
    return false;
  },
});
