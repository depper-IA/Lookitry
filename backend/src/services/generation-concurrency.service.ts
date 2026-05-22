import { redis } from '../config/redis';
import { supabaseAdmin } from '../config/supabase';

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
    if (!redis.status || redis.status === 'wait') return 0;
    try {
      const key = this.getKey(brandId);
      const current = await redis.get(key);
      return parseInt(current || '0', 10);
    } catch {
      return 0;
    }
  }

  /**
   * Atomically try to acquire a slot using Lua script.
   * Returns the new count if successful, or -1 if at capacity.
   */
  async acquireSlot(brandId: string, plan: string): Promise<GenerationSlot> {
    if (!redis.status || redis.status === 'wait') {
      return { acquired: true, slotId: null, waitTimeMs: 0 };
    }

    const limit = this.getPlanLimit(plan);
    const key = this.getKey(brandId);

    const luaScript = `
      local current = tonumber(redis.call('GET', KEYS[1]) or '0')
      local maxConcurrent = tonumber(ARGV[1])
      local ttl = tonumber(ARGV[2])
      if current < maxConcurrent then
        redis.call('INCR', KEYS[1])
        redis.call('EXPIRE', KEYS[1], ttl)
        return current + 1
      else
        return -1
      end
    `;

    try {
      const result = await redis.eval(
        luaScript, 1, key,
        limit.maxConcurrent.toString(),
        SLOT_TTL_SECONDS.toString()
      ) as number;

      if (result === -1) {
        return { acquired: false, slotId: null, waitTimeMs: limit.queueTimeoutMs };
      }

      const slotId = `${brandId}-${Date.now()}-${Math.random().toString(36).slice(2)}`;
      await redis.setex(this.getSlotKey(brandId, slotId), SLOT_TTL_SECONDS, '1');

      return { acquired: true, slotId, waitTimeMs: 0 };
    } catch (err) {
      console.error('[Concurrency] acquireSlot error:', err);
      return { acquired: true, slotId: null, waitTimeMs: 0 };
    }
  }

  async releaseSlot(brandId: string, slotId: string | null): Promise<void> {
    if (!slotId || !redis.status || redis.status === 'wait') return;
    try {
      const key = this.getKey(brandId);
      const slotKey = this.getSlotKey(brandId, slotId);

      const luaScript = `
        redis.call('DECR', KEYS[1])
        redis.call('DEL', KEYS[2])
        local val = tonumber(redis.call('GET', KEYS[1]) or '0')
        if val <= 0 then redis.call('DEL', KEYS[1]) end
        return val
      `;

      await redis.eval(luaScript, 2, key, slotKey);
    } catch (err) {
      console.error('[Concurrency] releaseSlot error:', err);
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

  /**
   * Get global count of active generation slots across all brands.
   * Uses SCAN (safer than KEYS in production, never blocks).
   * Falls back to 0 if Redis is unavailable.
   */
  async getGlobalActiveCount(): Promise<number> {
    if (!redis.status || redis.status === 'wait') {
      // Fallback: contar generaciones recientes desde Supabase (últimos 2 min)
      const cutoff = new Date(Date.now() - 2 * 60 * 1000).toISOString();
      const { count } = await supabaseAdmin
        .from('generations')
        .select('id', { count: 'exact', head: true })
        .in('status', ['PENDING'])
        .gte('generated_at', cutoff);
      return count || 0;
    }

    try {
      let cursor = '0';
      let total = 0;
      const pattern = 'generation:concurrency:*';

      do {
        const [nextCursor, keys] = await redis.scan(
          cursor, 'MATCH', pattern, 'COUNT', 100
        );
        cursor = nextCursor;

        if (keys.length > 0) {
          const pipeline = redis.pipeline();
          keys.forEach(key => pipeline.get(key));
          const results = await Promise.race([
            pipeline.exec(),
            new Promise<null>((_, reject) => setTimeout(() => reject(new Error('timeout')), 2000)),
          ]) as any[][];
          if (results) {
            total += (results || []).reduce((sum, [err, val]) => {
              if (err || !val) return sum;
              return sum + parseInt(String(val), 10);
            }, 0);
          }
        }
      } while (cursor !== '0');

      return total;
    } catch {
      return 0;
    }
  }

  /**
   * Get all brands with active generation slots, including brand name and last activity.
   * Uses SCAN (never blocks). Falls back to empty array if Redis unavailable.
   */
  async getBrandsWithActiveGenerations(): Promise<Array<{
    brandId: string;
    brandName: string;
    active: number;
    max: number;
    lastActivity: string | null;
  }>> {
    if (!redis.status || redis.status === 'wait') {
      // Fallback: usar Supabase para contar generaciones activas (últimos 2 min)
      const cutoff = new Date(Date.now() - 2 * 60 * 1000).toISOString();
      const { data: recentGens } = await supabaseAdmin
        .from('generations')
        .select('brand_id, generated_at, brands(name)')
        .in('status', ['PENDING'])
        .gte('generated_at', cutoff)
        .order('generated_at', { ascending: false });

      if (!recentGens || recentGens.length === 0) return [];

      const brandMap: Record<string, { name: string; latest: string | null }> = {};
      for (const g of recentGens) {
        if (!brandMap[g.brand_id]) {
          brandMap[g.brand_id] = {
            name: (g as any).brands?.name || 'Marca',
            latest: g.generated_at,
          };
        }
      }

      return Object.entries(brandMap).map(([brandId, info]) => ({
        brandId,
        brandName: info.name,
        active: recentGens.filter(g => g.brand_id === brandId).length,
        max: PLAN_LIMITS.DEFAULT.maxConcurrent,
        lastActivity: info.latest,
      })).sort((a, b) => b.active - a.active).slice(0, 20);
    }

    try {
      let cursor = '0';
      const keys: string[] = [];
      const pattern = 'generation:concurrency:*';

      // Collect all matching keys via SCAN
      do {
        const [nextCursor, batch] = await Promise.race([
          redis.scan(cursor, 'MATCH', pattern, 'COUNT', 100),
          new Promise<['0', string[]]>((_, reject) => setTimeout(() => reject(new Error('scan timeout')), 3000)),
        ]) as [string, string[]];
        cursor = nextCursor;
        keys.push(...batch);
      } while (cursor !== '0');

      if (keys.length === 0) return [];

      // Extract brand IDs from keys
      const brandIds = keys.map(key => {
        const parts = key.split(':');
        return parts[parts.length - 1];
      }).filter(Boolean);

      // Get brand names from Supabase
      const { data: brands } = await supabaseAdmin
        .from('brands')
        .select('id, name')
        .in('id', brandIds.slice(0, 50));

      // Get active counts via pipeline
      const pipeline = redis.pipeline();
      keys.forEach(key => pipeline.get(key));
      const countResults = await Promise.race([
        pipeline.exec(),
        new Promise<null>((_, reject) => setTimeout(() => reject(new Error('pipeline timeout')), 2000)),
      ]) as any[][];

      // Get last generation timestamps per brand (from recent generations)
      const recentCutoff = new Date(Date.now() - 30 * 60 * 1000).toISOString();
      const { data: recentGens } = await supabaseAdmin
        .from('generations')
        .select('brand_id, generated_at')
        .in('brand_id', brandIds.slice(0, 50))
        .gte('generated_at', recentCutoff)
        .order('generated_at', { ascending: false });

      const brandNameMap: Record<string, string> = {};
      if (brands) brands.forEach((b: any) => { brandNameMap[b.id] = b.name; });

      const lastGenMap: Record<string, string> = {};
      if (recentGens) {
        recentGens.forEach((g: any) => {
          if (!lastGenMap[g.brand_id]) lastGenMap[g.brand_id] = g.generated_at;
        });
      }

      const result: Array<{
        brandId: string;
        brandName: string;
        active: number;
        max: number;
        lastActivity: string | null;
      }> = [];

      for (let i = 0; i < keys.length; i++) {
        const brandId = brandIds[i];
        const countArr = countResults?.[i];
        const active = countArr && !countArr[0] ? parseInt(String(countArr[1] || '0'), 10) : 0;

        result.push({
          brandId,
          brandName: brandNameMap[brandId] || 'Marca desconocida',
          active,
          max: PLAN_LIMITS.DEFAULT.maxConcurrent,
          lastActivity: lastGenMap[brandId] || null,
        });
      }

      return result.sort((a, b) => b.active - a.active).slice(0, 20);
    } catch (err) {
      console.error('[Concurrency] getBrandsWithActiveGenerations error:', err);
      return [];
    }
  }

  /**
   * Get activity history for the last N hours.
   * Reads from a Redis sorted set keyed by hour buckets.
   * Falls back to empty array if Redis unavailable.
   */
  async getActivityHistory(hours: number): Promise<Array<{ hour: string; count: number }>> {
    if (!redis.status || redis.status === 'wait') return [];

    const history: Array<{ hour: string; count: number }> = [];
    try {
      for (let i = hours - 1; i >= 0; i--) {
        const d = new Date();
        d.setHours(d.getHours() - i, 0, 0, 0);
        const key = `generation:history:${d.toISOString().slice(0, 13)}`;
        const count = await redis.get(key);
        history.push({ hour: d.toISOString().slice(0, 13), count: parseInt(count || '0', 10) });
      }
      return history;
    } catch {
      return [];
    }
  }
}

export const generationConcurrencyService = new GenerationConcurrencyService();