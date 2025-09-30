// app/api/calendar/status/route.ts
import { NextResponse } from 'next/server';
import { DisplayStatus } from '@/shared/types';
import { calendarFetcher } from '@/lib/calendar-fetcher';
import { eventValidator } from '@/lib/event-validator';
import { LocalStorage } from '@/lib/local-storage';
import { Logger } from '@/lib/logger';

export const dynamic = 'force-dynamic'; // Ensure this route is always dynamic

export async function GET() {
  const storage = new LocalStorage();

  try {
    // 1. Get the current time (real or mocked)
    const mockTimeStr = storage.getTimeOverride();
    const currentTime = mockTimeStr ? new Date(mockTimeStr) : new Date();

    Logger.info('CalendarStatusAPI', `Processing request with time: ${currentTime.toISOString()} (mock: ${!!mockTimeStr})`);

    // 2. Fetch live events
    const allEvents = await calendarFetcher.fetchAllEvents();

    // Store events in localStorage for future use
    storage.storeEvents(allEvents);
    
    // 3. Filter for current and upcoming events based on the determined time
    const { current, upcoming } = eventValidator.filterCurrentAndUpcoming(
      allEvents,
      currentTime.toISOString()
    );

    // 4. Determine the display status
    let status: DisplayStatus['status'] = 'closed';
    let displayTheme = 'closed';
    let timeRemaining: string | undefined;
    let timeUntilNext: string | undefined;

    if (current) {
      status = 'current';
      displayTheme = current.ageGroup.group;
      const endTime = new Date(current.end);
      timeRemaining = formatTimeRemaining(endTime.getTime() - currentTime.getTime());
    } 
    
    if (upcoming.length > 0) {
      const nextEvent = upcoming[0];
      const startTime = new Date(nextEvent.start);
      const timeToStart = startTime.getTime() - currentTime.getTime();

      if (status === 'closed' && timeToStart <= 2 * 60 * 60 * 1000) {
        status = 'between';
        displayTheme = nextEvent.ageGroup.group;
      }
      timeUntilNext = formatTimeRemaining(timeToStart);
    }

    // 5. Construct the final response
    const response: DisplayStatus = {
      status,
      currentTime: currentTime.toISOString(),
      displayTheme,
      timeRemaining,
      timeUntilNext,
      currentEvent: current,
      nextEvent: upcoming[0],
      mockTime: mockTimeStr || undefined,
    };

    Logger.info('CalendarStatusAPI', `Returning status: ${status}, theme: ${displayTheme}`);
    return NextResponse.json(response);

  } catch (error) {
    Logger.error('CalendarStatusAPI', 'Error getting calendar status', {}, error as Error);
    
    // Return a generic error response
    return NextResponse.json({
      status: 'closed',
      currentTime: new Date().toISOString(),
      displayTheme: 'closed',
      error: 'Failed to retrieve calendar status.',
    }, { status: 500 });
  }
}

function formatTimeRemaining(ms: number): string {
  if (ms <= 0) return '0m';
  
  const totalMinutes = Math.floor(ms / 60000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes}m`;
}