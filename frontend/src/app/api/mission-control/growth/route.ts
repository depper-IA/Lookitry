// Mission Control - Growth Metrics API - REAL DATA
// v1.0 | Abril 2026

import { NextResponse } from 'next/server';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://vkdooutklowctuudjnkl.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY || '***REMOVED-SECRET***';

async function querySupabase(table: string, params: string = '') {
  try {
    const response = await fetch(
      `${SUPABASE_URL}/rest/v1/${table}${params}`,
      {
        headers: {
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${SUPABASE_KEY}`,
        },
        next: { revalidate: 60 }
      }
    );
    if (!response.ok) return null;
    return await response.json();
  } catch {
    return null;
  }
}

export async function GET() {
  try {
    const brands = await querySupabase('brands', '?select=*&order=created_at.desc');
    const referrals = await querySupabase('referrals', '?select=*&order=created_at.desc');
    
    if (!brands) {
      return NextResponse.json({ error: 'No data available' }, { status: 500 });
    }

    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    // Leads metrics
    const totalLeads = brands.length;
    const emailVerified = brands.filter((b: any) => b.email_verified).length;
    const newLeadsThisWeek = brands.filter((b: any) => new Date(b.created_at) >= sevenDaysAgo).length;
    const newLeadsThisMonth = brands.filter((b: any) => new Date(b.created_at) >= thirtyDaysAgo).length;

    // Contact rate (brands with phone)
    const withPhone = brands.filter((b: any) => b.phone).length;
    const contactRate = totalLeads > 0 ? withPhone / totalLeads : 0;

    // Referral stats
    const referralCount = brands.reduce((sum: number, b: any) => sum + (b.referral_count || 0), 0);
    const referralsUsed = brands.filter((b: any) => b.referral_count > 0).length;

    // Social links (brands with social media)
    const withInstagram = brands.filter((b: any) => b.social_links?.instagram).length;
    const withSocial = brands.filter((b: any) => Object.keys(b.social_links || {}).length > 0).length;

    // Trial metrics
    const trialBrands = brands.filter((b: any) => b.plan === 'TRIAL');
    const activeTrials = trialBrands.filter((b: any) => b.trial_payment_status === 'active').length;
    const expiredTrials = trialBrands.filter((b: any) => {
      if (!b.trial_end_date) return false;
      return new Date(b.trial_end_date) < new Date();
    }).length;

    // Growth rate
    const growthRate = newLeadsThisWeek > 0 ? ((newLeadsThisWeek - Math.floor(newLeadsThisMonth / 4)) / Math.max(1, Math.floor(newLeadsThisMonth / 4))) * 100 : 0;

    const response = {
      leads: {
        total: totalLeads,
        enriched: emailVerified,
        enrichedPercent: totalLeads > 0 ? emailVerified / totalLeads : 0,
        thisWeek: newLeadsThisWeek,
        thisMonth: newLeadsThisMonth,
        contactRate,
        growthRate: growthRate / 100,
      },
      referrals: {
        total: referralCount,
        used: referralsUsed,
        percent: totalLeads > 0 ? referralsUsed / totalLeads : 0,
      },
      social: {
        brandsWithInstagram: withInstagram,
        brandsWithSocial: withSocial,
        totalBrands: totalLeads,
      },
      trial: {
        active: activeTrials,
        expired: expiredTrials,
        total: trialBrands.length,
        conversionRate: trialBrands.length > 0 ? (totalLeads - trialBrands.length) / totalLeads : 0,
      },
      // Summary
      summary: {
        newBrandsWeek: newLeadsThisWeek,
        activeTrials,
        referralEngagement: referralCount > 0 ? `${referralCount} referidos` : 'Sin referidos aún',
        growth: growthRate > 0 ? `+${growthRate.toFixed(0)}%` : 'Estable',
      },
      lastUpdated: new Date().toISOString(),
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Growth Metrics Error:', error);
    return NextResponse.json({ error: 'Failed to fetch metrics' }, { status: 500 });
  }
}
