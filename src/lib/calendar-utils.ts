// lib/calendar-utils.ts
import { ProcessedEvent, DisplayStatus } from '@/shared/types';

export class CalendarUtils {
  /**
   * Determines current display status based on events and time
   */
  static getDisplayStatus(events: ProcessedEvent[], currentTime: Date = new Date(), mockTime?: string): DisplayStatus {
    const effectiveTime = mockTime ? new Date(mockTime) : currentTime;
    
    // Sort events by start time
    const sortedEvents = [...events].sort((a, b) => 
      new Date(a.start).getTime() - new Date(b.start).getTime()
    );
    
    // Find current event (if any)
    const currentEvent = sortedEvents.find(event => {
      const start = new Date(event.start);
      const end = new Date(event.end);
      return effectiveTime >= start && effectiveTime <= end;
    });
    
    // Find next event
    const futureEvents = sortedEvents.filter(event => 
      new Date(event.start) > effectiveTime
    );
    const nextEvent = futureEvents[0];
    
    let status: 'current' | 'between' | 'closed';
    let timeUntilNext: string | undefined;
    
    if (currentEvent) {
      status = 'current';
    } else if (nextEvent) {
      status = 'between';
      timeUntilNext = this.formatTimeUntil(effectiveTime, new Date(nextEvent.start));
    } else {
      status = 'closed';
    }
    
    return {
      status,
      currentEvent,
      nextEvent,
      currentTime: mockTime ? mockTime : effectiveTime.toISOString(),
      mockTime,
      timeUntilNext,
      displayTheme: currentEvent?.ageGroup?.color || nextEvent?.ageGroup?.color
    };
  }

  /**
   * Filters events for a specific day, comparing in UTC to avoid timezone issues.
   */
  static getTodaysEvents(events: ProcessedEvent[], date: Date = new Date()): ProcessedEvent[] {
    return events.filter(event => {
      const eventStart = new Date(event.start);
      return (
        eventStart.getUTCFullYear() === date.getUTCFullYear() &&
        eventStart.getUTCMonth() === date.getUTCMonth() &&
        eventStart.getUTCDate() === date.getUTCDate()
      );
    });
  }

  // ... (rest of the class remains the same)

  /**
   * Back-compat wrapper: returns current display status. Optionally accepts mockTime ISO string.
   */
  static getCurrentDisplayStatus(events: ProcessedEvent[], mockTime?: string): DisplayStatus {
    const now = mockTime ? new Date(mockTime) : new Date(Date.now());
    return this.getDisplayStatus(events, now, mockTime);
  }
  
  /**
   * Formats time remaining until an event
   */
  static formatTimeUntil(fromTime: Date, toTime: Date): string {
    const diffMs = toTime.getTime() - fromTime.getTime();
    
    if (diffMs <= 0) return 'Starting now';
    
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMinutes / 60);
    const diffDays = Math.floor(diffHours / 24);
    
    if (diffDays > 0) {
      return `${diffDays} day${diffDays > 1 ? 's' : ''}`;
    } else if (diffHours > 0) {
      const remainingMinutes = diffMinutes % 60;
      return `${diffHours}h ${remainingMinutes}m`;
    } else if (diffMinutes > 0) {
      return `${diffMinutes} minute${diffMinutes > 1 ? 's' : ''}`;
    } else {
      return 'Starting now';
    }
  }

  /**
   * Formats milliseconds until next event into compact string (e.g., "1h 1m", "< 1m")
   */
  static formatTimeUntilNext(ms: number): string {
    if (ms <= 0) return '< 1m';
    const totalMinutes = Math.floor(ms / 60000);
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    if (hours > 0) return `${hours}h ${minutes}m`;
    if (minutes > 0) return `${minutes}m`;
    return '< 1m';
  }

  /**
   * Returns events whose start is within [startDate, endDate] inclusive
   */
  static getEventsInDateRange(events: ProcessedEvent[], startDate: Date, endDate: Date): ProcessedEvent[] {
    const startMs = startDate.getTime();
    const endMs = endDate.getTime();
    return events.filter(e => {
      const s = new Date(e.start).getTime();
      return s >= startMs && s <= endMs;
    });
  }
  
  /**
   * Groups events by age group for statistics
   */
  static groupEventsByAgeGroup(events: ProcessedEvent[]): Record<string, ProcessedEvent[]> {
    return events.reduce((acc, event) => {
      const group = event.ageGroup.group;
      if (!acc[group]) acc[group] = [];
      acc[group].push(event);
      return acc;
    }, {} as Record<string, ProcessedEvent[]>);
  }
  
  /**
   * Gets the next N events from current time
   */
  static getUpcomingEvents(events: ProcessedEvent[], count: number = 5, fromTime: Date = new Date()): ProcessedEvent[] {
    return events
      .filter(event => new Date(event.start) > fromTime)
      .sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime())
      .slice(0, count);
  }

  /**
   * True if event contains now within its start/end; accepts optional mockTime ISO string
   */
  static isEventHappeningNow(event: ProcessedEvent, mockTime?: string): boolean {
    const now = mockTime ? new Date(mockTime) : new Date(Date.now());
    const start = new Date(event.start);
    const end = new Date(event.end);
    return now >= start && now <= end;
  }

  /**
   * Stable sort by start time ascending, without mutating input
   */
  static sortEventsByStartTime(events: ProcessedEvent[]): ProcessedEvent[] {
    return [...events].sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());
  }
  
  /**
   * Checks if an event is happening soon (within threshold)
   */
  static isEventSoon(event: ProcessedEvent, thresholdMinutes: number = 30, currentTime: Date = new Date()): boolean {
    const eventStart = new Date(event.start);
    const diffMs = eventStart.getTime() - currentTime.getTime();
    const diffMinutes = diffMs / (1000 * 60);
    
    return diffMinutes > 0 && diffMinutes <= thresholdMinutes;
  }
  
  /**
   * Formats event time for display
   */
  static formatEventTime(event: ProcessedEvent, format: 'short' | 'long' = 'short'): string {
    const start = new Date(event.start);
    const end = new Date(event.end);
    
    if (event.isAllDay) {
      return 'All Day';
    }
    
    const timeOptions: Intl.DateTimeFormatOptions = {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    };
    
    const startTime = start.toLocaleTimeString('en-US', timeOptions);
    const endTime = end.toLocaleTimeString('en-US', timeOptions);
    
    if (format === 'long') {
      const dateOptions: Intl.DateTimeFormatOptions = {
        weekday: 'long',
        month: 'long',
        day: 'numeric'
      };
      const dateStr = start.toLocaleDateString('en-US', dateOptions);
      return `${dateStr} • ${startTime} - ${endTime}`;
    }
    
    return `${startTime} - ${endTime}`;
  }
  
  /**
   * Generates a friendly duration string
   */
  static formatEventDuration(event: ProcessedEvent): string {
    const start = new Date(event.start);
    const end = new Date(event.end);
    const durationMs = end.getTime() - start.getTime();
    const durationMinutes = Math.floor(durationMs / (1000 * 60));
    
    if (durationMinutes < 60) {
      return `${durationMinutes} min`;
    } else {
      const hours = Math.floor(durationMinutes / 60);
      const minutes = durationMinutes % 60;
      return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`;
    }
  }
  
  /**
   * Determines if the makerspace should currently be "open" based on events
   */
  static isMakerspaceOpen(events: ProcessedEvent[], currentTime: Date = new Date()): boolean {
    const displayStatus = this.getDisplayStatus(events, currentTime);
    return displayStatus.status === 'current';
  }
  
  /**
   * Gets color theme for current time period
   */
  static getCurrentThemeColor(events: ProcessedEvent[], currentTime: Date = new Date()): string {
    const displayStatus = this.getDisplayStatus(events, currentTime);
    return displayStatus.displayTheme || '#6b7280'; // Default gray
  }
  
  /**
   * Validates that events are properly sorted and don't overlap
   */
  static validateEventOrder(events: ProcessedEvent[]): { valid: boolean; issues: string[] } {
    const issues: string[] = [];
    
    // Sort events by start time for validation
    const sortedEvents = [...events].sort((a, b) => 
      new Date(a.start).getTime() - new Date(b.start).getTime()
    );
    
    for (let i = 0; i < sortedEvents.length - 1; i++) {
      const current = sortedEvents[i];
      const next = sortedEvents[i + 1];
      
      const currentEnd = new Date(current.end);
      const nextStart = new Date(next.start);
      
      // Check for overlapping events
      if (currentEnd > nextStart) {
        issues.push(`Events overlap: "${current.title}" ends after "${next.title}" starts`);
      }
    }
    
    return {
      valid: issues.length === 0,
      issues
    };
  }
}