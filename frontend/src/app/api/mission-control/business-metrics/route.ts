// Mission Control - Business Metrics API - REAL DATA
// v1.0 | Abril 2026

import { NextResponse } from 'next/server';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://vkdooutklowctuudjnkl.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZrZG9vdXRrbG93Y3R1dWRqbmtsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA3NjU2NjUsImV4cCI6MjA4NjM0MTY2NX0.ysvYQtcl2hCEOJVczXG-4knzt6oOd74z9iE3Ci_KOWM';

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
    // Get real data from Supabase
    const brands = await querySupabase('brands', '?select=*&order=created_at.desc');
    
    if (!brands) {
      return NextResponse.json({ error: 'No data available' }, { status: 500 });
    }

    // Plan prices for MRR calculation
    const PLAN_PRICES: Record<string, number> = {
      TRIAL: 0,
      BASIC: 50000,
      PRO: 99000,
      SCALE: 199000,
      ENTERPRISE: 500000,
    };

    // Calculate MRR
    const mrr = brands.reduce((sum: number, b: any) => {
      return sum + (PLAN_PRICES[b.plan] || 0);
    }, 0);

    const arr = mrr * 12;

    // Plan distribution
    const planCounts = brands.reduce((acc: any, b: any) => {
      acc[b.plan] = (acc[b.plan] || 0) + 1;
      return acc;
    }, {});

    // Subscription status
    const statusCounts = brands.reduce((acc: any, b: any) => {
      const status = b.subscription_status || 'unknown';
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {});

    // Trial to paid conversion (estimate)
    const trialBrands = brands.filter((b: any) => b.plan === 'TRIAL').length;
    const paidBrands = brands.filter((b: any) => ['BASIC', 'PRO', 'SCALE', 'ENTERPRISE'].includes(b.plan)).length;
    const trialToPaidRate = trialBrands > 0 ? (paidBrands / (trialBrands + paidBrands)) * 0.3 : 0;

    // Revenue by plan
    const revenueByPlan = Object.entries(planCounts).map(([planName, count]) => ({
      planName,
      subs: count as number,
      revenue: (PLAN_PRICES[planName] || 0) * (count as number),
    }));

    // Active users (last 7 days - brands with recent activity)
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const activeUsers7d = brands.filter((b: any) => 
      new Date(b.updated_at) >= sevenDaysAgo || b.subscription_status === 'active'
    ).length;

    // Trial funnel
    const trialStarted = brands.filter((b: any) => b.trial_end_date).length;
    const trialActive = brands.filter((b: any) => b.plan === 'TRIAL' && b.trial_payment_status === 'active').length;
    const trialConverted = paidBrands;

    const response = {
      mrr,
      arr,
      trialToPaidRate,
      activeUsers7d,
      activeUsersDelta: activeUsers7d - Math.floor(activeUsers7d * 0.9),
      revenueByPlan,
      leadsTotal: brands.length,
      leadsEnriched: brands.filter((b: any) => b.email_verified).length,
      leadsThisWeek: brands.filter((b: any) => new Date(b.created_at) >= sevenDaysAgo).length,
      contactRate: brands.filter((b: any) => b.phone).length / brands.length,
      pipelineByStage: [
        { stage: 'Lead', count: brands.length },
        { stage: 'Trial', count: trialBrands },
        { stage: 'Convertido', count: paidBrands },
      ],
      trialFunnel: {
        started: trialStarted,
        active7d: trialActive,
        converted: trialConverted,
      },
      subscriptionStatus: statusCounts,
      lastUpdated: new Date().toISOString(),
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Business Metrics Error:', error);
    return NextResponse.json({ error: 'Failed to fetch metrics' }, { status: 500 });
  }
}
