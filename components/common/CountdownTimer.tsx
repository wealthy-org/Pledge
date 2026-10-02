'use client';

import React, { useEffect, useState } from 'react';

export interface CountdownTimerProps {
  dueAt: number | string;
  className?: string;
}

export function CountdownTimer({ dueAt, className = '' }: CountdownTimerProps) {
  const targetTimestampSec = typeof dueAt === 'string' ? Math.floor(new Date(dueAt).getTime() / 1000) || Number(dueAt) : dueAt;
  const [timeLeftSec, setTimeLeftSec] = useState<number>(() => targetTimestampSec - Math.floor(Date.now() / 1000));

  useEffect(() => {
    const tick = () => {
      const remaining = targetTimestampSec - Math.floor(Date.now() / 1000);
      setTimeLeftSec(remaining);
    };

    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [targetTimestampSec]);

  if (timeLeftSec <= 0) {
    return (
      <span className={`inline-flex items-center gap-1 font-mono text-xs font-semibold px-2 py-0.5 rounded bg-red-100 dark:bg-red-950/50 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-900/50 ${className}`}>
        <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
        Overdue
      </span>
    );
  }

  const days = Math.floor(timeLeftSec / 86400);
  const hours = Math.floor((timeLeftSec % 86400) / 3600);
  const minutes = Math.floor((timeLeftSec % 3600) / 60);
  const seconds = timeLeftSec % 60;

  let timeString = '';
  let colorClass = 'text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-900/40';

  if (days >= 1) {
    timeString = `${days}d ${hours}h ${minutes}m`;
  } else if (hours >= 1) {
    timeString = `${hours}h ${minutes}m ${seconds}s`;
    colorClass = 'text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-900/40';
  } else {
    timeString = `${minutes}m ${seconds}s`;
    colorClass = 'text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-950/40 border-red-200 dark:border-red-900/40 animate-pulse';
  }

  return (
    <span className={`inline-flex items-center gap-1 font-mono text-xs font-medium px-2 py-0.5 rounded border ${colorClass} ${className}`}>
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5">
        <circle cx="12" cy="12" r="10" />
        <polyline points="12 6 12 12 16 14" />
      </svg>
      {timeString}
    </span>
  );
}
