// __tests__/calendar-utils.test.ts
import { CalendarUtils } from '../src/lib/calendar-utils';
import { ProcessedEvent, DisplayStatus } from '../src/shared/types';

describe('CalendarUtils', () => {
  const createMockEvent = (overrides: Partial<ProcessedEvent> = {}): ProcessedEvent => ({
    id: 'test-123',
    title: 'Test Event',
    description: 'Test description',
    location: 'Test Location',
    start: '2025-08-10T10:00:00Z',
    end: '2025-08-10T12:00:00Z',
    status: 'confirmed',
    isAllDay: false,
    ageGroup: {
      group: 'adults',
      emoji: '🧑',
      label: 'Adults (19+)',
      color: '#1e40af'
    },
    categories: ['Workshop'],
    isRecurring: false,
    ...overrides
  });

  describe('getCurrentDisplayStatus', () => {
    beforeEach(() => {
      // Mock Date.now() to return consistent time for testing
      jest.spyOn(Date, 'now').mockReturnValue(new Date('2025-08-10T11:00:00Z').getTime());
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });

    it('should return current status when event is happening now', () => {
      const events = [
        createMockEvent({
          id: '1',
          title: 'Current Event',
          start: '2025-08-10T10:30:00Z',
          end: '2025-08-10T12:30:00Z'
        })
      ];

      const status = CalendarUtils.getCurrentDisplayStatus(events);

      expect(status.status).toBe('current');
      expect(status.currentEvent?.id).toBe('1');
      expect(status.nextEvent).toBeUndefined();
    });

    it('should return between status when between events', () => {
      const events = [
        createMockEvent({
          id: '1',
          title: 'Past Event',
          start: '2025-08-10T08:00:00Z',
          end: '2025-08-10T09:00:00Z'
        }),
        createMockEvent({
          id: '2',
          title: 'Future Event',
          start: '2025-08-10T14:00:00Z',
          end: '2025-08-10T16:00:00Z'
        })
      ];

      const status = CalendarUtils.getCurrentDisplayStatus(events);

      expect(status.status).toBe('between');
      expect(status.currentEvent).toBeUndefined();
      expect(status.nextEvent?.id).toBe('2');
      expect(status.timeUntilNext).toBeDefined();
    });

    it('should return closed status when no upcoming events', () => {
      const events = [
        createMockEvent({
          id: '1',
          title: 'Past Event',
          start: '2025-08-10T08:00:00Z',
          end: '2025-08-10T09:00:00Z'
        })
      ];

      const status = CalendarUtils.getCurrentDisplayStatus(events);

      expect(status.status).toBe('closed');
      expect(status.currentEvent).toBeUndefined();
      expect(status.nextEvent).toBeUndefined();
      expect(status.timeUntilNext).toBeUndefined();
    });

    it('should handle empty events array', () => {
      const status = CalendarUtils.getCurrentDisplayStatus([]);

      expect(status.status).toBe('closed');
      expect(status.currentEvent).toBeUndefined();
      expect(status.nextEvent).toBeUndefined();
    });

    it('should use mock time when provided', () => {
      const events = [
        createMockEvent({
          id: '1',
          start: '2025-08-10T14:00:00Z',
          end: '2025-08-10T16:00:00Z'
        })
      ];

      const mockTime = '2025-08-10T15:00:00Z';
      const status = CalendarUtils.getCurrentDisplayStatus(events, mockTime);

      expect(status.status).toBe('current');
      expect(status.mockTime).toBe(mockTime);
      expect(status.currentTime).toBe(mockTime);
    });
  });

  describe('formatTimeUntilNext', () => {
    it('should format hours and minutes correctly', () => {
      expect(CalendarUtils.formatTimeUntilNext(3661000)).toBe('1h 1m'); // 1 hour 1 minute 1 second
      expect(CalendarUtils.formatTimeUntilNext(3600000)).toBe('1h 0m'); // 1 hour exactly
      expect(CalendarUtils.formatTimeUntilNext(3540000)).toBe('59m'); // 59 minutes
      expect(CalendarUtils.formatTimeUntilNext(60000)).toBe('1m'); // 1 minute
      expect(CalendarUtils.formatTimeUntilNext(30000)).toBe('< 1m'); // 30 seconds
    });

    it('should handle zero and negative times', () => {
      expect(CalendarUtils.formatTimeUntilNext(0)).toBe('< 1m');
      expect(CalendarUtils.formatTimeUntilNext(-1000)).toBe('< 1m');
    });

    it('should format large time periods', () => {
      expect(CalendarUtils.formatTimeUntilNext(7200000)).toBe('2h 0m'); // 2 hours
      expect(CalendarUtils.formatTimeUntilNext(86400000)).toBe('24h 0m'); // 24 hours
    });
  });

  describe('getEventsInDateRange', () => {
    it('should return events within date range', () => {
      const events = [
        createMockEvent({
          id: '1',
          start: '2025-08-10T10:00:00Z',
          end: '2025-08-10T12:00:00Z'
        }),
        createMockEvent({
          id: '2',
          start: '2025-08-11T10:00:00Z',
          end: '2025-08-11T12:00:00Z'
        }),
        createMockEvent({
          id: '3',
          start: '2025-08-12T10:00:00Z',
          end: '2025-08-12T12:00:00Z'
        })
      ];

      const startDate = new Date('2025-08-10T00:00:00Z');
      const endDate = new Date('2025-08-11T23:59:59Z');

      const filtered = CalendarUtils.getEventsInDateRange(events, startDate, endDate);

      expect(filtered).toHaveLength(2);
      expect(filtered.map(e => e.id)).toEqual(['1', '2']);
    });

    it('should handle edge cases at range boundaries', () => {
      const events = [
        createMockEvent({
          id: '1',
          start: '2025-08-10T00:00:00Z', // Exactly at start
          end: '2025-08-10T01:00:00Z'
        }),
        createMockEvent({
          id: '2',
          start: '2025-08-10T23:59:59Z', // Just before end
          end: '2025-08-11T01:00:00Z'
        }),
        createMockEvent({
          id: '3',
          start: '2025-08-11T00:00:00Z', // Exactly at end
          end: '2025-08-11T01:00:00Z'
        })
      ];

      const startDate = new Date('2025-08-10T00:00:00Z');
      const endDate = new Date('2025-08-11T00:00:00Z');

      const filtered = CalendarUtils.getEventsInDateRange(events, startDate, endDate);

      expect(filtered).toHaveLength(3);
    });

    it('should handle empty events array', () => {
      const startDate = new Date('2025-08-10T00:00:00Z');
      const endDate = new Date('2025-08-11T00:00:00Z');

      const filtered = CalendarUtils.getEventsInDateRange([], startDate, endDate);

      expect(filtered).toHaveLength(0);
    });
  });

  describe('sortEventsByStartTime', () => {
    it('should sort events by start time ascending', () => {
      const events = [
        createMockEvent({
          id: '3',
          start: '2025-08-10T14:00:00Z'
        }),
        createMockEvent({
          id: '1',
          start: '2025-08-10T10:00:00Z'
        }),
        createMockEvent({
          id: '2',
          start: '2025-08-10T12:00:00Z'
        })
      ];

      const sorted = CalendarUtils.sortEventsByStartTime(events);

      expect(sorted.map(e => e.id)).toEqual(['1', '2', '3']);
    });

    it('should handle events with same start time', () => {
      const events = [
        createMockEvent({
          id: '1',
          title: 'Event B',
          start: '2025-08-10T10:00:00Z'
        }),
        createMockEvent({
          id: '2',
          title: 'Event A',
          start: '2025-08-10T10:00:00Z'
        })
      ];

      const sorted = CalendarUtils.sortEventsByStartTime(events);

      // Should maintain original order for same start times
      expect(sorted).toHaveLength(2);
      expect(sorted[0].start).toBe(sorted[1].start);
    });

    it('should not mutate original array', () => {
      const events = [
        createMockEvent({ id: '2', start: '2025-08-10T12:00:00Z' }),
        createMockEvent({ id: '1', start: '2025-08-10T10:00:00Z' })
      ];

      const originalOrder = events.map(e => e.id);
      const sorted = CalendarUtils.sortEventsByStartTime(events);

      expect(events.map(e => e.id)).toEqual(originalOrder); // Original unchanged
      expect(sorted.map(e => e.id)).toEqual(['1', '2']); // Sorted correctly
    });
  });

  describe('isEventHappeningNow', () => {
    beforeEach(() => {
      jest.spyOn(Date, 'now').mockReturnValue(new Date('2025-08-10T11:00:00Z').getTime());
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });

    it('should return true for event happening now', () => {
      const event = createMockEvent({
        start: '2025-08-10T10:30:00Z',
        end: '2025-08-10T11:30:00Z'
      });

      expect(CalendarUtils.isEventHappeningNow(event)).toBe(true);
    });

    it('should return false for future event', () => {
      const event = createMockEvent({
        start: '2025-08-10T12:00:00Z',
        end: '2025-08-10T13:00:00Z'
      });

      expect(CalendarUtils.isEventHappeningNow(event)).toBe(false);
    });

    it('should return false for past event', () => {
      const event = createMockEvent({
        start: '2025-08-10T09:00:00Z',
        end: '2025-08-10T10:00:00Z'
      });

      expect(CalendarUtils.isEventHappeningNow(event)).toBe(false);
    });

    it('should use mock time when provided', () => {
      const event = createMockEvent({
        start: '2025-08-10T14:00:00Z',
        end: '2025-08-10T15:00:00Z'
      });

      const mockTime = '2025-08-10T14:30:00Z';
      expect(CalendarUtils.isEventHappeningNow(event, mockTime)).toBe(true);
    });
  });

  describe('getTodaysEvents', () => {
    beforeEach(() => {
      jest.spyOn(Date, 'now').mockReturnValue(new Date('2025-08-10T11:00:00Z').getTime());
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });

    it("should return only today's events", () => {
      const events: ProcessedEvent[] = [
        { id: '1', start: '2025-08-10T09:00:00Z', end: '2025-08-10T10:00:00Z', title: 'Today 1', ageGroup: {} } as ProcessedEvent,
        { id: '2', start: '2025-08-11T09:00:00Z', end: '2025-08-11T10:00:00Z', title: 'Tomorrow', ageGroup: {} } as ProcessedEvent,
        { id: '3', start: '2025-08-10T20:00:00Z', end: '2025-08-10T21:00:00Z', title: 'Today 2', ageGroup: {} } as ProcessedEvent,
      ];

      const todaysEvents = CalendarUtils.getTodaysEvents(events, new Date('2025-08-10T11:00:00Z'));

      expect(todaysEvents).toHaveLength(2);
      expect(todaysEvents.map(e => e.id)).toEqual(['1', '3']);
    });

    it("should handle timezone correctly", () => {
      const events: ProcessedEvent[] = [
        { id: '1', start: '2025-08-10T00:00:00Z', end: '2025-08-10T01:00:00Z', title: 'Midnight UTC', ageGroup: {} } as ProcessedEvent,
        { id: '2', start: '2025-08-10T23:59:59Z', end: '2025-08-11T01:00:00Z', title: 'Almost tomorrow UTC', ageGroup: {} } as ProcessedEvent,
      ];

      const todaysEvents = CalendarUtils.getTodaysEvents(events, new Date('2025-08-10T11:00:00Z'));

      expect(todaysEvents).toHaveLength(2);
    });
  });
});
