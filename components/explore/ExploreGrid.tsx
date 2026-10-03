'use client';

import React from 'react';
import Link from 'next/link';
import { ExploreCard } from './ExploreCard';
import { EmptyState } from '@/components/ui/EmptyState';
import { Skeleton } from '@/components/ui/Skeleton';
import { NftImage } from '@/components/nft/NftImage';
import { formatUnits } from 'viem';
import type { ExploreCollectionItem } from '@/types/api';
import type { ExploreViewMode } from './ExploreFilters';

export interface ExploreGridProps {
  collections: ExploreCollectionItem[];
  isLoading?: boolean;
  viewMode?: ExploreViewMode;
}

export function ExploreGrid({
  collections,
  isLoading = false,
  viewMode = 'grid',
}: ExploreGridProps) {
  if (isLoading) {
    if (viewMode === 'table') {
      return (
        <div className="w-full overflow-x-auto rounded-xl border border-[var(--line)] bg-[var(--surface)]">
          <table className="w-full text-left border-collapse whitespace-nowrap">
            <thead>
              <tr className="border-b border-[var(--line)] text-[11px] font-medium text-[var(--muted)]">
                <th className="py-3 px-3">#</th>
                <th className="py-3 px-3">Collection</th>
                <th className="py-3 px-3">Best Offer</th>
                <th className="py-3 px-3">Pool Liquidity</th>
                <th className="py-3 px-3">Offers</th>
                <th className="py-3 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {[1, 2, 3, 4, 5].map((i) => (
                <tr key={i} className="border-b border-[var(--line)] h-[64px]">
                  <td className="py-3 px-3"><Skeleton width="16px" height="14px" /></td>
                  <td className="py-3 px-3">
                    <div className="flex items-center gap-3">
                      <Skeleton width="40px" height="40px" borderRadius="8px" />
                      <div className="space-y-1">
                        <Skeleton width="130px" height="14px" />
                        <Skeleton width="60px" height="10px" />
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-3"><Skeleton width="70px" height="14px" /></td>
                  <td className="py-3 px-3"><Skeleton width="70px" height="14px" /></td>
                  <td className="py-3 px-3"><Skeleton width="35px" height="14px" /></td>
                  <td className="py-3 px-3 text-right">
                    <div className="flex justify-end gap-2">
                      <Skeleton width="64px" height="30px" borderRadius="6px" />
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
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div
            key={i}
            data-testid="explore-skeleton-card"
            className="p-4 rounded-xl bg-[var(--surface)] border border-[var(--line)] space-y-4"
          >
            <div className="flex items-center gap-3">
              <Skeleton width="48px" height="48px" borderRadius="8px" />
              <div className="space-y-1.5 flex-1">
                <Skeleton width="140px" height="14px" />
                <Skeleton width="80px" height="11px" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-[var(--line)]">
              <div className="space-y-1">
                <Skeleton width="50px" height="10px" />
                <Skeleton width="70px" height="14px" />
              </div>
              <div className="space-y-1">
                <Skeleton width="65px" height="10px" />
                <Skeleton width="70px" height="14px" />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2 border-t border-[var(--line)]">
              <Skeleton width="64px" height="28px" borderRadius="6px" />
              <Skeleton width="64px" height="28px" borderRadius="6px" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (collections.length === 0) {
    return (
      <div className="p-12 rounded-xl border border-[var(--line)] bg-[var(--surface)] text-center">
        <EmptyState
          title="No Collections Found"
          description="Try adjusting your search query or disable the 'Active Offers Only' filter to see all indexed collections."
        />
      </div>
    );
  }

  if (viewMode === 'table') {
    return (
      <div className="w-full overflow-x-auto rounded-xl border border-[var(--line)] bg-[var(--surface)]">
        <table className="w-full text-left border-collapse whitespace-nowrap">
          <thead>
            <tr className="border-b border-[var(--line)] text-[11px] font-medium text-[var(--muted)]">
              <th scope="col" className="py-3 px-3">#</th>
              <th scope="col" className="py-3 px-3">Collection</th>
              <th scope="col" className="py-3 px-3">Best Offer</th>
              <th scope="col" className="py-3 px-3">Pool Liquidity</th>
              <th scope="col" className="py-3 px-3">Offers</th>
              <th scope="col" className="py-3 px-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {collections.map((c, index) => {
              const bestEth = c.bestOfferWei
                ? `${Number(formatUnits(BigInt(c.bestOfferWei), 18)).toFixed(2)} ETH`
                : '—';
              const poolEth = c.poolSizeWei && c.poolSizeWei !== '0'
                ? `${Number(formatUnits(BigInt(c.poolSizeWei), 18)).toFixed(2)} ETH`
                : '—';

              return (
                <tr
                  key={c.address}
                  className="border-b border-[var(--line)] hover:bg-[var(--panel)] transition-colors"
                >
                  <td className="py-3 px-3 text-[11px] font-mono text-[var(--muted)]">
                    {index + 1}
                  </td>
                  <td className="py-3 px-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg overflow-hidden border border-[var(--line)] bg-[var(--panel)] shrink-0">
                        <NftImage
                          src={c.imageUrl}
                          contractAddress={c.address}
                          alt={c.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div>
                        <Link
                          href={`/collection/${c.address}`}
                          className="text-xs font-semibold text-[var(--text)] hover:text-[var(--lime)] transition-colors flex items-center gap-1.5"
                        >
                          <span>{c.name}</span>
                          {c.isVerifiedErc721 && (
                            <span className="text-emerald-500 text-[10px]">✓</span>
                          )}
                        </Link>
                        <span className="text-[10px] font-mono text-[var(--muted)]">
                          {c.symbol}
                        </span>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-3 font-mono text-xs font-semibold text-sky-600 dark:text-sky-400">
                    {bestEth}
                  </td>
                  <td className="py-3 px-3 font-mono text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                    {poolEth}
                  </td>
                  <td className="py-3 px-3 font-mono text-xs text-[var(--muted)]">
                    {c.offerCount || 0}
                  </td>
                  <td className="py-3 px-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Link
                        href={`/borrow?collection=${c.address}`}
                        className="px-2.5 py-1 text-xs font-semibold rounded-md bg-sky-500/10 hover:bg-sky-500 hover:text-white text-sky-600 dark:text-sky-400 border border-sky-500/30 transition-colors"
                      >
                        Borrow
                      </Link>
                      <Link
                        href={`/lend?collection=${c.address}`}
                        className="px-2.5 py-1 text-xs font-semibold rounded-md bg-emerald-500/10 hover:bg-emerald-500 hover:text-white text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 transition-colors"
                      >
                        Lend +
                      </Link>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {collections.map((collection) => (
        <ExploreCard key={collection.address} collection={collection} />
      ))}
    </div>
  );
}
