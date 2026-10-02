'use client';

import React, { useMemo } from 'react';
import Link from 'next/link';
import { CURATED_COLLECTIONS } from '@/config/collections';
import { getMockCollectionStats } from '@/lib/mock/fixtures';
import { MarketsTable, type MarketCollectionItem } from '@/components/markets/MarketsTable';

export default function CollectionsPage() {
  const collections: MarketCollectionItem[] = useMemo(() => {
    return CURATED_COLLECTIONS.map((col) => {
      const colStats = getMockCollectionStats(col.addresses[46630]);
      return {
        address: col.addresses[46630],
        name: col.name,
        symbol: col.symbol,
        imageUrl: col.imageUrl,
        floorPriceEth: col.floorPriceEth,
        bestOfferWei: colStats.bestOfferWei || undefined,
        poolSizeWei: colStats.poolSizeWei,
        offerCount: colStats.offerCount,
        activeLoansCount: colStats.activeLoansCount,
        maxLtvBps: col.maxLtvBps,
      };
    });
  }, []);

  return (
    <div className="space-y-8 animate-in fade-in duration-150">
      <div className="space-y-2 border-b border-[#e6ece9] pb-4">
        <div className="text-[10px] uppercase font-semibold tracking-[2px] text-[#377994] flex items-center gap-2">
          <span className="w-5 h-[1px] bg-[#4d93be] inline-block" />
          <span>Curated Market Directory</span>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl sm:text-4xl font-normal tracking-[-1.5px] text-[#142d2b]">
              Curated NFT Collections
            </h1>
            <p className="text-xs sm:text-sm text-[var(--muted)] mt-1">
              Explore whitelisted NFT collections with active lending pools and fixed-rate collateral terms.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <Link
              href="/borrow"
              className="px-4 py-2 text-xs font-semibold rounded-lg bg-[var(--lime)] hover:bg-[#076b4d] text-white transition-colors shadow-xs"
            >
              Borrow Against NFT
            </Link>
            <Link
              href="/lend"
              className="px-4 py-2 text-xs font-semibold rounded-lg bg-[#edf7f2] hover:bg-[#e1f1e9] border border-[#cfe4dc] text-[#142d2b] transition-colors"
            >
              Create Offer +
            </Link>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <MarketsTable collections={collections} />
      </div>
    </div>
  );
}
