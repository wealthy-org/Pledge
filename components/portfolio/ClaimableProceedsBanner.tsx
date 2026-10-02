'use client';

import React from 'react';
import { formatUnits } from 'viem';
import { Button } from '@/components/ui/Button';

export interface ClaimableProceedsBannerProps {
  claimableWei: string;
  onWithdraw: () => void;
  isWithdrawing?: boolean;
  totalBorrowedEth?: string;
  totalLentEth?: string;
  totalEarnedEth?: string;
}

export function ClaimableProceedsBanner({
  claimableWei,
  onWithdraw,
  isWithdrawing = false,
  totalBorrowedEth = '0.00',
  totalLentEth = '0.00',
  totalEarnedEth = '0.00',
}: ClaimableProceedsBannerProps) {
  const claimableBigInt = BigInt(claimableWei || '0');
  const claimableEth = `${Number(formatUnits(claimableBigInt, 18)).toFixed(2)} ETH`;
  const canWithdraw = claimableBigInt > 0n;

  return (
    <div className="relative overflow-hidden rounded-xl bg-[var(--surface)] text-[var(--text)] p-6 sm:p-8 border border-[var(--line)] shadow-[var(--shadow-subtle)]">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-xs font-mono text-[var(--muted)] tracking-tight">
            <span className="font-semibold text-[var(--text)]">Robinhood Chain</span>
            <span className="opacity-40">/</span>
            <span>Claimable Protocol Proceeds</span>
          </div>

          <div>
            <span className="text-xs uppercase font-mono text-[var(--muted)] block">
              Available for Withdrawal
            </span>
            <div className="text-3xl sm:text-4xl font-mono font-bold tracking-tight text-[var(--text)]">
              {claimableEth}
            </div>
          </div>

          <p className="text-xs text-[var(--muted)] max-w-md">
            Repaid loan principal, earned term interest, and refunded cancelled offer capital available to pull into your connected wallet.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <Button
            variant="primary"
            size="lg"
            disabled={!canWithdraw}
            loading={isWithdrawing}
            onClick={onWithdraw}
            className="w-full sm:w-auto font-medium"
          >
            Withdraw Proceeds
          </Button>
        </div>
      </div>

      <div className="mt-6 pt-6 border-t border-[var(--line)] grid grid-cols-3 gap-4 text-center sm:text-left">
        <div>
          <span className="text-[10px] uppercase font-mono text-[var(--muted)] block">
            Active Borrowed
          </span>
          <div className="text-sm sm:text-base font-mono font-semibold text-sky-600 dark:text-sky-400">
            <span>{totalBorrowedEth}</span>
            <span className="text-xs font-normal text-[var(--muted)] ml-1">ETH</span>
          </div>
        </div>

        <div>
          <span className="text-[10px] uppercase font-mono text-[var(--muted)] block">
            Active Lent
          </span>
          <div className="text-sm sm:text-base font-mono font-semibold text-emerald-600 dark:text-emerald-400">
            <span>{totalLentEth}</span>
            <span className="text-xs font-normal text-[var(--muted)] ml-1">ETH</span>
          </div>
        </div>

        <div>
          <span className="text-[10px] uppercase font-mono text-[var(--muted)] block">
            Lifetime Yield
          </span>
          <div className="text-sm sm:text-base font-mono font-semibold text-amber-600 dark:text-amber-400">
            <span>+{totalEarnedEth}</span>
            <span className="text-xs font-normal text-[var(--muted)] ml-1">ETH</span>
          </div>
        </div>
      </div>
    </div>
  );
}
