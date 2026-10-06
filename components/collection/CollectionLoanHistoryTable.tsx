'use client';

import React from 'react';
import { formatUnits } from 'viem';
import { Badge } from '@/components/ui/Badge';
import { Skeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { getExplorerTxUrl } from '@/config/chains';
import { useSafeChainId } from '@/hooks/useSafeChainId';
import type { LoanItem } from '@/types/api';

export interface CollectionLoanHistoryTableProps {
  loans: LoanItem[];
  isLoading?: boolean;
  chainId?: number;
}

export function CollectionLoanHistoryTable({
  loans,
  isLoading = false,
  chainId,
}: CollectionLoanHistoryTableProps) {
  const safeChainId = useSafeChainId();
  const activeChainId = chainId ?? safeChainId;
  const formatDue = (isoString: string) => {
    try {
      const d = new Date(isoString);
      return d.toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    } catch {
      return isoString;
    }
  };

  const calculateTotalDueEth = (principalWei: string, interestWei: string) => {
    const total = BigInt(principalWei) + BigInt(interestWei);
    return `${Number(formatUnits(total, 18)).toFixed(2)} ETH`;
  };

  if (isLoading) {
    return (
      <div className="w-full rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-6 space-y-3">
        <Skeleton height="40px" borderRadius="8px" />
        <Skeleton height="48px" borderRadius="8px" />
        <Skeleton height="48px" borderRadius="8px" />
      </div>
    );
  }

  if (loans.length === 0) {
    return (
      <div className="w-full rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-8">
        <EmptyState
          title="No Loan History"
          description="There are no loans recorded for this collection yet."
        />
      </div>
    );
  }

  return (
    <div className="w-full overflow-hidden rounded-2xl border border-[var(--line)] bg-[var(--surface)] shadow-[var(--shadow-subtle)]">
      <div className="overflow-x-auto">
        <table className="w-full text-xs text-left">
          <thead className="bg-[var(--panel)] border-b border-[var(--line)] text-[9px] font-mono uppercase tracking-[1.5px] text-[var(--muted)]">
            <tr>
              <th className="py-3.5 px-4 font-semibold">Loan ID</th>
              <th className="py-3.5 px-4 font-semibold">Collateral</th>
              <th className="py-3.5 px-4 font-semibold">Borrower</th>
              <th className="py-3.5 px-4 font-semibold">Principal</th>
              <th className="py-3.5 px-4 font-semibold">Total Due / Repaid</th>
              <th className="py-3.5 px-4 font-semibold">Due Date</th>
              <th className="py-3.5 px-4 font-semibold">Status</th>
              <th className="py-3.5 px-4 font-semibold text-right">Explorer Proof</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-[var(--line)]">
            {loans.map((loan) => {
              const principalEth = `${Number(formatUnits(BigInt(loan.principalWei), 18)).toFixed(2)} ETH`;
              const totalDueEth = calculateTotalDueEth(loan.principalWei, loan.interestWei);
              const borrowerTruncated = `${loan.borrower.slice(0, 6)}...${loan.borrower.slice(-4)}`;
              const txUrl = getExplorerTxUrl(loan.txHash, activeChainId);

              return (
                <tr
                  key={loan.loanId}
                  className="hover:bg-[#F0F7F7] dark:hover:bg-[#14221e] transition-colors"
                >
                  <td className="py-3.5 px-4 font-mono font-bold text-[var(--text)]">
                    #{loan.loanId}
                  </td>

                  <td className="py-3.5 px-4 font-mono font-semibold text-[var(--primary)]">
                    #{loan.tokenId}
                  </td>

                  <td className="py-3.5 px-4 font-mono text-[var(--muted)]">
                    <span title={loan.borrower}>{borrowerTruncated}</span>
                  </td>

                  <td className="py-3.5 px-4 font-mono font-medium text-[var(--text)]">
                    {principalEth}
                  </td>

                  <td className="py-3.5 px-4 font-mono font-bold text-[var(--text)]">
                    {totalDueEth}
                  </td>

                  <td className="py-3.5 px-4 font-mono text-[var(--muted)]">
                    {formatDue(loan.dueAt)}
                  </td>

                  <td className="py-3.5 px-4">
                    <Badge status={loan.status}>{loan.status}</Badge>
                  </td>

                  <td className="py-3.5 px-4 text-right">
                    <a
                      href={txUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 font-mono text-[11px] text-[var(--primary)] hover:underline decoration-dotted"
                    >
                      <span>TX</span>
                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                    </a>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
