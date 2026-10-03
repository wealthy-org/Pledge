'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useSafeChainId } from '@/hooks/useSafeChainId';
import { useCollections } from '@/hooks/api/useCollections';
import { MarketsTable, type MarketCollectionItem } from '@/components/markets/MarketsTable';
import { MarketStatCards } from '@/components/markets/MarketStatCards';
import { resolveCollectionImageUrl } from '@/lib/services/metadata';

export default function HomePage() {
  const chainId = useSafeChainId();
  const [selectedFilter, setSelectedFilter] = useState<'has_offers' | 'all'>('has_offers');
  const [loanMarketTab, setLoanMarketTab] = useState<'offers' | 'active'>('offers');
  const { data: apiData, isLoading: isLoadingCollections } = useCollections(chainId);

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

  const activeOfferCollections = useMemo(() => {
    return collections.filter((c) => c.offerCount > 0);
  }, [collections]);

  const filteredCollections = useMemo(() => {
    if (selectedFilter === 'has_offers') {
      return activeOfferCollections;
    }
    return collections;
  }, [collections, activeOfferCollections, selectedFilter]);

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
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-[var(--line)]">
        <div>
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-[var(--text)]">
            Lending Markets
          </h1>
          <p className="text-xs text-[var(--muted)] mt-1">
            Active NFT lending pools with live liquidity on Robinhood Chain.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/explore"
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-[var(--line)] bg-[var(--surface)] hover:bg-[var(--line)] text-[var(--text)] text-xs font-medium transition-colors"
          >
            <span>Explore All Collections</span>
            <span>↗</span>
          </Link>

          <div className="hidden sm:flex items-center gap-2 text-xs font-mono text-[var(--muted)] tracking-tight">
            <span className="font-semibold text-[var(--text)]">Robinhood Chain</span>
            <span className="opacity-40">/</span>
            <span>Fixed-Rate Escrow</span>
          </div>
        </div>
      </div>

      <MarketStatCards stats={marketStats} />

      <div className="space-y-3.5">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold tracking-tight text-[var(--text)]">
            Active Liquidity Pools
          </h2>
          <Link href="/explore" className="text-xs text-[var(--muted)] hover:text-[var(--accent-primary)] transition-colors">
            Browse all collections <span className="text-[var(--accent-primary)] ml-1">↗</span>
          </Link>
        </div>

        {activeOfferCollections.length === 0 && !isLoadingCollections ? (
          <div className="p-8 rounded-xl border border-dashed border-[var(--line)] bg-[var(--surface)] text-center space-y-3">
            <div className="text-xs text-[var(--muted)]">
              No active lending offers available in the market right now.
            </div>
            <div className="flex items-center justify-center gap-3">
              <Link
                href="/lend"
                className="inline-flex items-center gap-1 px-3.5 py-2 rounded-lg bg-[var(--lime)] hover:bg-[#076b4d] text-white text-xs font-semibold transition-colors shadow-xs"
              >
                Create First Offer +
              </Link>
              <Link
                href="/explore"
                className="inline-flex items-center gap-1 px-3.5 py-2 rounded-lg border border-[var(--line)] bg-[var(--panel)] text-[var(--text)] text-xs font-medium transition-colors"
              >
                Explore Collections ↗
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {activeOfferCollections.slice(0, 4).map((c) => {
              const displayImage = c.imageUrl || resolveCollectionImageUrl(c.name);

              return (
                <article
                  key={c.address}
                  className="group flex flex-col bg-[var(--surface)] border border-[var(--line)] hover:border-[var(--line-strong)] rounded-xl p-3 transition-colors duration-150"
                >
                  <Link
                    href={`/borrow?collection=${c.address}`}
                    className="w-full aspect-square bg-[var(--panel)] border border-[var(--line)] rounded-lg overflow-hidden relative block"
                  >
                    {displayImage ? (
                      <Image
                        src={displayImage}
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
                      {c.name}
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
                        {c.bestOfferWei ? (Number(c.bestOfferWei) / 1e18).toFixed(3) : '0.000'} <small className="text-[10px] text-[var(--muted)]">ETH</small>
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
              );
            })}
          </div>
        )}
      </div>

      <div className="space-y-4 pt-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold tracking-tight text-[var(--text)] flex items-center gap-2">
              <span>Markets Overview</span>
              <span className="text-xs text-[var(--muted)] font-mono font-normal">
                {String(filteredCollections.length).padStart(2, '0')}
              </span>
            </h2>
            <p className="text-xs text-[var(--muted)] mt-0.5">
              Instant liquidity with zero price oracle liquidation risk.
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

            <Link
              href="/explore"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[var(--line)] bg-[var(--panel)] hover:bg-[var(--surface)] text-[var(--text)] text-xs font-medium transition-colors ml-2"
            >
              <span>Explore All</span>
              <span>↗</span>
            </Link>
          </div>
        </div>

        <MarketsTable collections={filteredCollections} isLoading={isLoadingCollections} />
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
              className={`text-xs font-medium py-1 px-3 rounded-md transition-colors cursor-pointer border ${
                loanMarketTab === 'offers'
                  ? 'bg-[var(--surface)] text-[var(--text)] border-[var(--line)] shadow-xs'
                  : 'text-[var(--muted)] hover:text-[var(--text)] border-transparent'
              }`}
            >
              Available offers
            </button>
            <button
              onClick={() => setLoanMarketTab('active')}
              className={`text-xs font-medium py-1 px-3 rounded-md transition-colors cursor-pointer border ${
                loanMarketTab === 'active'
                  ? 'bg-[var(--surface)] text-[var(--text)] border-[var(--line)] shadow-xs'
                  : 'text-[var(--muted)] hover:text-[var(--text)] border-transparent'
              }`}
            >
              My active loans
            </button>
          </div>

          <span className="text-xs font-mono text-[var(--accent-primary)]">ETH</span>
        </div>

        <div className="space-y-2">
          {filteredCollections.map((c) => {
            const principalEth = c.bestOfferWei ? (Number(c.bestOfferWei) / 1e18).toFixed(3) : '0.000';
            const interestPct = 5.0;
            const repayEth = (Number(principalEth) * (1 + interestPct / 100)).toFixed(3);
            const displayImage = c.imageUrl || resolveCollectionImageUrl(c.name);

            return (
              <div
                key={c.address}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 bg-[var(--surface)] border border-[var(--line)] hover:border-[var(--line-strong)] rounded-xl transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-md bg-[var(--panel)] border border-[var(--line)] overflow-hidden flex items-center justify-center shrink-0">
                    {displayImage ? (
                      <Image
                        src={displayImage}
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
                      {c.name}
                    </div>
                    <div className="text-[10px] text-[var(--muted)] font-mono">{c.symbol}</div>
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
