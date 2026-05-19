import { NextResponse } from 'next/server';

export async function POST() {
  return NextResponse.json({ error: 'SVG generation not available' }, { status: 501 });
}
