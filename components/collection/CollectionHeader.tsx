'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { formatUnits } from 'viem';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { getExplorerAddressUrl } from '@/config/chains';
import { useSafeChainId } from '@/hooks/useSafeChainId';
import { resolveCollectionImageUrl } from '@/lib/services/metadata';
import { formatShortAddress } from '@/lib/services/collectionSafety';
import type { ActiveCuratedCollection } from '@/config/collections';

export interface CollectionHeaderStats {
  bestOfferWei?: string | null;
  poolSizeWei: string;
  floorPriceEth?: string | null;
  salesVolumeEth?: string | null;
  offerCount: number;
  aprRange: string;
  activeLoansCount: number;
  activeWalletsCount?: number;
}

export interface CollectionHeaderProps {
  collection: ActiveCuratedCollection;
  stats: CollectionHeaderStats;
  imageUrl?: string;
  chainId?: number;
  isDuplicateName?: boolean;
}

export function CollectionHeader({
  collection,
  stats,
  imageUrl,
  chainId,
  isDuplicateName = false,
}: CollectionHeaderProps) {
  const safeChainId = useSafeChainId();
  const activeChainId = chainId ?? safeChainId;
  const [copied, setCopied] = useState(false);
  const [imgError, setImgError] = useState(false);
  const rawImage =
    imageUrl ||
    collection.imageUrl ||
    resolveCollectionImageUrl(collection.contractAddress, collection.symbol || collection.name);
  const displayImage = imgError
    ? resolveCollectionImageUrl(collection.contractAddress, collection.symbol || collection.name)
    : rawImage;

  const truncatedAddress = formatShortAddress(collection.contractAddress);
  const explorerUrl = getExplorerAddressUrl(collection.contractAddress, activeChainId);

  const bestOfferEth = stats.bestOfferWei
    ? `${Number(formatUnits(BigInt(stats.bestOfferWei), 18)).toFixed(2)} ETH`
    : '--';

  const poolVal = Number(formatUnits(BigInt(stats.poolSizeWei || '0'), 18));
  const poolSizeEth = poolVal > 0
    ? `${poolVal.toFixed(2)} ETH`
    : (stats.salesVolumeEth ? `${stats.salesVolumeEth} ETH` : '0.00 ETH');

  const floorDisplay = stats.floorPriceEth ? `${stats.floorPriceEth} ETH` : '--';

  const handleCopy = () => {
    if (typeof navigator !== 'undefined') {
      navigator.clipboard.writeText(collection.contractAddress);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="space-y-4">
      {isDuplicateName && (
        <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-800 dark:text-amber-200 text-xs flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="font-bold text-amber-600 dark:text-amber-400 text-sm">⚠️</span>
            <span>
              <strong>Duplicate Name Warning:</strong> Multiple contracts share the name &ldquo;{collection.name}&rdquo;. Verify the contract address ({truncatedAddress}) on explorer before committing capital.
            </span>
          </div>
          <a
            href={explorerUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[11px] font-mono underline decoration-dotted text-amber-900 dark:text-amber-100 hover:text-[var(--accent-primary)] shrink-0"
          >
            Verify on Blockscout ↗
          </a>
        </div>
      )}

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 p-6 rounded-2xl border border-[var(--line)] bg-[var(--panel)] shadow-[var(--shadow-subtle)]">
        <div className="flex items-start sm:items-center gap-4">
          <div className="relative w-16 h-16 rounded-xl overflow-hidden border border-[var(--line)] bg-[var(--raised)] shrink-0 flex items-center justify-center font-mono font-bold text-lg text-[var(--accent-primary)]">
            {displayImage ? (
              <Image
                src={displayImage}
                alt={collection.name}
                fill
                sizes="64px"
                className="object-cover"
                unoptimized
                onError={() => setImgError(true)}
              />
            ) : (
              collection.symbol.slice(0, 3)
            )}
          </div>

          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2.5">
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[var(--text)]">
                {collection.name}
              </h1>
              <span className="px-2 py-0.5 rounded-md bg-[var(--raised)] border border-[var(--line)] text-[11px] font-mono font-semibold text-[var(--muted)]">
                {collection.symbol}
              </span>
              <Badge status="active">Verified ERC-721</Badge>
            </div>

            <div className="flex flex-wrap items-center gap-3 text-xs text-[var(--muted)] font-mono">
              <div className="flex items-center gap-1.5">
                <a
                  href={explorerUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="View on Blockscout"
                  className="hover:text-[var(--primary)] underline decoration-dotted transition-colors"
                >
                  {collection.contractAddress}
                </a>
                <button
                  type="button"
                  onClick={handleCopy}
                  className="p-1 hover:text-[var(--text)] transition-colors cursor-pointer"
                  title="Copy contract address"
                  aria-label="Copy contract address"
                >
                  {copied ? (
                    <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold">Copied!</span>
                  ) : (
                    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                    </svg>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <a
            href={explorerUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full sm:w-auto"
          >
            <Button variant="secondary" size="sm" className="w-full sm:w-auto">
              Blockscout Explorer ↗
            </Button>
          </a>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="p-4 rounded-xl border border-[var(--line)] bg-[var(--surface)] space-y-1">
          <span className="text-[9px] uppercase font-mono tracking-[1.5px] text-[var(--muted)] block">
            Floor Price
          </span>
          <span className="text-base font-bold font-mono text-[var(--text)]">
            {floorDisplay}
          </span>
        </div>

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
            Pool Liquidity
          </span>
          <span className="text-base font-bold font-mono text-emerald-600 dark:text-emerald-400">
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
            Active Wallets
          </span>
          <span className="text-base font-bold font-mono text-[var(--text)]">
            {stats.activeWalletsCount || stats.activeLoansCount || 0}
          </span>
        </div>
      </div>
    </div>
  );
}
