// lib/local-storage.ts - Local Storage wrapper for caching calendar data
import { ProcessedEvent, CalendarFetchResult, SystemHealth } from '@/shared/types';

// Storage key prefix for namespacing
const STORAGE_PREFIX = 'makerspace-display:';

// Helper function to create namespaced keys
const createKey = (key: string) => `${STORAGE_PREFIX}${key}`;

// Storage interface that works both client and server side
interface StorageAdapter {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

// In-memory fallback for server-side or when localStorage is unavailable
class MemoryStorage implements StorageAdapter {
  private storage: Record<string, string> = {};

  getItem(key: string): string | null {
    return this.storage[key] || null;
  }

  setItem(key: string, value: string): void {
    this.storage[key] = value;
  }

  removeItem(key: string): void {
    delete this.storage[key];
  }
}

// Get storage adapter based on environment
function getStorageAdapter(): StorageAdapter {
  // Check if we're in a browser environment
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      // Test localStorage availability
      const testKey = '__storage_test__';
      window.localStorage.setItem(testKey, 'test');
      window.localStorage.removeItem(testKey);
      return window.localStorage;
    } catch {
      console.warn('localStorage not available, falling back to memory storage');
      return new MemoryStorage();
    }
  }
  
  // Server-side or localStorage not available
  console.log('📦 Using memory storage (server-side or localStorage unavailable)');
  return new MemoryStorage();
}

export class LocalStorage {
  private storage: StorageAdapter;
  private memoryStorage: MemoryStorage; // Fallback for server-side operations

  constructor() {
    this.storage = getStorageAdapter();
    this.memoryStorage = new MemoryStorage();
  }

  // Store calendar events with timestamp for TTL simulation
  async storeEvents(events: ProcessedEvent[]): Promise<void> {
    const data = {
      events,
      timestamp: Date.now(),
      ttl: 20 * 60 * 1000, // 20 minutes in milliseconds
    };
    
    try {
      this.storage.setItem(createKey('calendar:events'), JSON.stringify(data));
      this.storage.setItem(createKey('calendar:lastUpdate'), new Date().toISOString());
      this.storage.setItem(createKey('calendar:eventCount'), events.length.toString());
      
      console.log(`📦 Stored ${events.length} events in localStorage with 20min TTL`);
    } catch (error) {
      console.error('📦 Error storing events:', error);
      // Fallback to memory storage
      this.memoryStorage.setItem(createKey('calendar:events'), JSON.stringify(data));
      this.memoryStorage.setItem(createKey('calendar:lastUpdate'), new Date().toISOString());
      this.memoryStorage.setItem(createKey('calendar:eventCount'), events.length.toString());
    }
  }

  // Retrieve stored events with TTL check
  async getEvents(): Promise<ProcessedEvent[]> {
    try {
      let dataJson = this.storage.getItem(createKey('calendar:events'));
      
      // Try memory storage if main storage fails
      if (!dataJson) {
        dataJson = this.memoryStorage.getItem(createKey('calendar:events'));
      }
      
      if (!dataJson) {
        console.log('📦 No events found in storage');
        return [];
      }

      const data = JSON.parse(dataJson);
      
      // Check TTL
      const isExpired = data.timestamp && (Date.now() - data.timestamp) > data.ttl;
      if (isExpired) {
        console.log('📦 Stored events have expired, returning empty array');
        this.storage.removeItem(createKey('calendar:events'));
        return [];
      }

      const events = data.events || [];
      console.log(`📦 Retrieved ${events.length} events from localStorage`);
      return events;
    } catch (error) {
      console.error('📦 Error parsing stored events:', error);
      return [];
    }
  }

  // Store fetch results and errors for debugging
  async storeFetchResult(result: CalendarFetchResult): Promise<void> {
    try {
      this.storage.setItem(createKey('calendar:lastFetchResult'), JSON.stringify(result));
      
      if (!result.success) {
        // Store errors for debugging
        const errors = await this.getRecentErrors();
        errors.unshift({
          timestamp: result.lastFetch,
          errors: result.errors
        });
        
        // Keep only last 10 errors
        this.storage.setItem(createKey('calendar:recentErrors'), JSON.stringify(errors.slice(0, 10)));
        console.log(`🚨 Stored fetch errors: ${result.errors.join(', ')}`);
      }
    } catch (error) {
      console.error('📦 Error storing fetch result:', error);
    }
  }

  // Admin time override storage
  async setTimeOverride(mockTime: string | null): Promise<void> {
    try {
      if (mockTime) {
        this.storage.setItem(createKey('admin:mockTime'), mockTime);
        console.log(`⏰ Time override set: ${mockTime}`);
      } else {
        this.storage.removeItem(createKey('admin:mockTime'));
        console.log(`⏰ Time override cleared`);
      }
    } catch (error) {
      console.error('⏰ Error setting time override:', error);
      // Fallback to memory storage
      if (mockTime) {
        this.memoryStorage.setItem(createKey('admin:mockTime'), mockTime);
      } else {
        this.memoryStorage.removeItem(createKey('admin:mockTime'));
      }
    }
  }

  async getTimeOverride(): Promise<string | null> {
    try {
      let mockTime = this.storage.getItem(createKey('admin:mockTime'));
      
      // Try memory storage if main storage fails
      if (!mockTime) {
        mockTime = this.memoryStorage.getItem(createKey('admin:mockTime'));
      }
      
      if (mockTime) {
        console.log(`⏰ Active time override: ${mockTime}`);
      }
      return mockTime;
    } catch (error) {
      console.error('⏰ Error getting time override:', error);
      return null;
    }
  }

  // Store age group statistics
  async storeAgeGroupStats(stats: Record<string, number>): Promise<void> {
    try {
      this.storage.setItem(createKey('calendar:ageGroupStats'), JSON.stringify(stats));
      console.log('📊 Stored age group statistics:', stats);
    } catch (error) {
      console.error('📊 Error storing age group stats:', error);
    }
  }

  async getAgeGroupStats(): Promise<Record<string, number>> {
    try {
      const stats = this.storage.getItem(createKey('calendar:ageGroupStats'));
      return stats ? JSON.parse(stats) : {};
    } catch (error) {
      console.error('📊 Error getting age group stats:', error);
      return {};
    }
  }

  // Health monitoring data
  async getSystemHealth(): Promise<SystemHealth> {
    try {
      const lastUpdate = this.storage.getItem(createKey('calendar:lastUpdate'));
      const eventCountStr = this.storage.getItem(createKey('calendar:eventCount'));
      const eventCount = eventCountStr ? parseInt(eventCountStr, 10) : 0;
      const recentErrors = await this.getRecentErrors();
      const ageGroupStats = await this.getAgeGroupStats();

      return {
        calendar: {
          lastFetch: lastUpdate || 'Never',
          eventCount,
          errors: recentErrors.flatMap(e => e.errors)
        },
        processing: {
          totalEvents: eventCount,
          validEvents: eventCount,
          ageGroupBreakdown: ageGroupStats
        },
        uptime: typeof process !== 'undefined' ? process.uptime().toString() : '0'
      };
    } catch (error) {
      console.error('🏥 Error getting system health:', error);
      return {
        calendar: {
          lastFetch: 'Never',
          eventCount: 0,
          errors: []
        },
        processing: {
          totalEvents: 0,
          validEvents: 0,
          ageGroupBreakdown: {}
        },
        uptime: '0'
      };
    }
  }

  private async getRecentErrors(): Promise<Array<{timestamp: string, errors: string[]}>> {
    try {
      const errors = this.storage.getItem(createKey('calendar:recentErrors'));
      return errors ? JSON.parse(errors) : [];
    } catch (error) {
      console.error('🚨 Error getting recent errors:', error);
      return [];
    }
  }

  // Clear all stored data (useful for debugging)
  async clearAll(): Promise<void> {
    try {
      const keys = [
        'calendar:events',
        'calendar:lastUpdate', 
        'calendar:eventCount',
        'calendar:lastFetchResult',
        'calendar:recentErrors',
        'calendar:ageGroupStats',
        'admin:mockTime'
      ];
      
      keys.forEach(key => {
        this.storage.removeItem(createKey(key));
      });
      
      console.log('📦 Cleared all localStorage data');
    } catch (error) {
      console.error('📦 Error clearing localStorage:', error);
    }
  }

  // Get storage info for debugging
  async getStorageInfo(): Promise<{
    type: string;
    usage?: string;
    keys: string[];
  }> {
    const keys: string[] = [];
    let storageType = 'unknown';
    let usage = 'unknown';
    
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        storageType = 'localStorage';
        
        // Get all keys with our prefix
        for (let i = 0; i < window.localStorage.length; i++) {
          const key = window.localStorage.key(i);
          if (key && key.startsWith(STORAGE_PREFIX)) {
            keys.push(key);
          }
        }
        
        // Estimate usage
        let totalSize = 0;
        keys.forEach(key => {
          const value = window.localStorage.getItem(key);
          if (value) {
            totalSize += key.length + value.length;
          }
        });
        usage = `${(totalSize / 1024).toFixed(2)} KB`;
      } else {
        storageType = 'memory';
        // For memory storage, we can't easily enumerate keys
        usage = 'N/A';
      }
    } catch (error) {
      console.error('📊 Error getting storage info:', error);
    }
    
    return {
      type: storageType,
      usage,
      keys
    };
  }
}
