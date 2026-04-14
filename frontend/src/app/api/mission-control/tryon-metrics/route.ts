// Lookitry Mission Control - Try-On Metrics API
// v1.0 | Abril 2026

import { NextResponse } from 'next/server';
import { MOCK_TRYON_METRICS } from '@/lib/mission-control/constants';

export async function GET() {
  // In production, this would fetch real metrics from database
  // For now, return mock data
  
  const response = {
    ...MOCK_TRYON_METRICS,
    lastUpdated: new Date().toISOString(),
  };

  return NextResponse.json(response, {
    status: 200,
    headers: {
      'Cache-Control': 'no-store',
    },
  });
}