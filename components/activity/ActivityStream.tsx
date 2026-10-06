'use client';

import React from 'react';
import { ActivityItemRow } from './ActivityItem';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { Skeleton } from '@/components/ui/Skeleton';
import type { ActivityItem } from '@/types/api';

export interface ActivityStreamProps {
  activities: ActivityItem[];
  hasMore?: boolean;
  onLoadMore?: () => void;
  isLoading?: boolean;
  chainId?: number;
}

export function ActivityStream({
  activities,
  hasMore = false,
  onLoadMore,
  isLoading = false,
  chainId,
}: ActivityStreamProps) {
  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="p-4 rounded-xl border border-[var(--line)] bg-[var(--surface)]">
            <Skeleton height="36px" borderRadius="8px" />
          </div>
        ))}
      </div>
    );
  }

  if (activities.length === 0) {
    return (
      <div className="p-8 rounded-2xl border border-[var(--line)] bg-[var(--surface)]">
        <EmptyState
          title="No Activity Found"
          description="There are no on-chain events matching your selected filter criteria."
        />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {activities.map((activity) => (
        <ActivityItemRow
          key={`${activity.id}-${activity.txHash}`}
          activity={activity}
          chainId={chainId}
        />
      ))}

      {hasMore && onLoadMore && (
        <div className="flex justify-center pt-4">
          <Button
            variant="secondary"
            size="md"
            onClick={onLoadMore}
            className="w-full sm:w-auto font-mono text-xs inline-flex items-center gap-1.5"
          >
            <span>Load More Events</span>
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </Button>
        </div>
      )}
    </div>
  );
}
