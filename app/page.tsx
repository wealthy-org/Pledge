'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { CURATED_COLLECTIONS } from '@/config/collections';
import { getMockCollectionStats } from '@/lib/mock/fixtures';
import { MarketsTable, type MarketCollectionItem } from '@/components/markets/MarketsTable';
import { MarketStatCards } from '@/components/markets/MarketStatCards';

export default function HomePage() {
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'has_offers'>('all');
  const [loanMarketTab, setLoanMarketTab] = useState<'offers' | 'active'>('offers');

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
    if (selectedFilter === 'has_offers') {
      return collections.filter((c) => c.offerCount > 0);
    }
    return collections;
  }, [collections, selectedFilter]);

  const marketStats = useMemo(() => {
    const totalPoolWei = collections.reduce((acc, c) => acc + BigInt(c.poolSizeWei || '0'), 0n);
    const totalPoolEth = (Number(totalPoolWei) / 1e18).toFixed(2);
    const totalActive = collections.reduce((acc, c) => acc + (c.activeLoansCount || 0), 0);
    return {
      totalPoolSizeEth: totalPoolEth,
      totalActiveLoans: totalActive,
      totalVolumeEth: '42.50',
    };
  }, [collections]);

  return (
    <div className="space-y-8 animate-in fade-in duration-150">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-[#e6ece9]">
        <div>
          <h1 className="text-[26px] font-medium tracking-[-0.8px] text-[#142d2b] leading-tight">
            Explore Pledge
          </h1>
          <p className="text-[11px] text-[var(--muted)] mt-1">
            Liquidity for the NFTs you want to keep.
          </p>
        </div>

        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#f0f7fc] border border-[#dce7f5] text-[10px] text-[#276eb6] font-mono">
          <span className="w-1.5 h-1.5 rounded-full bg-[#2881bd] animate-pulse" />
          <span>Robinhood Chain · Fixed-Rate Lending</span>
        </div>
      </div>

      <MarketStatCards stats={marketStats} />

      <div className="space-y-3.5">
        <div className="flex items-center justify-between">
          <h2 className="text-[15px] font-medium tracking-[-0.2px] text-[#142d2b]">
            Featured collectibles
          </h2>
          <span className="text-[10px] text-[var(--muted)]">
            Curated markets <span className="text-[#276eb6] ml-1">↗</span>
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {collections.slice(0, 4).map((c, i) => (
            <article
              key={c.address}
              className="group flex flex-col bg-white border border-[#dee7e3] hover:border-[#b7d4c9] hover:shadow-[0_8px_24px_rgba(33,77,57,0.06)] rounded-xl p-3 transition-all duration-200"
            >
              <Link
                href={`/borrow?collection=${c.address}`}
                className="w-full aspect-square bg-[#f4f7f5] border border-[#e1e8e9] rounded-lg overflow-hidden relative block"
              >
                {c.imageUrl ? (
                  <Image
                    src={c.imageUrl}
                    alt={c.name}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                    unoptimized
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center font-mono font-bold text-lg text-[#214e3b]">
                    {c.symbol}
                  </div>
                )}
              </Link>

              <div className="flex items-center justify-between my-2.5">
                <h3 className="text-[11px] font-semibold text-[#142d2b] truncate">
                  {c.name} #{String(i * 324 + 842).padStart(4, '0')}
                </h3>
                <span className="text-[11px] text-[#1b8a62] shrink-0 font-bold">✦</span>
              </div>

              <div className="space-y-1.5 mt-auto">
                <Link
                  href={`/borrow?collection=${c.address}`}
                  className="flex items-center justify-between w-full border border-[#dee7e3] hover:bg-[#eff8f2] rounded-lg bg-white text-[#315949] px-2.5 py-2 text-[10px] transition-colors"
                >
                  <span className="text-[#627478]">Borrow up to</span>
                  <strong className="font-mono font-medium text-[#184b3b]">
                    {c.floorPriceEth ? (Number(c.floorPriceEth) * 0.6).toFixed(3) : '0.800'} <small className="text-[8px] text-[#719085]">ETH</small>
                  </strong>
                </Link>

                <Link
                  href={`/lend?collection=${c.address}`}
                  className="flex items-center justify-between w-full border border-[#dce8f0] hover:bg-[#f3f9fd] rounded-lg bg-[#fbfdff] text-[#376c94] px-2.5 py-2 text-[10px] transition-colors"
                >
                  <span>Make a loan offer</span>
                  <span className="text-xs">↗</span>
                </Link>
              </div>
            </article>
          ))}
        </div>
      </div>

      <div className="space-y-4 pt-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-[20px] font-medium tracking-[-0.5px] text-[#142d2b] flex items-center gap-2">
              <span>Market Overview</span>
              <span className="text-[10px] text-[var(--muted)] font-mono font-normal">04</span>
            </h2>
            <p className="text-[11px] text-[var(--muted)] mt-0.5">
              Find liquidity for your next move.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <div className="bg-[#f3f5f4] p-[3px] rounded-[7px] flex gap-1">
              <button
                type="button"
                onClick={() => setSelectedFilter('all')}
                className={`text-[11px] font-medium py-1 px-3 rounded-[5px] transition-all cursor-pointer ${
                  selectedFilter === 'all'
                    ? 'bg-white text-[#174732] border border-[#e3e9e6] shadow-[0_1px_3px_rgba(25,63,41,0.06)]'
                    : 'text-[#607169] hover:text-[#174732]'
                }`}
              >
                All
              </button>
              <button
                type="button"
                onClick={() => setSelectedFilter('has_offers')}
                className={`text-[11px] font-medium py-1 px-3 rounded-[5px] transition-all cursor-pointer ${
                  selectedFilter === 'has_offers'
                    ? 'bg-white text-[#174732] border border-[#e3e9e6] shadow-[0_1px_3px_rgba(25,63,41,0.06)]'
                    : 'text-[#607169] hover:text-[#174732]'
                }`}
              >
                Has offers
              </button>
            </div>

            <Link
              href="/lend"
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border border-[#cfe4dc] bg-[#edf7f2] hover:bg-[#e1f1e9] text-[#142d2b] text-[11px] font-semibold transition-colors ml-2"
            >
              <span>Explore lending</span>
              <span>↗</span>
            </Link>
          </div>
        </div>

        <MarketsTable collections={filteredCollections} />
      </div>

      <div className="border-t border-[#e5ebe8] pt-8 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-[18px] font-medium tracking-[-0.4px] text-[#142d2b]">
              Lending market
            </h2>
            <p className="text-[11px] text-[var(--muted)] mt-0.5">
              One NFT. One lender. Clear terms.
            </p>
          </div>

          <Link
            href="/lend"
            className="inline-flex items-center gap-1 px-3.5 py-1.5 rounded-full border border-[#cfe4dc] bg-[#edf7f2] hover:bg-[#e1f1e9] text-[#142d2b] text-[11px] font-semibold transition-colors"
          >
            <span>Create offer</span>
            <span className="text-sm">+</span>
          </Link>
        </div>

        <div className="flex items-center justify-between gap-3 pb-2 border-b border-[#e1e8e9]">
          <div className="bg-[#f3f5f4] p-[3px] rounded-[7px] flex gap-1">
            <button
              onClick={() => setLoanMarketTab('offers')}
              className={`text-[11px] font-medium py-1 px-3 rounded-[5px] transition-all cursor-pointer ${
                loanMarketTab === 'offers'
                  ? 'bg-white text-[#174732] border border-[#e3e9e6] shadow-[0_1px_3px_rgba(25,63,41,0.06)]'
                  : 'text-[#607169] hover:text-[#174732]'
              }`}
            >
              Available offers
            </button>
            <button
              onClick={() => setLoanMarketTab('active')}
              className={`text-[11px] font-medium py-1 px-3 rounded-[5px] transition-all cursor-pointer ${
                loanMarketTab === 'active'
                  ? 'bg-white text-[#174732] border border-[#e3e9e6] shadow-[0_1px_3px_rgba(25,63,41,0.06)]'
                  : 'text-[#607169] hover:text-[#174732]'
              }`}
            >
              My active loans
            </button>
          </div>

          <span className="text-[11px] font-mono text-[#4d7994]">◈ &nbsp; ETH</span>
        </div>

        <div className="space-y-2">
          {collections.map((c, i) => {
            const principalEth = c.floorPriceEth ? (Number(c.floorPriceEth) * 0.6).toFixed(3) : '0.800';
            const interestPct = 5.0;
            const repayEth = (Number(principalEth) * (1 + interestPct / 100)).toFixed(3);

            return (
              <div
                key={c.address}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 bg-white border border-[#dee7e3] hover:border-[#b7d4c9] rounded-xl transition-all"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-[38px] h-[38px] rounded-[6px] bg-[#f4f7f5] border border-[#dee7e3] overflow-hidden flex items-center justify-center shrink-0">
                    {c.imageUrl ? (
                      <Image
                        src={c.imageUrl}
                        alt={c.name}
                        width={38}
                        height={38}
                        className="w-full h-full object-cover"
                        unoptimized
                      />
                    ) : (
                      <span className="font-mono font-bold text-[10px] text-[#214e3b]">
                        {c.symbol.slice(0, 2)}
                      </span>
                    )}
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-[#142d2b]">
                      {c.symbol} #{String(i * 216 + 842).padStart(4, '0')}
                    </div>
                    <div className="text-[10px] text-[var(--muted)]">{c.name}</div>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-4 sm:gap-6 justify-between sm:justify-end text-xs">
                  <span className="text-[10px] text-[#27689c] bg-[#eaf3fc] px-2 py-0.5 rounded-[4px]">
                    14 days
                  </span>

                  <div className="font-mono text-xs text-[#142d2b]">
                    {principalEth} <span className="text-[10px] text-[var(--muted)]">ETH</span>
                  </div>

                  <div className="text-[#087f5b] font-medium text-xs">
                    {interestPct}%
                  </div>

                  <div className="font-mono text-xs text-[#184b3b] font-medium">
                    {repayEth} <span className="text-[10px] text-[var(--muted)]">ETH</span>
                  </div>

                  <Link
                    href={`/borrow?collection=${c.address}`}
                    className="inline-flex items-center justify-center gap-1 px-3 py-1.5 rounded-[6px] border border-[#e1e8e9] bg-white hover:bg-[#eef5fb] hover:border-[#c4dcee] text-[#286a9b] text-[11px] font-semibold transition-all shadow-xs"
                  >
                    <span>View offer</span>
                    <span>↗</span>
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
