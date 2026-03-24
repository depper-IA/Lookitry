import Redis from 'ioredis';
import dotenv from 'dotenv';
dotenv.config();

const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

class RedisService {
  private static instance: Redis | null = null;

  public static getInstance(): Redis {
    if (!this.instance) {
      this.instance = new Redis(redisUrl, {
        maxRetriesPerRequest: 1,
        retryStrategy: (times) => {
          // Desactivar reintentos infinitos si falla para no bloquear el proceso
          if (times > 3) return null;
          return Math.min(times * 50, 2000);
        },
        // Silenciar errores de conexión
        lazyConnect: true
      });

      this.instance.on('error', (err) => {
        // Loggear pero no crashear
        console.warn('[Redis] Error de conexión:', err.message);
      });
    }
    return this.instance;
  }
}

export const redis = RedisService.getInstance();
