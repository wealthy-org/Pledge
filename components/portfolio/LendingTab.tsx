'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { formatUnits } from 'viem';
import { useSafeChainId } from '@/hooks/useSafeChainId';
import { useCollections } from '@/hooks/api/useCollections';
import { resolveCollectionImageUrl } from '@/lib/services/metadata';
import { Skeleton } from '@/components/ui/Skeleton';
import { Pagination } from '@/components/ui/Pagination';
import type { LoanItem } from '@/types/api';

const LENDING_PAGE_SIZE = 5;

export interface LendingTabProps {
  loans: LoanItem[];
  userAddress?: string;
  onForeclose?: (loan: LoanItem) => void;
  chainId?: number;
  isLoading?: boolean;
}

export function LendingTab({
  loans,
  userAddress,
  onForeclose,
  chainId: propChainId,
  isLoading = false,
}: LendingTabProps) {
  const hookChainId = useSafeChainId();
  const chainId = propChainId || hookChainId;
  const { data: collectionsData } = useCollections(chainId);
  const normalizedUser = userAddress?.toLowerCase();
  const [page, setPage] = useState(1);

  const userLendingLoans = useMemo(() => {
    return loans.filter((loan) => {
      if (!normalizedUser) return false;
      const isLender = loan.lender.toLowerCase() === normalizedUser;
      return isLender && loan.status === 'active';
    });
  }, [loans, normalizedUser]);

  const totalPages = Math.ceil(userLendingLoans.length / LENDING_PAGE_SIZE);
  const paginatedLoans = useMemo(() => {
    return userLendingLoans.slice((page - 1) * LENDING_PAGE_SIZE, page * LENDING_PAGE_SIZE);
  }, [userLendingLoans, page]);

  const formatDate = (isoString: string) => {
    try {
      const d = new Date(isoString);
      return d.toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
      });
    } catch {
      return isoString;
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-3.5">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            data-testid="lending-skeleton-card"
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
              <div className="space-y-1">
                <Skeleton width="50px" height="10px" />
                <Skeleton width="60px" height="14px" />
              </div>
              <Skeleton width="70px" height="32px" borderRadius="8px" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (userLendingLoans.length === 0) {
    return (
      <div className="py-16 px-6 border border-dashed border-[#e1ebe6] dark:border-[#1e332c] rounded-xl text-center bg-white dark:bg-[#111a17]">
        <div className="text-3xl text-[var(--lime)] dark:text-emerald-400 mb-2 font-mono">◈</div>
        <h3 className="text-base font-medium text-[#142d2b] dark:text-[#f0f6fc]">No active lending positions.</h3>
        <p className="text-xs text-[var(--muted)] dark:text-[#8ca197] mt-1 mb-4">
          Fund loans on curated NFT collections to earn predictable fixed yield.
        </p>
        <Link
          href="/lend"
          className="inline-flex items-center gap-1 px-4 py-2 rounded-lg bg-[#edf7f2] dark:bg-[#142e24] hover:bg-[#e1f1e9] dark:hover:bg-[#1a3d30] border border-[#cfe4dc] dark:border-[#1e4537] text-[#142d2b] dark:text-[#f0f6fc] text-xs font-semibold transition-colors"
        >
          <span>Discover loan requests</span>
          <span>↗</span>
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
          const interestEth = `${Number(formatUnits(BigInt(loan.interestWei || '0'), 18)).toFixed(3)} ETH`;
          const isPastDue = new Date(loan.dueAt).getTime() < new Date().getTime();
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
                  <span className="inline-block text-[9px] px-2 py-0.5 mt-1 rounded bg-[#e8f2fd] dark:bg-[#142838] text-[#276fa6] dark:text-[#58a6ff] font-medium">
                    Lending · {loan.status}
                  </span>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-6 sm:gap-8 justify-between sm:justify-end">
                <div>
                  <small className="text-[9px] text-[var(--muted)] dark:text-[#8ca197] block">Principal Lent</small>
                  <strong className="text-xs font-mono font-semibold text-[#142d2b] dark:text-[#f0f6fc]">
                    {principalEth}
                  </strong>
                </div>

                <div>
                  <small className="text-[9px] text-[var(--muted)] dark:text-[#8ca197] block">Interest Earned</small>
                  <strong className="text-xs font-mono font-semibold text-[#184b3b] dark:text-emerald-400">
                    +{interestEth}
                  </strong>
                </div>

                <div>
                  <small className="text-[9px] text-[var(--muted)] dark:text-[#8ca197] block">Due date</small>
                  <strong className="text-xs font-mono font-normal text-[var(--muted)] dark:text-[#8ca197]">
                    {formatDate(loan.dueAt)}
                  </strong>
                </div>

                {isPastDue && onForeclose ? (
                  <button
                    onClick={() => onForeclose(loan)}
                    className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-semibold transition-colors cursor-pointer shadow-xs"
                  >
                    Foreclose ↗
                  </button>
                ) : (
                  <Link
                    href={`/loan/${loan.loanId}`}
                    className="px-4 py-2 rounded-lg bg-white dark:bg-[#14221e] hover:bg-[#eef5fb] dark:hover:bg-[#1b302a] border border-[#e1e8e9] dark:border-[#1e332c] text-[#286a9b] dark:text-emerald-400 text-xs font-semibold transition-colors shadow-xs"
                  >
                    Details ↗
                  </Link>
                )}
              </div>
            </article>
          );
        })}
      </div>

      <Pagination
        currentPage={page}
        totalPages={totalPages}
        totalItems={userLendingLoans.length}
        pageSize={LENDING_PAGE_SIZE}
        itemName="lent loans"
        onPageChange={setPage}
      />
    </div>
  );
}
