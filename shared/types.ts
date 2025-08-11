// shared/types.ts - Core TypeScript interfaces for Maker Space Live Event Display
// Created by Backend Agent - Used by Functions and Frontend agents

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
