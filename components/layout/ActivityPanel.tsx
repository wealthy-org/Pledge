'use client';

import React, { useState } from 'react';

interface MockActivity {
  id: string;
  type: 'offer_created' | 'loan_started' | 'loan_repaid' | 'loan_foreclosed';
  title: string;
  collection: string;
  amount: string;
  time: string;
}

const MOCK_ACTIVITIES: MockActivity[] = [
  {
    id: 'act-1',
    type: 'loan_started',
    title: 'Loan Started',
    collection: 'Robinhood Genesis Pass #12',
    amount: '1.25 ETH',
    time: '2m ago',
  },
  {
    id: 'act-2',
    type: 'offer_created',
    title: 'New Offer Listed',
    collection: 'Sherwood Forest Rangers',
    amount: '0.65 ETH',
    time: '14m ago',
  },
  {
    id: 'act-3',
    type: 'loan_repaid',
    title: 'Loan Repaid in Full',
    collection: 'Nottingham Guild Pledges #88',
    amount: '0.48 ETH',
    time: '45m ago',
  },
];

export function ActivityPanel() {
  const [isOpen, setIsOpen] = useState(true);

  return (
    <aside
      aria-label="Activity Feed"
      className={`hidden lg:flex border-l border-[var(--line)] bg-[var(--surface)] flex-col transition-all duration-200 ease-in-out shrink-0 ${
        isOpen ? 'w-[var(--feed-width)]' : 'w-12'
      }`}
    >
      <div className="h-[var(--header-height)] px-4 border-b border-[var(--line)] flex items-center justify-between">
        {isOpen ? (
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[var(--primary)] animate-pulse" />
            <h3 className="text-xs font-semibold uppercase tracking-wider text-[var(--muted)]">
              Recent Activity
            </h3>
          </div>
        ) : (
          <span className="text-sm mx-auto">⚡</span>
        )}

        <button
          onClick={() => setIsOpen(!isOpen)}
          aria-label="Toggle activity panel"
          className="p-1.5 rounded-lg text-[var(--muted)] hover:text-[var(--text)] hover:bg-[var(--raised)] transition-colors cursor-pointer"
        >
          {isOpen ? '▶' : '◀'}
        </button>
      </div>

      {isOpen && (
        <div className="flex-1 overflow-y-auto p-4 space-y-3 divide-y divide-[var(--line)]">
          {MOCK_ACTIVITIES.map((act) => (
            <div key={act.id} className="pt-3 first:pt-0 flex flex-col gap-1">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-[var(--text)]">{act.title}</span>
                <span className="text-[10px] font-mono text-[var(--muted)]">{act.time}</span>
              </div>
              <p className="text-xs text-[var(--muted)] truncate">{act.collection}</p>
              <div className="text-xs font-mono font-bold text-[var(--primary)]">{act.amount}</div>
            </div>
          ))}
        </div>
      )}
    </aside>
  );
}
