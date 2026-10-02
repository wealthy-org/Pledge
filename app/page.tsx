'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { formatUnits } from 'viem';
import { CURATED_COLLECTIONS } from '@/config/collections';
import { getMockCollectionStats, getMockMarketStats } from '@/lib/mock/fixtures';
import { MarketStatCards } from '@/components/markets/MarketStatCards';
import { MarketsTable, type MarketCollectionItem } from '@/components/markets/MarketsTable';
import { FilterChip } from '@/components/ui/FilterChip';

export default function HomePage() {
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
      <div className="relative overflow-hidden rounded-[var(--radius)] bg-gradient-to-br from-[#214E3B] to-[#123124] text-white p-8 lg:p-10 shadow-[var(--shadow-raised)]">
        <div className="max-w-2xl relative z-10 space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/20 text-[#A5C9B3] text-xs font-mono">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span>Non-Custodial Fixed-Rate NFT Lending Protocol</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight leading-tight">
            Instant Liquidity for Your NFTs on <span className="text-emerald-300">Robinhood Chain</span>
          </h1>

          <p className="text-[#D7E6D9] text-sm sm:text-base leading-relaxed">
            Borrow against verified NFT collateral at transparent fixed rates, or earn passive yields by depositing liquidity into automated single-borrower pools.
          </p>

          <div className="flex flex-wrap items-center gap-4 pt-2">
            <Link
              href="/borrow"
              className="px-6 py-3 rounded-xl bg-[var(--primary)] text-white text-sm font-semibold hover:bg-[var(--primary-dark)] transition-all shadow-md cursor-pointer"
            >
              Borrow Against NFT
            </Link>
            <Link
              href="/lend"
              className="px-6 py-3 rounded-xl bg-white/10 hover:bg-white/20 text-white text-sm font-semibold transition-all border border-white/20 cursor-pointer"
            >
              Explore Lending Offers
            </Link>
          </div>
        </div>

        <div className="absolute right-0 bottom-0 top-0 w-1/3 opacity-10 pointer-events-none flex items-center justify-center text-[180px] font-black">
          P
        </div>
      </div>

      <MarketStatCards stats={stats} />

      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold tracking-tight text-[var(--text)]">NFT Lending Markets</h2>
            <p className="text-xs text-[var(--muted)]">Curated collections with available lending liquidity</p>
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
