'use client';

import React from 'react';

export interface ExploreFiltersProps {
  search: string;
  onSearchChange: (val: string) => void;
  hasOffersOnly: boolean;
  onToggleHasOffers: (val: boolean) => void;
  totalCount: number;
}

export function ExploreFilters({
  search,
  onSearchChange,
  hasOffersOnly,
  onToggleHasOffers,
  totalCount,
}: ExploreFiltersProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-xl bg-[var(--surface)] border border-[var(--line)]">
      <div className="relative flex-1 max-w-md">
        <input
          type="text"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Cari nama koleksi, simbol, atau 0x..."
          aria-label="Cari koleksi"
          className="w-full h-9 pl-9 pr-3 text-xs rounded-lg bg-[var(--panel)] border border-[var(--line)] text-[var(--text)] placeholder-[var(--muted)] focus:outline-none focus:border-[var(--primary)] transition-colors"
        />
        <svg
          className="w-4 h-4 text-[var(--muted)] absolute left-3 top-2.5 pointer-events-none"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="11" cy="11" r="8" />
          <path d="m21 21-4.3-4.3" />
        </svg>
      </div>

      <div className="flex items-center gap-3 self-end sm:self-auto">
        <label className="flex items-center gap-2 text-xs font-medium text-[var(--text)] cursor-pointer select-none">
          <input
            type="checkbox"
            checked={hasOffersOnly}
            onChange={(e) => onToggleHasOffers(e.target.checked)}
            className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 border-[var(--line)] bg-[var(--panel)] cursor-pointer"
          />
          <span>Active Offers Only</span>
        </label>

        <span className="text-xs text-[var(--muted)] font-mono">
          {totalCount} Koleksi
        </span>
      </div>
    </div>
  );
}
