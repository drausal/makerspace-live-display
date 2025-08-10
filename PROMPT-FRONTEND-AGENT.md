# 🎨 Frontend Agent Prompt

## Your Role
You are the **Frontend Agent** responsible for:
1. **TV Display Interface** - Create the main display component that shows current events
2. **Age Group Theming** - Visual design system based on event target audiences  
3. **Admin Panel** - Time override controls and testing interface
4. **User Experience** - Accessibility, responsiveness, and production-ready UI
5. **Real-time Updates** - Auto-refreshing display that stays current

## Critical Dependencies - Wait for Other Agents!

**BEFORE YOU START:** Check AGENT-LOGS.md for these completed messages:
1. **@manager-agent** - Project initialization and GitHub repository ready
2. **@backend-agent** - Shared TypeScript interfaces in `shared/types.ts`
3. **@functions-agent** - API endpoints `/api/calendar/status` and `/api/admin/time-override`

You need both Backend interfaces AND Functions APIs before building your UI!

## Your Phase 1 Priority Tasks (After APIs Ready)

### ✅ Task 1: Next.js App Structure & Global Styles
**Locations:** App router and global styling

**Create `app/globals.css`:**
```css
@tailwind base;
@tailwind components;
@tailwind utilities;

/* TV Display Optimizations */
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');

:root {
  /* Age Group Color System */
  --theme-adults: #1e40af;      /* Blue */
  --theme-elementary: #059669;  /* Green */
  --theme-allages: #7c3aed;     /* Purple */
  --theme-teens: #ea580c;       /* Orange */
  --theme-unknown: #6b7280;     /* Gray */
  --theme-closed: #dc2626;      /* Red */
}

/* Theme Classes */
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

/* TV Display Styles */
.tv-display {
  font-family: 'Inter', sans-serif;
  background: var(--bg-color);
  color: var(--text-color);
  min-height: 100vh;
}

.tv-display header {
  border-color: var(--primary-color);
  color: var(--primary-color);
}

/* Age Group Badges */
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

/* Status Banners */
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

/* Screen burn-in prevention */
.tv-display {
  animation: subtle-shift 300s infinite alternate;
}

@keyframes subtle-shift {
  0% { transform: translate(0, 0); }
  100% { transform: translate(2px, 1px); }
}

/* TV Typography - Optimized for distance viewing */
.tv-display h1 { font-size: 3rem; font-weight: 800; }
.tv-display h2 { font-size: 2.5rem; font-weight: 700; }
.tv-display h3 { font-size: 2rem; font-weight: 600; }
.tv-display .time-display { 
  font-size: 2rem; 
  font-family: 'Monaco', monospace;
  font-weight: 700;
}
.tv-display p { font-size: 1.25rem; line-height: 1.6; }

/* High contrast mode support */
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

/* Loading animations */
@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

.pulse { animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite; }
```

**Update `app/layout.tsx`:**
```tsx
import { Inter, Roboto_Mono } from 'next/font/google';
import './globals.css';

const inter = Inter({ 
  subsets: ['latin'], 
  variable: '--font-inter',
  display: 'swap'
});

const robotoMono = Roboto_Mono({ 
  subsets: ['latin'], 
  variable: '--font-roboto-mono',
  display: 'swap'
});

export const metadata = {
  title: 'HQ Makerspace Live Display',
  description: 'Real-time event display for the Maker Space TV with age group indicators',
  robots: 'noindex, nofollow', // Don't index the display pages
  viewport: 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} ${robotoMono.variable}`}>
      <head>
        <meta name="theme-color" content="#1e40af" />
        <link rel="icon" href="/favicon.ico" />
      </head>
      <body className="font-sans antialiased">
        {children}
      </body>
    </html>
  );
}
```

**Create `app/page.tsx`:**
```tsx
import { TVDisplay } from '@/components/TVDisplay';

export default function HomePage() {
  return (
    <main>
      <TVDisplay />
    </main>
  );
}
```

**Create `app/admin/page.tsx`:**
```tsx
import { AdminPanel } from '@/components/AdminPanel';

export default function AdminPage() {
  return (
    <main className="min-h-screen bg-gray-100">
      <AdminPanel />
    </main>
  );
}
```

### ✅ Task 2: TV Display Component (CRITICAL!)
**Location:** `components/TVDisplay.tsx`

This is the **main component** that will show on the TV 24/7!

```tsx
'use client';

import { useEffect, useState, useCallback } from 'react';
import { DisplayStatus } from '@/shared/types';
import { EventCard } from './EventCard';
import { StatusBanner } from './StatusBanner';
import { Clock } from './Clock';
import { ErrorBoundary } from './ErrorBoundary';

export function TVDisplay() {
  const [displayStatus, setDisplayStatus] = useState<DisplayStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  console.log('🖥️ TVDisplay component mounted');

  // Fetch display status from Functions Agent API
  const fetchStatus = useCallback(async () => {
    console.log('📡 Fetching display status...');
    
    try {
      const response = await fetch('/api/calendar/status');
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log('📡 Display status received:', {
        status: data.status,
        hasCurrentEvent: !!data.currentEvent,
        hasNextEvent: !!data.nextEvent,
        mockTime: data.mockTime
      });
      
      setDisplayStatus(data);
      setError(null);
      setLastUpdate(new Date());
      
    } catch (err) {
      console.error('❌ Failed to fetch display status:', err);
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  }, []);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    console.log('🔄 Setting up auto-refresh...');
    
    fetchStatus();
    const interval = setInterval(fetchStatus, 30000); // 30 seconds
    
    return () => {
      console.log('🛑 Cleaning up auto-refresh');
      clearInterval(interval);
    };
  }, [fetchStatus]);

  // Loading state
  if (loading) {
    return (
      <div className="tv-display theme-unknown">
        <div className="h-screen flex flex-col items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-32 w-32 border-b-4 border-blue-600 mx-auto mb-8"></div>
            <h1 className="text-4xl font-bold mb-4">🔧 HQ MAKERSPACE</h1>
            <p className="text-2xl text-gray-600 pulse">Loading event display...</p>
            <div className="mt-8 text-lg text-gray-500">
              <Clock currentTime={new Date().toISOString()} />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Error state with retry
  if (error) {
    return (
      <div className="tv-display theme-closed">
        <div className="h-screen flex flex-col items-center justify-center bg-red-50">
          <div className="text-center max-w-2xl mx-auto p-8">
            <div className="text-red-600 text-8xl mb-8">⚠️</div>
            <h1 className="text-4xl font-bold text-red-800 mb-4">Display Error</h1>
            <p className="text-2xl text-red-600 mb-6">{error}</p>
            <p className="text-xl text-red-500 mb-8">
              The calendar display is temporarily unavailable
            </p>
            <button 
              onClick={fetchStatus}
              className="bg-red-600 text-white px-8 py-4 rounded-lg text-xl font-semibold hover:bg-red-700 transition-colors"
            >
              🔄 Try Again
            </button>
            <div className="mt-8 text-lg text-red-400">
              Last attempted: {lastUpdate.toLocaleTimeString()}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!displayStatus) return null;

  // Apply theme based on age group or status
  const theme = displayStatus.displayTheme || 'closed';
  
  return (
    <ErrorBoundary>
      <div className={`tv-display h-screen flex flex-col theme-${theme}`}>
        {/* Header with branding and time */}
        <header className="bg-white border-b-4 border-current p-6 flex justify-between items-center shadow-lg">
          <div className="flex items-center space-x-4">
            <div className="text-4xl animate-pulse">🔧</div>
            <h1 className="text-4xl font-bold">HQ MAKERSPACE</h1>
          </div>
          <Clock 
            currentTime={displayStatus.currentTime} 
            mockTime={displayStatus.mockTime} 
          />
        </header>

        {/* Main content area */}
        <main className="flex-1 p-8 overflow-y-auto">
          <StatusBanner 
            status={displayStatus.status} 
            ageGroup={displayStatus.currentEvent?.ageGroup} 
          />
          
          {displayStatus.status === 'current' && displayStatus.currentEvent && (
            <div className="space-y-8">
              <EventCard 
                event={displayStatus.currentEvent} 
                type="current"
                timeRemaining={displayStatus.timeUntilNext}
              />
              
              {displayStatus.nextEvent && (
                <div>
                  <h2 className="text-3xl font-bold mb-4 flex items-center text-gray-700">
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
            <div className="text-center space-y-8">
              <div className="bg-yellow-100 border-4 border-yellow-400 rounded-xl p-12 shadow-lg">
                <h2 className="text-5xl font-bold text-yellow-800 mb-4">Between Events</h2>
                <p className="text-3xl text-yellow-700">
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
            <div className="text-center">
              <div className="bg-current bg-opacity-10 border-4 border-current rounded-xl p-16 shadow-2xl">
                <h2 className="text-8xl font-bold mb-6">CLOSED</h2>
                <p className="text-3xl mb-6 opacity-90">
                  {displayStatus.message || 'No events scheduled at this time'}
                </p>
                <div className="text-2xl opacity-75">
                  <p>Visit <strong className="text-current">aclib.us</strong></p>
                  <p className="mt-2">for current hours and upcoming events</p>
                </div>
              </div>
            </div>
          )}
        </main>

        {/* Footer with system info */}
        <footer className="bg-gray-100 border-t px-6 py-4 flex justify-between items-center text-sm">
          <div className="text-gray-600">
            📡 Last updated: {lastUpdate.toLocaleTimeString()}
          </div>
          <div className="flex items-center space-x-4">
            {displayStatus.mockTime && (
              <span className="bg-orange-200 text-orange-800 px-3 py-1 rounded-full text-sm font-medium">
                🧪 TEST MODE - {new Date(displayStatus.mockTime).toLocaleDateString()}
              </span>
            )}
            <span className="text-gray-500">
              HQ Makerspace Live Display
            </span>
          </div>
        </footer>
      </div>
    </ErrorBoundary>
  );
}
```

**After creating this, IMMEDIATELY post to AGENT-LOGS.md:**
```markdown
## [FRONTEND] 2025-08-10 20:45 - [COMPLETE] TV Display Component

**What I Did:**
- ✅ Created main TVDisplay component with real-time updates
- ✅ Integrated with @functions-agent's /api/calendar/status endpoint  
- ✅ Built age group theme system with CSS custom properties
- ✅ Added comprehensive loading, error, and offline states
- ✅ Implemented 30-second auto-refresh for live updates

**Dependencies:**
- @backend-agent: ✅ Using your TypeScript interfaces perfectly
- @functions-agent: ✅ Successfully consuming your status API

**Next Steps:**
- Task 3: EventCard component with age group indicators
- Task 4: Age group badge component
- ETA: 3 hours

**Integration Notes:**
- Display updates every 30 seconds automatically
- Handles API errors gracefully with retry mechanism
- Theme switching based on current event age group
- Test mode indicator shows when time override is active

---
```

### ✅ Task 3: Event Card Component
**Location:** `components/EventCard.tsx`

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
  
  console.log(`🎫 Rendering ${type} event card: "${event.title}"`);
  
  return (
    <div className={`event-card bg-white rounded-xl shadow-xl border-l-8 p-8 ${
      type === 'current' ? 'border-current' : 'border-gray-300'
    } transform transition-all duration-300 hover:scale-[1.02]`}>
      
      {/* Event header */}
      <div className="flex items-start justify-between mb-6">
        <div className="flex-1 pr-4">
          <h3 className="text-4xl font-bold mb-4 leading-tight">
            {event.title}
          </h3>
          <div className="flex flex-wrap items-center gap-4">
            <AgeGroupBadge ageGroup={event.ageGroup} size="large" />
            {event.location && (
              <div className="flex items-center text-xl text-gray-600">
                <span className="mr-2">📍</span>
                <span>{event.location}</span>
              </div>
            )}
          </div>
        </div>
        
        {type === 'current' && (
          <div className="bg-green-100 text-green-800 px-4 py-2 rounded-full text-lg font-semibold">
            ✅ ACTIVE
          </div>
        )}
      </div>

      {/* Time information */}
      <div className="mb-6 p-4 bg-gray-50 rounded-lg">
        <div className="text-2xl text-gray-800 mb-2 font-mono">
          ⏰ {format(startTime, 'h:mm a')} - {format(endTime, 'h:mm a')}
        </div>
        <div className="text-lg text-gray-600">
          {format(startTime, 'EEEE, MMMM d, yyyy')}
        </div>
        
        {type === 'current' && timeRemaining && (
          <div className="mt-3 text-xl font-semibold text-green-600 flex items-center">
            <span className="mr-2">⏳</span>
            <span>{timeRemaining} remaining</span>
          </div>
        )}
        
        {type === 'next' && timeUntilStart && (
          <div className="mt-3 text-xl font-semibold text-blue-600 flex items-center">
            <span className="mr-2">⏭️</span>
            <span>Starts in {timeUntilStart}</span>
          </div>
        )}
      </div>

      {/* Event description */}
      {event.description && (
        <div className="mb-6 p-4 bg-blue-50 rounded-lg">
          <h4 className="text-xl font-semibold mb-2 text-gray-800">About This Event</h4>
          <p className="text-lg text-gray-700 leading-relaxed">
            {event.description}
          </p>
        </div>
      )}

      {/* Categories */}
      {event.categories && event.categories.length > 0 && (
        <div className="mb-4">
          <h4 className="text-lg font-semibold mb-2 text-gray-700">Categories</h4>
          <div className="flex flex-wrap gap-2">
            {event.categories.map((category, index) => (
              <span
                key={index}
                className="bg-gray-200 text-gray-800 px-3 py-1 rounded-full text-base font-medium"
              >
                {category}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Registration info */}
      {event.registrationUrl && (
        <div className="mt-6 pt-4 border-t-2 border-gray-200">
          <div className="flex items-center text-lg text-blue-600">
            <span className="mr-2">🔗</span>
            <span>Registration may be required - visit <strong>aclib.us</strong></span>
          </div>
        </div>
      )}
      
      {/* Event status indicators */}
      <div className="flex justify-between items-center mt-4 pt-4 border-t border-gray-100">
        <div className="flex items-center space-x-4 text-sm text-gray-500">
          {event.isRecurring && (
            <span className="flex items-center">
              <span className="mr-1">🔁</span>
              Recurring Event
            </span>
          )}
          {event.isAllDay && (
            <span className="flex items-center">
              <span className="mr-1">📅</span>
              All Day
            </span>
          )}
        </div>
        <div className="text-sm text-gray-400">
          ID: {event.id.slice(-8)}
        </div>
      </div>
    </div>
  );
}
```

### ✅ Task 4: Age Group Badge Component
**Location:** `components/AgeGroupBadge.tsx`

```tsx
import { AgeGroup } from '@/shared/types';

interface AgeGroupBadgeProps {
  ageGroup: AgeGroup;
  size?: 'small' | 'medium' | 'large';
  className?: string;
}

export function AgeGroupBadge({ ageGroup, size = 'medium', className = '' }: AgeGroupBadgeProps) {
  console.log(`🏷️ Rendering age badge: ${ageGroup.group} (${ageGroup.label})`);
  
  return (
    <div 
      className={`age-badge age-badge--${size} theme-${ageGroup.group} ${className}`}
      role="button"
      tabIndex={0}
      aria-label={`Target audience: ${ageGroup.label}`}
      title={`This event is designed for: ${ageGroup.label}`}
    >
      <span 
        className="age-emoji text-2xl" 
        role="img" 
        aria-label={ageGroup.label}
      >
        {ageGroup.emoji}
      </span>
      <span className="age-label font-semibold">
        {ageGroup.label}
      </span>
    </div>
  );
}
```

### ✅ Task 5: Clock Component
**Location:** `components/Clock.tsx`

```tsx
'use client';

import { useState, useEffect } from 'react';
import { format } from 'date-fns';

interface ClockProps {
  currentTime: string;
  mockTime?: string;
}

export function Clock({ currentTime, mockTime }: ClockProps) {
  const [displayTime, setDisplayTime] = useState<Date>(new Date(currentTime));

  useEffect(() => {
    // Update display time when props change
    const timeToUse = mockTime || currentTime;
    setDisplayTime(new Date(timeToUse));
    
    if (!mockTime) {
      // Only run live clock if not in mock mode
      const interval = setInterval(() => {
        setDisplayTime(new Date());
      }, 1000);
      
      return () => clearInterval(interval);
    }
  }, [currentTime, mockTime]);

  return (
    <div className="text-right">
      <div className="time-display text-current">
        {format(displayTime, 'h:mm a')}
      </div>
      <div className="text-lg text-current opacity-75">
        {format(displayTime, 'EEEE, MMM d')}
      </div>
      {mockTime && (
        <div className="text-sm text-orange-600 font-semibold mt-1">
          🧪 TEST MODE
        </div>
      )}
    </div>
  );
}
```

### ✅ Task 6: Admin Panel Component
**Location:** `components/AdminPanel.tsx`

```tsx
'use client';

import { useState, useEffect } from 'react';
import { DisplayStatus } from '@/shared/types';

export function AdminPanel() {
  const [mockTime, setMockTime] = useState<string>('');
  const [currentOverride, setCurrentOverride] = useState<string | null>(null);
  const [displayStatus, setDisplayStatus] = useState<DisplayStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string>('');

  console.log('⚙️ Admin panel mounted');

  // Load current time override and display status
  const loadCurrentState = async () => {
    try {
      const [overrideRes, statusRes] = await Promise.all([
        fetch('/api/admin/time-override'),
        fetch('/api/calendar/status')
      ]);

      if (overrideRes.ok) {
        const overrideData = await overrideRes.json();
        setCurrentOverride(overrideData.mockTime);
        if (overrideData.mockTime) {
          setMockTime(overrideData.mockTime.slice(0, 16)); // Format for datetime-local input
        }
      }

      if (statusRes.ok) {
        const statusData = await statusRes.json();
        setDisplayStatus(statusData);
      }
    } catch (error) {
      console.error('❌ Failed to load admin state:', error);
      setMessage('Failed to load current state');
    }
  };

  useEffect(() => {
    loadCurrentState();
  }, []);

  // Set time override
  const setTimeOverride = async () => {
    if (!mockTime) {
      setMessage('Please select a date and time');
      return;
    }

    setLoading(true);
    try {
      const isoTime = new Date(mockTime).toISOString();
      
      const response = await fetch('/api/admin/time-override', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mockTime: isoTime })
      });

      const data = await response.json();
      
      if (data.success) {
        setCurrentOverride(isoTime);
        setMessage(`✅ Time override set to ${new Date(isoTime).toLocaleString()}`);
        // Refresh display status
        setTimeout(loadCurrentState, 1000);
      } else {
        setMessage(`❌ Failed: ${data.error}`);
      }
    } catch (error) {
      console.error('❌ Time override error:', error);
      setMessage('❌ Network error setting time override');
    } finally {
      setLoading(false);
    }
  };

  // Clear time override
  const clearTimeOverride = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/time-override', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mockTime: null })
      });

      const data = await response.json();
      
      if (data.success) {
        setCurrentOverride(null);
        setMockTime('');
        setMessage('✅ Time override cleared - using real time');
        // Refresh display status
        setTimeout(loadCurrentState, 1000);
      } else {
        setMessage(`❌ Failed: ${data.error}`);
      }
    } catch (error) {
      console.error('❌ Clear override error:', error);
      setMessage('❌ Network error clearing time override');
    } finally {
      setLoading(false);
    }
  };

  // Quick test scenarios
  const quickTests = [
    {
      name: 'Adult Open Studio',
      time: '2025-05-01T14:00:00',
      description: 'Should show adult event with blue theme'
    },
    {
      name: 'Kids Art Club', 
      time: '2025-05-08T19:30:00',
      description: 'Should show kids event with green theme'
    },
    {
      name: 'All Ages Workshop',
      time: '2025-05-02T17:30:00',
      description: 'Should show family event with purple theme'
    },
    {
      name: 'Between Events',
      time: '2025-05-01T16:30:00',
      description: 'Should show "between events" status'
    },
    {
      name: 'Closed Hours',
      time: '2025-05-01T02:00:00',
      description: 'Should show "closed" status'
    }
  ];

  return (
    <div className="max-w-4xl mx-auto p-8">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h1 className="text-3xl font-bold mb-6 text-gray-800">
          🛠️ Makerspace Display Admin Panel
        </h1>

        {/* Current Status */}
        <div className="mb-8 p-4 bg-blue-50 rounded-lg">
          <h2 className="text-xl font-semibold mb-2">Current Display Status</h2>
          {displayStatus ? (
            <div className="space-y-2">
              <p><strong>Status:</strong> {displayStatus.status}</p>
              <p><strong>Current Time:</strong> {new Date(displayStatus.currentTime).toLocaleString()}</p>
              {displayStatus.mockTime && (
                <p className="text-orange-600">
                  <strong>⚠️ TEST MODE:</strong> Using mock time: {new Date(displayStatus.mockTime).toLocaleString()}
                </p>
              )}
              {displayStatus.currentEvent && (
                <p><strong>Current Event:</strong> {displayStatus.currentEvent.title} ({displayStatus.currentEvent.ageGroup.label})</p>
              )}
              {displayStatus.nextEvent && (
                <p><strong>Next Event:</strong> {displayStatus.nextEvent.title} in {displayStatus.timeUntilNext}</p>
              )}
            </div>
          ) : (
            <p className="text-gray-500">Loading status...</p>
          )}
        </div>

        {/* Time Override Controls */}
        <div className="mb-8 p-4 border border-gray-200 rounded-lg">
          <h2 className="text-xl font-semibold mb-4">Time Override (Testing)</h2>
          
          <div className="flex flex-wrap items-end gap-4 mb-4">
            <div className="flex-1 min-w-64">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Mock Date & Time
              </label>
              <input
                type="datetime-local"
                value={mockTime}
                onChange={(e) => setMockTime(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <button
              onClick={setTimeOverride}
              disabled={loading || !mockTime}
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Setting...' : 'Set Override'}
            </button>
            {currentOverride && (
              <button
                onClick={clearTimeOverride}
                disabled={loading}
                className="px-6 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 disabled:opacity-50"
              >
                Clear Override
              </button>
            )}
          </div>

          {/* Quick Test Scenarios */}
          <div>
            <h3 className="text-lg font-medium mb-3">Quick Test Scenarios</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {quickTests.map((test) => (
                <button
                  key={test.name}
                  onClick={() => setMockTime(test.time)}
                  className="text-left p-3 border border-gray-200 rounded-md hover:bg-gray-50 transition-colors"
                >
                  <div className="font-medium">{test.name}</div>
                  <div className="text-sm text-gray-600">{test.description}</div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Status Messages */}
        {message && (
          <div className={`mb-4 p-4 rounded-lg ${
            message.includes('✅') ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
          }`}>
            {message}
          </div>
        )}

        {/* Instructions */}
        <div className="p-4 bg-gray-50 rounded-lg">
          <h2 className="text-lg font-semibold mb-2">Instructions</h2>
          <ul className="list-disc list-inside space-y-1 text-sm text-gray-700">
            <li>Use time override to test how the display looks at different times</li>
            <li>Try the quick test scenarios to see different event types and age groups</li>
            <li>The TV display will show a "TEST MODE" indicator when override is active</li>
            <li>Clear the override to return to real-time display</li>
            <li>Changes take effect immediately on the main display</li>
          </ul>
        </div>

        {/* TV Display Preview Link */}
        <div className="mt-6 text-center">
          <a
            href="/"
            target="_blank"
            className="inline-block px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            📺 Open TV Display (New Tab)
          </a>
        </div>
      </div>
    </div>
  );
}
```

## Your Communication Protocol

After completing **each task**, post updates to AGENT-LOGS.md:

```markdown
## [FRONTEND] YYYY-MM-DD HH:MM - [STATUS] Task Name

**What I Did:**
- Specific components created
- Integration with other agents' work
- UI features implemented
- Testing completed

**Dependencies:**
- @backend-agent: ✅ Using your [specific interfaces]
- @functions-agent: ✅ Consuming your [specific APIs]

**Components Ready:**
- TVDisplay: Main display with real-time updates
- EventCard: Age group visual indicators
- AdminPanel: Time override testing

**Next Steps:**
- Next priority tasks
- Estimated completion time

**UI Notes:**
- Theme switching behavior
- Accessibility features added
- Performance optimizations

---
```

## Your Success Criteria

### Technical Requirements:
- [ ] TV display updates every 30 seconds automatically
- [ ] Age group themes apply correctly based on events
- [ ] Admin panel allows time override testing
- [ ] Error handling shows helpful messages
- [ ] Accessibility standards met (ARIA labels, keyboard nav)
- [ ] Performance optimized for 24/7 operation

### Visual Design Requirements:
- [ ] Large text readable from 10+ feet away
- [ ] Age group colors are distinct and meaningful
- [ ] Professional appearance for public display
- [ ] Loading states are clear and non-distracting
- [ ] Subtle burn-in prevention animations

### Integration Success:
- [ ] Successfully consumes Functions Agent's APIs
- [ ] Uses Backend Agent's TypeScript interfaces
- [ ] No runtime errors or console warnings
- [ ] Graceful handling of API failures

## Testing Your Components

### Test TV Display:
```bash
# Start development server
npm run dev

# Open main display
open http://localhost:3000

# Open admin panel
open http://localhost:3000/admin
```

### Test Age Group Themes:
```bash
# Test with different mock times via admin panel:
# - Adult event: 2025-05-01T14:00:00 (should be blue)
# - Kids event: 2025-05-08T19:30:00 (should be green)  
# - All ages: 2025-05-02T17:30:00 (should be purple)
# - Closed: 2025-05-01T02:00:00 (should be red)
```

Remember: Your UI is what users will see 24/7! Make it reliable, accessible, and beautiful. The makerspace community depends on you! 🎨

**Wait for both Backend and Functions agents to complete their work, then start with the TV Display component immediately!** 

---

Post in AGENT-LOGS.md when APIs are ready and you begin work!
