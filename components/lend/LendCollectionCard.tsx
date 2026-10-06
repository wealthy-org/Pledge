'use client';

import React from 'react';
import Link from 'next/link';
import { NftImage } from '@/components/nft/NftImage';
import type { CuratedCollectionDefinition, ActiveCuratedCollection } from '@/config/collections';

export interface GenericCollectionItem {
  id?: string;
  name: string;
  symbol: string;
  contractAddress?: string;
  address?: string;
  addresses?: Record<number, `0x${string}`>;
}

export interface LendCollectionCardProps {
  collection: CuratedCollectionDefinition | ActiveCuratedCollection | GenericCollectionItem;
  poolSizeEth?: string;
  floorPriceEth?: string;
  activeLoansCount?: number;
  imageUrl?: string;
  onMakeOffer: (collection: CuratedCollectionDefinition | ActiveCuratedCollection | GenericCollectionItem) => void;
}

export function LendCollectionCard({
  collection,
  poolSizeEth,
  floorPriceEth,
  activeLoansCount,
  imageUrl,
  onMakeOffer,
}: LendCollectionCardProps) {
  const contractAddr =
    collection?.contractAddress ||
    (collection as any)?.address ||
    (collection as any)?.id ||
    '';
  const displayPool = poolSizeEth && poolSizeEth !== '0.00' ? `${poolSizeEth} ETH` : '—';
  const activeCount = activeLoansCount !== undefined ? activeLoansCount : 0;

  return (
    <article className="flex flex-col bg-[var(--surface)] border border-[var(--line)] hover:border-[var(--line-strong)] hover:-translate-y-1 hover:shadow-md rounded-xl overflow-hidden transition-all duration-200 group">
      <Link
        href={contractAddr ? `/collection/${contractAddr}` : '#'}
        className="block flex-1 flex flex-col cursor-pointer"
      >
        <div className="relative aspect-square w-full bg-[var(--panel)] overflow-hidden flex items-center justify-center">
          <NftImage
            src={imageUrl}
            alt={collection?.name || 'Collection'}
            contractAddress={contractAddr}
            tokenId=""
            symbol={collection?.symbol || collection?.name || ''}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        </div>

        <div className="p-3 sm:p-4 flex flex-col flex-1 justify-between">
          <div>
            <div className="text-[10px] uppercase tracking-wider font-semibold text-violet-600 dark:text-violet-400">
              Open Market
            </div>
            <h3 className="text-xs sm:text-sm font-semibold text-[var(--text)] group-hover:text-[var(--primary)] mt-0.5 mb-2 sm:mb-3 truncate">
              {collection?.name || 'Unknown Collection'}
            </h3>

            <div className="space-y-1.5 sm:space-y-2 text-[11px] sm:text-xs pb-2 sm:pb-3 border-b border-[var(--line)]">
              <div className="flex items-center justify-between">
                <span className="text-[var(--muted)]">Pool size</span>
                <strong className="font-mono text-emerald-600 dark:text-emerald-400">
                  {displayPool}
                </strong>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[var(--muted)]">{floorPriceEth ? 'Floor price' : 'Open offers'}</span>
                <span className="font-mono text-[var(--text)]">
                  {floorPriceEth ? `${floorPriceEth} ETH` : activeCount}
                </span>
              </div>
            </div>
          </div>
        </div>
      </Link>

      <div className="px-3 pb-3 sm:px-4 sm:pb-4 flex flex-col sm:flex-row items-stretch gap-1.5 sm:gap-2">
        {contractAddr ? (
          <Link
            href={`/collection/${contractAddr}`}
            className="w-full sm:flex-1 py-1.5 sm:py-2 px-2 rounded-lg text-[11px] sm:text-xs font-semibold bg-[var(--panel)] text-[var(--text)] hover:bg-[var(--raised)] border border-[var(--line)] transition-colors text-center truncate flex items-center justify-center gap-1"
          >
            <span>Details</span>
            <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M7 17L17 7M17 7H7M17 7V17" />
            </svg>
          </Link>
        ) : null}
        <button
          type="button"
          aria-label="Make Offer"
          onClick={() => onMakeOffer(collection)}
          className="w-full sm:flex-1 py-1.5 sm:py-2 px-2 rounded-lg text-[11px] sm:text-xs font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500 hover:text-white dark:hover:bg-emerald-500 dark:hover:text-white border border-emerald-500/25 transition-colors cursor-pointer flex items-center justify-center gap-1 shadow-xs"
        >
          <span>Offer</span>
          <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 5v14M5 12h14" />
          </svg>
        </button>
      </div>
    </article>
  );
}
