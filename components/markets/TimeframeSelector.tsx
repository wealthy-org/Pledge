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

  const activeIndex = options.findIndex((o) => o.id === timeframe);
  const leftPercent = activeIndex >= 0 ? (activeIndex / options.length) * 100 : 0;
  const widthPercent = 100 / options.length;

  return (
    <div
      role="group"
      aria-label="Filter timeframe"
      className={`relative inline-flex items-center p-1 bg-[var(--panel)] border border-[var(--line)] rounded-lg select-none ${className}`}
    >
      <div
        className="absolute top-1 bottom-1 rounded-md bg-[var(--surface)] border border-[var(--line)] shadow-xs transition-all duration-200 ease-out pointer-events-none"
        style={{
          left: `calc(${leftPercent}% + 4px)`,
          width: `calc(${widthPercent}% - 8px)`,
        }}
      />
      {options.map((opt) => {
        const isSelected = timeframe === opt.id;
        return (
          <button
            key={opt.id}
            type="button"
            onClick={() => onSelectTimeframe(opt.id)}
            aria-pressed={isSelected}
            className={`relative z-10 px-2.5 py-1 text-xs font-medium rounded-md transition-colors cursor-pointer border border-transparent ${
              isSelected
                ? 'text-[var(--text)] font-semibold'
                : 'text-[var(--muted)] hover:text-[var(--text)]'
            }`}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
