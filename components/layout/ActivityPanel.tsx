'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { formatUnits } from 'viem';
import { useSafeChainId } from '@/hooks/useSafeChainId';
import { useCollections } from '@/hooks/api/useCollections';
import { useWatchlist } from '@/hooks/useWatchlist';

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
}

export function ActivityPanel({ isOpen: controlledOpen, onToggle }: ActivityPanelProps = {}) {
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
  const { isWatchlisted } = useWatchlist();

  const fetchActivities = async () => {
    try {
      const url = chainId ? `/api/activity?limit=20&chainId=${chainId}` : '/api/activity?limit=20';
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setActivities(data.items || []);
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

  return (
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
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-[var(--line)]">
            <div className="text-xs font-semibold text-[var(--text)] flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[var(--accent-primary)] animate-pulse" />
              <span>Recent Activity</span>
            </div>
            <div className="flex items-center gap-2">
              <Link
                href="/activity"
                className="text-[11px] text-[var(--muted)] hover:text-[var(--text)] transition-colors hover:underline"
              >
                View all ↗
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

          <div className="flex bg-[var(--panel)] rounded-lg p-1 mb-3 gap-1 border border-[var(--line)]">
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
              className={`flex-1 text-xs font-medium rounded-md py-1.5 px-2 transition-colors cursor-pointer border ${
                feedScope === 'watch'
                  ? 'bg-[var(--surface)] text-[var(--text)] border-[var(--line)] shadow-xs'
                  : 'text-[var(--muted)] hover:text-[var(--text)] border-transparent'
              }`}
            >
              Watchlist
            </button>
          </div>

          <div className="flex items-center justify-between gap-2 mb-4">
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

          <div className="flex-1 space-y-1 divide-y divide-[var(--line)]">
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
                    className="flex items-center gap-2.5 w-full text-left py-2.5 hover:bg-[var(--panel)] transition-colors rounded-lg px-2 cursor-pointer group"
                  >
                    <div className="w-9 h-9 rounded-md bg-[var(--panel)] border border-[var(--line)] shrink-0 overflow-hidden flex items-center justify-center font-mono font-bold text-xs text-[var(--accent-primary)]">
                      {symbol.slice(0, 2)}
                    </div>

                    <div className="min-w-0 flex-1">
                      <strong className="text-xs font-medium text-[var(--text)] block truncate group-hover:text-[var(--accent-primary)] transition-colors">
                        {colName} {e.tokenId ? `#${e.tokenId}` : ''}
                      </strong>
                      <small className="text-[10px] text-[var(--muted)] block mt-0.5 font-mono">
                        {e.userAddress ? `${e.userAddress.slice(0, 6)}...${e.userAddress.slice(-4)}` : 'On-chain'}{' '}
                        <span>↗</span>
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

          <div className="flex items-center gap-1.5 text-[var(--muted)] text-[10px] py-3 border-t border-[var(--line)]">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block animate-pulse" />
            <span>Live Protocol Contract Events</span>
          </div>

          <div className="border border-[var(--line)] rounded-xl p-4 mt-2 bg-[var(--panel)]">
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
              className="w-full flex items-center justify-center py-2 px-3 rounded-lg bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold shadow-xs transition-colors"
            >
              Explore borrowing ↗
            </Link>
          </div>
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
  );
}
