'use client';

import React from 'react';
import { FilterChip } from '@/components/ui/FilterChip';
import { useCollections } from '@/hooks/api/useCollections';
import { useSafeChainId } from '@/hooks/useSafeChainId';

export interface ActivityFilterBarProps {
  selectedType: string;
  selectedCollection: string;
  onTypeChange: (type: string) => void;
  onCollectionChange: (collection: string) => void;
}

export function ActivityFilterBar({
  selectedType,
  selectedCollection,
  onTypeChange,
  onCollectionChange,
}: ActivityFilterBarProps) {
  const chainId = useSafeChainId();
  const { data: collectionsData } = useCollections(chainId);
  const collections = collectionsData?.collections || [];

  const filterTypes = [
    { id: 'all', label: 'All Activity' },
    { id: 'OfferCreated', label: 'Offers' },
    { id: 'LoanStarted', label: 'Loans Started' },
    { id: 'LoanRepaid', label: 'Repayments' },
    { id: 'LoanForeclosed', label: 'Foreclosures' },
  ];

  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 rounded-2xl border border-[var(--line)] bg-[var(--surface)]">
      <div className="flex flex-wrap items-center gap-2">
        {filterTypes.map((t) => (
          <FilterChip
            key={t.id}
            id={t.id}
            label={t.label}
            selected={selectedType === t.id}
            onSelect={() => onTypeChange(t.id)}
          />
        ))}
      </div>

      <div className="flex items-center gap-2">
        <label htmlFor="collection-filter" className="text-xs font-mono text-[var(--muted)] whitespace-nowrap">
          Collection:
        </label>
        <select
          id="collection-filter"
          value={selectedCollection}
          onChange={(e) => onCollectionChange(e.target.value)}
          className="px-3 py-1.5 rounded-xl border border-[var(--line)] bg-[var(--panel)] text-xs font-mono text-[var(--text)] focus:outline-none focus:ring-1 focus:ring-[var(--primary)]"
        >
          <option value="all">All Collections</option>
          {collections.map((col) => (
            <option key={col.address} value={col.address}>
              {col.name}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
