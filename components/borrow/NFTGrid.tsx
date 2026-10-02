'use client';

import React from 'react';
import Image from 'next/image';
import { formatUnits } from 'viem';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Skeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';

export interface BorrowableNft {
  contractAddress: string;
  tokenId: string;
  collectionName: string;
  name: string;
  imageUrl: string;
  bestOfferWei?: string;
  offerCount: number;
  isInLoan?: boolean;
}

export interface NFTGridProps {
  nfts: BorrowableNft[];
  selectedNft: BorrowableNft | null;
  onSelectNft: (nft: BorrowableNft) => void;
  isLoading?: boolean;
}

export function NFTGrid({
  nfts,
  selectedNft,
  onSelectNft,
  isLoading = false,
}: NFTGridProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="overflow-hidden p-0 border border-[var(--line)]">
            <Skeleton width="100%" height="180px" borderRadius="0px" />
            <div className="p-4 space-y-2">
              <Skeleton width="120px" height="14px" />
              <Skeleton width="80px" height="12px" />
              <div className="pt-2 border-t border-[var(--line)] flex justify-between">
                <Skeleton width="60px" height="12px" />
                <Skeleton width="50px" height="12px" />
              </div>
            </div>
          </Card>
        ))}
      </div>
    );
  }

  if (nfts.length === 0) {
    return (
      <Card className="p-8 border border-[var(--line)]">
        <EmptyState
          title="No Eligible NFTs Found"
          description="Your connected wallet does not hold any NFTs from our curated collections, or all eligible NFTs are currently collateralized."
        />
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
      {nfts.map((nft) => {
        const isSelected =
          selectedNft?.contractAddress.toLowerCase() === nft.contractAddress.toLowerCase() &&
          selectedNft?.tokenId === nft.tokenId;

        const bestOfferEth =
          nft.bestOfferWei && BigInt(nft.bestOfferWei) > 0n
            ? `${Number(formatUnits(BigInt(nft.bestOfferWei), 18)).toFixed(2)} ETH`
            : 'No Offers';

        return (
          <div
            key={`${nft.contractAddress}-${nft.tokenId}`}
            data-testid={`nft-card-${nft.contractAddress}-${nft.tokenId}`}
            onClick={() => !nft.isInLoan && onSelectNft(nft)}
            className={`rounded-2xl border transition-all overflow-hidden flex flex-col justify-between ${
              nft.isInLoan
                ? 'opacity-60 bg-[var(--surface)] border-[var(--line)] cursor-not-allowed'
                : isSelected
                ? 'bg-[var(--primary-soft)] border-[var(--primary)] shadow-[var(--shadow-raised)] cursor-pointer ring-2 ring-[var(--primary)]'
                : 'bg-[var(--panel)] border-[var(--line)] hover:border-[var(--line-strong)] hover:shadow-[var(--shadow-subtle)] cursor-pointer'
            }`}
          >
            <div className="relative aspect-square w-full bg-[var(--raised)] overflow-hidden">
              <Image
                src={nft.imageUrl}
                alt={nft.name}
                fill
                sizes="(max-width: 768px) 100vw, 33vw"
                className="object-cover"
                unoptimized
              />
              <div className="absolute top-2.5 right-2.5">
                {nft.isInLoan ? (
                  <Badge status="overdue">In Loan</Badge>
                ) : (
                  <span className="px-2 py-0.5 rounded-full bg-black/60 backdrop-blur-xs text-white text-[10px] font-mono font-bold">
                    #{nft.tokenId}
                  </span>
                )}
              </div>
            </div>

            <div className="p-4 space-y-2">
              <div>
                <div className="text-[11px] font-mono text-[var(--muted)] truncate">
                  {nft.collectionName}
                </div>
                <div className="text-sm font-bold text-[var(--text)] truncate">
                  {nft.name}
                </div>
              </div>

              <div className="pt-2 border-t border-[var(--line)] flex items-center justify-between text-xs">
                <div>
                  <span className="text-[10px] uppercase font-mono text-[var(--muted)] block">
                    Best Offer
                  </span>
                  <span className="font-mono font-bold text-[var(--primary)]">
                    {bestOfferEth}
                  </span>
                </div>

                <div className="text-right">
                  <span className="text-[10px] uppercase font-mono text-[var(--muted)] block">
                    Open Offers
                  </span>
                  <span className="font-mono font-semibold text-[var(--text)]">
                    {nft.offerCount}
                  </span>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
