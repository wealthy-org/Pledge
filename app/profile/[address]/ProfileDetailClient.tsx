'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { isAddress } from 'viem';
import { useConnection } from 'wagmi';
import { useSafeChainId } from '@/hooks/useSafeChainId';
import { formatShortAddress } from '@/lib/services/collectionSafety';
import { LendingTab } from '@/components/portfolio/LendingTab';
import { BorrowingTab } from '@/components/portfolio/BorrowingTab';
import { OffersTab } from '@/components/portfolio/OffersTab';
import { HistoryTab } from '@/components/portfolio/HistoryTab';
import { Skeleton } from '@/components/ui/Skeleton';
import { Button } from '@/components/ui/Button';
import type { PortfolioResponse } from '@/app/api/portfolio/[address]/route';

export function ProfileDetailClient({ address }: { address: string }) {
  const chainId = useSafeChainId();
  const { address: connectedAddress } = useConnection();
  const isValid = isAddress(address);

  const [data, setData] = useState<PortfolioResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'lending' | 'borrowing' | 'offers' | 'history'>('lending');
  const [copied, setCopied] = useState(false);

  const isOwner = connectedAddress?.toLowerCase() === address.toLowerCase();

  const fetchProfile = async () => {
    if (!isValid) return;
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/portfolio/${address}?chainId=${chainId}`);
      if (!res.ok) {
        throw new Error(`Failed to load profile (HTTP ${res.status})`);
      }
      const json = await res.json();
      setData(json);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error loading profile');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, [address, chainId, isValid]);

  const handleCopy = () => {
    navigator.clipboard.writeText(address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!isValid) {
    return (
      <div className="w-full max-w-4xl mx-auto px-4 py-16 text-center space-y-4">
        <div className="w-12 h-12 rounded-full bg-red-500/10 text-red-500 flex items-center justify-center mx-auto">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-6 h-6">
            <circle cx="12" cy="12" r="10" />
            <line x1="15" y1="9" x2="9" y2="15" />
            <line x1="9" y1="9" x2="15" y2="15" />
          </svg>
        </div>
        <h1 className="text-xl font-bold text-[var(--text)]">Invalid Wallet Address</h1>
        <p className="text-xs text-[var(--muted)]">
          The address &quot;{address}&quot; is not a valid Ethereum hex address.
        </p>
        <Link href="/" className="inline-block px-4 py-2 text-xs font-semibold rounded-lg bg-[var(--surface)] border border-[var(--line)] hover:bg-[var(--panel)]">
          Return to Markets
        </Link>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full max-w-4xl mx-auto px-4 py-16 text-center space-y-4">
        <h1 className="text-xl font-bold text-[var(--text)]">Unable to load profile</h1>
        <p className="text-xs text-[var(--muted)]">{error}</p>
        <Button onClick={fetchProfile} variant="secondary" size="sm">
          Retry
        </Button>
      </div>
    );
  }

  const borrowedLoans = data?.borrowedLoans || [];
  const lentLoans = data?.lentLoans || [];
  const activeOffers = data?.activeOffers || [];

  const totalBorrowedEth = data?.totalBorrowedWei
    ? (Number(BigInt(data.totalBorrowedWei)) / 1e18).toFixed(3)
    : '0.000';
  const totalLentEth = data?.totalLentWei
    ? (Number(BigInt(data.totalLentWei)) / 1e18).toFixed(3)
    : '0.000';

  return (
    <div className="w-full max-w-6xl mx-auto px-4 py-8 space-y-8">
      <div className="p-6 rounded-2xl bg-[var(--surface)] border border-[var(--line)] shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center text-white text-lg font-mono font-bold shadow-md">
              {address.slice(2, 4).toUpperCase()}
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h1 className="text-lg sm:text-xl font-bold text-[var(--text)] font-mono">
                  {formatShortAddress(address)}
                </h1>
                {isOwner && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                    You
                  </span>
                )}
              </div>
              <div className="text-xs text-[var(--muted)] font-mono break-all sm:break-normal">
                {address}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleCopy}
              className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-[var(--panel)] border border-[var(--line)] text-[var(--text)] hover:bg-[var(--line)] transition-colors cursor-pointer"
            >
              {copied ? '✓ Copied' : 'Copy Address'}
            </button>
            <a
              href={`https://explorer.testnet.chain.robinhood.com/address/${address}`}
              target="_blank"
              rel="noreferrer noopener"
              className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-[var(--panel)] border border-[var(--line)] text-[var(--muted)] hover:text-[var(--text)] hover:bg-[var(--line)] transition-colors inline-flex items-center gap-1"
            >
              <span>Explorer</span>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3.5 h-3.5">
                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6M15 3h6v6M10 14L21 3" />
              </svg>
            </a>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 border-t border-[var(--line)]">
          <div className="p-3.5 rounded-xl bg-[var(--panel)]/60 border border-[var(--line)] space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--muted)]">
              Total Borrowed
            </span>
            <div className="text-base sm:text-lg font-mono font-bold text-sky-600 dark:text-sky-400">
              {totalBorrowedEth} ETH
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-[var(--panel)]/60 border border-[var(--line)] space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--muted)]">
              Borrow Positions
            </span>
            <div className="text-base sm:text-lg font-mono font-bold text-[var(--text)]">
              {borrowedLoans.length}
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-[var(--panel)]/60 border border-[var(--line)] space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--muted)]">
              Total Lent
            </span>
            <div className="text-base sm:text-lg font-mono font-bold text-emerald-600 dark:text-emerald-400">
              {totalLentEth} ETH
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-[var(--panel)]/60 border border-[var(--line)] space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--muted)]">
              Active Offers
            </span>
            <div className="text-base sm:text-lg font-mono font-bold text-[var(--text)]">
              {activeOffers.length}
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center gap-1.5 p-1 bg-[var(--surface)] rounded-xl border border-[var(--line)] w-fit">
          <button
            type="button"
            onClick={() => setActiveTab('lending')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'lending'
                ? 'bg-[var(--panel)] text-[var(--text)] shadow-xs border border-[var(--line)]'
                : 'text-[var(--muted)] hover:text-[var(--text)]'
            }`}
          >
            Lending ({lentLoans.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('borrowing')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'borrowing'
                ? 'bg-[var(--panel)] text-[var(--text)] shadow-xs border border-[var(--line)]'
                : 'text-[var(--muted)] hover:text-[var(--text)]'
            }`}
          >
            Borrowing ({borrowedLoans.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('offers')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'offers'
                ? 'bg-[var(--panel)] text-[var(--text)] shadow-xs border border-[var(--line)]'
                : 'text-[var(--muted)] hover:text-[var(--text)]'
            }`}
          >
            Offers ({activeOffers.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('history')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'history'
                ? 'bg-[var(--panel)] text-[var(--text)] shadow-xs border border-[var(--line)]'
                : 'text-[var(--muted)] hover:text-[var(--text)]'
            }`}
          >
            History
          </button>
        </div>

        {isLoading ? (
          <div className="space-y-3">
            <Skeleton width="100%" height="80px" borderRadius="12px" />
            <Skeleton width="100%" height="80px" borderRadius="12px" />
          </div>
        ) : activeTab === 'lending' ? (
          <LendingTab loans={lentLoans} userAddress={address} isLoading={isLoading} />
        ) : activeTab === 'borrowing' ? (
          <BorrowingTab loans={borrowedLoans} userAddress={address} isLoading={isLoading} />
        ) : activeTab === 'offers' ? (
          <OffersTab offers={activeOffers} userAddress={address} isLoading={isLoading} />
        ) : (
          <HistoryTab
            loans={[...borrowedLoans, ...lentLoans]}
            offers={activeOffers}
            userAddress={address}
            isLoading={isLoading}
          />
        )}
      </div>
    </div>
  );
}
