// app/api/health/route.ts
import { NextResponse } from 'next/server';
import { KVStorage } from '@/lib/kv-storage';

export async function GET() {
  const startTime = Date.now();
  
  try {
    const storage = new KVStorage();
    
    console.log('🔍 Health check requested');
    
    // Get comprehensive system health
    const health = await storage.getSystemHealth();
    
    // Add additional health metrics
    const healthReport = {
      ...health,
      timestamp: new Date().toISOString(),
      api: {
        responseTime: `${Date.now() - startTime}ms`,
        status: 'healthy'
      },
      database: {
        connected: true,
        provider: 'Vercel KV'
      }
    };
    
    console.log('✅ Health check completed:', {
      eventCount: health.calendar.eventCount,
      lastFetch: health.calendar.lastFetch,
      errors: health.calendar.errors.length
    });
    
    // Return 200 if everything looks good, 503 if there are issues
    const hasRecentData = health.calendar.lastFetch !== 'Never' && 
      new Date().getTime() - new Date(health.calendar.lastFetch).getTime() < 30 * 60 * 1000; // 30 min
    
    const status = hasRecentData && health.calendar.errors.length === 0 ? 200 : 503;
    
    return NextResponse.json(healthReport, { status });
    
  } catch (error) {
    console.error('❌ Health check failed:', error);
    
    return NextResponse.json({
      status: 'unhealthy',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
      api: {
        responseTime: `${Date.now() - startTime}ms`,
        status: 'error'
      }
    }, { status: 503 });
  }
}
