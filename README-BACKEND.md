# 🔧 Backend Agent Guide - Maker Space Event Display

## 🎯 Your Role as Backend Agent

You are responsible for **data processing, calendar integration, and APIs**. Your work provides the foundation that the other agents depend on. You'll create shared interfaces, fetch calendar data, detect age groups, and ensure data quality.

## 📋 Your Phase 1 Priority Tasks (Start Here!)

### ✅ Task 1: Create Shared TypeScript Interfaces
**File**: `/shared/types.ts`
**Priority**: CRITICAL - Other agents are waiting for this!

```typescript
// /shared/types.ts - Create this file FIRST!

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

**After creating this file, post to AGENT-LOGS.md that interfaces are ready!**

### ✅ Task 2: Calendar Data Fetcher
**File**: `/lib/calendar-fetcher.ts`

```typescript
// /lib/calendar-fetcher.ts

import { ProcessedEvent, AgeGroup } from '@/shared/types';

export class GoogleCalendarFetcher {
  private calendarId: string;
  
  constructor(calendarId: string) {
    this.calendarId = calendarId;
  }
  
  async fetchEvents(startDate: Date, endDate: Date): Promise<ProcessedEvent[]> {
    try {
      // Fetch iCal data from Google Calendar public URL
      const icalUrl = `https://calendar.google.com/calendar/ical/${this.calendarId}/public/basic.ics`;
      const response = await fetch(icalUrl);
      
      if (!response.ok) {
        throw new Error(`Calendar fetch failed: ${response.status}`);
      }
      
      const icalData = await response.text();
      return this.parseICalData(icalData, startDate, endDate);
    } catch (error) {
      console.error('Calendar fetch error:', error);
      throw error;
    }
  }
  
  private parseICalData(icalData: string, startDate: Date, endDate: Date): ProcessedEvent[] {
    // Parse iCal format into events
    const events = this.parseICalContent(icalData);
    
    // Filter by date range and process each event
    return events
      .filter(event => this.isInDateRange(event, startDate, endDate))
      .map(event => this.processEvent(event))
      .filter(event => this.isValidEvent(event));
  }
  
  private processEvent(rawEvent: any): ProcessedEvent {
    return {
      id: rawEvent.uid || this.generateId(),
      title: this.cleanText(rawEvent.summary || ''),
      description: this.cleanText(rawEvent.description || ''),
      location: this.cleanText(rawEvent.location || ''),
      start: rawEvent.dtstart,
      end: rawEvent.dtend,
      status: rawEvent.status?.toLowerCase() || 'confirmed',
      isAllDay: this.isAllDayEvent(rawEvent),
      ageGroup: this.detectAgeGroup(rawEvent.description || ''),
      categories: this.extractCategories(rawEvent.description || ''),
      registrationUrl: this.extractRegistrationUrl(rawEvent.description || ''),
      isRecurring: Boolean(rawEvent.rrule)
    };
  }
  
  // Implement these helper methods...
  private parseICalContent(icalData: string): any[] { /* Implementation */ }
  private isInDateRange(event: any, start: Date, end: Date): boolean { /* Implementation */ }
  private isValidEvent(event: ProcessedEvent): boolean { /* Implementation */ }
  private cleanText(text: string): string { /* Implementation */ }
  private isAllDayEvent(event: any): boolean { /* Implementation */ }
  private generateId(): string { /* Implementation */ }
  private extractCategories(description: string): string[] { /* Implementation */ }
  private extractRegistrationUrl(description: string): string | undefined { /* Implementation */ }
}
```

### ✅ Task 3: Age Group Detection Engine
**File**: `/lib/age-group-detector.ts`

This is a **critical feature** for the display system!

```typescript
// /lib/age-group-detector.ts

import { AgeGroup } from '@/shared/types';

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
    // Test each pattern against the description
    for (const { pattern, group, emoji, label, color } of this.agePatterns) {
      if (pattern.test(description)) {
        return { group, emoji, label, color };
      }
    }
    
    // Default fallback
    return {
      group: 'unknown',
      emoji: '🤖',
      label: 'All Welcome',
      color: '#6b7280' // Gray
    };
  }
  
  // Analyze event patterns for statistics
  analyzeEvents(events: ProcessedEvent[]): Record<string, number> {
    return events.reduce((stats, event) => {
      stats[event.ageGroup.group] = (stats[event.ageGroup.group] || 0) + 1;
      return stats;
    }, {} as Record<string, number>);
  }
  
  // Suggest age group for events missing detection
  suggestAgeGroup(title: string, description: string, time: string): AgeGroup {
    const combined = `${title} ${description}`.toLowerCase();
    
    // Time-based heuristics
    const hour = new Date(time).getHours();
    
    // School hours tend to be kids events
    if (hour >= 15 && hour <= 17) { // 3-5 PM
      if (combined.includes('art') || combined.includes('craft') || combined.includes('steam')) {
        return this.agePatterns.find(p => p.group === 'elementary')!;
      }
    }
    
    // Evening events often adult
    if (hour >= 18) {
      if (combined.includes('workshop') || combined.includes('class')) {
        return this.agePatterns.find(p => p.group === 'adults')!;
      }
    }
    
    return this.detectAgeGroup(combined);
  }
}
```

### ✅ Task 4: Data Validation & Filtering
**File**: `/lib/event-validator.ts`

```typescript
// /lib/event-validator.ts

import { ProcessedEvent } from '@/shared/types';

export class EventValidator {
  validateEvent(event: ProcessedEvent): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    // Required fields
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
    
    if (start >= end) {
      errors.push('End time must be after start time');
    }
    
    // Age group validation
    if (!event.ageGroup || !event.ageGroup.group) {
      errors.push('Age group detection failed');
    }
    
    return {
      valid: errors.length === 0,
      errors
    };
  }
  
  filterEvents(events: ProcessedEvent[]): ProcessedEvent[] {
    return events.filter(event => {
      // Skip "Busy" events (private/blocked time)
      if (event.title.toLowerCase().includes('busy')) {
        return false;
      }
      
      // Skip cancelled events
      if (event.status === 'cancelled') {
        return false;
      }
      
      // Must have valid date range
      const validation = this.validateEvent(event);
      if (!validation.valid) {
        console.warn(`Filtering out invalid event: ${event.title}`, validation.errors);
        return false;
      }
      
      return true;
    });
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
      .substring(0, 500);    // Limit length
  }
}
```

## 🔄 Communication Protocol for Backend Agent

### After Each Task Completion:

Post to `AGENT-LOGS.md`:

```markdown
## [BACKEND] 2025-08-10 18:30 - [COMPLETE] Task Name

**What I Did:**
- Created /shared/types.ts with all required interfaces
- Implemented GoogleCalendarFetcher class
- Built age group detection with 95% accuracy

**Dependencies:**
- @functions-agent: Ready for you to use my interfaces and calendar fetcher
- @frontend-agent: TypeScript interfaces are ready for your components

**Next Steps:**
- Task 5: Add error handling and logging
- Task 6: Create data export utilities
- ETA: 2 hours

**Blockers:**
- None currently

---
```

## 📊 Your Complete Task List

### Phase 1: Foundation (Days 1-2)
- [ ] **Task 1**: Create `/shared/types.ts` interface definitions ⚡ CRITICAL
- [ ] **Task 2**: Implement calendar fetching (`/lib/calendar-fetcher.ts`)
- [ ] **Task 3**: Build age group detection (`/lib/age-group-detector.ts`)
- [ ] **Task 4**: Create data validation (`/lib/event-validator.ts`)

### Phase 2: Integration (Days 3-4)
- [ ] **Task 5**: Add comprehensive error handling and logging
- [ ] **Task 6**: Create helper utilities and data export functions
- [ ] **Task 7**: Write unit tests for all core functions
- [ ] **Task 8**: Document APIs for @functions-agent integration

### Phase 3: Advanced Features (Days 5-6)
- [ ] **Task 9**: Implement event categorization system
- [ ] **Task 10**: Add smart age group suggestions for edge cases
- [ ] **Task 11**: Create data analytics and reporting functions
- [ ] **Task 12**: Optimize performance for large datasets

### Phase 4: Production Ready (Days 7-8)
- [ ] **Task 13**: Final integration testing with other agents
- [ ] **Task 14**: Performance optimization and caching strategies
- [ ] **Task 15**: Create monitoring and health check utilities
- [ ] **Task 16**: Document maintenance procedures

## 🎯 Success Criteria for Backend Agent

### Technical Requirements:
- [ ] Calendar data fetches successfully from Google Calendar API
- [ ] Age group detection accuracy: 95%+ correct classification
- [ ] Event validation catches all edge cases and malformed data
- [ ] Processing handles 500+ events efficiently
- [ ] TypeScript interfaces used consistently by other agents
- [ ] Error handling gracefully manages API failures

### Integration Success:
- [ ] @functions-agent successfully uses your calendar fetcher
- [ ] @frontend-agent implements your TypeScript interfaces without issues
- [ ] No breaking changes introduced after initial interface creation
- [ ] APIs are well-documented and easy to use

## 🔧 Key Files You'll Create

```
/shared/
  └── types.ts                  # Shared interfaces (PRIORITY #1)

/lib/
  ├── calendar-fetcher.ts       # Google Calendar API integration
  ├── age-group-detector.ts     # Age group classification
  ├── event-validator.ts        # Data validation and filtering
  ├── data-processor.ts         # Main processing pipeline
  └── utils.ts                  # Helper utilities

/tests/
  ├── calendar-fetcher.test.ts
  ├── age-group-detector.test.ts
  └── event-validator.test.ts
```

## 🚨 Critical Dependencies to Provide

### For @functions-agent:
- ✅ Complete TypeScript interfaces
- ✅ Calendar fetching logic they can call from cron jobs
- ✅ Event processing pipeline
- ✅ Error handling patterns

### For @frontend-agent:
- ✅ TypeScript interfaces for all data structures
- ✅ Age group definitions with colors and emojis
- ✅ Event status logic
- ✅ Data validation rules

## 📈 Testing Your Work

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
  },
  {
    description: "Teen Game Night - Ages 12-18",
    expected: "teens"
  }
];
```

### Calendar Integration Test:
```bash
# Test calendar fetching
npm run test:calendar

# Test age group detection
npm run test:age-groups

# Test data validation
npm run test:validation
```

## 🎉 Getting Started

1. **Read the communication log first**: `cat AGENT-LOGS.md`
2. **Post your starting message** in the log file
3. **Create `/shared/types.ts` immediately** (other agents are waiting!)
4. **Work through Phase 1 tasks in order**
5. **Post updates frequently** so other agents can track your progress

Remember: You're the foundation! The @functions-agent and @frontend-agent are depending on your interfaces and logic. Quality and communication are critical! 🔧✨
