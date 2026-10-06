'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { useSafeChainId } from '@/hooks/useSafeChainId';
import { useUnifiedCollectionSearch } from '@/hooks/useUnifiedCollectionSearch';
import { MarketsTable, type MarketCollectionItem } from '@/components/markets/MarketsTable';
import { FeaturedListingsCarousel } from '@/components/home/FeaturedListingsCarousel';
import { resolveCollectionImageUrl } from '@/lib/services/metadata';

export default function HomePage() {
  const chainId = useSafeChainId();
  const { collections: rawCollections, isLoading: isLoadingCollections } = useUnifiedCollectionSearch({ chainId });

  const [selectedFilter, setSelectedFilter] = useState<'has_offers' | 'all'>('all');

  const collections: MarketCollectionItem[] = useMemo(() => {
    return rawCollections.map((item) => ({
      address: item.address,
      name: item.name,
      symbol: item.symbol,
      imageUrl: item.imageUrl || resolveCollectionImageUrl(item.address, item.symbol || item.name),
      floorPriceEth: item.floorPriceEth || undefined,
      priceChange24hPct: item.priceChange24hPct,
      salesVolumeEth: item.salesVolumeEth,
      activeWalletsCount: item.activeWalletsCount,
      holdersCount: item.holdersCount,
      sparklineData: item.sparklineData,
      bestOfferWei: item.bestOfferWei || undefined,
      poolSizeWei: item.poolSizeWei || '0',
      offerCount: item.offerCount || 0,
      activeLoansCount: item.activeLoansCount || 0,
      isVerified: true,
    }));
  }, [rawCollections]);

  const activeOfferCollections = useMemo(() => {
    return collections.filter((c) => c.offerCount > 0);
  }, [collections]);

  const filteredCollections = useMemo(() => {
    if (selectedFilter === 'has_offers') {
      return activeOfferCollections;
    }
    return collections;
  }, [collections, activeOfferCollections, selectedFilter]);

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-[var(--line)]">
        <div>
          <div className="text-[10px] uppercase font-semibold tracking-wider text-emerald-600 dark:text-emerald-400 flex items-center gap-2 mb-1">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>GONDI Architecture · NFT Liquidity Marketplace</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-[var(--text)]">
            Lending Markets
          </h1>
          <p className="text-xs text-[var(--muted)] mt-1">
            Institutional-grade P2P NFT lending with fixed-rate escrow on Robinhood Chain.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/explore"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-[var(--line)] bg-[var(--surface)] hover:bg-[var(--line)] text-[var(--text)] text-xs font-medium transition-colors shadow-xs"
          >
            <span>Explore All Collections</span>
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </Link>
          <Link
            href="/lend"
            className="inline-flex items-center gap-1 px-4 py-2 rounded-lg bg-[var(--lime)] hover:bg-[#076b4d] text-white text-xs font-semibold transition-colors shadow-xs"
          >
            <span>Create Offer +</span>
          </Link>
        </div>
      </div>

      <FeaturedListingsCarousel
        collections={collections}
        isLoading={isLoadingCollections}
      />

      <div className="space-y-4 pt-2">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-base sm:text-lg font-semibold tracking-tight text-[var(--text)]">
              Market Overview
            </h2>
            <p className="text-xs text-[var(--muted)] mt-0.5">
              Live liquidity pools, 24H volume, and floor price trends.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <div className="bg-[var(--panel)] p-1 rounded-lg flex gap-1 border border-[var(--line)]">
              <button
                type="button"
                onClick={() => setSelectedFilter('all')}
                className={`text-xs font-medium py-1 px-3 rounded-md transition-colors cursor-pointer border ${
                  selectedFilter === 'all'
                    ? 'bg-[var(--surface)] text-[var(--text)] border-[var(--line)] shadow-xs'
                    : 'text-[var(--muted)] hover:text-[var(--text)] border-transparent'
                }`}
              >
                All Markets ({collections.length})
              </button>
              <button
                type="button"
                onClick={() => setSelectedFilter('has_offers')}
                className={`text-xs font-medium py-1 px-3 rounded-md transition-colors cursor-pointer border ${
                  selectedFilter === 'has_offers'
                    ? 'bg-[var(--surface)] text-[var(--text)] border-[var(--line)] shadow-xs'
                    : 'text-[var(--muted)] hover:text-[var(--text)] border-transparent'
                }`}
              >
                Has offers ({activeOfferCollections.length})
              </button>
            </div>
          </div>
        </div>

        <MarketsTable collections={filteredCollections} isLoading={isLoadingCollections} />
      </div>
    </div>
  );
}
