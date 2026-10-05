'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { formatUnits } from 'viem';
import { useSafeChainId } from '@/hooks/useSafeChainId';
import { getCollectionByAddress } from '@/config/collections';
import { resolveCollectionImageUrl } from '@/lib/services/metadata';
import { Skeleton } from '@/components/ui/Skeleton';
import { Pagination } from '@/components/ui/Pagination';
import type { OfferItem } from '@/types/api';

const OFFERS_PAGE_SIZE = 5;

export interface OffersTabProps {
  offers: OfferItem[];
  userAddress?: string;
  onCancelOffer?: (offer: OfferItem) => void;
  chainId?: number;
  isLoading?: boolean;
}

export function OffersTab({
  offers,
  userAddress,
  onCancelOffer,
  chainId: propChainId,
  isLoading = false,
}: OffersTabProps) {
  const hookChainId = useSafeChainId();
  const chainId = propChainId || hookChainId;
  const normalizedUser = userAddress?.toLowerCase();
  const [page, setPage] = useState(1);

  const userOpenOffers = useMemo(() => {
    return offers.filter((offer) => {
      if (!normalizedUser) return false;
      const isLender = offer.lender.toLowerCase() === normalizedUser;
      return isLender && offer.status === 'open';
    });
  }, [offers, normalizedUser]);

  const totalPages = Math.ceil(userOpenOffers.length / OFFERS_PAGE_SIZE);
  const paginatedOffers = useMemo(() => {
    return userOpenOffers.slice((page - 1) * OFFERS_PAGE_SIZE, page * OFFERS_PAGE_SIZE);
  }, [userOpenOffers, page]);

  if (isLoading) {
    return (
      <div className="space-y-3.5">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            data-testid="offers-skeleton-card"
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

  if (userOpenOffers.length === 0) {
    return (
      <div className="py-16 px-6 border border-dashed border-[#e1ebe6] dark:border-[#1e332c] rounded-xl text-center bg-white dark:bg-[#111a17]">
        <div className="text-3xl text-[var(--lime)] dark:text-emerald-400 mb-2 font-mono">◈</div>
        <h3 className="text-base font-medium text-[#142d2b] dark:text-[#f0f6fc]">Make your first offer.</h3>
        <p className="text-xs text-[var(--muted)] dark:text-[#8ca197] mt-1 mb-4">
          Choose a curated collection and deploy liquidity to earn fixed interest.
        </p>
        <Link
          href="/lend"
          className="inline-flex items-center gap-1 px-4 py-2 rounded-lg bg-[#edf7f2] dark:bg-[#142e24] hover:bg-[#e1f1e9] dark:hover:bg-[#1a3d30] border border-[#cfe4dc] dark:border-[#1e4537] text-[#142d2b] dark:text-[#f0f6fc] text-xs font-semibold transition-colors"
        >
          <span>Explore collections</span>
          <span>↗</span>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="space-y-3.5">
        {paginatedOffers.map((offer) => {
          const principalEth = `${Number(formatUnits(BigInt(offer.principalWei), 18)).toFixed(2)} ETH`;
          const days = Math.round(offer.durationSeconds / 86400);
          const termPercent = (offer.termInterestBps / 100).toFixed(1);
          const colDef = getCollectionByAddress(offer.collection, chainId);
          const collectionName = colDef?.name || 'Curated Collection';
          const displayImage = colDef ? resolveCollectionImageUrl(colDef.name) : undefined;

          return (
            <article
              key={offer.offerId}
              className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 bg-white dark:bg-[#111a17] border border-[#dee7e3] dark:border-[#1e332c] hover:border-[#b7d4c9] dark:hover:border-emerald-500/40 rounded-xl transition-all"
            >
              <div className="flex items-center gap-3.5">
                <div className="w-14 h-14 rounded-lg bg-[#f4f7f5] dark:bg-[#14221e] border border-[#dee7e3] dark:border-[#1e332c] overflow-hidden flex items-center justify-center shrink-0">
                  {displayImage ? (
                    <Image
                      src={displayImage}
                      alt={collectionName}
                      width={56}
                      height={56}
                      className="w-full h-full object-cover"
                      unoptimized
                    />
                  ) : (
                    <span className="font-mono font-bold text-xs text-[#214e3b] dark:text-emerald-400">
                      {colDef?.symbol || 'NFT'}
                    </span>
                  )}
                </div>

                <div>
                  <h3 className="text-sm font-semibold text-[#142d2b] dark:text-[#f0f6fc]">
                    {collectionName}
                  </h3>
                  <span className="inline-block text-[9px] px-2 py-0.5 mt-1 rounded bg-[#edf8f1] dark:bg-[#142e24] text-[var(--lime)] dark:text-emerald-400 font-medium">
                    Offer · open
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
                  <small className="text-[9px] text-[var(--muted)] dark:text-[#8ca197] block">Term interest</small>
                  <strong className="text-xs font-mono font-semibold text-[#184b3b] dark:text-emerald-400">
                    {termPercent}%
                  </strong>
                </div>

                <div>
                  <small className="text-[9px] text-[var(--muted)] dark:text-[#8ca197] block">Duration</small>
                  <strong className="text-xs font-mono font-normal text-[var(--muted)] dark:text-[#8ca197]">
                    {days} days
                  </strong>
                </div>

                {onCancelOffer && (
                  <button
                    onClick={() => onCancelOffer(offer)}
                    className="px-4 py-2 rounded-lg bg-white dark:bg-[#14221e] hover:bg-[#fff9eb] dark:hover:bg-[#2d2618] border border-[#e1e8e9] dark:border-[#4d3d1e] text-[#775d26] dark:text-[#e0b86a] text-xs font-semibold transition-colors cursor-pointer shadow-xs"
                  >
                    Cancel offer
                  </button>
                )}
              </div>
            </article>
          );
        })}
      </div>

      <Pagination
        currentPage={page}
        totalPages={totalPages}
        totalItems={userOpenOffers.length}
        pageSize={OFFERS_PAGE_SIZE}
        itemName="offers"
        onPageChange={setPage}
      />
    </div>
  );
}
