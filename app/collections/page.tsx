'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { formatUnits } from 'viem';
import { CURATED_COLLECTIONS } from '@/config/collections';
import { getMockCollectionStats, getMockMarketStats } from '@/lib/mock/fixtures';
import { MarketStatCards } from '@/components/markets/MarketStatCards';
import { MarketsTable, type MarketCollectionItem } from '@/components/markets/MarketsTable';
import { FilterChip } from '@/components/ui/FilterChip';

export default function CollectionsPage() {
  const [selectedFilter, setSelectedFilter] = useState('all');

  const stats = useMemo(() => {
    const raw = getMockMarketStats();
    const poolEth = Number(formatUnits(BigInt(raw.totalPoolSizeWei), 18)).toFixed(2);
    const volEth = Number(formatUnits(BigInt(raw.totalVolumeWei), 18)).toFixed(2);
    return {
      totalPoolSizeEth: poolEth,
      totalActiveLoans: raw.totalActiveLoansCount,
      totalVolumeEth: volEth,
    };
  }, []);

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

  const filteredCollections = useMemo(() => {
    if (selectedFilter === 'has-offers') {
      return collections.filter((c) => c.offerCount > 0);
    }
    if (selectedFilter === 'active-loans') {
      return collections.filter((c) => (c.activeLoansCount || 0) > 0);
    }
    return collections;
  }, [collections, selectedFilter]);

  const filterChips = [
    { id: 'all', label: 'All Collections' },
    { id: 'has-offers', label: 'Has Offers' },
    { id: 'active-loans', label: 'Active Loans' },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[var(--line)] pb-5">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[var(--text)]">
            Curated NFT Collections
          </h1>
          <p className="text-xs sm:text-sm text-[var(--muted)] mt-1">
            Explore whitelisted NFT collections with active lending pools and fixed-rate collateral terms
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/borrow"
            className="px-4 py-2 text-xs font-semibold rounded-lg bg-[var(--primary)] text-white hover:bg-[var(--primary-dark)] transition-colors shadow-xs"
          >
            Borrow Against NFT
          </Link>
          <Link
            href="/lend"
            className="px-4 py-2 text-xs font-semibold rounded-lg bg-[var(--raised)] border border-[var(--line)] text-[var(--text)] hover:bg-[var(--surface)] transition-colors"
          >
            Create Offer
          </Link>
        </div>
      </div>

      <MarketStatCards stats={stats} />

      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold tracking-tight text-[var(--text)]">All Verified Collections</h2>
            <p className="text-xs text-[var(--muted)]">Verified collateral contracts on Robinhood Chain</p>
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
            {filterChips.map((chip) => (
              <FilterChip
                key={chip.id}
                id={chip.id}
                label={chip.label}
                selected={selectedFilter === chip.id}
                onSelect={(id) => setSelectedFilter(id)}
              />
            ))}
          </div>
        </div>

        <MarketsTable collections={filteredCollections} />
      </div>
    </div>
  );
}
