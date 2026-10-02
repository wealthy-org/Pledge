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
          <div className="relative w-16 h-16 rounded-xl overflow-hidden border border-[var(--line)] bg-[var(--raised)] shrink-0">
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
          {collection.socials?.website && (
            <a
              href={collection.socials.website}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Website"
              className="inline-flex items-center gap-1.5 p-2 rounded-lg bg-[var(--raised)] border border-[var(--line)] text-[var(--muted)] hover:text-[var(--text)] hover:border-[var(--line-strong)] transition-colors text-xs font-semibold"
            >
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <line x1="2" y1="12" x2="22" y2="12" />
                <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
              </svg>
              <span>Website</span>
            </a>
          )}
          {collection.socials?.twitter && (
            <a
              href={collection.socials.twitter}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Twitter"
              className="inline-flex items-center gap-1.5 p-2 rounded-lg bg-[var(--raised)] border border-[var(--line)] text-[var(--muted)] hover:text-[var(--text)] hover:border-[var(--line-strong)] transition-colors text-xs font-semibold"
            >
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
              </svg>
              <span>Twitter</span>
            </a>
          )}
          {collection.socials?.discord && (
            <a
              href={collection.socials.discord}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Discord"
              className="inline-flex items-center gap-1.5 p-2 rounded-lg bg-[var(--raised)] border border-[var(--line)] text-[var(--muted)] hover:text-[var(--text)] hover:border-[var(--line-strong)] transition-colors text-xs font-semibold"
            >
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994.021-.041.001-.09-.041-.106a13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.929 1.793 8.18 1.793 12.061 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.894.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.028zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
              </svg>
              <span>Discord</span>
            </a>
          )}
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
