'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { CURATED_COLLECTIONS } from '@/config/collections';

interface ActivityFeedItem {
  id: string;
  collectionIndex: number;
  collectionName: string;
  short: string;
  tokenId: string;
  type: 'loan' | 'repaid' | 'offer' | 'cancelled';
  amountEth: string;
  userAddress: string;
  timeAgo: string;
}

const SAMPLE_EVENTS: ActivityFeedItem[] = [
  {
    id: 'e-1',
    collectionIndex: 0,
    collectionName: 'Robinhood Genesis Pass',
    short: 'RHGP',
    tokenId: '0842',
    type: 'loan',
    amountEth: '0.800',
    userAddress: '0x3a...9f12',
    timeAgo: '2m',
  },
  {
    id: 'e-2',
    collectionIndex: 1,
    collectionName: 'Sherwood Forest Rangers',
    short: 'SFR',
    tokenId: '0216',
    type: 'repaid',
    amountEth: '0.679',
    userAddress: '0x7c...41b0',
    timeAgo: '5m',
  },
  {
    id: 'e-3',
    collectionIndex: 2,
    collectionName: 'Nottingham Guild Pledges',
    short: 'NGP',
    tokenId: '1103',
    type: 'offer',
    amountEth: '0.420',
    userAddress: '0x1e...88aa',
    timeAgo: '8m',
  },
  {
    id: 'e-4',
    collectionIndex: 3,
    collectionName: 'Little John Archery Club',
    short: 'LJAC',
    tokenId: '0097',
    type: 'loan',
    amountEth: '0.300',
    userAddress: '0x5b...33de',
    timeAgo: '12m',
  },
  {
    id: 'e-5',
    collectionIndex: 0,
    collectionName: 'Robinhood Genesis Pass',
    short: 'RHGP',
    tokenId: '0351',
    type: 'repaid',
    amountEth: '0.630',
    userAddress: '0x99...21cc',
    timeAgo: '18m',
  },
];

export function ActivityPanel() {
  const [isOpen, setIsOpen] = useState(true);
  const [feedScope, setFeedScope] = useState<'all' | 'watch'>('all');
  const [feedType, setFeedType] = useState<'all' | 'loan' | 'repaid'>('all');

  const filteredEvents = SAMPLE_EVENTS.filter((e) => {
    if (feedType !== 'all' && e.type !== feedType) return false;
    return true;
  });

  const getStatusLabel = (type: ActivityFeedItem['type']) => {
    switch (type) {
      case 'loan':
        return 'Borrowed';
      case 'repaid':
        return 'Repaid';
      case 'offer':
        return 'Offer';
      case 'cancelled':
        return 'Cancelled';
    }
  };

  const getStatusColor = (type: ActivityFeedItem['type']) => {
    switch (type) {
      case 'loan':
        return 'text-[#5487ad]';
      case 'repaid':
        return 'text-[#61856d]';
      case 'offer':
        return 'text-[var(--lime)]';
      case 'cancelled':
        return 'text-[#8d8172]';
    }
  };

  return (
    <aside
      aria-label="Activity feed"
      data-open={isOpen ? 'true' : 'false'}
      className="hidden xl:flex fixed right-0 top-[var(--header-height)] bottom-[var(--footer-bar-height)] w-[var(--feed-width)] p-[18px_15px] overflow-y-auto border-l border-[#e5ebe8] bg-white z-20 flex-col select-none"
    >
      <div className="flex items-center justify-between pb-2 mb-2 border-b border-[#eef1ef]">
        <div className="text-[12px] font-semibold text-[#183d30] flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-[#087f5b] animate-pulse" />
          <span>Recent Activity</span>
        </div>
        <button
          type="button"
          onClick={() => setIsOpen((prev) => !prev)}
          aria-label="Toggle activity panel"
          className="text-xs text-[#627478] hover:text-[#183d30] p-1 cursor-pointer"
        >
          {isOpen ? '✕' : '☰'}
        </button>
      </div>

      <div className="flex bg-[#f3f5f4] rounded-[7px] p-[3px] mb-[13px] gap-[3px]">
        <button
          onClick={() => setFeedScope('all')}
          className={`flex-1 text-[11px] font-medium rounded-[5px] py-[9px] px-[5px] transition-all cursor-pointer ${
            feedScope === 'all'
              ? 'bg-white text-[#153f2d] border border-[#e0e7e3] shadow-[0_1px_3px_rgba(40,76,41,0.06)]'
              : 'text-[#536b5e] hover:text-[#153f2d]'
          }`}
        >
          All Activity
        </button>
        <button
          onClick={() => setFeedScope('watch')}
          className={`flex-1 text-[11px] font-medium rounded-[5px] py-[9px] px-[5px] transition-all cursor-pointer ${
            feedScope === 'watch'
              ? 'bg-white text-[#153f2d] border border-[#e0e7e3] shadow-[0_1px_3px_rgba(40,76,41,0.06)]'
              : 'text-[#536b5e] hover:text-[#153f2d]'
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
                : 'bg-white text-[#617266] border-[#e2e8e5] hover:bg-[#f3f5f4]'
            }`}
          >
            Feed
          </button>
          <button
            onClick={() => setFeedType('loan')}
            className={`py-[5px] px-[9px] text-[10px] rounded-[5px] border transition-all cursor-pointer ${
              feedType === 'loan'
                ? 'bg-[#214e3b] text-white border-[#214e3b]'
                : 'bg-white text-[#617266] border-[#e2e8e5] hover:bg-[#f3f5f4]'
            }`}
          >
            Loans
          </button>
          <button
            onClick={() => setFeedType('repaid')}
            className={`py-[5px] px-[9px] text-[10px] rounded-[5px] border transition-all cursor-pointer ${
              feedType === 'repaid'
                ? 'bg-[#214e3b] text-white border-[#214e3b]'
                : 'bg-white text-[#617266] border-[#e2e8e5] hover:bg-[#f3f5f4]'
            }`}
          >
            Repaid
          </button>
        </div>
        <span className="text-[9px] font-mono font-bold text-[#608390] tracking-wider uppercase">
          LIVE
        </span>
      </div>

      <div className="flex-1 space-y-1 divide-y divide-[#eef1ef]">
        {filteredEvents.map((e) => {
          const col = CURATED_COLLECTIONS[e.collectionIndex] || CURATED_COLLECTIONS[0];
          return (
            <Link
              key={e.id}
              href={`/borrow?collection=${col.addresses[46630] || ''}`}
              className="flex items-center gap-2.5 w-full text-left py-3 hover:bg-[#f7faf8] transition-colors rounded-lg px-1.5 cursor-pointer group"
            >
              <div className="w-[35px] h-[35px] rounded-[3px] bg-[#f4f7f5] border border-[#e1e8e9] shrink-0 overflow-hidden flex items-center justify-center font-mono font-bold text-[10px] text-[#214e3b]">
                {col.symbol.slice(0, 2)}
              </div>

              <div className="min-w-0 flex-1">
                <strong className="text-[11px] font-medium text-[#142d2b] block truncate group-hover:text-[var(--lime)] transition-colors">
                  {e.short} #{e.tokenId}
                </strong>
                <small className="text-[9px] text-[#869087] block mt-0.5">
                  {e.userAddress} <span className="text-[#83a999]">↗</span>
                </small>
              </div>

              <div className="text-right whitespace-nowrap">
                <strong className="text-[11px] font-medium font-mono text-[#142d2b] block">
                  {e.amountEth} <small className="text-[8px] font-normal text-[#75837a]">ETH</small>
                </strong>
                <small className={`text-[9px] font-medium block mt-0.5 ${getStatusColor(e.type)}`}>
                  {getStatusLabel(e.type)} · {e.timeAgo}
                </small>
              </div>
            </Link>
          );
        })}
      </div>

      <div className="flex items-center gap-1.5 text-[#7c8c81] text-[9px] py-3 border-t border-[#eef1ef]">
        <span className="w-1.5 h-1.5 rounded-full bg-[#5185ad] inline-block" />
        <span>Live Smart Contract Protocol Events</span>
      </div>

      <div className="border border-[#dce9e2] rounded-[9px] p-[18px_16px] mt-2 bg-gradient-to-br from-[#f0f8f2] to-[#f0f6fd]">
        <span className="text-[8px] tracking-[1.2px] text-[#548369] font-bold uppercase block">
          YOUR COLLECTION, UNLOCKED
        </span>
        <h3 className="text-[18px] font-normal tracking-[-0.6px] leading-snug my-2 text-[#183d30]">
          A new use for
          <br />
          what you already own.
        </h3>
        <p className="text-[10px] text-[#738575] leading-relaxed mb-3">
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
