import React, { useState } from 'react';
import Image from 'next/image';
import { formatUnits } from 'viem';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { getExplorerAddressUrl } from '@/config/chains';
import { useSafeChainId } from '@/hooks/useSafeChainId';
import { resolveCollectionImageUrl } from '@/lib/services/metadata';
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
  imageUrl?: string;
  chainId?: number;
}

export function CollectionHeader({
  collection,
  stats,
  imageUrl,
  chainId,
}: CollectionHeaderProps) {
  const safeChainId = useSafeChainId();
  const activeChainId = chainId ?? safeChainId;
  const [copied, setCopied] = useState(false);
  const displayImage = imageUrl || resolveCollectionImageUrl(collection.name || collection.symbol);

  const truncatedAddress = `${collection.contractAddress.slice(0, 6)}...${collection.contractAddress.slice(-4)}`;
  const explorerUrl = getExplorerAddressUrl(collection.contractAddress, activeChainId);

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
          <div className="relative w-16 h-16 rounded-xl overflow-hidden border border-[var(--line)] bg-[var(--raised)] shrink-0 flex items-center justify-center font-mono font-bold text-lg text-[var(--accent-primary)]">
            {displayImage ? (
              <Image
                src={displayImage}
                alt={collection.name}
                fill
                sizes="64px"
                className="object-cover"
                unoptimized
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
              <Badge status="active">Verified</Badge>
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
                  {truncatedAddress}
                </a>
                <button
                  type="button"
                  onClick={handleCopy}
                  className="p-1 hover:text-[var(--text)] transition-colors cursor-pointer"
                  title="Copy address"
                  aria-label="Copy address"
                >
                  {copied ? (
                    <svg className="w-3.5 h-3.5 text-[var(--accent-primary)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
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
              Explorer ↗
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
            Contract
          </span>
          <span className="text-base font-bold font-mono text-[var(--text)]">
            {collection.contractAddress.slice(0, 6)}...{collection.contractAddress.slice(-4)}
          </span>
        </div>
      </div>
    </div>
  );
}
