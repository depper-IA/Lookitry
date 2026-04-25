import { Router } from 'express';
import { supabaseAdmin } from '../config/supabase';
import { redis } from '../config/redis';

const CACHE_KEY = 'landing_stats';
const CACHE_TTL = 15 * 60; // 15 minutes

const router = Router();

router.get('/', async (_req, res) => {
  try {
    // Try cache first
    if (redis) {
      const cached = await redis.get(CACHE_KEY);
      if (cached) {
        return res.status(200).json(JSON.parse(cached));
      }
    }

    // Count brands with ACTIVE subscription status only
    const { count: brandsCount, error: brandsError } = await supabaseAdmin
      .from('brands')
      .select('id', { count: 'exact', head: true })
      .in('subscription_status', ['active', 'expiring_soon', 'trial']);

    if (brandsError) {
      console.error('[LandingStats] Brands Error:', brandsError);
      throw brandsError;
    }

    // Count successful generations only
    const { count: generationsCount, error: generationsError } = await supabaseAdmin
      .from('generations')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'SUCCESS');

    if (generationsError) {
      console.error('[LandingStats] Generations Error:', generationsError);
      throw generationsError;
    }

    // Calculate average rating from approved brand_reviews
    const { data: reviewsData, error: reviewsError } = await supabaseAdmin
      .from('brand_reviews')
      .select('rating')
      .eq('status', 'approved');

    if (reviewsError) {
      console.error('[LandingStats] Reviews Error:', reviewsError);
      throw reviewsError;
    }

    let avgRating = 0;
    let reviewsCount = 0;
    if (reviewsData && reviewsData.length > 0) {
      const sum = reviewsData.reduce((acc, r) => acc + (Number(r.rating) || 0), 0);
      avgRating = sum / reviewsData.length;
      reviewsCount = reviewsData.length;
    }

    // Round to 1 decimal
    const satisfaction = Math.round(avgRating * 10) / 10;

    const result = {
      total_brands: brandsCount ?? 0,
      total_generations: generationsCount ?? 0,
      satisfaction_rating: satisfaction || null, // null if no reviews (no fake fallback)
      reviews_count: reviewsCount,
    };

    // Cache result
    if (redis) {
      await redis.setex(CACHE_KEY, CACHE_TTL, JSON.stringify(result));
    }

    return res.status(200).json(result);
  } catch (error: any) {
    console.error('CRITICAL: Error fetching landing stats:', error);
    return res.status(500).json({
      error: 'INTERNAL_ERROR',
      message: 'Error al obtener las estadísticas.',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

export default router;
