'use client';

import React, { useState, useMemo } from 'react';
import { ActivityFilterBar } from '@/components/activity/ActivityFilterBar';
import { ActivityStream } from '@/components/activity/ActivityStream';
import { MOCK_ACTIVITY } from '@/lib/mock/fixtures';

export default function ActivityPage() {
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedCollection, setSelectedCollection] = useState<string>('all');
  const [displayCount, setDisplayCount] = useState<number>(10);

  const filteredActivities = useMemo(() => {
    return MOCK_ACTIVITY.filter((item) => {
      const matchesType =
        selectedType === 'all' || item.eventType === selectedType;

      const matchesCollection =
        selectedCollection === 'all' ||
        item.contractAddress.toLowerCase() === selectedCollection.toLowerCase();

      return matchesType && matchesCollection;
    });
  }, [selectedType, selectedCollection]);

  const visibleActivities = useMemo(() => {
    return filteredActivities.slice(0, displayCount);
  }, [filteredActivities, displayCount]);

  const hasMore = displayCount < filteredActivities.length;

  const handleLoadMore = () => {
    setDisplayCount((prev) => prev + 10);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-150">
      <div className="space-y-2 border-b border-[#e6ece9] pb-4">
        <div className="text-[10px] uppercase font-semibold tracking-[2px] text-[#377994] flex items-center gap-2">
          <span className="w-5 h-[1px] bg-[#4d93be] inline-block" />
          <span>Real-time On-Chain Telemetry · Protocol Activity Feed</span>
        </div>

        <h1 className="text-3xl sm:text-4xl font-normal tracking-[-1.5px] text-[#142d2b]">
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
            setDisplayCount(10);
          }}
          onCollectionChange={(col) => {
            setSelectedCollection(col);
            setDisplayCount(10);
          }}
        />

        <ActivityStream
          activities={visibleActivities}
          hasMore={hasMore}
          onLoadMore={handleLoadMore}
        />
      </div>
    </div>
  );
}
