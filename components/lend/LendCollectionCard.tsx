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
  const displayPool = poolSizeEth ? `${poolSizeEth} ETH` : `${collection.floorPriceEth ? (Number(collection.floorPriceEth) * 0.6).toFixed(2) : '0.80'} ETH`;
  const activeCount = activeLoansCount !== undefined ? activeLoansCount : 12;

  return (
    <article className="flex flex-col bg-white border border-[#dee7e3] hover:border-[#b7d4c9] hover:shadow-[0_8px_24px_rgba(33,77,57,0.06)] rounded-xl overflow-hidden transition-all duration-200">
      <div className="relative aspect-square w-full bg-[#f4f7f5] overflow-hidden group">
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
          <div className="w-full h-full flex items-center justify-center font-mono font-bold text-lg text-[#214e3b]">
            {collection.symbol}
          </div>
        )}
      </div>

      <div className="p-4 flex flex-col flex-1 justify-between">
        <div>
          <div className="text-[9px] uppercase tracking-[1.5px] font-semibold text-[#326f95]">
            CURATED MARKET
          </div>
          <h3 className="text-sm font-semibold text-[#142d2b] mt-0.5 mb-3 truncate">
            {collection.name}
          </h3>

          <div className="space-y-2 text-[11px] pb-3 border-b border-[#e8eded]">
            <div className="flex items-center justify-between">
              <span className="text-[#627478]">Pool size</span>
              <strong className="font-mono text-[#184b3b]">
                {displayPool}
              </strong>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[#627478]">Open offers</span>
              <span className="font-mono text-[#142d2b]">{activeCount}</span>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={() => onMakeOffer(collection)}
          className="w-full mt-3 py-2.5 px-3 rounded-lg text-xs font-semibold bg-[#edf7f2] hover:bg-[#e1f1e9] border border-[#cfe4dc] text-[#142d2b] transition-all cursor-pointer flex items-center justify-center gap-1"
        >
          <span>Make offer</span>
          <span className="text-sm font-normal">+</span>
        </button>
      </div>
    </article>
  );
}
