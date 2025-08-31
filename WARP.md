# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Project Overview

This is a **Next.js 15** digital signage application that creates a real-time TV display for HQ Makerspace events. The system automatically fetches Google Calendar data, processes it with age-group detection, and displays current/upcoming events with visual theming based on target audiences (Adults, Kids, Teens, All Ages).

**Key Features:**
- Real-time Google Calendar integration via iCal feeds
- Intelligent age group detection from event descriptions
- Dynamic theming based on age demographics
- Admin panel with time override testing capabilities
- Full-screen TV display optimization with auto-refresh
- Comprehensive event validation and filtering

## Development Environment

### Prerequisites
- Node.js 20+ (project uses Next.js 15)
- npm or yarn package manager
- TypeScript knowledge

### Quick Setup
```bash
# Install dependencies
npm install

# Start development server with Turbopack
npm run dev

# Access the application
# Main display: http://localhost:3000
# Admin panel: http://localhost:3000/admin
# API test: http://localhost:3000/api-test
```

## Essential Commands

### Development
```bash
# Development server (with Turbopack for faster builds)
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Lint code
npm run lint
```

### Testing
```bash
# Run all tests
npm run test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage report
npm run test:coverage

# Run integration tests
npm run test:integration
```

### Single Test Execution
```bash
# Run a specific test file
npm test age-group-detector.test.ts

# Run tests matching a pattern
npm test -- --testNamePattern="detectAgeGroup"

# Run integration test manually
npx tsx scripts/test-integration.ts
```

## Architecture Overview

### Directory Structure
```
src/
├── app/                      # Next.js 15 App Router
│   ├── layout.tsx           # Root layout with analytics
│   ├── page.tsx             # Main TV display page
│   ├── admin/               # Admin panel pages
│   ├── api-test/            # API testing interface
│   └── api/                 # API routes
│       ├── calendar/status/ # Main display status endpoint
│       ├── display/status/  # Display health check
│       ├── admin/          # Admin time override API
│       └── health/         # System health endpoint
├── lib/                     # Core business logic
│   ├── age-group-detector.ts    # Parses age groups from descriptions
│   ├── calendar-fetcher.ts     # Google Calendar iCal processing
│   ├── calendar-utils.ts       # Date/time utilities and calculations
│   ├── event-validator.ts      # Event filtering and validation
│   ├── logger.ts              # Logging system
│   └── local-storage.ts       # LocalStorage with server-side fallback
components/                   # React components (outside app/)
├── TVDisplay.tsx            # Main full-screen display component
├── AdminPanel.tsx           # Admin time override interface
├── EventCard.tsx            # Individual event display cards
├── StatusBanner.tsx         # Current status banner display
├── Clock.tsx               # Real-time clock component
├── AgeGroupBadge.tsx       # Age group indicator badges
└── ErrorBoundary.tsx       # Error handling wrapper
shared/                      # Shared TypeScript types
└── types.ts                # Core interfaces (ProcessedEvent, AgeGroup, etc.)
__tests__/                   # Jest test suites
├── integration/            # End-to-end integration tests
└── *.test.ts              # Unit tests for each module
```

### Data Flow Architecture

```
Google Calendar (iCal) 
    ↓
CalendarFetcher.fetchEvents()
    ↓
AgeGroupDetector.detectAgeGroup()
    ↓
EventValidator.filterEvents()
    ↓
CalendarUtils.getDisplayStatus()
    ↓
TVDisplay component
    ↓
EventCard + StatusBanner + Clock
```

### Key Components

**TVDisplay** (Main container)
- Polls `/api/calendar/status` every 30 seconds
- Handles keyboard shortcuts (Ctrl/Cmd+A for admin)
- Manages loading states and error handling
- Applies dynamic theming based on current age group

**Age Group Detection System**
- Parses event descriptions for age indicators
- Supports: Adults (19+), Elementary (6-11), All Ages, Teens (12-18)
- Provides emoji, color theming, and display labels
- Falls back to "All Welcome" for unknown age groups

**API Layer**
- `/api/calendar/status` - Main endpoint for display data
- `/api/admin/time-override` - Time mocking for testing scenarios
- `/api/health` - System health monitoring
- Real-time data fetching with error recovery

## Development Patterns

### TypeScript Patterns
```typescript
// All events use the ProcessedEvent interface
interface ProcessedEvent {
  id: string;
  title: string;
  description: string;
  start: string; // ISO string
  end: string;
  ageGroup: AgeGroup;
  status: 'confirmed' | 'cancelled' | 'tentative';
  // ... other fields
}

// Age groups are strongly typed
interface AgeGroup {
  group: 'adults' | 'elementary' | 'allages' | 'teens' | 'unknown';
  emoji: string;
  label: string;
  color: string;
}
```

### Component Patterns
- All components use React functional components with hooks
- Client-side components marked with `"use client"`
- Props interfaces defined for each component
- Error boundaries wrap main display components

### State Management
- No complex state management library needed
- Local component state with `useState`
- Server state via API polling
- Mock time override stored in localStorage

### File Naming Conventions
- Components: PascalCase (e.g., `TVDisplay.tsx`, `EventCard.tsx`)
- Utilities: kebab-case (e.g., `age-group-detector.ts`)
- API routes: lowercase directories with `route.ts`
- Tests: `*.test.ts` or `*.spec.ts`

### Error Handling
```typescript
// API routes return structured error responses
return NextResponse.json({
  success: false,
  error: 'Descriptive error message',
  details: errorObject
}, { status: 500 });

// Components use ErrorBoundary wrapper
<ErrorBoundary>
  <TVDisplay />
</ErrorBoundary>
```

## Testing Strategy

### Unit Tests
- **Age Group Detection**: Tests all regex patterns for each age group
- **Calendar Utils**: Date calculations, event filtering, status determination
- **Event Validation**: Data integrity, required fields, status filtering

### Integration Tests  
- **Full Pipeline**: iCal parsing → filtering → age detection → display status
- **Performance**: Large dataset processing under 1 second
- **Error Scenarios**: Network failures, malformed data handling

### Running Specific Tests
```bash
# Test age group detection only
npm test age-group-detector

# Test calendar integration
npm test integration/calendar-integration

# Run integration test script manually
npm run test:integration
```

## Environment Configuration

### Required Environment Variables
```env
# Google Calendar Configuration
CALENDAR_ID=your_google_calendar_id@group.calendar.google.com

# Admin Panel
ADMIN_PASSWORD=secure_password_here

# Optional: Display Behavior
NEXT_PUBLIC_REFRESH_INTERVAL=30000  # milliseconds
NEXT_PUBLIC_TIME_ZONE=America/Chicago
```

### Development vs Production
- Development: Uses memory storage fallback when localStorage is unavailable
- Production: Uses browser localStorage for data persistence
- Calendar fetching works in both environments with valid `CALENDAR_ID`
- Server-side operations use memory storage with automatic fallback

## Common Development Tasks

### Adding New Age Groups
1. Update `AgeGroupDetector.agePatterns` array with new regex pattern
2. Add corresponding test cases in `age-group-detector.test.ts`
3. Update CSS theme colors in `globals.css`
4. Add new group to TypeScript union type in `shared/types.ts`

### Modifying Event Display Logic
- Edit `CalendarUtils.getDisplayStatus()` for status determination
- Update `EventCard.tsx` for visual changes
- Modify `StatusBanner.tsx` for banner text changes
- Test with admin time override feature

### API Endpoint Changes
- API routes follow Next.js 15 App Router conventions
- All routes export `GET`, `POST` etc. as named functions
- Use `NextRequest`/`NextResponse` for request/response handling
- Add error logging via `Logger` class for debugging

### Adding New Display Themes
```css
/* Add to globals.css */
:root {
  --theme-newgroup: #your-color;
}

.theme-newgroup { 
  --theme-color: var(--theme-newgroup); 
}
```

## Debugging Tips

### Common Issues
- **Calendar not loading**: Check `CALENDAR_ID` environment variable and network access
- **Age groups not detected**: Add console logs in `AgeGroupDetector.detectAgeGroup()`
- **Time override not working**: Verify `ADMIN_PASSWORD` and localStorage availability
- **Display not refreshing**: Check browser console for API polling errors

### Debugging Tools
```bash
# Enable verbose logging
Logger.setLogLevel('debug')

# Test API endpoints directly
curl http://localhost:3000/api/calendar/status
curl http://localhost:3000/api/health

# Run integration test with full output
npm run test:integration
```

### Production Debugging
- Use Vercel function logs for API route errors
- Monitor `/api/health` endpoint for system status
- Check browser console on display device for client-side errors

## Deployment Considerations

### Build Optimization
- Project uses Turbopack in development for faster builds
- Static optimization enabled for display pages
- API routes are serverless functions on Vercel

### Performance Notes
- Calendar data cached in localStorage with 20-minute TTL
- Client polls every 30 seconds for display updates
- Age group detection is CPU-efficient with regex caching
- Memory fallback ensures functionality when localStorage is unavailable

### Security
- Admin panel protected by password (stored in environment)
- Calendar data is read-only (public iCal URL)
- No sensitive user data stored or transmitted
- localStorage data is namespaced and client-side only

---

**Last Updated:** December 31, 2024  
**Next.js Version:** 15.4.6  
**Node.js Required:** 20+
