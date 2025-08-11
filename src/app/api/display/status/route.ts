// app/api/display/status/route.ts
import { NextResponse } from 'next/server';
import { DisplayStatus, ProcessedEvent } from '@/shared/types';
import { KVStorage } from '@/lib/kv-storage';

export async function GET() {
  const storage = new KVStorage();
  
  try {
    console.log('📡 Display status API called');

    // Get mock time override if set
    const mockTime = await storage.getTimeOverride();
    const currentTimeStr = mockTime || new Date().toISOString();
    const now = new Date(currentTimeStr);

    console.log(`⏰ Using time: ${currentTimeStr} (mock: ${!!mockTime})`);

    // Fetch processed events from storage
    const events = await storage.getEvents();
    console.log(`📅 Retrieved ${events.length} events from storage`);
    
    // Filter for current and upcoming events based on the time
    const currentEvents: ProcessedEvent[] = [];
    const upcomingEvents: ProcessedEvent[] = [];
    
    events.forEach(event => {
      const eventStart = new Date(event.start);
      const eventEnd = new Date(event.end);
      
      if (eventStart <= now && now <= eventEnd) {
        currentEvents.push(event);
      } else if (eventStart > now) {
        upcomingEvents.push(event);
      }
    });

    // Sort upcoming events by start time
    upcomingEvents.sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());

    // Determine display status
    let status: DisplayStatus['status'];
    let displayTheme: string;
    let timeUntilNext: string | undefined;
    const currentEvent = currentEvents[0] || undefined;
    const nextEvent = upcomingEvents[0] || undefined;

    if (currentEvent) {
      status = 'current';
      displayTheme = getThemeFromAgeGroup(currentEvent.ageGroup);
      
      // Calculate time until current event ends
      const endTime = new Date(currentEvent.end);
      const msUntilEnd = endTime.getTime() - now.getTime();
      timeUntilNext = formatTimeRemaining(msUntilEnd);
    } else if (nextEvent) {
      const startTime = new Date(nextEvent.start);
      const msUntilStart = startTime.getTime() - now.getTime();
      
      // If next event is within 2 hours, show "between events"
      if (msUntilStart <= 2 * 60 * 60 * 1000) {
        status = 'between';
        displayTheme = getThemeFromAgeGroup(nextEvent.ageGroup);
        timeUntilNext = formatTimeRemaining(msUntilStart);
      } else {
        status = 'closed';
        displayTheme = 'closed';
      }
    } else {
      status = 'closed';
      displayTheme = 'closed';
    }

    const response: DisplayStatus = {
      status,
      currentTime: currentTimeStr,
      displayTheme,
      timeUntilNext,
      currentEvent,
      nextEvent,
      mockTime: mockTime || undefined
    };

    console.log('📡 Returning status:', { 
      status: response.status, 
      hasCurrentEvent: !!response.currentEvent,
      hasNextEvent: !!response.nextEvent,
      theme: response.displayTheme
    });

    return NextResponse.json(response);
    
  } catch (error) {
    console.error('❌ Display status API error:', error);
    
    // Return safe error status
    const errorResponse: DisplayStatus = {
      status: 'closed',
      currentTime: new Date().toISOString(),
      displayTheme: 'closed'
    };
    
    return NextResponse.json(errorResponse, { status: 200 });
  }
}

function getThemeFromAgeGroup(ageGroup: string): string {
  const themeMap: Record<string, string> = {
    'all-ages': 'allages',
    'kids': 'elementary',
    'teens': 'teens', 
    'adults': 'adults',
    'seniors': 'adults',
    'unknown': 'unknown'
  };
  
  return themeMap[ageGroup] || 'unknown';
}

function formatTimeRemaining(ms: number): string {
  if (ms <= 0) return '0 minutes';
  
  const minutes = Math.floor(ms / (1000 * 60));
  const hours = Math.floor(minutes / 60);
  
  if (hours > 0) {
    const remainingMinutes = minutes % 60;
    if (remainingMinutes === 0) {
      return `${hours} hour${hours !== 1 ? 's' : ''}`;
    }
    return `${hours}h ${remainingMinutes}m`;
  }
  
  return `${minutes} minute${minutes !== 1 ? 's' : ''}`;
}
