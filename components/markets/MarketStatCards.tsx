'use client';

import React from 'react';
import { Card } from '@/components/ui/Card';
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
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="p-5 flex flex-col justify-between">
            <Skeleton width="120px" height="14px" className="mb-2" />
            <Skeleton width="160px" height="28px" className="mb-1" />
            <Skeleton width="100px" height="12px" />
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      <Card className="p-5 flex flex-col justify-between hover:border-[var(--line-strong)] transition-all">
        <div className="text-[11px] font-mono uppercase tracking-wider text-[var(--muted)]">
          Total Pool Size
        </div>
        <div className="text-2xl font-bold font-mono text-[var(--text)] mt-1.5">
          {stats?.totalPoolSizeEth || '0.00'} ETH
        </div>
        <div className="text-xs text-[var(--primary)] font-medium mt-1">
          Available liquidity across pools
        </div>
      </Card>

      <Card className="p-5 flex flex-col justify-between hover:border-[var(--line-strong)] transition-all">
        <div className="text-[11px] font-mono uppercase tracking-wider text-[var(--muted)]">
          Total Active Loans
        </div>
        <div className="text-2xl font-bold font-mono text-[var(--text)] mt-1.5">
          {stats?.totalActiveLoans ?? 0} Loans
        </div>
        <div className="text-xs text-[var(--muted)] mt-1">
          Currently collateralized & active
        </div>
      </Card>

      <Card className="p-5 flex flex-col justify-between hover:border-[var(--line-strong)] transition-all">
        <div className="text-[11px] font-mono uppercase tracking-wider text-[var(--muted)]">
          Total Volume
        </div>
        <div className="text-2xl font-bold font-mono text-[var(--text)] mt-1.5">
          {stats?.totalVolumeEth || '0.00'} ETH
        </div>
        <div className="text-xs text-[var(--success)] font-medium mt-1">
          Cumulative loan origination
        </div>
      </Card>
    </div>
  );
}
