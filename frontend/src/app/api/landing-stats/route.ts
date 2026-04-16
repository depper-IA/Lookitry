import { NextResponse } from 'next/server';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY!;

export async function GET() {
  try {
    // Count ALL brands (no status filter) — suspended brands still count so the number never decreases
    const brandsRes = await fetch(
      `${SUPABASE_URL}/rest/v1/brands?select=id`,
      {
        headers: {
          apikey: SUPABASE_SERVICE_KEY,
          Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`,
        },
        next: { revalidate: 3600 }, // Cache for 1 hour
      }
    );

    if (!brandsRes.ok) throw new Error(`Brands count failed: ${brandsRes.status}`);
    const brandsData = await brandsRes.json();
    const brandsCount = Array.isArray(brandsData) ? brandsData.length : 0;

    // Count total generations
    const generationsRes = await fetch(
      `${SUPABASE_URL}/rest/v1/generations?select=id`,
      {
        headers: {
          apikey: SUPABASE_SERVICE_KEY,
          Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`,
        },
        next: { revalidate: 3600 },
      }
    );

    if (!generationsRes.ok) throw new Error(`Generations count failed: ${generationsRes.status}`);
    const generationsData = await generationsRes.json();
    const generationsCount = Array.isArray(generationsData) ? generationsData.length : 0;

    // Get average rating from approved reviews
    const reviewsRes = await fetch(
      `${SUPABASE_URL}/rest/v1/brand_reviews?status=eq.approved&select=rating`,
      {
        headers: {
          apikey: SUPABASE_SERVICE_KEY,
          Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`,
        },
        next: { revalidate: 3600 },
      }
    );

    if (!reviewsRes.ok) throw new Error(`Reviews failed: ${reviewsRes.status}`);
    const reviewsData = await reviewsRes.json();

    const avgRating = Array.isArray(reviewsData) && reviewsData.length > 0
      ? reviewsData.reduce((sum: number, r: { rating: number }) => sum + r.rating, 0) / reviewsData.length
      : 0;

    const satisfaction = Math.round(avgRating * 10) / 10;

    return NextResponse.json({
      total_brands: brandsCount,
      total_generations: generationsCount,
      satisfaction_rating: satisfaction,
      reviews_count: Array.isArray(reviewsData) ? reviewsData.length : 0,
    });
  } catch (error: any) {
    console.error('Error fetching landing stats:', error);
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Error al obtener las estadisticas.' },
      { status: 500 }
    );
  }
}
