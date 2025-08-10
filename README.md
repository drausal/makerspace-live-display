# Maker Space Live Event Display

A Next.js application with Vercel Functions that automatically fetches iCal data and displays real-time event information for the HQ Makerspace TV display, including **age group indicators** for visitors.

## 🎯 Project Goals

Create a **digital signage solution** that:
- Automatically fetches fresh calendar data via Vercel cron functions
- Shows the current time prominently
- Displays the active event with **age group indicators** (Adults, Kids, All Ages)
- Shows the next upcoming event with age group
- Displays a "CLOSED" status when no events are scheduled
- Ignores "Busy" events (private/blocked time)
- Provides an admin panel to mock different dates for testing
- Auto-refreshes to stay current with live data

## 👥 Age Group Detection

### Supported Age Groups
Based on calendar data analysis, the system detects these age groups from event descriptions:

- **🧑 Adults (19 and up)** - Adult-only maker sessions
- **👶 Elementary (6-11 years)** - Kids programs like Art Club, STEAM Crafts
- **👪 All Ages** - Family-friendly workshops like 3D Printing intro
- **🤖 Unknown** - Fallback when age group cannot be determined

### Age Group Extraction Logic
```typescript
function extractAgeGroup(description: string): AgeGroup {
  const agePatterns = [
    { pattern: /Adults \(19 and up\)/i, group: 'adults', emoji: '🧑', label: 'Adults (19+)' },
    { pattern: /Elementary \(6-11 years\)/i, group: 'elementary', emoji: '👶', label: 'Kids (6-11)' },
    { pattern: /All Ages/i, group: 'allages', emoji: '👪', label: 'All Ages' },
    { pattern: /Teens? \(1[2-8][-\s]1[8-9]\)/i, group: 'teens', emoji: '🧒', label: 'Teens' },
  ];
  
  for (const { pattern, group, emoji, label } of agePatterns) {
    if (pattern.test(description)) {
      return { group, emoji, label };
    }
  }
  
  return { group: 'unknown', emoji: '🤖', label: 'All Welcome' };
}
```

## 📋 Features

### Automated Data Pipeline
- **Vercel Cron Function**: Fetches iCal data every 15 minutes
- **Age Group Processing**: Extracts and categorizes target audience
- **Event Filtering**: Ignores "Busy" events, validates data
- **Edge Caching**: Fast display updates via Vercel KV

### Main Display Screen with Age Groups
- **Large, clear time display** (current time)
- **Current Event Section**:
  - Event title with **age group badge**
  - Event description and times
  - Duration/time remaining
  - Visual age indicators (emojis + colors)
- **Next Event Section**:
  - Next event preview with **age group**
  - Countdown to start
- **Status Indicators**:
  - "OPEN - Adults Workshop" (blue theme)
  - "OPEN - Kids Activity" (green theme)  
  - "OPEN - All Ages Welcome" (purple theme)
  - "CLOSED - No Events Scheduled" (red theme)

## 🎨 Display Design with Age Groups

### TV Display Layout - Adult Event
```
┌─────────────────────────────────────────────────────┐
│  🔧 HQ MAKERSPACE        2:30 PM, Thursday Aug 10   │
├─────────────────────────────────────────────────────┤
│                                                     │
│  🟦 CURRENTLY OPEN - ADULT SESSION                  │
│                                                     │
│  📋 Open Studio                      🧑 Adults 19+  │
│  11:00 AM - 2:00 PM • 1h 30m remaining             │
│  Work on personal projects with makerspace tools   │
│                                                     │
│  ⏭️  UP NEXT: STEAM Crafts at 3:00 PM  👶 Kids 6-11 │
│                                                     │
│  📡 Last updated: 2 minutes ago                     │
└─────────────────────────────────────────────────────┘
```

### TV Display Layout - Kids Event  
```
┌─────────────────────────────────────────────────────┐
│  🔧 HQ MAKERSPACE        3:15 PM, Thursday Aug 10   │
├─────────────────────────────────────────────────────┤
│                                                     │
│  🟩 CURRENTLY OPEN - KIDS ACTIVITY                  │
│                                                     │
│  🎨 After School Art Club            👶 Kids 6-11   │
│  3:00 PM - 4:00 PM • 45 minutes remaining          │
│  Self-Portraits - Exploring art history & creativity│
│                                                     │
│  ⏭️  UP NEXT: Open Studio at 4:30 PM   🧑 Adults 19+ │
│                                                     │
│  📡 Last updated: 1 minute ago                      │
└─────────────────────────────────────────────────────┘
```

### All Ages Event
```
┌─────────────────────────────────────────────────────┐
│  🔧 HQ MAKERSPACE        5:15 PM, Friday Aug 11     │
├─────────────────────────────────────────────────────┤
│                                                     │
│  🟪 CURRENTLY OPEN - FAMILY FRIENDLY                │
│                                                     │
│  🖨️ Intro to 3D Printing           👪 All Ages     │
│  5:00 PM - 6:00 PM • 45 minutes remaining          │
│  Learn about 3D printing and how to get started    │
│                                                     │
│  ⏭️  UP NEXT: Closed until tomorrow 11:00 AM       │
│                                                     │
│  📡 Last updated: 30 seconds ago                    │
└─────────────────────────────────────────────────────┘
```

## 🏗️ Technical Architecture

### Event Data Structure with Age Groups
```typescript
interface ProcessedEvent {
  id: string;
  title: string;
  description: string;
  location: string;
  start: string;
  end: string;
  status: 'confirmed' | 'cancelled' | 'tentative';
  isAllDay: boolean;
  
  // Age group detection
  ageGroup: {
    group: 'adults' | 'elementary' | 'allages' | 'teens' | 'unknown';
    emoji: string;
    label: string;
    color: string;  // Theme color for display
  };
  
  // Display helpers
  categories: string[];  // e.g., ['MakerSpace', 'Arts', 'Technology']
  registrationUrl?: string;
  isRecurring: boolean;
}
```

### Vercel Functions with Age Processing

#### Enhanced Calendar Fetcher (`api/cron/fetch-calendar.ts`)
```typescript
export async function GET() {
  try {
    // 1. Fetch iCal data
    const icalData = await fetchICalData(CALENDAR_ID);
    
    // 2. Parse events
    const rawEvents = parseICalContent(icalData);
    
    // 3. Process with age group detection
    const processedEvents = rawEvents.map(event => ({
      ...event,
      ageGroup: extractAgeGroup(event.description),
      categories: extractCategories(event.description),
      registrationUrl: extractRegistrationUrl(event.description),
      isRecurring: detectRecurringPattern(event.uid)
    }));
    
    // 4. Filter and validate
    const validEvents = processedEvents.filter(event => 
      event.title !== 'Busy' && 
      event.status === 'confirmed' &&
      event.ageGroup.group !== 'unknown' // Optional: filter unknown age groups
    );
    
    // 5. Store in Vercel KV with age group stats
    await kv.set('calendar:events', validEvents);
    await kv.set('calendar:ageGroupStats', calculateAgeGroupStats(validEvents));
    await kv.set('calendar:lastUpdate', new Date().toISOString());
    
    return NextResponse.json({ 
      success: true, 
      events: validEvents.length,
      ageGroupBreakdown: calculateAgeGroupStats(validEvents)
    });
  } catch (error) {
    await logFetchAttempt('error', 0, error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

function calculateAgeGroupStats(events: ProcessedEvent[]) {
  return events.reduce((stats, event) => {
    stats[event.ageGroup.group] = (stats[event.ageGroup.group] || 0) + 1;
    return stats;
  }, {} as Record<string, number>);
}
```

### Enhanced Event Status API (`api/calendar/status.ts`)
```typescript
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const mockTime = searchParams.get('mockTime'); // For admin testing
  
  const currentTime = mockTime ? new Date(mockTime) : new Date();
  const events = await kv.get('calendar:events') || [];
  
  // Find current and next events with age group context
  const currentEvent = findCurrentEvent(events, currentTime);
  const nextEvent = findNextEvent(events, currentTime);
  
  if (currentEvent) {
    return NextResponse.json({
      status: 'current',
      event: currentEvent,
      nextEvent,
      ageGroup: currentEvent.ageGroup,
      displayTheme: getThemeForAgeGroup(currentEvent.ageGroup.group)
    });
  } else if (nextEvent) {
    return NextResponse.json({
      status: 'between',
      nextEvent,
      ageGroup: nextEvent.ageGroup,
      timeUntilNext: calculateTimeUntil(nextEvent.start, currentTime)
    });
  } else {
    return NextResponse.json({
      status: 'closed',
      nextEvent: findNextEventFromNow(events, currentTime)
    });
  }
}
```

## 🎨 Age Group Themes

### Color Schemes by Age Group
```css
/* Adults - Professional Blue Theme */
.theme-adults {
  --primary-color: #1e40af;
  --bg-color: #dbeafe; 
  --text-color: #1e3a8a;
  --banner-text: "ADULT SESSION";
}

/* Elementary - Playful Green Theme */
.theme-elementary {
  --primary-color: #059669;
  --bg-color: #d1fae5;
  --text-color: #064e3b;
  --banner-text: "KIDS ACTIVITY";
}

/* All Ages - Inclusive Purple Theme */  
.theme-allages {
  --primary-color: #7c3aed;
  --bg-color: #ede9fe;
  --text-color: #5b21b6;
  --banner-text: "FAMILY FRIENDLY";
}

/* Teens - Orange Theme */
.theme-teens {
  --primary-color: #ea580c;
  --bg-color: #fed7aa;
  --text-color: #9a3412;
  --banner-text: "TEEN PROGRAM";
}

/* Unknown/Default - Neutral Gray */
.theme-unknown {
  --primary-color: #6b7280;
  --bg-color: #f3f4f6;
  --text-color: #374151;
  --banner-text: "ALL WELCOME";
}
```

### Age Group Components
```tsx
// Age Badge Component
interface AgeBadgeProps {
  ageGroup: AgeGroup;
  size?: 'small' | 'medium' | 'large';
}

export function AgeBadge({ ageGroup, size = 'medium' }: AgeBadgeProps) {
  return (
    <div className={`age-badge age-badge--${size} theme-${ageGroup.group}`}>
      <span className="age-emoji">{ageGroup.emoji}</span>
      <span className="age-label">{ageGroup.label}</span>
    </div>
  );
}

// Status Banner with Age Context
export function StatusBanner({ status, ageGroup }: StatusBannerProps) {
  const bannerText = {
    adults: 'CURRENTLY OPEN - ADULT SESSION',
    elementary: 'CURRENTLY OPEN - KIDS ACTIVITY', 
    allages: 'CURRENTLY OPEN - FAMILY FRIENDLY',
    teens: 'CURRENTLY OPEN - TEEN PROGRAM',
    unknown: 'CURRENTLY OPEN - ALL WELCOME'
  };
  
  return (
    <div className={`status-banner theme-${ageGroup.group}`}>
      {bannerText[ageGroup.group]}
    </div>
  );
}
```

## 📊 Admin Panel with Age Group Analytics

### Age Group Dashboard
- **Current Event Age**: Prominently display current event's target audience
- **Daily Age Breakdown**: Chart showing adult vs kids vs all-ages events
- **Age Group Calendar**: Color-coded calendar view by age group
- **Quick Filters**: Show only adult events, only kids events, etc.

### Admin Features
```typescript
// Admin age group controls
interface AdminControls {
  timeOverride: Date | null;
  ageGroupFilter: 'all' | 'adults' | 'elementary' | 'allages' | 'teens';
  showAgeGroupStats: boolean;
  colorBlindMode: boolean; // Alternative to color-coding
}
```

## 🔧 Configuration

### Environment Variables
```env
# Calendar Configuration
CALENDAR_ID=1155c68c0f34daaf8376a26a85082e0d1d1f7b2d7c91f9be70979b5b58ede7cf@group.calendar.google.com
NEXT_PUBLIC_TIME_ZONE=America/Chicago
NEXT_PUBLIC_REFRESH_INTERVAL=30000

# Age Group Display Settings
NEXT_PUBLIC_SHOW_AGE_GROUPS=true
NEXT_PUBLIC_AGE_GROUP_THEMES=true
NEXT_PUBLIC_DEFAULT_UNKNOWN_AGE_HANDLING=show  # show | hide | mark_as_all_ages

# Vercel KV Storage  
KV_REST_API_URL=https://your-kv-store.vercel-storage.com
KV_REST_API_TOKEN=your-token-here

# Admin Settings
ADMIN_PASSWORD=makerspace2024
```

## 🧪 Testing Age Group Detection

### Test Scenarios with Age Groups
```typescript
const ageGroupTestScenarios = [
  {
    name: 'Adult Open Studio Session',
    mockTime: '2025-05-01T14:00:00Z',
    expectedAgeGroup: 'adults',
    expectedTheme: 'blue'
  },
  {
    name: 'Kids Art Club', 
    mockTime: '2025-05-08T19:30:00Z',
    expectedAgeGroup: 'elementary',
    expectedTheme: 'green'
  },
  {
    name: 'All Ages 3D Printing',
    mockTime: '2025-05-02T21:30:00Z', 
    expectedAgeGroup: 'allages',
    expectedTheme: 'purple'
  },
  {
    name: 'Between Adult and Kids Events',
    mockTime: '2025-05-01T18:30:00Z',
    expectedStatus: 'between',
    currentAge: 'adults',
    nextAge: 'elementary'
  }
];
```

### Age Group Validation
```bash
# Test age group detection endpoint
curl "https://your-app.vercel.app/api/admin/validate-age-groups" \
  -H "Authorization: Bearer admin-token"

# Response includes validation results
{
  "totalEvents": 172,
  "ageGroupBreakdown": {
    "adults": 145,
    "elementary": 12,
    "allages": 8,
    "unknown": 7
  },
  "validationErrors": [
    {
      "eventId": "abc123",
      "title": "Mystery Workshop", 
      "issue": "No age group detected in description"
    }
  ]
}
```

## 🚀 Benefits of Age Group Features

### ✅ Better Visitor Experience
- **Clear Expectations**: Visitors know immediately if an event is appropriate
- **Visual Clarity**: Color coding and emojis make age groups instantly recognizable
- **Family Planning**: Parents can see what's suitable for their children

### ✅ Improved Accessibility  
- **Multiple Indicators**: Color, emoji, and text labels accommodate different needs
- **Large Display**: Easy to read age information from across the room
- **Consistent Theming**: Predictable color associations help regular visitors

### ✅ Staff Benefits
- **Quick Reference**: Staff can instantly see target audience for current/next events
- **Analytics**: Understanding age group distribution helps with scheduling
- **Testing Tools**: Admin panel allows testing different age group scenarios

## 📈 Future Age Group Enhancements

### Planned Features
- **Age Group Scheduling Analytics**: Track most popular age groups by time/day
- **Smart Filtering**: Auto-hide age-inappropriate events based on time of day
- **Registration Integration**: Link to age-specific registration forms
- **Capacity Indicators**: Show remaining spots for age-restricted events
- **Multi-Language**: Age group labels in multiple languages

### Advanced Age Detection
```typescript
// Future: More sophisticated age group detection
const advancedAgePatterns = [
  { pattern: /Preschool|Pre-K|Ages 3-5/i, group: 'preschool' },
  { pattern: /Middle School|Ages 11-14/i, group: 'middleschool' },  
  { pattern: /High School|Ages 15-18/i, group: 'highschool' },
  { pattern: /Senior|55\+|Older Adults/i, group: 'seniors' },
  { pattern: /Family|Parent.*Child|Intergenerational/i, group: 'family' }
];
```

This enhanced system provides clear, immediate visual feedback about who each makerspace event is designed for, making the space more welcoming and accessible to all visitors!

## 🖥️ Production Live Display Requirements

For a truly robust TV display system, we need these additional production-ready features:

### Hardware & Infrastructure
- **Display Hardware**: TV/monitor with HDMI input
- **Compute Device**: 
  - Raspberry Pi 4+ (recommended for cost)
  - Chrome OS device / Chromebox
  - Mini PC with Chrome browser
- **Network**: Reliable WiFi or ethernet connection
- **Power**: UPS backup power supply recommended
- **Mounting**: Secure wall/stand mounting with cable management

### Browser Kiosk Mode Setup
```bash
# Chrome kiosk mode startup script
chromium-browser \
  --kiosk \
  --start-fullscreen \
  --disable-infobars \
  --disable-session-crashed-bubble \
  --disable-restore-session-state \
  --autoplay-policy=no-user-gesture-required \
  --disable-web-security \
  --disable-features=TranslateUI \
  --no-first-run \
  --fast \
  --fast-start \
  --disable-default-apps \
  "https://your-makerspace-display.vercel.app"
```

### Reliability & Recovery Features

#### Auto-Recovery System
```typescript
// Client-side health monitoring
class DisplayHealthMonitor {
  private lastUpdate: Date = new Date();
  private healthCheckInterval: number = 30000; // 30 seconds
  
  startMonitoring() {
    setInterval(() => {
      this.checkHealth();
    }, this.healthCheckInterval);
  }
  
  private checkHealth() {
    const now = new Date();
    const timeSinceUpdate = now.getTime() - this.lastUpdate.getTime();
    
    // If no updates for 5 minutes, reload page
    if (timeSinceUpdate > 300000) {
      console.warn('Display appears frozen, reloading...');
      window.location.reload();
    }
    
    // Check if we're online
    if (!navigator.onLine) {
      this.showOfflineMessage();
    }
  }
  
  markUpdate() {
    this.lastUpdate = new Date();
  }
}
```

#### Offline/Network Failure Handling
- **Offline Detection**: Show "Network Disconnected" message
- **Cached Data**: Store last successful calendar data in localStorage
- **Graceful Degradation**: Show static "Please Check Website" if all else fails
- **Auto-Reconnect**: Automatic retry when network returns

#### Browser Crash Prevention
```javascript
// Prevent browser from sleeping/freezing
setInterval(() => {
  // Keep browser active with invisible ping
  fetch('/api/heartbeat', { method: 'POST' }).catch(() => {});
}, 60000);

// Auto-reload if page becomes unresponsive
let lastRender = Date.now();
setInterval(() => {
  if (Date.now() - lastRender > 180000) { // 3 minutes
    location.reload();
  }
}, 30000);

// Update render timestamp on each React render
useEffect(() => {
  lastRender = Date.now();
});
```

### Display Management Features

#### Screen Burn-in Prevention
```css
/* Subtle animations to prevent burn-in */
.display-content {
  animation: subtle-shift 300s infinite alternate;
}

@keyframes subtle-shift {
  0% { transform: translate(0, 0); }
  100% { transform: translate(2px, 1px); }
}

/* Time-based dimming during off-hours */
.night-mode {
  filter: brightness(0.7);
  transition: filter 2s ease;
}
```

#### Emergency Override System
```typescript
// Emergency message override via admin panel
interface EmergencyMessage {
  active: boolean;
  title: string;
  message: string;
  type: 'maintenance' | 'emergency' | 'announcement';
  expiresAt?: Date;
}

// API endpoint: /api/admin/emergency-override
export async function POST(request: Request) {
  const override: EmergencyMessage = await request.json();
  await kv.set('display:emergency-override', override);
  return NextResponse.json({ success: true });
}
```

### Remote Monitoring & Management

#### Health Dashboard (`/api/status/health`)
```json
{
  "displayOnline": true,
  "lastHeartbeat": "2025-08-10T17:57:00Z",
  "browserInfo": {
    "userAgent": "Chrome/91.0",
    "screenResolution": "1920x1080",
    "uptime": "2d 14h 32m"
  },
  "calendarStatus": {
    "lastFetch": "2025-08-10T17:55:00Z",
    "eventCount": 172,
    "nextUpdate": "2025-08-10T18:10:00Z"
  },
  "errors": [],
  "performance": {
    "avgResponseTime": "45ms",
    "memoryUsage": "156MB"
  }
}
```

#### Remote Restart Capability
```bash
# Watchdog script on the device
#!/bin/bash
# /home/pi/display-watchdog.sh

while true; do
  # Check if display is responding
  response=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/api/heartbeat)
  
  if [ "$response" != "200" ]; then
    echo "Display not responding, restarting browser..."
    pkill chromium
    sleep 5
    ./start-display.sh
  fi
  
  sleep 60
done
```

### Content & Error Handling

#### Fallback Content Strategy
```typescript
const FALLBACK_CONTENT = {
  noEvents: {
    title: "HQ Makerspace",
    message: "No events scheduled at this time",
    action: "Visit aclib.us for current hours"
  },
  networkError: {
    title: "Connection Issue",
    message: "Unable to load calendar data",
    action: "Showing last known schedule"
  },
  systemError: {
    title: "System Maintenance", 
    message: "Display temporarily unavailable",
    action: "Please check back shortly"
  }
};
```

#### Data Validation & Sanitization
```typescript
function validateEventData(events: any[]): ProcessedEvent[] {
  return events
    .filter(event => {
      // Basic validation
      if (!event.title || !event.start) return false;
      if (event.title === 'Busy') return false;
      
      // Date validation
      const startDate = new Date(event.start);
      if (isNaN(startDate.getTime())) return false;
      
      // Age group validation
      if (!event.ageGroup || !event.ageGroup.group) return false;
      
      return true;
    })
    .map(event => ({
      ...event,
      // Sanitize text content
      title: sanitizeText(event.title),
      description: sanitizeText(event.description),
      location: sanitizeText(event.location)
    }));
}
```

### Performance Optimization

#### Efficient Rendering
```typescript
// Minimize re-renders with proper memoization
const DisplayContent = memo(() => {
  const { currentEvent, nextEvent, currentTime } = useEventStatus();
  
  // Only update time display every minute for performance
  const displayTime = useMemo(() => {
    return format(currentTime, 'h:mm a, EEEE MMM d');
  }, [Math.floor(currentTime.getTime() / 60000)]);
  
  return (
    <div className={`display theme-${currentEvent?.ageGroup.group || 'default'}`}>
      {/* Display content */}
    </div>
  );
});
```

#### Resource Management
```typescript
// Cleanup and memory management
useEffect(() => {
  let intervals: NodeJS.Timeout[] = [];
  let timeouts: NodeJS.Timeout[] = [];
  
  // Setup intervals with cleanup tracking
  const addInterval = (callback: () => void, ms: number) => {
    const id = setInterval(callback, ms);
    intervals.push(id);
    return id;
  };
  
  return () => {
    // Cleanup all intervals and timeouts
    intervals.forEach(clearInterval);
    timeouts.forEach(clearTimeout);
  };
}, []);
```

### Installation & Setup Guide

#### Raspberry Pi Setup Script
```bash
#!/bin/bash
# setup-display.sh

echo "Setting up Makerspace Display..."

# Update system
sudo apt update && sudo apt upgrade -y

# Install Chrome
wget -q -O - https://dl.google.com/linux/linux_signing_key.pub | sudo apt-key add -
echo "deb [arch=amd64] http://dl.google.com/linux/chrome/deb/ stable main" | sudo tee /etc/apt/sources.list.d/google-chrome.list
sudo apt update
sudo apt install -y google-chrome-stable

# Install unclutter (hides mouse cursor)
sudo apt install -y unclutter

# Setup auto-start
cp display-startup.desktop ~/.config/autostart/

# Create startup script
cat > ~/start-display.sh << 'EOF'
#!/bin/bash
export DISPLAY=:0
unclutter -idle 0.5 -root &
google-chrome --kiosk --start-fullscreen --disable-infobars https://your-display-url.vercel.app
EOF

chmod +x ~/start-display.sh

echo "Setup complete! Rebooting in 10 seconds..."
sleep 10
sudo reboot
```

### Maintenance & Support

#### Staff Training Checklist
- [ ] How to access admin panel (`/admin`)
- [ ] Setting time overrides for testing
- [ ] Emergency override procedures  
- [ ] Basic troubleshooting (restart browser, check network)
- [ ] Who to contact for technical support
- [ ] How to check display health remotely

#### Monitoring Alerts
```typescript
// Optional: Slack/email alerts for issues
if (timeSinceLastHeartbeat > 300000) { // 5 minutes
  await sendAlert({
    type: 'display_offline',
    message: 'Makerspace display has been offline for 5+ minutes',
    severity: 'warning'
  });
}
```

### Security Considerations
- **Admin Panel**: Password protection with rate limiting
- **API Endpoints**: CORS restrictions, input validation
- **Network**: VPN or firewall rules if needed
- **Physical Security**: Secure mounting, locked ports/cables
- **Auto-updates**: Keep browser and OS updated automatically

These production requirements ensure the display works reliably 24/7 with minimal staff intervention!
