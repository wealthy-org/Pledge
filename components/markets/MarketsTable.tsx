'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { formatUnits } from 'viem';
import { Skeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { RankingTabs, type RankingTabType } from './RankingTabs';
import { TimeframeSelector, type TimeframeType } from './TimeframeSelector';
import { Tooltip } from '@/components/common/Tooltip';
import { useWatchlist } from '@/hooks/useWatchlist';
import { resolveCollectionImageUrl } from '@/lib/services/metadata';

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
}

export interface MarketsTableProps {
  collections: MarketCollectionItem[];
  isLoading?: boolean;
}

type SortField = 'poolSize' | 'bestOffer' | 'offerCount';

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
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-[#e1e8e9] text-[10px] font-medium text-[#617378] select-none">
              <th className="py-2.5 px-3">#</th>
              <th className="py-2.5 px-3">Collection</th>
              <th className="py-2.5 px-3">Best Offer</th>
              <th className="py-2.5 px-3">Pool Size</th>
              <th className="py-2.5 px-3">Offers</th>
              <th className="py-2.5 px-3">LTV</th>
              <th className="py-2.5 px-3 text-right">Action</th>
            </tr>
          </thead>
          <tbody>
            {[1, 2, 3, 4].map((idx) => (
              <tr key={idx} className="border-b border-[#e8eded] h-[64px]">
                <td className="py-3 px-3">
                  <div data-testid="table-cell-skeleton">
                    <Skeleton width="16px" height="14px" />
                  </div>
                </td>
                <td className="py-3 px-3">
                  <div data-testid="table-cell-skeleton" className="flex items-center gap-3">
                    <Skeleton width="40px" height="40px" borderRadius="8px" />
                    <div className="space-y-1">
                      <Skeleton width="120px" height="14px" />
                      <Skeleton width="60px" height="10px" />
                    </div>
                  </div>
                </td>
                <td className="py-3 px-3">
                  <div data-testid="table-cell-skeleton">
                    <Skeleton width="60px" height="14px" />
                  </div>
                </td>
                <td className="py-3 px-3">
                  <div data-testid="table-cell-skeleton">
                    <Skeleton width="60px" height="14px" />
                  </div>
                </td>
                <td className="py-3 px-3">
                  <div data-testid="table-cell-skeleton">
                    <Skeleton width="40px" height="14px" />
                  </div>
                </td>
                <td className="py-3 px-3">
                  <div data-testid="table-cell-skeleton">
                    <Skeleton width="40px" height="14px" />
                  </div>
                </td>
                <td className="py-3 px-3 text-right">
                  <div data-testid="table-cell-skeleton" className="flex justify-end">
                    <Skeleton width="80px" height="30px" borderRadius="6px" />
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-[#e1ebe6] dark:border-[#1e332c]">
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="bg-[var(--panel)] p-1 rounded-lg flex gap-1 border border-[var(--line)]">
            <button
              onClick={() => setActiveTab('all')}
              className={`text-xs font-medium py-1.5 px-3 rounded-md transition-colors cursor-pointer border ${
                activeTab === 'all'
                  ? 'bg-[var(--surface)] text-[var(--text)] border-[var(--line)] shadow-xs'
                  : 'text-[var(--muted)] hover:text-[var(--text)] border-transparent'
              }`}
            >
              All markets <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-sm bg-violet-500/15 text-violet-700 dark:text-violet-300 font-semibold ml-1">{collections.length}</span>
            </button>
            <button
              onClick={() => setActiveTab('watchlist')}
              className={`text-xs font-medium py-1.5 px-3 rounded-md transition-colors cursor-pointer border ${
                activeTab === 'watchlist'
                  ? 'bg-[var(--surface)] text-[var(--text)] border-[var(--line)] shadow-xs'
                  : 'text-[var(--muted)] hover:text-[var(--text)] border-transparent'
              }`}
            >
              Watchlist <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-sm bg-amber-500/15 text-amber-700 dark:text-amber-300 font-semibold ml-1">{watchlist.length}</span>
            </button>
          </div>

          <RankingTabs activeTab={rankingTab} onTabChange={setRankingTab} />
          <TimeframeSelector timeframe={timeframe} onSelectTimeframe={setTimeframe} />
        </div>

        <div className="flex items-center gap-2 text-xs text-[var(--muted)]">
          <span>Sort by</span>
          <select
            value={sortField}
            onChange={(e) => setSortField(e.target.value as SortField)}
            className="text-xs bg-[var(--surface)] border border-[var(--line)] rounded-md px-2.5 py-1 text-[var(--text)] focus:outline-hidden focus:border-[var(--accent-primary)] cursor-pointer"
          >
            <option value="poolSize">Total liquidity</option>
            <option value="bestOffer">Highest loan</option>
            <option value="offerCount">Most active</option>
          </select>
        </div>
      </div>

      {filteredAndSorted.length === 0 ? (
        <div className="p-8 border border-dashed border-[#e1ebe6] dark:border-[#1e332c] rounded-xl text-center text-[#627478] dark:text-[#8ca197] bg-white dark:bg-[#111a17]">
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
              <tr className="border-b border-[#e1ebe6] dark:border-[#1e332c] text-[10px] font-medium text-[#617378] dark:text-[#8ca197] select-none">
                <th scope="col" className="py-2.5 px-3">#</th>
                <th scope="col" className="py-2.5 px-3">Collection</th>
                <th scope="col" className="py-2.5 px-3">
                  <div className="flex items-center gap-1">
                    <span className="text-sky-600 dark:text-sky-400 font-medium">Best Offer</span>
                    <Tooltip content="Highest available borrower offer ready to accept immediately" />
                  </div>
                </th>
                <th scope="col" className="py-2.5 px-3">
                  <div className="flex items-center gap-1">
                    <span className="text-emerald-600 dark:text-emerald-400 font-medium">Pool Size</span>
                    <Tooltip content="Total available liquidity across all active lending offers" />
                  </div>
                </th>
                <th scope="col" className="py-2.5 px-3">Offers</th>
                <th scope="col" className="py-2.5 px-3">
                  <div className="flex items-center gap-1">
                    <span>LTV</span>
                    <Tooltip content="Max loan-to-value ratio based on collection parameters" />
                  </div>
                </th>
                <th scope="col" className="py-2.5 px-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredAndSorted.map((c, index) => {
                const isStarred = watchlist.includes(c.address);
                const ltvVal = c.maxLtvBps ? c.maxLtvBps / 100 : 70;
                const displayImage = c.imageUrl || resolveCollectionImageUrl(c.name || c.symbol);

                return (
                  <tr
                    key={c.address}
                    className="border-b border-[#e8eded] dark:border-[#182822] hover:bg-[#f0f7f5] dark:hover:bg-[#14221e] transition-colors"
                  >
                    <td className="py-3.5 px-3 text-[11px] font-mono text-[#718781] dark:text-[#8ca197]">
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
                          <svg className="w-4 h-4" viewBox="0 0 24 24" fill={isStarred ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                          </svg>
                        </button>

                        <div className="w-10 h-10 rounded-[8px] bg-[var(--panel)] border border-[var(--line)] overflow-hidden flex items-center justify-center shrink-0">
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
                            <span className="font-mono font-bold text-xs text-violet-600 dark:text-violet-400">
                              {c.symbol.slice(0, 2)}
                            </span>
                          )}
                        </div>

                        <div>
                          <Link
                            href={`/collection/${c.address}`}
                            className="text-xs font-semibold text-[var(--text)] hover:text-violet-600 dark:hover:text-violet-400 transition-colors flex items-center gap-1"
                          >
                            <span>{c.name}</span>
                            <span className="text-[11px] text-violet-600 dark:text-violet-400 font-bold" title="Verified pool">
                              ✦
                            </span>
                          </Link>
                          <div className="text-[10px] text-[var(--muted)] mt-0.5">
                            Robinhood Chain · Verified Asset
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-3">
                      <span className="font-mono font-semibold text-xs text-sky-600 dark:text-sky-400">
                        {formatEthValue(c.bestOfferWei)}
                      </span>
                    </td>

                    <td className="py-3.5 px-3">
                      <span className="font-mono font-semibold text-xs text-emerald-600 dark:text-emerald-400">
                        {formatEthValue(c.poolSizeWei)}
                      </span>
                    </td>

                    <td className="py-3.5 px-3 text-xs text-[var(--text)]">
                      <span className="font-mono font-medium">{c.offerCount}</span>
                    </td>

                    <td className="py-3.5 px-3 font-medium text-xs">
                      <span className={`font-mono font-semibold ${
                        ltvVal <= 65
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : ltvVal <= 75
                          ? 'text-amber-600 dark:text-amber-400'
                          : 'text-rose-600 dark:text-rose-400'
                      }`}>
                        {ltvVal.toFixed(0)}%
                      </span>
                    </td>

                    <td className="py-3.5 px-3 text-right">
                      <Link
                        href={`/borrow?collection=${c.address}`}
                        className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-[6px] border border-sky-500/30 bg-sky-500/10 hover:bg-sky-500 hover:text-white dark:hover:bg-sky-500 dark:hover:text-white text-sky-600 dark:text-sky-400 text-[11px] font-semibold transition-colors shadow-xs"
                      >
                        <span>Borrow</span>
                        <span>↗</span>
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between text-[10px] text-[#667d7a] dark:text-[#8ca197] pt-3 pb-6 gap-2">
            <span>Showing {filteredAndSorted.length} markets · Fixed rate lending escrow</span>
            <span className="font-mono">ETH denominated</span>
          </div>
        </div>
      )}
    </div>
  );
}
