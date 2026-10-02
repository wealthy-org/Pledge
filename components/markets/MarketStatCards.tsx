'use client';

import React from 'react';
import { Skeleton } from '@/components/ui/Skeleton';

export interface MarketStats {
  totalPoolSizeEth: string;
  totalActiveLoans: number;
  totalVolumeEth: string;
}

export interface MarketStatCardsProps {
  stats?: MarketStats;
  isLoading?: boolean;
}

export function MarketStatCards({ stats, isLoading = false }: MarketStatCardsProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-[var(--surface)] border border-[var(--line)] rounded-xl p-5">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex flex-col justify-between space-y-2">
            <Skeleton width="120px" height="14px" />
            <Skeleton width="160px" height="28px" />
            <Skeleton width="100px" height="12px" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 bg-[var(--surface)] border border-[var(--line)] rounded-xl p-6">
      <div className="flex flex-col justify-between space-y-1">
        <div className="flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-wider text-[var(--muted)]">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
          <span>Total Pool Size</span>
        </div>
        <div className="text-2xl font-bold font-mono text-[var(--text)]">
          {stats?.totalPoolSizeEth || '0.00'} ETH
        </div>
        <div className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">
          Available liquidity across pools
        </div>
      </div>

      <div className="flex flex-col justify-between space-y-1 sm:border-l sm:border-[var(--line)] sm:pl-6">
        <div className="flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-wider text-[var(--muted)]">
          <span className="w-1.5 h-1.5 rounded-full bg-sky-500" />
          <span>Total Active Loans</span>
        </div>
        <div className="text-2xl font-bold font-mono text-[var(--text)]">
          {stats?.totalActiveLoans ?? 0} Loans
        </div>
        <div className="text-xs text-sky-600 dark:text-sky-400 font-medium">
          Currently collateralized & active
        </div>
      </div>

      <div className="flex flex-col justify-between space-y-1 sm:border-l sm:border-[var(--line)] sm:pl-6">
        <div className="flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-wider text-[var(--muted)]">
          <span className="w-1.5 h-1.5 rounded-full bg-violet-500" />
          <span>Total Volume</span>
        </div>
        <div className="text-2xl font-bold font-mono text-[var(--text)]">
          {stats?.totalVolumeEth || '0.00'} ETH
        </div>
        <div className="text-xs text-violet-600 dark:text-violet-400 font-medium">
          Cumulative loan origination
        </div>
      </div>
    </div>
  );
}
