'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { formatUnits } from 'viem';
import { useSafeChainId } from '@/hooks/useSafeChainId';
import { useCollections } from '@/hooks/api/useCollections';
import { useWatchlist } from '@/hooks/useWatchlist';
import { NftImage } from '@/components/nft/NftImage';
import { getCollectionByAddress } from '@/config/collections';

interface ActivityItem {
  id: string;
  type: string;
  collection: string;
  collectionName?: string;
  tokenId?: string;
  amountEth?: string;
  principalWei?: string;
  userAddress?: string;
  txHash?: string;
  timestamp: string;
}

export interface ActivityPanelProps {
  isOpen?: boolean;
  onToggle?: () => void;
  isMobileOpen?: boolean;
  onMobileClose?: () => void;
}

export function ActivityPanel({
  isOpen: controlledOpen,
  onToggle,
  isMobileOpen = false,
  onMobileClose,
}: ActivityPanelProps = {}) {
  const chainId = useSafeChainId();
  const { data: collectionsData } = useCollections(chainId);
  const [internalOpen, setInternalOpen] = useState(true);
  const isOpen = controlledOpen !== undefined ? controlledOpen : internalOpen;

  const handleToggle = () => {
    if (onToggle) {
      onToggle();
    } else {
      setInternalOpen((prev) => !prev);
    }
  };

  const [feedScope, setFeedScope] = useState<'all' | 'watch'>('all');
  const [feedType, setFeedType] = useState<'all' | 'loan' | 'repaid'>('all');
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const { watchlist, isWatchlisted, toggleWatchlist } = useWatchlist();

  const fetchActivities = async () => {
    try {
      const url = chainId ? `/api/activity?limit=20&chainId=${chainId}` : '/api/activity?limit=20';
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        const rawList = data.activity || data.items || [];
        const normalized: ActivityItem[] = rawList.map((item: any) => {
          const type = item.eventType || item.type || 'Event';
          const collection = (item.data?.collection as string) || (item.data?.collectionAddress as string) || item.contractAddress || item.collection || '';
          const tokenId = (item.data?.tokenId as string) || item.tokenId;
          const principalWei = (item.data?.principalWei as string) || (item.data?.repaymentAmountWei as string) || (item.data?.amountWei as string) || item.principalWei;
          const userAddress = (item.data?.borrower as string) || (item.data?.lender as string) || (item.data?.user as string) || item.userAddress;
          return {
            id: String(item.id || item.txHash || Math.random()),
            type,
            collection,
            collectionName: item.collectionName,
            tokenId,
            amountEth: item.amountEth,
            principalWei,
            userAddress,
            txHash: item.txHash,
            timestamp: item.timestamp || item.indexed_at || new Date().toISOString(),
          };
        });
        setActivities(normalized);
      }
    } catch {
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActivities();
    const interval = setInterval(() => {
      if (!document.hidden) {
        fetchActivities();
      }
    }, 15000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!isMobileOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && onMobileClose) {
        onMobileClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isMobileOpen, onMobileClose]);

  const watchlistedCollections = useMemo(() => {
    if (!watchlist || watchlist.length === 0) return [];
    return watchlist.map((addr) => {
      const col = collectionsData?.collections?.find(
        (c) => c.address.toLowerCase() === addr.toLowerCase()
      );
      const curatedCol = getCollectionByAddress(addr, chainId);
      const bestOfferEth = col?.bestOfferWei && col.bestOfferWei !== '0'
        ? (Number(col.bestOfferWei) / 1e18).toFixed(2)
        : null;

      return {
        address: addr,
        name: col?.name || curatedCol?.name || `${addr.slice(0, 6)}...${addr.slice(-4)}`,
        symbol: col?.symbol || curatedCol?.symbol || 'NFT',
        imageUrl: col?.imageUrl || curatedCol?.imageUrl,
        floorPriceEth: col?.floorPriceEth,
        bestOfferEth,
        offerCount: col?.offerCount || 0,
      };
    });
  }, [watchlist, collectionsData, chainId]);

  const filteredEvents = activities.filter((e) => {
    if (feedScope === 'watch' && !isWatchlisted(e.collection)) {
      return false;
    }
    const typeLower = e.type.toLowerCase();
    if (feedType === 'loan') {
      return typeLower.includes('loan') || typeLower.includes('started') || typeLower.includes('filled');
    }
    if (feedType === 'repaid') {
      return typeLower.includes('repaid');
    }
    return true;
  });

  const formatTimeAgo = (iso: string) => {
    try {
      const diffSec = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
      if (diffSec < 60) return `${diffSec}s`;
      if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m`;
      if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h`;
      return `${Math.floor(diffSec / 86400)}d`;
    } catch {
      return 'recent';
    }
  };

  const getAmountDisplay = (item: ActivityItem) => {
    if (item.amountEth) return item.amountEth;
    if (item.principalWei) {
      try {
        return Number(formatUnits(BigInt(item.principalWei), 18)).toFixed(3);
      } catch {
        return '0.000';
      }
    }
    return '0.000';
  };

  const getStatusLabel = (type: string) => {
    const t = type.toLowerCase();
    if (t.includes('repaid')) return 'Repaid';
    if (t.includes('loan') || t.includes('started') || t.includes('filled')) return 'Borrowed';
    if (t.includes('offer')) return 'Offer';
    if (t.includes('foreclose')) return 'Foreclosed';
    return type;
  };

  const getStatusColor = (type: string) => {
    const t = type.toLowerCase();
    if (t.includes('repaid')) return 'text-emerald-600 dark:text-emerald-400';
    if (t.includes('loan') || t.includes('started') || t.includes('filled')) return 'text-sky-600 dark:text-sky-400';
    if (t.includes('foreclose')) return 'text-rose-600 dark:text-rose-400';
    return 'text-violet-600 dark:text-violet-400';
  };

  const renderWatchlistView = () => {
    if (watchlistedCollections.length === 0) {
      return (
        <div className="py-10 px-3 text-center space-y-3 bg-[var(--panel)]/40 rounded-xl border border-dashed border-[var(--line)]">
          <div className="w-10 h-10 rounded-full bg-amber-500/15 text-amber-500 mx-auto flex items-center justify-center">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
            </svg>
          </div>
          <div className="space-y-1">
            <h4 className="text-xs font-semibold text-[var(--text)]">Watchlist is Empty</h4>
            <p className="text-[11px] text-[var(--muted)] leading-relaxed">
              Star any collection in Markets or Explore to track live prices here.
            </p>
          </div>
          <Link
            href="/explore"
            onClick={onMobileClose}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[var(--surface)] hover:bg-[var(--line)] border border-[var(--line)] text-xs font-medium text-[var(--text)] transition-colors"
          >
            <span>Explore Collections</span>
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
          </Link>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        <div className="space-y-2">
          {watchlistedCollections.map((col) => (
            <div
              key={col.address}
              className="p-2.5 rounded-xl border border-[var(--line)] bg-[var(--panel)] hover:bg-[var(--raised)] transition-all flex items-center justify-between gap-2.5 group"
            >
              <Link
                href={`/collection/${col.address}`}
                onClick={onMobileClose}
                className="flex items-center gap-2.5 min-w-0 flex-1"
              >
                <div className="w-9 h-9 rounded-lg overflow-hidden bg-[var(--surface)] border border-[var(--line)] shrink-0 flex items-center justify-center">
                  <NftImage
                    src={col.imageUrl}
                    alt={col.name}
                    contractAddress={col.address}
                    symbol={col.symbol}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <span className="text-xs font-semibold text-[var(--text)] block truncate group-hover:text-[var(--primary)] transition-colors">
                    {col.name}
                  </span>
                  <div className="flex items-center gap-2 text-[10px] font-mono text-[var(--muted)] mt-0.5">
                    <span>Floor: {col.floorPriceEth ? `${col.floorPriceEth}E` : '—'}</span>
                    <span>•</span>
                    <span className="text-emerald-600 dark:text-emerald-400">
                      Bid: {col.bestOfferEth ? `${col.bestOfferEth}E` : '—'}
                    </span>
                  </div>
                </div>
              </Link>

              <div className="flex items-center gap-1 shrink-0">
                <Link
                  href={`/collection/${col.address}?tab=offers`}
                  onClick={onMobileClose}
                  className="px-2 py-1 rounded-md text-[11px] font-semibold bg-[var(--lime)] hover:bg-[#076b4d] text-white shadow-xs transition-colors"
                >
                  Lend
                </Link>
                <button
                  type="button"
                  onClick={() => toggleWatchlist(col.address)}
                  title="Remove from watchlist"
                  aria-label="Remove from watchlist"
                  className="p-1 text-amber-500 hover:text-amber-600 transition-colors cursor-pointer"
                >
                  <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                  </svg>
                </button>
              </div>
            </div>
          ))}
        </div>

        {filteredEvents.length > 0 && (
          <div className="pt-2 border-t border-[var(--line)]">
            <span className="text-[10px] uppercase font-mono font-bold tracking-wider text-[var(--muted)] block mb-2">
              Recent Watchlist Events
            </span>
            <div className="space-y-1 divide-y divide-[var(--line)]">
              {filteredEvents.map((e) => {
                const remoteCol = collectionsData?.collections?.find(
                  (c) => c.address.toLowerCase() === (e.collection || '').toLowerCase()
                );
                const colName = e.collectionName || remoteCol?.name || 'Curated NFT';
                const symbol = remoteCol?.symbol || 'NFT';
                const targetCollection = e.collection || remoteCol?.address || '';

                return (
                  <Link
                    key={e.id}
                    href={`/borrow?collection=${targetCollection}`}
                    onClick={onMobileClose}
                    className="flex items-center gap-2.5 w-full text-left py-2 hover:bg-[var(--panel)] transition-colors rounded-lg px-1.5 cursor-pointer group"
                  >
                    <div className="w-8 h-8 rounded-md bg-[var(--panel)] border border-[var(--line)] shrink-0 overflow-hidden flex items-center justify-center font-mono font-bold text-xs text-[var(--accent-primary)]">
                      {symbol.slice(0, 2)}
                    </div>

                    <div className="min-w-0 flex-1">
                      <strong className="text-xs font-medium text-[var(--text)] block truncate group-hover:text-[var(--accent-primary)] transition-colors">
                        {colName} {e.tokenId ? `#${e.tokenId}` : ''}
                      </strong>
                      <small className="text-[10px] text-[var(--muted)] flex items-center gap-1 mt-0.5 font-mono">
                        <span>{e.userAddress ? `${e.userAddress.slice(0, 6)}...${e.userAddress.slice(-4)}` : 'On-chain'}</span>
                        <svg className="w-2.5 h-2.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M7 17L17 7M17 7H7M17 7V17" />
                        </svg>
                      </small>
                    </div>

                    <div className="text-right whitespace-nowrap">
                      <strong className="text-xs font-medium font-mono text-[var(--text)] block">
                        {getAmountDisplay(e)} <small className="text-[9px] font-normal text-[var(--muted)]">ETH</small>
                      </strong>
                      <small className={`text-[10px] font-medium block mt-0.5 ${getStatusColor(e.type)}`}>
                        {getStatusLabel(e.type)} · {formatTimeAgo(e.timestamp)}
                      </small>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderFeedContent = () => (
    <>
      <div className="flex bg-[var(--panel)] rounded-lg p-1 mb-3 gap-1 border border-[var(--line)] shrink-0">
        <button
          onClick={() => setFeedScope('all')}
          className={`flex-1 text-xs font-medium rounded-md py-1.5 px-2 transition-colors cursor-pointer border ${
            feedScope === 'all'
              ? 'bg-[var(--surface)] text-[var(--text)] border-[var(--line)] shadow-xs'
              : 'text-[var(--muted)] hover:text-[var(--text)] border-transparent'
          }`}
        >
          All Activity
        </button>
        <button
          onClick={() => setFeedScope('watch')}
          className={`flex-1 text-xs font-medium rounded-md py-1.5 px-2 transition-colors cursor-pointer border flex items-center justify-center gap-1.5 ${
            feedScope === 'watch'
              ? 'bg-[var(--surface)] text-[var(--text)] border-[var(--line)] shadow-xs'
              : 'text-[var(--muted)] hover:text-[var(--text)] border-transparent'
          }`}
        >
          <span>Watchlist</span>
          {watchlist.length > 0 && (
            <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono bg-amber-500/20 text-amber-600 dark:text-amber-400 font-bold">
              {watchlist.length}
            </span>
          )}
        </button>
      </div>

      {feedScope === 'watch' ? (
        <div className="flex-1 overflow-y-auto min-h-0">
          {renderWatchlistView()}
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between gap-2 mb-4 shrink-0">
            <div className="flex gap-1">
              <button
                onClick={() => setFeedType('all')}
                className={`py-1 px-2.5 text-xs rounded-md border transition-colors cursor-pointer ${
                  feedType === 'all'
                    ? 'bg-[var(--panel)] text-[var(--text)] border-[var(--line-strong)]'
                    : 'bg-[var(--surface)] text-[var(--muted)] border-[var(--line)] hover:text-[var(--text)]'
                }`}
              >
                Feed
              </button>
              <button
                onClick={() => setFeedType('loan')}
                className={`py-1 px-2.5 text-xs rounded-md border transition-colors cursor-pointer ${
                  feedType === 'loan'
                    ? 'bg-[var(--panel)] text-[var(--text)] border-[var(--line-strong)]'
                    : 'bg-[var(--surface)] text-[var(--muted)] border-[var(--line)] hover:text-[var(--text)]'
                }`}
              >
                Loans
              </button>
              <button
                onClick={() => setFeedType('repaid')}
                className={`py-1 px-2.5 text-xs rounded-md border transition-colors cursor-pointer ${
                  feedType === 'repaid'
                    ? 'bg-[var(--panel)] text-[var(--text)] border-[var(--line-strong)]'
                    : 'bg-[var(--surface)] text-[var(--muted)] border-[var(--line)] hover:text-[var(--text)]'
                }`}
              >
                Repaid
              </button>
            </div>
            <span className="text-[10px] font-mono font-bold text-[var(--accent-primary)] tracking-wider uppercase">
              Live
            </span>
          </div>

          <div className="flex-1 space-y-1 divide-y divide-[var(--line)] overflow-y-auto min-h-0">
            {loading ? (
              <div className="space-y-3 py-2">
                {[1, 2, 3, 4].map((n) => (
                  <div key={n} className="flex items-center gap-3 animate-pulse">
                    <div className="w-9 h-9 rounded bg-[var(--panel)]" />
                    <div className="flex-1 space-y-1.5">
                      <div className="w-24 h-3 bg-[var(--panel)] rounded" />
                      <div className="w-16 h-2 bg-[var(--panel)] rounded" />
                    </div>
                  </div>
                ))}
              </div>
            ) : filteredEvents.length === 0 ? (
              <div className="py-8 text-center text-xs text-[var(--muted)]">
                No activity events recorded yet.
              </div>
            ) : (
              filteredEvents.map((e) => {
                const remoteCol = collectionsData?.collections?.find(
                  (c) => c.address.toLowerCase() === (e.collection || '').toLowerCase()
                );
                const colName = e.collectionName || remoteCol?.name || 'Curated NFT';
                const symbol = remoteCol?.symbol || 'NFT';
                const targetCollection = e.collection || remoteCol?.address || '';

                return (
                  <Link
                    key={e.id}
                    href={`/borrow?collection=${targetCollection}`}
                    onClick={onMobileClose}
                    className="flex items-center gap-2.5 w-full text-left py-2.5 hover:bg-[var(--panel)] transition-colors rounded-lg px-2 cursor-pointer group"
                  >
                    <div className="w-9 h-9 rounded-md bg-[var(--panel)] border border-[var(--line)] shrink-0 overflow-hidden flex items-center justify-center font-mono font-bold text-xs text-[var(--accent-primary)]">
                      {symbol.slice(0, 2)}
                    </div>

                    <div className="min-w-0 flex-1">
                      <strong className="text-xs font-medium text-[var(--text)] block truncate group-hover:text-[var(--accent-primary)] transition-colors">
                        {colName} {e.tokenId ? `#${e.tokenId}` : ''}
                      </strong>
                      <small className="text-[10px] text-[var(--muted)] flex items-center gap-1 mt-0.5 font-mono">
                        <span>{e.userAddress ? `${e.userAddress.slice(0, 6)}...${e.userAddress.slice(-4)}` : 'On-chain'}</span>
                        <svg className="w-2.5 h-2.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M7 17L17 7M17 7H7M17 7V17" />
                        </svg>
                      </small>
                    </div>

                    <div className="text-right whitespace-nowrap">
                      <strong className="text-xs font-medium font-mono text-[var(--text)] block">
                        {getAmountDisplay(e)} <small className="text-[9px] font-normal text-[var(--muted)]">ETH</small>
                      </strong>
                      <small className={`text-[10px] font-medium block mt-0.5 ${getStatusColor(e.type)}`}>
                        {getStatusLabel(e.type)} · {formatTimeAgo(e.timestamp)}
                      </small>
                    </div>
                  </Link>
                );
              })
            )}
          </div>
        </>
      )}

      <div className="flex items-center gap-1.5 text-[var(--muted)] text-[10px] py-3 border-t border-[var(--line)] shrink-0">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block animate-pulse" />
        <span>Live Protocol Contract Events</span>
      </div>

      <div className="border border-[var(--line)] rounded-xl p-4 mt-2 bg-[var(--panel)] shrink-0">
        <span className="text-[10px] tracking-wider text-violet-600 dark:text-violet-400 font-semibold uppercase block">
          Curated NFT Liquidity
        </span>
        <h3 className="text-sm font-semibold leading-snug my-1.5 text-[var(--text)]">
          Instant liquidity for verified collections
        </h3>
        <p className="text-xs text-[var(--muted)] leading-relaxed mb-3">
          Borrow ETH against your collateral without selling your assets.
        </p>
        <Link
          href="/borrow"
          onClick={onMobileClose}
          className="w-full flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold shadow-xs transition-colors"
        >
          <span>Explore borrowing</span>
          <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M7 17L17 7M17 7H7M17 7V17" />
          </svg>
        </Link>
      </div>
    </>
  );

  return (
    <>
      <aside
        aria-label="Activity feed"
        data-open={isOpen ? 'true' : 'false'}
        className={`hidden xl:flex fixed right-0 top-[var(--header-height)] bottom-[var(--footer-bar-height)] border-l border-[var(--line)] bg-[var(--surface)] text-[var(--text)] z-20 flex-col select-none transition-all duration-200 ${
          isOpen
            ? 'w-[var(--feed-width)] p-4 overflow-y-auto'
            : 'w-12 p-2 items-center overflow-hidden'
        }`}
      >
        {isOpen ? (
          <>
            <div className="flex items-center justify-between pb-2 mb-2 border-b border-[var(--line)] shrink-0">
              <div className="text-xs font-semibold text-[var(--text)] flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[var(--accent-primary)] animate-pulse" />
                <span>Recent Activity</span>
              </div>
              <div className="flex items-center gap-2">
                <Link
                  href="/activity"
                  className="inline-flex items-center gap-1 text-[11px] text-[var(--muted)] hover:text-[var(--text)] transition-colors hover:underline"
                >
                  <span>View all</span>
                  <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M7 17L17 7M17 7H7M17 7V17" />
                  </svg>
                </Link>
                <button
                  type="button"
                  onClick={handleToggle}
                  aria-label="Toggle activity panel"
                  title="Collapse activity feed"
                  className="p-1 rounded text-[var(--muted)] hover:text-[var(--text)] hover:bg-[var(--panel)] transition-colors cursor-pointer"
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            </div>

            {renderFeedContent()}
          </>
        ) : (
          <div className="flex flex-col items-center gap-4 py-2 w-full">
            <button
              type="button"
              onClick={handleToggle}
              aria-label="Toggle activity panel"
              title="Expand activity feed"
              className="p-1.5 rounded text-[var(--muted)] hover:text-[var(--text)] hover:bg-[var(--panel)] transition-colors cursor-pointer"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <span className="w-2 h-2 rounded-full bg-[var(--accent-primary)] animate-pulse" />
            <span className="[writing-mode:vertical-lr] rotate-180 text-[11px] font-semibold tracking-wider text-[var(--muted)] uppercase">
              Recent Activity
            </span>
          </div>
        )}
      </aside>

      {isMobileOpen && (
        <div className="xl:hidden">
          <div
            data-testid="activity-backdrop"
            onClick={onMobileClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 transition-opacity duration-200"
          />

          <div
            role="dialog"
            aria-modal="true"
            aria-label="Activity feed"
            data-testid="activity-mobile-drawer"
            className="fixed inset-y-0 right-0 z-50 w-full sm:w-[380px] bg-[var(--surface)] border-l border-[var(--line)] shadow-2xl flex flex-col p-4 overflow-y-auto animate-slide-in-right"
          >
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-[var(--line)] shrink-0">
              <div className="text-sm font-semibold text-[var(--text)] flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[var(--accent-primary)] animate-pulse" />
                <span>Recent Activity</span>
              </div>
              <div className="flex items-center gap-3">
                <Link
                  href="/activity"
                  onClick={onMobileClose}
                  className="inline-flex items-center gap-1 text-xs text-[var(--muted)] hover:text-[var(--text)] transition-colors hover:underline"
                >
                  <span>View all</span>
                  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M7 17L17 7M17 7H7M17 7V17" />
                  </svg>
                </Link>
                <button
                  type="button"
                  onClick={onMobileClose}
                  aria-label="Close activity panel"
                  title="Close activity feed"
                  className="p-1.5 rounded-lg text-[var(--muted)] hover:text-[var(--text)] hover:bg-[var(--panel)] transition-colors cursor-pointer"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {renderFeedContent()}
          </div>
        </div>
      )}
    </>
  );
}
