// app/api/cache/stats/route.ts
import { NextResponse } from 'next/server';
import { calendarCache } from '@/lib/calendar-cache';

export const dynamic = 'force-dynamic';

export async function GET() {
  const stats = calendarCache.getStats();
  
  return NextResponse.json({
    success: true,
    cache: stats,
    timestamp: new Date().toISOString()
  });
}

// Optional: POST endpoint to manually clear cache
export async function POST() {
  calendarCache.clear();
  
  return NextResponse.json({
    success: true,
    message: 'Cache cleared successfully',
    timestamp: new Date().toISOString()
  });
}
