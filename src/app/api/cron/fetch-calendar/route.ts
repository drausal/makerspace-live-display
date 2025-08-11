// app/api/cron/fetch-calendar/route.ts
import { NextResponse } from 'next/server';
import { CalendarFetcher } from '@/lib/calendar-fetcher';
import { EventValidator } from '@/lib/event-validator';
import { AgeGroupDetector } from '@/lib/age-group-detector';
import { KVStorage } from '@/lib/kv-storage';

export async function GET() {
  const startTime = Date.now();
  console.log('🚀 Calendar fetch cron job triggered');
  
  const storage = new KVStorage();
  const fetcher = new CalendarFetcher();
  const validator = new EventValidator();
  const ageGroupDetector = new AgeGroupDetector();
  
  try {
    // Fetch events from calendar
    const rawEvents = await fetcher.fetchEvents();
    console.log(`📅 Fetched ${rawEvents.length} raw events`);
    
    // Validate and process events
    const validatedEvents = await validator.validateEvents(rawEvents);
    console.log(`✅ Validated ${validatedEvents.length} events`);
    
    // Process age groups
    const processedEvents = validatedEvents.map(event => ({
      ...event,
      ageGroup: ageGroupDetector.detectAgeGroup(event.title, event.description || '')
    }));
    
    // Generate age group statistics
    const ageGroupStats = processedEvents.reduce((stats, event) => {
      stats[event.ageGroup] = (stats[event.ageGroup] || 0) + 1;
      return stats;
    }, {} as Record<string, number>);
    
    // Store processed data
    await storage.storeEvents(processedEvents);
    await storage.storeAgeGroupStats(ageGroupStats);
    await storage.storeFetchResult({
      success: true,
      lastFetch: new Date().toISOString(),
      eventCount: processedEvents.length,
      errors: []
    });
    
    const duration = Date.now() - startTime;
    console.log(`✅ Calendar fetch completed in ${duration}ms`);
    
    return NextResponse.json({
      success: true,
      eventsProcessed: processedEvents.length,
      ageGroupBreakdown: ageGroupStats,
      duration: `${duration}ms`,
      timestamp: new Date().toISOString(),
      message: 'Calendar events fetched and processed successfully'
    });
    
  } catch (error) {
    const duration = Date.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('❌ Calendar fetch failed:', errorMessage);
    
    // Store error result
    await storage.storeFetchResult({
      success: false,
      lastFetch: new Date().toISOString(),
      eventCount: 0,
      errors: [errorMessage]
    });
    
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch calendar events',
      message: errorMessage,
      duration: `${duration}ms`,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}
