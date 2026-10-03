'use client';

import React, { useMemo } from 'react';
import Link from 'next/link';
import { useSafeChainId } from '@/hooks/useSafeChainId';
import { useCollections } from '@/hooks/api/useCollections';
import { MarketsTable, type MarketCollectionItem } from '@/components/markets/MarketsTable';
import { resolveCollectionImageUrl } from '@/lib/services/metadata';
import { Button } from '@/components/ui/Button';

export default function CollectionsPage() {
  const chainId = useSafeChainId();
  const { data: apiData, isLoading, isError, error, refetch } = useCollections(chainId);

  const collections: MarketCollectionItem[] = useMemo(() => {
    if (!apiData?.collections) return [];
    return apiData.collections.map((item) => ({
      address: item.address,
      name: item.name,
      symbol: item.symbol,
      imageUrl: item.imageUrl || resolveCollectionImageUrl(item.name),
      bestOfferWei: item.bestOfferWei || undefined,
      poolSizeWei: item.poolSizeWei || '0',
      offerCount: item.offerCount || 0,
      activeLoansCount: item.activeLoansCount || 0,
    }));
  }, [apiData]);

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
        {isError ? (
          <div className="p-8 border border-dashed border-red-200 dark:border-red-900/40 rounded-xl text-center bg-red-50/50 dark:bg-red-950/10">
            <div className="max-w-md mx-auto space-y-3">
              <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 flex items-center justify-center mx-auto">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-[var(--text)]">Failed to load on-chain collections</h3>
                <p className="text-xs text-[var(--muted)] mt-1">
                  {error instanceof Error ? error.message : 'Unable to query curated collections from the RPC network.'}
                </p>
              </div>
              <Button onClick={() => refetch()} size="sm" variant="secondary">
                Retry Connection
              </Button>
            </div>
          </div>
        ) : (
          <MarketsTable collections={collections} isLoading={isLoading} />
        )}
      </div>
    </div>
  );
}
