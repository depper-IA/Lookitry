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

      let lastLoggedError = 0;
      this.instance.on('error', (err) => {
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
    }
    return this.instance;
  }
}

export const redis = RedisService.getInstance();
