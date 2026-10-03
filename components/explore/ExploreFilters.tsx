'use client';

import React from 'react';

export type ExploreSortBy = 'volume' | 'floor_asc' | 'floor_desc' | 'offers' | 'pool';
export type ExploreViewMode = 'grid' | 'table';

export interface ExploreFiltersProps {
  search: string;
  onSearchChange: (val: string) => void;
  hasOffersOnly: boolean;
  onToggleHasOffers: (val: boolean) => void;
  sortBy?: ExploreSortBy;
  onSortChange?: (val: ExploreSortBy) => void;
  viewMode?: ExploreViewMode;
  onViewModeChange?: (val: ExploreViewMode) => void;
  totalCount: number;
}

export function ExploreFilters({
  search,
  onSearchChange,
  hasOffersOnly,
  onToggleHasOffers,
  sortBy = 'volume',
  onSortChange,
  viewMode = 'grid',
  onViewModeChange,
  totalCount,
}: ExploreFiltersProps) {
  return (
    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 p-3.5 rounded-xl bg-[var(--surface)] border border-[var(--line)]">
      <div className="relative flex-1 max-w-lg">
        <input
          type="text"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search collection name, symbol, or 0x..."
          aria-label="Search collections"
          className="w-full h-9 pl-9 pr-14 text-xs rounded-lg bg-[var(--panel)] border border-[var(--line)] text-[var(--text)] placeholder-[var(--muted)] focus:outline-hidden focus:border-[var(--lime)] transition-colors"
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
        <kbd className="absolute right-2.5 top-2 px-1.5 py-0.5 text-[10px] font-mono text-[var(--muted)] bg-[var(--surface)] border border-[var(--line)] rounded-sm pointer-events-none">
          /
        </kbd>
      </div>

      <div className="flex flex-wrap items-center gap-3 justify-between lg:justify-end">
        <div className="flex items-center gap-2">
          <label htmlFor="explore-sort-select" className="text-xs text-[var(--muted)] sr-only">
            Sort collections
          </label>
          <select
            id="explore-sort-select"
            aria-label="Sort collections"
            value={sortBy}
            onChange={(e) => onSortChange?.(e.target.value as ExploreSortBy)}
            className="text-xs bg-[var(--panel)] border border-[var(--line)] rounded-lg px-3 py-1.5 text-[var(--text)] focus:outline-hidden focus:border-[var(--lime)] cursor-pointer"
          >
            <option value="volume">Highest Liquidity</option>
            <option value="offers">Most Active Offers</option>
            <option value="floor_desc">Floor Price (High to Low)</option>
            <option value="floor_asc">Floor Price (Low to High)</option>
          </select>
        </div>

        <label className="flex items-center gap-2 text-xs font-medium text-[var(--text)] cursor-pointer select-none bg-[var(--panel)] px-2.5 py-1.5 rounded-lg border border-[var(--line)]">
          <input
            type="checkbox"
            checked={hasOffersOnly}
            onChange={(e) => onToggleHasOffers(e.target.checked)}
            className="w-3.5 h-3.5 rounded text-emerald-600 focus:ring-emerald-500 border-[var(--line)] bg-[var(--surface)] cursor-pointer"
          />
          <span>Active Offers Only</span>
        </label>

        {onViewModeChange && (
          <div className="flex items-center p-0.5 rounded-lg bg-[var(--panel)] border border-[var(--line)]">
            <button
              type="button"
              onClick={() => onViewModeChange('grid')}
              aria-label="Grid view"
              className={`p-1.5 rounded-md transition-colors cursor-pointer ${
                viewMode === 'grid'
                  ? 'bg-[var(--surface)] text-[var(--text)] shadow-xs'
                  : 'text-[var(--muted)] hover:text-[var(--text)]'
              }`}
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="3" width="7" height="7" rx="1" />
                <rect x="14" y="3" width="7" height="7" rx="1" />
                <rect x="14" y="14" width="7" height="7" rx="1" />
                <rect x="3" y="14" width="7" height="7" rx="1" />
              </svg>
            </button>
            <button
              type="button"
              onClick={() => onViewModeChange('table')}
              aria-label="Table view"
              className={`p-1.5 rounded-md transition-colors cursor-pointer ${
                viewMode === 'table'
                  ? 'bg-[var(--surface)] text-[var(--text)] shadow-xs'
                  : 'text-[var(--muted)] hover:text-[var(--text)]'
              }`}
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="3" y1="6" x2="21" y2="6" />
                <line x1="3" y1="12" x2="21" y2="12" />
                <line x1="3" y1="18" x2="21" y2="18" />
              </svg>
            </button>
          </div>
        )}

        <span className="text-xs text-[var(--muted)] font-mono font-medium px-2 py-1 rounded-md bg-[var(--panel)] border border-[var(--line)]">
          {totalCount} Collections
        </span>
      </div>
    </div>
  );
}
