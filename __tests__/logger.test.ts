// __tests__/logger.test.ts
import { Logger, CalendarError, ErrorHandler, CalendarErrorCodes } from '../lib/logger';

describe('Logger', () => {
  beforeEach(() => {
    Logger.clearLogs();
    // Mock console methods to avoid cluttering test output
    jest.spyOn(console, 'debug').mockImplementation();
    jest.spyOn(console, 'info').mockImplementation();
    jest.spyOn(console, 'warn').mockImplementation();
    jest.spyOn(console, 'error').mockImplementation();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('logging methods', () => {
    it('should log debug messages', () => {
      Logger.debug('TestComponent', 'Debug message', { key: 'value' });
      
      const logs = Logger.getLogs();
      expect(logs).toHaveLength(1);
      expect(logs[0].level).toBe('debug');
      expect(logs[0].component).toBe('TestComponent');
      expect(logs[0].message).toBe('Debug message');
      expect(logs[0].data).toEqual({ key: 'value' });
    });

    it('should log info messages', () => {
      Logger.info('TestComponent', 'Info message');
      
      const logs = Logger.getLogs();
      expect(logs).toHaveLength(1);
      expect(logs[0].level).toBe('info');
    });

    it('should log warn messages', () => {
      const error = new Error('Test error');
      Logger.warn('TestComponent', 'Warning message', { data: 'test' }, error);
      
      const logs = Logger.getLogs();
      expect(logs).toHaveLength(1);
      expect(logs[0].level).toBe('warn');
      expect(logs[0].error).toBe(error);
    });

    it('should log error messages', () => {
      const error = new Error('Test error');
      Logger.error('TestComponent', 'Error message', { data: 'test' }, error);
      
      const logs = Logger.getLogs();
      expect(logs).toHaveLength(1);
      expect(logs[0].level).toBe('error');
      expect(logs[0].error).toBe(error);
    });
  });

  describe('log level filtering', () => {
    it('should respect log level settings', () => {
      Logger.setLogLevel('warn');
      
      Logger.debug('Test', 'Debug message');
      Logger.info('Test', 'Info message');
      Logger.warn('Test', 'Warning message');
      Logger.error('Test', 'Error message');
      
      const logs = Logger.getLogs();
      expect(logs).toHaveLength(2); // Only warn and error should be logged
      expect(logs.map(l => l.level)).toEqual(['warn', 'error']);
    });

    it('should log all messages at debug level', () => {
      Logger.setLogLevel('debug');
      
      Logger.debug('Test', 'Debug message');
      Logger.info('Test', 'Info message');
      Logger.warn('Test', 'Warning message');
      Logger.error('Test', 'Error message');
      
      const logs = Logger.getLogs();
      expect(logs).toHaveLength(4);
    });
  });

  describe('log management', () => {
    it('should maintain maximum log entries', () => {
      // Simulate adding many log entries
      for (let i = 0; i < 1200; i++) {
        Logger.info('Test', `Message ${i}`);
      }
      
      const logs = Logger.getLogs();
      expect(logs).toHaveLength(1000); // Should be capped at 1000
      
      // Should keep the most recent entries
      expect(logs[logs.length - 1].message).toBe('Message 1199');
    });

    it('should filter logs by level', () => {
      Logger.info('Test', 'Info message');
      Logger.warn('Test', 'Warning message');
      Logger.error('Test', 'Error message');
      
      const errorLogs = Logger.getLogs('error');
      expect(errorLogs).toHaveLength(1);
      expect(errorLogs[0].level).toBe('error');
    });

    it('should filter logs by component', () => {
      Logger.info('Component1', 'Message 1');
      Logger.info('Component2', 'Message 2');
      Logger.info('Component1', 'Message 3');
      
      const component1Logs = Logger.getLogs(undefined, 'Component1');
      expect(component1Logs).toHaveLength(2);
      expect(component1Logs.every(l => l.component === 'Component1')).toBe(true);
    });

    it('should clear all logs', () => {
      Logger.info('Test', 'Message');
      expect(Logger.getLogs()).toHaveLength(1);
      
      Logger.clearLogs();
      expect(Logger.getLogs()).toHaveLength(0);
    });
  });

  describe('getRecentErrors', () => {
    beforeEach(() => {
      // Mock Date.now for consistent testing
      const now = new Date('2025-08-10T12:00:00Z');
      jest.spyOn(Date, 'now').mockReturnValue(now.getTime());
      jest.spyOn(Date.prototype, 'toISOString').mockReturnValue(now.toISOString());
    });

    it('should return recent errors within time window', () => {
      // Add some errors
      Logger.error('Test', 'Recent error');
      
      // Mock an older timestamp for comparison
      const olderDate = new Date('2025-08-09T12:00:00Z');
      const logs = Logger.getLogs();
      if (logs.length > 0) {
        logs[0].timestamp = olderDate.toISOString();
        logs[0].timestampMs = olderDate.getTime();
      }
      
      Logger.error('Test', 'Another recent error');
      
      const recentErrors = Logger.getRecentErrors(1); // Last 1 hour
      expect(recentErrors).toHaveLength(1);
    });
  });

  describe('getLogStats', () => {
    it('should return correct log statistics', () => {
      Logger.debug('Test', 'Debug');
      Logger.info('Test', 'Info 1');
      Logger.info('Test', 'Info 2');
      Logger.warn('Test', 'Warning');
      Logger.error('Test', 'Error 1');
      Logger.error('Test', 'Error 2');
      Logger.error('Test', 'Error 3');
      
      const stats = Logger.getLogStats();
      expect(stats).toEqual({
        debug: 1,
        info: 2,
        warn: 1,
        error: 3
      });
    });
  });
});

describe('CalendarError', () => {
  beforeEach(() => {
    Logger.clearLogs();
    jest.spyOn(console, 'error').mockImplementation();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should create error with all properties', () => {
    const error = new CalendarError(
      'Test error message',
      'TestComponent',
      CalendarErrorCodes.FETCH_FAILED,
      true,
      { additionalData: 'test' }
    );

    expect(error.message).toBe('Test error message');
    expect(error.component).toBe('TestComponent');
    expect(error.errorCode).toBe(CalendarErrorCodes.FETCH_FAILED);
    expect(error.recoverable).toBe(true);
    expect(error.data).toEqual({ additionalData: 'test' });
    expect(error.name).toBe('CalendarError');
  });

  it('should use default values for optional parameters', () => {
    const error = new CalendarError('Test error', 'TestComponent');

    expect(error.errorCode).toBe('UNKNOWN');
    expect(error.recoverable).toBe(false);
    expect(error.data).toBeUndefined();
  });

  it('should automatically log the error when created', () => {
    new CalendarError('Test error', 'TestComponent');

    const logs = Logger.getLogs('error');
    expect(logs).toHaveLength(1);
    expect(logs[0].component).toBe('TestComponent');
    expect(logs[0].message).toBe('Test error');
  });
});

describe('ErrorHandler', () => {
  beforeEach(() => {
    Logger.clearLogs();
    jest.spyOn(console, 'error').mockImplementation();
    jest.spyOn(console, 'warn').mockImplementation();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('handleCalendarFetch', () => {
    it('should handle CalendarError correctly', async () => {
      const calendarError = new CalendarError(
        'Calendar fetch failed',
        'TestComponent',
        CalendarErrorCodes.FETCH_FAILED
      );

      const result = await ErrorHandler.handleCalendarFetch(calendarError, 'test-calendar');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Calendar fetch failed');
    });

    it('should handle generic Error', async () => {
      const genericError = new Error('Network error');
      const result = await ErrorHandler.handleCalendarFetch(genericError, 'test-calendar');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Calendar fetch failed: Network error');
    });

    it('should handle unknown error types', async () => {
      const unknownError = 'String error';
      const result = await ErrorHandler.handleCalendarFetch(unknownError, 'test-calendar');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Unknown error occurred while fetching calendar');
    });
  });

  describe('handleEventProcessing', () => {
    it('should handle CalendarError for event processing', async () => {
      const calendarError = new CalendarError(
        'Event processing failed',
        'EventProcessor',
        CalendarErrorCodes.PARSE_FAILED
      );

      const result = await ErrorHandler.handleEventProcessing(calendarError, { eventId: 'test' });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Event processing failed');
    });

    it('should handle generic Error for event processing', async () => {
      const genericError = new Error('Parsing error');
      const result = await ErrorHandler.handleEventProcessing(genericError, { eventId: 'test' });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Event processing failed: Parsing error');
    });
  });

  describe('handleAgeGroupDetection', () => {
    it('should handle age group detection errors gracefully', async () => {
      const error = new Error('Age detection failed');
      const result = await ErrorHandler.handleAgeGroupDetection(error, 'Test event description');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Age group detection failed, using fallback');

      const logs = Logger.getLogs('warn');
      expect(logs).toHaveLength(1);
      expect(logs[0].message).toContain('Age group detection failed for: "Test event description');
    });

    it('should truncate long descriptions in logs', async () => {
      const longDescription = 'a'.repeat(100);
      const error = new Error('Age detection failed');
      
      await ErrorHandler.handleAgeGroupDetection(error, longDescription);

      const logs = Logger.getLogs('warn');
      expect(logs[0].message).toContain('...');
      expect(logs[0].message.length).toBeLessThan(longDescription.length + 50);
    });
  });

  describe('isRecoverableError', () => {
    it('should return true for recoverable CalendarError', () => {
      const recoverableError = new CalendarError(
        'Recoverable error',
        'Test',
        CalendarErrorCodes.AGE_GROUP_DETECTION_FAILED,
        true
      );

      expect(ErrorHandler.isRecoverableError(recoverableError)).toBe(true);
    });

    it('should return false for non-recoverable CalendarError', () => {
      const nonRecoverableError = new CalendarError(
        'Non-recoverable error',
        'Test',
        CalendarErrorCodes.FETCH_FAILED,
        false
      );

      expect(ErrorHandler.isRecoverableError(nonRecoverableError)).toBe(false);
    });

    it('should return false for non-CalendarError', () => {
      const genericError = new Error('Generic error');
      expect(ErrorHandler.isRecoverableError(genericError)).toBe(false);
    });
  });

  describe('getErrorSummary', () => {
    it('should return error summary statistics', () => {
      // Add some test errors
      Logger.error('Component1', 'Error 1');
      Logger.error('Component1', 'Error 2');
      Logger.error('Component2', 'Error 3');

      const summary = ErrorHandler.getErrorSummary();

      expect(summary.totalErrors).toBe(3);
      expect(summary.errorsByComponent).toEqual({
        Component1: 2,
        Component2: 1
      });
    });

    it('should handle empty error logs', () => {
      const summary = ErrorHandler.getErrorSummary();

      expect(summary.totalErrors).toBe(0);
      expect(summary.recentErrors).toBe(0);
      expect(summary.errorsByComponent).toEqual({});
    });
  });
});

describe('CalendarErrorCodes', () => {
  it('should contain all expected error codes', () => {
    const expectedCodes = [
      'FETCH_FAILED',
      'PARSE_FAILED',
      'VALIDATION_FAILED',
      'NETWORK_ERROR',
      'INVALID_DATE',
      'MISSING_REQUIRED_FIELD',
      'AGE_GROUP_DETECTION_FAILED'
    ];

    expectedCodes.forEach(code => {
      expect(CalendarErrorCodes).toHaveProperty(code);
      expect(typeof CalendarErrorCodes[code as keyof typeof CalendarErrorCodes]).toBe('string');
    });
  });
});
