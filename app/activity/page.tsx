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
    <div className="space-y-8 animate-in fade-in duration-200">
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#214E3B] to-[#123124] text-white p-8 shadow-[var(--shadow-raised)]">
        <div className="max-w-2xl space-y-3 relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/20 text-[#A5C9B3] text-xs font-mono">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span>On-Chain Provenance</span>
          </div>

          <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight">
            Protocol Activity Feed
          </h1>

          <p className="text-xs sm:text-sm text-[#D7E6D9] leading-relaxed">
            Live timeline of liquidity offers, loan originations, settlements, and foreclosures on Robinhood Chain.
          </p>
        </div>

        <div className="absolute right-0 bottom-0 top-0 w-1/3 opacity-10 pointer-events-none flex items-center justify-center text-[180px] font-black">
          📡
        </div>
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
