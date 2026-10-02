'use client';

import React from 'react';
import Image from 'next/image';
import type { CuratedCollectionDefinition } from '@/config/collections';

export interface LendCollectionCardProps {
  collection: CuratedCollectionDefinition;
  poolSizeEth?: string;
  activeLoansCount?: number;
  onMakeOffer: (collection: CuratedCollectionDefinition) => void;
}

export function LendCollectionCard({
  collection,
  poolSizeEth,
  activeLoansCount,
  onMakeOffer,
}: LendCollectionCardProps) {
  const displayPool = poolSizeEth
    ? `${poolSizeEth} ETH`
    : collection.floorPriceEth
    ? `${(Number(collection.floorPriceEth) * 0.6).toFixed(2)} ETH`
    : '-';
  const activeCount = activeLoansCount !== undefined ? activeLoansCount : 0;

  return (
    <article className="flex flex-col bg-[var(--surface)] border border-[var(--line)] hover:border-[var(--line-strong)] hover:-translate-y-1 hover:shadow-md rounded-xl overflow-hidden transition-all duration-200">
      <div className="relative aspect-square w-full bg-[var(--panel)] overflow-hidden group">
        {collection.imageUrl ? (
          <Image
            src={collection.imageUrl}
            alt={collection.name}
            fill
            sizes="(max-width: 768px) 100vw, 25vw"
            className="object-cover group-hover:scale-105 transition-transform duration-300"
            unoptimized
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center font-mono font-bold text-lg text-[var(--accent-primary)]">
            {collection.symbol}
          </div>
        )}
      </div>

      <div className="p-4 flex flex-col flex-1 justify-between">
        <div>
          <div className="text-[10px] uppercase tracking-wider font-semibold text-[var(--accent-primary)]">
            Curated Market
          </div>
          <h3 className="text-sm font-semibold text-[var(--text)] mt-0.5 mb-3 truncate">
            {collection.name}
          </h3>

          <div className="space-y-2 text-xs pb-3 border-b border-[var(--line)]">
            <div className="flex items-center justify-between">
              <span className="text-[var(--muted)]">Pool size</span>
              <strong className="font-mono text-[var(--accent-primary)]">
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
          className="w-full mt-3 py-2 px-3 rounded-lg text-xs font-semibold bg-[var(--panel)] hover:bg-[var(--surface)] border border-[var(--line)] text-[var(--text)] transition-colors cursor-pointer flex items-center justify-center gap-1"
        >
          <span>Make offer</span>
          <span className="text-sm font-normal">+</span>
        </button>
      </div>
    </article>
  );
}
