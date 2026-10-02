'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { formatUnits } from 'viem';
import { getCollectionByAddress } from '@/config/collections';
import type { OfferItem } from '@/types/api';

export interface OffersTabProps {
  offers: OfferItem[];
  userAddress?: string;
  onCancelOffer: (offer: OfferItem) => void;
}

export function OffersTab({
  offers,
  userAddress,
  onCancelOffer,
}: OffersTabProps) {
  const normalizedUser = userAddress?.toLowerCase();

  const userOpenOffers = offers.filter((offer) => {
    if (!normalizedUser) return false;
    const isLender = offer.lender.toLowerCase() === normalizedUser;
    return isLender && offer.status === 'open';
  });

  if (userOpenOffers.length === 0) {
    return (
      <div className="py-16 px-6 border border-dashed border-[#e1e8e9] rounded-xl text-center">
        <div className="text-3xl text-[var(--lime)] mb-2 font-mono">◈</div>
        <h3 className="text-base font-medium text-[#142d2b]">Make your first offer.</h3>
        <p className="text-xs text-[var(--muted)] mt-1 mb-4">
          Choose a curated collection and deploy liquidity to earn fixed interest.
        </p>
        <Link
          href="/lend"
          className="inline-flex items-center gap-1 px-4 py-2 rounded-lg bg-[#edf7f2] hover:bg-[#e1f1e9] border border-[#cfe4dc] text-[#142d2b] text-xs font-semibold transition-colors"
        >
          <span>Explore collections</span>
          <span>↗</span>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-3.5">
      {userOpenOffers.map((offer) => {
        const principalEth = `${Number(formatUnits(BigInt(offer.principalWei), 18)).toFixed(2)} ETH`;
        const days = Math.round(offer.durationSeconds / 86400);
        const termPercent = (offer.termInterestBps / 100).toFixed(1);
        const colDef = getCollectionByAddress(offer.collection, 46630);
        const collectionName = colDef?.name || 'Curated Collection';

        return (
          <article
            key={offer.offerId}
            className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 bg-white border border-[#dee7e3] hover:border-[#b7d4c9] rounded-xl transition-all"
          >
            <div className="flex items-center gap-3.5">
              <div className="w-14 h-14 rounded-lg bg-[#f4f7f5] border border-[#dee7e3] overflow-hidden flex items-center justify-center shrink-0">
                {colDef?.imageUrl ? (
                  <Image
                    src={colDef.imageUrl}
                    alt={collectionName}
                    width={56}
                    height={56}
                    className="w-full h-full object-cover"
                    unoptimized
                  />
                ) : (
                  <span className="font-mono font-bold text-xs text-[#214e3b]">
                    {colDef?.symbol || 'NFT'}
                  </span>
                )}
              </div>

              <div>
                <h3 className="text-sm font-semibold text-[#142d2b]">
                  {collectionName}
                </h3>
                <span className="inline-block text-[9px] px-2 py-0.5 mt-1 rounded bg-[#edf8f1] text-[var(--lime)] font-medium">
                  Offer · open
                </span>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-6 sm:gap-8 justify-between sm:justify-end">
              <div>
                <small className="text-[9px] text-[var(--muted)] block">Principal</small>
                <strong className="text-xs font-mono font-semibold text-[#142d2b]">
                  {principalEth}
                </strong>
              </div>

              <div>
                <small className="text-[9px] text-[var(--muted)] block">Term interest</small>
                <strong className="text-xs font-mono font-semibold text-[#184b3b]">
                  {termPercent}%
                </strong>
              </div>

              <div>
                <small className="text-[9px] text-[var(--muted)] block">Duration</small>
                <strong className="text-xs font-mono font-normal text-[var(--muted)]">
                  {days} days
                </strong>
              </div>

              <button
                onClick={() => onCancelOffer(offer)}
                className="px-4 py-2 rounded-lg bg-white hover:bg-[#fff9eb] border border-[#e1e8e9] text-[#775d26] text-xs font-semibold transition-colors cursor-pointer shadow-xs"
              >
                Cancel offer
              </button>
            </div>
          </article>
        );
      })}
    </div>
  );
}
