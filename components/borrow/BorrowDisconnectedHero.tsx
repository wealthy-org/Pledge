'use client';

import React from 'react';
import Link from 'next/link';
import { useConnectModal } from '@/contexts/ConnectModalContext';

export interface BorrowDisconnectedHeroProps {
  onConnect?: () => void;
}

export function BorrowDisconnectedHero({ onConnect }: BorrowDisconnectedHeroProps) {
  const { openConnectModal } = useConnectModal();

  const handleConnectClick = () => {
    if (onConnect) {
      onConnect();
    } else {
      openConnectModal();
    }
  };

  return (
    <div className="relative overflow-hidden rounded-2xl border border-[#cfe4dc] dark:border-[#1e332c] bg-gradient-to-b from-[#f4fbf8] to-[#ffffff] dark:from-[#111f1a] dark:to-[#0c1613] p-8 sm:p-12 text-center shadow-sm">
      <div className="mx-auto max-w-xl space-y-6">
        <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3.5 py-1 text-[11px] font-semibold text-emerald-800 dark:text-emerald-300">
          <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>Permissionless NFT Liquidity Escrow</span>
        </div>

        <div className="space-y-2">
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#142d2b] dark:text-[#f0fdf4]">
            Connect your wallet to inspect eligible collectibles
          </h2>
          <p className="text-xs sm:text-sm text-[var(--muted)] leading-relaxed">
            Connect your Web3 wallet to automatically scan verified NFTs from indexed collections, compare competitive fixed-rate lender offers, and borrow instant ETH.
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          <button
            type="button"
            onClick={handleConnectClick}
            className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-sm transition-all duration-150 cursor-pointer flex items-center gap-2"
          >
            <span className="w-2 h-2 rounded-full bg-emerald-200 inline-block" />
            <span>Connect Wallet to Borrow</span>
          </button>

          <Link
            href="/explore"
            className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-white dark:bg-[#152721] hover:bg-[#ebf5f0] dark:hover:bg-[#1a312a] border border-[#cfe4dc] dark:border-[#1e332c] text-xs font-semibold text-[#142d2b] dark:text-[#f0fdf4] transition-all shadow-xs"
          >
            <span>Explore Collections</span>
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M7 17L17 7M17 7H7M17 7V17" />
            </svg>
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-6 border-t border-[#e2ece7] dark:border-[#1e332c] text-left">
          <div className="space-y-1">
            <span className="text-[10px] font-mono uppercase text-[#377994] dark:text-emerald-400 font-semibold block">
              1. Non-Custodial
            </span>
            <p className="text-[11px] text-[var(--muted)]">
              NFT is safely escrowed in isolated smart contracts until repayment.
            </p>
          </div>
          <div className="space-y-1">
            <span className="text-[10px] font-mono uppercase text-[#377994] dark:text-emerald-400 font-semibold block">
              2. Fixed APR Terms
            </span>
            <p className="text-[11px] text-[var(--muted)]">
              Lock in transparent interest rates with no fluctuating variable fees.
            </p>
          </div>
          <div className="space-y-1">
            <span className="text-[10px] font-mono uppercase text-[#377994] dark:text-emerald-400 font-semibold block">
              3. Instant Liquidity
            </span>
            <p className="text-[11px] text-[var(--muted)]">
              Accept lender offers and receive ETH in your wallet in a single transaction.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
