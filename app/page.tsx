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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-[#e1ebe6] dark:border-[#1e332c]">
        <div>
          <h1 className="text-[26px] font-medium tracking-[-0.8px] text-[#142d2b] dark:text-[#f0f6fc] leading-tight">
            Explore Pledge
          </h1>
          <p className="text-[11px] text-[var(--muted)] dark:text-[#8ca197] mt-1">
            Liquidity for the NFTs you want to keep.
          </p>
        </div>

        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#f0f7fc] dark:bg-[#142533] border border-[#dce7f5] dark:border-[#1c3850] text-[10px] text-[#276eb6] dark:text-[#58a6ff] font-mono">
          <span className="w-1.5 h-1.5 rounded-full bg-[#2881bd] animate-pulse" />
          <span>Robinhood Chain · Fixed-Rate Lending</span>
        </div>
      </div>

      <MarketStatCards stats={marketStats} />

      <div className="space-y-3.5">
        <div className="flex items-center justify-between">
          <h2 className="text-[15px] font-medium tracking-[-0.2px] text-[#142d2b] dark:text-[#f0f6fc]">
            Featured collectibles
          </h2>
          <span className="text-[10px] text-[var(--muted)] dark:text-[#8ca197]">
            Curated markets <span className="text-[#276eb6] dark:text-[#58a6ff] ml-1">↗</span>
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {collections.slice(0, 4).map((c, i) => (
            <article
              key={c.address}
              className="group flex flex-col bg-white dark:bg-[#111a17] border border-[#dee7e3] dark:border-[#1e332c] hover:border-[#b7d4c9] dark:hover:border-emerald-500/40 hover:shadow-[0_8px_24px_rgba(33,77,57,0.06)] dark:hover:shadow-[0_8px_24px_rgba(0,0,0,0.4)] rounded-xl p-3 transition-all duration-200"
            >
              <Link
                href={`/borrow?collection=${c.address}`}
                className="w-full aspect-square bg-[#f4f7f5] dark:bg-[#14221e] border border-[#e1e8e9] dark:border-[#1e332c] rounded-lg overflow-hidden relative block"
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
                  <div className="w-full h-full flex items-center justify-center font-mono font-bold text-lg text-[#214e3b] dark:text-emerald-400">
                    {c.symbol}
                  </div>
                )}
              </Link>

              <div className="flex items-center justify-between my-2.5">
                <h3 className="text-[11px] font-semibold text-[#142d2b] dark:text-[#f0f6fc] truncate">
                  {c.name} #{String(i * 324 + 842).padStart(4, '0')}
                </h3>
                <span className="text-[11px] text-[#1b8a62] dark:text-emerald-400 shrink-0 font-bold">✦</span>
              </div>

              <div className="space-y-1.5 mt-auto">
                <Link
                  href={`/borrow?collection=${c.address}`}
                  className="flex items-center justify-between w-full border border-[#dee7e3] dark:border-[#1e332c] hover:bg-[#eff8f2] dark:hover:bg-[#192b25] rounded-lg bg-white dark:bg-[#14221e] text-[#315949] dark:text-[#a3c4b6] px-2.5 py-2 text-[10px] transition-colors"
                >
                  <span className="text-[#627478] dark:text-[#8ca197]">Borrow up to</span>
                  <strong className="font-mono font-medium text-[#184b3b] dark:text-emerald-400">
                    {c.floorPriceEth ? (Number(c.floorPriceEth) * 0.6).toFixed(3) : '0.800'} <small className="text-[8px] text-[#719085] dark:text-[#8ca197]">ETH</small>
                  </strong>
                </Link>

                <Link
                  href={`/lend?collection=${c.address}`}
                  className="flex items-center justify-between w-full border border-[#dce8f0] dark:border-[#1c3850] hover:bg-[#f3f9fd] dark:hover:bg-[#142838] rounded-lg bg-[#fbfdff] dark:bg-[#111f2a] text-[#376c94] dark:text-[#58a6ff] px-2.5 py-2 text-[10px] transition-colors"
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
            <h2 className="text-[20px] font-medium tracking-[-0.5px] text-[#142d2b] dark:text-[#f0f6fc] flex items-center gap-2">
              <span>Market Overview</span>
              <span className="text-[10px] text-[var(--muted)] dark:text-[#8ca197] font-mono font-normal">04</span>
            </h2>
            <p className="text-[11px] text-[var(--muted)] dark:text-[#8ca197] mt-0.5">
              Find liquidity for your next move.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <div className="bg-[#f0f4f2] dark:bg-[#14221e] p-[3px] rounded-[7px] flex gap-1 border border-[#e1ebe6] dark:border-[#1e332c]">
              <button
                type="button"
                onClick={() => setSelectedFilter('all')}
                className={`text-[11px] font-medium py-1 px-3 rounded-[5px] transition-all cursor-pointer ${
                  selectedFilter === 'all'
                    ? 'bg-white dark:bg-[#192b25] text-[#142d2b] dark:text-[#f0f6fc] border border-[#e3e9e6] dark:border-[#1e332c] shadow-[0_1px_3px_rgba(25,63,41,0.06)]'
                    : 'text-[#607169] dark:text-[#8ca197] hover:text-[#142d2b] dark:hover:text-white'
                }`}
              >
                All
              </button>
              <button
                type="button"
                onClick={() => setSelectedFilter('has_offers')}
                className={`text-[11px] font-medium py-1 px-3 rounded-[5px] transition-all cursor-pointer ${
                  selectedFilter === 'has_offers'
                    ? 'bg-white dark:bg-[#192b25] text-[#142d2b] dark:text-[#f0f6fc] border border-[#e3e9e6] dark:border-[#1e332c] shadow-[0_1px_3px_rgba(25,63,41,0.06)]'
                    : 'text-[#607169] dark:text-[#8ca197] hover:text-[#142d2b] dark:hover:text-white'
                }`}
              >
                Has offers
              </button>
            </div>

            <Link
              href="/lend"
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border border-[#cfe4dc] dark:border-[#1e4537] bg-[#edf7f2] dark:bg-[#142e24] hover:bg-[#e1f1e9] dark:hover:bg-[#1a3d30] text-[#142d2b] dark:text-[#f0f6fc] text-[11px] font-semibold transition-colors ml-2"
            >
              <span>Explore lending</span>
              <span>↗</span>
            </Link>
          </div>
        </div>

        <MarketsTable collections={filteredCollections} />
      </div>

      <div className="border-t border-[#e1ebe6] dark:border-[#1e332c] pt-8 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-[18px] font-medium tracking-[-0.4px] text-[#142d2b] dark:text-[#f0f6fc]">
              Lending market
            </h2>
            <p className="text-[11px] text-[var(--muted)] dark:text-[#8ca197] mt-0.5">
              One NFT. One lender. Clear terms.
            </p>
          </div>

          <Link
            href="/lend"
            className="inline-flex items-center gap-1 px-3.5 py-1.5 rounded-full border border-[#cfe4dc] dark:border-[#1e4537] bg-[#edf7f2] dark:bg-[#142e24] hover:bg-[#e1f1e9] dark:hover:bg-[#1a3d30] text-[#142d2b] dark:text-[#f0f6fc] text-[11px] font-semibold transition-colors"
          >
            <span>Create offer</span>
            <span className="text-sm">+</span>
          </Link>
        </div>

        <div className="flex items-center justify-between gap-3 pb-2 border-b border-[#e1ebe6] dark:border-[#1e332c]">
          <div className="bg-[#f0f4f2] dark:bg-[#14221e] p-[3px] rounded-[7px] flex gap-1 border border-[#e1ebe6] dark:border-[#1e332c]">
            <button
              onClick={() => setLoanMarketTab('offers')}
              className={`text-[11px] font-medium py-1 px-3 rounded-[5px] transition-all cursor-pointer ${
                loanMarketTab === 'offers'
                  ? 'bg-white dark:bg-[#192b25] text-[#142d2b] dark:text-[#f0f6fc] border border-[#e3e9e6] dark:border-[#1e332c] shadow-[0_1px_3px_rgba(25,63,41,0.06)]'
                  : 'text-[#607169] dark:text-[#8ca197] hover:text-[#142d2b] dark:hover:text-white'
              }`}
            >
              Available offers
            </button>
            <button
              onClick={() => setLoanMarketTab('active')}
              className={`text-[11px] font-medium py-1 px-3 rounded-[5px] transition-all cursor-pointer ${
                loanMarketTab === 'active'
                  ? 'bg-white dark:bg-[#192b25] text-[#142d2b] dark:text-[#f0f6fc] border border-[#e3e9e6] dark:border-[#1e332c] shadow-[0_1px_3px_rgba(25,63,41,0.06)]'
                  : 'text-[#607169] dark:text-[#8ca197] hover:text-[#142d2b] dark:hover:text-white'
              }`}
            >
              My active loans
            </button>
          </div>

          <span className="text-[11px] font-mono text-[#4d7994] dark:text-[#58a6ff]">◈ &nbsp; ETH</span>
        </div>

        <div className="space-y-2">
          {collections.map((c, i) => {
            const principalEth = c.floorPriceEth ? (Number(c.floorPriceEth) * 0.6).toFixed(3) : '0.800';
            const interestPct = 5.0;
            const repayEth = (Number(principalEth) * (1 + interestPct / 100)).toFixed(3);

            return (
              <div
                key={c.address}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 bg-white dark:bg-[#111a17] border border-[#dee7e3] dark:border-[#1e332c] hover:border-[#b7d4c9] dark:hover:border-emerald-500/40 rounded-xl transition-all"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-[38px] h-[38px] rounded-[6px] bg-[#f4f7f5] dark:bg-[#14221e] border border-[#dee7e3] dark:border-[#1e332c] overflow-hidden flex items-center justify-center shrink-0">
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
                      <span className="font-mono font-bold text-[10px] text-[#214e3b] dark:text-emerald-400">
                        {c.symbol.slice(0, 2)}
                      </span>
                    )}
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-[#142d2b] dark:text-[#f0f6fc]">
                      {c.symbol} #{String(i * 216 + 842).padStart(4, '0')}
                    </div>
                    <div className="text-[10px] text-[var(--muted)] dark:text-[#8ca197]">{c.name}</div>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-4 sm:gap-6 justify-between sm:justify-end text-xs">
                  <span className="text-[10px] text-[#27689c] dark:text-[#58a6ff] bg-[#eaf3fc] dark:bg-[#142838] px-2 py-0.5 rounded-[4px]">
                    14 days
                  </span>

                  <div className="font-mono text-xs text-[#142d2b] dark:text-[#f0f6fc]">
                    {principalEth} <span className="text-[10px] text-[var(--muted)] dark:text-[#8ca197]">ETH</span>
                  </div>

                  <div className="text-[#087f5b] dark:text-emerald-400 font-medium text-xs">
                    {interestPct}%
                  </div>

                  <div className="font-mono text-xs text-[#184b3b] dark:text-emerald-400 font-medium">
                    {repayEth} <span className="text-[10px] text-[var(--muted)] dark:text-[#8ca197]">ETH</span>
                  </div>

                  <Link
                    href={`/borrow?collection=${c.address}`}
                    className="inline-flex items-center justify-center gap-1 px-3 py-1.5 rounded-[6px] border border-[#e1e8e9] dark:border-[#1e332c] bg-white dark:bg-[#14221e] hover:bg-[#eef5fb] dark:hover:bg-[#1b302a] hover:border-[#c4dcee] dark:hover:border-emerald-500/40 text-[#286a9b] dark:text-emerald-400 text-[11px] font-semibold transition-all shadow-xs"
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
