import { Request, Response, NextFunction } from 'express';
import rateLimit from 'express-rate-limit';
import RedisStore from 'rate-limit-redis';
import { redis } from '../config/redis';
import { sanitizeHeaders } from '../utils/logSanitizer';
import { checkIsOriginAllowed } from '../config/security.config';

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
    // PERMITIR peticiones internas desde el mismo servidor (Next.js SSR) si no hay origin pero es localhost
    const isInternalIp = req.ip === '::1' || req.ip === '127.0.0.1' || req?.ip?.includes('172.');
    if (isInternalIp) {
      console.log(`[widgetSecurity] Permitido por ser IP interna: ${req.ip}`);
      return next();
    }
    console.log(`[widgetSecurity] Bloqueado: Falta Origin (Headers: ${JSON.stringify(sanitizeHeaders(req.headers))})`);
    return res.status(403).json({ error: 'Forbidden: Missing Origin' });
  }

  try {
    const isAllowed = await checkIsOriginAllowed(origin, req);

    if (!isAllowed) {
      console.log(`[widgetSecurity] Bloqueado: Origin no permitido (${origin}).`);
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