'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { NftImage } from '@/components/nft/NftImage';
import { CountdownTimer } from '@/components/common/CountdownTimer';
import { Skeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { formatShortAddress } from '@/lib/services/collectionSafety';
import { useLoans } from '@/hooks/api/useLoans';
import { useSafeChainId } from '@/hooks/useSafeChainId';
import type { LoanItem } from '@/types/api';

export function AllLoansTable() {
  const chainId = useSafeChainId();
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'overdue' | 'repaid' | 'foreclosed'>('all');
  const { data, isLoading, isError, error, refetch } = useLoans({
    chainId,
    status: statusFilter === 'all' ? undefined : statusFilter,
  });

  const loans = data?.loans || [];

  const filterChips: Array<{ id: typeof statusFilter; label: string }> = [
    { id: 'all', label: 'All Status' },
    { id: 'active', label: 'Active' },
    { id: 'overdue', label: 'Overdue' },
    { id: 'repaid', label: 'Repaid' },
    { id: 'foreclosed', label: 'Foreclosed' },
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="text-xs text-[var(--muted)]">Filter Status:</span>
          <div className="flex flex-wrap gap-1.5">
            {filterChips.map((chip) => (
              <button
                key={chip.id}
                type="button"
                onClick={() => setStatusFilter(chip.id)}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-colors cursor-pointer ${
                  statusFilter === chip.id
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
          ↻ Refresh Loans
        </button>
      </div>

      {isError ? (
        <div className="p-6 rounded-xl border border-red-500/20 bg-red-500/5 text-center space-y-2">
          <p className="text-xs text-red-600 dark:text-red-400 font-medium">
            {error instanceof Error ? error.message : 'Failed to fetch protocol loans.'}
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
      ) : loans.length === 0 ? (
        <EmptyState
          title="No loans found"
          description={`There are currently no ${statusFilter === 'all' ? '' : statusFilter} loans recorded on Robinhood Chain.`}
        />
      ) : (
        <div className="overflow-x-auto rounded-xl border border-[var(--line)] bg-[var(--surface)] shadow-xs">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-[var(--line)] bg-[var(--panel)]/50 text-[var(--muted)] font-semibold uppercase tracking-wider">
                <th className="py-3 px-4">Loan</th>
                <th className="py-3 px-4">Collateral NFT</th>
                <th className="py-3 px-4">Principal</th>
                <th className="py-3 px-4">Interest Due</th>
                <th className="py-3 px-4">Due Date / Countdown</th>
                <th className="py-3 px-4">Borrower</th>
                <th className="py-3 px-4">Lender</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--line)] text-[var(--text)]">
              {loans.map((loan) => {
                const principalEth = (Number(BigInt(loan.principalWei)) / 1e18).toFixed(3);
                const interestEth = (Number(BigInt(loan.interestWei)) / 1e18).toFixed(4);
                const dueTimestamp = Number(loan.dueAt);

                return (
                  <tr key={loan.loanId} className="hover:bg-[var(--panel)]/40 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-[var(--accent-primary)]">
                      #{loan.loanId}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-md overflow-hidden bg-[var(--panel)] shrink-0 border border-[var(--line)]">
                          <NftImage
                            contractAddress={loan.collection}
                            tokenId={loan.tokenId}
                            alt={`Token ${loan.tokenId}`}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div>
                          <div className="font-semibold text-[var(--text)]">
                            Token #{loan.tokenId}
                          </div>
                          <div className="text-[10px] font-mono text-[var(--muted)]">
                            {formatShortAddress(loan.collection)}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 font-mono font-semibold">
                      {principalEth} ETH
                    </td>
                    <td className="py-3.5 px-4 font-mono text-[var(--muted)]">
                      +{interestEth} ETH
                    </td>
                    <td className="py-3.5 px-4">
                      {loan.status === 'active' ? (
                        <CountdownTimer dueAt={dueTimestamp} />
                      ) : (
                        <span className="text-[var(--muted)] text-[11px]">
                          {new Date(dueTimestamp * 1000).toLocaleDateString()}
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-[11px] text-[var(--muted)]">
                      {formatShortAddress(loan.borrower)}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-[11px] text-[var(--muted)]">
                      {formatShortAddress(loan.lender)}
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide ${
                          loan.status === 'active'
                            ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                            : loan.status === 'repaid'
                            ? 'bg-sky-500/15 text-sky-600 dark:text-sky-400 border border-sky-500/30'
                            : 'bg-zinc-500/15 text-zinc-600 dark:text-zinc-400 border border-zinc-500/30'
                        }`}
                      >
                        {loan.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <Link
                        href={`/loan/${loan.loanId}`}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-[11px] font-medium bg-[var(--panel)] hover:bg-[var(--line)] border border-[var(--line)] text-[var(--text)] transition-colors"
                      >
                        <span>View Loan</span>
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
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
