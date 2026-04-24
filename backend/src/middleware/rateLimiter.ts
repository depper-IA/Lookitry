import rateLimit from 'express-rate-limit';
import { Request, Response, NextFunction } from 'express';
import { supabaseAdmin } from '../config/supabase';

// IPs en whitelist hardcodeada (desarrollo优先级)
const HARDCODED_WHITELIST_IPS = [
  '161.18.87.45', // Travis - desarrollo
  '161.18.93.138', // Sam Wilkie
];

// Cache para IPs de payment_settings (actualiza cada 5 minutos)
interface WhitelistCache {
  ips: string[];
  updatedAt: number;
}
let whitelistCache: WhitelistCache = { ips: [], updatedAt: 0 };
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutos

async function getDbWhitelistIps(): Promise<string[]> {
  const now = Date.now();
  if (whitelistCache.ips.length > 0 && (now - whitelistCache.updatedAt) < CACHE_TTL_MS) {
    return whitelistCache.ips;
  }

  try {
    const { data } = await supabaseAdmin
      .from('payment_settings')
      .select('ip_whitelist')
      .eq('id', 1)
      .maybeSingle();

    const ipList = data?.ip_whitelist
      ? data.ip_whitelist.split(',').map((ip: string) => ip.trim()).filter(Boolean)
      : [];

    whitelistCache = { ips: ipList, updatedAt: now };
    return ipList;
  } catch (err) {
    console.error('[RateLimiter] Error fetching DB whitelist:', err);
    return whitelistCache.ips; // Devolver cache viejo si falla
  }
}

// Helper sincronico para chequear whitelist (usa cache sincrono como fallback)
function isIpWhitelistedSync(ip: string, dbIps: string[]): boolean {
  if (HARDCODED_WHITELIST_IPS.includes(ip)) return true;
  if (dbIps.includes(ip)) return true;
  return false;
}

// Helper sincronico para chequear whitelist (para usar en skip functions)
// Usa el cache sincrono (se actualiza cuando getDbWhitelistIps corre)
export const isWhitelistedSync = (ip: string): boolean => {
  // Locals siempre pasan
  if (ip === '::1' || ip === '127.0.0.1' || ip.startsWith('::ffff:127.') || ip === 'localhost') {
    return true;
  }
  if (HARDCODED_WHITELIST_IPS.includes(ip)) return true;
  if (whitelistCache.ips.includes(ip)) return true;
  return false;
};

export const isWhitelisted = async (ip: string): Promise<boolean> => {
  // Primero chequear sync (locals + hardcoded)
  if (isWhitelistedSync(ip)) return true;
  // Luego chequear DB whitelist async
  const dbIps = await getDbWhitelistIps();
  return dbIps.includes(ip);
};

// Nueva función para verificar bypass de testing (consulta DB lazy)
let testBypassCache: { allowed: boolean; updatedAt: number } = { allowed: false, updatedAt: 0 };
const BYPASS_CACHE_TTL = 60 * 1000; // 1 minuto

export async function isTestBypassAllowed(): Promise<boolean> {
  const now = Date.now();
  if (now - testBypassCache.updatedAt < BYPASS_CACHE_TTL) {
    return testBypassCache.allowed;
  }

  try {
    const { data } = await supabaseAdmin
      .from('payment_settings')
      .select('bypass_ip_protection')
      .eq('id', 1)
      .maybeSingle();

    testBypassCache = { allowed: data?.bypass_ip_protection === true, updatedAt: now };
    return testBypassCache.allowed;
  } catch {
    return testBypassCache.allowed;
  }
}

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
    const ip = req.headers['x-forwarded-for']?.toString().split(',')[0]?.trim() || req.ip || 'unknown';
    console.warn(`⚠️  Rate limit excedido para IP: ${ip}`);
    res.status(429).json({
      error: 'RATE_LIMIT_EXCEEDED',
      message: 'Demasiadas solicitudes desde esta IP, por favor intenta de nuevo más tarde.',
      retryAfter: '15 minutos',
      timestamp: new Date().toISOString(),
    });
  },
  // Omitir rate limiting para ciertas condiciones
  skip: (req: Request) => {
    // Prioridad: x-forwarded-for (real client IP through Traefik) > req.ip (Docker internal)
    const ip = req.headers['x-forwarded-for']?.toString().split(',')[0]?.trim() || req.ip || '';
    // Skip si está en whitelist (sync check - locals + hardcoded)
    if (isWhitelistedSync(ip)) return true;
    // Omitir rate limiting para localhost en desarrollo
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
    const ip = req.headers['x-forwarded-for']?.toString().split(',')[0]?.trim() || req.ip || '';
    if (isWhitelistedSync(ip)) return true;
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
    if (isWhitelistedSync(ip)) return true;
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
    if (isWhitelistedSync(ip)) return true;
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
    if (isWhitelistedSync(ip)) return true;
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
    if (isWhitelistedSync(ip)) return true;
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
    // Skip si está en whitelist (sync check)
    if (isWhitelistedSync(ip)) return true;
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
