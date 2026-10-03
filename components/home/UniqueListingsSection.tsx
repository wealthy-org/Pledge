'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { NftImage } from '@/components/nft/NftImage';
import { Tooltip } from '@/components/common/Tooltip';
import { Skeleton } from '@/components/ui/Skeleton';

export interface UniqueListingItem {
  id: string;
  collectionAddress: string;
  collectionName: string;
  tokenId: string;
  imageUrl?: string;
  floorPriceEth: string;
  bestOfferEth: string;
  status: 'floor' | 'lower_price' | 'in_loan' | 'off_market';
  isVerified?: boolean;
  durationDays?: number;
  termInterestBps?: number;
}

export interface UniqueListingsSectionProps {
  items?: UniqueListingItem[];
  isLoading?: boolean;
}

type FilterChip = 'all' | 'floor' | 'lower_price' | 'in_loan' | 'off_market';

export function UniqueListingsSection({
  items = [],
  isLoading = false,
}: UniqueListingsSectionProps) {
  const [selectedChip, setSelectedChip] = useState<FilterChip>('all');
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const checkScrollBounds = () => {
    if (!scrollRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
    setCanScrollLeft(scrollLeft > 4);
    setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 4);
  };

  useEffect(() => {
    checkScrollBounds();
  }, [items, selectedChip, isLoading]);

  const handleScroll = (direction: 'left' | 'right') => {
    if (!scrollRef.current) return;
    const offset = direction === 'left' ? -300 : 300;
    scrollRef.current.scrollBy({ left: offset, behavior: 'smooth' });
    setTimeout(checkScrollBounds, 300);
  };

  const filteredItems = items.filter((item) => {
    if (selectedChip === 'all') return true;
    return item.status === selectedChip;
  });

  return (
    <section className="space-y-4 pt-1" aria-label="Unique Listings">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <h2 className="text-base sm:text-lg font-semibold tracking-tight text-[var(--text)]">
            Unique Listings
          </h2>
          <Tooltip content="Curated individual NFT loan listings ready for instant execution." />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5 p-1 rounded-lg bg-[var(--surface)] border border-[var(--line)]">
            <button
              type="button"
              onClick={() => setSelectedChip('all')}
              className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors cursor-pointer select-none ${
                selectedChip === 'all'
                  ? 'bg-[var(--line)] text-[var(--text)] font-semibold shadow-xs'
                  : 'text-[var(--muted)] hover:text-[var(--text)]'
              }`}
            >
              All
            </button>
            <button
              type="button"
              onClick={() => setSelectedChip('floor')}
              className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors cursor-pointer select-none ${
                selectedChip === 'floor'
                  ? 'bg-[var(--line)] text-[var(--text)] font-semibold shadow-xs'
                  : 'text-[var(--muted)] hover:text-[var(--text)]'
              }`}
            >
              Floor
            </button>
            <button
              type="button"
              onClick={() => setSelectedChip('lower_price')}
              className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors cursor-pointer select-none ${
                selectedChip === 'lower_price'
                  ? 'bg-[var(--line)] text-[var(--text)] font-semibold shadow-xs'
                  : 'text-[var(--muted)] hover:text-[var(--text)]'
              }`}
            >
              Lower Price
            </button>
            <button
              type="button"
              onClick={() => setSelectedChip('in_loan')}
              className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors cursor-pointer select-none ${
                selectedChip === 'in_loan'
                  ? 'bg-[var(--line)] text-[var(--text)] font-semibold shadow-xs'
                  : 'text-[var(--muted)] hover:text-[var(--text)]'
              }`}
            >
              In Loan
            </button>
            <button
              type="button"
              onClick={() => setSelectedChip('off_market')}
              className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors cursor-pointer select-none ${
                selectedChip === 'off_market'
                  ? 'bg-[var(--line)] text-[var(--text)] font-semibold shadow-xs'
                  : 'text-[var(--muted)] hover:text-[var(--text)]'
              }`}
            >
              Off-Market
            </button>
          </div>

          <div className="flex items-center gap-1.5 ml-auto">
            <button
              type="button"
              onClick={() => handleScroll('left')}
              disabled={!canScrollLeft}
              aria-label="Scroll listings left"
              className="w-8 h-8 rounded-lg border border-[var(--line)] bg-[var(--surface)] text-[var(--text)] hover:bg-[var(--line)] disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center transition-colors cursor-pointer"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <button
              type="button"
              onClick={() => handleScroll('right')}
              disabled={!canScrollRight}
              aria-label="Scroll listings right"
              className="w-8 h-8 rounded-lg border border-[var(--line)] bg-[var(--surface)] text-[var(--text)] hover:bg-[var(--line)] disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center transition-colors cursor-pointer"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center gap-4 overflow-x-hidden py-1">
          {[1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              data-testid="nft-card-skeleton"
              className="w-[230px] shrink-0 p-3 rounded-xl border border-[var(--line)] bg-[var(--surface)] space-y-3"
            >
              <Skeleton width="100%" height="204px" borderRadius="8px" />
              <div className="space-y-1.5">
                <Skeleton width="140px" height="14px" />
                <Skeleton width="90px" height="12px" />
              </div>
              <div className="grid grid-cols-2 gap-2 pt-1">
                <Skeleton width="100%" height="32px" borderRadius="6px" />
                <Skeleton width="100%" height="32px" borderRadius="6px" />
              </div>
            </div>
          ))}
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="p-8 rounded-xl border border-dashed border-[var(--line)] bg-[var(--surface)] text-center text-xs text-[var(--muted)]">
          No listings match the selected category filter.
        </div>
      ) : (
        <div
          ref={scrollRef}
          onScroll={checkScrollBounds}
          className="flex items-center gap-4 overflow-x-auto no-scrollbar scroll-smooth snap-x py-1"
        >
          {filteredItems.map((item) => (
            <div
              key={item.id}
              className="group w-[230px] shrink-0 snap-start p-3 rounded-xl border border-[var(--line)] bg-[var(--surface)] hover:border-[var(--muted)]/50 transition-all shadow-xs flex flex-col justify-between"
            >
              <div className="space-y-2.5">
                <div className="relative w-full aspect-square rounded-lg overflow-hidden bg-[var(--panel)]">
                  <NftImage
                    src={item.imageUrl}
                    contractAddress={item.collectionAddress}
                    tokenId={item.tokenId}
                    alt={`${item.collectionName} #${item.tokenId}`}
                    className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-300"
                  />
                  <div className="absolute top-2 left-2 flex items-center gap-1">
                    {item.status === 'in_loan' ? (
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-sky-500/90 text-white shadow-xs tracking-wider uppercase">
                        In Loan
                      </span>
                    ) : item.status === 'floor' ? (
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-500/90 text-white shadow-xs tracking-wider uppercase">
                        Floor
                      </span>
                    ) : item.status === 'lower_price' ? (
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-violet-500/90 text-white shadow-xs tracking-wider uppercase">
                        Lower Price
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-black/60 backdrop-blur-xs text-white/80">
                        Off-Market
                      </span>
                    )}
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="flex items-center gap-1.5 text-xs text-[var(--muted)]">
                    <span className="truncate max-w-[150px]">{item.collectionName}</span>
                    {item.isVerified && (
                      <span className="text-emerald-500 text-[11px]" title="Verified Collection">
                        ✓
                      </span>
                    )}
                  </div>
                  <div className="text-sm font-semibold text-[var(--text)] flex items-center justify-between">
                    <span>#{item.tokenId}</span>
                    <span className="font-mono text-xs text-emerald-600 dark:text-emerald-400">
                      {item.bestOfferEth} ETH
                    </span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-3 mt-2 border-t border-[var(--line)]">
                <Link
                  href={`/borrow?collection=${item.collectionAddress}`}
                  className="py-1.5 px-2 text-center text-xs font-semibold rounded-lg bg-[var(--lime)] hover:bg-[#076b4d] text-white transition-colors shadow-xs"
                >
                  Borrow
                </Link>
                <Link
                  href={`/lend?collection=${item.collectionAddress}`}
                  className="py-1.5 px-2 text-center text-xs font-medium rounded-lg border border-[var(--line)] bg-[var(--panel)] hover:bg-[var(--line)] text-[var(--text)] transition-colors"
                >
                  Offer
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
