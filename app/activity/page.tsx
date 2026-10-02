'use client';

import React, { useState } from 'react';
import { ActivityFilterBar } from '@/components/activity/ActivityFilterBar';
import { ActivityStream } from '@/components/activity/ActivityStream';
import { useActivity } from '@/hooks/api/useActivity';

export default function ActivityPage() {
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedCollection, setSelectedCollection] = useState<string>('all');
  const [limit, setLimit] = useState<number>(20);

  const { data: activityData, isLoading } = useActivity({
    eventType: selectedType === 'all' ? undefined : selectedType,
    collection: selectedCollection === 'all' ? undefined : selectedCollection,
  });

  const activities = activityData?.activity || [];
  const visibleActivities = activities.slice(0, limit);
  const hasMore = limit < activities.length;

  const handleLoadMore = () => {
    setLimit((prev) => prev + 20);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-150">
      <div className="space-y-2 border-b border-[#e6ece9] dark:border-[#1e332c] pb-4">
        <div className="text-[10px] uppercase font-semibold tracking-[2px] text-[#377994] dark:text-emerald-400 flex items-center gap-2">
          <span className="w-5 h-[1px] bg-[#4d93be] dark:bg-emerald-500 inline-block" />
          <span>Real-time On-Chain Telemetry · Protocol Activity Feed</span>
        </div>

        <h1 className="text-3xl sm:text-4xl font-normal tracking-[-1.5px] text-[#142d2b] dark:text-[#f0fdf4]">
          Market activity.
        </h1>

        <p className="text-xs sm:text-sm text-[var(--muted)]">
          Live timeline of liquidity offers, loan originations, settlements, and foreclosures on Robinhood Chain.
        </p>
      </div>

      <div className="space-y-4">
        <ActivityFilterBar
          selectedType={selectedType}
          selectedCollection={selectedCollection}
          onTypeChange={(type) => {
            setSelectedType(type);
            setLimit(20);
          }}
          onCollectionChange={(col) => {
            setSelectedCollection(col);
            setLimit(20);
          }}
        />

        {isLoading && activities.length === 0 ? (
          <div className="py-12 text-center text-xs font-mono text-[var(--muted)]">
            Loading real-time protocol activity...
          </div>
        ) : (
          <ActivityStream
            activities={visibleActivities}
            hasMore={hasMore}
            onLoadMore={handleLoadMore}
          />
        )}
      </div>
    </div>
  );
}
