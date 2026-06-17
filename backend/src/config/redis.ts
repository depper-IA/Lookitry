import Redis from 'ioredis';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
dotenv.config();

const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

// Track connection state to avoid calling commands on dead connections
let connectionAlive = false;

export class RedisService {
  private static instance: Redis | null = null;

  public static getInstance(): Redis {
    if (!this.instance) {
      this.instance = new Redis(redisUrl, {
        maxRetriesPerRequest: null, // No lanzar error si no hay conexión, simplemente encolar o fallar según retryStrategy
        retryStrategy: (times) => {
          // Intentar reconectar cada 10 segundos en desarrollo
          if (process.env.NODE_ENV === 'development') {
            return 10000;
          }
          // En producción, reintentos infinitos con backoff (máx 5s) para auto-recuperación
          return Math.min(times * 200, 5000);
        },
        lazyConnect: true, // No intentar conectar inmediatamente al crear instancia
        enableReadyCheck: false, // Desactivar check de ready para evitar cuelgues si no hay Redis
      });

      this.instance.on('connect', () => {
        connectionAlive = true;
      });

      this.instance.on('ready', () => {
        connectionAlive = true;
      });

      this.instance.on('close', () => {
        connectionAlive = false;
      });

      this.instance.on('error', (err) => {
        connectionAlive = false;
        // En desarrollo, solo logueamos una advertencia una vez cada 30 segundos
        // para no saturar la consola si el desarrollador no tiene Redis.
        const now = Date.now();
        if (process.env.NODE_ENV === 'development') {
          if (now - lastLoggedError > 30000) {
            console.warn('[Redis] No disponible localmente (Modo Desarrollo). Algunas funciones de cola podrían estar pausadas.');
            lastLoggedError = now;
          }
        } else {
          console.error('[Redis] Error de conexión:', err.message);
        }
      });

      this.instance.connect().catch(() => {
        // Connection failed — that's ok for local dev without Redis
      });
    }
    return this.instance;
  }

  // Expose connection state so services can check before issuing commands
  public static isAlive(): boolean {
    return connectionAlive && RedisService.instance !== null;
  }
}

let lastLoggedError = 0;

export const redis = RedisService.getInstance();

// Export a helper that returns null instead of throwing when Redis is down
export async function redisGetSafe(key: string): Promise<string | null> {
  if (!RedisService.isAlive()) return null;
  try {
    return await redis.get(key);
  } catch {
    return null;
  }
}

export async function redisSetExSafe(key: string, ttl: number, value: string): Promise<void> {
  if (!RedisService.isAlive()) return;
  try {
    await redis.setex(key, ttl, value);
  } catch {
    // Silently fail — cache is best-effort
  }
}

/**
 * JWT Blacklist - Almacena tokens revocados en Redis
 * Key format: jwt:blacklist:{tokenHash}
 * Value: '1' (razón de revocación)
 * TTL: basado en tiempo restante del token
 */
const JWT_BLACKLIST_PREFIX = 'jwt:blacklist:';

export async function blacklistToken(token: string, reason: string = 'logout'): Promise<void> {
  if (!RedisService.isAlive()) return;
  try {
    // Usar hash del token como key (no almacenar el token completo)
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const key = `${JWT_BLACKLIST_PREFIX}${tokenHash}`;

    // Calcular TTL restante del token (max 7 días = 604800 segundos)
    let ttl = 7 * 24 * 60 * 60;
    try {
      const decoded = jwt.decode(token) as { exp?: number } | null;
      if (decoded?.exp) {
        const remaining = decoded.exp - Math.floor(Date.now() / 1000);
        if (remaining > 0 && remaining < ttl) {
          ttl = remaining;
        }
      }
    } catch {
      // Si no se puede decodificar, usar TTL por defecto
    }

    await redis.setex(key, ttl, reason);
    console.log(`[JWT Blacklist] Token blacklisted: ${reason}`);
  } catch (err) {
    console.error('[JWT Blacklist] Error blacklisting token:', err);
  }
}

export async function isTokenBlacklisted(token: string): Promise<boolean> {
  // C-5: modo configurable cuando no se puede verificar contra Redis.
  // fail-closed (estricto) prioriza seguridad: token bloqueado si Redis no responde.
  // fail-open (default) prioriza disponibilidad: token aceptado (riesgo acotado por el
  // TTL corto del access token).
  const failClosed = process.env.JWT_BLACKLIST_STRICT === 'true';

  if (!RedisService.isAlive()) {
    if (failClosed) {
      console.warn('[JWT Blacklist] Redis no disponible y modo estricto activo — rechazando token (fail-closed)');
    }
    return failClosed;
  }
  try {
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const key = `${JWT_BLACKLIST_PREFIX}${tokenHash}`;
    const result = await redis.get(key);
    return result !== null;
  } catch (err) {
    console.error('[JWT Blacklist] Error checking blacklist:', err);
    return failClosed;
  }
}
