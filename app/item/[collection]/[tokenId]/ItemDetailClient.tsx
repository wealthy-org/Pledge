'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { NftImage } from '@/components/nft/NftImage';
import { CountdownTimer } from '@/components/common/CountdownTimer';
import { Skeleton } from '@/components/ui/Skeleton';
import { Button } from '@/components/ui/Button';
import { formatShortAddress } from '@/lib/services/collectionSafety';
import { useSafeChainId } from '@/hooks/useSafeChainId';

export interface ItemDetailData {
  collection: string;
  tokenId: string;
  chainId: number;
  metadata: {
    name: string;
    description: string;
    imageUrl: string;
    attributes: Array<{ trait_type: string; value: string | number }>;
  };
  activeLoan: {
    loanId: number;
    offerId: number;
    principalWei: string;
    interestWei: string;
    dueAt: string;
    borrower: string;
    lender: string;
    status: string;
  } | null;
  bestOffer: {
    offerId: number;
    principalWei: string;
    termInterestBps: number;
    durationSeconds: string;
    expiresAt: string;
    lender: string;
  } | null;
  openOffersCount: number;
}

export function ItemDetailClient({
  collection,
  tokenId,
}: {
  collection: string;
  tokenId: string;
}) {
  const chainId = useSafeChainId();
  const [data, setData] = useState<ItemDetailData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchItem = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/items/${collection}/${tokenId}?chainId=${chainId}`);
      if (!res.ok) {
        throw new Error(`Failed to load token #${tokenId} (HTTP ${res.status})`);
      }
      const json = await res.json();
      setData(json);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error fetching item');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchItem();
  }, [collection, tokenId, chainId]);

  if (error) {
    return (
      <div className="w-full max-w-4xl mx-auto px-4 py-16 text-center space-y-4">
        <div className="w-12 h-12 rounded-full bg-red-500/10 text-red-500 flex items-center justify-center mx-auto">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-6 h-6">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
        </div>
        <h1 className="text-xl font-bold text-[var(--text)]">Token Not Found</h1>
        <p className="text-xs text-[var(--muted)]">{error}</p>
        <Button onClick={fetchItem} variant="secondary" size="sm">
          Retry
        </Button>
      </div>
    );
  }

  if (isLoading || !data) {
    return (
      <div className="w-full max-w-5xl mx-auto px-4 py-8 grid grid-cols-1 md:grid-cols-2 gap-8">
        <Skeleton width="100%" height="450px" borderRadius="16px" />
        <div className="space-y-4">
          <Skeleton width="140px" height="20px" />
          <Skeleton width="80%" height="36px" />
          <Skeleton width="100%" height="100px" />
          <Skeleton width="100%" height="150px" />
        </div>
      </div>
    );
  }

  const { metadata, activeLoan, bestOffer, openOffersCount } = data;
  const bestPrincipalEth = bestOffer
    ? (Number(BigInt(bestOffer.principalWei)) / 1e18).toFixed(3)
    : null;
  const bestInterestPercent = bestOffer
    ? (bestOffer.termInterestBps / 100).toFixed(2)
    : null;
  const bestDurationDays = bestOffer
    ? Math.round(Number(bestOffer.durationSeconds) / 86400)
    : null;

  return (
    <div className="w-full max-w-5xl mx-auto px-4 py-8 space-y-8">
      <div className="flex items-center gap-2 text-xs text-[var(--muted)]">
        <Link href="/explore" className="hover:text-[var(--text)] transition-colors">
          Explore
        </Link>
        <span>/</span>
        <Link href={`/collection/${collection}`} className="hover:text-[var(--text)] transition-colors">
          {formatShortAddress(collection)}
        </Link>
        <span>/</span>
        <span className="text-[var(--text)] font-semibold">#{tokenId}</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
        <div className="md:col-span-5 space-y-4">
          <div className="w-full aspect-square rounded-2xl overflow-hidden bg-[var(--surface)] border border-[var(--line)] shadow-md">
            <NftImage
              contractAddress={collection}
              tokenId={tokenId}
              src={metadata.imageUrl}
              alt={metadata.name}
              className="w-full h-full object-cover"
              priority
            />
          </div>

          {metadata.attributes && metadata.attributes.length > 0 && (
            <div className="p-4 rounded-xl bg-[var(--surface)] border border-[var(--line)] space-y-3">
              <h2 className="text-xs font-bold uppercase tracking-wider text-[var(--muted)]">
                Traits & Attributes ({metadata.attributes.length})
              </h2>
              <div className="grid grid-cols-2 gap-2">
                {metadata.attributes.map((attr, idx) => (
                  <div
                    key={idx}
                    className="p-2.5 rounded-lg bg-[var(--panel)] border border-[var(--line)] space-y-0.5"
                  >
                    <div className="text-[10px] uppercase text-[var(--muted)] font-semibold truncate">
                      {attr.trait_type}
                    </div>
                    <div className="text-xs font-bold text-[var(--text)] truncate">
                      {String(attr.value)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="md:col-span-7 space-y-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full text-[11px] font-mono font-semibold bg-[var(--panel)] border border-[var(--line)] text-[var(--muted)]">
              ERC-721 · {formatShortAddress(collection)}
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[var(--text)] tracking-tight">
              {metadata.name || `Token #${tokenId}`}
            </h1>
            {metadata.description && (
              <p className="text-xs sm:text-sm text-[var(--muted)] leading-relaxed">
                {metadata.description}
              </p>
            )}
          </div>

          {activeLoan ? (
            <div className="p-5 rounded-xl border border-amber-500/30 bg-amber-500/10 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-ping" />
                  <span className="text-xs font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                    Currently Escrowed in Loan #{activeLoan.loanId}
                  </span>
                </div>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-amber-500/20 text-amber-700 dark:text-amber-300">
                  {activeLoan.status}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4 text-xs pt-2">
                <div>
                  <span className="text-[var(--muted)]">Principal Borrowed:</span>
                  <div className="font-mono font-bold text-[var(--text)] text-sm">
                    {(Number(BigInt(activeLoan.principalWei)) / 1e18).toFixed(3)} ETH
                  </div>
                </div>
                <div>
                  <span className="text-[var(--muted)]">Due Date / Countdown:</span>
                  <div className="pt-0.5">
                    <CountdownTimer dueAt={activeLoan.dueAt} />
                  </div>
                </div>
              </div>

              <Link
                href={`/loan/${activeLoan.loanId}`}
                className="block w-full py-2 text-center text-xs font-bold rounded-lg bg-amber-500 text-white hover:bg-amber-600 transition-colors shadow-xs"
              >
                View Active Loan Terms →
              </Link>
            </div>
          ) : (
            <div className="p-5 rounded-xl border border-[var(--line)] bg-[var(--surface)] space-y-4 shadow-xs">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs text-[var(--muted)]">Collateral Status</span>
                  <div className="text-sm font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    Available for Borrowing
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-xs text-[var(--muted)]">Open Offers</span>
                  <div className="text-sm font-mono font-bold text-[var(--text)]">
                    {openOffersCount} Active
                  </div>
                </div>
              </div>

              {bestOffer && bestPrincipalEth ? (
                <div className="p-4 rounded-lg bg-[var(--panel)] border border-[var(--line)] space-y-3">
                  <div className="text-[11px] font-semibold text-[var(--muted)] uppercase tracking-wider">
                    Best Open Offer for this Collection
                  </div>
                  <div className="flex items-baseline justify-between">
                    <div className="text-2xl font-mono font-extrabold text-[var(--accent-primary)]">
                      {bestPrincipalEth} ETH
                    </div>
                    <div className="text-xs font-mono text-[var(--muted)]">
                      {bestInterestPercent}% for {bestDurationDays}d
                    </div>
                  </div>

                  <Link
                    href={`/borrow`}
                    className="block w-full py-2.5 text-center text-xs font-bold rounded-lg bg-[var(--lime)] hover:bg-[#076b4d] text-white transition-colors shadow-xs"
                  >
                    Borrow Against this NFT ↗
                  </Link>
                </div>
              ) : (
                <div className="p-4 rounded-lg bg-[var(--panel)] border border-dashed border-[var(--line)] text-center space-y-2">
                  <p className="text-xs text-[var(--muted)]">
                    No active collection offers right now.
                  </p>
                  <Link
                    href={`/lend`}
                    className="inline-block px-4 py-1.5 text-xs font-semibold rounded-lg bg-[var(--panel)] border border-[var(--line)] text-[var(--text)] hover:bg-[var(--line)] transition-colors"
                  >
                    Create First Offer +
                  </Link>
                </div>
              )}
            </div>
          )}

          <div className="flex items-center gap-3">
            <Link
              href={`/collection/${collection}`}
              className="flex-1 py-2.5 text-center text-xs font-semibold rounded-lg bg-[var(--surface)] border border-[var(--line)] text-[var(--text)] hover:bg-[var(--panel)] transition-colors"
            >
              View Full Collection Market
            </Link>
            <a
              href={`https://explorer.testnet.chain.robinhood.com/token/${collection}/instance/${tokenId}`}
              target="_blank"
              rel="noreferrer noopener"
              className="px-4 py-2.5 text-xs font-semibold rounded-lg bg-[var(--surface)] border border-[var(--line)] text-[var(--muted)] hover:text-[var(--text)] hover:bg-[var(--panel)] transition-colors inline-flex items-center gap-1.5"
            >
              <span>Explorer</span>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3.5 h-3.5">
                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6M15 3h6v6M10 14L21 3" />
              </svg>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
