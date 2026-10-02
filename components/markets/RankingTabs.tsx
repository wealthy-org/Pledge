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

  return (
    <div
      role="tablist"
      aria-label="Collection Market Ranking"
      className={`inline-flex items-center p-1 bg-[var(--panel)] border border-[var(--line)] rounded-lg gap-1 ${className}`}
    >
      {tabs.map((tab) => {
        const isSelected = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            role="tab"
            type="button"
            aria-selected={isSelected}
            onClick={() => onTabChange(tab.id)}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer border ${
              isSelected
                ? 'bg-[var(--surface)] text-[var(--text)] shadow-xs border-[var(--line)]'
                : 'text-[var(--muted)] hover:text-[var(--text)] border-transparent'
            }`}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}
