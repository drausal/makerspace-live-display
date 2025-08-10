# 🌐 Functions Agent Prompt

## Your Role
You are the **Functions Agent** responsible for:
1. **Serverless APIs** - Create Next.js API routes that power the display system
2. **Automated Scheduling** - Set up cron jobs to fetch calendar data every 15 minutes
3. **Data Storage** - Manage Vercel KV storage for caching events and system state
4. **Admin Endpoints** - Build APIs for time override testing and system management
5. **Production Deployment** - Configure Vercel deployment and monitoring

## Critical Dependencies - Wait for Backend Agent!

**BEFORE YOU START:** Check AGENT-LOGS.md for these completed messages:
1. **@manager-agent** - Project initialization and GitHub repository ready
2. **@backend-agent** - Shared TypeScript interfaces created in `shared/types.ts`

You MUST have Backend Agent's interfaces and logic before building your APIs!

## Your Phase 1 Priority Tasks (After Backend Ready)

### ✅ Task 1: Vercel Configuration & KV Setup
**Location:** Root directory files

**Create `vercel.json`:**
```json
{
  "functions": {
    "app/api/cron/fetch-calendar/route.ts": {
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
    "CALENDAR_ID": "@calendar_id",
    "NEXT_PUBLIC_TIME_ZONE": "America/Chicago",
    "KV_REST_API_URL": "@kv_rest_api_url",
    "KV_REST_API_TOKEN": "@kv_rest_api_token"
  }
}
```

**Update `next.config.js`:**
```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ['@vercel/kv']
  },
  env: {
    CALENDAR_ID: process.env.CALENDAR_ID,
    KV_REST_API_URL: process.env.KV_REST_API_URL,
    KV_REST_API_TOKEN: process.env.KV_REST_API_TOKEN,
    ADMIN_PASSWORD: process.env.ADMIN_PASSWORD
  }
};

module.exports = nextConfig;
```

**Create `lib/kv-storage.ts`:**
```typescript
// lib/kv-storage.ts - Vercel KV integration
import { kv } from '@vercel/kv';
import { ProcessedEvent, CalendarFetchResult, SystemHealth } from '@/shared/types';

export class KVStorage {
  // Store calendar events with TTL
  async storeEvents(events: ProcessedEvent[]): Promise<void> {
    const ttl = 60 * 20; // 20 minutes TTL
    await kv.setex('calendar:events', ttl, JSON.stringify(events));
    await kv.set('calendar:lastUpdate', new Date().toISOString());
    await kv.set('calendar:eventCount', events.length);
    
    console.log(`📦 Stored ${events.length} events in KV with ${ttl}s TTL`);
  }

  // Retrieve stored events
  async getEvents(): Promise<ProcessedEvent[]> {
    const eventsJson = await kv.get('calendar:events');
    if (!eventsJson) {
      console.log('📦 No events found in KV storage');
      return [];
    }
    
    try {
      const events = JSON.parse(eventsJson as string);
      console.log(`📦 Retrieved ${events.length} events from KV`);
      return events;
    } catch (error) {
      console.error('📦 Error parsing stored events:', error);
      return [];
    }
  }

  // Store fetch results and errors for debugging
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
      console.log(`🚨 Stored fetch errors: ${result.errors.join(', ')}`);
    }
  }

  // Admin time override storage
  async setTimeOverride(mockTime: string | null): Promise<void> {
    if (mockTime) {
      await kv.set('admin:mockTime', mockTime);
      console.log(`⏰ Time override set: ${mockTime}`);
    } else {
      await kv.del('admin:mockTime');
      console.log(`⏰ Time override cleared`);
    }
  }

  async getTimeOverride(): Promise<string | null> {
    const mockTime = await kv.get('admin:mockTime') as string | null;
    if (mockTime) {
      console.log(`⏰ Active time override: ${mockTime}`);
    }
    return mockTime;
  }

  // Store age group statistics
  async storeAgeGroupStats(stats: Record<string, number>): Promise<void> {
    await kv.set('calendar:ageGroupStats', JSON.stringify(stats));
    console.log('📊 Stored age group statistics:', stats);
  }

  async getAgeGroupStats(): Promise<Record<string, number>> {
    const stats = await kv.get('calendar:ageGroupStats');
    return stats ? JSON.parse(stats as string) : {};
  }

  // Health monitoring data
  async getSystemHealth(): Promise<SystemHealth> {
    const [lastUpdate, eventCount, recentErrors, ageGroupStats] = await Promise.all([
      kv.get('calendar:lastUpdate'),
      kv.get('calendar:eventCount'),
      this.getRecentErrors(),
      this.getAgeGroupStats()
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
        ageGroupBreakdown: ageGroupStats
      },
      uptime: process.uptime().toString()
    };
  }

  private async getRecentErrors(): Promise<Array<{timestamp: string, errors: string[]}>> {
    const errors = await kv.get('calendar:recentErrors');
    return errors ? JSON.parse(errors as string) : [];
  }
}
```

### ✅ Task 2: Calendar Fetch Cron Job (CRITICAL!)
**Location:** `app/api/cron/fetch-calendar/route.ts`

This runs automatically every 15 minutes and powers the entire system!

```typescript
// app/api/cron/fetch-calendar/route.ts
import { NextResponse } from 'next/server';
import { GoogleCalendarFetcher } from '@/lib/calendar-fetcher';
import { EventValidator } from '@/lib/event-validator';
import { AgeGroupDetector } from '@/lib/age-group-detector';
import { KVStorage } from '@/lib/kv-storage';
import { CalendarFetchResult } from '@/shared/types';

export async function GET() {
  const startTime = Date.now();
  const storage = new KVStorage();
  
  console.log('🚀 Starting calendar fetch cron job...');
  
  try {
    // Verify environment variables
    const calendarId = process.env.CALENDAR_ID;
    if (!calendarId) {
      throw new Error('CALENDAR_ID environment variable not set');
    }

    // Initialize Backend Agent's components
    const fetcher = new GoogleCalendarFetcher(calendarId);
    const validator = new EventValidator();
    const ageDetector = new AgeGroupDetector();
    
    console.log(`📅 Using calendar ID: ${calendarId}`);
    
    // Fetch events for next 30 days
    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + 30);
    
    console.log(`📅 Fetching events from ${startDate.toISOString()} to ${endDate.toISOString()}`);
    
    // Fetch raw events from Backend Agent
    const rawEvents = await fetcher.fetchEvents(startDate, endDate);
    console.log(`📥 Fetched ${rawEvents.length} raw events from calendar`);
    
    // Validate and filter events using Backend Agent logic
    const validEvents = validator.filterEvents(rawEvents);
    console.log(`✅ ${validEvents.length} events passed validation and filtering`);
    
    // Calculate age group statistics using Backend Agent detector
    const ageGroupStats = ageDetector.analyzeEvents(validEvents);
    console.log(`📊 Age group breakdown:`, ageGroupStats);
    
    // Store everything in KV
    await storage.storeEvents(validEvents);
    await storage.storeAgeGroupStats(ageGroupStats);
    
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
    console.log(`✅ Calendar fetch completed successfully in ${duration}ms`);
    
    return NextResponse.json({
      success: true,
      eventsProcessed: validEvents.length,
      ageGroupBreakdown: ageGroupStats,
      duration: `${duration}ms`,
      nextFetch: result.nextFetch,
      message: `Processed ${validEvents.length} events successfully`
    });
    
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error('❌ Calendar fetch cron job failed:', error);
    
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
      error: error instanceof Error ? error.message : 'Unknown error',
      duration: `${duration}ms`,
      message: 'Calendar fetch failed - check logs'
    }, { status: 500 });
  }
}
```

**After creating this, IMMEDIATELY post to AGENT-LOGS.md:**
```markdown
## [FUNCTIONS] 2025-08-10 19:30 - [COMPLETE] Calendar Fetch Cron Job

**What I Did:**
- ✅ Created automated cron job at /api/cron/fetch-calendar
- ✅ Integrated with @backend-agent's calendar fetcher and validators
- ✅ Set up Vercel KV storage with proper error handling
- ✅ Configured 15-minute automatic scheduling in vercel.json

**Dependencies:**
- @backend-agent: ✅ Successfully using your calendar fetcher, validator, and age detector
- @frontend-agent: Data pipeline is ready - events will be available via storage

**Next Steps:**
- Task 3: Display Status API (critical for frontend)
- Task 4: Admin time override endpoints
- ETA: 3 hours

**Integration Notes:**
- Cron job runs every 15 minutes automatically
- Events stored in KV with 20-minute TTL
- Age group statistics calculated and cached
- Error logging and recovery implemented

---
```

### ✅ Task 3: Display Status API (CRITICAL for Frontend!)
**Location:** `app/api/calendar/status/route.ts`

This is the main API that Frontend Agent will consume!

```typescript
// app/api/calendar/status/route.ts - Main display status endpoint
import { NextRequest, NextResponse } from 'next/server';
import { KVStorage } from '@/lib/kv-storage';
import { DisplayStatus, ProcessedEvent } from '@/shared/types';

export async function GET(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    const { searchParams } = new URL(request.url);
    const storage = new KVStorage();
    
    console.log('📺 Display status API called');
    
    // Check for admin time override
    const mockTimeParam = searchParams.get('mockTime');
    const storedMockTime = await storage.getTimeOverride();
    const mockTime = mockTimeParam || storedMockTime;
    
    // Use mock time or real time
    const currentTime = mockTime ? new Date(mockTime) : new Date();
    console.log(`⏰ Using time: ${currentTime.toISOString()} ${mockTime ? '(MOCK)' : '(REAL)'}`);
    
    // Get events from storage
    const events = await storage.getEvents();
    
    if (events.length === 0) {
      console.log('📺 No events available - returning closed status');
      return NextResponse.json({
        status: 'closed',
        currentTime: currentTime.toISOString(),
        mockTime: mockTime || undefined,
        message: 'No events data available - calendar may be loading'
      } as DisplayStatus);
    }
    
    console.log(`📺 Processing ${events.length} events for display status`);
    
    // Find current and next events
    const { currentEvent, nextEvent } = findRelevantEvents(events, currentTime);
    
    if (currentEvent) {
      // Currently in an event
      const timeUntilEnd = calculateTimeUntil(currentEvent.end, currentTime);
      console.log(`📺 Current event: "${currentEvent.title}" (${timeUntilEnd} remaining)`);
      
      const response: DisplayStatus = {
        status: 'current',
        currentEvent,
        nextEvent,
        currentTime: currentTime.toISOString(),
        mockTime: mockTime || undefined,
        timeUntilNext: nextEvent ? calculateTimeUntil(nextEvent.start, currentTime) : undefined,
        displayTheme: getThemeForAgeGroup(currentEvent.ageGroup.group)
      };
      
      return NextResponse.json(response);
      
    } else if (nextEvent) {
      // Between events
      const timeUntilNext = calculateTimeUntil(nextEvent.start, currentTime);
      console.log(`📺 Between events - next: "${nextEvent.title}" in ${timeUntilNext}`);
      
      const response: DisplayStatus = {
        status: 'between',
        nextEvent,
        currentTime: currentTime.toISOString(),
        mockTime: mockTime || undefined,
        timeUntilNext,
        displayTheme: 'closed'
      };
      
      return NextResponse.json(response);
      
    } else {
      // No events today
      console.log('📺 No events scheduled - returning closed status');
      
      const response: DisplayStatus = {
        status: 'closed',
        currentTime: currentTime.toISOString(),
        mockTime: mockTime || undefined,
        message: 'Closed - No events scheduled',
        displayTheme: 'closed'
      };
      
      return NextResponse.json(response);
    }
    
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error('❌ Display status API error:', error);
    
    return NextResponse.json({
      error: 'Failed to get display status',
      message: error instanceof Error ? error.message : 'Unknown error',
      duration: `${duration}ms`
    }, { status: 500 });
  }
}

// Helper functions for event processing
function findRelevantEvents(events: ProcessedEvent[], currentTime: Date) {
  const now = currentTime.getTime();
  
  // Sort events by start time
  const sortedEvents = events
    .sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());
  
  console.log(`🔍 Searching through ${sortedEvents.length} sorted events`);
  
  // Find current event (started but not ended)
  const currentEvent = sortedEvents.find(event => {
    const start = new Date(event.start).getTime();
    const end = new Date(event.end).getTime();
    const isCurrent = start <= now && now < end;
    
    if (isCurrent) {
      console.log(`🎯 Found current event: "${event.title}"`);
    }
    
    return isCurrent;
  });
  
  // Find next event (starts after now)
  const nextEvent = sortedEvents.find(event => {
    const start = new Date(event.start).getTime();
    const isNext = start > now;
    
    if (isNext && !currentEvent) {
      console.log(`⏭️ Found next event: "${event.title}"`);
    }
    
    return isNext;
  });
  
  return { currentEvent, nextEvent };
}

function calculateTimeUntil(targetTime: string, fromTime: Date): string {
  const target = new Date(targetTime);
  const diff = target.getTime() - fromTime.getTime();
  
  if (diff <= 0) return '0 minutes';
  
  const minutes = Math.floor(diff / (1000 * 60));
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  
  if (days > 0) {
    return `${days}d ${hours % 24}h`;
  } else if (hours > 0) {
    const remainingMinutes = minutes % 60;
    return `${hours}h ${remainingMinutes}m`;
  } else {
    return `${minutes} minutes`;
  }
}

function getThemeForAgeGroup(group: string): string {
  const themes: Record<string, string> = {
    adults: 'blue',
    elementary: 'green', 
    allages: 'purple',
    teens: 'orange',
    unknown: 'gray'
  };
  
  const theme = themes[group] || 'gray';
  console.log(`🎨 Theme for age group '${group}': ${theme}`);
  return theme;
}
```

### ✅ Task 4: Admin Time Override API
**Location:** `app/api/admin/time-override/route.ts`

```typescript
// app/api/admin/time-override/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { KVStorage } from '@/lib/kv-storage';

export async function POST(request: NextRequest) {
  try {
    const { mockTime } = await request.json();
    const storage = new KVStorage();
    
    console.log(`⚙️ Admin time override request: ${mockTime || 'CLEAR'}`);
    
    // Validate mockTime if provided
    if (mockTime && isNaN(new Date(mockTime).getTime())) {
      console.log(`❌ Invalid date format: ${mockTime}`);
      return NextResponse.json({
        success: false,
        error: 'Invalid date format - use ISO string (YYYY-MM-DDTHH:mm:ss.sssZ)'
      }, { status: 400 });
    }
    
    await storage.setTimeOverride(mockTime);
    
    const response = {
      success: true,
      mockTime: mockTime || null,
      message: mockTime ? `Time override set to ${mockTime}` : 'Time override cleared - using real time',
      currentRealTime: new Date().toISOString()
    };
    
    console.log(`✅ Time override ${mockTime ? 'set' : 'cleared'} successfully`);
    return NextResponse.json(response);
    
  } catch (error) {
    console.error('❌ Time override error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to set time override',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function GET() {
  try {
    const storage = new KVStorage();
    const mockTime = await storage.getTimeOverride();
    
    console.log(`⚙️ Admin time override status: ${mockTime || 'NONE'}`);
    
    return NextResponse.json({
      mockTime: mockTime || null,
      isActive: Boolean(mockTime),
      currentRealTime: new Date().toISOString(),
      message: mockTime ? `Active override: ${mockTime}` : 'Using real time'
    });
    
  } catch (error) {
    console.error('❌ Get time override error:', error);
    return NextResponse.json({
      error: 'Failed to get time override status',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
```

### ✅ Task 5: Health Monitoring API
**Location:** `app/api/health/route.ts`

```typescript
// app/api/health/route.ts
import { NextResponse } from 'next/server';
import { KVStorage } from '@/lib/kv-storage';

export async function GET() {
  const startTime = Date.now();
  
  try {
    const storage = new KVStorage();
    
    console.log('🔍 Health check requested');
    
    // Get comprehensive system health
    const health = await storage.getSystemHealth();
    
    // Add additional health metrics
    const healthReport = {
      ...health,
      timestamp: new Date().toISOString(),
      api: {
        responseTime: `${Date.now() - startTime}ms`,
        status: 'healthy'
      },
      database: {
        connected: true,
        provider: 'Vercel KV'
      }
    };
    
    console.log('✅ Health check completed:', {
      eventCount: health.calendar.eventCount,
      lastFetch: health.calendar.lastFetch,
      errors: health.calendar.errors.length
    });
    
    // Return 200 if everything looks good, 503 if there are issues
    const hasRecentData = health.calendar.lastFetch !== 'Never' && 
      new Date().getTime() - new Date(health.calendar.lastFetch).getTime() < 30 * 60 * 1000; // 30 min
    
    const status = hasRecentData && health.calendar.errors.length === 0 ? 200 : 503;
    
    return NextResponse.json(healthReport, { status });
    
  } catch (error) {
    console.error('❌ Health check failed:', error);
    
    return NextResponse.json({
      status: 'unhealthy',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
      api: {
        responseTime: `${Date.now() - startTime}ms`,
        status: 'error'
      }
    }, { status: 503 });
  }
}
```

## Your Communication Protocol

After completing **each task**, post updates to AGENT-LOGS.md:

```markdown
## [FUNCTIONS] YYYY-MM-DD HH:MM - [STATUS] Task Name

**What I Did:**
- Specific API endpoints created
- Integration points with Backend Agent
- KV storage operations implemented
- Testing completed

**Dependencies:**
- @backend-agent: ✅ Successfully using your [specific components]
- @frontend-agent: ✅ Ready to consume these APIs: [list endpoints]

**API Endpoints Ready:**
- GET /api/calendar/status - Main display data
- POST /api/admin/time-override - Admin controls
- GET /api/health - System monitoring

**Next Steps:**
- Next priority tasks
- Estimated completion time

**Integration Notes:**
- How Frontend should consume your APIs
- Any rate limits or caching behavior
- Error response formats

---
```

## Your Complete Task Timeline

### Phase 1: Core APIs (Days 1-2)
- [ ] **Task 1**: Vercel config and KV storage setup
- [ ] **Task 2**: Calendar fetch cron job ⚡ CRITICAL
- [ ] **Task 3**: Display status API ⚡ CRITICAL
- [ ] **Task 4**: Admin time override API
- [ ] **Task 5**: Health monitoring API

### Phase 2: Enhanced Features (Days 3-4)
- [ ] **Task 6**: Event filtering and search APIs
- [ ] **Task 7**: Advanced error handling and retry logic
- [ ] **Task 8**: Performance monitoring and metrics
- [ ] **Task 9**: API rate limiting and security

### Phase 3: Production Features (Days 5-6)
- [ ] **Task 10**: Emergency override system
- [ ] **Task 11**: Backup and recovery mechanisms
- [ ] **Task 12**: Advanced caching strategies
- [ ] **Task 13**: Monitoring alerts system

### Phase 4: Deployment Ready (Days 7-8)
- [ ] **Task 14**: Production deployment testing
- [ ] **Task 15**: Environment variable management
- [ ] **Task 16**: Final documentation and handoff

## Testing Your APIs

### Test Status Endpoint:
```bash
# Test current status
curl "http://localhost:3000/api/calendar/status"

# Test with mock time (during an adult event)
curl "http://localhost:3000/api/calendar/status?mockTime=2025-05-01T14:00:00Z"

# Test with mock time (during kids event)
curl "http://localhost:3000/api/calendar/status?mockTime=2025-05-08T19:30:00Z"
```

### Test Admin Endpoints:
```bash
# Set time override
curl -X POST "http://localhost:3000/api/admin/time-override" \
  -H "Content-Type: application/json" \
  -d '{"mockTime": "2025-05-01T14:00:00Z"}'

# Clear time override
curl -X POST "http://localhost:3000/api/admin/time-override" \
  -H "Content-Type: application/json" \
  -d '{"mockTime": null}'

# Get current override
curl "http://localhost:3000/api/admin/time-override"
```

### Test Cron Job Manually:
```bash
# Manually trigger calendar fetch
curl "http://localhost:3000/api/cron/fetch-calendar"
```

## Environment Variables Setup

You'll need to configure these in Vercel:

```bash
# Required for calendar fetching
CALENDAR_ID=1155c68c0f34daaf8376a26a85082e0d1d1f7b2d7c91f9be70979b5b58ede7cf@group.calendar.google.com

# Vercel KV Database
KV_REST_API_URL=your-kv-store-url
KV_REST_API_TOKEN=your-kv-token

# Admin settings
ADMIN_PASSWORD=makerspace2024

# Optional settings
NEXT_PUBLIC_TIME_ZONE=America/Chicago
```

## Success Criteria

### Technical Requirements:
- [ ] Cron job runs every 15 minutes without failures
- [ ] Status API returns data in < 500ms average
- [ ] KV storage handles 1000+ events efficiently
- [ ] Time override works perfectly for admin testing
- [ ] Error handling prevents system crashes
- [ ] Health monitoring provides actionable data

### Integration Success:
- [ ] Backend Agent's calendar fetcher works in your cron job
- [ ] Frontend Agent can consume all your APIs without issues
- [ ] No data loss or corruption in storage
- [ ] Production deployment runs reliably

Remember: You're the critical bridge between Backend's data processing and Frontend's display! Your APIs power the entire user experience.

**Wait for Backend Agent's interfaces, then start with the cron job immediately!** 🌐

---

Post in AGENT-LOGS.md when Backend is ready and you begin work!
