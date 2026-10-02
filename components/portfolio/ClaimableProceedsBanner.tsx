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
  totalBorrowedEth = '1.00',
  totalLentEth = '0.50',
  totalEarnedEth = '0.04',
}: ClaimableProceedsBannerProps) {
  const claimableBigInt = BigInt(claimableWei || '0');
  const claimableEth = `${Number(formatUnits(claimableBigInt, 18)).toFixed(2)} ETH`;
  const canWithdraw = claimableBigInt > 0n;

  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#214E3B] via-[#1B3F30] to-[#122B20] text-white p-6 sm:p-8 shadow-[var(--shadow-raised)] border border-emerald-800/40">
      <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/20 text-[#A5C9B3] text-xs font-mono">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span>Claimable Protocol Proceeds</span>
          </div>

          <div>
            <span className="text-xs uppercase font-mono text-[#D7E6D9] block">
              Available for Withdrawal
            </span>
            <div className="text-3xl sm:text-4xl font-black font-mono tracking-tight text-white">
              {claimableEth}
            </div>
          </div>

          <p className="text-xs text-[#D7E6D9]/80 max-w-md">
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
            className="w-full sm:w-auto font-bold shadow-lg"
          >
            Withdraw Proceeds
          </Button>
        </div>
      </div>

      <div className="relative z-10 mt-6 pt-6 border-t border-white/10 grid grid-cols-3 gap-4 text-center sm:text-left">
        <div>
          <span className="text-[10px] uppercase font-mono text-[#A5C9B3] block">
            Active Borrowed
          </span>
          <span className="text-sm sm:text-base font-bold font-mono text-white">
            {totalBorrowedEth} ETH
          </span>
        </div>

        <div>
          <span className="text-[10px] uppercase font-mono text-[#A5C9B3] block">
            Active Lent
          </span>
          <span className="text-sm sm:text-base font-bold font-mono text-white">
            {totalLentEth} ETH
          </span>
        </div>

        <div>
          <span className="text-[10px] uppercase font-mono text-[#A5C9B3] block">
            Lifetime Yield
          </span>
          <span className="text-sm sm:text-base font-bold font-mono text-emerald-400">
            +{totalEarnedEth} ETH
          </span>
        </div>
      </div>

      <div className="absolute right-0 bottom-0 top-0 w-1/4 opacity-5 pointer-events-none flex items-center justify-center text-[160px] font-black">
        💰
      </div>
    </div>
  );
}
