// Lookitry Mission Control - Agents API
// v1.0 | Abril 2026

import { NextResponse } from 'next/server';
import { MOCK_AGENTS } from '@/lib/mission-control/constants';

export async function GET() {
  // In production, this would fetch from database/Supabase
  // For now, return mock data
  
  const response = {
    agents: MOCK_AGENTS,
    lastUpdated: new Date().toISOString(),
  };

  return NextResponse.json(response, {
    status: 200,
    headers: {
      'Cache-Control': 'no-store',
    },
  });
}