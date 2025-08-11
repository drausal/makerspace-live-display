// lib/event-validator.ts
import { ProcessedEvent } from '@/shared/types';

export class EventValidator {
  
  filterCurrentAndUpcoming(events: ProcessedEvent[], currentTime: string): { current?: ProcessedEvent, upcoming: ProcessedEvent[] } {
    const now = new Date(currentTime);
    
    const sortedEvents = [...events].sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());
    
    let current: ProcessedEvent | undefined;
    const upcoming: ProcessedEvent[] = [];
    
    for (const event of sortedEvents) {
      const start = new Date(event.start);
      const end = new Date(event.end);
      
      if (now >= start && now <= end) {
        current = event;
      } else if (start > now) {
        upcoming.push(event);
      }
    }
    
    return { current, upcoming };
  }

  validateEvent(event: ProcessedEvent): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    // Required fields validation
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
    
    if (start.getTime() >= end.getTime()) {
      errors.push('End time must be after start time');
    }
    
    // Age group validation
    if (!event.ageGroup || !event.ageGroup.group) {
      errors.push('Age group detection failed');
    }
    
    // Title validation (skip "Busy" events)
    if (event.title.toLowerCase().includes('busy')) {
      errors.push('Busy events should be filtered out');
    }
    
    return {
      valid: errors.length === 0,
      errors
    };
  }
  
  filterEvents(events: ProcessedEvent[]): ProcessedEvent[] {
    console.log(`Filtering ${events.length} events...`);
    
    const filtered = events.filter(event => {
      // Skip "Busy" events (private/blocked time)
      if (event.title.toLowerCase().includes('busy')) {
        console.log(`❌ Filtered out busy event: ${event.title}`);
        return false;
      }
      
      // Skip cancelled events
      if (event.status === 'cancelled') {
        console.log(`❌ Filtered out cancelled event: ${event.title}`);
        return false;
      }
      
      // Validate event structure
      const validation = this.validateEvent(event);
      if (!validation.valid) {
        console.log(`❌ Filtered out invalid event: ${event.title}`, validation.errors);
        return false;
      }
      
      console.log(`✅ Event passed validation: ${event.title}`);
      return true;
    });
    
    console.log(`${filtered.length} events after filtering`);
    return filtered;
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
      .replace(/[^\x20-\x7E\n\r]/g, '') // Remove non-printable chars
      .substring(0, 500);    // Limit length
  }
}

export const eventValidator = new EventValidator();