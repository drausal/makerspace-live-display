# 🔧 Backend Agent Prompt

## Your Role
You are the **Backend Agent** responsible for:
1. **Data Foundation** - Create shared TypeScript interfaces that all other agents will use
2. **Calendar Integration** - Fetch and parse Google Calendar data using iCal format
3. **Age Group Detection** - Intelligent classification of events by target audience
4. **Data Processing** - Validation, filtering, and sanitization of event data
5. **API Logic** - Core business logic that Functions Agent will expose as APIs

## Critical First Step - Wait for Manager!

**BEFORE YOU START:** Check AGENT-LOGS.md for @manager-agent to post the project initialization completion message. You need:
- ✅ Next.js project created and pushed to GitHub
- ✅ Project folder structure set up
- ✅ Dependencies installed
- ✅ Documentation files copied to new project

## Your Phase 1 Priority Tasks (Start Immediately After Manager)

### ✅ Task 1: Create Shared TypeScript Interfaces (CRITICAL!)
**Location:** `shared/types.ts`
**Priority:** URGENT - Other agents are waiting for this!

```typescript
// shared/types.ts - CREATE THIS FILE FIRST!
export interface ProcessedEvent {
  id: string;
  title: string;
  description: string;
  location: string;
  start: string; // ISO string format
  end: string;   // ISO string format
  status: 'confirmed' | 'cancelled' | 'tentative';
  isAllDay: boolean;
  ageGroup: AgeGroup;
  categories: string[];
  registrationUrl?: string;
  isRecurring: boolean;
}

export interface AgeGroup {
  group: 'adults' | 'elementary' | 'allages' | 'teens' | 'unknown';
  emoji: string;
  label: string;
  color: string; // CSS color for Frontend theming
}

export interface DisplayStatus {
  status: 'current' | 'between' | 'closed';
  currentEvent?: ProcessedEvent;
  nextEvent?: ProcessedEvent;
  currentTime: string;
  mockTime?: string; // For admin time override
  timeUntilNext?: string;
  displayTheme?: string;
}

export interface CalendarFetchResult {
  success: boolean;
  events: ProcessedEvent[];
  errors: string[];
  lastFetch: string;
  nextFetch?: string;
}

export interface SystemHealth {
  calendar: {
    lastFetch: string;
    eventCount: number;
    errors: string[];
  };
  processing: {
    totalEvents: number;
    validEvents: number;
    ageGroupBreakdown: Record<string, number>;
  };
  uptime: string;
}
```

**After creating this file, IMMEDIATELY post to AGENT-LOGS.md:**
```markdown
## [BACKEND] 2025-08-10 18:45 - [COMPLETE] Shared TypeScript Interfaces

**What I Did:**
- ✅ Created shared/types.ts with all core interfaces
- ✅ Defined ProcessedEvent, AgeGroup, DisplayStatus interfaces
- ✅ Added CalendarFetchResult and SystemHealth types
- ✅ Ready for other agents to import and use

**Dependencies:**
- @functions-agent: ✅ Ready to use these interfaces for your APIs
- @frontend-agent: ✅ Ready to use these interfaces for your components

**Next Steps:**
- Task 2: Google Calendar fetcher implementation
- Task 3: Age group detection engine
- ETA: 4 hours

**Files Created:**
- shared/types.ts (5 interfaces, fully typed)

---
```

### ✅ Task 2: Google Calendar Fetcher
**Location:** `lib/calendar-fetcher.ts`

Create a class that fetches iCal data from Google Calendar:

```typescript
// lib/calendar-fetcher.ts
import { ProcessedEvent } from '@/shared/types';
import { AgeGroupDetector } from './age-group-detector';

export class GoogleCalendarFetcher {
  private calendarId: string;
  private ageDetector: AgeGroupDetector;
  
  constructor(calendarId: string) {
    this.calendarId = calendarId;
    this.ageDetector = new AgeGroupDetector();
  }
  
  async fetchEvents(startDate: Date, endDate: Date): Promise<ProcessedEvent[]> {
    try {
      // Fetch iCal data from Google Calendar public URL
      const icalUrl = `https://calendar.google.com/calendar/ical/${this.calendarId}/public/basic.ics`;
      
      console.log(`Fetching calendar data from: ${icalUrl}`);
      const response = await fetch(icalUrl);
      
      if (!response.ok) {
        throw new Error(`Calendar fetch failed: ${response.status} ${response.statusText}`);
      }
      
      const icalData = await response.text();
      console.log(`Received ${icalData.length} characters of iCal data`);
      
      return this.parseICalData(icalData, startDate, endDate);
    } catch (error) {
      console.error('Calendar fetch error:', error);
      throw new Error(`Failed to fetch calendar: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
  
  private parseICalData(icalData: string, startDate: Date, endDate: Date): ProcessedEvent[] {
    console.log('Parsing iCal data...');
    
    // Parse iCal format into raw events
    const rawEvents = this.parseICalContent(icalData);
    console.log(`Parsed ${rawEvents.length} raw events`);
    
    // Filter by date range and process each event
    const processedEvents = rawEvents
      .filter(event => this.isInDateRange(event, startDate, endDate))
      .map(event => this.processEvent(event))
      .filter(event => this.isValidEvent(event));
      
    console.log(`${processedEvents.length} events after processing and validation`);
    return processedEvents;
  }
  
  // Implement the core parsing logic here...
  private parseICalContent(icalData: string): any[] {
    const events: any[] = [];
    const lines = icalData.split('\n');
    let currentEvent: any = null;
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      if (line === 'BEGIN:VEVENT') {
        currentEvent = {};
      } else if (line === 'END:VEVENT' && currentEvent) {
        events.push(currentEvent);
        currentEvent = null;
      } else if (currentEvent && line.includes(':')) {
        const [key, ...valueParts] = line.split(':');
        const value = valueParts.join(':');
        
        // Handle common iCal fields
        switch (key) {
          case 'SUMMARY':
            currentEvent.summary = this.decodeICalValue(value);
            break;
          case 'DESCRIPTION':
            currentEvent.description = this.decodeICalValue(value);
            break;
          case 'LOCATION':
            currentEvent.location = this.decodeICalValue(value);
            break;
          case 'DTSTART':
            currentEvent.dtstart = this.parseICalDateTime(value);
            break;
          case 'DTEND':
            currentEvent.dtend = this.parseICalDateTime(value);
            break;
          case 'UID':
            currentEvent.uid = value;
            break;
          case 'STATUS':
            currentEvent.status = value.toLowerCase();
            break;
        }
      }
    }
    
    return events;
  }
  
  private processEvent(rawEvent: any): ProcessedEvent {
    const ageGroup = this.ageDetector.detectAgeGroup(rawEvent.description || '');
    
    return {
      id: rawEvent.uid || this.generateId(),
      title: this.cleanText(rawEvent.summary || ''),
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
  
  // Helper methods
  private decodeICalValue(value: string): string {
    return value
      .replace(/\\n/g, '\n')
      .replace(/\\,/g, ',')
      .replace(/\\;/g, ';')
      .replace(/\\\\/g, '\\');
  }
  
  private parseICalDateTime(value: string): string {
    // Handle various iCal date formats
    if (value.includes('T')) {
      // DateTime format: 20250101T120000Z or 20250101T120000
      const cleanValue = value.replace(/[^0-9T]/g, '');
      if (cleanValue.length >= 15) {
        const year = cleanValue.substring(0, 4);
        const month = cleanValue.substring(4, 6);
        const day = cleanValue.substring(6, 8);
        const hour = cleanValue.substring(9, 11);
        const minute = cleanValue.substring(11, 13);
        const second = cleanValue.substring(13, 15);
        return `${year}-${month}-${day}T${hour}:${minute}:${second}Z`;
      }
    } else {
      // Date only format: 20250101
      if (value.length >= 8) {
        const year = value.substring(0, 4);
        const month = value.substring(4, 6);
        const day = value.substring(6, 8);
        return `${year}-${month}-${day}T00:00:00Z`;
      }
    }
    
    // Fallback to current time if parsing fails
    return new Date().toISOString();
  }
  
  private isInDateRange(event: any, startDate: Date, endDate: Date): boolean {
    if (!event.dtstart) return false;
    
    const eventStart = new Date(event.dtstart);
    return eventStart >= startDate && eventStart <= endDate;
  }
  
  private isValidEvent(event: ProcessedEvent): boolean {
    return Boolean(
      event.title &&
      event.start &&
      event.end &&
      new Date(event.start).getTime() < new Date(event.end).getTime()
    );
  }
  
  private cleanText(text: string): string {
    if (!text) return '';
    
    return text
      .trim()
      .replace(/[<>]/g, '') // Remove potential HTML
      .replace(/\s+/g, ' ')  // Normalize whitespace
      .substring(0, 500);    // Limit length
  }
  
  private isAllDayEvent(event: any): boolean {
    // Check if the event spans entire day(s)
    if (!event.dtstart || !event.dtend) return false;
    
    const start = new Date(event.dtstart);
    const end = new Date(event.dtend);
    
    // All-day events typically start at 00:00 and have 24-hour duration
    return start.getHours() === 0 && start.getMinutes() === 0 &&
           (end.getTime() - start.getTime()) % (24 * 60 * 60 * 1000) === 0;
  }
  
  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }
  
  private extractCategories(description: string): string[] {
    const categories: string[] = [];
    
    // Look for category keywords
    if (/art|paint|draw|craft/i.test(description)) categories.push('Arts');
    if (/3d|print|tech|robot|stem|steam/i.test(description)) categories.push('Technology');  
    if (/workshop|class|learn/i.test(description)) categories.push('Workshop');
    if (/open|studio/i.test(description)) categories.push('Open Studio');
    
    return categories;
  }
  
  private extractRegistrationUrl(description: string): string | undefined {
    const urlMatch = description.match(/https?:\/\/[^\s]+/);
    return urlMatch ? urlMatch[0] : undefined;
  }
}
```

### ✅ Task 3: Age Group Detection Engine
**Location:** `lib/age-group-detector.ts`

This is the **critical feature** for the display system:

```typescript
// lib/age-group-detector.ts
import { AgeGroup, ProcessedEvent } from '@/shared/types';

export class AgeGroupDetector {
  private agePatterns = [
    {
      pattern: /Adults?\s*\(19\+?\s*and\s*up\)|Adults?\s*\(19\s*and\s*up\)|Adult.*(?:19|only)/i,
      group: 'adults' as const,
      emoji: '🧑',
      label: 'Adults (19+)',
      color: '#1e40af' // Blue
    },
    {
      pattern: /Elementary.*\(6[-\s]*11\s*years?\)|Ages?\s*6[-\s]*11|Kids?\s*6[-\s]*11/i,
      group: 'elementary' as const,
      emoji: '👶',
      label: 'Kids (6-11)',
      color: '#059669' // Green
    },
    {
      pattern: /All\s*Ages?|Family.*Friendly|Intergenerational|Everyone.*Welcome/i,
      group: 'allages' as const,
      emoji: '👪',
      label: 'All Ages',
      color: '#7c3aed' // Purple
    },
    {
      pattern: /Teen?s?\s*\(1[2-8][-\s]*1[8-9]\)|Middle.*School|High.*School/i,
      group: 'teens' as const,
      emoji: '🧒',
      label: 'Teens (12-18)',
      color: '#ea580c' // Orange
    }
  ];
  
  detectAgeGroup(description: string): AgeGroup {
    console.log(`Detecting age group for: "${description.substring(0, 100)}..."`);
    
    // Test each pattern against the description
    for (const { pattern, group, emoji, label, color } of this.agePatterns) {
      if (pattern.test(description)) {
        console.log(`✅ Matched age group: ${group}`);
        return { group, emoji, label, color };
      }
    }
    
    // Default fallback
    console.log('⚠️ No age group pattern matched, using unknown');
    return {
      group: 'unknown',
      emoji: '🤖',
      label: 'All Welcome',
      color: '#6b7280' // Gray
    };
  }
  
  // Analyze event patterns for statistics
  analyzeEvents(events: ProcessedEvent[]): Record<string, number> {
    const stats = events.reduce((acc, event) => {
      acc[event.ageGroup.group] = (acc[event.ageGroup.group] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    console.log('Age group statistics:', stats);
    return stats;
  }
  
  // Get age group by name (utility for other agents)
  getAgeGroupByName(groupName: string): AgeGroup | null {
    const pattern = this.agePatterns.find(p => p.group === groupName);
    if (pattern) {
      const { group, emoji, label, color } = pattern;
      return { group, emoji, label, color };
    }
    return null;
  }
  
  // Get all available age groups (for frontend dropdowns, etc.)
  getAllAgeGroups(): AgeGroup[] {
    return this.agePatterns.map(({ group, emoji, label, color }) => ({
      group, emoji, label, color
    }));
  }
}
```

### ✅ Task 4: Event Validator
**Location:** `lib/event-validator.ts`

```typescript
// lib/event-validator.ts
import { ProcessedEvent } from '@/shared/types';

export class EventValidator {
  validateEvent(event: ProcessedEvent): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    // Required fields validation
    if (!event.title?.trim()) {
      errors.push('Title is required');
    }
    
    if (!event.start) {
      errors.push('Start time is required');
    }
    
    if (!event.end) {
      errors.push('End time is required');
    }
    
    // Date validation
    const start = new Date(event.start);
    const end = new Date(event.end);
    
    if (isNaN(start.getTime())) {
      errors.push('Invalid start time format');
    }
    
    if (isNaN(end.getTime())) {
      errors.push('Invalid end time format');
    }
    
    if (start.getTime() >= end.getTime()) {
      errors.push('End time must be after start time');
    }
    
    // Age group validation
    if (!event.ageGroup || !event.ageGroup.group) {
      errors.push('Age group detection failed');
    }
    
    // Title validation (skip "Busy" events)
    if (event.title.toLowerCase().includes('busy')) {
      errors.push('Busy events should be filtered out');
    }
    
    return {
      valid: errors.length === 0,
      errors
    };
  }
  
  filterEvents(events: ProcessedEvent[]): ProcessedEvent[] {
    console.log(`Filtering ${events.length} events...`);
    
    const filtered = events.filter(event => {
      // Skip "Busy" events (private/blocked time)
      if (event.title.toLowerCase().includes('busy')) {
        console.log(`❌ Filtered out busy event: ${event.title}`);
        return false;
      }
      
      // Skip cancelled events
      if (event.status === 'cancelled') {
        console.log(`❌ Filtered out cancelled event: ${event.title}`);
        return false;
      }
      
      // Validate event structure
      const validation = this.validateEvent(event);
      if (!validation.valid) {
        console.log(`❌ Filtered out invalid event: ${event.title}`, validation.errors);
        return false;
      }
      
      console.log(`✅ Event passed validation: ${event.title}`);
      return true;
    });
    
    console.log(`${filtered.length} events after filtering`);
    return filtered;
  }
  
  sanitizeEvent(event: ProcessedEvent): ProcessedEvent {
    return {
      ...event,
      title: this.sanitizeText(event.title),
      description: this.sanitizeText(event.description),
      location: this.sanitizeText(event.location)
    };
  }
  
  private sanitizeText(text: string): string {
    if (!text) return '';
    
    return text
      .trim()
      .replace(/[<>]/g, '') // Remove potential HTML
      .replace(/\s+/g, ' ')  // Normalize whitespace
      .replace(/[^\x20-\x7E\n\r]/g, '') // Remove non-printable chars
      .substring(0, 500);    // Limit length
  }
}
```

## Your Communication Protocol

After completing **each task**, post this message format to AGENT-LOGS.md:

```markdown
## [BACKEND] YYYY-MM-DD HH:MM - [STATUS] Task Name

**What I Did:**
- Specific files created or modified
- Key functionality implemented
- Testing completed

**Dependencies:**
- @functions-agent: What's ready for you to use
- @frontend-agent: What interfaces/logic you can consume

**Next Steps:**
- Your next priority tasks
- Estimated completion time

**Integration Notes:**
- How other agents should use your code
- Any breaking changes or important updates

**Testing Results:**
- What you tested and results
- Any issues discovered and resolved

---
```

## Your Complete Task Timeline

### Phase 1: Foundation (Days 1-2)
- [x] **Task 1**: Shared TypeScript interfaces ⚡ CRITICAL
- [ ] **Task 2**: Google Calendar fetcher
- [ ] **Task 3**: Age group detection engine  
- [ ] **Task 4**: Event validator and sanitizer

### Phase 2: Integration Support (Days 3-4)
- [ ] **Task 5**: Helper utilities and data processors
- [ ] **Task 6**: Error handling and logging systems
- [ ] **Task 7**: Unit tests for all core functions
- [ ] **Task 8**: Integration testing with sample data

### Phase 3: Advanced Features (Days 5-6)
- [ ] **Task 9**: Smart categorization system
- [ ] **Task 10**: Performance optimization for large datasets
- [ ] **Task 11**: Data analytics and reporting functions
- [ ] **Task 12**: Advanced age group suggestions

### Phase 4: Production Ready (Days 7-8)
- [ ] **Task 13**: Production testing with real calendar data
- [ ] **Task 14**: Error recovery and resilience features
- [ ] **Task 15**: Documentation and API guides
- [ ] **Task 16**: Final integration support for other agents

## Testing Your Work

### Test Calendar Data Fetching:
```bash
# Create test file
echo 'import { GoogleCalendarFetcher } from "./lib/calendar-fetcher.ts";

const fetcher = new GoogleCalendarFetcher(process.env.CALENDAR_ID!);
const startDate = new Date();
const endDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

fetcher.fetchEvents(startDate, endDate)
  .then(events => {
    console.log(`Fetched ${events.length} events`);
    console.log("Age group breakdown:");
    const stats = {};
    events.forEach(e => {
      stats[e.ageGroup.group] = (stats[e.ageGroup.group] || 0) + 1;
    });
    console.table(stats);
  })
  .catch(console.error);' > test-calendar.ts

# Run test
npx tsx test-calendar.ts
```

### Age Group Detection Test Cases:
```typescript
const testCases = [
  {
    description: "Open Studio - Adults (19 and up) only",
    expected: "adults"
  },
  {
    description: "After School Art Club - Elementary (6-11 years)",
    expected: "elementary"  
  },
  {
    description: "Family 3D Printing Workshop - All Ages",
    expected: "allages"
  }
];

// Test each case and log results
```

## Critical Success Factors

### For Other Agents:
- **@functions-agent** needs your calendar fetcher to work in their cron job
- **@frontend-agent** needs your TypeScript interfaces for their components
- **Both agents** need clean, well-documented APIs from your code

### Technical Requirements:
- [ ] Calendar data fetches successfully from Google Calendar
- [ ] Age group detection accuracy: 95%+ 
- [ ] Event validation catches malformed data
- [ ] Processing handles 500+ events efficiently
- [ ] All interfaces are properly typed and documented

Remember: You're the foundation! The other agents depend on your data structures and logic. Focus on quality, thorough testing, and clear documentation.

**Start with Task 1 (shared interfaces) immediately after Manager completes project setup!** 🔧

---

Post in AGENT-LOGS.md when you begin work and after each completed task!
