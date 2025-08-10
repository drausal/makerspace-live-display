# 🌐 Vercel Functions Agent Guide - Maker Space Event Display

## 🎯 Your Role as Vercel Functions Agent

You are responsible for **serverless functions, cron jobs, and cloud infrastructure**. You'll create the API layer that connects the backend data processing with the frontend display, manage automated data fetching, and handle deployment to Vercel.

## ⏳ Wait for Backend Agent First!

**CRITICAL**: Before starting, check `AGENT-LOGS.md` for the @backend-agent to post that `/shared/types.ts` is ready. You need their interfaces to build your APIs correctly.

## 📋 Your Phase 1 Priority Tasks (After Backend Ready)

### ✅ Task 1: Project Structure & Vercel Setup
**Files**: Vercel configuration and basic structure

```json
// vercel.json - Configure deployment and cron jobs
{
  "functions": {
    "api/cron/fetch-calendar.ts": {
      "maxDuration": 60
    }
  },
  "crons": [
    {
      "path": "/api/cron/fetch-calendar",
      "schedule": "*/15 * * * *"
    }
  ],
  "env": {
    "CALENDAR_ID": "1155c68c0f34daaf8376a26a85082e0d1d1f7b2d7c91f9be70979b5b58ede7cf@group.calendar.google.com",
    "NEXT_PUBLIC_TIME_ZONE": "America/Chicago"
  }
}
```

```typescript
// next.config.js - Next.js configuration
/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ['@vercel/kv']
  },
  env: {
    CALENDAR_ID: process.env.CALENDAR_ID,
    KV_REST_API_URL: process.env.KV_REST_API_URL,
    KV_REST_API_TOKEN: process.env.KV_REST_API_TOKEN
  }
};

module.exports = nextConfig;
```

### ✅ Task 2: Vercel KV Storage Setup
**File**: `/lib/kv-storage.ts`

```typescript
// /lib/kv-storage.ts - Vercel KV integration
import { kv } from '@vercel/kv';
import { ProcessedEvent, CalendarFetchResult, SystemHealth } from '@/shared/types';

export class KVStorage {
  // Store calendar events with TTL
  async storeEvents(events: ProcessedEvent[]): Promise<void> {
    const ttl = 60 * 20; // 20 minutes TTL
    await kv.setex('calendar:events', ttl, JSON.stringify(events));
    await kv.set('calendar:lastUpdate', new Date().toISOString());
    await kv.set('calendar:eventCount', events.length);
  }

  // Retrieve stored events
  async getEvents(): Promise<ProcessedEvent[]> {
    const eventsJson = await kv.get('calendar:events');
    if (!eventsJson) return [];
    
    try {
      return JSON.parse(eventsJson as string);
    } catch (error) {
      console.error('Error parsing stored events:', error);
      return [];
    }
  }

  // Store fetch results and errors
  async storeFetchResult(result: CalendarFetchResult): Promise<void> {
    await kv.set('calendar:lastFetchResult', JSON.stringify(result));
    
    if (!result.success) {
      // Store errors for debugging
      const errors = await this.getRecentErrors();
      errors.unshift({
        timestamp: result.lastFetch,
        errors: result.errors
      });
      
      // Keep only last 10 errors
      await kv.set('calendar:recentErrors', JSON.stringify(errors.slice(0, 10)));
    }
  }

  // Admin time override storage
  async setTimeOverride(mockTime: string | null): Promise<void> {
    if (mockTime) {
      await kv.set('admin:mockTime', mockTime);
    } else {
      await kv.del('admin:mockTime');
    }
  }

  async getTimeOverride(): Promise<string | null> {
    return await kv.get('admin:mockTime') as string | null;
  }

  // Health monitoring data
  async getSystemHealth(): Promise<SystemHealth> {
    const [lastUpdate, eventCount, recentErrors] = await Promise.all([
      kv.get('calendar:lastUpdate'),
      kv.get('calendar:eventCount'),
      this.getRecentErrors()
    ]);

    return {
      calendar: {
        lastFetch: (lastUpdate as string) || 'Never',
        eventCount: (eventCount as number) || 0,
        errors: recentErrors.flatMap(e => e.errors)
      },
      processing: {
        totalEvents: (eventCount as number) || 0,
        validEvents: (eventCount as number) || 0,
        ageGroupBreakdown: await this.getAgeGroupStats() || {}
      },
      uptime: process.uptime().toString()
    };
  }

  private async getRecentErrors(): Promise<Array<{timestamp: string, errors: string[]}>> {
    const errors = await kv.get('calendar:recentErrors');
    return errors ? JSON.parse(errors as string) : [];
  }

  private async getAgeGroupStats(): Promise<Record<string, number> | null> {
    return await kv.get('calendar:ageGroupStats') as Record<string, number> | null;
  }
}
```

### ✅ Task 3: Automated Calendar Fetching (Cron Job)
**File**: `/api/cron/fetch-calendar.ts`

This runs every 15 minutes automatically!

```typescript
// /api/cron/fetch-calendar.ts - Automated data fetching
import { NextResponse } from 'next/server';
import { GoogleCalendarFetcher } from '@/lib/calendar-fetcher';
import { EventValidator } from '@/lib/event-validator';
import { AgeGroupDetector } from '@/lib/age-group-detector';
import { KVStorage } from '@/lib/kv-storage';
import { CalendarFetchResult } from '@/shared/types';

export async function GET() {
  const startTime = Date.now();
  const storage = new KVStorage();
  
  try {
    console.log('Starting calendar fetch cron job...');
    
    // Initialize components using Backend Agent's code
    const fetcher = new GoogleCalendarFetcher(process.env.CALENDAR_ID!);
    const validator = new EventValidator();
    const ageDetector = new AgeGroupDetector();
    
    // Fetch events for next 30 days
    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + 30);
    
    // Fetch and process events
    const rawEvents = await fetcher.fetchEvents(startDate, endDate);
    console.log(`Fetched ${rawEvents.length} raw events`);
    
    // Validate and filter events
    const validEvents = validator.filterEvents(rawEvents);
    console.log(`${validEvents.length} events after filtering`);
    
    // Calculate age group statistics
    const ageGroupStats = ageDetector.analyzeEvents(validEvents);
    
    // Store in KV
    await storage.storeEvents(validEvents);
    await kv.set('calendar:ageGroupStats', JSON.stringify(ageGroupStats));
    
    // Store successful fetch result
    const result: CalendarFetchResult = {
      success: true,
      events: validEvents,
      errors: [],
      lastFetch: new Date().toISOString(),
      nextFetch: new Date(Date.now() + 15 * 60 * 1000).toISOString()
    };
    
    await storage.storeFetchResult(result);
    
    const duration = Date.now() - startTime;
    console.log(`Calendar fetch completed in ${duration}ms`);
    
    return NextResponse.json({
      success: true,
      eventsProcessed: validEvents.length,
      ageGroupBreakdown: ageGroupStats,
      duration: `${duration}ms`,
      nextFetch: result.nextFetch
    });
    
  } catch (error) {
    console.error('Calendar fetch cron job failed:', error);
    
    // Store failed fetch result
    const result: CalendarFetchResult = {
      success: false,
      events: [],
      errors: [error instanceof Error ? error.message : 'Unknown error'],
      lastFetch: new Date().toISOString()
    };
    
    await storage.storeFetchResult(result);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
```

### ✅ Task 4: Display Status API
**File**: `/api/calendar/status.ts`

This is the main API that @frontend-agent will use!

```typescript
// /api/calendar/status.ts - Main display status endpoint
import { NextRequest, NextResponse } from 'next/server';
import { KVStorage } from '@/lib/kv-storage';
import { DisplayStatus, ProcessedEvent } from '@/shared/types';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const storage = new KVStorage();
    
    // Check for admin time override
    const mockTimeParam = searchParams.get('mockTime');
    const storedMockTime = await storage.getTimeOverride();
    const mockTime = mockTimeParam || storedMockTime;
    
    // Use mock time or real time
    const currentTime = mockTime ? new Date(mockTime) : new Date();
    
    // Get events from storage
    const events = await storage.getEvents();
    
    if (events.length === 0) {
      return NextResponse.json({
        status: 'closed',
        currentTime: currentTime.toISOString(),
        mockTime: mockTime || undefined,
        message: 'No events data available'
      } as DisplayStatus);
    }
    
    // Find current and next events
    const { currentEvent, nextEvent } = findRelevantEvents(events, currentTime);
    
    if (currentEvent) {
      // Currently in an event
      const timeUntilEnd = calculateTimeUntil(currentEvent.end, currentTime);
      
      return NextResponse.json({
        status: 'current',
        currentEvent,
        nextEvent,
        currentTime: currentTime.toISOString(),
        mockTime: mockTime || undefined,
        timeUntilNext: nextEvent ? calculateTimeUntil(nextEvent.start, currentTime) : undefined,
        displayTheme: getThemeForAgeGroup(currentEvent.ageGroup.group)
      } as DisplayStatus);
      
    } else if (nextEvent) {
      // Between events
      const timeUntilNext = calculateTimeUntil(nextEvent.start, currentTime);
      
      return NextResponse.json({
        status: 'between',
        nextEvent,
        currentTime: currentTime.toISOString(),
        mockTime: mockTime || undefined,
        timeUntilNext,
        displayTheme: 'closed'
      } as DisplayStatus);
      
    } else {
      // No events today
      return NextResponse.json({
        status: 'closed',
        currentTime: currentTime.toISOString(),
        mockTime: mockTime || undefined,
        message: 'Closed - No events scheduled',
        displayTheme: 'closed'
      } as DisplayStatus);
    }
    
  } catch (error) {
    console.error('Status API error:', error);
    return NextResponse.json({
      error: 'Failed to get display status'
    }, { status: 500 });
  }
}

// Helper functions
function findRelevantEvents(events: ProcessedEvent[], currentTime: Date) {
  const now = currentTime.getTime();
  
  // Sort events by start time
  const sortedEvents = events.sort((a, b) => 
    new Date(a.start).getTime() - new Date(b.start).getTime()
  );
  
  // Find current event (started but not ended)
  const currentEvent = sortedEvents.find(event => {
    const start = new Date(event.start).getTime();
    const end = new Date(event.end).getTime();
    return start <= now && now < end;
  });
  
  // Find next event (starts after now)
  const nextEvent = sortedEvents.find(event => {
    const start = new Date(event.start).getTime();
    return start > now;
  });
  
  return { currentEvent, nextEvent };
}

function calculateTimeUntil(targetTime: string, fromTime: Date): string {
  const target = new Date(targetTime);
  const diff = target.getTime() - fromTime.getTime();
  
  if (diff <= 0) return '0 minutes';
  
  const minutes = Math.floor(diff / (1000 * 60));
  const hours = Math.floor(minutes / 60);
  
  if (hours > 0) {
    const remainingMinutes = minutes % 60;
    return `${hours}h ${remainingMinutes}m`;
  } else {
    return `${minutes} minutes`;
  }
}

function getThemeForAgeGroup(group: string): string {
  const themes = {
    adults: 'blue',
    elementary: 'green', 
    allages: 'purple',
    teens: 'orange',
    unknown: 'gray'
  };
  return themes[group as keyof typeof themes] || 'gray';
}
```

### ✅ Task 5: Admin API Endpoints
**File**: `/api/admin/time-override.ts`

```typescript
// /api/admin/time-override.ts - Admin panel time controls
import { NextRequest, NextResponse } from 'next/server';
import { KVStorage } from '@/lib/kv-storage';

export async function POST(request: NextRequest) {
  try {
    const { mockTime } = await request.json();
    const storage = new KVStorage();
    
    // Validate mockTime if provided
    if (mockTime && isNaN(new Date(mockTime).getTime())) {
      return NextResponse.json({
        success: false,
        error: 'Invalid date format'
      }, { status: 400 });
    }
    
    await storage.setTimeOverride(mockTime);
    
    return NextResponse.json({
      success: true,
      mockTime: mockTime || null,
      message: mockTime ? 'Time override set' : 'Time override cleared'
    });
    
  } catch (error) {
    console.error('Time override error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to set time override'
    }, { status: 500 });
  }
}

export async function GET() {
  try {
    const storage = new KVStorage();
    const mockTime = await storage.getTimeOverride();
    
    return NextResponse.json({
      mockTime: mockTime || null,
      isActive: Boolean(mockTime)
    });
    
  } catch (error) {
    console.error('Get time override error:', error);
    return NextResponse.json({
      error: 'Failed to get time override'
    }, { status: 500 });
  }
}
```

## 🔄 Communication Protocol for Functions Agent

### After Each Task Completion:

Post to `AGENT-LOGS.md`:

```markdown
## [FUNCTIONS] 2025-08-10 19:15 - [COMPLETE] Cron Job Implementation

**What I Did:**
- Created /api/cron/fetch-calendar.ts with 15-minute automation
- Set up Vercel KV storage integration
- Built /api/calendar/status endpoint for @frontend-agent
- Configured vercel.json with cron scheduling

**Dependencies:**
- @backend-agent: Successfully using your calendar fetcher and interfaces ✅
- @frontend-agent: API endpoints ready at /api/calendar/status and /api/admin/time-override

**Next Steps:**
- Task 6: Health monitoring API
- Task 7: Error handling and logging
- ETA: 3 hours

**Blockers:**
- Need Vercel KV credentials for deployment

---
```

## 📊 Your Complete Task List

### Phase 1: Core Infrastructure (Days 1-2)
- [ ] **Task 1**: Project structure and Vercel configuration
- [ ] **Task 2**: Vercel KV storage integration
- [ ] **Task 3**: Automated calendar fetching cron job ⚡ CRITICAL
- [ ] **Task 4**: Display status API endpoint ⚡ CRITICAL  
- [ ] **Task 5**: Admin API for time overrides

### Phase 2: Enhanced APIs (Days 3-4)  
- [ ] **Task 6**: Health monitoring and system status APIs
- [ ] **Task 7**: Error handling and logging infrastructure
- [ ] **Task 8**: Performance monitoring and metrics
- [ ] **Task 9**: API rate limiting and security

### Phase 3: Production Features (Days 5-6)
- [ ] **Task 10**: Emergency override system
- [ ] **Task 11**: Backup and recovery mechanisms
- [ ] **Task 12**: Advanced caching strategies
- [ ] **Task 13**: Monitoring alerts and notifications

### Phase 4: Deployment Ready (Days 7-8)
- [ ] **Task 14**: Production deployment and testing
- [ ] **Task 15**: Environment configuration management
- [ ] **Task 16**: Documentation and monitoring setup

## 🔧 Key API Endpoints You'll Create

```
GET  /api/calendar/status?mockTime=2025-01-01T12:00:00Z
     → Returns DisplayStatus for @frontend-agent

GET  /api/calendar/events?start=2025-01-01&end=2025-01-02  
     → Returns ProcessedEvent[] array

POST /api/admin/time-override
     → Body: { mockTime: string | null }
     → For admin panel testing

GET  /api/admin/time-override
     → Returns current time override

GET  /api/health
     → Returns SystemHealth status

GET  /api/cron/fetch-calendar
     → Automated every 15 minutes via Vercel cron
```

## 🚨 Critical Dependencies You Provide

### For @frontend-agent:
- ✅ `/api/calendar/status` - Main display data source
- ✅ `/api/admin/time-override` - Admin panel functionality
- ✅ `/api/health` - System status monitoring
- ✅ Real-time data updates via automated cron jobs

### Integration Points:
- ✅ Uses @backend-agent's calendar fetcher and validation
- ✅ Provides @frontend-agent with REST APIs
- ✅ Manages all data storage and caching
- ✅ Handles automated background tasks

## 📈 Testing Your APIs

### Test the Status Endpoint:
```bash
# Test current status
curl "https://your-app.vercel.app/api/calendar/status"

# Test with time override
curl "https://your-app.vercel.app/api/calendar/status?mockTime=2025-05-08T19:30:00Z"
```

### Test Admin Endpoints:
```bash
# Set time override
curl -X POST "https://your-app.vercel.app/api/admin/time-override" \
  -H "Content-Type: application/json" \
  -d '{"mockTime": "2025-05-01T14:00:00Z"}'

# Clear time override  
curl -X POST "https://your-app.vercel.app/api/admin/time-override" \
  -H "Content-Type: application/json" \
  -d '{"mockTime": null}'
```

### Test Cron Job Manually:
```bash
# Trigger calendar fetch manually
curl "https://your-app.vercel.app/api/cron/fetch-calendar"
```

## 🎯 Success Criteria for Functions Agent

### Technical Requirements:
- [ ] Cron job runs every 15 minutes without failures
- [ ] API endpoints return data in \u003c 500ms average
- [ ] Vercel KV storage handles 1000+ events efficiently
- [ ] Time override functionality works perfectly for admin testing
- [ ] Error handling gracefully manages all failure scenarios
- [ ] Health monitoring provides actionable insights

### Integration Success:
- [ ] @frontend-agent can successfully consume all your APIs
- [ ] @backend-agent's logic integrates seamlessly with your cron jobs
- [ ] No data loss or corruption in KV storage
- [ ] Production deployment works reliably on Vercel

## 🌐 Environment Variables You'll Configure

```env
# Calendar Configuration
CALENDAR_ID=1155c68c0f34daaf8376a26a85082e0d1d1f7b2d7c91f9be70979b5b58ede7cf@group.calendar.google.com

# Vercel KV Storage
KV_REST_API_URL=https://your-kv-store.vercel-storage.com
KV_REST_API_TOKEN=your-vercel-kv-token

# Admin Settings  
ADMIN_PASSWORD=makerspace2024

# Timezone
NEXT_PUBLIC_TIME_ZONE=America/Chicago
```

## 🎉 Getting Started

1. **Wait for @backend-agent**: Check `AGENT-LOGS.md` for interfaces to be ready
2. **Read the communication log**: `cat AGENT-LOGS.md | grep BACKEND`
3. **Post your starting message** indicating you're ready to build APIs
4. **Set up Vercel KV storage** credentials first
5. **Build cron job and status API** as highest priority (Frontend is waiting!)
6. **Test integration** with Backend's calendar fetcher
7. **Post frequent updates** so Frontend knows when APIs are ready

You're the critical bridge between data and display! Your APIs enable the entire system. 🌐⚡
