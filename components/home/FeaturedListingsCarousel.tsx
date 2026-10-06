'use client';

import React, { useState, useRef, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { NftImage } from '@/components/nft/NftImage';
import { Skeleton } from '@/components/ui/Skeleton';
import { useWatchlist } from '@/hooks/useWatchlist';
import type { MarketCollectionItem } from '@/components/markets/MarketsTable';

export type CarouselFilter = 'all' | 'has_offers' | 'active_loans' | 'high_pool';

export interface FeaturedListingsCarouselProps {
  collections: MarketCollectionItem[];
  isLoading?: boolean;
}

export function FeaturedListingsCarousel({
  collections,
  isLoading = false,
}: FeaturedListingsCarouselProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [filter, setFilter] = useState<CarouselFilter>('all');
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [isHovered, setIsHovered] = useState<boolean>(false);
  const { isWatchlisted, toggleWatchlist } = useWatchlist();

  const filteredItems = useMemo(() => {
    return collections.filter((item) => {
      if (filter === 'has_offers') return item.offerCount > 0;
      if (filter === 'active_loans') return (item.activeLoansCount || 0) > 0;
      if (filter === 'high_pool') return BigInt(item.poolSizeWei || '0') > 0n;
      return true;
    });
  }, [collections, filter]);

  const shouldMarquee = filteredItems.length >= 5;

  const repeatMultiplier = useMemo(() => {
    if (!shouldMarquee || filteredItems.length === 0) return 1;
    return Math.max(3, Math.ceil(12 / filteredItems.length));
  }, [shouldMarquee, filteredItems.length]);

  const repeatedItems = useMemo(() => {
    if (filteredItems.length === 0) return [];
    if (!shouldMarquee) {
      return filteredItems.map((item) => ({ item, key: item.address }));
    }
    const items: Array<{ item: MarketCollectionItem; key: string }> = [];
    for (let r = 0; r < repeatMultiplier; r++) {
      filteredItems.forEach((item, idx) => {
        items.push({ item, key: `${item.address}-rep-${r}-${idx}` });
      });
    }
    return items;
  }, [filteredItems, shouldMarquee, repeatMultiplier]);

  useEffect(() => {
    if (!shouldMarquee || !isPlaying || isHovered || filteredItems.length === 0) return;

    let animationFrameId: number;
    const speed = 0.75;

    const animate = () => {
      const container = scrollRef.current;
      if (container) {
        const singleSetWidth = container.scrollWidth / repeatMultiplier;
        container.scrollLeft += speed;
        if (container.scrollLeft >= singleSetWidth) {
          container.scrollLeft -= singleSetWidth;
        }
      }
      animationFrameId = requestAnimationFrame(animate);
    };

    animationFrameId = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [shouldMarquee, isPlaying, isHovered, filteredItems.length, repeatMultiplier]);

  const handleScroll = (direction: 'left' | 'right') => {
    const container = scrollRef.current;
    if (!container) return;
    const scrollAmount = 294;

    if (typeof container.scrollBy === 'function') {
      container.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth',
      });
    } else {
      container.scrollLeft += direction === 'left' ? -scrollAmount : scrollAmount;
    }
  };

  const togglePlay = () => {
    setIsPlaying((prev) => !prev);
  };

  const filterChips: { id: CarouselFilter; label: string }[] = [
    { id: 'all', label: 'All Listings' },
    { id: 'has_offers', label: 'Active Offers' },
    { id: 'active_loans', label: 'In Loan' },
    { id: 'high_pool', label: 'Funded Pools' },
  ];

  return (
    <section aria-label="Featured Collection Markets" className="space-y-3.5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <h2 className="text-base sm:text-lg font-semibold tracking-tight text-[var(--text)]">
              Trending Markets & Offers
            </h2>
          </div>
          <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-medium bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-800">
            Live Escrow
          </span>
        </div>

        <div className="flex items-center gap-2 justify-between sm:justify-end flex-wrap sm:flex-nowrap">
          <div className="flex items-center gap-1 p-1 bg-[var(--panel)] border border-[var(--line)] rounded-lg overflow-x-auto no-scrollbar">
            {filterChips.map((chip) => {
              const isSelected = filter === chip.id;
              return (
                <button
                  key={chip.id}
                  type="button"
                  onClick={() => setFilter(chip.id)}
                  className={`px-2.5 py-1 text-xs font-medium rounded-md whitespace-nowrap transition-colors cursor-pointer border ${
                    isSelected
                      ? 'bg-[var(--surface)] text-[var(--text)] border-[var(--line)] shadow-xs'
                      : 'text-[var(--muted)] hover:text-[var(--text)] border-transparent'
                  }`}
                >
                  {chip.label}
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-1 shrink-0">
            {shouldMarquee && (
              <button
                type="button"
                onClick={togglePlay}
                aria-label={isPlaying ? 'Stop scrolling' : 'Start scrolling'}
                title={isPlaying ? 'Stop' : 'Play'}
                className="p-1.5 rounded-lg border border-[var(--line)] bg-[var(--surface)] hover:bg-[var(--line)] text-[var(--text)] transition-colors cursor-pointer flex items-center justify-center shadow-xs"
              >
                {isPlaying ? (
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M6 5h4v14H6V5zm8 0h4v14h-4V5z" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                )}
              </button>
            )}
            <button
              type="button"
              onClick={() => handleScroll('left')}
              aria-label="Scroll left"
              title="Previous 1 row"
              className="p-1.5 rounded-lg border border-[var(--line)] bg-[var(--surface)] hover:bg-[var(--line)] text-[var(--text)] transition-colors cursor-pointer flex items-center justify-center shadow-xs"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <button
              type="button"
              onClick={() => handleScroll('right')}
              aria-label="Scroll right"
              title="Next 1 row"
              className="p-1.5 rounded-lg border border-[var(--line)] bg-[var(--surface)] hover:bg-[var(--line)] text-[var(--text)] transition-colors cursor-pointer flex items-center justify-center shadow-xs"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="flex gap-3.5 overflow-hidden py-1">
          {[1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              className="w-[260px] sm:w-[280px] shrink-0 p-3.5 rounded-xl bg-[var(--surface)] border border-[var(--line)] space-y-3"
            >
              <Skeleton width="100%" height="130px" borderRadius="10px" />
              <Skeleton width="140px" height="16px" />
              <div className="flex justify-between">
                <Skeleton width="70px" height="12px" />
                <Skeleton width="70px" height="12px" />
              </div>
            </div>
          ))}
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="p-6 border border-dashed border-[var(--line)] rounded-xl text-center bg-[var(--surface)]/50 text-xs text-[var(--muted)]">
          No markets matching this filter criteria.
        </div>
      ) : (
        <div
          ref={scrollRef}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          className="flex gap-3.5 overflow-x-auto no-scrollbar scroll-smooth py-1 -mx-1 px-1"
        >
          {repeatedItems.map(({ item, key }) => {
            const bestOfferEth = item.bestOfferWei && item.bestOfferWei !== '0'
              ? (Number(item.bestOfferWei) / 1e18).toFixed(2)
              : null;
            const isStarred = isWatchlisted(item.address);

            return (
              <div
                key={key}
                className="w-[260px] sm:w-[280px] shrink-0 p-3.5 rounded-xl bg-[var(--surface)] border border-[var(--line)] hover:border-[var(--line-strong)] card-hover-lift shadow-2xs flex flex-col justify-between group relative"
              >
                <Link
                  href={`/collection/${item.address}`}
                  className="space-y-3 block flex-1 group/card"
                >
                  <div className="relative h-[130px] rounded-lg overflow-hidden bg-[var(--panel)] border border-[var(--line)]/50">
                    <NftImage
                      src={item.imageUrl}
                      alt={item.name}
                      contractAddress={item.address}
                      symbol={item.symbol}
                      className="w-full h-full object-cover group-hover/card:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute top-2 left-2 flex gap-1 z-10">
                      {item.offerCount > 0 ? (
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-semibold bg-emerald-600/90 text-white backdrop-blur-xs shadow-xs">
                          {item.offerCount} {item.offerCount === 1 ? 'Offer' : 'Offers'}
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-medium bg-black/60 text-white/80 backdrop-blur-xs">
                          Open Market
                        </span>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        toggleWatchlist(item.address);
                      }}
                      aria-label={isStarred ? 'Remove from watchlist' : 'Add to watchlist'}
                      className={`absolute top-2 right-2 p-1.5 rounded-md backdrop-blur-xs transition-colors cursor-pointer z-10 ${
                        isStarred
                          ? 'bg-amber-500/20 text-amber-500 hover:bg-amber-500/30'
                          : 'bg-black/50 text-white/70 hover:text-white hover:bg-black/70'
                      }`}
                    >
                      <svg className="w-3.5 h-3.5" fill={isStarred ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                      </svg>
                    </button>
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center justify-between gap-1">
                      <span
                        className="text-xs font-bold text-[var(--text)] group-hover/card:text-[var(--primary)] truncate"
                        title={item.name}
                      >
                        {item.name}
                      </span>
                      <span className="text-[10px] font-mono text-[var(--muted)] shrink-0">
                        {item.symbol}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 pt-1 border-t border-[var(--line)]/60 text-[11px]">
                      <div>
                        <span className="text-[10px] text-[var(--muted)] block">Floor</span>
                        <span className="font-mono font-semibold text-[var(--text)]">
                          {item.floorPriceEth ? `${item.floorPriceEth} ETH` : '—'}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-[var(--muted)] block">Top Bid</span>
                        <span className="font-mono font-semibold text-emerald-600 dark:text-emerald-400">
                          {bestOfferEth ? `${bestOfferEth} ETH` : '—'}
                        </span>
                      </div>
                    </div>
                  </div>
                </Link>

                <div className="flex items-center gap-2 pt-3 mt-2 border-t border-[var(--line)]/60">
                  <Link
                    href={`/collection/${item.address}`}
                    className="flex-1 py-1.5 text-center text-xs font-semibold rounded-lg bg-[var(--panel)] hover:bg-[var(--line)] text-[var(--text)] transition-colors"
                  >
                    View Market
                  </Link>
                  <Link
                    href={`/collection/${item.address}?tab=offers`}
                    className="flex-1 py-1.5 text-center text-xs font-semibold rounded-lg bg-[var(--lime)] hover:bg-[#076b4d] text-white transition-colors shadow-xs"
                  >
                    Lend
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}


