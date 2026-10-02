'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { formatUnits } from 'viem';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { getExplorerAddressUrl, TESTNET_CHAIN_ID } from '@/config/chains';
import type { ActiveCuratedCollection } from '@/config/collections';

export interface CollectionHeaderStats {
  bestOfferWei?: string | null;
  poolSizeWei: string;
  offerCount: number;
  aprRange: string;
  activeLoansCount: number;
}

export interface CollectionHeaderProps {
  collection: ActiveCuratedCollection;
  stats: CollectionHeaderStats;
  chainId?: number;
}

export function CollectionHeader({
  collection,
  stats,
  chainId = TESTNET_CHAIN_ID,
}: CollectionHeaderProps) {
  const [copied, setCopied] = useState(false);

  const truncatedAddress = `${collection.contractAddress.slice(0, 6)}...${collection.contractAddress.slice(-4)}`;
  const explorerUrl = getExplorerAddressUrl(collection.contractAddress, chainId);

  const bestOfferEth = stats.bestOfferWei
    ? `${Number(formatUnits(BigInt(stats.bestOfferWei), 18)).toFixed(2)} ETH`
    : '--';

  const poolSizeEth = `${Number(formatUnits(BigInt(stats.poolSizeWei || '0'), 18)).toFixed(2)} ETH`;

  const handleCopy = () => {
    if (typeof navigator !== 'undefined') {
      navigator.clipboard.writeText(collection.contractAddress);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 p-6 rounded-2xl border border-[var(--line)] bg-[var(--panel)] shadow-[var(--shadow-subtle)]">
        <div className="flex items-start sm:items-center gap-4">
          <div className="relative w-16 h-16 rounded-xl overflow-hidden border border-[var(--line)] bg-[var(--raised)] flex-shrink-0">
            <Image
              src={collection.imageUrl}
              alt={collection.name}
              fill
              sizes="64px"
              className="object-cover"
              unoptimized
            />
          </div>

          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2.5">
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[var(--text)]">
                {collection.name}
              </h1>
              <span className="px-2 py-0.5 rounded-md bg-[var(--raised)] border border-[var(--line)] text-[11px] font-mono font-semibold text-[var(--muted)]">
                {collection.symbol}
              </span>
              <Badge status="active">Verified</Badge>
            </div>

            <div className="flex flex-wrap items-center gap-3 text-xs text-[var(--muted)] font-mono">
              <span>{collection.category}</span>
              <span>•</span>
              <div className="flex items-center gap-1.5">
                <a
                  href={explorerUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="View on Blockscout"
                  className="hover:text-[var(--primary)] underline decoration-dotted transition-colors"
                >
                  {truncatedAddress}
                </a>
                <button
                  type="button"
                  onClick={handleCopy}
                  className="p-1 hover:text-[var(--text)] transition-colors cursor-pointer"
                  title="Copy address"
                  aria-label="Copy address"
                >
                  {copied ? '✓' : '📋'}
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <a
            href={explorerUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full sm:w-auto"
          >
            <Button variant="secondary" size="sm" className="w-full sm:w-auto">
              View on Explorer ↗
            </Button>
          </a>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="p-4 rounded-xl border border-[var(--line)] bg-[var(--surface)] space-y-1">
          <span className="text-[9px] uppercase font-mono tracking-[1.5px] text-[var(--muted)] block">
            Best Offer
          </span>
          <span className="text-base font-bold font-mono text-[var(--primary)]">
            {bestOfferEth}
          </span>
        </div>

        <div className="p-4 rounded-xl border border-[var(--line)] bg-[var(--surface)] space-y-1">
          <span className="text-[9px] uppercase font-mono tracking-[1.5px] text-[var(--muted)] block">
            Pool Size
          </span>
          <span className="text-base font-bold font-mono text-[var(--text)]">
            {poolSizeEth}
          </span>
        </div>

        <div className="p-4 rounded-xl border border-[var(--line)] bg-[var(--surface)] space-y-1">
          <span className="text-[9px] uppercase font-mono tracking-[1.5px] text-[var(--muted)] block">
            Open Offers
          </span>
          <span className="text-base font-bold font-mono text-[var(--text)]">
            {stats.offerCount}
          </span>
        </div>

        <div className="p-4 rounded-xl border border-[var(--line)] bg-[var(--surface)] space-y-1">
          <span className="text-[9px] uppercase font-mono tracking-[1.5px] text-[var(--muted)] block">
            APR Range
          </span>
          <span className="text-base font-bold font-mono text-[var(--primary)]">
            {stats.aprRange}
          </span>
        </div>

        <div className="p-4 rounded-xl border border-[var(--line)] bg-[var(--surface)] space-y-1">
          <span className="text-[9px] uppercase font-mono tracking-[1.5px] text-[var(--muted)] block">
            Active Loans
          </span>
          <span className="text-base font-bold font-mono text-[var(--text)]">
            {stats.activeLoansCount}
          </span>
        </div>

        <div className="p-4 rounded-xl border border-[var(--line)] bg-[var(--surface)] space-y-1">
          <span className="text-[9px] uppercase font-mono tracking-[1.5px] text-[var(--muted)] block">
            Floor Price
          </span>
          <span className="text-base font-bold font-mono text-[var(--text)]">
            {collection.floorPriceEth} ETH
          </span>
        </div>
      </div>
    </div>
  );
}
