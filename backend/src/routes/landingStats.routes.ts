import { Router } from 'express';
import { supabaseAdmin } from '../config/supabase';

const router = Router();

router.get('/', async (_req, res) => {
  try {
    // Count active brands (subscription_status = 'active' or 'trial')
    const { count: brandsCount, error: brandsError } = await supabaseAdmin
      .from('brands')
      .select('id', { count: 'exact', head: true })
      .in('subscription_status', ['active', 'trial']);

    if (brandsError) throw brandsError;

    // Count total generations (all statuses)
    const { count: generationsCount, error: generationsError } = await supabaseAdmin
      .from('generations')
      .select('id', { count: 'exact', head: true });

    if (generationsError) throw generationsError;

    // Calculate average rating from approved brand_reviews
    const { data: reviewsData, error: reviewsError } = await supabaseAdmin
      .from('brand_reviews')
      .select('rating')
      .eq('status', 'approved');

    if (reviewsError) throw reviewsError;

    const avgRating = reviewsData && reviewsData.length > 0
      ? reviewsData.reduce((sum, r) => sum + r.rating, 0) / reviewsData.length
      : 0;

    // Round to 1 decimal
    const satisfaction = Math.round(avgRating * 10) / 10;

    return res.status(200).json({
      active_brands: brandsCount ?? 0,
      total_generations: generationsCount ?? 0,
      satisfaction_rating: satisfaction,
      reviews_count: reviewsData?.length ?? 0,
    });
  } catch (error: any) {
    console.error('Error fetching landing stats:', error);
    return res.status(500).json({ error: 'INTERNAL_ERROR', message: 'Error al obtener las estadísticas.' });
  }
});

export default router;
