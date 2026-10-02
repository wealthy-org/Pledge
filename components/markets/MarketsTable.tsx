'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { formatUnits } from 'viem';
import { Skeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';

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
  const [sortField, setSortField] = useState<SortField>('poolSize');
  const [watchlist, setWatchlist] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<'all' | 'watchlist'>('all');

  const toggleWatchlist = (addr: string) => {
    setWatchlist((prev) =>
      prev.includes(addr) ? prev.filter((a) => a !== addr) : [...prev, addr]
    );
  };

  const filteredAndSorted = useMemo(() => {
    let list = [...collections];
    if (activeTab === 'watchlist') {
      list = list.filter((c) => watchlist.includes(c.address));
    }

    return list.sort((a, b) => {
      if (sortField === 'bestOffer') {
        const valA = BigInt(a.bestOfferWei || '0');
        const valB = BigInt(b.bestOfferWei || '0');
        return valB > valA ? 1 : -1;
      }
      if (sortField === 'offerCount') {
        return b.offerCount - a.offerCount;
      }
      const poolA = BigInt(a.poolSizeWei || '0');
      const poolB = BigInt(b.poolSizeWei || '0');
      if (poolB !== poolA) {
        return poolB > poolA ? 1 : -1;
      }
      return b.offerCount - a.offerCount;
    });
  }, [collections, activeTab, watchlist, sortField]);

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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-[#e1e8e9]">
        <div className="flex items-center gap-2">
          <div className="bg-[#f3f5f4] p-[3px] rounded-[7px] flex gap-1">
            <button
              onClick={() => setActiveTab('all')}
              className={`text-[11px] font-medium py-1.5 px-3 rounded-[5px] transition-all cursor-pointer ${
                activeTab === 'all'
                  ? 'bg-white text-[#174732] border border-[#e3e9e6] shadow-[0_1px_3px_rgba(25,63,41,0.06)]'
                  : 'text-[#607169] hover:text-[#174732]'
              }`}
            >
              All markets <span className="text-[10px] text-[#64777a] ml-1">{collections.length}</span>
            </button>
            <button
              onClick={() => setActiveTab('watchlist')}
              className={`text-[11px] font-medium py-1.5 px-3 rounded-[5px] transition-all cursor-pointer ${
                activeTab === 'watchlist'
                  ? 'bg-white text-[#174732] border border-[#e3e9e6] shadow-[0_1px_3px_rgba(25,63,41,0.06)]'
                  : 'text-[#607169] hover:text-[#174732]'
              }`}
            >
              Watchlist <span className="text-[10px] text-[#64777a] ml-1">{watchlist.length}</span>
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2 text-[11px] text-[var(--muted)]">
          <span>Sort by</span>
          <select
            value={sortField}
            onChange={(e) => setSortField(e.target.value as SortField)}
            className="text-[11px] bg-white border border-[#e1e8e9] rounded-[6px] px-2.5 py-1 text-[#142d2b] focus:outline-hidden focus:border-[var(--lime)] cursor-pointer"
          >
            <option value="poolSize">Total liquidity</option>
            <option value="bestOffer">Highest loan</option>
            <option value="offerCount">Most active</option>
          </select>
        </div>
      </div>

      {filteredAndSorted.length === 0 ? (
        <div className="p-8 border border-dashed border-[#e1e8e9] rounded-xl text-center text-[#627478]">
          <EmptyState
            title={activeTab === 'watchlist' ? 'Your watchlist is empty' : 'No collections match your filter'}
            description={activeTab === 'watchlist' ? 'Star a collection to save it to your personal watchlist.' : 'Try changing your filter settings.'}
          />
        </div>
      ) : (
        <div className="w-full overflow-x-auto">
          <table className="w-full text-left border-collapse whitespace-nowrap">
            <thead>
              <tr className="border-b border-[#e1e8e9] text-[10px] font-medium text-[#617378] select-none">
                <th scope="col" className="py-2.5 px-3">#</th>
                <th scope="col" className="py-2.5 px-3">Collection</th>
                <th scope="col" className="py-2.5 px-3">Best Offer</th>
                <th scope="col" className="py-2.5 px-3">Pool Size</th>
                <th scope="col" className="py-2.5 px-3">Offers</th>
                <th scope="col" className="py-2.5 px-3">LTV</th>
                <th scope="col" className="py-2.5 px-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredAndSorted.map((c, index) => {
                const isStarred = watchlist.includes(c.address);

                return (
                  <tr
                    key={c.address}
                    className="border-b border-[#e8eded] hover:bg-[#f0f7f7] transition-colors"
                  >
                    <td className="py-3.5 px-3 text-[11px] font-mono text-[#718781]">
                      {index + 1}
                    </td>

                    <td className="py-3.5 px-3">
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() => toggleWatchlist(c.address)}
                          aria-label={isStarred ? 'Remove from watchlist' : 'Add to watchlist'}
                          className={`text-sm cursor-pointer transition-colors ${
                            isStarred ? 'text-[var(--lime)]' : 'text-[#718781] hover:text-[var(--lime)]'
                          }`}
                        >
                          {isStarred ? '★' : '☆'}
                        </button>

                        <div className="w-10 h-10 rounded-[8px] bg-[#f4f7f5] border border-[#dee7e3] overflow-hidden flex items-center justify-center shrink-0">
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
                            <span className="font-mono font-bold text-xs text-[#214e3b]">
                              {c.symbol.slice(0, 2)}
                            </span>
                          )}
                        </div>

                        <div>
                          <Link
                            href={`/collection/${c.address}`}
                            className="text-xs font-semibold text-[#142d2b] hover:text-[var(--lime)] transition-colors flex items-center gap-1"
                          >
                            <span>{c.name}</span>
                            <span className="text-[11px] text-[#1b8a62] font-bold" title="Curated pool">
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
                      <span className="font-mono font-medium text-xs text-[#184b3b]">
                        {formatEthValue(c.bestOfferWei)}
                      </span>
                    </td>

                    <td className="py-3.5 px-3">
                      <span className="font-mono font-medium text-xs text-[#142d2b]">
                        {formatEthValue(c.poolSizeWei)}
                      </span>
                    </td>

                    <td className="py-3.5 px-3 text-xs text-[#142d2b]">
                      <span className="font-mono">{c.offerCount}</span>
                    </td>

                    <td className="py-3.5 px-3 text-[#087f5b] font-medium text-xs">
                      {c.maxLtvBps ? `${(c.maxLtvBps / 100).toFixed(0)}%` : '70%'}
                    </td>

                    <td className="py-3.5 px-3 text-right">
                      <Link
                        href={`/borrow?collection=${c.address}`}
                        className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-[6px] border border-[#e1e8e9] bg-white hover:bg-[#eef5fb] hover:border-[#c4dcee] text-[#286a9b] text-[11px] font-semibold transition-all shadow-xs"
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

          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between text-[10px] text-[#667d7a] pt-3 pb-6 gap-2">
            <span>Showing {filteredAndSorted.length} verified markets · Fixed rate lending escrow</span>
            <span className="font-mono">ETH denominated</span>
          </div>
        </div>
      )}
    </div>
  );
}
