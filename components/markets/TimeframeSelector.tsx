'use client';

import React from 'react';

export type TimeframeType = '24h' | '7d' | '30d';

export interface TimeframeSelectorProps {
  timeframe: TimeframeType;
  onSelectTimeframe: (tf: TimeframeType) => void;
  className?: string;
}

export function TimeframeSelector({
  timeframe,
  onSelectTimeframe,
  className = '',
}: TimeframeSelectorProps) {
  const options: { id: TimeframeType; label: string }[] = [
    { id: '24h', label: '24H' },
    { id: '7d', label: '7D' },
    { id: '30d', label: '30D' },
  ];

  return (
    <div
      role="group"
      aria-label="Filter timeframe"
      className={`inline-flex items-center p-1 bg-[var(--panel)] border border-[var(--line)] rounded-lg gap-1 ${className}`}
    >
      {options.map((opt) => {
        const isSelected = timeframe === opt.id;
        return (
          <button
            key={opt.id}
            type="button"
            onClick={() => onSelectTimeframe(opt.id)}
            aria-pressed={isSelected}
            className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors cursor-pointer border ${
              isSelected
                ? 'bg-[var(--surface)] text-[var(--text)] shadow-xs border-[var(--line)]'
                : 'text-[var(--muted)] hover:text-[var(--text)] border-transparent'
            }`}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
