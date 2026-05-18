import rateLimit from 'express-rate-limit';
import RedisStore from 'rate-limit-redis';
import { Request, Response } from 'express';
import { redis } from '../config/redis';

const MAX = parseInt(process.env.REBECCA_WIDGET_RATE_LIMIT_MAX ?? '20', 10);
const WINDOW_MS = parseInt(process.env.REBECCA_WIDGET_RATE_LIMIT_WINDOW_MS ?? '3600000', 10);
const RETRY_AFTER_SEC = Math.ceil(WINDOW_MS / 1000);

function make429Handler(req: Request, res: Response): void {
  res.status(429).json({
    error: 'rate_limit_exceeded',
    retry_after_sec: RETRY_AFTER_SEC,
  });
}

function makeStore(prefix: string): RedisStore | undefined {
  try {
    return new RedisStore({
      // @ts-expect-error — ioredis vs rate-limit-redis typing mismatch
      sendCommand: (...args: string[]) => redis.call(...args),
      prefix,
    });
  } catch {
    return undefined;
  }
}

// Helper to get safe IP from request (never used in keyGenerator)
function getSafeIP(req: Request): string {
  // Use x-forwarded-for first (set by Traefik), then socket remote address
  const forwarded = req.headers['x-forwarded-for']?.toString().split(',')[0].trim();
  if (forwarded) return forwarded;
  return req.socket?.remoteAddress ?? 'unknown';
}

export const rebeccaRateLimitBySession = rateLimit({
  windowMs: WINDOW_MS,
  max: MAX,
  store: makeStore('rl:widget:'),
  keyGenerator: (req: Request): string => {
    // Use session_id from body if present, otherwise generate from IP + user-agent
    const body = req.body as { session_id?: string };
    if (body?.session_id) return `session:${body.session_id}`;
    // Fallback: use IP + user-agent hash (no req.ip reference to avoid IPv6 validation error)
    const ip = getSafeIP(req);
    const ua = req.headers['user-agent'] ?? 'unknown';
    return `anon:${ip}:${ua.substring(0, 50)}`;
  },
  validate: {
    ip: false,
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: make429Handler,
});

export const rebeccaRateLimitByIP = rateLimit({
  windowMs: WINDOW_MS,
  max: 60,
  store: makeStore('rl:widget-ip:'),
  keyGenerator: (req: Request): string => {
    // Use x-forwarded-for header (set by Traefik) as primary identifier
    // NEVER use req.ip directly — causes IPv6 validation error in express-rate-limit 8.x
    const forwarded = req.headers['x-forwarded-for']?.toString().split(',')[0].trim();
    if (forwarded) return forwarded;
    // Fallback: use socket remote address
    return req.socket?.remoteAddress ?? 'unknown';
  },
  validate: {
    ip: false,
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: make429Handler,
});
