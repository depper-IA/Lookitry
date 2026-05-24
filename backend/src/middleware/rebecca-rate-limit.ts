import rateLimit from 'express-rate-limit';
import RedisStore from 'rate-limit-redis';
import { Request, Response } from 'express';
import { redis } from '../config/redis';

const MAX = parseInt(process.env.REBECCA_WIDGET_RATE_LIMIT_MAX ?? '60', 10);
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

export const rebeccaRateLimitBySession = rateLimit({
  windowMs: WINDOW_MS,
  max: MAX,
  store: makeStore('rl:widget:'),
  keyGenerator: (req: Request): string => {
    const body = req.body as { session_id?: string };
    if (body?.session_id) return `session:${body.session_id}`;
    return `widget:${req.headers['x-forwarded-for'] ?? req.socket?.remoteAddress ?? 'unknown'}`;
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
    return `ip:${req.headers['x-forwarded-for'] ?? req.socket?.remoteAddress ?? 'unknown'}`;
  },
  validate: {
    ip: false,
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: make429Handler,
});
