'use client';

import React, { useState, useMemo } from 'react';
import { formatUnits } from 'viem';
import { getExplorerTxUrl } from '@/config/chains';
import { useSafeChainId } from '@/hooks/useSafeChainId';
import { Skeleton } from '@/components/ui/Skeleton';
import { Pagination } from '@/components/ui/Pagination';
import type { LoanItem, OfferItem } from '@/types/api';

const HISTORY_PAGE_SIZE = 6;

export interface HistoryTabProps {
  loans: LoanItem[];
  offers: OfferItem[];
  userAddress?: string;
  chainId?: number;
  isLoading?: boolean;
}

interface HistoryEntry {
  id: string;
  type: 'Loan' | 'Offer';
  role: 'Borrower' | 'Lender';
  principalEth: string;
  status: string;
  date: string;
  txHash: string;
}

export function HistoryTab({
  loans,
  offers,
  userAddress,
  chainId,
  isLoading = false,
}: HistoryTabProps) {
  const safeChainId = useSafeChainId();
  const activeChainId = chainId ?? safeChainId;
  const normalizedUser = userAddress?.toLowerCase();
  const [page, setPage] = useState(1);

  const historyEntries: HistoryEntry[] = useMemo(() => {
    const list: HistoryEntry[] = [];
    if (normalizedUser) {
      for (const loan of loans) {
        if (loan.status === 'repaid' || loan.status === 'foreclosed') {
          const isBorrower = loan.borrower.toLowerCase() === normalizedUser;
          const isLender = loan.lender.toLowerCase() === normalizedUser;

          if (isBorrower || isLender) {
            list.push({
              id: `Loan #${loan.loanId}`,
              type: 'Loan',
              role: isBorrower ? 'Borrower' : 'Lender',
              principalEth: `${Number(formatUnits(BigInt(loan.principalWei), 18)).toFixed(2)} ETH`,
              status: loan.status,
              date: loan.dueAt,
              txHash: loan.txHash,
            });
          }
        }
      }

      for (const offer of offers) {
        if (offer.status === 'filled' || offer.status === 'cancelled') {
          if (offer.lender.toLowerCase() === normalizedUser) {
            list.push({
              id: `Offer #${offer.offerId}`,
              type: 'Offer',
              role: 'Lender',
              principalEth: `${Number(formatUnits(BigInt(offer.principalWei), 18)).toFixed(2)} ETH`,
              status: offer.status,
              date: offer.createdAt,
              txHash: offer.txHash,
            });
          }
        }
      }
    }
    return list;
  }, [loans, offers, normalizedUser]);

  const totalPages = Math.ceil(historyEntries.length / HISTORY_PAGE_SIZE);
  const paginatedEntries = useMemo(() => {
    return historyEntries.slice((page - 1) * HISTORY_PAGE_SIZE, page * HISTORY_PAGE_SIZE);
  }, [historyEntries, page]);

  const formatDate = (isoString: string) => {
    try {
      const d = new Date(isoString);
      return d.toLocaleDateString(undefined, {
        day: 'numeric',
        month: 'short',
      });
    } catch {
      return isoString;
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3, 4].map((i) => (
          <article
            key={i}
            data-testid="history-skeleton-row"
            className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 bg-[var(--surface)] border border-[var(--line)] rounded-xl"
          >
            <div className="flex items-center gap-3.5">
              <Skeleton width="48px" height="48px" borderRadius="8px" />
              <div className="space-y-2">
                <Skeleton width="120px" height="16px" />
                <Skeleton width="60px" height="12px" />
              </div>
            </div>
            <div className="flex items-center gap-6">
              <div className="space-y-1">
                <Skeleton width="40px" height="10px" />
                <Skeleton width="70px" height="14px" />
              </div>
              <div className="space-y-1">
                <Skeleton width="40px" height="10px" />
                <Skeleton width="70px" height="14px" />
              </div>
            </div>
          </article>
        ))}
      </div>
    );
  }

  if (historyEntries.length === 0) {
    return (
      <div className="py-16 px-6 border border-dashed border-[#e1ebe6] dark:border-[#1e332c] rounded-xl text-center bg-white dark:bg-[#111a17]">
        <div className="text-3xl text-[var(--lime)] dark:text-emerald-400 mb-2 font-mono">◈</div>
        <h3 className="text-base font-medium text-[#142d2b] dark:text-[#f0f6fc]">A fresh start</h3>
        <p className="text-xs text-[var(--muted)] dark:text-[#8ca197] mt-1">
          Repaid loans and cancelled offers will appear here.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="space-y-3">
        {paginatedEntries.map((entry, idx) => {
          const txUrl = getExplorerTxUrl(entry.txHash, activeChainId);

          return (
            <article
              key={`${entry.id}-${idx}`}
              className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 bg-[var(--surface)] border border-[var(--line)] hover:border-[var(--line-strong)] rounded-xl transition-colors"
            >
              <div className="flex items-center gap-3.5">
                <div className="w-11 h-11 rounded-lg bg-[var(--panel)] border border-[var(--line)] flex items-center justify-center shrink-0">
                  {entry.type === 'Loan' ? (
                    <svg className="w-5 h-5 text-[var(--accent-primary)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="4" y="4" width="16" height="16" rx="3" />
                      <path d="M12 7v10m-4-4 4 4 4-4" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5 text-[var(--accent-primary)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                      <path d="m4 15 4-4 4 3 8-9M14 5h6v6M4 20h16" />
                    </svg>
                  )}
                </div>

                <div>
                  <h3 className="text-sm font-semibold text-[var(--text)]">{entry.id}</h3>
                  <span
                    className={`inline-block text-[10px] px-2 py-0.5 mt-0.5 rounded-md font-medium ${
                      entry.status === 'repaid'
                        ? 'bg-[var(--panel)] text-[var(--accent-primary)] border border-[var(--line)]'
                        : entry.status === 'cancelled'
                        ? 'bg-[var(--panel)] text-[var(--muted)] border border-[var(--line)]'
                        : 'bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20'
                    }`}
                  >
                    {entry.type} · {entry.status}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-6 sm:gap-8 justify-between sm:justify-end">
                <div>
                  <small className="text-[10px] text-[var(--muted)] block uppercase font-mono">Role</small>
                  <strong className="text-xs font-mono font-medium text-[var(--text)]">
                    {entry.role}
                  </strong>
                </div>

                <div>
                  <small className="text-[10px] text-[var(--muted)] block uppercase font-mono">Principal</small>
                  <strong className="text-xs font-mono font-semibold text-[var(--text)]">
                    {entry.principalEth}
                  </strong>
                </div>

                <div>
                  <small className="text-[10px] text-[var(--muted)] block uppercase font-mono">Date</small>
                  <strong className="text-xs font-mono font-normal text-[var(--muted)]">
                    {formatDate(entry.date)}
                  </strong>
                </div>

                <a
                  href={txUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 rounded-lg border border-[var(--line)] bg-[var(--panel)] hover:bg-[var(--surface)] text-[var(--text)] text-xs font-medium transition-colors"
                >
                  Explorer ↗
                </a>
              </div>
            </article>
          );
        })}
      </div>

      <Pagination
        currentPage={page}
        totalPages={totalPages}
        totalItems={historyEntries.length}
        pageSize={HISTORY_PAGE_SIZE}
        itemName="history records"
        onPageChange={setPage}
      />
    </div>
  );
}
