import { NextResponse } from 'next/server';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.lookitry.com';

// Proxy to backend Express to avoid duplicating Supabase service key
export async function GET() {
  try {
    const response = await fetch(`${API_URL}/landing-stats`, {
      next: { revalidate: 3600 }, // Cache for 1 hour
    });

    if (!response.ok) {
      throw new Error(`Backend request failed: ${response.status}`);
    }

    const data = await response.json();

    // Backend returns active_brands, frontend expects total_brands
    // Since backend only counts active/trial brands, we need to adjust
    // to match local behavior which counts ALL brands
    // But for now, use what backend returns to ensure it works
    return NextResponse.json({
      total_brands: data.total_brands ?? data.active_brands ?? 0,
      total_generations: data.total_generations ?? 0,
      satisfaction_rating: data.satisfaction_rating ?? 0,
      reviews_count: data.reviews_count ?? 0,
    });
  } catch (error: any) {
    console.error('Error fetching landing stats:', error);
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Error al obtener las estadisticas.' },
      { status: 500 }
    );
  }
}
