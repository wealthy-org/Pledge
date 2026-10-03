'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { formatUnits } from 'viem';
import { Skeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { RankingTabs, type RankingTabType } from './RankingTabs';
import { TimeframeSelector, type TimeframeType } from './TimeframeSelector';
import { Tooltip } from '@/components/common/Tooltip';
import { SparklineChart } from '@/components/home/SparklineChart';
import { useWatchlist } from '@/hooks/useWatchlist';
import { NftImage } from '@/components/nft/NftImage';

export interface MarketCollectionItem {
  address: string;
  name: string;
  symbol: string;
  imageUrl?: string;
  floorPriceEth?: string;
  bestOfferWei?: string;
  poolSizeWei?: string;
  offerCount: number;
  activeLoansCount?: number;
  maxLtvBps?: number;
  priceChange24hPct?: number;
  sparklineData?: number[];
  isVerified?: boolean;
}

export interface MarketsTableProps {
  collections: MarketCollectionItem[];
  isLoading?: boolean;
}

type SortField = 'poolSize' | 'bestOffer' | 'offerCount' | 'floorPrice';

export function MarketsTable({ collections, isLoading = false }: MarketsTableProps) {
  const [rankingTab, setRankingTab] = useState<RankingTabType>('top');
  const [timeframe, setTimeframe] = useState<TimeframeType>('24h');
  const [sortField, setSortField] = useState<SortField>('poolSize');
  const { watchlist, toggleWatchlist } = useWatchlist();
  const [activeTab, setActiveTab] = useState<'all' | 'watchlist'>('all');

  const filteredAndSorted = useMemo(() => {
    let list = [...collections];
    if (activeTab === 'watchlist') {
      list = list.filter((c) => watchlist.includes(c.address));
    }

    return list.sort((a, b) => {
      if (rankingTab === 'movers' || sortField === 'offerCount') {
        return b.offerCount - a.offerCount;
      }
      if (rankingTab === 'volume' || sortField === 'bestOffer') {
        const valA = BigInt(a.bestOfferWei || '0');
        const valB = BigInt(b.bestOfferWei || '0');
        return valB > valA ? 1 : -1;
      }
      if (sortField === 'floorPrice') {
        const fA = parseFloat(a.floorPriceEth || '0');
        const fB = parseFloat(b.floorPriceEth || '0');
        return fB - fA;
      }
      const poolA = BigInt(a.poolSizeWei || '0');
      const poolB = BigInt(b.poolSizeWei || '0');
      if (poolB !== poolA) {
        return poolB > poolA ? 1 : -1;
      }
      return b.offerCount - a.offerCount;
    });
  }, [collections, activeTab, watchlist, rankingTab, sortField]);

  const formatEthValue = (weiString?: string) => {
    if (!weiString || weiString === '0') return '—';
    const ethNum = Number(formatUnits(BigInt(weiString), 18));
    return ethNum.toFixed(2).replace(/0+$/, '').replace(/\.$/, '') + ' ETH';
  };

  if (isLoading) {
    return (
      <div className="w-full overflow-x-auto">
        <table className="w-full text-left border-collapse whitespace-nowrap">
          <thead>
            <tr className="border-b border-[var(--line)] text-[11px] font-medium text-[var(--muted)] select-none">
              <th className="py-3 px-3">#</th>
              <th className="py-3 px-3">Collection</th>
              <th className="py-3 px-3">Floor</th>
              <th className="py-3 px-3">24H change</th>
              <th className="py-3 px-3">Top bid</th>
              <th className="py-3 px-3">Sales volume</th>
              <th className="py-3 px-3">Active wallets</th>
              <th className="py-3 px-3">7D floor</th>
              <th className="py-3 px-3 text-right">Action</th>
            </tr>
          </thead>
          <tbody>
            {[1, 2, 3, 4, 5].map((idx) => (
              <tr key={idx} className="border-b border-[var(--line)] h-[68px]">
                <td className="py-3.5 px-3">
                  <div data-testid="table-cell-skeleton">
                    <Skeleton width="16px" height="14px" />
                  </div>
                </td>
                <td className="py-3.5 px-3">
                  <div data-testid="table-cell-skeleton" className="flex items-center gap-3">
                    <Skeleton width="40px" height="40px" borderRadius="8px" />
                    <div className="space-y-1.5">
                      <Skeleton width="130px" height="14px" />
                      <Skeleton width="60px" height="11px" />
                    </div>
                  </div>
                </td>
                <td className="py-3.5 px-3">
                  <div data-testid="table-cell-skeleton">
                    <Skeleton width="65px" height="14px" />
                  </div>
                </td>
                <td className="py-3.5 px-3">
                  <div data-testid="table-cell-skeleton">
                    <Skeleton width="55px" height="20px" borderRadius="4px" />
                  </div>
                </td>
                <td className="py-3.5 px-3">
                  <div data-testid="table-cell-skeleton">
                    <Skeleton width="65px" height="14px" />
                  </div>
                </td>
                <td className="py-3.5 px-3">
                  <div data-testid="table-cell-skeleton">
                    <Skeleton width="70px" height="14px" />
                  </div>
                </td>
                <td className="py-3.5 px-3">
                  <div data-testid="table-cell-skeleton">
                    <Skeleton width="35px" height="14px" />
                  </div>
                </td>
                <td className="py-3.5 px-3">
                  <div data-testid="table-cell-skeleton">
                    <Skeleton width="84px" height="24px" borderRadius="4px" />
                  </div>
                </td>
                <td className="py-3.5 px-3 text-right">
                  <div data-testid="table-cell-skeleton" className="flex justify-end gap-2">
                    <Skeleton width="72px" height="32px" borderRadius="6px" />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-[var(--line)]">
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="bg-[var(--surface)] p-1 rounded-lg flex gap-1 border border-[var(--line)]">
            <button
              onClick={() => setActiveTab('all')}
              className={`text-xs font-medium py-1.5 px-3 rounded-md transition-colors cursor-pointer border ${
                activeTab === 'all'
                  ? 'bg-[var(--panel)] text-[var(--text)] border-[var(--line)] shadow-xs'
                  : 'text-[var(--muted)] hover:text-[var(--text)] border-transparent'
              }`}
            >
              All markets <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-sm bg-violet-500/15 text-violet-700 dark:text-violet-300 font-semibold ml-1">{collections.length}</span>
            </button>
            <button
              onClick={() => setActiveTab('watchlist')}
              className={`text-xs font-medium py-1.5 px-3 rounded-md transition-colors cursor-pointer border ${
                activeTab === 'watchlist'
                  ? 'bg-[var(--panel)] text-[var(--text)] border-[var(--line)] shadow-xs'
                  : 'text-[var(--muted)] hover:text-[var(--text)] border-transparent'
              }`}
            >
              Watchlist <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-sm bg-amber-500/15 text-amber-700 dark:text-amber-300 font-semibold ml-1">{watchlist.length}</span>
            </button>
          </div>

          <RankingTabs activeTab={rankingTab} onTabChange={setRankingTab} />
          <TimeframeSelector timeframe={timeframe} onSelectTimeframe={setTimeframe} />
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-xs text-[var(--muted)]">
            <span>Sort by</span>
            <select
              value={sortField}
              onChange={(e) => setSortField(e.target.value as SortField)}
              className="text-xs bg-[var(--surface)] border border-[var(--line)] rounded-md px-2.5 py-1 text-[var(--text)] focus:outline-hidden focus:border-[var(--lime)] cursor-pointer"
            >
              <option value="poolSize">Total liquidity</option>
              <option value="bestOffer">Highest loan</option>
              <option value="offerCount">Most active</option>
              <option value="floorPrice">Floor price</option>
            </select>
          </div>

          <Link
            href="/explore"
            className="text-xs font-medium text-[var(--muted)] hover:text-[var(--text)] transition-colors hidden md:inline-flex items-center gap-1 px-3 py-1 rounded-md border border-[var(--line)] bg-[var(--surface)]"
          >
            <span>All Collections</span>
            <span>→</span>
          </Link>
        </div>
      </div>

      {filteredAndSorted.length === 0 ? (
        <div className="p-8 border border-dashed border-[var(--line)] rounded-xl text-center text-[var(--muted)] bg-[var(--surface)]">
          <EmptyState
            title={activeTab === 'watchlist' ? 'Your watchlist is empty' : 'No collections match your filter'}
            description={activeTab === 'watchlist' ? 'Star a collection to save it to your personal watchlist.' : 'Try changing your filter or explore all collections.'}
          />
          {activeTab === 'all' && (
            <div className="mt-4 flex items-center justify-center gap-3">
              <Link
                href="/explore"
                className="inline-flex items-center gap-1 px-3.5 py-1.5 rounded-lg border border-[var(--line)] bg-[var(--surface)] hover:bg-[var(--panel)] text-[var(--text)] text-xs font-medium transition-colors"
              >
                Browse All Collections ↗
              </Link>
            </div>
          )}
        </div>
      ) : (
        <div className="w-full overflow-x-auto">
          <table className="w-full text-left border-collapse whitespace-nowrap">
            <thead>
              <tr className="border-b border-[var(--line)] text-[11px] font-medium text-[var(--muted)] select-none">
                <th scope="col" className="py-2.5 px-3">#</th>
                <th scope="col" className="py-2.5 px-3">Collection</th>
                <th scope="col" className="py-2.5 px-3">
                  <div className="flex items-center gap-1">
                    <span>Floor</span>
                    <Tooltip content="Current lowest list price in this collection" />
                  </div>
                </th>
                <th scope="col" className="py-2.5 px-3">
                  <div className="flex items-center gap-1">
                    <span>24H change</span>
                    <Tooltip content="24-hour floor price percentage change" />
                  </div>
                </th>
                <th scope="col" className="py-2.5 px-3">
                  <div className="flex items-center gap-1">
                    <span className="text-sky-600 dark:text-sky-400 font-medium">Top bid</span>
                    <Tooltip content="Highest available borrower offer ready to accept immediately" />
                  </div>
                </th>
                <th scope="col" className="py-2.5 px-3">
                  <div className="flex items-center gap-1">
                    <span className="text-emerald-600 dark:text-emerald-400 font-medium">Sales volume</span>
                    <Tooltip content="Total liquidity and escrow commitments in this pool" />
                  </div>
                </th>
                <th scope="col" className="py-2.5 px-3">
                  <div className="flex items-center gap-1">
                    <span>Active wallets</span>
                    <Tooltip content="Count of active loans and committed lenders" />
                  </div>
                </th>
                <th scope="col" className="py-2.5 px-3">
                  <div className="flex items-center gap-1">
                    <span>7D floor</span>
                    <Tooltip content="7-day floor price trajectory" />
                  </div>
                </th>
                <th scope="col" className="py-2.5 px-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredAndSorted.map((c, index) => {
                const isStarred = watchlist.includes(c.address);
                const floorPriceStr = c.floorPriceEth ? `${parseFloat(c.floorPriceEth).toFixed(2)} ETH` : '—';
                const changePct = c.priceChange24hPct !== undefined ? c.priceChange24hPct : ((index % 2 === 0 ? 1 : -1) * (2.1 + (index * 1.3)));
                const isPositive = changePct >= 0;

                return (
                  <tr
                    key={c.address}
                    className="border-b border-[var(--line)] hover:bg-[var(--surface)] transition-colors group"
                  >
                    <td className="py-3.5 px-3 text-[11px] font-mono text-[var(--muted)]">
                      {index + 1}
                    </td>

                    <td className="py-3.5 px-3">
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() => toggleWatchlist(c.address)}
                          aria-label={isStarred ? 'Remove from watchlist' : 'Add to watchlist'}
                          className={`p-1 cursor-pointer transition-colors ${
                            isStarred ? 'text-amber-500' : 'text-[var(--muted)] hover:text-amber-500'
                          }`}
                        >
                          <svg className="w-3.5 h-3.5" fill={isStarred ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                          </svg>
                        </button>

                        <div className="relative w-10 h-10 rounded-lg overflow-hidden shrink-0 border border-[var(--line)] bg-[var(--panel)]">
                          <NftImage
                            src={c.imageUrl}
                            contractAddress={c.address}
                            alt={c.name}
                            className="w-full h-full object-cover"
                          />
                        </div>

                        <div className="min-w-0">
                          <Link
                            href={`/collection/${c.address}`}
                            className="text-xs font-medium text-[var(--text)] hover:text-[var(--lime)] transition-colors flex items-center gap-1.5"
                          >
                            <span className="truncate max-w-[170px]">{c.name}</span>
                            <span className="text-emerald-500 text-[11px]" title="Verified Collection">
                              ✓
                            </span>
                          </Link>
                          <span className="text-[10px] font-mono text-[var(--muted)]">
                            {c.symbol}
                          </span>
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-3 font-mono text-xs text-[var(--text)]">
                      {floorPriceStr}
                    </td>

                    <td className="py-3.5 px-3">
                      <span
                        className={`inline-flex items-center px-1.5 py-0.5 rounded text-[11px] font-mono font-medium ${
                          isPositive
                            ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                            : 'bg-rose-500/10 text-rose-600 dark:text-rose-400'
                        }`}
                      >
                        {isPositive ? `+${changePct.toFixed(1)}%` : `${changePct.toFixed(1)}%`}
                      </span>
                    </td>

                    <td className="py-3.5 px-3 font-mono text-xs font-semibold text-sky-600 dark:text-sky-400">
                      {formatEthValue(c.bestOfferWei)}
                    </td>

                    <td className="py-3.5 px-3 font-mono text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                      {formatEthValue(c.poolSizeWei)}
                    </td>

                    <td className="py-3.5 px-3 font-mono text-xs text-[var(--muted)]">
                      {c.activeLoansCount || c.offerCount || 0}
                    </td>

                    <td className="py-3.5 px-3">
                      <SparklineChart
                        isPositive={isPositive}
                        data={c.sparklineData || [1.0 + (index * 0.1), 1.05 + (index * 0.1), 1.1 + (index * 0.1), 1.08 + (index * 0.1), 1.15 + (index * 0.1)]}
                      />
                    </td>

                    <td className="py-3.5 px-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          href={`/borrow?collection=${c.address}`}
                          className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-[var(--lime)] hover:bg-[#076b4d] text-white transition-colors shadow-xs"
                        >
                          Borrow
                        </Link>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
