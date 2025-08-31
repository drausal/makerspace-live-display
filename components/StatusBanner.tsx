"use client";

import { DisplayStatus, AgeGroup, ProcessedEvent } from '@/shared/types';

interface StatusBannerProps {
  status: DisplayStatus['status'];
  ageGroup?: AgeGroup;
  nextEvent?: ProcessedEvent;
}

export function StatusBanner({ status, nextEvent }: StatusBannerProps) {
  const bannerConfig = {
    current: {
      title: 'Event in Progress',
      color: 'text-success',
    },
    between: {
      title: 'Next Event Starting Soon',
      color: 'text-warning',
    },
    closed: {
      title: nextEvent ? 'Currently Closed' : 'Makerspace Closed',
      color: 'text-secondary',
    },
  } as const;

  const config = bannerConfig[status];
  if (!config || status === 'current') return null; // Don't show banner if an event is live

  return (
    <div className="text-center my-20">
      <h2 className={`text-9xl font-extrabold ${config.color}`}>{config.title}</h2>
    </div>
  );
}
