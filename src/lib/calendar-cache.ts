// lib/calendar-cache.ts - Server-side cache for calendar data
import { ProcessedEvent } from '@/shared/types';
import { Logger } from './logger';

interface CacheEntry {
  events: ProcessedEvent[];
  timestamp: number;
  expiresAt: number;
}

/**
 * Server-side in-memory cache for calendar data
 * Reduces Google Calendar API calls from every 30 seconds to every 30 minutes
 */
class CalendarCache {
  private cache: CacheEntry | null = null;
  private readonly CACHE_TTL = 30 * 60 * 1000; // 30 minutes in milliseconds

  /**
   * Store events in cache with 30-minute expiration
   */
  set(events: ProcessedEvent[]): void {
    const now = Date.now();
    this.cache = {
      events,
      timestamp: now,
      expiresAt: now + this.CACHE_TTL
    };
    
    Logger.info('CalendarCache', `Cached ${events.length} events, expires at ${new Date(this.cache.expiresAt).toISOString()}`);
  }

  /**
   * Retrieve events from cache if still valid
   * Returns null if cache is empty or expired
   */
  get(): ProcessedEvent[] | null {
    if (!this.cache) {
      Logger.debug('CalendarCache', 'Cache miss: no cached data');
      return null;
    }

    const now = Date.now();
    if (now >= this.cache.expiresAt) {
      Logger.info('CalendarCache', 'Cache expired, will fetch fresh data');
      this.cache = null;
      return null;
    }

    const timeRemaining = Math.floor((this.cache.expiresAt - now) / 1000 / 60);
    Logger.debug('CalendarCache', `Cache hit: returning ${this.cache.events.length} events (${timeRemaining} min remaining)`);
    
    return this.cache.events;
  }

  /**
   * Check if cache is valid without retrieving data
   */
  isValid(): boolean {
    if (!this.cache) return false;
    return Date.now() < this.cache.expiresAt;
  }

  /**
   * Get cache statistics for debugging
   */
  getStats(): {
    isCached: boolean;
    eventCount: number;
    cachedAt: string | null;
    expiresAt: string | null;
    timeRemaining: string | null;
  } {
    if (!this.cache) {
      return {
        isCached: false,
        eventCount: 0,
        cachedAt: null,
        expiresAt: null,
        timeRemaining: null
      };
    }

    const now = Date.now();
    const isExpired = now >= this.cache.expiresAt;
    const minutesRemaining = Math.floor((this.cache.expiresAt - now) / 1000 / 60);

    return {
      isCached: !isExpired,
      eventCount: this.cache.events.length,
      cachedAt: new Date(this.cache.timestamp).toISOString(),
      expiresAt: new Date(this.cache.expiresAt).toISOString(),
      timeRemaining: isExpired ? 'expired' : `${minutesRemaining} minutes`
    };
  }

  /**
   * Manually clear the cache (useful for testing or admin operations)
   */
  clear(): void {
    Logger.info('CalendarCache', 'Cache manually cleared');
    this.cache = null;
  }
}

// Export singleton instance
export const calendarCache = new CalendarCache();
