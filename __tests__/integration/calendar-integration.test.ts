// __tests__/integration/calendar-integration.test.ts
import { GoogleCalendarFetcher } from '../../src/lib/calendar-fetcher';
import { EventValidator } from '../../src/lib/event-validator';
import { AgeGroupDetector } from '../../src/lib/age-group-detector';
import { CalendarUtils } from '../../src/lib/calendar-utils';
import { Logger } from '../../src/lib/logger';

describe('Calendar System Integration', () => {
  let fetcher: GoogleCalendarFetcher;
  let validator: EventValidator;
  let detector: AgeGroupDetector;

  // Sample iCal data for testing
  const sampleICalData = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Google Inc//Google Calendar 70.9054//EN
CALSCALE:GREGORIAN
METHOD:PUBLISH
X-WR-CALNAME:Makerspace Events
X-WR-TIMEZONE:UTC

BEGIN:VEVENT
DTSTART:20250810T100000Z
DTEND:20250810T120000Z
DTSTAMP:20250810T080000Z
UID:test1@google.com
SUMMARY:Open Studio - Adults (19 and up) only
DESCRIPTION:Adult pottery and ceramics session. Must be 19 or older.
LOCATION:Main Studio
STATUS:CONFIRMED
END:VEVENT

BEGIN:VEVENT
DTSTART:20250810T140000Z
DTEND:20250810T160000Z
DTSTAMP:20250810T080000Z
UID:test2@google.com
SUMMARY:Kids Workshop - Elementary (6-11 years)
DESCRIPTION:After school art club for elementary students ages 6-11
LOCATION:Kids Area
STATUS:CONFIRMED
END:VEVENT

BEGIN:VEVENT
DTSTART:20250810T180000Z
DTEND:20250810T200000Z
DTSTAMP:20250810T080000Z
UID:test3@google.com
SUMMARY:Family 3D Printing - All Ages
DESCRIPTION:Learn 3D printing together! Family friendly event for all ages.
LOCATION:Tech Lab
STATUS:CONFIRMED
END:VEVENT

BEGIN:VEVENT
DTSTART:20250810T190000Z
DTEND:20250810T210000Z
DTSTAMP:20250810T080000Z
UID:test4@google.com
SUMMARY:Teen Robotics Club (12-18)
DESCRIPTION:High school robotics club meeting and project work
LOCATION:STEM Lab
STATUS:CONFIRMED
END:VEVENT

BEGIN:VEVENT
DTSTART:20250810T080000Z
DTEND:20250810T090000Z
DTSTAMP:20250810T080000Z
UID:test5@google.com
SUMMARY:Busy - Staff Meeting
DESCRIPTION:Private staff meeting
LOCATION:Office
STATUS:CONFIRMED
END:VEVENT

BEGIN:VEVENT
DTSTART:20250810T220000Z
DTEND:20250810T230000Z
DTSTAMP:20250810T080000Z
UID:cancelled@google.com
SUMMARY:Cancelled Event
DESCRIPTION:This event was cancelled
LOCATION:Main Studio
STATUS:CANCELLED
END:VEVENT

END:VCALENDAR`;

  beforeEach(() => {
    fetcher = new GoogleCalendarFetcher('test-calendar-id');
    validator = new EventValidator();
    detector = new AgeGroupDetector();
    Logger.clearLogs();
    
    // Mock console to reduce test output
    jest.spyOn(console, 'log').mockImplementation();
    jest.spyOn(console, 'info').mockImplementation();
    jest.spyOn(console, 'warn').mockImplementation();
    jest.spyOn(console, 'error').mockImplementation();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('End-to-End Calendar Processing', () => {
    it('should process sample iCal data through complete pipeline', () => {
      // Mock the private parseICalData method by accessing it through the public interface
      const startDate = new Date('2025-08-10T00:00:00Z');
      const endDate = new Date('2025-08-10T23:59:59Z');

      // Since parseICalData is private, we need to test through the public interface
      // We'll mock the fetch to return our sample data
      const mockFetch = jest.fn().mockResolvedValue({
        ok: true,
        text: () => Promise.resolve(sampleICalData)
      });
      global.fetch = mockFetch;

      return fetcher.fetchEvents(startDate, endDate).then(events => {
        // Validate we got events
        expect(events.length).toBeGreaterThan(0);

        // Apply filtering
        const filteredEvents = validator.filterEvents(events);
        
        // Should filter out "Busy" and "Cancelled" events
        expect(filteredEvents.length).toBe(4); // 6 total - 1 busy - 1 cancelled = 4
        
        // Check age group detection worked
        const ageGroups = filteredEvents.map(e => e.ageGroup.group);
        expect(ageGroups).toContain('adults');
        expect(ageGroups).toContain('elementary');
        expect(ageGroups).toContain('allages');
        expect(ageGroups).toContain('teens');

        // Verify no busy or cancelled events
        const titles = filteredEvents.map(e => e.title);
        expect(titles.some(t => t.toLowerCase().includes('busy'))).toBe(false);
        expect(titles.some(t => t.toLowerCase().includes('cancelled'))).toBe(false);

        // Test event sorting
  const sortedEvents = CalendarUtils.sortEventsByStartTime(filteredEvents);
  expect(new Date(sortedEvents[0].start).getTime()).toBeLessThanOrEqual(new Date(sortedEvents[1].start).getTime());

        // Test display status calculation
        jest.spyOn(Date, 'now').mockReturnValue(new Date('2025-08-10T15:00:00Z').getTime());
        const displayStatus = CalendarUtils.getCurrentDisplayStatus(sortedEvents);
        
        expect(displayStatus.status).toBeDefined();
        expect(['current', 'between', 'closed']).toContain(displayStatus.status);

        return filteredEvents;
      });
    });

    it('should handle age group statistics correctly', async () => {
      const mockFetch = jest.fn().mockResolvedValue({
        ok: true,
        text: () => Promise.resolve(sampleICalData)
      });
      global.fetch = mockFetch;

      const startDate = new Date('2025-08-10T00:00:00Z');
      const endDate = new Date('2025-08-10T23:59:59Z');
      
      const events = await fetcher.fetchEvents(startDate, endDate);
      const filteredEvents = validator.filterEvents(events);
      
      const stats = detector.analyzeEvents(filteredEvents);
      
      // Should have stats for each age group represented
      expect(stats.adults).toBeGreaterThan(0);
      expect(stats.elementary).toBeGreaterThan(0);
      expect(stats.allages).toBeGreaterThan(0);
      expect(stats.teens).toBeGreaterThan(0);
      
      // Total should match filtered events
      const totalEvents = Object.values(stats).reduce((sum, count) => sum + count, 0);
      expect(totalEvents).toBe(filteredEvents.length);
    });

    it('should handle error scenarios gracefully', async () => {
      // Test network error
      const mockFetch = jest.fn().mockRejectedValue(new Error('Network error'));
      global.fetch = mockFetch;

      const startDate = new Date('2025-08-10T00:00:00Z');
      const endDate = new Date('2025-08-10T23:59:59Z');

      await expect(fetcher.fetchEvents(startDate, endDate)).rejects.toThrow('Network error');

      // Check that error was logged
      const errorLogs = Logger.getLogs('error');
      expect(errorLogs.length).toBeGreaterThan(0);
    });

    it('should handle malformed iCal data', async () => {
      const malformedICal = `BEGIN:VCALENDAR
VERSION:2.0
BEGIN:VEVENT
SUMMARY:Test Event
// Missing required fields and malformed structure
END:VCALENDAR`;

      const mockFetch = jest.fn().mockResolvedValue({
        ok: true,
        text: () => Promise.resolve(malformedICal)
      });
      global.fetch = mockFetch;

      const startDate = new Date('2025-08-10T00:00:00Z');
      const endDate = new Date('2025-08-10T23:59:59Z');

      const events = await fetcher.fetchEvents(startDate, endDate);
      const filteredEvents = validator.filterEvents(events);

      // Should handle malformed data gracefully
      expect(Array.isArray(events)).toBe(true);
      expect(Array.isArray(filteredEvents)).toBe(true);
    });

    it('should maintain data integrity through processing pipeline', async () => {
      const mockFetch = jest.fn().mockResolvedValue({
        ok: true,
        text: () => Promise.resolve(sampleICalData)
      });
      global.fetch = mockFetch;

      const startDate = new Date('2025-08-10T00:00:00Z');
      const endDate = new Date('2025-08-10T23:59:59Z');

      const events = await fetcher.fetchEvents(startDate, endDate);
      const filteredEvents = validator.filterEvents(events);

      // Verify all filtered events have required properties
      filteredEvents.forEach(event => {
        expect(event.id).toBeDefined();
        expect(event.title).toBeTruthy();
        expect(event.start).toBeTruthy();
        expect(event.end).toBeTruthy();
        expect(event.ageGroup).toBeDefined();
        expect(event.ageGroup.group).toBeTruthy();
        expect(event.ageGroup.color).toBeTruthy();
        expect(event.status).toBeDefined();
        
        // Verify dates are valid
        expect(new Date(event.start).getTime()).toBeLessThan(new Date(event.end).getTime());
        
        // Verify age group is one of expected values
        expect(['adults', 'elementary', 'allages', 'teens', 'unknown']).toContain(event.ageGroup.group);
      });
    });

    it('should handle time-based queries correctly', async () => {
      const mockFetch = jest.fn().mockResolvedValue({
        ok: true,
        text: () => Promise.resolve(sampleICalData)
      });
      global.fetch = mockFetch;

      const startDate = new Date('2025-08-10T00:00:00Z');
      const endDate = new Date('2025-08-10T23:59:59Z');

      const events = await fetcher.fetchEvents(startDate, endDate);
      const filteredEvents = validator.filterEvents(events);

      // Test current event detection
      jest.spyOn(Date, 'now').mockReturnValue(new Date('2025-08-10T11:00:00Z').getTime());
      
      const currentEvents = filteredEvents.filter(event => 
        CalendarUtils.isEventHappeningNow(event)
      );

      // Should find the adult studio session (10:00-12:00)
      expect(currentEvents.length).toBe(1);
      expect(currentEvents[0].ageGroup.group).toBe('adults');

      // Test today's events
      const todaysEvents = CalendarUtils.getTodaysEvents(filteredEvents, new Date('2025-08-10T11:00:00Z'));
      expect(todaysEvents.length).toBe(filteredEvents.length); // All events are today
    });
  });

  describe('Performance and Scalability', () => {
    it('should handle large datasets efficiently', async () => {
      // Generate a large iCal dataset
      let largeICalData = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Test//Test//EN
CALSCALE:GREGORIAN
METHOD:PUBLISH`;

      // Generate 100 events
      for (let i = 0; i < 100; i++) {
        const startHour = 8 + (i % 12);
        const ageGroups = ['Adults (19+)', 'Elementary (6-11)', 'All Ages', 'Teens (12-18)'];
        const ageGroup = ageGroups[i % 4];
        
        largeICalData += `

BEGIN:VEVENT
DTSTART:20250810T${startHour.toString().padStart(2, '0')}0000Z
DTEND:20250810T${(startHour + 1).toString().padStart(2, '0')}0000Z
DTSTAMP:20250810T080000Z
UID:test${i}@google.com
SUMMARY:Test Event ${i} - ${ageGroup}
DESCRIPTION:Test event with ${ageGroup.toLowerCase()}
LOCATION:Test Location ${i}
STATUS:CONFIRMED
END:VEVENT`;
      }

      largeICalData += '\nEND:VCALENDAR';

      const mockFetch = jest.fn().mockResolvedValue({
        ok: true,
        text: () => Promise.resolve(largeICalData)
      });
      global.fetch = mockFetch;

      const startTime = Date.now();
      
      const startDate = new Date('2025-08-10T00:00:00Z');
      const endDate = new Date('2025-08-10T23:59:59Z');

      const events = await fetcher.fetchEvents(startDate, endDate);
      const filteredEvents = validator.filterEvents(events);
      const stats = detector.analyzeEvents(filteredEvents);

      const endTime = Date.now();
      const processingTime = endTime - startTime;

      // Should process 100 events in reasonable time (under 1 second)
      expect(processingTime).toBeLessThan(1000);
      expect(filteredEvents.length).toBe(100);
      
      // Verify age group distribution
      const totalEvents = Object.values(stats).reduce((sum, count) => sum + count, 0);
      expect(totalEvents).toBe(100);
    });
  });
});

// Test helper functions
export const createTestEvent = (overrides: any = {}) => ({
  id: 'test-123',
  title: 'Test Event',
  description: 'Test description',
  location: 'Test Location',
  start: '2025-08-10T10:00:00Z',
  end: '2025-08-10T12:00:00Z',
  status: 'confirmed' as const,
  isAllDay: false,
  ageGroup: {
    group: 'adults' as const,
    emoji: '🧑',
    label: 'Adults (19+)',
    color: '#1e40af'
  },
  categories: ['Workshop'],
  isRecurring: false,
  ...overrides
});

export const mockCalendarResponse = (events: any[]) => {
  let icalData = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Test//Test//EN`;

  events.forEach((event, index) => {
    icalData += `

BEGIN:VEVENT
DTSTART:${event.start.replace(/[-:]/g, '').replace('Z', '')}Z
DTEND:${event.end.replace(/[-:]/g, '').replace('Z', '')}Z
UID:test${index}@test.com
SUMMARY:${event.title}
DESCRIPTION:${event.description || ''}
LOCATION:${event.location || ''}
STATUS:${(event.status || 'confirmed').toUpperCase()}
END:VEVENT`;
  });

  icalData += '\nEND:VCALENDAR';
  return icalData;
};
