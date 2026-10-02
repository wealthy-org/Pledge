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
            className="w-full sm:w-auto font-mono text-xs"
          >
            Load More Events ↓
          </Button>
        </div>
      )}
    </div>
  );
}
