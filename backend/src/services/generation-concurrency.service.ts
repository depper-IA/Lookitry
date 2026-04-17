import { redis } from '../config/redis';

export interface ConcurrencyLimit {
  maxConcurrent: number;
  queueTimeoutMs: number;
}

const PLAN_LIMITS: Record<string, ConcurrencyLimit> = {
  BASIC: { maxConcurrent: 2, queueTimeoutMs: 30000 },
  PRO: { maxConcurrent: 5, queueTimeoutMs: 30000 },
  ENTERPRISE: { maxConcurrent: 20, queueTimeoutMs: 30000 },
  TRIAL: { maxConcurrent: 1, queueTimeoutMs: 30000 },
  DEFAULT: { maxConcurrent: 1, queueTimeoutMs: 30000 },
};

const SLOT_TTL_SECONDS = 120;

export interface GenerationSlot {
  acquired: boolean;
  slotId: string | null;
  waitTimeMs: number;
}

export class GenerationConcurrencyService {
  private getKey(brandId: string): string {
    return `generation:concurrency:${brandId}`;
  }

  private getSlotKey(brandId: string, slotId: string): string {
    return `generation:slot:${brandId}:${slotId}`;
  }

  private getPlanLimit(plan: string): ConcurrencyLimit {
    return PLAN_LIMITS[plan.toUpperCase()] || PLAN_LIMITS.DEFAULT;
  }

  private async countActiveSlots(brandId: string): Promise<number> {
    try {
      const key = this.getKey(brandId);
      const current = await redis.get(key);
      return parseInt(current || '0', 10);
    } catch {
      return 0;
    }
  }

  private async incrementSlots(brandId: string): Promise<number> {
    try {
      const key = this.getKey(brandId);
      const result = await redis.incr(key);
      await redis.expire(key, SLOT_TTL_SECONDS);
      return result;
    } catch {
      return 0;
    }
  }

  private async decrementSlots(brandId: string): Promise<number> {
    try {
      const key = this.getKey(brandId);
      const result = await redis.decr(key);
      if (result < 0) {
        await redis.set(key, '0');
        return 0;
      }
      return result;
    } catch {
      return 0;
    }
  }

  private generateSlotId(): string {
    return `slot_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }

  async acquireSlot(brandId: string, plan: string): Promise<GenerationSlot> {
    const limit = this.getPlanLimit(plan);
    const startTime = Date.now();

    try {
      for (;;) {
        const currentSlots = await this.countActiveSlots(brandId);

        if (currentSlots < limit.maxConcurrent) {
          const newCount = await this.incrementSlots(brandId);

          if (newCount <= limit.maxConcurrent) {
            const slotId = this.generateSlotId();
            const slotKey = this.getSlotKey(brandId, slotId);
            await redis.set(slotKey, '1', 'EX', SLOT_TTL_SECONDS * 2);

            return {
              acquired: true,
              slotId,
              waitTimeMs: Date.now() - startTime,
            };
          } else {
            await this.decrementSlots(brandId);
          }
        }

        const elapsed = Date.now() - startTime;
        if (elapsed >= limit.queueTimeoutMs) {
          return {
            acquired: false,
            slotId: null,
            waitTimeMs: elapsed,
          };
        }

        const waitMs = Math.min(500, limit.queueTimeoutMs - elapsed);
        await this.sleep(waitMs);
      }
    } catch (error: any) {
      // Redis no disponible - permitir generación sin control de concurrencia
      const errorMsg = error.message || '';
      if (errorMsg.includes('MaxRetriesPerRequestError') ||
          errorMsg.includes('ECONNREFUSED') ||
          errorMsg.includes('max retries') ||
          errorMsg.includes('Connection is closed')) {
        console.warn('[Concurrency] Redis no disponible, saltando control de concurrencia');
        return {
          acquired: true,
          slotId: `mock_slot_${Date.now()}`,
          waitTimeMs: 0,
        };
      }
      throw error;
    }
  }

  async releaseSlot(brandId: string, slotId: string | null): Promise<void> {
    try {
      if (slotId && !slotId.startsWith('mock_')) {
        const slotKey = this.getSlotKey(brandId, slotId);
        await redis.del(slotKey);
      }
      await this.decrementSlots(brandId);
    } catch (error: any) {
      // Silenciar errores de Redis al liberar slot
      if (!error.message?.includes('MaxRetriesPerRequestError') &&
          !error.message?.includes('ECONNREFUSED')) {
        console.warn('[Concurrency] Error liberando slot:', error.message);
      }
    }
  }

  async getActiveCount(brandId: string): Promise<number> {
    return this.countActiveSlots(brandId);
  }

  async getSlotInfo(brandId: string, plan: string): Promise<{
    active: number;
    max: number;
    available: number;
    queueTimeoutMs: number;
  }> {
    const limit = this.getPlanLimit(plan);
    const active = await this.countActiveSlots(brandId);

    return {
      active,
      max: limit.maxConcurrent,
      available: Math.max(0, limit.maxConcurrent - active),
      queueTimeoutMs: limit.queueTimeoutMs,
    };
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

export const generationConcurrencyService = new GenerationConcurrencyService();