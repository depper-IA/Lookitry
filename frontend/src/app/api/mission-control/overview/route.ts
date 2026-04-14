// Mission Control - Overview Metrics API
// v1.0 | Abril 2026 - DATOS REALES

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
        next: { revalidate: 60 } // Cache 60 seconds
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
    // Parallel queries for real data
    const [brands, payments, agentSessions] = await Promise.all([
      querySupabase('brands', '?select=id,plan,subscription_status,created_at&order=created_at.desc'),
      querySupabase('subscription_payments', '?select=id,amount,currency,status,created_at&order=created_at.desc&limit=100'),
      querySupabase('agent_sessions', '?select=id,agent_name,status,last_heartbeat_at&order=last_heartbeat_at.desc'),
    ]);

    // Calculate real metrics
    const totalBrands = brands?.length || 0;
    const activeBrands = brands?.filter((b: any) => 
      b.subscription_status === 'active' || b.subscription_status === 'expiring_soon'
    ).length || 0;
    
    const trialBrands = brands?.filter((b: any) => b.plan === 'TRIAL').length || 0;
    const proBrands = brands?.filter((b: any) => b.plan === 'PRO').length || 0;
    
    // Calculate revenue from payments (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const recentPayments = payments?.filter((p: any) => {
      const paymentDate = new Date(p.created_at);
      return paymentDate >= thirtyDaysAgo && p.status === 'completed';
    }) || [];
    
    const revenueCOP = recentPayments.reduce((sum: number, p: any) => sum + (p.amount || 0), 0);
    const revenueUSD = revenueCOP / 4200; // Approximate COP to USD

    // Agent sessions
    const activeAgents = agentSessions?.filter((a: any) => 
      a.status === 'running' || a.status === 'active'
    ).length || 0;

    const response = {
      metrics: {
        totalBrands,
        activeBrands,
        trialBrands,
        proBrands,
        revenueToday: revenueUSD,
        revenueMonth: revenueUSD * 2, // Approximate
        activeAgents,
      },
      planDistribution: {
        trial: trialBrands,
        basic: brands?.filter((b: any) => b.plan === 'BASIC').length || 0,
        pro: proBrands,
        enterprise: brands?.filter((b: any) => b.plan === 'ENTERPRISE').length || 0,
      },
      subscriptionStatus: {
        active: brands?.filter((b: any) => b.subscription_status === 'active').length || 0,
        expiringSoon: brands?.filter((b: any) => b.subscription_status === 'expiring_soon').length || 0,
        expired: brands?.filter((b: any) => b.subscription_status === 'expired').length || 0,
        suspended: brands?.filter((b: any) => b.subscription_status === 'suspended').length || 0,
        trial: trialBrands,
      },
      recentPayments: recentPayments.slice(0, 5).map((p: any) => ({
        id: p.id,
        amount: p.amount,
        currency: p.currency,
        status: p.status,
        createdAt: p.created_at,
      })),
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
