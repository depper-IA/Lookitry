import rateLimit from 'express-rate-limit';
import RedisStore from 'rate-limit-redis';
import { Request, Response, NextFunction } from 'express';
import { redis } from '../config/redis';
import { supabaseAdmin } from '../config/supabase';

// ─── IP Whitelist ────────────────────────────────────────────────────────────

// A-5: IPs de whitelist desde env (CSV), no hardcodeadas en el código.
// Respaldo: la whitelist persistente vive en DB (payment_settings.ip_whitelist
// y la tabla widget_ip_whitelist), cacheada en whitelistCache.
const ENV_WHITELIST_IPS = (process.env.RATE_LIMIT_WHITELIST_IPS || '')
  .split(',')
  .map((ip) => ip.trim())
  .filter(Boolean);

interface WhitelistCache {
  ips: string[];
  updatedAt: number;
}
let whitelistCache: WhitelistCache = { ips: [], updatedAt: 0 };
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutos

export const refreshWhitelistCache = async (): Promise<void> => {
  const now = Date.now();
  try {
    const [settingsResult, widgetResult] = await Promise.all([
      supabaseAdmin.from('payment_settings').select('ip_whitelist').eq('id', 1).maybeSingle(),
      supabaseAdmin.from('widget_ip_whitelist').select('ip_address').eq('is_active', true),
    ]);

    const settingsIps = settingsResult?.data?.ip_whitelist
      ? settingsResult.data.ip_whitelist.split(',').map((ip: string) => ip.trim()).filter(Boolean)
      : [];

    const widgetIps = widgetResult?.data
      ? widgetResult.data.map((row: any) => row.ip_address).filter(Boolean)
      : [];

    const allIps = [...new Set([...settingsIps, ...widgetIps])];
    whitelistCache = { ips: allIps, updatedAt: now };
    console.log(`[RateLimiter] Cache refreshed: ${allIps.length} IPs`);
  } catch (err) {
    console.error('[RateLimiter] Error refreshing cache:', err);
  }
};

refreshWhitelistCache().catch(console.error);

async function getDbWhitelistIps(): Promise<string[]> {
  const now = Date.now();
  if (whitelistCache.ips.length > 0 && now - whitelistCache.updatedAt < CACHE_TTL_MS) {
    return whitelistCache.ips;
  }
  await refreshWhitelistCache();
  return whitelistCache.ips;
}

export const isWhitelistedSync = (ip: string): boolean => {
  if (ip === '::1' || ip === '127.0.0.1' || ip.startsWith('::ffff:127.') || ip === 'localhost') {
    return true;
  }
  if (ENV_WHITELIST_IPS.includes(ip)) return true;
  return whitelistCache.ips.includes(ip);
};

export const isWhitelisted = async (ip: string): Promise<boolean> => {
  if (isWhitelistedSync(ip)) return true;
  const dbIps = await getDbWhitelistIps();
  return dbIps.includes(ip);
};

let testBypassCache: { allowed: boolean; updatedAt: number } = { allowed: false, updatedAt: 0 };
const BYPASS_CACHE_TTL = 60 * 1000;

export async function isTestBypassAllowed(): Promise<boolean> {
  const now = Date.now();
  if (now - testBypassCache.updatedAt < BYPASS_CACHE_TTL) return testBypassCache.allowed;
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

// ─── Redis Store factory ─────────────────────────────────────────────────────
// Crea un RedisStore para rate-limit-redis@4 con ioredis.
// Si Redis no está disponible, devuelve undefined y express-rate-limit
// cae automáticamente al store en memoria (comportamiento por defecto).

function makeRedisStore(prefix: string): RedisStore | undefined {
  if (!redis || (redis as any).status !== 'ready') {
    return undefined; // Permite al rate-limiter caer al fallback en memoria
  }
  try {
    return new RedisStore({
      sendCommand: (...args: string[]) => {
        if (!redis || (redis as any).status !== 'ready') throw new Error('Redis no disponible');
        return (redis as any).call(...args);
      },
      prefix,
    });
  } catch {
    return undefined;
  }
}

// ─── Skip helper ─────────────────────────────────────────────────────────────

const skipWhitelisted = (req: Request): boolean => {
  const ip = req.ip || '';
  if (isWhitelistedSync(ip)) return true;
  if (process.env.NODE_ENV === 'development') {
    if (ip === '::1' || ip === '127.0.0.1' || ip.startsWith('::ffff:127.') || ip === 'localhost') {
      return true;
    }
  }
  return false;
};

// ─── Rate Limiters ───────────────────────────────────────────────────────────

/**
 * Login — 5 intentos / 15 min / IP (Redis)
 * Protección principal contra brute force en credenciales.
 */
const internalLoginRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  store: makeRedisStore('rl:login:'),
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
  skip: skipWhitelisted,
});

export const loginRateLimiter = (req: Request, res: Response, next: NextFunction) => {
  if (!redis || (redis as any).status !== 'ready') {
    console.error(`[RateLimiter] Fail-Closed para login activado para IP: ${req.ip}`);
    return res.status(503).json({
      error: 'SERVICE_UNAVAILABLE',
      message: 'Servicio temporalmente no disponible por mantenimiento de seguridad.',
    });
  }
  return internalLoginRateLimiter(req, res, next);
};

/**
 * Admin login — 5 intentos / 15 min / IP (Redis)
 */
const internalAdminLoginRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  store: makeRedisStore('rl:admin-login:'),
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
  skip: skipWhitelisted,
});

export const adminLoginRateLimiter = (req: Request, res: Response, next: NextFunction) => {
  if (!redis || (redis as any).status !== 'ready') {
    console.error(`[RateLimiter] Fail-Closed para admin login activado para IP: ${req.ip}`);
    return res.status(503).json({
      error: 'SERVICE_UNAVAILABLE',
      message: 'Servicio temporalmente no disponible por mantenimiento de seguridad.',
    });
  }
  return internalAdminLoginRateLimiter(req, res, next);
};

/**
 * Registro — 3 intentos / hora / IP (Redis)
 * Previene spam de cuentas.
 */
export const registerRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 3,
  store: makeRedisStore('rl:register:'),
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
  skip: skipWhitelisted,
});

/**
 * Auth general (forgot-password, reset-password, resend-verification) — 5 intentos / 15 min / IP (Redis)
 * Bajado de 50 a 5 para prevenir enumeración de emails y abuso de reset.
 */
export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  store: makeRedisStore('rl:auth:'),
  message: {
    error: 'AUTH_RATE_LIMIT_EXCEEDED',
    message: 'Demasiados intentos de autenticación. Por favor intenta de nuevo más tarde.',
    retryAfter: '15 minutos',
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req: Request, res: Response) => {
    console.warn(`⚠️  Auth rate limit excedido para IP: ${req.ip}`);
    res.status(429).json({
      error: 'AUTH_RATE_LIMIT_EXCEEDED',
      message: 'Demasiados intentos de autenticación. Por favor intenta de nuevo más tarde.',
      retryAfter: '15 minutos',
      timestamp: new Date().toISOString(),
    });
  },
  skip: skipWhitelisted,
});

/**
 * Endpoints públicos (widget, embed, reviews) — 200 requests / 15 min / IP
 * Bajado de 500 para reducir superficie de abuso.
 */
export const publicRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  message: {
    error: 'RATE_LIMIT_EXCEEDED',
    message: 'Demasiadas solicitudes desde esta IP, por favor intenta de nuevo más tarde.',
    retryAfter: '15 minutos',
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req: Request, res: Response) => {
    const ip = req.ip || 'unknown';
    console.warn(`⚠️  Rate limit excedido para IP: ${ip}`);
    res.status(429).json({
      error: 'RATE_LIMIT_EXCEEDED',
      message: 'Demasiadas solicitudes desde esta IP, por favor intenta de nuevo más tarde.',
      retryAfter: '15 minutos',
      timestamp: new Date().toISOString(),
    });
  },
  skip: skipWhitelisted,
});

/**
 * Generación de imágenes — 50 requests / 15 min / IP
 */
export const generationRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 50,
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
  skip: skipWhitelisted,
});

/**
 * Global — 1000 requests / 15 min / IP (Redis)
 * Bajado de 2000. Cubre toda la API como última línea de defensa.
 */
export const globalRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000,
  store: makeRedisStore('rl:global:'),
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
    if (req.path === '/health') return true;
    return skipWhitelisted(req);
  },
});

// ─── Slug Rate Limiter (en memoria — por brandSlug, no por IP) ───────────────

const slugStore = new Map<string, { count: number; resetAt: number }>();

setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of slugStore.entries()) {
    if (now >= entry.resetAt) slugStore.delete(key);
  }
}, 10 * 60 * 1000);

function createSlugRateLimiter() {
  const WINDOW_MS = 60 * 60 * 1000; // 1 hora
  const MAX_REQUESTS = 20;

  return (req: Request, res: Response, next: NextFunction): void => {
    const { brandSlug } = req.params;
    if (!brandSlug) { next(); return; }

    const ip = req.ip || '';
    if (isWhitelistedSync(ip)) { next(); return; }

    const now = Date.now();
    const entry = slugStore.get(brandSlug);

    if (!entry || now >= entry.resetAt) {
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
