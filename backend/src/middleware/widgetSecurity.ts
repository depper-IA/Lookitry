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

  // En desarrollo local o postman, permitiremos la falta de origin solo si estamos en dev
  if (!origin) {
    if (process.env.NODE_ENV === 'development') {
      return next();
    }
    return res.status(403).json({ error: 'Forbidden: Missing Origin' });
  }

  try {
    const brandSlug = req.params.brandSlug;
    let allowedOrigins: string[] = [];

    if (brandSlug) {
      const cacheKey = `widget_origins:${brandSlug}`;
      const cached = await redis.get(cacheKey);

      if (cached) {
        allowedOrigins = JSON.parse(cached);
      } else {
        // Consultar a Supabase el campo allowed_origins (o en jsonb social_links como fallback)
        const { data, error } = await supabaseAdmin
          .from('brands')
          .select('allowed_origins, social_links')
          .eq('slug', brandSlug)
          .single();

        if (error || !data) {
          return res.status(403).json({ error: 'Forbidden: Brand not found' });
        }

        if (Array.isArray(data.allowed_origins)) {
          allowedOrigins = data.allowed_origins;
        } else if (data.social_links && Array.isArray((data.social_links as any).allowed_origins)) {
          allowedOrigins = (data.social_links as any).allowed_origins;
        }

        // Cachear los allowed_origins en Redis por 1 hora (3600 segundos)
        await redis.setex(cacheKey, 3600, JSON.stringify(allowedOrigins));
      }
    } else {
      // Para rutas del widget sin brandSlug, usamos cache global de todos los origenes permitidos
      const cacheKey = 'widget_origins:global';
      const cached = await redis.get(cacheKey);
      
      if (cached) {
        allowedOrigins = JSON.parse(cached);
      } else {
        const { data, error } = await supabaseAdmin
          .from('brands')
          .select('allowed_origins, social_links');
          
        if (!error && data) {
          allowedOrigins = data.flatMap(d => {
            if (Array.isArray(d.allowed_origins)) return d.allowed_origins;
            if (d.social_links && Array.isArray((d.social_links as any).allowed_origins)) return (d.social_links as any).allowed_origins;
            return [];
          }).filter(Boolean);
        }
        await redis.setex(cacheKey, 3600, JSON.stringify(allowedOrigins));
      }
    }

    const normalizedIncoming = normalizeOrigin(origin);
    const isLocalhost = origin.includes('localhost') || origin.includes('127.0.0.1');

    // Always allow Lookitry main domain as origin (for /marca/[slug] pages)
    const lookitryDomains = ['lookitry.com', 'www.lookitry.com', 'lookitry.vercel.app', 'localhost'];
    const isLookitryDomain = lookitryDomains.some(d => origin.includes(d));

    if (!normalizedIncoming && !isLocalhost) {
       return res.status(403).json({ error: 'Forbidden: Invalid Origin' });
    }

    const isAllowed = allowedOrigins.some(allowed => {
      return normalizeOrigin(allowed) === normalizedIncoming;
    });

    if (!isAllowed && !isLocalhost && !isLookitryDomain) {
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
