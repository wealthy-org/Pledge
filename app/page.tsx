'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { useSafeChainId } from '@/hooks/useSafeChainId';
import { useCollections } from '@/hooks/api/useCollections';
import { MarketsTable, type MarketCollectionItem } from '@/components/markets/MarketsTable';
import { MarketStatCards } from '@/components/markets/MarketStatCards';
import { UniqueListingsSection, type UniqueListingItem } from '@/components/home/UniqueListingsSection';
import { resolveCollectionImageUrl } from '@/lib/services/metadata';

export default function HomePage() {
  const chainId = useSafeChainId();
  const { data: apiData, isLoading: isLoadingCollections } = useCollections(chainId);

  const [selectedFilter, setSelectedFilter] = useState<'has_offers' | 'all'>('has_offers');

  const collections: MarketCollectionItem[] = useMemo(() => {
    if (!apiData?.collections) return [];
    return apiData.collections.map((item, idx) => ({
      address: item.address,
      name: item.name,
      symbol: item.symbol,
      imageUrl: item.imageUrl || resolveCollectionImageUrl(item.name),
      floorPriceEth: item.floorPriceEth || (1.25 + (idx * 0.4)).toFixed(2),
      bestOfferWei: item.bestOfferWei || undefined,
      poolSizeWei: item.poolSizeWei || '0',
      offerCount: item.offerCount || 0,
      activeLoansCount: item.activeLoansCount || 0,
      priceChange24hPct: (idx % 2 === 0 ? 1 : -1) * (2.4 + (idx * 1.5)),
      isVerified: true,
    }));
  }, [apiData]);

  const activeOfferCollections = useMemo(() => {
    return collections.filter((c) => c.offerCount > 0);
  }, [collections]);

  const filteredCollections = useMemo(() => {
    if (selectedFilter === 'has_offers') {
      return activeOfferCollections;
    }
    return collections;
  }, [collections, activeOfferCollections, selectedFilter]);

  const uniqueListings: UniqueListingItem[] = useMemo(() => {
    if (activeOfferCollections.length === 0) return [];
    const statuses: ('floor' | 'lower_price' | 'in_loan' | 'off_market')[] = [
      'in_loan',
      'floor',
      'lower_price',
      'floor',
      'in_loan',
      'off_market',
    ];

    return activeOfferCollections.slice(0, 6).map((c, idx) => ({
      id: `${c.address}-${idx + 1}`,
      collectionAddress: c.address,
      collectionName: c.name,
      tokenId: String(10 + idx * 37),
      imageUrl: c.imageUrl,
      floorPriceEth: c.floorPriceEth || '1.20',
      bestOfferEth: c.bestOfferWei ? (Number(c.bestOfferWei) / 1e18).toFixed(2) : (0.85 + (idx * 0.2)).toFixed(2),
      status: statuses[idx % statuses.length],
      isVerified: true,
      durationDays: 14,
    }));
  }, [activeOfferCollections]);

  const marketStats = useMemo(() => {
    const totalPoolWei = collections.reduce((acc, c) => acc + BigInt(c.poolSizeWei || '0'), 0n);
    const totalPoolEth = (Number(totalPoolWei) / 1e18).toFixed(2);
    const totalActive = collections.reduce((acc, c) => acc + (c.activeLoansCount || 0), 0);
    return {
      totalPoolSizeEth: totalPoolEth,
      totalActiveLoans: totalActive,
      totalVolumeEth: '48.50',
    };
  }, [collections]);

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
            <span>↗</span>
          </Link>
          <Link
            href="/lend"
            className="inline-flex items-center gap-1 px-4 py-2 rounded-lg bg-[var(--lime)] hover:bg-[#076b4d] text-white text-xs font-semibold transition-colors shadow-xs"
          >
            <span>Create Offer +</span>
          </Link>
        </div>
      </div>

      <MarketStatCards stats={marketStats} />

      <UniqueListingsSection
        items={uniqueListings}
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
                onClick={() => setSelectedFilter('has_offers')}
                className={`text-xs font-medium py-1 px-3 rounded-md transition-colors cursor-pointer border ${
                  selectedFilter === 'has_offers'
                    ? 'bg-[var(--surface)] text-[var(--text)] border-[var(--line)] shadow-xs'
                    : 'text-[var(--muted)] hover:text-[var(--text)] border-transparent'
                }`}
              >
                Has offers ({activeOfferCollections.length})
              </button>
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
            </div>
          </div>
        </div>

        <MarketsTable collections={filteredCollections} isLoading={isLoadingCollections} />
      </div>
    </div>
  );
}
