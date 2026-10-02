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

type SortField = 'bestOffer' | 'poolSize' | 'offers';
type SortOrder = 'asc' | 'desc';

export function MarketsTable({ collections, isLoading = false }: MarketsTableProps) {
  const [sortField, setSortField] = useState<SortField>('poolSize');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  const sortedCollections = useMemo(() => {
    return [...collections].sort((a, b) => {
      let valA = 0n;
      let valB = 0n;

      if (sortField === 'bestOffer') {
        valA = BigInt(a.bestOfferWei || '0');
        valB = BigInt(b.bestOfferWei || '0');
      } else if (sortField === 'poolSize') {
        valA = BigInt(a.poolSizeWei || '0');
        valB = BigInt(b.poolSizeWei || '0');
      } else if (sortField === 'offers') {
        valA = BigInt(a.offerCount);
        valB = BigInt(b.offerCount);
      }

      if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
      if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });
  }, [collections, sortField, sortOrder]);

  const formatEthValue = (weiString?: string) => {
    if (!weiString || weiString === '0') return '—';
    const ethNum = Number(formatUnits(BigInt(weiString), 18));
    return `${ethNum.toFixed(2)} ETH`;
  };

  if (isLoading) {
    return (
      <div className="w-full overflow-x-auto rounded-2xl border border-[var(--line)] bg-[var(--surface)] shadow-[var(--shadow-subtle)]">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-[var(--line)] bg-[var(--panel)] text-[9px] uppercase tracking-[1.5px] text-[var(--muted)] font-mono">
              <th className="py-3 px-3 text-center w-[36px]">#</th>
              <th className="py-3 px-4">Collection</th>
              <th className="py-3 px-4 text-right w-[110px]">Best Offer</th>
              <th className="py-3 px-4 text-right w-[110px]">Pool Size</th>
              <th className="py-3 px-4 text-right w-[90px]">Offers</th>
              <th className="py-3 px-4 text-right w-[80px]">LTV%</th>
              <th className="py-3 px-4 text-center w-[100px]">Action</th>
            </tr>
          </thead>
          <tbody>
            {[1, 2, 3, 4].map((idx) => (
              <tr
                key={idx}
                className="h-[56px] border-b border-[#E8EDED]"
              >
                <td className="px-3 text-center">
                  <div data-testid="table-cell-skeleton" className="flex justify-center">
                    <Skeleton width="16px" height="14px" />
                  </div>
                </td>
                <td className="px-4">
                  <div data-testid="table-cell-skeleton" className="flex items-center gap-3">
                    <Skeleton width="40px" height="40px" borderRadius="8px" />
                    <div className="space-y-1">
                      <Skeleton width="140px" height="14px" />
                      <Skeleton width="60px" height="10px" />
                    </div>
                  </div>
                </td>
                <td className="px-4 text-right">
                  <div data-testid="table-cell-skeleton" className="flex justify-end">
                    <Skeleton width="70px" height="14px" />
                  </div>
                </td>
                <td className="px-4 text-right">
                  <div data-testid="table-cell-skeleton" className="flex justify-end">
                    <Skeleton width="70px" height="14px" />
                  </div>
                </td>
                <td className="px-4 text-right">
                  <div data-testid="table-cell-skeleton" className="flex justify-end">
                    <Skeleton width="40px" height="14px" />
                  </div>
                </td>
                <td className="px-4 text-right">
                  <div data-testid="table-cell-skeleton" className="flex justify-end">
                    <Skeleton width="45px" height="14px" />
                  </div>
                </td>
                <td className="px-4 text-center">
                  <div data-testid="table-cell-skeleton" className="flex justify-center">
                    <Skeleton width="80px" height="32px" borderRadius="8px" />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  if (collections.length === 0) {
    return (
      <div className="w-full rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-8">
        <EmptyState
          title="No Collections Found"
          description="There are currently no collections matching the selected filter criteria."
        />
      </div>
    );
  }

  return (
    <div className="w-full overflow-x-auto rounded-2xl border border-[var(--line)] bg-[var(--surface)] shadow-[var(--shadow-subtle)]">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="border-b border-[var(--line)] bg-[var(--panel)] text-[9px] uppercase tracking-[1.5px] text-[var(--muted)] font-mono select-none">
            <th className="py-3 px-3 text-center w-[36px]">#</th>
            <th className="py-3 px-4">Collection</th>
            <th
              onClick={() => handleSort('bestOffer')}
              className="py-3 px-4 text-right w-[110px] cursor-pointer hover:text-[var(--text)] transition-colors"
            >
              <div className="flex items-center justify-end gap-1">
                <span>Best Offer</span>
                {sortField === 'bestOffer' && <span>{sortOrder === 'asc' ? '↑' : '↓'}</span>}
              </div>
            </th>
            <th
              onClick={() => handleSort('poolSize')}
              className="py-3 px-4 text-right w-[110px] cursor-pointer hover:text-[var(--text)] transition-colors"
            >
              <div className="flex items-center justify-end gap-1">
                <span>Pool Size</span>
                {sortField === 'poolSize' && <span>{sortOrder === 'asc' ? '↑' : '↓'}</span>}
              </div>
            </th>
            <th
              onClick={() => handleSort('offers')}
              className="py-3 px-4 text-right w-[90px] cursor-pointer hover:text-[var(--text)] transition-colors"
            >
              <div className="flex items-center justify-end gap-1">
                <span>Offers</span>
                {sortField === 'offers' && <span>{sortOrder === 'asc' ? '↑' : '↓'}</span>}
              </div>
            </th>
            <th className="py-3 px-4 text-right w-[80px]">LTV%</th>
            <th className="py-3 px-4 text-center w-[100px]">Action</th>
          </tr>
        </thead>
        <tbody>
          {sortedCollections.map((col, index) => {
            const ltvDisplay = col.maxLtvBps
              ? `${(col.maxLtvBps / 100).toFixed(0)}%`
              : col.floorPriceEth && col.bestOfferWei && BigInt(col.bestOfferWei) > 0n
              ? `${((Number(formatUnits(BigInt(col.bestOfferWei), 18)) / Number(col.floorPriceEth)) * 100).toFixed(0)}%`
              : '—';

            return (
              <tr
                key={col.address}
                className="h-[56px] border-b border-[#E8EDED] hover:bg-[#F0F7F7] transition-colors"
              >
                <td className="px-3 text-center text-xs font-mono text-[var(--muted)]">
                  {index + 1}
                </td>
                <td className="px-4">
                  <Link
                    href={`/collection/${col.address}`}
                    className="flex items-center gap-3 group cursor-pointer"
                  >
                    <div className="w-10 h-10 rounded-lg overflow-hidden bg-[var(--raised)] border border-[var(--line)] shrink-0 relative">
                      {col.imageUrl ? (
                        <Image
                          src={col.imageUrl}
                          alt={col.name}
                          width={40}
                          height={40}
                          className="w-full h-full object-cover"
                          unoptimized
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center font-mono font-bold text-xs text-[var(--muted)]">
                          {col.symbol.slice(0, 2)}
                        </div>
                      )}
                    </div>
                    <div className="flex flex-col overflow-hidden">
                      <span className="text-xs font-bold text-[var(--text)] group-hover:text-[var(--primary)] transition-colors truncate">
                        {col.name}
                      </span>
                      <span className="text-[10px] font-mono text-[var(--muted)]">
                        {col.symbol}
                      </span>
                    </div>
                  </Link>
                </td>
                <td className="px-4 text-right font-mono text-xs font-semibold text-[var(--text)]">
                  {formatEthValue(col.bestOfferWei)}
                </td>
                <td className="px-4 text-right font-mono text-xs font-semibold text-[var(--primary)]">
                  {formatEthValue(col.poolSizeWei)}
                </td>
                <td className="px-4 text-right font-mono text-xs text-[var(--text)]">
                  {col.offerCount}
                </td>
                <td className="px-4 text-right font-mono text-xs text-[var(--muted)]">
                  {ltvDisplay}
                </td>
                <td className="px-4 text-center">
                  <Link
                    href={`/borrow?collection=${col.address}`}
                    className="inline-flex items-center justify-center px-4 py-1.5 rounded-lg bg-[var(--primary)] hover:bg-[var(--primary-dark)] text-white text-xs font-semibold shadow-xs transition-all cursor-pointer"
                  >
                    Borrow
                  </Link>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
