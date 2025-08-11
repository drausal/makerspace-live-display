// lib/kv-storage-mock.ts - Mock KV storage for local development
import { ProcessedEvent, CalendarFetchResult, SystemHealth } from '@/shared/types';

// In-memory storage for local development
const mockStorage: Record<string, unknown> = {};

export class KVStorageMock {
  async storeEvents(events: ProcessedEvent[]): Promise<void> {
    mockStorage['calendar:events'] = JSON.stringify(events);
    mockStorage['calendar:lastUpdate'] = new Date().toISOString();
    mockStorage['calendar:eventCount'] = events.length;
    
    console.log(`📦 [MOCK] Stored ${events.length} events in mock storage`);
  }

  async getEvents(): Promise<ProcessedEvent[]> {
    const eventsJson = mockStorage['calendar:events'];
    if (!eventsJson) {
      console.log('📦 [MOCK] No events found in mock storage');
      return [];
    }
    
    try {
      const events = JSON.parse(eventsJson as string);
      console.log(`📦 [MOCK] Retrieved ${events.length} events from mock storage`);
      return events;
    } catch (error) {
      console.error('📦 [MOCK] Error parsing stored events:', error);
      return [];
    }
  }

  async storeFetchResult(result: CalendarFetchResult): Promise<void> {
    mockStorage['calendar:lastFetchResult'] = JSON.stringify(result);
    
    if (!result.success) {
      const errors = await this.getRecentErrors();
      errors.unshift({
        timestamp: result.lastFetch,
        errors: result.errors
      });
      
      mockStorage['calendar:recentErrors'] = JSON.stringify(errors.slice(0, 10));
      console.log(`🚨 [MOCK] Stored fetch errors: ${result.errors.join(', ')}`);
    }
  }

  async setTimeOverride(mockTime: string | null): Promise<void> {
    if (mockTime) {
      mockStorage['admin:mockTime'] = mockTime;
      console.log(`⏰ [MOCK] Time override set: ${mockTime}`);
    } else {
      delete mockStorage['admin:mockTime'];
      console.log(`⏰ [MOCK] Time override cleared`);
    }
  }

  async getTimeOverride(): Promise<string | null> {
    const mockTime = mockStorage['admin:mockTime'] as string | null;
    if (mockTime) {
      console.log(`⏰ [MOCK] Active time override: ${mockTime}`);
    }
    return mockTime || null;
  }

  async storeAgeGroupStats(stats: Record<string, number>): Promise<void> {
    mockStorage['calendar:ageGroupStats'] = JSON.stringify(stats);
    console.log('📊 [MOCK] Stored age group statistics:', stats);
  }

  async getAgeGroupStats(): Promise<Record<string, number>> {
    const stats = mockStorage['calendar:ageGroupStats'];
    return stats ? JSON.parse(stats as string) : {};
  }

  async getSystemHealth(): Promise<SystemHealth> {
    const lastUpdate = mockStorage['calendar:lastUpdate'];
    const eventCount = mockStorage['calendar:eventCount'];
    const recentErrors = await this.getRecentErrors();
    const ageGroupStats = await this.getAgeGroupStats();

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
    const errors = mockStorage['calendar:recentErrors'];
    return errors ? JSON.parse(errors as string) : [];
  }
}