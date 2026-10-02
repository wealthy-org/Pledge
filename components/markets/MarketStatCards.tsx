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
        <div className="text-[10px] font-mono uppercase tracking-wider text-[var(--muted)]">
          Total Pool Size
        </div>
        <div className="text-2xl font-bold font-mono text-[var(--text)]">
          {stats?.totalPoolSizeEth || '0.00'} ETH
        </div>
        <div className="text-xs text-[var(--accent-primary)] font-medium">
          Available liquidity across pools
        </div>
      </div>

      <div className="flex flex-col justify-between space-y-1 sm:border-l sm:border-[var(--line)] sm:pl-6">
        <div className="text-[10px] font-mono uppercase tracking-wider text-[var(--muted)]">
          Total Active Loans
        </div>
        <div className="text-2xl font-bold font-mono text-[var(--text)]">
          {stats?.totalActiveLoans ?? 0} Loans
        </div>
        <div className="text-xs text-[var(--muted)]">
          Currently collateralized & active
        </div>
      </div>

      <div className="flex flex-col justify-between space-y-1 sm:border-l sm:border-[var(--line)] sm:pl-6">
        <div className="text-[10px] font-mono uppercase tracking-wider text-[var(--muted)]">
          Total Volume
        </div>
        <div className="text-2xl font-bold font-mono text-[var(--text)]">
          {stats?.totalVolumeEth || '0.00'} ETH
        </div>
        <div className="text-xs text-[var(--accent-primary)] font-medium">
          Cumulative loan origination
        </div>
      </div>
    </div>
  );
}
