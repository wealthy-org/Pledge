'use client';

import React from 'react';

export interface TabItem {
  id: string;
  label: string;
  count?: number;
  icon?: React.ReactNode;
}

export interface TabsProps {
  tabs: TabItem[];
  activeTab: string;
  onChange: (id: string) => void;
  className?: string;
}

export function Tabs({ tabs, activeTab, onChange, className = '' }: TabsProps) {
  return (
    <div
      role="tablist"
      className={`inline-flex p-1 bg-[var(--panel)] rounded-lg border border-[var(--line)] gap-1 ${className}`}
    >
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(tab.id)}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer select-none border ${
              isActive
                ? 'bg-[var(--surface)] text-[var(--text)] border-[var(--line)] shadow-xs'
                : 'text-[var(--muted)] hover:text-[var(--text)] border-transparent'
            }`}
          >
            {tab.icon && <span>{tab.icon}</span>}
            <span>{tab.label}</span>
            {typeof tab.count === 'number' && (
              <span
                className={`px-1.5 py-0.5 text-[10px] font-mono rounded-sm ${
                  isActive
                    ? 'bg-[var(--panel)] text-[var(--accent-primary)]'
                    : 'bg-[var(--surface)] text-[var(--muted)]'
                }`}
              >
                {tab.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
