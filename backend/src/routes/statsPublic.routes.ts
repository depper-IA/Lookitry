import { Router } from 'express';
import { supabaseAdmin } from '../config/supabase';
import { redis } from '../config/redis';

const CACHE_KEY = 'stats_public';
const CACHE_TTL = 15 * 60; // 15 minutes

const router = Router();

router.get('/', async (_req, res) => {
  try {
    // Try cache first (graceful Redis fallback)
    let cached: string | null = null;
    if (redis) {
      try {
        cached = await redis.get(CACHE_KEY);
      } catch (redisError) {
        console.warn('[StatsPublic] Redis get failed, proceeding without cache:', redisError instanceof Error ? redisError.message : redisError);
      }
    }
    if (cached) {
      return res.status(200).json(JSON.parse(cached));
    }

    // Count brands with ACTIVE subscription status only
    const { count: brandsCount, error: brandsError } = await supabaseAdmin
      .from('brands')
      .select('id', { count: 'exact', head: true })
      .in('subscription_status', ['active', 'expiring_soon', 'trial']);

    if (brandsError) {
      console.error('[StatsPublic] Brands Error:', brandsError);
      throw brandsError;
    }

    // Count successful generations only
    const { count: generationsCount, error: generationsError } = await supabaseAdmin
      .from('generations')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'SUCCESS');

    if (generationsError) {
      console.error('[StatsPublic] Generations Error:', generationsError);
      throw generationsError;
    }

    const result = {
      brandsCount: brandsCount ?? 0,
      generationsCount: generationsCount ?? 0,
      responseTimeHours: 24,
      lastUpdated: new Date().toISOString(),
    };

    // Cache result (graceful Redis fallback)
    if (redis) {
      try {
        await redis.setex(CACHE_KEY, CACHE_TTL, JSON.stringify(result));
      } catch (redisError) {
        console.warn('[StatsPublic] Redis setex failed, stats served without cache:', redisError instanceof Error ? redisError.message : redisError);
      }
    }

    return res.status(200).json(result);
  } catch (error: any) {
    console.error('CRITICAL: Error fetching public stats:', error);
    return res.status(500).json({
      error: 'INTERNAL_ERROR',
      message: 'Error al obtener las estadísticas.',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

export default router;