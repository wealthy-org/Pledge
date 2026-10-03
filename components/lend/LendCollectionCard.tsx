'use client';

import React from 'react';
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
  activeLoansCount?: number;
  imageUrl?: string;
  onMakeOffer: (collection: CuratedCollectionDefinition | ActiveCuratedCollection | GenericCollectionItem) => void;
}

export function LendCollectionCard({
  collection,
  poolSizeEth,
  activeLoansCount,
  imageUrl,
  onMakeOffer,
}: LendCollectionCardProps) {
  const contractAddr =
    collection.contractAddress ||
    (collection as any).address ||
    (collection as any).id ||
    '';
  const displayPool = poolSizeEth ? `${poolSizeEth} ETH` : '—';
  const activeCount = activeLoansCount !== undefined ? activeLoansCount : 0;

  return (
    <article className="flex flex-col bg-[var(--surface)] border border-[var(--line)] hover:border-[var(--line-strong)] hover:-translate-y-1 hover:shadow-md rounded-xl overflow-hidden transition-all duration-200">
      <div className="relative aspect-square w-full bg-[var(--panel)] overflow-hidden group flex items-center justify-center">
        <NftImage
          src={imageUrl}
          alt={collection.name}
          contractAddress={contractAddr}
          tokenId="0"
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
      </div>

      <div className="p-4 flex flex-col flex-1 justify-between">
        <div>
          <div className="text-[10px] uppercase tracking-wider font-semibold text-violet-600 dark:text-violet-400">
            Open Market
          </div>
          <h3 className="text-sm font-semibold text-[var(--text)] mt-0.5 mb-3 truncate">
            {collection.name}
          </h3>

          <div className="space-y-2 text-xs pb-3 border-b border-[var(--line)]">
            <div className="flex items-center justify-between">
              <span className="text-[var(--muted)]">Pool size</span>
              <strong className="font-mono text-emerald-600 dark:text-emerald-400">
                {displayPool}
              </strong>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[var(--muted)]">Open offers</span>
              <span className="font-mono text-[var(--text)]">{activeCount}</span>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={() => onMakeOffer(collection)}
          className="w-full mt-3 py-2 px-3 rounded-lg text-xs font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500 hover:text-white dark:hover:bg-emerald-500 dark:hover:text-white border border-emerald-500/25 transition-colors cursor-pointer flex items-center justify-center gap-1 shadow-xs"
        >
          <span>Make offer</span>
          <span className="text-sm font-normal">+</span>
        </button>
      </div>
    </article>
  );
}
