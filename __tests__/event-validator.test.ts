// __tests__/event-validator.test.ts
import { EventValidator } from '../src/lib/event-validator';
import { ProcessedEvent } from '../src/shared/types';

describe('EventValidator', () => {
  let validator: EventValidator;

  beforeEach(() => {
    validator = new EventValidator();
  });

  const createMockEvent = (overrides: Partial<ProcessedEvent> = {}): ProcessedEvent => ({
    id: 'test-123',
    title: 'Test Event',
    description: 'Test description',
    location: 'Test Location',
    start: '2025-08-10T10:00:00Z',
    end: '2025-08-10T12:00:00Z',
    status: 'confirmed',
    isAllDay: false,
    ageGroup: {
      group: 'adults',
      emoji: '🧑',
      label: 'Adults (19+)',
      color: '#1e40af'
    },
    categories: ['Workshop'],
    isRecurring: false,
    ...overrides
  });

  describe('validateEvent', () => {
    it('should pass validation for a valid event', () => {
      const event = createMockEvent();
      const result = validator.validateEvent(event);
      
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should fail validation when title is missing', () => {
      const event = createMockEvent({ title: '' });
      const result = validator.validateEvent(event);
      
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Title is required');
    });

    it('should fail validation when start time is missing', () => {
      const event = createMockEvent({ start: '' });
      const result = validator.validateEvent(event);
      
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Start time is required');
    });

    it('should fail validation when end time is missing', () => {
      const event = createMockEvent({ end: '' });
      const result = validator.validateEvent(event);
      
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('End time is required');
    });

    it('should fail validation for invalid start time format', () => {
      const event = createMockEvent({ start: 'invalid-date' });
      const result = validator.validateEvent(event);
      
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Invalid start time format');
    });

    it('should fail validation for invalid end time format', () => {
      const event = createMockEvent({ end: 'invalid-date' });
      const result = validator.validateEvent(event);
      
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Invalid end time format');
    });

    it('should fail validation when end time is before start time', () => {
      const event = createMockEvent({
        start: '2025-08-10T12:00:00Z',
        end: '2025-08-10T10:00:00Z'
      });
      const result = validator.validateEvent(event);
      
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('End time must be after start time');
    });

    it('should fail validation when start and end times are equal', () => {
      const event = createMockEvent({
        start: '2025-08-10T12:00:00Z',
        end: '2025-08-10T12:00:00Z'
      });
      const result = validator.validateEvent(event);
      
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('End time must be after start time');
    });

    it('should fail validation when age group is missing', () => {
      const event = createMockEvent({ ageGroup: null as any });
      const result = validator.validateEvent(event);
      
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Age group detection failed');
    });

    it('should fail validation for busy events', () => {
      const event = createMockEvent({ title: 'Busy - Personal Time' });
      const result = validator.validateEvent(event);
      
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Busy events should be filtered out');
    });

    it('should accumulate multiple validation errors', () => {
      const event = createMockEvent({
        title: '',
        start: 'invalid',
        end: 'invalid',
        ageGroup: null as any
      });
      const result = validator.validateEvent(event);
      
      expect(result.valid).toBe(false);
      expect(result.errors).toHaveLength(4);
      expect(result.errors).toContain('Title is required');
      expect(result.errors).toContain('Invalid start time format');
      expect(result.errors).toContain('Invalid end time format');
      expect(result.errors).toContain('Age group detection failed');
    });
  });

  describe('filterEvents', () => {
    it('should filter out busy events', () => {
      const events = [
        createMockEvent({ id: '1', title: 'Regular Event' }),
        createMockEvent({ id: '2', title: 'Busy - Private Time' }),
        createMockEvent({ id: '3', title: 'Another Event' })
      ];

      const filtered = validator.filterEvents(events);
      
      expect(filtered).toHaveLength(2);
      expect(filtered.map(e => e.id)).toEqual(['1', '3']);
    });

    it('should filter out cancelled events', () => {
      const events = [
        createMockEvent({ id: '1', status: 'confirmed' }),
        createMockEvent({ id: '2', status: 'cancelled' }),
        createMockEvent({ id: '3', status: 'tentative' })
      ];

      const filtered = validator.filterEvents(events);
      
      expect(filtered).toHaveLength(2);
      expect(filtered.map(e => e.id)).toEqual(['1', '3']);
    });

    it('should filter out invalid events', () => {
      const events = [
        createMockEvent({ id: '1' }), // Valid
        createMockEvent({ id: '2', title: '' }), // Invalid - no title
        createMockEvent({ id: '3', start: 'invalid' }) // Invalid - bad date
      ];

      const filtered = validator.filterEvents(events);
      
      expect(filtered).toHaveLength(1);
      expect(filtered[0].id).toBe('1');
    });

    it('should handle empty events array', () => {
      const filtered = validator.filterEvents([]);
      expect(filtered).toHaveLength(0);
    });

    it('should maintain original event data for valid events', () => {
      const originalEvent = createMockEvent({ id: '1', title: 'Test Event' });
      const filtered = validator.filterEvents([originalEvent]);
      
      expect(filtered).toHaveLength(1);
      expect(filtered[0]).toEqual(originalEvent);
    });
  });

  describe('sanitizeEvent', () => {
    it('should sanitize text fields', () => {
      const event = createMockEvent({
        title: '  <script>Test Event</script>  ',
        description: 'Test   description\n\nwith  extra  spaces',
        location: 'Location<>with<>brackets'
      });

      const sanitized = validator.sanitizeEvent(event);
      
      expect(sanitized.title).toBe('scriptTest Event/script');
      expect(sanitized.description).toBe('Test description with extra spaces');
      expect(sanitized.location).toBe('Locationwithbrackets');
    });

    it('should handle empty text fields', () => {
      const event = createMockEvent({
        title: '',
        description: null as any,
        location: undefined as any
      });

      const sanitized = validator.sanitizeEvent(event);
      
      expect(sanitized.title).toBe('');
      expect(sanitized.description).toBe('');
      expect(sanitized.location).toBe('');
    });

    it('should truncate very long text', () => {
      const longText = 'a'.repeat(600);
      const event = createMockEvent({
        title: longText,
        description: longText
      });

      const sanitized = validator.sanitizeEvent(event);
      
      expect(sanitized.title).toHaveLength(500);
      expect(sanitized.description).toHaveLength(500);
    });

    it('should preserve other event properties', () => {
      const event = createMockEvent();
      const sanitized = validator.sanitizeEvent(event);
      
      expect(sanitized.id).toBe(event.id);
      expect(sanitized.start).toBe(event.start);
      expect(sanitized.end).toBe(event.end);
      expect(sanitized.status).toBe(event.status);
      expect(sanitized.isAllDay).toBe(event.isAllDay);
      expect(sanitized.ageGroup).toEqual(event.ageGroup);
      expect(sanitized.categories).toEqual(event.categories);
      expect(sanitized.isRecurring).toBe(event.isRecurring);
    });
  });
});
