'use client';

import React from 'react';
import Link from 'next/link';
import { useConnectModal } from '@/contexts/ConnectModalContext';

export interface PortfolioDisconnectedStateProps {
  onConnect?: () => void;
}

export function PortfolioDisconnectedState({ onConnect }: PortfolioDisconnectedStateProps) {
  const { openConnectModal } = useConnectModal();

  const handleConnect = () => {
    if (onConnect) {
      onConnect();
    } else {
      openConnectModal();
    }
  };

  return (
    <div className="space-y-8">
      <div className="relative overflow-hidden rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-8 sm:p-12 text-center shadow-sm">
        <div className="mx-auto max-w-lg space-y-6">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto border border-emerald-500/20">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
          </div>

          <div className="space-y-2">
            <h2 className="text-2xl font-bold tracking-tight text-[var(--text)]">
              Connect your wallet to view positions
            </h2>
            <p className="text-xs sm:text-sm text-[var(--muted)] leading-relaxed">
              Your active loans, open lender offers, accrued yield, and claimable escrow capital are tied to your Web3 wallet address.
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <button
              type="button"
              onClick={handleConnect}
              className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-sm transition-all duration-150 cursor-pointer flex items-center gap-2"
            >
              <span className="w-2 h-2 rounded-full bg-emerald-200 inline-block animate-pulse" />
              <span>Connect Wallet to Access Portfolio</span>
            </button>

            <Link
              href="/collections"
              className="px-5 py-2.5 rounded-xl bg-[var(--panel)] hover:bg-[var(--raised)] border border-[var(--line)] text-xs font-semibold text-[var(--text)] transition-all shadow-xs"
            >
              Explore Markets ↗
            </Link>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="p-5 rounded-xl border border-[var(--line)] bg-[var(--surface)] space-y-2">
          <div className="flex items-center gap-2 text-sky-600 dark:text-sky-400 text-xs font-mono font-bold uppercase">
            <span className="w-2 h-2 rounded-full bg-sky-500" />
            <span>Borrowing Positions</span>
          </div>
          <p className="text-xs text-[var(--muted)] leading-relaxed">
            Monitor active loans collateralized by your NFTs, track repayment countdowns, and settle debts to release assets.
          </p>
        </div>

        <div className="p-5 rounded-xl border border-[var(--line)] bg-[var(--surface)] space-y-2">
          <div className="flex items-center gap-2 text-violet-600 dark:text-violet-400 text-xs font-mono font-bold uppercase">
            <span className="w-2 h-2 rounded-full bg-violet-500" />
            <span>Lending & Offers</span>
          </div>
          <p className="text-xs text-[var(--muted)] leading-relaxed">
            Manage your committed liquidity pools across curated collections and cancel unaccepted offers at any time.
          </p>
        </div>

        <div className="p-5 rounded-xl border border-[var(--line)] bg-[var(--surface)] space-y-2">
          <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 text-xs font-mono font-bold uppercase">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span>Claimable Proceeds</span>
          </div>
          <p className="text-xs text-[var(--muted)] leading-relaxed">
            Instantly withdraw repaid borrower principals, interest earnings, and unlocked escrow capital to your wallet.
          </p>
        </div>
      </div>
    </div>
  );
}
