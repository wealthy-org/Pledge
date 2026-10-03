'use client';

import React, { useState, useMemo, Suspense } from 'react';
import Link from 'next/link';
import { useSafeChainId } from '@/hooks/useSafeChainId';
import { useUnifiedCollectionSearch } from '@/hooks/useUnifiedCollectionSearch';
import { ExploreFilters, type ExploreSortBy, type ExploreViewMode } from '@/components/explore/ExploreFilters';
import { ExploreGrid } from '@/components/explore/ExploreGrid';
import { Button } from '@/components/ui/Button';
import { Pagination } from '@/components/ui/Pagination';

const EXPLORE_PAGE_SIZE = 12;

function ExploreContent() {
  const chainId = useSafeChainId();
  const [search, setSearch] = useState('');
  const [hasOffersOnly, setHasOffersOnly] = useState(false);
  const [sortBy, setSortBy] = useState<ExploreSortBy>('volume');
  const [viewMode, setViewMode] = useState<ExploreViewMode>('grid');
  const [page, setPage] = useState(1);

  const { collections: rawCollections, isLoading, isError, error, refetch } = useUnifiedCollectionSearch({
    chainId,
    query: search,
    hasOffersOnly,
  });

  const collections = useMemo(() => {
    const list = [...rawCollections];
    return list.sort((a, b) => {
      if (sortBy === 'offers') {
        return (b.offerCount || 0) - (a.offerCount || 0);
      }
      if (sortBy === 'floor_asc') {
        const valA = parseFloat(a.floorPriceEth || '0');
        const valB = parseFloat(b.floorPriceEth || '0');
        return valA - valB;
      }
      if (sortBy === 'floor_desc') {
        const valA = parseFloat(a.floorPriceEth || '0');
        const valB = parseFloat(b.floorPriceEth || '0');
        return valB - valA;
      }
      const poolA = BigInt(a.poolSizeWei || '0');
      const poolB = BigInt(b.poolSizeWei || '0');
      if (poolB !== poolA) {
        return poolB > poolA ? 1 : -1;
      }
      return (b.offerCount || 0) - (a.offerCount || 0);
    });
  }, [rawCollections, sortBy]);

  const totalPages = Math.ceil(collections.length / EXPLORE_PAGE_SIZE);
  const paginatedCollections = useMemo(() => {
    const start = (page - 1) * EXPLORE_PAGE_SIZE;
    return collections.slice(start, start + EXPLORE_PAGE_SIZE);
  }, [collections, page]);

  const handleSearchChange = (val: string) => {
    setSearch(val);
    setPage(1);
  };

  const handleToggleHasOffers = (val: boolean) => {
    setHasOffersOnly(val);
    setPage(1);
  };

  const handleSortChange = (val: ExploreSortBy) => {
    setSortBy(val);
    setPage(1);
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2 border-b border-[var(--line)] pb-4">
        <div className="text-[10px] uppercase font-semibold tracking-wider text-violet-600 dark:text-violet-400 flex items-center gap-2">
          <span className="w-5 h-[1px] bg-violet-600 dark:bg-violet-400 inline-block" />
          <span>Open NFT Catalog · Robinhood Chain</span>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl sm:text-4xl font-normal tracking-[-1.5px] text-[#142d2b] dark:text-[#f0fdf4]">
              Explore Collections
            </h1>
            <p className="text-xs sm:text-sm text-[var(--muted)] mt-1">
              Explore indexed ERC-721 collections on Robinhood Chain, monitor liquidity, and create P2P lending offers.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <Link
              href="/borrow"
              className="px-4 py-2 text-xs font-semibold rounded-lg bg-sky-600 hover:bg-sky-500 text-white transition-colors shadow-xs"
            >
              Borrow Against NFT
            </Link>
            <Link
              href="/lend"
              className="px-4 py-2 text-xs font-semibold rounded-lg bg-emerald-500/10 hover:bg-emerald-500 hover:text-white dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 transition-colors shadow-xs"
            >
              Create Offer +
            </Link>
          </div>
        </div>
      </div>

      <div className="p-3.5 rounded-xl bg-sky-500/10 border border-sky-500/20 text-sky-800 dark:text-sky-200 text-xs flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <span className="text-base">🛡️</span>
          <span>
            <strong>Open Catalog Safety:</strong> Always verify the official smart contract address to prevent collection name or image spoofing.
          </span>
        </div>
      </div>

      <ExploreFilters
        search={search}
        onSearchChange={handleSearchChange}
        hasOffersOnly={hasOffersOnly}
        onToggleHasOffers={handleToggleHasOffers}
        sortBy={sortBy}
        onSortChange={handleSortChange}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        totalCount={collections.length}
      />

      {isError ? (
        <div className="p-8 border border-dashed border-red-200 dark:border-red-900/40 rounded-xl text-center bg-red-50/50 dark:bg-red-950/10 space-y-3">
          <h3 className="text-sm font-semibold text-[var(--text)]">Failed to load collections catalog</h3>
          <p className="text-xs text-[var(--muted)]">
            {error instanceof Error ? error.message : 'Unable to connect to the Blockscout Indexer API.'}
          </p>
          <Button onClick={() => refetch()} size="sm" variant="secondary">
            Retry Connection
          </Button>
        </div>
      ) : (
        <div className="space-y-6">
          <ExploreGrid
            collections={paginatedCollections}
            isLoading={isLoading}
            viewMode={viewMode}
          />
          {!isLoading && collections.length > 0 && (
            <Pagination
              currentPage={page}
              totalPages={totalPages}
              totalItems={collections.length}
              pageSize={EXPLORE_PAGE_SIZE}
              itemName="collections"
              onPageChange={setPage}
            />
          )}
        </div>
      )}
    </div>
  );
}

export default function ExplorePage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-xs font-mono text-[var(--muted)]">Loading Explore Catalog...</div>}>
      <ExploreContent />
    </Suspense>
  );
}
