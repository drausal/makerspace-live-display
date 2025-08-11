'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { DisplayStatus } from '@/shared/types';
import { EventCard } from './EventCard';
import { StatusBanner } from './StatusBanner';
import { Clock } from './Clock';
import { ErrorBoundary } from './ErrorBoundary';

export function TVDisplay() {
  const [displayStatus, setDisplayStatus] = useState<DisplayStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const router = useRouter();

  // Add keyboard shortcut for admin panel
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'a' && (event.ctrlKey || event.metaKey)) {
        event.preventDefault();
        router.push('/admin');
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [router]);

  const fetchStatus = useCallback(async () => {
    try {
      const response = await fetch('/api/calendar/status');
      if (!response.ok) {
        throw new Error(`API error: ${response.status} ${response.statusText}`);
      }
      const data = await response.json();
      setDisplayStatus(data);
      setError(null);
      setLastUpdate(new Date());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 30000);
    return () => clearInterval(interval);
  }, [fetchStatus]);

  if (loading) {
    return (
      <div className="tv-display items-center justify-center text-center p-16">
        <h1 className="text-8xl">HQ MAKERSPACE</h1>
        <p className="text-5xl mt-6 text-secondary">Loading Display...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="tv-display items-center justify-center text-center p-16">
        <div className="bg-surface p-20 rounded-lg border-8 border-danger">
          <h1 className="text-8xl text-danger">Display Error</h1>
          <p className="text-5xl mt-6">{error}</p>
          <button
            onClick={fetchStatus}
            className="mt-16 bg-primary text-white font-bold py-6 px-12 rounded-lg text-4xl"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!displayStatus) return null;

  const theme = displayStatus.displayTheme || 'closed';

  return (
    <ErrorBoundary>
      <div className={`tv-display theme-${theme} animate-fadeIn p-16`}>
        <header className="flex justify-between items-start mb-16">
          <div>
            <h1 className="text-9xl font-extrabold">HQ MAKERSPACE</h1>
            <p className="text-6xl text-secondary">Event Schedule</p>
          </div>
          <Clock
            currentTime={displayStatus.currentTime}
            mockTime={displayStatus.mockTime}
          />
        </header>

        <main className="flex-1 flex flex-col justify-center">
          <StatusBanner
            status={displayStatus.status}
            ageGroup={displayStatus.currentEvent?.ageGroup}
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-16 mt-16">
            {displayStatus.currentEvent && (
              <EventCard
                event={displayStatus.currentEvent}
                type="current"
                timeRemaining={displayStatus.timeUntilNext}
              />
            )}

            {displayStatus.nextEvent && (
              <EventCard
                event={displayStatus.nextEvent}
                type="next"
                timeUntilStart={displayStatus.timeUntilNext}
              />
            )}
          </div>

          {displayStatus.status === 'closed' && (
            <div className="text-center mt-16">
              <h2 className="text-9xl">CLOSED</h2>
              <p className="text-7xl text-secondary mt-6">
                No events scheduled at this time.
              </p>
            </div>
          )}
        </main>

        <footer className="text-center text-secondary text-2xl mt-16">
          <span>
            Last updated: {lastUpdate ? lastUpdate.toLocaleTimeString() : 'N/A'}
          </span>
          {displayStatus.mockTime && (
            <span className="ml-8 font-bold text-warning">
              (Test Mode)
            </span>
          )}
        </footer>
      </div>
    </ErrorBoundary>
  );
}