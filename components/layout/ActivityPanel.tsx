'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { formatUnits } from 'viem';
import { CURATED_COLLECTIONS, getCollectionByAddress } from '@/config/collections';
import { TESTNET_CHAIN_ID } from '@/config/chains';
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

export function ActivityPanel() {
  const [isOpen, setIsOpen] = useState(true);
  const [feedScope, setFeedScope] = useState<'all' | 'watch'>('all');
  const [feedType, setFeedType] = useState<'all' | 'loan' | 'repaid'>('all');
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const { watchlist, isWatchlisted } = useWatchlist();

  const fetchActivities = async () => {
    try {
      const res = await fetch('/api/activity?limit=20');
      if (res.ok) {
        const data = await res.json();
        setActivities(data.items || []);
      }
    } catch {
      // ignore
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
    if (t.includes('repaid')) return 'text-[#61856d]';
    if (t.includes('loan') || t.includes('started') || t.includes('filled')) return 'text-[#5487ad]';
    if (t.includes('foreclose')) return 'text-red-500';
    return 'text-[var(--lime)]';
  };

  return (
    <aside
      aria-label="Activity feed"
      data-open={isOpen ? 'true' : 'false'}
      className="hidden xl:flex fixed right-0 top-[var(--header-height)] bottom-[var(--footer-bar-height)] w-[var(--feed-width)] p-[18px_15px] overflow-y-auto border-l border-[#e5ebe8] bg-white dark:bg-[#161b22] dark:border-[#30363d] z-20 flex-col select-none"
    >
      <div className="flex items-center justify-between pb-2 mb-2 border-b border-[#eef1ef] dark:border-[#21262d]">
        <div className="text-[12px] font-semibold text-[#183d30] dark:text-[#f0f6fc] flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-[#087f5b] animate-pulse" />
          <span>Recent Activity</span>
        </div>
        <button
          type="button"
          onClick={() => setIsOpen((prev) => !prev)}
          aria-label="Toggle activity panel"
          className="text-xs text-[#627478] hover:text-[#183d30] dark:hover:text-white p-1 cursor-pointer"
        >
          {isOpen ? '✕' : '☰'}
        </button>
      </div>

      <div className="flex bg-[#f3f5f4] dark:bg-[#0d1117] rounded-[7px] p-[3px] mb-[13px] gap-[3px]">
        <button
          onClick={() => setFeedScope('all')}
          className={`flex-1 text-[11px] font-medium rounded-[5px] py-[9px] px-[5px] transition-all cursor-pointer ${
            feedScope === 'all'
              ? 'bg-white dark:bg-[#21262d] text-[#153f2d] dark:text-[#f0f6fc] border border-[#e0e7e3] dark:border-[#30363d] shadow-[0_1px_3px_rgba(40,76,41,0.06)]'
              : 'text-[#536b5e] dark:text-[#8b949e] hover:text-[#153f2d] dark:hover:text-white'
          }`}
        >
          All Activity
        </button>
        <button
          onClick={() => setFeedScope('watch')}
          className={`flex-1 text-[11px] font-medium rounded-[5px] py-[9px] px-[5px] transition-all cursor-pointer ${
            feedScope === 'watch'
              ? 'bg-white dark:bg-[#21262d] text-[#153f2d] dark:text-[#f0f6fc] border border-[#e0e7e3] dark:border-[#30363d] shadow-[0_1px_3px_rgba(40,76,41,0.06)]'
              : 'text-[#536b5e] dark:text-[#8b949e] hover:text-[#153f2d] dark:hover:text-white'
          }`}
        >
          ☆ Watchlist
        </button>
      </div>

      <div className="flex items-center justify-between gap-2 mb-[17px]">
        <div className="flex gap-1">
          <button
            onClick={() => setFeedType('all')}
            className={`py-[5px] px-[9px] text-[10px] rounded-[5px] border transition-all cursor-pointer ${
              feedType === 'all'
                ? 'bg-[#214e3b] text-white border-[#214e3b]'
                : 'bg-white dark:bg-[#21262d] text-[#617266] dark:text-[#8b949e] border-[#e2e8e5] dark:border-[#30363d] hover:bg-[#f3f5f4]'
            }`}
          >
            Feed
          </button>
          <button
            onClick={() => setFeedType('loan')}
            className={`py-[5px] px-[9px] text-[10px] rounded-[5px] border transition-all cursor-pointer ${
              feedType === 'loan'
                ? 'bg-[#214e3b] text-white border-[#214e3b]'
                : 'bg-white dark:bg-[#21262d] text-[#617266] dark:text-[#8b949e] border-[#e2e8e5] dark:border-[#30363d] hover:bg-[#f3f5f4]'
            }`}
          >
            Loans
          </button>
          <button
            onClick={() => setFeedType('repaid')}
            className={`py-[5px] px-[9px] text-[10px] rounded-[5px] border transition-all cursor-pointer ${
              feedType === 'repaid'
                ? 'bg-[#214e3b] text-white border-[#214e3b]'
                : 'bg-white dark:bg-[#21262d] text-[#617266] dark:text-[#8b949e] border-[#e2e8e5] dark:border-[#30363d] hover:bg-[#f3f5f4]'
            }`}
          >
            Repaid
          </button>
        </div>
        <span className="text-[9px] font-mono font-bold text-[#608390] tracking-wider uppercase">
          LIVE
        </span>
      </div>

      <div className="flex-1 space-y-1 divide-y divide-[#eef1ef] dark:divide-[#21262d]">
        {loading ? (
          <div className="space-y-3 py-2">
            {[1, 2, 3, 4].map((n) => (
              <div key={n} className="flex items-center gap-3 animate-pulse">
                <div className="w-[35px] h-[35px] rounded bg-[#f0f3f1] dark:bg-[#21262d]" />
                <div className="flex-1 space-y-1.5">
                  <div className="w-24 h-3 bg-[#f0f3f1] dark:bg-[#21262d] rounded" />
                  <div className="w-16 h-2 bg-[#f0f3f1] dark:bg-[#21262d] rounded" />
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
            const col = getCollectionByAddress(e.collection, TESTNET_CHAIN_ID) || CURATED_COLLECTIONS[0];
            const colName = e.collectionName || col?.name || 'Curated NFT';
            const symbol = col?.symbol || 'NFT';

            return (
              <Link
                key={e.id}
                href={`/borrow?collection=${e.collection || col?.addresses[46630] || ''}`}
                className="flex items-center gap-2.5 w-full text-left py-3 hover:bg-[#f7faf8] dark:hover:bg-[#21262d] transition-colors rounded-lg px-1.5 cursor-pointer group"
              >
                <div className="w-[35px] h-[35px] rounded-[3px] bg-[#f4f7f5] dark:bg-[#0d1117] border border-[#e1e8e9] dark:border-[#30363d] shrink-0 overflow-hidden flex items-center justify-center font-mono font-bold text-[10px] text-[#214e3b] dark:text-emerald-400">
                  {symbol.slice(0, 2)}
                </div>

                <div className="min-w-0 flex-1">
                  <strong className="text-[11px] font-medium text-[#142d2b] dark:text-[#f0f6fc] block truncate group-hover:text-[var(--lime)] transition-colors">
                    {colName} {e.tokenId ? `#${e.tokenId}` : ''}
                  </strong>
                  <small className="text-[9px] text-[#869087] block mt-0.5">
                    {e.userAddress ? `${e.userAddress.slice(0, 6)}...${e.userAddress.slice(-4)}` : 'On-chain'}{' '}
                    <span className="text-[#83a999]">↗</span>
                  </small>
                </div>

                <div className="text-right whitespace-nowrap">
                  <strong className="text-[11px] font-medium font-mono text-[#142d2b] dark:text-[#f0f6fc] block">
                    {getAmountDisplay(e)} <small className="text-[8px] font-normal text-[#75837a]">ETH</small>
                  </strong>
                  <small className={`text-[9px] font-medium block mt-0.5 ${getStatusColor(e.type)}`}>
                    {getStatusLabel(e.type)} · {formatTimeAgo(e.timestamp)}
                  </small>
                </div>
              </Link>
            );
          })
        )}
      </div>

      <div className="flex items-center gap-1.5 text-[#7c8c81] text-[9px] py-3 border-t border-[#eef1ef] dark:border-[#21262d]">
        <span className="w-1.5 h-1.5 rounded-full bg-[#5185ad] inline-block" />
        <span>Live Smart Contract Protocol Events</span>
      </div>

      <div className="border border-[#dce9e2] dark:border-[#30363d] rounded-[9px] p-[18px_16px] mt-2 bg-gradient-to-br from-[#f0f8f2] to-[#f0f6fd] dark:from-[#162a22] dark:to-[#16202c]">
        <span className="text-[8px] tracking-[1.2px] text-[#548369] dark:text-emerald-400 font-bold uppercase block">
          YOUR COLLECTION, UNLOCKED
        </span>
        <h3 className="text-[18px] font-normal tracking-[-0.6px] leading-snug my-2 text-[#183d30] dark:text-[#f0f6fc]">
          A new use for
          <br />
          what you already own.
        </h3>
        <p className="text-[10px] text-[#738575] dark:text-[#8b949e] leading-relaxed mb-3">
          Explore instant liquidity offers without selling your NFT collateral.
        </p>
        <Link
          href="/borrow"
          className="w-full flex items-center justify-center py-2.5 px-3 rounded-lg bg-[var(--lime)] hover:bg-[#076b4d] text-white text-[11px] font-semibold transition-colors shadow-xs"
        >
          Explore borrowing ↗
        </Link>
      </div>
    </aside>
  );
}
