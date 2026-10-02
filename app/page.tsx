'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { CURATED_COLLECTIONS } from '@/config/collections';
import { useCollections } from '@/hooks/api/useCollections';
import { MarketsTable, type MarketCollectionItem } from '@/components/markets/MarketsTable';
import { MarketStatCards } from '@/components/markets/MarketStatCards';

export default function HomePage() {
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'has_offers'>('all');
  const [loanMarketTab, setLoanMarketTab] = useState<'offers' | 'active'>('offers');
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
      totalVolumeEth: '0.00',
    };
  }, [collections]);

  return (
    <div className="space-y-8 animate-in fade-in duration-150">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-[var(--line)]">
        <div>
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-[var(--text)]">
            Explore Pledge
          </h1>
          <p className="text-xs text-[var(--muted)] mt-1">
            Liquidity for the NFTs you want to keep.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono text-[var(--muted)] tracking-tight">
          <span className="font-semibold text-[var(--text)]">Robinhood Chain</span>
          <span className="opacity-40">/</span>
          <span>Fixed-Rate Lending</span>
        </div>
      </div>

      <MarketStatCards stats={marketStats} />

      <div className="space-y-3.5">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold tracking-tight text-[var(--text)]">
            Featured collectibles
          </h2>
          <span className="text-xs text-[var(--muted)]">
            Curated markets <span className="text-[var(--accent-primary)] ml-1">↗</span>
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {collections.slice(0, 4).map((c, i) => (
            <article
              key={c.address}
              className="group flex flex-col bg-[var(--surface)] border border-[var(--line)] hover:border-[var(--line-strong)] rounded-xl p-3 transition-colors duration-150"
            >
              <Link
                href={`/borrow?collection=${c.address}`}
                className="w-full aspect-square bg-[var(--panel)] border border-[var(--line)] rounded-lg overflow-hidden relative block"
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
                  <div className="w-full h-full flex items-center justify-center font-mono font-bold text-lg text-[var(--accent-primary)]">
                    {c.symbol}
                  </div>
                )}
              </Link>

              <div className="flex items-center justify-between my-2.5">
                <h3 className="text-xs font-semibold text-[var(--text)] truncate">
                  {c.name} #{String(i * 324 + 842).padStart(4, '0')}
                </h3>
                <span className="text-xs text-[var(--accent-primary)] shrink-0 font-bold">✦</span>
              </div>

              <div className="space-y-1.5 mt-auto">
                <Link
                  href={`/borrow?collection=${c.address}`}
                  className="flex items-center justify-between w-full border border-[var(--line)] hover:border-[var(--line-strong)] rounded-lg bg-[var(--panel)] text-[var(--text)] px-2.5 py-2 text-xs transition-colors"
                >
                  <span className="text-[var(--muted)]">Borrow up to</span>
                  <strong className="font-mono font-medium text-[var(--accent-primary)]">
                    {c.floorPriceEth ? (Number(c.floorPriceEth) * 0.6).toFixed(3) : '0.800'} <small className="text-[10px] text-[var(--muted)]">ETH</small>
                  </strong>
                </Link>

                <Link
                  href={`/lend?collection=${c.address}`}
                  className="flex items-center justify-between w-full border border-[var(--line)] hover:border-[var(--line-strong)] rounded-lg bg-[var(--panel)] text-[var(--text)] px-2.5 py-2 text-xs transition-colors"
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
            <h2 className="text-lg font-semibold tracking-tight text-[var(--text)] flex items-center gap-2">
              <span>Market Overview</span>
              <span className="text-xs text-[var(--muted)] font-mono font-normal">04</span>
            </h2>
            <p className="text-xs text-[var(--muted)] mt-0.5">
              Find liquidity for your next move.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <div className="bg-[var(--panel)] p-1 rounded-lg flex gap-1 border border-[var(--line)]">
              <button
                type="button"
                onClick={() => setSelectedFilter('all')}
                className={`text-xs font-medium py-1 px-3 rounded-md transition-colors cursor-pointer ${
                  selectedFilter === 'all'
                    ? 'bg-[var(--surface)] text-[var(--text)] border border-[var(--line)] shadow-xs'
                    : 'text-[var(--muted)] hover:text-[var(--text)]'
                }`}
              >
                All
              </button>
              <button
                type="button"
                onClick={() => setSelectedFilter('has_offers')}
                className={`text-xs font-medium py-1 px-3 rounded-md transition-colors cursor-pointer ${
                  selectedFilter === 'has_offers'
                    ? 'bg-[var(--surface)] text-[var(--text)] border border-[var(--line)] shadow-xs'
                    : 'text-[var(--muted)] hover:text-[var(--text)]'
                }`}
              >
                Has offers
              </button>
            </div>

            <Link
              href="/lend"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[var(--line)] bg-[var(--panel)] hover:bg-[var(--surface)] text-[var(--text)] text-xs font-medium transition-colors ml-2"
            >
              <span>Explore lending</span>
              <span>↗</span>
            </Link>
          </div>
        </div>

        <MarketsTable collections={filteredCollections} />
      </div>

      <div className="border-t border-[var(--line)] pt-8 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold tracking-tight text-[var(--text)]">
              Lending market
            </h2>
            <p className="text-xs text-[var(--muted)] mt-0.5">
              One NFT. One lender. Clear terms.
            </p>
          </div>

          <Link
            href="/lend"
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-[var(--line)] bg-[var(--panel)] hover:bg-[var(--surface)] text-[var(--text)] text-xs font-medium transition-colors"
          >
            <span>Create offer</span>
            <span className="text-sm font-normal">+</span>
          </Link>
        </div>

        <div className="flex items-center justify-between gap-3 pb-2 border-b border-[var(--line)]">
          <div className="bg-[var(--panel)] p-1 rounded-lg flex gap-1 border border-[var(--line)]">
            <button
              onClick={() => setLoanMarketTab('offers')}
              className={`text-xs font-medium py-1 px-3 rounded-md transition-colors cursor-pointer ${
                loanMarketTab === 'offers'
                  ? 'bg-[var(--surface)] text-[var(--text)] border border-[var(--line)] shadow-xs'
                  : 'text-[var(--muted)] hover:text-[var(--text)]'
              }`}
            >
              Available offers
            </button>
            <button
              onClick={() => setLoanMarketTab('active')}
              className={`text-xs font-medium py-1 px-3 rounded-md transition-colors cursor-pointer ${
                loanMarketTab === 'active'
                  ? 'bg-[var(--surface)] text-[var(--text)] border border-[var(--line)] shadow-xs'
                  : 'text-[var(--muted)] hover:text-[var(--text)]'
              }`}
            >
              My active loans
            </button>
          </div>

          <span className="text-xs font-mono text-[var(--accent-primary)]">ETH</span>
        </div>

        <div className="space-y-2">
          {collections.map((c, i) => {
            const principalEth = c.floorPriceEth ? (Number(c.floorPriceEth) * 0.6).toFixed(3) : '0.800';
            const interestPct = 5.0;
            const repayEth = (Number(principalEth) * (1 + interestPct / 100)).toFixed(3);

            return (
              <div
                key={c.address}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 bg-[var(--surface)] border border-[var(--line)] hover:border-[var(--line-strong)] rounded-xl transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-md bg-[var(--panel)] border border-[var(--line)] overflow-hidden flex items-center justify-center shrink-0">
                    {c.imageUrl ? (
                      <Image
                        src={c.imageUrl}
                        alt={c.name}
                        width={40}
                        height={40}
                        className="w-full h-full object-cover"
                        unoptimized
                      />
                    ) : (
                      <span className="font-mono font-bold text-xs text-[var(--accent-primary)]">
                        {c.symbol.slice(0, 2)}
                      </span>
                    )}
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-[var(--text)]">
                      {c.symbol} #{String(i * 216 + 842).padStart(4, '0')}
                    </div>
                    <div className="text-[10px] text-[var(--muted)]">{c.name}</div>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-4 sm:gap-6 justify-between sm:justify-end text-xs">
                  <span className="text-[10px] font-mono text-[var(--muted)] bg-[var(--panel)] border border-[var(--line)] px-2 py-0.5 rounded-md">
                    14 days
                  </span>

                  <div className="font-mono text-xs text-[var(--text)]">
                    {principalEth} <span className="text-[10px] text-[var(--muted)]">ETH</span>
                  </div>

                  <div className="text-[var(--accent-primary)] font-medium text-xs">
                    {interestPct}%
                  </div>

                  <div className="font-mono text-xs text-[var(--accent-primary)] font-medium">
                    {repayEth} <span className="text-[10px] text-[var(--muted)]">ETH</span>
                  </div>

                  <Link
                    href={`/borrow?collection=${c.address}`}
                    className="inline-flex items-center justify-center gap-1 px-3 py-1.5 rounded-md border border-[var(--line)] bg-[var(--panel)] hover:bg-[var(--surface)] text-[var(--text)] text-xs font-medium transition-colors"
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
