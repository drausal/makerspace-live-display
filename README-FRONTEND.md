# 🎨 Frontend Agent Guide - Maker Space Event Display

## 🎯 Your Role as Frontend Agent

You are responsible for **React/Next.js UI, user experience, styling, and accessibility**. You'll create the TV display interface, admin panel, age group visual themes, and ensure the system is beautiful, accessible, and production-ready for 24/7 operation.

## ⏳ Wait for Other Agents First!

**CRITICAL**: Before starting, check `AGENT-LOGS.md` for:
1. **@backend-agent** - `/shared/types.ts` interfaces ready
2. **@functions-agent** - API endpoints `/api/calendar/status` ready

You need their foundations to build the UI correctly.

## 📋 Your Phase 1 Priority Tasks (After APIs Ready)

### ✅ Task 1: Next.js App Structure & Layout
**Files**: Main app structure and routing

```tsx
// app/layout.tsx - Root layout with proper fonts and metadata
import { Inter, Roboto_Mono } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });
const robotoMono = Roboto_Mono({ subsets: ['latin'], variable: '--font-roboto-mono' });

export const metadata = {
  title: 'HQ Makerspace Live Display',
  description: 'Real-time event display for the Maker Space TV',
  robots: 'noindex', // Don't index the display pages
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} ${robotoMono.variable}`}>
      <body className="font-sans bg-gray-50 text-gray-900">
        {children}
      </body>
    </html>
  );
}
```

```tsx
// app/page.tsx - Main TV display page
import { TVDisplay } from '@/components/TVDisplay';

export default function HomePage() {
  return (
    <main className="min-h-screen">
      <TVDisplay />
    </main>
  );
}
```

```tsx
// app/admin/page.tsx - Admin panel page  
import { AdminPanel } from '@/components/AdminPanel';

export default function AdminPage() {
  return (
    <main className="min-h-screen bg-gray-100 p-8">
      <AdminPanel />
    </main>
  );
}
```

### ✅ Task 2: TV Display Component
**File**: `/components/TVDisplay.tsx`

This is the **main component** that shows on the TV!

```tsx
'use client';

import { useEffect, useState } from 'react';
import { DisplayStatus } from '@/shared/types';
import { EventCard } from './EventCard';
import { StatusBanner } from './StatusBanner';
import { Clock } from './Clock';

export function TVDisplay() {
  const [displayStatus, setDisplayStatus] = useState<DisplayStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch display status from @functions-agent API
  const fetchStatus = async () => {
    try {
      const response = await fetch('/api/calendar/status');
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }
      const data = await response.json();
      setDisplayStatus(data);
      setError(null);
    } catch (err) {
      console.error('Failed to fetch display status:', err);
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  // Auto-refresh every 30 seconds
  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-xl text-gray-600">Loading maker space display...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-screen flex items-center justify-center bg-red-50">
        <div className="text-center">
          <div className="text-red-600 text-8xl mb-4">⚠️</div>
          <h1 className="text-2xl font-bold text-red-800 mb-2">Display Error</h1>
          <p className="text-red-600 mb-4">{error}</p>
          <button 
            onClick={fetchStatus}
            className="bg-red-600 text-white px-6 py-2 rounded hover:bg-red-700"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!displayStatus) return null;

  // Apply theme based on age group or status
  const theme = displayStatus.displayTheme || 'closed';
  
  return (
    <div className={`tv-display h-screen flex flex-col theme-${theme}`}>
      {/* Header with time and branding */}
      <header className="bg-white border-b-4 border-current p-6 flex justify-between items-center">
        <div className="flex items-center space-x-4">
          <div className="text-4xl">🔧</div>
          <h1 className="text-3xl font-bold">HQ MAKERSPACE</h1>
        </div>
        <Clock currentTime={displayStatus.currentTime} mockTime={displayStatus.mockTime} />
      </header>

      {/* Main content area */}
      <main className="flex-1 p-8">
        <StatusBanner status={displayStatus.status} ageGroup={displayStatus.currentEvent?.ageGroup} />
        
        {displayStatus.status === 'current' && displayStatus.currentEvent && (
          <div className="mt-8">
            <EventCard 
              event={displayStatus.currentEvent} 
              type="current"
              timeRemaining={displayStatus.timeUntilNext}
            />
            
            {displayStatus.nextEvent && (
              <div className="mt-6">
                <h2 className="text-2xl font-semibold mb-4 flex items-center">
                  ⏭️ Up Next
                </h2>
                <EventCard 
                  event={displayStatus.nextEvent} 
                  type="next" 
                  timeUntilStart={displayStatus.timeUntilNext}
                />
              </div>
            )}
          </div>
        )}

        {displayStatus.status === 'between' && displayStatus.nextEvent && (
          <div className="mt-8 text-center">
            <div className="bg-yellow-100 border-2 border-yellow-400 rounded-lg p-8 mb-6">
              <h2 className="text-4xl font-bold text-yellow-800 mb-2">Between Events</h2>
              <p className="text-2xl text-yellow-700">
                Next event starts in {displayStatus.timeUntilNext}
              </p>
            </div>
            <EventCard 
              event={displayStatus.nextEvent} 
              type="next" 
              timeUntilStart={displayStatus.timeUntilNext}
            />
          </div>
        )}

        {displayStatus.status === 'closed' && (
          <div className="mt-8 text-center">
            <div className="bg-red-100 border-2 border-red-400 rounded-lg p-12">
              <h2 className="text-6xl font-bold text-red-800 mb-4">CLOSED</h2>
              <p className="text-2xl text-red-600 mb-4">
                {displayStatus.message || 'No events scheduled at this time'}
              </p>
              <p className="text-xl text-red-500">
                Visit <strong>aclib.us</strong> for current hours and upcoming events
              </p>
            </div>
          </div>
        )}
      </main>

      {/* Footer with last update */}
      <footer className="bg-gray-100 border-t px-6 py-3 text-center">
        <p className="text-sm text-gray-600">
          📡 Last updated: {new Date().toLocaleTimeString()} 
          {displayStatus.mockTime && (
            <span className="ml-4 bg-orange-200 text-orange-800 px-2 py-1 rounded text-xs">
              🧪 TEST MODE
            </span>
          )}
        </p>
      </footer>
    </div>
  );
}
```

### ✅ Task 3: Age Group Visual Themes
**File**: `/styles/themes.css`

```css
/* Age Group Theme System */

:root {
  --theme-adults: #1e40af;     /* Blue */
  --theme-elementary: #059669;  /* Green */
  --theme-allages: #7c3aed;    /* Purple */
  --theme-teens: #ea580c;      /* Orange */
  --theme-unknown: #6b7280;    /* Gray */
  --theme-closed: #dc2626;     /* Red */
}

.theme-adults {
  --primary-color: var(--theme-adults);
  --bg-color: #dbeafe;
  --text-color: #1e3a8a;
  --border-color: var(--theme-adults);
}

.theme-elementary {
  --primary-color: var(--theme-elementary);
  --bg-color: #d1fae5;
  --text-color: #064e3b;
  --border-color: var(--theme-elementary);
}

.theme-allages {
  --primary-color: var(--theme-allages);
  --bg-color: #ede9fe;
  --text-color: #5b21b6;
  --border-color: var(--theme-allages);
}

.theme-teens {
  --primary-color: var(--theme-teens);
  --bg-color: #fed7aa;
  --text-color: #9a3412;
  --border-color: var(--theme-teens);
}

.theme-unknown {
  --primary-color: var(--theme-unknown);
  --bg-color: #f3f4f6;
  --text-color: #374151;
  --border-color: var(--theme-unknown);
}

.theme-closed {
  --primary-color: var(--theme-closed);
  --bg-color: #fee2e2;
  --text-color: #7f1d1d;
  --border-color: var(--theme-closed);
}

/* Apply theme colors */
.tv-display {
  background: var(--bg-color);
  color: var(--text-color);
  border-color: var(--border-color);
}

.tv-display header {
  border-color: var(--primary-color);
  color: var(--primary-color);
}

/* Age group badges */
.age-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  border-radius: 9999px;
  border: 2px solid currentColor;
  background: var(--bg-color);
  color: var(--primary-color);
  font-weight: 600;
  font-size: 1.25rem;
}

.age-badge--large {
  padding: 1rem 2rem;
  font-size: 1.5rem;
}

.age-badge--small {
  padding: 0.5rem 1rem;
  font-size: 1rem;
}

/* Status banners */
.status-banner {
  background: var(--primary-color);
  color: white;
  text-align: center;
  padding: 1.5rem;
  border-radius: 0.75rem;
  font-size: 2rem;
  font-weight: bold;
  margin-bottom: 2rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

/* Subtle animation to prevent screen burn-in */
.tv-display {
  animation: subtle-shift 300s infinite alternate;
}

@keyframes subtle-shift {
  0% { transform: translate(0, 0); }
  100% { transform: translate(2px, 1px); }
}

/* High contrast mode for accessibility */
@media (prefers-contrast: high) {
  .tv-display {
    filter: contrast(1.5);
  }
}

/* Reduce motion for accessibility */
@media (prefers-reduced-motion: reduce) {
  .tv-display {
    animation: none;
  }
}
```

### ✅ Task 4: Event Card Component
**File**: `/components/EventCard.tsx`

```tsx
import { ProcessedEvent } from '@/shared/types';
import { AgeGroupBadge } from './AgeGroupBadge';
import { format } from 'date-fns';

interface EventCardProps {
  event: ProcessedEvent;
  type: 'current' | 'next';
  timeRemaining?: string;
  timeUntilStart?: string;
}

export function EventCard({ event, type, timeRemaining, timeUntilStart }: EventCardProps) {
  const startTime = new Date(event.start);
  const endTime = new Date(event.end);
  
  return (
    <div className={`event-card bg-white rounded-lg shadow-lg border-l-8 p-6 ${
      type === 'current' ? 'border-current' : 'border-gray-300'
    }`}>
      {/* Event title and age group */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h3 className="text-3xl font-bold mb-2 leading-tight">
            {event.title}
          </h3>
          <div className="flex items-center space-x-4">
            <AgeGroupBadge ageGroup={event.ageGroup} size="large" />
            {event.location && (
              <span className="text-gray-600 text-lg">📍 {event.location}</span>
            )}
          </div>
        </div>
      </div>

      {/* Time information */}
      <div className="mb-4">
        <div className="text-xl text-gray-700 mb-2">
          ⏰ {format(startTime, 'h:mm a')} - {format(endTime, 'h:mm a')}
          {type === 'current' && timeRemaining && (
            <span className="ml-4 text-lg font-semibold text-green-600">
              • {timeRemaining} remaining
            </span>
          )}
          {type === 'next' && timeUntilStart && (
            <span className="ml-4 text-lg font-semibold text-blue-600">
              • Starts in {timeUntilStart}
            </span>
          )}
        </div>
      </div>

      {/* Event description */}
      {event.description && (
        <div className="mb-4">
          <p className="text-lg text-gray-700 leading-relaxed">
            {event.description}
          </p>
        </div>
      )}

      {/* Categories and additional info */}
      {event.categories && event.categories.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {event.categories.map((category, index) => (
            <span
              key={index}
              className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm"
            >
              {category}
            </span>
          ))}
        </div>
      )}

      {/* Registration link if available */}
      {event.registrationUrl && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <p className="text-gray-600">
            🔗 Registration may be required - visit <strong>aclib.us</strong>
          </p>
        </div>
      )}
    </div>
  );
}
```

### ✅ Task 5: Age Group Badge Component
**File**: `/components/AgeGroupBadge.tsx`

```tsx
import { AgeGroup } from '@/shared/types';

interface AgeGroupBadgeProps {
  ageGroup: AgeGroup;
  size?: 'small' | 'medium' | 'large';
}

export function AgeGroupBadge({ ageGroup, size = 'medium' }: AgeGroupBadgeProps) {
  return (
    <div className={`age-badge age-badge--${size} theme-${ageGroup.group}`}>
      <span className="age-emoji" role="img" aria-label={ageGroup.label}>
        {ageGroup.emoji}
      </span>
      <span className="age-label">{ageGroup.label}</span>
    </div>
  );
}
```

## 🔄 Communication Protocol for Frontend Agent

### After Each Task Completion:

Post to `AGENT-LOGS.md`:

```markdown
## [FRONTEND] 2025-08-10 20:30 - [COMPLETE] TV Display Component

**What I Did:**
- Created main TVDisplay component consuming @functions-agent API
- Built age group theme system with CSS custom properties
- Implemented EventCard with proper age group indicators
- Added responsive design and accessibility features

**Dependencies:**
- @functions-agent: Successfully consuming /api/calendar/status ✅
- @backend-agent: Using your TypeScript interfaces perfectly ✅

**Next Steps:**
- Task 6: Admin panel for time override testing
- Task 7: Error states and offline handling
- ETA: 4 hours

**Blockers:**
- None currently - all APIs working great!

---
```

## 📊 Your Complete Task List

### Phase 1: Core Display (Days 1-2)
- [ ] **Task 1**: Next.js app structure and routing ⚡ CRITICAL
- [ ] **Task 2**: TV Display component with real-time updates ⚡ CRITICAL
- [ ] **Task 3**: Age group visual themes and CSS system
- [ ] **Task 4**: Event card component with age indicators
- [ ] **Task 5**: Age group badge component

### Phase 2: Admin & Controls (Days 3-4)
- [ ] **Task 6**: Admin panel for time override testing
- [ ] **Task 7**: Error states and offline handling
- [ ] **Task 8**: Loading states and transitions
- [ ] **Task 9**: Responsive design for different screen sizes

### Phase 3: Production Polish (Days 5-6)
- [ ] **Task 10**: Accessibility improvements (ARIA, keyboard nav)
- [ ] **Task 11**: Performance optimization and caching
- [ ] **Task 12**: Screen burn-in prevention animations
- [ ] **Task 13**: Production monitoring and health checks

### Phase 4: Final Integration (Days 7-8)
- [ ] **Task 14**: Cross-browser compatibility testing
- [ ] **Task 15**: Final UI polish and bug fixes
- [ ] **Task 16**: Documentation for staff training

## 🎨 Key Components You'll Create

```
/components/
  ├── TVDisplay.tsx          # Main display for TV screen (PRIORITY #1)
  ├── AdminPanel.tsx         # Time override and testing controls
  ├── EventCard.tsx          # Individual event display with age groups
  ├── AgeGroupBadge.tsx      # Age group visual indicators
  ├── StatusBanner.tsx       # Current status display  
  ├── Clock.tsx              # Time display component
  └── ErrorBoundary.tsx      # Error handling wrapper

/styles/
  ├── globals.css            # Global styles and resets
  ├── themes.css             # Age group theme system
  └── components.css         # Component-specific styles

/hooks/
  ├── useDisplayStatus.ts    # Hook for fetching display data
  ├── useTimeOverride.ts     # Hook for admin time controls
  └── useAutoRefresh.ts      # Hook for automatic updates
```

## 🚨 Critical Dependencies You Need

### From @backend-agent:
- ✅ TypeScript interfaces from `/shared/types.ts`
- ✅ Age group definitions with colors and emojis
- ✅ Event data structure and validation rules

### From @functions-agent:
- ✅ `/api/calendar/status` - Main display data (CRITICAL!)
- ✅ `/api/admin/time-override` - Admin panel functionality
- ✅ `/api/health` - System status for monitoring
- ✅ Real-time updates every 30 seconds

## 🎯 Success Criteria for Frontend Agent

### Technical Requirements:
- [ ] TV display updates automatically every 30 seconds
- [ ] Age group themes apply correctly based on current event
- [ ] Admin panel allows time override testing without issues
- [ ] Display works perfectly in fullscreen kiosk mode
- [ ] Error handling gracefully manages API failures
- [ ] Accessibility standards met for public display

### Visual Design Success:
- [ ] Large, readable text visible from 10+ feet away
- [ ] Age group colors are distinct and meaningful
- [ ] Animations are subtle and don't cause distraction
- [ ] Professional appearance suitable for public space
- [ ] Loading and error states are clear and helpful

### Production Readiness:
- [ ] Works 24/7 without manual intervention
- [ ] Handles network failures gracefully
- [ ] Prevents screen burn-in with subtle movements
- [ ] Cross-browser compatible (Chrome, Firefox, Safari)
- [ ] Performance optimized for long-running display

## 🔧 Key Styling Guidelines

### Typography Hierarchy:
```css
/* TV Display Typography - Optimized for Distance Viewing */
.tv-display h1 { font-size: 3rem; }      /* Main branding */
.tv-display h2 { font-size: 2.5rem; }    /* Section headers */
.tv-display h3 { font-size: 2rem; }      /* Event titles */
.tv-display .time { font-size: 1.5rem; } /* Time information */
.tv-display p { font-size: 1.25rem; }    /* Body text */
```

### Color Accessibility:
```css
/* Ensure high contrast for age groups */
.theme-adults { background: #dbeafe; color: #1e3a8a; }
.theme-elementary { background: #d1fae5; color: #064e3b; }
.theme-allages { background: #ede9fe; color: #5b21b6; }
```

## 📱 Responsive Design Considerations

```css
/* TV Display (Primary) - 1920x1080 */
@media (min-width: 1920px) {
  .tv-display { font-size: 18px; }
}

/* Large Monitor - 1440p */
@media (max-width: 1919px) {
  .tv-display { font-size: 16px; }
}

/* Standard Monitor - 1080p */
@media (max-width: 1439px) {
  .tv-display { font-size: 14px; }
}

/* Tablet/Smaller (Admin Panel) */
@media (max-width: 1023px) {
  .tv-display { 
    font-size: 12px;
    padding: 1rem;
  }
}
```

## 🧪 Admin Panel Features

### Time Override Testing:
```tsx
// Admin panel should allow:
- Set mock time to specific date/time
- Quick buttons for "During Adult Event", "During Kids Event", etc.
- Clear time override to return to real time
- Visual indicator when in test mode
- Preview of what TV display will show
```

### Testing Scenarios:
```typescript
const testScenarios = [
  {
    name: 'Adult Open Studio',
    mockTime: '2025-05-01T14:00:00Z',
    expectedTheme: 'adults'
  },
  {
    name: 'Kids Art Club',
    mockTime: '2025-05-08T19:30:00Z', 
    expectedTheme: 'elementary'
  },
  {
    name: 'Between Events',
    mockTime: '2025-05-01T16:30:00Z',
    expectedStatus: 'between'
  },
  {
    name: 'Closed Hours',
    mockTime: '2025-05-01T02:00:00Z',
    expectedStatus: 'closed'
  }
];
```

## 🎉 Getting Started

1. **Wait for dependencies**: Check `AGENT-LOGS.md` for @backend-agent interfaces and @functions-agent APIs
2. **Post your starting message** in the log file
3. **Build TV Display component first** - it's the main deliverable
4. **Test with @functions-agent APIs** to ensure proper integration
5. **Add age group themes** to make events visually distinct
6. **Create admin panel** for testing different scenarios
7. **Post frequent updates** so other agents know your progress

Remember: Your UI is what users will see 24/7! Make it beautiful, accessible, and reliable. The makerspace community is counting on you! 🎨✨

## 📚 Additional Resources

### Accessibility Guidelines:
- Use semantic HTML elements
- Provide ARIA labels for interactive elements
- Ensure color contrast ratios meet WCAG AA standards
- Support keyboard navigation where applicable
- Include alt text for important visual information

### Performance Best Practices:
- Optimize images and fonts for fast loading
- Use React.memo for expensive components
- Implement proper error boundaries
- Cache API responses appropriately
- Minimize re-renders with proper useEffect dependencies

### Testing Checklist:
- [ ] Test in fullscreen kiosk mode
- [ ] Verify all age group themes display correctly
- [ ] Test admin panel time override functionality
- [ ] Check error states when API is down
- [ ] Validate accessibility with screen reader
- [ ] Test performance with long-running display
