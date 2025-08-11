// lib/logger.ts
export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface LogEntry {
  timestamp: string;
  timestampMs?: number;
  level: LogLevel;
  component: string;
  message: string;
  data?: any;
  error?: Error;
}

export class Logger {
  private static logs: LogEntry[] = [];
  private static maxLogs = 1000; // Keep last 1000 log entries
  private static logLevel: LogLevel = process.env.NODE_ENV === 'test' ? 'debug' : (process.env.NODE_ENV === 'development' ? 'debug' : 'info');

  static setLogLevel(level: LogLevel) {
    this.logLevel = level;
  }

  static debug(component: string, message: string, data?: any) {
    this.log('debug', component, message, data);
  }

  static info(component: string, message: string, data?: any) {
    this.log('info', component, message, data);
  }

  static warn(component: string, message: string, data?: any, error?: Error) {
    this.log('warn', component, message, data, error);
  }

  static error(component: string, message: string, data?: any, error?: Error) {
    this.log('error', component, message, data, error);
  }

  private static log(level: LogLevel, component: string, message: string, data?: any, error?: Error) {
    if (!this.shouldLog(level)) return;

    const nowMs = Date.now();
    const entry: LogEntry = {
      timestamp: new Date(nowMs).toISOString(),
      timestampMs: nowMs,
      level,
      component,
      message,
      data,
      error
    };

    // Add to memory store
    this.logs.push(entry);
    if (this.logs.length > this.maxLogs) {
      this.logs.shift();
    }

    // Console output
    this.outputToConsole(entry);
  }

  private static shouldLog(level: LogLevel): boolean {
    const levels: LogLevel[] = ['debug', 'info', 'warn', 'error'];
    const currentIndex = levels.indexOf(this.logLevel);
    const messageIndex = levels.indexOf(level);
    return messageIndex >= currentIndex;
  }

  private static outputToConsole(entry: LogEntry) {
    const timestamp = new Date(entry.timestamp).toLocaleTimeString();
    const prefix = `[${timestamp}] [${entry.level.toUpperCase()}] [${entry.component}]`;

    switch (entry.level) {
      case 'debug':
        console.debug(`${prefix} ${entry.message}`, entry.data || '');
        break;
      case 'info':
        console.info(`${prefix} ${entry.message}`, entry.data || '');
        break;
      case 'warn':
        console.warn(`${prefix} ${entry.message}`, entry.data || '', entry.error || '');
        break;
      case 'error':
        console.error(`${prefix} ${entry.message}`, entry.data || '', entry.error || '');
        break;
    }
  }

  static getLogs(level?: LogLevel, component?: string): LogEntry[] {
    return this.logs.filter(log => {
      if (level && log.level !== level) return false;
      if (component && log.component !== component) return false;
      return true;
    });
  }

  static getRecentErrors(hours: number = 24): LogEntry[] {
    const nowMs = Date.now();
    const cutoffMs = nowMs - hours * 60 * 60 * 1000;
    return this.logs.filter(log => {
      if (log.level !== 'error') return false;
      const ts = typeof log.timestampMs === 'number' ? log.timestampMs : new Date(log.timestamp).getTime();
      return ts >= cutoffMs;
    });
  }

  static clearLogs() {
    this.logs = [];
  }

  static getLogStats(): Record<LogLevel, number> {
    return this.logs.reduce((acc, log) => {
      acc[log.level] = (acc[log.level] || 0) + 1;
      return acc;
    }, {} as Record<LogLevel, number>);
  }
}

export class CalendarError extends Error {
  public readonly component: string;
  public readonly errorCode: string;
  public readonly recoverable: boolean;
  public readonly data?: any;

  constructor(
    message: string,
    component: string,
    errorCode: string = 'UNKNOWN',
    recoverable: boolean = false,
    data?: any
  ) {
    super(message);
    this.name = 'CalendarError';
    this.component = component;
    this.errorCode = errorCode;
    this.recoverable = recoverable;
    this.data = data;

    // Log the error immediately
    Logger.error(component, message, data, this);
  }
}

export class ErrorHandler {
  static async handleCalendarFetch(error: unknown, calendarId: string): Promise<{ success: false; error: string }> {
    if (error instanceof CalendarError) {
      Logger.error('ErrorHandler', `Calendar fetch failed: ${error.message}`, { calendarId, errorCode: error.errorCode });
      return { success: false, error: error.message };
    }

    if (error instanceof Error) {
      Logger.error('ErrorHandler', `Unexpected calendar fetch error: ${error.message}`, { calendarId }, error);
      return { success: false, error: `Calendar fetch failed: ${error.message}` };
    }

    Logger.error('ErrorHandler', 'Unknown calendar fetch error', { calendarId, error });
    return { success: false, error: 'Unknown error occurred while fetching calendar' };
  }

  static async handleEventProcessing(error: unknown, eventData?: any): Promise<{ success: false; error: string }> {
    if (error instanceof CalendarError) {
      Logger.error('ErrorHandler', `Event processing failed: ${error.message}`, { eventData, errorCode: error.errorCode });
      return { success: false, error: error.message };
    }

    if (error instanceof Error) {
      Logger.error('ErrorHandler', `Unexpected event processing error: ${error.message}`, { eventData }, error);
      return { success: false, error: `Event processing failed: ${error.message}` };
    }

    Logger.error('ErrorHandler', 'Unknown event processing error', { eventData, error });
    return { success: false, error: 'Unknown error occurred while processing event' };
  }

  static async handleAgeGroupDetection(error: unknown, description: string): Promise<{ success: false; error: string }> {
    Logger.warn('ErrorHandler', `Age group detection failed for: "${description.substring(0, 50)}..."`, { error });
    
    // Age group detection errors are recoverable - we can fall back to 'unknown'
    return { success: false, error: 'Age group detection failed, using fallback' };
  }

  static isRecoverableError(error: unknown): boolean {
    if (error instanceof CalendarError) {
      return error.recoverable;
    }
    return false;
  }

  static getErrorSummary(): { totalErrors: number; recentErrors: number; errorsByComponent: Record<string, number> } {
    const errors = Logger.getLogs('error');
    const recentErrors = Logger.getRecentErrors(1);
    
    const errorsByComponent = errors.reduce((acc, error) => {
      acc[error.component] = (acc[error.component] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      totalErrors: errors.length,
      recentErrors: recentErrors.length,
      errorsByComponent
    };
  }
}

// Common error types for the calendar system
export const CalendarErrorCodes = {
  FETCH_FAILED: 'FETCH_FAILED',
  PARSE_FAILED: 'PARSE_FAILED',
  VALIDATION_FAILED: 'VALIDATION_FAILED',
  NETWORK_ERROR: 'NETWORK_ERROR',
  INVALID_DATE: 'INVALID_DATE',
  MISSING_REQUIRED_FIELD: 'MISSING_REQUIRED_FIELD',
  AGE_GROUP_DETECTION_FAILED: 'AGE_GROUP_DETECTION_FAILED'
} as const;

export type CalendarErrorCode = typeof CalendarErrorCodes[keyof typeof CalendarErrorCodes];


// Global error handler for uncaught exceptions
if (typeof process !== 'undefined') {
  process.on('uncaughtException', (error) => {
    Logger.error('Global', 'Uncaught Exception', {}, error);
    // In a real production app, you might want to exit gracefully
    // process.exit(1);
  });

  process.on('unhandledRejection', (reason, promise) => {
    Logger.error('Global', 'Unhandled Rejection', { promise }, reason as Error);
  });
}
