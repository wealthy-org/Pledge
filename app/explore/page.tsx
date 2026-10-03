'use client';

import React, { useState, Suspense } from 'react';
import Link from 'next/link';
import { useSafeChainId } from '@/hooks/useSafeChainId';
import { useExploreCollections } from '@/hooks/api/useExploreCollections';
import { ExploreFilters } from '@/components/explore/ExploreFilters';
import { ExploreGrid } from '@/components/explore/ExploreGrid';
import { Button } from '@/components/ui/Button';

function ExploreContent() {
  const chainId = useSafeChainId();
  const [search, setSearch] = useState('');
  const [hasOffersOnly, setHasOffersOnly] = useState(false);

  const { data, isLoading, isError, error, refetch } = useExploreCollections({
    chainId,
    search,
    hasOffers: hasOffersOnly,
  });

  const collections = data?.collections || [];

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
              Jelajahi seluruh koleksi ERC-721 yang terindeks di Robinhood Chain, pantau likuiditas, dan buat penawaran pinjaman P2P.
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
            <strong>Keamanan Koleksi Terbuka:</strong> Pastikan Anda selalu memeriksa alamat smart contract resmi untuk mencegah peniruan nama atau gambar koleksi.
          </span>
        </div>
      </div>

      <ExploreFilters
        search={search}
        onSearchChange={setSearch}
        hasOffersOnly={hasOffersOnly}
        onToggleHasOffers={setHasOffersOnly}
        totalCount={data?.total || collections.length}
      />

      {isError ? (
        <div className="p-8 border border-dashed border-red-200 dark:border-red-900/40 rounded-xl text-center bg-red-50/50 dark:bg-red-950/10 space-y-3">
          <h3 className="text-sm font-semibold text-[var(--text)]">Gagal memuat katalog koleksi</h3>
          <p className="text-xs text-[var(--muted)]">
            {error instanceof Error ? error.message : 'Terjadi kendala saat menghubungi Blockscout Indexer API.'}
          </p>
          <Button onClick={() => refetch()} size="sm" variant="secondary">
            Coba Lagi
          </Button>
        </div>
      ) : (
        <ExploreGrid collections={collections} isLoading={isLoading} />
      )}
    </div>
  );
}

export default function ExplorePage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-xs font-mono text-[var(--muted)]">Memuat Katalog Explore...</div>}>
      <ExploreContent />
    </Suspense>
  );
}
