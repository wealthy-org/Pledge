'use client';

import React from 'react';
import { ExploreCard } from './ExploreCard';
import { EmptyState } from '@/components/ui/EmptyState';
import type { ExploreCollectionItem } from '@/types/api';

export interface ExploreGridProps {
  collections: ExploreCollectionItem[];
  isLoading?: boolean;
}

export function ExploreGrid({ collections, isLoading = false }: ExploreGridProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div
            key={i}
            className="h-48 rounded-xl bg-[var(--surface)] border border-[var(--line)] animate-pulse"
          />
        ))}
      </div>
    );
  }

  if (collections.length === 0) {
    return (
      <div className="p-12 rounded-xl border border-[var(--line)] bg-[var(--surface)] text-center">
        <EmptyState
          title="No Collections Found"
          description="Try adjusting your search query or disable the 'Active Offers Only' filter to see all indexed collections."
        />
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {collections.map((collection) => (
        <ExploreCard key={collection.address} collection={collection} />
      ))}
    </div>
  );
}
