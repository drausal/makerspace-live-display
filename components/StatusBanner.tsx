"use client";

import { DisplayStatus, AgeGroup } from '@/shared/types';

interface StatusBannerProps {
  status: DisplayStatus['status'];
  ageGroup?: AgeGroup;
}

export function StatusBanner({ status, ageGroup }: StatusBannerProps) {
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
      title: 'Makerspace Closed',
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
