'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Skeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { formatShortAddress } from '@/lib/services/collectionSafety';
import { useOffers } from '@/hooks/api/useOffers';
import { useSafeChainId } from '@/hooks/useSafeChainId';

export function AllOffersTable() {
  const chainId = useSafeChainId();
  const [durationFilter, setDurationFilter] = useState<'all' | '7' | '14' | '30'>('all');
  const { data, isLoading, isError, error, refetch } = useOffers({
    chainId,
    status: 'open',
  });

  const rawOffers = data?.offers || [];

  const offers = rawOffers.filter((o) => {
    if (durationFilter === 'all') return true;
    const days = Math.round(Number(o.durationSeconds) / 86400);
    return days.toString() === durationFilter;
  });

  const durationChips: Array<{ id: typeof durationFilter; label: string }> = [
    { id: 'all', label: 'All Durations' },
    { id: '7', label: '7 Days' },
    { id: '14', label: '14 Days' },
    { id: '30', label: '30 Days' },
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="text-xs text-[var(--muted)]">Duration:</span>
          <div className="flex flex-wrap gap-1.5">
            {durationChips.map((chip) => (
              <button
                key={chip.id}
                type="button"
                onClick={() => setDurationFilter(chip.id)}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-colors cursor-pointer ${
                  durationFilter === chip.id
                    ? 'bg-[var(--accent-primary)] text-white'
                    : 'bg-[var(--panel)] text-[var(--muted)] hover:text-[var(--text)] border border-[var(--line)]'
                }`}
              >
                {chip.label}
              </button>
            ))}
          </div>
        </div>

        <button
          type="button"
          onClick={() => refetch()}
          className="text-xs text-[var(--muted)] hover:text-[var(--text)] self-end sm:self-auto transition-colors cursor-pointer"
        >
          ↻ Refresh Offers
        </button>
      </div>

      {isError ? (
        <div className="p-6 rounded-xl border border-red-500/20 bg-red-500/5 text-center space-y-2">
          <p className="text-xs text-red-600 dark:text-red-400 font-medium">
            {error instanceof Error ? error.message : 'Failed to fetch protocol offers.'}
          </p>
          <button
            type="button"
            onClick={() => refetch()}
            className="px-3 py-1 text-xs font-semibold rounded bg-red-500 text-white hover:bg-red-600 transition-colors"
          >
            Retry
          </button>
        </div>
      ) : isLoading ? (
        <div className="space-y-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="p-4 rounded-xl bg-[var(--surface)] border border-[var(--line)] flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Skeleton width="40px" height="40px" borderRadius="8px" />
                <div className="space-y-1">
                  <Skeleton width="120px" height="14px" />
                  <Skeleton width="80px" height="12px" />
                </div>
              </div>
              <Skeleton width="100px" height="24px" />
            </div>
          ))}
        </div>
      ) : offers.length === 0 ? (
        <EmptyState
          title="No open offers found"
          description={`There are currently no open offers available for ${durationFilter === 'all' ? 'any duration' : `${durationFilter} days`}.`}
        />
      ) : (
        <div className="overflow-x-auto rounded-xl border border-[var(--line)] bg-[var(--surface)] shadow-xs">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-[var(--line)] bg-[var(--panel)]/50 text-[var(--muted)] font-semibold uppercase tracking-wider">
                <th className="py-3 px-4">Offer</th>
                <th className="py-3 px-4">Collection</th>
                <th className="py-3 px-4">Principal Amount</th>
                <th className="py-3 px-4">Term Interest</th>
                <th className="py-3 px-4">Loan Duration</th>
                <th className="py-3 px-4">Expires</th>
                <th className="py-3 px-4">Lender</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--line)] text-[var(--text)]">
              {offers.map((offer) => {
                const principalEth = (Number(BigInt(offer.principalWei)) / 1e18).toFixed(3);
                const interestPercent = (offer.termInterestBps / 100).toFixed(2);
                const durationDays = Math.round(Number(offer.durationSeconds) / 86400);
                const expiryDate = new Date(Number(offer.expiresAt) * 1000);

                return (
                  <tr key={offer.offerId} className="hover:bg-[var(--panel)]/40 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-[var(--accent-primary)]">
                      #{offer.offerId}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-[var(--text)]">
                        {formatShortAddress(offer.collection)}
                      </div>
                      <div className="text-[10px] font-mono text-[var(--muted)]">
                        ERC-721
                      </div>
                    </td>
                    <td className="py-3.5 px-4 font-mono font-bold text-emerald-600 dark:text-emerald-400">
                      {principalEth} ETH
                    </td>
                    <td className="py-3.5 px-4 font-mono">
                      {interestPercent}% for {durationDays}d
                    </td>
                    <td className="py-3.5 px-4 font-medium">
                      {durationDays} Days
                    </td>
                    <td className="py-3.5 px-4 text-[var(--muted)] text-[11px]">
                      {expiryDate.toLocaleDateString()}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-[11px] text-[var(--muted)]">
                      {formatShortAddress(offer.lender)}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <Link
                        href={`/collection/${offer.collection}`}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-[11px] font-medium bg-[var(--lime)] hover:bg-[#076b4d] text-white transition-colors"
                      >
                        <span>Borrow</span>
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
