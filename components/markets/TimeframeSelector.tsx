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
      className={`inline-flex items-center p-1 bg-[#f0f4f2] dark:bg-[#14221e] border border-[#e2e8e5] dark:border-[#1e332c] rounded-xl gap-1 ${className}`}
    >
      {options.map((opt) => {
        const isSelected = timeframe === opt.id;
        return (
          <button
            key={opt.id}
            type="button"
            onClick={() => onSelectTimeframe(opt.id)}
            aria-pressed={isSelected}
            className={`px-2.5 py-1 text-[11px] font-semibold rounded-lg transition-all cursor-pointer ${
              isSelected
                ? 'bg-white dark:bg-[#192b25] text-[#142d2b] dark:text-[#f0f6fc] shadow-xs border border-[#dce6e1] dark:border-[#1e332c]'
                : 'text-[#61736b] dark:text-[#8b949e] hover:text-[#142d2b] dark:hover:text-white'
            }`}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
