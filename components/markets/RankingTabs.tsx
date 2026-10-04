'use client';

import React from 'react';

export type RankingTabType = 'top' | 'volume' | 'movers';

export interface RankingTabsProps {
  activeTab: RankingTabType;
  onTabChange: (tab: RankingTabType) => void;
  className?: string;
}

export function RankingTabs({
  activeTab,
  onTabChange,
  className = '',
}: RankingTabsProps) {
  const tabs: { id: RankingTabType; label: string }[] = [
    { id: 'top', label: 'Top' },
    { id: 'volume', label: 'Volume' },
    { id: 'movers', label: 'Movers' },
  ];

  const activeIndex = tabs.findIndex((t) => t.id === activeTab);
  const leftPercent = activeIndex >= 0 ? (activeIndex / tabs.length) * 100 : 0;
  const widthPercent = 100 / tabs.length;

  return (
    <div
      role="tablist"
      aria-label="Collection Market Ranking"
      className={`relative inline-flex items-center p-1 bg-[var(--panel)] border border-[var(--line)] rounded-lg select-none ${className}`}
    >
      <div
        className="absolute top-1 bottom-1 rounded-md bg-[var(--surface)] border border-[var(--line)] shadow-xs transition-all duration-200 ease-out pointer-events-none"
        style={{
          left: `calc(${leftPercent}% + 4px)`,
          width: `calc(${widthPercent}% - 8px)`,
        }}
      />
      {tabs.map((tab) => {
        const isSelected = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            role="tab"
            type="button"
            aria-selected={isSelected}
            onClick={() => onTabChange(tab.id)}
            className={`relative z-10 px-3 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer border border-transparent ${
              isSelected
                ? 'text-[var(--text)] font-semibold'
                : 'text-[var(--muted)] hover:text-[var(--text)]'
            }`}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}
