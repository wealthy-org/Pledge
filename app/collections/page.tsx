'use client';

import React, { useMemo } from 'react';
import Link from 'next/link';
import { CURATED_COLLECTIONS } from '@/config/collections';
import { useCollections } from '@/hooks/api/useCollections';
import { MarketsTable, type MarketCollectionItem } from '@/components/markets/MarketsTable';

export default function CollectionsPage() {
  const { data: apiData } = useCollections();

  const collections: MarketCollectionItem[] = useMemo(() => {
    return CURATED_COLLECTIONS.map((col) => {
      const address = col.addresses[46630];
      const remote = apiData?.collections?.find(
        (c) => c.address.toLowerCase() === address.toLowerCase()
      );

      return {
        address,
        name: col.name,
        symbol: col.symbol,
        imageUrl: col.imageUrl,
        floorPriceEth: col.floorPriceEth,
        bestOfferWei: remote?.bestOfferWei || undefined,
        poolSizeWei: remote?.poolSizeWei || '0',
        offerCount: remote?.offerCount || 0,
        activeLoansCount: remote?.activeLoansCount || 0,
        maxLtvBps: col.maxLtvBps,
      };
    });
  }, [apiData]);

  return (
    <div className="space-y-8">
      <div className="space-y-2 border-b border-[var(--line)] pb-4">
        <div className="text-[10px] uppercase font-semibold tracking-wider text-[var(--accent-primary)] flex items-center gap-2">
          <span className="w-5 h-[1px] bg-[var(--accent-primary)] inline-block" />
          <span>Curated Market Directory</span>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl sm:text-4xl font-normal tracking-[-1.5px] text-[#142d2b] dark:text-[#f0fdf4]">
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
              className="px-4 py-2 text-xs font-semibold rounded-lg bg-[#edf7f2] dark:bg-[#142e24] hover:bg-[#e1f1e9] dark:hover:bg-[#1a3d30] border border-[#cfe4dc] dark:border-[#1e4537] text-[#142d2b] dark:text-[#f0fdf4] transition-colors"
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
