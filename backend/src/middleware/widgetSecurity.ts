import { Request, Response, NextFunction } from 'express';
import rateLimit from 'express-rate-limit';
import RedisStore from 'rate-limit-redis';
import { redis } from '../config/redis';
import { supabaseAdmin } from '../config/supabase';
import { normalizeOrigin } from '../utils/storeDomain';

// 1. Rate Limiting por IP utilizando Redis (límite: 100 requests / 15 minutos)
export const widgetRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // Límite de 100 requests
  standardHeaders: true,
  legacyHeaders: false,
  store: new RedisStore({
    // @ts-expect-error - Diferencias de tipado entre ioredis y rate-limit-redis
    sendCommand: (...args: string[]) => redis.call(...args),
  }),
  handler: (req, res) => {
    res.status(429).json({ error: 'Too Many Requests' });
  },
});

// 2. Validación dinámica de Origin
export const validateWidgetOrigin = async (req: Request, res: Response, next: NextFunction) => {
  const origin = req.headers.origin;
  console.log(`[widgetSecurity] Validando origin: ${origin} para ${req.params.brandSlug || 'global'}`);

  // En desarrollo local o postman, permitiremos la falta de origin solo si estamos en dev
  if (!origin) {
    if (process.env.NODE_ENV === 'development') {
      return next();
    }
    console.log(`[widgetSecurity] Bloqueado: Falta Origin (Headers: ${JSON.stringify(req.headers)})`);
    // PERMITIR peticiones internas desde el mismo servidor (Next.js SSR) si no hay origin pero es localhost
    const isInternalIp = req.ip === '::1' || req.ip === '127.0.0.1' || req?.ip?.includes('172.');
    if (isInternalIp) {
      console.log(`[widgetSecurity] Permitido por ser IP interna: ${req.ip}`);
      return next();
    }
    return res.status(403).json({ error: 'Forbidden: Missing Origin' });
  }

  try {
    const brandSlug = req.params.brandSlug;
    let allowedOrigins: string[] = [];
    const redisAvailable = redis.status === 'ready';

    if (brandSlug) {
      const cacheKey = `widget_origins:${brandSlug}`;

      // Intentar cache Redis solo si está disponible
      if (redisAvailable) {
        const timeoutPromise = new Promise<'timeout'>((resolve) => setTimeout(() => resolve('timeout'), 2000));
        const redisPromise = redis.get(cacheKey).then((cached: string | null) => {
          if (cached) return { type: 'hit', value: cached };
          return null;
        });
        const result = await Promise.race([redisPromise, timeoutPromise]);
        if (result !== 'timeout' && result) {
          allowedOrigins = JSON.parse(result.value);
        }
      }

      if (allowedOrigins.length === 0) {
        // Consultar a Supabase el campo social_links donde están los origenes permitidos
        const { data, error } = await supabaseAdmin
          .from('brands')
          .select('social_links')
          .eq('slug', brandSlug)
          .single();

        if (error || !data) {
          console.log(`[widgetSecurity] Bloqueado: Marca no encontrada (${brandSlug}). Error Supabase:`, JSON.stringify(error));
          return res.status(403).json({ error: 'Forbidden: Brand not found' });
        }

        if (data.social_links && Array.isArray((data.social_links as any).allowed_origins)) {
          allowedOrigins = (data.social_links as any).allowed_origins;
        }

        // Cachear en Redis solo si está disponible
        if (redisAvailable && allowedOrigins.length > 0) {
          redis.setex(cacheKey, 3600, JSON.stringify(allowedOrigins)).catch(() => {});
        }
      }
    } else {
      // Para rutas del widget sin brandSlug, usamos cache global de todos los origenes permitidos
      const cacheKey = 'widget_origins:global';

      if (redisAvailable) {
        const timeoutPromise = new Promise<'timeout'>((resolve) => setTimeout(() => resolve('timeout'), 2000));
        const redisPromise = redis.get(cacheKey).then((cached: string | null) => {
          if (cached) return { type: 'hit', value: cached };
          return null;
        });
        const result = await Promise.race([redisPromise, timeoutPromise]);
        if (result !== 'timeout' && result) {
          allowedOrigins = JSON.parse(result.value);
        }
      }

      if (allowedOrigins.length === 0) {
        const { data, error } = await supabaseAdmin
          .from('brands')
          .select('social_links');

        if (!error && data) {
          allowedOrigins = data.flatMap((d: any) => {
            if (d.social_links && Array.isArray(d.social_links.allowed_origins)) return d.social_links.allowed_origins;
            return [];
          }).filter(Boolean);
        }

        if (redisAvailable && allowedOrigins.length > 0) {
          redis.setex(cacheKey, 3600, JSON.stringify(allowedOrigins)).catch(() => {});
        }
      }
    }

    const normalizedIncoming = normalizeOrigin(origin);
    const isLocalhost = origin.includes('localhost') || origin.includes('127.0.0.1');

    // Always allow Lookitry main domain as origin (for /marca/[slug] pages)
    const lookitryDomains = ['lookitry.com', 'www.lookitry.com', 'lookitry.vercel.app', 'localhost'];
    const isLookitryDomain = lookitryDomains.some(d => origin.includes(d));

    if (!normalizedIncoming && !isLocalhost && !isLookitryDomain) {
       console.log(`[widgetSecurity] Bloqueado: Origin inválido (${origin})`);
       return res.status(403).json({ error: 'Forbidden: Invalid Origin' });
    }

    const isAllowed = allowedOrigins.some(allowed => {
      return normalizeOrigin(allowed) === normalizedIncoming;
    });

    if (!isAllowed && !isLocalhost && !isLookitryDomain) {
      console.log(`[widgetSecurity] Bloqueado: Origin no permitido (${origin}). Permitidos: ${JSON.stringify(allowedOrigins)}`);
      return res.status(403).json({ error: 'Forbidden: Origin not allowed by brand configuration' });
    }

    next();
  } catch (error) {
    console.error('Error validating widget origin:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

// Middleware compuesto que agrupa ambas protecciones
export const widgetSecurity = [widgetRateLimiter, validateWidgetOrigin];