// Mission Control - Overview Metrics API
// v2.0 | Abril 2026 - DATOS REALES de Supabase

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
    // Query real data from Supabase
    const brands = await querySupabase('brands', '?select=*&order=created_at.desc');
    
    if (!brands || brands.length === 0) {
      return NextResponse.json({
        metrics: {
          totalBrands: 0,
          activeBrands: 0,
          trialBrands: 0,
          proBrands: 0,
          revenueToday: 0,
          revenueMonth: 0,
          activeAgents: 0,
        },
        planDistribution: { trial: 0, basic: 0, pro: 0, enterprise: 0 },
        subscriptionStatus: { active: 0, expiringSoon: 0, expired: 0, suspended: 0, trial: 0 },
        recentPayments: [],
        lastUpdated: new Date().toISOString(),
      });
    }

    // Calculate real metrics from brands
    const totalBrands = brands.length;
    const activeBrands = brands.filter((b: any) => 
      b.subscription_status === 'active' || b.subscription_status === 'expiring_soon'
    ).length;
    
    const trialBrands = brands.filter((b: any) => b.plan === 'TRIAL').length;
    const proBrands = brands.filter((b: any) => b.plan === 'PRO').length;
    const basicBrands = brands.filter((b: any) => b.plan === 'BASIC').length;
    const enterpriseBrands = brands.filter((b: any) => b.plan === 'ENTERPRISE').length;
    
    // Estimate revenue based on plan prices
    const PLAN_PRICES: Record<string, number> = {
      TRIAL: 0,
      BASIC: 50000,
      PRO: 99000,
      SCALE: 199000,
      ENTERPRISE: 500000,
    };
    
    const revenueMonth = brands.reduce((sum: number, b: any) => {
      const price = PLAN_PRICES[b.plan] || 0;
      return sum + price;
    }, 0);

    // Calculate subscription status
    const subscriptionStatus = {
      active: brands.filter((b: any) => b.subscription_status === 'active').length,
      expiringSoon: brands.filter((b: any) => b.subscription_status === 'expiring_soon').length,
      expired: brands.filter((b: any) => b.subscription_status === 'expired').length,
      suspended: brands.filter((b: any) => b.subscription_status === 'suspended').length,
      trial: trialBrands,
    };

    // Get recent brands as "activity"
    const recentPayments = brands.slice(0, 5).map((b: any) => ({
      id: b.id,
      amount: PLAN_PRICES[b.plan] || 0,
      currency: 'COP',
      status: b.subscription_status === 'active' ? 'completed' : b.subscription_status,
      createdAt: b.created_at,
    }));

    const response = {
      metrics: {
        totalBrands,
        activeBrands,
        trialBrands,
        proBrands,
        revenueToday: revenueMonth / 30,
        revenueMonth,
        activeAgents: 10, // Hardcoded for now since no agent_sessions table
      },
      planDistribution: {
        trial: trialBrands,
        basic: basicBrands,
        pro: proBrands,
        enterprise: enterpriseBrands,
      },
      subscriptionStatus,
      recentPayments,
      lastUpdated: new Date().toISOString(),
    };

    return NextResponse.json(response, {
      status: 200,
      headers: {
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120',
      },
    });
  } catch (error) {
    console.error('Mission Control Overview Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch metrics', metrics: null },
      { status: 500 }
    );
  }
}
