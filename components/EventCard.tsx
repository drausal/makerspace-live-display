"use client";

import { ProcessedEvent } from '@/shared/types';
import { AgeGroupBadge } from './AgeGroupBadge';

interface EventCardProps {
  event: ProcessedEvent;
  type: 'current' | 'next';
  timeRemaining?: string;
  timeUntilStart?: string;
}

export function EventCard({ event, type, timeRemaining, timeUntilStart }: EventCardProps) {
  const formatTime = (time: string) =>
    new Date(time).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });

  const formatDate = (time: string) =>
    new Date(time).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

  const isToday = (time: string) => {
    const eventDate = new Date(time);
    const today = new Date();
    return eventDate.toDateString() === today.toDateString();
  };

  const cardColor = type === 'current' ? 'border-primary' : 'border-border';

  return (
    <div className={`bg-surface p-10 rounded-lg border-8 ${cardColor}`}>
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-7xl font-bold" style={{ color: 'var(--theme-color)' }}>
          {type === 'current' ? 'Live Now' : 'Up Next'}
        </h2>
        <AgeGroupBadge ageGroup={event.ageGroup} />
      </div>

      <h3 className="text-8xl font-extrabold text-foreground mb-6">{event.title}</h3>

      {event.description && (
        <p className="text-7xl text-secondary mb-10 break-words whitespace-pre-line font-semibold">
          {event.description}
        </p>
      )}

      <div className="grid grid-cols-2 gap-8 text-center">
        <div className="bg-background p-8 rounded-md">
          <h4 className="text-5xl font-bold text-secondary">START</h4>
          <p className="text-9xl font-bold text-foreground">
            {formatTime(event.start)}
          </p>
          {type === 'next' && !isToday(event.start) && (
            <p className="text-4xl font-semibold text-secondary mt-2">
              {formatDate(event.start)}
            </p>
          )}
        </div>
        <div className="bg-background p-8 rounded-md">
          <h4 className="text-5xl font-bold text-secondary">END</h4>
          <p className="text-9xl font-bold text-foreground">
            {formatTime(event.end)}
          </p>
          {type === 'next' && !isToday(event.end) && (
            <p className="text-4xl font-semibold text-secondary mt-2">
              {formatDate(event.end)}
            </p>
          )}
        </div>
      </div>

      {timeRemaining && (
        <div className="mt-10 text-center text-6xl font-bold text-success">
          {timeRemaining} Remaining
        </div>
      )}

      {timeUntilStart && (
        <div className="mt-10 text-center text-6xl font-bold text-warning">
          Starts in {timeUntilStart}
        </div>
      )}
    </div>
  );
}
