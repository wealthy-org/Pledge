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
  const tabs: { id: RankingTabType; label: string; icon?: string }[] = [
    { id: 'top', label: 'Top' },
    { id: 'volume', label: 'Volume' },
    { id: 'movers', label: 'Movers' },
  ];

  return (
    <div
      role="tablist"
      aria-label="Collection Market Ranking"
      className={`inline-flex items-center p-1 bg-[#f0f4f2] dark:bg-[#14221e] border border-[#dce6e1] dark:border-[#1e332c] rounded-xl gap-1 ${className}`}
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
            className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
              isSelected
                ? 'bg-white dark:bg-[#192b25] text-[#142d2b] dark:text-[#f0f6fc] shadow-xs border border-[#d2dfd8] dark:border-[#1e332c]'
                : 'text-[#61736b] dark:text-[#8b949e] hover:text-[#142d2b] dark:hover:text-white'
            }`}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}
