'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { formatUnits } from 'viem';
import { NftImage } from '@/components/nft/NftImage';
import { formatShortAddress } from '@/lib/services/collectionSafety';
import { getActiveChain } from '@/config/chains';
import { useSafeChainId } from '@/hooks/useSafeChainId';
import { useWatchlist } from '@/hooks/useWatchlist';
import type { ExploreCollectionItem } from '@/types/api';

export interface ExploreCardProps {
  collection: ExploreCollectionItem;
}

export function ExploreCard({ collection }: ExploreCardProps) {
  const [copied, setCopied] = useState(false);
  const chainId = useSafeChainId();
  const { isWatchlisted, toggleWatchlist } = useWatchlist();
  const isStarred = isWatchlisted(collection.address);
  const chain = getActiveChain(chainId);
  const explorerUrl = chain.blockExplorers?.default.url;
  const blockscoutTokenUrl = explorerUrl
    ? `${explorerUrl}/token/${collection.address}`
    : `https://explorer.testnet.chain.robinhood.com/token/${collection.address}`;

  const handleCopy = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    navigator.clipboard.writeText(collection.address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const poolSizeEth = collection.poolSizeWei && collection.poolSizeWei !== '0'
    ? Number(formatUnits(BigInt(collection.poolSizeWei), 18)).toFixed(2)
    : (collection.salesVolumeEth || '0.00');

  const bestOfferEth = collection.bestOfferWei
    ? Number(formatUnits(BigInt(collection.bestOfferWei), 18)).toFixed(2)
    : null;

  const floorEth = collection.floorPriceEth ? `${collection.floorPriceEth} ETH` : '—';
  const hasChange = collection.priceChange24hPct !== undefined;
  const changePct = collection.priceChange24hPct ?? 0;
  const isPositive = changePct >= 0;

  return (
    <div
      data-testid="explore-card"
      className="group relative flex flex-col justify-between rounded-xl bg-[var(--surface)] border border-[var(--line)] hover:border-[var(--line-strong)] card-hover-lift shadow-2xs overflow-hidden"
    >
      <Link
        href={`/collection/${collection.address}`}
        className="p-4 space-y-3.5 block flex-1 cursor-pointer group/card"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-12 h-12 rounded-lg overflow-hidden bg-[var(--raised)] border border-[var(--line)] shrink-0 relative flex items-center justify-center font-mono font-bold text-xs text-[var(--accent-primary)]">
              <NftImage
                src={collection.imageUrl}
                alt={collection.name}
                contractAddress={collection.address}
                symbol={collection.symbol || collection.name}
                tokenId=""
                className="w-full h-full object-cover group-hover/card:scale-105 transition-transform duration-300"
              />
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <span
                  className="text-sm font-semibold text-[var(--text)] group-hover/card:text-[var(--accent-primary)] transition-colors truncate block"
                  title={collection.name}
                >
                  {collection.name}
                </span>
                {collection.isVerifiedErc721 && (
                  <span
                    title="Verified ERC-721 Interface"
                    className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 shrink-0"
                  >
                    <svg className="w-2.5 h-2.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2 mt-0.5 text-xs text-[var(--muted)] font-mono">
                <span className="font-semibold uppercase">{collection.symbol}</span>
                <span>•</span>
                <button
                  type="button"
                  onClick={handleCopy}
                  title="Copy contract address"
                  className="hover:text-[var(--text)] underline decoration-dotted transition-colors flex items-center gap-1 cursor-pointer"
                >
                  <span>{formatShortAddress(collection.address)}</span>
                  {copied ? (
                    <svg className="w-3 h-3 text-emerald-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  ) : (
                    <svg className="w-3 h-3 text-[var(--muted)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                    </svg>
                  )}
                </button>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                toggleWatchlist(collection.address);
              }}
              aria-label={isStarred ? 'Remove from watchlist' : 'Add to watchlist'}
              className={`p-1.5 rounded-lg border border-[var(--line)] bg-[var(--surface)] hover:bg-[var(--line)] transition-colors cursor-pointer ${
                isStarred ? 'text-amber-500' : 'text-[var(--muted)] hover:text-amber-500'
              }`}
            >
              <svg className="w-3.5 h-3.5" fill={isStarred ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
              </svg>
            </button>
            {collection.offerCount > 0 ? (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                {collection.offerCount} Offer{collection.offerCount === 1 ? '' : 's'}
              </span>
            ) : (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-[var(--panel)] text-[var(--muted)] border border-[var(--line)]">
                Open Market
              </span>
            )}
          </div>
        </div>

        {collection.isDuplicateName && (
          <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-800 dark:text-amber-300 text-[11px] flex items-center gap-1.5">
            <svg className="w-3.5 h-3.5 text-amber-500 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
              <line x1="12" y1="9" x2="12" y2="13" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
            <span className="truncate">Verify contract address to avoid name spoofing.</span>
          </div>
        )}

        <div className="grid grid-cols-2 gap-2.5 pt-2 border-t border-[var(--line)] text-xs">
          <div>
            <span className="text-[10px] uppercase font-mono text-[var(--muted)] block">Floor Price</span>
            <div className="flex items-center gap-1">
              <span className="font-mono font-semibold text-[var(--text)]">
                {floorEth}
              </span>
              {hasChange && (
                <span className={`font-mono text-[10px] font-semibold ${isPositive ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                  {isPositive ? '+' : ''}{changePct.toFixed(1)}%
                </span>
              )}
            </div>
          </div>

          <div>
            <span className="text-[10px] uppercase font-mono text-[var(--muted)] block">Best Offer</span>
            <span className="font-mono font-semibold text-sky-600 dark:text-sky-400">
              {bestOfferEth ? `${bestOfferEth} ETH` : '—'}
            </span>
          </div>

          <div>
            <span className="text-[10px] uppercase font-mono text-[var(--muted)] block">Pool Liquidity</span>
            <span className="font-mono font-semibold text-emerald-600 dark:text-emerald-400">
              {poolSizeEth !== '0.00' ? `${poolSizeEth} ETH` : '—'}
            </span>
          </div>

          <div>
            <span className="text-[10px] uppercase font-mono text-[var(--muted)] block">24H Status</span>
            <span className="font-mono font-medium text-[var(--muted)]">
              {collection.offerCount > 0 ? `${collection.offerCount} Active Offers` : 'Open Catalog'}
            </span>
          </div>
        </div>
      </Link>

      <div className="p-3 bg-[var(--panel)] border-t border-[var(--line)] flex items-center justify-between gap-2">
        <a
          href={blockscoutTokenUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-[var(--muted)] hover:text-[var(--text)] transition-colors flex items-center gap-1"
        >
          <span>Blockscout</span>
          <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M7 17L17 7M17 7H7M17 7V17" />
          </svg>
        </a>

        <div className="flex items-center gap-2">
          <Link
            href={`/borrow?collection=${collection.address}`}
            className="px-2.5 py-1 text-xs font-semibold rounded-md bg-sky-500/10 hover:bg-sky-500 hover:text-white text-sky-600 dark:text-sky-400 border border-sky-500/30 transition-colors"
          >
            Borrow
          </Link>
          <Link
            href={`/lend?collection=${collection.address}`}
            className="px-2.5 py-1 text-xs font-semibold rounded-md bg-emerald-500/10 hover:bg-emerald-500 hover:text-white text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 transition-colors flex items-center gap-1"
          >
            <span>Lend</span>
            <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 5v14M5 12h14" />
            </svg>
          </Link>
        </div>
      </div>
    </div>
  );
}
