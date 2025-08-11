// lib/kv-storage.ts - KV Storage wrapper for caching calendar data
import { ProcessedEvent, CalendarFetchResult, SystemHealth } from '@/shared/types';
import { KVStorageMock } from './kv-storage-mock';
import { kv as vercelKv, VercelKV } from '@vercel/kv';

let kv: VercelKV | null = null;
let usingMock = false;

if (process.env.KV_URL && process.env.KV_REST_API_URL) {
  kv = vercelKv;
} else {
  console.log('⚠️  KV credentials not found - using mock storage for local development');
  usingMock = true;
}

const mockStorage = new KVStorageMock();

export class KVStorage {
  // Store calendar events with TTL
  async storeEvents(events: ProcessedEvent[]): Promise<void> {
    if (usingMock || !kv) {
      return mockStorage.storeEvents(events);
    }
    
    const ttl = 60 * 20; // 20 minutes TTL
    await kv.setex('calendar:events', ttl, JSON.stringify(events));
    await kv.set('calendar:lastUpdate', new Date().toISOString());
    await kv.set('calendar:eventCount', events.length);
    
    console.log(`📦 Stored ${events.length} events in KV with ${ttl}s TTL`);
  }

  // Retrieve stored events
  async getEvents(): Promise<ProcessedEvent[]> {
    if (usingMock || !kv) {
      return mockStorage.getEvents();
    }
    
    const eventsJson = await kv.get('calendar:events');
    if (!eventsJson) {
      console.log('📦 No events found in KV storage');
      return [];
    }
    
    try {
      const events = JSON.parse(eventsJson as string);
      console.log(`📦 Retrieved ${events.length} events from KV`);
      return events;
    } catch (error) {
      console.error('📦 Error parsing stored events:', error);
      return [];
    }
  }

  // Store fetch results and errors for debugging
  async storeFetchResult(result: CalendarFetchResult): Promise<void> {
    if (usingMock || !kv) {
      return mockStorage.storeFetchResult(result);
    }
    
    await kv.set('calendar:lastFetchResult', JSON.stringify(result));
    
    if (!result.success) {
      // Store errors for debugging
      const errors = await this.getRecentErrors();
      errors.unshift({
        timestamp: result.lastFetch,
        errors: result.errors
      });
      
      // Keep only last 10 errors
      await kv.set('calendar:recentErrors', JSON.stringify(errors.slice(0, 10)));
      console.log(`🚨 Stored fetch errors: ${result.errors.join(', ')}`);
    }
  }

  // Admin time override storage
  async setTimeOverride(mockTime: string | null): Promise<void> {
    if (usingMock || !kv) {
      return mockStorage.setTimeOverride(mockTime);
    }
    
    if (mockTime) {
      await kv.set('admin:mockTime', mockTime);
      console.log(`⏰ Time override set: ${mockTime}`);
    } else {
      await kv.del('admin:mockTime');
      console.log(`⏰ Time override cleared`);
    }
  }

  async getTimeOverride(): Promise<string | null> {
    if (usingMock || !kv) {
      return mockStorage.getTimeOverride();
    }
    
    const mockTime = await kv.get('admin:mockTime') as string | null;
    if (mockTime) {
      console.log(`⏰ Active time override: ${mockTime}`);
    }
    return mockTime;
  }

  // Store age group statistics
  async storeAgeGroupStats(stats: Record<string, number>): Promise<void> {
    if (usingMock || !kv) {
      return mockStorage.storeAgeGroupStats(stats);
    }
    
    await kv.set('calendar:ageGroupStats', JSON.stringify(stats));
    console.log('📊 Stored age group statistics:', stats);
  }

  async getAgeGroupStats(): Promise<Record<string, number>> {
    if (usingMock || !kv) {
      return mockStorage.getAgeGroupStats();
    }
    
    const stats = await kv.get('calendar:ageGroupStats');
    return stats ? JSON.parse(stats as string) : {};
  }

  // Health monitoring data
  async getSystemHealth(): Promise<SystemHealth> {
    if (usingMock || !kv) {
      return mockStorage.getSystemHealth();
    }
    
    const [lastUpdate, eventCount, recentErrors, ageGroupStats] = await Promise.all([
      kv.get('calendar:lastUpdate'),
      kv.get('calendar:eventCount'),
      this.getRecentErrors(),
      this.getAgeGroupStats()
    ]);

    return {
      calendar: {
        lastFetch: (lastUpdate as string) || 'Never',
        eventCount: (eventCount as number) || 0,
        errors: recentErrors.flatMap(e => e.errors)
      },
      processing: {
        totalEvents: (eventCount as number) || 0,
        validEvents: (eventCount as number) || 0,
        ageGroupBreakdown: ageGroupStats
      },
      uptime: process.uptime().toString()
    };
  }

  private async getRecentErrors(): Promise<Array<{timestamp: string, errors: string[]}>> {
    if (usingMock || !kv) {
      return [];
    }
    
    const errors = await kv.get('calendar:recentErrors');
    return errors ? JSON.parse(errors as string) : [];
  }
}
