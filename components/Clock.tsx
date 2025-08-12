'use client';

import { useEffect, useState } from 'react';

interface ClockProps {
  currentTime: string;
  mockTime?: string;
}

export function Clock({ currentTime, mockTime }: ClockProps) {
  const [displayTime, setDisplayTime] = useState<Date | null>(null);

  useEffect(() => {
    const timeToDisplay = mockTime ? new Date(mockTime) : new Date(currentTime);
    setDisplayTime(timeToDisplay);

    const interval = setInterval(() => {
      if (mockTime) {
        setDisplayTime(new Date(mockTime));
      } else {
        setDisplayTime(new Date());
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [currentTime, mockTime]);

  if (!displayTime) {
    return (
      <div className="text-right">
        <div className="text-9xl font-bold tabular-nums">--:--:--</div>
        <div className="text-5xl text-secondary">Loading...</div>
      </div>
    );
  }

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <div className="text-right">
      <div className="text-[9.5rem] font-bold tabular-nums leading-none">{formatTime(displayTime)}</div>
      <div className="text-[3.25rem] text-secondary mt-2">{formatDate(displayTime)}</div>
    </div>
  );
}
