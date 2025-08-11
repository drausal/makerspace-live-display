// lib/calendar-fetcher.ts
import { ProcessedEvent } from '@/shared/types';
import { Logger } from './logger';
import { AgeGroupDetector } from './age-group-detector';

// Main class for fetching and processing Google Calendar data
export class GoogleCalendarFetcher {
  private calendarId: string;
  private ageDetector: AgeGroupDetector;

  constructor(calendarId: string) {
    this.calendarId = calendarId;
    this.ageDetector = new AgeGroupDetector();
    
    // **Debug Log:** Check if the calendar ID is being loaded.
    if (!calendarId) {
      console.error("🚨 FATAL: CALENDAR_ID environment variable not set. Live data will not work.");
      Logger.error('GoogleCalendarFetcher', 'Initialization failed: CALENDAR_ID not provided.');
    } else {
      console.log(`✅ GoogleCalendarFetcher initialized with Calendar ID: ${this.calendarId}`);
      Logger.log('GoogleCalendarFetcher', `Initialized with Calendar ID: ${this.calendarId}`);
    }
  }

  // Fetch all events within a 3-month range
  async fetchAllEvents(): Promise<ProcessedEvent[]> {
    const now = new Date();
    const startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1); // Previous month
    const endDate = new Date(now.getFullYear(), now.getMonth() + 2, 1);   // Next month
    
    Logger.log('GoogleCalendarFetcher', `Fetching events from ${startDate.toISOString()} to ${endDate.toISOString()}`);
    return this.fetchEvents(startDate, endDate);
  }

  // Fetch events for a specific date range
  async fetchEvents(startDate: Date, endDate: Date): Promise<ProcessedEvent[]> {
    if (!this.calendarId) {
      return Promise.reject(new Error('Google Calendar ID is not configured.'));
    }
    try {
      const icalUrl = `https://calendar.google.com/calendar/ical/${this.calendarId}/public/basic.ics`;
      console.log(`Attempting to fetch live data from: ${icalUrl}`);
      Logger.log('GoogleCalendarFetcher', `Fetching calendar data from URL: ${icalUrl}`);
      
      const response = await fetch(icalUrl, { next: { revalidate: 600 } }); // Revalidate every 10 minutes
      
      if (!response.ok) {
        // **Debug Log:** Log the failed fetch attempt
        const errorText = await response.text();
        console.error(`🚨 Calendar fetch failed! Status: ${response.status}. Response: ${errorText}`);
        throw new Error(`Calendar fetch failed with status: ${response.status}`);
      }
      
      const icalData = await response.text();
      console.log(`✅ Successfully fetched ${icalData.length} bytes of iCal data.`);
      Logger.log('GoogleCalendarFetcher', `Successfully fetched ${icalData.length} bytes of iCal data`);
      
      return this.parseICalData(icalData, startDate, endDate);
    } catch (error) {
      // **Debug Log:** Log any error during the process
      console.error('🚨 Error during calendar fetch or parse:', error);
      Logger.error('GoogleCalendarFetcher', 'Error fetching or parsing calendar data', {}, error as Error);
      throw error;
    }
  }

  // ... (rest of the file is unchanged)

  private parseICalData(icalData: string, startDate: Date, endDate: Date): ProcessedEvent[] {
    const rawEvents = this.parseICalContent(icalData);
    Logger.log('GoogleCalendarFetcher', `Parsed ${rawEvents.length} raw events from iCal data`);

    const processed = rawEvents
      .map(event => this.processEvent(event))
      .filter(event => this.isValidEvent(event) && this.isInDateRange(event, startDate, endDate));
      
    Logger.log('GoogleCalendarFetcher', `Found ${processed.length} valid events in the date range`);
    return processed;
  }

  private parseICalContent(icalData: string): any[] {
    const events: any[] = [];
    const lines = icalData.split(/\r\n|\n/);
    let currentEvent: any = null;
    
    for (const line of lines) {
      if (line.startsWith('BEGIN:VEVENT')) {
        currentEvent = {};
      } else if (line.startsWith('END:VEVENT') && currentEvent) {
        events.push(currentEvent);
        currentEvent = null;
      } else if (currentEvent) {
        const [key, ...valueParts] = line.split(':');
        const value = valueParts.join(':');
        
        if (key.startsWith('SUMMARY')) currentEvent.summary = this.decodeICalValue(value);
        if (key.startsWith('DESCRIPTION')) currentEvent.description = this.decodeICalValue(value);
        if (key.startsWith('LOCATION')) currentEvent.location = this.decodeICalValue(value);
        if (key.startsWith('DTSTART')) currentEvent.dtstart = this.parseICalDateTime(value);
        if (key.startsWith('DTEND')) currentEvent.dtend = this.parseICalDateTime(value);
        if (key.startsWith('UID')) currentEvent.uid = value;
        if (key.startsWith('RRULE')) currentEvent.rrule = value;
        if (key.startsWith('STATUS')) currentEvent.status = this.decodeICalValue(value).toLowerCase();
      }
    }
    return events;
  }
  
  private processEvent(rawEvent: any): ProcessedEvent {
    const ageGroup = this.ageDetector.detectAgeGroup(rawEvent.summary || '', rawEvent.description || '');
    
    return {
      id: rawEvent.uid || this.generateId(),
      title: this.cleanText(rawEvent.summary || 'Untitled Event'),
      description: this.cleanText(rawEvent.description || ''),
      location: this.cleanText(rawEvent.location || ''),
      start: rawEvent.dtstart || new Date().toISOString(),
      end: rawEvent.dtend || new Date().toISOString(),
      status: rawEvent.status || 'confirmed',
      isAllDay: this.isAllDayEvent(rawEvent),
      ageGroup,
      categories: this.extractCategories(rawEvent.description || ''),
      registrationUrl: this.extractRegistrationUrl(rawEvent.description || ''),
      isRecurring: Boolean(rawEvent.rrule)
    };
  }
  
  private decodeICalValue(value: string): string {
    return value.replace(/\\n/g, '\n').replace(/\\,/g, ',').replace(/\\;/g, ';').replace(/\\\\/g, '\\');
  }
  
  private parseICalDateTime(value: string): string {
    if (value.includes('T')) {
      const clean = value.replace(/[^0-9T]/g, '');
      const y = clean.substring(0, 4), m = clean.substring(4, 6), d = clean.substring(6, 8);
      const h = clean.substring(9, 11), min = clean.substring(11, 13), s = clean.substring(13, 15);
      return `${y}-${m}-${d}T${h}:${min}:${s}Z`;
    }
    const y = value.substring(0, 4), m = value.substring(4, 6), d = value.substring(6, 8);
    return `${y}-${m}-${d}T00:00:00Z`;
  }
  
  private isInDateRange(event: ProcessedEvent, startDate: Date, endDate: Date): boolean {
    const eventStart = new Date(event.start);
    return eventStart >= startDate && eventStart <= endDate;
  }
  
  private isValidEvent(event: ProcessedEvent): boolean {
    return event.title && event.start && event.end && new Date(event.start) < new Date(event.end);
  }
  
  private cleanText(text: string): string {
    return text.trim().replace(/[<>]/g, '').replace(/\s+/g, ' ').substring(0, 500);
  }
  
  private isAllDayEvent(event: any): boolean {
    return !event.dtstart?.includes('T');
  }
  
  private generateId(): string {
    return Math.random().toString(36).substring(2);
  }
  
  private extractCategories(description: string): string[] {
    const cats: string[] = [];
    if (/art|craft/i.test(description)) cats.push('Arts');
    if (/tech|3d|robot/i.test(description)) cats.push('Technology');
    return cats;
  }
  
  private extractRegistrationUrl(description: string): string | undefined {
    return description.match(/https?:\/\/[^\s]+/)?.[0];
  }
}

// Export a singleton instance for live data
export const calendarFetcher = new GoogleCalendarFetcher(process.env.CALENDAR_ID!);