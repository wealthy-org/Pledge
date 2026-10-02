'use client';

import React, { useMemo } from 'react';
import Link from 'next/link';
import { useSafeChainId } from '@/hooks/useSafeChainId';
import { getCuratedCollections } from '@/config/collections';
import { useCollections } from '@/hooks/api/useCollections';
import { MarketsTable, type MarketCollectionItem } from '@/components/markets/MarketsTable';

export default function CollectionsPage() {
  const chainId = useSafeChainId();
  const { data: apiData } = useCollections(chainId);

  const collections: MarketCollectionItem[] = useMemo(() => {
    return getCuratedCollections(chainId).map((col) => {
      const address = col.contractAddress;
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
  }, [apiData, chainId]);

  return (
    <div className="space-y-8">
      <div className="space-y-2 border-b border-[var(--line)] pb-4">
        <div className="text-[10px] uppercase font-semibold tracking-wider text-violet-600 dark:text-violet-400 flex items-center gap-2">
          <span className="w-5 h-[1px] bg-violet-600 dark:bg-violet-400 inline-block" />
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
              className="px-4 py-2 text-xs font-semibold rounded-lg bg-sky-600 hover:bg-sky-500 text-white transition-colors shadow-xs"
            >
              Borrow Against NFT
            </Link>
            <Link
              href="/lend"
              className="px-4 py-2 text-xs font-semibold rounded-lg bg-emerald-500/10 hover:bg-emerald-500 hover:text-white dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 transition-colors shadow-xs"
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
