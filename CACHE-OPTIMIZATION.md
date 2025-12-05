# Cache Optimization Update

## Summary
Implemented a server-side caching mechanism to reduce Google Calendar API calls from **every 30 seconds** to **every 30 minutes**, while maintaining the same 30-second client-side polling rate.

## Changes Made

### 1. New Server-Side Cache Module
**File**: `src/lib/calendar-cache.ts`

- In-memory cache with 30-minute TTL (time-to-live)
- Singleton instance shared across all API requests
- Automatic expiration checking
- Cache statistics for monitoring

**Key Features**:
- `set(events)` - Store events with automatic expiration timestamp
- `get()` - Retrieve cached events (returns null if expired or empty)
- `isValid()` - Check if cache is still valid
- `getStats()` - Get cache metrics (event count, expiration time, etc.)
- `clear()` - Manually clear cache (useful for admin operations)

### 2. Updated Status Endpoint
**File**: `src/app/api/calendar/status/route.ts`

**Before**:
```typescript
// Fetched from Google Calendar every 30 seconds
const allEvents = await calendarFetcher.fetchAllEvents();
```

**After**:
```typescript
// Try cache first, only fetch if expired
let allEvents = calendarCache.get();

if (!allEvents) {
  Logger.info('CalendarStatusAPI', 'Cache miss or expired - fetching from Google Calendar');
  allEvents = await calendarFetcher.fetchAllEvents();
  calendarCache.set(allEvents); // Store for 30 minutes
  await storage.storeEvents(allEvents);
} else {
  Logger.info('CalendarStatusAPI', `Using cached events (${allEvents.length} events)`);
}
```

### 3. New Cache Monitoring Endpoint
**File**: `src/app/api/cache/stats/route.ts`

**GET** `/api/cache/stats` - View cache statistics
```json
{
  "success": true,
  "cache": {
    "isCached": true,
    "eventCount": 47,
    "cachedAt": "2024-12-05T15:00:00Z",
    "expiresAt": "2024-12-05T15:30:00Z",
    "timeRemaining": "28 minutes"
  },
  "timestamp": "2024-12-05T15:02:00Z"
}
```

**POST** `/api/cache/stats` - Manually clear cache
```json
{
  "success": true,
  "message": "Cache cleared successfully",
  "timestamp": "2024-12-05T15:02:00Z"
}
```

### 4. Comprehensive Test Suite
**File**: `__tests__/calendar-cache.test.ts`

- 12 test cases covering all cache functionality
- Tests for expiration logic, stats, multiple operations
- All tests passing ✅

## Impact

### Performance Benefits
- **Reduced API Calls**: From ~120 calls/hour to ~2 calls/hour (60x reduction)
- **Faster Response Time**: Cache hits return instantly without network delay
- **Lower Costs**: Significantly reduced Google Calendar API quota usage
- **Better Reliability**: Cached data available even during brief network issues

### User Experience
- **No visible changes** to the display behavior
- Display still updates every 30 seconds with fresh status calculations
- Cache is transparent to end users
- Event timing calculations always use current/mock time

### Google Calendar Quota
- **Before**: 1,800 API calls per day (every 30 seconds, 24/7)
- **After**: 48 API calls per day (every 30 minutes, 24/7)
- **Savings**: 97.3% reduction in API usage

## Architecture

### Request Flow Diagram
```
Client (TVDisplay)
    ↓ (every 30 seconds)
GET /api/calendar/status
    ↓
Check calendarCache.get()
    ↓
Cache HIT (< 30 min)? ──YES──→ Return cached events
    ↓ NO                         ↓
Fetch from Google Calendar      Calculate display status
    ↓                            ↓
Store in cache (30 min TTL)    Return response to client
    ↓
Return events
```

### Cache Lifecycle
1. **First Request**: Cache empty → Fetch from Google → Store in cache
2. **Requests 2-60** (next 30 min): Cache hit → Return immediately
3. **After 30 minutes**: Cache expired → Fetch fresh data → Update cache
4. **Repeat cycle**

## Configuration

### Cache TTL
Located in `src/lib/calendar-cache.ts`:
```typescript
private readonly CACHE_TTL = 30 * 60 * 1000; // 30 minutes in milliseconds
```

To adjust the cache duration, change this value:
- 15 minutes: `15 * 60 * 1000`
- 1 hour: `60 * 60 * 1000`
- 5 minutes: `5 * 60 * 1000`

### Client Polling Rate
Located in `components/TVDisplay.tsx`:
```typescript
const interval = setInterval(fetchStatus, 30000); // 30 seconds
```

Client polling rate can be adjusted independently of cache TTL.

## Monitoring

### Check Cache Status
```bash
curl http://localhost:3000/api/cache/stats
```

### Clear Cache Manually
```bash
curl -X POST http://localhost:3000/api/cache/stats
```

### View Logs
The cache logs important events:
- Cache hits: `Using cached events (N events)`
- Cache misses: `Cache miss or expired - fetching from Google Calendar`
- Cache storage: `Cached N events, expires at [timestamp]`

## Testing

### Run Cache Tests
```bash
pnpm test calendar-cache
```

### Manual Testing
1. Start dev server: `pnpm dev`
2. Open display: `http://localhost:3000`
3. Watch console logs for cache behavior
4. Check cache stats: `http://localhost:3000/api/cache/stats`
5. Wait 30+ minutes and verify fresh fetch
6. Clear cache and verify immediate refetch

## Backward Compatibility

- ✅ No breaking changes to API responses
- ✅ Client code unchanged (except new cache endpoint)
- ✅ localStorage backup still works
- ✅ Admin time override still functional
- ✅ All existing tests still pass

## Future Enhancements

### Possible Improvements
1. **Redis/Vercel KV**: Persistent cache across serverless instances
2. **Conditional Refresh**: Only fetch if calendar was updated (using ETags)
3. **Smart Invalidation**: Clear cache when admin makes changes
4. **Cache Warming**: Pre-fetch before expiration to prevent delays
5. **Multi-tier Cache**: Memory + persistent + CDN edge caching

### Production Considerations
- **Serverless Memory**: Current in-memory cache works for single instance
- **Multiple Instances**: Consider Redis/KV for multi-instance deployments
- **Cache Synchronization**: May need distributed cache for high-traffic scenarios

## Rollback Plan

If issues arise, revert to direct fetching:

**In `src/app/api/calendar/status/route.ts`:**
```typescript
// Comment out cache logic, restore original:
const allEvents = await calendarFetcher.fetchAllEvents();
await storage.storeEvents(allEvents);
```

Or simply remove the cache import and logic - the original fetching still works.

---

**Last Updated**: December 5, 2024
**Version**: 1.0.0
**Author**: Cache Optimization Implementation
