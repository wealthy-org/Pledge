'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { formatUnits } from 'viem';
import { useSafeChainId } from '@/hooks/useSafeChainId';
import { useCollections } from '@/hooks/api/useCollections';
import { resolveCollectionImageUrl } from '@/lib/services/metadata';
import { CountdownTimer } from '@/components/common/CountdownTimer';
import { LTVHealthBar } from '@/components/common/LTVHealthBar';
import { Skeleton } from '@/components/ui/Skeleton';
import { Pagination } from '@/components/ui/Pagination';
import type { LoanItem } from '@/types/api';

const BORROWING_PAGE_SIZE = 5;

export interface BorrowingTabProps {
  loans: LoanItem[];
  userAddress?: string;
  onRepay?: (loan: LoanItem) => void;
  isLoading?: boolean;
  chainId?: number;
}

export function BorrowingTab({
  loans,
  userAddress,
  onRepay,
  isLoading = false,
  chainId: propChainId,
}: BorrowingTabProps) {
  const router = useRouter();
  const hookChainId = useSafeChainId();
  const chainId = propChainId || hookChainId;
  const { data: collectionsData } = useCollections(chainId);
  const normalizedUser = userAddress?.toLowerCase();
  const [page, setPage] = useState(1);

  const userBorrowingLoans = useMemo(() => {
    return loans.filter((loan) => {
      if (!normalizedUser) return false;
      const isBorrower = loan.borrower.toLowerCase() === normalizedUser;
      return isBorrower && loan.status === 'active';
    });
  }, [loans, normalizedUser]);

  const totalPages = Math.ceil(userBorrowingLoans.length / BORROWING_PAGE_SIZE);
  const paginatedLoans = useMemo(() => {
    return userBorrowingLoans.slice((page - 1) * BORROWING_PAGE_SIZE, page * BORROWING_PAGE_SIZE);
  }, [userBorrowingLoans, page]);

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

  const calculateTotalDue = (principalWei: string, interestWei: string) => {
    const total = BigInt(principalWei) + BigInt(interestWei || '0');
    return `${Number(formatUnits(total, 18)).toFixed(2)} ETH`;
  };

  if (isLoading) {
    return (
      <div className="space-y-3.5">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            data-testid="borrowing-skeleton-card"
            className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 bg-white dark:bg-[#111a17] border border-[#dee7e3] dark:border-[#1e332c] rounded-xl"
          >
            <div className="flex items-center gap-3.5">
              <Skeleton width="56px" height="56px" borderRadius="8px" />
              <div className="space-y-2">
                <Skeleton width="140px" height="16px" />
                <Skeleton width="80px" height="12px" />
              </div>
            </div>
            <div className="flex items-center gap-6 sm:gap-8">
              <div className="space-y-1">
                <Skeleton width="50px" height="10px" />
                <Skeleton width="60px" height="14px" />
              </div>
              <div className="space-y-1">
                <Skeleton width="50px" height="10px" />
                <Skeleton width="60px" height="14px" />
              </div>
              <div className="w-24 space-y-1">
                <Skeleton width="100%" height="10px" />
                <Skeleton width="100%" height="8px" />
              </div>
              <Skeleton width="70px" height="32px" borderRadius="8px" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (userBorrowingLoans.length === 0) {
    return (
      <div className="py-16 px-6 border border-dashed border-[#e1ebe6] dark:border-[#1e332c] rounded-xl text-center bg-white dark:bg-[#111a17]">
        <div className="w-8 h-8 mx-auto mb-2 text-[var(--lime)] dark:text-emerald-400 flex items-center justify-center">
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 2l8 10-8 10-8-10 8-10z" />
          </svg>
        </div>
        <h3 className="text-base font-medium text-[#142d2b] dark:text-[#f0f6fc]">Your next move starts here.</h3>
        <p className="text-xs text-[var(--muted)] dark:text-[#8ca197] mt-1 mb-4">
          Borrow against a verified NFT to see your active loan positions here.
        </p>
        <Link
          href="/borrow"
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#edf7f2] dark:bg-[#142e24] hover:bg-[#e1f1e9] dark:hover:bg-[#1a3d30] border border-[#cfe4dc] dark:border-[#1e4537] text-[#142d2b] dark:text-[#f0f6fc] text-xs font-semibold transition-colors"
        >
          <span>Explore your NFTs</span>
          <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M7 17L17 7M17 7H7M17 7V17" />
          </svg>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="space-y-3.5">
        {paginatedLoans.map((loan) => {
          const col = collectionsData?.collections?.find(
            (c) => c.address.toLowerCase() === loan.collection.toLowerCase()
          );
          const principalEth = `${Number(formatUnits(BigInt(loan.principalWei), 18)).toFixed(2)} ETH`;
          const totalDueEth = calculateTotalDue(loan.principalWei, loan.interestWei);
          const tokenId = loan.tokenId || (loan as unknown as { nftId?: string }).nftId || '0';
          const displayImage = col ? (col.imageUrl || resolveCollectionImageUrl(col.name)) : undefined;

          return (
            <article
              key={loan.loanId}
              className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 bg-white dark:bg-[#111a17] border border-[#dee7e3] dark:border-[#1e332c] hover:border-[#b7d4c9] dark:hover:border-emerald-500/40 rounded-xl transition-all"
            >
              <div className="flex items-center gap-3.5">
                <div className="w-14 h-14 rounded-lg bg-[#f4f7f5] dark:bg-[#14221e] border border-[#dee7e3] dark:border-[#1e332c] overflow-hidden flex items-center justify-center shrink-0">
                  {displayImage ? (
                    <Image
                      src={displayImage}
                      alt={col?.name || 'NFT'}
                      width={56}
                      height={56}
                      className="w-full h-full object-cover"
                      unoptimized
                    />
                  ) : (
                    <span className="font-mono font-bold text-xs text-[#214e3b] dark:text-emerald-400">
                      #{tokenId}
                    </span>
                  )}
                </div>

                <div>
                  <h3 className="text-sm font-semibold text-[#142d2b] dark:text-[#f0f6fc]">
                    {col?.name || 'Curated NFT'} <span>#{tokenId}</span>
                  </h3>
                  <span className="inline-block text-[9px] px-2 py-0.5 mt-1 rounded bg-[#e5f4ec] dark:bg-[#142e24] text-[var(--lime)] dark:text-emerald-400 font-medium">
                    Loan · {loan.status}
                  </span>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-6 sm:gap-8 justify-between sm:justify-end">
                <div>
                  <small className="text-[9px] text-[var(--muted)] dark:text-[#8ca197] block">Principal</small>
                  <strong className="text-xs font-mono font-semibold text-[#142d2b] dark:text-[#f0f6fc]">
                    {principalEth}
                  </strong>
                </div>

                <div>
                  <small className="text-[9px] text-[var(--muted)] dark:text-[#8ca197] block">Repayment</small>
                  <strong className="text-xs font-mono font-semibold text-[#184b3b] dark:text-emerald-400">
                    {totalDueEth}
                  </strong>
                </div>

                <div>
                  <small className="text-[9px] text-[var(--muted)] dark:text-[#8ca197] block">Time Remaining</small>
                  <div className="mt-0.5">
                    <CountdownTimer dueAt={loan.dueAt} />
                  </div>
                </div>

                <div className="w-24">
                  <LTVHealthBar
                    principalEth={Number(formatUnits(BigInt(loan.principalWei), 18))}
                  />
                </div>

                <div>
                  <small className="text-[9px] text-[var(--muted)] dark:text-[#8ca197] block">Due date</small>
                  <strong className="text-xs font-mono font-normal text-[var(--muted)] dark:text-[#8ca197]">
                    {formatDate(loan.dueAt)}
                  </strong>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    if (onRepay) {
                      onRepay(loan);
                    } else {
                      router.push(`/loan/${loan.loanId}`);
                    }
                  }}
                  className="px-4 py-2 rounded-lg bg-[var(--lime)] hover:bg-[#076b4d] text-white text-xs font-semibold transition-colors cursor-pointer shadow-xs"
                >
                  Repay
                </button>
              </div>
            </article>
          );
        })}
      </div>

      <Pagination
        currentPage={page}
        totalPages={totalPages}
        totalItems={userBorrowingLoans.length}
        pageSize={BORROWING_PAGE_SIZE}
        itemName="borrowed loans"
        onPageChange={setPage}
      />
    </div>
  );
}
