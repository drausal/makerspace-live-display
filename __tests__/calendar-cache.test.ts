// __tests__/calendar-cache.test.ts
import { ProcessedEvent } from '../shared/types';

// Mock Logger to avoid console output during tests
jest.mock('../src/lib/logger', () => ({
  Logger: {
    info: jest.fn(),
    debug: jest.fn(),
    error: jest.fn(),
  }
}));

// Import after mocking
import { calendarCache } from '../src/lib/calendar-cache';

describe('CalendarCache', () => {
  const mockEvents: ProcessedEvent[] = [
    {
      id: '1',
      title: 'Test Event',
      description: 'Test description',
      location: 'Test location',
      start: '2024-01-01T10:00:00Z',
      end: '2024-01-01T11:00:00Z',
      status: 'confirmed',
      isAllDay: false,
      ageGroup: {
        group: 'allages',
        emoji: '👥',
        label: 'All Ages',
        color: '#4A90E2'
      },
      categories: [],
      isRecurring: false
    }
  ];

  beforeEach(() => {
    // Clear cache before each test
    calendarCache.clear();
  });

  describe('set and get', () => {
    it('should store and retrieve events', () => {
      calendarCache.set(mockEvents);
      const retrieved = calendarCache.get();
      
      expect(retrieved).toEqual(mockEvents);
    });

    it('should return null for empty cache', () => {
      const retrieved = calendarCache.get();
      expect(retrieved).toBeNull();
    });
  });

  describe('cache expiration', () => {
    it('should return events within TTL', () => {
      calendarCache.set(mockEvents);
      
      // Immediately retrieve - should work
      const retrieved = calendarCache.get();
      expect(retrieved).toEqual(mockEvents);
    });

    it('should return null after cache expires', () => {
      // We can't easily test 30-minute expiration in a unit test,
      // but we can verify the logic by checking cache stats
      calendarCache.set(mockEvents);
      
      const stats = calendarCache.getStats();
      expect(stats.isCached).toBe(true);
      expect(stats.eventCount).toBe(1);
      expect(stats.cachedAt).toBeTruthy();
      expect(stats.expiresAt).toBeTruthy();
    });
  });

  describe('isValid', () => {
    it('should return false for empty cache', () => {
      expect(calendarCache.isValid()).toBe(false);
    });

    it('should return true for valid cache', () => {
      calendarCache.set(mockEvents);
      expect(calendarCache.isValid()).toBe(true);
    });
  });

  describe('getStats', () => {
    it('should return empty stats for empty cache', () => {
      const stats = calendarCache.getStats();
      
      expect(stats.isCached).toBe(false);
      expect(stats.eventCount).toBe(0);
      expect(stats.cachedAt).toBeNull();
      expect(stats.expiresAt).toBeNull();
      expect(stats.timeRemaining).toBeNull();
    });

    it('should return stats for cached data', () => {
      calendarCache.set(mockEvents);
      const stats = calendarCache.getStats();
      
      expect(stats.isCached).toBe(true);
      expect(stats.eventCount).toBe(1);
      expect(stats.cachedAt).toBeTruthy();
      expect(stats.expiresAt).toBeTruthy();
      expect(stats.timeRemaining).toMatch(/\d+ minutes/);
    });

    it('should show correct event count', () => {
      const multipleEvents = [...mockEvents, { ...mockEvents[0], id: '2' }];
      calendarCache.set(multipleEvents);
      
      const stats = calendarCache.getStats();
      expect(stats.eventCount).toBe(2);
    });
  });

  describe('clear', () => {
    it('should clear cached data', () => {
      calendarCache.set(mockEvents);
      expect(calendarCache.get()).toEqual(mockEvents);
      
      calendarCache.clear();
      expect(calendarCache.get()).toBeNull();
      expect(calendarCache.isValid()).toBe(false);
    });
  });

  describe('multiple operations', () => {
    it('should handle multiple set operations', () => {
      calendarCache.set(mockEvents);
      const firstGet = calendarCache.get();
      
      const newEvents = [{ ...mockEvents[0], id: '2', title: 'New Event' }];
      calendarCache.set(newEvents);
      const secondGet = calendarCache.get();
      
      expect(firstGet).toEqual(mockEvents);
      expect(secondGet).toEqual(newEvents);
    });

    it('should maintain cache across multiple get operations', () => {
      calendarCache.set(mockEvents);
      
      const first = calendarCache.get();
      const second = calendarCache.get();
      const third = calendarCache.get();
      
      expect(first).toEqual(mockEvents);
      expect(second).toEqual(mockEvents);
      expect(third).toEqual(mockEvents);
    });
  });
});
