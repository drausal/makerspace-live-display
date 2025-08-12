// lib/calendar-fetcher.ts
import { ProcessedEvent } from '@/shared/types';
import { Logger } from './logger';
import { AgeGroupDetector } from './age-group-detector';

// Define a type for the raw iCal event data
type RawCalEvent = Record<string, string>;

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
      Logger.info('GoogleCalendarFetcher', `Initialized with Calendar ID: ${this.calendarId}`);
    }
  }

  // Fetch all events within a 3-month range
  async fetchAllEvents(): Promise<ProcessedEvent[]> {
    const now = new Date();
    const startDate = new Date(now);
    startDate.setDate(now.getDate() - 1); // Yesterday
    const endDate = new Date(now.getFullYear(), now.getMonth() + 2, 1);   // Next month
    
    Logger.info('GoogleCalendarFetcher', `Fetching events from ${startDate.toISOString()} to ${endDate.toISOString()}`);
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
      Logger.info('GoogleCalendarFetcher', `Fetching calendar data from URL: ${icalUrl}`);
      
      const response = await fetch(icalUrl, { next: { revalidate: 600 } }); // Revalidate every 10 minutes
      
      if (!response.ok) {
        // **Debug Log:** Log the failed fetch attempt
        const errorText = await response.text();
        console.error(`🚨 Calendar fetch failed! Status: ${response.status}. Response: ${errorText}`);
        throw new Error(`Calendar fetch failed with status: ${response.status}`);
      }
      
      const icalData = await response.text();
      console.log(`✅ Successfully fetched ${icalData.length} bytes of iCal data.`);
      Logger.info('GoogleCalendarFetcher', `Successfully fetched ${icalData.length} bytes of iCal data`);
      
      return this.parseICalData(icalData, startDate, endDate);
    } catch (error) {
      // **Debug Log:** Log any error during the process
      console.error('🚨 Error during calendar fetch or parse:', error);
      Logger.error('GoogleCalendarFetcher', 'Error fetching or parsing calendar data', {}, error as Error);
      throw error;
    }
  }

  private parseICalData(icalData: string, startDate: Date, endDate: Date): ProcessedEvent[] {
    const rawEvents = this.parseICalContent(icalData);
    Logger.info('GoogleCalendarFetcher', `Parsed ${rawEvents.length} raw events from iCal data`);

    const processed = rawEvents
      .map(event => this.processEvent(event))
      .filter(event => this.isValidEvent(event) && this.isInDateRange(event, startDate, endDate));
      
    Logger.info('GoogleCalendarFetcher', `Found ${processed.length} valid events in the date range`);
    return processed;
  }

  private parseICalContent(icalData: string): RawCalEvent[] {
    const events: RawCalEvent[] = [];
    // Unfold multi-line properties. A line starting with a space or tab is a continuation of the previous line.
    const unfoldedData = icalData.replace(/\r\n[ \t]/g, '').replace(/\n[ \t]/g, '');
    const lines = unfoldedData.split(/\r\n|\n/);
    let currentEvent: RawCalEvent | null = null;
    
    for (const line of lines) {
      if (line.startsWith('BEGIN:VEVENT')) {
        currentEvent = {};
      } else if (line.startsWith('END:VEVENT') && currentEvent) {
        if (Object.keys(currentEvent).length > 0) {
          events.push(currentEvent);
        }
        currentEvent = null;
      } else if (currentEvent) {
        const separatorIndex = line.indexOf(':');
        if (separatorIndex === -1) {
          continue;
        }
        const key = line.substring(0, separatorIndex);
        const value = line.substring(separatorIndex + 1);
        
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
  
  private formatDescription(text: string): string {
    if (!text) return '';
    
    // Unicode regex for emojis in common ranges. The 'u' flag is essential.
    const emojiRegex = /([\u{1F300}-\u{1F5FF}\u{1F600}-\u{1F64F}\u{1F680}-\u{1F6FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}])/gu;
    
    // Add a newline before each emoji.
    const formattedText = text.replace(emojiRegex, '\n$1');
    
    // Clean up the text, preserving newlines.
    // Split by lines, trim each line, filter empty ones, and rejoin.
    return formattedText
      .split('\n')
      .map(line => line.trim())
      .filter(line => line)
      .join('\n');
  }

  private processEvent(rawEvent: RawCalEvent): ProcessedEvent {
    const ageGroup = this.ageDetector.detectAgeGroup(rawEvent.summary || '', rawEvent.description || '');
    
    return {
      id: rawEvent.uid || this.generateId(),
      title: this.cleanText(rawEvent.summary || 'Untitled Event'),
      description: this.formatDescription(rawEvent.description || ''),
      location: this.cleanText(rawEvent.location || ''),
      start: rawEvent.dtstart || new Date().toISOString(),
      end: rawEvent.dtend || new Date().toISOString(),
      status: this.validateStatus(rawEvent.status),
      isAllDay: this.isAllDayEvent(rawEvent),
      ageGroup,
      categories: this.extractCategories(rawEvent.description || ''),
      registrationUrl: this.extractRegistrationUrl(rawEvent.description || ''),
      isRecurring: Boolean(rawEvent.rrule)
    };
  }
  
  private validateStatus(status: string | undefined): ProcessedEvent['status'] {
    const lowerCaseStatus = status?.toLowerCase();
    if (lowerCaseStatus === 'confirmed' || lowerCaseStatus === 'cancelled' || lowerCaseStatus === 'tentative') {
      return lowerCaseStatus;
    }
    // Default to 'tentative' if status is missing or invalid, which is safer than assuming 'confirmed'.
    return 'tentative';
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
    const hasRequiredFields = !!(event.title && event.start && event.end);
    if (!hasRequiredFields) return false;
    
    try {
      return new Date(event.start) < new Date(event.end);
    } catch {
      return false;
    }
  }
  
  private cleanText(text: string): string {
    return text.trim().replace(/[<>]/g, '').replace(/\s+/g, ' ');
  }
  
  private isAllDayEvent(event: RawCalEvent): boolean {
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