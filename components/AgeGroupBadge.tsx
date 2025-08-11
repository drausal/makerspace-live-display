"use client";

import { AgeGroup } from '@/shared/types';

interface AgeGroupBadgeProps {
  ageGroup: AgeGroup;
  className?: string;
}

export function AgeGroupBadge({ ageGroup, className = '' }: AgeGroupBadgeProps) {
  return (
    <div
      className={`flex items-center gap-6 text-5xl font-bold ${className}`.trim()}
      style={{ color: `var(--theme-${ageGroup.group})` }}
    >
      <span className="text-7xl" aria-hidden="true">
        {ageGroup.emoji}
      </span>
      <span>{ageGroup.label}</span>
    </div>
  );
}
