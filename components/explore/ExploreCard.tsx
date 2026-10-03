'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { formatUnits } from 'viem';
import { NftImage } from '@/components/nft/NftImage';
import { formatShortAddress } from '@/lib/services/collectionSafety';
import { getActiveChain } from '@/config/chains';
import { useSafeChainId } from '@/hooks/useSafeChainId';
import type { ExploreCollectionItem } from '@/types/api';

export interface ExploreCardProps {
  collection: ExploreCollectionItem;
}

export function ExploreCard({ collection }: ExploreCardProps) {
  const [copied, setCopied] = useState(false);
  const chainId = useSafeChainId();
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

  const poolSizeEth = collection.poolSizeWei
    ? Number(formatUnits(BigInt(collection.poolSizeWei), 18)).toFixed(2)
    : '0.00';

  const bestOfferEth = collection.bestOfferWei
    ? Number(formatUnits(BigInt(collection.bestOfferWei), 18)).toFixed(2)
    : null;

  return (
    <div
      data-testid="explore-card"
      className="group relative flex flex-col justify-between rounded-xl bg-[var(--surface)] border border-[var(--line)] hover:border-[var(--line-strong)] hover:shadow-md transition-all duration-200 overflow-hidden"
    >
      <div className="p-4 space-y-3.5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-12 h-12 rounded-lg overflow-hidden bg-[var(--raised)] border border-[var(--line)] shrink-0 relative flex items-center justify-center font-mono font-bold text-xs text-[var(--accent-primary)]">
              <NftImage
                src={collection.imageUrl}
                alt={collection.name}
                contractAddress={collection.address}
                symbol={collection.symbol || collection.name}
                tokenId=""
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <Link
                  href={`/collection/${collection.address}`}
                  className="text-sm font-semibold text-[var(--text)] hover:text-[var(--accent-primary)] transition-colors truncate block"
                  title={collection.name}
                >
                  {collection.name}
                </Link>
                {collection.isVerifiedErc721 && (
                  <span
                    title="Verified ERC-721 Interface"
                    className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 shrink-0 text-[10px]"
                  >
                    ✓
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
                  <span className="text-[10px]">{copied ? '✓' : '⧉'}</span>
                </button>
              </div>
            </div>
          </div>

          <div className="shrink-0">
            {collection.offerCount > 0 ? (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                {collection.offerCount} Offer{collection.offerCount === 1 ? '' : 's'}
              </span>
            ) : (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-[var(--panel)] text-[var(--muted)] border border-[var(--line)]">
                No Offers
              </span>
            )}
          </div>
        </div>

        {collection.isDuplicateName && (
          <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-800 dark:text-amber-300 text-[11px] flex items-center gap-1.5">
            <span>⚠️</span>
            <span className="truncate">Periksa alamat kontrak untuk menghindari peniruan nama.</span>
          </div>
        )}

        <div className="grid grid-cols-2 gap-2 pt-2 border-t border-[var(--line)] text-xs">
          <div>
            <span className="text-[10px] uppercase font-mono text-[var(--muted)] block">Best Offer</span>
            <span className="font-mono font-semibold text-[var(--text)]">
              {bestOfferEth ? `${bestOfferEth} ETH` : '—'}
            </span>
          </div>

          <div>
            <span className="text-[10px] uppercase font-mono text-[var(--muted)] block">Pool Liquidity</span>
            <span className="font-mono font-semibold text-[var(--text)]">
              {poolSizeEth !== '0.00' ? `${poolSizeEth} ETH` : '—'}
            </span>
          </div>
        </div>
      </div>

      <div className="p-3 bg-[var(--panel)] border-t border-[var(--line)] flex items-center justify-between gap-2">
        <a
          href={blockscoutTokenUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-[var(--muted)] hover:text-[var(--text)] transition-colors flex items-center gap-1"
        >
          <span>Blockscout</span>
          <span className="text-[10px]">↗</span>
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
            className="px-2.5 py-1 text-xs font-semibold rounded-md bg-emerald-500/10 hover:bg-emerald-500 hover:text-white text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 transition-colors"
          >
            Lend +
          </Link>
        </div>
      </div>
    </div>
  );
}
