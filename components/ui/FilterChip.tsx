'use client';

import React from 'react';

export interface FilterChipProps {
  id: string;
  label: string;
  count?: number;
  selected?: boolean;
  onSelect: (id: string) => void;
  className?: string;
}

export function FilterChip({
  id,
  label,
  count,
  selected = false,
  onSelect,
  className = '',
}: FilterChipProps) {
  return (
    <button
      type="button"
      data-selected={selected ? 'true' : 'false'}
      onClick={() => onSelect(id)}
      className={`inline-flex items-center gap-2 px-3 py-1 rounded-lg text-xs font-medium border transition-all cursor-pointer whitespace-nowrap select-none ${
        selected
          ? 'bg-[var(--primary-soft)] text-[var(--primary)] border-[var(--primary)] shadow-xs font-semibold'
          : 'bg-[var(--panel)] text-[var(--muted)] hover:text-[var(--text)] border-[var(--line)] hover:bg-[var(--raised)]'
      } ${className}`}
    >
      <span>{label}</span>
      {typeof count === 'number' && (
        <span
          className={`px-1.5 py-0.2 rounded-sm text-[10px] font-mono ${
            selected ? 'bg-[var(--primary)] text-white' : 'bg-[var(--raised)] text-[var(--muted)]'
          }`}
        >
          {count}
        </span>
      )}
    </button>
  );
}
